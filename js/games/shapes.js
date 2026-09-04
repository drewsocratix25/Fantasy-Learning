// Rainbow Meadow: pop the balloon with the right colour and/or shape.
(function () {
  const A = FL.Art, UI = FL.UI, G = () => FL.Game;
  const SHAPES = ['circle', 'square', 'triangle', 'star', 'heart', 'rectangle', 'oval', 'diamond'];
  const COLORS = [['red', '#ef4444'], ['orange', '#f97316'], ['yellow', '#facc15'], ['green', '#22c55e'], ['blue', '#3b82f6'], ['purple', '#a855f7'], ['pink', '#f472b6']];
  const scene = {
    t: 0, hud: { home: true, repeat: true }, round: 0, total: 8, good: 0, balloons: [], target: null, kind: 'color', locked: false, tries: 0, level: 1,
    enter() { this.t = 0; this.round = 0; this.good = 0; this.level = FL.Save.level('shapes'); FL.Save.addPlay('shapes'); this.newRound(true); },
    newRound(first) {
      const g = G(); this.tries = 0; this.locked = false; this.roundT = 0;
      const shapePool = SHAPES.slice(0, this.level <= 1 ? 4 : this.level === 2 ? 6 : 8); const colorPool = COLORS.slice(0, this.level <= 1 ? 5 : 7);
      this.kind = this.level >= 2 && Math.random() < 0.45 ? 'both' : Math.random() < 0.5 ? 'color' : 'shape';
      const n = Math.min(4 + Math.floor(this.level / 2) + Math.floor(this.round / 4), 7);
      const tShape = shapePool[Math.floor(Math.random() * shapePool.length)], tColor = colorPool[Math.floor(Math.random() * colorPool.length)];
      this.target = { shape: tShape, color: tColor };
      const items = [{ shape: tShape, color: tColor }];
      let guard = 0; while (items.length < n && guard++ < 200) {
        const s = shapePool[Math.floor(Math.random() * shapePool.length)], c = colorPool[Math.floor(Math.random() * colorPool.length)];
        const clash = this.kind === 'color' ? c[0] === tColor[0] : this.kind === 'shape' ? s === tShape : (s === tShape && c[0] === tColor[0]);
        if (clash) continue; if (items.some((it) => it.shape === s && it.color[0] === c[0])) continue;
        // for 'both' prompts include tricky near-misses
        items.push({ shape: s, color: c });
      }
      if (this.kind === 'both' && items.length >= 3) { items[1] = { shape: tShape, color: colorPool.find((c) => c[0] !== tColor[0]) }; items[2] = { shape: shapePool.find((s) => s !== tShape), color: tColor }; }
      items.sort(() => Math.random() - 0.5);
      const spacing = Math.min(230, (g.W - 160) / items.length); const x0 = g.W / 2 - ((items.length - 1) * spacing) / 2;
      this.balloons = items.map((it, i) => ({ ...it, x: x0 + i * spacing, y: g.H + 120 + i * 40, ty: 330 + (i % 2) * 130, vy: 0, seed: Math.random() * 6, pop: 0, wob: 0, popped: false }));
      if (!first) FL.Audio.sfx.whoosh();
      setTimeout(() => this.repeatPrompt(), first ? 400 : 800);
    },
    label() { const tg = this.target; return this.kind === 'color' ? `${tg.color[0]} balloon` : this.kind === 'shape' ? tg.shape : `${tg.color[0]} ${tg.shape}`; },
    repeatPrompt() { FL.Audio.say(`Pop the ${this.label()}!`); },
    down(p) {
      if (this.locked) return;
      for (const b of this.balloons) { if (b.popped) continue; if (Math.hypot(p.x - b.x, p.y - b.y) < 78) { this.pick(b); return; } }
    },
    pick(b) {
      const g = G(); const tg = this.target;
      const ok = this.kind === 'color' ? b.color[0] === tg.color[0] : this.kind === 'shape' ? b.shape === tg.shape : (b.shape === tg.shape && b.color[0] === tg.color[0]);
      if (ok) {
        this.locked = true; b.popped = true; if (this.tries === 0) this.good++;
        FL.Audio.sfx.pop(); FL.Audio.sfx.correct(); g.fx.burst(b.x, b.y, { count: 40, type: 'confetti', colors: [b.color[1], '#fff', '#fde047'], speed: 420, life: 1.1, size: 14 });
        FL.Audio.say(`Pop! A ${b.color[0]} ${b.shape}!`);
        this.round++; setTimeout(() => { if (this.round >= this.total) this.finish(); else this.newRound(false); }, 1900);
      } else { this.tries++; b.wob = 1; FL.Audio.sfx.squeak(); FL.Audio.say(`That's a ${b.color[0]} ${b.shape}. Pop the ${this.label()}!`); }
    },
    finish() {
      const stars = UI.starsFor(this.good, this.total); if (stars === 3) FL.Save.levelUp('shapes');
      UI.showResults({ title: 'Rainbow Meadow complete!', subtitle: `${this.good} of ${this.total} popped on the first try`, stars, emoji: '🌈', again: () => G().go('shapes'), home: () => G().go('world', { at: 'shapes' }) });
    },
    update(dt) {
      this.t += dt; this.roundT += dt;
      this.balloons.forEach((b) => { b.y += (b.ty - b.y) * Math.min(1, dt * 2.2); b.wob = Math.max(0, b.wob - dt * 2); });
    },
    draw(ctx) {
      const g = G(); const t = this.t;
      A.sky(ctx, g.W, g.H, '#93c5fd', '#e0f2fe'); A.sun(ctx, g.W - 120, 250, 52, t);
      A.rainbow(ctx, g.W / 2, g.H * 0.75, Math.min(g.W * 0.45, 620), 22, 0.75);
      A.cloud(ctx, g.W / 2 - Math.min(g.W * 0.45, 620), g.H * 0.75, 44, 1); A.cloud(ctx, g.W / 2 + Math.min(g.W * 0.45, 620), g.H * 0.75, 44, 1);
      A.hills(ctx, g.W, g.H, g.H * 0.7, '#bbf7d0', 3); A.grass(ctx, g.W, g.H, g.H * 0.78);
      for (let i = 0; i < 12; i++) A.flower(ctx, 60 + i * (g.W / 12), g.H - 20 - (i % 3) * 14, 1.1, ['#f472b6', '#facc15', '#fff', '#c084fc'][i % 4], t, i);
      const tg = this.target;
      const bannerText = this.kind === 'color' ? `Pop the ${tg.color[0]} balloon!` : this.kind === 'shape' ? `Pop the ${tg.shape}!` : `Pop the ${tg.color[0]} ${tg.shape}!`;
      UI.banner(ctx, bannerText, { size: 42, minW: 600 });
      // little icon of the target next to banner text
      ctx.save(); ctx.translate(g.W / 2 - A.measure(ctx, bannerText, 42) / 2 - 60, 70); ctx.fillStyle = this.kind === 'shape' ? '#94a3b8' : tg.color[1]; ctx.strokeStyle = '#fff'; ctx.lineWidth = 3; A.shapePath(ctx, this.kind === 'color' ? 'circle' : tg.shape, 0, 0, 24); ctx.fill(); ctx.stroke(); ctx.restore();
      UI.progressDots(ctx, this.round, this.total, 140);
      this.balloons.forEach((b) => {
        if (b.popped) return; const bob = Math.sin(t * 2 + b.seed) * 8; const wob = Math.sin(t * 28) * b.wob * 0.15;
        ctx.save(); ctx.translate(b.x, b.y + bob); ctx.rotate(Math.sin(t + b.seed) * 0.05 + wob);
        ctx.strokeStyle = 'rgba(255,255,255,.8)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(0, 60); ctx.quadraticCurveTo(14, 120, -6, 190); ctx.stroke();
        ctx.fillStyle = b.color[1]; ctx.strokeStyle = 'rgba(0,0,0,.2)'; ctx.lineWidth = 4;
        ctx.save(); ctx.shadowColor = 'rgba(0,0,0,.2)'; ctx.shadowBlur = 12; ctx.shadowOffsetY = 8; A.shapePath(ctx, b.shape, 0, 0, 64); ctx.fill(); ctx.restore(); A.shapePath(ctx, b.shape, 0, 0, 64); ctx.stroke();
        ctx.fillStyle = 'rgba(255,255,255,.45)'; A.ellipse(ctx, -22, -26, 14, 8); ctx.fill();
        ctx.fillStyle = b.color[1]; ctx.beginPath(); ctx.moveTo(-8, 58); ctx.lineTo(8, 58); ctx.lineTo(0, 70); ctx.closePath(); ctx.fill();
        // cute face
        ctx.fillStyle = '#1f2937'; A.circle(ctx, -12, -4, 4); ctx.fill(); A.circle(ctx, 12, -4, 4); ctx.fill(); ctx.strokeStyle = '#1f2937'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(0, 4, 10, 0.15 * Math.PI, 0.85 * Math.PI); ctx.stroke();
        ctx.restore();
      });
      A.princess(ctx, 130, g.H - 40, g.look, { t, facing: 1, wave: this.locked }, 1);
      A.emoji(ctx, FL.Save.data.companion, 230, g.H - 60 - Math.abs(Math.sin(t * 5)) * 8, 56);
    },
  };
  FL.scenes.shapes = scene;
})();
