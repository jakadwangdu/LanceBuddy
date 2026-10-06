import React, { useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { launchCashfreeCheckout } from '../services/cashfreeClient';
import { SEO } from '../components/common/SEO';

export const CheckoutPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { currentUser, upgradePlan, refreshUser } = useAuth();

  const initialPlan = searchParams.get('plan') === 'quarterly' ? 'quarterly' : 'yearly';
  const [billingCycle, setBillingCycle] = useState(initialPlan);
  const durationMonths = billingCycle === 'quarterly' ? 3 : 12;
  const rawAmount = billingCycle === 'quarterly' ? 50 : 179;

  const [utr, setUtr] = useState('');
  const [copied, setCopied] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [cashfreeLoading, setCashfreeLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [success, setSuccess] = useState(false);

  const upiId = '0001shaurya@fam';
  const payeeName = 'Shaurya Pratap Singh';
  const note = `LanceBuddy ${billingCycle === 'quarterly' ? 'Quarterly' : 'Yearly'} Plan`;

  const upiIntentUrl = `upi://pay?pa=${upiId}&pn=${encodeURIComponent(payeeName)}&am=${rawAmount}&cu=INR&tn=${encodeURIComponent(note)}`;

  const fallbackCopy = (text) => {
    try {
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      document.execCommand('copy');
      textArea.remove();
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.warn('Fallback copy error:', err);
    }
  };

  const handleCopyUpi = (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    const textToCopy = upiId;
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(textToCopy)
        .then(() => {
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        })
        .catch(() => fallbackCopy(textToCopy));
    } else {
      fallbackCopy(textToCopy);
    }
  };

  const handleCashfreePay = async () => {
    setErrorMsg('');
    if (!currentUser) {
      alert('Please sign in or create an account first so your Pro upgrade is linked.');
      navigate(`/login?redirect=${encodeURIComponent(`/checkout?plan=${billingCycle}`)}`);
      return;
    }

    setCashfreeLoading(true);
    try {
      const res = await launchCashfreeCheckout({
        amount: rawAmount,
        plan: billingCycle,
        userPhone: '9876543210'
      });

      if (res.success && res.paid) {
        // Refresh authoritative user account state from Firestore
        if (typeof refreshUser === 'function') {
          await refreshUser();
        } else if (res.durationMonths) {
          const premiumUntil = new Date();
          premiumUntil.setMonth(premiumUntil.getMonth() + res.durationMonths);
          await upgradePlan(res.plan || 'paid-premium-plan', premiumUntil, res.orderId);
        }

        setSuccess(true);
      } else if (res.error) {
        setErrorMsg(res.error);
      }
    } catch (err) {
      setErrorMsg(err.message || 'Payment initiation failed.');
    } finally {
      setCashfreeLoading(false);
    }
  };

  const handleSubmitUtr = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!currentUser) {
      alert('Please sign in or create an account first so your Pro upgrade is linked.');
      navigate(`/login?redirect=${encodeURIComponent(`/checkout?plan=${billingCycle}`)}`);
      return;
    }

    const cleanUtr = utr.trim().replace(/\s+/g, '');
    if (!/^\d{12}$/.test(cleanUtr)) {
      setErrorMsg('Please enter a valid 12-digit numeric UPI Reference / UTR number.');
      return;
    }

    setSubmitting(true);

    try {
      // 1. Verify against real FamPay / Bank payment receipt emails
      let verification = null;
      try {
        const verifyRes = await fetch('/api/verify-upi', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ utr: cleanUtr, expectedAmount: rawAmount })
        });
        verification = await verifyRes.json();
      } catch (netErr) {
        console.warn('Backend verifier endpoint error:', netErr);
      }

      if (!verification || !verification.verified) {
        setErrorMsg(
          verification?.reason || 
          `Payment could not be verified for UTR "${cleanUtr}". If you just transferred ₹${rawAmount}, please wait 30-60 seconds for your bank's confirmation email and try again.`
        );
        setSubmitting(false);
        return;
      }

      // 2. Prevent duplicate reuse of the same UTR
      try {
        const { getFirestore, collection, query, where, getDocs } = await import('firebase/firestore');
        const db = getFirestore();
        if (db) {
          const q = query(collection(db, 'upgrade_requests'), where('utr', '==', cleanUtr));
          const snapshot = await getDocs(q);
          if (!snapshot.empty) {
            setErrorMsg(`This UTR (${cleanUtr}) has already been redeemed for an active account.`);
            setSubmitting(false);
            return;
          }
        }
      } catch (dupErr) {
        console.warn('Duplicate check warning:', dupErr);
      }

      const premiumUntil = new Date();
      premiumUntil.setMonth(premiumUntil.getMonth() + durationMonths);

      // 3. Record in Firestore
      try {
        const { getFirestore, collection, addDoc, serverTimestamp } = await import('firebase/firestore');
        const db = getFirestore();
        if (db) {
          await addDoc(collection(db, 'upgrade_requests'), {
            userId: currentUser?.uid || 'guest',
            userName: currentUser?.name || verification.payer || 'User',
            userEmail: currentUser?.email || 'N/A',
            plan: 'paid-premium-plan',
            durationMonths,
            amount: rawAmount,
            utr: cleanUtr,
            payerName: verification.payer || 'Verified Payer',
            verifiedViaEmail: true,
            status: 'active',
            createdAt: serverTimestamp()
          });
        }
      } catch (err) {
        console.warn('Firestore upgrade log note:', err);
      }

      // 4. Email notification to Shaurya
      try {
        await fetch('https://formsubmit.co/ajax/itsshaurya4851@gmail.com', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            _subject: `🎉 Verified LanceBuddy Payment: ₹${rawAmount} from ${verification.payer || 'User'}`,
            User_Name: currentUser?.name || verification.payer || 'User',
            User_Email: currentUser?.email || 'N/A',
            Payer_Name: verification.payer || 'Unknown',
            Plan: `${billingCycle === 'quarterly' ? '3 Months' : '1 Full Year'} (₹${rawAmount})`,
            UPI_UTR: cleanUtr,
            Verification: 'MATCHED_WITH_FAMPAY_EMAIL',
            Submitted_At: new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }),
            Status: 'Verified_Active'
          })
        });
      } catch (mailErr) {
        console.warn('Notification mail error:', mailErr);
      }

      // 5. Upgrade in AuthContext
      await upgradePlan('paid-premium-plan', premiumUntil, cleanUtr);
      try { localStorage.setItem('lb_premium_active', 'true'); } catch {}

      setSuccess(true);
    } catch (err) {
      console.error('Upgrade submission error:', err);
      setErrorMsg('Something went wrong verifying your payment. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="checkout-page">
      <SEO
        title="Checkout — Upgrade to LanceBuddy Pro"
        description="Upgrade to LanceBuddy Pro for unlimited scouting, CSV export, and email templates."
        noindex={true}
        canonical="https://lancebuddy.in/checkout"
      />
      <div className="checkout-card">
        {/* Header */}
        <div className="checkout-header">
          <p className="k">Pro Access</p>
          <h1>Upgrade to Pro</h1>
          <p>
            Activate unlimited lead scouting, CSV export and outreach dossiers.
          </p>
        </div>

        {/* Success View */}
        {success ? (
          <div style={{ padding: '24px 12px', textAlign: 'center' }}>
            <div style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              background: 'color-mix(in srgb, var(--ink) 10%, transparent)',
              color: 'var(--ink)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '32px',
              margin: '0 auto 18px',
              border: '1px solid var(--line)'
            }}>
              <i className="ri-checkbox-circle-fill"></i>
            </div>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 700, margin: '0 0 8px', color: 'var(--ink)' }}>
              Pro Access Activated!
            </h2>
            <p style={{ color: 'var(--mute)', fontSize: '0.9rem', lineHeight: 1.6, margin: '0 auto 24px', maxWidth: '380px' }}>
              Your {billingCycle === 'quarterly' ? '3-Month' : '1-Year'} Premium plan is now active under UTR: <strong>{utr}</strong>.
            </p>
            <button
              type="button"
              className="checkout-gateway-btn"
              onClick={() => {
                navigate('/');
                window.location.reload();
              }}
            >
              Go to Scout Workspace &rarr;
            </button>
          </div>
        ) : (
          <>
            {/* Plan Switcher */}
            <div className="checkout-cycle-switch">
              <button
                type="button"
                onClick={() => setBillingCycle('quarterly')}
                className={`checkout-cycle-btn ${billingCycle === 'quarterly' ? 'active' : ''}`}
              >
                3 Months · ₹50
              </button>
              <button
                type="button"
                onClick={() => setBillingCycle('yearly')}
                className={`checkout-cycle-btn ${billingCycle === 'yearly' ? 'active' : ''}`}
              >
                1 Year · ₹179 (Save 40%)
              </button>
            </div>

            {/* Cashfree 1-Click Gateway Checkout */}
            <button
              type="button"
              onClick={handleCashfreePay}
              disabled={cashfreeLoading}
              className="checkout-gateway-btn"
            >
              {cashfreeLoading ? (
                <>
                  <i className="ri-loader-4-line" style={{ animation: 'spin 1s linear infinite' }}></i>
                  <span>Opening Gateway...</span>
                </>
              ) : (
                <>
                  <i className="ri-secure-payment-fill"></i>
                  <span>Pay via Gateway · ₹{rawAmount}</span>
                </>
              )}
            </button>
            <div style={{ textAlign: 'center', marginTop: '6px', fontSize: '0.72rem', color: 'var(--mute)' }}>
              1-Click Instant: GPay, PhonePe, Paytm, Cards &amp; Netbanking
            </div>

            <div className="checkout-divider">
              <span>or direct UPI transfer</span>
            </div>

            {/* QR Card */}
            <div className="checkout-qr-box">
              <div className="checkout-qr-frame">
                <img
                  src="/upi-qr.webp"
                  alt="LanceBuddy UPI QR Code"
                  className="checkout-qr-img"
                />
              </div>

              <div
                className={`checkout-upi-pill ${copied ? 'copied' : ''}`}
                onClick={handleCopyUpi}
                title="Click to copy UPI ID"
              >
                <span>{upiId}</span>
                <button type="button" onClick={handleCopyUpi}>
                  <i className={copied ? "ri-check-line" : "ri-file-copy-line"}></i>
                  <span>{copied ? 'Copied' : 'Copy'}</span>
                </button>
              </div>

              {/* 1-Click Mobile UPI Button */}
              <a
                href={upiIntentUrl}
                className="checkout-intent-btn"
              >
                <i className="ri-smartphone-line"></i>
                <span>Open in UPI App (₹{rawAmount})</span>
              </a>
            </div>

            {/* Login Warning if not logged in */}
            {!currentUser && (
              <div className="checkout-banner">
                <i className="ri-information-fill"></i>
                <div className="checkout-banner-text">
                  <strong>Account Login Required</strong>
                  <Link to={`/login?redirect=${encodeURIComponent(`/checkout?plan=${billingCycle}`)}`}>
                    Sign in or create account
                  </Link> before verifying your UTR.
                </div>
              </div>
            )}

            {/* UTR Form */}
            <form onSubmit={handleSubmitUtr} className="checkout-utr-form">
              <div className="checkout-form-group">
                <label>
                  Enter 12-Digit UPI Reference (UTR)
                </label>
                <input
                  type="text"
                  required
                  maxLength={12}
                  value={utr}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, '');
                    setUtr(val);
                    setErrorMsg('');
                  }}
                  placeholder="e.g. 427812984123"
                  className="checkout-utr-input"
                />
                <span className="checkout-form-note">
                  Check your payment receipt in GPay, PhonePe, or Paytm for the 12-digit "UPI Ref No" or "UTR".
                </span>
              </div>

              {errorMsg && (
                <div className="checkout-error">
                  {errorMsg}
                </div>
              )}

              <button
                type="submit"
                disabled={submitting || utr.length !== 12 || !currentUser}
                className="checkout-submit-btn"
              >
                {submitting ? (
                  <>
                    <i className="ri-loader-4-line" style={{ animation: 'spin 1s linear infinite' }}></i>
                    <span>Verifying UTR...</span>
                  </>
                ) : (
                  <>
                    <i className="ri-shield-check-fill"></i>
                    <span>Verify &amp; Activate (₹{rawAmount})</span>
                  </>
                )}
              </button>
            </form>

            <div className="checkout-back-link">
              <Link to="/">
                &larr; Return to Workspace
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
