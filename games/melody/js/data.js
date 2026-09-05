// Shared game data (pure data, no DOM): used by the games and by the voice-line generator.
(function () {
  const Data = {};
  Data.PRINCESSES = [
    { name: 'Rosie', dress: '#f472b6', dressDark: '#db2777', hair: '#7c2d12', skin: '#fde0c8', crown: '#fbbf24' },
    { name: 'Violet', dress: '#a78bfa', dressDark: '#7c3aed', hair: '#1f1235', skin: '#8d5524', crown: '#fbbf24' },
    { name: 'Sunny', dress: '#fde047', dressDark: '#f59e0b', hair: '#f59e0b', skin: '#f1c27d', crown: '#f472b6' },
    { name: 'Coral', dress: '#5eead4', dressDark: '#0d9488', hair: '#3b1f0e', skin: '#c68642', crown: '#fbbf24' },
  ];
  Data.REGIONS = [
    { id: 'kingdom', name: 'Melody Kingdom', x0: 0, w: 2400, ground: ['#86efac', '#4ade80'], path: ['#d6b98c', '#f1dfb0'], hub: { x: 1200, y: 960 } },
    { id: 'forest', name: 'Enchanted Forest', x0: 2400, w: 2400, ground: ['#4ade80', '#15803d'], path: ['#92400e', '#b45309'], hub: { x: 3600, y: 960 }, gateHint: 'Collect all your kingdom friends to open the Enchanted Forest!', openLine: 'The Enchanted Forest is open! Let\'s explore!' },
    { id: 'peaks', name: 'Crystal Peaks', x0: 4800, w: 2400, ground: ['#f0f9ff', '#bae6fd'], path: ['#94a3b8', '#e2e8f0'], hub: { x: 6000, y: 960 }, gateHint: 'Collect all your forest friends to open the Crystal Peaks!', openLine: 'The Crystal Peaks are open! Let\'s explore!' },
  ];
  Data.LOCS = [
    { id: 'rhythm', name: 'Melody Castle', emoji: '🏰', x: 1200, y: 790, r: 130, scene: 'songs', hint: 'Play songs like a rock star!' },
    { id: 'letters', name: 'Letter Garden', emoji: '🌸', x: 430, y: 620, r: 120, scene: 'letters', hint: 'Find the letters!' },
    { id: 'numbers', name: 'Counting Pond', emoji: '🐸', x: 1980, y: 660, r: 120, scene: 'numbers', hint: 'Count the frogs!' },
    { id: 'shapes', name: 'Rainbow Meadow', emoji: '🌈', x: 470, y: 1290, r: 120, scene: 'shapes', hint: 'Pop the shapes!' },
    { id: 'piano', name: 'Piano Pavilion', emoji: '🎹', x: 1930, y: 1330, r: 120, scene: 'piano', hint: 'Play the piano!' },
    { id: 'patterns', name: 'Pattern Bridge', emoji: '🐻', x: 1200, y: 1380, r: 120, scene: 'patterns', hint: 'What comes next?' },
    // Enchanted Forest (region 1)
    { id: 'rhyme', name: 'Rhyme Tree', emoji: '🌳', x: 3100, y: 600, r: 120, scene: 'rhyme', hint: 'Find the word that rhymes!', region: 1 },
    { id: 'spelling', name: 'Acorn Spelling', emoji: '🐿️', x: 4100, y: 600, r: 120, scene: 'spelling', hint: 'Spell the word!', region: 1 },
    { id: 'owlmath', name: 'Owl School', emoji: '🦉', x: 3100, y: 1320, r: 120, scene: 'owlmath', hint: 'Add and take away!', region: 1 },
    { id: 'echo', name: 'Echo Cave', emoji: '🍄', x: 4100, y: 1320, r: 120, scene: 'echo', hint: 'Play the owl\'s song back!', region: 1 },
    // Crystal Peaks (region 2)
    { id: 'clock', name: 'Cloud Clock', emoji: '🕰️', x: 5500, y: 600, r: 120, scene: 'clock', hint: 'What time is it?', region: 2 },
    { id: 'reading', name: 'Reading Rock', emoji: '📖', x: 6500, y: 600, r: 120, scene: 'reading', hint: 'Read the words!', region: 2 },
    { id: 'numberline', name: 'Crystal Stairs', emoji: '💎', x: 5500, y: 1320, r: 120, scene: 'numberline', hint: 'Find the missing number!', region: 2 },
    { id: 'drums', name: 'Dragon Drums', emoji: '🥁', x: 6500, y: 1320, r: 120, scene: 'drums', hint: 'Drum the beat back!', region: 2 },
  ];
  Data.LOCS.forEach((l) => { l.region = l.region || 0; });
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
  // [emoji, name, stars needed, region]. Collecting every friend of a region opens the next region.
  Data.FRIENDS = [
    ['🐰', 'Bunny', 0, 0], ['🦄', 'Unicorn', 5, 0], ['🐉', 'Dragon', 12, 0], ['🐥', 'Chick', 20, 0], ['🦋', 'Butterfly', 30, 0], ['🐧', 'Penguin', 42, 0], ['🦊', 'Fox', 55, 0], ['🐬', 'Dolphin', 70, 0],
    ['🦉', 'Owl', 85, 1], ['🦌', 'Deer', 100, 1], ['🐿️', 'Squirrel', 118, 1], ['🦔', 'Hedgehog', 138, 1], ['🐺', 'Wolf', 160, 1], ['🧚', 'Fairy', 185, 1],
    ['🐻‍❄️', 'Polar Bear', 210, 2], ['🦅', 'Eagle', 240, 2], ['🐐', 'Goat', 275, 2], ['🦭', 'Seal', 315, 2], ['🦢', 'Swan', 360, 2],
  ];
  // Other rewards between friends, so something new happens every few stars.
  Data.UNLOCKS = [
    { stars: 8, type: 'crown', id: 'flower', name: 'Flower Crown', emoji: '🌸', line: 'You unlocked a flower crown!' },
    { stars: 16, type: 'dress', id: 'set2', name: 'New dress colours', emoji: '👗', line: 'You unlocked new dress colours!' },
    { stars: 25, type: 'wand', id: 'star', name: 'Magic Wand', emoji: '🪄', line: 'You unlocked a magic wand!' },
    { stars: 35, type: 'crown', id: 'star', name: 'Star Crown', emoji: '⭐', line: 'You unlocked a star crown!' },
    { stars: 48, type: 'decor', id: 'fountain', name: 'Kingdom Fountain', emoji: '⛲', line: 'A fountain appeared in the kingdom!' },
    { stars: 62, type: 'crown', id: 'rainbow', name: 'Rainbow Crown', emoji: '🌈', line: 'You unlocked a rainbow crown!' },
    { stars: 92, type: 'dress', id: 'set3', name: 'Sparkle dress colours', emoji: '✨', line: 'You unlocked sparkle dress colours!' },
    { stars: 110, type: 'wand', id: 'moon', name: 'Moon Wand', emoji: '🌙', line: 'You unlocked a moon wand!' },
    { stars: 128, type: 'decor', id: 'balloon', name: 'Hot Air Balloon', emoji: '🎈', line: 'A hot air balloon is flying over the kingdom!' },
    { stars: 150, type: 'crown', id: 'leaf', name: 'Leaf Crown', emoji: '🍃', line: 'You unlocked a leaf crown!' },
    { stars: 172, type: 'wand', id: 'heart', name: 'Heart Wand', emoji: '💖', line: 'You unlocked a heart wand!' },
    { stars: 200, type: 'crown', id: 'ice', name: 'Ice Crown', emoji: '❄️', line: 'You unlocked an ice crown!' },
    { stars: 260, type: 'decor', id: 'fireworks', name: 'Fireworks', emoji: '🎆', line: 'Fireworks will light up the kingdom!' },
  ];
  Data.DRESS_SETS = { set1: [['#f472b6', '#db2777'], ['#a78bfa', '#7c3aed'], ['#fde047', '#f59e0b'], ['#5eead4', '#0d9488']], set2: [['#60a5fa', '#2563eb'], ['#fb7185', '#e11d48'], ['#86efac', '#16a34a'], ['#fdba74', '#ea580c']], set3: [['#f0abfc', '#c026d3'], ['#fef08a', '#ca8a04'], ['#99f6e4', '#0f766e'], ['#e2e8f0', '#64748b']] };
  // ---- forest & peaks game content ----
  Data.RHYMES = [
    ['cat', '🐱', [['hat', '🎩'], ['bat', '🦇']]], ['dog', '🐶', [['frog', '🐸'], ['log', '🪵']]], ['star', '⭐', [['car', '🚗'], ['guitar', '🎸']]], ['bee', '🐝', [['tree', '🌳'], ['key', '🔑']]],
    ['moon', '🌙', [['spoon', '🥄'], ['balloon', '🎈']]], ['cake', '🎂', [['snake', '🐍'], ['lake', '🏞️']]], ['mouse', '🐭', [['house', '🏠']]], ['bear', '🐻', [['chair', '🪑'], ['pear', '🍐']]],
    ['fish', '🐟', [['dish', '🍽️']]], ['goat', '🐐', [['boat', '⛵'], ['coat', '🧥']]], ['king', '🤴', [['ring', '💍']]], ['duck', '🦆', [['truck', '🚚']]], ['sock', '🧦', [['clock', '🕰️'], ['rock', '🪨']]],
    ['snail', '🐌', [['whale', '🐳'], ['mail', '📬']]], ['rose', '🌹', [['nose', '👃'], ['toes', '🦶']]], ['bell', '🔔', [['shell', '🐚']]], ['ball', '⚽', [['wall', '🧱']]], ['sheep', '🐑', [['jeep', '🚙']]],
    ['corn', '🌽', [['horn', '📯'], ['unicorn', '🦄']]], ['crown', '👑', [['clown', '🤡'], ['gown', '👗']]], ['hen', '🐔', [['pen', '🖊️'], ['ten', '🔟']]], ['fox', '🦊', [['box', '📦'], ['socks', '🧦']]],
    ['bug', '🐛', [['mug', '☕'], ['hug', '🤗']]], ['train', '🚂', [['rain', '🌧️'], ['brain', '🧠']]],
  ];
  Data.WORDS3 = [['cat', '🐱'], ['dog', '🐶'], ['sun', '☀️'], ['hat', '🎩'], ['pig', '🐷'], ['bus', '🚌'], ['cup', '☕'], ['bed', '🛏️'], ['fox', '🦊'], ['hen', '🐔'], ['bug', '🐛'], ['map', '🗺️'], ['net', '🥅'], ['pot', '🍲'], ['web', '🕸️'], ['log', '🪵'], ['box', '📦'], ['cab', '🚕'], ['ant', '🐜'], ['egg', '🥚'], ['owl', '🦉'], ['bat', '🦇'], ['cow', '🐮'], ['bee', '🐝'], ['key', '🔑'], ['car', '🚗'], ['pen', '🖊️'], ['van', '🚐'], ['nut', '🥜'], ['toe', '🦶'], ['jam', '🍓'], ['ice', '🧊']];
  Data.MATH_ITEMS = [['🍎', 'apples'], ['🌰', 'acorns'], ['🍄', 'mushrooms'], ['🌸', 'flowers'], ['⭐', 'stars'], ['🐞', 'ladybugs']];
  Data.NUMBERLINE_MAX = 50;
  Data.CLOCK_HOURS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
  Data.SIMON = {
    echo: { name: 'Echo Cave', leader: '🦉', pads: [['🍄', '#f472b6', 'C4'], ['🍄', '#fb923c', 'D4'], ['🍄', '#facc15', 'E4'], ['🍄', '#4ade80', 'G4'], ['🍄', '#60a5fa', 'A4']], inst: 'bell', intro: 'Listen to the owl\'s song, then play it back on the mushrooms!', results: 'Echo Cave complete!' },
    drums: { name: 'Dragon Drums', leader: '🐲', pads: [['🥁', '#ef4444', 'kick'], ['🪘', '#f59e0b', 'wood'], ['👏', '#3b82f6', 'shaker']], inst: null, intro: 'Listen to the dragon\'s beat, then drum it back!', results: 'Dragon Drums complete!' },
  };
  Data.PRAISE = ['Wonderful', 'Amazing', 'Beautiful', 'Fantastic', 'Bravo'];
  window.FL = window.FL || {};
  FL.Data = Data;
})();
