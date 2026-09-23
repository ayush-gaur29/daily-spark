import React, { useState } from 'react';
import { useSparks } from '../../context/SparksContext';
import { AudioPlayer } from '../../components/AudioPlayer/AudioPlayer';
import { VideoPlayer } from '../../components/VideoPlayer/VideoPlayer';
import { ImageWithFallback } from '../../components/Common/ImageWithFallback';
import './SparkDetail.css';

export const SparkDetail = ({ sparkId, onBack }) => {
  const {
    sparks,
    toggleSaveSpark,
    openShare,
    journalNotes,
    saveJournalNote,
    showToast
  } = useSparks();

  const spark = sparks.find((s) => s.id === sparkId) || sparks[0];
  const isSaved = !!spark?.saved;

  const [noteText, setNoteText] = useState(journalNotes[spark?.id] || '');
  const [hasResonated, setHasResonated] = useState(false);
  const [showNoteForm, setShowNoteForm] = useState(false);

  const handleSaveNote = (e) => {
    e.preventDefault();
    if (spark) {
      saveJournalNote(spark.id, noteText);
    }
  };

  const handleToggleResonate = () => {
    setHasResonated((prev) => !prev);
    showToast(!hasResonated ? 'Thank you for reflecting with us' : 'Resonance removed');
  };

  if (!spark) return null;

  return (
    <article className="spark-detail-screen animate-fade-in">
      {/* 1. Top Utility Context Bar */}
      <div className="spark-detail-context-bar">
        <div className="spark-detail-type-pill font-label-sm">
          <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>
            auto_awesome
          </span>
          <span>DAILY SPARK • {spark.duration?.toUpperCase() || '4 MIN'} LISTEN</span>
        </div>

        <div className="spark-detail-context-actions">
          <button
            className={`spark-detail-icon-btn ${isSaved ? 'saved' : ''} btn-pressable`}
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
            className="spark-detail-icon-btn btn-pressable"
            onClick={() => openShare(spark)}
            aria-label="Share this spark"
            title="Share"
          >
            <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>
              share
            </span>
          </button>
        </div>
      </div>

      {/* 2. Spark Title & Category/Duration Header */}
      <header className="spark-detail-header">
        <h1 className="spark-detail-title font-headline-xl-mobile">
          {spark.title}
        </h1>

        <div className="spark-detail-meta-row font-label-sm">
          <span className="spark-detail-category-badge">
            {spark.categoryLabel || spark.category}
          </span>
          <span className="spark-detail-meta-dot">•</span>
          <span className="spark-detail-duration-text">
            {spark.duration || '4 min'} listen
          </span>
          {spark.videoDuration && (
            <>
              <span className="spark-detail-meta-dot">•</span>
              <span className="spark-detail-video-text">
                <span className="material-symbols-outlined" style={{ fontSize: '13px', verticalAlign: 'middle', marginRight: '2px' }}>
                  videocam
                </span>
                {spark.videoDuration} video
              </span>
            </>
          )}
        </div>

        <p className="spark-detail-subtitle font-body-lg">
          {spark.subtitle}
        </p>
      </header>

      {/* 3. Primary Video Player Experience (16:9, Stitch-aligned) */}
      <div className="spark-detail-video-wrap">
        <VideoPlayer
          src={spark.videoUrl || '/assets/videos/daily-motivation.mp4'}
          poster={spark.detailImage || spark.image}
          title={spark.title}
          durationLabel={spark.videoDuration || '0:30'}
          variant="hero"
        />
      </div>

      {/* 4. Compact Polished Audio Player */}
      <section className="spark-detail-audio-section" aria-label="Audio player">
        <AudioPlayer spark={spark} variant="reader" />
      </section>

      {/* 5. Editorial Body Sections */}
      <div className="spark-detail-content-flow">
        {/* Short Introduction / Lead Reflection Paragraph */}
        <p className="spark-detail-lead font-body-lg">
          {spark.introParagraph || "True stillness is rarely the absence of noise; rather, it is the deliberate presence of self-governed awareness. When the modern cadence demands perpetual reaction, quiet clarity becomes an architectural act of conscious subtraction."}
        </p>

        {/* Editorial Reflection Quote Card */}
        <div className="spark-detail-quote-card">
          <span className="material-symbols-outlined spark-detail-quote-watermark">
            format_quote
          </span>
          <blockquote className="spark-detail-quote-text font-quote-display">
            “{spark.quote}”
          </blockquote>
          <cite className="spark-detail-quote-cite font-label-sm">
            {spark.quoteAttribution || '— DR. CUBIE • FIELD NOTES VOL. IV'}
          </cite>
        </div>

        {/* Insight & Principle Section */}
        <section className="spark-detail-section-block">
          <h2 className="spark-detail-section-title font-title-md">
            <span className="material-symbols-outlined" style={{ fontSize: '20px', color: 'var(--color-primary)' }}>
              spa
            </span>
            <span>{spark.principleHeading || 'The Principle'}</span>
          </h2>
          <p className="spark-detail-section-body font-body-md">
            {spark.principleText || "Cognitive overload blurs the boundary between urgency and genuine importance, tricking the intellect into exhaustion. High-impact insight only crystallizes when uninterrupted periods of cognitive digestion are granted sovereign space on your calendar."}
          </p>
        </section>

        {/* Introspective Prompt Card */}
        <section className="spark-detail-prompt-card">
          <div className="spark-detail-prompt-header">
            <span className="material-symbols-outlined" style={{ fontSize: '18px', color: 'var(--color-primary)' }}>
              psychology
            </span>
            <span className="spark-detail-prompt-eyebrow font-label-sm">
              INTROSPECTIVE PROMPT
            </span>
          </div>

          <p className="spark-detail-prompt-question font-headline-md">
            "{spark.introspectivePrompt || 'Where in your routine are you substituting sheer activity for meaningful progress?'}"
          </p>

          {/* Interactive Journal Reflection Note */}
          <div className="spark-detail-journal-toggle-wrap">
            <button
              className="spark-detail-journal-toggle-btn font-label-sm"
              onClick={() => setShowNoteForm((prev) => !prev)}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>
                {showNoteForm ? 'expand_less' : 'edit_note'}
              </span>
              <span>{showNoteForm ? 'Hide Private Note' : 'Write Private Reflection Note'}</span>
            </button>
          </div>

          {showNoteForm && (
            <form className="spark-detail-journal-form" onSubmit={handleSaveNote}>
              <textarea
                className="spark-detail-journal-textarea font-body-md"
                placeholder="Write your honest reflection for today..."
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                rows={3}
                aria-label="Personal reflection note"
              />
              <button type="submit" className="spark-detail-journal-save-btn btn-pressable font-label-sm">
                Save Reflection Note
              </button>
            </form>
          )}
        </section>

        {/* Today's 1-Minute Practice */}
        <section className="spark-detail-section-block">
          <h2 className="spark-detail-section-title font-title-md">
            <span className="material-symbols-outlined" style={{ fontSize: '20px', color: 'var(--color-primary)' }}>
              schedule
            </span>
            <span>{spark.practiceHeading || "Today's 1-Minute Practice"}</span>
          </h2>

          <div className="spark-detail-practice-steps">
            {(spark.practiceSteps || [
              'Close or tilt away your digital screen completely.',
              'Write down on physical paper your single essential priority.',
              'Inhale deeply for four seconds, exhale, and quietly begin.'
            ]).map((step, idx) => (
              <div key={idx} className="spark-detail-step-row">
                <div className="spark-detail-step-number font-label-sm">
                  {idx + 1}
                </div>
                <p className="spark-detail-step-text font-body-md">
                  {step}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Resonance Feedback Card */}
        <div className="spark-detail-resonate-card">
          <div className="spark-detail-resonate-text">
            <span className="spark-detail-resonate-title font-label-md">
              Did this spark resonate?
            </span>
            <span className="spark-detail-resonate-sub font-label-sm">
              94% of thinkers felt centered today
            </span>
          </div>

          <div className="spark-detail-resonate-actions">
            <button
              className={`spark-detail-resonate-btn ${hasResonated ? 'active' : ''} btn-pressable`}
              onClick={handleToggleResonate}
              aria-label="I feel centered"
              title="Resonated"
            >
              <span
                className="material-symbols-outlined"
                style={{
                  fontSize: '18px',
                  fontVariationSettings: hasResonated ? "'FILL' 1" : "'FILL' 0"
                }}
              >
                favorite
              </span>
            </button>

            <button
              className="spark-detail-resonate-btn btn-pressable"
              onClick={() => setShowNoteForm(true)}
              aria-label="Add reflection note"
              title="Add Note"
            >
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
                edit_note
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* 6. Sticky Bottom Action Bar (Save / Share) */}
      <footer className="spark-detail-bottom-actions">
        <button
          className="spark-detail-save-btn btn-pressable"
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
          <span>{isSaved ? 'Saved in Library' : 'Save to Library'}</span>
        </button>

        <button
          className="spark-detail-share-btn btn-pressable"
          onClick={() => openShare(spark)}
          aria-label="Share spark"
        >
          <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>
            ios_share
          </span>
          <span>Share Reflection</span>
        </button>
      </footer>
    </article>
  );
};
