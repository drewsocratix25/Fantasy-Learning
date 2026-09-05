// Rise and Shine art: the girl, her puppy Pip, and the props in every room.
(function () {
  const A = FL.Art, D = FL.Data;
  A.GIRLS = D.GIRLS;
  const OUT = 'rgba(70,40,60,.55)';
  A.outfitColors = function () { const S = D.OUTFIT_SETS; let l = S.set1.slice(); if (FL.Save.has('outfit', 'set2')) l = l.concat(S.set2); if (FL.Save.has('outfit', 'set3')) l = l.concat(S.set3); return l; };

  // Hair clip drawn on the right side of the head (head centre at the origin).
  A.hairClip = function (ctx, kind, t) {
    ctx.save(); ctx.lineJoin = 'round'; ctx.strokeStyle = 'rgba(120,40,80,.5)'; ctx.lineWidth = 1.5;
    if (kind === 'crown') { const cols = ['#ef4444', '#f97316', '#facc15', '#22c55e', '#3b82f6', '#a855f7']; ctx.lineWidth = 3; cols.forEach((c, i) => { ctx.strokeStyle = c; ctx.beginPath(); ctx.arc(0, -2, 30 - i * 2.4, Math.PI * 1.1, Math.PI * 1.9); ctx.stroke(); }); }
    else if (kind === 'star') { ctx.fillStyle = '#fde047'; ctx.shadowColor = '#fde047'; ctx.shadowBlur = 8 + Math.sin(t * 5) * 4; A.starPath(ctx, 16, -20, 9, 4, 5); ctx.fill(); ctx.stroke(); }
    else if (kind === 'flower') { ctx.fillStyle = '#fb7185'; for (let i = 0; i < 5; i++) { const a = (i * Math.PI * 2) / 5 + t * 0.5; A.circle(ctx, 16 + Math.cos(a) * 5, -20 + Math.sin(a) * 5, 4); ctx.fill(); } ctx.fillStyle = '#fde047'; A.circle(ctx, 16, -20, 3); ctx.fill(); }
    else if (kind !== 'none') { ctx.save(); ctx.translate(16, -20); ctx.rotate(-0.4); ctx.fillStyle = '#f472b6'; A.ellipse(ctx, -8, 0, 8, 5); ctx.fill(); ctx.stroke(); A.ellipse(ctx, 8, 0, 8, 5); ctx.fill(); ctx.stroke(); ctx.fillStyle = '#db2777'; A.circle(ctx, 0, 0, 3.5); ctx.fill(); ctx.restore(); }
    ctx.restore();
  };

  // The girl's head at the origin (radius 26): back hair, face, bangs, clip. o: {t, seed, sleepy, yawn, sing, noClip}
  A.girlHead = function (ctx, look, o) {
    o = o || {}; const t = o.t || 0; const hs = look.hairStyle || 'pigtails'; const hair = look.hair; const dark = A.shade(hair, -0.25); const tie = look.pjOn ? look.pjDark : look.bottom;
    ctx.save(); ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    ctx.fillStyle = hair; ctx.strokeStyle = dark; ctx.lineWidth = 2;
    if (hs === 'pigtails') { [-1, 1].forEach((s) => { const sway = Math.sin(t * 3 + s) * 2; A.ellipse(ctx, s * 34, -2 + sway, 12, 21); ctx.fill(); ctx.stroke(); ctx.fillStyle = tie; A.circle(ctx, s * 29, -19, 5); ctx.fill(); ctx.fillStyle = hair; }); }
    else if (hs === 'curls') { for (let i = 0; i <= 8; i++) { const a = Math.PI + (i / 8) * Math.PI; A.circle(ctx, Math.cos(a) * 25, -2 + Math.sin(a) * 25, 12); ctx.fill(); ctx.stroke(); } A.circle(ctx, -30, 8, 11); ctx.fill(); ctx.stroke(); A.circle(ctx, 30, 8, 11); ctx.fill(); ctx.stroke(); }
    else if (hs === 'bob') { A.roundRect(ctx, -33, -30, 66, 62, 28); ctx.fill(); ctx.stroke(); }
    else if (hs === 'braids') { [-1, 1].forEach((s) => { const sway = Math.sin(t * 3 + s) * 2; for (let i = 0; i < 5; i++) { A.ellipse(ctx, s * (26 + i * 2), -4 + i * 11 + sway * (i / 4), 7.5, 7); ctx.fill(); ctx.stroke(); } ctx.fillStyle = tie; A.circle(ctx, s * 34, 52 + sway, 4.5); ctx.fill(); ctx.fillStyle = hair; }); }
    // head
    const hg = ctx.createRadialGradient(-8, -8, 4, 0, 0, 30); hg.addColorStop(0, A.shade(look.skin, 0.12)); hg.addColorStop(1, A.shade(look.skin, -0.08));
    ctx.fillStyle = look.skin; A.circle(ctx, -25, 2, 6); ctx.fill(); A.circle(ctx, 25, 2, 6); ctx.fill(); // ears
    ctx.fillStyle = hg; ctx.strokeStyle = OUT; ctx.lineWidth = 2.5; A.circle(ctx, 0, 0, 26); ctx.fill(); ctx.stroke();
    // bangs
    ctx.fillStyle = hair; ctx.strokeStyle = dark; ctx.lineWidth = 2;
    if (hs === 'bob') { ctx.beginPath(); ctx.arc(0, -2, 27, Math.PI, 0); ctx.lineTo(27, -6); for (let i = 3; i >= -3; i--) ctx.quadraticCurveTo(i * 7.7 + 3.8, -14, i * 7.7, -6); ctx.closePath(); ctx.fill(); }
    else if (hs === 'curls') { ctx.beginPath(); ctx.arc(0, -4, 27, Math.PI, 0); ctx.closePath(); ctx.fill(); [[-15, -9], [0, -13], [15, -9]].forEach(([cx, cy]) => { A.circle(ctx, cx, cy, 7.5); ctx.fill(); }); }
    else if (hs === 'braids') { ctx.beginPath(); ctx.arc(0, -2, 27, Math.PI, 0); ctx.closePath(); ctx.fill(); A.ellipse(ctx, -13, -8, 14, 8); ctx.fill(); A.ellipse(ctx, 13, -8, 14, 8); ctx.fill(); ctx.strokeStyle = dark; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(0, -28); ctx.lineTo(0, -12); ctx.stroke(); }
    else { ctx.beginPath(); ctx.arc(0, -2, 27, Math.PI * 1.02, Math.PI * 1.98); ctx.quadraticCurveTo(14, -10, 4, -2); ctx.quadraticCurveTo(-6, -10, -14, -2); ctx.quadraticCurveTo(-22, -10, -27, -2); ctx.closePath(); ctx.fill(); }
    // eyes
    const blink = ((t + (o.seed || 0)) % 3.7) < 0.12 ? 0.15 : 1;
    if (o.sleepy) { ctx.strokeStyle = '#3b2a4a'; ctx.lineWidth = 2.2; ctx.beginPath(); ctx.arc(-9, -1, 5.5, Math.PI * 0.15, Math.PI * 0.85); ctx.stroke(); ctx.beginPath(); ctx.arc(9, -1, 5.5, Math.PI * 0.15, Math.PI * 0.85); ctx.stroke(); }
    else {
      ctx.fillStyle = '#fff'; A.ellipse(ctx, -9, 0, 5.5, 6.5 * blink); ctx.fill(); A.ellipse(ctx, 9, 0, 5.5, 6.5 * blink); ctx.fill();
      ctx.fillStyle = '#3b2a4a'; A.ellipse(ctx, -8, 1, 3.2, 4 * blink); ctx.fill(); A.ellipse(ctx, 10, 1, 3.2, 4 * blink); ctx.fill();
      ctx.fillStyle = '#fff'; A.circle(ctx, -7, -1, 1.3); ctx.fill(); A.circle(ctx, 11, -1, 1.3); ctx.fill();
      ctx.strokeStyle = '#3b2a4a'; ctx.lineWidth = 1.8; ctx.beginPath(); ctx.arc(-9, -4, 6, Math.PI * 1.15, Math.PI * 1.85); ctx.stroke(); ctx.beginPath(); ctx.arc(9, -4, 6, Math.PI * 1.15, Math.PI * 1.85); ctx.stroke();
      ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(-14, -5); ctx.lineTo(-17, -8); ctx.moveTo(14, -5); ctx.lineTo(17, -8); ctx.stroke(); // lashes
    }
    // cheeks + mouth
    ctx.fillStyle = 'rgba(244,114,182,.45)'; A.circle(ctx, -16, 9, 4.5); ctx.fill(); A.circle(ctx, 16, 9, 4.5); ctx.fill();
    if (o.yawn || o.sing) { ctx.fillStyle = '#9f1239'; A.ellipse(ctx, 0, 13, o.yawn ? 6 : 5, (o.yawn ? 8 : 6) + Math.abs(Math.sin(t * 12)) * 2); ctx.fill(); ctx.fillStyle = '#fb7185'; A.ellipse(ctx, 0, 17, 3.5, 2.5); ctx.fill(); }
    else { ctx.strokeStyle = '#9f1239'; ctx.lineWidth = 2.2; ctx.beginPath(); ctx.arc(0, 10, 7, Math.PI * 0.15, Math.PI * 0.85); ctx.stroke(); }
    if (!o.noClip) A.hairClip(ctx, look.accessory || 'bow', t);
    ctx.restore();
  };

  // The girl: feet at (x,y). look.pjOn switches pajamas / day clothes. anim: {t, walking, facing, wave, cheer, stretch(0..1), sleepy, item, seed}
  A.girl = function (ctx, x, y, look, anim, scale) {
    anim = anim || {}; scale = scale || 1; const t = anim.t || 0; const walking = !!anim.walking; const pj = !!look.pjOn;
    const bob = walking ? Math.abs(Math.sin(t * 11)) * 4 : Math.sin(t * 2.2) * 1.5; const swing = walking ? Math.sin(t * 11) : 0;
    const topC = pj ? look.pj : look.top, botC = pj ? look.pjDark : look.bottom;
    ctx.save(); ctx.translate(x, y); ctx.scale(scale * (anim.facing || 1), scale);
    ctx.fillStyle = 'rgba(0,0,0,.18)'; A.ellipse(ctx, 0, 0, 28, 9); ctx.fill();
    ctx.translate(0, -bob); ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    // legs + feet
    if (pj) {
      ctx.fillStyle = topC; ctx.strokeStyle = OUT; ctx.lineWidth = 2; A.roundRect(ctx, -17 + swing * 4, -46, 15, 42, 6); ctx.fill(); ctx.stroke(); A.roundRect(ctx, 2 - swing * 4, -46, 15, 42, 6); ctx.fill(); ctx.stroke();
      ctx.fillStyle = botC; [[-10, -36], [-8, -20], [10, -30], [8, -14]].forEach(([dx, dy]) => { A.circle(ctx, dx, dy, 2.5); ctx.fill(); });
      ctx.fillStyle = botC; A.ellipse(ctx, -9 + swing * 7, -3, 12, 7); ctx.fill(); A.ellipse(ctx, 9 - swing * 7, -3, 12, 7); ctx.fill();
      ctx.fillStyle = '#fff'; A.circle(ctx, -9 + swing * 7, -7, 4.5); ctx.fill(); A.circle(ctx, 9 - swing * 7, -7, 4.5); ctx.fill();
    } else {
      ctx.strokeStyle = look.skin; ctx.lineWidth = 9; ctx.beginPath(); ctx.moveTo(-9, -30); ctx.lineTo(-9 + swing * 7, -6); ctx.moveTo(9, -30); ctx.lineTo(9 - swing * 7, -6); ctx.stroke();
      ctx.fillStyle = '#fff'; A.roundRect(ctx, -14 + swing * 7, -16, 10, 8, 3); ctx.fill(); A.roundRect(ctx, 4 - swing * 7, -16, 10, 8, 3); ctx.fill(); // socks
      ctx.fillStyle = A.shade(botC, -0.35); A.ellipse(ctx, -9 + swing * 7, -3, 12, 6); ctx.fill(); A.ellipse(ctx, 9 - swing * 7, -3, 12, 6); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,.5)'; A.roundRect(ctx, -14 + swing * 7, -6, 10, 3, 1.5); ctx.fill(); A.roundRect(ctx, 4 - swing * 7, -6, 10, 3, 1.5); ctx.fill();
    }
    // body
    ctx.strokeStyle = OUT; ctx.lineWidth = 2.5;
    if (pj) {
      const pg = ctx.createLinearGradient(-18, 0, 18, 0); pg.addColorStop(0, A.shade(topC, 0.15)); pg.addColorStop(1, A.shade(topC, -0.12)); ctx.fillStyle = pg; A.roundRect(ctx, -18, -76, 36, 36, 10); ctx.fill(); ctx.stroke();
      ctx.fillStyle = botC; [[-10, -66], [6, -70], [-6, -52], [10, -50], [0, -60]].forEach(([dx, dy]) => { A.circle(ctx, dx, dy, 2.5); ctx.fill(); });
      ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.moveTo(-8, -76); ctx.lineTo(0, -68); ctx.lineTo(8, -76); ctx.closePath(); ctx.fill();
    } else {
      const sg = ctx.createLinearGradient(0, -48, 0, 0); sg.addColorStop(0, botC); sg.addColorStop(1, A.shade(botC, -0.2)); ctx.fillStyle = sg;
      ctx.beginPath(); ctx.moveTo(-15, -48); ctx.quadraticCurveTo(-30, -30, -36, -8); ctx.quadraticCurveTo(0, 2, 36, -8); ctx.quadraticCurveTo(30, -30, 15, -48); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.fillStyle = A.shade(botC, 0.45); for (let i = -2; i <= 2; i++) { A.circle(ctx, i * 14, -8 + Math.abs(i) * 0.8, 5); ctx.fill(); }
      const tg = ctx.createLinearGradient(-17, 0, 17, 0); tg.addColorStop(0, A.shade(topC, 0.18)); tg.addColorStop(1, A.shade(topC, -0.15)); ctx.fillStyle = tg; A.roundRect(ctx, -17, -78, 34, 34, 10); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#fff'; A.heartPath(ctx, 0, -60, 6); ctx.fill();
    }
    // arms (sleeves + hands), with stretch / cheer / wave
    const au = anim.cheer ? 1 : anim.stretch != null ? Math.min(1, anim.stretch) : 0; const lerp = (a, b, k) => a + (b - a) * k;
    const la = [lerp(-24 - swing * 6, -32, au), lerp(-44, -108, au)]; const ra = anim.wave ? [30, -106 + Math.sin(t * 9) * 8] : [lerp(24 + swing * 6, 32, au), lerp(-44, -108, au)];
    const sl = pj ? 0.62 : 0.3;
    [[-14, -68, la], [14, -68, ra]].forEach(([sx, sy, h]) => {
      ctx.strokeStyle = look.skin; ctx.lineWidth = 7; ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(h[0], h[1]); ctx.stroke();
      ctx.strokeStyle = topC; ctx.lineWidth = 10; ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(sx + (h[0] - sx) * sl, sy + (h[1] - sy) * sl); ctx.stroke();
      ctx.fillStyle = look.skin; A.circle(ctx, h[0], h[1], 5.5); ctx.fill();
    });
    if (anim.item) A.emoji(ctx, anim.item, ra[0] + 4, ra[1] - 10, 34);
    // neck + head
    ctx.fillStyle = look.skin; ctx.fillRect(-5, -84, 10, 10);
    ctx.save(); ctx.translate(0, -102); if (anim.stretch != null && anim.stretch > 0.3) ctx.rotate(-0.06); A.girlHead(ctx, look, { t, seed: anim.seed, sleepy: anim.sleepy, yawn: anim.yawn || (anim.stretch != null && anim.stretch > 0.45 && anim.stretch < 1), sing: anim.sing }); ctx.restore();
    ctx.restore();
  };

  // Pip the puppy: feet at (x,y), facing right. o: {happy, eat, walking, facing}
  A.puppy = function (ctx, x, y, s, t, o) {
    o = o || {}; s = s || 1; t = t || 0; const happy = !!o.happy; const wag = Math.sin(t * (happy ? 18 : 5)) * (happy ? 0.7 : 0.25);
    const body = '#e2b07a', dark = '#a9713f', light = '#fbe6c9'; const bounce = happy ? Math.abs(Math.sin(t * 8)) * 5 : 0;
    ctx.save(); ctx.translate(x, y); ctx.scale(s * (o.facing || 1), s); ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    ctx.fillStyle = 'rgba(0,0,0,.15)'; A.ellipse(ctx, 0, 0, 46, 10); ctx.fill(); ctx.translate(0, -bounce);
    ctx.strokeStyle = 'rgba(80,50,20,.5)'; ctx.lineWidth = 2.5;
    ctx.save(); ctx.translate(-40, -40); ctx.rotate(-0.9 + wag); ctx.strokeStyle = body; ctx.lineWidth = 9; ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(-6, -14, -2, -28); ctx.stroke(); ctx.restore();
    [-28, -14, 12, 26].forEach((lx, i) => { const st = o.walking ? Math.sin(t * 10 + i * 1.6) * 6 : 0; ctx.strokeStyle = body; ctx.lineWidth = 11; ctx.beginPath(); ctx.moveTo(lx, -28); ctx.lineTo(lx + st, -5); ctx.stroke(); ctx.fillStyle = light; A.ellipse(ctx, lx + st, -4, 7, 4); ctx.fill(); });
    const bg = ctx.createLinearGradient(0, -60, 0, -10); bg.addColorStop(0, A.shade(body, 0.12)); bg.addColorStop(1, A.shade(body, -0.1)); ctx.fillStyle = bg; A.ellipse(ctx, -6, -38, 42, 24); ctx.fill(); ctx.stroke();
    ctx.fillStyle = light; A.ellipse(ctx, -2, -30, 22, 11); ctx.fill();
    ctx.fillStyle = dark; A.ellipse(ctx, -22, -46, 12, 8); ctx.fill(); // spot
    const hx = o.eat ? 42 : 32, hy = o.eat ? -30 : -64;
    ctx.fillStyle = dark; ctx.save(); ctx.translate(hx + 16, hy + 2); ctx.rotate(-0.35 + Math.sin(t * 6) * 0.05); A.ellipse(ctx, 0, 10, 9, 19); ctx.fill(); ctx.stroke(); ctx.restore();
    ctx.fillStyle = body; A.circle(ctx, hx, hy, 24); ctx.fill(); ctx.stroke();
    ctx.fillStyle = dark; ctx.save(); ctx.translate(hx - 18, hy + 2); ctx.rotate(0.3 - Math.sin(t * 6) * 0.05); A.ellipse(ctx, 0, 10, 9, 19); ctx.fill(); ctx.stroke(); ctx.restore();
    ctx.fillStyle = light; A.ellipse(ctx, hx + 10, hy + 8, 13, 9); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#1e293b'; A.ellipse(ctx, hx + 19, hy + 4, 5, 4); ctx.fill();
    const blink = ((t + 1) % 4) < 0.12; ctx.fillStyle = '#fff'; A.ellipse(ctx, hx - 4, hy - 7, 5, blink ? 1 : 6); ctx.fill(); A.ellipse(ctx, hx + 12, hy - 8, 5, blink ? 1 : 6); ctx.fill();
    ctx.fillStyle = '#1e293b'; A.circle(ctx, hx - 3, hy - 6, 2.6); ctx.fill(); A.circle(ctx, hx + 13, hy - 7, 2.6); ctx.fill();
    ctx.strokeStyle = '#1e293b'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(hx + 10, hy + 12, 6, 0.1 * Math.PI, 0.9 * Math.PI); ctx.stroke();
    if (happy) { ctx.fillStyle = '#fb7185'; A.ellipse(ctx, hx + 10, hy + 21, 5, 7); ctx.fill(); }
    ctx.fillStyle = '#ef4444'; A.roundRect(ctx, hx - 22, hy + 18, 36, 7, 3); ctx.fill(); ctx.fillStyle = '#fde047'; A.circle(ctx, hx - 4, hy + 27, 4); ctx.fill();
    ctx.restore();
  };

  // Alarm clock centred at (x,y). o: {t, ring, minute, color}
  A.alarmClock = function (ctx, x, y, r, hour, o) {
    o = o || {}; const t = o.t || 0; const col = o.color || '#f87171';
    ctx.save(); ctx.translate(x, y); if (o.ring) ctx.rotate(Math.sin(t * 40) * 0.07); ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    ctx.strokeStyle = '#475569'; ctx.lineWidth = r * 0.12; ctx.beginPath(); ctx.moveTo(-r * 0.5, r * 0.85); ctx.lineTo(-r * 0.75, r * 1.15); ctx.moveTo(r * 0.5, r * 0.85); ctx.lineTo(r * 0.75, r * 1.15); ctx.stroke();
    ctx.fillStyle = col; ctx.strokeStyle = OUT; ctx.lineWidth = 2.5; A.circle(ctx, -r * 0.62, -r * 0.82, r * 0.3); ctx.fill(); ctx.stroke(); A.circle(ctx, r * 0.62, -r * 0.82, r * 0.3); ctx.fill(); ctx.stroke(); A.roundRect(ctx, -r * 0.12, -r * 1.2, r * 0.24, r * 0.22, 3); ctx.fill();
    const g = ctx.createRadialGradient(-r * 0.3, -r * 0.3, r * 0.1, 0, 0, r); g.addColorStop(0, A.shade(col, 0.3)); g.addColorStop(1, A.shade(col, -0.15)); ctx.fillStyle = g; A.circle(ctx, 0, 0, r); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#fff'; A.circle(ctx, 0, 0, r * 0.78); ctx.fill();
    for (let i = 1; i <= 12; i++) { const a = (i * Math.PI) / 6 - Math.PI / 2; const px = Math.cos(a) * r * 0.6, py = Math.sin(a) * r * 0.6; if (r >= 34) A.text(ctx, String(i), px, py, { size: r * 0.2, color: '#334155' }); else { ctx.fillStyle = '#334155'; A.circle(ctx, px, py, r * 0.05); ctx.fill(); } }
    const ha = ((hour % 12) / 12 + (o.minute || 0) / 720) * Math.PI * 2 - Math.PI / 2; const ma = ((o.minute || 0) / 60) * Math.PI * 2 - Math.PI / 2;
    ctx.strokeStyle = '#1e293b'; ctx.lineWidth = r * 0.09; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(Math.cos(ha) * r * 0.38, Math.sin(ha) * r * 0.38); ctx.stroke();
    ctx.lineWidth = r * 0.06; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(Math.cos(ma) * r * 0.62, Math.sin(ma) * r * 0.62); ctx.stroke();
    ctx.fillStyle = '#ef4444'; A.circle(ctx, 0, 0, r * 0.07); ctx.fill();
    if (o.ring) { ctx.strokeStyle = 'rgba(30,41,59,.55)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(-r * 1.3, -r * 0.8, r * 0.32, Math.PI * 0.7, Math.PI * 1.3); ctx.stroke(); ctx.beginPath(); ctx.arc(r * 1.3, -r * 0.8, r * 0.32, -Math.PI * 0.3, Math.PI * 0.3); ctx.stroke(); }
    ctx.restore();
  };

  // A window centred at (x,y) showing the weather; o: {weather, open (0..1 curtains), curtain, t, night}
  A.windowView = function (ctx, x, y, w, h, o) {
    o = o || {}; const t = o.t || 0; const wx = o.weather || 'sunny'; const cur = o.curtain || '#f9a8d4';
    ctx.save(); ctx.translate(x, y); ctx.lineJoin = 'round';
    ctx.fillStyle = '#fff'; ctx.strokeStyle = OUT; ctx.lineWidth = 3; A.roundRect(ctx, -w / 2 - 12, -h / 2 - 12, w + 24, h + 24, 10); ctx.fill(); ctx.stroke();
    ctx.save(); ctx.beginPath(); ctx.rect(-w / 2, -h / 2, w, h); ctx.clip();
    const top = o.night ? '#1e1b4b' : wx === 'rainy' ? '#94a3b8' : wx === 'snowy' ? '#cbd5e1' : wx === 'windy' ? '#93c5fd' : '#7dd3fc'; const bot = o.night ? '#4c1d95' : wx === 'rainy' ? '#cbd5e1' : wx === 'snowy' ? '#f1f5f9' : '#e0f2fe';
    const g = ctx.createLinearGradient(0, -h / 2, 0, h / 2); g.addColorStop(0, top); g.addColorStop(1, bot); ctx.fillStyle = g; ctx.fillRect(-w / 2, -h / 2, w, h);
    if (o.night) { ctx.fillStyle = '#fef9c3'; for (let i = 0; i < 8; i++) { A.starPath(ctx, -w / 2 + ((i * 53) % w), -h / 2 + ((i * 37) % (h * 0.6)), 3 + (i % 2), 1.5, 4); ctx.fill(); } A.circle(ctx, w * 0.25, -h * 0.2, h * 0.16); ctx.fill(); ctx.fillStyle = top; A.circle(ctx, w * 0.3, -h * 0.25, h * 0.14); ctx.fill(); }
    else if (wx === 'sunny') A.sun(ctx, w * 0.22, -h * 0.18, Math.min(w, h) * 0.17, t);
    else if (wx === 'rainy') { A.cloud(ctx, -w * 0.1, -h * 0.28, h * 0.11, 0.95); A.cloud(ctx, w * 0.25, -h * 0.2, h * 0.09, 0.9); ctx.strokeStyle = 'rgba(56,189,248,.8)'; ctx.lineWidth = 2.5; for (let i = 0; i < 16; i++) { const rx = -w / 2 + ((i * 61) % w), ry = -h / 2 + ((i * 47 + t * 260) % h); ctx.beginPath(); ctx.moveTo(rx, ry); ctx.lineTo(rx - 3, ry + 12); ctx.stroke(); } }
    else if (wx === 'snowy') { A.cloud(ctx, 0, -h * 0.26, h * 0.1, 0.95); ctx.fillStyle = '#fff'; for (let i = 0; i < 18; i++) { A.circle(ctx, -w / 2 + ((i * 67 + Math.sin(t + i) * 10) % w), -h / 2 + ((i * 41 + t * 60) % h), 2.5 + (i % 3)); ctx.fill(); } }
    else { A.sun(ctx, w * 0.28, -h * 0.22, Math.min(w, h) * 0.11, t); A.cloud(ctx, -w * 0.15 + Math.sin(t) * 6, -h * 0.25, h * 0.08, 0.9); for (let i = 0; i < 5; i++) A.emoji(ctx, '🍂', -w / 2 + ((i * 83 + t * 120) % (w + 40)) - 20, -h * 0.1 + Math.sin(t * 3 + i) * 12 + i * 8, 16, { rot: t * 3 + i }); }
    ctx.fillStyle = wx === 'snowy' ? '#f8fafc' : '#86efac'; A.ellipse(ctx, -w * 0.25, h * 0.6, w * 0.7, h * 0.28); ctx.fill(); ctx.fillStyle = wx === 'snowy' ? '#e2e8f0' : '#4ade80'; A.ellipse(ctx, w * 0.35, h * 0.66, w * 0.7, h * 0.3); ctx.fill();
    ctx.restore();
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(0, -h / 2); ctx.lineTo(0, h / 2); ctx.moveTo(-w / 2, 0); ctx.lineTo(w / 2, 0); ctx.stroke();
    const open = o.open == null ? 1 : o.open; const cw = (w / 2 + 16) * (1 - open * 0.8);
    ctx.fillStyle = cur; ctx.strokeStyle = A.shade(cur, -0.3); ctx.lineWidth = 2;
    [-1, 1].forEach((s) => { const x0 = s * (w / 2 + 16); ctx.beginPath(); ctx.moveTo(x0, -h / 2 - 16); ctx.lineTo(x0 - s * cw, -h / 2 - 16); ctx.quadraticCurveTo(x0 - s * cw * 0.8, h * 0.1, x0 - s * cw * 0.9, h / 2 + 16); ctx.lineTo(x0, h / 2 + 16); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.strokeStyle = 'rgba(0,0,0,.08)'; for (let i = 1; i < 4; i++) { ctx.beginPath(); ctx.moveTo(x0 - s * cw * (i / 4), -h / 2 - 10); ctx.lineTo(x0 - s * cw * (i / 4), h / 2 + 10); ctx.stroke(); } ctx.strokeStyle = A.shade(cur, -0.3); });
    ctx.fillStyle = '#a16207'; A.roundRect(ctx, -w / 2 - 34, -h / 2 - 28, w + 68, 9, 4); ctx.fill(); A.circle(ctx, -w / 2 - 34, -h / 2 - 24, 8); ctx.fill(); A.circle(ctx, w / 2 + 34, -h / 2 - 24, 8); ctx.fill();
    ctx.restore();
  };

  // A bed seen from the side, bottom-centre at (x,y). o: {w, h, blanket (0..1 pulled up), fluff (0..1), teddy, color, sleeper (look), t}
  A.bed = function (ctx, x, y, o) {
    o = o || {}; const w = o.w || 340, h = o.h || 150; const t = o.t || 0; const col = o.color || '#a78bfa';
    ctx.save(); ctx.translate(x, y); ctx.lineJoin = 'round'; ctx.strokeStyle = OUT; ctx.lineWidth = 3;
    ctx.fillStyle = 'rgba(0,0,0,.15)'; A.ellipse(ctx, 0, 4, w * 0.58, 14); ctx.fill();
    ctx.fillStyle = '#78350f'; A.roundRect(ctx, -w / 2 + 8, -20, 18, 22, 5); ctx.fill(); A.roundRect(ctx, w / 2 - 26, -20, 18, 22, 5); ctx.fill();
    const fg = ctx.createLinearGradient(0, -h * 0.55, 0, -10); fg.addColorStop(0, '#b45309'); fg.addColorStop(1, '#92400e'); ctx.fillStyle = fg; A.roundRect(ctx, -w / 2, -h * 0.55, w, h * 0.45, 12); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#b45309'; A.roundRect(ctx, -w / 2 - 8, -h * 1.5, 36, h * 1.05, 14); ctx.fill(); ctx.stroke(); ctx.fillStyle = 'rgba(255,255,255,.2)'; A.roundRect(ctx, -w / 2 - 2, -h * 1.42, 8, h * 0.8, 4); ctx.fill();
    ctx.fillStyle = '#fff7ed'; A.roundRect(ctx, -w / 2 + 10, -h * 0.74, w - 20, h * 0.3, 12); ctx.fill(); ctx.stroke();
    const pf = o.fluff == null ? 1 : o.fluff; ctx.fillStyle = '#fff'; A.roundRect(ctx, -w / 2 + 34, -h * 0.74 - 12 - pf * 14, 96, 22 + pf * 14, 12); ctx.fill(); ctx.stroke();
    if (o.sleeper) { ctx.save(); ctx.translate(-w / 2 + 92, -h * 0.74 - 6 - pf * 6); ctx.rotate(0.25); ctx.scale(0.95, 0.95); A.girlHead(ctx, o.sleeper, { t, sleepy: true, yawn: o.yawn }); ctx.restore(); }
    const b = o.blanket == null ? 1 : o.blanket; const bl = -w / 2 + 120 + (1 - b) * (w - 210); const bw = w / 2 - 10 - bl;
    const bg = ctx.createLinearGradient(0, -h * 0.9, 0, -h * 0.4); bg.addColorStop(0, A.shade(col, 0.15)); bg.addColorStop(1, A.shade(col, -0.1)); ctx.fillStyle = bg;
    if (b < 1) { A.roundRect(ctx, bl, -h * 0.74 - 22 - (1 - b) * 20, bw, h * 0.44 + (1 - b) * 20, 16); ctx.fill(); ctx.stroke(); ctx.fillStyle = A.shade(col, 0.2); for (let i = 0; i < 3; i++) { A.ellipse(ctx, bl + 20 + i * (bw / 3.2), -h * 0.74 - 24 - (1 - b) * 20 + (i % 2) * 6, 22, 12); ctx.fill(); } }
    else { A.roundRect(ctx, bl, -h * 0.74 - 12, bw, h * 0.36, 14); ctx.fill(); ctx.stroke(); ctx.fillStyle = A.shade(col, 0.5); A.roundRect(ctx, bl, -h * 0.74 - 12, bw, 12, 6); ctx.fill(); }
    ctx.fillStyle = 'rgba(255,255,255,.7)'; for (let i = 0; i < 4; i++) { A.starPath(ctx, bl + 30 + i * (bw / 4.2), -h * 0.6 + (i % 2) * 10, 6, 2.8, 5); ctx.fill(); }
    if (o.teddy) A.emoji(ctx, '🧸', -w / 2 + 170, -h * 0.74 - 32, 46);
    ctx.restore();
  };

  A.sock = function (ctx, x, y, s, color, pattern) {
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s); ctx.lineJoin = 'round';
    const path = () => { ctx.beginPath(); ctx.moveTo(-14, -40); ctx.lineTo(14, -40); ctx.lineTo(14, 8); ctx.quadraticCurveTo(14, 20, 24, 26); ctx.lineTo(34, 32); ctx.quadraticCurveTo(40, 44, 26, 46); ctx.lineTo(-2, 46); ctx.quadraticCurveTo(-14, 44, -14, 32); ctx.closePath(); };
    ctx.fillStyle = color; ctx.strokeStyle = A.shade(color, -0.35); ctx.lineWidth = 2.5; path(); ctx.fill(); ctx.stroke();
    ctx.save(); path(); ctx.clip(); ctx.fillStyle = 'rgba(255,255,255,.8)';
    if (pattern === 'stripes') { for (let yy = -30; yy < 50; yy += 14) ctx.fillRect(-20, yy, 70, 6); }
    else if (pattern === 'dots') { for (let i = 0; i < 12; i++) { A.circle(ctx, -10 + (i % 3) * 14 + (Math.floor(i / 3) % 2) * 7, -32 + Math.floor(i / 3) * 18, 4); ctx.fill(); } }
    else if (pattern === 'stars') { for (let i = 0; i < 6; i++) { A.starPath(ctx, -6 + (i % 2) * 14, -30 + i * 12, 6, 2.6, 5); ctx.fill(); } }
    else if (pattern === 'hearts') { for (let i = 0; i < 6; i++) { A.heartPath(ctx, -6 + (i % 2) * 14, -28 + i * 12, 5); ctx.fill(); } }
    ctx.restore();
    ctx.fillStyle = '#fff'; ctx.strokeStyle = A.shade(color, -0.35); A.roundRect(ctx, -17, -46, 34, 13, 5); ctx.fill(); ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,.45)'; A.circle(ctx, 27, 39, 7); ctx.fill(); A.circle(ctx, -6, 30, 7); ctx.fill();
    ctx.restore();
  };

  A.cup = function (ctx, x, y, w, h, fill, o) { // bottom-centre; fill 0..1 (can exceed 1 for a spill)
    o = o || {}; ctx.save(); ctx.translate(x, y); ctx.lineJoin = 'round';
    ctx.fillStyle = 'rgba(255,255,255,.55)'; ctx.strokeStyle = '#94a3b8'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(-w / 2, -h); ctx.lineTo(w / 2, -h); ctx.lineTo(w / 2 - 8, 0); ctx.lineTo(-w / 2 + 8, 0); ctx.closePath(); ctx.fill(); ctx.stroke();
    const f = Math.min(1, fill); if (f > 0) { const fy = -h * f; const lw = w - 16 * (1 - f); ctx.fillStyle = o.color || '#fff'; ctx.beginPath(); ctx.moveTo(-lw / 2 - 0.5, fy); ctx.lineTo(lw / 2 + 0.5, fy); ctx.lineTo(w / 2 - 8, 0); ctx.lineTo(-w / 2 + 8, 0); ctx.closePath(); ctx.fill(); ctx.fillStyle = A.shade(o.color || '#ffffff', -0.08); A.ellipse(ctx, 0, fy, lw / 2, 5); ctx.fill(); }
    ctx.strokeStyle = 'rgba(255,255,255,.7)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(-w / 2 + 8, -h + 10); ctx.lineTo(-w / 2 + 12, -12); ctx.stroke();
    if (o.line) { ctx.strokeStyle = '#ef4444'; ctx.setLineDash([6, 5]); ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-w / 2 - 10, -h * o.line); ctx.lineTo(w / 2 + 10, -h * o.line); ctx.stroke(); ctx.setLineDash([]); }
    ctx.restore();
  };
  A.jug = function (ctx, x, y, s, tilt, o) { // handle side right; spout on the left; centred on the body
    o = o || {}; ctx.save(); ctx.translate(x, y); ctx.rotate(-(tilt || 0)); ctx.scale(s, s); ctx.lineJoin = 'round';
    ctx.fillStyle = o.color || '#93c5fd'; ctx.strokeStyle = A.shade(o.color || '#93c5fd', -0.4); ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(-26, -40); ctx.lineTo(-42, -52); ctx.lineTo(-26, -58); ctx.lineTo(26, -58); ctx.lineTo(30, 36); ctx.quadraticCurveTo(0, 48, -30, 36); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(26, -44); ctx.quadraticCurveTo(58, -40, 56, -10); ctx.quadraticCurveTo(54, 14, 28, 16); ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,.45)'; A.roundRect(ctx, -18, -48, 10, 70, 5); ctx.fill();
    if (o.label) A.emoji(ctx, o.label, 0, -8, 30);
    ctx.restore();
  };
  A.bowl = function (ctx, x, y, w, h, o) { // bottom-centre; o: {color, fill (0..1), fillColor, kibble (count)}
    o = o || {}; ctx.save(); ctx.translate(x, y); ctx.lineJoin = 'round'; const col = o.color || '#f472b6';
    ctx.fillStyle = 'rgba(0,0,0,.12)'; A.ellipse(ctx, 0, 2, w * 0.55, 8); ctx.fill();
    ctx.fillStyle = col; ctx.strokeStyle = A.shade(col, -0.35); ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(-w / 2, -h); ctx.quadraticCurveTo(-w / 2, 0, -w * 0.3, 0); ctx.lineTo(w * 0.3, 0); ctx.quadraticCurveTo(w / 2, 0, w / 2, -h); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = A.shade(col, -0.25); A.ellipse(ctx, 0, -h, w / 2, h * 0.28); ctx.fill();
    if (o.fill > 0) { ctx.fillStyle = o.fillColor || '#bae6fd'; A.ellipse(ctx, 0, -h, w / 2 - 6, h * 0.24); ctx.fill(); ctx.fillStyle = 'rgba(255,255,255,.5)'; A.ellipse(ctx, -w * 0.15, -h - 2, w * 0.12, 3); ctx.fill(); }
    if (o.kibble) { ctx.fillStyle = '#a16207'; for (let i = 0; i < o.kibble * 5; i++) { A.circle(ctx, -w * 0.32 + ((i * 37) % (w * 0.64)), -h - h * 0.1 + ((i * 13) % (h * 0.24)) - (o.kibble > 3 ? 6 : 0), 4); ctx.fill(); } }
    if (o.label) A.text(ctx, o.label, 0, -h * 0.45, { size: h * 0.36, color: '#fff', stroke: A.shade(col, -0.4), strokeWidth: 3 });
    ctx.restore();
  };
  A.flowerPot = function (ctx, x, y, s, grow, t) { // bottom-centre; grow 0..1
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s); ctx.lineJoin = 'round'; t = t || 0;
    ctx.fillStyle = '#c2410c'; ctx.strokeStyle = 'rgba(80,30,10,.5)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(-34, -50); ctx.lineTo(34, -50); ctx.lineTo(26, 0); ctx.lineTo(-26, 0); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#ea580c'; A.roundRect(ctx, -40, -62, 80, 16, 5); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#78350f'; A.ellipse(ctx, 0, -60, 30, 7); ctx.fill();
    const hgt = 20 + grow * 90; const sway = Math.sin(t * 2) * 0.04 * grow;
    ctx.save(); ctx.translate(0, -60); ctx.rotate(sway); ctx.strokeStyle = '#16a34a'; ctx.lineWidth = 6; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(4, -hgt / 2, 0, -hgt); ctx.stroke();
    ctx.fillStyle = '#22c55e'; ctx.strokeStyle = '#15803d'; ctx.lineWidth = 2; if (grow > 0.2) { ctx.save(); ctx.translate(-2, -hgt * 0.45); ctx.rotate(-0.6); A.ellipse(ctx, -12, 0, 14 * Math.min(1, grow * 1.5), 6); ctx.fill(); ctx.stroke(); ctx.restore(); } if (grow > 0.4) { ctx.save(); ctx.translate(2, -hgt * 0.65); ctx.rotate(0.6); A.ellipse(ctx, 12, 0, 14 * Math.min(1, grow * 1.3), 6); ctx.fill(); ctx.stroke(); ctx.restore(); }
    if (grow > 0.55) { const ps = Math.min(1, (grow - 0.55) / 0.45); ctx.save(); ctx.translate(0, -hgt); ctx.scale(ps, ps); ctx.fillStyle = '#f472b6'; ctx.strokeStyle = '#be185d'; for (let i = 0; i < 6; i++) { const a = (i * Math.PI * 2) / 6; A.ellipse(ctx, Math.cos(a) * 14, Math.sin(a) * 14, 9, 6); ctx.fill(); ctx.stroke(); } ctx.fillStyle = '#fde047'; A.circle(ctx, 0, 0, 8); ctx.fill(); ctx.stroke(); ctx.restore(); }
    else if (grow > 0.3) { ctx.fillStyle = '#4ade80'; A.ellipse(ctx, 0, -hgt - 4, 6, 9); ctx.fill(); ctx.stroke(); }
    ctx.restore(); ctx.restore();
  };
  A.backpack = function (ctx, x, y, s, o) { // bottom-centre; o: {color, open, t}
    o = o || {}; const col = o.color || '#a855f7'; ctx.save(); ctx.translate(x, y); ctx.scale(s, s); ctx.lineJoin = 'round';
    ctx.fillStyle = 'rgba(0,0,0,.15)'; A.ellipse(ctx, 0, 2, 70, 12); ctx.fill();
    ctx.strokeStyle = A.shade(col, -0.4); ctx.lineWidth = 3; ctx.fillStyle = A.shade(col, -0.2); A.roundRect(ctx, -46, -110, 22, 60, 10); ctx.fill(); ctx.stroke(); A.roundRect(ctx, 24, -110, 22, 60, 10); ctx.fill(); ctx.stroke();
    const g = ctx.createLinearGradient(-60, 0, 60, 0); g.addColorStop(0, A.shade(col, 0.15)); g.addColorStop(1, A.shade(col, -0.15)); ctx.fillStyle = g; A.roundRect(ctx, -60, -120, 120, 120, 26); ctx.fill(); ctx.stroke();
    if (o.open) { ctx.fillStyle = A.shade(col, -0.45); A.ellipse(ctx, 0, -112, 50, 12); ctx.fill(); ctx.stroke(); }
    ctx.fillStyle = A.shade(col, 0.3); A.roundRect(ctx, -40, -62, 80, 50, 16); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = A.shade(col, -0.45); ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(-36, -50); ctx.lineTo(36, -50); ctx.stroke(); ctx.fillStyle = '#fde047'; A.starPath(ctx, 0, -32, 12, 5.5, 5); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#334155'; A.roundRect(ctx, -12, -128, 24, 12, 6); ctx.fill();
    ctx.restore();
  };
  A.shoe = function (ctx, x, y, s, color, side, strap) { // sole centre at (x,y); side -1 left, 1 right (toe points that way)
    ctx.save(); ctx.translate(x, y); ctx.scale(s * side, s); ctx.lineJoin = 'round';
    ctx.fillStyle = '#e2e8f0'; ctx.strokeStyle = 'rgba(40,40,60,.5)'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(-34, 6); ctx.lineTo(38, 6); ctx.quadraticCurveTo(48, 6, 46, -4); ctx.lineTo(-30, -4); ctx.quadraticCurveTo(-38, -4, -34, 6); ctx.closePath(); ctx.fill(); ctx.stroke();
    const g = ctx.createLinearGradient(0, -34, 0, -4); g.addColorStop(0, A.shade(color, 0.2)); g.addColorStop(1, A.shade(color, -0.1)); ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(-30, -4); ctx.lineTo(-30, -30); ctx.quadraticCurveTo(-28, -38, -18, -36); ctx.lineTo(6, -30); ctx.quadraticCurveTo(34, -26, 46, -6); ctx.lineTo(46, -4); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#fff'; A.ellipse(ctx, 30, -10, 12, 6); ctx.fill();
    ctx.fillStyle = strap ? A.shade(color, -0.35) : '#fde047'; ctx.strokeStyle = 'rgba(40,40,60,.5)'; ctx.save(); if (!strap) { ctx.translate(-6, -30); ctx.rotate(-0.9); ctx.translate(6, 30); } A.roundRect(ctx, -8, -34, 26, 9, 4); ctx.fill(); ctx.stroke(); ctx.restore();
    ctx.restore();
  };
  A.hairbrush = function (ctx, x, y, s, rot) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(rot || 0); ctx.scale(s, s); ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    ctx.fillStyle = '#c084fc'; ctx.strokeStyle = '#7e22ce'; ctx.lineWidth = 3; A.roundRect(ctx, -8, 20, 16, 60, 8); ctx.fill(); ctx.stroke();
    A.ellipse(ctx, 0, -6, 24, 34); ctx.fill(); ctx.stroke(); ctx.fillStyle = '#1e293b'; for (let i = 0; i < 14; i++) { A.circle(ctx, -14 + (i % 4) * 9.3, -26 + Math.floor(i / 4) * 12, 2.6); ctx.fill(); }
    ctx.restore();
  };
  A.wateringCan = function (ctx, x, y, s, tilt, o) {
    o = o || {}; ctx.save(); ctx.translate(x, y); ctx.rotate(-(tilt || 0)); ctx.scale(s, s); ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    ctx.fillStyle = '#22c55e'; ctx.strokeStyle = '#15803d'; ctx.lineWidth = 3; A.roundRect(ctx, -26, -34, 52, 60, 10); ctx.fill(); ctx.stroke();
    ctx.lineWidth = 9; ctx.strokeStyle = '#22c55e'; ctx.beginPath(); ctx.moveTo(-20, -8); ctx.lineTo(-58, -40); ctx.stroke(); ctx.strokeStyle = '#15803d'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(-20, -8); ctx.lineTo(-58, -40); ctx.stroke();
    ctx.fillStyle = '#22c55e'; A.circle(ctx, -62, -44, 12); ctx.fill(); ctx.stroke(); ctx.fillStyle = '#1e293b'; for (let i = 0; i < 5; i++) { A.circle(ctx, -68 + (i % 3) * 5, -50 + Math.floor(i / 3) * 6, 1.4); ctx.fill(); }
    ctx.strokeStyle = '#15803d'; ctx.lineWidth = 6; ctx.beginPath(); ctx.arc(0, -34, 20, Math.PI, 0); ctx.stroke(); ctx.beginPath(); ctx.moveTo(26, -12); ctx.quadraticCurveTo(50, -10, 46, 12); ctx.stroke();
    ctx.restore();
  };
  A.washcloth = function (ctx, x, y, s, t) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(Math.sin((t || 0) * 6) * 0.1); ctx.scale(s, s); ctx.lineJoin = 'round';
    ctx.fillStyle = '#fde68a'; ctx.strokeStyle = '#ca8a04'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(-34, -30); ctx.quadraticCurveTo(0, -38, 34, -30); ctx.quadraticCurveTo(40, 0, 34, 30); ctx.quadraticCurveTo(0, 38, -34, 30); ctx.quadraticCurveTo(-40, 0, -34, -30); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = 'rgba(202,138,4,.35)'; ctx.lineWidth = 2; for (let i = -2; i <= 2; i++) { ctx.beginPath(); ctx.moveTo(-30, i * 12); ctx.lineTo(30, i * 12); ctx.moveTo(i * 12, -30); ctx.lineTo(i * 12, 30); ctx.stroke(); }
    A.bubble(ctx, -20, -20, 8, 0.8); A.bubble(ctx, 22, 16, 6, 0.7);
    ctx.restore();
  };
  A.bubble = A.bubble || function (ctx, x, y, r, alpha) { ctx.save(); ctx.globalAlpha = alpha == null ? 0.8 : alpha; const g = ctx.createRadialGradient(x - r * 0.3, y - r * 0.3, r * 0.1, x, y, r); g.addColorStop(0, 'rgba(255,255,255,.9)'); g.addColorStop(0.6, 'rgba(186,230,253,.35)'); g.addColorStop(1, 'rgba(147,197,253,.6)'); ctx.fillStyle = g; A.circle(ctx, x, y, r); ctx.fill(); ctx.strokeStyle = 'rgba(255,255,255,.8)'; ctx.lineWidth = 1.5; ctx.stroke(); ctx.fillStyle = 'rgba(255,255,255,.9)'; A.ellipse(ctx, x - r * 0.35, y - r * 0.4, r * 0.22, r * 0.12); ctx.fill(); ctx.restore(); };
  A.toothbrush = function (ctx, x, y, s, rot) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(rot || 0); ctx.scale(s, s); ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    ctx.fillStyle = '#60a5fa'; ctx.strokeStyle = '#1d4ed8'; ctx.lineWidth = 3; A.roundRect(ctx, -9, -10, 18, 90, 9); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#fff'; A.roundRect(ctx, -11, -48, 22, 42, 8); ctx.fill(); ctx.stroke(); ctx.fillStyle = '#cbd5e1'; for (let i = 0; i < 9; i++) { ctx.fillRect(-8 + (i % 3) * 6, -44 + Math.floor(i / 3) * 11, 4, 8); }
    ctx.fillStyle = '#4ade80'; A.roundRect(ctx, -7, -46, 14, 8, 4); ctx.fill();
    ctx.restore();
  };
  // Simple room furniture for the house map (top-down-ish, bottom-centre anchored).
  A.wardrobe = function (ctx, x, y, w, h, o) { o = o || {}; ctx.save(); ctx.translate(x, y); ctx.lineJoin = 'round'; ctx.fillStyle = '#b45309'; ctx.strokeStyle = 'rgba(60,30,10,.5)'; ctx.lineWidth = 3; A.roundRect(ctx, -w / 2, -h, w, h, 8); ctx.fill(); ctx.stroke(); ctx.fillStyle = '#d97706'; A.roundRect(ctx, -w / 2 + 6, -h + 6, w / 2 - 9, h - 12, 6); ctx.fill(); ctx.stroke(); A.roundRect(ctx, 3, -h + 6, w / 2 - 9, h - 12, 6); ctx.fill(); ctx.stroke(); ctx.fillStyle = '#fde047'; A.circle(ctx, -8, -h / 2, 4); ctx.fill(); A.circle(ctx, 8, -h / 2, 4); ctx.fill(); if (o.emoji) A.emoji(ctx, o.emoji, 0, -h - 18, 30); ctx.restore(); };
  A.fridge = function (ctx, x, y, w, h) { ctx.save(); ctx.translate(x, y); ctx.lineJoin = 'round'; const g = ctx.createLinearGradient(-w / 2, 0, w / 2, 0); g.addColorStop(0, '#f8fafc'); g.addColorStop(1, '#cbd5e1'); ctx.fillStyle = g; ctx.strokeStyle = 'rgba(40,40,60,.5)'; ctx.lineWidth = 3; A.roundRect(ctx, -w / 2, -h, w, h, 8); ctx.fill(); ctx.stroke(); ctx.beginPath(); ctx.moveTo(-w / 2, -h * 0.62); ctx.lineTo(w / 2, -h * 0.62); ctx.stroke(); ctx.fillStyle = '#64748b'; A.roundRect(ctx, w / 2 - 14, -h * 0.9, 6, h * 0.2, 3); ctx.fill(); A.roundRect(ctx, w / 2 - 14, -h * 0.55, 6, h * 0.3, 3); ctx.fill(); A.emoji(ctx, '🧲', -w * 0.15, -h * 0.8, 16); A.emoji(ctx, '🖼️', -w * 0.1, -h * 0.35, 22); ctx.restore(); };
  A.tub = function (ctx, x, y, w, h, t) { ctx.save(); ctx.translate(x, y); ctx.lineJoin = 'round'; ctx.fillStyle = '#fff'; ctx.strokeStyle = '#94a3b8'; ctx.lineWidth = 4; A.roundRect(ctx, -w / 2, -h, w, h, h / 2.2); ctx.fill(); ctx.stroke(); ctx.fillStyle = '#7dd3fc'; A.roundRect(ctx, -w / 2 + 12, -h + 12, w - 24, h - 24, h / 2.8); ctx.fill(); for (let i = 0; i < 4; i++) A.bubble(ctx, -w / 4 + i * (w / 6), -h / 2 + Math.sin((t || 0) * 2 + i) * 6, 8 + (i % 2) * 4, 0.7); ctx.fillStyle = '#94a3b8'; A.roundRect(ctx, w / 2 - 30, -h - 12, 8, 24, 4); ctx.fill(); ctx.restore(); };
  A.doghouse = function (ctx, x, y, s) { ctx.save(); ctx.translate(x, y); ctx.scale(s, s); ctx.lineJoin = 'round'; ctx.fillStyle = 'rgba(0,0,0,.15)'; A.ellipse(ctx, 0, 4, 70, 12); ctx.fill(); ctx.fillStyle = '#fbbf24'; ctx.strokeStyle = 'rgba(80,50,10,.5)'; ctx.lineWidth = 3; A.roundRect(ctx, -56, -80, 112, 80, 8); ctx.fill(); ctx.stroke(); ctx.fillStyle = '#ef4444'; ctx.beginPath(); ctx.moveTo(-70, -76); ctx.lineTo(0, -128); ctx.lineTo(70, -76); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.fillStyle = '#78350f'; ctx.beginPath(); ctx.moveTo(-24, 0); ctx.lineTo(-24, -40); ctx.arc(0, -40, 24, Math.PI, 0); ctx.lineTo(24, 0); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.fillStyle = '#fff'; A.roundRect(ctx, -30, -102, 60, 18, 6); ctx.fill(); ctx.stroke(); A.text(ctx, 'PIP', 0, -93, { size: 14, color: '#b45309' }); ctx.restore(); };
})();
