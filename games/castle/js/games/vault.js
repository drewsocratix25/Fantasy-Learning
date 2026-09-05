// Treasure Vault: heavier and lighter on the royal scales, bigger and smaller, more and fewer coins.
(function () {
  const A = FL.Art, D = FL.Data;
  FL.bg.vault = function (ctx, g, t) {
    const grad = ctx.createLinearGradient(0, 0, 0, g.H); grad.addColorStop(0, '#292524'); grad.addColorStop(1, '#78350f'); ctx.fillStyle = grad; ctx.fillRect(0, 0, g.W, g.H);
    ctx.fillStyle = 'rgba(255,255,255,.05)'; for (let r = 0; r < 12; r++) for (let c = 0; c < g.W / 90 + 1; c++) ctx.fillRect(c * 90 + (r % 2) * 45, r * 60, 80, 50);
    for (let i = 0; i < 3; i++) { const x = 140 + i * (g.W - 280) / 2; ctx.fillStyle = `rgba(253,224,71,${0.15 + Math.sin(t * 3 + i) * 0.05})`; A.circle(ctx, x, 120, 90); ctx.fill(); A.emoji(ctx, '🕯️', x, 120, 40); }
    ctx.fillStyle = '#a16207'; ctx.fillRect(0, g.H - 120, g.W, 120); ctx.fillStyle = '#ca8a04'; for (let i = 0; i < g.W / 80 + 1; i++) ctx.fillRect(i * 80 + (i % 2) * 20, g.H - 110 + (i % 3) * 30, 60, 20);
    for (let i = 0; i < 14; i++) A.emoji(ctx, ['🪙', '💎', '🪙', '💍', '🪙'][i % 5], 60 + i * (g.W / 14), g.H - 60 - (i % 3) * 18, 34);
    A.emoji(ctx, '🧰', 110, g.H - 150, 70); A.emoji(ctx, '🏺', g.W - 110, g.H - 150, 64);
  };
  function scales(ctx, g, t, left, right, tilt) { // tilt -1 left down .. 1 right down
    const cx = g.W / 2, cy = 430; const ang = tilt * 0.22;
    ctx.save(); ctx.fillStyle = '#b45309'; ctx.strokeStyle = 'rgba(0,0,0,.35)'; ctx.lineWidth = 4;
    A.roundRect(ctx, cx - 90, cy + 50, 180, 24, 10); ctx.fill(); ctx.stroke(); A.roundRect(ctx, cx - 10, cy - 150, 20, 200, 8); ctx.fill(); ctx.stroke();
    ctx.translate(cx, cy - 140); ctx.rotate(ang); ctx.fillStyle = '#fbbf24'; A.roundRect(ctx, -240, -10, 480, 20, 10); ctx.fill(); ctx.stroke();
    [[-220, left], [220, right]].forEach(([px, item]) => { ctx.save(); ctx.translate(px, 0); ctx.rotate(-ang); ctx.strokeStyle = '#78350f'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(-70, 110); ctx.moveTo(0, 0); ctx.lineTo(70, 110); ctx.stroke(); ctx.fillStyle = '#fde68a'; ctx.strokeStyle = 'rgba(0,0,0,.35)'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(-90, 110); ctx.quadraticCurveTo(0, 160, 90, 110); ctx.closePath(); ctx.fill(); ctx.stroke(); if (item) A.emoji(ctx, item.e, 0, 70 + Math.sin(t * 2) * 3, item.size || 84); ctx.restore(); });
    ctx.restore();
  }
  function pick2(min) { let a, b; let guard = 0; do { a = FL.rnd(D.THINGS); b = FL.rnd(D.THINGS); } while ((a === b || Math.abs(a[min] - b[min]) < 2) && guard++ < 100); return [a, b]; }
  FL.makeQuiz({
    id: 'vault', drawHero: FL.drawExplorer, title: 'Treasure Vault', emoji: '⚖️', music: 'kingdom', cardColor: '#f59e0b', bg: FL.bg.vault,
    newRound(s) {
      const types = ['heavier', 'bigger', 'coins']; if (s.level >= 2) types.push('lighter', 'smaller'); if (s.level >= 3) types.push('biggest', 'heaviest');
      let type; do { type = FL.rnd(types); } while (type === s.lastType && Math.random() < 0.7); s.lastType = type;
      let prompt, choices, display, promptEmoji = '⚖️';
      if (type === 'heavier' || type === 'lighter') {
        const [a, b] = pick2(2); const heavy = a[2] > b[2] ? a : b, light = heavy === a ? b : a; const want = type === 'heavier' ? heavy : light, other = want === a ? b : a;
        prompt = `Which one is ${type}?`;
        choices = FL.shuffle([{ emoji: want[0], label: want[1], correct: true, sayRight: `Yes! The ${want[1]} is ${type}!` }, { emoji: other[0], label: other[1], correct: false, sayWrong: `The ${other[1]} is ${type === 'heavier' ? 'lighter' : 'heavier'}.` }]);
        display = (ctx, g, t, sc) => scales(ctx, g, t, { e: a[0] }, { e: b[0] }, sc.locked ? (heavy === a ? -1 : 1) * Math.min(1, (t - sc.tiltAt) / 0.6) : 0);
        return { prompt, promptEmoji, choices, display, onCorrect(sc) { sc.tiltAt = sc.t; } };
      }
      if (type === 'bigger' || type === 'smaller') {
        const [a, b] = pick2(3); const big = a[3] > b[3] ? a : b, small = big === a ? b : a; const want = type === 'bigger' ? big : small, other = want === a ? b : a;
        prompt = `Which one is ${type}?`;
        choices = FL.shuffle([{ emoji: want[0], label: want[1], correct: true, sayRight: `Yes! The ${want[1]} is ${type}!` }, { emoji: other[0], label: other[1], correct: false, sayWrong: `The ${other[1]} is ${type === 'bigger' ? 'smaller' : 'bigger'}.` }]);
        display = (ctx, g, t) => { [[a, -1], [b, 1]].forEach(([it, d]) => { const sz = 50 + it[3] * 34; ctx.fillStyle = 'rgba(255,255,255,.12)'; A.roundRect(ctx, g.W / 2 + d * 220 - 130, 200, 260, 260, 40); ctx.fill(); A.emoji(ctx, it[0], g.W / 2 + d * 220, 330 + Math.sin(t * 2 + d) * 4, sz); A.text(ctx, it[1], g.W / 2 + d * 220, 490, { size: 28, color: '#fde68a' }); }); };
        return { prompt, promptEmoji, choices, display };
      }
      if (type === 'biggest' || type === 'heaviest') {
        const idx = type === 'biggest' ? 3 : 2; let trio; let guard = 0; do { trio = FL.shuffle(D.THINGS).slice(0, 3); } while (new Set(trio.map((x) => x[idx])).size < 3 && guard++ < 100);
        const best = trio.reduce((m, x) => (x[idx] > m[idx] ? x : m), trio[0]);
        prompt = `Which one is the ${type}?`;
        choices = FL.shuffle(trio.map((it) => ({ emoji: it[0], label: it[1], correct: it === best, sayRight: `Yes! The ${it[1]} is the ${type}!`, sayWrong: `The ${it[1]} is ${type === 'biggest' ? 'smaller' : 'lighter'}.` })));
        display = (ctx, g, t) => { trio.forEach((it, i) => { const d = i - 1; const sz = type === 'biggest' ? 40 + it[3] * 30 : 84; A.emoji(ctx, it[0], g.W / 2 + d * 260, 330 + Math.sin(t * 2 + i) * 4, sz); if (type === 'heaviest') A.text(ctx, '?', g.W / 2 + d * 260, 430, { size: 40, color: '#fde68a' }); }); };
        return { prompt, promptEmoji, choices, display };
      }
      // coins: which pile has more?
      let n1, n2; do { n1 = 1 + Math.floor(Math.random() * D.COIN_MAX); n2 = 1 + Math.floor(Math.random() * D.COIN_MAX); } while (Math.abs(n1 - n2) < (s.level >= 2 ? 1 : 2));
      const more = Math.max(n1, n2), fewer = Math.min(n1, n2); prompt = 'Which pile has more coins?'; promptEmoji = '🪙';
      choices = FL.shuffle([{ emoji: '🪙', label: `${more} coins`, correct: true, sayRight: `Yes! ${more} coins is more than ${fewer}!` }, { emoji: '🪙', label: `${fewer} coin${fewer > 1 ? 's' : ''}`, correct: false, sayWrong: `${fewer} is fewer than ${more}.` }]);
      display = (ctx, g, t) => { [[n1, -1], [n2, 1]].forEach(([n, d]) => { ctx.fillStyle = 'rgba(255,255,255,.12)'; A.roundRect(ctx, g.W / 2 + d * 220 - 130, 200, 260, 280, 40); ctx.fill(); for (let i = 0; i < n; i++) A.emoji(ctx, '🪙', g.W / 2 + d * 220 + ((i % 3) - 1) * 62, 420 - Math.floor(i / 3) * 62, 56); A.text(ctx, String(n), g.W / 2 + d * 220, 240, { size: 44, color: '#fde68a' }); }); };
      return { prompt, promptEmoji, choices, display };
    },
  });
})();
