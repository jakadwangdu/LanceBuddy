import React from 'react';

export const AboutPage = () => {
  return (
    <div className="about-page">
      <div className="page-header">
        <h1>About LanceBuddy</h1>
        <p>Built by a freelancer, for freelancers — to solve the hardest part of freelancing: finding clients.</p>
      </div>

      <div className="content-card">
        <h2>The Problem</h2>
        <p>
          Freelancing is freedom — but it comes with a catch. The hardest part isn't doing the work; it's <strong>getting the work</strong>. Most freelancers spend 30-50% of their time chasing leads: cold emailing, scrolling directories, paying for Leadfeeder, Apollo, or Upwork connects, and still coming up empty.
        </p>
        <p>
          I've been there. As a freelance developer, I wasted countless hours and money on tools that promised "qualified leads" but delivered outdated spreadsheets, fake emails, or businesses that didn't need my services.
        </p>

        <h2>The Solution</h2>
        <p>
          LanceBuddy was born from a simple idea: <strong>What if finding local business leads was free, fast, and actually useful?</strong>
        </p>
        <p>
          Instead of paying $50-200/month for databases that gatekeep public information, LanceBuddy taps into public sources — Google Maps, JustDial, IndiaMART, Sulekha, LinkedIn, Facebook — and structures that data for you. Every lead comes with a verified source link so you can check it yourself.
        </p>

        {/* Founder Card */}
        <div className="founder-card">
          <div className="founder-img">JW</div>
          <div className="founder-info">
            <h3>Jakad Wangdu</h3>
            <div className="founder-role">Founder &amp; Developer</div>
            <p style={{ margin: 0, fontSize: '14px', opacity: 0.85, lineHeight: 1.6 }}>
              Freelance full-stack developer turned builder. I write code, design interfaces, and build tools that solve real problems for independent professionals.
            </p>
            <div className="founder-links">
              <a
                href="https://jakadwangdu.github.io/Portfolio"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Portfolio"
                title="Portfolio"
              >
                <i className="ri-global-line"></i>
              </a>
              <a
                href="https://github.com/jakadwangdu"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="GitHub"
                title="GitHub"
              >
                <i className="ri-github-fill"></i>
              </a>
              <a
                href="https://linkedin.com/in/jakadwangdu"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="LinkedIn"
                title="LinkedIn"
              >
                <i className="ri-linkedin-fill"></i>
              </a>
              <a
                href="https://instagram.com/official_jakadwangdu"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram"
                title="Instagram"
              >
                <i className="ri-instagram-line"></i>
              </a>
            </div>
          </div>
        </div>

        {/* Our Values Grid */}
        <h2>Our Values</h2>
        <div className="values-grid">
          <div className="value-card">
            <div className="value-icon">
              <i className="ri-gift-2-line"></i>
            </div>
            <h3>Forever Free</h3>
            <p>No subscriptions, no hidden limits, no premium tiers. All features free for everyone.</p>
          </div>

          <div className="value-card">
            <div className="value-icon">
              <i className="ri-shield-check-line"></i>
            </div>
            <h3>Privacy First</h3>
            <p>Your leads, notes, and pipeline live in your browser. We never see your data.</p>
          </div>

          <div className="value-card">
            <div className="value-icon">
              <i className="ri-links-line"></i>
            </div>
            <h3>Verified Sources</h3>
            <p>Every lead includes a direct link to the original listing. Trust but verify.</p>
          </div>

          <div className="value-card">
            <div className="value-icon">
              <i className="ri-magic-line"></i>
            </div>
            <h3>Built for Freelancers</h3>
            <p>Every feature — email templates, WhatsApp links, CSV export — designed for your workflow.</p>
          </div>

          <div className="value-card">
            <div className="value-icon">
              <i className="ri-code-box-line"></i>
            </div>
            <h3>Open &amp; Transparent</h3>
            <p>Client-side tool. No backend database. What you see is what you get.</p>
          </div>

          <div className="value-card">
            <div className="value-icon">
              <i className="ri-heart-3-line"></i>
            </div>
            <h3>Community Driven</h3>
            <p>Feature requests and bug reports shape the roadmap. Built with your feedback.</p>
          </div>
        </div>

        {/* Journey Timeline */}
        <h2>Journey So Far</h2>
        <div className="timeline">
          <div className="timeline-item">
            <div className="timeline-dot"></div>
            <div className="timeline-content">
              <div className="timeline-date">August 2026</div>
              <h4>LanceBuddy Launched</h4>
              <p>Initial release with lead scouting, pipeline tracking, email templates, and CSV export for Indian markets.</p>
            </div>
          </div>

          <div className="timeline-item">
            <div className="timeline-dot"></div>
            <div className="timeline-content">
              <div className="timeline-date">September 2026</div>
              <h4>Modern React Architecture</h4>
              <p>Upgraded to lightning-fast Vite + React Single Page Application with dynamic theme dock and modular architecture.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
