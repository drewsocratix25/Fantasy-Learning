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
      D_.COLORS.forEach(([c]) => D_.SHAPES.forEach((s) => { const ar = FL.Lines.article(c); add(`Pop the ${c} ${s}!`); add(`Pop! ${ar[0].toUpperCase() + ar.slice(1)} ${c} ${s}!`); add(`That's ${ar} ${c} ${s}.`); }));
      // patterns
      add('What comes next?'); D_.CREATURES.forEach((cr) => { add(`Yes! The ${cr.name} comes next!`); add(`Hmm, not the ${cr.name}. Listen again!`); });
      // progression: regions, gates, rewards, songs
      D_.REGIONS.forEach((r) => { if (r.gateHint) add(r.gateHint); if (r.openLine) add(r.openLine); });
      D_.UNLOCKS.forEach((u) => add(u.line));
      songs.forEach((sg) => { if (sg.unlock) add(`You unlocked a new song: ${sg.title}!`, `You unlocked a new song: ${spell(sg.title)}!`); });
      add('Your friends are waiting! Tap the gate to see how many more you need.');
      // bare letter names and "we need" (spelling)
      Object.keys(D_.LETTER_WORDS).forEach((Lt) => { add(Lt, D_.LETTER_SPOKEN[Lt]); add(`We need the letter ${Lt}.`, `We need the letter ${D_.LETTER_SPOKEN[Lt]}.`); });
      // rhymes
      const seenWord = new Set(); const thatsA = (w) => { if (!seenWord.has(w)) { seenWord.add(w); add(`That's ${FL.Lines.article(w)} ${w}.`); } };
      D_.RHYMES.forEach(([t, te, rs]) => { add(`Which one rhymes with ${t}?`); thatsA(t); rs.forEach(([w]) => { add(`Yes! ${w} rhymes with ${t}!`); thatsA(w); }); });
      // spelling & reading
      add('Read the word, then tap its picture!'); D_.WORDS3.forEach(([w]) => { add(`Can you spell ${w}?`); add(`${w}! You spelled ${w}!`); add(`Yes! That says ${w}!`); thatsA(w); });
      // owl math
      for (let a = 1; a <= 9; a++) for (let b = 1; a + b <= 10; b++) { add(`What is ${a} plus ${b}?`); add(`Yes! ${a} plus ${b} is ${a + b}!`); }
      for (let a = 2; a <= 10; a++) for (let b = 1; b < a; b++) { add(`What is ${a} take away ${b}?`); add(`Yes! ${a} take away ${b} is ${a - b}!`); }
      // simon games
      Object.values(D_.SIMON).forEach((sm) => add(sm.intro)); add('Your turn!'); add('Yes! Now a longer one!'); add('Not quite. Listen again!'); add('Yes! You did it!');
      // clock
      add('What time is it?'); D_.CLOCK_HOURS.forEach((h) => { add(`Yes! It's ${h} o'clock!`); add(`Yes! It's half past ${h}!`); add(`That's ${h} o'clock.`); add(`That's half past ${h}.`); });
      // number line
      add('What number is missing?'); for (let n = 1; n <= D_.NUMBERLINE_MAX; n++) { add(`Yes! ${n}!`); if (n > D_.MAX_COUNT) add(`That's ${n}.`); }
      return L;
    },
    article(w) { return /^[aeiou]/i.test(w) ? 'an' : 'a'; },
  };
  FL.Lines.all = Lines.all;
})();
