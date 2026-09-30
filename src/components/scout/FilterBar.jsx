import React from 'react';

export const FilterBar = ({
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusChange,
  priorityFilter,
  onPriorityChange
}) => {
  return (
    <div className="filter-bar">
      <div className="search-input-wrap">
        <i className="ri-search-line"></i>
        <input
          id="filterSearchInput"
          name="filterSearch"
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Filter leads by name, phone, details..."
          aria-label="Filter leads by name, phone, or keywords"
        />
      </div>

      <div className="filters-dropdown-group">
        <select
          id="statusFilterSelect"
          name="statusFilter"
          value={statusFilter}
          onChange={(e) => onStatusChange(e.target.value)}
          className="filter-select"
          aria-label="Filter leads by pipeline status"
        >
          <option value="all">All Statuses</option>
          <option value="new">New</option>
          <option value="contacted">Contacted</option>
          <option value="interested">Interested</option>
          <option value="converted">Converted</option>
          <option value="lost">Lost</option>
        </select>

        <select
          id="priorityFilterSelect"
          name="priorityFilter"
          value={priorityFilter}
          onChange={(e) => onPriorityChange(e.target.value)}
          className="filter-select"
          aria-label="Filter leads by priority tier"
        >
          <option value="all">All Priorities</option>
          <option value="hot">Hot</option>
          <option value="warm">Warm</option>
          <option value="cold">Cold</option>
        </select>
      </div>
    </div>
  );
};
