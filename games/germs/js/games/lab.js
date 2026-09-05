// Microscope Lab: look at germs up close and learn what they are.
(function () {
  const A = FL.Art, D = FL.Data;
  const germCard = (gm, scale) => ({ draw: (ctx, c, t) => A.germ(ctx, 0, -12, c.w * 0.22 * (scale || 1), gm, t), label: gm.name });
  const labBg = (ctx, g, t) => { const grad = ctx.createLinearGradient(0, 0, 0, g.H); grad.addColorStop(0, '#e0f2fe'); grad.addColorStop(1, '#f0fdfa'); ctx.fillStyle = grad; ctx.fillRect(0, 0, g.W, g.H); ctx.fillStyle = '#cbd5e1'; ctx.fillRect(0, g.H - 200, g.W, 200); ctx.fillStyle = '#94a3b8'; ctx.fillRect(0, g.H - 200, g.W, 14); for (let i = 0; i < 6; i++) { A.emoji(ctx, ['🧪', '🧫', '📗', '🔭', '⚗️', '🧬'][i], 80 + i * (g.W / 6), 120 + (i % 2) * 40, 44, { alpha: 0.7 }); } };
  const microscope = (draw) => (ctx, g, t) => { const cx = g.W / 2, cy = 330, r = 150; ctx.fillStyle = '#1e293b'; A.circle(ctx, cx, cy, r + 16); ctx.fill(); const grad = ctx.createRadialGradient(cx, cy, 20, cx, cy, r); grad.addColorStop(0, '#f0fdfa'); grad.addColorStop(1, '#a5f3fc'); ctx.fillStyle = grad; A.circle(ctx, cx, cy, r); ctx.fill(); ctx.strokeStyle = 'rgba(255,255,255,.5)'; ctx.lineWidth = 2; A.circle(ctx, cx, cy, r * 0.7); ctx.stroke(); ctx.save(); ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.clip(); draw(ctx, cx, cy, t); ctx.restore(); A.emoji(ctx, '🔬', cx + r + 60, cy + 60, 90); };
  FL.makeQuiz({
    id: 'lab', title: 'Microscope Lab', emoji: '🔬', music: 'lab', cardColor: '#0ea5e9', bg: labBg, home: 'town', total: 8,
    drawHero: (ctx, g, t, s) => { A.hero(ctx, 110, g.H - 40, g.look, { t, facing: 1, wave: s.locked }, 0.9); },
    onFinish: () => FL.sayFact('lab'),
    newRound(s) {
      const kinds = ['virus', 'bacteria', 'fungus', 'helper']; const type = s.level >= 2 ? FL.rnd(['kind', 'kind', 'small', 'hide', 'clean']) : FL.rnd(['kind', 'kind', 'hide']);
      if (type === 'kind') {
        const k = FL.rnd(kinds); const correct = FL.rnd(D.GERMS.filter((gm) => gm.kind === k)); const others = FL.shuffle(D.GERMS.filter((gm) => gm.kind !== k)).slice(0, 2);
        const prompt = k === 'helper' ? 'Which germ is a helper?' : `Which one is ${D.KINDS[k].label}?`;
        const choices = FL.shuffle([Object.assign(germCard(correct), { correct: true, sayRight: `Yes! ${correct.name} is ${D.KINDS[k].label}.` })].concat(others.map((gm) => Object.assign(germCard(gm), { correct: false, sayWrong: `That's ${gm.name}. ${gm.name} is ${D.KINDS[gm.kind].label}.` }))));
        return { prompt, promptEmoji: '🔬', choices, display: microscope((ctx, cx, cy, t) => { choices.forEach((c, i) => A.germ(ctx, cx + (i - 1) * 90, cy + Math.sin(t * 2 + i) * 10, 34 * D.GERMS.find((gm) => gm.name === c.label).size, D.GERMS.find((gm) => gm.name === c.label), t)); }), onCorrect: () => FL.Game.later(() => FL.Audio.say(D.KINDS[k].fact, { interrupt: false }), 1500) };
      }
      if (type === 'small') {
        const v = D.GERMS[0], b = D.GERMS[1], f = D.GERMS[3];
        const choices = FL.shuffle([Object.assign(germCard(v, 0.55), { correct: true, sayRight: 'Yes! A virus is the smallest. Even smaller than bacteria!' }), Object.assign(germCard(b, 0.9), { correct: false, sayWrong: `That's ${b.name}. ${b.name} is bacteria.` }), Object.assign(germCard(f, 1.2), { correct: false, sayWrong: `That's ${f.name}. ${f.name} is a fungus.` })]);
        return { prompt: 'Which one is the smallest?', promptEmoji: '🔎', choices, display: microscope((ctx, cx, cy, t) => { A.germ(ctx, cx - 90, cy, 14, v, t); A.germ(ctx, cx + 10, cy, 32, b, t); A.germ(ctx, cx + 100, cy, 52, f, t); }) };
      }
      const wantBad = type === 'hide'; const bad = FL.shuffle(D.HIDE.filter((h) => h[2])), good = FL.shuffle(D.HIDE.filter((h) => !h[2]));
      const items = wantBad ? [bad[0], good[0], good[1]] : [good[0], bad[0], bad[1]];
      const choices = FL.shuffle(items.map(([w, e, isBad]) => ({ emoji: e, label: w, correct: wantBad ? isBad : !isBad, sayRight: wantBad ? 'Yes! Germs love dirty hands, sneezes and food left out.' : 'Yes! Soap and clean towels help get rid of germs.', sayWrong: isBad ? `Yes! Germs hide on ${w}.` : `That's ${w}. That helps get rid of germs!` })));
      return { prompt: wantBad ? 'Where do germs love to hide?' : 'Which one does NOT have germs on it?', promptEmoji: wantBad ? '🦠' : '✨', choices, display: microscope((ctx, cx, cy, t) => { for (let i = 0; i < 7; i++) A.germ(ctx, cx + Math.cos(t * 0.5 + i) * 90, cy + Math.sin(t * 0.7 + i * 2) * 70, 16 + (i % 3) * 6, D.GERMS[i % 4], t, { alpha: 0.8 }); }) };
    },
  });
})();
