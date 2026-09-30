import React, { useRef } from 'react';

export const TiltCard = ({ children, className = '', style = {}, maxRotation = 8, scale = 1.02 }) => {
  const cardRef = useRef(null);
  const innerRef = useRef(null);
  const rafRef = useRef(null);

  const handleMouseMove = (e) => {
    const card = cardRef.current;
    if (!card) return;

    if (rafRef.current) return;

    rafRef.current = requestAnimationFrame(() => {
      const rect = card.getBoundingClientRect();
      const width = rect.width;
      const height = rect.height;

      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      const rotateY = ((mouseX / width) - 0.5) * (maxRotation * 2);
      const rotateX = ((mouseY / height) - 0.5) * -(maxRotation * 2);

      card.style.transform = `perspective(1000px) rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg) scale3d(${scale}, ${scale}, ${scale})`;
      rafRef.current = null;
    });
  };

  const handleMouseEnter = () => {
    const card = cardRef.current;
    if (card) {
      card.style.transition = 'transform 0.1s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
    }
  };

  const handleMouseLeave = () => {
    const card = cardRef.current;
    if (card) {
      card.style.transition = 'transform 0.45s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
      card.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)';
    }
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  };

  return (
    <div
      ref={cardRef}
      className={className}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={{
        ...style,
        transformStyle: 'preserve-3d',
        willChange: 'transform'
      }}
    >
      <div
        ref={innerRef}
        style={{
          transition: 'transform 0.3s ease-out',
          height: '100%',
          transformStyle: 'preserve-3d'
        }}
      >
        {children}
      </div>
    </div>
  );
};
