import { fail, json, readJson } from '../lib/http.js';
import { authenticateMerchant } from '../lib/auth.js';
import { uuid } from '../lib/crypto.js';
import { deliverWebhook, sendEmail, utrSubmittedEmail } from '../lib/notify.js';
import { loadOrder } from './orders.js';
import { cleanText, isExpired, nowIso, optionalEmail, requireOrderId, requireUtr } from '../lib/validate.js';

// POST /api/verify  (public — customer submits UTR)
export async function submitUtr(request, env, ctx, cors) {
  const body = await readJson(request);
  if (!body) return fail(400, 'invalid_body', 'Request body must be JSON.', cors);

  const orderId = requireOrderId(body.orderId);
  const utr = requireUtr(body.utr);
  const customerName = cleanText(body.customerName, 80);
  const customerEmail = optionalEmail(body.customerEmail);

  const order = await loadOrder(env, orderId);
  if (!order) return fail(404, 'order_not_found', 'No payment request found for this link.', cors);

  if (order.status === 'EXPIRED' || isExpired(order.expires_at)) {
    return fail(410, 'order_expired', 'This payment link has expired. Ask the merchant for a new one.', cors);
  }
  if (order.status === 'VERIFIED') {
    return json({ success: true, status: 'VERIFIED', message: 'This payment is already confirmed.' }, 200, cors);
  }
  if (order.status === 'PENDING') {
    return fail(409, 'already_submitted', 'A UTR was already submitted for this order and is awaiting review.', cors);
  }

  const utrClash = await env.DB.prepare('SELECT order_id FROM transactions WHERE utr = ?').bind(utr).first();
  if (utrClash) {
    return fail(409, 'duplicate_utr', 'This UTR has already been used for another order.', cors);
  }

  const submittedAt = nowIso();
  try {
    await env.DB.batch([
      env.DB.prepare(
        `INSERT INTO transactions (id, order_id, utr, customer_name, customer_email, submitted_at)
         VALUES (?, ?, ?, ?, ?, ?)`,
      ).bind(uuid(), orderId, utr, customerName, customerEmail, submittedAt),
      env.DB.prepare("UPDATE orders SET status = 'PENDING' WHERE id = ? AND status = 'CREATED'").bind(orderId),
    ]);
  } catch (error) {
    if (String(error).includes('UNIQUE')) {
      return fail(409, 'duplicate_utr', 'This UTR has already been submitted for this order.', cors);
    }
    throw error;
  }

  const apiBase = (env.API_BASE_URL || '').replace(/\/$/, '');
  const payload = {
    orderId,
    utr,
    amount: order.amount,
    currency: order.currency,
    customerName,
    customerEmail,
    submittedAt,
    status: 'PENDING',
    verifyUrl: `${apiBase}/api/confirm`,
  };

  const merchant = {
    id: order.merchant_id,
    webhook_url: order.webhook_url,
    notification_email: order.notification_email,
  };

  const notify = Promise.all([
    deliverWebhook(env, merchant, 'payment.submitted', payload),
    sendEmail(env, {
      to: order.notification_email,
      subject: `UTR submitted for ${orderId} — ₹${Number(order.amount).toFixed(2)}`,
      html: utrSubmittedEmail({
        orderId,
        utr,
        amount: order.amount,
        customerName,
        customerEmail,
        confirmUrl: `${env.PUBLIC_BASE_URL || 'https://www.lancebuddy.in/payment'}/dashboard.html`,
      }),
    }),
  ]).catch(() => {});

  if (ctx && typeof ctx.waitUntil === 'function') ctx.waitUntil(notify);

  return json(
    {
      success: true,
      status: 'PENDING',
      orderId,
      message: 'Payment submitted. Merchant will confirm shortly.',
    },
    200,
    cors,
  );
}

// POST /api/confirm  (merchant-authenticated approve/reject)
export async function confirmPayment(request, env, ctx, cors) {
  const merchant = await authenticateMerchant(request, env);
  if (!merchant) return fail(401, 'unauthorized', 'Invalid or missing API key.', cors);

  const body = await readJson(request);
  if (!body) return fail(400, 'invalid_body', 'Request body must be JSON.', cors);

  const orderId = requireOrderId(body.orderId);
  const action = String(body.action || '').toLowerCase();
  if (action !== 'approve' && action !== 'reject') {
    return fail(400, 'invalid_action', 'action must be either "approve" or "reject".', cors);
  }

  const order = await env.DB.prepare('SELECT * FROM orders WHERE id = ? AND merchant_id = ?')
    .bind(orderId, merchant.id)
    .first();
  if (!order) return fail(404, 'order_not_found', 'Order not found for this merchant.', cors);
  if (order.status !== 'PENDING') {
    return fail(409, 'not_pending', `Order is ${order.status}; only PENDING orders can be confirmed.`, cors);
  }

  const status = action === 'approve' ? 'VERIFIED' : 'REJECTED';
  const verifiedAt = nowIso();

  await env.DB.batch([
    env.DB.prepare('UPDATE orders SET status = ?, verified_at = ? WHERE id = ?').bind(status, verifiedAt, orderId),
    env.DB.prepare('UPDATE transactions SET verified_at = ? WHERE order_id = ?').bind(verifiedAt, orderId),
  ]);

  const tx = await env.DB.prepare('SELECT utr FROM transactions WHERE order_id = ?').bind(orderId).first();

  const notify = deliverWebhook(env, merchant, `payment.${action === 'approve' ? 'verified' : 'rejected'}`, {
    orderId,
    utr: tx ? tx.utr : null,
    amount: order.amount,
    currency: order.currency,
    status,
    verifiedAt,
  }).catch(() => {});

  if (ctx && typeof ctx.waitUntil === 'function') ctx.waitUntil(notify);

  return json({ success: true, status, orderId, verifiedAt }, 200, cors);
}

// GET /api/status?orderId=...  (public polling)
export async function getStatus(request, env, cors) {
  const url = new URL(request.url);
  const orderId = url.searchParams.get('orderId');
  if (!orderId) return fail(400, 'missing_order_id', 'orderId query parameter is required.', cors);

  const order = await loadOrder(env, orderId);
  if (!order) return fail(404, 'order_not_found', 'No payment request found for this link.', cors);

  return json(
    {
      orderId: order.id,
      status: order.status,
      amount: order.amount,
      currency: order.currency,
      expiresAt: order.expires_at,
      verifiedAt: order.verified_at,
    },
    200,
    cors,
  );
}
