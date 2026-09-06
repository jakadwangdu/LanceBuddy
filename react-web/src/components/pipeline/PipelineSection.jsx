import React, { useState } from 'react';
import { useLeads } from '../../context/LeadsContext';
import { LeadCard } from '../scout/LeadCard';

export const PipelineSection = ({ onSelectForEmail }) => {
  const { leads = [], stats = {} } = useLeads() || {};
  const [activeTab, setActiveTab] = useState('all');

  const safeLeads = Array.isArray(leads) ? leads : [];

  const tabs = [
    { id: 'all', label: 'All Leads', count: stats?.total ?? safeLeads.length },
    { id: 'new', label: 'New', count: stats?.new ?? 0 },
    { id: 'contacted', label: 'Contacted', count: stats?.contacted ?? 0 },
    { id: 'interested', label: 'Interested', count: stats?.interested ?? 0 },
    { id: 'converted', label: 'Converted', count: stats?.converted ?? 0 },
    { id: 'lost', label: 'Lost', count: stats?.lost ?? 0 }
  ];

  const filteredLeads = activeTab === 'all'
    ? safeLeads
    : safeLeads.filter((l) => l && l.status === activeTab);

  if (!safeLeads.length) return null;

  return (
    <section className="pipeline-section" id="pipeline">
      <div className="sec-hd">
        <h2>Outreach Pipeline CRM</h2>
        <p>Track your prospecting pipeline from initial discovery to signed client contract.</p>
      </div>

      {/* Tabs */}
      <div className="pipeline-tabs">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            className={`pipeline-tab ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            <span>{tab.label}</span>
            <span className="tab-count">{tab.count}</span>
          </button>
        ))}
      </div>

      {/* Leads List */}
      <div className="pipeline-leads-grid">
        {filteredLeads.map((lead) => (
          <LeadCard
            key={lead.id}
            lead={lead}
            onSelectForEmail={onSelectForEmail}
          />
        ))}

        {!filteredLeads.length && (
          <div className="pipeline-empty">
            <i className="ri-inbox-line"></i>
            <p>No leads in the "{activeTab}" stage yet.</p>
            <span>Click on any lead's status badge to advance them through your pipeline.</span>
          </div>
        )}
      </div>
    </section>
  );
};
