// Wizard's Lab: the wizard holds something over the pool. Sink or float? Guess, then watch.
(function () {
  const A = FL.Art, UI = FL.UI, G = () => FL.Game, D = FL.Data;
  const art = (w) => FL.Lines.article(w);
  const scene = {
    hud: { home: true, repeat: true }, music: 'cave', t: 0, round: 0, total: 8, good: 0, state: 'idle', item: null, guess: null, objY: 0, objX: 0, bob: 0, recent: [], buttons: [], bubbles: [],
    enter() {
      const g = G(); this.t = 0; this.round = 0; this.good = 0; this.recent = []; this.level = FL.Save.level('lab'); FL.Save.addPlay('lab'); this.layout();
      this.bubbles = []; for (let i = 0; i < 12; i++) this.bubbles.push({ x: Math.random(), y: Math.random(), s: 4 + Math.random() * 8, v: 20 + Math.random() * 30 });
      this.state = 'intro'; FL.Audio.say(this.level === 1 ? 'Welcome to my lab! Does it sink, or does it float? Heavy things sink. Light things float.' : 'Welcome back to my lab! Does it sink, or does it float?');
      FL.Game.later(() => this.newRound(), this.level === 1 ? 6500 : 3500);
    },
    layout() {
      const g = G();
      this.sinkBtn = new UI.Button({ x: g.W / 2 - 400, y: g.H - 150, w: 300, h: 100, label: 'Sinks', emoji: '⬇️', color: '#60a5fa', size: 40, onTap: () => this.answer(false) });
      this.floatBtn = new UI.Button({ x: g.W / 2 + 100, y: g.H - 150, w: 300, h: 100, label: 'Floats', emoji: '⬆️', color: '#4ade80', size: 40, onTap: () => this.answer(true) });
      this.buttons = [this.sinkBtn, this.floatBtn];
    },
    resize() { this.layout(); },
    poolY() { return G().H - 260; },
    newRound() {
      let it; do { it = FL.rnd(D.SINK_FLOAT); } while (this.recent.includes(it[1])); this.recent.push(it[1]); if (this.recent.length > 10) this.recent.shift();
      this.item = it; this.guess = null; this.state = 'ask'; this.objX = 300; this.objY = 330; this.bob = 0; this.roundT = 0;
      FL.Audio.sfx.whoosh(); FL.Game.later(() => this.repeatPrompt(), 500);
    },
    repeatPrompt(queue) { if (this.state === 'ask' && this.item) FL.Audio.say(`Here is ${art(this.item[1])} ${this.item[1]}. Does it sink or float?`, { interrupt: !queue }); },
    answer(floats) {
      if (this.state !== 'ask') return; this.guess = floats; this.state = 'drop'; this.dropT = 0; FL.Audio.say("Let's see!");
      this.sinkBtn.pulse = false; this.floatBtn.pulse = false;
    },
    reveal() {
      const g = G(); const it = this.item; const right = this.guess === it[2]; if (right) this.good++;
      this.state = 'reveal'; FL.Audio.sfx[right ? 'correct' : 'pop'](); g.fx.burst(this.objX, this.poolY(), { count: 24, colors: ['#bae6fd', '#fff', '#7dd3fc'], speed: 300, life: 0.8, size: 8, gravity: 600, dir: -Math.PI / 2, spread: 1.6 });
      FL.Game.later(() => FL.Audio.say(`The ${it[1]} ${it[2] ? 'floats' : 'sinks'}! ${right ? 'You were right!' : 'Now you know!'}`), 400);
      this.round++; FL.Game.later(() => { if (this.round >= this.total) this.finish(); else this.newRound(); }, 3400);
    },
    finish() {
      const stars = UI.starsFor(this.good, this.total); if (stars === 3) FL.Save.levelUp('lab');
      UI.showResults({ title: "Wizard's Lab complete!", subtitle: `${this.good} of ${this.total} guesses were right`, stars, emoji: '🧪', again: () => G().go('lab'), home: () => G().go('world', { at: 'lab' }) });
    },
    down(p) { if (this.state === 'ask') UI.pressDown(this.buttons, p); },
    up(p) { UI.pressUp(this.buttons, p); },
    key(k) { if (k === 's' || k === 'ArrowDown') this.answer(false); if (k === 'f' || k === 'ArrowUp') this.answer(true); },
    update(dt) {
      const g = G(); this.t += dt; this.roundT = (this.roundT || 0) + dt; const py = this.poolY();
      if (this.state === 'ask') { const k = Math.min(1, this.roundT / 0.8); const e = 1 - Math.pow(1 - k, 3); this.objX = 300 + (g.W / 2 - 300) * e; this.objY = 330 - Math.sin(k * Math.PI) * 120; this.sinkBtn.pulse = this.floatBtn.pulse = k >= 1; }
      if (this.state === 'drop') { this.dropT += dt; this.objY += (300 + this.dropT * 900) * dt; if (this.objY >= py + 10) { this.objY = py + 10; this.reveal(); } }
      if (this.state === 'reveal') { if (this.item[2]) { this.bob += dt; this.objY = py + 6 + Math.sin(this.bob * 3) * 8; } else this.objY = Math.min(g.H - 90, this.objY + 220 * dt); }
      this.bubbles.forEach((b) => { b.y -= b.v * dt / 200; if (b.y < 0) { b.y = 1; b.x = Math.random(); } });
    },
    draw(ctx) {
      const g = G(); const t = this.t; const py = this.poolY();
      const grad = ctx.createLinearGradient(0, 0, 0, g.H); grad.addColorStop(0, '#1e1b4b'); grad.addColorStop(1, '#4c1d95'); ctx.fillStyle = grad; ctx.fillRect(0, 0, g.W, g.H);
      ctx.fillStyle = 'rgba(255,255,255,.04)'; for (let r = 0; r < 10; r++) for (let c = 0; c < g.W / 100 + 1; c++) ctx.fillRect(c * 100 + (r % 2) * 50, r * 70, 90, 60);
      // shelves of potions
      [[160, 140], [g.W - 160, 140]].forEach(([x, y]) => { ctx.fillStyle = '#78350f'; A.roundRect(ctx, x - 130, y + 40, 260, 14, 6); ctx.fill(); ['🧪', '⚗️', '🔮', '📜', '🕯️'].forEach((e, i) => A.emoji(ctx, e, x - 100 + i * 50, y + 14 + Math.sin(t * 2 + i) * 2, 36)); });
      for (let i = 0; i < 20; i++) { ctx.fillStyle = `rgba(196,181,253,${0.3 + Math.sin(t * 2 + i) * 0.25})`; A.circle(ctx, (i * 131) % g.W, (i * 71) % (g.H * 0.4), 2.5); ctx.fill(); }
      // pool
      ctx.fillStyle = '#57534e'; A.roundRect(ctx, g.W / 2 - 330, py - 30, 660, g.H - py + 60, 40); ctx.fill();
      ctx.fillStyle = '#78716c'; for (let i = 0; i < 8; i++) { ctx.fillRect(g.W / 2 - 320 + i * 82, py - 26, 70, 18); }
      ctx.save(); A.roundRect(ctx, g.W / 2 - 300, py, 600, g.H - py, 30); ctx.clip();
      const wg = ctx.createLinearGradient(0, py, 0, g.H); wg.addColorStop(0, '#38bdf8'); wg.addColorStop(1, '#1e40af'); ctx.fillStyle = wg; ctx.fillRect(g.W / 2 - 300, py, 600, g.H - py);
      this.bubbles.forEach((b) => { ctx.strokeStyle = 'rgba(255,255,255,.5)'; ctx.lineWidth = 2; A.circle(ctx, g.W / 2 - 300 + b.x * 600, py + b.y * (g.H - py), b.s); ctx.stroke(); });
      if (this.state === 'reveal' && this.item) { const half = this.item[2] ? 0.55 : 1; ctx.save(); if (this.item[2]) { ctx.beginPath(); ctx.rect(0, py + 4, g.W, g.H); ctx.clip(); ctx.globalAlpha = 0.55; A.emoji(ctx, this.item[0], this.objX, this.objY, 90); ctx.restore(); ctx.save(); ctx.beginPath(); ctx.rect(0, 0, g.W, py + 4); ctx.clip(); A.emoji(ctx, this.item[0], this.objX, this.objY, 90); } else { ctx.globalAlpha = 0.7; A.emoji(ctx, this.item[0], this.objX, this.objY, 90); } ctx.restore(); void half; }
      ctx.restore();
      ctx.strokeStyle = 'rgba(255,255,255,.7)'; ctx.lineWidth = 4; ctx.beginPath(); for (let x = g.W / 2 - 300; x <= g.W / 2 + 300; x += 10) { const y = py + Math.sin(x / 40 + t * 3) * 4; if (x === g.W / 2 - 300) ctx.moveTo(x, y); else ctx.lineTo(x, y); } ctx.stroke();
      // wizard and the object in the air
      const wave = this.state === 'ask' ? Math.sin(t * 4) * 6 : 0; A.emoji(ctx, '🧙', 200, 420 + Math.sin(t * 2) * 5, 170, { shadow: true }); A.emoji(ctx, '✨', 290 + wave, 330, 34, { alpha: 0.6 + Math.sin(t * 5) * 0.3 });
      if (this.item && (this.state === 'ask' || this.state === 'drop')) { ctx.fillStyle = 'rgba(0,0,0,.2)'; A.ellipse(ctx, this.objX, py - 2, 40, 10); ctx.fill(); A.emoji(ctx, this.item[0], this.objX, this.objY, 90, { shadow: true }); }
      if (this.item && this.state !== 'intro') A.text(ctx, this.item[1], g.W / 2, py - 60, { size: 36, color: '#fff', stroke: '#312e81', strokeWidth: 6 });
      const label = this.state === 'intro' ? 'Sink or float?' : this.state === 'ask' ? 'Does it sink or float?' : this.state === 'drop' ? "Let's see..." : this.item[2] ? `The ${this.item[1]} floats!` : `The ${this.item[1]} sinks!`;
      UI.banner(ctx, label, { emoji: '🧪', size: 40 }); UI.progressDots(ctx, this.round, this.total, 140);
      if (this.state === 'reveal') A.emoji(ctx, this.guess === this.item[2] ? '✅' : '💡', g.W / 2 + 260, py - 70, 56);
      if (this.state === 'ask') this.buttons.forEach((b) => b.draw(ctx, t));
      A.explorer(ctx, g.W - 130, g.H - 30, g.look, { t, facing: -1, wave: this.state === 'reveal' && this.guess === this.item[2] }, 0.95);
      A.emoji(ctx, FL.Save.data.companion, g.W - 220, g.H - 50 - Math.abs(Math.sin(t * 5)) * 8, 48, { flip: true });
    },
  };
  FL.scenes.lab = scene;
})();
