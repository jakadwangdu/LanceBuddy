import { fail, json, readJson } from '../lib/http.js';
import { authenticateMerchant } from '../lib/auth.js';
import { signPaymentLink, verifyPaymentSignature } from '../lib/crypto.js';
import { buildPaymentUrl, buildUpiDeepLink } from '../lib/upi.js';
import {
  cleanText,
  isExpired,
  nowIso,
  requireAmount,
  requireOrderId,
} from '../lib/validate.js';

function generateOrderId() {
  const year = new Date().getUTCFullYear();
  const rand = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `ORD-${year}-${rand}`;
}

function expiryIso(minutes) {
  if (!minutes) return null;
  const mins = Number(minutes);
  if (!Number.isFinite(mins) || mins <= 0 || mins > 60 * 24 * 30) return null;
  return new Date(Date.now() + mins * 60000).toISOString().replace(/\.\d{3}Z$/, 'Z');
}

async function settleExpiry(env, order) {
  if (order.status === 'CREATED' && isExpired(order.expires_at)) {
    await env.DB.prepare("UPDATE orders SET status = 'EXPIRED' WHERE id = ? AND status = 'CREATED'")
      .bind(order.id)
      .run();
    return { ...order, status: 'EXPIRED' };
  }
  return order;
}

export async function loadOrder(env, orderId) {
  const order = await env.DB.prepare(
    `SELECT o.*, m.upi_id, m.display_name, m.logo_url, m.webhook_url, m.notification_email
       FROM orders o JOIN merchants m ON m.id = o.merchant_id
      WHERE o.id = ?`,
  )
    .bind(orderId)
    .first();
  if (!order) return null;
  return settleExpiry(env, order);
}

// POST /api/orders  (merchant-authenticated)
export async function createOrder(request, env, cors) {
  const merchant = await authenticateMerchant(request, env);
  if (!merchant) return fail(401, 'unauthorized', 'Invalid or missing API key.', cors);

  const body = await readJson(request);
  if (!body) return fail(400, 'invalid_body', 'Request body must be JSON.', cors);

  const amount = requireAmount(body.amount);
  const orderId = body.orderId ? requireOrderId(body.orderId) : generateOrderId();
  const note = cleanText(body.note, 100);
  const expiresAt = expiryIso(body.expiryMinutes);

  const existing = await env.DB.prepare('SELECT id FROM orders WHERE id = ?').bind(orderId).first();
  if (existing) {
    return fail(409, 'duplicate_order', `Order ID "${orderId}" already exists. Use a different one.`, cors);
  }

  await env.DB.prepare(
    'INSERT INTO orders (id, merchant_id, amount, note, status, expires_at) VALUES (?, ?, ?, ?, ?, ?)',
  )
    .bind(orderId, merchant.id, amount, note, 'CREATED', expiresAt)
    .run();

  const signature = env.SIGNING_SECRET
    ? await signPaymentLink(env.SIGNING_SECRET, {
        upiId: merchant.upi_id,
        amount,
        orderId,
        expiry: expiresAt || '',
      })
    : null;

  return json(
    {
      success: true,
      order: {
        orderId,
        amount,
        currency: 'INR',
        note,
        status: 'CREATED',
        expiresAt,
        createdAt: nowIso(),
      },
      signature,
      paymentUrl: buildPaymentUrl(env.PUBLIC_BASE_URL || 'https://www.lancebuddy.in/payment', {
        orderId,
        signature,
      }),
    },
    201,
    cors,
  );
}

// GET /api/orders  (merchant-authenticated list)
export async function listOrders(request, env, cors) {
  const merchant = await authenticateMerchant(request, env);
  if (!merchant) return fail(401, 'unauthorized', 'Invalid or missing API key.', cors);

  const url = new URL(request.url);
  const status = url.searchParams.get('status');
  const limit = Math.min(Number(url.searchParams.get('limit')) || 50, 200);

  const query = status
    ? env.DB.prepare(
        `SELECT o.*, t.utr, t.customer_name, t.customer_email, t.submitted_at
           FROM orders o LEFT JOIN transactions t ON t.order_id = o.id
          WHERE o.merchant_id = ? AND o.status = ?
          ORDER BY o.created_at DESC LIMIT ?`,
      ).bind(merchant.id, status, limit)
    : env.DB.prepare(
        `SELECT o.*, t.utr, t.customer_name, t.customer_email, t.submitted_at
           FROM orders o LEFT JOIN transactions t ON t.order_id = o.id
          WHERE o.merchant_id = ?
          ORDER BY o.created_at DESC LIMIT ?`,
      ).bind(merchant.id, limit);

  const { results = [] } = await query.all();

  const orders = results.map((row) => ({
    orderId: row.id,
    amount: row.amount,
    currency: row.currency,
    note: row.note,
    status: isExpired(row.expires_at) && row.status === 'CREATED' ? 'EXPIRED' : row.status,
    utr: row.utr || null,
    customerName: row.customer_name || null,
    customerEmail: row.customer_email || null,
    submittedAt: row.submitted_at || null,
    expiresAt: row.expires_at,
    verifiedAt: row.verified_at,
    createdAt: row.created_at,
  }));

  const stats = orders.reduce(
    (acc, o) => {
      acc.total += 1;
      acc[o.status.toLowerCase()] = (acc[o.status.toLowerCase()] || 0) + 1;
      if (o.status === 'VERIFIED') acc.verifiedAmount += o.amount;
      return acc;
    },
    { total: 0, verifiedAmount: 0 },
  );

  return json({ success: true, orders, stats }, 200, cors);
}

// GET /api/order?orderId=...&sig=...  (public — powers the payment page)
export async function getPublicOrder(request, env, cors) {
  const url = new URL(request.url);
  const orderId = url.searchParams.get('orderId');
  if (!orderId) return fail(400, 'missing_order_id', 'orderId query parameter is required.', cors);

  const order = await loadOrder(env, orderId);
  if (!order) return fail(404, 'order_not_found', 'No payment request found for this link.', cors);

  if (env.SIGNING_SECRET) {
    const sig = url.searchParams.get('sig');
    const valid = await verifyPaymentSignature(
      env.SIGNING_SECRET,
      { upiId: order.upi_id, amount: order.amount, orderId: order.id, expiry: order.expires_at || '' },
      sig,
    );
    if (!valid) {
      return fail(403, 'invalid_signature', 'This payment link has been altered and cannot be trusted.', cors);
    }
  }

  return json(
    {
      success: true,
      order: {
        orderId: order.id,
        amount: order.amount,
        currency: order.currency,
        note: order.note,
        status: order.status,
        expiresAt: order.expires_at,
        verifiedAt: order.verified_at,
      },
      merchant: {
        upiId: order.upi_id,
        displayName: order.display_name,
        logoUrl: order.logo_url,
      },
      upiDeepLink: buildUpiDeepLink({
        upiId: order.upi_id,
        payeeName: order.display_name,
        amount: order.amount,
        note: order.note,
        orderId: order.id,
      }),
    },
    200,
    cors,
  );
}
