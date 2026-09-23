import React from 'react';
import './SearchBar.css';

export const SearchBar = ({ value, onChange, placeholder = 'Search reflections, quotes, topics...' }) => {
  return (
    <div className="search-bar-wrapper">
      <div className="search-input-icon">
        <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>
          search
        </span>
      </div>

      <input
        type="text"
        className="search-input-field font-body-sm"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label="Search reflections"
      />

      {value && value.length > 0 && (
        <button
          type="button"
          className="search-clear-btn"
          onClick={() => onChange('')}
          aria-label="Clear search"
        >
          <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
            cancel
          </span>
        </button>
      )}
    </div>
  );
};
