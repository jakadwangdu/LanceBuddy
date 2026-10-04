import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useSite } from '../context/SiteContext';

export const useActiveSection = () => {
  const { setActiveSection } = useSite();
  const location = useLocation();

  useEffect(() => {
    setActiveSection(0);
    window.scrollTo(0, 0);

    const onScroll = () => {
      try {
        const secs = Array.from(document.querySelectorAll('.sc'));
        const y = window.scrollY + window.innerHeight * 0.5;
        let idx = 0;
        for (let i = 0; i < secs.length; i++) {
          if (y >= secs[i].offsetTop && y < secs[i].offsetTop + secs[i].offsetHeight) {
            idx = i;
            break;
          }
        }
        setActiveSection(idx);
      } catch (e) {}
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    onScroll();

    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, [location.pathname, setActiveSection]);
};
