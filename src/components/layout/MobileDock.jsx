import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { preloadRoute } from '../../utils/preloadRoutes';
import {
  HugeHomeIcon,
  HugeCompassIcon,
  HugeNoteIcon,
  HugeTerminalIcon,
  HugeCrownIcon,
  HugeLoginIcon,
  HugeBookIcon,
  HugeMoreIcon
} from '../icons/HugeIcons';

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
  const isHomeActive =
    !isScoutActive &&
    !isNotesActive &&
    !isDemoActive &&
    !isPricingActive &&
    !isBlogActive &&
    (currentPath === '/' || currentPath === '');

  const handleNav = (targetSection, targetPath = '/') => {
    if (targetSection) {
      if (location.pathname === '/' || location.pathname === `/${targetSection}`) {
        let el = document.getElementById(targetSection);
        if (!el && targetSection === 'pricing') {
          el = document.getElementById('pricing') || document.getElementById('s3') || document.getElementById('s5');
        }
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
        <HugeHomeIcon size={20} active={isHomeActive && !isMoreOpen} />
        <span>{currentUser ? 'Workspace' : 'Home'}</span>
      </button>

      {currentUser ? (
        <>
          {/* Scout Tool */}
          <button
            type="button"
            className={`dock-item ${isScoutActive && !isMoreOpen ? 'active' : ''}`}
            onClick={() => handleNav('scout', '/scout')}
            onTouchStart={() => preloadRoute('/scout')}
            onMouseEnter={() => preloadRoute('/scout')}
            aria-label="Scout Tool"
          >
            <HugeCompassIcon size={20} active={isScoutActive && !isMoreOpen} />
            <span>Scout</span>
          </button>

          {/* Notes */}
          <button
            type="button"
            className={`dock-item ${isNotesActive && !isMoreOpen ? 'active' : ''}`}
            onClick={() => handleNav('notes', '/notes')}
            onTouchStart={() => preloadRoute('/notes')}
            onMouseEnter={() => preloadRoute('/notes')}
            aria-label="Saved Notes"
          >
            <HugeNoteIcon size={20} active={isNotesActive && !isMoreOpen} />
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
            <HugeTerminalIcon size={20} active={isDemoActive && !isMoreOpen} />
            <span>Demo</span>
          </button>

          {/* Pricing */}
          <button
            type="button"
            className={`dock-item ${isPricingActive && !isMoreOpen ? 'active' : ''}`}
            onClick={() => handleNav('pricing', '/#pricing')}
            onTouchStart={() => preloadRoute('/pricing')}
            onMouseEnter={() => preloadRoute('/pricing')}
            aria-label="Pricing Plans"
          >
            <HugeCrownIcon size={20} active={isPricingActive && !isMoreOpen} />
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
          onTouchStart={() => preloadRoute('/login')}
          onMouseEnter={() => preloadRoute('/login')}
          aria-label="Sign In"
        >
          <HugeLoginIcon size={20} active={false} />
          <span>Sign In</span>
        </button>
      ) : (
        <button
          type="button"
          className={`dock-item ${isBlogActive && !isMoreOpen ? 'active' : ''}`}
          onClick={() => handleNav(null, '/blog')}
          onTouchStart={() => preloadRoute('/blog')}
          onMouseEnter={() => preloadRoute('/blog')}
          aria-label="Blog"
        >
          <HugeBookIcon size={20} active={isBlogActive && !isMoreOpen} />
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
        <HugeMoreIcon size={20} active={isMoreOpen} />
        <span>More</span>
      </button>
    </nav>
  );
};
