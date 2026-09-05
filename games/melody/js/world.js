// The explorable world: Melody Kingdom, and the regions that open as friends are collected.
(function () {
  const A = FL.Art, UI = FL.UI, G = () => FL.Game, D = FL.Data;
  const MAP_H = 1700; const REG = D.REGIONS; const LOCS = D.LOCS; const FULL_W = REG[REG.length - 1].x0 + REG[REG.length - 1].w;
  const GATES = REG.slice(1).map((r, i) => ({ x: r.x0, y: 960, region: i + 1, open: 0 }));
  const STATIC_OBS = [
    { type: 'rect', x: 970, y: 300, w: 460, h: 340 }, { type: 'circle', x: 1980, y: 470, r: 190 }, { type: 'circle', x: 1930, y: 1160, r: 110 }, { type: 'rect', x: 1505, y: 445, w: 230, h: 120 },
    { type: 'circle', x: 4100, y: 1150, r: 120 }, { type: 'circle', x: 6500, y: 430, r: 110 },
  ];
  function rng(seed) { let s = seed; return () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; }; }
  const openCount = () => Math.min(REG.length, FL.Save.data.regions || 1);
  const mapW = () => { const r = REG[openCount() - 1]; return r.x0 + r.w; };
  const regionAt = (x) => { for (let i = REG.length - 1; i >= 0; i--) if (x >= REG[i].x0) return i; return 0; };
  const MUSIC = ['kingdom', 'forest', 'peaks'];

  const scene = {
    px: 1200, py: 960, facing: 1, walking: false, t: 0, cam: { x: 0, y: 0 }, target: null, targetLoc: null, joy: null, near: null, nearGate: null,
    decor: [], flowers: [], critters: [], clouds: [], flakes: [], fx: new A.Particles(), companion: { x: 1130, y: 980 }, idle: 0, hintLoc: null, greeted: false, buttons: [], hold: 0, musicRegion: -1, fireT: 0, balloonX: 300,
    hud: { home: false },
    init() {
      const r = rng(7); this.decor = []; this.flowers = []; this.critters = []; this.clouds = []; this.flakes = [];
      const free = (x, y, d) => LOCS.every((l) => Math.hypot(l.x - x, l.y - y) > d) && REG.every((rg) => Math.hypot(rg.hub.x - x, rg.hub.y - y) > 240) && !(x > 900 && x < 1500 && y < 700) && STATIC_OBS.every((o) => Math.hypot(o.x + (o.w || 0) / 2 - x, o.y + (o.h || 0) / 2 - y) > (o.r || 260) + 60) && GATES.every((g) => Math.abs(g.x - x) > 140) && Math.abs(y - 960) > 110;
      const treeFor = (x) => { const rg = regionAt(x); return rg === 0 ? 'tree' : rg === 1 ? 'pine' : 'snowpine'; };
      // border rows
      for (let x = 120; x < FULL_W - 100; x += 92) { this.decor.push({ k: treeFor(x), x: x + (r() - 0.5) * 30, y: 120 + r() * 50, s: 0.9 + r() * 0.3, v: Math.floor(r() * 3) }); this.decor.push({ k: treeFor(x), x: x + (r() - 0.5) * 30, y: MAP_H - 30 - r() * 40, s: 0.9 + r() * 0.3, v: Math.floor(r() * 3) }); }
      // left edge, region boundaries (with a gap for the gate) and far right edge
      const cols = [110].concat(GATES.map((g) => g.x)).concat([FULL_W - 110]);
      cols.forEach((cx, ci) => { for (let y = 180; y < MAP_H - 120; y += 88) { if (ci > 0 && ci < cols.length - 1 && Math.abs(y - 960) < 210) continue; this.decor.push({ k: treeFor(cx + (ci === 0 ? 0 : 20)), x: cx + (r() - 0.5) * 30, y, s: 0.9 + r() * 0.3, v: Math.floor(r() * 3), boundary: ci > 0 && ci < cols.length - 1 ? ci : 0 }); } });
      // scattered decor per region
      REG.forEach((rg, ri) => {
        let tries = 0, n = 0; while (n < 34 && tries++ < 900) { const x = rg.x0 + 220 + r() * (rg.w - 440), y = 200 + r() * (MAP_H - 400); if (!free(x, y, 230)) continue; n++;
          if (ri === 0) this.decor.push({ k: r() < 0.6 ? 'tree' : 'bush', x, y, s: 0.8 + r() * 0.4, v: Math.floor(r() * 3) });
          else if (ri === 1) this.decor.push(r() < 0.55 ? { k: 'pine', x, y, s: 0.8 + r() * 0.5 } : r() < 0.6 ? { k: 'mushroom', x, y, s: 0.9 + r() * 0.6, c: ['#ef4444', '#f97316', '#a855f7', '#f472b6'][Math.floor(r() * 4)] } : { k: 'emoji', e: ['🌿', '🦉', '🪵', '🌼'][Math.floor(r() * 4)], x, y, s: 40 + r() * 20 });
          else this.decor.push(r() < 0.45 ? { k: 'snowpine', x, y, s: 0.8 + r() * 0.5 } : r() < 0.6 ? { k: 'crystal', x, y, s: 0.8 + r() * 0.7, c: ['#93c5fd', '#c4b5fd', '#f9a8d4', '#99f6e4'][Math.floor(r() * 4)] } : { k: 'emoji', e: ['⛄', '🐧', '❄️', '🪨'][Math.floor(r() * 4)], x, y, s: 44 + r() * 20 }); }
        tries = 0; n = 0; const fl = ri === 0 ? 140 : ri === 1 ? 60 : 30; while (n < fl && tries++ < 2500) { const x = rg.x0 + 120 + r() * (rg.w - 240), y = 130 + r() * (MAP_H - 260); if (!free(x, y, 150)) continue; n++; this.flowers.push({ x, y, c: ri === 2 ? ['#e0f2fe', '#bae6fd', '#c4b5fd'][Math.floor(r() * 3)] : ['#f472b6', '#facc15', '#f87171', '#c084fc', '#fff', '#fb923c'][Math.floor(r() * 6)], s: 0.7 + r() * 0.5, seed: r() * 6, region: ri }); }
        for (let i = 0; i < 8; i++) this.critters.push({ region: ri, x: rg.x0 + 200 + r() * (rg.w - 400), y: 200 + r() * (MAP_H - 400), a: r() * 6, e: ri === 0 ? ['🦋', '🐝', '🐦'][i % 3] : ri === 1 ? ['🦋', '🐦', '🍃'][i % 3] : ['🕊️', '❄️', '🦅'][i % 3], sp: 40 + r() * 40 });
      });
      for (let i = 0; i < 40; i++) this.flakes.push({ x: r() * 2400, y: r() * MAP_H, v: 20 + r() * 30, ph: r() * 6 });
      for (let i = 0; i < 14; i++) this.clouds.push({ x: r() * FULL_W, y: r() * MAP_H, s: 60 + r() * 50 });
      this.inited = true;
    },
    enter(params) {
      if (!this.inited) this.init();
      const g = G(); this.t = 0; this.target = null; this.targetLoc = null; this.joy = null; this.idle = 0; this.hintLoc = null; this.nearGate = null; this.musicRegion = -1;
      GATES.forEach((gt) => { gt.open = openCount() > gt.region ? 1 : 0; });
      if (params && params.at) { const l = LOCS.find((x) => x.id === params.at); if (l) { this.px = l.x; this.py = l.y + 60; } }
      this.companion = { x: this.px - 70, y: this.py + 10 };
      this.cam.x = this.px - g.W / 2; this.cam.y = this.py - g.H / 2; this.clampCam();
      this.layout();
      if (!this.greeted) { this.greeted = true; FL.Game.later(() => { if (G().sceneName === 'world') FL.Audio.say('Tap anywhere to walk. Walk to a sign and tap Play!', { interrupt: false }); }, 2500); }
      const nr = FL.Save.data.newRegion;
      if (nr) { FL.Save.data.newRegion = null; FL.Save.save(); const gt = GATES[nr - 1]; gt.open = 0; this.celebrateGate = gt; FL.Game.later(() => { if (G().sceneName !== 'world') return; UI.toast(`${REG[nr].name} is open!`, '🗺️', '#166534'); FL.Audio.sfx.fanfare(); FL.Audio.say(REG[nr].openLine); this.target = { x: gt.x - 220, y: 960 }; this.targetLoc = null; }, 1500); }
    },
    layout() {
      const g = G();
      this.friendsBtn = new UI.Button({ x: g.W - 110, y: g.H - 110, w: 90, h: 90, emoji: FL.Save.data.companion, color: '#f9a8d4', round: true, emojiSize: 52, onTap: () => UI.showFriends() });
      this.parentBtn = new UI.Button({ x: 18, y: 18, w: 64, h: 64, emoji: '⚙️', color: '#94a3b8', round: true, emojiSize: 32 });
      this.playBtn = new UI.Button({ x: 0, y: 0, w: 230, h: 90, label: 'Play!', emoji: '▶️', color: '#4ade80', size: 40, pulse: true, onTap: () => this.enterLoc(this.near) });
      this.buttons = [this.friendsBtn];
    },
    resize() { this.layout(); },
    clampCam() { const g = G(); this.cam.x = Math.max(0, Math.min(mapW() - g.W, this.cam.x)); this.cam.y = Math.max(0, Math.min(MAP_H - g.H, this.cam.y)); },
    toWorld(p) { return { x: p.x + this.cam.x, y: p.y + this.cam.y }; },
    enterLoc(loc) { if (!loc) return; if (!FL.Save.data.visited.includes(loc.id)) { FL.Save.data.visited.push(loc.id); FL.Save.save(); } FL.Audio.sfx.whoosh(); G().go(loc.scene, { from: loc.id }); },
    openLocs() { const n = openCount(); return LOCS.filter((l) => l.region < n); },
    gateLocked(gt) { return openCount() <= gt.region; },
    down(p) {
      this.idle = 0;
      if (this.near && this.playBtn.contains(p.x, p.y)) { UI.pressDown([this.playBtn], p); return; }
      if (UI.pressDown(this.buttons, p)) return;
      if (this.parentBtn.contains(p.x, p.y)) { p.parent = true; this.hold = 0; return; }
      if (!this.joy) { this.joy = { id: p.id, ox: p.x, oy: p.y, dx: 0, dy: 0, moved: false }; }
    },
    move(p) {
      if (this.joy && p.id === this.joy.id) {
        let dx = p.x - this.joy.ox, dy = p.y - this.joy.oy; const d = Math.hypot(dx, dy);
        if (d > 18) this.joy.moved = true; if (d > 70) { dx *= 70 / d; dy *= 70 / d; }
        this.joy.dx = dx; this.joy.dy = dy; if (this.joy.moved) { this.target = null; this.targetLoc = null; }
      }
    },
    up(p) {
      if (p.button) { UI.pressUp([this.playBtn].concat(this.buttons), p); return; }
      if (p.parent) { if (this.hold >= 1.2) UI.showParent(); else UI.toast('Grown-ups: hold the gear for 2 seconds', '⚙️', '#475569'); p.parent = false; return; }
      if (this.joy && p.id === this.joy.id) {
        if (!this.joy.moved) {
          const w = this.toWorld(p);
          const loc = this.openLocs().find((l) => Math.hypot(l.x - w.x, l.y - w.y) < l.r || (Math.abs(l.x - w.x) < 130 && w.y > l.y - 200 && w.y < l.y + 20));
          const gate = GATES.find((gt) => Math.abs(gt.x - w.x) < 150 && w.y > gt.y - 280 && w.y < gt.y + 40);
          if (loc) { this.target = { x: loc.x, y: loc.y + 50 }; this.targetLoc = loc; FL.Audio.sfx.tap(); }
          else if (gate && this.gateLocked(gate)) { this.target = { x: gate.x - 190, y: 960 }; this.targetLoc = null; this.sayGate(gate); }
          else { this.target = { x: Math.max(90, Math.min(mapW() - 90, w.x)), y: Math.max(110, Math.min(MAP_H - 80, w.y)) }; this.targetLoc = null; }
          this.fx.burst(w.x, w.y, { count: 8, type: 'star', colors: ['#fff', '#fde047'], speed: 120, life: 0.5, size: 8, gravity: 0 });
        }
        this.joy = null;
      }
    },
    sayGate(gate) { const rg = REG[gate.region]; FL.Audio.say(rg.gateHint); },
    key(k) { this.idle = 0; if ((k === 'Enter' || k === ' ') && this.near) this.enterLoc(this.near); if (k === 'f') UI.showFriends(); },
    collide(nx, ny) {
      const W = mapW(); if (nx < 80 || nx > W - 80 || ny < 100 || ny > MAP_H - 70) return true;
      for (const o of STATIC_OBS) { if (o.type === 'rect') { if (nx > o.x - 20 && nx < o.x + o.w + 20 && ny > o.y && ny < o.y + o.h + 10) return true; } else if (Math.hypot(o.x - nx, o.y - ny) < o.r + 14) return true; }
      for (const gt of GATES) { if (Math.abs(nx - gt.x) < 70) { if (this.gateLocked(gt) || gt.open < 0.8 || Math.abs(ny - 960) > 120) return true; } }
      return false;
    },
    update(dt) {
      const g = G(); this.t += dt; this.idle += dt;
      let vx = 0, vy = 0; const k = g.keys;
      if (k.ArrowLeft || k.a) vx -= 1; if (k.ArrowRight || k.d) vx += 1; if (k.ArrowUp || k.w) vy -= 1; if (k.ArrowDown || k.s) vy += 1;
      if (vx || vy) { this.target = null; this.targetLoc = null; this.idle = 0; }
      if (this.joy && this.joy.moved) { vx = this.joy.dx / 70; vy = this.joy.dy / 70; }
      if (this.target) { const dx = this.target.x - this.px, dy = this.target.y - this.py; const d = Math.hypot(dx, dy); if (d < 8) { if (this.targetLoc) { const l = this.targetLoc; this.targetLoc = null; this.target = null; this.enterLoc(l); return; } this.target = null; } else { vx = dx / d; vy = dy / d; } }
      const m = Math.hypot(vx, vy); if (m > 1) { vx /= m; vy /= m; }
      this.walking = m > 0.05;
      if (this.walking) {
        const speed = 300; const nx = this.px + vx * speed * dt, ny = this.py + vy * speed * dt;
        if (!this.collide(nx, this.py)) this.px = nx; else if (this.target) this.target = null;
        if (!this.collide(this.px, ny)) this.py = ny; else if (this.target) this.target = null;
        if (Math.abs(vx) > 0.1) this.facing = vx > 0 ? 1 : -1;
        if (Math.random() < dt * 3) this.fx.burst(this.px - this.facing * 10, this.py, { count: 1, colors: ['rgba(255,255,255,.7)'], speed: 30, life: 0.5, size: 8, gravity: -20 });
        if (g.look.wand && Math.random() < dt * 14) this.fx.burst(this.px + this.facing * 26, this.py - 80, { count: 1, type: 'star', colors: ['#fde047', '#fff', '#f9a8d4'], speed: 40, life: 0.7, size: 9, gravity: -30 });
      }
      const cx = this.px - this.facing * 70, cy = this.py + 12; this.companion.x += (cx - this.companion.x) * Math.min(1, dt * 4); this.companion.y += (cy - this.companion.y) * Math.min(1, dt * 4);
      this.cam.x += (this.px - g.W / 2 - this.cam.x) * Math.min(1, dt * 5); this.cam.y += (this.py - g.H / 2 - this.cam.y) * Math.min(1, dt * 5); this.clampCam();
      const prev = this.near; this.near = this.openLocs().find((l) => Math.hypot(l.x - this.px, l.y - this.py) < l.r) || null;
      if (this.near && this.near !== prev) { FL.Audio.sfx.sparkle(); FL.Audio.say(`${this.near.name}! ${this.near.hint}`); }
      if (this.near) { this.playBtn.x = this.near.x - this.cam.x - 115; this.playBtn.y = this.near.y - this.cam.y - 260; }
      const pg = this.nearGate; this.nearGate = GATES.find((gt) => this.gateLocked(gt) && Math.hypot(gt.x - this.px, gt.y - this.py) < 260) || null;
      if (this.nearGate && this.nearGate !== pg) this.sayGate(this.nearGate);
      GATES.forEach((gt) => { const want = this.gateLocked(gt) ? 0 : 1; if (this.celebrateGate === gt && this.t < 3) return; gt.open += (want - gt.open) * Math.min(1, dt * 1.5); });
      const rgn = regionAt(this.px); if (rgn !== this.musicRegion) { this.musicRegion = rgn; FL.Audio.music.play(MUSIC[rgn]); }
      for (const p of g.pointers.values()) if (p.parent) this.hold += dt;
      this.critters.forEach((b) => { b.a += (Math.random() - 0.5) * dt * 3; b.x += Math.cos(b.a) * b.sp * dt; b.y += Math.sin(b.a) * b.sp * dt; const rg = REG[b.region]; if (b.x < rg.x0 + 120 || b.x > rg.x0 + rg.w - 120 || b.y < 100 || b.y > MAP_H - 100) b.a += Math.PI; });
      this.clouds.forEach((c) => { c.x += 14 * dt; if (c.x > FULL_W + 200) c.x = -200; });
      this.flakes.forEach((f) => { f.y += f.v * dt; f.x += Math.sin(this.t + f.ph) * 20 * dt; if (f.y > MAP_H) f.y = 0; });
      this.balloonX += 25 * dt; if (this.balloonX > mapW() + 200) this.balloonX = -200;
      if (FL.Save.has('decor', 'fireworks')) { this.fireT -= dt; if (this.fireT <= 0) { this.fireT = 2.5 + Math.random() * 2; this.fx.burst(this.cam.x + 100 + Math.random() * (g.W - 200), this.cam.y + 80 + Math.random() * 200, { count: 40, type: 'star', colors: [['#fde047', '#fff'], ['#f472b6', '#fff'], ['#60a5fa', '#fff'], ['#4ade80', '#fff']][Math.floor(Math.random() * 4)], speed: 260, life: 1.3, size: 9, gravity: 120 }); } }
      this.fx.update(dt);
      if (this.idle > 14) { this.idle = 0; const ol = this.openLocs(); const l = ol.find((x) => !FL.Save.data.visited.includes(x.id)) || ol[Math.floor(Math.random() * ol.length)]; this.hintLoc = l; this.hintT = 4; FL.Audio.say(`Let's go to the ${l.name}!`); }
      if (this.hintT > 0) { this.hintT -= dt; if (this.hintT <= 0) this.hintLoc = null; }
      this.friendsBtn.emoji = FL.Save.data.companion;
    },
    drawLandmark(ctx, l, t) {
      switch (l.id) {
        case 'rhyme': A.tree(ctx, l.x, l.y - 150, 1.7, 2, t); A.emoji(ctx, '🎶', l.x + 60, l.y - 330 + Math.sin(t * 2) * 8, 40); break;
        case 'spelling': ctx.fillStyle = '#92400e'; A.ellipse(ctx, l.x, l.y - 160, 70, 28); ctx.fill(); ctx.fillRect(l.x - 70, l.y - 160, 140, 60); A.ellipse(ctx, l.x, l.y - 100, 70, 28); ctx.fill(); ctx.fillStyle = '#d97706'; A.ellipse(ctx, l.x, l.y - 160, 58, 20); ctx.fill(); 'ABC'.split('').forEach((c, i) => A.text(ctx, c, l.x - 30 + i * 30, l.y - 162 + Math.sin(t * 3 + i) * 3, { size: 24, color: '#7c2d12' })); A.emoji(ctx, '🌰', l.x - 90, l.y - 110, 34); A.emoji(ctx, '🌰', l.x + 95, l.y - 105, 30); break;
        case 'owlmath': A.tree(ctx, l.x, l.y - 150, 1.5, 0, t); A.emoji(ctx, '🦉', l.x, l.y - 290, 60); A.text(ctx, '2 + 1', l.x - 90, l.y - 330 + Math.sin(t * 2) * 6, { size: 30, color: '#fff', stroke: '#166534' }); break;
        case 'echo': ctx.fillStyle = '#334155'; ctx.beginPath(); ctx.moveTo(l.x - 160, l.y - 150); ctx.quadraticCurveTo(l.x, l.y - 360, l.x + 160, l.y - 150); ctx.closePath(); ctx.fill(); ctx.fillStyle = '#0f172a'; ctx.beginPath(); ctx.moveTo(l.x - 80, l.y - 150); ctx.quadraticCurveTo(l.x, l.y - 290, l.x + 80, l.y - 150); ctx.closePath(); ctx.fill(); A.mushroom(ctx, l.x - 120, l.y - 150, 1.2, '#a855f7', t); A.mushroom(ctx, l.x + 125, l.y - 150, 1, '#f472b6', t); ctx.fillStyle = `rgba(167,139,250,${0.4 + Math.sin(t * 3) * 0.3})`; A.circle(ctx, l.x, l.y - 200, 14); ctx.fill(); break;
        case 'clock': A.cloud(ctx, l.x, l.y - 190, 46, 1); ctx.fillStyle = '#fff'; ctx.strokeStyle = '#64748b'; ctx.lineWidth = 6; A.circle(ctx, l.x, l.y - 200, 58); ctx.fill(); ctx.stroke(); ctx.strokeStyle = '#1e293b'; ctx.lineWidth = 6; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(l.x, l.y - 200); ctx.lineTo(l.x, l.y - 240); ctx.moveTo(l.x, l.y - 200); ctx.lineTo(l.x + Math.cos(t) * 36, l.y - 200 + Math.sin(t) * 36); ctx.stroke(); break;
        case 'reading': ctx.fillStyle = '#94a3b8'; ctx.strokeStyle = '#475569'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(l.x - 130, l.y - 140); ctx.quadraticCurveTo(l.x - 100, l.y - 280, l.x, l.y - 270); ctx.quadraticCurveTo(l.x + 120, l.y - 290, l.x + 130, l.y - 140); ctx.closePath(); ctx.fill(); ctx.stroke(); A.emoji(ctx, '📖', l.x, l.y - 215, 64); A.text(ctx, 'cat', l.x - 70, l.y - 300 + Math.sin(t * 2) * 5, { size: 28, color: '#fff', stroke: '#1e293b' }); break;
        case 'numberline': for (let i = 0; i < 5; i++) { A.crystal(ctx, l.x - 120 + i * 60, l.y - 140 - i * 22, 0.7 + i * 0.12, ['#93c5fd', '#c4b5fd', '#f9a8d4', '#99f6e4', '#fde68a'][i], t); A.text(ctx, String(i + 1), l.x - 120 + i * 60, l.y - 200 - i * 30, { size: 26, color: '#1e3a8a', stroke: '#fff' }); } break;
        case 'drums': ctx.fillStyle = '#94a3b8'; A.ellipse(ctx, l.x, l.y - 150, 150, 40); ctx.fill(); A.emoji(ctx, '🐲', l.x, l.y - 230 + Math.abs(Math.sin(t * 4)) * -8, 90); A.emoji(ctx, '🥁', l.x - 110, l.y - 175, 54); A.emoji(ctx, '🪘', l.x + 110, l.y - 175, 50); break;
        default: break;
      }
    },
    draw(ctx) {
      const g = G(); const t = this.t; const cx = this.cam.x, cy = this.cam.y; const open = openCount();
      // ground per region
      REG.forEach((rg, ri) => { if (ri >= open) return; const gg = ctx.createLinearGradient(0, 0, 0, g.H); gg.addColorStop(0, rg.ground[0]); gg.addColorStop(1, rg.ground[1]); ctx.fillStyle = gg; ctx.fillRect(rg.x0 - cx, 0, rg.w, g.H); if (ri > 0) { const bg = ctx.createLinearGradient(rg.x0 - 160 - cx, 0, rg.x0 + 60 - cx, 0); bg.addColorStop(0, 'rgba(0,0,0,0)'); bg.addColorStop(1, rg.ground[1]); ctx.fillStyle = bg; ctx.fillRect(rg.x0 - 160 - cx, 0, 220, g.H); } });
      ctx.save(); ctx.translate(-cx, -cy);
      ctx.fillStyle = 'rgba(255,255,255,.08)'; for (let i = 0; i < 120; i++) { const x = (i * 613) % FULL_W, y = (i * 389) % MAP_H; if (x > cx - 200 && x < cx + g.W + 200 && y > cy - 200 && y < cy + g.H + 200) { A.ellipse(ctx, x, y, 120, 60); ctx.fill(); } }
      // paths
      ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      REG.forEach((rg, ri) => {
        if (ri >= open) return; const hub = rg.hub;
        const seg = (w, c) => { ctx.strokeStyle = c; ctx.lineWidth = w; LOCS.filter((l) => l.region === ri).forEach((l) => { ctx.beginPath(); ctx.moveTo(hub.x, hub.y); const mx = (hub.x + l.x) / 2 + (l.y - hub.y) * 0.25, my = (hub.y + l.y) / 2 - (l.x - hub.x) * 0.25; ctx.quadraticCurveTo(mx, my, l.x, l.y + 40); ctx.stroke(); }); ctx.beginPath(); ctx.moveTo(ri > 0 ? rg.x0 - 60 : hub.x, 960); ctx.lineTo(ri < REG.length - 1 ? rg.x0 + rg.w + 60 : hub.x, 960); ctx.stroke(); };
        seg(84, rg.path[0]); seg(68, rg.path[1]);
        ctx.fillStyle = rg.path[1]; A.circle(ctx, hub.x, hub.y, 120); ctx.fill(); ctx.strokeStyle = rg.path[0]; ctx.lineWidth = 8; ctx.stroke();
        if (!(ri === 0 && FL.Save.has('decor', 'fountain'))) { ctx.fillStyle = '#fde68a'; A.starPath(ctx, hub.x, hub.y, 46, 20, 5); ctx.fill(); ctx.strokeStyle = '#f59e0b'; ctx.lineWidth = 4; ctx.stroke(); }
      });
      // kingdom set pieces
      A.pond(ctx, 1980, 470, 190, 120, t); A.rainbow(ctx, 470, 1140, 200, 16, 0.8);
      ctx.fillStyle = '#a16207'; A.roundRect(ctx, 250, 380, 360, 130, 30); ctx.fill(); ctx.fillStyle = '#ca8a04'; A.roundRect(ctx, 262, 392, 336, 106, 24); ctx.fill();
      'ABCDEF'.split('').forEach((ch, i) => { A.bigFlower(ctx, 300 + i * 56, 440 + Math.sin(t * 2 + i) * 4, 26, ['#f472b6', '#60a5fa', '#facc15', '#c084fc', '#fb923c', '#f87171'][i]); A.text(ctx, ch, 300 + i * 56, 441 + Math.sin(t * 2 + i) * 4, { size: 22, color: '#7c2d12' }); });
      ctx.fillStyle = '#7dd3fc'; A.roundRect(ctx, 960, 1470, 480, 90, 45); ctx.fill(); ctx.fillStyle = '#bae6fd'; A.roundRect(ctx, 980, 1485, 440, 30, 15); ctx.fill();
      ['🐻', '🐰', '🐻', '🐰', '❓'].forEach((e, i) => { ctx.fillStyle = '#e7e5e4'; A.circle(ctx, 1040 + i * 80, 1515, 32); ctx.fill(); ctx.strokeStyle = '#a8a29e'; ctx.lineWidth = 3; ctx.stroke(); A.emoji(ctx, e, 1040 + i * 80, 1513, 34); });
      if (open > 1) { ctx.fillStyle = '#1e3a8a'; A.ellipse(ctx, 3600, 520, 220, 90); ctx.fill(); ctx.fillStyle = '#3b82f6'; A.ellipse(ctx, 3600, 512, 200, 76); ctx.fill(); A.emoji(ctx, '🦆', 3600 + Math.cos(t * 0.4) * 120, 512 + Math.sin(t * 0.4) * 40, 34, { flip: Math.sin(t * 0.4) > 0 }); A.emoji(ctx, '🪷', 3500, 540, 30); }
      this.flowers.forEach((f) => { if (f.region < open && f.x > cx - 60 && f.x < cx + g.W + 60 && f.y > cy - 60 && f.y < cy + g.H + 60) A.flower(ctx, f.x, f.y, f.s, f.c, t, f.seed); });
      if (this.target) { ctx.strokeStyle = 'rgba(255,255,255,.8)'; ctx.lineWidth = 4; A.ellipse(ctx, this.target.x, this.target.y, 24 + Math.sin(t * 6) * 4, 10 + Math.sin(t * 6) * 2); ctx.stroke(); }
      // depth-sorted objects
      const items = []; const vis = (x, y) => x > cx - 200 && x < cx + g.W + 200 && y > cy - 50 && y < cy + g.H + 300;
      this.decor.forEach((d) => { if (!vis(d.x, d.y)) return; if (d.boundary && d.boundary > open) return; if (regionAt(d.x) >= open && !d.boundary) return; items.push({ y: d.y, f: () => { if (d.k === 'tree') A.tree(ctx, d.x, d.y, d.s, d.v, t); else if (d.k === 'bush') A.bush(ctx, d.x, d.y, d.s); else if (d.k === 'pine') A.pine(ctx, d.x, d.y, d.s, false, t); else if (d.k === 'snowpine') A.pine(ctx, d.x, d.y, d.s, true, t); else if (d.k === 'mushroom') A.mushroom(ctx, d.x, d.y, d.s, d.c, t); else if (d.k === 'crystal') A.crystal(ctx, d.x, d.y, d.s, d.c, t); else if (d.k === 'emoji') { ctx.fillStyle = 'rgba(0,0,0,.12)'; A.ellipse(ctx, d.x, d.y, d.s * 0.4, d.s * 0.14); ctx.fill(); A.emoji(ctx, d.e, d.x, d.y - d.s * 0.45, d.s); } } }); });
      items.push({ y: 640, f: () => A.castle(ctx, 1200, 640, 1.05, t) });
      items.push({ y: 1160, f: () => A.gazebo(ctx, 1930, 1160, 1, t) });
      items.push({ y: 562, f: () => A.studio(ctx, 1620, 560, 1, t) });
      if (FL.Save.has('decor', 'fountain')) items.push({ y: 962, f: () => A.fountain(ctx, 1200, 962, 0.9, t) });
      GATES.forEach((gt) => { if (gt.region > open) return; items.push({ y: gt.y, f: () => { A.gate(ctx, gt.x, gt.y, gt.open, t); if (this.gateLocked(gt)) { const need = D.FRIENDS.filter((f) => f[3] === gt.region - 1); const have = need.filter((f) => FL.Save.data.unlocked.includes(f[0])).length; const b = Math.abs(Math.sin(t * 3)) * 6; ctx.fillStyle = 'rgba(255,255,255,.92)'; A.roundRect(ctx, gt.x - 150, gt.y - 330 - b, 300, 70, 30); ctx.fill(); ctx.strokeStyle = '#f59e0b'; ctx.lineWidth = 4; ctx.stroke(); A.text(ctx, `${REG[gt.region].name}`, gt.x, gt.y - 310 - b, { size: 22, color: '#7c2d12' }); A.text(ctx, `${have} / ${need.length} friends`, gt.x, gt.y - 282 - b, { size: 22, color: '#b45309' }); need.forEach((f, i) => A.emoji(ctx, f[0], gt.x - (need.length - 1) * 16 + i * 32, gt.y - 245, 26, { alpha: FL.Save.data.unlocked.includes(f[0]) ? 1 : 0.25 })); } } }); });
      this.openLocs().forEach((l) => { if (!vis(l.x, l.y)) return; const isNear = this.near === l; const hint = this.hintLoc === l; const b = isNear || hint ? Math.abs(Math.sin(t * 6)) * 12 : 0; if (l.region > 0) items.push({ y: l.y - 140, f: () => this.drawLandmark(ctx, l, t) }); items.push({ y: l.y, f: () => A.sign(ctx, l.x, l.y, l.emoji, l.name, { bounce: b, glow: isNear ? 0.5 + Math.sin(t * 6) * 0.4 : hint ? 0.7 : 0, scale: 1 }) }); if (isNear || hint) items.push({ y: l.y - 1, f: () => { ctx.strokeStyle = 'rgba(255,255,255,.7)'; ctx.lineWidth = 5; ctx.setLineDash([16, 14]); ctx.lineDashOffset = -t * 40; A.ellipse(ctx, l.x, l.y + 30, l.r, l.r * 0.45); ctx.stroke(); ctx.setLineDash([]); } }); });
      items.push({ y: this.py, f: () => A.princess(ctx, this.px, this.py, g.look, { t, walking: this.walking, facing: this.facing, wave: !this.walking && this.idle > 3 && this.idle < 5 }, 1) });
      items.push({ y: this.companion.y, f: () => { const hop = Math.abs(Math.sin(t * 8)) * (this.walking ? 14 : 3); ctx.fillStyle = 'rgba(0,0,0,.15)'; A.ellipse(ctx, this.companion.x, this.companion.y, 22, 8); ctx.fill(); A.emoji(ctx, FL.Save.data.companion, this.companion.x, this.companion.y - 28 - hop, 56, { flip: this.facing < 0 }); } });
      this.critters.forEach((b) => { if (b.region < open && vis(b.x, b.y)) items.push({ y: 99999, f: () => A.emoji(ctx, b.e, b.x, b.y + Math.sin(t * 10 + b.a) * 6, 30, { flip: Math.cos(b.a) < 0, scale: 0.7 + Math.abs(Math.sin(t * 14)) * 0.3 }) }); });
      items.sort((a, b) => a.y - b.y).forEach((i) => i.f());
      // fireflies (forest) and snow (peaks)
      if (open > 1) { for (let i = 0; i < 30; i++) { const x = 2500 + ((i * 331 + t * 12 * (1 + (i % 3))) % 2200), y = 200 + ((i * 197 + Math.sin(t + i) * 40) % 1300); if (!vis(x, y)) continue; ctx.fillStyle = `rgba(253,224,71,${0.35 + Math.sin(t * 4 + i) * 0.3})`; ctx.shadowColor = '#fde047'; ctx.shadowBlur = 10; A.circle(ctx, x, y, 3); ctx.fill(); ctx.shadowBlur = 0; } }
      if (open > 2) this.flakes.forEach((f) => { const x = 4800 + f.x; if (vis(x, f.y)) { ctx.fillStyle = 'rgba(255,255,255,.85)'; A.circle(ctx, x, f.y, 3); ctx.fill(); } });
      this.fx.draw(ctx);
      if (FL.Save.has('decor', 'balloon')) A.balloon(ctx, this.balloonX, 260 + Math.sin(t * 0.5) * 20, 0.8, t);
      this.clouds.forEach((c) => { if (!vis(c.x, c.y)) return; ctx.save(); ctx.globalAlpha = 0.1; ctx.fillStyle = '#000'; A.cloud(ctx, c.x + 40, c.y + 60, c.s, 0.15); ctx.restore(); A.cloud(ctx, c.x, c.y, c.s, 0.55); });
      ctx.restore();
      // joystick, prompt, HUD
      if (this.joy && this.joy.moved) { ctx.fillStyle = 'rgba(255,255,255,.3)'; A.circle(ctx, this.joy.ox, this.joy.oy, 78); ctx.fill(); ctx.strokeStyle = 'rgba(255,255,255,.7)'; ctx.lineWidth = 4; ctx.stroke(); ctx.fillStyle = 'rgba(255,255,255,.85)'; A.circle(ctx, this.joy.ox + this.joy.dx, this.joy.oy + this.joy.dy, 38); ctx.fill(); }
      if (this.near) this.playBtn.draw(ctx, t);
      const name = FL.Save.data.name; if (name) A.text(ctx, `Princess ${name}`, this.px - cx, this.py - cy - 175, { size: 22, color: '#fff', stroke: 'rgba(80,20,90,.6)' });
      this.buttons.forEach((b) => b.draw(ctx, t)); this.parentBtn.draw(ctx, t);
      if (this.hold > 0 && this.hold < 1.2) { ctx.strokeStyle = '#fde047'; ctx.lineWidth = 6; ctx.beginPath(); ctx.arc(50, 50, 38, -Math.PI / 2, -Math.PI / 2 + (this.hold / 1.2) * Math.PI * 2); ctx.stroke(); }
      // next reward pill
      const nu = UI.nextUnlock(); if (nu) { const s = FL.Save.data.stars; const prev = UI.prevThreshold(); const frac = Math.max(0, Math.min(1, (s - prev) / Math.max(1, nu.stars - prev))); const w = 190, h = 54, x = g.W - w - 20, y = 96; ctx.fillStyle = 'rgba(0,0,0,.35)'; A.roundRect(ctx, x, y, w, h, 27); ctx.fill(); A.emoji(ctx, nu.emoji, x + 30, y + h / 2, 32); A.text(ctx, `in ${Math.max(0, nu.stars - s)} ⭐`, x + 120, y + 18, { size: 20, color: '#fff' }); ctx.fillStyle = 'rgba(255,255,255,.3)'; A.roundRect(ctx, x + 60, y + 34, w - 76, 10, 5); ctx.fill(); ctx.fillStyle = '#fde047'; A.roundRect(ctx, x + 60, y + 34, (w - 76) * frac, 10, 5); ctx.fill(); }
      if (!FL.Save.data.visited.length && this.t < 30) { const l = LOCS[0]; const sx = l.x - cx, sy = l.y - cy - 190 - Math.abs(Math.sin(t * 4)) * 20; if (sx > 0 && sx < g.W && sy > 0) A.emoji(ctx, '👇', sx, sy, 70); }
    },
  };
  scene.hud = { home: false }; scene.music = 'kingdom';
  FL.scenes.world = scene;
  FL.WORLD_LOCS = LOCS;
})();
