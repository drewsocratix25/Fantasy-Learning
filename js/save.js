// Progress + settings, stored in localStorage on the device.
(function () {
  const KEY = 'melodyKingdom.v1';
  const DEFAULTS = {
    name: '',
    princess: 0,          // index into Art.PRINCESSES
    dress: null,          // optional dress colour override
    companion: '🐰',
    unlocked: ['🐰'],
    stars: 0,
    levels: { letters: 1, numbers: 1, shapes: 1, patterns: 1, piano: 1 },
    plays: {},            // gameId -> count
    songBest: {},         // songId -> best stars
    settings: { music: true, speech: true, speed: 'slow' },
    visited: [],
    firstRun: true,
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
  };
  let data = null;

  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      data = raw ? deepMerge(JSON.parse(JSON.stringify(DEFAULTS)), JSON.parse(raw)) : JSON.parse(JSON.stringify(DEFAULTS));
    } catch (e) { data = JSON.parse(JSON.stringify(DEFAULTS)); }
    return data;
  }
  function deepMerge(base, extra) {
    for (const k in extra) {
      if (extra[k] && typeof extra[k] === 'object' && !Array.isArray(extra[k]) && base[k] && typeof base[k] === 'object') deepMerge(base[k], extra[k]);
      else base[k] = extra[k];
    }
    return base;
  }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(data)); } catch (e) { /* private mode etc. */ } }

  const Save = {
    get data() { return data || load(); },
    save,
    reset() { const dog = JSON.parse(JSON.stringify((data || load()).dog || DEFAULTS.dog)); data = JSON.parse(JSON.stringify(DEFAULTS)); data.dog = dog; save(); }, // the puppy survives a reset
    defaultDog() { return JSON.parse(JSON.stringify(DEFAULTS.dog)); },
    resetDog() { const d = this.data; d.dog = this.defaultDog(); d.unlocked = d.unlocked.filter((e) => e !== '🐶' && e !== '🐕'); if (d.companion === '🐶' || d.companion === '🐕') d.companion = '🐰'; save(); },
    level(game) { return (this.data.levels[game] || 1); },
    levelUp(game) { this.data.levels[game] = Math.min(6, this.level(game) + 1); save(); },
    addPlay(game) { this.data.plays[game] = (this.data.plays[game] || 0) + 1; save(); },
    addStars(n) { this.data.stars += n; save(); return this.data.stars; },
    setSongBest(id, stars) { const b = this.data.songBest[id] || 0; if (stars > b) { this.data.songBest[id] = stars; save(); } },
    unlock(emoji) { if (!this.data.unlocked.includes(emoji)) { this.data.unlocked.push(emoji); this.data.companion = emoji; save(); return true; } return false; },
  };
  window.FL = window.FL || {};
  FL.scenes = FL.scenes || {};
  FL.Save = Save;
  load();
})();
