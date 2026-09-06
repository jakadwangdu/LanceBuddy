import { corsHeaders, fail, json } from './lib/http.js';
import { ValidationError } from './lib/validate.js';
import { createMerchant, getMerchant, rotateApiKey, updateMerchant } from './routes/merchants.js';
import { createOrder, getPublicOrder, listOrders } from './routes/orders.js';
import { confirmPayment, getStatus, submitUtr } from './routes/payments.js';
import { createCheckout, listPlans } from './routes/checkout.js';

const ROUTES = [
  ['GET', '/api/health', (req, env, ctx, cors) => json({ success: true, service: 'lancebuddy-upi-api', version: '1.0.0' }, 200, cors)],
  ['POST', '/api/merchants', (req, env, ctx, cors) => createMerchant(req, env, cors)],
  ['GET', '/api/merchant', (req, env, ctx, cors) => getMerchant(req, env, cors)],
  ['PATCH', '/api/merchant', (req, env, ctx, cors) => updateMerchant(req, env, cors)],
  ['POST', '/api/merchant/rotate-key', (req, env, ctx, cors) => rotateApiKey(req, env, cors)],
  ['POST', '/api/orders', (req, env, ctx, cors) => createOrder(req, env, cors)],
  ['GET', '/api/orders', (req, env, ctx, cors) => listOrders(req, env, cors)],
  ['GET', '/api/order', (req, env, ctx, cors) => getPublicOrder(req, env, cors)],
  ['GET', '/api/plans', (req, env, ctx, cors) => listPlans(req, env, cors)],
  ['POST', '/api/checkout', (req, env, ctx, cors) => createCheckout(req, env, cors)],
  ['POST', '/api/verify', (req, env, ctx, cors) => submitUtr(req, env, ctx, cors)],
  ['POST', '/api/confirm', (req, env, ctx, cors) => confirmPayment(req, env, ctx, cors)],
  ['GET', '/api/status', (req, env, ctx, cors) => getStatus(req, env, cors)],
];

export default {
  async fetch(request, env, ctx) {
    const cors = corsHeaders(request, env);

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: cors });
    }

    const { pathname } = new URL(request.url);
    const path = pathname.replace(/\/+$/, '') || '/';

    const match = ROUTES.find(([method, route]) => route === path && method === request.method);
    if (!match) {
      const pathExists = ROUTES.some(([, route]) => route === path);
      return pathExists
        ? fail(405, 'method_not_allowed', `${request.method} is not supported on ${path}.`, cors)
        : fail(404, 'not_found', `No route matches ${path}.`, cors);
    }

    try {
      return await match[2](request, env, ctx, cors);
    } catch (error) {
      if (error instanceof ValidationError) {
        return json({ success: false, error: 'validation_error', field: error.field, message: error.message }, 400, cors);
      }
      console.error('Unhandled error:', error && error.stack ? error.stack : error);
      return fail(500, 'internal_error', 'Something went wrong. Please try again.', cors);
    }
  },
};
