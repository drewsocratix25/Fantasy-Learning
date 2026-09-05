// Melody Kingdom game configuration (loaded before the engine).
window.FL = window.FL || {};
FL.config = {
  id: 'melody', title: 'Melody Kingdom', storageKey: 'melodyKingdom.v1', startScene: 'title',
  heroLabel: 'Change princess', heroEmoji: '👸',
  voiceTestLine: 'Hello. Can you find the letter B? Wonderful. B is for butterfly.',
  voiceTestLineNamed: (n) => `Hello Princess ${n}. Can you find the letter B? Wonderful. B is for butterfly.`,
  lineFiles: ['js/data.js', 'js/songs.js', 'js/drawings.js', 'js/voicelines.js'],
  entryScenes: ['drawpick', 'puppy', 'spell'],
  preserveOnReset: ['dog'],
  defaults: { drawings: {},
    dog: {                // Puppy Cottage (see js/games/puppysim.js)
      adopted: false, name: '', pron: 0, coat: 0, born: '',          // born = local YYYY-MM-DD (FL.Puppy.todayKey())
      stage: 0, points: 0, pendingGrow: '', rounds: 0,
      pointsDay: { key: '', n: 0 },
      needs: { food: 70, water: 70, play: 60, potty: 20 },
      lastSeen: 0, dancing: false, mud: 0,
      messes: [],                    // [{x, y, inside}] at most 2; x,y are fractions of W/H (0..1)
      chart: { key: '', fed: false, water: false, potty: false, clean: false, play: false, done: false },
      fetchCount: 0, lastRoundDay: '', week: [],
      tricks: { sit: 0, spin: 0, five: 0, roll: 0 },
      assist: { bag: 0, ball: 0 },
      tutorialDone: false, crown: false, parties: 0, visits: 0, accidentsToday: { key: '', n: 0 },
    },
  },   // drawingId -> small PNG data URL of her finished picture
};
