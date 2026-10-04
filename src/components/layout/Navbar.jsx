import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { preloadRoute } from '../../utils/preloadRoutes';
export const Navbar = () => {
  const { theme, toggleTheme } = useTheme();
  const { currentUser, logout } = useAuth();
  const [profileOpen, setProfileOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const profileRef = useRef(null);

  // Close profile dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    setProfileOpen(false);
    await logout();
    navigate('/');
  };

  const handleNavClick = (path, e) => {
    if (path.startsWith('/#')) {
      const id = path.replace('/#', '');
      if (location.pathname === '/') {
        const el = document.getElementById(id);
        if (el) {
          e.preventDefault();
          el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }
    } else if (location.pathname === '/') {
      const sectionMap = {
        '/': 's0',
        '/scout': 'scout',
        '/pipeline': 'pipeline',
        '/notes': 'notes',
        '/pricing': 's5',
        '/contact': 'contact'
      };
      const targetId = sectionMap[path];
      if (targetId) {
        const el = document.getElementById(targetId);
        if (el) {
          e.preventDefault();
          el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        } else if (path === '/') {
          e.preventDefault();
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
      }
    }
  };

  const navLinks = !currentUser
    ? [
        { name: 'Find', path: '/#s1' },
        { name: 'Verify', path: '/#s2' },
        { name: 'Write', path: '/#s3' },
        { name: 'Track', path: '/#s4' },
        { name: 'Pricing', path: '/#s5' },
        { name: 'Contact', path: '/#contact' },
        { name: 'About', path: '/about' },
        { name: 'Blog', path: '/blog' }
      ]
    : [
        { name: 'Workspace', path: '/' },
        { name: 'Scout Tool', path: '/scout' },
        { name: 'Pipeline', path: '/pipeline' },
        { name: 'Notes', path: '/notes' },
        ...(currentUser?.plan !== 'paid-premium-plan' ? [{ name: 'Upgrade', path: '/#s5' }] : []),
        { name: 'Contact', path: '/#contact' },
        { name: 'About', path: '/about' },
        { name: 'Blog', path: '/blog' }
      ];

  return (
    <header className="nav-shell">
      <nav className="nav-container">
        {/* Brand */}
        <Link
          to="/"
          className="nav-brand"
          onClick={(e) => {
            if (location.pathname === '/') {
              e.preventDefault();
              const el = document.getElementById('s0') || document.body;
              el.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
          }}
        >
          <div className="nav-logo">LB</div>
          <span className="nav-name">LanceBuddy</span>
        </Link>

        {/* Desktop Links */}
        <div className="nav-links">
          {navLinks.map((item) => (
            <Link
              key={item.name}
              to={item.path}
              className={`nav-link ${location.pathname === item.path ? 'active' : ''}`}
              onClick={(e) => handleNavClick(item.path, e)}
              onMouseEnter={() => preloadRoute(item.path)}
              onFocus={() => preloadRoute(item.path)}
            >
              {item.name}
            </Link>
          ))}
        </div>

        {/* Right Actions */}
        <div className="nav-actions">
          {currentUser ? (
            <div className="profile-menu-wrapper" ref={profileRef}>
              <button
                type="button"
                className={`profile-btn ${profileOpen ? 'active' : ''}`}
                onClick={() => setProfileOpen(!profileOpen)}
                aria-label="User Profile Menu"
              >
                <i className="ri-user-3-line"></i>
                <span className="profile-name" style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                  {currentUser.name || 'Account'}
                  {currentUser?.plan === 'paid-premium-plan' && (
                    <i className="ri-vip-crown-2-fill" style={{ color: 'var(--ink)', fontSize: '0.82rem' }} title="Premium Member"></i>
                  )}
                </span>
                <i className="ri-arrow-down-s-line profile-chevron"></i>
              </button>

              <div className={`profile-dropdown ${profileOpen ? 'open' : ''}`}>
                <div className="profile-dropdown-header">
                  <div className="profile-avatar">
                    {(currentUser.name ? currentUser.name[0] : 'U').toUpperCase()}
                  </div>
                  <div className="profile-info">
                    <span className="profile-display-name" style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                      {currentUser.name}
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
                  <Link
                    to="/#pricing"
                    className="profile-dropdown-item"
                    onClick={(e) => {
                      setProfileOpen(false);
                      handleNavClick('/#pricing', e);
                    }}
                    style={{ color: 'var(--ink)', fontWeight: 600 }}
                  >
                    <i className="ri-vip-crown-line" style={{ color: 'var(--ink)' }}></i>
                    <span>Upgrade to Premium</span>
                  </Link>
                )}

                <Link
                  to="/#notes"
                  className="profile-dropdown-item"
                  onClick={() => setProfileOpen(false)}
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
