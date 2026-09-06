import React, { useState, useEffect } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { Navbar } from './components/layout/Navbar';
import { MobileDock } from './components/layout/MobileDock';
import { MoreSheet } from './components/layout/MoreSheet';
import { Footer } from './components/layout/Footer';
import { ConsentNotice } from './components/layout/ConsentNotice';

import { HomePage } from './pages/HomePage';
import { AboutPage } from './pages/AboutPage';
import { BlogPage } from './pages/BlogPage';
import { BlogPostPage } from './pages/BlogPostPage';
import { ContactPage } from './pages/ContactPage';
import { HelpPage } from './pages/HelpPage';
import { LoginPage } from './pages/LoginPage';
import { LegalPage } from './pages/LegalPage';
import { NotFoundPage } from './pages/NotFoundPage';

// Scroll to top or target section on route changes
function ScrollToTop() {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    const sectionRoutes = ['/notes', '/scout', '/pipeline', '/pricing', '/faq', '/features'];
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

      {/* Ambient Animated Gradient Orbs & Grid */}
      <div id="ambient" aria-hidden="true">
        <div id="grid-bg"></div>
        <div className="orb orb1"></div>
        <div className="orb orb2"></div>
      </div>

      {/* Global Navbar */}
      <Navbar />

      {/* Main Content Area */}
      <main className="main-content">
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
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
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
