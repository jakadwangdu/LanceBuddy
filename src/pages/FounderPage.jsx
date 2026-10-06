import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { SEO } from '../components/common/SEO';
import { preloadRoute } from '../utils/preloadRoutes';

export const FounderPage = () => {
  const personSchema = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    '@id': 'https://www.lancebuddy.in/founder#person',
    'name': 'Shaurya Pratap Singh',
    'alternateName': 'Jakadwangdu',
    'jobTitle': 'Founder',
    'worksFor': {
      '@type': 'Organization',
      '@id': 'https://www.lancebuddy.in/#organization',
      'name': 'LanceBuddy',
      'url': 'https://www.lancebuddy.in/'
    },
    'url': 'https://www.lancebuddy.in/founder',
    'sameAs': [
      'https://jakadwangdu.github.io/Portfolio',
      'https://github.com/jakadwangdu',
      'https://www.linkedin.com/in/shaurya-pratap-singh-rajput-47530b409/',
      'https://www.instagram.com/shaurya__5656'
    ]
  };

  return (
    <div className="about-page">
      <SEO
        title="Shaurya Pratap Singh (Jakadwangdu) — Founder of LanceBuddy"
        description="Shaurya Pratap Singh, publicly known as Jakadwangdu, is the founder of LanceBuddy — the free local business lead finder and client acquisition platform."
        canonical="https://www.lancebuddy.in/founder"
        keywords="Shaurya Pratap Singh, Jakadwangdu, LanceBuddy founder, Shaurya Pratap Singh LanceBuddy, Jakadwangdu LanceBuddy, founder of LanceBuddy, freelance platform founder"
        schema={personSchema}
      />

      <motion.div
        className="page-header"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <h1>Shaurya Pratap Singh — Founder of LanceBuddy</h1>
        <p>Engineer, solopreneur, and creator building tools for independent professionals worldwide.</p>
      </motion.div>

      <motion.div
        className="content-card"
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-50px' }}
        transition={{ duration: 0.6, delay: 0.2 }}
      >
        {/* Founder Bio Card */}
        <div className="founder-card" style={{ marginBottom: '32px' }}>
          <div className="founder-img">JW</div>
          <div className="founder-info">
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, margin: '0 0 4px', color: 'var(--text)' }}>
              Shaurya Pratap Singh (Jakadwangdu)
            </h2>
            <div className="founder-role">Founder of LanceBuddy &amp; Full-Stack Engineer</div>
            <p style={{ margin: 0, fontSize: '14px', opacity: 0.88, lineHeight: 1.6 }}>
              Shaurya Pratap Singh, publicly known as <strong>Jakadwangdu</strong>, is the founder of <strong>LanceBuddy</strong>.
              He is a developer and product engineer passionate about building open, accessible software that helps freelancers break free from high platform commissions.
            </p>
            <div className="founder-links">
              <a
                href="https://jakadwangdu.github.io/Portfolio"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Portfolio Website"
                title="Portfolio Website"
              >
                <i className="ri-global-line"></i>
              </a>
              <a
                href="https://github.com/jakadwangdu"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="GitHub Profile"
                title="GitHub Profile"
              >
                <i className="ri-github-fill"></i>
              </a>
              <a
                href="https://www.linkedin.com/in/shaurya-pratap-singh-rajput-47530b409/"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="LinkedIn Profile"
                title="LinkedIn Profile"
              >
                <i className="ri-linkedin-fill"></i>
              </a>
              <a
                href="https://www.instagram.com/shaurya__5656"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram Profile"
                title="Instagram Profile"
              >
                <i className="ri-instagram-line"></i>
              </a>
            </div>
          </div>
        </div>

        <h2>Who is Shaurya Pratap Singh (Jakadwangdu)?</h2>
        <p>
          Shaurya Pratap Singh, publicly known across technical communities by the moniker <strong>Jakadwangdu</strong>, is an Indian software developer, UI/UX craftsman, and the founder of LanceBuddy. Having started as an independent freelancer, Shaurya experienced firsthand the steep hurdles of client acquisition, restrictive bidding systems, and 20% commission cuts imposed by traditional marketplace intermediaries.
        </p>
        <p>
          Driven by the conviction that client discovery should be transparent and accessible to everyone, Shaurya created LanceBuddy as a purpose-built freelancing platform to help freelancers discover opportunities, manage freelance work, connect with clients directly, and grow their independent careers.
        </p>

        <h2>The Vision Behind LanceBuddy</h2>
        <p>
          LanceBuddy was built on a simple philosophy: <strong>independent professionals thrive when they own their relationships</strong>. Traditional platforms lock freelancers behind paid "connects" and arbitrary search rankings. LanceBuddy democratizes client discovery by giving every freelancer access to public commercial registry data, direct verified contact channels, cold outreach email templates, and an in-browser CRM pipeline.
        </p>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '16px',
          margin: '28px 0 32px'
        }}>
          <div style={{
            borderRadius: 'var(--radius-lg)',
            padding: '20px',
            border: '1px solid var(--border)',
            background: 'var(--surface2)',
            boxShadow: 'var(--shadow-sm)'
          }}>
            <div style={{ fontSize: '1.25rem', color: 'var(--ink)', marginBottom: '8px' }}>
              <i className="ri-focus-3-line"></i>
            </div>
            <div style={{ fontSize: '0.95rem', fontWeight: 750, color: 'var(--text)', marginBottom: '6px' }}>
              Direct Client Discovery
            </div>
            <div style={{ fontSize: '0.85rem', color: 'var(--muted)', lineHeight: 1.5 }}>
              Helping freelancers find businesses that actively need web design, SEO, digital marketing, and software engineering.
            </div>
          </div>

          <div style={{
            borderRadius: 'var(--radius-lg)',
            padding: '20px',
            border: '1px solid var(--border)',
            background: 'var(--surface2)',
            boxShadow: 'var(--shadow-sm)'
          }}>
            <div style={{ fontSize: '1.25rem', color: 'var(--ink)', marginBottom: '8px' }}>
              <i className="ri-shield-user-line"></i>
            </div>
            <div style={{ fontSize: '0.95rem', fontWeight: 750, color: 'var(--text)', marginBottom: '6px' }}>
              Zero-Commission Independence
            </div>
            <div style={{ fontSize: '0.85rem', color: 'var(--muted)', lineHeight: 1.5 }}>
              Freelancers keep 100% of their earnings with direct peer-to-peer client contracts and zero platform middleman fees.
            </div>
          </div>
        </div>

        <h2>Contact &amp; Connect with Shaurya</h2>
        <p>
          Shaurya welcomes collaboration, feature feedback, and discussions on freelancing, developer productivity, and entrepreneurship:
        </p>
        <ul style={{ paddingLeft: '1.25rem', lineHeight: 1.8, color: 'var(--text)' }}>
          <li>
            <strong>Email:</strong>{' '}
            <a href="mailto:jakadwangdu@outlook.com" style={{ color: 'var(--ink)', textDecoration: 'underline' }}>
              jakadwangdu@outlook.com
            </a>
          </li>
          <li>
            <strong>Portfolio:</strong>{' '}
            <a
              href="https://jakadwangdu.github.io/Portfolio"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: 'var(--ink)', textDecoration: 'underline' }}
            >
              jakadwangdu.github.io/Portfolio
            </a>
          </li>
          <li>
            <strong>GitHub:</strong>{' '}
            <a
              href="https://github.com/jakadwangdu"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: 'var(--ink)', textDecoration: 'underline' }}
            >
              github.com/jakadwangdu
            </a>
          </li>
          <li>
            <strong>LinkedIn:</strong>{' '}
            <a
              href="https://www.linkedin.com/in/shaurya-pratap-singh-rajput-47530b409/"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: 'var(--ink)', textDecoration: 'underline' }}
            >
              linkedin.com/in/shaurya-pratap-singh-rajput-47530b409
            </a>
          </li>
          <li>
            <strong>Instagram:</strong>{' '}
            <a
              href="https://www.instagram.com/shaurya__5656"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: 'var(--ink)', textDecoration: 'underline' }}
            >
              @shaurya__5656
            </a>
          </li>
        </ul>

        {/* Navigation CTAs */}
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginTop: '36px', paddingTop: '20px', borderTop: '1px solid var(--border)' }}>
          <Link
            to="/"
            className="btn"
            style={{ textDecoration: 'none' }}
            onMouseEnter={() => preloadRoute('/')}
          >
            <i className="ri-compass-3-line" style={{ marginRight: '6px' }}></i> Explore LanceBuddy
          </Link>
          <Link
            to="/about"
            className="btn btn-secondary"
            style={{ textDecoration: 'none' }}
            onMouseEnter={() => preloadRoute('/about')}
          >
            <i className="ri-information-line" style={{ marginRight: '6px' }}></i> About LanceBuddy
          </Link>
          <Link
            to="/blog"
            className="btn btn-secondary"
            style={{ textDecoration: 'none' }}
            onMouseEnter={() => preloadRoute('/blog')}
          >
            <i className="ri-article-line" style={{ marginRight: '6px' }}></i> Freelance Guides
          </Link>
        </div>
      </motion.div>
    </div>
  );
};
