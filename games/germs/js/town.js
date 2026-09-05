// Sunnyville: a single-screen town. Tap a place and the hero walks there.
(function () {
  const A = FL.Art, UI = FL.UI, G = () => FL.Game, D = FL.Data;
  const scene = {
    music: 'town', hud: { home: false }, t: 0, px: 0, py: 0, facing: 1, walking: false, target: null, targetLoc: null, near: null, fx: new A.Particles(), companion: { x: 0, y: 0 }, greeted: false, idle: 0, hold: 0, fireT: 0, birds: [],
    enter(params) {
      const g = G(); this.t = 0; this.target = null; this.targetLoc = null; this.idle = 0;
      const start = params && params.at ? this.loc(params.at) : null; this.px = start ? start.x : g.W / 2; this.py = start ? start.y + 70 : g.H * 0.64;
      this.companion = { x: this.px - 60, y: this.py + 10 }; this.layout();
      if (!this.birds.length) for (let i = 0; i < 5; i++) this.birds.push({ x: Math.random() * g.W, y: 80 + Math.random() * 120, v: 20 + Math.random() * 20, e: ['🐦', '🦋', '🐝'][i % 3] });
      if (!this.greeted) { this.greeted = true; FL.Game.later(() => { if (G().sceneName === 'town') FL.Audio.say('Tap a place to go there. Let\'s start at the Wash Station!', { interrupt: false }); }, 2500); }
    },
    loc(id) { const l = D.LOCS.find((x) => x.id === id); const g = G(); return l ? { x: l.x * g.W, y: l.y * g.H, l } : null; },
    locs() { const g = G(); return D.LOCS.map((l) => ({ l, x: l.x * g.W, y: l.y * g.H })); },
    layout() {
      const g = G();
      this.gearBtn = new UI.Button({ x: g.W - 110, y: g.H - 110, w: 90, h: 90, emoji: FL.Save.data.companion, color: '#bae6fd', round: true, emojiSize: 52, onTap: () => UI.showGear() });
      this.parentBtn = new UI.Button({ x: 18, y: 18, w: 64, h: 64, emoji: '⚙️', color: '#94a3b8', round: true, emojiSize: 32 });
      this.playBtn = new UI.Button({ x: 0, y: 0, w: 230, h: 90, label: 'Play!', emoji: '▶️', color: '#4ade80', size: 40, pulse: true, onTap: () => this.enterLoc(this.near) });
    },
    resize() { this.layout(); },
    enterLoc(L) { if (!L) return; if (!FL.Save.data.visited.includes(L.l.id)) { FL.Save.data.visited.push(L.l.id); FL.Save.save(); } FL.Audio.sfx.whoosh(); G().go(L.l.scene, { from: L.l.id }); },
    down(p) { this.idle = 0; if (this.near && this.playBtn.contains(p.x, p.y)) { UI.pressDown([this.playBtn], p); return; } if (UI.pressDown([this.gearBtn], p)) return; if (this.parentBtn.contains(p.x, p.y)) { p.parent = true; this.hold = 0; return; } p.tap = true; },
    up(p) {
      if (p.button) { UI.pressUp([this.playBtn, this.gearBtn], p); return; }
      if (p.parent) { if (this.hold >= 1.2) UI.showParent(); else UI.toast('Grown-ups: hold the gear for 2 seconds', '⚙️', '#475569'); return; }
      if (!p.tap) return; const g = G();
      const hit = this.locs().find((L) => Math.hypot(L.x - p.x, L.y - p.y) < 120 || (Math.abs(L.x - p.x) < 120 && p.y > L.y - 220 && p.y < L.y + 40));
      if (hit) { this.target = { x: hit.x, y: hit.y + 60 }; this.targetLoc = hit; FL.Audio.sfx.tap(); }
      else { this.target = { x: Math.max(60, Math.min(g.W - 60, p.x)), y: Math.max(g.H * 0.3, Math.min(g.H - 40, p.y)) }; this.targetLoc = null; }
      this.fx.burst(p.x, p.y, { count: 8, type: 'star', colors: ['#fff', '#fde047'], speed: 120, life: 0.5, size: 8, gravity: 0 });
    },
    key(k) { if ((k === 'Enter' || k === ' ') && this.near) this.enterLoc(this.near); },
    update(dt) {
      const g = G(); this.t += dt; this.idle += dt; let vx = 0, vy = 0; const k = g.keys;
      if (k.ArrowLeft || k.a) vx -= 1; if (k.ArrowRight || k.d) vx += 1; if (k.ArrowUp || k.w) vy -= 1; if (k.ArrowDown || k.s) vy += 1; if (vx || vy) { this.target = null; this.targetLoc = null; }
      if (this.target) { const dx = this.target.x - this.px, dy = this.target.y - this.py; const d = Math.hypot(dx, dy); if (d < 8) { if (this.targetLoc) { const L = this.targetLoc; this.targetLoc = null; this.target = null; this.enterLoc(L); return; } this.target = null; } else { vx = dx / d; vy = dy / d; } }
      const m = Math.hypot(vx, vy); if (m > 1) { vx /= m; vy /= m; } this.walking = m > 0.05;
      if (this.walking) { this.px = Math.max(40, Math.min(g.W - 40, this.px + vx * 300 * dt)); this.py = Math.max(g.H * 0.28, Math.min(g.H - 30, this.py + vy * 300 * dt)); if (Math.abs(vx) > 0.1) this.facing = vx > 0 ? 1 : -1; }
      const cx = this.px - this.facing * 60, cy = this.py + 10; this.companion.x += (cx - this.companion.x) * Math.min(1, dt * 4); this.companion.y += (cy - this.companion.y) * Math.min(1, dt * 4);
      const prevL = this.near ? this.near.l : null; this.near = this.locs().find((L) => Math.hypot(L.x - this.px, L.y - this.py) < 130) || null;
      if (this.near && this.near.l !== prevL) { FL.Audio.sfx.sparkle(); FL.Audio.say(`${this.near.l.name}! ${this.near.l.hint}`); }
      if (this.near) { this.playBtn.x = Math.max(20, Math.min(g.W - 250, this.near.x - 115)); this.playBtn.y = Math.max(150, this.near.y - 260); }
      for (const p of g.pointers.values()) if (p.parent) this.hold += dt;
      this.birds.forEach((b) => { b.x += b.v * dt; if (b.x > g.W + 40) b.x = -40; });
      if (FL.Save.has('decor', 'fireworks')) { this.fireT -= dt; if (this.fireT <= 0) { this.fireT = 2.5 + Math.random() * 2; this.fx.burst(100 + Math.random() * (g.W - 200), 80 + Math.random() * 150, { count: 40, type: 'star', colors: ['#fde047', '#f472b6', '#60a5fa', '#fff'], speed: 260, life: 1.3, size: 9, gravity: 120 }); } }
      this.fx.update(dt);
      if (this.idle > 14) { this.idle = 0; const ls = this.locs(); const L = ls.find((x) => !FL.Save.data.visited.includes(x.l.id)) || ls[Math.floor(Math.random() * ls.length)]; this.hint = L; this.hintT = 4; FL.Audio.say(`Let's go to the ${L.l.name}!`); }
      if (this.hintT > 0) { this.hintT -= dt; if (this.hintT <= 0) this.hint = null; }
      this.gearBtn.emoji = FL.Save.data.companion;
    },
    draw(ctx) {
      const g = G(); const t = this.t;
      A.sky(ctx, g.W, g.H, '#7dd3fc', '#e0f2fe'); A.sun(ctx, g.W * 0.62, 78, 40, t);
      A.cloud(ctx, 200 + Math.sin(t * 0.3) * 30, 110, 34, 0.9); A.cloud(ctx, g.W * 0.55, 70, 28, 0.85);
      A.hills(ctx, g.W, g.H, g.H * 0.26, '#bbf7d0', 2); A.grass(ctx, g.W, g.H, g.H * 0.3, '#86efac', '#4ade80');
      // roads
      ctx.strokeStyle = '#d6d3d1'; ctx.lineWidth = 70; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(60, g.H * 0.62); ctx.lineTo(g.W - 60, g.H * 0.62); ctx.stroke(); ctx.beginPath(); ctx.moveTo(g.W * 0.45, g.H * 0.62); ctx.lineTo(g.W * 0.45, g.H - 40); ctx.stroke();
      ctx.strokeStyle = '#fef3c7'; ctx.lineWidth = 6; ctx.setLineDash([30, 26]); ctx.beginPath(); ctx.moveTo(60, g.H * 0.62); ctx.lineTo(g.W - 60, g.H * 0.62); ctx.stroke(); ctx.setLineDash([]);
      this.birds.forEach((b) => A.emoji(ctx, b.e, b.x, b.y + Math.sin(t * 6 + b.x) * 6, 30));
      const items = []; const L = this.locs();
      L.forEach(({ l, x, y }) => {
        const isNear = this.near && this.near.l === l; const hint = this.hint && this.hint.l === l; const b = isNear || hint ? Math.abs(Math.sin(t * 6)) * 12 : 0;
        items.push({ y: y - 1, f: () => {
          if (l.id === 'wash') A.building(ctx, x, y - 100, 190, 130, { wall: '#bfdbfe', roof: '#2563eb', sign: '🛁' });
          else if (l.id === 'teeth') A.building(ctx, x, y - 100, 180, 140, { wall: '#fce7f3', roof: '#db2777', sign: '🦷' });
          else if (l.id === 'kitchen') A.building(ctx, x, y - 100, 210, 130, { wall: '#fef3c7', roof: '#f59e0b', sign: '🍽️' });
          else if (l.id === 'lab') A.building(ctx, x, y - 100, 190, 140, { wall: '#f1f5f9', roof: '#0f766e', sign: '🔬' });
          else if (l.id === 'sneeze') { ctx.fillStyle = 'rgba(0,0,0,.12)'; A.ellipse(ctx, x, y - 96, 150, 20); ctx.fill(); A.emoji(ctx, '🛝', x - 60, y - 150, 120); A.emoji(ctx, '🌳', x + 110, y - 160, 110); A.emoji(ctx, '⚽', x + 20, y - 110, 36); }
          else if (l.id === 'defend') { ctx.fillStyle = '#fbcfe8'; ctx.strokeStyle = '#be185d'; ctx.lineWidth = 5; A.circle(ctx, x, y - 150, 60); ctx.fill(); ctx.stroke(); A.roundRect(ctx, x - 70, y - 100, 140, 120, 40); ctx.fill(); ctx.stroke(); ctx.fillStyle = '#f472b6'; A.heartPath(ctx, x - 25, y - 50, 16); ctx.fill(); ctx.fillStyle = '#7c3aed'; A.roundRect(ctx, x - 20, y - 40, 40, 56, 10); ctx.fill(); ctx.strokeStyle = '#4c1d95'; ctx.lineWidth = 3; ctx.stroke(); A.emoji(ctx, '🛡️', x + 30, y - 60, 40); ctx.fillStyle = '#1e293b'; A.circle(ctx, x - 18, y - 158, 5); ctx.fill(); A.circle(ctx, x + 18, y - 158, 5); ctx.fill(); ctx.strokeStyle = '#9f1239'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(x, y - 140, 14, 0.15 * Math.PI, 0.85 * Math.PI); ctx.stroke(); }
        } });
        items.push({ y: y + 2, f: () => A.sign(ctx, x, y + 40, l.emoji, l.name, { bounce: b, glow: isNear ? 0.5 + Math.sin(t * 6) * 0.4 : hint ? 0.7 : 0, scale: 0.85 }) });
        if (isNear || hint) items.push({ y: y + 1, f: () => { ctx.strokeStyle = 'rgba(255,255,255,.75)'; ctx.lineWidth = 5; ctx.setLineDash([16, 14]); ctx.lineDashOffset = -t * 40; A.ellipse(ctx, x, y + 60, 120, 50); ctx.stroke(); ctx.setLineDash([]); } });
      });
      if (FL.Save.has('decor', 'flag')) items.push({ y: g.H * 0.31, f: () => { ctx.fillStyle = '#78350f'; ctx.fillRect(g.W * 0.5 - 3, g.H * 0.31 - 160, 6, 160); ctx.fillStyle = '#4ade80'; ctx.beginPath(); ctx.moveTo(g.W * 0.5 + 3, g.H * 0.31 - 160); ctx.quadraticCurveTo(g.W * 0.5 + 40, g.H * 0.31 - 150 + Math.sin(t * 6) * 6, g.W * 0.5 + 80, g.H * 0.31 - 140); ctx.lineTo(g.W * 0.5 + 3, g.H * 0.31 - 120); ctx.closePath(); ctx.fill(); A.emoji(ctx, '🧼', g.W * 0.5 + 40, g.H * 0.31 - 142, 24); } });
      if (FL.Save.has('decor', 'statue')) items.push({ y: g.H * 0.6, f: () => { ctx.fillStyle = '#a8a29e'; A.roundRect(ctx, g.W * 0.45 - 40, g.H * 0.6 - 40, 80, 40, 8); ctx.fill(); A.hero(ctx, g.W * 0.45, g.H * 0.6 - 40, { skin: '#d6d3d1', hair: '#a8a29e', hairStyle: 'spiky', cape: '#d6d3d1', capeDark: '#a8a29e', shirt: '#e7e5e4' }, { t: 0, cheer: true }, 0.8); } });
      items.push({ y: this.py, f: () => A.hero(ctx, this.px, this.py, g.look, { t, walking: this.walking, facing: this.facing, wave: !this.walking && this.idle > 3 && this.idle < 5 }, 1) });
      items.push({ y: this.companion.y, f: () => { const hop = Math.abs(Math.sin(t * 8)) * (this.walking ? 14 : 3); ctx.fillStyle = 'rgba(0,0,0,.15)'; A.ellipse(ctx, this.companion.x, this.companion.y, 22, 8); ctx.fill(); A.emoji(ctx, FL.Save.data.companion, this.companion.x, this.companion.y - 28 - hop, 56, { flip: this.facing < 0 }); } });
      items.sort((a, b) => a.y - b.y).forEach((i) => i.f());
      this.fx.draw(ctx);
      if (this.target) { ctx.strokeStyle = 'rgba(255,255,255,.8)'; ctx.lineWidth = 4; A.ellipse(ctx, this.target.x, this.target.y, 24 + Math.sin(t * 6) * 4, 10 + Math.sin(t * 6) * 2); ctx.stroke(); }
      if (this.near) this.playBtn.draw(ctx, t);
      const name = FL.Save.data.name; if (name) A.text(ctx, `Captain ${name}`, this.px, this.py - 175, { size: 22, color: '#fff', stroke: 'rgba(12,74,110,.6)' });
      this.gearBtn.draw(ctx, t); this.parentBtn.draw(ctx, t);
      if (this.hold > 0 && this.hold < 1.2) { ctx.strokeStyle = '#fde047'; ctx.lineWidth = 6; ctx.beginPath(); ctx.arc(50, 50, 38, -Math.PI / 2, -Math.PI / 2 + (this.hold / 1.2) * Math.PI * 2); ctx.stroke(); }
      const nu = UI.nextUnlock(); if (nu) { const s = FL.Save.data.stars; const prev = UI.prevThreshold(); const frac = Math.max(0, Math.min(1, (s - prev) / Math.max(1, nu.stars - prev))); const w = 190, h = 54, x = g.W - w - 20, y = 96; ctx.fillStyle = 'rgba(0,0,0,.35)'; A.roundRect(ctx, x, y, w, h, 27); ctx.fill(); A.emoji(ctx, nu.emoji, x + 30, y + h / 2, 32); A.text(ctx, `in ${Math.max(0, nu.stars - s)} ⭐`, x + 120, y + 18, { size: 20, color: '#fff' }); ctx.fillStyle = 'rgba(255,255,255,.3)'; A.roundRect(ctx, x + 60, y + 34, w - 76, 10, 5); ctx.fill(); ctx.fillStyle = '#fde047'; A.roundRect(ctx, x + 60, y + 34, (w - 76) * frac, 10, 5); ctx.fill(); }
      if (!FL.Save.data.visited.length && this.t < 30) { const L0 = this.locs()[0]; A.emoji(ctx, '👇', L0.x, L0.y - 260 - Math.abs(Math.sin(t * 4)) * 20, 70); }
    },
  };
  FL.scenes.town = scene;
})();
