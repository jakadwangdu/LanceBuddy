import React, { useEffect } from 'react';

export const Glow = () => {
  useEffect(() => {
    const root = document.documentElement;
    const isTouch = window.matchMedia('(hover:none)').matches;
    const rm = window.matchMedia('(prefers-reduced-motion:reduce)').matches;

    if (isTouch) return;

    const handlePointerMove = (e) => {
      root.style.setProperty('--mx', `${e.clientX}px`);
      root.style.setProperty('--my', `${e.clientY}px`);

      if (rm) return;
      const btn = e.target.closest && e.target.closest('.btn');
      const allBtns = document.querySelectorAll('.btn');
      allBtns.forEach((q) => {
        if (q !== btn) q.style.transform = '';
      });

      if (btn) {
        const r = btn.getBoundingClientRect();
        const dx = (e.clientX - r.left - r.width / 2) * 0.2;
        const dy = (e.clientY - r.top - r.height / 2) * 0.3;
        btn.style.transform = `translate(${dx.toFixed(1)}px, ${dy.toFixed(1)}px)`;
      }
    };

    window.addEventListener('pointermove', handlePointerMove, { passive: true });

    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
    };
  }, []);

  return <div className="glow" aria-hidden="true" />;
};
