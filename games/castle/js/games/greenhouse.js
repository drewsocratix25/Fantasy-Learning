// Royal Greenhouse: give each plant what it needs (water, sunshine) and watch it grow, seed to fruit.
(function () {
  const A = FL.Art, D = FL.Data;
  const STAGE_PROMPTS = ['The seed is thirsty! What does it need?', 'The sprout is reaching up! What does it need?', 'The leaves are dry! What does it need?', 'The flower wants to open! What does it need?'];
  FL.bg.greenhouse = function (ctx, g, t) {
    const grad = ctx.createLinearGradient(0, 0, 0, g.H); grad.addColorStop(0, '#bae6fd'); grad.addColorStop(1, '#ecfccb'); ctx.fillStyle = grad; ctx.fillRect(0, 0, g.W, g.H);
    ctx.strokeStyle = 'rgba(255,255,255,.7)'; ctx.lineWidth = 10; for (let i = 0; i <= 8; i++) { const x = (i / 8) * g.W; ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, g.H - 200); ctx.stroke(); } for (let j = 0; j <= 4; j++) { ctx.beginPath(); ctx.moveTo(0, j * 160); ctx.lineTo(g.W, j * 160); ctx.stroke(); }
    A.sun(ctx, g.W - 160, 130, 46, t);
    ctx.fillStyle = '#a16207'; ctx.fillRect(0, g.H - 200, g.W, 30); ctx.fillStyle = '#854d0e'; ctx.fillRect(0, g.H - 170, g.W, 170); ctx.fillStyle = '#92400e'; for (let i = 0; i < g.W / 70; i++) ctx.fillRect(i * 70 + 20, g.H - 165, 30, 165);
    [[120, '#f472b6'], [260, '#facc15'], [g.W - 260, '#c084fc'], [g.W - 120, '#fb923c']].forEach(([x, c], i) => { ctx.fillStyle = '#c2410c'; A.roundRect(ctx, x - 30, g.H - 250, 60, 50, 8); ctx.fill(); A.flower(ctx, x, g.H - 250, 1.1, c, t, i); });
    for (let i = 0; i < 3; i++) A.emoji(ctx, '🦋', 200 + i * 300 + Math.sin(t * 1.5 + i) * 60, 120 + Math.cos(t * 2 + i) * 30, 30);
  };
  // stage 0 seed, 1 sprout, 2 leaves, 3 flower, 4 fruit. k = 0..1 growth of the newest stage.
  function drawPlant(ctx, x, y, stage, k, fruit, t) {
    const sway = Math.sin(t * 1.5) * 0.03; ctx.save(); ctx.translate(x, y);
    ctx.fillStyle = 'rgba(0,0,0,.15)'; A.ellipse(ctx, 0, 6, 110, 24); ctx.fill();
    ctx.fillStyle = '#c2410c'; ctx.strokeStyle = 'rgba(80,30,0,.5)'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(-90, -110); ctx.lineTo(-70, 0); ctx.lineTo(70, 0); ctx.lineTo(90, -110); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#ea580c'; A.roundRect(ctx, -100, -130, 200, 30, 10); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#78350f'; A.ellipse(ctx, 0, -116, 82, 14); ctx.fill();
    ctx.rotate(sway);
    const h = [0, 60, 150, 190, 200][stage] * (stage === 0 ? 1 : 1) + (stage < 4 ? ([0, 60, 90, 40, 10][stage + 1] || 0) * k * 0 : 0);
    const grow = (st) => (st < stage ? 1 : st === stage ? k : 0);
    if (grow(0) > 0) { ctx.fillStyle = '#a16207'; A.ellipse(ctx, 0, -120, 12 * grow(0), 8 * grow(0)); ctx.fill(); }
    const stemH = 60 * grow(1) + 90 * grow(2) + 40 * grow(3) + 10 * grow(4);
    if (stemH > 0) { ctx.strokeStyle = '#16a34a'; ctx.lineWidth = 10; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(0, -120); ctx.quadraticCurveTo(8, -120 - stemH / 2, 0, -120 - stemH); ctx.stroke(); }
    const leaf = (lx, ly, dir, sc) => { if (sc <= 0) return; ctx.save(); ctx.translate(lx, ly); ctx.rotate(dir * -0.6 + Math.sin(t * 2) * 0.05); ctx.scale(sc, sc); ctx.fillStyle = '#22c55e'; ctx.strokeStyle = '#15803d'; ctx.lineWidth = 2; A.ellipse(ctx, dir * 24, 0, 26, 12); ctx.fill(); ctx.stroke(); ctx.restore(); };
    leaf(0, -150, -1, grow(1)); leaf(0, -160, 1, grow(1)); leaf(0, -205, -1, grow(2)); leaf(0, -225, 1, grow(2)); leaf(0, -250, -1, grow(2));
    if (grow(3) > 0) { const s = grow(3); ctx.save(); ctx.translate(0, -120 - stemH); ctx.scale(s, s); ctx.fillStyle = '#f472b6'; ctx.strokeStyle = 'rgba(0,0,0,.2)'; ctx.lineWidth = 2; for (let i = 0; i < 6; i++) { const a = (i * Math.PI) / 3 + t * 0.2; A.ellipse(ctx, Math.cos(a) * 18, Math.sin(a) * 18, 14, 9); ctx.fill(); ctx.stroke(); } ctx.fillStyle = '#fde047'; A.circle(ctx, 0, 0, 11); ctx.fill(); ctx.stroke(); ctx.restore(); }
    if (grow(4) > 0) { A.emoji(ctx, fruit, 0, -130 - stemH, 74 * grow(4)); A.emoji(ctx, fruit, -46, -110 - stemH + 40, 44 * grow(4)); A.emoji(ctx, fruit, 46, -110 - stemH + 44, 44 * grow(4)); }
    ctx.restore();
    void h;
  }
  FL.makeQuiz({
    id: 'greenhouse', drawHero: FL.drawExplorer, title: 'Royal Greenhouse', emoji: '🌱', music: 'garden', cardColor: '#22c55e', bg: FL.bg.greenhouse, total: 12,
    newRound(s) {
      if (s.round === 0) s.seed = Math.floor(Math.random() * D.PLANTS.length);
      const pi = Math.floor(s.round / 4), stage = s.round % 4; const plant = D.PLANTS[(s.seed + pi) % D.PLANTS.length]; const need = D.PLANT_NEEDS[stage % 2]; const other = D.PLANT_NEEDS[(stage + 1) % 2];
      const wrongs = FL.shuffle(D.PLANT_WRONG).slice(0, s.level >= 2 ? 2 : 1).map(([e, n]) => ({ emoji: e, label: n.replace(/^(a|an) /, ''), correct: false, sayWrong: `A plant can't use ${n}.` }));
      if (s.level >= 3) wrongs.push({ emoji: other[0], label: other[1], correct: false, sayWrong: `Not ${other[1]} right now. Listen again!` });
      const choices = FL.shuffle([{ emoji: need[0], label: need[1], correct: true, sayRight: stage === 3 ? `Yes! ${need[1][0].toUpperCase() + need[1].slice(1)}! Look, ${plant[1]}!` : `Yes! ${need[1][0].toUpperCase() + need[1].slice(1)} helps it grow!` }].concat(wrongs));
      const prompt = stage === 0 ? `Let's grow ${plant[1]}! ${STAGE_PROMPTS[0]}` : STAGE_PROMPTS[stage];
      return { prompt, say: prompt, promptEmoji: stage === 0 ? plant[0] : need[0], choices, onCorrect(sc) { sc.growAt = sc.t; if (stage === 3) FL.Game.later(() => FL.Game.fx.burst(FL.Game.W / 2, 330, { count: 40, type: 'emoji', emoji: plant[0], speed: 380, life: 1.4, size: 14 }), 700); },
        display(ctx, g, t, sc) {
          const k = sc.locked ? Math.min(1, (t - (sc.growAt || t)) / 0.8) : 0; const shown = sc.locked ? stage + 1 : stage;
          drawPlant(ctx, g.W / 2, 560, shown, sc.locked ? 1 - Math.pow(1 - k, 3) : 1, plant[0], t);
          if (sc.locked && k < 1) { if (stage % 2 === 0) { A.emoji(ctx, '🚿', g.W / 2 - 150, 260 + k * 30, 80, { rot: -0.5 }); for (let i = 0; i < 10; i++) { ctx.fillStyle = '#60a5fa'; A.circle(ctx, g.W / 2 - 100 + (i % 5) * 22, 300 + ((i * 47 + t * 400) % 180), 5); ctx.fill(); } } else { A.sun(ctx, g.W / 2 + 180, 240, 50 + k * 10, t); for (let i = 0; i < 8; i++) { ctx.strokeStyle = `rgba(253,224,71,${0.6 - k * 0.4})`; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(g.W / 2 + 180, 240); ctx.lineTo(g.W / 2 + 40 - i * 10, 400 + i * 12); ctx.stroke(); } } }
          A.text(ctx, `Plant ${pi + 1} of 3`, g.W / 2, 600, { size: 24, color: '#fff', stroke: '#166534' });
        } };
    },
  });
})();
