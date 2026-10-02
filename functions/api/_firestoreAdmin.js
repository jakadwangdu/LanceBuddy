/**
 * Server-Authoritative Firestore Admin Service
 * Uses Google OAuth 2.0 with a Firebase Service Account & Firestore REST API.
 * Compatible with Cloudflare Workers / Pages Functions & Node.js 18+.
 * Completely serverless, zero external npm dependencies.
 */

let cachedAccessToken = null;
let tokenExpiresAt = 0;

/**
 * Parses and extracts service account credentials from environment
 */
export function getServiceAccountConfig(env = {}) {
  const procEnv = (typeof process !== 'undefined' && process.env) ? process.env : {};
  let saJson = env.FIREBASE_SERVICE_ACCOUNT || procEnv.FIREBASE_SERVICE_ACCOUNT;

  if (saJson) {
    try {
      saJson = saJson.trim();
      // Handle base64 encoded JSON
      if (!saJson.startsWith('{') && saJson.length > 20) {
        try {
          saJson = atob(saJson);
        } catch {
          // not base64, proceed as raw
        }
      }
      const parsed = JSON.parse(saJson);
      return {
        clientEmail: parsed.client_email,
        privateKey: parsed.private_key,
        projectId: parsed.project_id
      };
    } catch (e) {
      console.error('Failed to parse FIREBASE_SERVICE_ACCOUNT JSON:', e.message);
    }
  }

  const clientEmail = (env.FIREBASE_CLIENT_EMAIL || procEnv.FIREBASE_CLIENT_EMAIL || '').trim();
  const privateKey = (env.FIREBASE_PRIVATE_KEY || procEnv.FIREBASE_PRIVATE_KEY || '').trim();
  const projectId = (
    env.FIREBASE_PROJECT_ID || 
    env.VITE_FIREBASE_PROJECT_ID || 
    procEnv.FIREBASE_PROJECT_ID || 
    procEnv.VITE_FIREBASE_PROJECT_ID || 
    ''
  ).trim();

  if (clientEmail && privateKey && projectId) {
    return { clientEmail, privateKey, projectId };
  }

  return null;
}

/**
 * Generates an OAuth2 access token for Google Cloud Datastore / Firestore API
 */
async function getFirestoreAccessToken(serviceAccount) {
  const nowSec = Math.floor(Date.now() / 1000);
  if (cachedAccessToken && (tokenExpiresAt - nowSec > 300)) {
    return cachedAccessToken;
  }

  const { clientEmail, privateKey } = serviceAccount;
  if (!clientEmail || !privateKey) {
    throw new Error('Service account client email or private key is missing');
  }

  // Normalize PEM private key
  let cleanedKey = privateKey
    .replace(/-----[A-Z ]+-----/g, '')
    .replace(/\\n/g, '\n')
    .replace(/\s+/g, '');

  let binaryKey;
  try {
    const rawKey = atob(cleanedKey);
    binaryKey = new Uint8Array(rawKey.length);
    for (let i = 0; i < rawKey.length; i++) {
      binaryKey[i] = rawKey.charCodeAt(i);
    }
  } catch (err) {
    throw new Error('Failed to decode service account private key: ' + err.message);
  }

  const cryptoKey = await crypto.subtle.importKey(
    'pkcs8',
    binaryKey,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const headerB64 = btoa(JSON.stringify({ alg: 'RS256', typ: 'JWT' }))
    .replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');

  const claimSet = {
    iss: clientEmail,
    scope: 'https://www.googleapis.com/auth/datastore',
    aud: 'https://oauth2.googleapis.com/token',
    exp: nowSec + 3600,
    iat: nowSec
  };

  const payloadB64 = btoa(JSON.stringify(claimSet))
    .replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');

  const dataToSign = new TextEncoder().encode(`${headerB64}.${payloadB64}`);
  const signatureBytes = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', cryptoKey, dataToSign);

  let binarySig = '';
  const sigArray = new Uint8Array(signatureBytes);
  for (let i = 0; i < sigArray.length; i++) {
    binarySig += String.fromCharCode(sigArray[i]);
  }
  const sigB64 = btoa(binarySig).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');

  const assertionJwt = `${headerB64}.${payloadB64}.${sigB64}`;

  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: assertionJwt
    })
  });

  const tokenData = await tokenRes.json();
  if (!tokenRes.ok || !tokenData.access_token) {
    throw new Error('Google OAuth2 token exchange failed: ' + (tokenData.error_description || tokenData.error || 'Unknown'));
  }

  cachedAccessToken = tokenData.access_token;
  tokenExpiresAt = nowSec + (tokenData.expires_in || 3600);
  return cachedAccessToken;
}

/**
 * Checks if a Cashfree order has already been redeemed
 */
export async function checkOrderRedeemed(serviceAccount, orderId) {
  const token = await getFirestoreAccessToken(serviceAccount);
  const projectId = serviceAccount.projectId;
  const cleanOrderId = encodeURIComponent(orderId.trim());

  const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/redeemed_orders/${cleanOrderId}`;
  const res = await fetch(url, {
    method: 'GET',
    headers: { 'Authorization': `Bearer ${token}` }
  });

  if (res.status === 200) {
    const data = await res.json();
    return {
      redeemed: true,
      data
    };
  }

  if (res.status === 404) {
    return { redeemed: false };
  }

  console.warn(`Firestore checkOrderRedeemed status ${res.status}`);
  return { redeemed: false };
}

/**
 * Authoritatively activates user subscription and records redeemed order in Firestore
 */
export async function activateSubscriptionServerSide(serviceAccount, {
  orderId,
  userId,
  userEmail,
  amount,
  durationMonths
}) {
  const token = await getFirestoreAccessToken(serviceAccount);
  const projectId = serviceAccount.projectId;
  const cleanOrderId = orderId.trim();
  const cleanUserId = userId.trim();

  // 1. Calculate Authoritative Subscription Expiration
  const premiumUntil = new Date();
  premiumUntil.setMonth(premiumUntil.getMonth() + durationMonths);
  const premiumUntilIso = premiumUntil.toISOString();
  const planName = 'paid-premium-plan';
  const nowIso = new Date().toISOString();
  const auditId = `req_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

  // 2. Atomic Batch Commit (ACID Transaction)
  // Both redeemed_orders and users/{userId} are written in a single atomic database commit.
  // Precondition: redeemed_orders/{cleanOrderId} MUST NOT exist yet.
  const commitUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents:commit`;

  const commitPayload = {
    writes: [
      // 2a. Anti-Replay / Idempotency Ledger Document
      // Precondition: currentDocument.exists == false guarantees only one redemption can succeed
      {
        update: {
          name: `projects/${projectId}/databases/(default)/documents/redeemed_orders/${cleanOrderId}`,
          fields: {
            orderId: { stringValue: cleanOrderId },
            userId: { stringValue: cleanUserId },
            amount: { integerValue: String(amount) },
            durationMonths: { integerValue: String(durationMonths) },
            gateway: { stringValue: 'cashfree' },
            redeemedAt: { timestampValue: nowIso }
          }
        },
        currentDocument: {
          exists: false
        }
      },
      // 2b. Authoritative Subscription Update on Authenticated User Document
      {
        update: {
          name: `projects/${projectId}/databases/(default)/documents/users/${cleanUserId}`,
          fields: {
            plan: { stringValue: planName },
            premiumUntil: { stringValue: premiumUntilIso },
            paymentId: { stringValue: cleanOrderId },
            razorpayPaymentId: { stringValue: cleanOrderId }
          }
        },
        updateMask: {
          fieldPaths: ['plan', 'premiumUntil', 'paymentId', 'razorpayPaymentId']
        }
      },
      // 2c. Immutable Audit Log Entry
      {
        update: {
          name: `projects/${projectId}/databases/(default)/documents/upgrade_requests/${auditId}`,
          fields: {
            userId: { stringValue: cleanUserId },
            userEmail: { stringValue: userEmail || 'unknown' },
            plan: { stringValue: planName },
            durationMonths: { integerValue: String(durationMonths) },
            amount: { integerValue: String(amount) },
            orderId: { stringValue: cleanOrderId },
            gateway: { stringValue: 'cashfree' },
            status: { stringValue: 'active' },
            createdAt: { timestampValue: nowIso }
          }
        }
      }
    ]
  };

  const commitRes = await fetch(commitUrl, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(commitPayload)
  });

  const commitData = await commitRes.json();

  if (!commitRes.ok) {
    const errorStatus = commitData.error?.status || '';
    const errorMsg = commitData.error?.message || '';

    // If precondition fails (document already exists), handle as already redeemed
    if (errorStatus === 'ALREADY_EXISTS' || errorStatus === 'FAILED_PRECONDITION' || errorMsg.includes('already exists')) {
      return {
        success: true,
        alreadyRedeemed: true,
        activated: false,
        orderId: cleanOrderId,
        plan: planName,
        message: 'This Cashfree order has already been redeemed for an active subscription.'
      };
    }

    console.error('Firestore atomic commit error:', commitData.error || commitData);
    throw new Error('Database transaction failed while activating subscription.');
  }

  return {
    success: true,
    activated: true,
    alreadyRedeemed: false,
    orderId: cleanOrderId,
    plan: planName,
    durationMonths,
    premiumUntil: premiumUntilIso
  };
}
