import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { preloadRoute } from '../../utils/preloadRoutes';

export const Navbar = () => {
  const { theme, toggleTheme } = useTheme();
  const { currentUser, logout } = useAuth();
  const [profileOpen, setProfileOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const profileRef = useRef(null);
  const moreRef = useRef(null);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setProfileOpen(false);
      }
      if (moreRef.current && !moreRef.current.contains(e.target)) {
        setMoreOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close dropdowns on location changes
  useEffect(() => {
    setProfileOpen(false);
    setMoreOpen(false);
  }, [location.pathname, location.hash]);

  const handleLogout = async () => {
    setProfileOpen(false);
    await logout();
    navigate('/');
  };

  const handleUpgradeClick = (e) => {
    if (e) e.preventDefault();
    setProfileOpen(false);
    setMoreOpen(false);

    const scrollToPricing = () => {
      const el =
        document.getElementById('pricing') ||
        document.getElementById('s3') ||
        document.getElementById('s5');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        return true;
      }
      return false;
    };

    if (location.pathname === '/') {
      scrollToPricing();
    } else {
      navigate('/#pricing');
      setTimeout(scrollToPricing, 120);
      setTimeout(scrollToPricing, 350);
      setTimeout(scrollToPricing, 700);
    }
  };

  const handleNavClick = (path, e) => {
    setMoreOpen(false);
    if (path.startsWith('/#')) {
      const id = path.replace('/#', '');
      if (location.pathname === '/') {
        if (e) e.preventDefault();
        let el = document.getElementById(id);
        if (!el && (id === 'pricing' || id === 's5' || id === 's3')) {
          el = document.getElementById('pricing') || document.getElementById('s3') || document.getElementById('s5');
        }
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }
    } else if (location.pathname === '/') {
      const sectionMap = {
        '/': 's0',
        '/scout': 'scout',
        '/pipeline': 'pipeline',
        '/notes': 'notes',
        '/pricing': 'pricing',
        '/contact': 'contact'
      };
      const targetId = sectionMap[path];
      if (targetId) {
        if (e) e.preventDefault();
        let el = document.getElementById(targetId);
        if (!el && targetId === 'pricing') {
          el = document.getElementById('pricing') || document.getElementById('s3') || document.getElementById('s5');
        }
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        } else if (path === '/') {
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
      }
    }
  };

  const getUserInitials = (user) => {
    if (!user) return 'LB';
    const name = (user.name || '').trim();
    if (!name) {
      const email = (user.email || '').trim();
      return email ? email.slice(0, 2).toUpperCase() : 'U';
    }
    const parts = name.split(/\s+/).filter(Boolean);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  const userInitials = getUserInitials(currentUser);
  const userDisplayName = (currentUser?.name || currentUser?.email?.split('@')[0] || 'ACCOUNT').toUpperCase();
  const isHome = location.pathname === '/';

  return (
    <header className="nav-shell">
      <nav className="nav-container">
        {/* Brand */}
        <Link
          to="/"
          className="nav-brand"
          onClick={(e) => {
            if (isHome) {
              e.preventDefault();
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }
          }}
        >
          <div className="nav-logo">LB</div>
          <span className="nav-name">LanceBuddy</span>
        </Link>

        {/* Center Navigation Links */}
        <div className="nav-links">
          {currentUser ? (
            <>
              <Link
                to="/"
                className={`nav-link ${isHome ? 'active' : ''}`}
                onClick={(e) => {
                  if (isHome) {
                    e.preventDefault();
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }
                }}
              >
                Workspace
              </Link>

              <Link
                to="/scout"
                className={`nav-link ${location.pathname === '/scout' ? 'active' : ''}`}
                onClick={(e) => handleNavClick('/scout', e)}
                onMouseEnter={() => preloadRoute('/scout')}
              >
                Scout Tool
              </Link>

              <Link
                to="/pipeline"
                className={`nav-link ${location.pathname === '/pipeline' ? 'active' : ''}`}
                onClick={(e) => handleNavClick('/pipeline', e)}
                onMouseEnter={() => preloadRoute('/pipeline')}
              >
                Pipeline
              </Link>

              <Link
                to="/notes"
                className={`nav-link ${location.pathname === '/notes' ? 'active' : ''}`}
                onClick={(e) => handleNavClick('/notes', e)}
                onMouseEnter={() => preloadRoute('/notes')}
              >
                Notes
              </Link>
            </>
          ) : (
            <>
              <a
                href="/#s1"
                className="nav-link"
                onClick={(e) => handleNavClick('/#s1', e)}
              >
                Find
              </a>
              <a
                href="/#s2"
                className="nav-link"
                onClick={(e) => handleNavClick('/#s2', e)}
              >
                Verify
              </a>
              <a
                href="/#s3"
                className="nav-link"
                onClick={(e) => handleNavClick('/#s3', e)}
              >
                Write
              </a>
              <a
                href="/#s4"
                className="nav-link"
                onClick={(e) => handleNavClick('/#s4', e)}
              >
                Track
              </a>
            </>
          )}

          {/* More Dropdown */}
          <div className="nav-more-wrapper" ref={moreRef}>
            <button
              type="button"
              className={`nav-link nav-more-trigger ${moreOpen ? 'open' : ''}`}
              onClick={() => setMoreOpen(!moreOpen)}
              aria-expanded={moreOpen}
              aria-label="More options"
            >
              <span>More</span>
              <svg
                className={`nav-more-chevron ${moreOpen ? 'open' : ''}`}
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>

            {moreOpen && (
              <div className="nav-more-dropdown">
                <Link
                  to="/about"
                  className="nav-more-item"
                  onClick={() => setMoreOpen(false)}
                  onMouseEnter={() => preloadRoute('/about')}
                >
                  <div className="nav-more-icon-box">
                    <i className="ri-information-line"></i>
                  </div>
                  <div className="nav-more-text">
                    <span className="nav-more-title">About</span>
                    <span className="nav-more-desc">The story behind LanceBuddy</span>
                  </div>
                </Link>

                <Link
                  to="/blog"
                  className="nav-more-item"
                  onClick={() => setMoreOpen(false)}
                  onMouseEnter={() => preloadRoute('/blog')}
                >
                  <div className="nav-more-icon-box">
                    <i className="ri-bookmark-line"></i>
                  </div>
                  <div className="nav-more-text">
                    <span className="nav-more-title">Blog</span>
                    <span className="nav-more-desc">Guides on leads, outreach and pricing</span>
                  </div>
                </Link>

                <a
                  href="/#contact"
                  className="nav-more-item"
                  onClick={(e) => {
                    setMoreOpen(false);
                    handleNavClick('/#contact', e);
                  }}
                >
                  <div className="nav-more-icon-box">
                    <i className="ri-mail-line"></i>
                  </div>
                  <div className="nav-more-text">
                    <span className="nav-more-title">Contact</span>
                    <span className="nav-more-desc">Talk to the developer</span>
                  </div>
                </a>
              </div>
            )}
          </div>
        </div>

        {/* Right Actions */}
        <div className="nav-actions">
          {/* Upgrade Button */}
          {currentUser?.plan !== 'paid-premium-plan' && (
            <button
              type="button"
              className="nav-upgrade-btn"
              onClick={handleUpgradeClick}
              title="Upgrade to LanceBuddy Premium"
              aria-label="Upgrade to LanceBuddy Premium"
            >
              <svg
                className="nav-upgrade-icon"
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.3"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <line x1="12" y1="2" x2="12" y2="6" />
                <line x1="12" y1="18" x2="12" y2="22" />
                <line x1="4.93" y1="4.93" x2="7.76" y2="7.76" />
                <line x1="16.24" y1="16.24" x2="19.07" y2="19.07" />
                <line x1="2" y1="12" x2="6" y2="12" />
                <line x1="18" y1="12" x2="22" y2="12" />
                <line x1="4.93" y1="19.07" x2="7.76" y2="16.24" />
                <line x1="16.24" y1="7.76" x2="19.07" y2="4.93" />
              </svg>
              <span>Upgrade</span>
            </button>
          )}

          {/* User Profile or Sign In / Up */}
          {currentUser ? (
            <div className="profile-menu-wrapper" ref={profileRef}>
              <button
                type="button"
                className={`nav-profile-pill ${profileOpen ? 'active' : ''}`}
                onClick={() => setProfileOpen(!profileOpen)}
                aria-label="User Profile Menu"
                aria-expanded={profileOpen}
              >
                <div className="nav-profile-avatar">
                  {userInitials}
                </div>
                <span className="nav-profile-name">
                  {userDisplayName}
                </span>
                <i className="ri-arrow-down-s-line nav-profile-chevron"></i>
              </button>

              <div className={`profile-dropdown ${profileOpen ? 'open' : ''}`}>
                <div className="profile-dropdown-header">
                  <div className="profile-avatar">
                    {userInitials}
                  </div>
                  <div className="profile-info">
                    <span className="profile-display-name" style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                      {currentUser.name || 'User'}
                      {currentUser?.plan === 'paid-premium-plan' && (
                        <i className="ri-vip-crown-2-fill" style={{ color: 'var(--ink)', fontSize: '0.85rem' }} title="Premium Member"></i>
                      )}
                    </span>
                    <span className="profile-display-email">{currentUser.email}</span>
                    {currentUser?.plan === 'paid-premium-plan' ? (
                      <span className="profile-display-plan" style={{
                        fontSize: '0.72rem',
                        background: 'var(--ink)',
                        color: 'var(--on)',
                        padding: '2px 9px',
                        borderRadius: '99px',
                        marginTop: '4px',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        fontWeight: '600',
                        fontFamily: '"Geist Mono", monospace'
                      }}>
                        <i className="ri-vip-crown-fill"></i> PRO MEMBER
                      </span>
                    ) : (
                      <span className="profile-display-plan" style={{
                        fontSize: '0.72rem',
                        background: 'var(--surface2)',
                        color: 'var(--muted)',
                        border: '1px solid var(--border-soft)',
                        padding: '2px 9px',
                        borderRadius: '99px',
                        marginTop: '4px',
                        display: 'inline-block',
                        fontWeight: '600',
                        fontFamily: '"Geist Mono", monospace'
                      }}>
                        FREE TIER
                      </span>
                    )}
                  </div>
                </div>

                <div className="profile-dropdown-divider"></div>

                {currentUser?.plan !== 'paid-premium-plan' && (
                  <button
                    type="button"
                    className="profile-dropdown-item"
                    onClick={handleUpgradeClick}
                    style={{
                      color: 'var(--ink)',
                      fontWeight: 600,
                      width: '100%',
                      textAlign: 'left',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}
                  >
                    <i className="ri-vip-crown-line" style={{ color: 'var(--ink)' }}></i>
                    <span>Upgrade to Premium</span>
                  </button>
                )}

                <Link
                  to="/#notes"
                  className="profile-dropdown-item"
                  onClick={(e) => {
                    setProfileOpen(false);
                    handleNavClick('/#notes', e);
                  }}
                >
                  <i className="ri-sticky-note-line"></i>
                  <span>Saved Notes</span>
                </Link>

                <Link
                  to="/help"
                  className="profile-dropdown-item"
                  onClick={() => setProfileOpen(false)}
                >
                  <i className="ri-question-line"></i>
                  <span>Help Center</span>
                </Link>

                <div className="profile-dropdown-divider"></div>

                <button
                  type="button"
                  className="profile-dropdown-item logout-btn"
                  onClick={handleLogout}
                >
                  <i className="ri-logout-box-r-line"></i>
                  <span>Log Out</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="nav-auth-buttons">
              <Link
                to="/login"
                className="nav-signin-link"
                onMouseEnter={() => preloadRoute('/login')}
                onFocus={() => preloadRoute('/login')}
              >
                Sign In
              </Link>
              <Link
                to="/login?mode=signup"
                className="nav-signup-btn"
                onMouseEnter={() => preloadRoute('/login')}
                onFocus={() => preloadRoute('/login')}
              >
                Sign Up
              </Link>
            </div>
          )}

          {/* Theme Toggle */}
          <button
            type="button"
            id="theme-btn"
            onClick={toggleTheme}
            aria-label="Toggle Color Theme"
            title="Toggle Theme"
          >
            {theme === 'dark' ? (
              <i className="ri-sun-line"></i>
            ) : (
              <i className="ri-moon-line"></i>
            )}
          </button>
        </div>
      </nav>
    </header>
  );
};
