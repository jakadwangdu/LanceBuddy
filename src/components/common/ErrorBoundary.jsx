import React from 'react';
import { Link } from 'react-router-dom';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('LanceBuddy ErrorBoundary caught an error:', error, errorInfo);
    const msg = error?.message || '';
    const isChunkError =
      msg.includes('Failed to fetch dynamically imported module') ||
      msg.includes('dynamically imported module') ||
      msg.includes('error loading dynamically imported module') ||
      msg.includes('Loading chunk') ||
      error?.name === 'ChunkLoadError';

    if (isChunkError && typeof window !== 'undefined') {
      const lastReload = parseInt(sessionStorage.getItem('lb_eb_chunk_reload') || '0', 10);
      const now = Date.now();
      if (now - lastReload > 12000) {
        sessionStorage.setItem('lb_eb_chunk_reload', now.toString());
        window.location.reload();
      }
    }
  }

  handleReset = () => {
    try {
      localStorage.removeItem('lb_leads');
      localStorage.removeItem('lb_saved_notes');
      localStorage.removeItem('lb_last_query');
    } catch {}
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100svh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'var(--bg, #000)',
          color: 'var(--ink, #fff)',
          fontFamily: 'Geist, system-ui, sans-serif',
          padding: '24px',
          textAlign: 'center',
          position: 'relative',
          zIndex: 100
        }}>
          <div style={{
            maxWidth: '480px',
            width: '100%',
            background: 'color-mix(in srgb, var(--bg, #000) 88%, transparent)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            border: '1px solid var(--line, #262626)',
            borderRadius: '24px',
            padding: '3rem 2rem',
            position: 'relative'
          }}>
            <div style={{
              font: '700 5rem "Geist Mono", monospace',
              WebkitTextStroke: '1px var(--line, #262626)',
              color: 'transparent',
              lineHeight: 1,
              marginBottom: '1rem',
              userSelect: 'none'
            }}>
              500
            </div>

            <div style={{
              font: '500 0.72rem "Geist Mono", monospace',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              color: 'var(--mute)',
              marginBottom: '0.6rem'
            }}>
              APPLICATION CLIENT ERROR
            </div>

            <h1 style={{
              fontSize: '1.6rem',
              fontWeight: 700,
              marginBottom: '0.8rem',
              letterSpacing: '-0.03em'
            }}>
              Something Went Wrong.
            </h1>

            <p style={{
              color: 'var(--mute)',
              fontSize: '0.92rem',
              marginBottom: '1.8rem',
              lineHeight: 1.6
            }}>
              {this.state.error?.message || 'An unexpected client-side rendering error occurred in your browser.'}
            </p>

            <div style={{
              display: 'flex',
              gap: '0.6rem',
              justifyContent: 'center',
              flexWrap: 'wrap'
            }}>
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="leads-btn"
                style={{
                  padding: '0.7rem 1.4rem',
                  fontSize: '0.9rem',
                  cursor: 'pointer'
                }}
              >
                Reload Window
              </button>

              <button
                type="button"
                onClick={this.handleReset}
                className="leads-btn secondary"
                style={{
                  padding: '0.7rem 1.4rem',
                  fontSize: '0.9rem',
                  cursor: 'pointer'
                }}
              >
                Reset Local Cache
              </button>
            </div>

            <div style={{ marginTop: '1.6rem' }}>
              <a
                href="/"
                style={{
                  color: 'var(--mute)',
                  fontSize: '0.85rem',
                  textDecoration: 'underline'
                }}
              >
                &larr; Return to Landing Page
              </a>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
