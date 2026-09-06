import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

export const ConsentNotice = () => {
  const [show, setShow] = useState(false);
  const [showPrefs, setShowPrefs] = useState(false);
  const [analytics, setAnalytics] = useState(true);
  const [ads, setAds] = useState(false);

  useEffect(() => {
    try {
      const consent = localStorage.getItem('lb_consent');
      if (!consent) {
        setShow(true);
      }
    } catch {
      setShow(false);
    }
  }, []);

  const handleAcceptAll = () => {
    try {
      localStorage.setItem('lb_consent', 'accepted');
      localStorage.setItem('lb_cookie_prefs', JSON.stringify({ analytics: true, ads: true }));
    } catch {}
    setShow(false);
  };

  const handleDeclineAll = () => {
    try {
      localStorage.setItem('lb_consent', 'declined');
      localStorage.setItem('lb_cookie_prefs', JSON.stringify({ analytics: false, ads: false }));
    } catch {}
    setShow(false);
  };

  const handleSavePrefs = () => {
    try {
      localStorage.setItem('lb_consent', 'custom');
      localStorage.setItem('lb_cookie_prefs', JSON.stringify({ analytics, ads }));
    } catch {}
    setShow(false);
  };

  if (!show) return null;

  return (
    <div className="site-notice-bar" role="region" aria-label="Privacy and local storage notice">
      <p>
        LanceBuddy uses essential local storage to save your leads, notes, and preferences privately in your browser. We never track or sell personal lead information.{' '}
        <Link to="/cookie-policy">Learn more</Link>
      </p>

      <div className="notice-actions">
        <button type="button" className="notice-btn notice-btn-primary" onClick={handleAcceptAll}>
          Accept All
        </button>
        <button type="button" className="notice-btn" onClick={handleDeclineAll}>
          Decline
        </button>
        <button
          type="button"
          className="notice-btn"
          onClick={() => setShowPrefs(!showPrefs)}
        >
          Preferences
        </button>
      </div>

      {showPrefs && (
        <div className="notice-preferences open">
          <label className="notice-toggle">
            <input
              type="checkbox"
              checked={analytics}
              onChange={(e) => setAnalytics(e.target.checked)}
            />
            <span>Analytics (Anonymous usage metrics)</span>
          </label>
          <label className="notice-toggle">
            <input
              type="checkbox"
              checked={ads}
              onChange={(e) => setAds(e.target.checked)}
            />
            <span>Marketing (Non-personalized recommendations)</span>
          </label>
          <button
            type="button"
            className="notice-btn notice-btn-primary"
            style={{ padding: '6px 14px', fontSize: '12px' }}
            onClick={handleSavePrefs}
          >
            Save Preferences
          </button>
        </div>
      )}
    </div>
  );
};
