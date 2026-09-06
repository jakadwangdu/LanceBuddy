import { sha256, timingSafeEqual } from './crypto.js';

export function bearerToken(request) {
  const header = request.headers.get('Authorization') || '';
  const match = /^Bearer\s+(.+)$/i.exec(header.trim());
  return match ? match[1].trim() : null;
}

export async function authenticateMerchant(request, env) {
  const token = bearerToken(request);
  if (!token) return null;
  const hash = await sha256(token);
  return env.DB.prepare(
    `SELECT id, upi_id, display_name, logo_url, webhook_url, notification_email, api_key_prefix, created_at
       FROM merchants WHERE api_key_hash = ?`,
  )
    .bind(hash)
    .first();
}

export function isAdmin(request, env) {
  const token = bearerToken(request);
  if (!token || !env.ADMIN_TOKEN) return false;
  return timingSafeEqual(token, env.ADMIN_TOKEN);
}
