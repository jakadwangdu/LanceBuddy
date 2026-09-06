import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { blogArticles } from '../data/blogArticles';

export const BlogPage = () => {
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [newsletterStatus, setNewsletterStatus] = useState('');

  const handleNewsletterSubmit = async (e) => {
    e.preventDefault();
    setNewsletterStatus('Subscribing...');
    try {
      await fetch('https://formsubmit.co/ajax/jakadwangdu@outlook.com', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: newsletterEmail,
          _subject: 'LanceBuddy Newsletter Subscription'
        })
      });
      setNewsletterStatus('Subscribed! Check your inbox.');
      setNewsletterEmail('');
    } catch {
      setNewsletterStatus('Subscription error. Please try again.');
    }
  };

  return (
    <div className="blog-page">
      <div className="page-header">
        <h1>Freelance Growth Blog</h1>
        <p>Expert guides on freelance lead generation, cold outreach, pricing, and building a sustainable client pipeline.</p>
      </div>

      {/* Articles Grid */}
      <div className="blog-grid">
        {blogArticles.map((article) => (
          <article key={article.slug} className="article-card">
            {/* Header Icon Wrap */}
            <div className="article-image">
              <div className="article-icon-wrap">
                <i className={article.icon}></i>
              </div>
            </div>

            <div className="article-content">
              <div className="article-meta">
                <span className="article-category">{article.category}</span>
                <span>{article.date}</span>
                <span>{article.readTime} read</span>
              </div>

              <h2>
                <Link to={`/blog/${article.slug}`}>{article.title}</Link>
              </h2>

              <p className="article-excerpt">{article.excerpt}</p>

              <div className="article-footer">
                <div className="article-author">
                  <div className="author-avatar">JW</div>
                  <span>Jakad Wangdu</span>
                </div>
                <Link to={`/blog/${article.slug}`} className="read-more">
                  Read Guide <i className="ri-arrow-right-line"></i>
                </Link>
              </div>
            </div>
          </article>
        ))}
      </div>

      {/* Newsletter Signup */}
      <div className="newsletter-card">
        <h2>Get New Freelance Guides in Your Inbox</h2>
        <p>Actionable cold email breakdowns, pricing strategies, and local lead generation systems. No spam, ever.</p>
        <form onSubmit={handleNewsletterSubmit} className="newsletter-form">
          <input
            type="email"
            required
            maxLength={120}
            value={newsletterEmail}
            onChange={(e) => setNewsletterEmail(e.target.value)}
            placeholder="Enter your email address"
          />
          <button type="submit">Subscribe Free</button>
        </form>
        {newsletterStatus && <p className="newsletter-status">{newsletterStatus}</p>}
      </div>
    </div>
  );
};
