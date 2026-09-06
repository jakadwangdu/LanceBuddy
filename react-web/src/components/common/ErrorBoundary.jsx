import React from 'react';

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
  }

  handleReset = () => {
    try {
      localStorage.removeItem('lb_leads');
      localStorage.removeItem('lb_saved_notes');
      localStorage.removeItem('lb_last_query');
    } catch {}
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#09090b',
          color: '#ffffff',
          fontFamily: 'Inter, system-ui, sans-serif',
          padding: '24px',
          textAlign: 'center'
        }}>
          <div style={{
            maxWidth: '520px',
            width: '100%',
            background: '#18181b',
            border: '2px solid #ffffff',
            boxShadow: '4px 4px 0px #ffffff',
            padding: '32px 24px',
            borderRadius: '12px'
          }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>⚡</div>
            <h1 style={{ fontSize: '24px', fontWeight: '800', marginBottom: '12px' }}>
              Something went wrong loading LanceBuddy
            </h1>
            <p style={{ color: '#a1a1aa', fontSize: '14px', marginBottom: '24px', lineHeight: '1.6' }}>
              {this.state.error?.message || 'An unexpected rendering error occurred in the browser.'}
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={() => window.location.reload()}
                style={{
                  background: '#ffffff',
                  color: '#000000',
                  border: '2px solid #000000',
                  padding: '10px 20px',
                  fontWeight: '700',
                  borderRadius: '8px',
                  cursor: 'pointer'
                }}
              >
                Reload Page
              </button>
              <button
                type="button"
                onClick={this.handleReset}
                style={{
                  background: '#ef4444',
                  color: '#ffffff',
                  border: '2px solid #ffffff',
                  padding: '10px 20px',
                  fontWeight: '700',
                  borderRadius: '8px',
                  cursor: 'pointer'
                }}
              >
                Clear Cache &amp; Reset
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
