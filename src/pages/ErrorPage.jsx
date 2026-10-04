import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { SEO } from '../components/common/SEO';

const ERROR_CONFIGS = {
  404: {
    code: '404',
    eyebrow: 'HTTP 404 // RESOURCE NOT FOUND',
    title: 'Page Not Found.',
    desc: 'The requested page or directory does not exist, has been renamed, or was moved to another route.',
    actionText: 'Return to Landing Page'
  },
  403: {
    code: '403',
    eyebrow: 'HTTP 403 // ACCESS FORBIDDEN',
    title: 'Permission Denied.',
    desc: 'Your request was understood, but access to this resource is restricted or requires authentication credentials.',
    actionText: 'Return to Landing Page'
  },
  500: {
    code: '500',
    eyebrow: 'HTTP 500 // INTERNAL SERVER ERROR',
    title: 'Server Exception.',
    desc: 'The server encountered an unexpected condition that prevented it from fulfilling the request. Our telemetry has logged this event.',
    actionText: 'Return to Landing Page'
  },
  502: {
    code: '502',
    eyebrow: 'HTTP 502 // BAD GATEWAY',
    title: 'Upstream Error.',
    desc: 'The edge server received an invalid response from an upstream server or directory proxy while attempting to complete the request.',
    actionText: 'Return to Landing Page'
  },
  503: {
    code: '503',
    eyebrow: 'HTTP 503 // SERVICE UNAVAILABLE',
    title: 'Under Maintenance.',
    desc: 'The platform is currently undergoing scheduled infrastructure upgrades or experiencing brief capacity optimization.',
    actionText: 'Return to Landing Page'
  },
  504: {
    code: '504',
    eyebrow: 'HTTP 504 // GATEWAY TIMEOUT',
    title: 'Gateway Timeout.',
    desc: 'The edge server did not receive a timely response from the upstream directory or data provider.',
    actionText: 'Return to Landing Page'
  },
  505: {
    code: '505',
    eyebrow: 'HTTP 505 // VERSION NOT SUPPORTED',
    title: 'HTTP Version Error.',
    desc: 'The server does not support or refuses to support the major HTTP protocol version used in the client request. Modern TLS 1.3 / HTTP/2+ is required.',
    actionText: 'Return to Landing Page'
  },
  525: {
    code: '525',
    eyebrow: 'CLOUDFLARE 525 // SSL HANDSHAKE FAILED',
    title: 'SSL Handshake Failed.',
    desc: 'A secure TLS/SSL handshake negotiation could not be established between the Cloudflare global edge network and the origin server.',
    actionText: 'Return to Landing Page'
  }
};

export const ErrorPage = ({ code: propCode }) => {
  const navigate = useNavigate();
  const location = useLocation();

  // Detect code from prop or URL pathname (e.g. /505, /525, /500)
  const pathCode = parseInt(location.pathname.replace('/', ''), 10);
  const code = propCode || (ERROR_CONFIGS[pathCode] ? pathCode : 404);
  const config = ERROR_CONFIGS[code] || ERROR_CONFIGS[404];

  const [countdown, setCountdown] = useState(8);
  const [isPaused, setIsPaused] = useState(false);
  const [showDiagnostics, setShowDiagnostics] = useState(false);

  useEffect(() => {
    if (isPaused) return;

    if (countdown <= 0) {
      navigate('/', { replace: true });
      return;
    }

    const timer = setInterval(() => {
      setCountdown((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [countdown, isPaused, navigate]);

  return (
    <div className="error-page-container" style={{
      minHeight: '100svh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '6rem 1.5rem 4rem',
      position: 'relative',
      zIndex: 2
    }}>
      <SEO
        title={`${config.code} — ${config.title} | LanceBuddy`}
        description={config.desc}
        noindex={true}
      />

      <div className="content-card error-card" style={{
        maxWidth: '44rem',
        width: '100%',
        margin: '0 auto',
        textAlign: 'center',
        padding: '3rem 2rem',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Outlined Watermark Number */}
        <div style={{
          font: '700 clamp(4.5rem, 15vw, 9rem) "Geist Mono", monospace',
          letterSpacing: '-0.05em',
          lineHeight: 0.9,
          WebkitTextStroke: '1px var(--line)',
          color: 'transparent',
          userSelect: 'none',
          marginBottom: '0.8rem'
        }}>
          {config.code}
        </div>

        {/* Mono Eyebrow */}
        <div className="k" style={{ marginBottom: '0.8rem' }}>
          {config.eyebrow}
        </div>

        {/* Headline */}
        <h1 style={{
          fontSize: 'clamp(2rem, 5vw, 3rem)',
          fontWeight: 700,
          margin: '0 0 1rem',
          color: 'var(--ink)'
        }}>
          {config.title}
        </h1>

        {/* Description */}
        <p className="d" style={{
          color: 'var(--mute)',
          fontSize: '1rem',
          lineHeight: 1.6,
          maxWidth: '32rem',
          margin: '0 auto 1.8rem'
        }}>
          {config.desc}
        </p>

        {/* Auto-Redirect Indicator */}
        <div style={{
          background: 'color-mix(in srgb, var(--ink) 4%, transparent)',
          border: '1px solid var(--line)',
          borderRadius: '99px',
          padding: '8px 18px',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '12px',
          marginBottom: '2rem',
          fontSize: '0.85rem'
        }}>
          <span style={{ color: 'var(--mute)' }}>
            Redirecting to landing page in <strong style={{ color: 'var(--ink)', fontFamily: '"Geist Mono", monospace' }}>{countdown}s</strong>
          </span>
          <button
            type="button"
            onClick={() => setIsPaused(!isPaused)}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--ink)',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '0.8rem',
              textDecoration: 'underline',
              padding: 0
            }}
          >
            {isPaused ? 'Resume' : 'Pause'}
          </button>
        </div>

        {/* Action Buttons */}
        <div style={{
          display: 'flex',
          gap: '0.8rem',
          justifyContent: 'center',
          flexWrap: 'wrap',
          marginBottom: '2rem'
        }}>
          <Link to="/" className="leads-btn" style={{ minWidth: '180px' }}>
            <i className="ri-home-5-line"></i> {config.actionText}
          </Link>
          <button
            type="button"
            className="leads-btn secondary"
            onClick={() => window.location.reload()}
          >
            <i className="ri-refresh-line"></i> Retry Connection
          </button>
          <Link to="/status" className="leads-btn secondary">
            <i className="ri-pulse-line"></i> System Status
          </Link>
        </div>

        {/* Technical Diagnostics Toggle */}
        <div style={{ borderTop: '1px solid var(--line)', paddingTop: '1.2rem', marginTop: '1rem' }}>
          <button
            type="button"
            onClick={() => setShowDiagnostics(!showDiagnostics)}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--mute)',
              fontSize: '0.75rem',
              fontFamily: '"Geist Mono", monospace',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              textTransform: 'uppercase',
              letterSpacing: '0.06em'
            }}
          >
            <span>{showDiagnostics ? 'Hide System Diagnostics' : 'Show System Diagnostics'}</span>
            <i className={`ri-arrow-${showDiagnostics ? 'up' : 'down'}-s-line`}></i>
          </button>

          {showDiagnostics && (
            <div style={{
              marginTop: '1rem',
              padding: '1rem',
              borderRadius: '14px',
              background: 'color-mix(in srgb, var(--bg) 95%, transparent)',
              border: '1px solid var(--line)',
              textAlign: 'left',
              font: '500 0.75rem "Geist Mono", monospace',
              color: 'var(--mute)',
              lineHeight: 1.7
            }}>
              <div>STATUS_CODE: {config.code}</div>
              <div>EDGE_SERVER: Cloudflare Pages / V8 Worker</div>
              <div>PROTOCOL: HTTP/2 + TLS 1.3</div>
              <div>CLIENT_TIMESTAMP: {new Date().toISOString()}</div>
              <div>PATH: {location.pathname}</div>
              <div>REGION: Global Edge Network</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
