// Kitchen Clean-Up: what do we do with this food? Wash, cook, keep cold, or throw away.
(function () {
  const A = FL.Art, D = FL.Data;
  const kitchenBg = (ctx, g, t) => { ctx.fillStyle = '#fef3c7'; ctx.fillRect(0, 0, g.W, g.H); for (let i = 0; i < 60; i++) { ctx.fillStyle = (Math.floor(i / 10) + i) % 2 ? '#fde68a' : '#fef3c7'; ctx.fillRect((i % 10) * (g.W / 10), Math.floor(i / 10) * 60, g.W / 10, 60); } ctx.fillStyle = '#e7e5e4'; ctx.fillRect(0, g.H - 230, g.W, 230); ctx.fillStyle = '#a8a29e'; ctx.fillRect(0, g.H - 230, g.W, 16); A.emoji(ctx, '🧊', 90, g.H - 320, 110); A.emoji(ctx, '🍳', g.W - 100, g.H - 300, 100); A.emoji(ctx, '🪟', g.W / 2 + 320, 150, 110); A.emoji(ctx, '🌤️', g.W / 2 + 320, 150, 60); };
  FL.makeQuiz({
    id: 'kitchen', title: 'Kitchen Clean-Up', emoji: '🍎', music: 'town', cardColor: '#f59e0b', bg: kitchenBg, home: 'town', total: 8,
    drawHero: (ctx, g, t, s) => { A.hero(ctx, 110, g.H - 40, g.look, { t, facing: 1, wave: s.locked }, 0.9); },
    onFinish: () => FL.sayFact('kitchen'),
    newRound(s) {
      if (s.round % 4 === 3) { const choices = FL.shuffle([{ emoji: '🧼', label: 'Wash hands', correct: true, sayRight: 'Yes! Wash your hands before eating!' }, { emoji: '🤸', label: 'Jump', correct: false, sayWrong: 'Hmm, not that one. Try again!' }, { emoji: '🎤', label: 'Sing', correct: false, sayWrong: 'Hmm, not that one. Try again!' }]); return { prompt: 'Before we eat, what do we do?', promptEmoji: '🍽️', choices, display: (ctx, g, t) => A.emoji(ctx, '🍽️', g.W / 2, 330 + Math.sin(t * 2) * 6, 150) }; }
      let item; do { item = FL.rnd(D.KITCHEN); } while (s.recent.includes(item[0])); s.recent.push(item[0]); if (s.recent.length > 5) s.recent.shift();
      const [name, emoji, act] = item; const acts = s.level >= 2 ? ['wash', 'cook', 'fridge', 'trash'] : FL.shuffle([act].concat(FL.shuffle(['wash', 'cook', 'fridge', 'trash'].filter((a) => a !== act)).slice(0, 2)));
      const choices = acts.map((a) => ({ emoji: D.ACTIONS[a][1], label: D.ACTIONS[a][0], correct: a === act, sayRight: D.ACTIONS[a][2], sayWrong: 'Hmm, not that one. Try again!' }));
      return { prompt: `What should we do with ${name}?`, promptEmoji: emoji, choices, display: (ctx, g, t) => { ctx.fillStyle = 'rgba(255,255,255,.85)'; A.roundRect(ctx, g.W / 2 - 130, 215, 260, 230, 40); ctx.fill(); ctx.strokeStyle = '#f59e0b'; ctx.lineWidth = 6; A.roundRect(ctx, g.W / 2 - 130, 215, 260, 230, 40); ctx.stroke(); A.emoji(ctx, emoji, g.W / 2, 315 + Math.sin(t * 2) * 5, 130); if (act === 'trash') A.germ(ctx, g.W / 2 + 60, 380, 16, D.GERMS[1], t); if (act === 'trash') A.germ(ctx, g.W / 2 - 70, 370, 13, D.GERMS[0], t); A.text(ctx, name, g.W / 2, 420, { size: A.fitSize(ctx, name, 240, 28), color: '#78350f' }); } };
    },
  });
})();
