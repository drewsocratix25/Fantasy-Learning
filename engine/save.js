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
    updatedAt: 0,         // last local change (ms since epoch); used when merging synced progress
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
  function write() { try { localStorage.setItem(KEY, JSON.stringify(data)); } catch (e) { /* private mode etc. */ } }
  function save() { data.updatedAt = Date.now(); write(); if (Save.onChange) { try { Save.onChange(); } catch (e) { /* platform is optional */ } } }
  const clone = (v) => JSON.parse(JSON.stringify(v));
  const union = (a, b) => { const out = (a || []).slice(); (b || []).forEach((x) => { if (!out.includes(x)) out.push(x); }); return out; };
  const maxMap = (a, b) => { const out = Object.assign({}, a || {}); Object.keys(b || {}).forEach((k) => { out[k] = Math.max(Number(out[k] || 0), Number(b[k] || 0)); }); return out; };

  const Save = {
    get data() { return data || load(); },
    save,
    reset() { data = JSON.parse(JSON.stringify(DEFAULTS)); save(); },
    level(game) { return (this.data.levels[game] || 1); },
    levelUp(game) { this.data.levels[game] = Math.min(6, this.level(game) + 1); save(); },
    addPlay(game) { this.data.plays[game] = (this.data.plays[game] || 0) + 1; save(); },
    addStars(n) { this.data.stars += n; save(); return this.data.stars; },
    setSongBest(id, stars) { const b = this.data.songBest[id] || 0; if (stars > b) { this.data.songBest[id] = stars; save(); } },
    has(type, id) { return this.data.items.includes(type + ':' + id); },
    give(type, id) { if (this.has(type, id)) return false; this.data.items.push(type + ':' + id); save(); return true; },
    unlock(emoji) { if (!this.data.unlocked.includes(emoji)) { this.data.unlocked.push(emoji); this.data.companion = emoji; save(); return true; } return false; },
    // ---- sync support (platform/platform.js) ----
    onChange: null,                       // set by the platform; called after every save()
    snapshot() { return clone(this.data); },
    // Merge progress from another device. Achievements combine (never lost); preferences follow the
    // newest device. Returns true when anything changed. Does not call onChange (avoids echo pushes).
    merge(remote) {
      if (!remote || typeof remote !== 'object') return false;
      const local = this.data; const before = JSON.stringify(local);
      const remoteNewer = Number(remote.updatedAt || 0) > Number(local.updatedAt || 0);
      const out = clone(local);
      out.stars = Math.max(Number(local.stars || 0), Number(remote.stars || 0));
      out.unlocked = union(local.unlocked, remote.unlocked);
      out.items = union(local.items, remote.items);
      out.visited = union(local.visited, remote.visited);
      out.levels = maxMap(local.levels, remote.levels);
      out.plays = maxMap(local.plays, remote.plays);
      out.songBest = maxMap(local.songBest, remote.songBest);
      out.regions = Math.max(Number(local.regions || 1), Number(remote.regions || 1));
      out.firstRun = !!(local.firstRun && remote.firstRun !== false);
      Object.keys(remote).forEach((k) => { if (!(k in out)) out[k] = clone(remote[k]); });   // game-specific fields
      if (remoteNewer) {
        ['name', 'princess', 'dress', 'companion', 'crown', 'wand', 'newRegion'].forEach((k) => { if (k in remote) out[k] = clone(remote[k]); });
        out.settings = Object.assign({}, local.settings, remote.settings || {});
        Object.keys(remote).forEach((k) => { if (!(k in DEFAULTS) && remote[k] !== undefined) out[k] = clone(remote[k]); });
      } else if (!local.name && remote.name) out.name = remote.name;
      if (out.companion && !out.unlocked.includes(out.companion)) out.unlocked.push(out.companion);
      out.updatedAt = Math.max(Number(local.updatedAt || 0), Number(remote.updatedAt || 0));
      if (JSON.stringify(out) === before) return false;
      data = out; write(); return true;
    },
  };
  window.FL = window.FL || {};
  FL.scenes = FL.scenes || {};
  FL.Save = Save;
  load();
})();
