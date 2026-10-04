import React, { createContext, useContext, useState, useRef, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { CITIES } from '../data/cities';

const LANDING_POSES = {
  XS: [0, 2.7, -2.7, 2.7, -2.7, 0, 0],
  SC: [1.05, 1, 1, 1.05, 1, 0.7, 1.5],
  OP: [0.85, 0.85, 0.85, 0.85, 0.85, 0.25, 0.6],
  CZ: [8, 7.4, 5.8, 7, 7.4, 9.5, 6.4]
};

const SCOUT_POSES = {
  XS: [2.7, -2.7, 2.7, 0, -2.7],
  SC: [1.05, 1, 1.05, 0.7, 1],
  OP: [0.9, 0.65, 0.85, 0.25, 0.7],
  CZ: [7.2, 7.6, 6.8, 9.5, 7.4]
};

const AMBIENT_POSES = {
  XS: [0],
  SC: [0.75],
  OP: [0.35],
  CZ: [9.2]
};

const SiteContext = createContext();

export const SiteProvider = ({ children }) => {
  const location = useLocation();
  const isLanding = location.pathname === '/';
  const isScout = location.pathname === '/scout';

  const [activeSection, setActiveSection] = useState(0);
  const [selectedCityIndex, setSelectedCityIndexState] = useState(0);
  const [isScanning, setIsScanning] = useState(false);

  // Mutable refs for Globe to avoid React re-renders in animation frame
  const shockRef = useRef(0);
  const addLeadRef = useRef(null);
  const clearLeadsRef = useRef(null);
  const citySelectRef = useRef(null);

  const setSelectedCityIndex = useCallback((idx) => {
    setSelectedCityIndexState(idx);
    if (citySelectRef.current) {
      citySelectRef.current(idx);
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

  const poses = isScout ? SCOUT_POSES : (isLanding ? LANDING_POSES : AMBIENT_POSES);

  return (
    <SiteContext.Provider
      value={{
        isScout,
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
