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
    reset() { data = JSON.parse(JSON.stringify(DEFAULTS)); save(); },
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
