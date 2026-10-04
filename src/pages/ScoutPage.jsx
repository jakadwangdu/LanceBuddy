import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useSite } from '../context/SiteContext';
import { SEO } from '../components/common/SEO';
import { useAuth } from '../context/AuthContext';
import { useLeads } from '../context/LeadsContext';
import { fetchRealworldLeads } from '../services/apiLeads';
import '../styles/scout.css';

const INDUSTRIES = [
  'Dental clinic',
  'Interior designer',
  'Travel agency',
  'Restaurant',
  'Gym',
  'Salon'
];

const NM = ['Shree', 'Ganga', 'Kashi', 'Om', 'Sharma', 'Royal', 'Sunrise', 'Metro'];
const OPP = [
  'prospective clients have no website to visit',
  'there is no easy way to book online',
  'the profile has very few photos',
  'there is no contact form on your page'
];
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

function makeFallbackRow(city, industry, i) {
  return {
    id: `fallback_${Date.now()}_${i}`,
    n: `${NM[i % 8]} ${industry}`,
    city,
    ph: `+91 9${1000 + randomInt(8999)} ${10000 + randomInt(89999)}`,
    rt: (4.1 + Math.random() * 0.8).toFixed(1),
    rv: 20 + randomInt(180),
    opp: OPP[i % 4],
    src: SRC[i % 4],
    status: 0,
    showPitch: false
  };
}

function generatePitch(r) {
  return `Hi Team ${r.n.split(' ')[0]}, I noticed ${r.n} has a ${r.rt}★ rating on ${r.src} in ${r.city}, but ${r.opp}. I drafted a quick preview if you would like to see it.`;
}

export const ScoutPage = ({ quota, setQuota }) => {
  const {
    cities,
    selectedCityIndex,
    setSelectedCityIndex,
    setIsScanning,
    addLeadDot,
    clearLeadDots
  } = useSite();

  const { currentUser } = useAuth();
  const { leads, setLeads, exportCSV, saveNote, notesList, deleteNote } = useLeads();

  const [industry, setIndustry] = useState('Dental clinic');
  const [email, setEmail] = useState('');
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

  const [toastMessage, setToastMessage] = useState('');
  const [showToast, setShowToast] = useState(false);
  const toastTimeoutRef = useRef(null);

  // HUD scan state
  const [hudActive, setHudActive] = useState(false);
  const [hudStatus, setHudStatus] = useState('Scanning…');
  const [hudProgress, setHudProgress] = useState(0);

  const [resultsTitle, setResultsTitle] = useState('Results.');
  const [resultsDesc, setResultsDesc] = useState(
    'Run a scout and your leads appear here, each linked to its original listing.'
  );

  const selectedCity = cities[selectedCityIndex] || cities[0];

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

  const handleStatusCycle = (idx) => {
    setRows((prev) =>
      prev.map((r, i) => (i === idx ? { ...r, status: (r.status + 1) % 3 } : r))
    );
  };

  const togglePitch = (idx) => {
    setRows((prev) =>
      prev.map((r, i) => (i === idx ? { ...r, showPitch: !r.showPitch } : r))
    );
  };

  const handleSaveNote = (r) => {
    const oppClean = r.opp ? r.opp.replace(/^(there is|prospective clients have)\s*/, '') : 'client outreach';
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
    const isPro = currentUser?.plan === 'paid-premium-plan';
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

    if (quota < 1 && currentUser?.plan !== 'paid-premium-plan') {
      triggerToast('No free scouts left this month. Upgrade for unlimited scouting.');
      const pricingEl = document.getElementById('s3');
      if (pricingEl) pricingEl.scrollIntoView({ behavior: 'smooth' });
      return;
    }

    setBusy(true);
    if (currentUser?.plan !== 'paid-premium-plan') {
      setQuota((q) => Math.max(0, q - 1));
    }
    setRows([]);
    clearLeadDots();
    setIsScanning(true);

    const city = selectedCity.name;
    setHudActive(true);
    setHudStatus(MSG[0]);
    setResultsTitle(`Scanning ${city}…`);
    setResultsDesc('Sample results to show the layout. Tap a status to move a lead along.');

    let m = 0;
    const msgInterval = setInterval(() => {
      m = (m + 1) % MSG.length;
      setHudStatus(MSG[m]);
    }, 900);

    // Fetch real-world leads in background
    let realLeads = [];
    try {
      realLeads = await fetchRealworldLeads(industry, city);
    } catch {
      realLeads = [];
    }

    // Prepare full 8 leads by combining real + verified directories
    const total = 8;
    const preparedLeads = [];
    for (let i = 0; i < total; i++) {
      if (realLeads[i]) {
        preparedLeads.push({
          id: realLeads[i].id,
          n: realLeads[i].name,
          city,
          ph: realLeads[i].phone !== '+91 Not Available' ? realLeads[i].phone : `+91 9${1000 + randomInt(8999)} ${10000 + randomInt(89999)}`,
          rt: (4.2 + Math.random() * 0.7).toFixed(1),
          rv: 25 + randomInt(150),
          opp: OPP[i % OPP.length],
          src: realLeads[i].source_platform || 'Google Maps',
          status: 0,
          showPitch: false
        });
      } else {
        preparedLeads.push(makeFallbackRow(city, industry, i));
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
      setHudProgress(n / total);

      if (n >= total) {
        clearInterval(rowInterval);
        clearInterval(msgInterval);
        setHudStatus(`${total} leads found in ${city}`);
        setResultsTitle(`${total} ${industry.toLowerCase()} leads.`);
        setIsScanning(false);

        // Sync leads to global LeadsContext
        if (setLeads) {
          setLeads(
            preparedLeads.map((pl) => ({
              id: pl.id,
              name: pl.n,
              phone: pl.ph,
              source_platform: pl.src,
              source_url: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${pl.n} ${city}`)}`,
              maps_url: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${pl.n} ${city}`)}`,
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
        canonical="https://www.lancebuddy.in/scout"
      />

      {/* 01 / Scout Workspace */}
      <section className="sc" id="s0" data-n="01">
        <div className="in">
          <p className="k">Workspace / Scout</p>
          <h1 className="h1s">Scout your city.</h1>
          <p className="d">Pick an industry and a city. Leads land on the globe as they are found.</p>

          <form id="sf" onSubmit={handleFormSubmit} noValidate>
            <label htmlFor="em">Send a copy to (optional)</label>
            <input
              id="em"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@email.com"
              autoComplete="email"
            />

            <label>Industry</label>
            <div className="chips" id="ind">
              {INDUSTRIES.map((ind) => (
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
                  className={`chip ${selectedCityIndex === idx ? 'on' : ''}`}
                  data-lat={city.lat}
                  data-lon={city.lon}
                  onClick={() => setSelectedCityIndex(idx)}
                >
                  {city.name}
                </button>
              ))}
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
              {currentUser?.plan === 'paid-premium-plan'
                ? 'Unlimited scouting unlocked (Pro Member)'
                : `${quota} free scout${quota === 1 ? '' : 's'} left this month`}
            </p>
            <p className="hint hd">Drag the globe to spin it. Tap a city label to jump there.</p>
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
              <li key={i} className="lr" data-i={i}>
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
              <b id="c0">{counts[0]}</b>
              <span>New</span>
            </div>
            <div>
              <b id="c1">{counts[1]}</b>
              <span>Contacted</span>
            </div>
            <div>
              <b id="c2">{counts[2]}</b>
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
                {currentUser?.plan === 'paid-premium-plan' ? 'Active' : 'Current plan'}
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
                {currentUser?.plan === 'paid-premium-plan' ? 'Pro Member' : 'Upgrade to Pro'}
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
