import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { faqData } from '../data/faqData';

export const HelpPage = () => {
  const [search, setSearch] = useState('');
  const [openItem, setOpenItem] = useState(null);

  const guides = [
    {
      title: 'Free Plan vs Premium Plan',
      category: 'Plans & Pricing',
      description: 'Understand what is included in our lifetime Free Plan (5 monthly scouts, CRM) and Premium Plan (unlimited scouts, CSV exports, cold email templates).'
    },
    {
      title: 'How to Scout Your First 50 Leads',
      category: 'Scouting',
      description: 'Step-by-step workflow: selecting high-intent sectors, inputting locations, and verifying Google Maps listings.'
    },
    {
      title: 'Using Built-in Cold Email Templates',
      category: 'Outreach',
      description: 'How to personalize the value pitch, estimate ROI for business owners, and achieve a 15-25% reply rate.'
    },
    {
      title: 'Managing Leads in Your Outreach Pipeline',
      category: 'Pipeline',
      description: 'Moving leads from New to Contacted and Converted, adding call notes, and exporting to CSV.'
    },
    {
      title: 'Privacy & Offline Storage Architecture',
      category: 'Security',
      description: 'Understanding why LanceBuddy never sends your confidential client notes to external databases.'
    }
  ];

  const filteredFaqs = faqData.filter(
    (item) =>
      !search ||
      item.q.toLowerCase().includes(search.toLowerCase()) ||
      item.a.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="help-page">
      <div className="page-header">
        <h1>Help Center &amp; Knowledge Base</h1>
        <p>Everything you need to know about using LanceBuddy, prospecting local markets, and closing deals.</p>
        <div className="help-search-wrap">
          <i className="ri-search-line"></i>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search questions, guides, or keywords..."
          />
        </div>
      </div>

      {/* Plans & Pricing Guarantee Banner */}
      <div className="free-guarantee-banner" style={{
        background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.1), rgba(59, 130, 246, 0.08))',
        border: '1.5px solid rgba(245, 158, 11, 0.3)',
        borderRadius: '16px',
        padding: '24px 20px',
        margin: '24px 0 32px',
        textAlign: 'center'
      }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: '#f59e0b', color: '#000000', fontWeight: 800, fontSize: '0.8rem', padding: '4px 12px', borderRadius: '20px', marginBottom: '12px' }}>
          <i className="ri-vip-crown-fill"></i> FREE &amp; PREMIUM PLANS
        </div>
        <h2 style={{ fontSize: 'clamp(18px, 3.5vw, 24px)', fontWeight: 800, margin: '0 0 8px', color: 'var(--text)' }}>
          Start Free Forever, Upgrade Anytime
        </h2>
        <p style={{ color: 'var(--muted)', fontSize: '0.95rem', lineHeight: 1.6, maxWidth: '680px', margin: '0 auto' }}>
          Enjoy 5 free monthly market searches, private CRM, and direct outreach on the Basic Free Plan. Upgrade to Premium for just ₹50 / 3 months or ₹179 / 1 year to unlock unlimited scouting, 1-click CSV spreadsheet exports, and high-converting cold email pitch templates.
        </p>
      </div>

      {/* Guides Grid */}
      <div className="guides-section">
        <h2>Quick Guides</h2>
        <div className="guides-grid">
          {guides.map((g, i) => (
            <div key={i} className="guide-card">
              <span className="guide-category">{g.category}</span>
              <h3>{g.title}</h3>
              <p>{g.description}</p>
              <Link to="/blog" className="guide-read-link">
                Read guide <i className="ri-arrow-right-line"></i>
              </Link>
            </div>
          ))}
        </div>
      </div>

      {/* FAQs */}
      <div className="faq-section" style={{ marginTop: '40px' }}>
        <h2>Frequently Asked Questions</h2>
        <div className="faq-grid">
          {filteredFaqs.map((item, idx) => {
            const isOpen = openItem === idx;
            return (
              <div key={idx} className={`faq-item ${isOpen ? 'open' : ''}`}>
                <button
                  type="button"
                  className="faq-question"
                  onClick={() => setOpenItem(isOpen ? null : idx)}
                >
                  <span>{item.q}</span>
                  <i className={`ri-arrow-down-s-line ${isOpen ? 'rotate' : ''}`}></i>
                </button>
                {isOpen && (
                  <div className="faq-answer">
                    <p>{item.a}</p>
                  </div>
                )}
              </div>
            );
          })}

          {!filteredFaqs.length && (
            <div className="no-matches">
              <p>No questions matched your search query.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
