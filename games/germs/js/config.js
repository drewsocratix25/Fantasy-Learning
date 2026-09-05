// Germ Patrol configuration (loaded before the engine).
window.FL = window.FL || {};
FL.config = {
  id: 'germs', title: 'Germ Patrol', storageKey: 'germPatrol.v1', startScene: 'title',
  heroLabel: 'Change hero', heroEmoji: '🦸',
  voiceTestLine: 'Hello, Patrol! Soap grabs the germs and water washes them down the drain.',
  voiceTestLineNamed: (n) => `Hello, Captain ${n}! Soap grabs the germs and water washes them down the drain.`,
  lineFiles: ['js/data.js', 'js/voicelines.js'],
  defaults: { companion: '🫧', unlocked: ['🫧'] },
};
