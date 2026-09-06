import React from 'react';
import { Link } from 'react-router-dom';

export const NotFoundPage = () => {
  return (
    <div className="not-found-page">
      <div className="content-card not-found-card">
        <div className="error-badge">404</div>
        <h1>Page Not Found</h1>
        <p>The page or resource you are looking for has been moved or does not exist.</p>
        <Link to="/" className="leads-btn">
          <i className="ri-home-5-line"></i> Back to Homepage
        </Link>
      </div>
    </div>
  );
};
