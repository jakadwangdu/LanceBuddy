import { useEffect } from 'react';

/**
 * Lightweight Zero-Dependency SEO Manager for React SPAs
 * Dynamically synchronizes document.title, meta descriptions, canonical URLs,
 * OpenGraph, Twitter cards, and JSON-LD structured data on route changes.
 */
export const SEO = ({
  title,
  description,
  keywords,
  canonical,
  ogImage = 'https://www.lancebuddy.in/Logo.png',
  ogType = 'website',
  schema = null,
  noindex = false
}) => {
  useEffect(() => {
    // 1. Update Document Title
    const defaultTitle = 'LanceBuddy — Free Local Business Lead Finder & Client Acquisition Tool for Freelancers';
    document.title = title ? `${title}` : defaultTitle;

    // Helper to safely set or create meta tags
    const setMetaTag = (attrName, attrValue, content) => {
      if (!content) return;
      let el = document.querySelector(`meta[${attrName}="${attrValue}"]`);
      if (!el) {
        el = document.createElement('meta');
        el.setAttribute(attrName, attrValue);
        document.head.appendChild(el);
      }
      el.setAttribute('content', content);
    };

    // Robots tag (indexing control)
    setMetaTag('name', 'robots', noindex ? 'noindex, nofollow' : 'index, follow');

    // 2. Primary Meta Tags
    const defaultDesc = 'Find verified local business leads with direct owner phone numbers, Google Maps verification, cold email templates, and private CRM pipeline.';
    const finalDesc = description || defaultDesc;
    setMetaTag('name', 'description', finalDesc);

    if (keywords) {
      setMetaTag('name', 'keywords', keywords);
    }

    // 3. Canonical URL
    const finalCanonical = canonical || window.location.origin + window.location.pathname;
    let canonicalLink = document.querySelector('link[rel="canonical"]');
    if (!canonicalLink) {
      canonicalLink = document.createElement('link');
      canonicalLink.setAttribute('rel', 'canonical');
      document.head.appendChild(canonicalLink);
    }
    canonicalLink.setAttribute('href', finalCanonical);

    // 4. OpenGraph (Facebook, LinkedIn, WhatsApp)
    setMetaTag('property', 'og:title', title || defaultTitle);
    setMetaTag('property', 'og:description', finalDesc);
    setMetaTag('property', 'og:url', finalCanonical);
    setMetaTag('property', 'og:image', ogImage);
    setMetaTag('property', 'og:type', ogType);
    setMetaTag('property', 'og:site_name', 'LanceBuddy');

    // 5. Twitter / X Cards
    setMetaTag('name', 'twitter:card', 'summary_large_image');
    setMetaTag('name', 'twitter:title', title || defaultTitle);
    setMetaTag('name', 'twitter:description', finalDesc);
    setMetaTag('name', 'twitter:image', ogImage);

    // 6. JSON-LD Structured Data
    let schemaScript = document.getElementById('route-schema-jsonld');
    if (schema) {
      if (!schemaScript) {
        schemaScript = document.createElement('script');
        schemaScript.id = 'route-schema-jsonld';
        schemaScript.type = 'application/ld+json';
        document.head.appendChild(schemaScript);
      }
      schemaScript.textContent = JSON.stringify(schema);
    } else if (schemaScript) {
      schemaScript.remove();
    }

  }, [title, description, keywords, canonical, ogImage, ogType, schema, noindex]);

  return null;
};
