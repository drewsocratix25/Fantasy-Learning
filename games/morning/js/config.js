// Rise and Shine configuration (loaded before the engine).
window.FL = window.FL || {};
FL.config = {
  id: 'morning', title: 'Rise and Shine', storageKey: 'riseAndShine.v1', startScene: 'title', hubScene: 'house', homeLabel: 'Home',
  heroLabel: 'Change girl', heroEmoji: '👧',
  voiceTestLine: 'Good morning! The sun is up. Let\'s get ready for the day!',
  voiceTestLineNamed: (n) => `Good morning, ${n}! The sun is up. Let's get ready for the day!`,
  lineFiles: ['js/data.js', 'js/voicelines.js'],
  defaults: { companion: '🧸', unlocked: ['🧸'], accessory: 'bow', day: { n: 1, done: [] }, sunshine: 0, weather: 'sunny' },
};
