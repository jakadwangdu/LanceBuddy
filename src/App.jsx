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
import { Rail } from './components/Rail';
import { useActiveSection } from './hooks/useActiveSection';
import { preloadCommonRoutes } from './utils/preloadRoutes';
import { lazyWithRetry } from './utils/lazyWithRetry';

const ScoutPage = lazyWithRetry(() => import('./pages/ScoutPage').then(m => ({ default: m.ScoutPage })));
const AboutPage = lazyWithRetry(() => import('./pages/AboutPage').then(m => ({ default: m.AboutPage })));
const BlogPage = lazyWithRetry(() => import('./pages/BlogPage').then(m => ({ default: m.BlogPage })));
const BlogPostPage = lazyWithRetry(() => import('./pages/BlogPostPage').then(m => ({ default: m.BlogPostPage })));
const ContactPage = lazyWithRetry(() => import('./pages/ContactPage').then(m => ({ default: m.ContactPage })));
const HelpPage = lazyWithRetry(() => import('./pages/HelpPage').then(m => ({ default: m.HelpPage })));
const LoginPage = lazyWithRetry(() => import('./pages/LoginPage').then(m => ({ default: m.LoginPage })));
const LegalPage = lazyWithRetry(() => import('./pages/LegalPage').then(m => ({ default: m.LegalPage })));
const NotFoundPage = lazyWithRetry(() => import('./pages/NotFoundPage').then(m => ({ default: m.NotFoundPage })));
const CheckoutPage = lazyWithRetry(() => import('./pages/CheckoutPage').then(m => ({ default: m.CheckoutPage })));
const ErrorPage = lazyWithRetry(() => import('./pages/ErrorPage').then(m => ({ default: m.ErrorPage })));
const StatusPage = lazyWithRetry(() => import('./pages/StatusPage').then(m => ({ default: m.StatusPage })));

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
  const location = useLocation();

  // Dynamically drives the 3D globe camera between poses on scroll & section change
  useActiveSection();

  // Prefetch common page routes in browser idle time for instant 0ms switching
  useEffect(() => {
    preloadCommonRoutes();
  }, []);

  return (
    <div className="app-shell">
      <ScrollToTop />
      <Glow />
      <Globe />
      <ProgressBar />
      <Rail />


      {/* Global Navbar */}
      <Navbar />

      {/* Main Content Area */}
      <main className="main-content">
        <div key={location.pathname} className="page-transition-shell">
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
            <Route path="/status" element={<StatusPage />} />
            <Route path="/404" element={<ErrorPage code={404} />} />
            <Route path="/403" element={<ErrorPage code={403} />} />
            <Route path="/500" element={<ErrorPage code={500} />} />
            <Route path="/502" element={<ErrorPage code={502} />} />
            <Route path="/503" element={<ErrorPage code={503} />} />
            <Route path="/504" element={<ErrorPage code={504} />} />
            <Route path="/505" element={<ErrorPage code={505} />} />
            <Route path="/525" element={<ErrorPage code={525} />} />
            <Route path="/maintenance" element={<ErrorPage code={503} />} />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </React.Suspense>
        </div>
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
