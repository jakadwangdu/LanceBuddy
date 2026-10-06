import React, { createContext, useContext, useState, useRef, useCallback, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { CITIES } from '../data/cities';

const ROUTE_POSES = {
  '/': {
    XS: [0, 2.7, -2.7, 2.7, -2.7, 0, 0, 2.5],
    SC: [1.05, 1, 1, 1.05, 1, 0.7, 1.5, 0.95],
    OP: [0.85, 0.85, 0.85, 0.85, 0.85, 0.25, 0.6, 0.7],
    CZ: [8, 7.4, 5.8, 7, 7.4, 9.5, 6.4, 8.0]
  },
  '/scout': {
    XS: [2.7, -2.7, 2.7, 0, -2.7],
    SC: [1.05, 1, 1.05, 0.7, 1],
    OP: [0.9, 0.65, 0.85, 0.25, 0.7],
    CZ: [7.2, 7.6, 6.8, 9.5, 7.4]
  },
  '/notes': {
    XS: [2.6, 0],
    SC: [1.0, 0.8],
    OP: [0.7, 0.35],
    CZ: [8.0, 9.4]
  },
  '/pipeline': {
    XS: [0, -2.6],
    SC: [0.75, 1.0],
    OP: [0.3, 0.65],
    CZ: [9.8, 8.2]
  },
  '/pricing': {
    XS: [0],
    SC: [0.78],
    OP: [0.35],
    CZ: [9.5]
  },
  '/about': {
    XS: [2.6, 0, -2.4],
    SC: [1.1, 0.85, 1.0],
    OP: [0.75, 0.45, 0.7],
    CZ: [7.2, 9.0, 7.8]
  },
  '/blog': {
    XS: [-2.5, 2.6, -2.2],
    SC: [0.95, 1.05, 0.9],
    OP: [0.65, 0.7, 0.6],
    CZ: [8.4, 7.6, 8.5]
  },
  '/contact': {
    XS: [2.6],
    SC: [1.05],
    OP: [0.7],
    CZ: [7.5]
  },
  '/help': {
    XS: [-2.7, 2.5],
    SC: [0.9, 1.0],
    OP: [0.65, 0.7],
    CZ: [8.2, 7.8]
  },
  '/status': {
    XS: [2.5, -2.4],
    SC: [1.05, 0.95],
    OP: [0.75, 0.65],
    CZ: [7.6, 8.2]
  },
  '/login': {
    XS: [0],
    SC: [0.75],
    OP: [0.35],
    CZ: [9.4]
  },
  '/signup': {
    XS: [0],
    SC: [0.75],
    OP: [0.35],
    CZ: [9.4]
  },
  '/checkout': {
    XS: [2.7],
    SC: [0.85],
    OP: [0.4],
    CZ: [9.0]
  }
};

const WORKSPACE_POSES = {
  XS: [2.7, -2.7, 2.7, 0, -2.7],
  SC: [1.05, 1, 1.05, 0.7, 1],
  OP: [0.9, 0.65, 0.85, 0.12, 0.7],
  CZ: [7.2, 7.6, 6.8, 9.8, 7.4]
};

const DEFAULT_AMBIENT = {
  XS: [0],
  SC: [0.78],
  OP: [0.2],
  CZ: [9.5]
};

const SiteContext = createContext();

export const SiteProvider = ({ children }) => {
  const location = useLocation();
  const path = location.pathname.toLowerCase();

  const [isWorkspace, setIsWorkspace] = useState(false);
  const isScout = path === '/scout' || path === '/pipeline' || path === '/notes' || isWorkspace;
  const [activeSection, setActiveSection] = useState(0);
  const [selectedCityIndex, setSelectedCityIndexState] = useState(0);
  const [isScanning, setIsScanning] = useState(false);

  const poses = isWorkspace
    ? WORKSPACE_POSES
    : (ROUTE_POSES[path] || (path.startsWith('/blog') ? ROUTE_POSES['/blog'] : DEFAULT_AMBIENT));

  // Mutable refs for Globe to avoid React re-renders in animation frame
  const shockRef = useRef(0);
  const addLeadRef = useRef(null);
  const clearLeadsRef = useRef(null);
  const citySelectRef = useRef(null);

  // Scroll listener to update activeSection accurately as user scrolls
  useEffect(() => {
    const handleScroll = () => {
      const sections = Array.from(document.querySelectorAll('.sc'));
      if (!sections.length) return;
      const scrollPos = window.scrollY + window.innerHeight * 0.45;
      for (let i = sections.length - 1; i >= 0; i--) {
        const top = sections[i].offsetTop;
        if (scrollPos >= top) {
          setActiveSection(i);
          break;
        }
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, [location.pathname, isWorkspace]);

  // Pulse effect when changing routes
  useEffect(() => {
    shockRef.current = 1;
    setActiveSection(0);
  }, [location.pathname]);

  const setSelectedCityIndex = useCallback((idxOrGeo) => {
    if (typeof idxOrGeo === 'number') {
      setSelectedCityIndexState(idxOrGeo);
    }
    if (citySelectRef.current) {
      citySelectRef.current(idxOrGeo);
    }
  }, []);

  const triggerShock = useCallback(() => {
    shockRef.current = 1;
  }, []);

  const addLeadDot = useCallback(() => {
    if (addLeadRef.current) {
      addLeadRef.current();
    }
  }, []);

  const clearLeadDots = useCallback(() => {
    if (clearLeadsRef.current) {
      clearLeadsRef.current();
    }
  }, []);

  return (
    <SiteContext.Provider
      value={{
        isScout,
        isWorkspace,
        setIsWorkspace,
        poses,
        activeSection,
        setActiveSection,
        selectedCityIndex,
        setSelectedCityIndex,
        isScanning,
        setIsScanning,
        triggerShock,
        shockRef,
        addLeadRef,
        clearLeadsRef,
        citySelectRef,
        addLeadDot,
        clearLeadDots,
        cities: CITIES
      }}
    >
      {children}
    </SiteContext.Provider>
  );
};

export const useSite = () => {
  const context = useContext(SiteContext);
  if (!context) {
    throw new Error('useSite must be used within a SiteProvider');
  }
  return context;
};
