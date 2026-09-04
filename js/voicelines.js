// Every sentence the narrator can say, so a voice pack can be pre-rendered.
// Each line: { text } as the game says it, plus optional { speak } for how a TTS engine should read it.
(function () {
  const D = () => FL.Data;
  function spell(s) { // replace standalone capital letters with their spoken names ("A" -> "ay")
    return s.replace(/(^|[^A-Za-z])([A-Z])(?![A-Za-z])/g, (m, pre, L) => pre + D().LETTER_SPOKEN[L]);
  }
  const Lines = {
    all(name) {
      const L = []; const add = (text, speak) => L.push(speak && speak !== text ? { text, speak } : { text });
      const D_ = D(); const songs = FL.Songs.list;
      // title / world
      add('Welcome to Melody Kingdom! Let\'s go explore!');
      if (name) add(`Welcome to Melody Kingdom, Princess ${name}! Let's go explore!`);
      D_.PRINCESSES.forEach((p) => add(`Hi! I'm ${p.name}!`));
      add('Tap anywhere to walk. Walk to a sign and tap Play!');
      D_.LOCS.forEach((l) => { add(`${l.name}! ${l.hint}`); add(`Let's go to the ${l.name}!`); });
      // results, friends, grown-up corner
      D_.PRAISE.forEach((p) => [1, 2, 3].forEach((n) => { add(`${p}! You earned ${n} star${n > 1 ? 's' : ''}!`); if (name) add(`${p}, ${name}! You earned ${n} star${n > 1 ? 's' : ''}!`); }));
      D_.FRIENDS.forEach(([, f]) => { add(`${f} will come with you!`); add(`A new friend! ${f} wants to play with you!`); });
      add('Hello. Can you find the letter B? Wonderful. B is for butterfly.', 'Hello. Can you find the letter bee? Wonderful. Bee is for butterfly.');
      if (name) add(`Hello Princess ${name}. Can you find the letter B? Wonderful. B is for butterfly.`, `Hello Princess ${name}. Can you find the letter bee? Wonderful. Bee is for butterfly.`);
      // songs
      add('Pick a song to play!'); add('Tap the gems when they reach the sparkly pads!');
      songs.forEach((s) => { const t = s.title; const sp = spell(t); add(`${t}! Tap the gems when they reach the sparkly pads. Ready?`, `${sp}! Tap the gems when they reach the sparkly pads. Ready?`); add(`Listen to ${t}!`, `Listen to ${sp}!`); add(`Let's learn ${t}! Tap the glowing key.`, `Let's learn ${sp}! Tap the glowing key.`); });
      add('Welcome to the Piano Pavilion! Tap the colourful keys to make music!'); add('Free play! Make up your own song!'); add('You played the whole song! Beautiful!'); add('Now you try! Tap Teach me.');
      // letters
      Object.keys(D_.LETTER_WORDS).forEach((Lt) => { const [word] = D_.LETTER_WORDS[Lt]; const sp = D_.LETTER_SPOKEN[Lt];
        add(`Can you find the letter ${Lt}?`, `Can you find the letter ${sp}?`); add(`Which letter does ${word} start with?`);
        add(`${Lt}! ${Lt} is for ${word}!`, `${sp}! ${sp} is for ${word}!`); add(`That's the letter ${Lt}. Try again!`, `That's the letter ${sp}. Try again!`); });
      // numbers
      add('Tap each frog to count them!'); add('How many frogs did you count? Tap the number.'); add('Count the frogs again!');
      for (let n = 1; n <= D_.MAX_COUNT; n++) { add(String(n)); add(`Can you find the number ${n}?`); add(`Yes! ${n} frog${n > 1 ? 's' : ''}!`); add(`Yes! That's ${n}! Let's count ${n} frogs!`); add(`That's ${n}.`); add(`Look for ${n}!`); }
      // shapes & colours
      D_.COLORS.forEach(([c]) => add(`Pop the ${c} balloon!`)); D_.SHAPES.forEach((s) => add(`Pop the ${s}!`));
      D_.COLORS.forEach(([c]) => D_.SHAPES.forEach((s) => { add(`Pop the ${c} ${s}!`); add(`Pop! A ${c} ${s}!`); add(`That's a ${c} ${s}.`); }));
      // patterns
      add('What comes next?'); D_.CREATURES.forEach((cr) => { add(`Yes! The ${cr.name} comes next!`); add(`Hmm, not the ${cr.name}. Listen again!`); });
      return L;
    },
    // Stable id for a line: FNV-1a over the normalised text (mirrored in tools/make-voices.py).
    normalize(text) { return String(text).toLowerCase().replace(/[’‘]/g, "'").replace(/[^a-z0-9' ]+/g, ' ').replace(/\s+/g, ' ').trim(); },
    id(text) { const s = Lines.normalize(text); let h = 0x811c9dc5; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0; } return h.toString(16).padStart(8, '0'); },
  };
  window.FL = window.FL || {};
  FL.Lines = Lines;
})();
