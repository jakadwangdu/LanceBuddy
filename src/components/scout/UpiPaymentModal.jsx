import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';

export const UpiPaymentModal = ({ isOpen, onClose, initialPlan = 'yearly' }) => {
  const { currentUser, upgradePlan } = useAuth();
  const [billingCycle, setBillingCycle] = useState(initialPlan); // 'quarterly' or 'yearly'
  const [utr, setUtr] = useState('');
  const [copied, setCopied] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [success, setSuccess] = useState(false);

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

  return (
    <div className="upi-modal-overlay" onClick={onClose} style={{
      position: 'fixed',
      inset: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.72)',
      backdropFilter: 'blur(10px)',
      WebkitBackdropFilter: 'blur(10px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '16px',
      overflowY: 'auto'
    }}>
      <div
        className="upi-modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-xl)',
          maxWidth: '480px',
          width: '100%',
          boxShadow: 'var(--shadow-lg)',
          overflow: 'hidden',
          animation: 'modalSlide 0.25s cubic-bezier(0.16, 1, 0.3, 1)'
        }}
      >
        {/* Header */}
        <div style={{
          padding: '18px 22px',
          borderBottom: '1px solid var(--border-soft)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'var(--surface2)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <i className="ri-vip-crown-fill" style={{ color: '#f59e0b', fontSize: '1.25rem' }}></i>
            <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: 'var(--text)' }}>
              Upgrade to LanceBuddy Pro
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            style={{
              background: 'transparent',
              border: 'none',
              fontSize: '1.25rem',
              color: 'var(--muted)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '4px',
              borderRadius: '50%'
            }}
          >
            <i className="ri-close-line"></i>
          </button>
        </div>

        {/* Success View */}
        {success ? (
          <div style={{ padding: '36px 24px', textAlign: 'center' }}>
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
              Your {billingCycle === 'quarterly' ? '3-Month' : '1-Year'} Premium plan is now active under UTR: <strong>{utr}</strong>. Enjoy unlimited market scouting, cold email templates, and CSV exports!
            </p>
            <button
              type="button"
              className="leads-btn"
              onClick={() => {
                onClose();
                window.location.reload();
              }}
              style={{ width: '100%', padding: '12px 20px', fontWeight: 700 }}
            >
              Start Scouting Now
            </button>
          </div>
        ) : (
          /* Payment Steps View */
          <div style={{ padding: '20px 22px' }}>
            {/* Plan Switcher */}
            <div style={{
              display: 'flex',
              background: 'var(--surface2)',
              borderRadius: 'var(--radius-full)',
              padding: '3px',
              border: '1px solid var(--border-soft)',
              marginBottom: '18px'
            }}>
              <button
                type="button"
                onClick={() => setBillingCycle('quarterly')}
                style={{
                  flex: 1,
                  padding: '7px 12px',
                  borderRadius: 'var(--radius-full)',
                  border: 'none',
                  background: billingCycle === 'quarterly' ? 'var(--btn)' : 'transparent',
                  color: billingCycle === 'quarterly' ? 'var(--btn-text)' : 'var(--muted)',
                  cursor: 'pointer',
                  fontWeight: 700,
                  fontSize: '0.82rem',
                  transition: 'all 0.2s ease'
                }}
              >
                3 Months &bull; ₹50
              </button>
              <button
                type="button"
                onClick={() => setBillingCycle('yearly')}
                style={{
                  flex: 1,
                  padding: '7px 12px',
                  borderRadius: 'var(--radius-full)',
                  border: 'none',
                  background: billingCycle === 'yearly' ? 'var(--btn)' : 'transparent',
                  color: billingCycle === 'yearly' ? 'var(--btn-text)' : 'var(--muted)',
                  cursor: 'pointer',
                  fontWeight: 700,
                  fontSize: '0.82rem',
                  transition: 'all 0.2s ease'
                }}
              >
                1 Year &bull; ₹179 (Save ~40%)
              </button>
            </div>

            {/* QR Code Container */}
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              background: 'var(--surface2)',
              padding: '16px',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--border-soft)',
              marginBottom: '18px'
            }}>
              <div style={{
                background: '#ffffff',
                padding: '10px',
                borderRadius: '12px',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                display: 'inline-block'
              }}>
                <img
                  src="/upi-qr.webp"
                  alt="LanceBuddy Official FamPay UPI QR Code"
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

              {/* 1-Click Mobile UPI App Button */}
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
                <span>Open GPay / PhonePe / Paytm (Pay ₹{amount})</span>
              </a>
            </div>

            {/* Step 2: UTR Submission Form */}
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
                  * Found on your payment receipt in GPay, PhonePe, or Paytm under "UPI Ref No" or "UTR".
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
                disabled={submitting || utr.length !== 12}
                className="leads-btn"
                style={{
                  width: '100%',
                  padding: '12px 18px',
                  fontSize: '0.95rem',
                  fontWeight: 700,
                  cursor: (submitting || utr.length !== 12) ? 'not-allowed' : 'pointer',
                  opacity: (submitting || utr.length !== 12) ? 0.7 : 1
                }}
              >
                {submitting ? (
                  <>
                    <i className="ri-loader-4-line" style={{ animation: 'spin 1s linear infinite' }}></i>
                    <span>Verifying &amp; Activating...</span>
                  </>
                ) : (
                  <>
                    <i className="ri-shield-check-fill"></i>
                    <span>Confirm &amp; Activate Pro Access</span>
                  </>
                )}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
