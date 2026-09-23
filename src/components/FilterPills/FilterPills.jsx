import React from 'react';
import { CATEGORIES } from '../../data/categories';
import './FilterPills.css';

export const FilterPills = ({ activeFilter, onSelectFilter }) => {
  return (
    <div className="filter-row-container">
      <div className="filter-pills-scroll" role="tablist" aria-label="Reflection categories">
        {CATEGORIES.map((cat) => {
          const isActive = activeFilter === cat.id;
          return (
            <button
              key={cat.id}
              role="tab"
              aria-selected={isActive}
              className={`filter-pill ${isActive ? 'active' : ''}`}
              onClick={() => onSelectFilter(cat.id)}
            >
              {cat.label}
            </button>
          );
        })}
      </div>
    </div>
  );
};
