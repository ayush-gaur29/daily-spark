import React from 'react';
import { useSparks } from '../../context/SparksContext';
import { SearchBar } from '../../components/SearchBar/SearchBar';
import { FilterPills } from '../../components/FilterPills/FilterPills';
import { SparkCard } from '../../components/SparkCard/SparkCard';
import { EmptyState } from '../../components/EmptyState/EmptyState';
import './Saved.css';

export const Saved = ({ onNavigateToSpark, onNavigateToToday }) => {
  const {
    sparks,
    savedSparksCount,
    activeCategory,
    setActiveCategory,
    searchQuery,
    setSearchQuery
  } = useSparks();

  // Filter only saved sparks, and apply active category & search query
  const savedSparks = sparks.filter((s) => s.saved);

  const filteredSparks = savedSparks.filter((item) => {
    const matchesCategory =
      activeCategory === 'all' || item.category.toLowerCase() === activeCategory.toLowerCase();

    const query = searchQuery.trim().toLowerCase();
    if (!query) return matchesCategory;

    const matchesQuery =
      item.title.toLowerCase().includes(query) ||
      item.quote.toLowerCase().includes(query) ||
      item.categoryLabel.toLowerCase().includes(query) ||
      item.description.toLowerCase().includes(query);

    return matchesCategory && matchesQuery;
  });

  return (
    <div className="saved-page animate-fade-in">
      {/* Archive Header */}
      <div className="saved-header-top">
        <div className="saved-title-col">
          <span className="saved-archive-eyebrow">Personal Archive</span>
          <h1 className="saved-main-heading">Saved Sparks</h1>
        </div>
        <div className="saved-count-badge" id="sparks-count-badge">
          <span
            className="material-symbols-outlined"
            style={{ fontSize: '15px', fontVariationSettings: "'FILL' 1" }}
          >
            auto_awesome
          </span>
          <span>
            {searchQuery || activeCategory !== 'all'
              ? `${filteredSparks.length} of ${savedSparksCount} saved`
              : `${savedSparksCount} saved`}
          </span>
        </div>
      </div>

      <p className="saved-subtitle-text">Reflections worth coming back to.</p>

      {/* Search Input with Clear Button */}
      <SearchBar
        value={searchQuery}
        onChange={setSearchQuery}
        placeholder="Search reflections, quotes, topics..."
      />

      {/* Horizontal Category Filter Pills */}
      <FilterPills
        activeFilter={activeCategory}
        onSelectFilter={setActiveCategory}
      />

      {/* Sparks List or Empty State */}
      {filteredSparks.length > 0 ? (
        <div className="spark-list-stack" id="spark-list">
          {filteredSparks.map((spark) => (
            <SparkCard
              key={spark.id}
              spark={spark}
              onSelect={onNavigateToSpark}
            />
          ))}
        </div>
      ) : savedSparks.length === 0 ? (
        <EmptyState
          icon="bookmark_border"
          title="No saved reflections yet"
          description="Sparks you bookmark will appear here in your personal archive for lifelong revisit."
          actionLabel="Explore Today's Spark"
          onAction={onNavigateToToday}
        />
      ) : (
        <EmptyState
          icon="search_off"
          title="No matching sparks"
          description="Try searching for other words, topics, or reset your current filter category."
          actionLabel="Clear Filters"
          onAction={() => {
            setSearchQuery('');
            setActiveCategory('all');
          }}
        />
      )}

      {/* Gentle Keepsakes Quiet Note */}
      <footer className="saved-archive-footer-note">
        <span className="material-symbols-outlined" style={{ fontSize: '15px', color: 'var(--color-primary)' }}>
          stylus_note
        </span>
        <span>Saved reflections are preserved locally for lifelong revisit.</span>
      </footer>
    </div>
  );
};
