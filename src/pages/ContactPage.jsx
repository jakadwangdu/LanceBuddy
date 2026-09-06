import React, { useState } from 'react';
import { Link } from 'react-router-dom';

export const ContactPage = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('Feature Request / Support');
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setStatus('Sending your message...');
    try {
      await fetch('https://formsubmit.co/ajax/jakadwangdu@outlook.com', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          email,
          subject,
          message,
          _subject: `[LanceBuddy Contact] ${subject}`
        })
      });
      setStatus('Message sent successfully! Jakad usually replies within 24 hours.');
      setMessage('');
    } catch {
      setStatus('Failed to send. You can also reach out directly via email.');
    }
    setIsSubmitting(false);
  };

  return (
    <div className="contact-page">
      <div className="page-header">
        <h1>Contact &amp; Support</h1>
        <p>Questions, feedback, or custom integration requests? We'd love to hear from you.</p>
      </div>

      <div className="contact-layout">
        <div className="contact-info-card">
          <h2>Get in Touch</h2>
          <p className="contact-desc">
            LanceBuddy is built by an independent developer who values community feedback. Whether you found a bug or have a suggestion, send a note.
          </p>

          <div className="contacts-list">
            <a href="mailto:jakadwangdu@outlook.com" className="ci">
              <div className="ci-icon">
                <i className="ri-mail-line"></i>
              </div>
              <div className="ci-details">
                <strong>Email</strong>
                <span>jakadwangdu@outlook.com</span>
              </div>
            </a>

            <a
              href="https://jakadwangdu.github.io/Portfolio"
              target="_blank"
              rel="noopener noreferrer"
              className="ci"
            >
              <div className="ci-icon">
                <i className="ri-code-s-slash-line"></i>
              </div>
              <div className="ci-details">
                <strong>Developer Portfolio</strong>
                <span>jakadwangdu.github.io/Portfolio</span>
              </div>
            </a>

            <a
              href="https://instagram.com/official_jakadwangdu"
              target="_blank"
              rel="noopener noreferrer"
              className="ci"
            >
              <div className="ci-icon">
                <i className="ri-instagram-line"></i>
              </div>
              <div className="ci-details">
                <strong>Instagram</strong>
                <span>@official_jakadwangdu</span>
              </div>
            </a>
          </div>

          <div className="quick-help-box">
            <h4>Looking for quick answers?</h4>
            <p>Check out our comprehensive FAQ and troubleshooting guide in the help center.</p>
            <Link to="/help" className="quick-help-link">
              <span>Visit Help Center</span>
              <i className="ri-arrow-right-line"></i>
            </Link>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="contact-form-card">
          <h2>Send a Message</h2>

          <div className="fg">
            <label>Your Name</label>
            <input
              type="text"
              required
              maxLength={100}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Rahul Sharma"
            />
          </div>

          <div className="fg">
            <label>Your Email</label>
            <input
              type="email"
              required
              maxLength={120}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="rahul@example.com"
            />
          </div>

          <div className="fg">
            <label>Topic / Subject</label>
            <select
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="modal-select"
            >
              <option value="Feature Request">Feature Request</option>
              <option value="Bug Report">Bug Report</option>
              <option value="Lead Data Accuracy">Lead Data Question</option>
              <option value="Partnership">Partnership / Collaboration</option>
              <option value="General Question">General Question</option>
            </select>
          </div>

          <div className="fg">
            <label>Message</label>
            <textarea
              required
              rows={5}
              maxLength={2000}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Describe your question or suggestion in detail..."
            />
          </div>

          <button type="submit" disabled={isSubmitting} className="sup-submit">
            {isSubmitting ? (
              <>
                <i className="ri-loader-4-line ri-spin-anim"></i> Sending...
              </>
            ) : (
              <>
                <i className="ri-send-plane-line"></i> Send Message
              </>
            )}
          </button>

          {status && <div className="sup-status">{status}</div>}
        </form>
      </div>
    </div>
  );
};
