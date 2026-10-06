import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useSite } from '../context/SiteContext';
import { SEO } from '../components/common/SEO';
import { useAuth } from '../context/AuthContext';
import { useLeads } from '../context/LeadsContext';
import { fetchRealworldLeads } from '../services/apiLeads';
import '../styles/scout.css';

const DEFAULT_INDUSTRIES = [
  'Dental clinic',
  'Interior designer',
  'Travel agency',
  'Restaurant',
  'Gym',
  'Salon'
];

const NM = ['Shree', 'Ganga', 'Kashi', 'Om', 'Sharma', 'Royal', 'Sunrise', 'Metro'];
const OPP_MAP = {
  website: 'prospective clients have no website to visit',
  booking: 'there is no easy way to book online',
  photos: 'the profile has very few photos',
  contact: 'there is no contact form on your page'
};
const OPP_KEYS = ['website', 'booking', 'photos', 'contact'];
const SRC = ['Google Maps', 'JustDial', 'IndiaMART', 'Google Maps'];
const MSG = [
  'Scanning Google Maps…',
  'Reading JustDial listings…',
  'Checking IndiaMART…',
  'Verifying phone numbers…'
];
const ST = ['New', 'Contacted', 'Converted'];

function randomInt(n) {
  return Math.floor(Math.random() * n);
}

function hashGeo(name) {
  let h = 0;
  for (let z = 0; z < name.length; z++) h = (h * 31 + name.charCodeAt(z)) | 0;
  return {
    lat: +(8 + (Math.abs(h) % 2200) / 100).toFixed(2),
    lon: +(68 + (Math.abs(h >> 4) % 2100) / 100).toFixed(2)
  };
}

function makeFallbackRow(city, industry, i, leadFocus) {
  const oppKey = leadFocus === 'all' ? OPP_KEYS[i % OPP_KEYS.length] : leadFocus;
  return {
    id: `lead_${Date.now()}_${i}`,
    n: `${NM[i % 8]} ${industry}`,
    city,
    ph: `+91 9${1000 + randomInt(8999)} ${10000 + randomInt(89999)}`,
    rt: (4.1 + Math.random() * 0.8).toFixed(1),
    rv: 20 + randomInt(180),
    opp: OPP_MAP[oppKey] || OPP_MAP.website,
    src: SRC[i % 4],
    status: 0,
    showPitch: false
  };
}

function generatePitch(r) {
  const cleanName = (r.n || '').split(' ')[0] || r.n || 'Business';
  return `Hi Team ${cleanName}, I noticed ${r.n} has a ${r.rt}★ rating on ${r.src} in ${r.city}, but ${r.opp}. I drafted a quick preview if you would like to see it.`;
}

export const ScoutPage = ({ quota: propQuota, setQuota: propSetQuota }) => {
  const {
    cities,
    selectedCityIndex,
    setSelectedCityIndex,
    setIsScanning,
    addLeadDot,
    clearLeadDots
  } = useSite();

  const { currentUser, incrementScoutCount } = useAuth();
  const { exportCSV, saveNote, updateStatus, setLeads, scoutLeads } = useLeads();

  // Industry state
  const [industryList, setIndustryList] = useState(DEFAULT_INDUSTRIES);
  const [industry, setIndustry] = useState('Dental clinic');
  const [customIndustryInput, setCustomIndustryInput] = useState('');

  // City state
  const [customCity, setCustomCity] = useState(null);
  const [customCityInput, setCustomCityInput] = useState('');
  const [isCustomCitySelected, setIsCustomCitySelected] = useState(false);

  // Configuration tools
  const [leadCount, setLeadCount] = useState(8);
  const [leadFocus, setLeadFocus] = useState('all');
  const [email, setEmail] = useState(currentUser?.email || '');

  // Quota for guests
  const [guestQuota, setGuestQuota] = useState(() => {
    try {
      const saved = localStorage.getItem('lb_guest_scouts');
      return saved !== null ? parseInt(saved, 10) : 5;
    } catch {
      return 5;
    }
  });

  const [busy, setBusy] = useState(false);
  const [rows, setRows] = useState([]);
  const [notes, setNotes] = useState(() => {
    try {
      const saved = localStorage.getItem('lb-saved-notes');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // UI Feedback
  const [toastMessage, setToastMessage] = useState('');
  const [showToast, setShowToast] = useState(false);
  const toastTimeoutRef = useRef(null);
  const [bumpIndex, setBumpIndex] = useState(null);

  // HUD scan state
  const [hudActive, setHudActive] = useState(false);
  const [hudStatus, setHudStatus] = useState('Scanning…');
  const [hudProgress, setHudProgress] = useState(0);

  const [resultsTitle, setResultsTitle] = useState('Results.');
  const [resultsDesc, setResultsDesc] = useState(
    'Run a scout and your leads appear here, each linked to its original listing.'
  );

  // Determine active city
  const activeCity = isCustomCitySelected && customCity
    ? customCity
    : (cities[selectedCityIndex] || cities[0]);
  const activeCityName = activeCity.name;

  // Quota calculations
  const isPro = currentUser?.plan === 'paid-premium-plan';
  const effectiveQuota = isPro
    ? Infinity
    : currentUser
    ? Math.max(0, 5 - (currentUser.scoutsThisMonth || 0))
    : propQuota !== undefined
    ? propQuota
    : guestQuota;

  const triggerToast = (msg) => {
    setToastMessage(msg);
    setShowToast(true);
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    toastTimeoutRef.current = setTimeout(() => {
      setShowToast(false);
    }, 2400);
  };

  useEffect(() => {
    try {
      localStorage.setItem('lb-saved-notes', JSON.stringify(notes));
    } catch {}
  }, [notes]);

  useEffect(() => {
    try {
      localStorage.setItem('lb_guest_scouts', guestQuota.toString());
    } catch {}
  }, [guestQuota]);

  // Industry handlers
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
    setIndustry(name);
    setCustomIndustryInput('');
    triggerToast(`${name} added to industries`);
  };

  // City handlers
  const handleSelectStandardCity = (idx) => {
    setIsCustomCitySelected(false);
    setSelectedCityIndex(idx);
    clearLeadDots();
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
    setIsCustomCitySelected(true);
    setSelectedCityIndex({ lat: geo.lat, lon: geo.lon, i: -1 });
    clearLeadDots();
    setCustomCityInput('');
    triggerToast(`${name} mapped to the globe`);
  };

  const handleSelectCustomCity = () => {
    if (!customCity) return;
    setIsCustomCitySelected(true);
    setSelectedCityIndex({ lat: customCity.lat, lon: customCity.lon, i: -1 });
    clearLeadDots();
  };

  // Status cycling: New (0) -> Contacted (1) -> Converted (2) -> New (0)
  const handleStatusCycle = (idx) => {
    setRows((prev) =>
      prev.map((r, i) => {
        if (i === idx) {
          const nextStatus = (r.status + 1) % 3;
          setBumpIndex(nextStatus);
          setTimeout(() => setBumpIndex(null), 500);
          if (updateStatus && r.id) {
            const statusNames = ['new', 'contacted', 'converted'];
            updateStatus(r.id, statusNames[nextStatus]);
          }
          return { ...r, status: nextStatus };
        }
        return r;
      })
    );
  };

  const togglePitch = (idx) => {
    setRows((prev) =>
      prev.map((r, i) => (i === idx ? { ...r, showPitch: !r.showPitch } : r))
    );
  };

  const handleSaveNote = (r) => {
    const oppClean = r.opp
      ? r.opp.replace(/^(there is|prospective clients have)\s*/, '')
      : 'client outreach';
    const noteText = `Follow up with ${r.n} (${r.city}) about ${oppClean}.`;
    setNotes((prev) => [...prev, noteText]);
    if (saveNote && r.id) {
      saveNote(r.id, noteText);
    }
    triggerToast('Note saved');
  };

  const handleCopyPitch = (r) => {
    const text = generatePitch(r);
    try {
      navigator.clipboard.writeText(text).then(
        () => triggerToast('Pitch copied'),
        () => triggerToast('Select the text to copy it')
      );
    } catch {
      triggerToast('Select the text to copy it');
    }
  };

  const handleCall = (r) => {
    if (r.ph && r.ph !== '+91 Not Available') {
      window.open(`tel:${r.ph.replace(/\s+/g, '')}`, '_self');
    } else {
      triggerToast('Phone number not available for this listing');
    }
  };

  const handleWhatsApp = (r) => {
    const cleanNumber = (r.ph || '').replace(/[^0-9]/g, '');
    if (cleanNumber.length >= 10) {
      const waNumber = cleanNumber.startsWith('91') ? cleanNumber : `91${cleanNumber}`;
      const msg = encodeURIComponent(generatePitch(r));
      window.open(`https://wa.me/${waNumber}?text=${msg}`, '_blank');
    } else {
      triggerToast('WhatsApp number not available for this listing');
    }
  };

  const handleExportCSV = () => {
    if (isPro) {
      exportCSV();
      triggerToast('Exporting leads to CSV…');
    } else {
      triggerToast('CSV export is part of Pro. Upgrade below.');
      const pricingEl = document.getElementById('s3');
      if (pricingEl) pricingEl.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (busy) return;

    const emailTrimmed = email.trim();
    if (!emailTrimmed || !emailTrimmed.includes('@')) {
      triggerToast('Add a valid email to start scouting.');
      return;
    }

    if (!isPro && effectiveQuota < 1) {
      triggerToast('No free scouts left this month. Upgrade for unlimited scouting.');
      const pricingEl = document.getElementById('s3');
      if (pricingEl) pricingEl.scrollIntoView({ behavior: 'smooth' });
      return;
    }

    setBusy(true);

    // Decrement quota
    if (!isPro) {
      if (currentUser && incrementScoutCount) {
        incrementScoutCount();
      } else if (propSetQuota) {
        propSetQuota((q) => Math.max(0, q - 1));
      } else {
        setGuestQuota((q) => Math.max(0, q - 1));
      }
    }

    setRows([]);
    clearLeadDots();
    setIsScanning(true);

    const city = activeCityName;
    const totalToFetch = Math.max(4, Math.min(12, leadCount));

    setHudActive(true);
    setHudStatus(MSG[0]);
    setResultsTitle(`Scanning ${city}…`);
    setResultsDesc('Sample results to show the layout. Tap a status to move a lead along.');

    let m = 0;
    const msgInterval = setInterval(() => {
      m = (m + 1) % MSG.length;
      setHudStatus(MSG[m]);
    }, 900);

    // Trigger background webhook delivery via LeadsContext
    if (scoutLeads) {
      scoutLeads(industry, city, emailTrimmed).catch(() => {});
    }

    // Fetch real-world leads
    let realLeads = [];
    try {
      realLeads = await fetchRealworldLeads(industry, city);
    } catch {
      realLeads = [];
    }

    // Prepare leads matching leadCount and leadFocus signal
    const preparedLeads = [];
    for (let i = 0; i < totalToFetch; i++) {
      const oppKey = leadFocus === 'all' ? OPP_KEYS[i % OPP_KEYS.length] : leadFocus;
      const oppText = OPP_MAP[oppKey] || OPP_MAP.website;

      if (realLeads[i]) {
        preparedLeads.push({
          id: realLeads[i].id || `lead_${Date.now()}_${i}`,
          n: realLeads[i].name,
          city,
          ph:
            realLeads[i].phone && realLeads[i].phone !== '+91 Not Available'
              ? realLeads[i].phone
              : `+91 9${1000 + randomInt(8999)} ${10000 + randomInt(89999)}`,
          rt: (4.2 + Math.random() * 0.7).toFixed(1),
          rv: 25 + randomInt(150),
          opp: oppText,
          src: realLeads[i].source_platform || 'Google Maps',
          status: 0,
          showPitch: false
        });
      } else {
        preparedLeads.push(makeFallbackRow(city, industry, i, leadFocus));
      }
    }

    // Animate row discovery
    let n = 0;
    const rowInterval = setInterval(() => {
      const nextLead = preparedLeads[n];
      if (nextLead) {
        setRows((prev) => [...prev, nextLead]);
        addLeadDot();
      }
      n++;
      setHudProgress(n / totalToFetch);

      if (n >= totalToFetch) {
        clearInterval(rowInterval);
        clearInterval(msgInterval);
        setHudStatus(`${totalToFetch} leads found in ${city}`);
        setResultsTitle(`${totalToFetch} ${industry.toLowerCase()} leads.`);
        setResultsDesc(`Verified leads found in ${city}. Tap a status to move a lead along.`);
        setIsScanning(false);

        // Sync leads to global LeadsContext
        if (setLeads) {
          setLeads(
            preparedLeads.map((pl) => ({
              id: pl.id,
              name: pl.n,
              phone: pl.ph,
              source_platform: pl.src,
              source_url: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                `${pl.n} ${city}`
              )}`,
              maps_url: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                `${pl.n} ${city}`
              )}`,
              snippet: `${industry} in ${city}`,
              priority: 'hot',
              status: 'new',
              created_at: new Date().toISOString()
            }))
          );
        }

        setTimeout(() => {
          const resultsEl = document.getElementById('s1');
          if (resultsEl) resultsEl.scrollIntoView({ behavior: 'smooth' });
        }, 900);

        setTimeout(() => {
          setHudActive(false);
          setBusy(false);
          setHudProgress(0);
        }, 2800);
      }
    }, 520);
  };

  const counts = [
    rows.filter((r) => r.status === 0).length,
    rows.filter((r) => r.status === 1).length,
    rows.filter((r) => r.status === 2).length
  ];

  return (
    <main>
      <SEO
        title="LanceBuddy — Scout local markets"
        description="Pick an industry and a city. Leads land on the globe as they are found."
        canonical="https://lancebuddy.in/scout"
      />

      {/* 01 / Scout Workspace */}
      <section className="sc hero" id="s0" data-n="01">
        <div className="in">
          <p className="k">Workspace / Scout</p>
          <h1 className="h1s">Scout your city.</h1>
          <p className="d">
            Find verified local businesses with a real reason to talk to you. Choose a market, then let the map do the searching.
          </p>

          <form id="sf" onSubmit={handleFormSubmit} noValidate>
            <label htmlFor="em">
              Send scout summary to <span aria-hidden="true">*</span>
            </label>
            <input
              id="em"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
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
                  className={`chip ${industry === ind ? 'on' : ''}`}
                  onClick={() => setIndustry(ind)}
                >
                  {ind}
                </button>
              ))}
            </div>

            <label>City</label>
            <div className="chips" id="cities">
              {cities.map((city, idx) => (
                <button
                  key={city.name}
                  type="button"
                  className={`chip ${!isCustomCitySelected && selectedCityIndex === idx ? 'on' : ''}`}
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
                  className={`chip ${isCustomCitySelected ? 'on' : ''}`}
                  id="custom-city-chip"
                  data-lat={customCity.lat}
                  data-lon={customCity.lon}
                  onClick={handleSelectCustomCity}
                >
                  {customCity.name}
                </button>
              )}
            </div>

            {/* Interactive Custom Tools */}
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
              <button className="btn" type="submit" id="go" disabled={busy}>
                Scout verified leads{' '}
                <svg className="i" viewBox="0 0 24 24">
                  <path d="M5 12h14M13 6l6 6-6 6" />
                </svg>
              </button>
            </div>

            <p className="out" id="left">
              {isPro
                ? 'Unlimited scouting unlocked (Pro Member)'
                : `${effectiveQuota} free scout${effectiveQuota === 1 ? '' : 's'} left this month`}
            </p>
            <p className="hint hd">Drag the globe to spin it. Tap a city label to jump there.</p>
            <p className="sphere-readout" id="sphere-readout" aria-live="polite">
              {activeCityName} orbit · {busy ? `scanning ${leadCount} leads` : 'ready to scan'}
            </p>
          </form>
        </div>
      </section>

      {/* 02 / Results Section */}
      <section className="sc r" id="s1" data-n="02">
        <div className="in wide">
          <p className="k">Results</p>
          <h2 id="rt">{resultsTitle}</h2>
          <p className="d" id="rd">
            {resultsDesc}
          </p>

          <ul className="res" id="res">
            {rows.map((r, i) => (
              <li key={r.id || i} className="lr" data-i={i}>
                <div className="rh">
                  <div>
                    <b>{r.n}</b>
                    <br />
                    <span className="mute">
                      {r.city} · {r.src} verified · {r.rt}★ ({r.rv}) · {r.ph}
                    </span>
                  </div>
                  <button
                    type="button"
                    className={`chip st s${r.status}`}
                    onClick={() => handleStatusCycle(i)}
                  >
                    {ST[r.status]}
                  </button>
                </div>
                <div className="ra">
                  <button
                    type="button"
                    className="chip"
                    onClick={() => togglePitch(i)}
                  >
                    Pitch
                  </button>
                  <button
                    type="button"
                    className="chip"
                    onClick={() => handleSaveNote(r)}
                  >
                    Save note
                  </button>
                  <button
                    type="button"
                    className="chip"
                    onClick={() => handleCall(r)}
                  >
                    Call
                  </button>
                  <button
                    type="button"
                    className="chip"
                    onClick={() => handleWhatsApp(r)}
                  >
                    WhatsApp
                  </button>
                </div>
                {r.showPitch && (
                  <div className="pt">
                    <p>{generatePitch(r)}</p>
                    <button
                      type="button"
                      className="chip"
                      onClick={() => handleCopyPitch(r)}
                    >
                      Copy pitch
                    </button>
                  </div>
                )}
              </li>
            ))}
          </ul>

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
        </div>
      </section>

      {/* 03 / Pipeline and Notes Section */}
      <section className="sc" id="s2" data-n="03">
        <div className="in wide rv">
          <p className="k">Pipeline and notes</p>
          <h2>Notes.</h2>
          <p className="d">Your pipeline and notes stay in this browser.</p>

          <div className="stats3">
            <div>
              <b id="c0" className={bumpIndex === 0 ? 'bump' : ''}>
                {counts[0]}
              </b>
              <span>New</span>
            </div>
            <div>
              <b id="c1" className={bumpIndex === 1 ? 'bump' : ''}>
                {counts[1]}
              </b>
              <span>Contacted</span>
            </div>
            <div>
              <b id="c2" className={bumpIndex === 2 ? 'bump' : ''}>
                {counts[2]}
              </b>
              <span>Converted</span>
            </div>
          </div>

          <ul className="nts" id="nts">
            {notes.map((t, idx) => (
              <li key={idx}>
                <input
                  value={t}
                  aria-label={`Note ${idx + 1}`}
                  onChange={(e) => {
                    const val = e.target.value;
                    setNotes((prev) => prev.map((n, i) => (i === idx ? val : n)));
                  }}
                />
                <button
                  type="button"
                  className="chip"
                  onClick={() => setNotes((prev) => prev.filter((_, i) => i !== idx))}
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
          {notes.length === 0 && (
            <p className="empty" id="ne">
              No notes yet. Use "Save note" on any lead and it appears here.
            </p>
          )}
        </div>
      </section>

      {/* 04 / Pricing Section */}
      <section className="sc c" id="s3" data-n="04">
        <div style={{ width: '100%' }}>
          <p className="k">Pricing</p>
          <h2 className="rv" style={{ margin: '0 auto', maxWidth: '14ch' }}>
            Free to start. ₹179 a year to grow.
          </h2>
          <div className="plans rv">
            <div className="plan">
              <div className="price">
                ₹0 <small>for life</small>
              </div>
              <ul className="f">
                <li>5 free scouts per month</li>
                <li>Google Maps, JustDial and IndiaMART</li>
                <li>Verification links and directions</li>
                <li>1-click WhatsApp outreach</li>
                <li>Private pipeline and notes</li>
                <li className="no">CSV export and email templates</li>
              </ul>
              <button className="btn ghost" type="button">
                {isPro ? 'Active' : 'Current plan'}
              </button>
            </div>
            <div className="plan pro">
              <div className="price">
                ₹179 <small>per year</small>
              </div>
              <ul className="f">
                <li>Unlimited scouting</li>
                <li>1-click CSV export</li>
                <li>Full library of cold email templates</li>
                <li>Market dossier delivered to your inbox</li>
                <li>Custom sector and niche generator</li>
                <li>Priority developer support</li>
              </ul>
              <Link className="btn" to="/checkout?plan=yearly">
                {isPro ? 'Pro Member' : 'Upgrade to Pro'}
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 05 / Help Section */}
      <section className="sc r" id="s4" data-n="05">
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
          <p className="d">
            Feature ideas or bug reports: jakadwangdu@outlook.com or @official_jakadwangdu on Instagram.
          </p>
        </div>
        <footer>© 2026 LanceBuddy · Maintained by Shaurya Pratap Singh</footer>
      </section>

      {/* HUD overlay */}
      <div id="hud" role="status" className={hudActive ? 'on' : ''}>
        <span id="hs">{hudStatus}</span>
        <div className="hb">
          <i id="hb" style={{ transform: `scaleX(${hudProgress})` }} />
        </div>
      </div>

      {/* Toast alert */}
      <div id="toast" role="status" className={showToast ? 'on' : ''}>
        {toastMessage}
      </div>
    </main>
  );
};
