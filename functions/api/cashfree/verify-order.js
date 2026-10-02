/**
 * Cloudflare Pages Function: Verify Cashfree PG Order Status
 * Endpoint: POST /api/cashfree/verify-order
 * 
 * Verifies with Cashfree's servers whether an order was genuinely PAID.
 * Prevents client-side manipulation of subscription status.
 */

export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age': '86400'
    }
  });
}

import { authenticateFirebaseUser } from '../_firebaseAuth.js';
import { getServiceAccountConfig, checkOrderRedeemed, activateSubscriptionServerSide } from '../_firestoreAdmin.js';

export async function onRequestPost(context) {
  const { request, env } = context;

  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Content-Type': 'application/json'
  };

  try {
    const appId = (env.CASHFREE_APP_ID || '').trim();
    const secretKey = (env.CASHFREE_SECRET_KEY || '').trim();
    const environment = (env.CASHFREE_ENV || 'production').trim().toLowerCase();

    if (!appId || !secretKey) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Cashfree verification service is not configured with credentials.'
        }),
        { status: 500, headers: corsHeaders }
      );
    }

    let body = {};
    try {
      body = await request.json();
    } catch {
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid JSON request body.' }),
        { status: 400, headers: corsHeaders }
      );
    }

    // 1. Authenticate user cryptographically via Firebase ID Token
    let verifiedUser;
    try {
      const firebaseProjectId = (env.FIREBASE_PROJECT_ID || env.VITE_FIREBASE_PROJECT_ID || '').trim();
      verifiedUser = await authenticateFirebaseUser(request, body, firebaseProjectId || undefined);
    } catch (authErr) {
      return new Response(
        JSON.stringify({
          success: false,
          paid: false,
          error: `Authentication failed: ${authErr.message || 'Invalid or expired session'}`
        }),
        { status: 401, headers: corsHeaders }
      );
    }

    const { orderId } = body;
    if (!orderId || typeof orderId !== 'string') {
      return new Response(
        JSON.stringify({ success: false, error: 'Order ID is required for verification.' }),
        { status: 400, headers: corsHeaders }
      );
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

    if (!cfResponse.ok) {
      console.error('Cashfree order fetch error:', cfData.message || 'Unknown error');
      return new Response(
        JSON.stringify({
          success: false,
          paid: false,
          error: cfData.message || 'Order verification failed.'
        }),
        { status: cfResponse.status || 400, headers: corsHeaders }
      );
    }

    // 2. Strict Ownership Check: Order must belong to the cryptographically verified user
    const orderCustomerId = (cfData.customer_details?.customer_id || '').trim();
    const orderTagUid = (cfData.order_tags?.uid || '').trim();

    const isOwner = (orderCustomerId === cleanUserId) || (orderTagUid === cleanUserId);
    if (!isOwner) {
      return new Response(
        JSON.stringify({
          success: false,
          paid: false,
          error: 'Unauthorized: This payment order does not belong to your authenticated user account.'
        }),
        { status: 403, headers: corsHeaders }
      );
    }

    // 2. Strict Payment Status Check: Must be genuinely PAID
    const isPaid = cfData.order_status === 'PAID';
    if (!isPaid) {
      return new Response(
        JSON.stringify({
          success: false,
          paid: false,
          order_status: cfData.order_status,
          error: `Order has not been paid (Status: ${cfData.order_status}).`
        }),
        { status: 400, headers: corsHeaders }
      );
    }

    // 3. Authoritative Plan & Duration derived strictly from verified order amount
    const verifiedAmount = Number(cfData.order_amount);
    if (![50, 179].includes(verifiedAmount)) {
      return new Response(
        JSON.stringify({
          success: false,
          paid: false,
          error: `Payment amount ₹${verifiedAmount} does not match any valid plan tier.`
        }),
        { status: 400, headers: corsHeaders }
      );
    }
    const durationMonths = verifiedAmount >= 170 ? 12 : 3;
    const planName = 'paid-premium-plan';

    // 4. Server-Authoritative Subscription Activation & Anti-Replay Idempotency
    const serviceAccount = getServiceAccountConfig(env);
    let activated = false;
    let premiumUntilIso = null;

    if (serviceAccount) {
      // 4a. Check if this order was already redeemed
      const redeemedCheck = await checkOrderRedeemed(serviceAccount, cleanOrderId);
      if (redeemedCheck.redeemed) {
        return new Response(
          JSON.stringify({
            success: true,
            paid: true,
            already_redeemed: true,
            order_id: cfData.order_id,
            order_amount: verifiedAmount,
            duration_months: durationMonths,
            plan: planName,
            customer_id: cleanUserId,
            message: 'This Cashfree order has already been redeemed. Subscription remains active.'
          }),
          { status: 200, headers: corsHeaders }
        );
      }

      // 4b. Perform authoritative activation in Firestore
      const activation = await activateSubscriptionServerSide(serviceAccount, {
        orderId: cleanOrderId,
        userId: cleanUserId,
        userEmail: verifiedUser.email,
        amount: verifiedAmount,
        durationMonths
      });

      if (activation.alreadyRedeemed) {
        return new Response(
          JSON.stringify({
            success: true,
            paid: true,
            already_redeemed: true,
            order_id: cfData.order_id,
            order_amount: verifiedAmount,
            duration_months: durationMonths,
            plan: planName,
            customer_id: cleanUserId,
            message: 'This Cashfree order has already been redeemed. Subscription remains active.'
          }),
          { status: 200, headers: corsHeaders }
        );
      }

      activated = activation.activated;
      premiumUntilIso = activation.premiumUntil;
    } else {
      console.warn('Firebase Service Account not configured in server environment; skipping direct Firestore update.');
    }

    return new Response(
      JSON.stringify({
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
      }),
      { status: 200, headers: corsHeaders }
    );
  } catch (err) {
    console.error('Unexpected error in verify-order function:', err.message);
    return new Response(
      JSON.stringify({ success: false, error: 'Internal server error while verifying order.' }),
      { status: 500, headers: corsHeaders }
    );
  }
}
