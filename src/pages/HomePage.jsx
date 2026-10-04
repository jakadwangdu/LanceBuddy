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
import { useSite } from '../context/SiteContext';
import { CITIES } from '../data/cities';
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

  const { setSelectedCityIndex, triggerShock } = useSite();
  const [selectedCityIdx, setSelectedCityIdx] = useState(0);

  const handleCitySelect = (idx) => {
    setSelectedCityIdx(idx);
    setSelectedCityIndex(idx);
    triggerShock();
  };

  // Typewriter state for s3 Write
  const FULL_PITCH = "Hi Team Aura, I noticed your firm has exceptional 4.9★ reviews on Google Maps in Indiranagar, but prospective clients have no direct portfolio link. I drafted a lightweight project gallery prototype if you'd like a quick preview.";
  const [typedText, setTypedText] = useState(FULL_PITCH);
  const [isTyping, setIsTyping] = useState(false);

  const runTypewriter = () => {
    if (isTyping) return;
    setIsTyping(true);
    setTypedText('');
    let i = 0;
    const interval = setInterval(() => {
      i++;
      setTypedText(FULL_PITCH.slice(0, i));
      if (i >= FULL_PITCH.length) {
        clearInterval(interval);
        setIsTyping(false);
      }
    }, 18);
  };

  useEffect(() => {
    if (typeof window === 'undefined' || !('IntersectionObserver' in window)) return;
    const el = document.getElementById('pitch');
    if (!el) return;
    let done = false;
    const obs = new IntersectionObserver((entries) => {
      if (done || !entries[0].isIntersecting) return;
      done = true;
      obs.disconnect();
      runTypewriter();
    }, { threshold: 0.5 });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  // Interactive Kanban state for s4 Track
  const [kanbanTickets, setKanbanTickets] = useState([
    { id: 't1', name: 'Aura Spatial', col: 'new' },
    { id: 't2', name: 'Kashi Dental', col: 'new' },
    { id: 't3', name: 'Ganga Smile', col: 'contacted' },
    { id: 't4', name: 'Shree Dental', col: 'converted' }
  ]);

  const handleTicketClick = (id) => {
    const cycle = { new: 'contacted', contacted: 'converted', converted: 'new' };
    setKanbanTickets(prev => prev.map(t => t.id === id ? { ...t, col: cycle[t.col] } : t));
  };

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
           PUBLIC EDITORIAL IMMERSIVE LANDING PAGE (GUEST VIEW)
           ============================================================ */
        <div className="landing-view">
          {/* s0 / Hero */}
          <section className="sc c hero" id="s0">
            <div className="in">
              <p className="k">Free local lead finder for India</p>
              <h1>Direct local client discovery.</h1>
              <p className="d">Verified businesses, real phone numbers and Maps listings. Your next client, found in seconds.</p>
              <div className="row">
                <Link className="btn" to="/login?mode=signup">
                  Start free scouting <svg className="i" viewBox="0 0 24 24"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
                </Link>
                <a
                  className="btn ghost"
                  href="#s1"
                  onClick={(e) => {
                    e.preventDefault();
                    document.getElementById('s1')?.scrollIntoView({ behavior: 'smooth' });
                  }}
                >
                  Explore
                </a>
              </div>
            </div>
            <div className="cue">Scroll</div>
          </section>

          {/* s1 / Find */}
          <section className="sc" id="s1" data-n="01">
            <div id="features" style={{ position: 'absolute', top: 0 }} />
            <div className="in rv">
              <p className="k">01 / Find</p>
              <h2>Find.</h2>
              <p className="d">Pick a city and LanceBuddy returns real local businesses. Tap a city to turn the globe.</p>
              <div className="chips" id="cities">
                {CITIES.map((city, idx) => (
                  <button
                    key={city.name}
                    type="button"
                    className={`chip ${selectedCityIdx === idx ? 'on' : ''}`}
                    onClick={() => handleCitySelect(idx)}
                  >
                    {city.name}
                  </button>
                ))}
              </div>
              <p className="out" id="cityout">
                Sample: {12 + ((CITIES[selectedCityIdx]?.name || 'Mumbai').length * 3) % 9} dental clinics in {CITIES[selectedCityIdx]?.name || 'Mumbai'}
              </p>
              <p className="hint hd">Drag the globe to spin it. Click empty space for a shockwave.</p>
            </div>
          </section>

          {/* s2 / Verify */}
          <section className="sc r" id="s2" data-n="02">
            <div id="demo" style={{ position: 'absolute', top: 0 }} />
            <div className="in rv">
              <p className="k">02 / Verify</p>
              <h2>Verify.</h2>
              <p className="d">Every lead links to its original listing, so you can check it before you send anything.</p>
              <div className="card">
                <p className="k" style={{ margin: 0 }}>Interior and architecture · Bengaluru</p>
                <h3>Aura Spatial Architecture</h3>
                <dl>
                  <div>
                    <dt><svg className="i" viewBox="0 0 24 24"><path d="m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z"/></svg>Rating</dt>
                    <dd>4.9 (84 reviews)</dd>
                  </div>
                  <div>
                    <dt><svg className="i" viewBox="0 0 24 24"><path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z"/></svg>Phone</dt>
                    <dd>+91 98450 12847</dd>
                  </div>
                  <div>
                    <dt><svg className="i" viewBox="0 0 24 24"><path d="M12 21s7-6.2 7-11a7 7 0 0 0-14 0c0 4.8 7 11 7 11z"/><circle cx="12" cy="10" r="2.5"/></svg>Source</dt>
                    <dd>Google Maps, verified</dd>
                  </div>
                  <div>
                    <dt><svg className="i" viewBox="0 0 24 24"><path d="M12 3 2 20h20z"/><path d="M12 10v4M12 17h.01"/></svg>Opportunity</dt>
                    <dd className="u">No website found</dd>
                  </div>
                </dl>
              </div>
            </div>
          </section>

          {/* s3 / Write */}
          <section className="sc" id="s3" data-n="03">
            <div className="in rv">
              <p className="k">03 / Write</p>
              <h2>Write.</h2>
              <p className="d">Your first message is drafted from what the business is actually missing.</p>
              <p className={`pitch ${isTyping ? 't' : ''}`} id="pitch">
                {typedText}
              </p>
              <div className="row">
                <button type="button" className="chip on" onClick={runTypewriter}>Portfolio website</button>
                <button type="button" className="chip" onClick={runTypewriter}>Local SEO</button>
                <button type="button" className="chip" onClick={runTypewriter}>Lead form</button>
              </div>
            </div>
          </section>

          {/* s4 / Track */}
          <section className="sc r" id="s4" data-n="04">
            <div className="in rv">
              <p className="k">04 / Track</p>
              <h2>Track.</h2>
              <p className="d">A private pipeline that lives in your browser. Tap a lead to move it along.</p>
              <div className="kb" id="kb">
                <div className="col">
                  <h4>New</h4>
                  {kanbanTickets.filter(t => t.col === 'new').map(t => (
                    <button key={t.id} type="button" className="tk pop" onClick={() => handleTicketClick(t.id)}>{t.name}</button>
                  ))}
                </div>
                <div className="col">
                  <h4>Contacted</h4>
                  {kanbanTickets.filter(t => t.col === 'contacted').map(t => (
                    <button key={t.id} type="button" className="tk pop" onClick={() => handleTicketClick(t.id)}>{t.name}</button>
                  ))}
                </div>
                <div className="col">
                  <h4>Converted</h4>
                  {kanbanTickets.filter(t => t.col === 'converted').map(t => (
                    <button key={t.id} type="button" className="tk pop" onClick={() => handleTicketClick(t.id)}>{t.name}</button>
                  ))}
                </div>
              </div>
              <p className="hint">Sample leads, to show how the pipeline works. Tap any lead to move it forward.</p>
            </div>
          </section>

          {/* s5 / Pricing */}
          <section className="sc c" id="s5" data-n="05">
            <div id="pricing" style={{ position: 'absolute', top: 0 }} />
            <div style={{ width: '100%' }}>
              <p className="k">05 / Pricing</p>
              <h2 style={{ margin: '0 auto', maxWidth: '14ch' }} className="rv">
                Free to start. {userCountry === 'IN' ? '₹179' : '$15'} a year to grow.
              </h2>
              <div className="plans rv">
                <div className="plan">
                  <div className="price">{userCountry === 'IN' ? '₹0' : '$0'} <small>for life</small></div>
                  <ul className="f">
                    <li>5 free scouts per month</li>
                    <li>Google Maps, JustDial and IndiaMART</li>
                    <li>Verification links and directions</li>
                    <li>1-click WhatsApp outreach</li>
                    <li>Private pipeline and notes</li>
                    <li className="no">CSV export and email templates</li>
                  </ul>
                  <Link className="btn ghost" to="/login?mode=signup">Get started free</Link>
                </div>
                <div className="plan pro">
                  <div className="price">{userCountry === 'IN' ? '₹179' : '$15'} <small>per year</small></div>
                  <ul className="f">
                    <li>Unlimited scouting</li>
                    <li>1-click CSV export</li>
                    <li>Full library of cold email templates</li>
                    <li>Market dossier delivered to your inbox</li>
                    <li>Custom sector and niche generator</li>
                    <li>Priority developer support</li>
                  </ul>
                  <Link className="btn" to="/login?redirect=%2Fcheckout%3Fplan%3Dyearly">Upgrade to Pro</Link>
                </div>
              </div>
            </div>
          </section>

          {/* s6 / Fin */}
          <section className="sc c fin" id="s6">
            <div>
              <h2 className="rv">Your next client is already on the map.</h2>
              <div className="row rv">
                <Link className="btn" to="/login?mode=signup">
                  Start free scouting <svg className="i" viewBox="0 0 24 24"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
                </Link>
              </div>
            </div>
          </section>

          {/* FAQ Accordion */}
          <section className="faq-section" id="faq" style={{ padding: '6rem clamp(1.25rem,6vw,6rem) 3rem', maxWidth: '48rem', margin: '0 auto', position: 'relative', zIndex: 2 }}>
            <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
              <p className="k" style={{ marginBottom: '0.6rem' }}>06 / Questions</p>
              <h2 style={{ fontSize: 'clamp(2rem, 5vw, 3rem)' }}>Frequently Asked Questions</h2>
              <p style={{ color: 'var(--mute)', marginTop: '0.6rem', fontSize: '0.98rem' }}>Common questions about LanceBuddy, lead accuracy, and privacy.</p>
            </div>
            <div className="faq-grid">
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
            </div>
          </section>

          {/* Contact Section */}
          <section className="sc c support-section" id="contact" data-n="07">
            <div style={{ width: '100%', maxWidth: '54rem', margin: '0 auto', textAlign: 'left' }}>
              <p className="k" style={{ textAlign: 'center' }}>07 / Contact</p>
              <h2 style={{ textAlign: 'center', marginBottom: '1rem' }} className="rv">Have Questions or Need Help?</h2>
              <p className="d" style={{ textAlign: 'center', margin: '0 auto 2.5rem', maxWidth: '34rem' }}>
                Get in touch directly with the developer for feedback, bug reports, or partnership opportunities.
              </p>

              <div className="sup-grid">
                <div className="sup-info card" style={{ padding: '2rem' }}>
                  <h3 style={{ fontSize: '1.4rem', marginBottom: '0.6rem' }}>Direct Contact</h3>
                  <p style={{ color: 'var(--mute)', fontSize: '0.92rem', marginBottom: '1.5rem', lineHeight: 1.6 }}>
                    Reach out anytime with feature suggestions, bug reports, or custom integrations.
                  </p>
                  <div className="contacts" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div className="ci" style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                      <div className="ci-icon" style={{ width: '2.2rem', height: '2.2rem', borderRadius: '50%', background: 'color-mix(in srgb, var(--ink) 8%, transparent)', display: 'grid', placeItems: 'center', color: 'var(--ink)' }}>
                        <i className="ri-mail-line"></i>
                      </div>
                      <span style={{ fontSize: '0.92rem' }}>jakadwangdu@outlook.com</span>
                    </div>
                    <div className="ci" style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                      <div className="ci-icon" style={{ width: '2.2rem', height: '2.2rem', borderRadius: '50%', background: 'color-mix(in srgb, var(--ink) 8%, transparent)', display: 'grid', placeItems: 'center', color: 'var(--ink)' }}>
                        <i className="ri-code-s-slash-line"></i>
                      </div>
                      <span style={{ fontSize: '0.92rem' }}>Maintained by Shaurya Pratap Singh</span>
                    </div>
                    <div className="ci" style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                      <div className="ci-icon" style={{ width: '2.2rem', height: '2.2rem', borderRadius: '50%', background: 'color-mix(in srgb, var(--ink) 8%, transparent)', display: 'grid', placeItems: 'center', color: 'var(--ink)' }}>
                        <i className="ri-instagram-line"></i>
                      </div>
                      <a
                        href="https://www.instagram.com/shaurya__5656"
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ fontSize: '0.92rem', textDecoration: 'underline', textUnderlineOffset: '3px' }}
                      >
                        @official_jakadwangdu
                      </a>
                    </div>
                  </div>
                </div>

                <form onSubmit={handleSupportSubmit} className="sup-form-card card" style={{ padding: '2rem' }}>
                  <div className="fg" style={{ marginBottom: '1.2rem' }}>
                    <label style={{ display: 'block', font: '500 0.72rem "Geist Mono", monospace', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--mute)', marginBottom: '0.45rem' }}>Your Name</label>
                    <input
                      type="text"
                      required
                      maxLength={100}
                      value={supportName}
                      onChange={(e) => setSupportName(e.target.value)}
                      placeholder="Your Name"
                      style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '12px', border: '1px solid var(--line)', background: 'color-mix(in srgb, var(--bg) 80%, transparent)', color: 'var(--ink)' }}
                    />
                  </div>

                  <div className="fg" style={{ marginBottom: '1.2rem' }}>
                    <label style={{ display: 'block', font: '500 0.72rem "Geist Mono", monospace', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--mute)', marginBottom: '0.45rem' }}>Your Email</label>
                    <input
                      type="email"
                      required
                      maxLength={120}
                      value={supportEmail}
                      onChange={(e) => setSupportEmail(e.target.value)}
                      placeholder="you@domain.com"
                      style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '12px', border: '1px solid var(--line)', background: 'color-mix(in srgb, var(--bg) 80%, transparent)', color: 'var(--ink)' }}
                    />
                  </div>

                  <div className="fg" style={{ marginBottom: '1.4rem' }}>
                    <label style={{ display: 'block', font: '500 0.72rem "Geist Mono", monospace', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--mute)', marginBottom: '0.45rem' }}>Message</label>
                    <textarea
                      required
                      rows={4}
                      maxLength={2000}
                      value={supportMsg}
                      onChange={(e) => setSupportMsg(e.target.value)}
                      placeholder="What can we help you with?"
                      style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '12px', border: '1px solid var(--line)', background: 'color-mix(in srgb, var(--bg) 80%, transparent)', color: 'var(--ink)', resize: 'vertical' }}
                    />
                  </div>

                  <button type="submit" className="btn" style={{ width: '100%', justifyContent: 'center' }}>
                    <i className="ri-send-plane-line" style={{ marginRight: '6px' }}></i> Send Message
                  </button>

                  {supportStatus && <div className="sup-status" style={{ marginTop: '1rem', font: '500 0.85rem "Geist Mono", monospace', color: 'var(--mute)', textAlign: 'center' }}>{supportStatus}</div>}
                </form>
              </div>
            </div>
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

          {/* Pricing for Authenticated Workspace */}
          {currentUser?.plan !== 'paid-premium-plan' && (
            <section className="pricing-section" id="pricing" style={{ padding: '5rem 1.5rem 3rem' }}>
              <div className="sec-hd" style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
                <h2>Upgrade to Premium</h2>
                <p>Unlock unlimited market scouting, CSV spreadsheet exports, and high-converting cold email pitch templates.</p>
              </div>

              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '2rem' }}>
                <div className="billing-toggle" style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  background: 'color-mix(in srgb, var(--ink) 4%, transparent)',
                  borderRadius: 'var(--radius-full)',
                  padding: '4px',
                  border: '1px solid var(--line)'
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
                      fontSize: '0.88rem'
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
                      fontSize: '0.88rem'
                    }}
                  >
                    Yearly (1 Year) <span style={{ fontSize: '0.72rem', background: 'var(--ink)', color: 'var(--on)', padding: '2px 8px', borderRadius: '99px', marginLeft: '6px' }}>Save ~20%</span>
                  </button>
                </div>
              </div>

              <div style={{ maxWidth: '480px', margin: '0 auto' }}>
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
                    Unlimited market scouting, 1-click CSV export, and complete cold email library.
                  </p>
                  <ul className="pricing-features">
                    <li><i className="ri-check-line" style={{ color: 'var(--accent)' }}></i> <span><strong>Unlimited Market Scouting</strong></span></li>
                    <li><i className="ri-check-line" style={{ color: 'var(--accent)' }}></i> <span><strong>Instant CSV Spreadsheet Export</strong></span></li>
                    <li><i className="ri-check-line" style={{ color: 'var(--accent)' }}></i> <span><strong>Cold Email Pitch Templates Library</strong></span></li>
                    <li><i className="ri-check-line" style={{ color: 'var(--accent)' }}></i> <span><strong>Market Dossier Delivered to Inbox</strong></span></li>
                    <li><i className="ri-check-line" style={{ color: 'var(--accent)' }}></i> <span><strong>Verified Pro Member Badge</strong></span></li>
                    <li><i className="ri-check-line" style={{ color: 'var(--accent)' }}></i> <span><strong>Priority 24/7 Support</strong></span></li>
                  </ul>
                  <div style={{ marginTop: '2rem' }}>
                    <button
                      type="button"
                      className="leads-btn upgrade-cta-btn"
                      onClick={() => handleUpgrade(billingCycle === 'yearly' ? 12 : 3)}
                      style={{ width: '100%', padding: '13px 20px', fontWeight: 700 }}
                    >
                      <i className="ri-vip-crown-fill"></i> Upgrade to Premium ({billingCycle === 'yearly' ? (userCountry === 'IN' ? '₹179/yr' : '$15/yr') : (userCountry === 'IN' ? '₹50/3mo' : '$5/3mo')})
                    </button>
                  </div>
                </TiltCard>
              </div>
            </section>
          )}

          {/* FAQ for Authenticated Workspace */}
          <section className="faq-section" id="faq" style={{ padding: '4rem 1.5rem', maxWidth: '48rem', margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
              <h2 style={{ fontSize: '2rem' }}>Frequently Asked Questions</h2>
            </div>
            <div className="faq-grid">
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
            </div>
          </section>

          {/* Contact for Authenticated Workspace */}
          <section className="support-section" id="contact" style={{ padding: '4rem 1.5rem', maxWidth: '54rem', margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
              <h2 style={{ fontSize: '2rem' }}>Developer Support &amp; Feedback</h2>
              <p style={{ color: 'var(--mute)' }}>Need help with a query or want to request a niche feature? Drop a message below.</p>
            </div>
            <form onSubmit={handleSupportSubmit} className="card" style={{ padding: '2rem', maxWidth: '32rem', margin: '0 auto' }}>
              <div className="fg" style={{ marginBottom: '1.2rem' }}>
                <label style={{ display: 'block', font: '500 0.72rem "Geist Mono", monospace', textTransform: 'uppercase', color: 'var(--mute)', marginBottom: '0.45rem' }}>Your Name</label>
                <input
                  type="text"
                  required
                  maxLength={100}
                  value={supportName}
                  onChange={(e) => setSupportName(e.target.value)}
                  placeholder="Your Name"
                  style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '12px', border: '1px solid var(--line)', background: 'color-mix(in srgb, var(--bg) 80%, transparent)', color: 'var(--ink)' }}
                />
              </div>
              <div className="fg" style={{ marginBottom: '1.2rem' }}>
                <label style={{ display: 'block', font: '500 0.72rem "Geist Mono", monospace', textTransform: 'uppercase', color: 'var(--mute)', marginBottom: '0.45rem' }}>Your Email</label>
                <input
                  type="email"
                  required
                  maxLength={120}
                  value={supportEmail}
                  onChange={(e) => setSupportEmail(e.target.value)}
                  placeholder="you@domain.com"
                  style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '12px', border: '1px solid var(--line)', background: 'color-mix(in srgb, var(--bg) 80%, transparent)', color: 'var(--ink)' }}
                />
              </div>
              <div className="fg" style={{ marginBottom: '1.4rem' }}>
                <label style={{ display: 'block', font: '500 0.72rem "Geist Mono", monospace', textTransform: 'uppercase', color: 'var(--mute)', marginBottom: '0.45rem' }}>Message</label>
                <textarea
                  required
                  rows={4}
                  maxLength={2000}
                  value={supportMsg}
                  onChange={(e) => setSupportMsg(e.target.value)}
                  placeholder="What can we help you with?"
                  style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '12px', border: '1px solid var(--line)', background: 'color-mix(in srgb, var(--bg) 80%, transparent)', color: 'var(--ink)', resize: 'vertical' }}
                />
              </div>
              <button type="submit" className="btn" style={{ width: '100%', justifyContent: 'center' }}>
                <i className="ri-send-plane-line" style={{ marginRight: '6px' }}></i> Send Message
              </button>
              {supportStatus && <div className="sup-status" style={{ marginTop: '1rem', font: '500 0.85rem "Geist Mono", monospace', color: 'var(--mute)', textAlign: 'center' }}>{supportStatus}</div>}
            </form>
          </section>
        </div>
      )}

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
