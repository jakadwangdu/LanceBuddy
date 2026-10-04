import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useSite } from '../context/SiteContext';
import { SEO } from '../components/common/SEO';

export const LandingPage = () => {
  const { cities, selectedCityIndex, setSelectedCityIndex } = useSite();
  const [activeNicheTab, setActiveNicheTab] = useState(0);

  // Typewriter pitch
  const pitchRef = useRef(null);
  const [pitchText, setPitchText] = useState(
    "Hi Team Aura, I noticed your firm has exceptional 4.9★ reviews on Google Maps in Indiranagar, but prospective clients have no direct portfolio link. I drafted a lightweight project gallery prototype if you'd like a quick preview."
  );
  const fullPitch =
    "Hi Team Aura, I noticed your firm has exceptional 4.9★ reviews on Google Maps in Indiranagar, but prospective clients have no direct portfolio link. I drafted a lightweight project gallery prototype if you'd like a quick preview.";

  useEffect(() => {
    const el = pitchRef.current;
    if (!el) return;
    const rm = window.matchMedia('(prefers-reduced-motion:reduce)').matches;
    if (rm) return;

    let timer = null;
    let done = false;

    if ('IntersectionObserver' in window) {
      const observer = new IntersectionObserver(
        (entries) => {
          if (done || !entries[0].isIntersecting) return;
          done = true;
          observer.disconnect();
          setPitchText('');
          el.classList.add('t');
          let k = 0;
          function type() {
            setPitchText(fullPitch.slice(0, k++));
            if (k <= fullPitch.length) {
              timer = setTimeout(type, 18);
            } else {
              el.classList.remove('t');
            }
          }
          type();
        },
        { threshold: 0.6 }
      );
      observer.observe(el);
      return () => {
        observer.disconnect();
        if (timer) clearTimeout(timer);
      };
    }
  }, [fullPitch]);

  // Interactive Kanban
  const [kanban, setKanban] = useState({
    col0: ['Aura Spatial', 'Kashi Dental'],
    col1: ['Ganga Smile'],
    col2: ['Shree Dental']
  });

  const moveTicket = (ticket, fromCol) => {
    setKanban((prev) => {
      const nextCols = ['col0', 'col1', 'col2'];
      const fromIdx = nextCols.indexOf(fromCol);
      const toCol = nextCols[(fromIdx + 1) % 3];

      return {
        ...prev,
        [fromCol]: prev[fromCol].filter((t) => t !== ticket),
        [toCol]: [...prev[toCol], ticket]
      };
    });
  };

  const selectedCity = cities[selectedCityIndex] || cities[0];
  const sampleCount = 12 + ((selectedCity.name.length * 3) % 9);

  return (
    <main>
      <SEO
        title="LanceBuddy — Direct local client discovery"
        description="Verified businesses, real phone numbers and Maps listings. Your next client, found in seconds."
        canonical="https://www.lancebuddy.in/"
      />

      {/* Hero Section */}
      <section className="sc c hero" id="s0">
        <div className="in">
          <p className="k">Free local lead finder for India</p>
          <h1>Direct local client discovery.</h1>
          <p className="d">
            Verified businesses, real phone numbers and Maps listings. Your next client, found in seconds.
          </p>
          <div className="row">
            <Link className="btn" to="/scout">
              Start free scouting{' '}
              <svg className="i" viewBox="0 0 24 24">
                <path d="M5 12h14M13 6l6 6-6 6" />
              </svg>
            </Link>
            <a className="btn ghost" href="#s1">
              Explore
            </a>
          </div>
        </div>
        <div className="cue">Scroll</div>
      </section>

      {/* 01 / Find Section */}
      <section className="sc" id="s1" data-n="01">
        <div className="in rv">
          <p className="k">01 / Find</p>
          <h2>Find.</h2>
          <p className="d">
            Pick a city and LanceBuddy returns real local businesses. Tap a city to turn the globe.
          </p>
          <div className="chips" id="cities">
            {cities.map((city, idx) => (
              <button
                key={city.name}
                type="button"
                className={`chip ${selectedCityIndex === idx ? 'on' : ''}`}
                onClick={() => setSelectedCityIndex(idx)}
              >
                {city.name}
              </button>
            ))}
          </div>
          <p className="out" id="cityout">
            Sample: {sampleCount} dental clinics in {selectedCity.name}
          </p>
          <p className="hint hd">Drag the globe to spin it. Click empty space for a shockwave.</p>
        </div>
      </section>

      {/* 02 / Verify Section */}
      <section className="sc r" id="s2" data-n="02">
        <div className="in rv">
          <p className="k">02 / Verify</p>
          <h2>Verify.</h2>
          <p className="d">
            Every lead links to its original listing, so you can check it before you send anything.
          </p>
          <div className="card">
            <p className="k" style={{ margin: 0 }}>
              Interior and architecture · Bengaluru
            </p>
            <h3>Aura Spatial Architecture</h3>
            <dl>
              <div>
                <dt>
                  <svg className="i" viewBox="0 0 24 24">
                    <path d="m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z" />
                  </svg>
                  Rating
                </dt>
                <dd>4.9 (84 reviews)</dd>
              </div>
              <div>
                <dt>
                  <svg className="i" viewBox="0 0 24 24">
                    <path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z" />
                  </svg>
                  Phone
                </dt>
                <dd>+91 98450 12847</dd>
              </div>
              <div>
                <dt>
                  <svg className="i" viewBox="0 0 24 24">
                    <path d="M12 21s7-6.2 7-11a7 7 0 0 0-14 0c0 4.8 7 11 7 11z" />
                    <circle cx="12" cy="10" r="2.5" />
                  </svg>
                  Source
                </dt>
                <dd>Google Maps, verified</dd>
              </div>
              <div>
                <dt>
                  <svg className="i" viewBox="0 0 24 24">
                    <path d="M12 3 2 20h20z" />
                    <path d="M12 10v4M12 17h.01" />
                  </svg>
                  Opportunity
                </dt>
                <dd className="u">No website found</dd>
              </div>
            </dl>
          </div>
        </div>
      </section>

      {/* 03 / Write Section */}
      <section className="sc" id="s3" data-n="03">
        <div className="in rv">
          <p className="k">03 / Write</p>
          <h2>Write.</h2>
          <p className="d">
            Your first message is drafted from what the business is actually missing.
          </p>
          <p className="pitch" id="pitch" ref={pitchRef} data-full={fullPitch}>
            {pitchText}
          </p>
          <div className="row">
            {['Portfolio website', 'Local SEO', 'Lead form'].map((tab, idx) => (
              <span
                key={tab}
                className={`chip ${activeNicheTab === idx ? 'on' : ''}`}
                onClick={() => setActiveNicheTab(idx)}
              >
                {tab}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* 04 / Track Section */}
      <section className="sc r" id="s4" data-n="04">
        <div className="in rv">
          <p className="k">04 / Track</p>
          <h2>Track.</h2>
          <p className="d">
            A private pipeline that lives in your browser. Tap a lead to move it along.
          </p>
          <div className="kb" id="kb">
            <div className="col">
              <h4>New</h4>
              {kanban.col0.map((t) => (
                <button
                  key={t}
                  type="button"
                  className="tk"
                  onClick={() => moveTicket(t, 'col0')}
                >
                  {t}
                </button>
              ))}
            </div>
            <div className="col">
              <h4>Contacted</h4>
              {kanban.col1.map((t) => (
                <button
                  key={t}
                  type="button"
                  className="tk"
                  onClick={() => moveTicket(t, 'col1')}
                >
                  {t}
                </button>
              ))}
            </div>
            <div className="col">
              <h4>Converted</h4>
              {kanban.col2.map((t) => (
                <button
                  key={t}
                  type="button"
                  className="tk"
                  onClick={() => moveTicket(t, 'col2')}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
          <p className="hint">Sample leads, to show how the pipeline works.</p>
        </div>
      </section>

      {/* 05 / Pricing Section */}
      <section className="sc c" id="s5" data-n="05">
        <div style={{ width: '100%' }}>
          <p className="k">05 / Pricing</p>
          <h2 style={{ margin: '0 auto', maxWidth: '14ch' }} className="rv">
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
              <Link className="btn ghost" to="/scout">
                Get started free
              </Link>
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
                Upgrade to Pro
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 06 / Final CTA Section */}
      <section className="sc c fin" id="s6">
        <div>
          <h2 className="rv">Your next client is already on the map.</h2>
          <div className="row rv">
            <Link className="btn" to="/scout">
              Start free scouting{' '}
              <svg className="i" viewBox="0 0 24 24">
                <path d="M5 12h14M13 6l6 6-6 6" />
              </svg>
            </Link>
          </div>
        </div>
        <footer>
          © 2026 LanceBuddy · Built for independent professionals · Maintained by Shaurya Pratap Singh
        </footer>
      </section>
    </main>
  );
};
