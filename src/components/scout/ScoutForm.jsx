import React, { useState } from 'react';
import { useLeads } from '../../context/LeadsContext';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { RadarLoader } from './RadarLoader';

export const ScoutForm = () => {
  const { scoutLeads, isScouting, scoutMessage, currentQuery } = useLeads();
  const { currentUser, incrementScoutCount } = useAuth();

  const [bizType, setBizType] = useState(currentQuery.biz || 'Travel Agency');
  const [customBiz, setCustomBiz] = useState('');
  const [isCustom, setIsCustom] = useState(false);
  const [location, setLocation] = useState(currentQuery.loc || 'Mumbai');
  const [email, setEmail] = useState(currentUser?.email || currentQuery.email || '');

  const popularCities = ['Mumbai', 'Delhi', 'Bangalore', 'Goa', 'Chennai', 'Hyderabad', 'Pune'];

  const handleSelectChange = (e) => {
    const val = e.target.value;
    if (val === 'Custom') {
      setIsCustom(true);
    } else {
      setIsCustom(false);
      setBizType(val);
    }
  };

  const handleRevertCustom = () => {
    setIsCustom(false);
    setBizType('Travel Agency');
    setCustomBiz('');
  };

  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!currentUser) {
      navigate('/login', { state: { message: 'Please login or create an account to start scouting leads.' } });
      return;
    }

    const isPremium = currentUser.plan === 'paid-premium-plan';
    const limitReached = !isPremium && (currentUser.scoutsThisMonth || 0) >= 5;

    if (limitReached) {
      alert('You have reached your free monthly limit of 5 scouting searches. Please upgrade to Premium for unlimited market scouting!');
      const pricingEl = document.getElementById('pricing');
      if (pricingEl) pricingEl.scrollIntoView({ behavior: 'smooth' });
      return;
    }

    const finalBiz = isCustom ? customBiz.trim() : bizType;
    if (!finalBiz) {
      alert('Please specify a business sector');
      return;
    }
    if (!location.trim()) {
      alert('Please specify a location');
      return;
    }

    await scoutLeads(finalBiz, location.trim(), email.trim());
    if (!isPremium && incrementScoutCount) {
      await incrementScoutCount();
    }
  };

  return (
    <motion.div 
      className="scout-card" 
      id="scout"
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
    >
      <AnimatePresence mode="wait">
        {isScouting ? (
          <motion.div 
            key="radar-scouting"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
          >
            <RadarLoader 
              target={isCustom ? (customBiz || 'Custom Niche') : bizType} 
              location={location || 'India'} 
            />
          </motion.div>
        ) : (
          <motion.form 
            key="scout-form"
            onSubmit={handleSubmit} 
            className="scout-form"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
          >
            {/* Email */}
            <div className="f-row">
              <label className="field-label" htmlFor="deliveryEmailInput">Delivery Email</label>
              <div className="input-with-icon">
                <i className="ri-mail-line"></i>
                <input
                  id="deliveryEmailInput"
                  name="deliveryEmail"
                  type="email"
                  required
                  maxLength={120}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Delivery Email (For automated market report)"
                  aria-label="Delivery Email for automated market report"
                />
              </div>
            </div>

            {/* Sector */}
            <div className="f-row">
              <label className="field-label" htmlFor="scoutSectorSelect">Target Industry / Sector</label>
              {!isCustom ? (
                <div className="input-with-icon">
                  <i className="ri-building-line"></i>
                  <select
                    id="scoutSectorSelect"
                    name="scoutSector"
                    value={bizType}
                    onChange={handleSelectChange}
                    className="scout-select"
                    aria-label="Target Industry or Sector"
                  >
                    <option value="Cafe">☕ Cafe &amp; Coffee</option>
                    <option value="Hotel">🏨 Hotels &amp; Motels</option>
                    <option value="Travel Agency">✈️ Travel Agency</option>
                    <option value="Software Company">💻 Software &amp; IT</option>
                    <option value="Restaurant">🍽️ Restaurants &amp; Dining</option>
                    <option value="Gym">🏋️ Gym &amp; Fitness</option>
                    <option value="Salon">✂️ Salon &amp; Spa</option>
                    <option value="Custom">✨ Type Custom Sector...</option>
                  </select>
                </div>
              ) : (
                <div className="custom-input-wrap">
                  <input
                    id="customSectorInput"
                    name="customSector"
                    type="text"
                    required
                    autoFocus
                    maxLength={80}
                    value={customBiz}
                    onChange={(e) => setCustomBiz(e.target.value)}
                    placeholder="e.g. Dentists, Accountants, Interior Designers..."
                    aria-label="Custom Industry or Sector"
                  />
                  <button
                    type="button"
                    onClick={handleRevertCustom}
                    className="revert-btn"
                    title="Choose from list"
                    aria-label="Choose sector from dropdown list"
                  >
                    <i className="ri-close-line"></i>
                  </button>
                </div>
              )}
            </div>

            {/* Location */}
            <div className="f-row">
              <label className="field-label" htmlFor="scoutLocationInput">Target Location</label>
              <div className="input-with-icon">
                <i className="ri-map-pin-line"></i>
                <input
                  id="scoutLocationInput"
                  name="scoutLocation"
                  type="text"
                  required
                  maxLength={80}
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Location (e.g. Mumbai, Goa, Bangalore)"
                  aria-label="Target City or Region"
                />
              </div>
              {/* Quick Location Pills */}
              <div className="city-quick-picks">
                {popularCities.map((city) => (
                  <button
                    key={city}
                    type="button"
                    className={`city-pill ${location.toLowerCase() === city.toLowerCase() ? 'active' : ''}`}
                    onClick={() => setLocation(city)}
                  >
                    {city}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={isScouting}
              className="scout-submit-btn"
            >
              {!currentUser ? (
                <>
                  <i className="ri-login-circle-line"></i>
                  <span>Login to Scout Leads</span>
                </>
              ) : (
                <>
                  <i className="ri-search-line"></i>
                  <span>Scout Verified Leads</span>
                </>
              )}
            </button>

            {currentUser ? (
              currentUser.plan === 'paid-premium-plan' ? null : (
                <div style={{ textAlign: 'center', marginTop: '1rem', fontSize: '0.85rem', color: 'var(--muted)' }}>
                  <i className="ri-information-line"></i> You have <strong>{Math.max(0, 5 - (currentUser.scoutsThisMonth || 0))}</strong> free scouts remaining this month.
                  <br />
                  <a href="#pricing" style={{ color: 'var(--text)', textDecoration: 'underline', fontWeight: 700, marginTop: '4px', display: 'inline-block' }}>
                    Upgrade to Premium for Unlimited
                  </a>
                </div>
              )
            ) : (
              <div style={{ textAlign: 'center', marginTop: '1rem', fontSize: '0.85rem', color: 'var(--muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                <i className="ri-shield-check-line" style={{ color: '#10b981' }}></i>
                <span>5 Free Monthly Searches &bull; Premium Unlocks Unlimited</span>
              </div>
            )}
          </motion.form>
        )}
      </AnimatePresence>

      {/* Scout Status Notification */}
      {scoutMessage && (
        <div className={`scout-status-box ${scoutMessage.type}`}>
          <div>{scoutMessage.text}</div>
        </div>
      )}
    </motion.div>
  );
};
