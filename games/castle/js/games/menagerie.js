// Royal Menagerie: where animals live, what they eat, what they say, who hatches from eggs, animal babies and groups.
(function () {
  const A = FL.Art, D = FL.Data;
  const art = (w) => FL.Lines.article(w);
  FL.bg.menagerie = function (ctx, g, t) {
    const grad = ctx.createLinearGradient(0, 0, 0, g.H); grad.addColorStop(0, '#7dd3fc'); grad.addColorStop(1, '#fef3c7'); ctx.fillStyle = grad; ctx.fillRect(0, 0, g.W, g.H);
    A.sun(ctx, 140, 120, 44, t); A.cloud(ctx, g.W - 240 + Math.sin(t * 0.3) * 20, 130, 30, 0.9);
    A.hills(ctx, g.W, g.H, g.H * 0.5, '#86efac', 2); A.grass(ctx, g.W, g.H, g.H * 0.62, '#bef264', '#65a30d');
    ctx.fillStyle = '#a16207'; for (let i = 0; i < g.W / 60 + 1; i++) { ctx.fillRect(i * 60, g.H - 250, 14, 120); } ctx.fillRect(0, g.H - 230, g.W, 12); ctx.fillRect(0, g.H - 170, g.W, 12);
    A.tree(ctx, 90, g.H - 240, 1.2, 0, t); A.tree(ctx, g.W - 90, g.H - 240, 1.2, 2, t);
    A.emoji(ctx, '🐦', 300 + Math.sin(t) * 80, 200 + Math.cos(t * 1.3) * 20, 28); A.emoji(ctx, '🐝', g.W - 400 + Math.cos(t * 2) * 60, 260 + Math.sin(t * 3) * 20, 24);
  };
  function stall(ctx, g, t, big, sub, subSize) {
    const cx = g.W / 2, cy = 330; ctx.fillStyle = 'rgba(0,0,0,.12)'; A.roundRect(ctx, cx - 190, 200, 380, 250, 40); ctx.fill();
    ctx.fillStyle = '#fef3c7'; ctx.strokeStyle = '#b45309'; ctx.lineWidth = 8; A.roundRect(ctx, cx - 190, 190, 380, 250, 40); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#dc2626'; ctx.beginPath(); ctx.moveTo(cx - 210, 200); ctx.lineTo(cx, 120); ctx.lineTo(cx + 210, 200); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#92400e'; ctx.fillRect(cx - 190, 400, 380, 40);
    A.emoji(ctx, big, cx, cy - 10 + Math.sin(t * 2.5) * 6, 130, { shadow: true });
    if (sub) A.text(ctx, sub, cx, 420, { size: subSize || 34, color: '#fff', stroke: '#7c2d12', strokeWidth: 6 });
  }
  FL.makeQuiz({
    id: 'menagerie', drawHero: FL.drawExplorer, title: 'Royal Menagerie', emoji: '🐾', music: 'pond', cardColor: '#f97316', bg: FL.bg.menagerie,
    newRound(s) {
      const types = ['home', 'food', 'sound']; if (s.level >= 2) types.push('egg', 'baby'); if (s.level >= 3) types.push('group');
      let type; do { type = FL.rnd(types); } while (type === s.lastType && Math.random() < 0.7); s.lastType = type;
      let an; do { an = FL.rnd(D.ANIMALS); } while (s.recent.includes(an.name) || (type === 'sound' && !an.sound)); s.recent.push(an.name); if (s.recent.length > 5) s.recent.shift();
      const nOther = s.level >= 2 ? 3 : 2; let prompt, choices, display;
      if (type === 'home') {
        const others = FL.shuffle(Object.keys(D.HOMES).filter((h) => h !== an.home && D.HOMES[h][0] !== D.HOMES[an.home][0])).slice(0, nOther);
        prompt = `Where does the ${an.name} live?`;
        choices = FL.shuffle([{ emoji: D.HOMES[an.home][0], label: D.HOMES[an.home][1].replace(/^in (the |a )?/, ''), correct: true, sayRight: `Yes! The ${an.name} lives ${D.HOMES[an.home][1]}!` }].concat(others.map((h) => ({ emoji: D.HOMES[h][0], label: D.HOMES[h][1].replace(/^in (the |a )?/, ''), correct: false, sayWrong: `The ${an.name} doesn't live ${D.HOMES[h][1]}.` }))));
        display = (ctx, g, t) => stall(ctx, g, t, an.e, `Where does it live?`, 30);
      } else if (type === 'food') {
        const others = FL.shuffle(D.ANIMALS.filter((o) => o.food !== an.food)).slice(0, nOther);
        prompt = `What does the ${an.name} eat?`;
        choices = FL.shuffle([{ emoji: an.food, label: an.foodName, correct: true, sayRight: `Yes! The ${an.name} eats ${an.foodName}!` }].concat(others.map((o) => ({ emoji: o.food, label: o.foodName, correct: false, sayWrong: `The ${an.name} doesn't eat ${o.foodName}.` }))));
        display = (ctx, g, t) => stall(ctx, g, t, an.e, 'Yum yum?', 30);
      } else if (type === 'sound') {
        const others = FL.shuffle(D.ANIMALS.filter((o) => o.sound && o !== an)).slice(0, nOther);
        prompt = `Which animal says ${an.sound}?`;
        choices = FL.shuffle([{ emoji: an.e, label: an.name, correct: true, sayRight: `Yes! The ${an.name} says ${an.sound}!` }].concat(others.map((o) => ({ emoji: o.e, label: o.name, correct: false, sayWrong: `The ${o.name} says ${o.sound}.` }))));
        display = (ctx, g, t) => stall(ctx, g, t, '🔊', `"${an.sound}!"`, 44);
      } else if (type === 'egg') {
        const eggAn = an.egg ? an : FL.rnd(D.ANIMALS.filter((o) => o.egg)); const others = FL.shuffle(D.ANIMALS.filter((o) => !o.egg)).slice(0, nOther);
        prompt = 'Which animal hatches from an egg?';
        choices = FL.shuffle([{ emoji: eggAn.e, label: eggAn.name, correct: true, sayRight: `Yes! The ${eggAn.name} hatches from an egg!` }].concat(others.map((o) => ({ emoji: o.e, label: o.name, correct: false, sayWrong: `The ${o.name} doesn't hatch from an egg.` }))));
        display = (ctx, g, t) => stall(ctx, g, t, '🥚', 'Who is inside?', 30);
      } else if (type === 'baby') {
        const b = FL.rnd(D.BABIES); const others = FL.shuffle(D.BABIES.filter((o) => o !== b)).slice(0, nOther);
        prompt = `Which one is the baby ${b[1]}?`;
        choices = FL.shuffle([{ emoji: b[2], label: b[3], correct: true, sayRight: `Yes! A baby ${b[1]} is called ${art(b[3])} ${b[3]}!` }].concat(others.map((o) => ({ emoji: o[2], label: o[3], correct: false, sayWrong: `That's ${art(o[3])} ${o[3]}.` }))));
        display = (ctx, g, t) => stall(ctx, g, t, b[0], `the ${b[1]}`, 34);
      } else {
        const grp = an.group; const others = FL.shuffle(D.ANIMALS.filter((o) => o.group !== grp)).slice(0, nOther); const gname = D.GROUPS[grp].split(',')[0];
        prompt = `Which one is ${gname}?`;
        choices = FL.shuffle([{ emoji: an.e, label: an.name, correct: true, sayRight: `Yes! The ${an.name} is ${D.GROUPS[grp]}!` }].concat(others.map((o) => ({ emoji: o.e, label: o.name, correct: false, sayWrong: `The ${o.name} is ${D.GROUPS[o.group]}.` }))));
        display = (ctx, g, t) => stall(ctx, g, t, '❓', gname, 34);
      }
      return { prompt, promptEmoji: '🐾', choices, display };
    },
  });
})();
