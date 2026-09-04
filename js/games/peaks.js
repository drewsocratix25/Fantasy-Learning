// Crystal Peaks quiz games: Cloud Clock, Reading Rock, Crystal Stairs.
(function () {
  const A = FL.Art, D = FL.Data, L = FL.Lines;
  FL.makeQuiz({
    id: 'clock', title: 'Cloud Clock', emoji: '🕰️', music: 'peaks', cardColor: '#60a5fa', bg: FL.bg.peaks,
    newRound(s) {
      const h = FL.rnd(D.CLOCK_HOURS); const half = s.level >= 2 && Math.random() < 0.5; const label = (hh) => (half ? `half past ${hh}` : `${hh} o'clock`);
      const others = new Set(); while (others.size < 2) { const o = FL.rnd(D.CLOCK_HOURS); if (o !== h) others.add(o); }
      const choices = FL.shuffle([{ text: label(h), correct: true, sayRight: `Yes! It's ${label(h)}!` }].concat([...others].map((o) => ({ text: label(o), correct: false, sayWrong: `That's ${label(o)}.` }))));
      return { prompt: 'What time is it?', promptEmoji: '⏰', choices, display(ctx, g) {
        const cx = g.W / 2, cy = 330, r = 130; ctx.fillStyle = 'rgba(0,0,0,.12)'; A.circle(ctx, cx, cy + 10, r + 14); ctx.fill(); ctx.fillStyle = '#fff'; ctx.strokeStyle = '#3b82f6'; ctx.lineWidth = 12; A.circle(ctx, cx, cy, r + 8); ctx.fill(); ctx.stroke();
        for (let i = 1; i <= 12; i++) { const a = (i / 12) * Math.PI * 2 - Math.PI / 2; A.text(ctx, String(i), cx + Math.cos(a) * r * 0.8, cy + Math.sin(a) * r * 0.8, { size: 30, color: '#1e3a8a' }); }
        for (let i = 0; i < 60; i++) { const a = (i / 60) * Math.PI * 2; ctx.fillStyle = i % 5 ? '#94a3b8' : '#1e3a8a'; A.circle(ctx, cx + Math.cos(a) * r * 0.97, cy + Math.sin(a) * r * 0.97, i % 5 ? 2 : 4); ctx.fill(); }
        const ha = ((h % 12) / 12 + (half ? 1 / 24 : 0)) * Math.PI * 2 - Math.PI / 2, ma = (half ? 0.5 : 0) * Math.PI * 2 - Math.PI / 2;
        ctx.lineCap = 'round'; ctx.strokeStyle = '#1e293b'; ctx.lineWidth = 12; ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + Math.cos(ha) * r * 0.5, cy + Math.sin(ha) * r * 0.5); ctx.stroke();
        ctx.strokeStyle = '#ef4444'; ctx.lineWidth = 8; ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + Math.cos(ma) * r * 0.75, cy + Math.sin(ma) * r * 0.75); ctx.stroke();
        ctx.fillStyle = '#1e293b'; A.circle(ctx, cx, cy, 10); ctx.fill();
      } };
    },
  });
  FL.makeQuiz({
    id: 'reading', title: 'Reading Rock', emoji: '📖', music: 'peaks', cardColor: '#a855f7', bg: FL.bg.peaks,
    newRound(s) {
      let w; do { w = FL.rnd(D.WORDS3); } while (s.recent.includes(w[0])); s.recent.push(w[0]); if (s.recent.length > 8) s.recent.shift();
      const others = FL.shuffle(D.WORDS3.filter((x) => x !== w && x[0][0] !== w[0][0] || (s.level >= 3 && x !== w))).slice(0, s.level >= 2 ? 3 : 2);
      const choices = FL.shuffle([{ emoji: w[1], correct: true, sayRight: `Yes! That says ${w[0]}!` }].concat(others.map((o) => ({ emoji: o[1], correct: false, sayWrong: `That's ${L.article(o[0])} ${o[0]}.` }))));
      return { prompt: 'Read the word, then tap its picture!', promptEmoji: '📖', choices, display(ctx, g, t) {
        ctx.fillStyle = 'rgba(0,0,0,.12)'; A.roundRect(ctx, g.W / 2 - 230, 235, 460, 200, 40); ctx.fill(); ctx.fillStyle = '#fff'; ctx.strokeStyle = '#a855f7'; ctx.lineWidth = 8; A.roundRect(ctx, g.W / 2 - 230, 225, 460, 200, 40); ctx.fill(); ctx.stroke();
        w[0].split('').forEach((ch, i) => A.text(ctx, ch, g.W / 2 + (i - 1) * 110, 325 + Math.sin(t * 2 + i) * 4, { size: 130, color: ['#ef4444', '#3b82f6', '#16a34a'][i % 3] }));
      } };
    },
  });
  FL.makeQuiz({
    id: 'numberline', title: 'Crystal Stairs', emoji: '💎', music: 'peaks', cardColor: '#06b6d4', bg: FL.bg.peaks,
    newRound(s) {
      let step = 1, max = 10; if (s.level >= 3) { step = FL.rnd([1, 2, 5, 10]); max = step === 1 ? 20 : step === 2 ? 20 : 50; } else if (s.level === 2) max = 20;
      const count = 5; const start = step * (1 + Math.floor(Math.random() * (max / step - count + 1))); const seq = []; for (let i = 0; i < count; i++) seq.push(start + i * step);
      const mi = 1 + Math.floor(Math.random() * 3); const n = seq[mi];
      const choices = FL.numberChoices(n, 3, 1, D.NUMBERLINE_MAX); if (step > 1) { const alt = new Set([n, n + step, n - step, n + 1].filter((v) => v >= 1 && v <= D.NUMBERLINE_MAX)); const arr = FL.shuffle([...alt]).slice(0, 3); if (!arr.includes(n)) arr[0] = n; choices.length = 0; FL.shuffle(arr).forEach((v) => choices.push({ text: String(v), correct: v === n, sayWrong: `That's ${v}.` })); }
      choices.forEach((c) => { if (c.correct) c.sayRight = `Yes! ${n}!`; });
      return { prompt: 'What number is missing?', promptEmoji: '💎', choices, display(ctx, g, t) {
        seq.forEach((v, i) => { const x = g.W / 2 + (i - 2) * 150, y = 420 - i * 28; ctx.fillStyle = 'rgba(0,0,0,.12)'; A.roundRect(ctx, x - 62, y - 62 + 8, 124, 124, 22); ctx.fill(); ctx.fillStyle = i === mi ? '#fef9c3' : '#e0f2fe'; ctx.strokeStyle = i === mi ? '#f59e0b' : '#38bdf8'; ctx.lineWidth = 6; A.roundRect(ctx, x - 62, y - 62, 124, 124, 22); ctx.fill(); ctx.stroke(); if (i === mi) { const b = Math.abs(Math.sin(t * 4)) * 8; A.text(ctx, '?', x, y - b, { size: 76, color: '#d97706' }); } else A.text(ctx, String(v), x, y, { size: 64, color: '#0c4a6e' }); });
        if (step > 1) A.text(ctx, `Counting by ${step}s`, g.W / 2, 545, { size: 28, color: '#fff', stroke: '#0c4a6e' });
      } };
    },
  });
})();
