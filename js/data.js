// Shared game data (pure data, no DOM): used by the games and by the voice-line generator.
(function () {
  const Data = {};
  Data.PRINCESSES = [
    { name: 'Rosie', dress: '#f472b6', dressDark: '#db2777', hair: '#7c2d12', skin: '#fde0c8', crown: '#fbbf24' },
    { name: 'Violet', dress: '#a78bfa', dressDark: '#7c3aed', hair: '#1f1235', skin: '#8d5524', crown: '#fbbf24' },
    { name: 'Sunny', dress: '#fde047', dressDark: '#f59e0b', hair: '#f59e0b', skin: '#f1c27d', crown: '#f472b6' },
    { name: 'Coral', dress: '#5eead4', dressDark: '#0d9488', hair: '#3b1f0e', skin: '#c68642', crown: '#fbbf24' },
  ];
  Data.LOCS = [
    { id: 'rhythm', name: 'Melody Castle', emoji: '🏰', x: 1200, y: 790, r: 130, scene: 'songs', hint: 'Play songs like a rock star!' },
    { id: 'letters', name: 'Letter Garden', emoji: '🌸', x: 430, y: 620, r: 120, scene: 'letters', hint: 'Find the letters!' },
    { id: 'numbers', name: 'Counting Pond', emoji: '🐸', x: 1980, y: 660, r: 120, scene: 'numbers', hint: 'Count the frogs!' },
    { id: 'shapes', name: 'Rainbow Meadow', emoji: '🌈', x: 470, y: 1290, r: 120, scene: 'shapes', hint: 'Pop the shapes!' },
    { id: 'piano', name: 'Piano Pavilion', emoji: '🎹', x: 1930, y: 1330, r: 120, scene: 'piano', hint: 'Play the piano!' },
    { id: 'patterns', name: 'Pattern Bridge', emoji: '🐻', x: 1200, y: 1380, r: 120, scene: 'patterns', hint: 'What comes next?' },
  ];
  Data.LETTER_WORDS = { A: ['apple', '🍎'], B: ['butterfly', '🦋'], C: ['cat', '🐱'], D: ['dog', '🐶'], E: ['elephant', '🐘'], F: ['frog', '🐸'], G: ['grapes', '🍇'], H: ['house', '🏠'], I: ['ice cream', '🍦'], J: ['jellyfish', '🪼'], K: ['kite', '🪁'], L: ['lion', '🦁'], M: ['moon', '🌙'], N: ['nest', '🪺'], O: ['octopus', '🐙'], P: ['pig', '🐷'], Q: ['queen', '👸'], R: ['rainbow', '🌈'], S: ['star', '⭐'], T: ['turtle', '🐢'], U: ['umbrella', '☂️'], V: ['violin', '🎻'], W: ['whale', '🐳'], X: ['xylophone', '🎼'], Y: ['yo-yo', '🪀'], Z: ['zebra', '🦓'] };
  // How a letter name should be pronounced by a text-to-speech engine.
  Data.LETTER_SPOKEN = { A: 'ay', B: 'bee', C: 'see', D: 'dee', E: 'ee', F: 'eff', G: 'gee', H: 'aitch', I: 'eye', J: 'jay', K: 'kay', L: 'ell', M: 'em', N: 'en', O: 'oh', P: 'pee', Q: 'cue', R: 'are', S: 'ess', T: 'tee', U: 'you', V: 'vee', W: 'double you', X: 'ex', Y: 'why', Z: 'zee' };
  Data.MAX_COUNT = 10;
  Data.SHAPES = ['circle', 'square', 'triangle', 'star', 'heart', 'rectangle', 'oval', 'diamond'];
  Data.COLORS = [['red', '#ef4444'], ['orange', '#f97316'], ['yellow', '#facc15'], ['green', '#22c55e'], ['blue', '#3b82f6'], ['purple', '#a855f7'], ['pink', '#f472b6']];
  Data.CREATURES = [
    { e: '🐻', name: 'bear', inst: 'kick', note: 60, color: '#a16207' },
    { e: '🐰', name: 'bunny', inst: 'bell', note: 'E6', color: '#f9a8d4' },
    { e: '🦊', name: 'fox', inst: 'flute', note: 'G5', color: '#fb923c' },
    { e: '🐸', name: 'frog', inst: 'wood', note: 900, color: '#4ade80' },
  ];
  Data.FRIENDS = [['🐰', 'Bunny', 0], ['🦄', 'Unicorn', 12], ['🐉', 'Dragon', 30], ['🦋', 'Butterfly', 50], ['🐥', 'Chick', 75], ['🐧', 'Penguin', 100], ['🦊', 'Fox', 130], ['🐬', 'Dolphin', 170]];
  Data.PRAISE = ['Wonderful', 'Amazing', 'Beautiful', 'Fantastic', 'Bravo'];
  window.FL = window.FL || {};
  FL.Data = Data;
})();
