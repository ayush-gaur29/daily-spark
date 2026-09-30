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
  },
  'mindset-shift': {
    id: 'mindset-shift',
    title: 'Mindset Shift',
    subtitle: 'Reframing obstacles into cognitive stepping stones for sustainable growth.',
    category: 'Mindset',
    categoryLabel: 'MINDSET',
    duration: '1:15',
    durationSeconds: 75,
    videoUrl: '/assets/videos/focus-reset.mp4',
    posterUrl: '/assets/images/spark-leading-poise.jpg',
    sparkId: 'leading-with-poise'
  }
};

export const ALL_VIDEOS = [
  {
    ...VIDEOS['daily-motivation'],
    sparkId: 'the-architecture-of-quiet-clarity',
    description: 'Why intentional stillness builds resilient decisions in demanding environments.'
  },
  {
    ...VIDEOS['focus-reset'],
    sparkId: 'the-focus-dividend',
    description: 'Single-task immersion and attention realignment under cognitive overload.'
  },
  {
    ...VIDEOS['confidence-practice'],
    sparkId: 'leading-with-poise',
    description: 'Cultivating emotional poise and grounded presence in high-stakes moments.'
  },
  {
    ...VIDEOS['mindset-shift'],
    sparkId: 'leading-with-poise',
    description: 'Transforming friction and mental resistance into deliberate creative clarity.'
  },
  {
    ...VIDEOS['evening-reflection'],
    sparkId: 'aligning-intentions',
    description: 'Decompressing cognitive load and setting clear boundaries between effort and rest.'
  }
];

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
    category: 'Leadership',
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
    category: 'Focus',
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
    category: 'Mindfulness',
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
    category: 'Reflection',
    metadata: 'HD Video • Reflection',
    duration: '01:20',
    posterUrl: '/assets/images/spark-aligning-intentions.jpg',
    videoUrl: '/assets/videos/evening-reflection.mp4',
    progress: 25,
    sparkId: 'aligning-intentions'
  }
];


