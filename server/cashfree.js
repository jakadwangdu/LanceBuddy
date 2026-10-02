/**
 * Local development middleware for Cashfree API
 * Emulates Cloudflare Pages Functions during `npm run dev`
 */

import { authenticateFirebaseUser } from '../functions/api/_firebaseAuth.js';
import { getServiceAccountConfig, checkOrderRedeemed, activateSubscriptionServerSide } from '../functions/api/_firestoreAdmin.js';

export function cashfreeDevPlugin() {
  return {
    name: 'lancebuddy-cashfree-dev',
    configureServer(server) {
      // 1. POST /api/cashfree/create-order
      server.middlewares.use('/api/cashfree/create-order', (req, res) => {
        if (req.method !== 'POST') {
          res.statusCode = 405;
          return res.end(JSON.stringify({ success: false, error: 'Method not allowed' }));
        }

        let body = '';
        req.on('data', chunk => { body += chunk; });
        req.on('end', async () => {
          try {
            const appId = (process.env.CASHFREE_APP_ID || '').trim();
            const secretKey = (process.env.CASHFREE_SECRET_KEY || '').trim();
            const environment = (process.env.CASHFREE_ENV || 'production').trim().toLowerCase();

            if (!appId || !secretKey) {
              res.statusCode = 500;
              res.setHeader('Content-Type', 'application/json');
              return res.end(JSON.stringify({
                success: false,
                error: 'Cashfree credentials not configured in local .env'
              }));
            }

            const parsedBody = JSON.parse(body || '{}');

            // 1. Authenticate user cryptographically via Firebase ID Token
            let verifiedUser;
            try {
              const projectId = (process.env.FIREBASE_PROJECT_ID || process.env.VITE_FIREBASE_PROJECT_ID || '').trim();
              verifiedUser = await authenticateFirebaseUser(req, parsedBody, projectId || undefined);
            } catch (authErr) {
              res.statusCode = 401;
              res.setHeader('Content-Type', 'application/json');
              return res.end(JSON.stringify({
                success: false,
                error: `Authentication failed: ${authErr.message || 'Invalid or expired session'}`
              }));
            }

            const { amount, plan = 'quarterly', userPhone } = parsedBody;

            // 2. Validate authorized pricing to prevent client-side amount tampering (50 or 179 only)
            const numericAmount = Number(amount);
            const validAmounts = [50, 179];
            if (!validAmounts.includes(numericAmount)) {
              res.statusCode = 400;
              res.setHeader('Content-Type', 'application/json');
              return res.end(JSON.stringify({ success: false, error: 'Invalid plan amount.' }));
            }

            const cleanCustomerId = verifiedUser.uid.replace(/[^a-zA-Z0-9_-]/g, '_').substring(0, 50);

            const cleanEmail = (verifiedUser.email && verifiedUser.email.includes('@')) 
              ? verifiedUser.email.trim().substring(0, 80)
              : 'billing@lancebuddy.in';

            const cleanPhone = (userPhone || '9876543210')
              .replace(/\D/g, '')
              .padEnd(10, '0')
              .substring(0, 10);

            const orderId = `LB_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
            const returnUrl = `https://www.lancebuddy.in/checkout?order_id={order_id}`;

            const cfBaseUrl = environment === 'sandbox'
              ? 'https://sandbox.cashfree.com/pg'
              : 'https://api.cashfree.com/pg';

            const payload = {
              order_id: orderId,
              order_amount: numericAmount,
              order_currency: 'INR',
              customer_details: {
                customer_id: cleanCustomerId,
                customer_email: cleanEmail,
                customer_phone: cleanPhone
              },
              order_tags: {
                uid: cleanCustomerId,
                plan: plan === 'yearly' ? 'yearly' : 'quarterly'
              },
              order_meta: {
                return_url: returnUrl
              },
              order_note: `LanceBuddy Pro (${plan === 'yearly' ? '1 Year' : '3 Months'})`
            };

            const cfResponse = await fetch(`${cfBaseUrl}/orders`, {
              method: 'POST',
              headers: {
                'x-client-id': appId,
                'x-client-secret': secretKey,
                'x-api-version': '2023-08-01',
                'Content-Type': 'application/json'
              },
              body: JSON.stringify(payload)
            });

            const cfData = await cfResponse.json();

            res.setHeader('Content-Type', 'application/json');
            if (!cfResponse.ok || !cfData.payment_session_id) {
              res.statusCode = cfResponse.status || 500;
              return res.end(JSON.stringify({
                success: false,
                error: cfData.message || 'Unable to create Cashfree order.'
              }));
            }

            res.statusCode = 200;
            res.end(JSON.stringify({
              success: true,
              payment_session_id: cfData.payment_session_id,
              order_id: cfData.order_id,
              order_amount: cfData.order_amount,
              environment
            }));
          } catch (err) {
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ success: false, error: err.message }));
          }
        });
      });

      // 2. POST /api/cashfree/verify-order
      server.middlewares.use('/api/cashfree/verify-order', (req, res) => {
        if (req.method !== 'POST') {
          res.statusCode = 405;
          return res.end(JSON.stringify({ success: false, error: 'Method not allowed' }));
        }

        let body = '';
        req.on('data', chunk => { body += chunk; });
        req.on('end', async () => {
          try {
            const appId = (process.env.CASHFREE_APP_ID || '').trim();
            const secretKey = (process.env.CASHFREE_SECRET_KEY || '').trim();
            const environment = (process.env.CASHFREE_ENV || 'production').trim().toLowerCase();

            const parsedBody = JSON.parse(body || '{}');

            // 1. Authenticate user cryptographically via Firebase ID Token
            let verifiedUser;
            try {
              const projectId = (process.env.FIREBASE_PROJECT_ID || process.env.VITE_FIREBASE_PROJECT_ID || '').trim();
              verifiedUser = await authenticateFirebaseUser(req, parsedBody, projectId || undefined);
            } catch (authErr) {
              res.statusCode = 401;
              res.setHeader('Content-Type', 'application/json');
              return res.end(JSON.stringify({
                success: false,
                paid: false,
                error: `Authentication failed: ${authErr.message || 'Invalid or expired session'}`
              }));
            }

            const { orderId } = parsedBody;
            if (!orderId) {
              res.statusCode = 400;
              res.setHeader('Content-Type', 'application/json');
              return res.end(JSON.stringify({ success: false, error: 'Order ID is required.' }));
            }

            const cleanOrderId = orderId.trim();
            const cleanUserId = verifiedUser.uid.replace(/[^a-zA-Z0-9_-]/g, '_').substring(0, 50);

            const cfBaseUrl = environment === 'sandbox'
              ? 'https://sandbox.cashfree.com/pg'
              : 'https://api.cashfree.com/pg';

            const cfResponse = await fetch(`${cfBaseUrl}/orders/${encodeURIComponent(cleanOrderId)}`, {
              method: 'GET',
              headers: {
                'x-client-id': appId,
                'x-client-secret': secretKey,
                'x-api-version': '2023-08-01',
                'Content-Type': 'application/json'
              }
            });

            const cfData = await cfResponse.json();
            res.setHeader('Content-Type', 'application/json');

            if (!cfResponse.ok) {
              res.statusCode = cfResponse.status || 400;
              return res.end(JSON.stringify({
                success: false,
                paid: false,
                error: cfData.message || 'Verification failed.'
              }));
            }

            // 2. Strict Ownership Check: Order must belong to verified user
            const orderCustomerId = (cfData.customer_details?.customer_id || '').trim();
            const orderTagUid = (cfData.order_tags?.uid || '').trim();

            const isOwner = (orderCustomerId === cleanUserId) || (orderTagUid === cleanUserId);
            if (!isOwner) {
              res.statusCode = 403;
              return res.end(JSON.stringify({
                success: false,
                paid: false,
                error: 'Unauthorized: This payment order does not belong to your authenticated user account.'
              }));
            }

            // 3. Strict Payment Status Check
            const isPaid = cfData.order_status === 'PAID';
            if (!isPaid) {
              res.statusCode = 400;
              return res.end(JSON.stringify({
                success: false,
                paid: false,
                order_status: cfData.order_status,
                error: `Order has not been paid (Status: ${cfData.order_status}).`
              }));
            }

            // 4. Authoritative Plan & Duration derived strictly from verified amount
            const verifiedAmount = Number(cfData.order_amount);
            if (![50, 179].includes(verifiedAmount)) {
              res.statusCode = 400;
              return res.end(JSON.stringify({
                success: false,
                paid: false,
                error: `Payment amount ₹${verifiedAmount} does not match any valid plan tier.`
              }));
            }

            const durationMonths = verifiedAmount >= 170 ? 12 : 3;
            const planName = 'paid-premium-plan';

            // 5. Server-Authoritative Subscription Activation & Anti-Replay Idempotency
            const serviceAccount = getServiceAccountConfig(process.env);
            let activated = false;
            let premiumUntilIso = null;

            if (serviceAccount) {
              const redeemedCheck = await checkOrderRedeemed(serviceAccount, cleanOrderId);
              if (redeemedCheck.redeemed) {
                res.statusCode = 200;
                return res.end(JSON.stringify({
                  success: true,
                  paid: true,
                  already_redeemed: true,
                  order_id: cfData.order_id,
                  order_amount: verifiedAmount,
                  duration_months: durationMonths,
                  plan: planName,
                  customer_id: cleanUserId,
                  message: 'This Cashfree order has already been redeemed. Subscription remains active.'
                }));
              }

              const activation = await activateSubscriptionServerSide(serviceAccount, {
                orderId: cleanOrderId,
                userId: cleanUserId,
                userEmail: verifiedUser.email,
                amount: verifiedAmount,
                durationMonths
              });

              if (activation.alreadyRedeemed) {
                res.statusCode = 200;
                return res.end(JSON.stringify({
                  success: true,
                  paid: true,
                  already_redeemed: true,
                  order_id: cfData.order_id,
                  order_amount: verifiedAmount,
                  duration_months: durationMonths,
                  plan: planName,
                  customer_id: cleanUserId,
                  message: 'This Cashfree order has already been redeemed. Subscription remains active.'
                }));
              }

              activated = activation.activated;
              premiumUntilIso = activation.premiumUntil;
            }

            res.statusCode = 200;
            res.end(JSON.stringify({
              success: true,
              paid: true,
              activated,
              order_status: cfData.order_status,
              order_id: cfData.order_id,
              order_amount: verifiedAmount,
              order_currency: cfData.order_currency,
              duration_months: durationMonths,
              plan: planName,
              premium_until: premiumUntilIso,
              customer_id: cleanUserId
            }));
          } catch (err) {
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ success: false, error: err.message }));
          }
        });
      });
    }
  };
}
