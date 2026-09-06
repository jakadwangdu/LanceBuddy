export function buildUpiDeepLink({ upiId, payeeName, amount, note, orderId }) {
  const params = new URLSearchParams();
  params.set('pa', upiId);
  if (payeeName) params.set('pn', payeeName);
  params.set('am', Number(amount).toFixed(2));
  if (note) params.set('tn', note);
  params.set('cu', 'INR');
  if (orderId) params.set('tr', orderId);
  return `upi://pay?${params.toString()}`;
}

export function buildPaymentUrl(baseUrl, { orderId, signature }) {
  const url = new URL(baseUrl.replace(/\/$/, '') + '/');
  url.searchParams.set('orderId', orderId);
  if (signature) url.searchParams.set('sig', signature);
  return url.toString();
}
