/**
 * Cryptographic Firebase Auth ID Token Verifier
 * Compatible with Cloudflare Workers / Pages Functions & Node.js 18+
 * Uses native Web Crypto API (crypto.subtle) & Google Public JWKS.
 * Zero external dependencies.
 */

let cachedJwks = null;
let jwksCachedAt = 0;
const JWKS_CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

async function getGoogleJwks() {
  const now = Date.now();
  if (cachedJwks && (now - jwksCachedAt < JWKS_CACHE_TTL_MS)) {
    return cachedJwks;
  }

  const res = await fetch('https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com');
  if (!res.ok) {
    throw new Error('Failed to retrieve Google Identity public JWKS');
  }

  const data = await res.json();
  if (!data?.keys || !Array.isArray(data.keys)) {
    throw new Error('Invalid JWKS format received from Google');
  }

  cachedJwks = data.keys;
  jwksCachedAt = now;
  return cachedJwks;
}

function base64UrlDecode(str) {
  let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4) {
    base64 += '=';
  }
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new TextDecoder().decode(bytes);
}

/**
 * Verifies a Firebase ID token
 * @param {string} token - The raw Bearer JWT
 * @param {string} [expectedProjectId] - Optional Firebase Project ID to verify audience
 * @returns {Promise<{ uid: string, email: string, emailVerified: boolean }>}
 */
export async function verifyFirebaseToken(token, expectedProjectId) {
  if (!token || typeof token !== 'string') {
    throw new Error('Missing authentication token');
  }

  const parts = token.trim().split('.');
  if (parts.length !== 3) {
    throw new Error('Malformed JWT structure');
  }

  const [headerB64, payloadB64, sigB64] = parts;

  let header;
  let payload;
  try {
    header = JSON.parse(base64UrlDecode(headerB64));
    payload = JSON.parse(base64UrlDecode(payloadB64));
  } catch {
    throw new Error('Failed to parse JWT header or payload');
  }

  if (header.alg !== 'RS256' || !header.kid) {
    throw new Error('Token algorithm must be RS256 with a valid key ID (kid)');
  }

  // Verify expiration
  const nowSec = Math.floor(Date.now() / 1000);
  if (payload.exp && payload.exp < nowSec) {
    throw new Error('Authentication token has expired. Please refresh your session.');
  }

  // Verify Issuer & Audience
  if (expectedProjectId) {
    const expectedIss = `https://securetoken.google.com/${expectedProjectId}`;
    if (payload.iss !== expectedIss) {
      throw new Error('Token issuer does not match configured Firebase project');
    }
    if (payload.aud !== expectedProjectId) {
      throw new Error('Token audience does not match configured Firebase project');
    }
  } else if (!payload.iss || !payload.iss.startsWith('https://securetoken.google.com/')) {
    throw new Error('Invalid token issuer (must be https://securetoken.google.com/<projectId>)');
  }

  const uid = payload.user_id || payload.sub;
  if (!uid || typeof uid !== 'string' || uid.trim().length === 0) {
    throw new Error('Token does not contain a valid user UID');
  }

  // Verify cryptographic signature against Google's public JWKS
  const jwks = await getGoogleJwks();
  const jwk = jwks.find(k => k.kid === header.kid);
  if (!jwk) {
    throw new Error('Signing key ID not found in Google public keys');
  }

  const cryptoKey = await crypto.subtle.importKey(
    'jwk',
    jwk,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['verify']
  );

  let sigBase64 = sigB64.replace(/-/g, '+').replace(/_/g, '/');
  while (sigBase64.length % 4) {
    sigBase64 += '=';
  }
  const binarySig = atob(sigBase64);
  const sigBytes = new Uint8Array(binarySig.length);
  for (let i = 0; i < binarySig.length; i++) {
    sigBytes[i] = binarySig.charCodeAt(i);
  }

  const dataBytes = new TextEncoder().encode(`${headerB64}.${payloadB64}`);

  const isValid = await crypto.subtle.verify(
    'RSASSA-PKCS1-v1_5',
    cryptoKey,
    sigBytes,
    dataBytes
  );

  if (!isValid) {
    throw new Error('Cryptographic signature verification failed');
  }

  return {
    uid: uid.trim(),
    email: payload.email || '',
    emailVerified: Boolean(payload.email_verified)
  };
}

/**
 * Extracts and verifies Firebase token from request headers or body
 */
export async function authenticateFirebaseUser(request, body, projectId) {
  let token = null;

  // 1. Check Authorization header
  const authHeader = request.headers.get ? request.headers.get('Authorization') : request.headers['authorization'];
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7).trim();
  }

  // 2. Fallback to body.idToken
  if (!token && body?.idToken) {
    token = body.idToken.trim();
  }

  if (!token) {
    throw new Error('No authentication token provided in request');
  }

  return await verifyFirebaseToken(token, projectId);
}
