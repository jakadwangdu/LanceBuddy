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
    <div className="checkout-page" style={{ minHeight: '85vh', padding: '5rem 1.5rem 4rem', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
      <SEO
        title="Checkout — Upgrade to LanceBuddy Pro"
        description="Upgrade to LanceBuddy Pro for unlimited scouting, CSV export, and email templates."
        noindex={true}
        canonical="https://www.lancebuddy.in/checkout"
      />
      <div className="checkout-container" style={{ maxWidth: '540px', width: '100%', background: 'var(--surface)', padding: '2.2rem 2rem', borderRadius: '20px', border: '1px solid var(--border)', boxShadow: 'var(--shadow-lg)' }}>
        
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '1.8rem' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'var(--accent-light)', color: 'var(--accent)', fontWeight: 800, fontSize: '0.78rem', padding: '4px 12px', borderRadius: 'var(--radius-full)', marginBottom: '10px', border: '1px solid rgba(99, 102, 241, 0.2)' }}>
            <i className="ri-vip-crown-fill"></i> UPGRADE TO PRO
          </div>
          <h1 style={{ fontSize: 'clamp(22px, 4vw, 28px)', fontWeight: 850, margin: '0 0 6px', color: 'var(--text)', letterSpacing: '-0.02em' }}>
            Direct UPI Checkout
          </h1>
          <p style={{ color: 'var(--muted)', fontSize: '0.9rem', margin: 0 }}>
            Pay directly via Google Pay, PhonePe, Paytm, or FamPay with 0% extra fees.
          </p>
        </div>

        {/* Success View */}
        {success ? (
          <div style={{ padding: '24px 12px', textAlign: 'center' }}>
            <div style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              background: 'rgba(16, 185, 129, 0.12)',
              color: '#10b981',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '32px',
              margin: '0 auto 18px',
              boxShadow: '0 0 0 6px rgba(16, 185, 129, 0.08)'
            }}>
              <i className="ri-checkbox-circle-fill"></i>
            </div>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 800, margin: '0 0 8px', color: 'var(--text)' }}>
              Pro Access Activated!
            </h2>
            <p style={{ color: 'var(--muted)', fontSize: '0.9rem', lineHeight: 1.6, margin: '0 auto 24px', maxWidth: '380px' }}>
              Your {billingCycle === 'quarterly' ? '3-Month' : '1-Year'} Premium plan is now active under UTR: <strong>{utr}</strong>.
            </p>
            <button
              type="button"
              className="leads-btn"
              onClick={() => {
                navigate('/');
                window.location.reload();
              }}
              style={{ width: '100%', padding: '12px 20px', fontWeight: 700 }}
            >
              Go to Scout Workspace &rarr;
            </button>
          </div>
        ) : (
          <>
            {/* Plan Switcher */}
            <div style={{ display: 'flex', background: 'var(--surface2)', borderRadius: 'var(--radius-full)', padding: '3px', border: '1px solid var(--border-soft)', marginBottom: '1.5rem' }}>
              <button
                type="button"
                onClick={() => setBillingCycle('quarterly')}
                style={{
                  flex: 1,
                  padding: '8px 12px',
                  borderRadius: 'var(--radius-full)',
                  border: 'none',
                  background: billingCycle === 'quarterly' ? 'var(--btn)' : 'transparent',
                  color: billingCycle === 'quarterly' ? 'var(--btn-text)' : 'var(--muted)',
                  cursor: 'pointer',
                  fontWeight: 700,
                  fontSize: '0.85rem',
                  transition: 'all 0.2s ease'
                }}
              >
                Quarterly (3 Mo) &bull; ₹50
              </button>
              <button
                type="button"
                onClick={() => setBillingCycle('yearly')}
                style={{
                  flex: 1,
                  padding: '8px 12px',
                  borderRadius: 'var(--radius-full)',
                  border: 'none',
                  background: billingCycle === 'yearly' ? 'var(--btn)' : 'transparent',
                  color: billingCycle === 'yearly' ? 'var(--btn-text)' : 'var(--muted)',
                  cursor: 'pointer',
                  fontWeight: 700,
                  fontSize: '0.85rem',
                  transition: 'all 0.2s ease'
                }}
              >
                1 Year &bull; ₹179 (Save ~40%)
              </button>
            </div>

            {/* Cashfree 1-Click Gateway Checkout */}
            <button
              type="button"
              onClick={handleCashfreePay}
              disabled={cashfreeLoading}
              className="leads-btn"
              style={{
                width: '100%',
                padding: '13px 20px',
                fontSize: '0.96rem',
                fontWeight: 800,
                background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
                color: '#ffffff',
                border: 'none',
                borderRadius: 'var(--radius-md)',
                cursor: cashfreeLoading ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                boxShadow: '0 4px 14px rgba(99, 102, 241, 0.35)',
                marginBottom: '16px'
              }}
            >
              {cashfreeLoading ? (
                <>
                  <i className="ri-loader-4-line" style={{ animation: 'spin 1s linear infinite' }}></i>
                  <span>Opening Cashfree Gateway...</span>
                </>
              ) : (
                <>
                  <i className="ri-secure-payment-fill"></i>
                  <span>Pay with Cashfree &bull; ₹{rawAmount} (Instant UPI / Cards)</span>
                </>
              )}
            </button>

            <div style={{
              display: 'flex',
              alignItems: 'center',
              textAlign: 'center',
              margin: '14px 0 18px',
              color: 'var(--muted)',
              fontSize: '0.74rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.05em'
            }}>
              <div style={{ flex: 1, height: '1px', background: 'var(--border-soft)' }}></div>
              <span style={{ padding: '0 12px' }}>or pay manually via UPI QR</span>
              <div style={{ flex: 1, height: '1px', background: 'var(--border-soft)' }}></div>
            </div>

            {/* QR Card */}
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              background: 'var(--surface2)',
              padding: '16px',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--border-soft)',
              marginBottom: '1.5rem'
            }}>
              <div style={{
                background: '#ffffff',
                padding: '10px',
                borderRadius: '12px',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
                display: 'inline-block'
              }}>
                <img
                  src="/upi-qr.webp"
                  alt="LanceBuddy FamPay UPI QR Code"
                  style={{
                    width: '180px',
                    height: 'auto',
                    display: 'block',
                    borderRadius: '8px'
                  }}
                />
              </div>

              <div
                onClick={handleCopyUpi}
                title="Click to copy UPI ID"
                style={{
                  marginTop: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  background: 'var(--surface)',
                  padding: '6px 14px',
                  borderRadius: 'var(--radius-full)',
                  border: copied ? '1px solid #10b981' : '1px solid var(--border)',
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  userSelect: 'none'
                }}
              >
                <span style={{ fontFamily: 'monospace', fontWeight: 700, color: 'var(--text)' }}>
                  {upiId}
                </span>
                <button
                  type="button"
                  onClick={handleCopyUpi}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: copied ? '#10b981' : 'var(--accent)',
                    fontWeight: 700,
                    fontSize: '0.8rem',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  <i className={copied ? "ri-check-line" : "ri-file-copy-line"}></i>
                  {copied ? 'Copied!' : 'Copy UPI'}
                </button>
              </div>

              {/* 1-Click Mobile UPI Button */}
              <a
                href={upiIntentUrl}
                className="leads-btn"
                style={{
                  marginTop: '12px',
                  width: '100%',
                  padding: '9px 16px',
                  fontSize: '0.88rem',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  borderRadius: 'var(--radius-full)'
                }}
              >
                <i className="ri-smartphone-line"></i>
                <span>Open in UPI App (Pay ₹{rawAmount})</span>
              </a>
            </div>

            {/* Login Warning if not logged in */}
            {!currentUser && (
              <div style={{
                background: 'rgba(234, 179, 8, 0.08)',
                border: '1px solid rgba(234, 179, 8, 0.25)',
                borderRadius: '12px',
                padding: '10px 14px',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                textAlign: 'left',
                marginBottom: '1rem'
              }}>
                <i className="ri-information-fill" style={{ color: '#eab308', fontSize: '1.2rem', flexShrink: 0 }}></i>
                <div style={{ fontSize: '0.82rem', color: 'var(--muted)', lineHeight: 1.4 }}>
                  <strong style={{ color: 'var(--text)', display: 'block' }}>Account Login Required</strong>
                  <Link to={`/login?redirect=${encodeURIComponent(`/checkout?plan=${billingCycle}`)}`} style={{ color: 'var(--accent)', textDecoration: 'underline' }}>
                    Sign in or create account
                  </Link> before verifying your UTR.
                </div>
              </div>
            )}

            {/* UTR Form */}
            <form onSubmit={handleSubmitUtr}>
              <div style={{ marginBottom: '12px' }}>
                <label style={{
                  display: 'block',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                  color: 'var(--muted)',
                  marginBottom: '6px'
                }}>
                  Enter 12-Digit UPI Reference / UTR Number
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
                  style={{
                    width: '100%',
                    padding: '11px 14px',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border)',
                    background: 'var(--input-bg)',
                    color: 'var(--text)',
                    fontFamily: 'monospace',
                    fontSize: '1rem',
                    letterSpacing: '1px',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
                <span style={{ fontSize: '0.74rem', color: 'var(--muted)', marginTop: '4px', display: 'block' }}>
                  * Check your payment receipt in GPay, PhonePe, or Paytm for the 12-digit "UPI Ref No" or "UTR".
                </span>
              </div>

              {errorMsg && (
                <div style={{
                  padding: '8px 12px',
                  background: 'rgba(239, 68, 68, 0.1)',
                  border: '1px solid rgba(239, 68, 68, 0.25)',
                  borderRadius: 'var(--radius-sm)',
                  color: '#ef4444',
                  fontSize: '0.82rem',
                  marginBottom: '12px'
                }}>
                  {errorMsg}
                </div>
              )}

              <button
                type="submit"
                disabled={submitting || utr.length !== 12 || !currentUser}
                className="leads-btn"
                style={{
                  width: '100%',
                  padding: '12px 18px',
                  fontSize: '0.95rem',
                  fontWeight: 700,
                  cursor: (submitting || utr.length !== 12 || !currentUser) ? 'not-allowed' : 'pointer',
                  opacity: (submitting || utr.length !== 12 || !currentUser) ? 0.7 : 1
                }}
              >
                {submitting ? (
                  <>
                    <i className="ri-loader-4-line" style={{ animation: 'spin 1s linear infinite' }}></i>
                    <span>Verifying UTR...</span>
                  </>
                ) : (
                  <>
                    <i className="ri-shield-check-fill"></i>
                    <span>Verify &amp; Activate Pro Access (₹{rawAmount})</span>
                  </>
                )}
              </button>
            </form>

            <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
              <Link to="/" style={{ color: 'var(--muted)', fontSize: '0.85rem', textDecoration: 'underline' }}>
                &larr; Return to Workspace
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
