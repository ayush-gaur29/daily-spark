/**
 * Centralized Recommendations Registry for Dr. Cubie Inspiration App
 * Actionable multi-modal recommendations pointing to Videos, Audios, and Sparks
 */

export const ALL_RECOMMENDATIONS = [
  {
    id: 'rec-focus-reset',
    title: 'Focus Reset',
    description: 'A 1-minute visual breath to recalibrate mental bandwidth during busy work sessions.',
    contentType: 'video',
    contentId: 'focus-reset',
    category: 'Focus',
    duration: '1 min',
    actionText: 'Watch →',
    actionType: 'video',
    videoUrl: '/assets/videos/focus-reset.mp4',
    posterUrl: '/assets/images/spark-focus-dividend.jpg',
    sparkId: 'the-focus-dividend',
    displayOrder: 1
  },
  {
    id: 'rec-morning-calm',
    title: 'Morning Reflection',
    description: 'Guided acoustic contemplation designed to foster calm presence before morning meetings.',
    contentType: 'audio',
    contentId: 'morning-calm',
    category: 'Mindfulness',
    duration: '3 min',
    actionText: 'Listen →',
    actionType: 'audio',
    coverUrl: '/assets/images/hero-quiet-clarity.jpg',
    sparkId: 'the-architecture-of-quiet-clarity',
    displayOrder: 2
  },
  {
    id: 'rec-focused-believing',
    title: 'Focused Believing',
    description: 'Strategic reflection on sustaining high conviction while operating under uncertainty.',
    contentType: 'spark',
    contentId: 'the-architecture-of-quiet-clarity',
    category: 'Leadership',
    duration: '4 min',
    actionText: 'Read →',
    actionType: 'spark',
    coverUrl: '/assets/images/hero-quiet-clarity.jpg',
    sparkId: 'the-architecture-of-quiet-clarity',
    displayOrder: 3
  },
  {
    id: 'rec-confidence-practice',
    title: 'Confidence Practice',
    description: 'Grounding physical presence and emotional poise under immediate performance pressure.',
    contentType: 'video',
    contentId: 'confidence-practice',
    category: 'Confidence',
    duration: '1 min',
    actionText: 'Watch →',
    actionType: 'video',
    videoUrl: '/assets/videos/confidence-practice.mp4',
    posterUrl: '/assets/images/spark-leading-poise.jpg',
    sparkId: 'leading-with-poise',
    displayOrder: 4
  },
  {
    id: 'rec-intentional-living',
    title: 'Intentional Living',
    description: 'Daily alignment of time, cognitive energy, and core executive priorities.',
    contentType: 'spark',
    contentId: 'aligning-intentions',
    category: 'Growth',
    duration: '5 min',
    actionText: 'Read →',
    actionType: 'spark',
    coverUrl: '/assets/images/spark-aligning-intentions.jpg',
    sparkId: 'aligning-intentions',
    displayOrder: 5
  },
  {
    id: 'rec-deep-focus-audio',
    title: 'Deep Focus Soundscape',
    description: 'Harmonically tuned sound immersion to shield cognitive flow from external distractions.',
    contentType: 'audio',
    contentId: 'deep-focus',
    category: 'Focus',
    duration: '5 min',
    actionText: 'Listen →',
    actionType: 'audio',
    coverUrl: '/assets/images/spark-focus-dividend.jpg',
    sparkId: 'the-focus-dividend',
    displayOrder: 6
  }
];
