/**
 * Centralized Video Registry for Dr. Cubie Inspiration App
 * Verified local MP4 video assets stored in /assets/videos/
 */

export const VIDEOS = {
  'daily-motivation': {
    id: 'daily-motivation',
    title: 'The Architecture of Quiet Clarity',
    subtitle: 'Daily morning contemplation on intentional stillness and deliberate focus.',
    category: 'Mindfulness',
    categoryLabel: 'MINDFULNESS',
    duration: '0:30',
    durationSeconds: 30,
    videoUrl: '/assets/videos/daily-motivation.mp4',
    posterUrl: '/assets/images/hero-quiet-clarity.jpg'
  },
  'focus-reset': {
    id: 'focus-reset',
    title: 'Focus Reset',
    subtitle: 'Single-task immersion and attention realignment.',
    category: 'Focus',
    categoryLabel: 'FOCUS',
    duration: '1:05',
    durationSeconds: 65,
    videoUrl: '/assets/videos/focus-reset.mp4',
    posterUrl: '/assets/images/spark-focus-dividend.jpg'
  },
  'confidence-practice': {
    id: 'confidence-practice',
    title: 'Confidence Practice',
    subtitle: 'Cultivating emotional poise and grounded presence under pressure.',
    category: 'Confidence',
    categoryLabel: 'CONFIDENCE',
    duration: '0:48',
    durationSeconds: 48,
    videoUrl: '/assets/videos/confidence-practice.mp4',
    posterUrl: '/assets/images/spark-leading-poise.jpg'
  },
  'evening-reflection': {
    id: 'evening-reflection',
    title: 'Evening Reflection',
    subtitle: 'Decompressing cognitive load and setting boundaries between effort and rest.',
    category: 'Reflection',
    categoryLabel: 'REFLECTION',
    duration: '1:20',
    durationSeconds: 80,
    videoUrl: '/assets/videos/evening-reflection.mp4',
    posterUrl: '/assets/images/spark-aligning-intentions.jpg'
  }
};

export const VIP_VIDEOS = [
  VIDEOS['focus-reset'],
  VIDEOS['confidence-practice'],
  VIDEOS['evening-reflection']
];

export const TODAY_VIDEOS = [
  {
    id: 'decisive-leadership',
    title: 'Decisive Leadership Under Uncertainty',
    categoryBadge: 'KEYNOTE',
    metadata: 'HD Video • Keynote',
    duration: '04:45',
    posterUrl: '/assets/images/spark-leading-poise.jpg',
    videoUrl: '/assets/videos/confidence-practice.mp4',
    progress: 45,
    sparkId: 'leading-with-poise'
  },
  {
    id: 'the-focus-divide',
    title: 'The Focus Dividend & Immersion',
    categoryBadge: 'FOCUS',
    metadata: 'Executive Focus • HD Video',
    duration: '01:05',
    posterUrl: '/assets/images/spark-focus-dividend.jpg',
    videoUrl: '/assets/videos/focus-reset.mp4',
    progress: 60,
    sparkId: 'the-focus-dividend'
  },
  {
    id: 'quiet-clarity-action',
    title: 'Quiet Clarity in Action',
    categoryBadge: 'MINDFULNESS',
    metadata: 'HD Video • Daily Reset',
    duration: '00:30',
    posterUrl: '/assets/images/hero-quiet-clarity.jpg',
    videoUrl: '/assets/videos/daily-motivation.mp4',
    progress: 80,
    sparkId: 'the-architecture-of-quiet-clarity'
  },
  {
    id: 'evening-perspective',
    title: 'Evening Perspective & Alignment',
    categoryBadge: 'REFLECTION',
    metadata: 'HD Video • Reflection',
    duration: '01:20',
    posterUrl: '/assets/images/spark-aligning-intentions.jpg',
    videoUrl: '/assets/videos/evening-reflection.mp4',
    progress: 25,
    sparkId: 'aligning-intentions'
  }
];

