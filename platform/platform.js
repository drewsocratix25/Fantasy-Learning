// Little Wonders platform client: family codes, progress sync, supporter status, anonymous play counts.
// Plain script, no dependencies. Loaded by the hub and by every game. Everything degrades to
// "local mode" when LW_CONFIG has no Supabase project, and every network call is best-effort.
(function () {
  const cfg = window.LW_CONFIG || {};
  const enabled = !!(cfg.supabaseUrl && cfg.supabaseAnonKey);
  const KEY = 'littleWonders.family.v1';
  const PING_KEY = 'littleWonders.ping.v1';
  const store = {
    get(k) { try { return JSON.parse(localStorage.getItem(k)); } catch (e) { return null; } },
    set(k, v) { try { if (v == null) localStorage.removeItem(k); else localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* private mode */ } },
  };
  let fam = store.get(KEY) || null;   // { code, email, supporter: { active, until, plan }, checkedAt }
  const listeners = new Set();
  function emit() { listeners.forEach((fn) => { try { fn(fam); } catch (e) { /* ignore */ } }); }
  function setFam(next) { fam = next; store.set(KEY, fam); emit(); }

  async function call(action, body) {
    if (!enabled) throw new Error('Little Wonders is in local mode (no server configured).');
    const ctrl = typeof AbortController !== 'undefined' ? new AbortController() : null;
    const timer = ctrl ? setTimeout(() => ctrl.abort(), 12000) : null;
    try {
      const r = await fetch(cfg.supabaseUrl.replace(/\/$/, '') + '/functions/v1/family', {
        method: 'POST', signal: ctrl ? ctrl.signal : undefined,
        headers: { 'content-type': 'application/json', apikey: cfg.supabaseAnonKey, authorization: 'Bearer ' + cfg.supabaseAnonKey },
        body: JSON.stringify(Object.assign({ action }, body || {})),
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(j.error || ('Server error ' + r.status));
      return j;
    } finally { if (timer) clearTimeout(timer); }
  }

  const normalizeCode = (c) => String(c || '').toUpperCase().replace(/[^A-Z0-9]/g, '').replace(/^(.{4})(.{4})$/, '$1-$2');
  const validCode = (c) => /^[A-Z0-9]{4}-[A-Z0-9]{4}$/.test(c);

  const family = {
    code() { return fam ? fam.code : null; },
    info() { return fam; },
    onChange(fn) { listeners.add(fn); return () => listeners.delete(fn); },
    async create(email) {
      const r = await call('create', { email: String(email || '').trim() });
      setFam({ code: r.code, email: r.email || email, supporter: r.supporter, checkedAt: Date.now() });
      return fam;
    },
    async join(code) {
      code = normalizeCode(code); if (!validCode(code)) throw new Error('A family code looks like ABCD-EFGH.');
      const r = await call('join', { code });
      setFam({ code: r.code, email: r.email || null, supporter: r.supporter, checkedAt: Date.now() });
      return fam;
    },
    leave() { setFam(null); },
    async recover(email) { return call('recover', { email: String(email || '').trim() }); },
    async refresh() {
      if (!fam || !enabled) return fam;
      try { const r = await call('status', { code: fam.code }); setFam(Object.assign({}, fam, { email: r.email || fam.email, supporter: r.supporter, checkedAt: Date.now() })); } catch (e) { /* offline: keep cached */ }
      return fam;
    },
    normalizeCode,
  };

  const supporter = {
    active() { const s = fam && fam.supporter; return !!(s && s.active && (!s.until || new Date(s.until).getTime() > Date.now())); },
    plan() { return (fam && fam.supporter && fam.supporter.plan) || null; },
    until() { return (fam && fam.supporter && fam.supporter.until) || null; },
  };

  // Stripe Payment Links: the family code rides along as client_reference_id so the webhook can
  // mark the right family as a supporter, and the email is prefilled when we know it.
  function supportUrl(plan) {
    const base = plan === 'year' ? cfg.stripeYearly : cfg.stripeMonthly; if (!base) return null;
    const u = new URL(base); if (fam && fam.code) u.searchParams.set('client_reference_id', fam.code); if (fam && fam.email) u.searchParams.set('prefilled_email', fam.email);
    return u.toString();
  }

  // ---- progress sync ----
  const sync = {
    async pull(gameId) { if (!fam) return null; const r = await call('pull', { code: fam.code, game: gameId }); return r.data ? { data: r.data, updatedAt: r.updatedAt } : null; },
    async push(gameId, data) { if (!fam) return null; return call('push', { code: fam.code, game: gameId, data }); },
    _timers: {},
    schedule(gameId, getData, delay) {
      if (!fam || !enabled) return;
      clearTimeout(sync._timers[gameId]);
      sync._timers[gameId] = setTimeout(() => sync.flush(gameId, getData), delay == null ? 4000 : delay);
    },
    flush(gameId, getData) {
      clearTimeout(sync._timers[gameId]); delete sync._timers[gameId];
      if (!fam || !enabled) return Promise.resolve();
      let data; try { data = getData(); } catch (e) { return Promise.resolve(); }
      return sync.push(gameId, data).catch(() => { /* try again on the next change */ });
    },
  };

  // Anonymous play counter: one hit per game per day per device, payload is {game} only.
  function ping(gameId) {
    if (!enabled || cfg.playCounts === false) return;
    const day = new Date().toISOString().slice(0, 10); const seen = store.get(PING_KEY) || {};
    if (seen[gameId] === day) return; seen[gameId] = day; store.set(PING_KEY, seen);
    call('ping', { game: gameId }).catch(() => {});
  }

  // Wire a running game (FL engine) to the platform. Called from engine/main.js at boot.
  function attachGame() {
    const FL = window.FL; if (!FL || !FL.Save || !FL.config) return;
    const id = FL.config.id; if (!id) return;
    ping(id);
    if (!fam || !enabled) return;
    FL.Save.onChange = () => sync.schedule(id, () => FL.Save.snapshot());
    const flush = () => sync.flush(id, () => FL.Save.snapshot());
    window.addEventListener('pagehide', flush); document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') flush(); });
    sync.pull(id).then((remote) => {
      if (!remote || !remote.data) { flush(); return; }
      const changed = FL.Save.merge(remote.data);
      if (changed) { if (FL.Game && FL.Game.refreshLook) FL.Game.refreshLook(); if (FL.UI && FL.UI.toast) FL.UI.toast('Progress synced', '☁️', '#2563eb'); }
      flush();
    }).catch(() => {});
    family.refresh();
  }

  window.LW = { enabled, config: cfg, family, supporter, sync, ping, supportUrl, attachGame, version: 1 };
})();
