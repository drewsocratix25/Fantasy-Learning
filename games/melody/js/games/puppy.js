// Puppy Cottage: adopt a puppy, name it and raise it — feed, water, potty walks, clean-ups and fetch fill the daily care chart.
(function () {
  const A = FL.Art, UI = FL.UI, G = () => FL.Game;
  let P = FL.Puppy;
  const ITEMS = ['food', 'water', 'ball', 'brush', 'bag'];
  const ITEM_EMOJI = { food: '🥣', water: '💧', ball: '🎾', brush: '🧽', bag: '🧻' };
  const NEED_ICON = { food: '🍖', water: '💧', play: '🎾', potty: '🌳' };
  const NEED_COLOR = { food: '#fb923c', water: '#60a5fa', potty: '#a3e635', play: '#fde047' };
  const JOB_ICON = { fed: '🍖', water: '💧', potty: '🌳', clean: '🧻', play: '🎾' };
  const NEED_LINE = { food: 'needFood', water: 'needWater', potty: 'needPotty', play: 'needPlay' };
  const LOW_LINE = { food: 'lowFood', water: 'lowWater', potty: 'lowPotty', play: 'lowPlay' };
  const ALREADY = { fed: 'alreadyFed', water: 'alreadyWater', potty: 'alreadyPotty', clean: 'alreadyClean', play: 'alreadyPlay' };
  const JOB_ITEM = { fed: 'food', water: 'water', potty: 'door', clean: 'bag', play: 'ball' };
  const NEED_ITEM = { food: 'food', water: 'water', potty: 'door', play: 'ball' };
  const REDIRECT = { food: 'needFood', water: 'needWater', ball: 'throwAnywhere', brush: 'tapBrush', bag: 'useBag' };
  const TAP_HINT = { food: 'tapBowl', water: 'tapBowl', ball: 'tapThrow', brush: 'tapBrush', bag: 'tapPoop' };
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const rnd = (a, b) => a + Math.random() * (b - a);
  const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
  const inRect = (r, x, y, pad) => { pad = pad || 0; return x >= r.x - pad && x <= r.x + r.w + pad && y >= r.y - pad && y <= r.y + r.h + pad; };
  const DEFAULT_DOG = () => ({ adopted: false, name: '', pron: 0, coat: 0, born: '', stage: 0, points: 0, pendingGrow: '', rounds: 0, pointsDay: { key: '', n: 0 }, needs: { food: 70, water: 70, play: 60, potty: 20 }, lastSeen: 0, dancing: false, mud: 0, messes: [], chart: { key: '', fed: false, water: false, potty: false, clean: false, play: false, done: false }, fetchCount: 0, lastRoundDay: '', week: [], tricks: { sit: 0, spin: 0, five: 0, roll: 0 }, assist: { bag: 0, ball: 0 }, tutorialDone: false, crown: false, parties: 0, visits: 0, accidentsToday: { key: '', n: 0 } });

  // ---------- layout (§9) ----------
  let L = null, tricksBtn = null;
  function layout() {
    const g = G(), W = g.W, H = g.H, S = Math.round(W * 0.62);
    const poster = { x: 240, y: 118, w: Math.min(560, S - 300), h: 170 };
    const bed = { x: S - 604, y: 608, w: 200, h: 90 };
    const matRect = { x: S - 400, y: 625, w: 300, h: 105 };
    L = {
      W, H, S, poster, bed, matRect,
      win: { x: bed.x, y: 320, w: 200, h: 140 },
      bowls: { food: { x: matRect.x + 75, y: matRect.y + 55 }, water: { x: matRect.x + 225, y: matRect.y + 55 } },
      door: { x: S - 90, y: 280, w: 180, h: 360 },
      doorway: { x: S - 40, y: 300, w: 40, h: 260 },
      doorSpot: { x: S - 130, y: 640 },
      bin: { x: S + 120, y: 600, r: 100 },
      patch: { x: S + Math.round(0.45 * (W - S)), y: 720, rx: 110, ry: 40 },
      items: ITEMS.map((item, i) => ({ item, x: Math.round(S / 2 + (i - 2) * 130), y: 800, w: 110, h: 90 })),
      needIcons: P.NEEDS.map((need, i) => ({ need, x: 84, y: 244 + i * 104, r: 44 })),
      tricksBtn: { x: W - 110, y: 790, w: 90, h: 90 },
      princess: { x: S + 80, y: 850 },
      fence: { x0: S + 40, x1: W, y: 470 },
      perch: { x: S + 260, y: 500 },
      tree: { x: W - 120, y: 560 },
      idle: { x: Math.round(S / 2 + 60), y: 745 },
      room: { x0: 200, x1: S - 90, y0: 600, y1: 745 },
      yard: { x0: S + 60, x1: W - 80, y0: 600, y1: 800 },
    };
    tricksBtn = new UI.Button({ x: W - 110, y: 790, w: 90, h: 90, emoji: '🦴', color: '#c084fc', round: true, emojiSize: 50, onTap: toggleArc });
    if (adopt) layoutAdopt();
    return L;
  }
  const itemBox = (item) => L.items.find((b) => b.item === item);
  const boxHit = (b, x, y) => Math.abs(x - b.x) <= b.w / 2 && Math.abs(y - b.y) <= b.h / 2;

  // ---------- state ----------
  let dog = null, t = 0, phase = 'play', tutorial = false;
  const d = { x: 0, y: 0, facing: 1, pose: 'idle', poseT: 0, walking: false, wag: 0, rot: 0, alpha: 1, seed: 0, busy: 0, target: null, carry: false, roamT: 3, zoomT: 25, sniffT: 8, tumbleT: 12, trickT: 40, outsideT: 0, sitDoor: false, mood: 'happy', spin: 0, spinT: 0, pawT: 0, pout: 0, onWalk: false, accT: 0, holdSaid: false };
  let held = null, lifted = null, bag = null, ball = null, fetch = null, spring = null;
  let doorAngle = 0, doorOpen = 0, binLid = 0, foodLevel = 0, waterLevel = 0;
  let kibble = [], drops = [], stamps = [], zzz = [], glow = {}, timers = [];
  let treat = null, arc = null, trick = null, nap = null, grow = null, adopt = null, party = null;
  const speech = { last: -99, idleT: 0 };
  let needStates = {}, petCount = 0, petT = 0, petMinute = { t: 0, n: 0 }, lastBark = -99, lastSparkle = -99, lastBrushLine = -99;
  let saveAcc = 0, roundAcc = 0, wave = 0, resultsOpen = false, afterResults = null, stroke = { x: 0, y: 0, dist: 0 };
  function resetState() {
    held = null; lifted = null; bag = { stage: 'empty', x: 0, y: 0, ground: false, t: -99 }; ball = { state: 'box', x: 0, y: 0, vx: 0, vy: 0, gy: 0, bounced: false, t: 0 }; fetch = { state: 'none', t: 0 }; spring = null;
    doorAngle = 0; doorOpen = 0; binLid = 0; foodLevel = 0; waterLevel = 0; kibble = []; drops = []; stamps = []; zzz = []; glow = {}; timers = [];
    treat = null; arc = null; trick = null; nap = null; grow = null; adopt = null; party = null;
    speech.last = -99; speech.idleT = 0; needStates = {}; petCount = 0; petT = 0; petMinute = { t: 0, n: 0 }; lastBark = -99; lastSparkle = -99; lastBrushLine = -99;
    saveAcc = 0; roundAcc = 0; wave = 0; resultsOpen = false; afterResults = null; stroke = { x: 0, y: 0, dist: 0 };
    Object.assign(d, { facing: 1, pose: 'idle', poseT: 0, walking: false, wag: 0, rot: 0, alpha: 1, seed: Math.random() * 10, busy: 0, target: null, carry: false, roamT: 3, zoomT: rnd(20, 35), sniffT: 8, tumbleT: rnd(12, 25), trickT: 40, outsideT: 0, sitDoor: false, mood: 'happy', spin: 0, spinT: 0, pawT: 0, pout: 0, onWalk: false, accT: 0, holdSaid: false });
  }
  const after = (s, fn) => timers.push({ t: s, fn });
  const save = () => { P.touch(dog); FL.Save.save(); };
  const inside = () => d.x < L.S;
  const look = () => ({ coat: dog.coat, stage: dog.stage, mood: d.pout > 0 ? 'pout' : d.mood, mud: dog.mud || 0, bandana: dog.stage >= 3 ? G().look.dress : null, crown: !!dog.crown });
  const metrics = () => A.dogMetrics(look(), 1);
  const dogHit = (x, y) => { const m = metrics(), rx = Math.max(60, m.rx), ry = Math.max(70, m.ry); const cx = d.x, cy = d.y + m.cy; return ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 <= 1; };
  const hearts = (n, x, y) => G().fx.burst(x != null ? x : d.x, y != null ? y : d.y + metrics().top, { count: n || 3, type: 'heart', colors: ['#f472b6', '#fb7185', '#f9a8d4'], speed: 120, life: 1.1, size: 16, gravity: -60 });
  const messPos = (m) => ({ x: m.x * L.W, y: m.inside ? Math.min(740, m.y * L.H) : m.y * L.H });
  const isBusy = () => !!(d.target || d.busy > 0 || d.onWalk || fetch.state !== 'none' || nap || trick || party);

  // ---------- speech hygiene (§9): 2 = action feedback, 1 = cue (no interrupt), 0 = idle reminder ----------
  function line(id, extra) { let s = P.LINES[id] != null ? P.LINES[id] : id; if (extra) for (const k in extra) s = s.split('{' + k + '}').join(extra[k]); return P.L(dog, s); }
  function speak(id, pri, extra) {
    if (pri == null) pri = 2;
    if (pri === 0 && (t - speech.last < 6 || held || trick || nap || UI.overlayActive())) return null;
    const s = line(id, extra); FL.Audio.say(s, { interrupt: pri >= 2 }); speech.last = t; speech.idleT = 0; return s;
  }
  function sayRaw(s, pri) { FL.Audio.say(s, { interrupt: pri == null || pri >= 2 }); speech.last = t; speech.idleT = 0; }
  const tutorialStep = () => (tutorial ? P.JOBS.find((j) => !dog.chart[j]) || null : null);
  function topNeedId() {
    const ts = tutorialStep();
    if (ts) return ts === 'clean' ? (dog.messes.length ? 'useBag' : 'needPotty') : NEED_LINE[{ fed: 'food', water: 'water', potty: 'potty', play: 'play' }[ts]];
    const w = P.worst(dog); return w ? NEED_LINE[w.need] : 'happy';
  }
  function topNeed(pri) { speak(topNeedId(), pri == null ? 1 : pri); }

  // ---------- dog motion ----------
  function setPose(pose, dur) { d.pose = pose; d.poseT = 0; d.busy = dur || 0; }
  function goTo(x, y, cb, speed) {
    x = clamp(x, L.room.x0, L.yard.x1); y = clamp(y, 600, 830); d.sitDoor = false; const cross = (d.x < L.S) !== (x < L.S);
    if (cross) { doorOpen = 1; d.target = { x: L.S, y: 620, speed, cb: () => { d.target = { x, y, speed, cb: () => { doorOpen = 0; if (cb) cb(); } }; } }; }
    else d.target = { x, y, speed, cb };
  }
  function roamSpot() { const r = inside() ? L.room : L.yard; return { x: rnd(r.x0, r.x1), y: rnd(r.y0, r.y1) }; }
  function idleAt() { d.pose = dog.stage >= 3 ? 'sit' : 'idle'; d.poseT = 0; }
  function placeDog() {
    d.x = L.idle.x; d.y = L.idle.y; d.facing = -1; d.mood = P.mood(dog); d.pose = 'idle';
    P.NEEDS.forEach((n) => { needStates[n] = P.needState(dog, n); });
  }
  const dogSpeed = () => P.STAGES[dog.stage].speed;

  // ---------- adoption (§2) ----------
  function startAdopt() {
    phase = 'adopt'; adopt = { step: 1, pick: -1, name: -1, pups: [0, 1, 2].map((i) => ({ seed: i * 2.1, pose: 'idle', poseT: 0, alpha: 1, hop: 0 })) };
    layoutAdopt(); after(0.6, () => speak('adopt1'));
  }
  function layoutAdopt() {
    const W = L.W; adopt.basket = { x: W / 2, y: 660, w: 640, h: 160 };
    adopt.pupPos = [-200, 0, 200].map((o) => ({ x: W / 2 + o, y: 645 }));
    adopt.names = P.NAMES.map((n, i) => new UI.Button({ x: W / 2 - 430 + (i % 4) * 220, y: i < 4 ? 190 : 306, w: 200, h: 96, label: n.name, emoji: '🦴', color: adopt.name === i ? '#fde047' : '#f9a8d4', size: 30, visible: adopt.step === 2, onTap: () => pickName(i) }));
    adopt.confirm = new UI.Button({ x: W / 2 - 160, y: 430, w: 320, h: 92, label: "That's it!", emoji: '✅', color: '#4ade80', size: 34, pulse: true, visible: adopt.step === 2 && adopt.name >= 0, onTap: confirmAdopt });
  }
  function pickPup(i) {
    if (adopt.step !== 1) return; adopt.pick = i; dog.coat = i; FL.Audio.sfx.bark(0);
    adopt.pups.forEach((p, j) => { if (j === i) { p.pose = 'hop'; p.poseT = 0; } else { p.pose = 'sleep'; p.poseT = 0; p.alpha = 0.25; } });
    hearts(6, adopt.pupPos[i].x, adopt.pupPos[i].y - 90);
    after(0.8, () => { adopt.step = 2; adopt.names.forEach((b) => { b.visible = true; }); speak('adopt2'); });
  }
  function pickName(i) {
    const n = P.NAMES[i]; adopt.name = i; dog.name = n.name; dog.pron = n.pron;
    adopt.names.forEach((b, j) => { b.color = j === i ? '#fde047' : '#f9a8d4'; }); adopt.confirm.visible = true;
    const p = adopt.pups[adopt.pick]; p.pose = 'hop'; p.poseT = 0; sayRaw(n.name + '!');
  }
  function confirmAdopt() {
    dog.adopted = true; dog.born = P.todayKey(); dog.needs = { food: 70, water: 70, play: 60, potty: 20 }; dog.visits = 1; dog.messes = []; dog.tutorialDone = false;
    P.syncRound(dog); FL.Save.unlock('🐶'); save();
    const g = G(); g.fx.burst(g.W / 2, 400, { count: 80, type: 'confetti', speed: 600, life: 2, size: 14, gravity: 500 }); FL.Audio.sfx.fanfare();
    UI.toast('New friend: ' + dog.name + '!', '🐶', '#db2777'); speak('adoptDone');
    adopt = null; phase = 'play'; tutorial = true; placeDog(); setPose('hop', 0.5); d.zoomT = 40;
    after(3, () => speak('needFood', 1));
  }

  // ---------- greeting + grow ceremony (§4, §7.5) ----------
  function greet(away) {
    const kind = P.greetingKind(dog);
    if (kind === 'recent') {
      const far = { x: clamp(d.x - 320, L.room.x0, L.room.x1), y: d.y };
      goTo(far.x, far.y, () => { goTo(L.idle.x, L.idle.y, () => { setPose('hop', 0.5); FL.Audio.sfx.bark(dog.stage); after(0.3, () => FL.Audio.sfx.bark(dog.stage)); if (dog.stage >= 1) after(1.2, freeTrick); }, 380); }, 380);
      speak('hiRecent');
    } else { setPose('dance', 1.6); speak('hiGap'); }
    after(2.5, () => topNeed(1));
    if (away && away.accident) after(5, () => speak('accident', 1));
  }
  function startGrow() {
    phase = 'grow'; grow = { lift: 0, done: false, snoreT: 0 };
    d.x = L.bed.x + L.bed.w / 2; d.y = L.bed.y + L.bed.h - 14; d.facing = 1; setPose('sleep', 999);
    after(0.8, () => speak('growSleep'));
  }
  function ceremony() {
    if (grow.done) return; grow.done = true; const g = G();
    g.fx.burst(d.x, d.y - 60, { count: 60, type: 'star', colors: ['#fde047', '#fff', '#f9a8d4', '#c084fc'], speed: 420, life: 1.4, size: 14, gravity: 200 }); FL.Audio.sfx.fanfare();
    const stage = P.grow(dog);
    if (stage >= 3) { const u = FL.Save.data.unlocked; const i = u.indexOf('🐶'); if (i >= 0) u[i] = '🐕'; else if (!u.includes('🐕')) u.push('🐕'); if (FL.Save.data.companion === '🐶') FL.Save.data.companion = '🐕'; dog.parties = Math.floor(dog.points / 10); }
    save();
    after(0.5, () => { setPose('stretch', 1); speak('growUp'); });
    after(1.5, () => { setPose('hop', 0.5); goTo(L.idle.x, L.idle.y, () => idleAt()); });
    after(2.6, () => { phase = 'play'; grow = null; if (stage >= 3) speak('grownUp', 1); showResults({ title: line('{name} grew!'), subtitle: P.STAGES[stage].name, stars: 3, emoji: '🎂' }, () => topNeed(1)); });
  }
  function showResults(o, then) {
    resultsOpen = true; afterResults = then || null; arc = null; treat = null;
    UI.showResults(Object.assign({ againLabel: 'Stay', againEmoji: '🐾', again: () => {}, home: () => G().go('world', { at: 'puppy' }) }, o));
  }

  // ---------- chart glue (§7) ----------
  function stamp(job) {
    const r = P.stamp(dog, job);
    if (r.already) return r;
    FL.Audio.sfx.sparkle(); stamps.push({ job, t: 0 }); wave = 1.5;
    if (r.remaining === 1) after(2.2, () => speak('oneMore', 1));
    if (r.complete) { P.completeRound(dog); after(1.2, completeRound); }
    if (r.grewPending) after(r.complete ? 9 : 3, () => speak('growTonight', 1));
    if (tutorial && r.remaining === 0) { tutorial = false; dog.tutorialDone = true; }
    if (dog.stage >= 3 && dog.points >= 50 && !dog.crown) { dog.crown = true; after(4, () => { UI.toast(dog.name + ' is a Royal Pup!', '👑', '#b45309'); FL.Audio.sfx.unlock(); speak('crown', 1); hearts(8); }); }
    if (dog.stage >= 3 && Math.floor(dog.points / 10) > (dog.parties || 0)) { dog.parties = Math.floor(dog.points / 10); after(r.complete ? 14 : 3, startParty); }
    save(); return r;
  }
  function completeRound() {
    FL.Audio.sfx.fanfare(); setPose('dance', 2); wave = 2.5; speak('roundDone');
    const g = G(); g.fx.burst(d.x, d.y - 80, { count: 40, type: 'star', colors: ['#fde047', '#fff', '#f9a8d4'], speed: 380, life: 1.2, size: 12 });
    after(2.6, () => showResults({ title: 'Care round complete!', subtitle: line('{name} is happy and healthy'), stars: 3, emoji: '🐾' }, () => { if (P.isMorning()) speak('comeBack', 1); }));
  }
  function startParty() {
    if (party || phase !== 'play') return; if (UI.overlayActive() || isBusy()) { after(3, startParty); return; }
    const friends = FL.Save.data.unlocked.filter((e) => e !== '🐶' && e !== '🐕'); const learned = P.TRICKS.filter((tr) => P.trickState(dog, tr.id).learned).map((tr) => tr.id);
    party = { t: 0, friends, tricks: learned, i: 0, next: 1.5, balloons: [0, 1, 2, 3, 4].map((i) => ({ x: L.S + 80 + i * ((L.W - L.S - 160) / 4), c: ['#f472b6', '#fde047', '#60a5fa', '#4ade80', '#c084fc'][i], seed: i })) };
    speak('party'); FL.Audio.sfx.unlock(); arc = null;
    goTo(L.S + 0.35 * (L.W - L.S), 700, () => { d.facing = -1; });
  }

  // ---------- feed / water (§5.1, §5.2) ----------
  function feed() {
    if (!P.feed(dog)) { speak('fullTummy'); setPose('sniff', 0.8); after(0.8, () => { const sp = roamSpot(); goTo(sp.x, sp.y); }); return false; }
    const b = L.bowls.food; for (let i = 0; i < 14; i++) kibble.push({ x: b.x + rnd(-26, 26), y: b.y - 150 - rnd(0, 60), vy: rnd(0, 80), ty: b.y - 6 - rnd(0, 10), r: rnd(4, 7) });
    after(0.6, () => { foodLevel = 1; });
    cancelFetch(); d.onWalk = false;
    goTo(b.x - 46, b.y + 12, () => { d.facing = 1; setPose('eat', 3); [0, 0.8, 1.6].forEach((s) => after(s, () => FL.Audio.sfx.munch())); after(3, () => { idleAt(); d.mood = P.mood(dog); }); });
    const r = stamp('fed'); speak(r.already ? ALREADY.fed : 'fed'); save(); return true;
  }
  function water() {
    if (!P.water(dog)) { speak('notThirsty'); setPose('sniff', 0.8); return false; }
    const b = L.bowls.water; waterLevel = 1; FL.Audio.sfx.slurp(); cancelFetch(); d.onWalk = false;
    goTo(b.x - 46, b.y + 12, () => { d.facing = 1; setPose('drink', 2.5); after(1.2, () => FL.Audio.sfx.slurp()); after(2.5, () => { idleAt(); d.mood = P.mood(dog); }); });
    const r = stamp('water'); speak(r.already ? ALREADY.water : 'watered'); save(); return true;
  }

  // ---------- potty walk (§6.2) ----------
  function walk() {
    if (d.onWalk || phase !== 'play') return;
    if (nap) wake();
    cancelFetch(); d.onWalk = true; d.sitDoor = false; d.spin = 0; doorOpen = 1; FL.Audio.sfx.whoosh(); glow.door = 0;
    const px = L.patch.x - 30, py = L.patch.y + 12;
    goTo(px, py, () => {
      d.facing = 1; setPose('sniff', 1);
      after(1, () => {
        if (P.canPotty(dog)) {
          setPose('squat', 1.5);
          after(1.5, () => {
            P.pottyOutside(dog, (d.x - 52 * d.facing) / L.W, (d.y + 2) / L.H); FL.Audio.sfx.plop(); d.mood = P.mood(dog);
            setPose('kick', 0.6); after(0.3, () => FL.Audio.sfx.bark(dog.stage));
            const r = stamp('potty'); speak(r.already ? ALREADY.potty : 'pottyDone'); d.onWalk = false; d.outsideT = 20; save();
            after(0.7, () => goTo(clamp(d.x + 80 * d.facing, L.yard.x0, L.yard.x1), d.y, () => idleAt()));
          });
        } else { speak('noPotty'); after(0.6, () => { d.onWalk = false; goHome(); }); }
      });
    });
  }
  function goHome() { if (!inside()) goTo(L.idle.x, L.idle.y, () => { idleAt(); d.facing = -1; }); }

  // ---------- clean-up (§6.4) ----------
  function nearMess(x, y, r) { let best = -1, bd = r || 90; dog.messes.forEach((m, i) => { const p = messPos(m); const dd = Math.hypot(p.x - x, p.y - y); if (dd < bd) { bd = dd; best = i; } }); return best; }
  function bagMess(i) {
    const p = messPos(dog.messes[i]); P.removeMess(dog, i); bag.stage = 'full'; bag.x = p.x; bag.y = p.y; bag.ground = false; bag.t = t; FL.Audio.sfx.pop();
    G().fx.burst(p.x, p.y, { count: 10, colors: ['#fff', '#fde68a'], speed: 160, life: 0.5, size: 8 }); speak('bagged'); if (!dog.messes.length) d.mood = P.mood(dog); save();
  }
  function binBag() {
    bag.stage = 'empty'; bag.ground = false; binLid = 1; FL.Audio.sfx.pop(); FL.Audio.sfx.correct();
    G().fx.burst(L.bin.x, L.bin.y - 60, { count: 20, type: 'confetti', speed: 320, life: 1, size: 12 });
    const r = stamp('clean'); speak(r.already ? ALREADY.clean : 'cleaned'); save();
  }
  const nearBin = (x, y) => Math.hypot(x - L.bin.x, y - L.bin.y) < L.bin.r;

  // ---------- ball + fetch (§5.5) ----------
  function throwBall(fx, fy, tx, ty) {
    tx = clamp(tx, 200, L.W - 80); ty = clamp(ty, 600, 790); if (tx > L.S - 60 && tx < L.S + 60) tx = tx < L.S ? L.S - 60 : L.S + 60;
    const T = 0.5, g = 1400; tx -= Math.sign(tx - fx) * Math.min(70, Math.abs(tx - fx) * 0.3);   // the bounce + roll carry it the rest of the way
    ball = { state: 'air', x: fx, y: fy, vx: (tx - fx) / T, vy: (ty - fy) / T - 0.5 * g * T, gy: ty, bounced: false, t: 0, g };
    fetch = { state: 'thrown', t: 0 }; speak(pick(['throw1', 'throw2'])); FL.Audio.sfx.whoosh(); d.wag = 1; if (d.pose === 'sit') d.pose = 'idle';
  }
  function ballLanded() {
    fetch.state = 'landed';
    if (dog.messes.length) { speak('cleanFirst'); after(2, () => { if (fetch.state === 'landed') cancelFetch(); }); return; }
    if (nap) wake();
    fetch.state = 'toBall'; goTo(ball.x - 30 * (ball.x < d.x ? -1 : 1), ball.y, () => { if (fetch.state === 'toBall') reachBall(); }, dog.stage === 0 ? 110 : Math.max(dogSpeed(), 200));
  }
  function reachBall() {
    d.facing = ball.x >= d.x ? 1 : -1;
    if (ball.x > L.S && !dog.mud && Math.random() < 0.3) { dog.mud = Math.floor(rnd(3, 7)); FL.Audio.sfx.plop(); after(2.5, () => speak('muddy', 1)); }
    if (dog.stage === 0) {
      setPose('sniff', 0.6);
      after(0.6, () => { const dir = L.princess.x > ball.x ? 1 : -1; ball.state = 'ground'; ball.vx = dir * 90; ball.roll = 0.35; P.addPlay(dog, 10); fetchDone('pushBall'); });
      return;
    }
    d.carry = true; ball.state = 'mouth'; setPose('idle', 0.2);
    const px = L.princess.x - 70, py = L.princess.y - 20;
    if (dog.stage === 1 && !fetch.dropped) { fetch.dropped = true; fetch.state = 'return'; goTo((d.x + px) / 2, (d.y + py) / 2, () => { d.carry = false; ball.state = 'ground'; ball.x = d.x + 24 * d.facing; ball.y = d.y; ball.vx = 0; setPose('idle', 0.5); after(0.6, () => { fetch.state = 'toBall'; goTo(ball.x - 20, ball.y, () => { if (fetch.state === 'toBall') reachBall(); }); }); }); return; }
    fetch.state = 'return'; goTo(px, py, () => { d.carry = false; ball.state = 'ground'; ball.x = d.x + 30 * d.facing; ball.y = d.y + 4; ball.vx = 0; P.addPlay(dog, 25); fetchDone('fetched'); });
  }
  function fetchDone(lineId) {
    FL.Audio.sfx.bark(dog.stage); dog.fetchCount = (dog.fetchCount || 0) + 1; d.wag = 1; d.mood = P.mood(dog); fetch = { state: 'none', t: 0 }; speak(lineId);
    if (dog.fetchCount >= 3) { const r = stamp('play'); if (r.already && dog.fetchCount === 3) after(2, () => speak(ALREADY.play, 1)); }
    setPose('idle', 1); after(1, () => { if (ball.state === 'ground') ball.state = 'box'; }); save();
  }
  function cancelFetch() { if (fetch.state === 'none' && ball.state === 'box') return; d.carry = false; fetch = { state: 'none', t: 0 }; if (ball.state !== 'box' && held && held.item === 'ball') return; ball.state = 'box'; }

  // ---------- pet / brush / nap (§5.6, §5.7, §5.9) ----------
  function pet() {
    petT = 2; hearts(3); if (t - lastBark > 1.5) { lastBark = t; FL.Audio.sfx.bark(dog.stage); }
    if (t - petMinute.t > 60) petMinute = { t, n: 0 }; if (petMinute.n < 3) { petMinute.n++; P.addPlay(dog, 5); d.mood = P.mood(dog); }
    petCount++; if (petCount % 3 === 0) speak('loves');
  }
  function scrub() {
    if (dog.mud > 0) {
      dog.mud--; for (let i = 0; i < 4; i++) drops.push({ x: d.x + rnd(-30, 30), y: d.y + metrics().cy + rnd(-20, 20), vy: -rnd(30, 80), r: rnd(4, 8), life: 0.7, kind: 'bubble' });
      if (t - lastSparkle > 0.17) { lastSparkle = t; FL.Audio.sfx.sparkle(); }
      if (dog.mud === 0) { setPose('shake', 0.6); for (let i = 0; i < 8; i++) drops.push({ x: d.x + rnd(-40, 40), y: d.y + metrics().cy, vy: -rnd(60, 160), vx: rnd(-80, 80), r: rnd(3, 5), life: 0.6, kind: 'drop' }); speak('clean'); P.addPlay(dog, 5); d.mood = P.mood(dog); save(); }
    } else if (t - lastBrushLine > 3) { lastBrushLine = t; hearts(2); speak('brushed', 1); d.pose = 'idle'; }
  }
  function napStart() {
    if (isBusy()) { if (nap) { hearts(1); speak('sweet', 1); } return; }
    goTo(L.bed.x + L.bed.w / 2, L.bed.y + L.bed.h - 14, () => { nap = { t: 8, snoreT: 0 }; setPose('sleep', 999); d.facing = 1; speak('nap'); });
  }
  function wake() { if (!nap) return; nap = null; setPose('stretch', 1); speak('morning'); after(1, () => { idleAt(); d.roamT = 1; }); }

  // ---------- tricks + treat (§8) ----------
  function toggleArc() {
    if (phase !== 'play') return;
    if (dog.stage === 0) { speak('tooLittle'); setPose('hop', 0.5); return; }
    if (arc) { arc = null; return; }
    if (nap) wake();
    arc = P.TRICKS.map((tr, i) => { const st = P.trickState(dog, tr.id); return new UI.Button({ x: 0, y: 0, w: 96, h: 96, emoji: st.unlocked ? tr.emoji : '🔒', color: st.unlocked ? (st.learned ? '#fde047' : '#c084fc') : '#cbd5e1', round: true, emojiSize: 48, angle: (-60 + i * 40) * Math.PI / 180, onTap: () => { if (!st.unlocked) { speak('lockedTrick', 2, { trick: tr.name }); return; } doTrick(tr.id); } }); });
    placeArc();
  }
  function placeArc() { if (!arc) return; const m = metrics(); const cx = clamp(d.x, 300, L.W - 300), cy = Math.max(330, d.y + m.cy); arc.forEach((b) => { b.x = cx + Math.sin(b.angle) * 150 - 48; b.y = cy - Math.cos(b.angle) * 150 - 48; }); }
  function doTrick(id) {
    arc = null; treat = null; speak('trickCmd_' + id); if (nap) wake(); cancelFetch(); d.target = null;
    after(0.8, () => {
      const r = P.performTrick(dog, id); const tr = P.TRICKS.find((x) => x.id === id);
      trick = { id, t: 0, wobbly: r.wobbly }; setPose(id, 2);
      if (!r.wobbly) { FL.Audio.sfx.correct(); G().fx.burst(d.x, d.y - 60, { count: 12, type: 'confetti', speed: 300, life: 1, size: 12 }); }
      after(2, () => {
        trick = null; idleAt(); treat = { until: t + 4 }; save();
        if (r.learnedNow) { FL.Save.addStars(1); UI.toast(dog.name + ' learned ' + tr.name + '!', '⭐'); speak('learned_' + id); }
        else if (r.wobbly) speak('tryAgain');
      });
    });
  }
  function freeTrick() {
    if (isBusy() || arc) return; const learned = P.TRICKS.filter((tr) => P.trickState(dog, tr.id).learned); if (!learned.length) return;
    const id = pick(learned).id; trick = { id, t: 0, wobbly: false, free: true }; setPose(id, 2); after(2, () => { trick = null; idleAt(); });
  }
  function giveTreat() {
    treat = null; FL.Audio.sfx.munch(); setPose('eat', 0.8); hearts(3); P.addPlay(dog, 10); d.mood = P.mood(dog); speak('goodDog'); after(0.8, idleAt); save();
  }

  // ---------- input (§5.0) ----------
  function liftItem(item, p, extra) { held = Object.assign({ item, id: p.id, x: p.x, y: p.y, sx: p.x, sy: p.y, moved: false }, extra || {}); stroke = { x: p.x, y: p.y, dist: 0 }; }
  function down(p) {
    if (phase === 'adopt') {
      if (adopt.step === 2 && UI.pressDown([adopt.confirm].concat(adopt.names), p)) return;
      if (adopt.step === 1) adopt.pupPos.forEach((pp, i) => { if (Math.hypot(p.x - pp.x, p.y - (pp.y - 60)) < 110) pickPup(i); });
      return;
    }
    if (phase === 'grow') { if (inRect(L.bed, p.x, p.y, 40)) ceremony(); return; }
    if (party) return;
    if (arc) { if (UI.pressDown(arc, p)) return; arc = null; if (tricksBtn.contains(p.x, p.y)) { p.consumed = true; return; } }
    if (treat && p.x >= treat.x && p.x <= treat.x + 84 && p.y >= treat.y && p.y <= treat.y + 84) { giveTreat(); return; }
    for (const b of L.items) { if (boxHit(b, p.x, p.y)) { if (b.item === 'bag' && bag.stage === 'full' && !bag.ground) { liftItem('bag', p); return; } if (b.item === 'bag' && bag.stage === 'full') { speak('bagBin'); return; } if (b.item === 'ball' && ball.state !== 'box') { speak('throwAnywhere'); return; } liftItem(b.item, p); return; } }
    if (bag.stage === 'full' && bag.ground && Math.hypot(p.x - bag.x, p.y - bag.y) < 60) { liftItem('bag', p); bag.ground = false; return; }
    if (nap && !inRect(L.bed, p.x, p.y, 20)) { wake(); }
    for (const n of L.needIcons) { if (Math.hypot(p.x - n.x, p.y - n.y) < n.r + 6) { FL.Audio.sfx.tap(); speak(NEED_LINE[n.need]); glow[NEED_ITEM[n.need]] = t + 3; p.consumed = true; return; } }
    if (inRect(L.poster, p.x, p.y)) { FL.Audio.sfx.tap(); sayRaw(P.posterLine(dog)); FL.Audio.say(P.boneLine(dog), { interrupt: false }); p.consumed = true; return; }
    if (UI.pressDown([tricksBtn], p)) return;
    const mi = nearMess(p.x, p.y, 60);
    if (mi >= 0) {
      if (lifted === 'bag' && bag.stage === 'empty') { bagMess(mi); p.consumed = true; return; }
      if (!held && !lifted) { dog.assist.bag = (dog.assist.bag || 0) + 1; if (dog.assist.bag > 2) { bagMess(mi); bag.ground = true; } else speak('useBag'); save(); p.consumed = true; return; }
    }
    if (lifted === 'bag' && bag.stage === 'full' && nearBin(p.x, p.y)) { lifted = null; binBag(); p.consumed = true; return; }
    if (lifted) return; // second tap of tap-then-tap resolves in up()
    if (inRect(L.door, p.x, p.y)) { FL.Audio.sfx.tap(); walk(); return; }
    if (inRect(L.bed, p.x, p.y, 10)) { napStart(); return; }
    if (dogHit(p.x, p.y)) { if (nap) { hearts(1); speak('sweet', 1); } else if (!trick && !party) pet(); return; }
    if (nearBin(p.x, p.y)) { speak('bagBin'); return; }
    for (const k in L.bowls) { const b = L.bowls[k]; if (Math.hypot(p.x - b.x, p.y - b.y) < 60) { speak(NEED_LINE[k]); glow[k] = t + 3; return; } }
    if (ball.state === 'ground' && Math.hypot(p.x - ball.x, p.y - ball.y) < 70) { liftItem('ball', p, { fromGround: true }); ball.state = 'held'; cancelFetchKeepBall(); return; }
  }
  function cancelFetchKeepBall() { d.carry = false; fetch = { state: 'none', t: 0 }; }
  function move(p) {
    if (!held || held.id !== p.id) return;
    held.x = p.x; held.y = p.y; if (!held.moved && Math.hypot(p.x - held.sx, p.y - held.sy) > 12) held.moved = true;
    if (held.item === 'brush' && held.moved && dogHit(p.x, p.y)) { stroke.dist += Math.hypot(p.x - stroke.x, p.y - stroke.y); while (stroke.dist >= 40) { stroke.dist -= 40; scrub(); } }
    stroke.x = p.x; stroke.y = p.y;
    if (held.item === 'bag' && bag.stage === 'empty' && held.moved) { const mi = nearMess(p.x, p.y, 90); if (mi >= 0) bagMess(mi); }
    if ((held.item === 'food' || held.item === 'water') && held.moved && !isBusy()) { const b = L.bowls[held.item]; if (!d.target && Math.hypot(d.x - (b.x - 46), d.y - (b.y + 12)) > 20) goTo(b.x - 46, b.y + 12, () => { d.facing = 1; setPose('beg', 999); }); }
    if (held.item === 'ball' && held.moved && !isBusy()) { d.facing = p.x >= d.x ? 1 : -1; d.wag = 1; }
  }
  function up(p) {
    if (phase === 'adopt') { if (adopt && adopt.step === 2) UI.pressUp([adopt.confirm].concat(adopt.names), p); return; }
    if (phase !== 'play') return;
    if (arc) UI.pressUp(arc, p);
    UI.pressUp([tricksBtn], p);
    if (held && held.id === p.id) {
      const h = held; held = null; if (d.pose === 'beg') { d.busy = 0; idleAt(); }
      if (!h.moved && !h.fromGround) {
        if (lifted === h.item) { lifted = null; FL.Audio.sfx.tap(); return; }
        lifted = h.item; FL.Audio.sfx.tap();
        if (h.item === 'ball') { dog.assist.ball = (dog.assist.ball || 0) + 1; if (dog.assist.ball >= 2 && (dog.assist.ball % 2 === 0)) { lifted = null; const b = itemBox('ball'); throwBall(b.x, b.y - 40, rnd(L.yard.x0, L.yard.x1), rnd(L.yard.y0, L.yard.y1)); return; } speak('throwAnywhere'); return; }
        speak(h.item === 'bag' && bag.stage === 'full' ? 'tapBin' : TAP_HINT[h.item]); return;
      }
      lifted = null; drop(h.item, p.x, p.y, h); return;
    }
    if (p.consumed) return;
    if (lifted) { const it = lifted; if (dropTarget(it, p.x, p.y)) { lifted = null; drop(it, p.x, p.y, { tap: true }); } else { lifted = null; FL.Audio.sfx.tap(); } }
  }
  function dropTarget(item, x, y) {
    if (item === 'food' || item === 'water') return inRect(L.matRect, x, y, 60);
    if (item === 'ball') return y >= 560 && y <= 820;
    if (item === 'bag') return bag.stage === 'full' ? nearBin(x, y) : nearMess(x, y, 90) >= 0;
    if (item === 'brush') return dogHit(x, y);
    return false;
  }
  function drop(item, x, y, h) {
    if (item === 'food' || item === 'water') { if (inRect(L.matRect, x, y, 60) && (item === 'food' ? feed() : water())) return; return springBack(item, x, y, item === 'food' ? 'needFood' : 'needWater'); }
    if (item === 'ball') { if (y >= 560 && y <= 820) { if (h && h.fromGround) ball.state = 'ground'; const b = itemBox('ball'); throwBall(h && h.fromGround ? x : b.x, h && h.fromGround ? y : b.y - 40, x, y); return; } if (h && h.fromGround) { ball.state = 'ground'; return; } return springBack(item, x, y, 'throwAnywhere'); }
    if (item === 'brush') { if (dogHit(x, y)) { if (h && h.tap) { scrub(); scrub(); scrub(); } return; } return springBack(item, x, y, 'tapBrush'); }
    if (item === 'bag') {
      if (bag.stage === 'full') { if (nearBin(x, y)) return binBag(); if (y < 570) { bag.ground = false; return springBack(item, x, y, 'bagBin'); } bag.x = x; bag.y = y; bag.ground = true; if (t - bag.t > 2) speak('bagBin', 1); return; }
      const mi = nearMess(x, y, 90); if (mi >= 0) { bagMess(mi); bag.x = x; bag.y = y; bag.ground = true; return; }
      return springBack(item, x, y, dog.messes.length ? 'useBag' : 'needPotty');
    }
  }
  function springBack(item, x, y, lineId) { const b = itemBox(item); spring = { item, x, y, tx: b.x, ty: b.y, t: 0 }; FL.Audio.sfx.hop(); if (lineId) speak(lineId); }
  function key(k) { if (k === 'Escape') arc = null; if (k === ' ') scene.repeatPrompt(); }

  // ---------- update ----------
  function updateDog(dt) {
    const S = L.S; d.poseT += dt; d.wag = Math.max(0, d.wag - dt * 0.5); petT = Math.max(0, petT - dt); d.pout = Math.max(0, d.pout - dt);
    if (d.target && fetch.state === 'toBall' && ball.state === 'ground' && !d.carry) { d.target.x = clamp(ball.x - 30 * (ball.x < d.x ? -1 : 1), L.room.x0, L.yard.x1); d.target.y = ball.y; }
    if (d.target) {
      const tg = d.target, dx = tg.x - d.x, dy = tg.y - d.y, dist = Math.hypot(dx, dy), sp = tg.speed || dogSpeed();
      if (dist < 6) { d.x = tg.x; d.y = tg.y; d.target = null; d.walking = false; if (d.pose === 'walk') { d.pose = 'idle'; d.poseT = 0; } if (tg.cb) tg.cb(); }
      else { const step = Math.min(dist, sp * dt); d.x += (dx / dist) * step; d.y += (dy / dist) * step; if (Math.abs(dx) > 2) d.facing = dx > 0 ? 1 : -1; d.walking = true; if (d.pose !== 'walk' && d.busy <= 0) { d.pose = 'walk'; d.poseT = 0; } }
    } else d.walking = false;
    if (d.busy > 0) { d.busy -= dt; if (d.busy <= 0) { d.busy = 0; if (!d.target) idleAt(); } }
    d.rot = dog.stage === 0 && d.walking ? Math.sin(t * 14) * 0.06 : d.spin > 0 ? d.rot + 4 * dt : d.rot * Math.max(0, 1 - dt * 8);
    if (d.spin > 0) d.spin -= dt;
    if (phase !== 'play' || nap || party) return;
    const free = !isBusy() && !held && !arc;
    const pst = P.needState(dog, 'potty');
    // potty cue (§6.1)
    if (pst === 'needs' && inside() && !d.onWalk) {
      if (dog.stage <= 1) { d.spinT -= dt; if (d.spinT <= 0 && free) { d.spinT = 4; d.spin = 1; } }
      else if (free && !d.sitDoor) { goTo(L.doorSpot.x, L.doorSpot.y, () => { d.facing = 1; d.pose = 'sit'; d.poseT = 0; }); d.sitDoor = true; }
      else if (d.sitDoor && !d.target) { d.pawT -= dt; if (d.pawT <= 0) { d.pawT = 4; setPose('five', 0.5); after(0.5, () => { if (d.sitDoor) { d.pose = 'sit'; d.poseT = 0; } }); } }
    } else if (pst === 'low' && inside() && free) { d.sniffT -= dt; if (d.sniffT <= 0) { d.sniffT = 8; if (dog.stage >= 2 && !d.sitDoor) { goTo(L.doorSpot.x, L.doorSpot.y, () => { d.facing = 1; d.pose = 'sit'; d.poseT = 0; }); d.sitDoor = true; } else setPose('sniff', 1); } }
    if (pst === 'fine') d.sitDoor = false;
    if (!inside() && !d.onWalk && !d.target && fetch.state === 'none') { d.outsideT -= dt; if (d.outsideT <= 0 || (held && (held.item === 'food' || held.item === 'water'))) goHome(); }
    if (!free || d.sitDoor) return;
    // roaming + stage flavour
    d.roamT -= dt; if (d.roamT <= 0) { d.roamT = rnd(4, 9); if (Math.random() < 0.6) { const s = roamSpot(); goTo(s.x, s.y, () => idleAt()); } }
    if (dog.stage === 0) { d.tumbleT -= dt; if (d.tumbleT <= 0 && !d.walking) { d.tumbleT = rnd(12, 25); setPose('tumble', 0.6); } }
    if (dog.stage === 1) { d.zoomT -= dt; if (d.zoomT <= 0) { d.zoomT = rnd(20, 35); const r = inside() ? L.room : L.yard; const tx = d.x < (r.x0 + r.x1) / 2 ? r.x1 : r.x0; goTo(tx, rnd(r.y0, r.y1), () => { setPose('hop', 0.5); }, 380); } }
    if (dog.stage === 3) { d.trickT -= dt; if (d.trickT <= 0) { d.trickT = rnd(35, 45); freeTrick(); } }
  }
  function updateBall(dt) {
    if (ball.state === 'air') {
      const n = Math.max(1, Math.ceil(dt * 120)), h = dt / n;
      for (let i = 0; i < n && ball.state === 'air'; i++) {
        ball.t += h; ball.x = clamp(ball.x + ball.vx * h, 120, L.W - 60); ball.y += ball.vy * h; ball.vy += ball.g * h;
        if (ball.y >= ball.gy && ball.vy > 0) { ball.y = ball.gy; if (!ball.bounced) { ball.bounced = true; ball.vy = -ball.vy * 0.5; ball.vx *= 0.3; FL.Audio.sfx.hop(); } else { ball.state = 'ground'; ball.roll = 0.3; ball.vx *= 0.25; if (fetch.state === 'thrown') ballLanded(); } }
      }
    } else if (ball.state === 'ground' && ball.roll > 0) { ball.roll -= dt; ball.x += ball.vx * dt; ball.vx *= Math.max(0, 1 - dt * 3); ball.x = clamp(ball.x, 120, L.W - 60); }
    if (ball.state === 'mouth') { const m = metrics(); ball.x = d.x + d.facing * m.rx * 0.9; ball.y = d.y + m.cy - m.ry * 0.3; }
    if (ball.state === 'held' && held) { ball.x = held.x; ball.y = held.y; }
  }
  function updateNeeds(dt) {
    P.tick(dog, dt); d.mood = P.mood(dog);
    for (const n of P.NEEDS) {
      const st = P.needState(dog, n);
      if (st !== needStates[n]) {
        needStates[n] = st;
        if (st === 'needs' && t > 3) { FL.Audio.sfx.whine(); speak(NEED_LINE[n], 1); }
        if (n === 'potty' && st === 'needs') d.spinT = 0;
      }
    }
    dog.dancing = P.needState(dog, 'potty') === 'needs';   // tracked every tick (not only on a transition) so a dog that is already dancing at enter() is saved as dancing for the offline accident rule + door glow
    if (dog.needs.potty >= 100 && inside() && !nap && !d.onWalk && !dog.messes.some((m) => m.inside)) {
      d.accT -= dt; if (d.accT <= 0) { d.accT = 1; if (P.accident(dog, clamp(d.x - 52 * d.facing, 160, L.S - 60) / L.W, (d.y + 2) / L.H)) { FL.Audio.sfx.plop(); d.pout = 10; goTo(d.x + 56 * d.facing, d.y, () => { setPose('sit', 10); }); speak('accident'); d.holdSaid = false; save(); } }
    }
    if (dog.needs.potty >= 95 && dog.accidentsToday && dog.accidentsToday.n >= 2 && dog.accidentsToday.key === P.todayKey() && !d.holdSaid) { d.holdSaid = true; speak('holding', 1); }
  }
  function updateParty(dt) {
    party.t += dt; party.next -= dt;
    if (party.next <= 0 && !trick) {
      if (party.i < party.tricks.length) { const id = party.tricks[party.i++]; trick = { id, t: 0, wobbly: false, free: true }; setPose(id, 2); FL.Audio.sfx.correct(); G().fx.burst(d.x, d.y - 60, { count: 12, type: 'confetti', speed: 300, life: 1, size: 12 }); party.next = 2.6; }
      else { const p = party; party = null; idleAt(); FL.Save.addStars(0); showResults({ title: 'Puppy Party!', subtitle: line('All your friends came to see {name}!'), stars: 2, emoji: '🎈' }, () => topNeed(1)); p.done = true; }
    }
  }
  function update(dt) {
    t += dt; const g = G();
    for (let i = timers.length - 1; i >= 0; i--) { const tm = timers[i]; tm.t -= dt; if (tm.t <= 0) { timers.splice(i, 1); tm.fn(); } }
    doorAngle += ((doorOpen ? 1.15 : 0) - doorAngle) * Math.min(1, dt * 8); binLid = Math.max(0, binLid - dt * 1.6); wave = Math.max(0, wave - dt);
    if (spring) { spring.t += dt; if (spring.t >= 0.3) spring = null; }
    kibble.forEach((k) => { k.vy += 900 * dt; k.y = Math.min(k.ty, k.y + k.vy * dt); }); if (kibble.length && kibble.every((k) => k.y >= k.ty)) kibble = [];
    drops = drops.filter((p) => { p.life -= dt; p.y += p.vy * dt; p.x += (p.vx || 0) * dt; p.vy += (p.kind === 'drop' ? 400 : -20) * dt; return p.life > 0; });
    stamps.forEach((s) => { s.t += dt; }); stamps = stamps.filter((s) => s.t < 1);
    if (d.pose === 'eat' && foodLevel > 0) foodLevel = Math.max(0, foodLevel - dt / 3); if (d.pose === 'drink' && waterLevel > 0) waterLevel = Math.max(0, waterLevel - dt / 2.5);
    if (waterLevel > 0 && d.pose !== 'drink') waterLevel = Math.max(0, waterLevel - dt * 0.01);
    if (resultsOpen && !UI.overlayActive()) { resultsOpen = false; const f = afterResults; afterResults = null; if (f) f(); }
    if (phase === 'adopt') { adopt.pups.forEach((p) => { p.poseT += dt; if (p.pose === 'hop' && p.poseT > 0.5) { p.pose = 'idle'; p.poseT = 0; } }); return; }
    if (phase === 'grow') { grow.snoreT -= dt; if (grow.snoreT <= 0) { grow.snoreT = 2; FL.Audio.sfx.snore(); zzz.push({ x: d.x + 20, y: d.y - 60, t: 0 }); } if (grow.done) grow.lift = Math.min(1, grow.lift + dt * 2); }
    zzz.forEach((z) => { z.t += dt; }); zzz = zzz.filter((z) => z.t < 2);
    updateDog(dt); updateBall(dt); if (arc) placeArc(); if (treat) { const m = metrics(); treat.x = d.x + 120 - 42; treat.y = d.y + m.cy - 42; if (t > treat.until) treat = null; }
    if (party) updateParty(dt);
    if (phase !== 'play' || UI.overlayActive()) return;
    if (nap) { nap.t -= dt; nap.snoreT -= dt; if (nap.snoreT <= 0) { nap.snoreT = 2; FL.Audio.sfx.snore(); zzz.push({ x: d.x + 20, y: d.y - 60, t: 0 }); } if (nap.t <= 0) wake(); }
    else updateNeeds(dt);
    roundAcc += dt; if (roundAcc >= 1) { roundAcc = 0; P.syncRound(dog); }
    saveAcc += dt; if (saveAcc >= 5) { saveAcc = 0; save(); }
    speech.idleT += dt;
    if (speech.idleT >= 20 && t - speech.last >= 6 && !held && !lifted && !trick && !nap && !party) {
      const ts = tutorialStep(); const w = P.worst(dog);
      if (ts) speak(topNeedId(), 0); else if (w) speak(w.state === 'needs' ? NEED_LINE[w.need] : LOW_LINE[w.need], 0);
      speech.idleT = 0;
    }
  }

  // ---------- draw ----------
  const isNight = () => { const h = new Date().getHours(); return h >= 19 || h < 6; };
  const keyBack = (n) => { const dd = new Date(); dd.setDate(dd.getDate() - n); return P.todayKey(dd); };
  function drawRoom(ctx) {
    const { W, H, S } = L; const night = isNight();
    ctx.fillStyle = '#fdf2f8'; ctx.fillRect(0, 0, S, 560);
    ctx.fillStyle = 'rgba(244,114,182,.16)'; for (let y = 40; y < 540; y += 70) for (let x = 30 + ((y / 70) % 2) * 35; x < S - 50; x += 70) { A.circle(ctx, x, y, 9); ctx.fill(); }
    ctx.fillStyle = '#f5d0a9'; ctx.fillRect(0, 560, S, H - 560); ctx.fillStyle = 'rgba(120,53,15,.12)'; ctx.fillRect(0, 560, S, 8);
    ctx.strokeStyle = 'rgba(180,83,9,.15)'; ctx.lineWidth = 2; for (let y = 600; y < H; y += 40) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(S - 40, y); ctx.stroke(); }
    ctx.fillStyle = '#f9a8d4'; A.ellipse(ctx, S / 2, 735, 280, 50); ctx.fill(); ctx.strokeStyle = '#f472b6'; ctx.lineWidth = 6; A.ellipse(ctx, S / 2, 735, 250, 36); ctx.stroke();
    ctx.save(); ctx.beginPath(); ctx.rect(S, 0, W - S, H); ctx.clip();
    A.sky(ctx, W, 480, night ? '#1e1b4b' : '#7dd3fc', night ? '#4c1d95' : '#e0f2fe');
    if (night) { ctx.fillStyle = '#fef9c3'; A.circle(ctx, W - 160, 140, 40); ctx.fill(); ctx.fillStyle = '#e0f2fe'; [[W - 220, 80], [W - 90, 230], [S + 120, 100], [S + 260, 210]].forEach(([x, y]) => { A.starPath(ctx, x, y, 7, 3, 4); ctx.fill(); }); } else A.sun(ctx, W - 160, 140, 44, t);
    A.cloud(ctx, S + 170 + Math.sin(t * 0.2) * 20, 130, 30, 0.9); A.cloud(ctx, W - 300 + Math.sin(t * 0.15 + 2) * 20, 250, 22, 0.7);
    A.hills(ctx, W, 480, 440, '#bbf7d0', 2);
    const gg = ctx.createLinearGradient(0, 480, 0, H); gg.addColorStop(0, '#86efac'); gg.addColorStop(1, '#4ade80'); ctx.fillStyle = gg; ctx.fillRect(S, 480, W - S, H - 480);
    ctx.restore();
  }
  function drawWall(ctx) {
    const S = L.S, dz = L.doorway;
    ctx.fillStyle = '#fbcfe8'; ctx.fillRect(S - 40, 0, 40, 300); ctx.fillStyle = '#f9a8d4'; ctx.fillRect(S - 8, 0, 8, 560); ctx.fillStyle = '#f472b6'; ctx.fillRect(S - 40, 0, 40, 14);
    const gl = (glow.door > t) || (dog.dancing && phase === 'play');
    if (gl) { ctx.save(); ctx.globalAlpha = 0.5 + Math.sin(t * 6) * 0.3; ctx.strokeStyle = '#fde047'; ctx.lineWidth = 12; A.roundRect(ctx, dz.x - 10, dz.y - 10, dz.w + 20, dz.h + 12, 12); ctx.stroke(); ctx.restore(); }
    ctx.fillStyle = '#78350f'; ctx.fillRect(dz.x - 7, dz.y - 8, dz.w + 14, 8); ctx.fillRect(dz.x - 7, dz.y, 7, dz.h); ctx.fillRect(dz.x + dz.w, dz.y, 7, dz.h);
    ctx.fillStyle = 'rgba(0,0,0,.25)'; ctx.fillRect(dz.x, dz.y, dz.w, dz.h);
    ctx.save(); ctx.translate(dz.x, dz.y + dz.h / 2); ctx.transform(Math.cos(doorAngle), Math.sin(doorAngle) * 0.28, 0, 1, 0, 0);
    ctx.fillStyle = '#b45309'; A.roundRect(ctx, 0, -dz.h / 2, dz.w, dz.h, 8); ctx.fill(); ctx.strokeStyle = '#78350f'; ctx.lineWidth = 3; ctx.stroke();
    ctx.fillStyle = '#7dd3fc'; A.roundRect(ctx, 7, -dz.h / 2 + 22, dz.w - 14, 62, 8); ctx.fill();
    ctx.fillStyle = '#fde047'; A.circle(ctx, dz.w - 9, 8, 4.5); ctx.fill();
    ctx.fillStyle = '#78350f'; A.roundRect(ctx, 6, dz.h / 2 - 72, dz.w - 12, 52, 6); ctx.fill(); A.emoji(ctx, '🐾', dz.w / 2, dz.h / 2 - 46, 18);
    ctx.restore();
  }
  function drawPoster(ctx) {
    const { x, y, w, h } = L.poster;
    ctx.fillStyle = 'rgba(0,0,0,.12)'; A.roundRect(ctx, x + 4, y + 8, w, h, 14); ctx.fill();
    ctx.fillStyle = '#fef3c7'; A.roundRect(ctx, x, y, w, h, 14); ctx.fill(); ctx.strokeStyle = '#d97706'; ctx.lineWidth = 5; ctx.stroke();
    ctx.fillStyle = '#ef4444'; A.circle(ctx, x + 16, y + 14, 7); ctx.fill(); A.circle(ctx, x + w - 16, y + 14, 7); ctx.fill();
    for (let i = 0; i < 7; i++) A.pawPrint(ctx, x + 30 + i * 28, y + 26, 9, (dog.week || []).includes(keyBack(6 - i)) ? '#f59e0b' : '#d6d3d1');
    const title = dog.name + "'s chart"; A.text(ctx, title, x + 216 + (w - 270) / 2, y + 26, { size: A.fitSize(ctx, title, w - 290, 22), color: '#92400e' });
    A.emoji(ctx, P.isMorning() ? '☀️' : '🌙', x + w - 34, y + 26, 30);
    P.JOBS.forEach((job, i) => {
      const cx = x + 30 + (i + 0.5) * (w - 60) / 5, cy = y + 92, done = !!dog.chart[job];
      ctx.fillStyle = done ? '#fde047' : '#fff'; ctx.strokeStyle = done ? '#f59e0b' : '#e7e5e4'; ctx.lineWidth = 3; A.circle(ctx, cx, cy, 30); ctx.fill(); ctx.stroke();
      A.emoji(ctx, JOB_ICON[job], cx - (done ? 6 : 0), cy - (done ? 4 : 0), done ? 26 : 32);
      if (done) A.pawPrint(ctx, cx + 13, cy + 12, 8, 'rgba(146,64,14,.85)');
      const st = stamps.find((s) => s.job === job); if (st) { const k = st.t; A.pawPrint(ctx, cx, cy - (1 - k) * 70, 11 + (1 - k) * 10, 'rgba(180,83,9,' + (1 - k * 0.7).toFixed(2) + ')'); }
    });
    const frac = P.boneFraction(dog), bx = x + 30, by = y + 140, bw = w - 120, bh = 18;
    ctx.save(); A.bonePath(ctx, bx, by, bw, bh); ctx.fillStyle = '#fff'; ctx.fill(); ctx.clip(); ctx.fillStyle = '#f472b6'; ctx.fillRect(bx - 16, by - 16, (bw + 32) * frac, bh + 32); ctx.restore();
    A.bonePath(ctx, bx, by, bw, bh); ctx.strokeStyle = '#be185d'; ctx.lineWidth = 3; ctx.stroke();
    A.emoji(ctx, dog.stage >= 3 && frac >= 1 ? '⭐' : dog.stage >= 3 ? '👑' : '🦴', bx + bw + 40, by + bh / 2, 28);
  }
  function drawNeeds(ctx) {
    L.needIcons.forEach((n) => {
      const st = P.needState(dog, n.need), y = n.y - (st === 'needs' ? Math.abs(Math.sin(t * 6)) * 8 : 0);
      ctx.fillStyle = 'rgba(0,0,0,.12)'; A.circle(ctx, n.x, n.y + 5, n.r); ctx.fill();
      ctx.fillStyle = NEED_COLOR[n.need]; A.circle(ctx, n.x, y, n.r); ctx.fill(); ctx.strokeStyle = '#fff'; ctx.lineWidth = 4; ctx.stroke();
      if (st !== 'fine') { ctx.save(); ctx.globalAlpha = st === 'low' ? 0.6 : 0.65 + Math.sin(t * 8) * 0.3; ctx.strokeStyle = st === 'low' ? '#fde047' : '#f472b6'; ctx.lineWidth = 8; A.circle(ctx, n.x, y, n.r + 7); ctx.stroke(); ctx.restore(); }
      A.emoji(ctx, NEED_ICON[n.need], n.x, y - 2, 44);
      if (n.need === 'play') for (let i = 0; i < 3; i++) { ctx.fillStyle = i < (dog.fetchCount || 0) ? '#16a34a' : 'rgba(255,255,255,.8)'; A.circle(ctx, n.x - 16 + i * 16, y + 32, 5); ctx.fill(); }
    });
  }
  function drawWindow(ctx) {
    const w = L.win, night = isNight();
    ctx.fillStyle = '#fff'; A.roundRect(ctx, w.x - 10, w.y - 10, w.w + 20, w.h + 20, 14); ctx.fill(); ctx.strokeStyle = '#f9a8d4'; ctx.lineWidth = 3; ctx.stroke();
    const g = ctx.createLinearGradient(0, w.y, 0, w.y + w.h); g.addColorStop(0, night ? '#1e1b4b' : '#7dd3fc'); g.addColorStop(1, night ? '#4c1d95' : '#e0f2fe'); ctx.fillStyle = g; ctx.fillRect(w.x, w.y, w.w, w.h);
    ctx.save(); ctx.beginPath(); ctx.rect(w.x, w.y, w.w, w.h); ctx.clip();
    if (night) { ctx.fillStyle = '#fef9c3'; A.circle(ctx, w.x + w.w * 0.65, w.y + 44, 22); ctx.fill(); } else A.sun(ctx, w.x + w.w * 0.65, w.y + 46, 22, t);
    ctx.fillStyle = '#86efac'; A.ellipse(ctx, w.x + w.w / 2, w.y + w.h + 10, w.w * 0.7, 34); ctx.fill(); ctx.restore();
    ctx.fillStyle = '#fff'; ctx.fillRect(w.x + w.w / 2 - 4, w.y, 8, w.h); ctx.fillRect(w.x, w.y + w.h / 2 - 4, w.w, 8);
    ctx.fillStyle = '#f9a8d4'; A.roundRect(ctx, w.x - 22, w.y - 12, 34, w.h + 24, 10); ctx.fill(); A.roundRect(ctx, w.x + w.w - 12, w.y - 12, 34, w.h + 24, 10); ctx.fill();
  }
  function drawBed(ctx) {
    const b = L.bed;
    ctx.fillStyle = 'rgba(0,0,0,.12)'; A.ellipse(ctx, b.x + b.w / 2, b.y + b.h, b.w / 2 + 10, 14); ctx.fill();
    ctx.fillStyle = '#d97706'; A.roundRect(ctx, b.x, b.y, b.w, b.h, 26); ctx.fill(); ctx.strokeStyle = '#b45309'; ctx.lineWidth = 4; ctx.stroke();
    ctx.strokeStyle = 'rgba(120,53,15,.3)'; ctx.lineWidth = 3; for (let i = 1; i < 6; i++) { ctx.beginPath(); ctx.moveTo(b.x + 12, b.y + i * 14); ctx.lineTo(b.x + b.w - 12, b.y + i * 14); ctx.stroke(); }
    ctx.fillStyle = '#f5f3ff'; A.roundRect(ctx, b.x + 14, b.y + 16, b.w - 28, b.h - 26, 20); ctx.fill();
    if (phase !== 'grow') { ctx.fillStyle = '#c084fc'; A.roundRect(ctx, b.x + b.w - 74, b.y + 22, 56, 42, 12); ctx.fill(); ctx.strokeStyle = '#a855f7'; ctx.lineWidth = 2; ctx.stroke(); }
  }
  function bowl(ctx, b, c, dark, gl) {
    if (gl) { ctx.save(); ctx.globalAlpha = 0.5 + Math.sin(t * 6) * 0.3; ctx.strokeStyle = '#fde047'; ctx.lineWidth = 8; A.ellipse(ctx, b.x, b.y + 2, 62, 30); ctx.stroke(); ctx.restore(); }
    ctx.fillStyle = dark; A.ellipse(ctx, b.x, b.y + 8, 52, 22); ctx.fill(); ctx.fillStyle = c; A.ellipse(ctx, b.x, b.y, 52, 22); ctx.fill(); ctx.fillStyle = 'rgba(0,0,0,.28)'; A.ellipse(ctx, b.x, b.y - 4, 40, 14); ctx.fill();
  }
  function drawMat(ctx) {
    const m = L.matRect, f = L.bowls.food, w = L.bowls.water; const hot = (held && (held.item === 'food' || held.item === 'water')) || lifted === 'food' || lifted === 'water';
    ctx.fillStyle = '#93c5fd'; A.roundRect(ctx, m.x, m.y, m.w, m.h, 22); ctx.fill(); ctx.strokeStyle = hot ? '#fde047' : '#60a5fa'; ctx.lineWidth = hot ? 8 : 4; ctx.stroke();
    bowl(ctx, f, '#ef4444', '#b91c1c', glow.food > t || lifted === 'food' || (held && held.item === 'food'));
    if (foodLevel > 0) { ctx.fillStyle = '#92400e'; A.ellipse(ctx, f.x, f.y - 8, 38 * Math.max(0.3, foodLevel), 6 + 12 * foodLevel); ctx.fill(); ctx.fillStyle = '#b45309'; [[-16, -6], [4, -12], [18, -4]].forEach(([ox, oy]) => { A.circle(ctx, f.x + ox, f.y - 8 + oy * foodLevel, 5); ctx.fill(); }); }
    bowl(ctx, w, '#3b82f6', '#1d4ed8', glow.water > t || lifted === 'water' || (held && held.item === 'water'));
    if (waterLevel > 0) { ctx.fillStyle = '#7dd3fc'; A.ellipse(ctx, w.x, w.y - 4, 40, 3 + 11 * waterLevel); ctx.fill(); ctx.fillStyle = 'rgba(255,255,255,.6)'; A.ellipse(ctx, w.x - 12, w.y - 8, 12, 4); ctx.fill(); }
    kibble.forEach((k) => { ctx.fillStyle = '#92400e'; A.circle(ctx, k.x, k.y, k.r); ctx.fill(); });
  }
  function drawMesses(ctx) {
    const hot = lifted === 'bag' || (held && held.item === 'bag');
    dog.messes.forEach((m) => { const p = messPos(m); if (hot && bag.stage === 'empty') { ctx.save(); ctx.globalAlpha = 0.5 + Math.sin(t * 6) * 0.3; ctx.strokeStyle = '#fde047'; ctx.lineWidth = 6; A.circle(ctx, p.x, p.y - 18, 40); ctx.stroke(); ctx.restore(); } A.emoji(ctx, '💩', p.x, p.y - 18, 50); });
  }
  function drawBin(ctx) {
    const { x, y } = L.bin; const hot = bag.stage === 'full';
    ctx.fillStyle = 'rgba(0,0,0,.15)'; A.ellipse(ctx, x, y + 48, 42, 10); ctx.fill();
    if (hot) { ctx.save(); ctx.globalAlpha = 0.5 + Math.sin(t * 6) * 0.3; ctx.strokeStyle = '#fde047'; ctx.lineWidth = 8; A.roundRect(ctx, x - 44, y - 52, 88, 104, 16); ctx.stroke(); ctx.restore(); }
    ctx.fillStyle = '#9ca3af'; A.roundRect(ctx, x - 35, y - 40, 70, 88, 10); ctx.fill(); ctx.strokeStyle = '#6b7280'; ctx.lineWidth = 3; ctx.stroke();
    ctx.strokeStyle = 'rgba(0,0,0,.15)'; [-18, 0, 18].forEach((o) => { ctx.beginPath(); ctx.moveTo(x + o, y - 30); ctx.lineTo(x + o, y + 38); ctx.stroke(); });
    A.emoji(ctx, '♻️', x, y + 6, 26);
    ctx.save(); ctx.translate(x - 40, y - 40); ctx.rotate(-binLid * 1.1); ctx.fillStyle = '#6b7280'; A.roundRect(ctx, 0, -12, 80, 14, 6); ctx.fill(); ctx.fillStyle = '#4b5563'; A.roundRect(ctx, 30, -20, 20, 9, 4); ctx.fill(); ctx.restore();
  }
  function drawYardProps(ctx) {
    const p = L.patch;
    A.fence(ctx, L.fence.x0, L.fence.x1, L.fence.y, 1);
    ctx.fillStyle = '#a3e635'; A.ellipse(ctx, p.x, p.y, p.rx, p.ry); ctx.fill();
    ctx.strokeStyle = '#65a30d'; ctx.lineWidth = 3; ctx.lineCap = 'round'; for (let i = 0; i < 14; i++) { const a = (i / 14) * Math.PI * 2; const bx = p.x + Math.cos(a) * p.rx * 0.75, by = p.y + Math.sin(a) * p.ry * 0.75; ctx.beginPath(); ctx.moveTo(bx, by); ctx.lineTo(bx + 4, by - 12 - (i % 3) * 3); ctx.stroke(); }
    A.tree(ctx, L.tree.x, L.tree.y, 0.9, 1, t);
    if (party) party.balloons.forEach((b) => { const by = 300 + Math.sin(t * 1.5 + b.seed) * 12; ctx.strokeStyle = 'rgba(255,255,255,.8)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(b.x, by + 30); ctx.quadraticCurveTo(b.x + 10, by + 80, b.x - 4, by + 130); ctx.stroke(); ctx.fillStyle = b.c; A.ellipse(ctx, b.x, by, 26, 32); ctx.fill(); ctx.fillStyle = 'rgba(255,255,255,.4)'; A.ellipse(ctx, b.x - 9, by - 10, 7, 10); ctx.fill(); });
  }
  function drawStrip(ctx) {
    const ts = tutorialStep(), tut = ts ? JOB_ITEM[ts] : null;
    L.items.forEach((b) => {
      const gl = glow[b.item] > t || tut === b.item || (b.item === 'bag' && dog.messes.length && bag.stage === 'empty') || (b.item === 'brush' && dog.mud > 0);
      const lift = lifted === b.item ? 20 : 0, x = b.x - b.w / 2, y = b.y - b.h / 2 - lift;
      ctx.fillStyle = 'rgba(0,0,0,.15)'; A.roundRect(ctx, x, y + 6, b.w, b.h, 16); ctx.fill();
      ctx.fillStyle = '#b45309'; A.roundRect(ctx, x, y, b.w, b.h, 16); ctx.fill(); ctx.fillStyle = '#d97706'; A.roundRect(ctx, x + 6, y + 6, b.w - 12, b.h - 12, 12); ctx.fill();
      ctx.strokeStyle = 'rgba(120,53,15,.35)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x + 8, y + b.h / 2); ctx.lineTo(x + b.w - 8, y + b.h / 2); ctx.stroke();
      if (gl || lift) { ctx.save(); ctx.globalAlpha = 0.7 + Math.sin(t * 6) * 0.3; ctx.strokeStyle = '#fde047'; ctx.lineWidth = 8; A.roundRect(ctx, x - 4, y - 4, b.w + 8, b.h + 8, 20); ctx.stroke(); ctx.restore(); }
      const away = (held && held.item === b.item) || (b.item === 'ball' && ball.state !== 'box') || (b.item === 'bag' && bag.stage === 'full' && bag.ground);
      const e = b.item === 'bag' && bag.stage === 'full' ? '🛍️' : ITEM_EMOJI[b.item];
      A.emoji(ctx, e, b.x, b.y - lift - 2, 52, away ? { alpha: 0.25 } : { shadow: !!lift });
    });
  }
  function drawDog(ctx) {
    const wob = trick && trick.wobbly; const anim = { t, facing: d.facing, pose: d.carry ? 'grab' : d.pose, poseT: d.poseT, walking: d.walking, wag: Math.min(1, d.wag + (petT > 0 ? 1 : 0) + (d.mood === 'happy' ? 0.3 : 0)), seed: d.seed, rot: d.rot + (wob ? Math.sin(t * 30) * 0.12 : 0), alpha: d.alpha };
    A.dog(ctx, d.x, d.y, look(), anim, wob ? 0.92 : 1);
  }
  function drawBall(ctx) {
    if (ball.state === 'box' || ball.state === 'mouth') return;
    if (ball.state === 'air') { ctx.fillStyle = 'rgba(0,0,0,.15)'; A.ellipse(ctx, ball.x, ball.gy, 18, 6); ctx.fill(); }
    A.emoji(ctx, '🎾', ball.x, ball.y - 16, ball.state === 'held' ? 52 : 40, { rot: ball.x * 0.04, shadow: true });
  }
  function drawScene(ctx) {
    const g = G(), S = L.S;
    const items = [];
    items.push({ y: d.y, f: () => drawDog(ctx) });
    items.push({ y: L.princess.y, f: () => A.princess(ctx, L.princess.x, L.princess.y, g.look, { t, facing: d.x < L.princess.x ? -1 : 1, wave: wave > 0, dance: party ? 1 : 0 }, 0.9) });
    const comp = FL.Save.data.companion; if (comp !== '🐶' && comp !== '🐕' && !party) items.push({ y: L.perch.y, f: () => { const hop = fetch.state !== 'none' ? Math.abs(Math.sin(t * 8)) * 14 : Math.sin(t * 2) * 2; A.emoji(ctx, comp, L.perch.x, L.perch.y - 22 - hop, 56); } });
    if (party) party.friends.forEach((e, i) => items.push({ y: L.perch.y, f: () => A.emoji(ctx, e, S + 120 + i * 68, L.perch.y - 22 - Math.abs(Math.sin(t * 6 + i)) * 10, 52) }));
    items.sort((a, b) => a.y - b.y).forEach((i) => i.f());
    zzz.forEach((z) => A.emoji(ctx, '💤', z.x + Math.sin(z.t * 3) * 10, z.y - z.t * 40, 26 + z.t * 12, { alpha: Math.max(0, 1 - z.t / 2) }));
    drops.forEach((p) => { ctx.fillStyle = p.kind === 'drop' ? '#7dd3fc' : 'rgba(255,255,255,.85)'; A.circle(ctx, p.x, p.y, p.r); ctx.fill(); if (p.kind !== 'drop') { ctx.strokeStyle = '#bae6fd'; ctx.lineWidth = 1.5; ctx.stroke(); } });
  }
  function draw(ctx) {
    const g = G(), S = L.S;
    drawRoom(ctx); drawWall(ctx);
    if (phase !== 'adopt') { drawPoster(ctx); drawNeeds(ctx); }
    drawWindow(ctx); drawBed(ctx); drawMat(ctx);
    if (phase !== 'adopt') drawStrip(ctx);
    drawBin(ctx); drawYardProps(ctx); drawMesses(ctx);   // messes after the patch, or the 💩 on the patch is painted over
    drawScene(ctx);
    if (nap) { ctx.fillStyle = 'rgba(30,20,80,.3)'; ctx.fillRect(0, 0, S, g.H); }
    drawBall(ctx);
    if (bag.stage === 'full' && bag.ground) A.emoji(ctx, '🛍️', bag.x, bag.y - 14, 44, { scale: 1 + Math.sin(t * 5) * 0.06, shadow: true });
    if (spring) { const k = spring.t / 0.3, e = 1 - Math.pow(1 - k, 2); A.emoji(ctx, ITEM_EMOJI[spring.item], spring.x + (spring.tx - spring.x) * e, spring.y + (spring.ty - spring.y) * e, 68 - 16 * e); }
    if (held) A.emoji(ctx, held.item === 'bag' && bag.stage === 'full' ? '🛍️' : held.item === 'ball' ? '' : ITEM_EMOJI[held.item], held.x, held.y - 12, 68, { rot: Math.sin(t * 10) * 0.08, shadow: true });
    if (phase === 'play' && !nap && !party && !trick) { const w = P.worst(dog); const icon = dog.dancing ? '🌳' : w && w.state === 'needs' ? NEED_ICON[w.need] : null; if (icon) { const m = metrics(); A.bubble(ctx, d.x + 56 * d.facing, d.y + m.top - 40 + Math.sin(t * 3) * 4, icon, 40); } }
    if (treat) { treatBtn.x = treat.x; treatBtn.y = treat.y; treatBtn.draw(ctx, t); }
    if (arc) arc.forEach((b) => b.draw(ctx, t));
    if (phase === 'play') tricksBtn.draw(ctx, t);
    if (phase === 'adopt') drawAdopt(ctx);
    if (phase === 'grow') drawGrow(ctx);
  }
  function drawAdopt(ctx) {
    const g = G(), W = g.W, bk = adopt.basket;
    ctx.fillStyle = 'rgba(40,20,60,.35)'; ctx.fillRect(0, 0, W, g.H);
    UI.banner(ctx, adopt.step === 1 ? 'Tap a puppy!' : 'Pick a name!', { emoji: adopt.step === 1 ? '🐶' : '🦴', size: 40, minW: 560 });
    const weave = (x, y, w, h) => { ctx.fillStyle = '#b45309'; A.roundRect(ctx, x, y, w, h, 24); ctx.fill(); ctx.save(); A.roundRect(ctx, x, y, w, h, 24); ctx.clip(); ctx.fillStyle = '#f59e0b'; for (let yy = y + 8; yy < y + h; yy += 24) for (let xx = x + (((yy - y) / 24) % 2) * 20; xx < x + w; xx += 40) { A.roundRect(ctx, xx, yy, 24, 10, 5); ctx.fill(); } ctx.restore(); ctx.strokeStyle = '#78350f'; ctx.lineWidth = 4; A.roundRect(ctx, x, y, w, h, 24); ctx.stroke(); };
    weave(bk.x - bk.w / 2, bk.y - bk.h / 2, bk.w, bk.h);
    adopt.pups.forEach((p, i) => { const pp = adopt.pupPos[i]; A.dog(ctx, pp.x, pp.y, { coat: i, stage: 0, mood: 'happy', mud: 0 }, { t, facing: 1, pose: p.pose, poseT: p.poseT, walking: false, wag: 1, seed: i * 3, rot: p.pose === 'idle' ? Math.sin(t * 3 + i) * 0.08 : 0, alpha: p.alpha }, 1.3); });
    weave(bk.x - bk.w / 2, bk.y - 6, bk.w, bk.h / 2 + 6);
    if (adopt.step === 1) adopt.pupPos.forEach((pp, i) => A.emoji(ctx, '👇', pp.x, pp.y - 170 - Math.abs(Math.sin(t * 4 + i)) * 14, 44));
    if (adopt.step === 2) { adopt.names.forEach((b) => b.draw(ctx, t)); adopt.confirm.draw(ctx, t); }
  }
  function drawGrow(ctx) {
    const g = G(), b = L.bed;
    ctx.fillStyle = 'rgba(30,20,80,.25)'; ctx.fillRect(0, 0, L.S, g.H);
    const lift = grow.lift; ctx.save(); ctx.globalAlpha = 1 - lift; ctx.translate(lift * 60, -lift * 160); ctx.rotate(-lift * 0.4);
    ctx.fillStyle = '#c084fc'; A.roundRect(ctx, b.x + 16, b.y + 4, b.w - 32, b.h - 16, 22); ctx.fill(); ctx.strokeStyle = '#a855f7'; ctx.lineWidth = 3; ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,.35)'; for (let i = 0; i < 4; i++) { A.circle(ctx, b.x + 44 + i * 36, b.y + 30 + (i % 2) * 22, 6); ctx.fill(); } ctx.restore();
    if (!grow.done) A.emoji(ctx, '👇', b.x + b.w / 2, b.y - 90 - Math.abs(Math.sin(t * 4)) * 18, 64);
  }

  // ---------- scene ----------
  let treatBtn = null;
  const scene = {
    hud: { home: true, repeat: true },
    enter() {
      P = FL.Puppy; if (!FL.Save.data.dog) FL.Save.data.dog = FL.Save.defaultDog ? FL.Save.defaultDog() : DEFAULT_DOG();
      dog = FL.Save.data.dog; const def = DEFAULT_DOG(); for (const k in def) if (dog[k] == null) dog[k] = def[k];
      t = 0; phase = 'play'; tutorial = false; resetState(); layout();
      treatBtn = new UI.Button({ x: 0, y: 0, w: 84, h: 84, emoji: '🦴', color: '#fbbf24', round: true, emojiSize: 44, pulse: true });
      if (!dog.adopted) { startAdopt(); return; }
      P.syncRound(dog); const away = P.applyAway(dog); dog.visits = (dog.visits || 0) + 1; tutorial = !dog.tutorialDone; placeDog();
      if (P.shouldCeremony(dog)) startGrow(); else greet(away);
      save();
    },
    cancel(p) { if (held && held.id === p.id) { if (ball.state === 'held') ball.state = 'box'; held = null; lifted = null; if (d.pose === 'beg') { d.busy = 0; idleAt(); } } },
    exit() { if (dog && dog.adopted) save(); timers = []; arc = null; held = null; lifted = null; treat = null; },
    resize() { if (L) layout(); },
    repeatPrompt() { if (!dog) return; if (phase === 'adopt') speak(adopt.step === 1 ? 'adopt1' : 'adopt2'); else if (phase === 'grow') speak('growSleep'); else topNeed(2); },
    down, move, up, key, update, draw,
    layoutInfo() {
      return { S: L.S, W: L.W, H: L.H, phase, matRect: L.matRect, door: L.door, bin: L.bin, bed: L.bed, patch: L.patch, bowls: L.bowls, poster: L.poster, tricksBtn: L.tricksBtn,
        items: L.items.map((b) => ({ item: b.item, x: b.x, y: b.y })), needIcons: L.needIcons.map((n) => ({ need: n.need, x: n.x, y: n.y })),
        dog: { x: d.x, y: d.y, pose: d.pose, outside: !inside(), stage: dog.stage, mud: dog.mud, needs: dog.needs, dancing: dog.dancing },
        ball: { state: ball.state, x: ball.x, y: ball.y }, bag: { stage: bag.stage, ground: bag.ground, x: bag.x, y: bag.y }, held: held && held.item, lifted, fetch: fetch.state,
        messes: dog.messes.map((m) => Object.assign({}, m, messPos(m))), chart: dog.chart, fetchCount: dog.fetchCount, points: dog.points, tutorial,
        adopt: adopt && { step: adopt.step, pups: adopt.pupPos.map((p) => ({ x: p.x, y: p.y - 60 })), names: adopt.names.map((b) => ({ x: b.x + b.w / 2, y: b.y + b.h / 2 })), confirm: { x: adopt.confirm.x + 160, y: adopt.confirm.y + 46 } },
        treat: treat && { x: treat.x + 42, y: treat.y + 42 }, arc: arc && arc.map((b) => ({ x: b.x + 48, y: b.y + 48 })), overlay: UI.overlayActive() };
    },
  };
  FL.scenes.puppy = scene;
})();
