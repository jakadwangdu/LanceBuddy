import { onRequestPost as createOrderPost, onRequestOptions as createOrderOptions } from './functions/api/cashfree/create-order.js';
import { onRequestPost as verifyOrderPost, onRequestOptions as verifyOrderOptions } from './functions/api/cashfree/verify-order.js';
import { handleScoutRequest, onRequestOptions as scoutOptions } from './functions/api/scout.js';

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // Patch environment with fallback production App ID if not explicitly injected
    const patchedEnv = {
      ...(env || {}),
      CASHFREE_APP_ID: (env?.CASHFREE_APP_ID || '14508048da85d5fbb8055b003964080541').trim(),
      CASHFREE_ENV: (env?.CASHFREE_ENV || 'production').trim().toLowerCase(),
    };

    // Health / Diagnostics endpoint
    if (url.pathname === '/api/health') {
      return new Response(JSON.stringify({
        status: 'ok',
        envKeys: Object.keys(env || {}),
        hasAppId: Boolean(patchedEnv.CASHFREE_APP_ID),
        hasSecret: Boolean(env?.CASHFREE_SECRET_KEY),
        hasEnv: Boolean(patchedEnv.CASHFREE_ENV),
        hasServiceAccount: Boolean(env?.FIREBASE_SERVICE_ACCOUNT)
      }), {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }

    // 1. Scout Leads route (Server-side Nominatim + Overpass proxy)
    if (url.pathname === '/api/scout') {
      if (request.method === 'OPTIONS') {
        return scoutOptions();
      }
      return handleScoutRequest(request);
    }

    // 2. Cashfree Create Order route
    if (url.pathname === '/api/cashfree/create-order') {
      if (request.method === 'OPTIONS') {
        return createOrderOptions();
      }
      if (request.method === 'POST') {
        return createOrderPost({
          request,
          env: patchedEnv,
          params: {},
          waitUntil: ctx.waitUntil ? ctx.waitUntil.bind(ctx) : () => {}
        });
      }
      return new Response('Method not allowed', { status: 405 });
    }

    // 3. Cashfree Verify Order route
    if (url.pathname === '/api/cashfree/verify-order') {
      if (request.method === 'OPTIONS') {
        return verifyOrderOptions();
      }
      if (request.method === 'POST') {
        return verifyOrderPost({
          request,
          env: patchedEnv,
          params: {},
          waitUntil: ctx.waitUntil ? ctx.waitUntil.bind(ctx) : () => {}
        });
      }
      return new Response('Method not allowed', { status: 405 });
    }

    // 4. Serve Vite SPA static assets from dist/
    if (env.ASSETS) {
      return env.ASSETS.fetch(request);
    }

    return new Response('Not found', { status: 404 });
  }
};
