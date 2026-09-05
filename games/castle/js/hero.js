// The explorer: tunic, cape, boots, a feathered hat, and a spyglass. Drawn with feet at (x, y),
// same footprint as the engine's princess so every engine scene (quiz corner, results) shows her.
(function () {
  const A = FL.Art;
  A.explorer = function (ctx, x, y, look, anim, scale) {
    anim = anim || {}; scale = scale || 1; const t = anim.t || 0;
    const walking = !!anim.walking; const dance = anim.dance || 0;
    const bob = walking ? Math.abs(Math.sin(t * 11)) * 4 : Math.sin(t * 2.2) * 1.5 + dance * Math.abs(Math.sin(t * 8)) * 8;
    const swing = walking ? Math.sin(t * 11) : 0;
    const tunic = look.dress, cape = look.dressDark, band = look.crown;
    ctx.save(); ctx.translate(x, y); ctx.scale(scale * (anim.facing || 1), scale);
    ctx.fillStyle = 'rgba(0,0,0,.18)'; A.ellipse(ctx, 0, 0, 30, 9); ctx.fill();
    ctx.translate(0, -bob);
    ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    const OUT = 'rgba(40,30,60,.55)';
    // cape (behind everything), flutters when walking
    const flut = walking ? Math.sin(t * 9) * 8 : Math.sin(t * 1.5) * 3;
    ctx.fillStyle = cape; ctx.strokeStyle = OUT; ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.moveTo(-16, -66); ctx.quadraticCurveTo(-34 - flut, -40, -30 - flut * 1.5, -8); ctx.lineTo(28 - flut * 0.5, -10); ctx.quadraticCurveTo(30, -40, 16, -66); ctx.closePath(); ctx.fill(); ctx.stroke();
    // boots + legs
    ctx.strokeStyle = '#78350f'; ctx.lineWidth = 8; ctx.beginPath(); ctx.moveTo(-9, -30); ctx.lineTo(-11 + swing * 6, -6); ctx.moveTo(9, -30); ctx.lineTo(11 - swing * 6, -6); ctx.stroke();
    ctx.fillStyle = '#92400e'; ctx.strokeStyle = OUT; ctx.lineWidth = 2; A.roundRect(ctx, -20 + swing * 6, -10, 20, 11, 5); ctx.fill(); ctx.stroke(); A.roundRect(ctx, 0 - swing * 6, -10, 20, 11, 5); ctx.fill(); ctx.stroke();
    // tunic
    const dg = ctx.createLinearGradient(0, -70, 0, -20); dg.addColorStop(0, A.shade(tunic, 0.15)); dg.addColorStop(1, tunic);
    ctx.fillStyle = dg; ctx.strokeStyle = OUT; ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.moveTo(-15, -68); ctx.lineTo(-22, -26); ctx.quadraticCurveTo(0, -20 + dance * 4, 22, -26); ctx.lineTo(15, -68); ctx.closePath(); ctx.fill(); ctx.stroke();
    // belt + buckle
    ctx.fillStyle = '#78350f'; A.roundRect(ctx, -19, -40, 38, 7, 3); ctx.fill(); ctx.fillStyle = band; A.roundRect(ctx, -5, -42, 10, 11, 3); ctx.fill(); ctx.strokeStyle = OUT; ctx.lineWidth = 1.5; ctx.stroke();
    // collar
    ctx.fillStyle = A.shade(tunic, 0.5); ctx.beginPath(); ctx.moveTo(-12, -68); ctx.lineTo(0, -58); ctx.lineTo(12, -68); ctx.closePath(); ctx.fill();
    // arms
    ctx.strokeStyle = look.skin; ctx.lineWidth = 7;
    const armUp = anim.wave || dance > 0.5;
    const la = armUp ? [-30, -95] : [-24 - swing * 6, -40]; const ra = anim.wave ? [30, -100 + Math.sin(t * 9) * 8] : (armUp ? [30, -95] : [24 + swing * 6, -40]);
    ctx.beginPath(); ctx.moveTo(-12, -62); ctx.lineTo(la[0], la[1]); ctx.stroke(); ctx.beginPath(); ctx.moveTo(12, -62); ctx.lineTo(ra[0], ra[1]); ctx.stroke();
    ctx.fillStyle = look.skin; A.circle(ctx, la[0], la[1], 5); ctx.fill(); A.circle(ctx, ra[0], ra[1], 5); ctx.fill();
    ctx.fillStyle = tunic; ctx.strokeStyle = OUT; ctx.lineWidth = 2; A.circle(ctx, -14, -62, 8); ctx.fill(); ctx.stroke(); A.circle(ctx, 14, -62, 8); ctx.fill(); ctx.stroke();
    // spyglass in the right hand
    if (!anim.wave) { ctx.save(); ctx.translate(ra[0], ra[1]); ctx.rotate(armUp ? -0.5 : 0.4); ctx.fillStyle = '#b45309'; ctx.strokeStyle = OUT; ctx.lineWidth = 1.5; A.roundRect(ctx, -4, -30, 8, 32, 3); ctx.fill(); ctx.stroke(); ctx.fillStyle = '#fbbf24'; A.roundRect(ctx, -6, -34, 12, 8, 3); ctx.fill(); ctx.stroke(); ctx.fillStyle = '#7dd3fc'; A.circle(ctx, 0, -33, 3); ctx.fill(); ctx.restore(); }
    // neck + head
    ctx.fillStyle = look.skin; ctx.fillRect(-5, -76, 10, 10);
    ctx.strokeStyle = OUT; ctx.lineWidth = 2.5; A.circle(ctx, 0, -94, 26); ctx.fill(); ctx.stroke();
    // hair: short and tufty, peeking under the hat
    ctx.fillStyle = look.hair; ctx.beginPath(); ctx.arc(0, -96, 27, Math.PI * 1.05, Math.PI * 1.95); ctx.lineTo(24, -96); ctx.quadraticCurveTo(10, -104, 0, -98); ctx.quadraticCurveTo(-10, -104, -24, -96); ctx.closePath(); ctx.fill();
    A.circle(ctx, -24, -86, 7); ctx.fill(); A.circle(ctx, 24, -86, 7); ctx.fill();
    // eyes
    const blink = ((t + (anim.seed || 0)) % 3.7) < 0.12 ? 0.15 : 1;
    ctx.fillStyle = '#fff'; A.ellipse(ctx, -9, -94, 5.5, 6.5 * blink); ctx.fill(); A.ellipse(ctx, 9, -94, 5.5, 6.5 * blink); ctx.fill();
    ctx.fillStyle = '#2b2140'; A.ellipse(ctx, -8, -93, 3.2, 4 * blink); ctx.fill(); A.ellipse(ctx, 10, -93, 3.2, 4 * blink); ctx.fill();
    ctx.fillStyle = '#fff'; A.circle(ctx, -7, -95, 1.3); ctx.fill(); A.circle(ctx, 11, -95, 1.3); ctx.fill();
    ctx.strokeStyle = '#2b2140'; ctx.lineWidth = 1.8; ctx.beginPath(); ctx.arc(-9, -99, 6, Math.PI * 1.15, Math.PI * 1.85); ctx.stroke(); ctx.beginPath(); ctx.arc(9, -99, 6, Math.PI * 1.15, Math.PI * 1.85); ctx.stroke();
    // freckles, cheeks, mouth
    ctx.fillStyle = 'rgba(180,80,40,.4)'; [[-14, -86], [-10, -84], [12, -86], [16, -84]].forEach(([fx, fy]) => { A.circle(ctx, fx, fy, 1.3); ctx.fill(); });
    ctx.fillStyle = 'rgba(244,114,182,.35)'; A.circle(ctx, -16, -85, 4.5); ctx.fill(); A.circle(ctx, 16, -85, 4.5); ctx.fill();
    if (anim.sing) { ctx.fillStyle = '#9f1239'; A.ellipse(ctx, 0, -80, 5, 6 + Math.abs(Math.sin(t * 12)) * 2); ctx.fill(); }
    else { ctx.strokeStyle = '#9f1239'; ctx.lineWidth = 2.2; ctx.beginPath(); ctx.arc(0, -84, 7, Math.PI * 0.15, Math.PI * 0.85); ctx.stroke(); }
    // hat: wide brim, tall crown, band and a feather
    ctx.fillStyle = A.shade(cape, -0.1); ctx.strokeStyle = OUT; ctx.lineWidth = 2.5;
    A.ellipse(ctx, 0, -114, 36, 9); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-22, -114); ctx.quadraticCurveTo(-24, -146, -6, -148); ctx.lineTo(14, -150); ctx.quadraticCurveTo(26, -140, 22, -114); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = band; ctx.beginPath(); ctx.moveTo(-23, -118); ctx.lineTo(23, -118); ctx.lineTo(23, -126); ctx.lineTo(-23, -126); ctx.closePath(); ctx.fill();
    ctx.save(); ctx.translate(16, -128); ctx.rotate(-0.5 + Math.sin(t * 2) * 0.06); ctx.fillStyle = '#f87171'; ctx.strokeStyle = 'rgba(120,20,20,.5)'; ctx.lineWidth = 1.5; A.ellipse(ctx, 0, -14, 6, 16); ctx.fill(); ctx.stroke(); ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, -28); ctx.stroke(); ctx.restore();
    ctx.restore();
  };
  // The quiz scaffold draws the hero through cfg.drawHero; every Castle Quest room passes this.
  FL.drawExplorer = (ctx, g, t, sc) => A.explorer(ctx, 120, g.H - 40, g.look, { t, facing: 1, wave: sc.locked }, 0.95);
  // First run: the castle mouse is the starting companion instead of the engine's default bunny.
  const d = FL.Save.data;
  if (d.firstRun) { d.firstRun = false; d.companion = FL.Data.FRIENDS[0][0]; d.unlocked = [d.companion]; FL.Save.save(); }
})();
