const encoder = new TextEncoder();

function toHex(buffer) {
  return [...new Uint8Array(buffer)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

async function hmacKey(secret) {
  return crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
}

export async function hmacSha256(secret, message) {
  const key = await hmacKey(secret);
  return toHex(await crypto.subtle.sign('HMAC', key, encoder.encode(message)));
}

export async function sha256(message) {
  return toHex(await crypto.subtle.digest('SHA-256', encoder.encode(message)));
}

export function timingSafeEqual(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string' || a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

// signature = HMAC-SHA256(secret, `${upiId}|${amount}|${orderId}|${expiry}`)
export function signaturePayload({ upiId, amount, orderId, expiry }) {
  return [upiId, Number(amount).toFixed(2), orderId, expiry || ''].join('|');
}

export async function signPaymentLink(secret, params) {
  return hmacSha256(secret, signaturePayload(params));
}

export async function verifyPaymentSignature(secret, params, signature) {
  const expected = await signPaymentLink(secret, params);
  return timingSafeEqual(expected, String(signature || ''));
}

export function randomId(bytes = 16) {
  const buf = new Uint8Array(bytes);
  crypto.getRandomValues(buf);
  return toHex(buf.buffer);
}

export function uuid() {
  return crypto.randomUUID();
}

export function generateApiKey() {
  const secret = randomId(24);
  const key = `lb_live_${secret}`;
  return { key, prefix: key.slice(0, 12) };
}
