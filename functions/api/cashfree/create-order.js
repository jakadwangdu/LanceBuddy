/**
 * Cloudflare Pages Function: Create Cashfree PG Order
 * Endpoint: POST /api/cashfree/create-order
 * 
 * Secure serverless function running on Cloudflare Edge.
 * Reads CASHFREE_APP_ID and CASHFREE_SECRET_KEY solely from Cloudflare environment secrets.
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

export async function onRequestPost(context) {
  const { request, env } = context;

  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Content-Type': 'application/json'
  };

  try {
    const appId = (env.CASHFREE_APP_ID || '14508048da85d5fbb8055b003964080541').trim();
    const secretKey = (env.CASHFREE_SECRET_KEY || '').trim();
    const environment = (env.CASHFREE_ENV || 'production').trim().toLowerCase();

    if (!appId || !secretKey) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Cashfree payment service is currently not configured with credentials.'
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
          error: `Authentication failed: ${authErr.message || 'Invalid or expired session'}`
        }),
        { status: 401, headers: corsHeaders }
      );
    }

    const { amount, plan = 'quarterly', userPhone } = body;

    // 2. Validate authorized pricing to prevent client-side amount tampering (50 or 179 only)
    const numericAmount = Number(amount);
    const validAmounts = [50, 179]; // 50 (Quarterly), 179 (Yearly)
    if (!validAmounts.includes(numericAmount)) {
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid plan amount.' }),
        { status: 400, headers: corsHeaders }
      );
    }

    // Bind order indelibly to the verified Firebase UID (never trusting arbitrary client input)
    const cleanCustomerId = verifiedUser.uid.replace(/[^a-zA-Z0-9_-]/g, '_').substring(0, 50);

    const cleanEmail = (verifiedUser.email && verifiedUser.email.includes('@')) 
      ? verifiedUser.email.trim().substring(0, 80)
      : 'billing@lancebuddy.in';

    const cleanPhone = (userPhone || '9876543210')
      .replace(/\D/g, '')
      .padEnd(10, '0')
      .substring(0, 10);

    const orderId = `LB_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    
    // Determine return URL (Cashfree strictly requires https://)
    const url = new URL(request.url);
    const returnOrigin = (url.origin && url.origin.startsWith('https://')) 
      ? url.origin 
      : 'https://www.lancebuddy.in';
    const returnUrl = `${returnOrigin}/checkout?order_id={order_id}`;

    const cfBaseUrl = environment === 'sandbox'
      ? 'https://sandbox.cashfree.com/pg'
      : 'https://api.cashfree.com/pg';

    const cashfreePayload = {
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
      body: JSON.stringify(cashfreePayload)
    });

    const cfData = await cfResponse.json();

    if (!cfResponse.ok || !cfData.payment_session_id) {
      console.error('Cashfree order creation error:', cfData.message || 'Unknown error');
      return new Response(
        JSON.stringify({
          success: false,
          error: cfData.message || 'Unable to initiate Cashfree order. Please try again.'
        }),
        { status: cfResponse.status || 500, headers: corsHeaders }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        payment_session_id: cfData.payment_session_id,
        order_id: cfData.order_id,
        order_amount: cfData.order_amount,
        environment
      }),
      { status: 200, headers: corsHeaders }
    );
  } catch (err) {
    console.error('Unexpected error in create-order function:', err.message);
    return new Response(
      JSON.stringify({ success: false, error: 'Internal server error while processing order.' }),
      { status: 500, headers: corsHeaders }
    );
  }
}
