import React, { useState, useEffect } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { Navbar } from './components/layout/Navbar';
import { MobileDock } from './components/layout/MobileDock';
import { MoreSheet } from './components/layout/MoreSheet';
import { Footer } from './components/layout/Footer';
import { ConsentNotice } from './components/layout/ConsentNotice';
import { HomePage } from './pages/HomePage';

import { Glow } from './components/Glow';
import { Globe } from './components/Globe';
import { ProgressBar } from './components/ProgressBar';

// Code-split secondary routes to shrink initial bundle and accelerate page load
const AboutPage = React.lazy(() => import('./pages/AboutPage').then(m => ({ default: m.AboutPage })));
const BlogPage = React.lazy(() => import('./pages/BlogPage').then(m => ({ default: m.BlogPage })));
const BlogPostPage = React.lazy(() => import('./pages/BlogPostPage').then(m => ({ default: m.BlogPostPage })));
const ContactPage = React.lazy(() => import('./pages/ContactPage').then(m => ({ default: m.ContactPage })));
const HelpPage = React.lazy(() => import('./pages/HelpPage').then(m => ({ default: m.HelpPage })));
const LoginPage = React.lazy(() => import('./pages/LoginPage').then(m => ({ default: m.LoginPage })));
const LegalPage = React.lazy(() => import('./pages/LegalPage').then(m => ({ default: m.LegalPage })));
const NotFoundPage = React.lazy(() => import('./pages/NotFoundPage').then(m => ({ default: m.NotFoundPage })));
const CheckoutPage = React.lazy(() => import('./pages/CheckoutPage').then(m => ({ default: m.CheckoutPage })));

// Scroll to top or target section on route changes
function ScrollToTop() {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    const sectionRoutes = ['/notes', '/scout', '/pipeline', '/pricing', '/faq', '/features', '/demo'];
    let targetId = null;

    if (hash) {
      targetId = hash.replace('#', '');
    } else if (sectionRoutes.includes(pathname)) {
      targetId = pathname.replace('/', '');
    }

    if (targetId) {
      const timer = setTimeout(() => {
        const el = document.getElementById(targetId);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 100);
      return () => clearTimeout(timer);
    } else {
      window.scrollTo(0, 0);
    }
  }, [pathname, hash]);

  return null;
}

export const App = () => {
  const [moreSheetOpen, setMoreSheetOpen] = useState(false);

  return (
    <div className="app-shell">
      <ScrollToTop />
      <Glow />
      <Globe />
      <ProgressBar />

      {/* Ambient Grid */}
      <div id="ambient" aria-hidden="true">
        <div id="grid-bg"></div>
      </div>

      {/* Global Navbar */}
      <Navbar />

      {/* Main Content Area */}
      <main className="main-content">
        <React.Suspense fallback={<div className="page-route-loader"><div className="page-spinner"></div></div>}>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/scout" element={<HomePage />} />
            <Route path="/notes" element={<HomePage />} />
            <Route path="/pipeline" element={<HomePage />} />
            <Route path="/pricing" element={<HomePage />} />
            <Route path="/faq" element={<HomePage />} />
            <Route path="/features" element={<HomePage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/blog" element={<BlogPage />} />
            <Route path="/blog/:slug" element={<BlogPostPage />} />
            <Route path="/contact" element={<ContactPage />} />
            <Route path="/help" element={<HelpPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<LoginPage />} />
            <Route path="/privacy-policy" element={<LegalPage />} />
            <Route path="/terms-of-service" element={<LegalPage />} />
            <Route path="/cookie-policy" element={<LegalPage />} />
            <Route path="/security" element={<LegalPage />} />
            <Route path="/checkout" element={<CheckoutPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </React.Suspense>
      </main>

      {/* Footer */}
      <Footer />

      {/* Themed Mobile Dock */}
      <MobileDock
        isMoreOpen={moreSheetOpen}
        onOpenMoreSheet={() => setMoreSheetOpen(!moreSheetOpen)}
      />

      {/* Mobile More Sheet */}
      <MoreSheet
        isOpen={moreSheetOpen}
        onClose={() => setMoreSheetOpen(false)}
      />

      {/* Storage & Consent Notice */}
      <ConsentNotice />
    </div>
  );
};
