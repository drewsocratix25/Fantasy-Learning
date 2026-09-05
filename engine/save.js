// Progress + settings, stored in localStorage on the device.
(function () {
  const KEY = (window.FL && FL.config && FL.config.storageKey) || 'littleWonders.game.v1';
  const DEFAULTS = {
    name: '',
    princess: 0,          // index into the game's hero list
    dress: null,          // optional dress colour override
    companion: '🐰',
    unlocked: ['🐰'],
    stars: 0,
    levels: {},
    plays: {},            // gameId -> count
    songBest: {},         // songId -> best stars
    settings: { music: true, speech: true, speed: 'slow', voice: null },
    visited: [],
    firstRun: true,
    items: [],            // 'crown:flower', 'wand:star', 'decor:fountain', 'song:row' ...
    crown: 'gold',
    wand: null,
    regions: 1,           // how many map regions are open
    newRegion: null,      // region index to celebrate on next kingdom visit
  };
  if (window.FL && FL.config && FL.config.defaults) Object.assign(DEFAULTS, JSON.parse(JSON.stringify(FL.config.defaults)));
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
    reset() {
      const previous = this.data;
      data = JSON.parse(JSON.stringify(DEFAULTS));
      for (const key of ((FL.config || {}).preserveOnReset || [])) {
        if (previous[key] !== undefined) data[key] = JSON.parse(JSON.stringify(previous[key]));
      }
      if (data.dog && data.dog.adopted) {
        const emoji = data.dog.stage >= 3 ? '🐕' : '🐶';
        if (!data.unlocked.includes(emoji)) data.unlocked.push(emoji);
      }
      save();
    },
    defaultDog() { return DEFAULTS.dog ? JSON.parse(JSON.stringify(DEFAULTS.dog)) : null; },
    resetDog() { if (!DEFAULTS.dog) return; const d = this.data; d.dog = this.defaultDog(); d.unlocked = d.unlocked.filter((e) => e !== '🐶' && e !== '🐕'); if (d.companion === '🐶' || d.companion === '🐕') d.companion = '🐰'; save(); },
    level(game) { return (this.data.levels[game] || 1); },
    levelUp(game) { this.data.levels[game] = Math.min(6, this.level(game) + 1); save(); },
    addPlay(game) { this.data.plays[game] = (this.data.plays[game] || 0) + 1; save(); },
    addStars(n) { this.data.stars += n; save(); return this.data.stars; },
    setSongBest(id, stars) { const b = this.data.songBest[id] || 0; if (stars > b) { this.data.songBest[id] = stars; save(); } },
    has(type, id) { return this.data.items.includes(type + ':' + id); },
    give(type, id) { if (this.has(type, id)) return false; this.data.items.push(type + ':' + id); save(); return true; },
    unlock(emoji) { if (!this.data.unlocked.includes(emoji)) { this.data.unlocked.push(emoji); this.data.companion = emoji; save(); return true; } return false; },
  };
  window.FL = window.FL || {};
  FL.scenes = FL.scenes || {};
  FL.Save = Save;
  load();
})();
