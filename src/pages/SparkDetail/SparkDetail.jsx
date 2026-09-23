import React, { useState } from 'react';
import { useSparks } from '../../context/SparksContext';
import { AudioPlayer } from '../../components/AudioPlayer/AudioPlayer';
import './SparkDetail.css';

export const SparkDetail = ({ sparkId, onBack }) => {
  const {
    sparks,
    toggleSaveSpark,
    openShare,
    journalNotes,
    saveJournalNote
  } = useSparks();

  const spark = sparks.find((s) => s.id === sparkId) || sparks[0];
  const isSaved = spark?.saved;

  const [noteText, setNoteText] = useState(journalNotes[spark?.id] || '');

  const handleSaveNote = (e) => {
    e.preventDefault();
    if (spark) {
      saveJournalNote(spark.id, noteText);
    }
  };

  if (!spark) return null;

  return (
    <article className="spark-detail-page animate-fade-in">
      {/* Top Nav Row */}
      <div className="detail-nav-row">
        <button
          className="detail-back-btn btn-pressable"
          onClick={onBack}
          aria-label="Back to previous page"
        >
          <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
            arrow_back
          </span>
          <span>Back</span>
        </button>

        <div className="detail-nav-actions">
          <button
            className={`detail-nav-icon-btn ${isSaved ? 'saved' : ''} btn-pressable`}
            onClick={() => toggleSaveSpark(spark.id)}
            aria-label={isSaved ? 'Remove from saved' : 'Save spark'}
            title={isSaved ? 'Saved' : 'Save'}
          >
            <span
              className="material-symbols-outlined"
              style={{
                fontSize: '20px',
                fontVariationSettings: isSaved ? "'FILL' 1" : "'FILL' 0"
              }}
            >
              bookmark
            </span>
          </button>

          <button
            className="detail-nav-icon-btn btn-pressable"
            onClick={() => openShare(spark)}
            aria-label="Share spark"
            title="Share"
          >
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
              share
            </span>
          </button>
        </div>
      </div>

      {/* Detail Header Section */}
      <header className="detail-header-section">
        <span className="detail-category-badge">{spark.categoryLabel}</span>
        <h1 className="detail-title">{spark.title}</h1>
        <h2 className="detail-subtitle">{spark.subtitle}</h2>
        <div className="detail-meta-row">
          <span>{spark.duration} listen</span>
          <span>•</span>
          <span>{spark.narrator}</span>
        </div>
      </header>

      {/* Full Reusable Audio Player */}
      <section aria-label="Audio meditation player">
        <AudioPlayer spark={spark} variant="full" />
      </section>

      {/* Structured Editorial Reading Sections */}
      <div className="detail-sections-stack">
        {/* Section 1: THE IDEA */}
        <section className="detail-section-block">
          <h3 className="detail-section-heading">
            <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>
              lightbulb
            </span>
            <span>The Idea</span>
          </h3>
          <p className="detail-section-body">
            {spark.reflection?.idea}
          </p>
        </section>

        {/* Section 2: WHY IT MATTERS */}
        <section className="detail-section-block">
          <h3 className="detail-section-heading">
            <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>
              psychology
            </span>
            <span>Why It Matters</span>
          </h3>
          <p className="detail-section-body">
            {spark.reflection?.whyItMatters}
          </p>
        </section>

        {/* Section 3: REFLECT & Journaling */}
        <section className="detail-section-block">
          <h3 className="detail-section-heading">
            <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>
              auto_awesome
            </span>
            <span>Reflect</span>
          </h3>
          <div className="detail-reflect-box">
            <p className="detail-reflect-question">
              "{spark.reflection?.reflectPrompt}"
            </p>

            <form className="detail-journal-form" onSubmit={handleSaveNote}>
              <textarea
                className="detail-journal-textarea"
                placeholder="Write your honest reflection for today..."
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                rows={3}
                aria-label="Personal reflection note"
              />
              <button type="submit" className="detail-journal-save-btn btn-pressable">
                Save Reflection Note
              </button>
            </form>
          </div>
        </section>

        {/* Section 4: TAKE ACTION */}
        <section className="detail-section-block">
          <h3 className="detail-section-heading">
            <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>
              task_alt
            </span>
            <span>Take Action Today</span>
          </h3>
          <div className="detail-action-box">
            <div className="detail-action-icon-circle">
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
                bolt
              </span>
            </div>
            <p className="detail-action-text">
              {spark.reflection?.action}
            </p>
          </div>
        </section>
      </div>

      {/* Bottom Sticky Actions */}
      <footer className="detail-bottom-actions">
        <button
          className={`detail-bottom-btn save-btn ${isSaved ? 'saved' : ''} btn-pressable`}
          onClick={() => toggleSaveSpark(spark.id)}
        >
          <span
            className="material-symbols-outlined"
            style={{
              fontSize: '20px',
              fontVariationSettings: isSaved ? "'FILL' 1" : "'FILL' 0"
            }}
          >
            bookmark
          </span>
          <span>{isSaved ? 'Saved in Archive' : 'Save Reflection'}</span>
        </button>

        <button
          className="detail-bottom-btn share-btn btn-pressable"
          onClick={() => openShare(spark)}
        >
          <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
            share
          </span>
          <span>Share Spark</span>
        </button>
      </footer>
    </article>
  );
};
