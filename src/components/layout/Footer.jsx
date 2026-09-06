import React from 'react';
import { Link } from 'react-router-dom';

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
              <h4>Platform</h4>
              <Link to="/#scout">Scout Tool</Link>
              <Link to="/#pipeline">Outreach Pipeline</Link>
              <Link to="/#notes">Saved Notes</Link>
              <Link to="/#pricing">Pledge & Free Tier</Link>
            </div>

            <div className="footer-col">
              <h4>Resources</h4>
              <Link to="/blog">Freelance Blog</Link>
              <Link to="/about">About Us</Link>
              <Link to="/help">Help & FAQs</Link>
              <Link to="/contact">Support Contact</Link>
            </div>

            <div className="footer-col">
              <h4>Legal</h4>
              <Link to="/privacy-policy">Privacy Policy</Link>
              <Link to="/terms-of-service">Terms of Service</Link>
              <Link to="/cookie-policy">Cookie Policy</Link>
              <Link to="/security">Security</Link>
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
              Jakad Wangdu
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
};
