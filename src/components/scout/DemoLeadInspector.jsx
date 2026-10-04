import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const DEMO_LEADS = [
  {
    id: 'demo-1',
    name: 'Aura Spatial Architecture',
    category: 'Interior & Architecture',
    city: 'Bengaluru (Indiranagar)',
    phone: '+91 98450 12847',
    rating: 4.9,
    reviews: 84,
    source: 'Google Maps Verified',
    gap: 'No website detected',
    gapType: 'critical',
    pitch: "Hi Team Aura, I noticed your firm has exceptional 4.9★ reviews on Google Maps in Indiranagar, but prospective clients have no direct portfolio link to view your residential work. I drafted a lightweight, modern project gallery prototype if you'd like a quick preview.",
    services: ['Portfolio Website', 'Local SEO', 'Lead Form']
  },
  {
    id: 'demo-2',
    name: 'Zenith Orthodontics & Dental Studio',
    category: 'Specialized Healthcare',
    city: 'Mumbai (Bandra West)',
    phone: '+91 98201 44589',
    rating: 4.8,
    reviews: 142,
    source: 'Maps + JustDial',
    gap: 'No online appointment flow',
    gapType: 'opportunity',
    pitch: "Hi Dr. Mehta, your clinic has stellar patient reviews across Bandra, but your Maps listing directs patients to call a busy reception line. Adding a direct 1-tap WhatsApp consultation scheduler could capture 3x more weekend inquiries. Happy to show you a quick demo.",
    services: ['WhatsApp Scheduler', 'Google Business Sync', 'Speed Audit']
  },
  {
    id: 'demo-3',
    name: 'Artisan Roast & Sourdough Co.',
    category: 'Cafe & Specialty Bakery',
    city: 'New Delhi (Hauz Khas)',
    phone: '+91 98112 77310',
    rating: 4.7,
    reviews: 310,
    source: 'Maps + IndiaMART',
    gap: 'Missing direct catering menu',
    gapType: 'opportunity',
    pitch: "Hello team Artisan Roast, big fan of your sourdough! Noticed you take corporate catering orders solely through manual DM or phone. A clean, branded corporate order page can automate bulk invoicing and save hours every week. Would love to share a 2-minute mock.",
    services: ['Digital Menu', 'Corporate Invoicing', 'Instagram Integration']
  }
];

const STATUS_OPTIONS = ['New Lead', 'Contacted', 'Interested', 'Meeting Set', 'Won'];

export const DemoLeadInspector = () => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [leadStatuses, setLeadStatuses] = useState({
    'demo-1': 'New Lead',
    'demo-2': 'Contacted',
    'demo-3': 'New Lead'
  });
  const [copied, setCopied] = useState(false);
  const [showPitch, setShowPitch] = useState(true);

  const activeLead = DEMO_LEADS[activeIndex];
  const currentStatus = leadStatuses[activeLead.id] || 'New Lead';

  const handleCycleStatus = () => {
    const nextIdx = (STATUS_OPTIONS.indexOf(currentStatus) + 1) % STATUS_OPTIONS.length;
    setLeadStatuses(prev => ({
      ...prev,
      [activeLead.id]: STATUS_OPTIONS[nextIdx]
    }));
  };

  const handleCopyPitch = () => {
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(activeLead.pitch);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Contacted': return { bg: 'color-mix(in srgb, var(--mute) 12%, transparent)', text: 'var(--mute)', border: 'var(--line)' };
      case 'Interested': return { bg: 'color-mix(in srgb, var(--ink) 8%, transparent)', text: 'var(--ink)', border: 'var(--ink)' };
      case 'Meeting Set': return { bg: 'color-mix(in srgb, var(--ink) 12%, transparent)', text: 'var(--ink)', border: 'var(--ink)' };
      case 'Won': return { bg: 'var(--ink)', text: 'var(--on)', border: 'var(--ink)' };
      default: return { bg: 'color-mix(in srgb, var(--ink) 5%, transparent)', text: 'var(--ink)', border: 'var(--line)' };
    }
  };

  const statusStyle = getStatusColor(currentStatus);

  return (
    <div className="demo-inspector-shell" id="demo">
      {/* Header bar */}
      <div className="demo-inspector-topbar">
        <div className="demo-live-badge">
          <span className="demo-dot"></span>
          <span>Interactive Lead Inspector</span>
          <span className="demo-tag">Live Code Demo</span>
        </div>
        <div className="demo-instruction">
          Click tabs or status pill to test in-browser CRM simulation
        </div>
      </div>

      {/* Segmented Industry Picker */}
      <div className="demo-tabs-bar" role="tablist" aria-label="Sample Prospect Niches">
        {DEMO_LEADS.map((lead, idx) => (
          <button
            key={lead.id}
            type="button"
            role="tab"
            aria-selected={activeIndex === idx}
            className={`demo-tab-btn ${activeIndex === idx ? 'active' : ''}`}
            onClick={() => {
              setActiveIndex(idx);
              setCopied(false);
            }}
          >
            <span className="demo-tab-name">{lead.name.split(' ')[0]}</span>
            <span className="demo-tab-meta">{lead.city.split(' ')[0]}</span>
          </button>
        ))}
      </div>

      {/* Lead Card Display */}
      <div className="demo-lead-surface">
        <div className="demo-lead-header">
          <div>
            <div className="demo-lead-category">{activeLead.category} &bull; {activeLead.city}</div>
            <h3 className="demo-lead-title">{activeLead.name}</h3>
          </div>

          <button
            type="button"
            className="demo-status-pill"
            style={{
              backgroundColor: statusStyle.bg,
              color: statusStyle.text,
              borderColor: statusStyle.border
            }}
            onClick={handleCycleStatus}
            title="Click to cycle pipeline status"
          >
            <i className="ri-refresh-line"></i>
            <span>{currentStatus}</span>
          </button>
        </div>

        {/* Metric Badges */}
        <div className="demo-lead-metrics">
          <div className="demo-metric-item">
            <span className="demo-metric-label">Rating</span>
            <span className="demo-metric-val">
              <i className="ri-star-fill"></i> {activeLead.rating} ({activeLead.reviews} reviews)
            </span>
          </div>
          <div className="demo-metric-item">
            <span className="demo-metric-label">Verified Contact</span>
            <span className="demo-metric-val phone">{activeLead.phone}</span>
          </div>
          <div className="demo-metric-item">
            <span className="demo-metric-label">Directory Origin</span>
            <span className="demo-metric-val">{activeLead.source}</span>
          </div>
          <div className="demo-metric-item">
            <span className="demo-metric-label">Detected Opportunity</span>
            <span className="demo-metric-val gap-highlight">
              <i className="ri-error-warning-line"></i> {activeLead.gap}
            </span>
          </div>
        </div>

        {/* Action Bar */}
        <div className="demo-action-bar">
          <div className="demo-left-actions">
            <button
              type="button"
              className={`demo-pitch-toggle ${showPitch ? 'active' : ''}`}
              onClick={() => setShowPitch(!showPitch)}
            >
              <i className="ri-quill-pen-line"></i>
              <span>{showPitch ? 'Hide Outreach Pitch' : 'View Customized Outreach Pitch'}</span>
            </button>
            <span className="demo-hint-text">Simulated one-click actions:</span>
          </div>

          <div className="demo-contact-buttons">
            <a
              href={`tel:${activeLead.phone}`}
              className="demo-btn-secondary"
              onClick={(e) => { e.preventDefault(); alert(`Direct call prompt initiated for: ${activeLead.name} (${activeLead.phone})`); }}
            >
              <i className="ri-phone-line"></i> Call
            </a>
            <button
              type="button"
              className="demo-btn-secondary"
              onClick={() => alert(`WhatsApp outreach link ready with personalized greeting for ${activeLead.name}`)}
            >
              <i className="ri-whatsapp-line"></i> WhatsApp
            </button>
          </div>
        </div>

        {/* Outreach Pitch Panel */}
        {showPitch && (
          <div className="demo-pitch-panel">
            <div className="demo-pitch-header">
              <span className="demo-pitch-label">
                <i className="ri-magic-line"></i> Tailored First Contact Pitch (Pre-formatted)
              </span>
              <button
                type="button"
                className="demo-copy-btn"
                onClick={handleCopyPitch}
              >
                <i className={copied ? "ri-check-line" : "ri-file-copy-line"}></i>
                <span>{copied ? 'Copied to Clipboard' : 'Copy Pitch'}</span>
              </button>
            </div>
            <div className="demo-pitch-body">
              {activeLead.pitch}
            </div>
            <div className="demo-pitch-tags">
              <span className="demo-tag-label">Recommended Upsells:</span>
              {activeLead.services.map((svc) => (
                <span key={svc} className="demo-service-tag">{svc}</span>
              ))}
            </div>
          </div>
        )}

        {/* Bottom Gateway Notice */}
        <div className="demo-footer-bar">
          <div className="demo-footer-text">
            <strong>Ready to scout real companies?</strong> Run live searches across 500+ Indian cities and niche sectors with real-time exports.
          </div>
          <Link to="/login?mode=signup" className="demo-footer-cta">
            Create Free Account <i className="ri-arrow-right-line"></i>
          </Link>
        </div>
      </div>
    </div>
  );
};
