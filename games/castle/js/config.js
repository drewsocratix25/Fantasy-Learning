// Castle Quest game configuration (loaded before the engine).
window.FL = window.FL || {};
FL.config = {
  id: 'castle', title: 'Castle Quest', storageKey: 'castleQuest.v1', startScene: 'title',
  heroLabel: 'Change explorer', heroEmoji: '🧭', homeLabel: 'Castle', homeEmoji: '🏰',
  voiceTestLine: 'Hello. Is it day or night? Wonderful. The sun is out, so it is day.',
  voiceTestLineNamed: (n) => `Hello ${n}. Is it day or night? Wonderful. The sun is out, so it is day.`,
  lineFiles: ['js/data.js', 'js/voicelines.js'],
};
