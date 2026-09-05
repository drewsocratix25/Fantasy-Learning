// Enchanted Forest quiz games: Rhyme Tree and Owl School.
(function () {
  const A = FL.Art, D = FL.Data, L = FL.Lines;
  const article = (w) => L.article(w);
  FL.makeQuiz({
    id: 'rhyme', title: 'Rhyme Tree', emoji: '🌳', music: 'forest', cardColor: '#22c55e', bg: FL.bg.forest,
    newRound(s) {
      let set; do { set = FL.rnd(D.RHYMES); } while (s.recent.includes(set[0])); s.recent.push(set[0]); if (s.recent.length > 6) s.recent.shift();
      const [t, te, rs] = set; const [rw, re] = FL.rnd(rs);
      const others = FL.shuffle(D.RHYMES.filter((x) => x !== set)).slice(0, s.level >= 2 ? 3 : 2).map(([w, e]) => ({ emoji: e, label: w, correct: false, sayWrong: `That's ${article(w)} ${w}.` }));
      const choices = FL.shuffle([{ emoji: re, label: rw, correct: true, sayRight: `Yes! ${rw} rhymes with ${t}!` }].concat(others));
      return { prompt: `Which one rhymes with ${t}?`, choices, display(ctx, g, tt) { ctx.fillStyle = 'rgba(255,255,255,.85)'; A.roundRect(ctx, g.W / 2 - 130, 215, 260, 230, 40); ctx.fill(); ctx.strokeStyle = '#16a34a'; ctx.lineWidth = 6; A.roundRect(ctx, g.W / 2 - 130, 215, 260, 230, 40); ctx.stroke(); A.emoji(ctx, te, g.W / 2, 305 + Math.sin(tt * 2) * 5, 120); A.text(ctx, t, g.W / 2, 410, { size: 44, color: '#166534' }); } };
    },
  });
  FL.makeQuiz({
    id: 'owlmath', title: 'Owl School', emoji: '🦉', music: 'forest', cardColor: '#f59e0b', bg: FL.bg.forest,
    newRound(s) {
      const sub = s.level >= 3 && Math.random() < 0.5; const max = s.level === 1 ? 5 : 10; let a, b;
      if (!sub) { a = 1 + Math.floor(Math.random() * (max - 1)); b = 1 + Math.floor(Math.random() * (max - a)); } else { a = 2 + Math.floor(Math.random() * (max - 1)); b = 1 + Math.floor(Math.random() * (a - 1)); }
      const c = sub ? a - b : a + b; const [item, itemName] = FL.rnd(D.MATH_ITEMS);
      const choices = FL.numberChoices(c, 3, 1, 10); choices.forEach((ch) => { if (ch.correct) ch.sayRight = `Yes! ${a} ${sub ? 'take away' : 'plus'} ${b} is ${c}!`; });
      const prompt = `What is ${a} ${sub ? 'take away' : 'plus'} ${b}?`;
      return { prompt, promptEmoji: '🦉', choices, display(ctx, g) {
        const y = 320; ctx.fillStyle = 'rgba(255,255,255,.85)'; A.roundRect(ctx, g.W / 2 - 480, 200, 960, 250, 40); ctx.fill(); ctx.strokeStyle = '#d97706'; ctx.lineWidth = 6; A.roundRect(ctx, g.W / 2 - 480, 200, 960, 250, 40); ctx.stroke();
        const drawGroup = (n, x0, faded) => { const cols = n > 5 ? 5 : n; const size = 54; for (let i = 0; i < n; i++) { const r = Math.floor(i / cols), col = i % cols; const x = x0 + (col - (Math.min(cols, n) - 1) / 2) * size, yy = y + (r - (Math.ceil(n / cols) - 1) / 2) * size; const fade = faded > 0 && i >= n - faded; A.emoji(ctx, item, x, yy, 46, { alpha: fade ? 0.25 : 1 }); if (fade) { ctx.strokeStyle = '#ef4444'; ctx.lineWidth = 5; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(x - 16, yy - 16); ctx.lineTo(x + 16, yy + 16); ctx.moveTo(x + 16, yy - 16); ctx.lineTo(x - 16, yy + 16); ctx.stroke(); } } };
        if (!sub) { drawGroup(a, g.W / 2 - 280, 0); A.text(ctx, '+', g.W / 2 - 110, y, { size: 80, color: '#b45309' }); drawGroup(b, g.W / 2 + 60, 0); }
        else { drawGroup(a, g.W / 2 - 200, b); A.text(ctx, `take away ${b}`, g.W / 2 + 80, y, { size: 34, color: '#b45309' }); }
        A.text(ctx, '= ?', g.W / 2 + 330, y, { size: 80, color: '#7c3aed' }); A.text(ctx, `${a} ${sub ? '−' : '+'} ${b}`, g.W / 2, 425, { size: 30, color: '#57534e' });
      } };
    },
  });
})();
