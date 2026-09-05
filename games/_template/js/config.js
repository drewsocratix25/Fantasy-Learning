// Game configuration (loaded before the engine). Copy games/_template to games/<id> and edit:
window.FL = window.FL || {};
FL.config = {
  id: 'template',                    // must match the "id" in games.json
  title: 'Template Game',
  storageKey: 'littleWonders.template.v1',   // progress + settings key in localStorage; unique per game
  startScene: 'world',               // the scene FL.Game boots into (melody uses a 'title' scene first)
  heroLabel: 'Change hero', heroEmoji: '🧒',
  voiceTestLine: 'Hello! Tap the picture that matches.',
  lineFiles: [],                     // files that define FL.Lines.all() for a pre-rendered voice pack (see tools/make-voices.py)
};

// Game data the shared engine reads. PRINCESSES is the hero list drawn by FL.Art.princess (swap the
// drawing for your own hero in a real game); PRAISE is what the results screen says.
FL.Data = {
  PRINCESSES: [
    { name: 'Rosie', dress: '#f472b6', dressDark: '#db2777', hair: '#7c2d12', skin: '#fde0c8', crown: '#fbbf24' },
    { name: 'Violet', dress: '#a78bfa', dressDark: '#7c3aed', hair: '#1f1235', skin: '#8d5524', crown: '#fbbf24' },
  ],
  PRAISE: ['Wonderful', 'Amazing', 'Fantastic', 'Bravo'],
};
