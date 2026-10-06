import React from 'react';

/**
 * Free SVG icons from Hugeicons (hugeicons.com)
 * Stroke icons on a 24x24 viewBox, stroke-width 1.8 / 2, rounded caps & joins.
 */

// Home / Workspace
export const HugeHomeIcon = ({ size = 20, active = false, className = '' }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    className={className}
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <path
      d="M12.66 2.45C12.29 2.15 11.71 2.15 11.34 2.45L3.63 8.62C3.23 8.94 3 9.43 3 9.94V19.5C3 20.6 3.9 21.5 5 21.5H9V15.5C9 14.67 9.67 14 10.5 14H13.5C14.33 14 15 14.67 15 15.5V21.5H19C20.1 21.5 21 20.6 21 19.5V9.94C21 9.43 20.77 8.94 20.37 8.62L12.66 2.45Z"
      stroke="currentColor"
      strokeWidth={active ? '2.2' : '1.8'}
      strokeLinecap="round"
      strokeLinejoin="round"
      fill={active ? 'currentColor' : 'none'}
      fillOpacity={active ? '0.18' : '0'}
    />
  </svg>
);

// Scout / Compass
export const HugeCompassIcon = ({ size = 20, active = false, className = '' }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    className={className}
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <circle
      cx="12"
      cy="12"
      r="9.5"
      stroke="currentColor"
      strokeWidth={active ? '2.2' : '1.8'}
    />
    <polygon
      points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"
      stroke="currentColor"
      strokeWidth={active ? '2.2' : '1.8'}
      strokeLinecap="round"
      strokeLinejoin="round"
      fill={active ? 'currentColor' : 'none'}
      fillOpacity={active ? '0.3' : '0'}
    />
  </svg>
);

// Notes / Sticky note
export const HugeNoteIcon = ({ size = 20, active = false, className = '' }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    className={className}
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <path
      d="M3 8.5C3 5.5 4.5 3.5 8 3.5H16C19.5 3.5 21 5.5 21 8.5V17C21 20 19.5 22 16 22H8C4.5 22 3 20 3 17V8.5Z"
      stroke="currentColor"
      strokeWidth={active ? '2.2' : '1.8'}
      strokeLinecap="round"
      strokeLinejoin="round"
      fill={active ? 'currentColor' : 'none'}
      fillOpacity={active ? '0.18' : '0'}
    />
    <path
      d="M8 2V5M16 2V5M3.5 9.09H20.5M8 13.5H16M8 17.5H12.5"
      stroke="currentColor"
      strokeWidth={active ? '2.2' : '1.8'}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

// Demo / Terminal
export const HugeTerminalIcon = ({ size = 20, active = false, className = '' }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    className={className}
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <rect
      x="2.5"
      y="3.5"
      width="19"
      height="17"
      rx="4.5"
      stroke="currentColor"
      strokeWidth={active ? '2.2' : '1.8'}
      fill={active ? 'currentColor' : 'none'}
      fillOpacity={active ? '0.18' : '0'}
    />
    <path
      d="M7 9L10 12L7 15M13 15H17"
      stroke="currentColor"
      strokeWidth={active ? '2.2' : '1.8'}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

// Pricing / Crown
export const HugeCrownIcon = ({ size = 20, active = false, className = '' }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    className={className}
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <path
      d="M19.5 19H4.5C3.67 19 3 18.33 3 17.5L4.5 7L9 12L12 4L15 12L19.5 7L21 17.5C21 18.33 20.33 19 19.5 19Z"
      stroke="currentColor"
      strokeWidth={active ? '2.2' : '1.8'}
      strokeLinecap="round"
      strokeLinejoin="round"
      fill={active ? 'currentColor' : 'none'}
      fillOpacity={active ? '0.18' : '0'}
    />
    <circle
      cx="12"
      cy="15"
      r="1.2"
      fill="currentColor"
    />
  </svg>
);

// Blog / Book Open
export const HugeBookIcon = ({ size = 20, active = false, className = '' }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    className={className}
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <path
      d="M12 6.5C10.5 4.5 8 4 4.5 4C3.67 4 3 4.67 3 5.5V17.5C3 18.33 3.67 19 4.5 19C8 19 10.5 19.5 12 21.5C13.5 19.5 16 19 19.5 19C20.33 19 21 18.33 21 17.5V5.5C21 4.67 20.33 4 19.5 4C16 4 13.5 4.5 12 6.5Z"
      stroke="currentColor"
      strokeWidth={active ? '2.2' : '1.8'}
      strokeLinecap="round"
      strokeLinejoin="round"
      fill={active ? 'currentColor' : 'none'}
      fillOpacity={active ? '0.18' : '0'}
    />
    <path
      d="M12 6.5V21.5"
      stroke="currentColor"
      strokeWidth={active ? '2.2' : '1.8'}
      strokeLinecap="round"
    />
  </svg>
);

// Sign In / Login
export const HugeLoginIcon = ({ size = 20, active = false, className = '' }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    className={className}
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <path
      d="M11.68 14.62L14.24 12.06L11.68 9.5M4 12.06H14.17"
      stroke="currentColor"
      strokeWidth={active ? '2.2' : '1.8'}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M12 4C16.42 4 20 7.58 20 12C20 16.42 16.42 20 12 20"
      stroke="currentColor"
      strokeWidth={active ? '2.2' : '1.8'}
      strokeLinecap="round"
    />
  </svg>
);

// More (Dots / Horizontal menu)
export const HugeMoreIcon = ({ size = 20, active = false, className = '' }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    className={className}
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <circle
      cx="5"
      cy="12"
      r="1.8"
      fill="currentColor"
    />
    <circle
      cx="12"
      cy="12"
      r="1.8"
      fill="currentColor"
    />
    <circle
      cx="19"
      cy="12"
      r="1.8"
      fill="currentColor"
    />
  </svg>
);

// Close Icon for Sheet
export const HugeCloseIcon = ({ size = 18, className = '' }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    aria-hidden="true"
  >
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);
