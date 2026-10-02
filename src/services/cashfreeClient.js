/**
 * Secure Client-Side Cashfree Gateway Helper
 * 
 * Communicates ONLY with server-side endpoints:
 * - /api/cashfree/create-order
 * - /api/cashfree/verify-order
 * 
 * Authenticates cryptographically using Firebase ID tokens.
 * NEVER contains or requires CASHFREE_SECRET_KEY.
 */

import { auth } from './firebase';

let cashfreeSdkPromise = null;

export function loadCashfreeSDK() {
  if (window.Cashfree) {
    return Promise.resolve(window.Cashfree);
  }

  if (cashfreeSdkPromise) {
    return cashfreeSdkPromise;
  }

  cashfreeSdkPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector('script[src*="cashfree.com/js/v3/cashfree.js"]');
    if (existing) {
      existing.addEventListener('load', () => resolve(window.Cashfree));
      existing.addEventListener('error', () => reject(new Error('Failed to load Cashfree SDK')));
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://sdk.cashfree.com/js/v3/cashfree.js';
    script.async = true;
    script.onload = () => {
      if (window.Cashfree) {
        resolve(window.Cashfree);
      } else {
        reject(new Error('Cashfree SDK object not found after script load'));
      }
    };
    script.onerror = () => reject(new Error('Network error loading Cashfree SDK'));
    document.body.appendChild(script);
  });

  return cashfreeSdkPromise;
}

/**
 * Initiates Cashfree Checkout Modal with Cryptographic Firebase Authentication
 * @param {Object} options
 * @param {number} options.amount - Plan amount in INR (50 or 179)
 * @param {string} options.plan - 'quarterly' or 'yearly'
 * @param {string} [options.userPhone] - User contact phone (optional)
 * @returns {Promise<{ success: boolean, paid?: boolean, orderId?: string, error?: string }>}
 */
export async function launchCashfreeCheckout({ amount, plan, userPhone = '9876543210' }) {
  try {
    if (!auth?.currentUser) {
      return {
        success: false,
        error: 'Please sign in or create an account before initiating payment.'
      };
    }

    // Obtain cryptographically signed Firebase ID token for authentication
    const idToken = await auth.currentUser.getIdToken(false);

    // 1. Request server to create Cashfree order and return session ID
    const createRes = await fetch('/api/cashfree/create-order', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${idToken}`
      },
      body: JSON.stringify({ amount, plan, userPhone, idToken })
    });

    const createData = await createRes.json();

    if (!createRes.ok || !createData.success || !createData.payment_session_id) {
      return {
        success: false,
        error: createData.error || 'Failed to initialize payment session with server.'
      };
    }

    const { payment_session_id, order_id, environment = 'production' } = createData;

    // 2. Load Cashfree Web SDK
    const Cashfree = await loadCashfreeSDK();
    const cashfree = Cashfree({
      mode: environment === 'sandbox' ? 'sandbox' : 'production'
    });

    // 3. Open Cashfree Popup Checkout Modal
    const checkoutResult = await cashfree.checkout({
      paymentSessionId: payment_session_id,
      redirectTarget: '_modal'
    });

    if (checkoutResult?.error) {
      return {
        success: false,
        error: checkoutResult.error.message || 'Payment window closed without completion.'
      };
    }

    // 4. Verify order payment status and ownership with server using authenticated ID token
    const verifyToken = await auth.currentUser.getIdToken(false);
    const verifyRes = await fetch('/api/cashfree/verify-order', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${verifyToken}`
      },
      body: JSON.stringify({ orderId: order_id, idToken: verifyToken })
    });

    const verifyData = await verifyRes.json();

    if (verifyData.success && verifyData.paid) {
      return {
        success: true,
        paid: true,
        orderId: order_id,
        amount: verifyData.order_amount,
        durationMonths: verifyData.duration_months,
        plan: verifyData.plan
      };
    } else {
      return {
        success: false,
        paid: false,
        orderId: order_id,
        error: verifyData.error || `Payment status: ${verifyData.order_status || 'Pending'}. Please complete payment.`
      };
    }
  } catch (err) {
    console.error('Cashfree checkout process error:', err);
    return {
      success: false,
      error: err.message || 'An unexpected error occurred during payment.'
    };
  }
}
