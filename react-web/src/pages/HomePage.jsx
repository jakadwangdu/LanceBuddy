import React, { useState } from 'react';
import { ScoutForm } from '../components/scout/ScoutForm';
import { StatsBar } from '../components/scout/StatsBar';
import { FilterBar } from '../components/scout/FilterBar';
import { LeadCard } from '../components/scout/LeadCard';
import { EmailModal } from '../components/scout/EmailModal';
import { PipelineSection } from '../components/pipeline/PipelineSection';
import { NotesSection } from '../components/notes/NotesSection';
import { useLeads } from '../context/LeadsContext';
import { faqData } from '../data/faqData';

export const HomePage = () => {
  const { leads, currentQuery, exportCSV } = useLeads();
  const [emailModalOpen, setEmailModalOpen] = useState(false);
  const [selectedLeadForEmail, setSelectedLeadForEmail] = useState(null);

  // Filters state
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');

  // FAQ accordion state
  const [openFaq, setOpenFaq] = useState(null);

  // Support form state
  const [supportName, setSupportName] = useState('');
  const [supportEmail, setSupportEmail] = useState('');
  const [supportMsg, setSupportMsg] = useState('');
  const [supportStatus, setSupportStatus] = useState('');

  const handleOpenEmail = (lead = null) => {
    setSelectedLeadForEmail(lead);
    setEmailModalOpen(true);
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
      setSupportStatus('Message sent! Jakad usually replies within 24 hours.');
      setSupportMsg('');
    } catch {
      setSupportStatus('Failed to send. You can also email directly: jakadwangdu@outlook.com');
    }
  };

  // Filter leads
  const safeLeads = Array.isArray(leads) ? leads : [];
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

  return (
    <div className="home-page">
      {/* Hero */}
      <div className="hero">
        <h1>Scout Local Markets.</h1>
        <p>
          Enter your target industry and city. Extract structured public leads with verified source links and manage them with private in-browser pipeline tools.
        </p>
      </div>

      {/* Scout Query Form */}
      <ScoutForm />

      {/* Scouted Leads Output */}
      {safeLeads.length > 0 && (
        <div className="leads-out" id="leads-results">
          <div className="leads-hdr">
            <span className="leads-title">
              {safeLeads.length} leads found — {currentQuery?.biz || 'Businesses'} in {currentQuery?.loc || 'India'}
            </span>
            <div className="leads-actions">
              <button
                type="button"
                className="leads-btn secondary"
                onClick={() => handleOpenEmail(safeLeads[0])}
              >
                <i className="ri-quill-pen-line"></i> Email Templates
              </button>
              <button type="button" className="leads-btn" onClick={exportCSV}>
                <i className="ri-file-download-line"></i> Export CSV
              </button>
            </div>
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

          <div className="leads-list">
            {filteredLeads.map((lead) => (
              <LeadCard
                key={lead.id}
                lead={lead}
                onSelectForEmail={handleOpenEmail}
              />
            ))}

            {!filteredLeads.length && (
              <div className="no-matches">
                <p>No leads match your current search and filter criteria.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Outreach Pipeline CRM */}
      <PipelineSection onSelectForEmail={handleOpenEmail} />

      {/* Notes Manager */}
      <NotesSection />

      {/* Features Grid */}
      <section className="features-section" id="features">
        <div className="sec-hd">
          <h2>Why Freelancers Choose LanceBuddy</h2>
          <p>Everything you need to prospect, pitch, and sign clients without paying for databases.</p>
        </div>

        <div className="feat-grid">
          <div className="feat-card">
            <div className="feat-icon"><i className="ri-database-2-line"></i></div>
            <h3>Direct Public Sources</h3>
            <p>Taps into Google Maps, JustDial, IndiaMART, Sulekha, and social directories with direct verification links.</p>
          </div>

          <div className="feat-card">
            <div className="feat-icon"><i className="ri-shield-check-line"></i></div>
            <h3>100% Private &amp; Local</h3>
            <p>Your notes and outreach statuses live exclusively in your browser. We never sell or inspect your lead data.</p>
          </div>

          <div className="feat-card">
            <div className="feat-icon"><i className="ri-mail-send-line"></i></div>
            <h3>Automated Email Reports</h3>
            <p>Every scout query sends a clean, formatted HTML dossier directly to your delivery inbox.</p>
          </div>

          <div className="feat-card">
            <div className="feat-icon"><i className="ri-quill-pen-line"></i></div>
            <h3>High-Converting Pitches</h3>
            <p>Built-in customizable cold email templates battle-tested for web design, SEO, marketing, and software.</p>
          </div>
        </div>
      </section>

      {/* Pricing / Free Forever Pledge */}
      <section className="pricing-section" id="pricing">
        <div className="sec-hd">
          <h2>Forever Free. No Hidden Limits.</h2>
          <p>We believe finding local business leads should never be locked behind a $100/month paywall.</p>
        </div>

        <div className="pricing-card">
          <div className="pricing-badge">COMMUNITY EDITION</div>
          <div className="pricing-cost">
            <span className="currency">₹</span>
            <span className="amount">0</span>
            <span className="period">/ lifetime</span>
          </div>
          <p className="pricing-sub">Unlimited leads, unlimited CSV exports, unlimited notes.</p>
          <ul className="pricing-features">
            <li><i className="ri-check-line"></i> Nationwide Indian business directory scouting</li>
            <li><i className="ri-check-line"></i> Global custom sector and city generator</li>
            <li><i className="ri-check-line"></i> Direct Google Maps and directory verification links</li>
            <li><i className="ri-check-line"></i> One-click WhatsApp message generation</li>
            <li><i className="ri-check-line"></i> In-browser CRM pipeline &amp; local notes</li>
            <li><i className="ri-check-line"></i> Instant CSV spreadsheet export</li>
          </ul>
        </div>
      </section>

      {/* FAQ Accordion */}
      <section className="faq-section" id="faq">
        <div className="sec-hd">
          <h2>Frequently Asked Questions</h2>
          <p>Common questions about LanceBuddy, lead accuracy, and privacy.</p>
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

      {/* Support & Contact */}
      <section className="support-section" id="contact">
        <div className="sec-hd">
          <h2>Have Questions or Need Help?</h2>
          <p>Get in touch with the developer or send feedback directly.</p>
        </div>

        <div className="sup-grid">
          <div className="sup-info">
            <h3>Direct Contact</h3>
            <p>Reach out anytime with feature suggestions, bug reports, or partnership opportunities.</p>
            <div className="contacts">
              <div className="ci">
                <div className="ci-icon"><i className="ri-mail-line"></i></div>
                <span>jakadwangdu@outlook.com</span>
              </div>
              <div className="ci">
                <div className="ci-icon"><i className="ri-code-s-slash-line"></i></div>
                <span>Maintained by Jakad Wangdu</span>
              </div>
              <div className="ci">
                <div className="ci-icon"><i className="ri-instagram-line"></i></div>
                <a
                  href="https://instagram.com/official_jakadwangdu"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  @official_jakadwangdu
                </a>
              </div>
            </div>
          </div>

          <form onSubmit={handleSupportSubmit} className="sup-form-card">
            <div className="fg">
              <label>Your Name</label>
              <input
                type="text"
                required
                maxLength={100}
                value={supportName}
                onChange={(e) => setSupportName(e.target.value)}
                placeholder="Your Name"
              />
            </div>

            <div className="fg">
              <label>Your Email</label>
              <input
                type="email"
                required
                maxLength={120}
                value={supportEmail}
                onChange={(e) => setSupportEmail(e.target.value)}
                placeholder="you@domain.com"
              />
            </div>

            <div className="fg">
              <label>Message</label>
              <textarea
                required
                rows={4}
                maxLength={2000}
                value={supportMsg}
                onChange={(e) => setSupportMsg(e.target.value)}
                placeholder="What can we help you with?"
              />
            </div>

            <button type="submit" className="sup-submit">
              <i className="ri-send-plane-line"></i> Send Message
            </button>

            {supportStatus && <div className="sup-status">{supportStatus}</div>}
          </form>
        </div>
      </section>

      {/* Email Generator Modal */}
      <EmailModal
        isOpen={emailModalOpen}
        onClose={() => setEmailModalOpen(false)}
        selectedLead={selectedLeadForEmail}
      />
    </div>
  );
};
