// Body Base: germs sneak in from the top; tap them and your white-blood-cell guards catch them.
(function () {
  const A = FL.Art, UI = FL.UI, G = () => FL.Game, D = FL.Data;
  const scene = {
    hud: { home: true, repeat: true }, music: 'body', t: 0, germs: [], guards: [], powers: [], caught: 0, missed: 0, WAVE: 45, waveT: 0, slow: 0, known: null, fever: false, extra: 0, finished: false, spawnT: 0,
    enter() { const g = G(); this.t = 0; this.germs = []; this.powers = []; this.caught = 0; this.missed = 0; this.waveT = 0; this.slow = 0; this.known = null; this.fever = false; this.extra = 0; this.finished = false; this.spawnT = 1; this.level = FL.Save.level('defend'); FL.Save.addPlay('defend');
      this.guards = [0, 1, 2].map((i) => ({ x: g.W * (0.3 + i * 0.2), y: g.H - 160, hx: g.W * (0.3 + i * 0.2), hy: g.H - 160, target: null, busy: 0 }));
      FL.Audio.say('Germs are sneaking in! Tap them and your body guards will catch them!'); },
    repeatPrompt() { FL.Audio.say('Germs are sneaking in! Tap them and your body guards will catch them!'); },
    down(p) {
      if (this.finished) return;
      for (const pw of this.powers) { if (!pw.used && Math.hypot(p.x - pw.x, p.y - pw.y) < 50) { this.usePower(pw); return; } }
      let best = null, bd = 70; for (const gm of this.germs) { if (gm.dead) continue; const d = Math.hypot(p.x - gm.x, p.y - gm.y); if (d < bd) { bd = d; best = gm; } }
      if (best) this.send(best);
    },
    send(gm) { if (gm.targeted) return; const free = this.guards.filter((gd) => !gd.target).sort((a, b) => Math.hypot(a.x - gm.x, a.y - gm.y) - Math.hypot(b.x - gm.x, b.y - gm.y))[0]; if (!free) return; free.target = gm; gm.targeted = true; FL.Audio.sfx.tap(); },
    usePower(pw) { pw.used = true; G().fx.burst(pw.x, pw.y, { count: 20, type: 'star', colors: ['#fde047', '#fff'], speed: 260, life: 0.8 }); FL.Audio.sfx.sparkle();
      if (pw.kind === 'rest') { this.slow = 6; FL.Audio.say('Rest helps your body fight! The germs slow down.'); }
      else if (pw.kind === 'water') { FL.Audio.say('Water! Your guards feel great!'); this.germs.filter((g) => !g.dead && !g.targeted).slice(0, 3).forEach((g) => this.send(g)); }
      else if (pw.kind === 'food') { this.extra = 10; FL.Audio.say('Healthy food! An extra guard joins the team!'); this.guards.push({ x: G().W / 2, y: G().H - 160, hx: G().W / 2, hy: G().H - 160, target: null, temp: true }); }
      else if (pw.kind === 'vaccine') { this.known = pw.germ; FL.Audio.say('A vaccine card! Now your guards know that germ and will catch it fast!'); } },
    update(dt) {
      const g = G(); this.t += dt; if (this.finished) return; this.waveT += dt; this.slow = Math.max(0, this.slow - dt); if (this.extra > 0) { this.extra -= dt; if (this.extra <= 0) this.guards = this.guards.filter((gd) => !gd.temp); }
      if (this.waveT > 22 && !this.fever) { this.fever = true; FL.Audio.say('A fever! Your body turned up the heat to fight the germs.', { interrupt: false }); }
      this.spawnT -= dt; if (this.spawnT <= 0 && this.waveT < this.WAVE - 4) { this.spawnT = Math.max(0.7, 1.7 - this.level * 0.2); const gm = D.GERMS[Math.floor(Math.random() * 4)]; this.germs.push({ x: 120 + Math.random() * (g.W - 240), y: 130, vy: 45 + this.level * 8 + Math.random() * 25, g: gm, r: 22 + Math.random() * 10, dead: false, targeted: false, ph: Math.random() * 6 }); if (Math.random() < 0.18 && this.powers.filter((p) => !p.used).length < 2) { const kinds = ['rest', 'water', 'food', 'vaccine']; const kind = kinds[Math.floor(Math.random() * 4)]; this.powers.push({ kind, x: 120 + Math.random() * (g.W - 240), y: 140, vy: 40, used: false, germ: D.GERMS[Math.floor(Math.random() * 4)], e: { rest: '💤', water: '💧', food: '🍎', vaccine: '💉' }[kind] }); } }
      const speedMul = (this.slow > 0 ? 0.45 : 1) * (this.fever ? 0.8 : 1);
      this.germs.forEach((gm) => { if (gm.dead) return; gm.y += gm.vy * speedMul * dt; gm.x += Math.sin(this.t * 2 + gm.ph) * 30 * dt; if (this.known && gm.g === this.known && !gm.targeted && gm.y > 200) this.send(gm); if (gm.y > g.H - 90) { gm.dead = true; this.missed++; FL.Audio.sfx.squeak(); G().fx.text(gm.x, gm.y - 40, 'Oops!', { color: '#f87171', size: 30 }); } });
      this.powers.forEach((pw) => { if (!pw.used) { pw.y += pw.vy * dt; if (pw.y > g.H - 90) pw.used = true; } });
      this.guards.forEach((gd) => { const tg = gd.target; if (tg) { if (tg.dead) { gd.target = null; } else { const dx = tg.x - gd.x, dy = tg.y - gd.y; const d = Math.hypot(dx, dy); const sp = 520 * dt; if (d < 30) { tg.dead = true; this.caught++; gd.target = null; FL.Audio.sfx.pop(); G().fx.burst(tg.x, tg.y, { count: 14, colors: [tg.g.color, '#fff'], speed: 220, life: 0.6 }); } else { gd.x += dx / d * sp; gd.y += dy / d * sp; } } } else { gd.x += (gd.hx - gd.x) * Math.min(1, dt * 3); gd.y += (gd.hy - gd.y) * Math.min(1, dt * 3); } });
      this.germs = this.germs.filter((gm) => !gm.dead || gm.y < 0); this.powers = this.powers.filter((pw) => !pw.used);
      if (this.waveT >= this.WAVE && !this.germs.some((gm) => !gm.dead)) { this.finished = true; this.finish(); }
    },
    finish() { const total = this.caught + this.missed || 1; const f = this.caught / total; const stars = f >= 0.85 ? 3 : f >= 0.6 ? 2 : 1; if (stars === 3) FL.Save.levelUp('defend'); FL.Audio.say(f >= 0.85 ? 'You kept the body safe!' : 'Some germs got through, but your guards caught most of them!'); FL.Game.later(() => { UI.showResults({ title: 'Body Base complete!', subtitle: `${this.caught} germs caught, ${this.missed} slipped by`, stars, emoji: '🛡️', again: () => G().go('defend'), home: () => G().go('town', { at: 'defend' }) }); FL.sayFact('defend'); }, 2400); },
    draw(ctx) {
      const g = G(); const t = this.t;
      const grad = ctx.createLinearGradient(0, 0, 0, g.H); grad.addColorStop(0, this.fever ? '#fb7185' : '#f472b6'); grad.addColorStop(1, this.fever ? '#fda4af' : '#fbcfe8'); ctx.fillStyle = grad; ctx.fillRect(0, 0, g.W, g.H);
      for (let i = 0; i < 12; i++) { ctx.fillStyle = 'rgba(255,255,255,.18)'; A.circle(ctx, (i * 197 + t * 20) % g.W, (i * 131) % g.H, 30 + (i % 3) * 20); ctx.fill(); }
      // cell town at the bottom
      ctx.fillStyle = '#f9a8d4'; A.roundRect(ctx, 0, g.H - 110, g.W, 110, 0); ctx.fill(); for (let i = 0; i < 8; i++) { const x = 80 + i * (g.W - 160) / 7; ctx.fillStyle = ['#fde68a', '#bae6fd', '#bbf7d0', '#e9d5ff'][i % 4]; ctx.strokeStyle = 'rgba(30,40,70,.35)'; ctx.lineWidth = 3; A.circle(ctx, x, g.H - 70, 34); ctx.fill(); ctx.stroke(); ctx.fillStyle = '#1e293b'; A.circle(ctx, x - 10, g.H - 76, 3); ctx.fill(); A.circle(ctx, x + 10, g.H - 76, 3); ctx.fill(); ctx.strokeStyle = '#1e293b'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(x, g.H - 66, 10, 0.15 * Math.PI, 0.85 * Math.PI); ctx.stroke(); }
      if (this.slow > 0) { ctx.fillStyle = 'rgba(147,197,253,.25)'; ctx.fillRect(0, 0, g.W, g.H); A.emoji(ctx, '💤', g.W - 120, 200, 70); }
      this.powers.forEach((pw) => { ctx.fillStyle = '#fff'; ctx.strokeStyle = '#f59e0b'; ctx.lineWidth = 5; A.roundRect(ctx, pw.x - 44, pw.y - 44, 88, 88, 24); ctx.fill(); ctx.stroke(); A.emoji(ctx, pw.e, pw.x, pw.y - 6, 50); if (pw.kind === 'vaccine') A.germ(ctx, pw.x + 30, pw.y + 26, 9, pw.germ, t); });
      this.germs.forEach((gm) => { if (gm.dead) return; A.germ(ctx, gm.x, gm.y, gm.r, gm.g, t); if (gm.targeted) { ctx.strokeStyle = 'rgba(255,255,255,.8)'; ctx.lineWidth = 3; A.circle(ctx, gm.x, gm.y, gm.r + 10); ctx.stroke(); } if (this.known && gm.g === this.known) A.emoji(ctx, '📌', gm.x + gm.r, gm.y - gm.r, 22); });
      this.guards.forEach((gd) => { ctx.fillStyle = '#fff'; ctx.strokeStyle = '#94a3b8'; ctx.lineWidth = 3; ctx.beginPath(); for (let i = 0; i < 16; i++) { const a = (i / 16) * Math.PI * 2; const rr = 36 + Math.sin(a * 4 + t * 6) * 4; ctx.lineTo(gd.x + Math.cos(a) * rr, gd.y + Math.sin(a) * rr); } ctx.closePath(); ctx.fill(); ctx.stroke(); A.emoji(ctx, '🛡️', gd.x, gd.y, 34); ctx.fillStyle = '#1e293b'; A.circle(ctx, gd.x - 10, gd.y - 16, 3); ctx.fill(); A.circle(ctx, gd.x + 10, gd.y - 16, 3); ctx.fill(); });
      if (this.known) { ctx.fillStyle = 'rgba(255,255,255,.9)'; A.roundRect(ctx, 24, 120, 170, 90, 18); ctx.fill(); A.text(ctx, 'WANTED', 109, 142, { size: 20, color: '#b91c1c' }); A.germ(ctx, 109, 180, 18, this.known, t); }
      UI.banner(ctx, this.fever ? 'Fever! Your body turned up the heat!' : 'Tap the germs!', { emoji: '🛡️', size: 38 });
      const frac = Math.min(1, this.waveT / this.WAVE); ctx.fillStyle = 'rgba(0,0,0,.2)'; A.roundRect(ctx, g.W / 2 - 200, 130, 400, 18, 9); ctx.fill(); ctx.fillStyle = '#fff'; A.roundRect(ctx, g.W / 2 - 200, 130, 400 * frac, 18, 9); ctx.fill();
      A.text(ctx, `Caught ${this.caught}`, g.W - 120, g.H - 140, { size: 30, color: '#fff', stroke: '#9d174d' });
    },
  };
  FL.scenes.defend = scene;
})();
