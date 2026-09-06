import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';

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
      const el = document.getElementById(id);
      if (el && (location.pathname === '/' || location.pathname === `/${id}`)) {
        e.preventDefault();
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  };

  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'Scout Tool', path: '/scout' },
    { name: 'About', path: '/about' },
    { name: 'Blog', path: '/blog' },
    { name: 'Contact', path: '/contact' },
    { name: 'Notes', path: '/notes' }
  ];

  return (
    <header className="nav-shell">
      <nav className="nav-container">
        {/* Brand */}
        <Link to="/" className="nav-brand">
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
                <span className="profile-name">{currentUser.name || 'Account'}</span>
                <i className="ri-arrow-down-s-line profile-chevron"></i>
              </button>

              <div className={`profile-dropdown ${profileOpen ? 'open' : ''}`}>
                <div className="profile-dropdown-header">
                  <div className="profile-avatar">
                    {(currentUser.name ? currentUser.name[0] : 'U').toUpperCase()}
                  </div>
                  <div className="profile-info">
                    <span className="profile-display-name">{currentUser.name}</span>
                    <span className="profile-display-email">{currentUser.email}</span>
                  </div>
                </div>

                <div className="profile-dropdown-divider"></div>

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
              <Link to="/login" className="nav-signin-link">
                Sign In
              </Link>
              <Link to="/login?mode=signup" className="nav-signup-btn">
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
