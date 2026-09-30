/**
 * Centralized Audio Registry for Dr. Cubie Inspiration App
 * Realistic audio sessions with speaker information, durations, and waveforms
 */

export const WAVEFORM_PRESETS = {
  calm: [10, 16, 24, 30, 26, 18, 14, 28, 34, 30, 18, 12, 22, 32, 26, 16, 10, 20, 28, 22, 14, 18, 26, 18],
  guided: [14, 20, 28, 22, 16, 24, 32, 26, 18, 12, 20, 30, 24, 16, 12, 18, 24, 20, 14, 16, 22, 18, 14, 10],
  focus: [12, 18, 26, 32, 24, 16, 22, 30, 26, 18, 14, 22, 28, 20, 14, 18, 26, 22, 16, 12, 18, 24, 16, 12],
  reset: [16, 22, 30, 24, 18, 26, 34, 28, 20, 14, 22, 28, 22, 16, 12, 20, 26, 18, 14, 16, 20, 16, 12, 8]
};

export const ALL_AUDIOS = [
  {
    id: 'morning-calm',
    title: 'Morning Calm',
    subtitle: 'Awakening intentional stillness before daily decisions and communications.',
    description: 'Awakening intentional stillness before daily decisions and communications.',
    author: 'Dr. Cubie • Voice of Dr. Cubie',
    speaker: 'Dr. Cubie',
    category: 'Mindfulness',
    categoryTag: '04:15 • MINDFULNESS',
    durationTotal: 255,
    durationText: '04:15',
    audioUrl: 'https://nflcrjyxgwaedzmlbaqj.supabase.co/storage/v1/object/public/audio/sparks/1790661815497_mixkit-spirit-in-the-woods-139.mp3',
    coverUrl: '/assets/images/hero-quiet-clarity.jpg',
    sparkId: 'the-architecture-of-quiet-clarity',
    waveformPattern: WAVEFORM_PRESETS.calm
  },
  {
    id: 'guided-reflection',
    title: 'Guided Reflection',
    subtitle: 'Stepping back to observe thoughts with gentle clarity and perspective.',
    description: 'Stepping back to observe thoughts with gentle clarity and perspective.',
    author: 'Dr. Cubie • Voice of Dr. Cubie',
    speaker: 'Dr. Cubie',
    category: 'Reflection',
    categoryTag: '08:30 • GUIDED',
    durationTotal: 510,
    durationText: '08:30',
    audioUrl: 'https://nflcrjyxgwaedzmlbaqj.supabase.co/storage/v1/object/public/audio/sparks/1790746391372_mixkit-meditation-441.mp3',
    coverUrl: '/assets/images/spark-aligning-intentions.jpg',
    sparkId: 'aligning-intentions',
    waveformPattern: WAVEFORM_PRESETS.guided
  },
  {
    id: 'deep-focus',
    title: 'Deep Focus',
    subtitle: '432Hz ambient cognitive reset to sustain single-task executive immersion.',
    description: '432Hz ambient cognitive reset to sustain single-task executive immersion.',
    author: 'Dr. Cubie • Soundscape',
    speaker: 'Voice of Dr. Cubie',
    category: 'Focus',
    categoryTag: '05:20 • FOCUS',
    durationTotal: 320,
    durationText: '05:20',
    audioUrl: 'https://nflcrjyxgwaedzmlbaqj.supabase.co/storage/v1/object/public/audio/sparks/1790664729899_mixkit-yoga-tune-325.mp3',
    coverUrl: '/assets/images/spark-focus-dividend.jpg',
    sparkId: 'the-focus-dividend',
    waveformPattern: WAVEFORM_PRESETS.focus
  },
  {
    id: 'evening-reset',
    title: 'Evening Reset',
    subtitle: 'Decompressing nervous system activation and creating restorative boundaries.',
    description: 'Decompressing nervous system activation and creating restorative boundaries.',
    author: 'Dr. Cubie • Decompression',
    speaker: 'Dr. Cubie',
    category: 'Reflection',
    categoryTag: '06:45 • EVENING',
    durationTotal: 405,
    durationText: '06:45',
    audioUrl: 'https://nflcrjyxgwaedzmlbaqj.supabase.co/storage/v1/object/public/audio/sparks/1790661815497_mixkit-spirit-in-the-woods-139.mp3',
    coverUrl: '/assets/images/spark-leading-poise.jpg',
    sparkId: 'leading-with-poise',
    waveformPattern: WAVEFORM_PRESETS.reset
  },
  {
    id: 'focused-believing',
    title: 'Focused Believing',
    subtitle: 'Cultivating unshakable internal conviction during periods of ambiguity.',
    description: 'Cultivating unshakable internal conviction during periods of ambiguity.',
    author: 'Dr. Cubie • Session',
    speaker: 'Dr. Cubie',
    category: 'Confidence',
    categoryTag: '04:15 • AUDIO',
    durationTotal: 255,
    durationText: '04:15',
    audioUrl: 'https://nflcrjyxgwaedzmlbaqj.supabase.co/storage/v1/object/public/audio/sparks/1790746391372_mixkit-meditation-441.mp3',
    coverUrl: '/assets/images/hero-quiet-clarity.jpg',
    sparkId: 'the-architecture-of-quiet-clarity',
    waveformPattern: WAVEFORM_PRESETS.calm
  }
];
