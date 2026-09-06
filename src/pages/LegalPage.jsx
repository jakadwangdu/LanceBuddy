import React from 'react';
import { useLocation, Link } from 'react-router-dom';

export const LegalPage = () => {
  const location = useLocation();
  const path = location.pathname;

  let title = 'Privacy Policy';
  let date = 'Updated August 2026';
  let content = null;

  if (path.includes('terms')) {
    title = 'Terms of Service';
    content = (
      <>
        <p>Welcome to LanceBuddy. By using our website and lead scouting tools, you agree to these terms.</p>
        <h2>1. Permitted Use</h2>
        <p>LanceBuddy is designed to help independent professionals, freelancers, and small agencies discover publicly available local business information for direct B2B outreach.</p>
        <h2>2. Data Sources &amp; Accuracy</h2>
        <p>LanceBuddy references publicly indexed business listings from third-party services including Google Maps, JustDial, and directory indices. We do not guarantee continuous availability or complete accuracy of third-party public listings.</p>
        <h2>3. Local Storage &amp; Privacy</h2>
        <p>Your notes and outreach pipeline are kept on your local device. You are responsible for exporting or backing up your data if you clear your browser storage.</p>
        <h2>4. Fair Outreach Practices</h2>
        <p>Users are expected to conduct respectful, professional outreach that complies with applicable local communication guidelines and anti-spam legislation.</p>
      </>
    );
  } else if (path.includes('cookie')) {
    title = 'Cookie Policy';
    content = (
      <>
        <p>LanceBuddy values your privacy and uses minimal, strictly necessary client-side storage to deliver core functionality.</p>
        <h2>What We Store</h2>
        <ul>
          <li><strong>Theme Preference (lb_theme):</strong> Remembers whether you prefer Light or Dark mode.</li>
          <li><strong>Lead Records (lb_leads):</strong> Keeps your scouted leads in memory so you don't lose them when navigating between pages.</li>
          <li><strong>Notes (lb_saved_notes):</strong> Stores the custom notes you write on individual leads.</li>
          <li><strong>Cookie Consent (lb_consent):</strong> Remembers your consent preferences.</li>
        </ul>
        <h2>No Third-Party Advertising Trackers</h2>
        <p>We do not use invasive cross-site advertising pixels or sell your browsing history to data brokers.</p>
      </>
    );
  } else if (path.includes('security')) {
    title = 'Security & Architecture';
    content = (
      <>
        <p>LanceBuddy was designed from the ground up with a client-first privacy architecture.</p>
        <h2>1. Client-Side Processing</h2>
        <p>Your search queries and saved pipelines are processed locally in your web browser. There is no centralized database accumulating personal prospect notes.</p>
        <h2>2. Secure Authentication</h2>
        <p>User sessions and account logins are secured by Google Firebase Authentication using industry-standard OAuth 2.0 and encrypted tokens.</p>
        <h2>3. HTTPS by Default</h2>
        <p>All traffic between your browser and LanceBuddy is encrypted using Transport Layer Security (TLS 1.3 / HTTPS).</p>
      </>
    );
  } else {
    // Privacy Policy default
    content = (
      <>
        <p>Your privacy is fundamentally important to us. This Privacy Policy explains how LanceBuddy handles data.</p>
        <h2>1. Information We Do Not Collect</h2>
        <p>We do not collect, store, or sell the names, phone numbers, or private notes of the leads you prospect. All pipeline data lives in your browser's localStorage.</p>
        <h2>2. Account Information</h2>
        <p>If you create an optional account or sign in with Google, Firebase securely stores your email and display name solely to identify your session.</p>
        <h2>3. Third-Party Links</h2>
        <p>Lead listings contain direct links to Google Maps, JustDial, WhatsApp, and social networks. When you visit these external platforms, their respective privacy policies apply.</p>
        <h2>4. Contacting Us</h2>
        <p>If you have any questions about this privacy policy, please contact <a href="mailto:jakadwangdu@outlook.com">jakadwangdu@outlook.com</a>.</p>
      </>
    );
  }

  return (
    <div className="legal-page">
      <div className="page-header">
        <h1>{title}</h1>
        <p>{date}</p>
      </div>

      <div className="content-card legal-card">
        {content}

        <div style={{ marginTop: '30px', paddingTop: '20px', borderTop: '1px solid var(--border-soft)' }}>
          <Link to="/" className="leads-btn secondary">
            <i className="ri-arrow-left-line"></i> Return to Homepage
          </Link>
        </div>
      </div>
    </div>
  );
};
