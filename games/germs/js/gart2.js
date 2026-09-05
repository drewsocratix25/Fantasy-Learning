// Higher-quality props for Germ Patrol: hands, houses, mouth. Outlines are stroked first, then
// filled on top, so overlapping parts read as one silhouette.
(function () {
  const A = FL.Art;
  function outlineThenFill(ctx, shapes, fillStyle, strokeStyle, lw) {
    ctx.save(); ctx.lineJoin = 'round'; ctx.lineCap = 'round'; ctx.strokeStyle = strokeStyle; ctx.lineWidth = lw;
    shapes.forEach((sh) => { sh(); ctx.stroke(); });
    ctx.fillStyle = fillStyle; shapes.forEach((sh) => { sh(); ctx.fill(); });
    ctx.restore();
  }
  // A hand, palm facing the viewer, wrist at (x, y). side -1 = left hand (thumb points right), +1 = right hand.
  // Local coordinates: wrist at (0,0), fingertips near y = -300. Returns nothing; use A.handZone for hit zones.
  A.FINGERS = [[-66, -262, 40], [-22, -318, 44], [24, -336, 46], [68, -312, 44]]; // x, top, width
  const TH = { x: 98, y: -100, rot: 0.72, len: 140, w: 50 }; // thumb: base, rotation (clockwise = outward), length
  A.hand = function (ctx, x, y, side, skin, o) {
    o = o || {}; const s = o.scale || 1; const cuff = o.cuff || '#3b82f6';
    ctx.save(); ctx.translate(x, y); ctx.scale(side === -1 ? s : -s, s);
    ctx.fillStyle = 'rgba(0,0,0,.14)'; ctx.beginPath(); ctx.ellipse(10, 14, 120, 26, 0, 0, Math.PI * 2); ctx.fill();
    const dark = A.shade(skin, -0.42);
    const palm = () => { ctx.beginPath(); ctx.moveTo(-64, 6); ctx.quadraticCurveTo(-96, -60, -90, -150); ctx.quadraticCurveTo(-88, -178, -60, -178); ctx.lineTo(86, -178); ctx.quadraticCurveTo(104, -176, 102, -140); ctx.quadraticCurveTo(100, -60, 72, 6); ctx.closePath(); };
    const fingers = A.FINGERS.map(([fx, top, w]) => () => { A.roundRect(ctx, fx - w / 2, top, w, -168 - top + 40, w / 2); });
    const thumb = () => { ctx.save(); ctx.translate(TH.x, TH.y); ctx.rotate(TH.rot); A.roundRect(ctx, -TH.w / 2, -TH.len, TH.w, TH.len + 30, TH.w / 2); ctx.restore(); };
    const g = ctx.createRadialGradient(0, -110, 20, 0, -120, 230); g.addColorStop(0, A.shade(skin, 0.18)); g.addColorStop(0.7, skin); g.addColorStop(1, A.shade(skin, -0.12));
    outlineThenFill(ctx, [palm, thumb].concat(fingers), g, dark, 7);
    // finger webs shading and knuckle creases
    ctx.strokeStyle = 'rgba(120,53,15,.16)'; ctx.lineWidth = 3;
    A.FINGERS.forEach(([fx, top, w]) => { [0.36, 0.66].forEach((k) => { const yy = top + (-168 - top) * k; ctx.beginPath(); ctx.arc(fx, yy + 4, w * 0.3, Math.PI * 1.15, Math.PI * 1.85); ctx.stroke(); }); });
    ctx.save(); ctx.translate(TH.x, TH.y); ctx.rotate(TH.rot); ctx.beginPath(); ctx.arc(0, -70, 15, Math.PI * 1.15, Math.PI * 1.85); ctx.stroke(); ctx.restore();
    // nails
    A.FINGERS.forEach(([fx, top, w]) => { ctx.fillStyle = A.shade(skin, 0.45); ctx.strokeStyle = 'rgba(120,53,15,.22)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(fx, top + 19, w * 0.3, 13, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke(); ctx.fillStyle = 'rgba(255,255,255,.55)'; ctx.beginPath(); ctx.ellipse(fx - w * 0.1, top + 14, w * 0.12, 4, 0, 0, Math.PI * 2); ctx.fill(); });
    ctx.save(); ctx.translate(TH.x, TH.y); ctx.rotate(TH.rot); ctx.fillStyle = A.shade(skin, 0.45); ctx.strokeStyle = 'rgba(120,53,15,.22)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(0, -TH.len + 22, 15, 13, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke(); ctx.restore();
    // palm lines
    ctx.strokeStyle = 'rgba(120,53,15,.2)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(-70, -60); ctx.quadraticCurveTo(-20, -110, 40, -150); ctx.moveTo(-60, -40); ctx.quadraticCurveTo(10, -80, 70, -110); ctx.moveTo(60, -30); ctx.quadraticCurveTo(80, -70, 90, -100); ctx.stroke();
    // highlight
    const hl = ctx.createRadialGradient(-10, -100, 5, -10, -100, 90); hl.addColorStop(0, 'rgba(255,255,255,.28)'); hl.addColorStop(1, 'rgba(255,255,255,0)'); ctx.fillStyle = hl; ctx.beginPath(); ctx.ellipse(-10, -100, 90, 70, 0, 0, Math.PI * 2); ctx.fill();
    // sleeve cuff
    ctx.fillStyle = cuff; ctx.strokeStyle = A.shade(cuff, -0.4); ctx.lineWidth = 4; A.roundRect(ctx, -76, -14, 152, 44, 14); ctx.fill(); ctx.stroke(); ctx.fillStyle = 'rgba(255,255,255,.25)'; A.roundRect(ctx, -68, -8, 136, 12, 6); ctx.fill();
    ctx.restore();
  };
  // Which wash zone is a point in, given hand wrist (hx,hy), side and scale.
  A.handZone = function (px, py, hx, hy, side, s) {
    const lx = ((px - hx) / s) * (side === -1 ? 1 : -1), ly = (py - hy) / s;
    // thumb (rotated capsule around (96,-112))
    const tx = lx - TH.x, ty = ly - TH.y; const c = Math.cos(TH.rot), sn = Math.sin(TH.rot); const rx = tx * c + ty * sn, ry = -tx * sn + ty * c;
    if (Math.abs(rx) < TH.w * 0.7 && ry > -TH.len - 20 && ry < 30) return 'thumb';
    if (ly < -262 && ly > -350 && Math.abs(lx) < 100) return 'tips';
    if (ly <= -170 && ly >= -262 && Math.abs(lx) < 100) return 'fingers';
    if (ly > -160 && ly < 10 && Math.abs(lx) < 100) return 'palm';
    return null;
  };
  A.handPoint = function (zone, i, hx, hy, side, s) { // representative points for germs
    const m = side === -1 ? 1 : -1; const P = (lx, ly) => ({ x: hx + lx * m * s, y: hy + ly * s });
    switch (zone) {
      case 'palm': return P([-40, 20, -10, 45, -55][i % 5], [-70, -95, -130, -50, -120][i % 5]);
      case 'fingers': return P(A.FINGERS[i % 4][0], -206 - (i % 2) * 30);
      case 'tips': return P(A.FINGERS[(i + 1) % 4][0], A.FINGERS[(i + 1) % 4][1] + 46);
      default: { const d = [40, 78, 112][i % 3]; return P(TH.x + Math.sin(TH.rot) * d, TH.y - Math.cos(TH.rot) * d); }
    }
  };

  // ---------- houses ----------
  // Anchored at bottom-centre. o: {w, h, wall, roof, trim, door, sign, style: 'house'|'bath'|'cafe'|'lab'|'tooth', t}
  A.house = function (ctx, x, y, o) {
    o = o || {}; const w = o.w || 200, h = o.h || 140; const wall = o.wall || '#fef3c7', roof = o.roof || '#ef4444', trim = o.trim || '#fff', door = o.door || '#92400e'; const t = o.t || 0;
    const OUT = 'rgba(40,40,60,.5)';
    ctx.save(); ctx.translate(x, y); ctx.lineJoin = 'round';
    ctx.fillStyle = 'rgba(0,0,0,.16)'; ctx.beginPath(); ctx.ellipse(0, 4, w * 0.62, 16, 0, 0, Math.PI * 2); ctx.fill();
    // wall
    const wg = ctx.createLinearGradient(0, -h, 0, 0); wg.addColorStop(0, A.shade(wall, 0.12)); wg.addColorStop(1, A.shade(wall, -0.08));
    ctx.fillStyle = wg; ctx.strokeStyle = OUT; ctx.lineWidth = 3; A.roundRect(ctx, -w / 2, -h, w, h, 6); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = 'rgba(0,0,0,.06)'; ctx.lineWidth = 2; for (let yy = -h + 14; yy < -6; yy += 13) { ctx.beginPath(); ctx.moveTo(-w / 2 + 4, yy); ctx.lineTo(w / 2 - 4, yy); ctx.stroke(); }
    ctx.fillStyle = trim; ctx.fillRect(-w / 2, -h, 7, h); ctx.fillRect(w / 2 - 7, -h, 7, h);
    // windows
    const win = (wx, wy, ww, wh) => { ctx.fillStyle = trim; ctx.strokeStyle = OUT; ctx.lineWidth = 2.5; A.roundRect(ctx, wx - ww / 2 - 5, wy - wh / 2 - 5, ww + 10, wh + 10, 5); ctx.fill(); ctx.stroke();
      const gg = ctx.createLinearGradient(wx - ww / 2, wy - wh / 2, wx + ww / 2, wy + wh / 2); gg.addColorStop(0, '#e0f2fe'); gg.addColorStop(0.5, '#7dd3fc'); gg.addColorStop(1, '#bae6fd'); ctx.fillStyle = gg; ctx.fillRect(wx - ww / 2, wy - wh / 2, ww, wh);
      ctx.fillStyle = 'rgba(255,255,255,.55)'; ctx.beginPath(); ctx.moveTo(wx - ww / 2, wy + wh / 2); ctx.lineTo(wx - ww / 2, wy - wh / 2 + wh * 0.4); ctx.lineTo(wx - ww / 2 + ww * 0.45, wy - wh / 2); ctx.lineTo(wx - ww / 2 + ww * 0.75, wy - wh / 2); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = trim; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(wx, wy - wh / 2); ctx.lineTo(wx, wy + wh / 2); ctx.moveTo(wx - ww / 2, wy); ctx.lineTo(wx + ww / 2, wy); ctx.stroke();
      ctx.fillStyle = o.curtain || '#f472b6'; ctx.beginPath(); ctx.moveTo(wx - ww / 2, wy - wh / 2); ctx.lineTo(wx - ww / 2 + ww * 0.3, wy - wh / 2); ctx.lineTo(wx - ww / 2, wy + wh * 0.1); ctx.closePath(); ctx.fill(); ctx.beginPath(); ctx.moveTo(wx + ww / 2, wy - wh / 2); ctx.lineTo(wx + ww / 2 - ww * 0.3, wy - wh / 2); ctx.lineTo(wx + ww / 2, wy + wh * 0.1); ctx.closePath(); ctx.fill();
      ctx.fillStyle = A.shade(trim, -0.15); ctx.fillRect(wx - ww / 2 - 9, wy + wh / 2 + 5, ww + 18, 6);
      ctx.fillStyle = '#92400e'; A.roundRect(ctx, wx - ww / 2 - 4, wy + wh / 2 + 11, ww + 8, 12, 3); ctx.fill(); ['#f472b6', '#facc15', '#fb7185', '#a78bfa'].forEach((c, i) => { ctx.fillStyle = c; A.circle(ctx, wx - ww / 2 + 6 + i * ((ww - 6) / 3), wy + wh / 2 + 8, 5); ctx.fill(); ctx.fillStyle = '#22c55e'; A.circle(ctx, wx - ww / 2 + 10 + i * ((ww - 6) / 3), wy + wh / 2 + 13, 3); ctx.fill(); }); };
    win(-w * 0.3, -h * 0.62, w * 0.2, h * 0.26); win(w * 0.3, -h * 0.62, w * 0.2, h * 0.26);
    // door with arch, step
    ctx.fillStyle = '#d6d3d1'; A.roundRect(ctx, -w * 0.2, -6, w * 0.4, 12, 4); ctx.fill();
    ctx.fillStyle = trim; ctx.strokeStyle = OUT; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(-w * 0.15 - 5, 0); ctx.lineTo(-w * 0.15 - 5, -h * 0.44); ctx.arc(0, -h * 0.44, w * 0.15 + 5, Math.PI, 0); ctx.lineTo(w * 0.15 + 5, 0); ctx.closePath(); ctx.fill(); ctx.stroke();
    const dg = ctx.createLinearGradient(-w * 0.15, 0, w * 0.15, 0); dg.addColorStop(0, A.shade(door, 0.1)); dg.addColorStop(1, A.shade(door, -0.2)); ctx.fillStyle = dg; ctx.beginPath(); ctx.moveTo(-w * 0.15, 0); ctx.lineTo(-w * 0.15, -h * 0.44); ctx.arc(0, -h * 0.44, w * 0.15, Math.PI, 0); ctx.lineTo(w * 0.15, 0); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,.18)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(0, -4); ctx.lineTo(0, -h * 0.44); ctx.stroke(); ctx.fillStyle = '#fde047'; A.circle(ctx, w * 0.06, -h * 0.22, 4); ctx.fill(); ctx.fillStyle = '#bae6fd'; A.circle(ctx, 0, -h * 0.44 - 2, w * 0.07); ctx.fill(); ctx.strokeStyle = trim; ctx.lineWidth = 2; ctx.stroke();
    // roof
    const ov = 16; const peak = -h - w * 0.4; const rg = ctx.createLinearGradient(0, peak, 0, -h); rg.addColorStop(0, A.shade(roof, 0.2)); rg.addColorStop(1, A.shade(roof, -0.1));
    if (o.style === 'lab') { ctx.fillStyle = rg; ctx.strokeStyle = OUT; ctx.lineWidth = 3; A.roundRect(ctx, -w / 2 - ov, -h - 26, w + ov * 2, 30, 6); ctx.fill(); ctx.stroke(); const dgd = ctx.createRadialGradient(-w * 0.1, -h - 70, 10, 0, -h - 40, w * 0.3); dgd.addColorStop(0, '#f8fafc'); dgd.addColorStop(1, '#94a3b8'); ctx.fillStyle = dgd; ctx.beginPath(); ctx.arc(0, -h - 26, w * 0.28, Math.PI, 0); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.fillStyle = '#1e293b'; ctx.fillRect(-w * 0.03, -h - 26 - w * 0.28 - 2, w * 0.06, -30); ctx.fillRect(-3, -h - 26 - w * 0.28 - 32, 6, -26); ctx.fillStyle = '#f87171'; A.circle(ctx, 0, -h - 26 - w * 0.28 - 60, 6 + Math.sin(t * 5) * 2); ctx.fill(); }
    else { ctx.fillStyle = rg; ctx.strokeStyle = OUT; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(-w / 2 - ov, -h + 8); ctx.lineTo(0, peak); ctx.lineTo(w / 2 + ov, -h + 8); ctx.lineTo(w / 2 + ov, -h + 18); ctx.lineTo(-w / 2 - ov, -h + 18); ctx.closePath(); ctx.fill(); ctx.stroke();
      // shingles
      ctx.save(); ctx.beginPath(); ctx.moveTo(-w / 2 - ov, -h + 8); ctx.lineTo(0, peak); ctx.lineTo(w / 2 + ov, -h + 8); ctx.closePath(); ctx.clip(); ctx.strokeStyle = A.shade(roof, -0.28); ctx.lineWidth = 2; const rows = 6; for (let r = 1; r <= rows; r++) { const yy = peak + (r / rows) * (-h + 8 - peak); const half = (r / rows) * (w / 2 + ov); ctx.beginPath(); for (let sx = -half; sx < half; sx += 18) { ctx.arc(sx + 9, yy, 9, Math.PI, 0, true); } ctx.stroke(); } ctx.restore();
      ctx.fillStyle = 'rgba(255,255,255,.35)'; ctx.beginPath(); ctx.moveTo(-w / 2 - ov + 6, -h + 8); ctx.lineTo(0, peak + 6); ctx.lineTo(-w * 0.1, -h + 8); ctx.closePath(); ctx.fill();
      // chimney + smoke (bubbles for the bath house)
      const cx = w * 0.3; ctx.fillStyle = '#9a3412'; ctx.strokeStyle = OUT; ctx.lineWidth = 2.5; ctx.fillRect(cx - 14, -h - w * 0.22, 28, w * 0.14); ctx.strokeRect(cx - 14, -h - w * 0.22, 28, w * 0.14); ctx.fillStyle = '#7c2d12'; ctx.fillRect(cx - 18, -h - w * 0.24, 36, 10);
      for (let i = 0; i < 3; i++) { const k = ((t * 0.5 + i / 3) % 1); const py = -h - w * 0.24 - k * 60; if (o.style === 'bath') A.bubble(ctx, cx + Math.sin(k * 6) * 10, py, 6 + k * 10, 1 - k); else { ctx.fillStyle = `rgba(255,255,255,${0.7 * (1 - k)})`; A.circle(ctx, cx + Math.sin(k * 6) * 10, py, 6 + k * 12); ctx.fill(); } }
      ctx.fillStyle = 'rgba(0,0,0,.12)'; ctx.fillRect(-w / 2, -h + 18, w, 8); }
    // awning for cafe
    if (o.style === 'cafe') { const ay = -h * 0.9; ctx.fillStyle = '#ef4444'; ctx.strokeStyle = OUT; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-w / 2 - 10, ay); ctx.lineTo(w / 2 + 10, ay); ctx.lineTo(w / 2 + 16, ay + 26); ctx.lineTo(-w / 2 - 16, ay + 26); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.fillStyle = '#fff'; for (let sx = -w / 2 - 10; sx < w / 2; sx += 40) { ctx.beginPath(); ctx.moveTo(sx, ay); ctx.lineTo(sx + 20, ay); ctx.lineTo(sx + 23, ay + 26); ctx.lineTo(sx - 3, ay + 26); ctx.closePath(); ctx.fill(); } for (let sx = -w / 2 - 16; sx < w / 2 + 16; sx += 20) { ctx.fillStyle = (sx / 20) % 2 ? '#ef4444' : '#fff'; ctx.beginPath(); ctx.arc(sx + 10, ay + 26, 10, 0, Math.PI); ctx.fill(); } }
    // sign board under the peak
    if (o.sign) { const sy = o.style === 'lab' ? -h - 8 : -h - w * 0.13; ctx.fillStyle = '#fff'; ctx.strokeStyle = '#a16207'; ctx.lineWidth = 4; A.roundRect(ctx, -w * 0.17, sy - w * 0.14, w * 0.34, w * 0.26, 12); ctx.fill(); ctx.stroke(); A.emoji(ctx, o.sign, 0, sy - w * 0.01, w * 0.2); }
    // bushes at the base
    ctx.fillStyle = '#22c55e'; ctx.strokeStyle = 'rgba(20,83,45,.5)'; ctx.lineWidth = 2; [[-w / 2 + 6, 22], [w / 2 - 6, 22]].forEach(([bx, br]) => { ctx.beginPath(); A.circle(ctx, bx, -10, br); ctx.fill(); ctx.stroke(); A.circle(ctx, bx + (bx < 0 ? 22 : -22), -6, br * 0.7); ctx.fill(); ctx.stroke(); }); ctx.fillStyle = '#4ade80'; [[-w / 2 + 2, 12], [w / 2 - 2, 12]].forEach(([bx, br]) => { A.circle(ctx, bx, -20, br); ctx.fill(); });
    ctx.restore();
  };
  // A friendly mouth for Toothbrush Time. Returns tooth rects via callback.
  A.mouth = function (ctx, cx, cy, W, H, t) {
    ctx.save(); ctx.translate(cx, cy);
    // lips
    const lip = ctx.createLinearGradient(0, -H, 0, H); lip.addColorStop(0, '#fb7185'); lip.addColorStop(1, '#e11d48');
    ctx.fillStyle = lip; ctx.strokeStyle = 'rgba(120,20,40,.5)'; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(-W, 0); ctx.bezierCurveTo(-W * 0.8, -H * 0.9, -W * 0.25, -H * 1.05, 0, -H * 0.85); ctx.bezierCurveTo(W * 0.25, -H * 1.05, W * 0.8, -H * 0.9, W, 0); ctx.bezierCurveTo(W * 0.8, H * 1.1, -W * 0.8, H * 1.1, -W, 0); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,.35)'; ctx.beginPath(); ctx.ellipse(-W * 0.35, -H * 0.72, W * 0.22, H * 0.08, 0.1, 0, Math.PI * 2); ctx.fill();
    // inside
    ctx.fillStyle = '#7f1d1d'; ctx.beginPath(); ctx.moveTo(-W * 0.86, 0); ctx.bezierCurveTo(-W * 0.6, -H * 0.72, W * 0.6, -H * 0.72, W * 0.86, 0); ctx.bezierCurveTo(W * 0.6, H * 0.85, -W * 0.6, H * 0.85, -W * 0.86, 0); ctx.closePath(); ctx.fill();
    // tongue
    const tg = ctx.createRadialGradient(0, H * 0.35, 10, 0, H * 0.35, W * 0.45); tg.addColorStop(0, '#fb7185'); tg.addColorStop(1, '#e11d48'); ctx.fillStyle = tg; ctx.beginPath(); ctx.ellipse(0, H * 0.42, W * 0.42, H * 0.34, 0, 0, Math.PI * 2); ctx.fill(); ctx.strokeStyle = 'rgba(120,20,40,.35)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(0, H * 0.2); ctx.lineTo(0, H * 0.6); ctx.stroke(); ctx.fillStyle = 'rgba(255,255,255,.3)'; ctx.beginPath(); ctx.ellipse(-W * 0.12, H * 0.28, W * 0.1, H * 0.05, 0, 0, Math.PI * 2); ctx.fill();
    // gums
    ctx.fillStyle = '#fda4af'; ctx.beginPath(); ctx.moveTo(-W * 0.86, 0); ctx.bezierCurveTo(-W * 0.6, -H * 0.72, W * 0.6, -H * 0.72, W * 0.86, 0); ctx.bezierCurveTo(W * 0.6, -H * 0.3, -W * 0.6, -H * 0.3, -W * 0.86, 0); ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.moveTo(-W * 0.86, 0); ctx.bezierCurveTo(-W * 0.6, H * 0.85, W * 0.6, H * 0.85, W * 0.86, 0); ctx.bezierCurveTo(W * 0.6, H * 0.35, -W * 0.6, H * 0.35, -W * 0.86, 0); ctx.closePath(); ctx.fill();
    ctx.restore();
  };
  A.tooth2 = function (ctx, x, y, w, h, up, o) { // up = crown points up (bottom row)
    o = o || {}; ctx.save(); ctx.translate(x, y); if (!up) ctx.scale(1, -1);
    const g = ctx.createLinearGradient(-w / 2, 0, w / 2, 0); g.addColorStop(0, o.dirty ? '#fde68a' : '#f8fafc'); g.addColorStop(0.5, '#fff'); g.addColorStop(1, o.dirty ? '#fcd34d' : '#e2e8f0');
    ctx.fillStyle = g; ctx.strokeStyle = 'rgba(100,116,139,.6)'; ctx.lineWidth = 3; ctx.lineJoin = 'round';
    ctx.beginPath(); ctx.moveTo(-w / 2, h / 2); ctx.lineTo(-w / 2, -h * 0.25); ctx.quadraticCurveTo(-w / 2, -h / 2, -w * 0.28, -h / 2); ctx.quadraticCurveTo(0, -h * 0.34, w * 0.28, -h / 2); ctx.quadraticCurveTo(w / 2, -h / 2, w / 2, -h * 0.25); ctx.lineTo(w / 2, h / 2); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,.7)'; ctx.beginPath(); ctx.ellipse(-w * 0.22, -h * 0.15, w * 0.1, h * 0.22, 0, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  };
})();

(function () {
  const A = FL.Art;
  A.slide = function (ctx, x, y, t) { // a playground slide, anchored at the bottom of the ladder
    ctx.save(); ctx.translate(x, y); ctx.lineJoin = 'round'; ctx.lineCap = 'round'; const OUT = 'rgba(40,40,60,.5)';
    ctx.strokeStyle = '#64748b'; ctx.lineWidth = 8; ctx.beginPath(); ctx.moveTo(-40, 0); ctx.lineTo(-40, -120); ctx.moveTo(-14, 0); ctx.lineTo(-14, -120); ctx.stroke(); ctx.lineWidth = 5; for (let i = 1; i < 6; i++) { ctx.beginPath(); ctx.moveTo(-40, -i * 20); ctx.lineTo(-14, -i * 20); ctx.stroke(); }
    const sg = ctx.createLinearGradient(0, -130, 120, 0); sg.addColorStop(0, '#fde047'); sg.addColorStop(1, '#f59e0b'); ctx.fillStyle = sg; ctx.strokeStyle = OUT; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(-20, -130); ctx.lineTo(20, -130); ctx.quadraticCurveTo(70, -110, 130, -10); ctx.quadraticCurveTo(140, 0, 128, 4); ctx.lineTo(96, 4); ctx.quadraticCurveTo(60, -80, 12, -104); ctx.lineTo(-20, -104); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = 'rgba(255,255,255,.6)'; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(10, -118); ctx.quadraticCurveTo(60, -100, 118, -8); ctx.stroke();
    ctx.strokeStyle = '#ef4444'; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(-24, -134); ctx.lineTo(-24, -170); ctx.lineTo(24, -170); ctx.lineTo(24, -134); ctx.stroke(); ctx.fillStyle = '#ef4444'; A.roundRect(ctx, -30, -176, 60, 12, 6); ctx.fill();
    ctx.restore();
  };
  A.bodyBase = function (ctx, x, y, t) { // a friendly cartoon body with a door in its tummy
    ctx.save(); ctx.translate(x, y); ctx.scale(0.72, 0.72); const OUT = 'rgba(120,20,60,.5)';
    ctx.fillStyle = 'rgba(0,0,0,.14)'; ctx.beginPath(); ctx.ellipse(0, 4, 110, 16, 0, 0, Math.PI * 2); ctx.fill();
    const bg = ctx.createLinearGradient(-90, 0, 90, 0); bg.addColorStop(0, '#f9a8d4'); bg.addColorStop(0.5, '#fbcfe8'); bg.addColorStop(1, '#f472b6');
    ctx.fillStyle = bg; ctx.strokeStyle = OUT; ctx.lineWidth = 4; A.roundRect(ctx, -80, -150, 160, 154, 50); ctx.fill(); ctx.stroke(); // body
    ctx.strokeStyle = OUT; ctx.lineWidth = 16; ctx.lineCap = 'round'; ctx.strokeStyle = '#f472b6'; ctx.beginPath(); ctx.moveTo(-78, -110); ctx.quadraticCurveTo(-120, -80 + Math.sin(t * 2) * 6, -110, -40); ctx.moveTo(78, -110); ctx.quadraticCurveTo(120, -80 + Math.cos(t * 2) * 6, 110, -40); ctx.stroke(); // arms
    ctx.fillStyle = bg; ctx.strokeStyle = OUT; ctx.lineWidth = 4; A.circle(ctx, 0, -190, 58); ctx.fill(); ctx.stroke(); // head
    ctx.fillStyle = '#1e293b'; A.circle(ctx, -20, -196, 6); ctx.fill(); A.circle(ctx, 20, -196, 6); ctx.fill(); ctx.fillStyle = '#fff'; A.circle(ctx, -18, -198, 2); ctx.fill(); A.circle(ctx, 22, -198, 2); ctx.fill();
    ctx.strokeStyle = '#9f1239'; ctx.lineWidth = 3.5; ctx.beginPath(); ctx.arc(0, -180, 18, 0.15 * Math.PI, 0.85 * Math.PI); ctx.stroke(); ctx.fillStyle = 'rgba(244,114,182,.5)'; A.circle(ctx, -36, -178, 8); ctx.fill(); A.circle(ctx, 36, -178, 8); ctx.fill();
    // heart + door
    ctx.fillStyle = '#ef4444'; ctx.strokeStyle = '#9f1239'; ctx.lineWidth = 2.5; A.heartPath(ctx, -38, -112, 14 + Math.sin(t * 6) * 1.5); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#fff'; ctx.strokeStyle = OUT; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(-30, -4); ctx.lineTo(-30, -70); ctx.arc(0, -70, 30, Math.PI, 0); ctx.lineTo(30, -4); ctx.closePath(); ctx.fill(); ctx.stroke();
    const dg = ctx.createLinearGradient(-26, 0, 26, 0); dg.addColorStop(0, '#a855f7'); dg.addColorStop(1, '#7c3aed'); ctx.fillStyle = dg; ctx.beginPath(); ctx.moveTo(-25, -4); ctx.lineTo(-25, -70); ctx.arc(0, -70, 25, Math.PI, 0); ctx.lineTo(25, -4); ctx.closePath(); ctx.fill(); ctx.fillStyle = '#fde047'; A.circle(ctx, 14, -36, 4); ctx.fill();
    A.emoji(ctx, '🛡️', 44, -110, 36);
    ctx.restore();
  };
})();
