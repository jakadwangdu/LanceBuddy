export const UPI_ID_RE = /^[a-zA-Z0-9.\-_]{2,64}@[a-zA-Z][a-zA-Z0-9.\-_]{1,64}$/;
export const UTR_RE = /^[0-9]{12}$/;
export const ORDER_ID_RE = /^[A-Za-z0-9][A-Za-z0-9_-]{2,63}$/;
export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export class ValidationError extends Error {
  constructor(field, message) {
    super(message);
    this.field = field;
  }
}

export function requireUpiId(value) {
  const upiId = String(value || '').trim();
  if (!UPI_ID_RE.test(upiId)) {
    throw new ValidationError('upiId', 'UPI ID must look like name@bank (e.g. merchant@okhdfcbank).');
  }
  return upiId;
}

export function requireUtr(value) {
  const utr = String(value || '').trim();
  if (!UTR_RE.test(utr)) {
    throw new ValidationError('utr', 'UTR must be exactly 12 digits, e.g. 407812345678.');
  }
  return utr;
}

export function requireOrderId(value) {
  const orderId = String(value || '').trim();
  if (!ORDER_ID_RE.test(orderId)) {
    throw new ValidationError('orderId', 'Order ID must be 3-64 characters: letters, numbers, hyphen or underscore.');
  }
  return orderId;
}

export function requireAmount(value) {
  const amount = Number(value);
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new ValidationError('amount', 'Amount must be a positive number in rupees.');
  }
  if (amount > 100000) {
    throw new ValidationError('amount', 'Amount cannot exceed the UPI per-transaction limit of ₹1,00,000.');
  }
  return Math.round(amount * 100) / 100;
}

export function optionalEmail(value) {
  const email = String(value || '').trim();
  if (!email) return null;
  if (!EMAIL_RE.test(email)) {
    throw new ValidationError('email', 'Enter a valid email address.');
  }
  return email.slice(0, 200);
}

export function optionalUrl(value, field = 'url') {
  const raw = String(value || '').trim();
  if (!raw) return null;
  let parsed;
  try {
    parsed = new URL(raw);
  } catch {
    throw new ValidationError(field, `${field} must be a valid absolute URL.`);
  }
  if (parsed.protocol !== 'https:') {
    throw new ValidationError(field, `${field} must use HTTPS.`);
  }
  return parsed.toString();
}

export function cleanText(value, max = 120) {
  return String(value ?? '')
    .replace(/[\u0000-\u001f\u007f]/g, '')
    .trim()
    .slice(0, max) || null;
}

export function nowIso() {
  return new Date().toISOString().replace(/\.\d{3}Z$/, 'Z');
}

export function isExpired(expiresAt) {
  if (!expiresAt) return false;
  return Date.parse(expiresAt) <= Date.now();
}
