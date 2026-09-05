// Germ Patrol art: the hero kid, cartoon germs, hands, teeth and town props.
(function () {
  const A = FL.Art;
  A.HEROES = FL.Data.HEROES;
  A.capeColors = function () { const S = FL.Data.CAPE_SETS; let l = S.set1.slice(); if (FL.Save.has('cape', 'set2')) l = l.concat(S.set2); if (FL.Save.has('cape', 'set3')) l = l.concat(S.set3); return l; };
  // Hero: feet at (x,y). anim {t, walking, facing, cheer, wave}
  A.hero = function (ctx, x, y, look, anim, scale) {
    anim = anim || {}; scale = scale || 1; const t = anim.t || 0; const walking = !!anim.walking;
    const bob = walking ? Math.abs(Math.sin(t * 11)) * 4 : Math.sin(t * 2.2) * 1.5; const swing = walking ? Math.sin(t * 11) : 0;
    ctx.save(); ctx.translate(x, y); ctx.scale(scale * (anim.facing || 1), scale);
    ctx.fillStyle = 'rgba(0,0,0,.18)'; A.ellipse(ctx, 0, 0, 28, 9); ctx.fill();
    ctx.translate(0, -bob); ctx.lineJoin = 'round'; ctx.lineCap = 'round'; const OUT = 'rgba(30,40,70,.55)';
    // cape (behind), flowing
    const flow = walking ? 0.5 : 0.15; ctx.fillStyle = look.cape; ctx.strokeStyle = OUT; ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.moveTo(-14, -70); ctx.quadraticCurveTo(-40 - Math.sin(t * 8) * 10 * flow - 20 * flow, -40, -34 - Math.sin(t * 6) * 8 * flow - 30 * flow, -6 + Math.sin(t * 7) * 4); ctx.lineTo(-6, -14); ctx.lineTo(14, -70); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = look.capeDark; ctx.beginPath(); ctx.moveTo(-14, -70); ctx.quadraticCurveTo(-30 - 15 * flow, -45, -26 - 20 * flow, -14); ctx.lineTo(-10, -22); ctx.closePath(); ctx.fill();
    // legs & shoes
    ctx.strokeStyle = look.skin; ctx.lineWidth = 9; ctx.beginPath(); ctx.moveTo(-9, -30); ctx.lineTo(-9 + swing * 7, -6); ctx.moveTo(9, -30); ctx.lineTo(9 - swing * 7, -6); ctx.stroke();
    ctx.fillStyle = '#1e293b'; A.ellipse(ctx, -9 + swing * 7, -3, 11, 6); ctx.fill(); A.ellipse(ctx, 9 - swing * 7, -3, 11, 6); ctx.fill();
    ctx.fillStyle = look.capeDark; A.roundRect(ctx, -16, -42, 32, 16, 6); ctx.fill(); // shorts
    // body / shirt
    ctx.fillStyle = look.shirt; ctx.strokeStyle = OUT; ctx.lineWidth = 2.5; A.roundRect(ctx, -17, -72, 34, 34, 10); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#fde047'; A.starPath(ctx, 0, -56, 8, 3.5, 5); ctx.fill(); ctx.strokeStyle = '#b45309'; ctx.lineWidth = 1.5; ctx.stroke();
    // arms
    ctx.strokeStyle = look.skin; ctx.lineWidth = 7; const up = anim.cheer || anim.wave;
    const la = up ? [-28, -96] : [-24 - swing * 6, -44]; const ra = anim.wave ? [28, -100 + Math.sin(t * 9) * 8] : up ? [28, -96] : [24 + swing * 6, -44];
    ctx.beginPath(); ctx.moveTo(-14, -66); ctx.lineTo(la[0], la[1]); ctx.stroke(); ctx.beginPath(); ctx.moveTo(14, -66); ctx.lineTo(ra[0], ra[1]); ctx.stroke();
    ctx.fillStyle = look.skin; A.circle(ctx, la[0], la[1], 5.5); ctx.fill(); A.circle(ctx, ra[0], ra[1], 5.5); ctx.fill();
    ctx.fillStyle = look.shirt; A.circle(ctx, -15, -67, 7); ctx.fill(); A.circle(ctx, 15, -67, 7); ctx.fill();
    // head
    ctx.fillStyle = look.skin; ctx.strokeStyle = OUT; ctx.lineWidth = 2.5; ctx.fillRect(-5, -80, 10, 10); A.circle(ctx, 0, -98, 26); ctx.fill(); ctx.stroke();
    // hair
    ctx.fillStyle = look.hair;
    if (look.hairStyle === 'spiky') { ctx.beginPath(); ctx.moveTo(-26, -104); for (let i = 0; i < 6; i++) { ctx.lineTo(-22 + i * 9, -132 - (i % 2) * 8); ctx.lineTo(-17 + i * 9, -110); } ctx.lineTo(26, -104); ctx.arc(0, -100, 27, -0.15, Math.PI + 0.15, true); ctx.closePath(); ctx.fill(); }
    else if (look.hairStyle === 'puffs') { ctx.beginPath(); ctx.arc(0, -104, 27, Math.PI, 0); ctx.closePath(); ctx.fill(); A.circle(ctx, -24, -122, 12); ctx.fill(); A.circle(ctx, 24, -122, 12); ctx.fill(); }
    else if (look.hairStyle === 'ponytail') { ctx.beginPath(); ctx.arc(0, -102, 27, Math.PI * 0.95, Math.PI * 2.05); ctx.closePath(); ctx.fill(); ctx.beginPath(); ctx.moveTo(-22, -112); ctx.quadraticCurveTo(-46, -100 + Math.sin(t * 6) * 4, -36, -66); ctx.lineTo(-26, -70); ctx.quadraticCurveTo(-30, -95, -20, -104); ctx.closePath(); ctx.fill(); }
    else { ctx.beginPath(); ctx.arc(0, -102, 27, Math.PI * 0.95, Math.PI * 2.05); ctx.quadraticCurveTo(14, -112, 26, -98); ctx.closePath(); ctx.fill(); }
    // goggles on forehead
    const gg = look.goggles || 'plain'; ctx.strokeStyle = '#334155'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(-27, -114); ctx.lineTo(27, -114); ctx.stroke();
    ctx.fillStyle = gg === 'rainbow' ? '#a855f7' : gg === 'star' ? '#fde047' : '#94a3b8'; [-11, 11].forEach((gx) => { A.circle(ctx, gx, -114, 9); ctx.fill(); ctx.stroke(); }); ctx.fillStyle = 'rgba(186,230,253,.9)'; [-11, 11].forEach((gx) => { A.circle(ctx, gx, -114, 6); ctx.fill(); });
    if (gg === 'rainbow') { ctx.fillStyle = '#f472b6'; A.circle(ctx, -11, -114, 3); ctx.fill(); ctx.fillStyle = '#4ade80'; A.circle(ctx, 11, -114, 3); ctx.fill(); }
    // face
    const blink = ((t + (anim.seed || 0)) % 3.7) < 0.12 ? 0.15 : 1;
    ctx.fillStyle = '#fff'; A.ellipse(ctx, -9, -98, 5.5, 6.5 * blink); ctx.fill(); A.ellipse(ctx, 9, -98, 5.5, 6.5 * blink); ctx.fill();
    ctx.fillStyle = '#1e293b'; A.ellipse(ctx, -8, -97, 3.2, 4 * blink); ctx.fill(); A.ellipse(ctx, 10, -97, 3.2, 4 * blink); ctx.fill();
    ctx.fillStyle = '#fff'; A.circle(ctx, -7, -99, 1.3); ctx.fill(); A.circle(ctx, 11, -99, 1.3); ctx.fill();
    ctx.fillStyle = 'rgba(244,114,182,.4)'; A.circle(ctx, -16, -89, 4.5); ctx.fill(); A.circle(ctx, 16, -89, 4.5); ctx.fill();
    ctx.strokeStyle = '#9f1239'; ctx.lineWidth = 2.2; ctx.beginPath(); ctx.arc(0, -88, 7, Math.PI * 0.15, Math.PI * 0.85); ctx.stroke();
    ctx.restore();
  };
  // Cartoon germ. germ = FL.Data.GERMS entry (or {shape,color,good}). r = radius.
  A.germ = function (ctx, x, y, r, germ, t, o) {
    o = o || {}; t = t || 0; ctx.save(); ctx.translate(x, y); if (o.alpha != null) ctx.globalAlpha = o.alpha; ctx.rotate(o.rot || Math.sin(t * 2 + x) * 0.1);
    const c = germ.color; const dark = A.shade(c, -0.35); ctx.strokeStyle = dark; ctx.lineWidth = Math.max(2, r * 0.08); ctx.lineJoin = 'round';
    const wob = 1 + Math.sin(t * 5 + x) * 0.05;
    if (germ.shape === 'spiky') { ctx.fillStyle = c; ctx.beginPath(); for (let i = 0; i < 24; i++) { const a = (i / 24) * Math.PI * 2; const rr = i % 2 ? r * 0.72 : r * 1.05 * wob; ctx.lineTo(Math.cos(a) * rr, Math.sin(a) * rr); } ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.fillStyle = A.shade(c, 0.35); A.circle(ctx, 0, 0, r * 0.6); ctx.fill(); }
    else if (germ.shape === 'rod') { ctx.fillStyle = c; A.roundRect(ctx, -r * 1.3, -r * 0.65, r * 2.6, r * 1.3 * wob, r * 0.65); ctx.fill(); ctx.stroke(); ctx.fillStyle = 'rgba(255,255,255,.35)'; A.ellipse(ctx, -r * 0.6, -r * 0.3, r * 0.5, r * 0.18); ctx.fill(); for (let i = 0; i < 6; i++) { const a = (i / 6) * Math.PI * 2; ctx.strokeStyle = dark; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(Math.cos(a) * r * 1.1, Math.sin(a) * r * 0.6); ctx.lineTo(Math.cos(a) * r * 1.5, Math.sin(a) * r * 0.9 + Math.sin(t * 8 + i) * 3); ctx.stroke(); } }
    else if (germ.shape === 'fuzzy') { ctx.fillStyle = c; ctx.beginPath(); for (let i = 0; i < 40; i++) { const a = (i / 40) * Math.PI * 2; const rr = r * (0.85 + Math.sin(i * 3 + t * 3) * 0.12); ctx.lineTo(Math.cos(a) * rr, Math.sin(a) * rr); } ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.strokeStyle = dark; ctx.lineWidth = 2; for (let i = 0; i < 10; i++) { const a = (i / 10) * Math.PI * 2 + 0.3; ctx.beginPath(); ctx.moveTo(Math.cos(a) * r * 0.8, Math.sin(a) * r * 0.8); ctx.lineTo(Math.cos(a) * r * 1.35, Math.sin(a) * r * 1.35); ctx.lineTo(Math.cos(a + 0.25) * r * 1.5, Math.sin(a + 0.25) * r * 1.5); ctx.stroke(); } }
    else { ctx.fillStyle = c; A.circle(ctx, 0, 0, r * wob); ctx.fill(); ctx.stroke(); ctx.fillStyle = 'rgba(255,255,255,.35)'; A.ellipse(ctx, -r * 0.35, -r * 0.35, r * 0.3, r * 0.18); ctx.fill(); if (!germ.good) { ctx.fillStyle = dark; for (let i = 0; i < 5; i++) { const a = (i / 5) * Math.PI * 2 + t; A.circle(ctx, Math.cos(a) * r * 0.55, Math.sin(a) * r * 0.55, r * 0.1); ctx.fill(); } } }
    // face
    const ex = r * 0.32, ey = -r * 0.12; ctx.fillStyle = '#fff'; A.circle(ctx, -ex, ey, r * 0.24); ctx.fill(); A.circle(ctx, ex, ey, r * 0.24); ctx.fill();
    ctx.fillStyle = '#1e293b'; A.circle(ctx, -ex + r * 0.05, ey + r * 0.03, r * 0.11); ctx.fill(); A.circle(ctx, ex + r * 0.05, ey + r * 0.03, r * 0.11); ctx.fill();
    ctx.strokeStyle = '#1e293b'; ctx.lineWidth = Math.max(1.5, r * 0.06); ctx.lineCap = 'round';
    if (germ.good) { ctx.beginPath(); ctx.arc(0, r * 0.15, r * 0.35, 0.15 * Math.PI, 0.85 * Math.PI); ctx.stroke(); ctx.fillStyle = 'rgba(244,114,182,.5)'; A.circle(ctx, -r * 0.55, r * 0.12, r * 0.12); ctx.fill(); A.circle(ctx, r * 0.55, r * 0.12, r * 0.12); ctx.fill(); }
    else { ctx.beginPath(); ctx.moveTo(-ex - r * 0.25, ey - r * 0.32); ctx.lineTo(-ex + r * 0.15, ey - r * 0.2); ctx.moveTo(ex + r * 0.25, ey - r * 0.32); ctx.lineTo(ex - r * 0.15, ey - r * 0.2); ctx.stroke(); ctx.beginPath(); ctx.arc(0, r * 0.28, r * 0.28, 0.1 * Math.PI, 0.9 * Math.PI); ctx.stroke(); ctx.fillStyle = '#fff'; ctx.fillRect(-r * 0.12, r * 0.4, r * 0.1, r * 0.12); ctx.fillRect(r * 0.04, r * 0.4, r * 0.1, r * 0.12); }
    ctx.restore();
  };
  A.bubble = function (ctx, x, y, r, alpha) { ctx.save(); ctx.globalAlpha = alpha == null ? 0.8 : alpha; const g = ctx.createRadialGradient(x - r * 0.3, y - r * 0.3, r * 0.1, x, y, r); g.addColorStop(0, 'rgba(255,255,255,.9)'); g.addColorStop(0.6, 'rgba(186,230,253,.35)'); g.addColorStop(1, 'rgba(147,197,253,.6)'); ctx.fillStyle = g; A.circle(ctx, x, y, r); ctx.fill(); ctx.strokeStyle = 'rgba(255,255,255,.8)'; ctx.lineWidth = 1.5; ctx.stroke(); ctx.fillStyle = 'rgba(255,255,255,.9)'; A.ellipse(ctx, x - r * 0.35, y - r * 0.4, r * 0.22, r * 0.12); ctx.fill(); ctx.restore(); };
  // Buildings for the town
  A.building = function (ctx, x, y, w, h, o) { // anchored bottom-centre
    o = o || {}; ctx.save(); ctx.translate(x, y); ctx.strokeStyle = 'rgba(30,40,70,.45)'; ctx.lineWidth = 3;
    ctx.fillStyle = 'rgba(0,0,0,.14)'; A.ellipse(ctx, 0, 4, w * 0.6, 14); ctx.fill();
    ctx.fillStyle = o.wall || '#fef3c7'; A.roundRect(ctx, -w / 2, -h, w, h, 10); ctx.fill(); ctx.stroke();
    ctx.fillStyle = o.roof || '#ef4444'; ctx.beginPath(); ctx.moveTo(-w / 2 - 14, -h + 6); ctx.lineTo(0, -h - w * 0.42); ctx.lineTo(w / 2 + 14, -h + 6); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = o.door || '#78350f'; A.roundRect(ctx, -w * 0.13, -h * 0.5, w * 0.26, h * 0.5, 8); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#bae6fd'; [-w * 0.3, w * 0.3].forEach((wx) => { A.roundRect(ctx, wx - w * 0.1, -h * 0.82, w * 0.2, h * 0.24, 6); ctx.fill(); ctx.stroke(); });
    if (o.sign) { ctx.fillStyle = '#fff'; A.roundRect(ctx, -w * 0.28, -h - 4 - w * 0.0, w * 0.56, 0, 0); A.emoji(ctx, o.sign, 0, -h - w * 0.17, w * 0.22); }
    ctx.restore();
  };
  A.tooth = function (ctx, x, y, w, h, o) { o = o || {}; ctx.save(); ctx.translate(x, y); ctx.fillStyle = o.color || '#fff'; ctx.strokeStyle = '#94a3b8'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(-w / 2, -h / 2); ctx.quadraticCurveTo(-w / 2, -h / 2 - h * 0.25, 0, -h / 2 - h * 0.2); ctx.quadraticCurveTo(w / 2, -h / 2 - h * 0.25, w / 2, -h / 2); ctx.lineTo(w / 2, h / 2 - h * 0.2); ctx.quadraticCurveTo(w / 2, h / 2 + h * 0.1, w * 0.25, h / 2); ctx.quadraticCurveTo(0, h / 2 - h * 0.2, -w * 0.25, h / 2); ctx.quadraticCurveTo(-w / 2, h / 2 + h * 0.1, -w / 2, h / 2 - h * 0.2); ctx.closePath(); ctx.fill(); ctx.stroke(); if (o.flip) { /* drawn same; rotation handled by caller */ } ctx.restore(); };
})();
