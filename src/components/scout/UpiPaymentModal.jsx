import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '../../context/AuthContext';
import { launchCashfreeCheckout } from '../../services/cashfreeClient';

export const UpiPaymentModal = ({ isOpen, onClose, initialPlan = 'yearly' }) => {
  const { currentUser, upgradePlan, refreshUser } = useAuth();
  const [billingCycle, setBillingCycle] = useState(initialPlan); // 'quarterly' or 'yearly'
  const [utr, setUtr] = useState('');
  const [copied, setCopied] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [cashfreeLoading, setCashfreeLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [success, setSuccess] = useState(false);

  // Keep billing cycle synchronized whenever caller changes plan (e.g. ₹50 vs ₹179)
  useEffect(() => {
    if (initialPlan) {
      setBillingCycle(initialPlan);
    }
  }, [initialPlan]);

  // Lock background body scroll while modal is active to prevent scroll drift
  useEffect(() => {
    if (!isOpen) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const durationMonths = billingCycle === 'quarterly' ? 3 : 12;
  const amount = billingCycle === 'quarterly' ? 50 : 179;
  const upiId = '0001shaurya@fam';
  const payeeName = 'Shaurya Pratap Singh';
  const note = `LanceBuddy ${billingCycle === 'quarterly' ? 'Quarterly' : 'Yearly'} Plan`;

  // Standard UPI Intent URL for 1-click mobile apps (GPay, PhonePe, Paytm, FamPay, BHIM)
  const upiIntentUrl = `upi://pay?pa=${upiId}&pn=${encodeURIComponent(payeeName)}&am=${amount}&cu=INR&tn=${encodeURIComponent(note)}`;

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
      return;
    }

    setCashfreeLoading(true);
    try {
      const res = await launchCashfreeCheckout({
        amount,
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

    // Clean input
    const cleanUtr = utr.trim().replace(/\s+/g, '');

    // Validate 12-digit numeric format
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
          body: JSON.stringify({ utr: cleanUtr, expectedAmount: amount })
        });
        verification = await verifyRes.json();
      } catch (netErr) {
        console.warn('Backend verifier endpoint error:', netErr);
      }

      if (!verification || !verification.verified) {
        setErrorMsg(
          verification?.reason || 
          `Payment could not be verified for UTR "${cleanUtr}". If you just transferred ₹${amount}, please wait 30-60 seconds for your bank's confirmation email and try again.`
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

      // 3. Calculate expiry date
      const premiumUntil = new Date();
      premiumUntil.setMonth(premiumUntil.getMonth() + durationMonths);

      // 4. Record in Firestore
      try {
        const { getFirestore, collection, addDoc, serverTimestamp } = await import('firebase/firestore');
        const db = getFirestore();
        if (db) {
          await addDoc(collection(db, 'upgrade_requests'), {
            userId: currentUser?.uid || 'guest',
            userName: currentUser?.name || verification.payer || 'User',
            userEmail: currentUser?.email || 'unknown',
            plan: 'paid-premium-plan',
            durationMonths,
            amount,
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

      // 5. Send notification to Shaurya
      try {
        await fetch('https://formsubmit.co/ajax/itsshaurya4851@gmail.com', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            _subject: `🎉 Verified LanceBuddy Payment: ₹${amount} from ${verification.payer || 'User'}`,
            User_Name: currentUser?.name || verification.payer || 'User',
            User_Email: currentUser?.email || 'N/A',
            Payer_Name: verification.payer || 'Unknown',
            Plan: `${billingCycle === 'quarterly' ? '3 Months' : '1 Full Year'} (₹${amount})`,
            UPI_UTR: cleanUtr,
            Verification: 'MATCHED_WITH_FAMPAY_EMAIL',
            Submitted_At: new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }),
            Status: 'Verified_Active'
          })
        });
      } catch (mailErr) {
        console.warn('Notification mail error:', mailErr);
      }

      // 6. Activate Pro Plan in AuthContext
      await upgradePlan('paid-premium-plan', premiumUntil, cleanUtr);
      try { localStorage.setItem('lb_premium_active', 'true'); } catch {}

      setSuccess(true);
    } catch (err) {
      console.error('Upgrade submission error:', err);
      setErrorMsg('Something went wrong submitting your verification. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return createPortal(
    <div className="upi-modal-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div
        className="upi-modal-content"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="upi-modal-header">
          <div className="upi-modal-title">
            <i className="ri-vip-crown-fill" style={{ color: 'var(--ink)' }}></i>
            <span>Upgrade to Pro</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="upi-modal-close-btn"
          >
            <i className="ri-close-line"></i>
          </button>
        </div>

        {/* Success View */}
        {success ? (
          <div style={{ padding: '32px 20px', textAlign: 'center' }}>
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
                onClose();
                window.location.reload();
              }}
            >
              Start Scouting Now &rarr;
            </button>
          </div>
        ) : (
          /* Payment Steps View */
          <div className="upi-modal-body">
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
                  <span>Pay via Gateway · ₹{amount}</span>
                </>
              )}
            </button>
            <div style={{ textAlign: 'center', marginTop: '6px', fontSize: '0.72rem', color: 'var(--mute)' }}>
              Instant: GPay, PhonePe, Paytm, Cards &amp; Netbanking
            </div>

            <div className="checkout-divider">
              <span>or direct UPI transfer</span>
            </div>

            {/* QR Code Container */}
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

              {/* 1-Click Mobile UPI App Button */}
              <a
                href={upiIntentUrl}
                className="checkout-intent-btn"
              >
                <i className="ri-smartphone-line"></i>
                <span>Open in UPI App (₹{amount})</span>
              </a>
            </div>

            {/* Step 2: UTR Submission Form */}
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
                  Check your GPay, PhonePe, or Paytm receipt for the 12-digit UTR / Ref No.
                </span>
              </div>

              {errorMsg && (
                <div className="checkout-error">
                  {errorMsg}
                </div>
              )}

              <button
                type="submit"
                disabled={submitting || utr.length !== 12}
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
                    <span>Confirm &amp; Activate (₹{amount})</span>
                  </>
                )}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
};
