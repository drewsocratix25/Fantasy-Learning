// Melody Kingdom game configuration (loaded before the engine).
window.FL = window.FL || {};
FL.config = {
  id: 'melody', title: 'Melody Kingdom', storageKey: 'melodyKingdom.v1', startScene: 'title',
  heroLabel: 'Change princess', heroEmoji: '👸',
  voiceTestLine: 'Hello. Can you find the letter B? Wonderful. B is for butterfly.',
  voiceTestLineNamed: (n) => `Hello Princess ${n}. Can you find the letter B? Wonderful. B is for butterfly.`,
  lineFiles: ['js/data.js', 'js/songs.js', 'js/drawings.js', 'js/voicelines.js'],
  defaults: { drawings: {} },   // drawingId -> small PNG data URL of her finished picture
};
