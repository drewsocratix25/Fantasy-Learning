// Puppy Cottage: pure simulation (needs, dates, care chart, growth, tricks, speech lines). No canvas, audio, DOM or FL.Game.
(function () {
  const P = {};
  P.NAMES = [{ name: 'Buddy', pron: 0 }, { name: 'Max', pron: 0 }, { name: 'Biscuit', pron: 0 }, { name: 'Pepper', pron: 0 }, { name: 'Daisy', pron: 1 }, { name: 'Luna', pron: 1 }, { name: 'Cookie', pron: 1 }, { name: 'Rosie', pron: 1 }];
  P.PRON = [{ he: 'he', him: 'him', his: 'his', He: 'He', boy: 'boy' }, { he: 'she', him: 'her', his: 'her', He: 'She', boy: 'girl' }];
  P.STAGES = [{ id: 'newborn', name: 'Newborn', points: 0, age: 0, speed: 110 }, { id: 'puppy', name: 'Puppy', points: 5, age: 1, speed: 180 }, { id: 'bigkid', name: 'Big Kid', points: 15, age: 3, speed: 240 }, { id: 'grown', name: 'Grown-up', points: 30, age: 6, speed: 200 }];
  P.TRICKS = [{ id: 'sit', name: 'Sit', emoji: '🪑', stage: 1 }, { id: 'spin', name: 'Spin', emoji: '🌀', stage: 2 }, { id: 'five', name: 'High Five', emoji: '🖐️', stage: 2 }, { id: 'roll', name: 'Roll Over', emoji: '🔄', stage: 3 }];
  P.JOBS = ['fed', 'water', 'potty', 'clean', 'play'];          // chart order; icons 🍖 💧 🌳 🧻 🎾
  P.NEEDS = ['food', 'water', 'play', 'potty'];                 // icons 🍖 💧 🎾 🌳
  P.RATES = { food: 1.2, water: 1.5, play: 1.5, potty: 1.0 };   // per real minute while the scene is open
  const AWAY_RATE = 0.3, AWAY_CAP = 480, AWAY_FLOOR = 30, AWAY_POTTY = 70, LIVE_FLOOR = 10, DAY_CAP = 10, CROWN = 50, MAX_MESS = 2, HOLD = 95, DANCE = 90;
  P.CROWN = CROWN;                // care points for the Royal Pup crown (stage 3)
  P.FETCH_PER_STAMP = 3;          // ball returns in a round that earn the play stamp
  P.PARTY_EVERY = 10;             // stage 3: a puppy party every N care points
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const toDate = (now) => now == null ? new Date() : now.getTime ? now : new Date(now);
  const pad = (n) => (n < 10 ? '0' : '') + n;
  const emptyChart = (key) => ({ key, fed: false, water: false, potty: false, clean: false, play: false, done: false });
  // per-day counter {key, n} stored on the dog (pointsDay, accidentsToday); resets when the day key changes
  const dayCounter = (dog, k, tk) => { const c = dog[k] || (dog[k] = { key: '', n: 0 }); if (c.key !== tk) { c.key = tk; c.n = 0; } return c; };

  // ---- dates (LOCAL getters only; never toISOString) ----
  P.todayKey = (now) => { const d = toDate(now); return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); };
  P.isMorning = (now) => toDate(now).getHours() < 15;
  P.roundKey = (now) => P.todayKey(now) + (P.isMorning(now) ? '-am' : '-pm');
  const keyDate = (k) => { const p = String(k || '').split('-').map(Number); return new Date(p[0] || 1970, (p[1] || 1) - 1, p[2] || 1, 12); };
  P.dayDiff = (a, b) => Math.round((keyDate(b) - keyDate(a)) / 864e5);
  P.age = (dog, now) => dog.adopted && dog.born ? Math.max(0, P.dayDiff(dog.born, P.todayKey(now))) : 0;

  // ---- speech substitution: {name} {he} {him} {his} {He} {boy} {meal} {round}; `extra` = optional {token: value} map ----
  P.L = (dog, str, now, extra) => {
    const pr = P.PRON[dog.pron] || P.PRON[0], am = P.isMorning(now);
    return String(str).replace(/\{(\w+)\}/g, (m, k) => k === 'name' ? (dog.name || 'Puppy') : k === 'meal' ? (am ? 'breakfast' : 'dinner') : k === 'round' ? (am ? 'morning' : 'evening') : pr[k] !== undefined ? pr[k] : extra && extra[k] != null ? String(extra[k]) : m);
  };

  // ---- needs ----
  // after two accidents in a day the bladder holds at 95 ("{name} is holding it") so the room can never fill with mess (§6.3)
  P.pottyPaused = (dog, now) => { const a = dog.accidentsToday; return !!a && a.n >= 2 && a.key === P.todayKey(now); };
  P.accidentDue = (dog) => dog.needs.potty >= 100;
  P.tick = (dog, dt, now) => {
    const n = dog.needs, m = (dt || 0) / 60;
    for (const k of ['food', 'water', 'play']) n[k] = clamp(n[k] - P.RATES[k] * m, Math.min(LIVE_FLOOR, n[k]), 100);
    const paused = P.pottyPaused(dog, now), before = n.potty;
    n.potty = clamp(n.potty + P.RATES.potty * m, 0, 100);
    if (paused && n.potty > HOLD) n.potty = Math.max(HOLD, Math.min(before, 100));
    dog.dancing = P.needState(dog, 'potty') === 'needs';   // the potty dance is a live rule; saved so applyAway knows the dog was dancing when she left
    return n;
  };
  P.applyAway = (dog, now) => {
    const n = dog.needs, ms = toDate(now).getTime();
    const el = dog.lastSeen ? clamp((ms - dog.lastSeen) / 60000, 0, AWAY_CAP) : 0;   // negative (clock moved back) -> 0; cap 8 h
    let accident = false; dog.messes = dog.messes || [];
    if (el > 0) {
      const p0 = n.potty;
      n.food = Math.max(AWAY_FLOOR, n.food - P.RATES.food * AWAY_RATE * el);
      n.water = Math.max(AWAY_FLOOR, n.water - P.RATES.water * AWAY_RATE * el);
      n.play = Math.max(AWAY_FLOOR, n.play - P.RATES.play * AWAY_RATE * el);
      n.potty = Math.min(AWAY_POTTY, n.potty + P.RATES.potty * AWAY_RATE * el);
      if (el >= 90) n.potty = Math.max(n.potty, AWAY_POTTY);                       // first job on return is a walk
      // at most one waiting accident, and only if she left mid potty-dance (bladder >= 90) and it would have overflowed at the live rate (§3, §6.3)
      if (dog.dancing && !dog.messes.length && p0 >= DANCE && p0 + P.RATES.potty * el >= 100) { dog.messes.push({ x: 0.45, y: 0.85, inside: true }); n.potty = 0; dog.dancing = false; accident = true; }
    }
    dog.awayMin = el;
    return { elapsedMin: el, accident };
  };
  P.touch = (dog, now) => { dog.lastSeen = toDate(now).getTime(); return dog.lastSeen; };
  P.needState = (dog, need) => { const v = dog.needs[need]; if (need === 'potty') return v >= 70 ? 'needs' : v >= 50 ? 'low' : 'fine'; return v < 30 ? 'needs' : v < 60 ? 'low' : 'fine'; };
  const RANK = { fine: 0, low: 1, needs: 2 }, PRIORITY = ['potty', 'food', 'water', 'play'];
  P.worst = (dog) => { let w = null; for (const k of PRIORITY) { const s = P.needState(dog, k); if (s !== 'fine' && (!w || RANK[s] > RANK[w.state])) w = { need: k, state: s }; } return w; };
  P.mood = (dog) => { const w = P.worst(dog); return !w ? 'happy' : w.state === 'low' ? 'neutral' : 'pout'; };
  // what the puppy would need right now if she walked in (offline formula on a COPY; never mutates): {need, state} or null
  P.projectWorst = (dog, now) => { const c = JSON.parse(JSON.stringify(dog)); P.applyAway(c, now); return P.worst(c); };
  P.project = (dog, now) => { const w = P.projectWorst(dog, now); return w && w.state === 'needs' ? w.need : null; };

  // ---- care chart ----
  P.syncRound = (dog, now) => { const k = P.roundKey(now); if (dog.chart && dog.chart.key === k) return false; dog.chart = emptyChart(k); dog.fetchCount = 0; return true; };
  P.stamp = (dog, job, now) => {
    P.syncRound(dog, now); const c = dog.chart, left = () => P.JOBS.filter((j) => !c[j]).length;
    if (c[job]) return { already: true, remaining: left(), complete: false, grewPending: false };
    c[job] = true;
    const pd = dayCounter(dog, 'pointsDay', P.todayKey(now));
    if (pd.n < DAY_CAP) { pd.n++; dog.points = (dog.points || 0) + 1; }
    const remaining = left(), complete = remaining === 0 && !c.done;
    return { already: false, remaining, complete, grewPending: P.checkGrow(dog, now) };
  };
  P.completeRound = (dog, now) => {
    const tk = P.todayKey(now); dog.chart.done = true; dog.rounds = (dog.rounds || 0) + 1;
    dog.week = (dog.week || []).filter((k) => k !== tk); dog.week.push(tk); while (dog.week.length > 7) dog.week.shift();
    dog.lastRoundDay = tk;
  };

  // ---- growth ----
  P.canGrow = (dog, now) => { const s = P.STAGES[dog.stage + 1]; return dog.stage < 3 && !!s && dog.points >= s.points && P.age(dog, now) >= s.age; };
  P.checkGrow = (dog, now) => { if (P.canGrow(dog, now) && !dog.pendingGrow) { dog.pendingGrow = P.todayKey(now); return true; } return false; };
  P.shouldCeremony = (dog, now) => { const tk = P.todayKey(now); return (!!dog.pendingGrow && dog.pendingGrow !== tk) || (!dog.pendingGrow && P.canGrow(dog, now)); };
  P.grow = (dog) => { dog.stage = Math.min(3, dog.stage + 1); dog.pendingGrow = ''; return dog.stage; };
  P.boneFraction = (dog) => { const s = clamp(dog.stage, 0, 3), a = P.STAGES[s].points, b = s >= 3 ? CROWN : P.STAGES[s + 1].points; return clamp((dog.points - a) / (b - a), 0, 1); };
  // 'recent' = a round was completed today or yesterday (or, before the first round, adoption was recent / she was only away a short while)
  P.greetingKind = (dog, now) => {
    if (!dog.lastRoundDay) return P.age(dog, now) <= 1 || (dog.awayMin != null && dog.awayMin < 60) ? 'recent' : 'gap';
    const d = P.dayDiff(dog.lastRoundDay, P.todayKey(now)); return d >= 0 && d <= 1 ? 'recent' : 'gap';
  };
  P.partyDue = (dog) => { if (dog.stage < 3) return false; const due = Math.floor((dog.points || 0) / P.PARTY_EVERY); if (due > (dog.parties || 0)) { dog.parties = due; return true; } return false; };

  // ---- tricks ----
  P.trickState = (dog, id) => { const tr = P.TRICKS.find((t) => t.id === id), count = clamp((dog.tricks && dog.tricks[id]) || 0, 0, 3); return { unlocked: !!tr && dog.stage >= tr.stage, count, learned: count >= 3 }; };
  P.performTrick = (dog, id) => {
    const st = P.trickState(dog, id); if (!st.unlocked) return { count: st.count, learnedNow: false, wobbly: false };
    const count = Math.min(3, st.count + 1); dog.tricks = dog.tricks || {}; dog.tricks[id] = count;
    return { count, learnedNow: st.count < 3 && count >= 3, wobbly: st.count < 2 };
  };

  // ---- actions ----
  P.addPlay = (dog, n) => { dog.needs.play = Math.min(100, dog.needs.play + n); return dog.needs.play; };
  const bladderCap = (dog, now) => (P.pottyPaused(dog, now) ? HOLD : 100);
  P.feed = (dog, now) => { const n = dog.needs; if (n.food > 80) return false; n.food = 100; n.potty = Math.min(bladderCap(dog, now), n.potty + 30); return true; };
  P.water = (dog, now) => { const n = dog.needs; if (n.water > 80) return false; n.water = 100; n.potty = Math.min(bladderCap(dog, now), n.potty + 20); return true; };
  P.canPotty = (dog) => dog.needs.potty >= 35;
  P.pottyOutside = (dog, x, y) => { dog.needs.potty = 0; dog.dancing = false; dog.messes = dog.messes || []; if (dog.messes.length < MAX_MESS) dog.messes.push({ x, y, inside: false }); return true; };
  P.accident = (dog, x, y, now) => {
    dog.messes = dog.messes || []; if (dog.messes.length >= MAX_MESS) return false;
    dog.needs.potty = 0; dog.dancing = false; dog.messes.push({ x, y, inside: true }); dayCounter(dog, 'accidentsToday', P.todayKey(now)).n++; return true;
  };
  P.removeMess = (dog, i) => { if (dog.messes && i >= 0 && i < dog.messes.length) dog.messes.splice(i, 1); };
  P.dogEmoji = (dog) => (dog && dog.stage >= 3 ? '🐕' : '🐶');

  // ---- speech catalogue (princess voice; every line goes through P.L) ----
  P.LINES = {
    adopt1: "Welcome to the Puppy Cottage! Three little puppies need a home. Tap the one you'd like to take care of.",
    adopt2: "What should we call {him}? Tap a name and I'll say it.",
    nameCard: '{name}!',
    adoptDone: "Welcome home, {name}! {He} will follow you all around the kingdom. Taking care of a puppy is a big job: {he} needs food, water, potty walks, clean-ups, and playing. Let's do it together.",
    hiRecent: 'Hi {name}! Look at that tail!',
    hiGap: "{name} missed you so much! {He} waited for you and {he}'s ready to play.",
    needFood: '{name} is hungry. Drag the food to {his} bowl.',
    needWater: '{name} is thirsty. Pour some water in {his} bowl.',
    needPotty: '{name} needs to go potty! Tap the door.',
    needPlay: '{name} wants to play. Throw the ball!',
    fineFood: "{name}'s tummy is full right now.",
    fineWater: '{name} has plenty of water.',
    finePotty: "{name} doesn't need to go right now.",
    finePlay: '{name} is happy to play any time!',
    happy: '{name} is happy! You can throw the ball or teach {him} a trick.',
    busyBed: '{name} is busy right now. Try the bed in a moment.',
    alreadyWalking: '{name} is already going outside!',
    lowFood: "{name}'s tummy is getting a little empty.",
    lowWater: '{name} could use a drink.',
    lowPotty: '{name} is sniffing around. {He} might need to go outside soon.',
    lowPlay: '{name} is getting bored. Want to play?',
    tapBowl: 'Now tap the bowl.',
    tapThrow: 'Now tap where you want to throw it.',
    tapPoop: 'Now tap the poop.',
    tapBin: 'Now tap the bin.',
    tapBrush: 'Now tap {name} to brush {him}.',
    fullTummy: "{name}'s tummy is already full. Let's save that for later.",
    notThirsty: "{name} isn't thirsty right now.",
    useBag: 'Use the bag! Drag the bag onto the poop.',
    bagBin: 'The bag goes in the bin!',
    cleanFirst: "Let's clean up first, then we can play!",
    noPotty: "{name} doesn't need to go right now. Let's try after {his} {meal}!",
    throwAnywhere: 'Throw the ball anywhere and {name} will fetch it!',
    sleeping: 'Shh, {name} is sleeping.',
    fed: 'Yum! {name} loves {his} {meal}.',
    watered: 'Slurp, slurp. All better.',
    pottyDone: "Good job, {name}! You went potty outside. Now let's clean up.",
    bagged: 'Got it! Now put the bag in the bin.',
    cleaned: "All clean! That's what good puppy parents do.",
    throw1: 'Fetch! Go, {name}, go!',
    throw2: 'Get the ball!',
    fetched: 'Good {boy}! {He} brought it back!',
    pushBall: '{name} is too little to fetch, but {he} loves to push the ball!',
    clean: 'Squeaky clean!',
    loves: '{name} loves you.',
    accident: "Uh oh, {name} had an accident. That's okay, accidents happen! Let's clean it up.",
    holding: "{name} is holding it. Let's go outside!",
    alreadyFed: "You already fed {name} this {round}. Let's check {his} water.",
    alreadyWater: "{name} already had {his} water this {round}. Let's take {him} for a potty walk.",
    alreadyPotty: "{name} already went potty this {round}. Let's clean up and play!",
    alreadyClean: "You already cleaned up this {round}. Let's play with {name}!",
    alreadyPlay: 'You already played with {name} this {round}. {He} is a happy pup!',
    oneMore: "One more job and {name}'s chart is full!",
    roundDone: 'You did every job! {name} is so lucky to have you.',
    comeBack: "Come back after dinner for {name}'s evening jobs!",
    poster: "Today's {round} jobs:",
    bone1: "Keep taking care of {him} and {he}'ll grow big and strong.",
    bone2: '{name} is almost ready to grow!',
    bone3: '{name} is going to grow very soon!',
    growTonight: "Look at that, {name}'s tummy is full and {he}'s so happy. Tonight {he}'s going to grow!",
    growSleep: 'Shh, {name} is still sleeping. Tap the bed!',
    growUp: 'Look how big {name} got! You took such good care of {him}.',
    grownUp: "{name} is all grown up! And {he}'ll always be your best friend.",
    crown: '{name} is a Royal Pup now!',
    trickCmd_sit: '{name}, sit!', trickCmd_spin: '{name}, spin!', trickCmd_five: '{name}, high five!', trickCmd_roll: '{name}, roll over!',
    tryAgain: "Good try, {name}! Let's practise again!",
    goodDog: 'Good {boy}!',
    learned_sit: "{name} learned to sit! You're a great teacher.", learned_spin: "{name} learned to spin! You're a great teacher.",
    learned_five: "{name} learned high five! You're a great teacher.", learned_roll: "{name} learned to roll over! You're a great teacher.",
    lockedTrick: "{name} will learn {trick} when {he}'s bigger!",          // {trick} = P.L(dog, line, now, { trick: 'Spin' })
    tooLittle: "{name} is too little for tricks. Take good care of {him} and {he}'ll learn!",
    party: "It's a puppy party! All your friends came to see {name}'s tricks!",
    muddy: 'Uh oh, {name} got muddy in the yard! Give {him} a scrub with the brush.',
    brushed: '{name} loves being brushed.',
    nap: 'Shh, {name} is sleeping. Everybody needs rest.',
    sweet: 'Sweet dreams.',
    morning: 'Good morning, {name}!',
  };
  const JOB_WORDS = { fed: ['Fed', '{meal}'], water: ['Water', 'water'], potty: ['Potty walk', 'a potty walk'], clean: ['Clean-up', 'clean-up'], play: ['Play', 'play'] };   // [done form, to-do form]
  const listWords = (a) => a.length <= 1 ? a.join('') : a.slice(0, -1).join(', ') + ' and ' + a[a.length - 1];
  P.posterLine = (dog, now) => {
    const c = dog.chart && dog.chart.key === P.roundKey(now) ? dog.chart : {};
    const done = P.JOBS.filter((j) => c[j]), todo = P.JOBS.filter((j) => !c[j]);
    let s = P.LINES.poster + ' ' + done.map((j) => JOB_WORDS[j][0] + ', check!').join(' ');
    s += todo.length ? (done.length ? ' ' : '') + 'Still to do: ' + listWords(todo.map((j) => JOB_WORDS[j][1])) + '.' : ' Every job is done!';
    return P.L(dog, s, now);
  };
  P.boneLine = (dog, now) => {
    const f = P.boneFraction(dog), L = P.LINES;
    const line = dog.stage >= 3 ? (f >= 1 ? L.crown : L.bone1) : f >= 1 ? L.bone3 : f >= 0.5 ? L.bone2 : L.bone1;
    return P.L(dog, line, now);
  };

  window.FL = window.FL || {};
  FL.Puppy = P;
})();
