import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

import { HugeCloseIcon } from '../icons/HugeIcons';

export const MoreSheet = ({ isOpen, onClose }) => {
  const { currentUser, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleNavClick = (path, e) => {
    if (path.startsWith('/#')) {
      const id = path.replace('/#', '');
      const el = document.getElementById(id);
      if (el && location.pathname === '/') {
        e.preventDefault();
        onClose();
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      } else {
        onClose();
      }
    } else {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="mobile-more-sheet open" aria-modal="true" role="dialog">
      <div className="more-sheet-backdrop" onClick={onClose}></div>
      <div className="more-sheet-content">
        <div className="more-sheet-handle"></div>
        <div className="more-sheet-header">
          <span className="more-sheet-title">LanceBuddy Menu</span>
          <button
            type="button"
            className="more-sheet-close"
            onClick={onClose}
            aria-label="Close menu"
          >
            <HugeCloseIcon size={18} />
          </button>
        </div>

        <div className="more-sheet-links">
          {currentUser?.plan !== 'paid-premium-plan' && (
            <Link to="/#pricing" onClick={(e) => handleNavClick('/#pricing', e)}>
              <i className="ri-vip-crown-line"></i>
              <span>Plans &amp; Pricing</span>
            </Link>
          )}

          <Link to="/about" onClick={onClose}>
            <i className="ri-information-line"></i>
            <span>About LanceBuddy</span>
          </Link>

          <Link to="/contact" onClick={onClose}>
            <i className="ri-mail-send-line"></i>
            <span>Contact & Feedback</span>
          </Link>

          <Link to="/help" onClick={onClose}>
            <i className="ri-questionnaire-line"></i>
            <span>Help Center & FAQ</span>
          </Link>

          <Link to="/privacy-policy" onClick={onClose}>
            <i className="ri-shield-keyhole-line"></i>
            <span>Privacy Policy</span>
          </Link>

          <Link to="/terms-of-service" onClick={onClose}>
            <i className="ri-file-list-3-line"></i>
            <span>Terms of Service</span>
          </Link>

          <div style={{ height: '1px', background: 'var(--border)', margin: '4px 0', opacity: 0.3 }}></div>

          {currentUser ? (
            <button
              type="button"
              className="profile-dropdown-item logout-btn"
              onClick={async () => {
                onClose();
                await logout();
              }}
              style={{
                color: '#ef4444',
                borderColor: '#ef4444',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '12px 14px',
                borderRadius: '10px',
                background: 'rgba(239, 68, 68, 0.06)'
              }}
            >
              <i className="ri-logout-box-r-line"></i>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                Log Out ({currentUser.name})
                {currentUser?.plan === 'paid-premium-plan' && (
                  <i className="ri-vip-crown-2-fill" style={{ color: '#f59e0b', fontSize: '0.85rem' }} title="Premium Member"></i>
                )}
              </span>
            </button>
          ) : (
            <>
              <Link to="/login" onClick={onClose} className="more-signin-link">
                <i className="ri-login-box-line"></i>
                <span>Sign In</span>
              </Link>
              <Link
                to="/login?mode=signup"
                onClick={onClose}
                className="more-signup-link"
              >
                <i className="ri-user-add-line"></i>
                <span>Sign Up Free</span>
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
