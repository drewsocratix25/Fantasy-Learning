// Pattern Bridge: musical creatures make a pattern; pick which comes next, then hop across.
(function () {
  const A = FL.Art, UI = FL.UI, G = () => FL.Game;
  const CREATURES = [
    { e: '🐻', name: 'bear', inst: 'kick', note: 60, color: '#a16207' },
    { e: '🐰', name: 'bunny', inst: 'bell', note: 'E6', color: '#f9a8d4' },
    { e: '🦊', name: 'fox', inst: 'flute', note: 'G5', color: '#fb923c' },
    { e: '🐸', name: 'frog', inst: 'wood', note: 900, color: '#4ade80' },
  ];
  const TEMPLATES = { 1: ['AB', 'AB', 'AAB'], 2: ['AB', 'AAB', 'ABB', 'ABC'], 3: ['ABC', 'AABB', 'ABB', 'ABCC', 'AAB'] };
  const scene = {
    t: 0, hud: { home: true, repeat: true }, round: 0, total: 6, good: 0, seq: [], answer: null, choices: [], locked: true, tries: 0, level: 1, lit: -1, playing: false, hopX: 0, hopping: false,
    enter() { this.t = 0; this.round = 0; this.good = 0; this.level = FL.Save.level('patterns'); FL.Save.addPlay('patterns'); this.newRound(true); },
    newRound(first) {
      const g = G(); const tpl = TEMPLATES[Math.min(3, this.level)]; const pat = tpl[Math.floor(Math.random() * tpl.length)];
      const kinds = [...new Set(pat.split(''))]; const picks = CREATURES.slice().sort(() => Math.random() - 0.5).slice(0, kinds.length); const map = {}; kinds.forEach((k, i) => { map[k] = picks[i]; });
      const reps = pat.length <= 2 ? 3 : 2; let full = ''; for (let i = 0; i < reps; i++) full += pat; full += pat[0];
      // a few extra so the last one is inside the pattern
      const items = full.split('').map((k) => map[k]); this.answer = items.pop(); this.seq = items; this.slots = items.length + 1;
      const opts = new Set([this.answer]); const pool = CREATURES.filter((c) => picks.includes(c) || opts.size < 3); while (opts.size < Math.min(3, pool.length)) opts.add(pool[Math.floor(Math.random() * pool.length)]);
      this.choices = [...opts].sort(() => Math.random() - 0.5).map((c, i, arr) => ({ c, x: g.W / 2 + (i - (arr.length - 1) / 2) * 200, y: g.H - 130, wob: 0 }));
      this.tries = 0; this.locked = true; this.lit = -1; this.hopping = false; this.hopStep = -1; this.roundT = 0; this.placed = null;
      if (!first) FL.Audio.sfx.whoosh();
      setTimeout(() => this.playPattern(true), first ? 500 : 800);
    },
    slotX(i) { const g = G(); const w = Math.min(120, (g.W - 200) / this.slots); return g.W / 2 + (i - (this.slots - 1) / 2) * w; },
    playPattern(thenAsk) {
      this.playing = true; const step = 0.5; const t0 = FL.Audio.now() + 0.1;
      this.seq.forEach((c, i) => { FL.Audio.note(c.note, { inst: c.inst, when: t0 + i * step, vol: 0.5, dur: 0.4 }); setTimeout(() => { this.lit = i; G().fx.burst(this.slotX(i), G().H / 2 - 40, { count: 6, type: 'note', colors: [c.color], speed: 150, life: 0.7, size: 10, gravity: -150, spread: 1 }); }, (i * step + 0.1) * 1000); });
      setTimeout(() => { this.lit = -1; this.playing = false; this.locked = false; if (thenAsk) FL.Audio.say('What comes next?'); }, (this.seq.length * step + 0.3) * 1000);
    },
    repeatPrompt() { if (!this.playing && !this.hopping) { this.locked = true; this.playPattern(true); } },
    down(p) {
      if (this.locked) return;
      if (Math.hypot(p.x - this.slotX(this.slots - 1), p.y - (G().H / 2 - 40)) < 60) { this.repeatPrompt(); return; }
      for (const ch of this.choices) { if (Math.hypot(p.x - ch.x, p.y - ch.y) < 80) { this.pick(ch); return; } }
    },
    pick(ch) {
      const g = G();
      if (ch.c === this.answer) {
        this.locked = true; if (this.tries === 0) this.good++; this.placed = ch.c; FL.Audio.sfx.correct();
        g.fx.burst(this.slotX(this.slots - 1), g.H / 2 - 40, { count: 30, type: 'star', colors: ['#fde047', '#fff', ch.c.color], speed: 360, life: 0.9, size: 12 });
        FL.Audio.say(`Yes! The ${ch.c.name} comes next!`);
        // play the full pattern as a tune while the princess hops across
        setTimeout(() => { this.hopping = true; this.hopStep = 0; const all = this.seq.concat([ch.c]); const step = 0.42; const t0 = FL.Audio.now() + 0.05; all.forEach((c, i) => { FL.Audio.note(c.note, { inst: c.inst, when: t0 + i * step, vol: 0.5, dur: 0.4 }); setTimeout(() => { this.hopStep = i; this.lit = i; FL.Audio.sfx.hop(); }, i * step * 1000); }); setTimeout(() => { this.hopping = false; this.lit = -1; this.round++; if (this.round >= this.total) this.finish(); else this.newRound(false); }, (all.length * step + 0.8) * 1000); }, 1300);
      } else { this.tries++; ch.wob = 1; FL.Audio.sfx.wrong(); FL.Audio.say(`Hmm, not the ${ch.c.name}. Listen again!`); this.locked = true; setTimeout(() => this.playPattern(false), 1600); }
    },
    finish() {
      const stars = UI.starsFor(this.good, this.total); if (stars === 3) FL.Save.levelUp('patterns');
      UI.showResults({ title: 'Pattern Bridge complete!', subtitle: `${this.good} of ${this.total} patterns on the first try`, stars, emoji: '🌉', again: () => G().go('patterns'), home: () => G().go('world', { at: 'patterns' }) });
    },
    update(dt) { this.t += dt; this.roundT += dt; this.choices.forEach((c) => { c.wob = Math.max(0, c.wob - dt * 2); }); },
    draw(ctx) {
      const g = G(); const t = this.t;
      A.sky(ctx, g.W, g.H, '#a5f3fc', '#ecfeff'); A.sun(ctx, g.W - 150, 240, 56, t);
      A.hills(ctx, g.W, g.H, g.H * 0.4, '#bbf7d0', 6); A.grass(ctx, g.W, g.H, g.H * 0.46);
      A.tree(ctx, 100, g.H * 0.5, 1, 0, t); A.tree(ctx, g.W - 100, g.H * 0.52, 1, 2, t);
      // stream
      const sy = g.H / 2 + 10; ctx.fillStyle = '#7dd3fc'; A.roundRect(ctx, -20, sy - 90, g.W + 40, 180, 60); ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,.6)'; ctx.lineWidth = 4; for (let i = 0; i < 6; i++) { const wx = ((t * 60 + i * 260) % (g.W + 200)) - 100; ctx.beginPath(); ctx.moveTo(wx, sy + 20 + (i % 2) * 40); ctx.quadraticCurveTo(wx + 20, sy + 10 + (i % 2) * 40, wx + 40, sy + 20 + (i % 2) * 40); ctx.stroke(); }
      A.emoji(ctx, '🐟', 200 + ((t * 40) % (g.W - 400)), sy + 50, 30, { alpha: 0.7 }); A.emoji(ctx, '🦆', g.W - 250 - ((t * 30) % (g.W - 500)), sy - 40, 40, { flip: true });
      UI.banner(ctx, this.hopping ? 'Hop hop hop!' : this.playing ? 'Listen to the pattern...' : 'What comes next?', { emoji: '🎶', size: 42 });
      UI.progressDots(ctx, this.round, this.total, 140);
      // stones
      for (let i = 0; i < this.slots; i++) {
        const x = this.slotX(i); const y = sy - 50; const isQ = i === this.slots - 1; const lit = this.lit === i;
        ctx.fillStyle = 'rgba(0,0,0,.12)'; A.ellipse(ctx, x, y + 50, 52, 16); ctx.fill();
        ctx.fillStyle = lit ? '#fde047' : '#e7e5e4'; ctx.strokeStyle = '#a8a29e'; ctx.lineWidth = 4; A.ellipse(ctx, x, y + 40, 52, 22); ctx.fill(); ctx.stroke();
        const c = isQ ? this.placed : this.seq[i];
        if (c) { const b = lit ? -14 : 0; A.emoji(ctx, c.e, x, y - 10 + b + Math.sin(t * 3 + i) * 3, 70, { shadow: true }); }
        else { const b = Math.abs(Math.sin(t * 4)) * 10; ctx.fillStyle = 'rgba(255,255,255,.7)'; ctx.strokeStyle = '#f472b6'; ctx.lineWidth = 5; A.circle(ctx, x, y - 10 - b, 40); ctx.fill(); ctx.stroke(); A.text(ctx, '?', x, y - 8 - b, { size: 56, color: '#db2777' }); }
      }
      // princess hopping across
      let px = this.slotX(0) - 130, py = sy - 20; let onStone = false;
      if (this.hopping && this.hopStep >= 0) { px = this.slotX(this.hopStep); py = sy - 30 - Math.abs(Math.sin(t * 10)) * 20; onStone = true; }
      A.princess(ctx, px, py + (onStone ? 0 : 30), g.look, { t, facing: 1, walking: this.hopping, dance: this.hopping ? 0.5 : 0 }, 0.95);
      A.emoji(ctx, FL.Save.data.companion, px - 80, py + 10 - Math.abs(Math.sin(t * 6)) * 12, 52);
      // choices
      this.choices.forEach((ch) => {
        const wob = Math.sin(t * 28) * ch.wob * 0.15; ctx.save(); ctx.translate(ch.x, ch.y + Math.sin(t * 2 + ch.x) * 4); ctx.rotate(wob);
        ctx.fillStyle = 'rgba(0,0,0,.15)'; A.roundRect(ctx, -75, -70 + 8, 150, 150, 36); ctx.fill();
        ctx.fillStyle = '#fff'; ctx.strokeStyle = ch.c.color; ctx.lineWidth = 8; A.roundRect(ctx, -75, -75, 150, 150, 36); ctx.fill(); ctx.stroke();
        A.emoji(ctx, ch.c.e, 0, -8, 86); A.text(ctx, ch.c.name, 0, 52, { size: 22, color: '#57534e' }); ctx.restore();
      });
      if (!this.locked) A.text(ctx, 'Tap the ? to hear it again', g.W / 2, sy - 150, { size: 22, color: '#fff', stroke: 'rgba(80,20,90,.4)' });
    },
  };
  FL.scenes.patterns = scene;
})();
