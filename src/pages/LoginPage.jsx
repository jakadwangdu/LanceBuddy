import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation, useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { SEO } from '../components/common/SEO';
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
    verifyActionCode,
    resetPassword
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
      const redirect = searchParams.get('redirect');
      if (redirect) {
        navigate(redirect.startsWith('/') ? redirect : `/${redirect}`);
      } else {
        navigate('/');
      }
    }
  }, [currentUser, navigate, authStep, searchParams]);

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
      let msg = err?.message || 'Authentication failed. Please check your credentials.';
      if (msg.includes('auth/invalid-credential') || msg.includes('auth/wrong-password')) {
        msg = 'Invalid email or password. Please verify your credentials or click "Forgot Password?" below.';
      } else if (msg.includes('auth/email-already-in-use')) {
        msg = 'This email is already registered. Switched to Sign In — please enter your password.';
        setMode('signin');
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

  const handleForgotPassword = async () => {
    if (!email) {
      setError('Please enter your email address first to reset your password.');
      return;
    }
    setError('');
    setInfoMsg('');
    setIsSubmitting(true);
    try {
      await resetPassword(email);
      setInfoMsg('Password reset link sent! Check your inbox.');
    } catch (err) {
      if (err.code === 'auth/user-not-found') {
        setError('No account found with this email.');
      } else {
        setError('Failed to send reset email. ' + err.message);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Google OAuth
  const handleGoogleAuth = async () => {
    setError('');
    setIsSubmitting(true);
    try {
      await loginWithGoogle();
      const redirect = searchParams.get('redirect');
      if (redirect) {
        navigate(redirect.startsWith('/') ? redirect : `/${redirect}`);
      } else {
        navigate('/');
      }
    } catch (err) {
      if (err?.code !== 'auth/popup-closed-by-user' && err?.message?.indexOf('popup-closed-by-user') === -1) {
        console.error(err);
        setError(err.message || 'Google authentication failed.');
      }
    }
    setIsSubmitting(false);
  };

  return (
    <div className="auth-page">
      <SEO
        title={mode === 'signup' ? 'Create an Account — LanceBuddy' : 'Sign In — LanceBuddy'}
        description="Sign in or create an account on LanceBuddy to manage your freelance leads and outreach pipeline."
        noindex={true}
        canonical="https://lancebuddy.in/login"
      />
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
                    <label htmlFor="fullName">Full Name</label>
                    <input
                      id="fullName"
                      name="fullName"
                      type="text"
                      required
                      autoComplete="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Alex Rivera"
                    />
                  </div>
                )}

                <div className="form-group">
                  <label htmlFor="authEmail">Email Address</label>
                  <input
                    id="authEmail"
                    name="email"
                    type="email"
                    required
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="alex@domain.com"
                  />
                </div>

                <div className="form-group">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <label htmlFor="authPassword" style={{ margin: 0 }}>Password</label>
                    {mode === 'signin' && (
                      <button
                        type="button"
                        onClick={handleForgotPassword}
                        disabled={isSubmitting}
                        aria-label="Reset forgotten password"
                        style={{ background: 'transparent', border: 'none', color: 'var(--text)', textDecoration: 'underline', fontSize: '0.8rem', cursor: 'pointer', padding: 0 }}
                      >
                        Forgot Password?
                      </button>
                    )}
                  </div>
                  <input
                    id="authPassword"
                    name="password"
                    type="password"
                    required
                    minLength={6}
                    autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                  />
                </div>

                <button type="submit" disabled={isSubmitting} className="btn submit-btn" style={{ width: '100%', justifyContent: 'center', marginTop: '1.2rem' }}>
                  {isSubmitting ? (
                    <>
                      <i className="ri-loader-4-line ri-spin-anim"></i> Please wait...
                    </>
                  ) : (
                    <>
                      <span>{mode === 'signup' ? 'Create Account & Verify Email' : 'Sign In'}</span>
                      <svg className="i" viewBox="0 0 24 24">
                        <path d="M5 12h14M13 6l6 6-6 6" />
                      </svg>
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
                className="btn ghost social-btn"
                style={{ width: '100%', justifyContent: 'center' }}
                aria-label="Continue with Google authentication"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" style={{ flexShrink: 0 }}>
                  <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z" />
                  <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z" />
                  <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.17 0 9.99 0 12s.45 3.83 1.25 5.42l4.03-3.15z" />
                  <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z" />
                </svg>
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
                  aria-label="Change email address"
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
                className="btn submit-btn"
                style={{ width: '100%', justifyContent: 'center' }}
                aria-label="Check if email was verified"
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
                  <label htmlFor="verifyCodeInput">Or paste verification code / link</label>
                  <div className="verify-input-group">
                    <input
                      id="verifyCodeInput"
                      name="verifyCode"
                      type="text"
                      value={actionCodeInput}
                      onChange={(e) => setActionCodeInput(e.target.value)}
                      placeholder="Paste link or code..."
                      className="verify-manual-input"
                    />
                    <button
                      type="submit"
                      disabled={isSubmitting || !actionCodeInput.trim()}
                      className="btn verify-apply-btn"
                      aria-label="Submit verification code"
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
