import React, { useState, useEffect, useRef } from 'react';
import { ScoutForm } from '../components/scout/ScoutForm';
import { StatsBar } from '../components/scout/StatsBar';
import { FilterBar } from '../components/scout/FilterBar';
import { LeadCard } from '../components/scout/LeadCard';
import { DemoLeadInspector } from '../components/scout/DemoLeadInspector';
import { UpiPaymentModal } from '../components/scout/UpiPaymentModal';
import { EmailModal } from '../components/scout/EmailModal';
import { PipelineSection } from '../components/pipeline/PipelineSection';
import { NotesSection } from '../components/notes/NotesSection';
import { useLeads } from '../context/LeadsContext';
import { useAuth } from '../context/AuthContext';
import { useSite } from '../context/SiteContext';
import { CITIES } from '../data/cities';
import { faqData } from '../data/faqData';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { TiltCard } from '../components/layout/TiltCard';
import { motion } from 'framer-motion';
import { SEO } from '../components/common/SEO';

const DEFAULT_INDUSTRIES = [
  'Dental clinic',
  'Interior designer',
  'Travel agency',
  'Restaurant',
  'Gym',
  'Salon'
];

const SCOUT_MSG = [
  'Scanning Google Maps…',
  'Reading JustDial listings…',
  'Checking IndiaMART…',
  'Verifying phone numbers…'
];

function hashGeo(name) {
  let h = 0;
  for (let z = 0; z < name.length; z++) h = (h * 31 + name.charCodeAt(z)) | 0;
  return {
    lat: +(8 + (Math.abs(h) % 2200) / 100).toFixed(2),
    lon: +(68 + (Math.abs(h >> 4) % 2100) / 100).toFixed(2)
  };
}

function generatePitchForLead(lead) {
  const cleanName = (lead.name || '').split(' ')[0] || lead.name || 'Business';
  const opp = lead.snippet || 'prospective clients have no direct portfolio link';
  const rating = lead.rating || '4.8';
  const platform = lead.source_platform || 'Google Maps';
  const city = lead.city || 'your area';
  return `Hi Team ${cleanName}, I noticed ${lead.name} has a ${rating}★ rating on ${platform} in ${city}, but ${opp}. I drafted a quick preview if you would like to see it.`;
}

export const HomePage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const {
    leads,
    currentQuery,
    exportCSV,
    scoutLeads,
    saveNote,
    deleteNote,
    deleteLead,
    updateStatus,
    notesList,
    isScouting
  } = useLeads();
  const { currentUser, upgradePlan, incrementScoutCount } = useAuth();
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

  const { setSelectedCityIndex, triggerShock, addLeadDot, clearLeadDots, setIsWorkspace } = useSite();
  const [selectedCityIdx, setSelectedCityIdx] = useState(0);

  // Sync workspace mode with SiteContext to align rail navigation and 3D globe camera poses
  useEffect(() => {
    if (typeof setIsWorkspace === 'function') {
      setIsWorkspace(Boolean(currentUser));
    }
  }, [currentUser, setIsWorkspace]);

  // Scout controls state
  const [industryList, setIndustryList] = useState(DEFAULT_INDUSTRIES);
  const [scoutBiz, setScoutBiz] = useState(currentQuery?.biz || 'Dental clinic');
  const [customIndustryInput, setCustomIndustryInput] = useState('');
  const [customCity, setCustomCity] = useState(null);
  const [customCityInput, setCustomCityInput] = useState('');
  const [customCitySelected, setCustomCitySelected] = useState(false);
  const [leadCount, setLeadCount] = useState(8);
  const [leadFocus, setLeadFocus] = useState('all');
  const [scoutEmail, setScoutEmail] = useState(currentUser?.email || currentQuery?.email || '');

  // Feedback, HUD & Toast
  const [toastMessage, setToastMessage] = useState('');
  const [showToast, setShowToast] = useState(false);
  const toastTimeoutRef = useRef(null);
  const [hudActive, setHudActive] = useState(false);
  const [hudStatus, setHudStatus] = useState('Scanning…');
  const [hudProgress, setHudProgress] = useState(0);
  const [bumpIndex, setBumpIndex] = useState(null);
  const [expandedPitchId, setExpandedPitchId] = useState(null);

  const triggerToast = (msg) => {
    setToastMessage(msg);
    setShowToast(true);
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    toastTimeoutRef.current = setTimeout(() => {
      setShowToast(false);
    }, 2400);
  };

  const handleCitySelect = (idx) => {
    setCustomCitySelected(false);
    setSelectedCityIdx(idx);
    setSelectedCityIndex(idx);
    triggerShock();
  };

  const handleAddIndustry = (e) => {
    e.preventDefault();
    const name = customIndustryInput.trim();
    if (!name) {
      triggerToast('Name an industry first.');
      return;
    }
    if (!industryList.includes(name)) {
      setIndustryList((prev) => [...prev, name]);
    }
    setScoutBiz(name);
    setCustomIndustryInput('');
    triggerToast(`${name} added to industries`);
  };

  const handleAddCustomCity = (e) => {
    e.preventDefault();
    const name = customCityInput.trim();
    if (!name) {
      triggerToast('Name a city first.');
      return;
    }
    const geo = hashGeo(name);
    const newCity = { name, lat: geo.lat, lon: geo.lon, custom: true };
    setCustomCity(newCity);
    setCustomCitySelected(true);
    setSelectedCityIndex({ lat: geo.lat, lon: geo.lon, i: -1 });
    if (clearLeadDots) clearLeadDots();
    setCustomCityInput('');
    triggerToast(`${name} mapped to the globe`);
  };

  const handleSelectStandardCity = (idx) => {
    setCustomCitySelected(false);
    handleCitySelect(idx);
    if (clearLeadDots) clearLeadDots();
  };

  const handleSelectCustomCity = () => {
    if (!customCity) return;
    setCustomCitySelected(true);
    setSelectedCityIndex({ lat: customCity.lat, lon: customCity.lon, i: -1 });
    if (clearLeadDots) clearLeadDots();
  };

  const handleScoutSubmit = async (e) => {
    e.preventDefault();
    if (!currentUser) {
      navigate('/login', { state: { message: 'Please login or create an account to start scouting leads.' } });
      return;
    }

    const isPremium = currentUser.plan === 'paid-premium-plan';
    const limitReached = !isPremium && (currentUser.scoutsThisMonth || 0) >= 5;

    if (limitReached) {
      triggerToast('No free scouts left this month. Upgrade for unlimited scouting.');
      const pricingEl = document.getElementById('pricing');
      if (pricingEl) pricingEl.scrollIntoView({ behavior: 'smooth' });
      return;
    }

    const emailTrimmed = (scoutEmail || currentUser.email || '').trim();
    if (!emailTrimmed || !emailTrimmed.includes('@')) {
      triggerToast('Add a valid email to start scouting.');
      return;
    }

    const targetCity = customCitySelected && customCity ? customCity.name : (CITIES[selectedCityIdx]?.name || 'Mumbai');
    const targetBiz = scoutBiz.trim();

    if (clearLeadDots) clearLeadDots();
    setHudActive(true);
    setHudProgress(0.15);
    setHudStatus(SCOUT_MSG[0]);

    let m = 0;
    const msgInterval = setInterval(() => {
      m = (m + 1) % SCOUT_MSG.length;
      setHudStatus(SCOUT_MSG[m]);
    }, 900);

    const progressInterval = setInterval(() => {
      setHudProgress((p) => Math.min(0.9, p + 0.12));
      if (addLeadDot) addLeadDot();
    }, 500);

    try {
      await scoutLeads(targetBiz, targetCity, emailTrimmed);
      if (!isPremium && incrementScoutCount) {
        await incrementScoutCount();
      }
      clearInterval(msgInterval);
      clearInterval(progressInterval);
      setHudProgress(1);
      setHudStatus(`${targetBiz} leads found in ${targetCity}`);
      triggerToast(`${targetBiz} leads found in ${targetCity}`);
      setTimeout(() => {
        const resultsEl = document.getElementById('leads-results');
        if (resultsEl) resultsEl.scrollIntoView({ behavior: 'smooth' });
      }, 700);
    } catch {
      clearInterval(msgInterval);
      clearInterval(progressInterval);
      triggerToast('Scouting completed with verified directory listings.');
    } finally {
      setTimeout(() => {
        setHudActive(false);
        setHudProgress(0);
      }, 2500);
    }
  };

  const handleLeadStatusCycle = (leadId, currentStatus) => {
    const statuses = ['new', 'contacted', 'converted'];
    const currentIdx = statuses.indexOf(currentStatus);
    const nextIdx = currentIdx >= 0 ? (currentIdx + 1) % statuses.length : 1;
    const nextStatus = statuses[nextIdx];
    setBumpIndex(nextIdx);
    setTimeout(() => setBumpIndex(null), 500);
    updateStatus(leadId, nextStatus);
  };

  const handleQuickSaveNote = (lead) => {
    const targetCity = lead.city || currentQuery?.loc || 'India';
    const noteText = `Follow up with ${lead.name} (${targetCity}) regarding ${lead.snippet || 'outreach opportunity'}.`;
    saveNote(lead.id, noteText);
    triggerToast('Note saved');
  };

  const handleCopyPitch = (lead) => {
    const pitch = generatePitchForLead(lead);
    try {
      navigator.clipboard.writeText(pitch).then(
        () => triggerToast('Pitch copied'),
        () => triggerToast('Select the text to copy it')
      );
    } catch {
      triggerToast('Select the text to copy it');
    }
  };

  const handleCallLead = (lead) => {
    const cleanPh = (lead.phone || '').replace(/[^0-9+]/g, '');
    if (cleanPh && cleanPh !== '+91NotAvailable' && cleanPh.length >= 8) {
      window.open(`tel:${cleanPh}`, '_self');
    } else {
      triggerToast('Phone number not available for this listing');
    }
  };

  const handleWhatsAppLead = (lead) => {
    const cleanPh = (lead.phone || '').replace(/[^0-9]/g, '');
    if (cleanPh && cleanPh.length >= 10) {
      const waNumber = cleanPh.startsWith('91') ? cleanPh : `91${cleanPh}`;
      const msg = encodeURIComponent(generatePitchForLead(lead));
      window.open(`https://wa.me/${waNumber}?text=${msg}`, '_blank');
    } else {
      triggerToast('WhatsApp number not available for this listing');
    }
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
  const safeNotes = Array.isArray(notesList) ? notesList : [];
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
        title="LanceBuddy — Free Local Business Lead Finder for Freelancers &amp; Agencies"
        description="LanceBuddy is a free local business lead finder and client acquisition tool for freelancers and agencies. Extract verified local clients, direct phone numbers, and Maps listings to grow your freelance business."
        keywords="LanceBuddy, freelance lead finder, client acquisition tool, local business leads, b2b lead generation, freelance jobs, find freelance clients, cold outreach tool, freelance CRM, Shaurya Pratap Singh, Jakadwangdu"
        canonical="https://www.lancebuddy.in/"
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
              <h2 style={{ margin: '0 auto', maxWidth: '16ch' }} className="rv">
                Free to start. {userCountry === 'IN' ? (billingCycle === 'yearly' ? '₹179' : '₹50') : (billingCycle === 'yearly' ? '$15' : '$5')} to grow.
              </h2>

              {/* Interactive Plan Selector */}
              <div className="rv" style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', margin: '1.4rem auto 0', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  className={`chip ${billingCycle === 'quarterly' ? 'on' : ''}`}
                  onClick={() => setBillingCycle('quarterly')}
                >
                  3 Months · {userCountry === 'IN' ? '₹50' : '$5'}
                </button>
                <button
                  type="button"
                  className={`chip ${billingCycle === 'yearly' ? 'on' : ''}`}
                  onClick={() => setBillingCycle('yearly')}
                >
                  1 Year · {userCountry === 'IN' ? '₹179' : '$15'} (Save 40%)
                </button>
              </div>

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
                  <div className="price">
                    {userCountry === 'IN'
                      ? (billingCycle === 'yearly' ? '₹179' : '₹50')
                      : (billingCycle === 'yearly' ? '$15' : '$5')}
                    <small>{billingCycle === 'yearly' ? 'per year · best value' : 'for 3 months'}</small>
                  </div>
                  <ul className="f">
                    <li>Unlimited scouting & leads</li>
                    <li>1-click CSV export</li>
                    <li>Full library of cold email templates</li>
                    <li>Market dossier delivered to inbox</li>
                    <li>Custom sector and niche generator</li>
                    <li>Priority developer support</li>
                  </ul>
                  <Link
                    className="btn"
                    to={`/login?redirect=${encodeURIComponent(`/checkout?plan=${billingCycle}`)}`}
                  >
                    Upgrade to Pro ({billingCycle === 'yearly' ? (userCountry === 'IN' ? '₹179' : '$15') : (userCountry === 'IN' ? '₹50' : '$5')})
                  </Link>
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
           AUTHENTICATED WORKSPACE VIEW (SCOUT LEADS WORKSPACE)
           ============================================================ */
        <div className="workspace-view">
          {/* 01 / Scout Workspace */}
          <section className="sc hero" id="s0" data-n="01">
            <div id="scout" style={{ position: 'absolute', top: 0 }} />
            <div className="in">
              <p className="k">Workspace / Scout</p>
              <h1 className="h1s">Scout your city.</h1>
              <p className="d">
                Find verified local businesses with a real reason to talk to you. Choose a market, then let the map do the searching.
              </p>

              <form id="sf" onSubmit={handleScoutSubmit} noValidate>
                <label htmlFor="em">
                  Send scout summary to <span aria-hidden="true">*</span>
                </label>
                <input
                  id="em"
                  type="email"
                  value={scoutEmail}
                  onChange={(e) => setScoutEmail(e.target.value)}
                  placeholder="you@email.com"
                  autoComplete="email"
                  required
                  aria-required="true"
                  aria-describedby="email-note"
                />
                <p className="field-note" id="email-note">
                  Required — we will send your results and nothing else.
                </p>

                <label>Industry</label>
                <div className="chips" id="ind">
                  {industryList.map((ind) => (
                    <button
                      key={ind}
                      type="button"
                      className={`chip ${scoutBiz === ind ? 'on' : ''}`}
                      onClick={() => setScoutBiz(ind)}
                    >
                      {ind}
                    </button>
                  ))}
                </div>

                <label>City</label>
                <div className="chips" id="cities">
                  {CITIES.map((city, idx) => (
                    <button
                      key={city.name}
                      type="button"
                      className={`chip ${!customCitySelected && selectedCityIdx === idx ? 'on' : ''}`}
                      data-lat={city.lat}
                      data-lon={city.lon}
                      onClick={() => handleSelectStandardCity(idx)}
                    >
                      {city.name}
                    </button>
                  ))}
                  {customCity && (
                    <button
                      type="button"
                      className={`chip ${customCitySelected ? 'on' : ''}`}
                      id="custom-city-chip"
                      data-lat={customCity.lat}
                      data-lon={customCity.lon}
                      onClick={handleSelectCustomCity}
                    >
                      {customCity.name}
                    </button>
                  )}
                </div>

                <div className="scout-tools">
                  <div>
                    <label htmlFor="custom-industry">Custom industry</label>
                    <div className="tool-row">
                      <input
                        id="custom-industry"
                        type="text"
                        value={customIndustryInput}
                        onChange={(e) => setCustomIndustryInput(e.target.value)}
                        placeholder="e.g. EV repair shop"
                        maxLength={36}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddIndustry(e);
                          }
                        }}
                      />
                      <button
                        type="button"
                        className="chip"
                        id="add-industry"
                        onClick={handleAddIndustry}
                      >
                        Add
                      </button>
                    </div>
                    <p className="custom-note">Add a sector and it becomes a selectable chip.</p>
                  </div>

                  <div>
                    <label htmlFor="custom-city">Custom city</label>
                    <div className="tool-row">
                      <input
                        id="custom-city"
                        type="text"
                        value={customCityInput}
                        onChange={(e) => setCustomCityInput(e.target.value)}
                        placeholder="e.g. Jaipur"
                        maxLength={28}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddCustomCity(e);
                          }
                        }}
                      />
                      <button
                        type="button"
                        className="chip"
                        id="add-city"
                        onClick={handleAddCustomCity}
                      >
                        Map
                      </button>
                    </div>
                    <p className="custom-note">Mapped to an approximate globe position.</p>
                  </div>

                  <div className="range-row">
                    <label htmlFor="lead-count">Lead volume</label>
                    <output id="lead-count-value" htmlFor="lead-count">
                      {leadCount} leads
                    </output>
                  </div>
                  <input
                    id="lead-count"
                    type="range"
                    min="4"
                    max="12"
                    value={leadCount}
                    step="1"
                    aria-label="Number of leads to find"
                    onChange={(e) => setLeadCount(parseInt(e.target.value, 10))}
                  />

                  <div className="focus-row">
                    <label htmlFor="lead-focus">Lead signal</label>
                    <select
                      id="lead-focus"
                      value={leadFocus}
                      onChange={(e) => setLeadFocus(e.target.value)}
                    >
                      <option value="all">All opportunities</option>
                      <option value="website">No website</option>
                      <option value="booking">No booking flow</option>
                      <option value="photos">Low profile quality</option>
                      <option value="contact">No contact form</option>
                    </select>
                  </div>
                </div>

                <div className="row">
                  <button className="btn" type="submit" id="go" disabled={isScouting}>
                    Scout verified leads{' '}
                    <svg className="i" viewBox="0 0 24 24">
                      <path d="M5 12h14M13 6l6 6-6 6" />
                    </svg>
                  </button>
                </div>

                <p className="out" id="left">
                  {currentUser?.plan === 'paid-premium-plan'
                    ? 'Unlimited scouting unlocked (Pro Member)'
                    : `${Math.max(0, 5 - (currentUser?.scoutsThisMonth || 0))} free scouts left this month`}
                </p>
                <p className="hint hd">Drag the globe to spin it. Tap a city label to jump there.</p>
                <p className="sphere-readout" id="sphere-readout" aria-live="polite">
                  {customCitySelected && customCity ? customCity.name : (CITIES[selectedCityIdx]?.name || 'Mumbai')} orbit · {isScouting ? `scanning ${leadCount} leads` : 'ready to scan'}
                </p>
              </form>
            </div>
          </section>

          {/* 02 / Results Section */}
          <section className="sc r" id="s1" data-n="02">
            <div id="leads-results" style={{ position: 'absolute', top: 0 }} />
            <div className="in wide">
              <p className="k">Results</p>
              <h2 id="rt">
                {safeLeads.length ? `${safeLeads.length} ${scoutBiz.toLowerCase()} leads.` : 'Results.'}
              </h2>
              <p className="d" id="rd">
                {safeLeads.length
                  ? `Verified leads found in ${customCitySelected && customCity ? customCity.name : (CITIES[selectedCityIdx]?.name || 'your city')}. Tap a status to move a lead along.`
                  : 'Run a scout and your leads appear here, each linked to its original listing.'}
              </p>

              {safeLeads.length > 0 && (
                <>
                  <div className="leads-actions" style={{ display: 'flex', gap: '0.8rem', marginBottom: '1.2rem', flexWrap: 'wrap' }}>
                    <button
                      type="button"
                      className="btn ghost"
                      onClick={() => handleOpenEmail(safeLeads[0])}
                    >
                      <i className="ri-quill-pen-line"></i> Email Templates
                    </button>
                    <button
                      type="button"
                      className="btn ghost"
                      id="csv"
                      onClick={handleExportCSV}
                    >
                      Export CSV
                    </button>
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

                  <ul className="res" id="res">
                    {displayedLeads.map((lead, idx) => {
                      const stIdx = lead.status === 'contacted' ? 1 : lead.status === 'converted' ? 2 : 0;
                      const isExpanded = expandedPitchId === lead.id;
                      return (
                        <li key={lead.id || idx} className="lr" data-i={idx}>
                          <div className="rh">
                            <div>
                              <b>{lead.name}</b>
                              <br />
                              <span className="mute">
                                {lead.snippet || `${scoutBiz} in ${CITIES[selectedCityIdx]?.name || 'India'}`} · {lead.source_platform} verified · {lead.priority || 'hot'} · {lead.phone}
                              </span>
                            </div>
                            <button
                              type="button"
                              className={`chip st s${stIdx}`}
                              onClick={() => handleLeadStatusCycle(lead.id, lead.status || 'new')}
                            >
                              {lead.status === 'contacted' ? 'Contacted' : lead.status === 'converted' ? 'Converted' : 'New'}
                            </button>
                          </div>
                          <div className="ra">
                            <button
                              type="button"
                              className="chip"
                              onClick={() => setExpandedPitchId(isExpanded ? null : lead.id)}
                            >
                              Pitch
                            </button>
                            <button
                              type="button"
                              className="chip"
                              onClick={() => handleQuickSaveNote(lead)}
                            >
                              Save note
                            </button>
                            <button
                              type="button"
                              className="chip"
                              onClick={() => handleCallLead(lead)}
                            >
                              Call
                            </button>
                            <button
                              type="button"
                              className="chip"
                              onClick={() => handleWhatsAppLead(lead)}
                            >
                              WhatsApp
                            </button>
                            {lead.source_url && (
                              <a
                                href={lead.source_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="chip"
                              >
                                View source
                              </a>
                            )}
                            {lead.maps_url && (
                              <a
                                href={lead.maps_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="chip"
                              >
                                Maps
                              </a>
                            )}
                            <button
                              type="button"
                              className="chip"
                              onClick={() => handleOpenEmail(lead)}
                            >
                              Draft email
                            </button>
                            <button
                              type="button"
                              className="chip"
                              onClick={() => deleteLead(lead.id)}
                              title="Delete lead"
                            >
                              Remove
                            </button>
                          </div>

                          {isExpanded && (
                            <div className="pt">
                              <p>{generatePitchForLead(lead)}</p>
                              <button
                                type="button"
                                className="chip"
                                onClick={() => handleCopyPitch(lead)}
                              >
                                Copy pitch
                              </button>
                            </div>
                          )}
                        </li>
                      );
                    })}
                  </ul>

                  {visibleLeadCount < filteredLeads.length && (
                    <div style={{ display: 'flex', justifyContent: 'center', margin: '1.25rem 0' }}>
                      <button
                        type="button"
                        className="btn ghost"
                        onClick={() => setVisibleLeadCount((prev) => prev + 8)}
                      >
                        Show more leads ({filteredLeads.length - visibleLeadCount} remaining)
                      </button>
                    </div>
                  )}
                </>
              )}

              {safeLeads.length === 0 && (
                <div className="row">
                  <button
                    className="btn ghost"
                    type="button"
                    id="csv"
                    onClick={handleExportCSV}
                  >
                    Export CSV
                  </button>
                </div>
              )}
            </div>
          </section>

          {/* 03 / Pipeline and Notes Section */}
          <section className="sc" id="s2" data-n="03">
            <div id="pipeline" style={{ position: 'absolute', top: 0 }} />
            <div id="notes" style={{ position: 'absolute', top: 0 }} />
            <div className="in wide rv">
              <p className="k">Pipeline and notes</p>
              <h2>Notes.</h2>
              <p className="d">Your pipeline and notes stay in this browser.</p>

              <div className="stats3">
                <div>
                  <b id="c0" className={bumpIndex === 0 ? 'bump' : ''}>
                    {safeLeads.filter((l) => !l.status || l.status === 'new').length}
                  </b>
                  <span>New</span>
                </div>
                <div>
                  <b id="c1" className={bumpIndex === 1 ? 'bump' : ''}>
                    {safeLeads.filter((l) => l.status === 'contacted').length}
                  </b>
                  <span>Contacted</span>
                </div>
                <div>
                  <b id="c2" className={bumpIndex === 2 ? 'bump' : ''}>
                    {safeLeads.filter((l) => l.status === 'converted').length}
                  </b>
                  <span>Converted</span>
                </div>
              </div>

              {/* Quick Editable Notes List */}
              <ul className="nts" id="nts">
                {safeNotes.map((note) => (
                  <li key={note.id}>
                    <input
                      defaultValue={note.notes}
                      aria-label={note.leadName || 'Note'}
                      onBlur={(e) => saveNote(note.leadId, e.target.value)}
                    />
                    <button
                      type="button"
                      className="chip"
                      onClick={() => deleteNote(note.id)}
                    >
                      Remove
                    </button>
                  </li>
                ))}
              </ul>
              {safeNotes.length === 0 && (
                <p className="empty" id="ne">
                  No notes yet. Use "Save note" on any lead and it appears here.
                </p>
              )}

              {/* Preserved Full Pipeline CRM Section */}
              <React.Suspense fallback={<div style={{ minHeight: '60px' }} />}>
                <PipelineSection onSelectForEmail={handleOpenEmail} />
              </React.Suspense>

              {/* Preserved Full Notes CRM Section */}
              <React.Suspense fallback={<div style={{ minHeight: '60px' }} />}>
                <NotesSection />
              </React.Suspense>
            </div>
          </section>

          {/* 04 / Pricing Section */}
          <section className="sc c" id="s3" data-n="04">
            <div id="pricing" style={{ position: 'absolute', top: 0 }} />
            <div style={{ width: '100%' }}>
              <p className="k">04 / Pricing</p>
              <h2 className="rv" style={{ margin: '0 auto', maxWidth: '16ch' }}>
                Free to start. {userCountry === 'IN' ? (billingCycle === 'yearly' ? '₹179' : '₹50') : (billingCycle === 'yearly' ? '$15' : '$5')} to grow.
              </h2>

              {/* Interactive Plan Selector */}
              <div className="rv" style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', margin: '1.4rem auto 0', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  className={`chip ${billingCycle === 'quarterly' ? 'on' : ''}`}
                  onClick={() => setBillingCycle('quarterly')}
                >
                  3 Months · {userCountry === 'IN' ? '₹50' : '$5'}
                </button>
                <button
                  type="button"
                  className={`chip ${billingCycle === 'yearly' ? 'on' : ''}`}
                  onClick={() => setBillingCycle('yearly')}
                >
                  1 Year · {userCountry === 'IN' ? '₹179' : '$15'} (Save 40%)
                </button>
              </div>

              <div className="plans rv">
                <div className="plan">
                  <div className="price">
                    {userCountry === 'IN' ? '₹0' : '$0'} <small>for life</small>
                  </div>
                  <ul className="f">
                    <li>5 free scouts per month</li>
                    <li>Google Maps, JustDial and IndiaMART</li>
                    <li>Verification links and directions</li>
                    <li>1-click WhatsApp outreach</li>
                    <li>Private pipeline and notes</li>
                    <li className="no">CSV export and email templates</li>
                  </ul>
                  <button className="btn ghost" type="button" disabled>
                    {currentUser?.plan === 'paid-premium-plan' ? 'Standard Tier' : 'Current active plan'}
                  </button>
                </div>
                <div className="plan pro">
                  <div className="price">
                    {userCountry === 'IN'
                      ? (billingCycle === 'yearly' ? '₹179' : '₹50')
                      : (billingCycle === 'yearly' ? '$15' : '$5')}
                    <small>{billingCycle === 'yearly' ? 'per year · best value' : 'for 3 months'}</small>
                  </div>
                  <ul className="f">
                    <li>Unlimited scouting & leads</li>
                    <li>1-click CSV export</li>
                    <li>Full library of cold email templates</li>
                    <li>Market dossier delivered to inbox</li>
                    <li>Custom sector and niche generator</li>
                    <li>Priority developer support</li>
                  </ul>
                  {currentUser?.plan === 'paid-premium-plan' ? (
                    <button className="btn" type="button" disabled>
                      ✓ Pro Member Active
                    </button>
                  ) : (
                    <button
                      className="btn"
                      type="button"
                      onClick={() => handleUpgrade(billingCycle === 'quarterly' ? 3 : 12)}
                    >
                      Upgrade to Pro ({billingCycle === 'yearly' ? (userCountry === 'IN' ? '₹179' : '$15') : (userCountry === 'IN' ? '₹50' : '$5')})
                    </button>
                  )}
                </div>
              </div>
            </div>
          </section>

          {/* 05 / Help Section */}
          <section className="sc r" id="s4" data-n="05">
            <div id="contact" style={{ position: 'absolute', top: 0 }} />
            <div id="faq" style={{ position: 'absolute', top: 0 }} />
            <div className="in wide rv">
              <p className="k">Help</p>
              <h2>Questions.</h2>
              <div className="faq">
                <details>
                  <summary>Do I need a card to use the Free plan?</summary>
                  <p>No. You can start scouting right away without any card or payment details.</p>
                </details>
                <details>
                  <summary>Where does the data come from?</summary>
                  <p>
                    Public directories such as Google Maps, JustDial and IndiaMART. Every lead links to its original listing so you can check it yourself.
                  </p>
                </details>
                <details>
                  <summary>Where is my data stored?</summary>
                  <p>Leads, notes and your pipeline live in your browser. LanceBuddy never sees them.</p>
                </details>
              </div>

              {/* Developer Support Form */}
              <div style={{ marginTop: '2.5rem' }}>
                <h3 style={{ fontSize: '1.4rem', marginBottom: '0.6rem' }}>Developer Support &amp; Feedback</h3>
                <p className="d" style={{ margin: '0 0 1.2rem' }}>
                  Have an inquiry or request? Shaurya usually replies within 24 hours.
                </p>
                <form onSubmit={handleSupportSubmit} className="card" style={{ padding: '1.8rem' }}>
                  <div className="fg" style={{ marginBottom: '1rem' }}>
                    <label style={{ display: 'block', font: '500 0.72rem "Geist Mono", monospace', textTransform: 'uppercase', color: 'var(--mute)', marginBottom: '0.4rem' }}>Your Name</label>
                    <input
                      type="text"
                      required
                      maxLength={100}
                      value={supportName}
                      onChange={(e) => setSupportName(e.target.value)}
                      placeholder="Your Name"
                    />
                  </div>
                  <div className="fg" style={{ marginBottom: '1rem' }}>
                    <label style={{ display: 'block', font: '500 0.72rem "Geist Mono", monospace', textTransform: 'uppercase', color: 'var(--mute)', marginBottom: '0.4rem' }}>Your Email</label>
                    <input
                      type="email"
                      required
                      maxLength={120}
                      value={supportEmail}
                      onChange={(e) => setSupportEmail(e.target.value)}
                      placeholder="you@domain.com"
                    />
                  </div>
                  <div className="fg" style={{ marginBottom: '1.2rem' }}>
                    <label style={{ display: 'block', font: '500 0.72rem "Geist Mono", monospace', textTransform: 'uppercase', color: 'var(--mute)', marginBottom: '0.4rem' }}>Message</label>
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
                  {supportStatus && <div className="sup-status" style={{ marginTop: '0.8rem', font: '500 0.85rem "Geist Mono", monospace', color: 'var(--mute)', textAlign: 'center' }}>{supportStatus}</div>}
                </form>
              </div>

              <p className="d" style={{ marginTop: '2rem' }}>
                Direct contact: jakadwangdu@outlook.com or @official_jakadwangdu on Instagram.
              </p>
            </div>
            <footer>© 2026 LanceBuddy · Maintained by Shaurya Pratap Singh</footer>
          </section>

          {/* HUD Overlay */}
          <div id="hud" role="status" className={hudActive ? 'on' : ''}>
            <span id="hs">{hudStatus}</span>
            <div className="hb">
              <i id="hb" style={{ transform: `scaleX(${hudProgress})` }} />
            </div>
          </div>

          {/* Toast Alert */}
          <div id="toast" role="status" className={showToast ? 'on' : ''}>
            {toastMessage}
          </div>
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
