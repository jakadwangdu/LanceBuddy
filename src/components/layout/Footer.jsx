import React from 'react';
import { Link } from 'react-router-dom';
import { preloadRoute } from '../../utils/preloadRoutes';

export const Footer = () => {
  return (
    <footer className="site-footer">
      <div className="footer-container">
        <div className="footer-top">
          <div className="footer-brand">
            <div className="footer-logo">
              <span className="logo-badge">LB</span>
              <span className="brand-name">LanceBuddy</span>
            </div>
            <p className="footer-tagline">
              Empowering freelancers and agencies with zero-cost local business leads, automated email templates, and private in-browser pipelines.
            </p>
          </div>

          <div className="footer-links-grid">
            <div className="footer-col">
              <h3 className="footer-col-title">Platform</h3>
              <Link to="/scout" onMouseEnter={() => preloadRoute('/scout')}>Scout Tool</Link>
              <Link to="/pipeline" onMouseEnter={() => preloadRoute('/pipeline')}>Outreach Pipeline</Link>
              <Link to="/notes" onMouseEnter={() => preloadRoute('/notes')}>Saved Notes</Link>
              <Link to="/pricing" onMouseEnter={() => preloadRoute('/pricing')}>Plans &amp; Pricing</Link>
            </div>

            <div className="footer-col">
              <h3 className="footer-col-title">Resources</h3>
              <Link to="/blog" onMouseEnter={() => preloadRoute('/blog')}>Freelance Blog</Link>
              <Link to="/about" onMouseEnter={() => preloadRoute('/about')}>About Us</Link>
              <Link to="/help" onMouseEnter={() => preloadRoute('/help')}>Help & FAQs</Link>
              <Link to="/contact" onMouseEnter={() => preloadRoute('/contact')}>Support Contact</Link>
            </div>

            <div className="footer-col">
              <h3 className="footer-col-title">Legal</h3>
              <Link to="/privacy-policy" onMouseEnter={() => preloadRoute('/privacy-policy')}>Privacy Policy</Link>
              <Link to="/terms-of-service" onMouseEnter={() => preloadRoute('/terms-of-service')}>Terms of Service</Link>
              <Link to="/cookie-policy" onMouseEnter={() => preloadRoute('/cookie-policy')}>Cookie Policy</Link>
              <Link to="/security" onMouseEnter={() => preloadRoute('/security')}>Security</Link>
            </div>
          </div>
        </div>

        <div className="footer-bottom">
          <p>&copy; {new Date().getFullYear()} LanceBuddy. Built for independent professionals.</p>
          <p>
            Maintained by{' '}
            <a
              href="https://jakadwangdu.github.io/Portfolio"
              target="_blank"
              rel="noopener noreferrer"
            >
              Shaurya Pratap Singh (Jakadwangdu)
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
};
