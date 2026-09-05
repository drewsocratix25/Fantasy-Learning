// Sneeze Catcher: tap a friend who is about to sneeze so they catch it in their elbow.
(function () {
  const A = FL.Art, UI = FL.UI, G = () => FL.Game, D = FL.Data;
  const scene = {
    hud: { home: true, repeat: true }, music: 'play', t: 0, kids: [], total: 10, done: 0, caught: 0, nextT: 2, droplets: [], level: 1, finished: false,
    enter() { const g = G(); this.t = 0; this.done = 0; this.caught = 0; this.nextT = 2.5; this.droplets = []; this.finished = false; this.level = FL.Save.level('sneeze'); FL.Save.addPlay('sneeze');
      this.kids = [0, 1, 2, 3].map((i) => ({ look: Object.assign({}, D.HEROES[(i + 1) % 4], { cape: '#94a3b8', capeDark: '#64748b', shirt: ['#fb923c', '#a78bfa', '#4ade80', '#60a5fa'][i] }), x: g.W * (0.2 + i * 0.2), y: g.H - 110 - (i % 2) * 40, state: 'idle', warn: 0, cool: 0 }));
      FL.Audio.say('When a friend is about to sneeze, tap them fast so they catch it in their elbow!'); },
    repeatPrompt() { FL.Audio.say('When a friend is about to sneeze, tap them fast so they catch it in their elbow!'); },
    down(p) { for (const k of this.kids) { if (k.state === 'warn' && Math.hypot(p.x - k.x, p.y - (k.y - 80)) < 110) { k.state = 'caught'; k.cool = 1.6; this.caught++; this.done++; FL.Audio.sfx.correct(); FL.Audio.say('Caught it in the elbow!'); G().fx.burst(k.x, k.y - 90, { count: 20, type: 'star', colors: ['#4ade80', '#fff', '#fde047'], speed: 300, life: 0.8, size: 10 }); G().fx.text(k.x, k.y - 200, 'Caught!', { color: '#4ade80', size: 44 }); return; } } },
    update(dt) {
      const g = G(); this.t += dt; if (this.finished) return;
      this.nextT -= dt; const warnLen = Math.max(0.9, 1.8 - this.level * 0.2);
      if (this.nextT <= 0 && this.done + this.kids.filter((k) => k.state === 'warn').length < this.total) { const idle = this.kids.filter((k) => k.state === 'idle'); if (idle.length) { const k = idle[Math.floor(Math.random() * idle.length)]; k.state = 'warn'; k.warn = warnLen; FL.Audio.note('E5', { inst: 'flute', dur: 0.5, vol: 0.3 }); } this.nextT = Math.max(1.2, 2.6 - this.level * 0.25) + Math.random(); }
      this.kids.forEach((k) => { if (k.state === 'warn') { k.warn -= dt; if (k.warn <= 0) { k.state = 'sneezed'; k.cool = 1.8; this.done++; FL.Audio.sfx.wrong(); FL.Audio.say('Oops! The sneeze got away. Germs can fly far!'); for (let i = 0; i < 18; i++) this.droplets.push({ x: k.x + 30, y: k.y - 100, vx: 200 + Math.random() * 300, vy: -60 + Math.random() * 120, life: 1.6, g: D.GERMS[i % 4] }); G().fx.text(k.x, k.y - 200, 'Achoo!', { color: '#ef4444', size: 48 }); } } else if (k.state === 'caught' || k.state === 'sneezed') { k.cool -= dt; if (k.cool <= 0) k.state = 'idle'; } });
      this.droplets.forEach((d) => { d.x += d.vx * dt; d.y += d.vy * dt; d.vx *= 0.98; d.life -= dt; }); this.droplets = this.droplets.filter((d) => d.life > 0);
      if (this.done >= this.total && !this.kids.some((k) => k.state === 'warn')) { this.finished = true; FL.Game.later(() => this.finish(), 1200); }
    },
    finish() { const stars = this.caught >= 8 ? 3 : this.caught >= 5 ? 2 : 1; if (stars === 3) FL.Save.levelUp('sneeze'); FL.Audio.say('Great catching! Now everybody wash your hands!'); FL.Game.later(() => { UI.showResults({ title: 'Sneeze Catcher complete!', subtitle: `${this.caught} of ${this.total} sneezes caught in the elbow`, stars, emoji: '🤧', again: () => G().go('sneeze'), home: () => G().go('town', { at: 'sneeze' }) }); FL.sayFact('sneeze'); }, 2200); },
    draw(ctx) {
      const g = G(); const t = this.t;
      A.sky(ctx, g.W, g.H, '#7dd3fc', '#e0f2fe'); A.sun(ctx, g.W - 150, 200, 50, t); A.cloud(ctx, 220, 130, 34, 0.9);
      A.hills(ctx, g.W, g.H, g.H * 0.5, '#bbf7d0', 2); A.grass(ctx, g.W, g.H, g.H * 0.56);
      A.emoji(ctx, '🛝', g.W * 0.12, g.H * 0.5, 120); A.emoji(ctx, '🌳', g.W * 0.9, g.H * 0.46, 150); A.emoji(ctx, '⚽', g.W * 0.5, g.H * 0.6, 40);
      UI.banner(ctx, 'Tap a friend before they sneeze!', { emoji: '🤧', size: 38 }); UI.progressDots(ctx, this.done, this.total, 140);
      this.kids.forEach((k) => {
        const face = k.state === 'warn' ? 1 - k.warn / 1.8 : 0;
        A.hero(ctx, k.x, k.y, k.look, { t: t + k.x, facing: 1, cheer: k.state === 'caught' }, 0.95);
        if (k.state === 'warn') { const s = 30 + face * 50; A.text(ctx, face < 0.5 ? 'Ah...' : 'Ah-AH...', k.x, k.y - 175 - face * 20, { size: s, color: '#fff', stroke: '#b91c1c', strokeWidth: 6 }); ctx.strokeStyle = 'rgba(239,68,68,.8)'; ctx.lineWidth = 6; A.circle(ctx, k.x, k.y - 80, 100 + Math.sin(t * 12) * 6); ctx.stroke(); A.emoji(ctx, '👆', k.x + 60, k.y - 40 + Math.sin(t * 8) * 8, 50); }
        if (k.state === 'caught') A.emoji(ctx, '💪', k.x + 40, k.y - 120, 50);
        if (k.state === 'sneezed') A.emoji(ctx, '🤧', k.x, k.y - 200, 60);
      });
      this.droplets.forEach((d) => { A.germ(ctx, d.x, d.y, 9, d.g, t, { alpha: Math.min(1, d.life) }); });
      A.text(ctx, `Caught: ${this.caught}`, g.W - 120, g.H - 60, { size: 30, color: '#fff', stroke: '#166534' });
      A.hero(ctx, 90, g.H - 40, g.look, { t, facing: 1 }, 0.8); A.emoji(ctx, FL.Save.data.companion, 160, g.H - 60 - Math.abs(Math.sin(t * 5)) * 8, 44);
    },
  };
  FL.scenes.sneeze = scene;
})();
