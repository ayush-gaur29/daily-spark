import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { INITIAL_SPARKS } from '../data/sparks';

const AudioContext = createContext();

export const AudioProvider = ({ children }) => {
  // Default to today's spark so there is an active spark ready to listen
  const [currentTrack, setCurrentTrack] = useState(INITIAL_SPARKS[0]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const timerRef = useRef(null);

  const duration = currentTrack?.audioDuration || 185;

  useEffect(() => {
    if (isPlaying) {
      timerRef.current = setInterval(() => {
        setCurrentTime((prev) => {
          const next = prev + 1 * playbackSpeed;
          if (next >= duration) {
            setIsPlaying(false);
            return duration;
          }
          return next;
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPlaying, duration, playbackSpeed]);

  const playTrack = (spark) => {
    if (!spark) return;
    if (currentTrack?.id === spark.id) {
      if (currentTime >= (spark.audioDuration || 185)) {
        setCurrentTime(0);
        setIsPlaying(true);
      } else {
        setIsPlaying((prev) => !prev);
      }
    } else {
      setCurrentTrack(spark);
      setCurrentTime(0);
      setIsPlaying(true);
    }
  };

  const togglePlay = () => {
    if (currentTime >= duration) {
      setCurrentTime(0);
      setIsPlaying(true);
    } else {
      setIsPlaying((prev) => !prev);
    }
  };

  const seek = (timeInSeconds) => {
    const clamped = Math.max(0, Math.min(timeInSeconds, duration));
    setCurrentTime(clamped);
  };

  const skip = (deltaSeconds) => {
    setCurrentTime((prev) => Math.max(0, Math.min(prev + deltaSeconds, duration)));
  };

  const cycleSpeed = () => {
    const speeds = [1, 1.25, 1.5];
    const currentIndex = speeds.indexOf(playbackSpeed);
    const nextSpeed = speeds[(currentIndex + 1) % speeds.length];
    setPlaybackSpeed(nextSpeed);
  };

  const formatTime = (secs) => {
    const minutes = Math.floor(secs / 60);
    const seconds = Math.floor(secs % 60);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  return (
    <AudioContext.Provider
      value={{
        currentTrack,
        isPlaying,
        currentTime,
        duration,
        playbackSpeed,
        playTrack,
        togglePlay,
        seek,
        skip,
        cycleSpeed,
        formatTime
      }}
    >
      {children}
    </AudioContext.Provider>
  );
};

export const useAudio = () => useContext(AudioContext);
