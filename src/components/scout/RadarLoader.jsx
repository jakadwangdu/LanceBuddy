import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export const RadarLoader = ({ target = 'Businesses', location = 'Local Area' }) => {
  const containerRef = useRef(null);
  const [logIndex, setLogIndex] = useState(0);
  const [progress, setProgress] = useState(18);
  const [leadPings, setLeadPings] = useState(3);

  // Dynamic telemetry logs tailored to the target query
  const scanLogs = [
    `SYNCHRONIZING SATELLITE GEODATA FOR "${location.toUpperCase()}"...`,
    `FILTERING OPENSTREETMAP NODES FOR "${target.toUpperCase()}"...`,
    `IDENTIFYING PHYSICAL LOCATIONS & VERIFIED ADDRESSES...`,
    `PARSING DIRECT TELEPHONE, DOMAIN & OWNER CONTACTS...`,
    `EVALUATING DIGITAL FOOTPRINT & WEBSITE AUDIT SIGNALS...`,
    `COMPILING PIPELINE PROFILES & CONTACT CHANNELS...`
  ];

  // Coordinates simulation for HUD
  const geoCoords = {
    lat: (18.5 + (location.length % 10) * 1.2).toFixed(4),
    lon: (73.8 + (target.length % 10) * 1.5).toFixed(4),
  };

  // Telemetry ticker
  useEffect(() => {
    const logInterval = setInterval(() => {
      setLogIndex((prev) => (prev + 1) % scanLogs.length);
      setLeadPings((prev) => Math.min(prev + Math.floor(Math.random() * 3 + 1), 24));
    }, 1800);

    const progInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 96) return 96;
        return prev + Math.floor(Math.random() * 8 + 3);
      });
    }, 600);

    return () => {
      clearInterval(logInterval);
      clearInterval(progInterval);
    };
  }, [scanLogs.length]);

  const rigRef = useRef(null);
  const ptrRef = useRef(null);

  // Full-screen mouse tracking: direct GPU-accelerated RAF transform (zero React re-renders)
  useEffect(() => {
    let rafId = null;

    const handleGlobalMouseMove = (e) => {
      if (rafId) return;

      rafId = requestAnimationFrame(() => {
        const w = window.innerWidth || 1920;
        const h = window.innerHeight || 1080;

        // Normalized screen coordinates (-1 to 1) from screen center
        const normX = ((e.clientX / w) - 0.5) * 2;
        const normY = ((e.clientY / h) - 0.5) * 2;

        // Dynamic 3D tilt tracking cursor across the entire screen
        const tiltX = (55 - normY * 24).toFixed(2);
        const tiltY = (normX * 28).toFixed(2);
        const tiltZ = (-15 + normX * 9).toFixed(2);
        const shiftX = (normX * 22).toFixed(1);
        const shiftY = (normY * 16).toFixed(1);

        if (rigRef.current) {
          rigRef.current.style.transform = `translate3d(${shiftX}px, ${shiftY}px, 0) rotateX(${tiltX}deg) rotateY(${tiltY}deg) rotateZ(${tiltZ}deg)`;
        }
        if (ptrRef.current) {
          ptrRef.current.textContent = `PTR: ${Math.round(e.clientX)}, ${Math.round(e.clientY)}`;
        }
        rafId = null;
      });
    };

    window.addEventListener('mousemove', handleGlobalMouseMove, { passive: true });
    return () => {
      window.removeEventListener('mousemove', handleGlobalMouseMove);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, []);

  return (
    <div 
      className="radar-hud-card" 
      ref={containerRef}
    >
      {/* Top Tactical HUD Bar */}
      <div className="radar-hud-header">
        <div className="hud-status-badge">
          <span className="hud-live-dot"></span>
          <span className="hud-status-text">3D GEOSPATIAL SCANNER</span>
        </div>

        <div className="hud-telemetry-meta">
          <span className="hud-meta-item">
            <i className="ri-crosshair-2-line"></i> {geoCoords.lat}°N, {geoCoords.lon}°E
          </span>
          <span className="hud-meta-item">
            <i className="ri-cursor-line"></i> <span ref={ptrRef}>PTR: 0, 0</span>
          </span>
          <span className="hud-meta-item hide-mobile">
            <i className="ri-radar-line"></i> 9.4 GHz
          </span>
        </div>
      </div>

      {/* Target & City Announcement */}
      <div className="radar-target-banner">
        <div className="target-pill">
          <span className="tp-label">SECTOR</span>
          <span className="tp-val">{target}</span>
        </div>
        <div className="target-arrow">
          <i className="ri-arrow-right-line"></i>
        </div>
        <div className="target-pill">
          <span className="tp-label">ZONE</span>
          <span className="tp-val">{location}</span>
        </div>
        <div className="target-pill pings-pill">
          <span className="tp-label">LEADS FOUND</span>
          <span className="tp-val highlight-count">{leadPings}</span>
        </div>
      </div>

      {/* 3D Viewport Scene */}
      <div className="radar-3d-viewport">
        {/* Holographic Projection Ambient Glow */}
        <div className="radar-holo-ambient"></div>

        {/* 3D Interactive Gyro Rig Tracking Mouse Everywhere on Screen */}
        <div 
          ref={rigRef}
          className="radar-3d-rig manual-tilt"
          style={{
            transform: 'translate3d(0px, 0px, 0) rotateX(55deg) rotateY(0deg) rotateZ(-15deg)',
            willChange: 'transform'
          }}
        >
          {/* Layer -1: Ground Shadow & Floor Grid */}
          <div className="radar-layer-ground">
            <div className="ground-grid"></div>
            <div className="ground-sonar-shadow"></div>
          </div>

          {/* Layer 0: Outer Gimbal Compass Ring */}
          <div className="radar-layer-gimbal">
            <div className="gimbal-ring">
              <span className="cardinal-point north">N 000°</span>
              <span className="cardinal-point east">E 090°</span>
              <span className="cardinal-point south">S 180°</span>
              <span className="cardinal-point west">W 270°</span>
              <div className="gimbal-tick tick-0"></div>
              <div className="gimbal-tick tick-45"></div>
              <div className="gimbal-tick tick-90"></div>
              <div className="gimbal-tick tick-135"></div>
              <div className="gimbal-tick tick-180"></div>
              <div className="gimbal-tick tick-225"></div>
              <div className="gimbal-tick tick-270"></div>
              <div className="gimbal-tick tick-315"></div>
            </div>
          </div>

          {/* Layer 1: The Tactical Polar Radar Baseplate */}
          <div className="radar-layer-baseplate">
            {/* Concentric Sonar Distance Rings */}
            <div className="polar-ring r-1">
              <span className="ring-label">10 KM</span>
            </div>
            <div className="polar-ring r-2">
              <span className="ring-label">25 KM</span>
            </div>
            <div className="polar-ring r-3">
              <span className="ring-label">50 KM</span>
            </div>
            <div className="polar-ring r-4">
              <span className="ring-label">MAX</span>
            </div>

            {/* Polar Coordinate Crosshairs */}
            <div className="polar-axis axis-horizontal"></div>
            <div className="polar-axis axis-vertical"></div>
            <div className="polar-axis axis-diag-1"></div>
            <div className="polar-axis axis-diag-2"></div>

            {/* Central Holographic Emitter Core */}
            <div className="radar-emitter-core">
              <div className="core-beacon"></div>
              <div className="core-wave wave-1"></div>
              <div className="core-wave wave-2"></div>
            </div>
          </div>

          {/* Layer 2: 3D Holographic Sweeping Cone & Laser Edge */}
          <div className="radar-layer-sweep">
            <div className="sweep-disc">
              <div className="sweep-laser-line"></div>
              <div className="sweep-flare"></div>
            </div>
          </div>

          {/* Layer 3: Expanding Sonar Ripple Waves */}
          <div className="radar-layer-ripples">
            <div className="sonar-pulse-wave wave-a"></div>
            <div className="sonar-pulse-wave wave-b"></div>
          </div>

          {/* Layer 4: 3D Elevated Target Pins & Telemetry Badges */}
          <div className="radar-layer-targets">
            {/* Target 1 */}
            <div className="target-pin target-1">
              <div className="pin-ground-reticle"></div>
              <div className="pin-stem"></div>
              <div className="pin-head">
                <span className="pin-beacon"></span>
                <span className="pin-wave"></span>
              </div>
              <div className="pin-floating-tag">
                <span className="pft-name">LEAD #01</span>
                <span className="pft-sub">PHONE + WEB</span>
              </div>
            </div>

            {/* Target 2 */}
            <div className="target-pin target-2">
              <div className="pin-ground-reticle"></div>
              <div className="pin-stem"></div>
              <div className="pin-head">
                <span className="pin-beacon"></span>
                <span className="pin-wave"></span>
              </div>
              <div className="pin-floating-tag">
                <span className="pft-name">LEAD #02</span>
                <span className="pft-sub">VERIFIED DOMAIN</span>
              </div>
            </div>

            {/* Target 3 */}
            <div className="target-pin target-3">
              <div className="pin-ground-reticle"></div>
              <div className="pin-stem"></div>
              <div className="pin-head">
                <span className="pin-beacon"></span>
                <span className="pin-wave"></span>
              </div>
              <div className="pin-floating-tag">
                <span className="pft-name">LEAD #03</span>
                <span className="pft-sub">DIRECT CONTACT</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Tactical Readout & Telemetry Stream */}
      <div className="radar-hud-footer">
        {/* Terminal Live Activity Log */}
        <div className="hud-terminal-stream">
          <div className="terminal-prefix">
            <i className="ri-terminal-box-line"></i>
            <span>SCAN_LOG:</span>
          </div>
          <AnimatePresence mode="wait">
            <motion.div
              key={logIndex}
              className="terminal-message"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.25 }}
            >
              {scanLogs[logIndex]}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Live Metrics: Frequency Audio Bars + Progress Bar */}
        <div className="hud-metrics-row">
          {/* Signal Spectrum Bars */}
          <div className="hud-signal-spectrum" title="Geospatial Signal Stream">
            <span className="spectrum-label">RF_STREAM</span>
            <div className="spectrum-bars">
              {[60, 90, 45, 100, 75, 85, 40, 95].map((h, i) => (
                <span 
                  key={i} 
                  className="spec-bar" 
                  style={{ 
                    animationDelay: `${i * 0.12}s`,
                    '--max-h': `${h}%` 
                  }}
                ></span>
              ))}
            </div>
          </div>

          {/* Sync Progress Bar */}
          <div className="hud-progress-wrap">
            <div className="hud-progress-info">
              <span>EXTRACTION MATRIX</span>
              <span>{progress}%</span>
            </div>
            <div className="hud-progress-track">
              <div 
                className="hud-progress-fill" 
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
