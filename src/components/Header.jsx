import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ThemeToggle } from './ThemeToggle';

export const Header = ({ quota = 5 }) => {
  const location = useLocation();
  const { currentUser, logout } = useAuth();
  const isScout = location.pathname === '/scout';

  return (
    <header>
      <Link className="logo" to="/">
        <i></i>LanceBuddy
      </Link>
      <div className="hr">
        {currentUser ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem' }}>
            {isScout && (
              <span className="pill" id="pill">
                {quota} scout{quota === 1 ? '' : 's'} left
              </span>
            )}
            <button
              type="button"
              className="chip"
              onClick={logout}
              title={`Logged in as ${currentUser.email}. Click to sign out.`}
              style={{ fontSize: '.85rem', padding: '.35rem .85rem' }}
            >
              {currentUser.name || currentUser.email?.split('@')[0] || 'Account'} · Sign out
            </button>
          </div>
        ) : (
          <>
            {isScout ? (
              <span className="pill" id="pill">
                {quota} scout{quota === 1 ? '' : 's'} left
              </span>
            ) : (
              <Link className="btn" to="/scout">
                Start free
              </Link>
            )}
            <Link
              className="chip"
              to="/login"
              style={{ fontSize: '.85rem', padding: '.45rem .95rem' }}
            >
              Sign in
            </Link>
          </>
        )}
        <ThemeToggle />
      </div>
    </header>
  );
};
