import { fail, json, readJson } from '../lib/http.js';
import { generateApiKey, sha256, uuid } from '../lib/crypto.js';
import { authenticateMerchant, isAdmin } from '../lib/auth.js';
import { ValidationError, cleanText, optionalEmail, optionalUrl, requireUpiId } from '../lib/validate.js';

function publicMerchant(merchant) {
  return {
    id: merchant.id,
    upiId: merchant.upi_id,
    displayName: merchant.display_name,
    logoUrl: merchant.logo_url,
    webhookUrl: merchant.webhook_url,
    notificationEmail: merchant.notification_email,
    apiKeyPrefix: merchant.api_key_prefix,
    currency: 'INR',
    createdAt: merchant.created_at,
  };
}

// POST /api/merchants  (admin bootstrap)
export async function createMerchant(request, env, cors) {
  if (!isAdmin(request, env)) {
    return fail(401, 'unauthorized', 'A valid admin token is required to create a merchant.', cors);
  }

  const body = await readJson(request);
  if (!body) return fail(400, 'invalid_body', 'Request body must be JSON.', cors);

  const upiId = requireUpiId(body.upiId);
  const displayName = cleanText(body.displayName, 80);
  const logoUrl = optionalUrl(body.logoUrl, 'logoUrl');
  const webhookUrl = optionalUrl(body.webhookUrl, 'webhookUrl');
  const notificationEmail = optionalEmail(body.notificationEmail);

  const id = uuid();
  const { key, prefix } = generateApiKey();

  await env.DB.prepare(
    `INSERT INTO merchants (id, upi_id, display_name, logo_url, webhook_url, notification_email, api_key_hash, api_key_prefix)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
  )
    .bind(id, upiId, displayName, logoUrl, webhookUrl, notificationEmail, await sha256(key), prefix)
    .run();

  const merchant = await env.DB.prepare('SELECT * FROM merchants WHERE id = ?').bind(id).first();
  return json(
    { success: true, merchant: publicMerchant(merchant), apiKey: key, notice: 'Store this API key now — it is never shown again.' },
    201,
    cors,
  );
}

// GET /api/merchant
export async function getMerchant(request, env, cors) {
  const merchant = await authenticateMerchant(request, env);
  if (!merchant) return fail(401, 'unauthorized', 'Invalid or missing API key.', cors);
  return json({ success: true, merchant: publicMerchant(merchant) }, 200, cors);
}

// PATCH /api/merchant
export async function updateMerchant(request, env, cors) {
  const merchant = await authenticateMerchant(request, env);
  if (!merchant) return fail(401, 'unauthorized', 'Invalid or missing API key.', cors);

  const body = await readJson(request);
  if (!body) return fail(400, 'invalid_body', 'Request body must be JSON.', cors);

  const next = {
    upi_id: body.upiId === undefined ? merchant.upi_id : requireUpiId(body.upiId),
    display_name: body.displayName === undefined ? merchant.display_name : cleanText(body.displayName, 80),
    logo_url: body.logoUrl === undefined ? merchant.logo_url : optionalUrl(body.logoUrl, 'logoUrl'),
    webhook_url: body.webhookUrl === undefined ? merchant.webhook_url : optionalUrl(body.webhookUrl, 'webhookUrl'),
    notification_email:
      body.notificationEmail === undefined ? merchant.notification_email : optionalEmail(body.notificationEmail),
  };

  await env.DB.prepare(
    `UPDATE merchants SET upi_id = ?, display_name = ?, logo_url = ?, webhook_url = ?, notification_email = ?
      WHERE id = ?`,
  )
    .bind(next.upi_id, next.display_name, next.logo_url, next.webhook_url, next.notification_email, merchant.id)
    .run();

  const updated = await env.DB.prepare('SELECT * FROM merchants WHERE id = ?').bind(merchant.id).first();
  return json({ success: true, merchant: publicMerchant(updated) }, 200, cors);
}

// POST /api/merchant/rotate-key
export async function rotateApiKey(request, env, cors) {
  const merchant = await authenticateMerchant(request, env);
  if (!merchant) return fail(401, 'unauthorized', 'Invalid or missing API key.', cors);

  const { key, prefix } = generateApiKey();
  await env.DB.prepare('UPDATE merchants SET api_key_hash = ?, api_key_prefix = ? WHERE id = ?')
    .bind(await sha256(key), prefix, merchant.id)
    .run();

  return json({ success: true, apiKey: key, apiKeyPrefix: prefix, notice: 'The previous key is now revoked.' }, 200, cors);
}

export { publicMerchant, ValidationError };
