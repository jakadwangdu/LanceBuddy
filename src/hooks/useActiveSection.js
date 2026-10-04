import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useSite } from '../context/SiteContext';

export const useActiveSection = () => {
  const { setActiveSection, triggerShock } = useSite();
  const location = useLocation();

  useEffect(() => {
    setActiveSection(0);

    const getSections = () => {
      // Find all designated section elements on the page
      const scElements = Array.from(document.querySelectorAll('.sc')).filter((el) => el.offsetParent !== null);
      if (scElements.length > 0) return scElements;

      const selectors = [
        '.landing-hero-shell',
        '.demo-inspector-shell',
        '#features',
        '#pricing',
        '#faq',
        '.support-section',
        '#scout',
        '#leads-results',
        '#pipeline',
        '#notes',
        '.page-header',
        '.guides-section',
        '.faq-section'
      ];
      const elements = Array.from(document.querySelectorAll(selectors.join(', ')));
      return elements.filter((el) => el.offsetParent !== null);
    };

    let prevIdx = 0;
    const onScroll = () => {
      try {
        const secs = getSections();
        if (!secs.length) {
          setActiveSection(0);
          return;
        }

        const scrollMid = window.scrollY + window.innerHeight * 0.42;
        let activeIdx = 0;

        for (let i = 0; i < secs.length; i++) {
          const top = secs[i].offsetTop;
          const height = secs[i].offsetHeight;
          if (scrollMid >= top && scrollMid < top + height) {
            activeIdx = i;
            break;
          }
          if (scrollMid >= top) {
            activeIdx = i;
          }
        }

        if (activeIdx !== prevIdx) {
          prevIdx = activeIdx;
          setActiveSection(activeIdx);
          triggerShock();
        }

        const maxScroll = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
        document.documentElement.style.setProperty('--sp', (window.scrollY / maxScroll).toFixed(4));
      } catch (e) {}
    };

    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          onScroll();
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleScroll, { passive: true });
    onScroll();

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleScroll);
    };
  }, [location.pathname, setActiveSection, triggerShock]);
};
