// The explorable kingdom: tap-to-walk or drag a thumb joystick; walk up to a sign to play.
(function () {
  const A = FL.Art, UI = FL.UI, G = () => FL.Game;
  const MAP_W = 2400, MAP_H = 1700;
  const LOCS = FL.Data.LOCS;
  const OBSTACLES = [
    { type: 'rect', x: 970, y: 300, w: 460, h: 340 },        // castle body
    { type: 'circle', x: 1980, y: 470, r: 190 },               // pond
    { type: 'circle', x: 1930, y: 1160, r: 110 },              // gazebo
    { type: 'rect', x: 0, y: 0, w: MAP_W, h: 90 }, { type: 'rect', x: 0, y: MAP_H - 70, w: MAP_W, h: 70 }, { type: 'rect', x: 0, y: 0, w: 80, h: MAP_H }, { type: 'rect', x: MAP_W - 80, y: 0, w: 80, h: MAP_H },
  ];
  function rng(seed) { let s = seed; return () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; }; }

  const scene = {
    px: 1200, py: 960, facing: 1, walking: false, t: 0, cam: { x: 0, y: 0 }, target: null, targetLoc: null, joy: null, near: null,
    decor: [], flowers: [], butterflies: [], clouds: [], fx: new A.Particles(), companion: { x: 1130, y: 980 }, idle: 0, hintLoc: null, greeted: false, playBtn: null, friendsBtn: null, parentBtn: null, hold: 0, buttons: [],
    hud: { home: false },
    init() {
      const r = rng(7); this.decor = []; this.flowers = []; this.butterflies = []; this.clouds = [];
      const free = (x, y, d) => LOCS.every((l) => Math.hypot(l.x - x, l.y - y) > d) && Math.hypot(1200 - x, 960 - y) > 220 && !(x > 900 && x < 1500 && y < 700) && Math.hypot(1980 - x, 470 - y) > 260 && Math.hypot(1930 - x, 1160 - y) > 200;
      // border trees
      for (let i = 0; i < 26; i++) { const x = 120 + (i / 25) * (MAP_W - 240); this.decor.push({ k: 'tree', x: x + (r() - 0.5) * 40, y: 120 + r() * 50, s: 0.9 + r() * 0.3, v: Math.floor(r() * 3) }); this.decor.push({ k: 'tree', x: x + (r() - 0.5) * 40, y: MAP_H - 30 - r() * 40, s: 0.9 + r() * 0.3, v: Math.floor(r() * 3) }); }
      for (let i = 0; i < 16; i++) { const y = 180 + (i / 15) * (MAP_H - 360); this.decor.push({ k: 'tree', x: 110 + r() * 40, y, s: 0.9 + r() * 0.3, v: Math.floor(r() * 3) }); this.decor.push({ k: 'tree', x: MAP_W - 110 - r() * 40, y, s: 0.9 + r() * 0.3, v: Math.floor(r() * 3) }); }
      // scattered
      let tries = 0; while (this.decor.length < 92 && tries++ < 800) { const x = 200 + r() * (MAP_W - 400), y = 200 + r() * (MAP_H - 400); if (free(x, y, 230)) this.decor.push({ k: r() < 0.6 ? 'tree' : 'bush', x, y, s: 0.8 + r() * 0.4, v: Math.floor(r() * 3) }); }
      tries = 0; while (this.flowers.length < 140 && tries++ < 2000) { const x = 120 + r() * (MAP_W - 240), y = 130 + r() * (MAP_H - 260); if (free(x, y, 150)) this.flowers.push({ x, y, c: ['#f472b6', '#facc15', '#f87171', '#c084fc', '#fff', '#fb923c'][Math.floor(r() * 6)], s: 0.7 + r() * 0.5, seed: r() * 6 }); }
      for (let i = 0; i < 8; i++) this.butterflies.push({ x: r() * MAP_W, y: r() * MAP_H, a: r() * 6, e: ['🦋', '🐝', '🐦'][i % 3], sp: 40 + r() * 40 });
      for (let i = 0; i < 6; i++) this.clouds.push({ x: r() * MAP_W, y: r() * MAP_H, s: 60 + r() * 50 });
      this.inited = true;
    },
    enter(params) {
      if (!this.inited) this.init();
      const g = G(); this.t = 0; this.target = null; this.targetLoc = null; this.joy = null; this.idle = 0; this.hintLoc = null;
      if (params && params.at) { const l = LOCS.find((x) => x.id === params.at); if (l) { this.px = l.x; this.py = l.y + 60; } }
      this.companion = { x: this.px - 70, y: this.py + 10 };
      this.cam.x = this.px - g.W / 2; this.cam.y = this.py - g.H / 2; this.clampCam();
      this.layout();
      if (!this.greeted) { this.greeted = true; setTimeout(() => { if (G().sceneName === 'world') FL.Audio.say('Tap anywhere to walk. Walk to a sign and tap Play!', { interrupt: false }); }, 2500); }
    },
    layout() {
      const g = G();
      this.friendsBtn = new UI.Button({ x: g.W - 110, y: g.H - 110, w: 90, h: 90, emoji: FL.Save.data.companion, color: '#f9a8d4', round: true, emojiSize: 52, onTap: () => UI.showFriends() });
      this.parentBtn = new UI.Button({ x: 18, y: 18, w: 64, h: 64, emoji: '⚙️', color: '#94a3b8', round: true, emojiSize: 32 });
      this.playBtn = new UI.Button({ x: 0, y: 0, w: 230, h: 90, label: 'Play!', emoji: '▶️', color: '#4ade80', size: 40, pulse: true, onTap: () => this.enterLoc(this.near) });
      this.buttons = [this.friendsBtn];
    },
    resize() { this.layout(); },
    clampCam() { const g = G(); this.cam.x = Math.max(0, Math.min(MAP_W - g.W, this.cam.x)); this.cam.y = Math.max(0, Math.min(MAP_H - g.H, this.cam.y)); },
    toWorld(p) { return { x: p.x + this.cam.x, y: p.y + this.cam.y }; },
    enterLoc(loc) { if (!loc) return; this.exitAt = loc.id; if (!FL.Save.data.visited.includes(loc.id)) { FL.Save.data.visited.push(loc.id); FL.Save.save(); } FL.Audio.sfx.whoosh(); G().go(loc.scene, { from: loc.id }); },
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
        if (d > 18) this.joy.moved = true;
        if (d > 70) { dx *= 70 / d; dy *= 70 / d; }
        this.joy.dx = dx; this.joy.dy = dy;
        if (this.joy.moved) { this.target = null; this.targetLoc = null; }
      }
    },
    up(p) {
      if (p.button) { UI.pressUp([this.playBtn].concat(this.buttons), p); return; }
      if (p.parent) { if (this.hold >= 1.2) UI.showParent(); else UI.toast('Grown-ups: hold the gear for 2 seconds', '⚙️', '#475569'); p.parent = false; return; }
      if (this.joy && p.id === this.joy.id) {
        if (!this.joy.moved) { // tap to walk
          const w = this.toWorld(p); const loc = LOCS.find((l) => Math.hypot(l.x - w.x, l.y - w.y) < l.r || (Math.abs(l.x - w.x) < 130 && w.y > l.y - 200 && w.y < l.y + 20));
          if (loc) { this.target = { x: loc.x, y: loc.y + 50 }; this.targetLoc = loc; FL.Audio.sfx.tap(); }
          else { this.target = { x: Math.max(90, Math.min(MAP_W - 90, w.x)), y: Math.max(110, Math.min(MAP_H - 80, w.y)) }; this.targetLoc = null; }
          this.fx.burst(w.x, w.y, { count: 8, type: 'star', colors: ['#fff', '#fde047'], speed: 120, life: 0.5, size: 8, gravity: 0 });
        }
        this.joy = null;
      }
    },
    key(k) { this.idle = 0; if ((k === 'Enter' || k === ' ') && this.near) this.enterLoc(this.near); if (k === 'f') UI.showFriends(); },
    collide(nx, ny) {
      for (const o of OBSTACLES) {
        if (o.type === 'rect') { if (nx > o.x - 20 && nx < o.x + o.w + 20 && ny > o.y && ny < o.y + o.h + 10) return true; }
        else if (Math.hypot(o.x - nx, o.y - ny) < o.r + 14) return true;
      }
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
      }
      // companion follows
      const cx = this.px - this.facing * 70, cy = this.py + 12; this.companion.x += (cx - this.companion.x) * Math.min(1, dt * 4); this.companion.y += (cy - this.companion.y) * Math.min(1, dt * 4);
      // camera
      this.cam.x += (this.px - g.W / 2 - this.cam.x) * Math.min(1, dt * 5); this.cam.y += (this.py - g.H / 2 - this.cam.y) * Math.min(1, dt * 5); this.clampCam();
      // near a location
      const prev = this.near; this.near = LOCS.find((l) => Math.hypot(l.x - this.px, l.y - this.py) < l.r) || null;
      if (this.near && this.near !== prev) { FL.Audio.sfx.sparkle(); FL.Audio.say(`${this.near.name}! ${this.near.hint}`); }
      if (this.near) { this.playBtn.x = this.near.x - this.cam.x - 115; this.playBtn.y = this.near.y - this.cam.y - 260; }
      // parent hold
      for (const p of g.pointers.values()) if (p.parent) this.hold += dt;
      // ambient
      this.butterflies.forEach((b) => { b.a += (Math.random() - 0.5) * dt * 3; b.x += Math.cos(b.a) * b.sp * dt; b.y += Math.sin(b.a) * b.sp * dt; if (b.x < 100 || b.x > MAP_W - 100 || b.y < 100 || b.y > MAP_H - 100) b.a += Math.PI; });
      this.clouds.forEach((c) => { c.x += 14 * dt; if (c.x > MAP_W + 200) c.x = -200; });
      this.fx.update(dt);
      if (this.idle > 14) { this.idle = 0; const l = LOCS.find((x) => !FL.Save.data.visited.includes(x.id)) || LOCS[Math.floor(Math.random() * LOCS.length)]; this.hintLoc = l; this.hintT = 4; FL.Audio.say(`Let's go to the ${l.name}!`); }
      if (this.hintT > 0) { this.hintT -= dt; if (this.hintT <= 0) this.hintLoc = null; }
      this.friendsBtn.emoji = FL.Save.data.companion;
    },
    draw(ctx) {
      const g = G(); const t = this.t; const cx = this.cam.x, cy = this.cam.y;
      // ground
      const gg = ctx.createLinearGradient(0, 0, 0, g.H); gg.addColorStop(0, '#86efac'); gg.addColorStop(1, '#4ade80'); ctx.fillStyle = gg; ctx.fillRect(0, 0, g.W, g.H);
      ctx.save(); ctx.translate(-cx, -cy);
      // grass texture blotches
      ctx.fillStyle = 'rgba(255,255,255,.08)'; for (let i = 0; i < 40; i++) { const x = (i * 613) % MAP_W, y = (i * 389) % MAP_H; if (x > cx - 200 && x < cx + g.W + 200 && y > cy - 200 && y < cy + g.H + 200) { A.ellipse(ctx, x, y, 120, 60); ctx.fill(); } }
      // paths
      ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      const drawPaths = (w, c) => { ctx.strokeStyle = c; ctx.lineWidth = w; LOCS.forEach((l) => { ctx.beginPath(); ctx.moveTo(1200, 960); const mx = (1200 + l.x) / 2 + (l.y - 960) * 0.25, my = (960 + l.y) / 2 - (l.x - 1200) * 0.25; ctx.quadraticCurveTo(mx, my, l.x, l.y + 40); ctx.stroke(); }); };
      drawPaths(84, '#d6b98c'); drawPaths(68, '#f1dfb0');
      ctx.fillStyle = '#f1dfb0'; A.circle(ctx, 1200, 960, 120); ctx.fill(); ctx.strokeStyle = '#d6b98c'; ctx.lineWidth = 8; ctx.stroke();
      ctx.fillStyle = '#fde68a'; A.starPath(ctx, 1200, 960, 46, 20, 5); ctx.fill(); ctx.strokeStyle = '#f59e0b'; ctx.lineWidth = 4; ctx.stroke();
      // pond + rainbow + garden beds
      A.pond(ctx, 1980, 470, 190, 120, t);
      A.rainbow(ctx, 470, 1140, 200, 16, 0.8);
      // letter garden beds
      ctx.fillStyle = '#a16207'; A.roundRect(ctx, 250, 380, 360, 130, 30); ctx.fill(); ctx.fillStyle = '#ca8a04'; A.roundRect(ctx, 262, 392, 336, 106, 24); ctx.fill();
      'ABCDEF'.split('').forEach((ch, i) => { A.bigFlower(ctx, 300 + i * 56, 440 + Math.sin(t * 2 + i) * 4, 26, ['#f472b6', '#60a5fa', '#facc15', '#c084fc', '#fb923c', '#f87171'][i]); A.text(ctx, ch, 300 + i * 56, 441 + Math.sin(t * 2 + i) * 4, { size: 22, color: '#7c2d12' }); });
      // pattern bridge stones
      ctx.fillStyle = '#7dd3fc'; A.roundRect(ctx, 960, 1470, 480, 90, 45); ctx.fill(); ctx.fillStyle = '#bae6fd'; A.roundRect(ctx, 980, 1485, 440, 30, 15); ctx.fill();
      ['🐻', '🐰', '🐻', '🐰', '❓'].forEach((e, i) => { ctx.fillStyle = '#e7e5e4'; A.circle(ctx, 1040 + i * 80, 1515, 32); ctx.fill(); ctx.strokeStyle = '#a8a29e'; ctx.lineWidth = 3; ctx.stroke(); A.emoji(ctx, e, 1040 + i * 80, 1513, 34); });
      // flowers (ground layer)
      this.flowers.forEach((f) => { if (f.x > cx - 60 && f.x < cx + g.W + 60 && f.y > cy - 60 && f.y < cy + g.H + 60) A.flower(ctx, f.x, f.y, f.s, f.c, t, f.seed); });
      // walk target marker
      if (this.target) { ctx.strokeStyle = 'rgba(255,255,255,.8)'; ctx.lineWidth = 4; A.ellipse(ctx, this.target.x, this.target.y, 24 + Math.sin(t * 6) * 4, 10 + Math.sin(t * 6) * 2); ctx.stroke(); }
      // depth-sorted things
      const items = [];
      this.decor.forEach((d) => { if (d.x > cx - 150 && d.x < cx + g.W + 150 && d.y > cy - 50 && d.y < cy + g.H + 200) items.push({ y: d.y, f: () => (d.k === 'tree' ? A.tree(ctx, d.x, d.y, d.s, d.v, t) : A.bush(ctx, d.x, d.y, d.s)) }); });
      items.push({ y: 640, f: () => A.castle(ctx, 1200, 640, 1.05, t) });
      items.push({ y: 1160, f: () => A.gazebo(ctx, 1930, 1160, 1, t) });
      LOCS.forEach((l) => { const isNear = this.near === l; const hint = this.hintLoc === l; const b = isNear || hint ? Math.abs(Math.sin(t * 6)) * 12 : 0; items.push({ y: l.y, f: () => A.sign(ctx, l.x, l.y, l.emoji, l.name, { bounce: b, glow: isNear ? 0.5 + Math.sin(t * 6) * 0.4 : hint ? 0.7 : 0, scale: 1 }) }); if (isNear || hint) items.push({ y: l.y - 1, f: () => { ctx.strokeStyle = 'rgba(255,255,255,.7)'; ctx.lineWidth = 5; ctx.setLineDash([16, 14]); ctx.lineDashOffset = -t * 40; A.ellipse(ctx, l.x, l.y + 30, l.r, l.r * 0.45); ctx.stroke(); ctx.setLineDash([]); } }); });
      items.push({ y: this.py, f: () => A.princess(ctx, this.px, this.py, g.look, { t, walking: this.walking, facing: this.facing, wave: !this.walking && this.idle > 3 && this.idle < 5 }, 1) });
      items.push({ y: this.companion.y, f: () => { const hop = Math.abs(Math.sin(t * 8)) * (this.walking ? 14 : 3); ctx.fillStyle = 'rgba(0,0,0,.15)'; A.ellipse(ctx, this.companion.x, this.companion.y, 22, 8); ctx.fill(); A.emoji(ctx, FL.Save.data.companion, this.companion.x, this.companion.y - 28 - hop, 56, { flip: this.facing < 0 }); } });
      this.butterflies.forEach((b) => items.push({ y: 99999, f: () => A.emoji(ctx, b.e, b.x, b.y + Math.sin(t * 10 + b.a) * 6, 30, { flip: Math.cos(b.a) < 0, scale: 0.7 + Math.abs(Math.sin(t * 14)) * 0.3 }) }));
      items.sort((a, b) => a.y - b.y).forEach((i) => i.f());
      this.fx.draw(ctx);
      // cloud shadows/clouds
      this.clouds.forEach((c) => { ctx.save(); ctx.globalAlpha = 0.1; ctx.fillStyle = '#000'; A.cloud(ctx, c.x + 40, c.y + 60, c.s, 0.15); ctx.restore(); A.cloud(ctx, c.x, c.y, c.s, 0.55); });
      ctx.restore();
      // joystick
      if (this.joy && this.joy.moved) { ctx.fillStyle = 'rgba(255,255,255,.3)'; A.circle(ctx, this.joy.ox, this.joy.oy, 78); ctx.fill(); ctx.strokeStyle = 'rgba(255,255,255,.7)'; ctx.lineWidth = 4; ctx.stroke(); ctx.fillStyle = 'rgba(255,255,255,.85)'; A.circle(ctx, this.joy.ox + this.joy.dx, this.joy.oy + this.joy.dy, 38); ctx.fill(); }
      // prompt
      if (this.near) { this.playBtn.draw(ctx, t); }
      // name tag
      const name = FL.Save.data.name; if (name) A.text(ctx, `Princess ${name}`, this.px - cx, this.py - cy - 175, { size: 22, color: '#fff', stroke: 'rgba(80,20,90,.6)' });
      this.buttons.forEach((b) => b.draw(ctx, t)); this.parentBtn.draw(ctx, t);
      if (this.hold > 0 && this.hold < 1.2) { ctx.strokeStyle = '#fde047'; ctx.lineWidth = 6; ctx.beginPath(); ctx.arc(50, 50, 38, -Math.PI / 2, -Math.PI / 2 + (this.hold / 1.2) * Math.PI * 2); ctx.stroke(); }
      if (!FL.Save.data.visited.length && this.t < 30) { const l = LOCS[0]; const sx = l.x - cx, sy = l.y - cy - 190 - Math.abs(Math.sin(t * 4)) * 20; if (sx > 0 && sx < g.W && sy > 0) A.emoji(ctx, '👇', sx, sy, 70); }
    },
  };
  scene.hud = { home: false }; scene.music = 'kingdom';
  FL.scenes.world = scene;
  FL.WORLD_LOCS = LOCS;
})();
