import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export const MobileDock = ({ onOpenMoreSheet, isMoreOpen }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  const currentPath = location.pathname.toLowerCase();
  const currentHash = location.hash.toLowerCase();

  const isScoutActive = currentPath === '/scout' || currentHash.includes('scout');
  const isNotesActive = currentPath === '/notes' || currentHash.includes('notes');
  const isDemoActive = currentHash.includes('demo');
  const isPricingActive = currentHash.includes('pricing');
  const isBlogActive = currentPath.startsWith('/blog');
  const isHomeActive = !isScoutActive && !isNotesActive && !isDemoActive && !isPricingActive && !isBlogActive && (currentPath === '/' || currentPath === '');

  const handleNav = (targetSection, targetPath = '/') => {
    if (targetSection) {
      if (location.pathname === '/' || location.pathname === `/${targetSection}`) {
        const el = document.getElementById(targetSection);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'start' });
          return;
        }
      }
      navigate(`/${targetSection}`);
    } else {
      navigate(targetPath);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <nav id="mobile-dock" className="mobile-dock" aria-label="Mobile Navigation Dock">
      {/* Home / Workspace */}
      <button
        type="button"
        className={`dock-item ${isHomeActive && !isMoreOpen ? 'active' : ''}`}
        onClick={() => handleNav(null, '/')}
        aria-label={currentUser ? 'Workspace' : 'Home'}
      >
        <i className={isHomeActive && !isMoreOpen ? 'ri-home-5-fill' : 'ri-home-5-line'}></i>
        <span>{currentUser ? 'Workspace' : 'Home'}</span>
      </button>

      {currentUser ? (
        <>
          {/* Scout */}
          <button
            type="button"
            className={`dock-item ${isScoutActive && !isMoreOpen ? 'active' : ''}`}
            onClick={() => handleNav('scout', '/scout')}
            aria-label="Scout Tool"
          >
            <i className={isScoutActive && !isMoreOpen ? 'ri-compass-3-fill' : 'ri-compass-3-line'}></i>
            <span>Scout</span>
          </button>

          {/* Notes */}
          <button
            type="button"
            className={`dock-item ${isNotesActive && !isMoreOpen ? 'active' : ''}`}
            onClick={() => handleNav('notes', '/notes')}
            aria-label="Saved Notes"
          >
            <i className={isNotesActive && !isMoreOpen ? 'ri-sticky-note-fill' : 'ri-sticky-note-line'}></i>
            <span>Notes</span>
          </button>
        </>
      ) : (
        <>
          {/* Live Demo */}
          <button
            type="button"
            className={`dock-item ${isDemoActive && !isMoreOpen ? 'active' : ''}`}
            onClick={() => handleNav('demo', '/#demo')}
            aria-label="Live Demo"
          >
            <i className={isDemoActive && !isMoreOpen ? 'ri-terminal-box-fill' : 'ri-terminal-box-line'}></i>
            <span>Demo</span>
          </button>

          {/* Pricing */}
          <button
            type="button"
            className={`dock-item ${isPricingActive && !isMoreOpen ? 'active' : ''}`}
            onClick={() => handleNav('pricing', '/#pricing')}
            aria-label="Pricing Plans"
          >
            <i className={isPricingActive && !isMoreOpen ? 'ri-vip-crown-2-fill' : 'ri-vip-crown-2-line'}></i>
            <span>Pricing</span>
          </button>
        </>
      )}

      {/* Guest Sign In vs Blog */}
      {!currentUser ? (
        <button
          type="button"
          className="dock-item"
          onClick={() => navigate('/login')}
          aria-label="Sign In"
        >
          <i className="ri-login-box-line"></i>
          <span>Sign In</span>
        </button>
      ) : (
        <button
          type="button"
          className={`dock-item ${isBlogActive && !isMoreOpen ? 'active' : ''}`}
          onClick={() => handleNav(null, '/blog')}
          aria-label="Blog"
        >
          <i className={isBlogActive && !isMoreOpen ? 'ri-article-fill' : 'ri-article-line'}></i>
          <span>Blog</span>
        </button>
      )}

      {/* More Button */}
      <button
        type="button"
        className={`dock-item ${isMoreOpen ? 'active' : ''}`}
        onClick={onOpenMoreSheet}
        aria-label="More Menu"
        id="dock-more-btn"
      >
        <i className={isMoreOpen ? 'ri-more-fill' : 'ri-more-line'}></i>
        <span>More</span>
      </button>
    </nav>
  );
};
