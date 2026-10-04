import React, { useState, useEffect } from 'react';
import { ScoutForm } from '../components/scout/ScoutForm';
import { StatsBar } from '../components/scout/StatsBar';
import { FilterBar } from '../components/scout/FilterBar';
import { LeadCard } from '../components/scout/LeadCard';
import { DemoLeadInspector } from '../components/scout/DemoLeadInspector';
import { UpiPaymentModal } from '../components/scout/UpiPaymentModal';
// Code-split below-the-fold and on-demand modal components
const EmailModal = React.lazy(() => import('../components/scout/EmailModal').then(m => ({ default: m.EmailModal })));
const PipelineSection = React.lazy(() => import('../components/pipeline/PipelineSection').then(m => ({ default: m.PipelineSection })));
const NotesSection = React.lazy(() => import('../components/notes/NotesSection').then(m => ({ default: m.NotesSection })));
import { useLeads } from '../context/LeadsContext';
import { useAuth } from '../context/AuthContext';
import { faqData } from '../data/faqData';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { TiltCard } from '../components/layout/TiltCard';
import { motion } from 'framer-motion';
import { SEO } from '../components/common/SEO';

export const HomePage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { leads, currentQuery, exportCSV } = useLeads();
  const { currentUser, upgradePlan } = useAuth();
  const [emailModalOpen, setEmailModalOpen] = useState(false);
  const [selectedLeadForEmail, setSelectedLeadForEmail] = useState(null);
  const [upiModalOpen, setUpiModalOpen] = useState(false);
  const [selectedUpiPlan, setSelectedUpiPlan] = useState('yearly');
  const [userCountry, setUserCountry] = useState(() => {
    try {
      const cached = localStorage.getItem('lb_user_country');
      if (cached) return cached;
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
      if (tz.includes('Calcutta') || tz.includes('Kolkata') || tz.includes('India')) return 'IN';
      return 'IN';
    } catch {
      return 'IN';
    }
  });
  const [billingCycle, setBillingCycle] = useState('yearly'); // 'quarterly' or 'yearly'

  // Restrict access to inner workspace routes if not logged in
  useEffect(() => {
    if (!currentUser) {
      const protectedPaths = ['/scout', '/notes', '/pipeline'];
      if (protectedPaths.includes(location.pathname)) {
        navigate(`/login?redirect=${encodeURIComponent(location.pathname)}`, {
          replace: true,
          state: { message: 'Please sign in or create an account to access the Scouting Workspace.' }
        });
      }
    }
  }, [currentUser, location.pathname, navigate]);

  useEffect(() => {
    // Defer network IP lookup so it NEVER competes with initial page load / LCP
    const timer = setTimeout(() => {
      try {
        const cached = localStorage.getItem('lb_user_country');
        if (cached) return;
      } catch {}

      fetch('https://ipapi.co/json/')
        .then(res => res.json())
        .then(data => {
          if (data && data.country_code) {
            setUserCountry(data.country_code);
            try { localStorage.setItem('lb_user_country', data.country_code); } catch {}
          }
        })
        .catch(() => {});
    }, 4000);

    return () => clearTimeout(timer);
  }, []);

  // Filters state
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [visibleLeadCount, setVisibleLeadCount] = useState(8);

  useEffect(() => {
    setVisibleLeadCount(8);
  }, [searchQuery, statusFilter, priorityFilter, leads]);

  // FAQ accordion state
  const [openFaq, setOpenFaq] = useState(null);

  // Support form state
  const [supportName, setSupportName] = useState('');
  const [supportEmail, setSupportEmail] = useState('');
  const [supportMsg, setSupportMsg] = useState('');
  const [supportStatus, setSupportStatus] = useState('');

  const handleOpenEmail = (lead = null) => {
    if (!currentUser) {
      navigate('/login', { state: { message: 'Please log in to access Email Templates.' } });
      return;
    }
    if (currentUser.plan !== 'paid-premium-plan') {
      alert('Email Templates are an exclusive feature of the Premium Plan. Please upgrade to unlock all high-converting outreach templates!');
      const pricingEl = document.getElementById('pricing');
      if (pricingEl) pricingEl.scrollIntoView({ behavior: 'smooth' });
      return;
    }
    setSelectedLeadForEmail(lead);
    setEmailModalOpen(true);
  };

  const handleExportCSV = () => {
    if (!currentUser) {
      navigate('/login', { state: { message: 'Please log in to export leads to CSV.' } });
      return;
    }
    if (currentUser.plan !== 'paid-premium-plan') {
      alert('CSV Spreadsheet Export is an exclusive feature of the Premium Plan. Please upgrade to download unlimited verified lead records!');
      const pricingEl = document.getElementById('pricing');
      if (pricingEl) pricingEl.scrollIntoView({ behavior: 'smooth' });
      return;
    }
    exportCSV();
  };

  const handleUpgrade = (durationMonths) => {
    if (!currentUser) {
      alert('Please log in or create an account first to purchase the Premium plan.');
      navigate(`/login?redirect=${encodeURIComponent(`/checkout?plan=${durationMonths === 3 ? 'quarterly' : 'yearly'}`)}`);
      return;
    }
    setSelectedUpiPlan(durationMonths === 3 ? 'quarterly' : 'yearly');
    setUpiModalOpen(true);
  };

  const handleSupportSubmit = async (e) => {
    e.preventDefault();
    setSupportStatus('Sending message...');
    try {
      await fetch('https://formsubmit.co/ajax/jakadwangdu@outlook.com', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: supportName,
          email: supportEmail,
          message: supportMsg,
          _subject: 'LanceBuddy Support Inquiry'
        })
      });
      setSupportStatus('Message sent! Shaurya usually replies within 24 hours.');
      setSupportMsg('');
    } catch {
      setSupportStatus('Failed to send. You can also email directly: jakadwangdu@outlook.com');
    }
  };

  // Filter leads
  const safeLeads = Array.isArray(leads) ? leads : [];
  const filteredLeads = safeLeads.filter((lead) => {
    if (!lead) return false;
    const name = (lead.name || '').toLowerCase();
    const phone = (lead.phone || '');
    const snippet = (lead.snippet || '').toLowerCase();
    const q = (searchQuery || '').toLowerCase();

    const matchesSearch =
      !q ||
      name.includes(q) ||
      phone.includes(searchQuery) ||
      snippet.includes(q);

    const matchesStatus = statusFilter === 'all' || lead.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || lead.priority === priorityFilter;

    return matchesSearch && matchesStatus && matchesPriority;
  });

  const displayedLeads = filteredLeads.slice(0, visibleLeadCount);

  return (
    <div className="home-page">
      <SEO
        title="LanceBuddy — Free Local Business Lead Finder & Client Acquisition Tool for Freelancers"
        description="LanceBuddy is the #1 free client acquisition tool for freelancers, solopreneurs, and agencies. Extract verified local businesses, phone numbers, Google Maps listings, cold outreach pitch angles, and track leads in a private CRM pipeline."
        keywords="freelancing tool, client acquisition tool, free local business lead finder, find clients for web design, b2b leads free, local business scraper, cold outreach tool, freelance lead generation, google maps lead extractor, agency lead finder, freelance client finder"
        canonical="https://www.lancebuddy.in/"
        schema={{
          '@context': 'https://schema.org',
          '@graph': [
            {
              '@type': 'WebApplication',
              '@id': 'https://www.lancebuddy.in/#app',
              'name': 'LanceBuddy',
              'url': 'https://www.lancebuddy.in',
              'applicationCategory': 'BusinessApplication',
              'operatingSystem': 'All',
              'description': 'Free local business lead finder and client acquisition tool for freelancers, solopreneurs, and agencies.',
              'offers': {
                '@type': 'Offer',
                'price': '0',
                'priceCurrency': 'INR'
              }
            },
            {
              '@type': 'Organization',
              '@id': 'https://www.lancebuddy.in/#organization',
              'name': 'LanceBuddy',
              'url': 'https://www.lancebuddy.in',
              'logo': 'https://www.lancebuddy.in/Logo.png'
            }
          ]
        }}
      />
      {/* Conditionally Render: Guest Landing Page vs Authenticated Workspace */}
      {!currentUser ? (
        /* ============================================================
           PUBLIC MINIMALIST LANDING PAGE (GUEST VIEW)
           ============================================================ */
        <div className="landing-view">
          {/* Hero */}
          <section className="landing-hero-shell">
            <div className="landing-status-pill">
              <span className="landing-pulse-dot"></span>
              <span>Direct Directory Discovery &bull; 100% In-Browser Privacy</span>
            </div>

            <h1 className="landing-headline">
              Direct local client discovery.
            </h1>

            <p className="landing-subtext">
              Extract verified local businesses with phone numbers, Google Maps listings, and outreach opportunities. Prospect, pitch, and sign clients without paying for stale databases.
            </p>

            <div className="landing-cta-row">
              <Link to="/login?mode=signup" className="landing-primary-btn">
                Start Free Scouting <i className="ri-arrow-right-line"></i>
              </Link>
              <button
                type="button"
                className="landing-secondary-btn"
                onClick={() => {
                  const demoEl = document.getElementById('demo');
                  if (demoEl) demoEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }}
              >
                <i className="ri-terminal-box-line"></i> Inspect Live Demo
              </button>
            </div>

            <div className="landing-trust-strip">
              <span className="landing-trust-item">
                <i className="ri-check-line"></i> 5 Free Monthly Scouts
              </span>
              <span className="landing-trust-item">
                <i className="ri-check-line"></i> Direct Google Maps Links
              </span>
              <span className="landing-trust-item">
                <i className="ri-check-line"></i> 1-Click WhatsApp Verification
              </span>
              <span className="landing-trust-item">
                <i className="ri-check-line"></i> Zero Server-Side Lead Tracking
              </span>
            </div>
          </section>

          {/* Interactive Lead Inspector (Alive & Code-driven, Zero Images) */}
          <DemoLeadInspector />

          {/* Editorial Pillars (Why Freelancers Choose LanceBuddy) */}
          <section className="features-section" id="features" style={{ margin: '4rem 0' }}>
            <motion.div 
              className="sec-hd"
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.5 }}
            >
              <h2>Engineered for Independent Professionals</h2>
              <p>Everything you need to prospect, pitch, and sign clients without intermediary fees.</p>
            </motion.div>

            <motion.div 
              className="feat-grid"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-40px" }}
              variants={{
                visible: { transition: { staggerChildren: 0.12 } },
                hidden: {}
              }}
            >
              <motion.div variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.4 } } }}>
                <TiltCard className="feat-card">
                  <div className="feat-icon"><i className="ri-database-2-line"></i></div>
                  <h3>Direct Public Records</h3>
                  <p>Taps directly into Google Maps, JustDial, IndiaMART, and Sulekha. Every prospect includes an authentic source verification link.</p>
                </TiltCard>
              </motion.div>

              <motion.div variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.4 } } }}>
                <TiltCard className="feat-card">
                  <div className="feat-icon"><i className="ri-shield-check-line"></i></div>
                  <h3>100% Private by Architecture</h3>
                  <p>Your notes, outreach tags, and pipeline statuses reside entirely in your browser's local memory. We never inspect or harvest your pipeline.</p>
                </TiltCard>
              </motion.div>

              <motion.div variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.4 } } }}>
                <TiltCard className="feat-card">
                  <div className="feat-icon"><i className="ri-whatsapp-line"></i></div>
                  <h3>One-Click Outreach</h3>
                  <p>Direct phone dialing, verified WhatsApp links, and tailored pitch formulas written for specific digital gaps.</p>
                </TiltCard>
              </motion.div>
            </motion.div>
          </section>
        </div>
      ) : (
        /* ============================================================
           AUTHENTICATED WORKSPACE VIEW (LOGGED-IN USER)
           ============================================================ */
        <div className="workspace-view">
          {/* Workspace Hero */}
          <div className="hero" id="scout">
            <h1 className="hero-title">
              Scout Local Markets.
            </h1>
            <p className="hero-subtitle">
              Welcome back, {currentUser.name || 'Prospector'}. Enter your target industry and city to extract structured public business leads.
            </p>
          </div>

          {/* Scout Query Form */}
          <ScoutForm />

          {/* Scouted Leads Output */}
          {safeLeads.length > 0 && (
            <div className="leads-out" id="leads-results">
              <div className="leads-hdr">
                <h2 className="leads-title">
                  {safeLeads.length} leads found &mdash; {currentQuery?.biz || 'Businesses'} in {currentQuery?.loc || 'India'}
                </h2>
                <div className="leads-actions">
                  <button
                    type="button"
                    className="leads-btn secondary"
                    onClick={() => handleOpenEmail(safeLeads[0])}
                  >
                    <i className="ri-quill-pen-line"></i> Email Templates
                  </button>
                  <button
                    type="button"
                    className="leads-btn"
                    onClick={handleExportCSV}
                  >
                    <i className="ri-file-download-line"></i> Export CSV
                  </button>
                </div>
              </div>

              <StatsBar />

              <FilterBar
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                statusFilter={statusFilter}
                onStatusChange={setStatusFilter}
                priorityFilter={priorityFilter}
                onPriorityChange={setPriorityFilter}
              />

              <div className="leads-list">
                {displayedLeads.map((lead) => (
                  <LeadCard
                    key={lead.id}
                    lead={lead}
                    onSelectForEmail={handleOpenEmail}
                  />
                ))}

                {visibleLeadCount < filteredLeads.length && (
                  <div style={{ display: 'flex', justifyContent: 'center', marginTop: '1.25rem', marginBottom: '0.5rem' }}>
                    <button
                      type="button"
                      className="leads-btn secondary"
                      onClick={() => setVisibleLeadCount(prev => prev + 10)}
                      style={{ padding: '10px 24px', fontWeight: 700, fontSize: '0.9rem' }}
                    >
                      <i className="ri-arrow-down-s-line"></i> Show More Leads ({filteredLeads.length - visibleLeadCount} remaining)
                    </button>
                  </div>
                )}

                {!filteredLeads.length && (
                  <div className="no-matches">
                    <p>No leads match your current search and filter criteria.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Outreach Pipeline CRM */}
          <React.Suspense fallback={<div style={{ minHeight: '80px' }} />}>
            <PipelineSection onSelectForEmail={handleOpenEmail} />
          </React.Suspense>

          {/* Notes Manager */}
          <React.Suspense fallback={<div style={{ minHeight: '80px' }} />}>
            <NotesSection />
          </React.Suspense>
        </div>
      )}

      {/* Pricing / Plan Options (Hidden only for active Premium Users) */}
      {currentUser?.plan !== 'paid-premium-plan' && (
        <section className="pricing-section" id="pricing">
          <motion.div 
            className="sec-hd"
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ duration: 0.5 }}
          >
            <h2>Transparent, Fair Pricing</h2>
            <p>Start for free or upgrade to Premium for unlimited market scouting, CSV exports, and high-converting email templates.</p>
          </motion.div>

          {/* Billing Cycle Toggle (Apple Segmented Control) */}
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '2.5rem' }}>
            <div className="billing-toggle" style={{
              display: 'inline-flex',
              alignItems: 'center',
              background: 'var(--surface2)',
              borderRadius: 'var(--radius-full)',
              padding: '4px',
              border: '1px solid var(--border-soft)',
              boxShadow: 'var(--shadow-sm)'
            }}>
              <button
                type="button"
                onClick={() => setBillingCycle('quarterly')}
                style={{
                  padding: '8px 20px',
                  borderRadius: 'var(--radius-full)',
                  border: 'none',
                  background: billingCycle === 'quarterly' ? 'var(--btn)' : 'transparent',
                  color: billingCycle === 'quarterly' ? 'var(--btn-text)' : 'var(--muted)',
                  cursor: 'pointer',
                  fontWeight: 650,
                  fontSize: '0.88rem',
                  boxShadow: billingCycle === 'quarterly' ? '0 2px 8px rgba(0,0,0,0.12)' : 'none',
                  transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
                }}
              >
                Quarterly (3 Months)
              </button>
              <button
                type="button"
                onClick={() => setBillingCycle('yearly')}
                style={{
                  padding: '8px 20px',
                  borderRadius: 'var(--radius-full)',
                  border: 'none',
                  background: billingCycle === 'yearly' ? 'var(--btn)' : 'transparent',
                  color: billingCycle === 'yearly' ? 'var(--btn-text)' : 'var(--muted)',
                  cursor: 'pointer',
                  fontWeight: 650,
                  fontSize: '0.88rem',
                  boxShadow: billingCycle === 'yearly' ? '0 2px 8px rgba(0,0,0,0.12)' : 'none',
                  transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
                }}
              >
                Yearly (1 Year) <span style={{ fontSize: '0.72rem', background: 'var(--ink)', color: 'var(--on)', padding: '2px 8px', borderRadius: '99px', marginLeft: '6px', fontWeight: 600 }}>Save ~20%</span>
              </button>
            </div>
          </div>

          {/* 2 Plan Cards: Free & Premium */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: '2rem',
            maxWidth: '960px',
            margin: '0 auto',
            alignItems: 'stretch'
          }}>
            {/* Free Plan Card */}
            <TiltCard className="pricing-card" maxRotation={3} scale={1.01}>
              <div className="pricing-badge" style={{ background: 'color-mix(in srgb, var(--ink) 6%, transparent)', color: 'var(--ink)', border: '1px solid var(--line)', font: '600 0.72rem "Geist Mono", monospace', letterSpacing: '0.06em' }}>
                BASIC FREE TIER
              </div>
              <div className="pricing-cost">
                <span className="currency">₹</span>
                <span className="amount">0</span>
                <span className="period">/ lifetime</span>
              </div>
              <p className="pricing-sub">
                Essential prospecting tools for beginners and freelancers getting started.
              </p>
              <ul className="pricing-features">
                <li><i className="ri-check-line"></i> <span><strong>5 Free Market Scouts</strong> per month</span></li>
                <li><i className="ri-check-line"></i> <span>Direct public directory prospecting (Google Maps, JustDial, IndiaMART)</span></li>
                <li><i className="ri-check-line"></i> <span>Direct source verification links &amp; Google Maps directions</span></li>
                <li><i className="ri-check-line"></i> <span>1-Click WhatsApp outreach links</span></li>
                <li><i className="ri-check-line"></i> <span>In-browser private CRM pipeline (New, Contacted, Converted)</span></li>
                <li><i className="ri-check-line"></i> <span>Local notes saved privately on your device</span></li>
                <li style={{ opacity: 0.5 }}><i className="ri-close-line" style={{ color: 'var(--mute)' }}></i> <span>Instant CSV Spreadsheet Export</span></li>
                <li style={{ opacity: 0.5 }}><i className="ri-close-line" style={{ color: 'var(--mute)' }}></i> <span>Built-in Cold Email Pitch Templates</span></li>
                <li style={{ opacity: 0.5 }}><i className="ri-close-line" style={{ color: 'var(--mute)' }}></i> <span>Automated Market Dossier Email Delivery</span></li>
                <li style={{ opacity: 0.5 }}><i className="ri-close-line" style={{ color: 'var(--mute)' }}></i> <span>Priority 24/7 Developer Support</span></li>
              </ul>
              <div style={{ marginTop: '2rem' }}>
                {currentUser ? (
                  <a href="#scout" className="leads-btn secondary" style={{ display: 'flex', width: '100%', justifyContent: 'center', padding: '12px 20px' }}>
                    Current Active Plan
                  </a>
                ) : (
                  <Link to="/login?mode=signup" className="leads-btn secondary" style={{ display: 'flex', width: '100%', justifyContent: 'center', padding: '12px 20px' }}>
                    Get Started Free
                  </Link>
                )}
              </div>
            </TiltCard>

            {/* Premium Plan Card */}
            <TiltCard className="pricing-card premium" maxRotation={3} scale={1.02}>
              <div className="pricing-badge" style={{ background: 'var(--ink)', color: 'var(--on)', border: '1px solid var(--ink)', font: '600 0.72rem "Geist Mono", monospace', letterSpacing: '0.06em' }}>
                <i className="ri-vip-crown-fill" style={{ marginRight: '4px' }}></i> PRO MEMBER &bull; PREMIUM
              </div>
              <div className="pricing-cost">
                <span className="currency">{userCountry === 'IN' ? '₹' : '$'}</span>
                <span className="amount">
                  {billingCycle === 'yearly' ? (userCountry === 'IN' ? '179' : '15') : (userCountry === 'IN' ? '50' : '5')}
                </span>
                <span className="period">/ {billingCycle === 'yearly' ? '1 full year' : '3 months'}</span>
              </div>
              <p className="pricing-sub">
                Unlock everything you need to scale client outreach with zero limits.
              </p>
              <ul className="pricing-features">
                <li><i className="ri-check-line" style={{ color: 'var(--accent)' }}></i> <span><strong>Unlimited Market Scouting</strong> <span className="feat-sub">(Zero monthly limits)</span></span></li>
                <li><i className="ri-check-line" style={{ color: 'var(--accent)' }}></i> <span><strong>Instant 1-Click CSV Spreadsheet Export</strong> <span className="feat-sub">(Full contact data)</span></span></li>
                <li><i className="ri-check-line" style={{ color: 'var(--accent)' }}></i> <span><strong>High-Converting Cold Email Pitch Templates</strong> <span className="feat-sub">(Full library)</span></span></li>
                <li><i className="ri-check-line" style={{ color: 'var(--accent)' }}></i> <span><strong>Automated Market Dossier Email Delivery</strong> <span className="feat-sub">(Direct to inbox)</span></span></li>
                <li><i className="ri-check-line" style={{ color: 'var(--accent)' }}></i> <span><strong>Global Custom Sector &amp; Niche Generator</strong></span></li>
                <li><i className="ri-check-line" style={{ color: 'var(--accent)' }}></i> <span><strong>Verified Pro Member Badge</strong> on your profile &amp; navbar</span></li>
                <li><i className="ri-check-line" style={{ color: 'var(--accent)' }}></i> <span><strong>Priority 24/7 Direct Developer Support</strong> <span className="feat-sub">(WhatsApp &amp; Email)</span></span></li>
                <li><i className="ri-check-line" style={{ color: 'var(--accent)' }}></i> <span><strong>All Basic Features Included</strong></span></li>
              </ul>
              <div style={{ marginTop: '2rem', position: 'relative', zIndex: 10 }}>
                {!currentUser ? (
                  <>
                    <button
                      type="button"
                      className="leads-btn upgrade-cta-btn"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        navigate(`/login?redirect=${encodeURIComponent(`/checkout?plan=${billingCycle}`)}`);
                      }}
                      style={{
                        width: '100%',
                        padding: '13px 20px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        position: 'relative',
                        zIndex: 20,
                        pointerEvents: 'auto'
                      }}
                    >
                      <i className="ri-login-box-line"></i> Sign In to Upgrade {billingCycle === 'yearly' ? 'Yearly' : 'Quarterly'}
                    </button>
                    <p style={{ fontSize: '11.5px', color: 'var(--muted)', marginTop: '8px', marginBottom: 0, textAlign: 'center' }}>
                      * Account login required before purchasing
                    </p>
                  </>
                ) : (
                  <button
                    type="button"
                    className="leads-btn upgrade-cta-btn"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleUpgrade(billingCycle === 'yearly' ? 12 : 3);
                    }}
                    style={{
                      width: '100%',
                      padding: '13px 20px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      position: 'relative',
                      zIndex: 20,
                      pointerEvents: 'auto'
                    }}
                  >
                    <i className="ri-vip-crown-fill"></i> Upgrade to Premium ({billingCycle === 'yearly' ? (userCountry === 'IN' ? '₹179/yr' : '$15/yr') : (userCountry === 'IN' ? '₹50/3mo' : '$5/3mo')})
                  </button>
                )}
              </div>
            </TiltCard>
          </div>
        </section>
      )}

      {/* FAQ Accordion */}
      <section className="faq-section" id="faq">
        <motion.div 
          className="sec-hd"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-40px" }}
          transition={{ duration: 0.5 }}
        >
          <h2>Frequently Asked Questions</h2>
          <p>Common questions about LanceBuddy, lead accuracy, and privacy.</p>
        </motion.div>

        <motion.div 
          className="faq-grid"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, margin: "-40px" }}
          transition={{ duration: 0.6 }}
        >
          {faqData.map((item, index) => {
            const isOpen = openFaq === index;
            return (
              <div key={index} className={`faq-item ${isOpen ? 'open' : ''}`}>
                <button
                  type="button"
                  className="faq-question"
                  onClick={() => setOpenFaq(isOpen ? null : index)}
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
        </motion.div>
      </section>

      {/* Support & Contact */}
      <section className="support-section" id="contact">
        <motion.div 
          className="sec-hd"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-40px" }}
          transition={{ duration: 0.5 }}
        >
          <h2>Have Questions or Need Help?</h2>
          <p>Get in touch with the developer or send feedback directly.</p>
        </motion.div>

        <motion.div 
          className="sup-grid"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-40px" }}
          transition={{ duration: 0.5 }}
        >
          <div className="sup-info">
            <h3>Direct Contact</h3>
            <p>Reach out anytime with feature suggestions, bug reports, or partnership opportunities.</p>
            <div className="contacts">
              <div className="ci">
                <div className="ci-icon"><i className="ri-mail-line"></i></div>
                <span>jakadwangdu@outlook.com</span>
              </div>
              <div className="ci">
                <div className="ci-icon"><i className="ri-code-s-slash-line"></i></div>
                <span>Maintained by Shaurya Pratap Singh (Jakadwangdu)</span>
              </div>
              <div className="ci">
                <div className="ci-icon"><i className="ri-instagram-line"></i></div>
                <a
                  href="https://www.instagram.com/shaurya__5656"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  @official_jakadwangdu
                </a>
              </div>
            </div>
          </div>

          <form onSubmit={handleSupportSubmit} className="sup-form-card">
            <div className="fg">
              <label>Your Name</label>
              <input
                type="text"
                required
                maxLength={100}
                value={supportName}
                onChange={(e) => setSupportName(e.target.value)}
                placeholder="Your Name"
              />
            </div>

            <div className="fg">
              <label>Your Email</label>
              <input
                type="email"
                required
                maxLength={120}
                value={supportEmail}
                onChange={(e) => setSupportEmail(e.target.value)}
                placeholder="you@domain.com"
              />
            </div>

            <div className="fg">
              <label>Message</label>
              <textarea
                required
                rows={4}
                maxLength={2000}
                value={supportMsg}
                onChange={(e) => setSupportMsg(e.target.value)}
                placeholder="What can we help you with?"
              />
            </div>

            <button type="submit" className="sup-submit">
              <i className="ri-send-plane-line"></i> Send Message
            </button>

            {supportStatus && <div className="sup-status">{supportStatus}</div>}
          </form>
        </motion.div>
      </section>

      {/* Email Generator Modal (Loaded on demand) */}
      {emailModalOpen && (
        <React.Suspense fallback={null}>
          <EmailModal
            isOpen={emailModalOpen}
            onClose={() => setEmailModalOpen(false)}
            selectedLead={selectedLeadForEmail}
          />
        </React.Suspense>
      )}
      {/* Direct UPI Payment Modal */}
      <UpiPaymentModal
        isOpen={upiModalOpen}
        onClose={() => setUpiModalOpen(false)}
        initialPlan={selectedUpiPlan}
      />
    </div>
  );
};
