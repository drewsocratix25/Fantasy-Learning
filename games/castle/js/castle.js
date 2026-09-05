// The castle: a cutaway with five rooms. Tap a room and the explorer runs over and goes in.
// Registered as the 'world' scene so the engine's home button and results overlay return here.
(function () {
  const A = FL.Art, UI = FL.UI, G = () => FL.Game, D = FL.Data;
  // Stone castle facade used by the title screen and the hub (feet of the castle at (x, y)).
  A.castleQuest = function (ctx, x, y, s, t) {
    t = t || 0; ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
    ctx.fillStyle = 'rgba(0,0,0,.15)'; A.ellipse(ctx, 0, 6, 320, 26); ctx.fill();
    const wall = '#e7e5e4', wallDark = '#d6d3d1', roof = '#2563eb', roofLight = '#60a5fa', stone = '#a8a29e';
    ctx.strokeStyle = 'rgba(60,50,70,.5)'; ctx.lineWidth = 3;
    function tower(tx, ty, tw, th) {
      ctx.fillStyle = wallDark; A.roundRect(ctx, tx - tw / 2, ty - th, tw, th, 8); ctx.fill(); ctx.stroke();
      ctx.fillStyle = wall; ctx.fillRect(tx - tw / 2 + 6, ty - th + 6, tw * 0.4, th - 12);
      ctx.fillStyle = stone; for (let i = -1; i <= 1; i++) ctx.fillRect(tx + i * tw * 0.36 - tw * 0.12, ty - th - 12, tw * 0.24, 14);
      ctx.fillStyle = roof; ctx.beginPath(); ctx.moveTo(tx - tw * 0.7, ty - th - 8); ctx.lineTo(tx, ty - th - tw * 1.35); ctx.lineTo(tx + tw * 0.7, ty - th - 8); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.fillStyle = roofLight; ctx.beginPath(); ctx.moveTo(tx - tw * 0.7, ty - th - 8); ctx.lineTo(tx, ty - th - tw * 1.35); ctx.lineTo(tx - tw * 0.15, ty - th - 8); ctx.closePath(); ctx.fill();
      const fx = tx, fy = ty - th - tw * 1.35; ctx.strokeStyle = '#78350f'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(fx, fy); ctx.lineTo(fx, fy - 34); ctx.stroke();
      const wave = Math.sin(t * 6 + tx) * 4; ctx.fillStyle = '#fde047'; ctx.beginPath(); ctx.moveTo(fx, fy - 34); ctx.quadraticCurveTo(fx + 14, fy - 30 + wave, fx + 28, fy - 26); ctx.lineTo(fx, fy - 16); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = 'rgba(60,50,70,.5)'; ctx.lineWidth = 3; ctx.fillStyle = '#7dd3fc'; A.roundRect(ctx, tx - 10, ty - th * 0.62, 20, 30, 10); ctx.fill(); ctx.stroke();
    }
    ctx.fillStyle = wallDark; A.roundRect(ctx, -240, -190, 480, 190, 10); ctx.fill(); ctx.stroke();
    ctx.fillStyle = wall; ctx.fillRect(-232, -182, 464, 174);
    ctx.fillStyle = 'rgba(0,0,0,.06)'; for (let r = 0; r < 6; r++) for (let c = 0; c < 8; c++) ctx.fillRect(-232 + c * 58 + (r % 2) * 29, -175 + r * 29, 52, 22);
    ctx.fillStyle = stone; for (let i = 0; i < 12; i++) ctx.fillRect(-240 + i * 40 + 8, -202, 24, 16);
    tower(-250, 0, 74, 250); tower(250, 0, 74, 250); tower(0, -140, 96, 190);
    ctx.fillStyle = '#92400e'; ctx.beginPath(); ctx.moveTo(-52, 0); ctx.lineTo(-52, -76); ctx.arc(0, -76, 52, Math.PI, 0); ctx.lineTo(52, 0); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#b45309'; ctx.fillRect(-2, -120, 4, 118); ctx.strokeStyle = '#78350f'; ctx.lineWidth = 3; for (let i = 1; i < 4; i++) { ctx.beginPath(); ctx.moveTo(-52, -i * 24); ctx.lineTo(52, -i * 24); ctx.stroke(); }
    ctx.strokeStyle = 'rgba(60,50,70,.5)'; ctx.fillStyle = '#7dd3fc'; [-160, -105, 105, 160].forEach((wx) => { A.roundRect(ctx, wx - 12, -140, 24, 36, 12); ctx.fill(); ctx.stroke(); });
    [[-200, '#ef4444'], [200, '#3b82f6']].forEach(([bx, c]) => { ctx.fillStyle = c; ctx.beginPath(); ctx.moveTo(bx - 16, -175); ctx.lineTo(bx + 16, -175); ctx.lineTo(bx + 16, -115); ctx.lineTo(bx, -102); ctx.lineTo(bx - 16, -115); ctx.closePath(); ctx.fill(); ctx.stroke(); });
    A.emoji(ctx, '🔭', -200, -145, 22); A.emoji(ctx, '🗝️', 200, -145, 22);
    ctx.fillStyle = '#d6d3d1'; A.roundRect(ctx, -80, -4, 160, 22, 8); ctx.fill();
    ctx.restore();
  };

  // Room slots on the cutaway, as fractions of the castle box (see layout()).
  const SLOTS = { tower: [0.5, 0.12], greenhouse: [0.17, 0.5], menagerie: [0.83, 0.5], lab: [0.3, 0.86], vault: [0.7, 0.86] };
  const scene = {
    hud: { home: false }, music: 'kingdom', t: 0, px: 0, py: 0, facing: 1, walking: false, target: null, targetRoom: null, near: null, idle: 0, hold: 0, greeted: false, rooms: [], buttons: [], companion: { x: 0, y: 0 }, fx: new A.Particles(), birds: [],
    enter(params) {
      const g = G(); this.t = 0; this.target = null; this.targetRoom = null; this.idle = 0; this.hold = 0; this.layout();
      const from = params && params.at ? this.rooms.find((r) => r.id === params.at) : null;
      this.px = from ? from.fx : g.W / 2; this.py = this.groundY(); this.companion = { x: this.px - 70, y: this.py + 8 };
      this.birds = []; for (let i = 0; i < 5; i++) this.birds.push({ x: Math.random() * g.W, y: 60 + Math.random() * 120, v: 30 + Math.random() * 30, ph: Math.random() * 6 });
      if (!this.greeted) { this.greeted = true; FL.Game.later(() => { if (G().sceneName === 'world') FL.Audio.say('Tap a room to go inside!', { interrupt: false }); }, 2500); }
    },
    groundY() { return G().H - 70; },
    box() { const g = G(); const w = Math.min(1100, g.W - 120), h = 620; return { x: g.W / 2 - w / 2, y: 90, w, h }; },
    layout() {
      const g = G(); const b = this.box();
      this.rooms = D.ROOMS.map((r) => { const [fx, fy] = SLOTS[r.id]; return Object.assign({}, r, { x: b.x + b.w * fx, y: b.y + b.h * fy, fx: b.x + b.w * fx, w: 200, h: 170 }); });
      this.friendsBtn = new UI.Button({ x: g.W - 110, y: g.H - 110, w: 90, h: 90, emoji: FL.Save.data.companion, color: '#bfdbfe', round: true, emojiSize: 52, onTap: () => UI.showFriends() });
      this.parentBtn = new UI.Button({ x: 18, y: 18, w: 64, h: 64, emoji: '⚙️', color: '#94a3b8', round: true, emojiSize: 32 });
      this.hubBtn = new UI.Button({ x: 18, y: g.H - 82, w: 64, h: 64, emoji: '✨', color: '#c4b5fd', round: true, emojiSize: 30, onTap: () => { location.href = '../../'; } });
      this.buttons = [this.friendsBtn, this.hubBtn];
    },
    resize() { this.layout(); },
    roomAt(x, y) { return this.rooms.find((r) => Math.abs(x - r.x) < r.w / 2 && Math.abs(y - r.y) < r.h / 2) || null; },
    enterRoom(r) { if (!FL.Save.data.visited.includes(r.id)) { FL.Save.data.visited.push(r.id); FL.Save.save(); } FL.Audio.sfx.whoosh(); G().go(r.scene, { from: r.id }); },
    down(p) { this.idle = 0; if (UI.pressDown(this.buttons, p)) return; if (this.parentBtn.contains(p.x, p.y)) { p.parent = true; this.hold = 0; return; } },
    up(p) {
      if (p.button) { UI.pressUp(this.buttons, p); return; }
      if (p.parent) { if (this.hold >= 1.2) UI.showParent(); else UI.toast('Grown-ups: hold the gear for 2 seconds', '⚙️', '#475569'); p.parent = false; return; }
      const r = this.roomAt(p.x, p.y);
      if (r) { this.target = r.fx; this.targetRoom = r; FL.Audio.sfx.tap(); FL.Audio.say(`${r.name}! ${r.hint}`); this.fx.burst(r.x, r.y, { count: 10, type: 'star', colors: ['#fff', '#fde047'], speed: 140, life: 0.5, size: 8, gravity: 0 }); }
      else if (p.y > this.groundY() - 160) { this.target = Math.max(90, Math.min(G().W - 90, p.x)); this.targetRoom = null; }
    },
    key(k) { this.idle = 0; if (k === 'f') UI.showFriends(); const n = parseInt(k, 10); if (n >= 1 && n <= this.rooms.length) { const r = this.rooms[n - 1]; this.target = r.fx; this.targetRoom = r; } },
    update(dt) {
      const g = G(); this.t += dt; this.idle += dt;
      let vx = 0; const k = g.keys; if (k.ArrowLeft || k.a) vx -= 1; if (k.ArrowRight || k.d) vx += 1; if (vx) { this.target = null; this.targetRoom = null; this.idle = 0; }
      if (this.target != null) { const dx = this.target - this.px; if (Math.abs(dx) < 6) { const r = this.targetRoom; this.target = null; this.targetRoom = null; if (r) { this.enterRoom(r); return; } } else vx = Math.sign(dx); }
      this.walking = vx !== 0;
      if (this.walking) { this.px = Math.max(90, Math.min(g.W - 90, this.px + vx * 320 * dt)); this.facing = vx > 0 ? 1 : -1; if (Math.random() < dt * 3) this.fx.burst(this.px - this.facing * 10, this.py, { count: 1, colors: ['rgba(255,255,255,.7)'], speed: 30, life: 0.5, size: 8, gravity: -20 }); }
      const cx = this.px - this.facing * 70; this.companion.x += (cx - this.companion.x) * Math.min(1, dt * 4); this.companion.y = this.py + 8;
      for (const p of g.pointers.values()) if (p.parent) this.hold += dt;
      this.birds.forEach((b) => { b.x += b.v * dt; if (b.x > g.W + 40) b.x = -40; });
      this.fx.update(dt);
      if (this.idle > 14) { this.idle = 0; const r = this.rooms.find((x) => !FL.Save.data.visited.includes(x.id)) || this.rooms[Math.floor(Math.random() * this.rooms.length)]; this.hintRoom = r; this.hintT = 4; FL.Audio.say(`Let's go to the ${r.name}!`); }
      if (this.hintT > 0) { this.hintT -= dt; if (this.hintT <= 0) this.hintRoom = null; }
      this.friendsBtn.emoji = FL.Save.data.companion;
    },
    drawRoom(ctx, r, t) {
      const glow = this.targetRoom === r ? 0.5 + Math.sin(t * 6) * 0.4 : this.hintRoom === r ? 0.7 : 0; const b = glow ? Math.abs(Math.sin(t * 6)) * 8 : 0;
      const x = r.x - r.w / 2, y = r.y - r.h / 2;
      ctx.save();
      // arched window into the room
      ctx.fillStyle = 'rgba(0,0,0,.25)'; A.roundRect(ctx, x + 4, y + 8, r.w, r.h, 40); ctx.fill();
      const g = ctx.createLinearGradient(0, y, 0, y + r.h); g.addColorStop(0, A.shade(r.color, 0.35)); g.addColorStop(1, r.color);
      ctx.fillStyle = g; ctx.strokeStyle = '#78716c'; ctx.lineWidth = 8; A.roundRect(ctx, x, y, r.w, r.h, 40); ctx.fill(); ctx.stroke();
      if (glow) { ctx.strokeStyle = `rgba(253,224,71,${glow})`; ctx.lineWidth = 10; A.roundRect(ctx, x - 6, y - 6, r.w + 12, r.h + 12, 46); ctx.stroke(); }
      // room contents
      const lvl = FL.Save.level(r.id);
      A.emoji(ctx, r.emoji, r.x, r.y - 20 - b, 86, { shadow: true });
      if (r.id === 'tower') { for (let i = 0; i < 6; i++) { ctx.fillStyle = `rgba(255,255,255,${0.5 + Math.sin(t * 3 + i) * 0.4})`; A.starPath(ctx, x + 30 + i * 28, y + 28 + (i % 2) * 14, 4, 2, 4); ctx.fill(); } }
      if (r.id === 'greenhouse') { A.flower(ctx, x + 34, y + r.h - 24, 0.9, '#f472b6', t, 1); A.flower(ctx, x + r.w - 34, y + r.h - 24, 0.9, '#facc15', t, 2); }
      if (r.id === 'lab') { A.emoji(ctx, '🫧', x + r.w - 40, y + 40 + Math.sin(t * 2) * 6, 26); }
      if (r.id === 'menagerie') { A.emoji(ctx, '🐦', x + 40, y + 36 + Math.sin(t * 4) * 4, 26); }
      if (r.id === 'vault') { A.emoji(ctx, '🪙', x + 36, y + r.h - 36, 26); A.emoji(ctx, '🪙', x + r.w - 36, y + r.h - 36, 26); }
      // plaque
      ctx.fillStyle = '#fde68a'; ctx.strokeStyle = '#a16207'; ctx.lineWidth = 4; A.roundRect(ctx, r.x - 100, y + r.h - 46, 200, 40, 14); ctx.fill(); ctx.stroke();
      A.text(ctx, r.name, r.x, y + r.h - 25, { size: A.fitSize(ctx, r.name, 180, 22), color: '#78350f' });
      if (lvl > 1) A.text(ctx, '⭐'.repeat(Math.min(3, lvl - 1)), r.x + 80, y + 14, { size: 16 });
      ctx.restore();
    },
    draw(ctx) {
      const g = G(); const t = this.t; const b = this.box(); const gy = this.groundY();
      const sky = ctx.createLinearGradient(0, 0, 0, g.H); sky.addColorStop(0, '#60a5fa'); sky.addColorStop(0.7, '#bfdbfe'); sky.addColorStop(1, '#fef3c7'); ctx.fillStyle = sky; ctx.fillRect(0, 0, g.W, g.H);
      A.sun(ctx, g.W - 130, 110, 46, t); A.cloud(ctx, 200 + Math.sin(t * 0.2) * 30, 120, 34, 0.9); A.cloud(ctx, g.W - 380 + Math.cos(t * 0.15) * 30, 70, 28, 0.8);
      this.birds.forEach((bd) => A.emoji(ctx, '🐦', bd.x, bd.y + Math.sin(t * 3 + bd.ph) * 8, 22));
      A.hills(ctx, g.W, g.H, gy - 60, '#86efac', 2); A.grass(ctx, g.W, g.H, gy - 20, '#4ade80', '#16a34a');
      // castle body (cutaway): outer walls, roof line, towers on the sides
      ctx.save(); ctx.strokeStyle = 'rgba(60,50,70,.5)'; ctx.lineWidth = 4;
      ctx.fillStyle = 'rgba(0,0,0,.15)'; A.roundRect(ctx, b.x + 10, b.y + 14, b.w, b.h, 30); ctx.fill();
      ctx.fillStyle = '#d6d3d1'; A.roundRect(ctx, b.x, b.y, b.w, b.h, 30); ctx.fill(); ctx.stroke();
      ctx.fillStyle = 'rgba(0,0,0,.06)'; for (let r = 0; r < 20; r++) for (let c = 0; c < 22; c++) { const sx = b.x + 8 + c * 52 + (r % 2) * 26, sy = b.y + 10 + r * 31; if (sx + 46 < b.x + b.w && sy + 24 < b.y + b.h) ctx.fillRect(sx, sy, 46, 24); }
      ctx.fillStyle = '#a8a29e'; for (let i = 0; i < b.w / 44; i++) ctx.fillRect(b.x + 10 + i * 44, b.y - 18, 26, 20);
      [[b.x, '#2563eb'], [b.x + b.w, '#2563eb']].forEach(([tx, c]) => { ctx.fillStyle = '#e7e5e4'; A.roundRect(ctx, tx - 40, b.y - 30, 80, b.h + 30, 12); ctx.fill(); ctx.stroke(); ctx.fillStyle = c; ctx.beginPath(); ctx.moveTo(tx - 56, b.y - 30); ctx.lineTo(tx, b.y - 130); ctx.lineTo(tx + 56, b.y - 30); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.fillStyle = '#fde047'; ctx.beginPath(); ctx.moveTo(tx, b.y - 130); ctx.lineTo(tx, b.y - 165); ctx.lineTo(tx + 26, b.y - 155); ctx.lineTo(tx, b.y - 145); ctx.closePath(); ctx.fill(); });
      // floors
      ctx.fillStyle = '#a16207'; [0.33, 0.7].forEach((f) => ctx.fillRect(b.x + 12, b.y + b.h * f, b.w - 24, 8));
      // stairs between floors
      ctx.fillStyle = '#b45309'; for (let i = 0; i < 7; i++) { ctx.fillRect(b.x + b.w * 0.5 - 60 + i * 18, b.y + b.h * 0.7 - i * 22, 18, 10); ctx.fillRect(b.x + b.w * 0.5 + 60 - i * 18 - 18, b.y + b.h * 0.33 + b.h * 0.37 - i * 22 - 8, 18, 10); }
      // treasures on display
      const has = (id) => FL.Save.has('treasure', id);
      if (has('crown')) A.emoji(ctx, '👑', b.x + b.w / 2, b.y - 60, 44);
      if (has('lantern')) { ctx.fillStyle = `rgba(253,224,71,${0.25 + Math.sin(t * 3) * 0.1})`; A.circle(ctx, b.x + b.w * 0.5 - 150, b.y + b.h * 0.3, 40); ctx.fill(); A.emoji(ctx, '🏮', b.x + b.w * 0.5 - 150, b.y + b.h * 0.3, 40); }
      if (has('key')) A.emoji(ctx, '🗝️', b.x + b.w * 0.5 + 150, b.y + b.h * 0.3 + Math.sin(t * 2) * 4, 38);
      if (has('spyglass')) A.emoji(ctx, '🔭', b.x + b.w * 0.5 + 150, b.y + b.h * 0.62, 38);
      if (has('egg')) A.emoji(ctx, has('hatched') ? '🐉' : '🥚', b.x + b.w * 0.5 - 150, b.y + b.h * 0.62 + (has('hatched') ? Math.sin(t * 4) * 5 : 0), 40);
      if (has('ball')) A.emoji(ctx, '🔮', b.x + b.w * 0.5, b.y + b.h * 0.3, 40);
      if (has('chest')) A.emoji(ctx, '🧰', b.x + b.w * 0.5, b.y + b.h * 0.62, 44);
      this.rooms.forEach((r) => this.drawRoom(ctx, r, t));
      ctx.restore();
      // courtyard set pieces
      if (has('sword')) A.emoji(ctx, '🗡️', 120, gy - 30, 56); if (has('sword')) { ctx.fillStyle = '#78716c'; A.ellipse(ctx, 120, gy - 4, 40, 14); ctx.fill(); }
      if (has('carpet')) A.emoji(ctx, '🧞', ((t * 60) % (g.W + 200)) - 100, 240 + Math.sin(t) * 20, 54);
      A.bush(ctx, b.x - 90, gy - 10, 1); A.bush(ctx, b.x + b.w + 90, gy - 10, 1); A.flower(ctx, b.x - 140, gy - 4, 1, '#f472b6', t, 1); A.flower(ctx, b.x + b.w + 140, gy - 4, 1, '#facc15', t, 2);
      if (this.target != null && !this.targetRoom) { ctx.strokeStyle = 'rgba(255,255,255,.8)'; ctx.lineWidth = 4; A.ellipse(ctx, this.target, gy, 24 + Math.sin(t * 6) * 4, 10); ctx.stroke(); }
      // companion + explorer
      const hop = Math.abs(Math.sin(t * 8)) * (this.walking ? 14 : 3); ctx.fillStyle = 'rgba(0,0,0,.15)'; A.ellipse(ctx, this.companion.x, this.companion.y, 22, 8); ctx.fill(); A.emoji(ctx, FL.Save.data.companion, this.companion.x, this.companion.y - 28 - hop, 56, { flip: this.facing < 0 });
      A.explorer(ctx, this.px, this.py, g.look, { t, walking: this.walking, facing: this.facing, wave: !this.walking && this.idle > 3 && this.idle < 5 }, 1);
      this.fx.draw(ctx);
      const name = FL.Save.data.name; if (name) A.text(ctx, name, this.px, this.py - 175, { size: 22, color: '#fff', stroke: 'rgba(30,20,80,.6)' });
      this.buttons.forEach((bt) => bt.draw(ctx, t)); this.parentBtn.draw(ctx, t);
      if (this.hold > 0 && this.hold < 1.2) { ctx.strokeStyle = '#fde047'; ctx.lineWidth = 6; ctx.beginPath(); ctx.arc(50, 50, 38, -Math.PI / 2, -Math.PI / 2 + (this.hold / 1.2) * Math.PI * 2); ctx.stroke(); }
      const nu = UI.nextUnlock(); if (nu) { const s = FL.Save.data.stars; const prev = UI.prevThreshold(); const frac = Math.max(0, Math.min(1, (s - prev) / Math.max(1, nu.stars - prev))); const w = 190, h = 54, x = g.W - w - 20, y = 96; ctx.fillStyle = 'rgba(0,0,0,.35)'; A.roundRect(ctx, x, y, w, h, 27); ctx.fill(); A.emoji(ctx, nu.emoji, x + 30, y + h / 2, 32); A.text(ctx, `in ${Math.max(0, nu.stars - s)} ⭐`, x + 120, y + 18, { size: 20, color: '#fff' }); ctx.fillStyle = 'rgba(255,255,255,.3)'; A.roundRect(ctx, x + 60, y + 34, w - 76, 10, 5); ctx.fill(); ctx.fillStyle = '#fde047'; A.roundRect(ctx, x + 60, y + 34, (w - 76) * frac, 10, 5); ctx.fill(); }
      if (!FL.Save.data.visited.length && this.t < 30) { const r = this.rooms[0]; A.emoji(ctx, '👈', r.x + r.w / 2 + 50 + Math.abs(Math.sin(t * 4)) * 20, r.y, 64); }
    },
  };
  FL.scenes.world = scene;
})();
