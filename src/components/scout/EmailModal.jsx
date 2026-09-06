import React, { useState, useEffect } from 'react';
import { emailTemplates } from '../../data/emailTemplates';
import { useLeads } from '../../context/LeadsContext';
import { useAuth } from '../../context/AuthContext';

export const EmailModal = ({ isOpen, onClose, selectedLead }) => {
  const { leads = [], currentQuery = {} } = useLeads() || {};
  const { currentUser } = useAuth() || {};

  const safeLeads = Array.isArray(leads) ? leads.filter(Boolean) : [];
  const safeTemplates = Array.isArray(emailTemplates) ? emailTemplates : [];

  const [leadId, setLeadId] = useState(selectedLead?.id || '');
  const [templateId, setTemplateId] = useState('general');
  const [senderName, setSenderName] = useState(currentUser?.name || '');
  const [serviceName, setServiceName] = useState('Web Design & Local SEO');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (selectedLead) {
      setLeadId(selectedLead.id);
    } else if (safeLeads.length > 0 && !leadId) {
      setLeadId(safeLeads[0].id);
    }
  }, [selectedLead, safeLeads]);

  if (!isOpen) return null;

  const currentLead = safeLeads.find((l) => l.id === leadId) || selectedLead;
  const currentTemplate = safeTemplates.find((t) => t.id === templateId) || safeTemplates[0] || { subject: '', body: '' };

  const businessName = currentLead ? (currentLead.name || '[Business Name]') : '[Business Name]';
  const platform = currentLead ? (currentLead.source_platform || 'Google Maps') : 'Google Maps';
  const location = currentQuery?.loc || 'your city';
  const category = currentQuery?.biz || 'business';
  const sender = senderName.trim() || '[Your Name]';
  const service = serviceName.trim() || '[Your Service]';

  const formatText = (text) => {
    return text
      .replace(/{businessName}/g, businessName)
      .replace(/{platform}/g, platform)
      .replace(/{location}/g, location)
      .replace(/{category}/g, category)
      .replace(/{senderName}/g, sender)
      .replace(/{serviceName}/g, service);
  };

  const formattedSubject = formatText(currentTemplate.subject);
  const formattedBody = formatText(currentTemplate.body);

  const fullEmail = `Subject: ${formattedSubject}\n\n${formattedBody}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(fullEmail);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
    }
  };

  return (
    <div className="modal-overlay open" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Cold Outreach Email Generator</h3>
          <button type="button" className="modal-close" onClick={onClose}>
            <i className="ri-close-line"></i>
          </button>
        </div>

        <p className="modal-sub">
          Generate high-converting, personalized cold email scripts based on your target lead.
        </p>

        <div className="modal-form-grid">
          {/* Target Lead Selector */}
          <div className="fg">
            <label>Target Lead</label>
            <select
              value={leadId}
              onChange={(e) => setLeadId(e.target.value)}
              className="modal-select"
            >
              {safeLeads.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name} ({l.source_platform})
                </option>
              ))}
              {!safeLeads.length && <option value="">No leads in pipeline</option>}
            </select>
          </div>

          {/* Template Style */}
          <div className="fg">
            <label>Template Archetype</label>
            <select
              value={templateId}
              onChange={(e) => setTemplateId(e.target.value)}
              className="modal-select"
            >
              {safeTemplates.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>

          {/* Your Name */}
          <div className="fg">
            <label>Your Name</label>
            <input
              type="text"
              maxLength={100}
              value={senderName}
              onChange={(e) => setSenderName(e.target.value)}
              placeholder="e.g. Alex"
            />
          </div>

          {/* Your Service */}
          <div className="fg">
            <label>Service / Skill You Offer</label>
            <input
              type="text"
              maxLength={100}
              value={serviceName}
              onChange={(e) => setServiceName(e.target.value)}
              placeholder="e.g. Next.js Website, SEO, Video Editing"
            />
          </div>
        </div>

        {/* Generated Preview */}
        <div className="template-preview-box">
          <div className="template-subject-line">
            <strong>Subject:</strong> {formattedSubject}
          </div>
          <textarea
            className="template-output"
            readOnly
            value={formattedBody}
            rows={10}
          />
        </div>

        {/* Modal Actions */}
        <div className="modal-actions">
          <button
            type="button"
            className={`leads-btn ${copied ? 'copied' : ''}`}
            onClick={handleCopy}
          >
            <i className={copied ? 'ri-check-line' : 'ri-file-copy-line'}></i>
            <span>{copied ? 'Copied to Clipboard!' : 'Copy Email Script'}</span>
          </button>
          <button type="button" className="leads-btn secondary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
