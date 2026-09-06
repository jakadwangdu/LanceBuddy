import { hmacSha256, uuid } from './crypto.js';
import { nowIso } from './validate.js';

const RETRY_DELAYS_MS = [0, 2000, 8000];

export async function deliverWebhook(env, merchant, event, payload) {
  if (!merchant.webhook_url) return;

  const id = uuid();
  const body = JSON.stringify({ event, ...payload });
  const signature = env.SIGNING_SECRET ? await hmacSha256(env.SIGNING_SECRET, body) : null;

  await env.DB.prepare(
    `INSERT INTO webhook_deliveries (id, merchant_id, order_id, event, url, payload)
     VALUES (?, ?, ?, ?, ?, ?)`,
  )
    .bind(id, merchant.id, payload.orderId || null, event, merchant.webhook_url, body)
    .run();

  let attempts = 0;
  let statusCode = null;
  let lastError = null;

  for (const delay of RETRY_DELAYS_MS) {
    if (delay) await new Promise((resolve) => setTimeout(resolve, delay));
    attempts += 1;
    try {
      const response = await fetch(merchant.webhook_url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'LanceBuddy-Payments/1.0',
          'X-LanceBuddy-Event': event,
          'X-LanceBuddy-Delivery': id,
          ...(signature ? { 'X-LanceBuddy-Signature': `sha256=${signature}` } : {}),
        },
        body,
      });
      statusCode = response.status;
      if (response.ok) {
        await markDelivery(env, id, attempts, statusCode, 1, null);
        return;
      }
      lastError = `HTTP ${response.status}`;
    } catch (error) {
      lastError = String(error && error.message ? error.message : error).slice(0, 300);
    }
  }

  await markDelivery(env, id, attempts, statusCode, 0, lastError);
}

async function markDelivery(env, id, attempts, statusCode, delivered, lastError) {
  await env.DB.prepare(
    `UPDATE webhook_deliveries
        SET attempts = ?, status_code = ?, delivered = ?, last_error = ?, updated_at = ?
      WHERE id = ?`,
  )
    .bind(attempts, statusCode, delivered, lastError, nowIso(), id)
    .run();
}

export async function sendEmail(env, { to, subject, html }) {
  if (!env.RESEND_API_KEY || !to) return;
  try {
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: env.RESEND_FROM || 'LanceBuddy Payments <payments@lancebuddy.in>',
        to: [to],
        subject,
        html,
      }),
    });
  } catch {
    /* email is best-effort; never block the payment flow */
  }
}

export function utrSubmittedEmail({ orderId, utr, amount, customerName, customerEmail, confirmUrl }) {
  const rows = [
    ['Order ID', orderId],
    ['UTR', utr],
    ['Amount', `₹${Number(amount).toFixed(2)}`],
    ['Customer', customerName || '—'],
    ['Email', customerEmail || '—'],
  ]
    .map(
      ([label, value]) =>
        `<tr><td style="padding:8px 0;color:#64748b;font-size:13px;">${label}</td>
             <td style="padding:8px 0;font-size:14px;font-weight:600;text-align:right;">${value}</td></tr>`,
    )
    .join('');

  return `<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;max-width:560px;margin:0 auto;color:#0f172a;line-height:1.6;padding:24px;border:1px solid #e2e8f0;border-radius:14px;background:#fff;">
  <h2 style="margin:0 0 4px;font-size:19px;letter-spacing:-0.4px;">Payment submitted — action needed</h2>
  <p style="margin:0 0 18px;color:#64748b;font-size:14px;">A customer submitted a UTR. Cross-check it against your bank or UPI app, then approve or reject.</p>
  <table style="width:100%;border-collapse:collapse;border-top:1px solid #e2e8f0;">${rows}</table>
  <a href="${confirmUrl}" style="display:inline-block;margin-top:20px;padding:12px 20px;background:#0f172a;color:#fff;border-radius:10px;font-weight:700;font-size:14px;text-decoration:none;">Review in dashboard</a>
  <p style="margin:20px 0 0;color:#94a3b8;font-size:12px;">LanceBuddy Payments · Verify every UTR against your bank statement before fulfilling an order.</p>
</div>`;
}
