import React, { createContext, useContext, useState, useEffect } from 'react';
import { INITIAL_SPARKS } from '../data/sparks';

const SparksContext = createContext();

export const SparksProvider = ({ children }) => {
  const [sparks, setSparks] = useState(() => {
    try {
      const stored = localStorage.getItem('daily_spark_items');
      return stored ? JSON.parse(stored) : INITIAL_SPARKS;
    } catch {
      return INITIAL_SPARKS;
    }
  });

  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [shareModalSpark, setShareModalSpark] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);

  const [journalNotes, setJournalNotes] = useState(() => {
    try {
      const stored = localStorage.getItem('daily_spark_notes');
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('daily_spark_items', JSON.stringify(sparks));
    } catch (e) {
      console.warn('LocalStorage save failed', e);
    }
  }, [sparks]);

  useEffect(() => {
    try {
      localStorage.setItem('daily_spark_notes', JSON.stringify(journalNotes));
    } catch (e) {
      console.warn('LocalStorage notes save failed', e);
    }
  }, [journalNotes]);

  const toggleSaveSpark = (id) => {
    setSparks((prev) =>
      prev.map((spark) => {
        if (spark.id === id) {
          const newSaved = !spark.saved;
          showToast(newSaved ? 'Saved to Personal Archive' : 'Removed from Saved Sparks');
          return { ...spark, saved: newSaved };
        }
        return spark;
      })
    );
  };

  const saveJournalNote = (sparkId, note) => {
    setJournalNotes((prev) => ({
      ...prev,
      [sparkId]: note
    }));
    showToast('Reflection note saved');
  };

  const showToast = (message) => {
    setToastMessage(message);
    setTimeout(() => {
      setToastMessage((cur) => (cur === message ? null : cur));
    }, 2800);
  };

  const openShare = (spark) => {
    setShareModalSpark(spark);
  };

  const closeShare = () => {
    setShareModalSpark(null);
  };

  const resetData = () => {
    setSparks(INITIAL_SPARKS);
    setJournalNotes({});
    setSearchQuery('');
    setActiveCategory('all');
    localStorage.removeItem('daily_spark_items');
    localStorage.removeItem('daily_spark_notes');
    showToast('Archive reset to default');
  };

  const savedSparksCount = sparks.filter((s) => s.saved).length;

  return (
    <SparksContext.Provider
      value={{
        sparks,
        savedSparksCount,
        toggleSaveSpark,
        activeCategory,
        setActiveCategory,
        searchQuery,
        setSearchQuery,
        shareModalSpark,
        openShare,
        closeShare,
        journalNotes,
        saveJournalNote,
        toastMessage,
        showToast,
        resetData
      }}
    >
      {children}
    </SparksContext.Provider>
  );
};

export const useSparks = () => useContext(SparksContext);
