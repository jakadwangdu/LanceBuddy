import React from 'react';
import { useLocation } from 'react-router-dom';
import { useSite } from '../context/SiteContext';

const LANDING_LINKS = [
  { href: '#s0', label: 'Start' },
  { href: '#s1', label: 'Find' },
  { href: '#s2', label: 'Verify' },
  { href: '#s3', label: 'Write' },
  { href: '#s4', label: 'Track' },
  { href: '#s5', label: 'Pricing' },
  { href: '#s6', label: 'Go' }
];

const SCOUT_LINKS = [
  { href: '#s0', label: 'Scout' },
  { href: '#s1', label: 'Results' },
  { href: '#s2', label: 'Notes' },
  { href: '#s3', label: 'Pricing' },
  { href: '#s4', label: 'Help' }
];

export const Rail = () => {
  const location = useLocation();
  const { activeSection, setActiveSection } = useSite();
  const isScout = location.pathname === '/scout';
  const links = isScout ? SCOUT_LINKS : LANDING_LINKS;

  const handleClick = (e, idx, href) => {
    e.preventDefault();
    setActiveSection(idx);
    const target = document.querySelector(href);
    if (target) {
      target.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <nav className="rail" aria-label="Sections">
      {links.map((link, idx) => (
        <a
          key={link.href}
          href={link.href}
          className={activeSection === idx ? 'on' : ''}
          onClick={(e) => handleClick(e, idx, link.href)}
        >
          <i />
          <span>{link.label}</span>
        </a>
      ))}
    </nav>
  );
};
