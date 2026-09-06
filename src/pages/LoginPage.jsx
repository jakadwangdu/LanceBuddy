import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation, useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  sendFirebaseVerificationEmail,
  checkEmailVerificationStatus,
  verifyFirebaseActionCode
} from '../services/otpService';

export const LoginPage = () => {
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();
  const {
    currentUser,
    login,
    signup,
    loginWithGoogle,
    sendVerificationEmail,
    checkEmailVerification,
    verifyActionCode
  } = useAuth();

  const isInitialSignUp = location.pathname.includes('signup') || searchParams.get('mode') === 'signup';
  const [mode, setMode] = useState(isInitialSignUp ? 'signup' : 'signin'); // 'signin' or 'signup'
  const [authStep, setAuthStep] = useState('form'); // 'form' or 'verify'
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [actionCodeInput, setActionCodeInput] = useState('');
  const [error, setError] = useState('');
  const [infoMsg, setInfoMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCheckingStatus, setIsCheckingStatus] = useState(false);

  const [resendTimer, setResendTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);

  // Sync mode with route & URL params
  useEffect(() => {
    if (location.pathname.includes('signup') || searchParams.get('mode') === 'signup') {
      setMode('signup');
    } else if (location.pathname.includes('login') && !searchParams.get('mode')) {
      setMode('signin');
    }
  }, [location.pathname, searchParams]);

  // Handle Firebase Verification Link in URL (e.g. ?mode=verifyEmail&oobCode=XYZ)
  useEffect(() => {
    const oobCode = searchParams.get('oobCode');
    const paramMode = searchParams.get('mode');

    if (oobCode && (paramMode === 'verifyEmail' || !paramMode)) {
      setIsSubmitting(true);
      setInfoMsg('Verifying your email with Firebase...');
      verifyFirebaseActionCode(oobCode)
        .then(() => {
          setInfoMsg('🎉 Email verified successfully! Redirecting...');
          setTimeout(() => navigate('/'), 1200);
        })
        .catch((err) => {
          console.error(err);
          setError(err.message || 'Verification link expired or invalid.');
        })
        .finally(() => setIsSubmitting(false));
    }
  }, [searchParams, navigate]);

  // Redirect if already logged in and verified
  useEffect(() => {
    if (currentUser && currentUser.emailVerified && authStep !== 'verify') {
      navigate('/');
    }
  }, [currentUser, navigate, authStep]);

  // Resend Countdown Timer
  useEffect(() => {
    let interval = null;
    if (authStep === 'verify' && resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => {
          if (prev <= 1) {
            setCanResend(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [authStep, resendTimer]);

  // Automatic background polling for email verification detection
  useEffect(() => {
    let pollTimer = null;
    if (authStep === 'verify') {
      pollTimer = setInterval(async () => {
        try {
          const isVerified = await checkEmailVerificationStatus();
          if (isVerified) {
            clearInterval(pollTimer);
            setInfoMsg('🎉 Email verified successfully! Redirecting to dashboard...');
            setTimeout(() => navigate('/'), 1000);
          }
        } catch {}
      }, 3500);
    }
    return () => {
      if (pollTimer) clearInterval(pollTimer);
    };
  }, [authStep, navigate]);

  // Step 1: Handle initial form submit (Sign In or Sign Up via Firebase)
  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setInfoMsg('');
    setIsSubmitting(true);

    try {
      if (mode === 'signup') {
        if (!name.trim()) {
          setError('Please enter your full name.');
          setIsSubmitting(false);
          return;
        }
        if (password.length < 6) {
          setError('Password must be at least 6 characters long.');
          setIsSubmitting(false);
          return;
        }

        // 1. Create account and send Firebase verification email
        await signup(name.trim(), email.trim(), password);

        // 2. Transition to verification screen
        setAuthStep('verify');
        setResendTimer(60);
        setCanResend(false);
        setInfoMsg(`A verification email has been sent by Firebase to ${email.trim()}.`);
      } else {
        // Sign In
        await login(email.trim(), password);
        navigate('/');
      }
    } catch (err) {
      console.error(err);
      let msg = err.message || 'Authentication failed. Please check your credentials.';
      if (msg.includes('auth/invalid-credential') || msg.includes('auth/wrong-password')) {
        msg = 'Invalid email or password.';
      } else if (msg.includes('auth/email-already-in-use')) {
        msg = 'This email is already registered. Please sign in instead.';
      } else if (msg.includes('auth/weak-password')) {
        msg = 'Password should be at least 6 characters.';
      }
      setError(msg);
    }
    setIsSubmitting(false);
  };

  // Manual check for email verification button
  const handleCheckStatus = async () => {
    setError('');
    setIsCheckingStatus(true);
    try {
      const isVerified = await checkEmailVerificationStatus();
      if (isVerified) {
        setInfoMsg('🎉 Email verified! Redirecting to dashboard...');
        setTimeout(() => navigate('/'), 800);
      } else {
        setError('Email not yet verified. Please click the link sent to your inbox, then click Check Status.');
      }
    } catch (err) {
      setError(err.message || 'Failed to check verification status.');
    }
    setIsCheckingStatus(false);
  };

  // Manual code / link entry submit
  const handleVerifyCodeSubmit = async (e) => {
    e.preventDefault();
    if (!actionCodeInput.trim()) {
      setError('Please paste your verification code or link.');
      return;
    }

    setError('');
    setIsSubmitting(true);

    try {
      // Extract oobCode if user pasted full URL
      let code = actionCodeInput.trim();
      if (code.includes('oobCode=')) {
        const match = code.match(/oobCode=([^&]+)/);
        if (match && match[1]) code = match[1];
      }

      await verifyFirebaseActionCode(code);
      setInfoMsg('🎉 Email verified successfully! Redirecting to dashboard...');
      setTimeout(() => navigate('/'), 1000);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Invalid or expired verification code.');
    }
    setIsSubmitting(false);
  };

  // Resend Firebase verification email
  const handleResendEmail = async () => {
    if (!canResend) return;
    setError('');
    setIsSubmitting(true);
    try {
      await sendFirebaseVerificationEmail();
      setResendTimer(60);
      setCanResend(false);
      setInfoMsg(`A fresh verification email was sent by Firebase to ${email.trim()}.`);
    } catch (err) {
      setError(err.message || 'Failed to resend email. Please try again.');
    }
    setIsSubmitting(false);
  };

  // Google OAuth
  const handleGoogleAuth = async () => {
    setError('');
    setIsSubmitting(true);
    try {
      await loginWithGoogle();
      navigate('/');
    } catch (err) {
      console.error(err);
      setError(err.message || 'Google authentication failed.');
    }
    setIsSubmitting(false);
  };

  return (
    <div className="auth-page">
      <div className="auth-wrapper">
        <div className="auth-card">
          {/* Header */}
          <div className="auth-header">
            <div className="logo-icon">LB</div>
            {authStep === 'verify' ? (
              <>
                <h1>Verify Your Email</h1>
                <p>Firebase sent a verification email to complete your registration</p>
              </>
            ) : (
              <>
                <h1>{mode === 'signup' ? 'Create an Account' : 'Welcome Back'}</h1>
                <p>
                  {mode === 'signup'
                    ? 'Join LanceBuddy to save pipeline leads across devices'
                    : 'Sign in to access your saved notes and leads'}
                </p>
              </>
            )}
          </div>

          {/* Form Step: Sign In / Sign Up Toggle */}
          {authStep === 'form' && (
            <div className="auth-toggle">
              <button
                type="button"
                className={`toggle-btn ${mode === 'signin' ? 'active' : ''}`}
                onClick={() => {
                  setMode('signin');
                  setError('');
                  setInfoMsg('');
                }}
              >
                Sign In
              </button>
              <button
                type="button"
                className={`toggle-btn ${mode === 'signup' ? 'active' : ''}`}
                onClick={() => {
                  setMode('signup');
                  setError('');
                  setInfoMsg('');
                }}
              >
                Sign Up
              </button>
              <div className={`toggle-slider ${mode === 'signup' ? 'signup' : ''}`}></div>
            </div>
          )}

          {/* Messages */}
          {error && <div className="auth-error">{error}</div>}
          {infoMsg && <div className="auth-info">{infoMsg}</div>}

          {/* STEP 1: INITIAL CREDENTIALS FORM */}
          {authStep === 'form' && (
            <>
              <form onSubmit={handleFormSubmit} className="auth-form">
                {mode === 'signup' && (
                  <div className="form-group">
                    <label>Full Name</label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Alex Rivera"
                    />
                  </div>
                )}

                <div className="form-group">
                  <label>Email Address</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="alex@domain.com"
                  />
                </div>

                <div className="form-group">
                  <label>Password</label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                  />
                </div>

                <button type="submit" disabled={isSubmitting} className="submit-btn">
                  {isSubmitting ? (
                    <>
                      <i className="ri-loader-4-line ri-spin-anim"></i> Please wait...
                    </>
                  ) : (
                    <>
                      <span>{mode === 'signup' ? 'Create Account & Verify Email' : 'Sign In'}</span>
                      <i className="ri-arrow-right-line btn-icon"></i>
                    </>
                  )}
                </button>
              </form>

              <div className="divider">
                <span>OR</span>
              </div>

              {/* Google Auth Button */}
              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleGoogleAuth}
                className="social-btn"
              >
                <i className="ri-google-fill" style={{ color: '#ea4335' }}></i>
                <span>Continue with Google</span>
              </button>
            </>
          )}

          {/* STEP 2: FIREBASE EMAIL VERIFICATION SCREEN */}
          {authStep === 'verify' && (
            <div className="auth-form otp-form-wrapper">
              <div className="otp-email-badge">
                <i className="ri-mail-line"></i>
                <span className="otp-email-text">{email}</span>
                <button
                  type="button"
                  className="otp-change-email-btn"
                  onClick={() => {
                    setAuthStep('form');
                    setError('');
                    setInfoMsg('');
                  }}
                  title="Change email"
                >
                  <i className="ri-edit-line"></i> Edit
                </button>
              </div>

              {/* Verification Instructions */}
              <div className="verify-instructions-card">
                <div className="verify-icon-wrap">
                  <i className="ri-mail-send-line"></i>
                </div>
                <h3>Check Your Inbox</h3>
                <p>
                  Firebase has dispatched a verification email to <strong>{email}</strong>. Open your email and click the link to activate your account.
                </p>
              </div>

              {/* Primary Action: Check Verification Status */}
              <button
                type="button"
                disabled={isCheckingStatus || isSubmitting}
                onClick={handleCheckStatus}
                className="submit-btn"
              >
                {isCheckingStatus ? (
                  <>
                    <i className="ri-loader-4-line ri-spin-anim"></i> Checking Status...
                  </>
                ) : (
                  <>
                    <span>I've Verified My Email</span>
                    <i className="ri-checkbox-circle-line btn-icon"></i>
                  </>
                )}
              </button>

              {/* Optional Manual Code / Link Paste */}
              <form onSubmit={handleVerifyCodeSubmit} className="verify-code-subform">
                <div className="form-group">
                  <label>Or paste verification code / link</label>
                  <div className="verify-input-group">
                    <input
                      type="text"
                      value={actionCodeInput}
                      onChange={(e) => setActionCodeInput(e.target.value)}
                      placeholder="Paste link or code..."
                      className="verify-manual-input"
                    />
                    <button
                      type="submit"
                      disabled={isSubmitting || !actionCodeInput.trim()}
                      className="verify-apply-btn"
                    >
                      Verify
                    </button>
                  </div>
                </div>
              </form>

              {/* Resend Verification Email Controls */}
              <div className="otp-resend-row">
                {canResend ? (
                  <button
                    type="button"
                    onClick={handleResendEmail}
                    disabled={isSubmitting}
                    className="otp-resend-link active"
                  >
                    <i className="ri-refresh-line"></i> Resend Verification Email
                  </button>
                ) : (
                  <span className="otp-timer-muted">
                    <i className="ri-time-line"></i> Resend email in <strong>{resendTimer}s</strong>
                  </span>
                )}
              </div>

              {/* Back to Form */}
              <button
                type="button"
                className="otp-back-btn"
                onClick={() => {
                  setAuthStep('form');
                  setError('');
                  setInfoMsg('');
                }}
              >
                <i className="ri-arrow-left-line"></i> Back to sign in / sign up
              </button>
            </div>
          )}

          <div className="auth-footer">
            <p>
              By continuing, you agree to LanceBuddy's{' '}
              <Link to="/terms-of-service">Terms of Service</Link> and{' '}
              <Link to="/privacy-policy">Privacy Policy</Link>.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
