// Letter Garden: find the letter (by name, or by the first sound of a word) among singing flowers.
(function () {
  const A = FL.Art, UI = FL.UI, G = () => FL.Game;
  const WORDS = { A: ['apple', '🍎'], B: ['butterfly', '🦋'], C: ['cat', '🐱'], D: ['dog', '🐶'], E: ['elephant', '🐘'], F: ['frog', '🐸'], G: ['grapes', '🍇'], H: ['house', '🏠'], I: ['ice cream', '🍦'], J: ['jellyfish', '🪼'], K: ['kite', '🪁'], L: ['lion', '🦁'], M: ['moon', '🌙'], N: ['nest', '🪺'], O: ['octopus', '🐙'], P: ['pig', '🐷'], Q: ['queen', '👸'], R: ['rainbow', '🌈'], S: ['star', '⭐'], T: ['turtle', '🐢'], U: ['umbrella', '☂️'], V: ['violin', '🎻'], W: ['whale', '🐳'], X: ['xylophone', '🎼'], Y: ['yo-yo', '🪀'], Z: ['zebra', '🦓'] };
  const COLORS = ['#f472b6', '#60a5fa', '#facc15', '#c084fc', '#fb923c', '#f87171', '#34d399'];
  const ALPHA = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const scene = {
    t: 0, hud: { home: true, repeat: true }, round: 0, total: 8, good: 0, flowers: [], target: null, mode: 'letter', locked: false, tries: 0, level: 1, bees: [],
    enter() {
      this.t = 0; this.round = 0; this.good = 0; this.level = FL.Save.level('letters'); this.locked = false; this.recent = [];
      this.bees = [0, 1, 2].map((i) => ({ x: Math.random() * G().W, y: 150 + Math.random() * 200, a: Math.random() * 6, e: i === 1 ? '🐝' : '🦋' }));
      FL.Save.addPlay('letters'); this.newRound(true);
    },
    newRound(first) {
      const g = G(); const n = Math.min(3 + Math.floor(this.level / 2) + Math.floor(this.round / 4), 6);
      const pool = this.level <= 1 ? 'ABCDEFGHIJKLM' : ALPHA;
      let target; do { target = pool[Math.floor(Math.random() * pool.length)]; } while (this.recent.includes(target)); this.recent.push(target); if (this.recent.length > 4) this.recent.shift();
      const others = new Set(); while (others.size < n - 1) { const c = ALPHA[Math.floor(Math.random() * 26)]; if (c !== target) others.add(c); }
      const letters = [target, ...others].sort(() => Math.random() - 0.5);
      this.lower = this.level >= 3 && Math.random() < 0.4;
      this.mode = this.level >= 2 && Math.random() < 0.45 ? 'word' : 'letter';
      this.target = target; this.tries = 0; this.locked = false; this.roundT = 0;
      const spacing = Math.min(240, (g.W - 200) / n); const x0 = g.W / 2 - ((n - 1) * spacing) / 2;
      this.flowers = letters.map((L, i) => ({ L, x: x0 + i * spacing, y: g.H - 150 - (i % 2) * 70, color: COLORS[(i + this.round) % COLORS.length], scale: 0, wob: 0, done: false, seed: Math.random() * 6, delay: i * 0.12 }));
      if (!first) FL.Audio.sfx.whoosh();
      setTimeout(() => this.repeatPrompt(), first ? 400 : 700);
    },
    repeatPrompt() {
      const L = this.target; const [word] = WORDS[L];
      if (this.mode === 'word') FL.Audio.say(`Which letter does ${word} start with?`);
      else FL.Audio.say(`Can you find the letter ${L === 'A' ? 'A' : L}?`);
    },
    down(p) {
      if (this.locked) return;
      for (const f of this.flowers) {
        if (f.scale < 0.9) continue;
        if (Math.hypot(p.x - f.x, p.y - (f.y - 130)) < 78) { this.pick(f); return; }
      }
    },
    pick(f) {
      const g = G(); const L = this.target; const [word, emoji] = WORDS[L];
      if (f.L === L) {
        this.locked = true; f.done = true; if (this.tries === 0) this.good++;
        FL.Audio.sfx.correct(); g.fx.burst(f.x, f.y - 130, { count: 30, type: 'star', colors: [f.color, '#fff', '#fde047'], speed: 380, life: 0.9, size: 12 });
        this.reveal = { x: f.x, y: f.y - 260, emoji, t: 0 };
        FL.Audio.say(`${L}! ${L} is for ${word}!`);
        FL.Audio.note(FL.Audio.SCALE[this.round % 8], { inst: 'music', vol: 0.4 });
        this.round++;
        setTimeout(() => { this.reveal = null; if (this.round >= this.total) this.finish(); else this.newRound(false); }, 2300);
      } else {
        this.tries++; f.wob = 1; FL.Audio.sfx.wrong();
        FL.Audio.say(`That's the letter ${f.L}. Try again! Find ${this.mode === 'word' ? 'the first letter of ' + word : L}.`);
      }
    },
    finish() {
      const stars = UI.starsFor(this.good, this.total); if (stars === 3) FL.Save.levelUp('letters');
      UI.showResults({ title: 'Letter Garden complete!', subtitle: `You found ${this.good} letters on the first try`, stars, emoji: '🌸', again: () => G().go('letters'), home: () => G().go('world', { at: 'letters' }) });
    },
    update(dt) {
      const g = G(); this.t += dt; this.roundT += dt;
      this.flowers.forEach((f) => { if (this.roundT > f.delay) f.scale = Math.min(1, f.scale + dt * 3); f.wob = Math.max(0, f.wob - dt * 2); });
      if (this.reveal) this.reveal.t += dt;
      if (!this.locked && this.tries >= 2 && this.roundT > 6) { /* hint glow handled in draw */ }
      this.bees.forEach((b) => { b.a += (Math.random() - 0.5) * dt * 4; b.x += Math.cos(b.a) * 60 * dt; b.y += Math.sin(b.a) * 40 * dt; if (b.x < 50 || b.x > g.W - 50 || b.y < 120 || b.y > 400) b.a += Math.PI; });
    },
    draw(ctx) {
      const g = G(); const t = this.t;
      A.sky(ctx, g.W, g.H, '#7dd3fc', '#e0f2fe'); A.sun(ctx, g.W - 150, 240, 60, t);
      A.cloud(ctx, 200 + Math.sin(t * 0.3) * 30, 150, 36, 0.9); A.cloud(ctx, g.W / 2 + 100, 90, 28, 0.8);
      A.hills(ctx, g.W, g.H, g.H * 0.5, '#bbf7d0', 2); A.hills(ctx, g.W, g.H, g.H * 0.58, '#86efac', 5); A.grass(ctx, g.W, g.H, g.H * 0.66);
      // fence
      ctx.fillStyle = '#fff7ed'; ctx.strokeStyle = '#d6d3d1'; ctx.lineWidth = 2; for (let x = 20; x < g.W; x += 60) { A.roundRect(ctx, x, g.H * 0.6, 22, 90, 6); ctx.fill(); ctx.stroke(); } ctx.fillRect(0, g.H * 0.62, g.W, 12); ctx.fillRect(0, g.H * 0.66, g.W, 12);
      this.bees.forEach((b) => A.emoji(ctx, b.e, b.x, b.y + Math.sin(t * 12) * 4, 34, { flip: Math.cos(b.a) < 0 }));
      // prompt
      const [word, emoji] = WORDS[this.target];
      if (this.mode === 'word') UI.banner(ctx, `${word} starts with...?`, { emoji, size: 40, minW: 640 });
      else UI.banner(ctx, `Find the letter ${this.target}`, { emoji: '🔍', size: 44 });
      UI.progressDots(ctx, this.round, this.total, 140);
      // flowers
      this.flowers.forEach((f) => {
        const sc = f.scale * (f.done ? 1.15 : 1); if (sc <= 0) return;
        const wob = Math.sin(t * 30) * f.wob * 0.15; const bob = Math.sin(t * 2 + f.seed) * 4;
        ctx.save(); ctx.translate(f.x, f.y); ctx.scale(sc, sc); ctx.rotate(wob);
        ctx.strokeStyle = '#16a34a'; ctx.lineWidth = 12; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(8, -70, 0, -130 + bob); ctx.stroke();
        ctx.fillStyle = '#22c55e'; ctx.strokeStyle = 'rgba(20,83,45,.5)'; ctx.lineWidth = 3; A.ellipse(ctx, -26, -60, 26, 12); ctx.fill(); ctx.stroke(); A.ellipse(ctx, 26, -85, 26, 12); ctx.fill(); ctx.stroke();
        const hint = !this.locked && this.tries >= 2 && f.L === this.target; if (hint) { ctx.save(); ctx.shadowColor = '#fde047'; ctx.shadowBlur = 40 + Math.sin(t * 8) * 20; ctx.fillStyle = 'rgba(253,224,71,.5)'; A.circle(ctx, 0, -130 + bob, 85); ctx.fill(); ctx.restore(); }
        A.bigFlower(ctx, 0, -130 + bob, 72, f.color, { rot: t * 0.2 + f.seed });
        const shown = this.lower && !f.done ? f.L.toLowerCase() : f.L;
        A.text(ctx, shown, 0, -128 + bob, { size: 58, color: '#7c2d12', weight: 700 });
        ctx.restore();
      });
      if (this.reveal) { const r = this.reveal; const k = Math.min(1, r.t / 0.4); A.emoji(ctx, r.emoji, r.x, r.y - k * 40 - Math.sin(r.t * 4) * 8, 40 + k * 70); A.text(ctx, WORDS[this.target][0], r.x, r.y - k * 40 - 90, { size: 40, color: '#fff', stroke: '#7c2d12', strokeWidth: 7 }); }
      A.princess(ctx, 130, g.H - 40, g.look, { t, facing: 1, wave: !!this.reveal }, 1);
      A.emoji(ctx, FL.Save.data.companion, 230, g.H - 60 - Math.abs(Math.sin(t * 5)) * 8, 56);
    },
  };
  FL.scenes.letters = scene;
})();
