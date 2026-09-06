import React, { useState } from 'react';
import { useLeads } from '../../context/LeadsContext';
import { useAuth } from '../../context/AuthContext';

export const ScoutForm = () => {
  const { scoutLeads, isScouting, scoutMessage, currentQuery } = useLeads();
  const { currentUser } = useAuth();

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

  const handleSubmit = (e) => {
    e.preventDefault();
    const finalBiz = isCustom ? customBiz.trim() : bizType;
    if (!finalBiz) {
      alert('Please specify a business sector');
      return;
    }
    if (!location.trim()) {
      alert('Please specify a location');
      return;
    }
    scoutLeads(finalBiz, location.trim(), email.trim());
  };

  return (
    <div className="scout-card" id="scout">
      <form onSubmit={handleSubmit} className="scout-form">
        {/* Email */}
        <div className="f-row">
          <label className="field-label">Delivery Email</label>
          <div className="input-with-icon">
            <i className="ri-mail-line"></i>
            <input
              type="email"
              required
              maxLength={120}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Delivery Email (For automated market report)"
            />
          </div>
        </div>

        {/* Sector */}
        <div className="f-row">
          <label className="field-label">Target Industry / Sector</label>
          {!isCustom ? (
            <div className="input-with-icon">
              <i className="ri-building-line"></i>
              <select
                value={bizType}
                onChange={handleSelectChange}
                className="scout-select"
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
                type="text"
                required
                autoFocus
                maxLength={80}
                value={customBiz}
                onChange={(e) => setCustomBiz(e.target.value)}
                placeholder="e.g. Dentists, Accountants, Interior Designers..."
              />
              <button
                type="button"
                onClick={handleRevertCustom}
                className="revert-btn"
                title="Choose from list"
              >
                <i className="ri-close-line"></i>
              </button>
            </div>
          )}
        </div>

        {/* Location */}
        <div className="f-row">
          <label className="field-label">Target Location</label>
          <div className="input-with-icon">
            <i className="ri-map-pin-line"></i>
            <input
              type="text"
              required
              maxLength={80}
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Location (e.g. Mumbai, Goa, Bangalore)"
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

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isScouting}
          className="scout-submit-btn"
        >
          {isScouting ? (
            <>
              <i className="ri-loader-4-line ri-spin-anim"></i>
              <span>Scouting Market &amp; Extracting Leads...</span>
            </>
          ) : (
            <>
              <i className="ri-search-line"></i>
              <span>Scout Verified Leads</span>
            </>
          )}
        </button>
      </form>

      {/* Scout Status Notification */}
      {scoutMessage && (
        <div className={`scout-status-box ${scoutMessage.type}`}>
          <div>{scoutMessage.text}</div>
        </div>
      )}
    </div>
  );
};
