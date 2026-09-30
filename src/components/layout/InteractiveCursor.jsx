import React, { useEffect, useRef } from 'react';

export const InteractiveCursor = () => {
  const dotRef = useRef(null);
  const rafRef = useRef(null);
  const mousePos = useRef({ x: -100, y: -100 });
  const isHovered = useRef(false);

  useEffect(() => {
    // Only enable on desktop pointer devices
    if (window.matchMedia('(pointer: coarse)').matches) {
      return;
    }

    const dot = dotRef.current;
    if (!dot) return;

    const render = () => {
      const { x, y } = mousePos.current;
      const scale = isHovered.current ? 1.5 : 1;
      dot.style.transform = `translate3d(${x - 10}px, ${y - 10}px, 0) scale(${scale})`;
      rafRef.current = null;
    };

    const handleMouseMove = (e) => {
      mousePos.current.x = e.clientX;
      mousePos.current.y = e.clientY;

      const target = e.target;
      if (target) {
        const interactive = !!target.closest(
          'a, button, input, select, textarea, [role="button"], .city-pill, .interactive, .toggle-btn'
        );
        if (interactive !== isHovered.current) {
          isHovered.current = interactive;
          dot.style.opacity = interactive ? '0.3' : '0.5';
        }
      }

      if (!rafRef.current) {
        rafRef.current = requestAnimationFrame(render);
      }
    };

    const handleMouseLeave = () => {
      if (dot) dot.style.opacity = '0';
    };

    const handleMouseEnter = () => {
      if (dot) dot.style.opacity = '0.5';
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    document.addEventListener('mouseleave', handleMouseLeave);
    document.addEventListener('mouseenter', handleMouseEnter);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseleave', handleMouseLeave);
      document.removeEventListener('mouseenter', handleMouseEnter);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return (
    <div
      ref={dotRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '20px',
        height: '20px',
        borderRadius: '50%',
        backgroundColor: 'var(--text)',
        pointerEvents: 'none',
        zIndex: 99999,
        opacity: 0,
        transition: 'opacity 0.2s ease',
        willChange: 'transform'
      }}
    />
  );
};
