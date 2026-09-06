import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

export const MobileDock = ({ onOpenMoreSheet, isMoreOpen }) => {
  const location = useLocation();
  const navigate = useNavigate();

  const currentPath = location.pathname.toLowerCase();
  const currentHash = location.hash.toLowerCase();

  const isScoutActive = currentPath === '/scout' || currentHash.includes('scout');
  const isNotesActive = currentPath === '/notes' || currentHash.includes('notes');
  const isBlogActive = currentPath.startsWith('/blog');
  const isHomeActive = !isScoutActive && !isNotesActive && !isBlogActive && (currentPath === '/' || currentPath === '');

  const handleNav = (targetSection, targetPath = '/') => {
    if (targetSection) {
      if (location.pathname === `/${targetSection}`) {
        const el = document.getElementById(targetSection);
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      } else {
        navigate(`/${targetSection}`);
      }
    } else {
      navigate(targetPath);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <nav id="mobile-dock" className="mobile-dock" aria-label="Mobile Navigation Dock">
      {/* Home */}
      <button
        type="button"
        className={`dock-item ${isHomeActive && !isMoreOpen ? 'active' : ''}`}
        onClick={() => handleNav(null, '/')}
        aria-label="Home"
      >
        <i className={isHomeActive && !isMoreOpen ? 'ri-home-5-fill' : 'ri-home-5-line'}></i>
        <span>Home</span>
      </button>

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

      {/* Blog */}
      <button
        type="button"
        className={`dock-item ${isBlogActive && !isMoreOpen ? 'active' : ''}`}
        onClick={() => handleNav(null, '/blog')}
        aria-label="Blog"
      >
        <i className={isBlogActive && !isMoreOpen ? 'ri-article-fill' : 'ri-article-line'}></i>
        <span>Blog</span>
      </button>

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
