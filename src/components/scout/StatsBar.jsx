import React from 'react';
import { useLeads } from '../../context/LeadsContext';

export const StatsBar = () => {
  const { stats = {} } = useLeads() || {};

  return (
    <div className="stats-bar">
      <div className="stat-chip total">
        <span className="dot"></span>
        <span>{stats.total ?? 0}</span> Total
      </div>
      <div className="stat-chip hot">
        <span className="dot"></span>
        <span>{stats.hot ?? 0}</span> Hot
      </div>
      <div className="stat-chip warm">
        <span className="dot"></span>
        <span>{stats.warm ?? 0}</span> Warm
      </div>
      <div className="stat-chip cold">
        <span className="dot"></span>
        <span>{stats.cold ?? 0}</span> Cold
      </div>
    </div>
  );
};
