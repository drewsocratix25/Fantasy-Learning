// Shared scaffold for "prompt + tap the right card" games (rhymes, owl math, clock, reading, number line).
(function () {
  const A = FL.Art, UI = FL.UI, G = () => FL.Game;
  FL.rnd = (arr) => arr[Math.floor(Math.random() * arr.length)];
  FL.shuffle = (arr) => arr.slice().sort(() => Math.random() - 0.5);
  // Backgrounds shared by the forest and peaks games.
  FL.bg = {
    forest(ctx, g, t) {
      const grad = ctx.createLinearGradient(0, 0, 0, g.H); grad.addColorStop(0, '#0f766e'); grad.addColorStop(0.5, '#5eead4'); grad.addColorStop(1, '#bbf7d0'); ctx.fillStyle = grad; ctx.fillRect(0, 0, g.W, g.H);
      A.cloud(ctx, g.W - 200 + Math.sin(t * 0.3) * 20, 200, 30, 0.5); A.cloud(ctx, 260, 170, 26, 0.45);
      for (let i = 0; i < 9; i++) { const x = (i / 8) * g.W; A.pine(ctx, x, g.H * 0.62 + (i % 2) * 30, 1.3 + (i % 3) * 0.2, false, t); }
      A.grass(ctx, g.W, g.H, g.H * 0.64, '#4ade80', '#15803d');
      for (let i = 0; i < 7; i++) A.mushroom(ctx, 60 + i * (g.W / 7) + (i % 2) * 40, g.H - 20 - (i % 3) * 12, 0.9 + (i % 3) * 0.2, ['#ef4444', '#a855f7', '#f97316'][i % 3], t);
      for (let i = 0; i < 14; i++) { ctx.fillStyle = `rgba(253,224,71,${0.3 + Math.sin(t * 3 + i) * 0.3})`; A.circle(ctx, (i * 173 + t * 15) % g.W, 200 + ((i * 97) % 300) + Math.sin(t + i) * 10, 3); ctx.fill(); }
    },
    peaks(ctx, g, t) {
      const grad = ctx.createLinearGradient(0, 0, 0, g.H); grad.addColorStop(0, '#60a5fa'); grad.addColorStop(0.6, '#e0f2fe'); grad.addColorStop(1, '#fff'); ctx.fillStyle = grad; ctx.fillRect(0, 0, g.W, g.H);
      A.sun(ctx, g.W - 150, 240, 50, t);
      ctx.fillStyle = '#c7d2fe'; ctx.beginPath(); ctx.moveTo(0, g.H * 0.7); for (let i = 0; i <= 6; i++) { const x = (i / 6) * g.W; ctx.lineTo(x - g.W / 12, g.H * 0.36 + (i % 2) * 60); ctx.lineTo(x, g.H * 0.7); } ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#fff'; for (let i = 0; i <= 6; i++) { const x = (i / 6) * g.W - g.W / 12, y = g.H * 0.36 + (i % 2) * 60; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + 40, y + 60); ctx.lineTo(x - 40, y + 60); ctx.closePath(); ctx.fill(); }
      A.grass(ctx, g.W, g.H, g.H * 0.68, '#f8fafc', '#cbd5e1');
      for (let i = 0; i < 6; i++) A.crystal(ctx, 80 + i * (g.W / 6), g.H - 30 - (i % 2) * 20, 0.9, ['#93c5fd', '#c4b5fd', '#f9a8d4', '#99f6e4'][i % 4], t);
      for (let i = 0; i < 24; i++) { ctx.fillStyle = 'rgba(255,255,255,.85)'; A.circle(ctx, (i * 151 + Math.sin(t + i) * 30) % g.W, (i * 89 + t * 35) % g.H, 3); ctx.fill(); }
    },
  };
  FL.makeQuiz = function (cfg) {
    const scene = {
      hud: { home: true, repeat: true }, music: cfg.music, t: 0, round: 0, total: cfg.total || 8, good: 0, tries: 0, locked: false, cur: null, cards: [], recent: [], level: 1,
      enter() { this.t = 0; this.round = 0; this.good = 0; this.recent = []; this.level = FL.Save.level(cfg.id); FL.Save.addPlay(cfg.id); this.next(true); },
      next(first) {
        const g = G(); this.cur = cfg.newRound(this); this.tries = 0; this.locked = false; this.roundT = 0;
        const n = this.cur.choices.length; const size = n <= 3 ? 190 : n === 4 ? 170 : 150; const gap = 40; const x0 = g.W / 2 - (n * size + (n - 1) * gap) / 2;
        this.cards = this.cur.choices.map((c, i) => Object.assign({ x: x0 + i * (size + gap), y: g.H - 60 - size, w: size, h: size, wob: 0, scale: 0, delay: i * 0.1 }, c));
        if (!first) FL.Audio.sfx.whoosh();
        FL.Game.later(() => this.repeatPrompt(), first ? 400 : 700);
      },
      repeatPrompt(queue) { FL.Audio.say(this.cur.say || this.cur.prompt, { interrupt: !queue }); },
      down(p) { if (this.locked) return; for (const c of this.cards) { if (c.scale > 0.9 && p.x >= c.x && p.x <= c.x + c.w && p.y >= c.y && p.y <= c.y + c.h) { this.pick(c); return; } } },
      pick(c) {
        const g = G();
        if (c.correct) {
          this.locked = true; c.done = true; if (this.tries === 0) this.good++;
          FL.Audio.sfx.correct(); g.fx.burst(c.x + c.w / 2, c.y + c.h / 2, { count: 30, type: 'star', colors: ['#fde047', '#fff', cfg.cardColor || '#f472b6'], speed: 380, life: 0.9, size: 12 });
          FL.Audio.say(c.sayRight); if (this.cur.onCorrect) this.cur.onCorrect(this);
          this.round++; FL.Game.later(() => { if (this.round >= this.total) this.finish(); else this.next(false); }, 2300);
        } else { this.tries++; c.wob = 1; FL.Audio.sfx.wrong(); FL.Audio.say(c.sayWrong); this.repeatPrompt(true); }
      },
      finish() {
        const stars = UI.starsFor(this.good, this.total); if (stars === 3) FL.Save.levelUp(cfg.id);
        UI.showResults({ title: `${cfg.title} complete!`, subtitle: `${this.good} of ${this.total} right on the first try`, stars, emoji: cfg.emoji, again: () => G().go(cfg.id), home: () => G().go(cfg.home || 'world', { at: cfg.id }) });
        if (cfg.onFinish) cfg.onFinish(this);
      },
      update(dt) { this.t += dt; this.roundT += dt; this.cards.forEach((c) => { if (this.roundT > c.delay) c.scale = Math.min(1, c.scale + dt * 4); c.wob = Math.max(0, c.wob - dt * 2); }); },
      draw(ctx) {
        const g = G(); const t = this.t; cfg.bg(ctx, g, t, this);
        UI.banner(ctx, this.cur.prompt, { emoji: this.cur.promptEmoji, size: A.fitSize(ctx, this.cur.prompt, g.W - 560, 40), minW: 560 });
        UI.progressDots(ctx, this.round, this.total, 140);
        if (this.cur.display) this.cur.display(ctx, g, t, this);
        this.cards.forEach((c) => {
          if (c.scale <= 0) return; const cx = c.x + c.w / 2, cy = c.y + c.h / 2; const wob = Math.sin(t * 28) * c.wob * 0.12; const sc = c.scale * (c.done ? 1.1 : 1);
          ctx.save(); ctx.translate(cx, cy + Math.sin(t * 2 + c.x) * 3); ctx.rotate(wob); ctx.scale(sc, sc);
          const hint = !this.locked && this.tries >= 2 && c.correct; if (hint) { ctx.shadowColor = '#fde047'; ctx.shadowBlur = 30 + Math.sin(t * 8) * 15; }
          ctx.fillStyle = 'rgba(0,0,0,.15)'; A.roundRect(ctx, -c.w / 2, -c.h / 2 + 8, c.w, c.h, 32); ctx.fill();
          ctx.fillStyle = c.done ? '#fef9c3' : '#fff'; ctx.strokeStyle = cfg.cardColor || '#f472b6'; ctx.lineWidth = 8; A.roundRect(ctx, -c.w / 2, -c.h / 2, c.w, c.h, 32); ctx.fill(); ctx.stroke(); ctx.shadowBlur = 0;
          if (c.draw) { c.draw(ctx, c, t); if (c.label) A.text(ctx, c.label, 0, c.h / 2 - 26, { size: 24, color: '#57534e' }); }
          else if (c.emoji) { A.emoji(ctx, c.emoji, 0, c.label ? -14 : 0, c.w * (c.label ? 0.48 : 0.56)); if (c.label) A.text(ctx, c.label, 0, c.h / 2 - 30, { size: A.fitSize(ctx, c.label, c.w - 16, 26), color: '#57534e' }); }
          else if (c.text) A.text(ctx, c.text, 0, 0, { size: A.fitSize(ctx, c.text, c.w - 24, c.text.length <= 2 ? 84 : 44), color: '#7c3aed' });
          ctx.restore();
        });
        (cfg.drawHero || ((c2, gg, tt, sc) => { A.princess(c2, 120, gg.H - 40, gg.look, { t: tt, facing: 1, wave: sc.locked }, 0.95); }))(ctx, g, t, this);
        A.emoji(ctx, FL.Save.data.companion, 210, g.H - 60 - Math.abs(Math.sin(t * 5)) * 8, 52);
      },
    };
    FL.scenes[cfg.id] = scene; return scene;
  };
  // Number distractors near a target, all distinct, within [lo, hi].
  FL.numberChoices = function (correct, count, lo, hi) {
    const set = new Set([correct]); let guard = 0;
    while (set.size < count && guard++ < 200) { const d = Math.floor(Math.random() * 5) - 2; const v = correct + (d === 0 ? 3 : d); if (v >= lo && v <= hi) set.add(v); }
    while (set.size < count) set.add(lo + Math.floor(Math.random() * (hi - lo + 1)));
    return FL.shuffle([...set]).map((v) => ({ text: String(v), correct: v === correct, sayWrong: `That's ${v}.` }));
  };
})();
