import React, { useEffect } from 'react';

export const ProgressBar = () => {
  useEffect(() => {
    const root = document.documentElement;

    const onScroll = () => {
      const maxScroll = Math.max(1, root.scrollHeight - window.innerHeight);
      const ratio = Math.min(1, Math.max(0, window.scrollY / maxScroll));
      root.style.setProperty('--sp', ratio.toFixed(4));
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    onScroll();

    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, []);

  return <div className="prog" aria-hidden="true" />;
};
