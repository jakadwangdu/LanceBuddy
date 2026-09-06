import React, { useState } from 'react';
import { useLeads } from '../../context/LeadsContext';

export const LeadCard = ({ lead, onSelectForEmail }) => {
  if (!lead) return null;

  const { updateStatus, saveNote, deleteLead } = useLeads();
  const [showNotes, setShowNotes] = useState(Boolean(lead?.notes && lead?.notes.length > 0));
  const [noteText, setNoteText] = useState(lead?.notes || '');
  const [copied, setCopied] = useState(false);

  const cleanPhone = (lead?.phone || '').replace(/[^0-9+]/g, '');
  const leadName = lead?.name || 'Local Business';
  const leadSnippet = lead?.snippet || 'Verified local business listing.';
  const leadPlatform = lead?.source_platform || 'Google Maps';
  const leadSourceUrl = lead?.source_url || `https://maps.google.com/?q=${encodeURIComponent(leadName)}`;
  const mapsUrl = lead?.maps_url || `https://maps.google.com/?q=${encodeURIComponent(leadName)}`;
  const status = lead?.status || 'new';
  const priority = lead?.priority || 'warm';

  const handleCopyPhone = async () => {
    try {
      await navigator.clipboard.writeText(cleanPhone);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
    }
  };

  const handleNoteChange = (e) => {
    const val = e.target.value;
    setNoteText(val);
    saveNote(lead.id, val);
  };

  return (
    <div className={`lcard ${status}`} data-priority={priority}>
      {/* Top Details */}
      <div className="lcard-top">
        <div className="lcard-info">
          <h3 className="lcard-name">{leadName}</h3>
          <p className="lcard-snip">{leadSnippet}</p>
        </div>
        <a
          href={leadSourceUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="lcard-view"
          title={`View on ${leadPlatform}`}
        >
          View Source <i className="ri-arrow-right-up-line"></i>
        </a>
      </div>

      {/* Directory & Maps Meta */}
      <div className="lcard-directory-row">
        <div className="lcard-source">
          <i className="ri-links-line"></i>
          <a href={leadSourceUrl} target="_blank" rel="noopener noreferrer">
            {leadPlatform} Listing
          </a>
        </div>

        <div className="lcard-maps">
          <i className="ri-map-pin-line" style={{ color: '#ef4444' }}></i>
          <a href={mapsUrl} target="_blank" rel="noopener noreferrer" className="maps-link">
            Google Maps
          </a>
          <a href={mapsUrl} target="_blank" rel="noopener noreferrer" className="maps-directions">
            <i className="ri-direction-line"></i> Directions
          </a>
        </div>
      </div>

      {/* Contact Metadata */}
      <div className="lcard-meta">
        <span>
          <i className="ri-phone-line"></i> {lead?.phone || 'Contact on site'}
        </span>
        <span>
          <i className="ri-stack-line"></i> Verified Public Listing
        </span>
      </div>

      {/* Action Buttons */}
      <div className="lcard-actions">
        {/* Status Badge */}
        <button
          type="button"
          className={`status-badge ${status}`}
          onClick={() => updateStatus(lead.id)}
          title="Click to cycle status (New -> Contacted -> Interested -> Converted -> Lost)"
        >
          {status}
        </button>

        {/* Priority Badge */}
        <span className={`priority-badge ${priority}`}>{priority}</span>

        {/* Copy Phone */}
        <button
          type="button"
          className={`lcard-act-btn ${copied ? 'copied' : ''}`}
          onClick={handleCopyPhone}
        >
          <i className={copied ? 'ri-check-line' : 'ri-file-copy-line'}></i>
          <span>{copied ? 'Copied!' : 'Copy'}</span>
        </button>

        {/* WhatsApp */}
        {cleanPhone && (
          <a
            className="lcard-act-btn whatsapp"
            href={`https://wa.me/${cleanPhone}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            <i className="ri-whatsapp-line"></i> WhatsApp
          </a>
        )}

        {/* Email Generator */}
        {onSelectForEmail && (
          <button
            type="button"
            className="lcard-act-btn email"
            onClick={() => onSelectForEmail(lead)}
            title="Generate custom cold email"
          >
            <i className="ri-quill-pen-line"></i> Pitch
          </button>
        )}

        {/* Notes Toggle */}
        <button
          type="button"
          className={`lcard-act-btn notes-btn ${noteText ? 'has-notes' : ''}`}
          onClick={() => setShowNotes(!showNotes)}
        >
          <i className="ri-sticky-note-line"></i> Notes
          {noteText && <span className="notes-indicator-dot"></span>}
        </button>

        {/* Delete */}
        <button
          type="button"
          className="lcard-act-btn delete"
          onClick={() => deleteLead(lead.id)}
          title="Remove lead"
        >
          <i className="ri-delete-bin-line"></i>
        </button>
      </div>

      {/* Notes Expansion */}
      {showNotes && (
        <div className="lcard-notes">
          <textarea
            value={noteText}
            maxLength={3000}
            onChange={handleNoteChange}
            placeholder="Add outreach notes, call logs, requirements... (Auto-saved to browser)"
            rows={3}
          />
          <div className="notes-hint">Notes are saved privately on your device.</div>
        </div>
      )}
    </div>
  );
};
