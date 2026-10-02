import { onRequestPost as createOrderPost, onRequestOptions as createOrderOptions } from './functions/api/cashfree/create-order.js';
import { onRequestPost as verifyOrderPost, onRequestOptions as verifyOrderOptions } from './functions/api/cashfree/verify-order.js';

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // 1. Cashfree Create Order route
    if (url.pathname === '/api/cashfree/create-order') {
      if (request.method === 'OPTIONS') {
        return createOrderOptions();
      }
      if (request.method === 'POST') {
        return createOrderPost({
          request,
          env,
          params: {},
          waitUntil: ctx.waitUntil ? ctx.waitUntil.bind(ctx) : () => {}
        });
      }
      return new Response('Method not allowed', { status: 405 });
    }

    // 2. Cashfree Verify Order route
    if (url.pathname === '/api/cashfree/verify-order') {
      if (request.method === 'OPTIONS') {
        return verifyOrderOptions();
      }
      if (request.method === 'POST') {
        return verifyOrderPost({
          request,
          env,
          params: {},
          waitUntil: ctx.waitUntil ? ctx.waitUntil.bind(ctx) : () => {}
        });
      }
      return new Response('Method not allowed', { status: 405 });
    }

    // 3. Serve Vite SPA static assets from dist/
    if (env.ASSETS) {
      return env.ASSETS.fetch(request);
    }

    return new Response('Not found', { status: 404 });
  }
};
