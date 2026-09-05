// Sky Tower: day and night, weather and what to wear, things in the sky, seasons.
(function () {
  const A = FL.Art, D = FL.Data;
  const cap = (s) => s[0].toUpperCase() + s.slice(1);
  FL.bg.tower = function (ctx, g, t) {
    const grad = ctx.createLinearGradient(0, 0, 0, g.H); grad.addColorStop(0, '#1e3a8a'); grad.addColorStop(1, '#93c5fd'); ctx.fillStyle = grad; ctx.fillRect(0, 0, g.W, g.H);
    for (let i = 0; i < 30; i++) { ctx.fillStyle = `rgba(255,255,255,${0.3 + Math.sin(t * 2 + i) * 0.3})`; A.starPath(ctx, (i * 173) % g.W, (i * 89) % (g.H * 0.5), 3 + (i % 3), 1.5, 4); ctx.fill(); }
    ctx.fillStyle = '#475569'; A.roundRect(ctx, -20, g.H - 140, g.W + 40, 160, 0); ctx.fill(); ctx.fillStyle = '#64748b'; for (let i = 0; i < g.W / 90; i++) ctx.fillRect(i * 90 + 10, g.H - 170, 50, 32);
    A.cloud(ctx, 160 + Math.sin(t * 0.3) * 20, g.H - 240, 30, 0.6); A.cloud(ctx, g.W - 160, g.H - 260, 26, 0.5);
  };
  // What the telescope shows: {kind:'day'|'night'|weather id|season id}
  function drawView(ctx, g, t, kind) {
    const cx = g.W / 2, cy = 330, r = 150;
    ctx.save(); ctx.fillStyle = 'rgba(0,0,0,.2)'; A.circle(ctx, cx, cy + 12, r + 22); ctx.fill();
    ctx.fillStyle = '#78350f'; A.circle(ctx, cx, cy, r + 22); ctx.fill(); ctx.fillStyle = '#fbbf24'; A.circle(ctx, cx, cy, r + 10); ctx.fill();
    A.circle(ctx, cx, cy, r); ctx.clip();
    const night = kind === 'night'; const sky = ctx.createLinearGradient(0, cy - r, 0, cy + r);
    if (night) { sky.addColorStop(0, '#0f172a'); sky.addColorStop(1, '#312e81'); } else if (kind === 'rain' || kind === 'wind') { sky.addColorStop(0, '#64748b'); sky.addColorStop(1, '#cbd5e1'); } else if (kind === 'snow' || kind === 'winter') { sky.addColorStop(0, '#94a3b8'); sky.addColorStop(1, '#e2e8f0'); } else if (kind === 'autumn') { sky.addColorStop(0, '#f59e0b'); sky.addColorStop(1, '#fde68a'); } else { sky.addColorStop(0, '#38bdf8'); sky.addColorStop(1, '#bae6fd'); }
    ctx.fillStyle = sky; ctx.fillRect(cx - r, cy - r, r * 2, r * 2);
    const ground = kind === 'snow' || kind === 'winter' ? '#f8fafc' : kind === 'autumn' ? '#d97706' : night ? '#14532d' : '#4ade80';
    ctx.fillStyle = ground; A.ellipse(ctx, cx, cy + r + 20, r * 1.4, r * 0.5); ctx.fill();
    if (night) { for (let i = 0; i < 18; i++) { ctx.fillStyle = `rgba(255,255,255,${0.5 + Math.sin(t * 3 + i) * 0.4})`; A.starPath(ctx, cx - r + ((i * 97) % (r * 2)), cy - r + ((i * 53) % r), 4 + (i % 2) * 2, 2, 5); ctx.fill(); } ctx.fillStyle = '#fef9c3'; A.circle(ctx, cx + 60, cy - 60, 40); ctx.fill(); ctx.fillStyle = 'rgba(0,0,0,.08)'; A.circle(ctx, cx + 72, cy - 70, 9); ctx.fill(); A.circle(ctx, cx + 50, cy - 45, 6); ctx.fill(); A.emoji(ctx, '🦉', cx - 80, cy + 40, 44); }
    else if (kind === 'rain') { A.cloud(ctx, cx, cy - 70, 40, 0.95); ctx.strokeStyle = '#3b82f6'; ctx.lineWidth = 4; ctx.lineCap = 'round'; for (let i = 0; i < 24; i++) { const x = cx - r + ((i * 61) % (r * 2)), y = cy - 40 + ((i * 37 + t * 300) % 200); ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x - 3, y + 14); ctx.stroke(); } A.emoji(ctx, '🐸', cx, cy + 60, 44); }
    else if (kind === 'snow' || kind === 'winter') { A.cloud(ctx, cx - 40, cy - 80, 34, 0.9); for (let i = 0; i < 26; i++) { const x = cx - r + ((i * 71 + Math.sin(t + i) * 20) % (r * 2)), y = cy - r + ((i * 43 + t * 60) % (r * 2)); ctx.fillStyle = 'rgba(255,255,255,.9)'; A.circle(ctx, x, y, 4); ctx.fill(); } A.emoji(ctx, '⛄', cx + 10, cy + 50, 70); }
    else if (kind === 'wind') { A.cloud(ctx, cx + 60, cy - 80, 30, 0.9); ctx.strokeStyle = 'rgba(255,255,255,.9)'; ctx.lineWidth = 5; ctx.lineCap = 'round'; for (let i = 0; i < 5; i++) { const y = cy - 40 + i * 30; const x = cx - r + ((t * 200 + i * 90) % (r * 2)); ctx.beginPath(); ctx.moveTo(x - 40, y); ctx.quadraticCurveTo(x, y - 12, x + 40, y); ctx.stroke(); } A.emoji(ctx, '🪁', cx - 30 + Math.sin(t * 2) * 30, cy - 20 + Math.cos(t * 3) * 15, 56); A.tree(ctx, cx + 70, cy + 70, 0.8, 0, t * 4); }
    else if (kind === 'spring') { A.sun(ctx, cx + 80, cy - 80, 34, t); for (let i = 0; i < 6; i++) A.flower(ctx, cx - 100 + i * 40, cy + 70 + (i % 2) * 20, 1, ['#f472b6', '#facc15', '#c084fc'][i % 3], t, i); A.emoji(ctx, '🦋', cx - 60 + Math.sin(t * 2) * 30, cy - 10, 40); }
    else if (kind === 'summer') { A.sun(ctx, cx, cy - 60, 50, t); A.emoji(ctx, '🏖️', cx - 40, cy + 60, 60); A.emoji(ctx, '🍦', cx + 70, cy + 50, 44); }
    else if (kind === 'autumn') { A.tree(ctx, cx, cy + 70, 1.1, 1, t); for (let i = 0; i < 10; i++) A.emoji(ctx, '🍂', cx - r + ((i * 67 + t * 40) % (r * 2)), cy - 40 + ((i * 41 + t * 50) % 150), 24, { rot: t + i }); }
    else { A.sun(ctx, cx - 60, cy - 70, 44, t); A.cloud(ctx, cx + 90, cy - 30, 26, 0.9); A.emoji(ctx, '🐦', cx + 40 + Math.sin(t) * 20, cy + 10, 36); A.emoji(ctx, '🌻', cx - 70, cy + 70, 50); }
    ctx.restore();
    ctx.strokeStyle = 'rgba(255,255,255,.35)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(cx - r, cy); ctx.lineTo(cx + r, cy); ctx.moveTo(cx, cy - r); ctx.lineTo(cx, cy + r); ctx.stroke();
  }
  FL.makeQuiz({
    id: 'tower', title: 'Sky Tower', emoji: '🔭', music: 'peaks', cardColor: '#3b82f6', bg: FL.bg.tower,
    newRound(s) {
      const types = ['daynight', 'wear', 'what']; if (s.level >= 2) types.push('season'); if (s.level >= 3) types.push('season');
      let type; do { type = FL.rnd(types); } while (type === s.lastType && Math.random() < 0.7); s.lastType = type;
      let kind, prompt, choices, promptEmoji = '🔭';
      if (type === 'daynight') {
        const night = Math.random() < 0.5; kind = night ? 'night' : 'day'; prompt = 'Is it day or night?';
        choices = [{ emoji: '☀️', label: 'Day', correct: !night, sayRight: "Yes! It's day. The sun is shining!", sayWrong: "Look, the moon is out. It's night!" }, { emoji: '🌙', label: 'Night', correct: night, sayRight: "Yes! It's night. The moon and stars are out!", sayWrong: "Look, the sun is out. It's day!" }];
      } else if (type === 'wear') {
        let w; do { w = FL.rnd(D.WEATHER); } while (s.recent.includes(w.id)); s.recent.push(w.id); if (s.recent.length > 2) s.recent.shift();
        kind = w.id; prompt = `It's ${w.name}! What should we take?`; promptEmoji = w.emoji;
        const wrongs = s.level >= 2 ? FL.shuffle(D.WEATHER.filter((o) => o !== w).map((o) => o.wear).concat(D.WEAR_WRONG)) : FL.shuffle(D.WEAR_WRONG);
        choices = FL.shuffle([{ emoji: w.wear[0], label: w.wear[1], correct: true, sayRight: `Yes! ${cap(w.wear[1])} for a ${w.name} day!` }].concat(wrongs.slice(0, s.level >= 2 ? 3 : 2).map(([e, n]) => ({ emoji: e, label: n, correct: false, sayWrong: `${cap(n)} won't help on a ${w.name} day.` }))));
      } else if (type === 'what') {
        const [te, tn] = FL.rnd(D.SKY_THINGS); kind = tn === 'moon' || tn === 'star' ? 'night' : 'day'; prompt = `Which one is the ${tn}?`;
        choices = FL.shuffle([{ emoji: te, label: tn, correct: true, sayRight: `Yes! That's the ${tn}!` }].concat(FL.shuffle(D.SKY_THINGS.filter((x) => x[1] !== tn)).slice(0, s.level >= 2 ? 3 : 2).map(([e, n]) => ({ emoji: e, label: n, correct: false, sayWrong: `That's the ${n}.` }))));
      } else {
        const se = FL.rnd(D.SEASONS); kind = se.id; prompt = `Which season is it when ${se.fact}?`; promptEmoji = '🗓️';
        choices = FL.shuffle([{ emoji: se.emoji, label: se.name, correct: true, sayRight: `Yes! In ${se.name}, ${se.fact}!` }].concat(FL.shuffle(D.SEASONS.filter((x) => x !== se)).slice(0, s.level >= 3 ? 3 : 2).map((o) => ({ emoji: o.emoji, label: o.name, correct: false, sayWrong: `That's ${o.name}.` }))));
      }
      return { prompt, promptEmoji, choices, display(ctx, g, t) { drawView(ctx, g, t, kind); } };
    },
  });
})();
