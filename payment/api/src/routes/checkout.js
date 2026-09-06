import { fail, json, readJson } from '../lib/http.js';
import { sha256, signPaymentLink, uuid } from '../lib/crypto.js';
import { buildPaymentUrl } from '../lib/upi.js';
import { optionalEmail } from '../lib/validate.js';

// Prices live on the server so a visitor cannot tamper with the amount.
export const PLANS = {
  premium_monthly: {
    amount: 499,
    label: 'LanceBuddy Premium - Monthly',
    note: 'Premium monthly',
    expiryMinutes: 30,
  },
  premium_annual: {
    amount: 4788,
    label: 'LanceBuddy Premium - Annual',
    note: 'Premium annual',
    expiryMinutes: 30,
  },
};

const MAX_PER_WINDOW = 5;
const WINDOW_MINUTES = 60;

function planOrderId(plan) {
  const stamp = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return 'LB-' + (plan === 'premium_annual' ? 'YR' : 'MO') + '-' + stamp + rand;
}

async function clientHash(request, env) {
  const ip = request.headers.get('CF-Connecting-IP') || request.headers.get('X-Forwarded-For') || 'unknown';
  return sha256(ip + '|' + (env.SIGNING_SECRET || 'checkout'));
}

// Auto-provision the default merchant from env vars.
// If CHECKOUT_MERCHANT_ID is empty but DEFAULT_UPI_ID is set,
// create a merchant on first use so the developer doesn't need
// to manually call POST /api/merchants.
async function ensureDefaultMerchant(env) {
  // If CHECKOUT_MERCHANT_ID is already set, just look it up.
  if (env.CHECKOUT_MERCHANT_ID) {
    return env.DB.prepare('SELECT id, upi_id FROM merchants WHERE id = ?')
      .bind(env.CHECKOUT_MERCHANT_ID)
      .first();
  }

  // No CHECKOUT_MERCHANT_ID and no DEFAULT_UPI_ID -> nothing we can do.
  if (!env.DEFAULT_UPI_ID) return null;

  // See if a default merchant was already auto-created.
  const existing = await env.DB.prepare('SELECT id, upi_id FROM merchants WHERE id = ?')
    .bind('default')
    .first();
  if (existing) return existing;

  // Auto-create the default merchant.
  const displayName = env.DEFAULT_DISPLAY_NAME || 'LanceBuddy';
  const notificationEmail = env.DEFAULT_NOTIFICATION_EMAIL || null;

  try {
    await env.DB.prepare(
      'INSERT INTO merchants (id, upi_id, display_name, notification_email, api_key_hash, api_key_prefix) VALUES (?, ?, ?, ?, ?, ?)'
    ).bind('default', env.DEFAULT_UPI_ID, displayName, notificationEmail, 'auto', 'default_').run();
  } catch (e) {
    // Another concurrent request may have created it - try again.
    return env.DB.prepare('SELECT id, upi_id FROM merchants WHERE id = ?').bind('default').first();
  }

  return env.DB.prepare('SELECT id, upi_id FROM merchants WHERE id = ?').bind('default').first();
}

// GET /api/plans - public price list, keeps the marketing page in sync with billing
export function listPlans(request, env, cors) {
  return json(
    {
      success: true,
      currency: 'INR',
      plans: Object.entries(PLANS).map(([id, p]) => ({ id, amount: p.amount, label: p.label })),
    },
    200,
    cors,
  );
}

// POST /api/checkout - public: creates an order for a fixed plan and returns a signed payment URL
export async function createCheckout(request, env, cors) {
  const merchant = await ensureDefaultMerchant(env);
  if (!merchant) {
    return fail(503, 'checkout_disabled', 'Online checkout is not configured yet. Please contact support.', cors);
  }

  const body = await readJson(request);
  if (!body) return fail(400, 'invalid_body', 'Request body must be JSON.', cors);

  const planId = String(body.plan || '').trim();
  const plan = PLANS[planId];
  if (!plan) {
    return fail(400, 'unknown_plan', 'Choose a valid plan to continue.', cors);
  }

  const customerEmail = optionalEmail(body.customerEmail);

  const hash = await clientHash(request, env);
  const since = new Date(Date.now() - WINDOW_MINUTES * 60000).toISOString().replace(/\.\d{3}Z$/, 'Z');
  const recent = await env.DB.prepare(
    "SELECT COUNT(*) AS n FROM orders WHERE client_hash = ? AND created_at > ? AND status = 'CREATED'",
  )
    .bind(hash, since)
    .first();

  if (recent && recent.n >= MAX_PER_WINDOW) {
    return fail(429, 'rate_limited', 'Too many checkout attempts. Please try again in an hour.', cors);
  }

  const orderId = planOrderId(planId);
  const expiresAt = new Date(Date.now() + plan.expiryMinutes * 60000).toISOString().replace(/\.\d{3}Z$/, 'Z');
  const note = customerEmail ? plan.note + ' - ' + customerEmail : plan.note;

  await env.DB.prepare(
    'INSERT INTO orders (id, merchant_id, amount, note, status, expires_at, client_hash) VALUES (?, ?, ?, ?, ?, ?, ?)',
  )
    .bind(orderId, merchant.id, plan.amount, note, 'CREATED', expiresAt, hash)
    .run();

  const signature = env.SIGNING_SECRET
    ? await signPaymentLink(env.SIGNING_SECRET, {
        upiId: merchant.upi_id,
        amount: plan.amount,
        orderId,
        expiry: expiresAt,
      })
    : null;

  return json(
    {
      success: true,
      orderId,
      plan: planId,
      amount: plan.amount,
      currency: 'INR',
      expiresAt,
      paymentUrl: buildPaymentUrl(env.PUBLIC_BASE_URL || 'https://www.lancebuddy.in/payment', {
        orderId,
        signature,
      }),
    },
    201,
    cors,
  );
}
