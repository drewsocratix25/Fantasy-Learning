// Acorn Spelling: tap the letters in order to spell a three-letter word; every letter sings.
(function () {
  const A = FL.Art, UI = FL.UI, G = () => FL.Game, D = FL.Data;
  const scene = {
    hud: { home: true, repeat: true }, music: 'forest', t: 0, round: 0, total: 6, good: 0, tries: 0, locked: false, word: null, tiles: [], idx: 0, recent: [],
    enter() { this.t = 0; this.round = 0; this.good = 0; this.recent = []; this.level = FL.Save.level('spelling'); FL.Save.addPlay('spelling'); this.newRound(true); },
    newRound(first) {
      const g = G(); let w; do { w = FL.rnd(D.WORDS3); } while (this.recent.includes(w[0])); this.recent.push(w[0]); if (this.recent.length > 6) this.recent.shift();
      this.word = w[0]; this.emoji = w[1]; this.letters = w[0].toUpperCase().split(''); this.idx = 0; this.tries = 0; this.locked = false; this.roundT = 0; this.done = false;
      const extra = new Set(); const ALPHA = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'; const nExtra = this.level >= 3 ? 4 : this.level === 2 ? 3 : 2;
      while (extra.size < nExtra) { const c = ALPHA[Math.floor(Math.random() * 26)]; if (!this.letters.includes(c)) extra.add(c); }
      const all = FL.shuffle(this.letters.concat([...extra])); const spacing = Math.min(170, (g.W - 200) / all.length); const x0 = g.W / 2 - ((all.length - 1) * spacing) / 2;
      this.tiles = all.map((Lt, i) => ({ L: Lt, x: x0 + i * spacing, y: g.H - 150 - (i % 2) * 50, hx: x0 + i * spacing, hy: g.H - 150 - (i % 2) * 50, used: false, wob: 0, seed: Math.random() * 6, scale: 0, delay: i * 0.08, fly: 0 }));
      if (!first) FL.Audio.sfx.whoosh();
      FL.Game.later(() => this.repeatPrompt(), first ? 400 : 700);
    },
    repeatPrompt(queue) { FL.Audio.say(`Can you spell ${this.word}?`, { interrupt: !queue }); },
    slotX(i) { return G().W / 2 + (i - 1) * 120; },
    down(p) {
      if (this.locked) return;
      for (const tl of this.tiles) { if (tl.used || tl.scale < 0.9) continue; if (Math.hypot(p.x - tl.x, p.y - (tl.y - 50)) < 60) { this.tap(tl); return; } }
    },
    tap(tl) {
      const g = G(); const need = this.letters[this.idx];
      if (tl.L === need) {
        tl.used = true; tl.slot = this.idx; tl.fly = 0; FL.Audio.say(tl.L); FL.Audio.note(FL.Audio.SCALE[this.idx * 2 + this.round % 3], { inst: 'music', vol: 0.45 });
        g.fx.burst(tl.x, tl.y - 50, { count: 12, type: 'star', colors: ['#fde047', '#fff'], speed: 220, life: 0.6, size: 9 }); this.idx++;
        if (this.idx >= this.letters.length) { this.locked = true; this.done = true; if (this.tries === 0) this.good++; FL.Game.later(() => { FL.Audio.sfx.correct(); FL.Audio.say(`${this.word}! You spelled ${this.word}!`); g.fx.burst(g.W / 2, 330, { count: 50, type: 'confetti', speed: 500, life: 1.4 }); }, 700); this.round++; FL.Game.later(() => { if (this.round >= this.total) this.finish(); else this.newRound(false); }, 3600); }
      } else { this.tries++; tl.wob = 1; FL.Audio.sfx.wrong(); FL.Audio.say(`We need the letter ${need}.`); }
    },
    finish() {
      const stars = UI.starsFor(this.good, this.total); if (stars === 3) FL.Save.levelUp('spelling');
      UI.showResults({ title: 'Acorn Spelling complete!', subtitle: `${this.good} of ${this.total} words spelled with no slips`, stars, emoji: '🐿️', again: () => G().go('spelling'), home: () => G().go('world', { at: 'spelling' }) });
    },
    update(dt) { this.t += dt; this.roundT += dt; this.tiles.forEach((tl) => { if (this.roundT > tl.delay) tl.scale = Math.min(1, tl.scale + dt * 4); tl.wob = Math.max(0, tl.wob - dt * 2); if (tl.used) { tl.fly = Math.min(1, tl.fly + dt * 3); const k = 1 - Math.pow(1 - tl.fly, 3); tl.x = tl.hx + (this.slotX(tl.slot) - tl.hx) * k; tl.y = tl.hy + (545 - tl.hy) * k; } }); },
    draw(ctx) {
      const g = G(); const t = this.t; FL.bg.forest(ctx, g, t);
      UI.banner(ctx, `Spell the word!`, { emoji: '🐿️', size: 40 }); UI.progressDots(ctx, this.round, this.total, 140);
      ctx.fillStyle = 'rgba(255,255,255,.85)'; A.roundRect(ctx, g.W / 2 - 110, 180, 220, 190, 36); ctx.fill(); ctx.strokeStyle = '#16a34a'; ctx.lineWidth = 6; A.roundRect(ctx, g.W / 2 - 110, 180, 220, 190, 36); ctx.stroke();
      A.emoji(ctx, this.emoji, g.W / 2, 275 + Math.sin(t * 2) * 5, 130);
      if (this.done) A.text(ctx, this.word, g.W / 2, 560, { size: 54, color: '#fff', stroke: '#166534', strokeWidth: 8 });
      for (let i = 0; i < this.letters.length; i++) { const x = this.slotX(i); const filled = i < this.idx; ctx.fillStyle = filled ? '#fef9c3' : 'rgba(255,255,255,.6)'; ctx.strokeStyle = i === this.idx && !this.done ? '#f59e0b' : '#a16207'; ctx.lineWidth = i === this.idx && !this.done ? 8 : 5; A.roundRect(ctx, x - 48, 420, 96, 100, 20); ctx.fill(); ctx.stroke(); if (i === this.idx && !this.done) { const b = Math.abs(Math.sin(t * 5)) * 10; A.emoji(ctx, '👇', x, 395 - b, 40); } }
      this.tiles.forEach((tl) => {
        if (tl.scale <= 0) return; const wob = Math.sin(t * 28) * tl.wob * 0.15; const bob = tl.used ? 0 : Math.sin(t * 2 + tl.seed) * 5;
        ctx.save(); ctx.translate(tl.x, tl.y - 50 + bob); ctx.rotate(wob); ctx.scale(tl.scale, tl.scale);
        const hint = !this.locked && this.tries >= 2 && tl.L === this.letters[this.idx] && !tl.used; if (hint) { ctx.shadowColor = '#fde047'; ctx.shadowBlur = 30 + Math.sin(t * 8) * 15; }
        if (!tl.used) { ctx.fillStyle = 'rgba(0,0,0,.15)'; A.ellipse(ctx, 0, 60, 40, 12); ctx.fill(); }
        ctx.fillStyle = '#a16207'; ctx.strokeStyle = '#78350f'; ctx.lineWidth = 4; ctx.beginPath(); ctx.ellipse(0, -30, 46, 26, 0, Math.PI, 0); ctx.closePath(); ctx.fill(); ctx.stroke();
        ctx.fillStyle = '#d97706'; ctx.beginPath(); ctx.moveTo(-44, -30); ctx.quadraticCurveTo(0, 60, 44, -30); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.shadowBlur = 0;
        ctx.fillStyle = '#78350f'; for (let i = -3; i <= 3; i++) { A.circle(ctx, i * 12, -38, 3); ctx.fill(); }
        A.text(ctx, tl.L, 0, -2, { size: 44, color: '#fff7ed', stroke: '#78350f', strokeWidth: 5 });
        ctx.restore();
      });
      A.princess(ctx, 120, g.H - 40, g.look, { t, facing: 1, wave: this.done }, 0.95);
      A.emoji(ctx, FL.Save.data.companion, 210, g.H - 60 - Math.abs(Math.sin(t * 5)) * 8, 52);
    },
  };
  FL.scenes.spelling = scene;
})();
