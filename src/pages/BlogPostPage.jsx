import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { blogArticles } from '../data/blogArticles';

export const BlogPostPage = () => {
  const { slug } = useParams();
  const article = blogArticles.find((a) => a.slug === slug);

  if (!article) {
    return (
      <div className="blog-not-found">
        <h2>Article Not Found</h2>
        <p>The guide you are looking for does not exist or has moved.</p>
        <Link to="/blog" className="leads-btn">
          Back to Blog
        </Link>
      </div>
    );
  }

  return (
    <article className="blog-post-page">
      <div className="post-nav-breadcrumb">
        <Link to="/blog">
          <i className="ri-arrow-left-line"></i> Back to All Guides
        </Link>
      </div>

      <div className="content-card article-view">
        <div className="article-meta">
          <span className="article-category">{article.category}</span>
          <span>{article.date}</span>
          <span>{article.readTime} read</span>
        </div>

        <h1 className="post-title">{article.title}</h1>

        <div className="article-author-header">
          <div className="author-avatar">JW</div>
          <div>
            <div className="ab-name">Jakad Wangdu</div>
            <div className="ab-role">Founder, LanceBuddy</div>
          </div>
        </div>

        {/* Content Body */}
        <div
          className="article-body"
          dangerouslySetInnerHTML={{ __html: article.content }}
        />

        {/* Article Footer CTA */}
        <div className="article-cta-box">
          <h3>Ready to put this into practice?</h3>
          <p>
            Find your first 100 prospective clients in your city in under 60 seconds with our free local business scout tool.
          </p>
          <Link to="/#scout" className="leads-btn">
            Scout Free Leads Now <i className="ri-arrow-right-line"></i>
          </Link>
        </div>
      </div>
    </article>
  );
};
