// Cartoon drawing helpers. Everything is drawn procedurally on canvas (plus emoji for props).
(function () {
  const Art = {};
  const FONT = 'Fredoka, "Arial Rounded MT Bold", "Helvetica Rounded", "Comic Sans MS", system-ui, sans-serif';
  const EMOJI_FONT = '"Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", "Twemoji Mozilla", sans-serif';
  Art.FONT = FONT;
  Art.font = (size, weight) => `${weight || 700} ${size}px ${FONT}`;

  Art.PRINCESSES = [
    { name: 'Rosie', dress: '#f472b6', dressDark: '#db2777', hair: '#7c2d12', skin: '#fde0c8', crown: '#fbbf24' },
    { name: 'Violet', dress: '#a78bfa', dressDark: '#7c3aed', hair: '#1f1235', skin: '#8d5524', crown: '#fbbf24' },
    { name: 'Sunny', dress: '#fde047', dressDark: '#f59e0b', hair: '#f59e0b', skin: '#f1c27d', crown: '#f472b6' },
    { name: 'Coral', dress: '#5eead4', dressDark: '#0d9488', hair: '#3b1f0e', skin: '#c68642', crown: '#fbbf24' },
  ];
  Art.DRESS_COLORS = [['#f472b6', '#db2777'], ['#a78bfa', '#7c3aed'], ['#fde047', '#f59e0b'], ['#5eead4', '#0d9488'], ['#60a5fa', '#2563eb'], ['#fb7185', '#e11d48'], ['#86efac', '#16a34a'], ['#fdba74', '#ea580c']];

  // ---------- primitives ----------
  Art.roundRect = function (ctx, x, y, w, h, r) {
    r = Math.min(r, w / 2, h / 2);
    ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
  };
  Art.circle = function (ctx, x, y, r) { ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.closePath(); };
  Art.ellipse = function (ctx, x, y, rx, ry) { ctx.beginPath(); ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2); ctx.closePath(); };
  Art.starPath = function (ctx, x, y, r, inner, points) {
    points = points || 5; inner = inner == null ? r * 0.48 : inner;
    ctx.beginPath();
    for (let i = 0; i < points * 2; i++) { const a = -Math.PI / 2 + (i * Math.PI) / points; const rr = i % 2 ? inner : r; ctx.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); }
    ctx.closePath();
  };
  Art.heartPath = function (ctx, x, y, s) {
    ctx.beginPath(); ctx.moveTo(x, y + s * 0.35);
    ctx.bezierCurveTo(x - s * 1.1, y - s * 0.45, x - s * 0.45, y - s * 1.1, x, y - s * 0.4);
    ctx.bezierCurveTo(x + s * 0.45, y - s * 1.1, x + s * 1.1, y - s * 0.45, x, y + s * 0.35); ctx.closePath();
  };
  Art.shapePath = function (ctx, shape, x, y, s) {
    switch (shape) {
      case 'circle': Art.circle(ctx, x, y, s); break;
      case 'square': Art.roundRect(ctx, x - s * 0.9, y - s * 0.9, s * 1.8, s * 1.8, s * 0.18); break;
      case 'rectangle': Art.roundRect(ctx, x - s * 1.15, y - s * 0.7, s * 2.3, s * 1.4, s * 0.16); break;
      case 'triangle': ctx.beginPath(); ctx.moveTo(x, y - s); ctx.lineTo(x + s * 1.05, y + s * 0.8); ctx.lineTo(x - s * 1.05, y + s * 0.8); ctx.closePath(); break;
      case 'star': Art.starPath(ctx, x, y, s * 1.1, s * 0.5, 5); break;
      case 'heart': Art.heartPath(ctx, x, y + s * 0.15, s); break;
      case 'oval': Art.ellipse(ctx, x, y, s * 1.2, s * 0.8); break;
      case 'diamond': ctx.beginPath(); ctx.moveTo(x, y - s * 1.1); ctx.lineTo(x + s * 0.8, y); ctx.lineTo(x, y + s * 1.1); ctx.lineTo(x - s * 0.8, y); ctx.closePath(); break;
      case 'hexagon': ctx.beginPath(); for (let i = 0; i < 6; i++) { const a = Math.PI / 6 + (i * Math.PI) / 3; ctx.lineTo(x + Math.cos(a) * s, y + Math.sin(a) * s); } ctx.closePath(); break;
      default: Art.circle(ctx, x, y, s);
    }
  };
  Art.shade = function (hex, amt) { // amt -1..1
    const n = parseInt(hex.slice(1), 16); let r = n >> 16, g = (n >> 8) & 255, b = n & 255;
    const f = (c) => Math.max(0, Math.min(255, Math.round(amt > 0 ? c + (255 - c) * amt : c * (1 + amt))));
    return '#' + [f(r), f(g), f(b)].map((c) => c.toString(16).padStart(2, '0')).join('');
  };

  // ---------- text ----------
  Art.text = function (ctx, str, x, y, o) {
    o = o || {};
    ctx.save();
    ctx.font = Art.font(o.size || 32, o.weight || 700);
    ctx.textAlign = o.align || 'center'; ctx.textBaseline = o.baseline || 'middle';
    if (o.shadow) { ctx.shadowColor = 'rgba(0,0,0,.3)'; ctx.shadowBlur = 0; ctx.shadowOffsetY = o.shadow; }
    if (o.stroke) { ctx.lineJoin = 'round'; ctx.lineWidth = o.strokeWidth || Math.max(3, (o.size || 32) * 0.16); ctx.strokeStyle = o.stroke; ctx.strokeText(str, x, y); }
    ctx.fillStyle = o.color || '#fff'; ctx.fillText(str, x, y);
    ctx.restore();
  };
  Art.fitSize = function (ctx, str, maxW, maxSize, weight) { let s = maxSize; while (s > 12 && Art.measure(ctx, str, s, weight) > maxW) s -= 2; return s; };
  Art.measure = function (ctx, str, size, weight) { ctx.save(); ctx.font = Art.font(size, weight); const w = ctx.measureText(str).width; ctx.restore(); return w; };
  Art.emoji = function (ctx, e, x, y, size, o) {
    o = o || {};
    ctx.save();
    ctx.translate(x, y);
    if (o.rot) ctx.rotate(o.rot);
    if (o.flip) ctx.scale(-1, 1);
    if (o.scale) ctx.scale(o.scale, o.scale);
    if (o.alpha != null) ctx.globalAlpha = o.alpha;
    ctx.font = `${size}px ${EMOJI_FONT}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = '#000';
    if (o.shadow) { ctx.shadowColor = 'rgba(0,0,0,.25)'; ctx.shadowBlur = 8; ctx.shadowOffsetY = 4; }
    ctx.fillText(e, 0, size * 0.06);
    ctx.restore();
  };

  // ---------- backgrounds ----------
  Art.sky = function (ctx, W, H, top, bottom) {
    const g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, top || '#7dd3fc'); g.addColorStop(1, bottom || '#e0f2fe');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  };
  Art.sun = function (ctx, x, y, r, t) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(t * 0.15);
    ctx.fillStyle = 'rgba(253, 224, 71, .35)';
    for (let i = 0; i < 12; i++) { ctx.rotate(Math.PI / 6); ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(r * 1.9, -r * 0.25); ctx.lineTo(r * 1.9, r * 0.25); ctx.closePath(); ctx.fill(); }
    ctx.restore();
    const g = ctx.createRadialGradient(x, y, r * 0.2, x, y, r); g.addColorStop(0, '#fef08a'); g.addColorStop(1, '#fbbf24');
    ctx.fillStyle = g; Art.circle(ctx, x, y, r); ctx.fill();
    // happy face
    ctx.fillStyle = '#b45309'; Art.circle(ctx, x - r * 0.3, y - r * 0.15, r * 0.08); ctx.fill(); Art.circle(ctx, x + r * 0.3, y - r * 0.15, r * 0.08); ctx.fill();
    ctx.strokeStyle = '#b45309'; ctx.lineWidth = r * 0.08; ctx.lineCap = 'round'; ctx.beginPath(); ctx.arc(x, y + r * 0.1, r * 0.35, 0.2 * Math.PI, 0.8 * Math.PI); ctx.stroke();
    ctx.fillStyle = 'rgba(251,113,133,.45)'; Art.circle(ctx, x - r * 0.5, y + r * 0.15, r * 0.12); ctx.fill(); Art.circle(ctx, x + r * 0.5, y + r * 0.15, r * 0.12); ctx.fill();
  };
  Art.cloud = function (ctx, x, y, s, alpha) {
    ctx.save(); ctx.globalAlpha = alpha == null ? 1 : alpha; ctx.fillStyle = '#fff';
    const blobs = [[0, 0, 1], [-1.1, 0.25, 0.7], [1.1, 0.2, 0.75], [-0.5, -0.45, 0.75], [0.55, -0.5, 0.7], [2, 0.4, 0.5]];
    ctx.beginPath(); blobs.forEach(([bx, by, br]) => { ctx.moveTo(x + bx * s + br * s, y + by * s); ctx.arc(x + bx * s, y + by * s, br * s, 0, Math.PI * 2); });
    ctx.fill(); ctx.restore();
  };
  Art.hills = function (ctx, W, H, y, color, seed) {
    ctx.fillStyle = color; ctx.beginPath(); ctx.moveTo(0, H);
    ctx.lineTo(0, y);
    const n = 6; for (let i = 0; i <= n; i++) { const px = (i / n) * W; const py = y + Math.sin(i * 1.7 + seed) * 30; const cx = px - W / n / 2; ctx.quadraticCurveTo(cx, py - 60, px, py); }
    ctx.lineTo(W, H); ctx.closePath(); ctx.fill();
  };
  Art.grass = function (ctx, W, H, y, top, bottom) {
    const g = ctx.createLinearGradient(0, y, 0, H); g.addColorStop(0, top || '#86efac'); g.addColorStop(1, bottom || '#4ade80');
    ctx.fillStyle = g; ctx.fillRect(0, y, W, H - y);
  };
  Art.rainbow = function (ctx, x, y, r, width, alpha) {
    const colors = ['#ef4444', '#f97316', '#facc15', '#22c55e', '#3b82f6', '#6366f1', '#a855f7'];
    ctx.save(); ctx.globalAlpha = alpha == null ? 0.85 : alpha; ctx.lineWidth = width; ctx.lineCap = 'butt';
    colors.forEach((c, i) => { ctx.strokeStyle = c; ctx.beginPath(); ctx.arc(x, y, r - i * width, Math.PI, 0); ctx.stroke(); });
    ctx.restore();
  };

  // ---------- props ----------
  Art.tree = function (ctx, x, y, s, variant, t) {
    variant = variant || 0; t = t || 0;
    const sway = Math.sin(t * 1.2 + x * 0.01) * 0.02;
    ctx.save(); ctx.translate(x, y);
    ctx.fillStyle = 'rgba(0,0,0,.15)'; Art.ellipse(ctx, 0, 0, 34 * s, 12 * s); ctx.fill();
    ctx.fillStyle = '#92400e'; Art.roundRect(ctx, -9 * s, -55 * s, 18 * s, 58 * s, 6 * s); ctx.fill();
    ctx.rotate(sway);
    const greens = [['#4ade80', '#22c55e'], ['#86efac', '#4ade80'], ['#34d399', '#059669']][variant % 3];
    const blobs = [[0, -95, 42], [-32, -72, 32], [32, -72, 32], [-12, -118, 26], [16, -115, 24]];
    ctx.strokeStyle = 'rgba(20,83,45,.5)'; ctx.lineWidth = 3;
    ctx.fillStyle = greens[1]; ctx.beginPath(); blobs.forEach(([bx, by, br]) => { ctx.moveTo(bx * s + br * s, by * s); ctx.arc(bx * s, by * s, br * s, 0, Math.PI * 2); }); ctx.fill(); ctx.stroke();
    ctx.fillStyle = greens[0]; ctx.beginPath(); blobs.slice(0, 3).forEach(([bx, by, br]) => { ctx.moveTo(bx * s - 6 * s + br * 0.7 * s, by * s - 8 * s); ctx.arc(bx * s - 6 * s, by * s - 8 * s, br * 0.7 * s, 0, Math.PI * 2); }); ctx.fill();
    if (variant === 2) { ctx.fillStyle = '#f472b6'; [[-20, -80], [14, -100], [30, -64], [-4, -120]].forEach(([fx, fy]) => { Art.circle(ctx, fx * s, fy * s, 5 * s); ctx.fill(); }); }
    if (variant === 1) { ctx.fillStyle = '#ef4444'; [[-22, -70], [18, -95], [26, -60]].forEach(([fx, fy]) => { Art.circle(ctx, fx * s, fy * s, 5 * s); ctx.fill(); }); }
    ctx.restore();
  };
  Art.bush = function (ctx, x, y, s) {
    ctx.save(); ctx.translate(x, y); ctx.fillStyle = 'rgba(0,0,0,.12)'; Art.ellipse(ctx, 0, 2, 40 * s, 10 * s); ctx.fill();
    ctx.fillStyle = '#22c55e'; ctx.strokeStyle = 'rgba(20,83,45,.45)'; ctx.lineWidth = 3;
    ctx.beginPath(); [[0, -22, 26], [-28, -14, 20], [28, -14, 20]].forEach(([bx, by, br]) => { ctx.moveTo(bx * s + br * s, by * s); ctx.arc(bx * s, by * s, br * s, 0, Math.PI * 2); }); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#4ade80'; Art.circle(ctx, -6 * s, -30 * s, 14 * s); ctx.fill();
    ctx.restore();
  };
  Art.flower = function (ctx, x, y, s, color, t, seed) {
    seed = seed || 0; const sway = Math.sin((t || 0) * 2 + seed) * 0.08;
    ctx.save(); ctx.translate(x, y); ctx.rotate(sway);
    ctx.strokeStyle = '#16a34a'; ctx.lineWidth = 4 * s; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(4 * s, -18 * s, 0, -34 * s); ctx.stroke();
    ctx.fillStyle = '#22c55e'; Art.ellipse(ctx, -8 * s, -16 * s, 8 * s, 4 * s); ctx.fill();
    ctx.translate(0, -38 * s);
    ctx.fillStyle = color; ctx.strokeStyle = 'rgba(0,0,0,.18)'; ctx.lineWidth = 2;
    for (let i = 0; i < 6; i++) { const a = (i * Math.PI) / 3; Art.ellipse(ctx, Math.cos(a) * 9 * s, Math.sin(a) * 9 * s, 7 * s, 5 * s); ctx.fill(); }
    ctx.fillStyle = '#fde047'; Art.circle(ctx, 0, 0, 5.5 * s); ctx.fill(); ctx.stroke();
    ctx.restore();
  };
  Art.bigFlower = function (ctx, x, y, r, color, o) { // bloom with a face-sized centre for letters
    o = o || {};
    ctx.save(); ctx.translate(x, y); if (o.rot) ctx.rotate(o.rot);
    ctx.fillStyle = color; ctx.strokeStyle = 'rgba(0,0,0,.2)'; ctx.lineWidth = 3;
    for (let i = 0; i < 8; i++) { const a = (i * Math.PI) / 4; Art.ellipse(ctx, Math.cos(a) * r * 0.62, Math.sin(a) * r * 0.62, r * 0.42, r * 0.3); ctx.save(); ctx.translate(Math.cos(a) * r * 0.62, Math.sin(a) * r * 0.62); ctx.rotate(a); Art.ellipse(ctx, 0, 0, r * 0.45, r * 0.3); ctx.restore(); ctx.fill(); ctx.stroke(); }
    ctx.fillStyle = Art.shade(color, 0.35);
    for (let i = 0; i < 8; i++) { const a = (i * Math.PI) / 4 + Math.PI / 8; ctx.save(); ctx.translate(Math.cos(a) * r * 0.45, Math.sin(a) * r * 0.45); ctx.rotate(a); Art.ellipse(ctx, 0, 0, r * 0.32, r * 0.22); ctx.restore(); ctx.fill(); }
    const g = ctx.createRadialGradient(-r * 0.15, -r * 0.15, r * 0.1, 0, 0, r * 0.5); g.addColorStop(0, '#fef9c3'); g.addColorStop(1, '#fde047');
    ctx.fillStyle = g; Art.circle(ctx, 0, 0, r * 0.5); ctx.fill(); ctx.stroke();
    ctx.restore();
  };
  Art.lilypad = function (ctx, x, y, r, o) {
    o = o || {};
    ctx.save(); ctx.translate(x, y);
    ctx.fillStyle = o.color || '#22c55e'; ctx.strokeStyle = 'rgba(20,83,45,.5)'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.arc(0, 0, r, 0.06 * Math.PI, 1.94 * Math.PI); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,.25)'; Art.ellipse(ctx, -r * 0.3, -r * 0.3, r * 0.35, r * 0.2); ctx.fill();
    ctx.restore();
  };
  Art.sign = function (ctx, x, y, emoji, label, o) {
    o = o || {}; const s = o.scale || 1; const bounce = o.bounce || 0;
    ctx.save(); ctx.translate(x, y);
    ctx.fillStyle = 'rgba(0,0,0,.15)'; Art.ellipse(ctx, 0, 0, 26 * s, 9 * s); ctx.fill();
    ctx.fillStyle = '#a16207'; Art.roundRect(ctx, -7 * s, -78 * s, 14 * s, 80 * s, 5 * s); ctx.fill();
    ctx.translate(0, -bounce);
    ctx.fillStyle = o.color || '#fde68a'; ctx.strokeStyle = '#a16207'; ctx.lineWidth = 5 * s;
    const w = Math.max(150, (label.length * 15 + 60)) * s, h = 74 * s;
    Art.roundRect(ctx, -w / 2, -130 * s, w, h, 16 * s); ctx.fill(); ctx.stroke();
    if (o.glow) { ctx.save(); ctx.globalAlpha = o.glow; ctx.strokeStyle = '#fff'; ctx.lineWidth = 8 * s; Art.roundRect(ctx, -w / 2 - 4 * s, -134 * s, w + 8 * s, h + 8 * s, 20 * s); ctx.stroke(); ctx.restore(); }
    Art.emoji(ctx, emoji, -w / 2 + 38 * s, -93 * s, 40 * s);
    Art.text(ctx, label, 20 * s, -93 * s, { size: 24 * s, color: '#78350f', weight: 700 });
    ctx.restore();
  };
  Art.castle = function (ctx, x, y, s, t) {
    t = t || 0;
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
    ctx.fillStyle = 'rgba(0,0,0,.15)'; Art.ellipse(ctx, 0, 4, 250, 22); ctx.fill();
    const wall = '#fbcfe8', wallDark = '#f9a8d4', roof = '#c026d3', roofLight = '#e879f9', stone = '#f472b6';
    ctx.strokeStyle = 'rgba(112,26,117,.45)'; ctx.lineWidth = 3;
    function tower(tx, ty, tw, th) {
      ctx.fillStyle = wallDark; Art.roundRect(ctx, tx - tw / 2, ty - th, tw, th, 8); ctx.fill(); ctx.stroke();
      ctx.fillStyle = wall; ctx.fillRect(tx - tw / 2 + 6, ty - th + 6, tw * 0.4, th - 12);
      // crenellation ring
      ctx.fillStyle = stone; for (let i = -1; i <= 1; i++) { ctx.fillRect(tx + i * tw * 0.36 - tw * 0.12, ty - th - 12, tw * 0.24, 14); }
      // cone roof
      ctx.fillStyle = roof; ctx.beginPath(); ctx.moveTo(tx - tw * 0.7, ty - th - 8); ctx.lineTo(tx, ty - th - tw * 1.35); ctx.lineTo(tx + tw * 0.7, ty - th - 8); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.fillStyle = roofLight; ctx.beginPath(); ctx.moveTo(tx - tw * 0.7, ty - th - 8); ctx.lineTo(tx, ty - th - tw * 1.35); ctx.lineTo(tx - tw * 0.15, ty - th - 8); ctx.closePath(); ctx.fill();
      // flag
      const fx = tx, fy = ty - th - tw * 1.35; ctx.strokeStyle = '#78350f'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(fx, fy); ctx.lineTo(fx, fy - 34); ctx.stroke();
      const wave = Math.sin(t * 6 + tx) * 4; ctx.fillStyle = '#fde047'; ctx.beginPath(); ctx.moveTo(fx, fy - 34); ctx.quadraticCurveTo(fx + 14, fy - 30 + wave, fx + 28, fy - 26); ctx.lineTo(fx, fy - 16); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = 'rgba(112,26,117,.45)'; ctx.lineWidth = 3;
      // window
      ctx.fillStyle = '#7dd3fc'; Art.roundRect(ctx, tx - 10, ty - th * 0.62, 20, 30, 10); ctx.fill(); ctx.stroke();
    }
    // main wall
    ctx.fillStyle = wallDark; Art.roundRect(ctx, -180, -170, 360, 170, 10); ctx.fill(); ctx.stroke();
    ctx.fillStyle = wall; ctx.fillRect(-172, -162, 344, 154);
    ctx.fillStyle = stone; for (let i = 0; i < 9; i++) ctx.fillRect(-180 + i * 40 + 8, -182, 24, 16);
    tower(-190, 0, 70, 230); tower(190, 0, 70, 230); tower(0, -120, 90, 150);
    // gate
    ctx.fillStyle = '#92400e'; ctx.beginPath(); ctx.moveTo(-48, 0); ctx.lineTo(-48, -70); ctx.arc(0, -70, 48, Math.PI, 0); ctx.lineTo(48, 0); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#b45309'; ctx.fillRect(-2, -110, 4, 108);
    ctx.fillStyle = '#fde047'; Art.heartPath(ctx, 0, -78, 12); ctx.fill();
    // windows on wall
    ctx.fillStyle = '#7dd3fc'; [-120, -75, 75, 120].forEach((wx) => { Art.roundRect(ctx, wx - 12, -130, 24, 36, 12); ctx.fill(); ctx.stroke(); });
    // banners
    ctx.fillStyle = '#a855f7'; [[-150, '#a855f7'], [150, '#3b82f6']].forEach(([bx, c]) => { ctx.fillStyle = c; ctx.beginPath(); ctx.moveTo(bx - 16, -160); ctx.lineTo(bx + 16, -160); ctx.lineTo(bx + 16, -105); ctx.lineTo(bx, -92); ctx.lineTo(bx - 16, -105); ctx.closePath(); ctx.fill(); ctx.stroke(); });
    Art.emoji(ctx, '🎵', -150, -130, 22); Art.emoji(ctx, '🎶', 150, -130, 22);
    // path steps
    ctx.fillStyle = '#e9d5a1'; Art.roundRect(ctx, -70, -4, 140, 22, 8); ctx.fill();
    ctx.restore();
  };
  Art.gazebo = function (ctx, x, y, s, t) {
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
    ctx.fillStyle = 'rgba(0,0,0,.15)'; Art.ellipse(ctx, 0, 4, 120, 20); ctx.fill();
    ctx.strokeStyle = 'rgba(112,26,117,.45)'; ctx.lineWidth = 3;
    ctx.fillStyle = '#e9d5ff'; Art.ellipse(ctx, 0, 0, 110, 28); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#fff'; [-80, -40, 40, 80].forEach((px) => { Art.roundRect(ctx, px - 7, -120, 14, 120, 5); ctx.fill(); ctx.stroke(); });
    ctx.fillStyle = '#a78bfa'; Art.roundRect(ctx, -100, -132, 200, 22, 8); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#c026d3'; ctx.beginPath(); ctx.moveTo(-115, -128); ctx.lineTo(0, -215); ctx.lineTo(115, -128); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#e879f9'; ctx.beginPath(); ctx.moveTo(-115, -128); ctx.lineTo(0, -215); ctx.lineTo(-30, -128); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#fde047'; Art.starPath(ctx, 0, -228, 16, 7, 5); ctx.fill(); ctx.stroke();
    Art.emoji(ctx, '🎹', 0, -60, 54);
    ctx.restore();
  };
  Art.pond = function (ctx, x, y, rx, ry, t) {
    t = t || 0;
    ctx.save(); ctx.translate(x, y);
    ctx.fillStyle = '#a3e635'; Art.ellipse(ctx, 0, 0, rx + 16, ry + 14); ctx.fill();
    const g = ctx.createRadialGradient(-rx * 0.2, -ry * 0.3, 10, 0, 0, rx); g.addColorStop(0, '#bae6fd'); g.addColorStop(1, '#38bdf8');
    ctx.fillStyle = g; Art.ellipse(ctx, 0, 0, rx, ry); ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,.5)'; ctx.lineWidth = 3;
    for (let i = 0; i < 3; i++) { const p = (t * 0.25 + i / 3) % 1; ctx.globalAlpha = 1 - p; Art.ellipse(ctx, rx * 0.2, -ry * 0.1, 20 + p * rx * 0.6, 10 + p * ry * 0.6); ctx.stroke(); }
    ctx.globalAlpha = 1;
    Art.lilypad(ctx, -rx * 0.5, ry * 0.2, 26); Art.lilypad(ctx, rx * 0.45, -ry * 0.35, 22); Art.lilypad(ctx, rx * 0.1, ry * 0.5, 20);
    Art.emoji(ctx, '🐸', -rx * 0.5, ry * 0.2 - 12 + Math.abs(Math.sin(t * 3)) * -6, 34);
    Art.emoji(ctx, '🌸', rx * 0.45, -ry * 0.35 - 10, 26);
    Art.emoji(ctx, '🦆', rx * 0.6 * Math.cos(t * 0.4), ry * 0.5 * Math.sin(t * 0.4), 34, { flip: Math.sin(t * 0.4) > 0 });
    ctx.restore();
  };

  // ---------- the princess ----------
  // Draws with feet at (x,y). anim: {t, walking, facing(1|-1), dance(0..1), sing(bool), wave(bool)}
  Art.princess = function (ctx, x, y, look, anim, scale) {
    anim = anim || {}; scale = scale || 1; const t = anim.t || 0;
    const walking = !!anim.walking; const dance = anim.dance || 0;
    const bob = walking ? Math.abs(Math.sin(t * 11)) * 4 : Math.sin(t * 2.2) * 1.5 + dance * Math.abs(Math.sin(t * 8)) * 8;
    const swing = walking ? Math.sin(t * 11) : 0;
    ctx.save(); ctx.translate(x, y); ctx.scale(scale * (anim.facing || 1), scale);
    ctx.fillStyle = 'rgba(0,0,0,.18)'; Art.ellipse(ctx, 0, 0, 30, 9); ctx.fill();
    ctx.translate(0, -bob);
    ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    const OUT = 'rgba(70,30,70,.55)';
    // feet
    ctx.fillStyle = look.dressDark; Art.ellipse(ctx, -11 + swing * 6, -3, 10, 5); ctx.fill(); Art.ellipse(ctx, 11 - swing * 6, -3, 10, 5); ctx.fill();
    // back hair
    ctx.fillStyle = look.hair; ctx.beginPath(); ctx.moveTo(-26, -96); ctx.quadraticCurveTo(-40, -60, -24, -46); ctx.lineTo(24, -46); ctx.quadraticCurveTo(40, -60, 26, -96); ctx.closePath(); ctx.fill();
    // dress
    const dg = ctx.createLinearGradient(0, -70, 0, 0); dg.addColorStop(0, look.dress); dg.addColorStop(1, look.dressDark);
    ctx.fillStyle = dg; ctx.strokeStyle = OUT; ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.moveTo(-13, -66); ctx.quadraticCurveTo(-36, -30, -44, -6); ctx.quadraticCurveTo(0, 6 + dance * 4, 44, -6); ctx.quadraticCurveTo(36, -30, 13, -66); ctx.closePath(); ctx.fill(); ctx.stroke();
    // hem scallops + sparkle
    ctx.fillStyle = Art.shade(look.dress, 0.45); for (let i = -3; i <= 3; i++) { Art.circle(ctx, i * 12.5, -7 + Math.abs(i) * 0.6, 6); ctx.fill(); }
    ctx.fillStyle = 'rgba(255,255,255,.8)'; Art.starPath(ctx, 0, -32, 7, 3, 5); ctx.fill();
    // sash
    ctx.fillStyle = Art.shade(look.dressDark, -0.1); Art.roundRect(ctx, -14, -68, 28, 8, 4); ctx.fill();
    ctx.fillStyle = look.crown; Art.circle(ctx, -6, -64, 4); ctx.fill(); Art.circle(ctx, 6, -64, 4); ctx.fill(); Art.circle(ctx, 0, -64, 3); ctx.fill();
    // arms
    ctx.strokeStyle = look.skin; ctx.lineWidth = 7;
    const armUp = anim.wave || dance > 0.5;
    const la = armUp ? [-30, -95] : [-24 - swing * 6, -40]; const ra = anim.wave ? [30, -100 + Math.sin(t * 9) * 8] : (armUp ? [30, -95] : [24 + swing * 6, -40]);
    ctx.beginPath(); ctx.moveTo(-11, -60); ctx.lineTo(la[0], la[1]); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(11, -60); ctx.lineTo(ra[0], ra[1]); ctx.stroke();
    ctx.fillStyle = look.skin; Art.circle(ctx, la[0], la[1], 5); ctx.fill(); Art.circle(ctx, ra[0], ra[1], 5); ctx.fill();
    ctx.fillStyle = look.dress; ctx.strokeStyle = OUT; ctx.lineWidth = 2; Art.circle(ctx, -13, -60, 8); ctx.fill(); ctx.stroke(); Art.circle(ctx, 13, -60, 8); ctx.fill(); ctx.stroke();
    // neck + head
    ctx.fillStyle = look.skin; ctx.fillRect(-5, -76, 10, 10);
    ctx.strokeStyle = OUT; ctx.lineWidth = 2.5; Art.circle(ctx, 0, -94, 26); ctx.fill(); ctx.stroke();
    // bangs
    ctx.fillStyle = look.hair; ctx.beginPath(); ctx.arc(0, -96, 27, Math.PI * 1.02, Math.PI * 1.98); ctx.quadraticCurveTo(14, -104, 4, -96); ctx.quadraticCurveTo(-6, -104, -14, -96); ctx.quadraticCurveTo(-22, -104, -27, -96); ctx.closePath(); ctx.fill();
    Art.circle(ctx, -24, -84, 7); ctx.fill(); Art.circle(ctx, 24, -84, 7); ctx.fill();
    // eyes
    const blink = ((t + (anim.seed || 0)) % 3.7) < 0.12 ? 0.15 : 1;
    ctx.fillStyle = '#fff'; Art.ellipse(ctx, -9, -94, 5.5, 6.5 * blink); ctx.fill(); Art.ellipse(ctx, 9, -94, 5.5, 6.5 * blink); ctx.fill();
    ctx.fillStyle = '#3b2a4a'; Art.ellipse(ctx, -8, -93, 3.2, 4 * blink); ctx.fill(); Art.ellipse(ctx, 10, -93, 3.2, 4 * blink); ctx.fill();
    ctx.fillStyle = '#fff'; Art.circle(ctx, -7, -95, 1.3); ctx.fill(); Art.circle(ctx, 11, -95, 1.3); ctx.fill();
    ctx.strokeStyle = '#3b2a4a'; ctx.lineWidth = 1.8; ctx.beginPath(); ctx.arc(-9, -98, 6, Math.PI * 1.15, Math.PI * 1.85); ctx.stroke(); ctx.beginPath(); ctx.arc(9, -98, 6, Math.PI * 1.15, Math.PI * 1.85); ctx.stroke();
    // cheeks + mouth
    ctx.fillStyle = 'rgba(244,114,182,.45)'; Art.circle(ctx, -16, -85, 4.5); ctx.fill(); Art.circle(ctx, 16, -85, 4.5); ctx.fill();
    if (anim.sing) { ctx.fillStyle = '#9f1239'; Art.ellipse(ctx, 0, -80, 5, 6 + Math.abs(Math.sin(t * 12)) * 2); ctx.fill(); }
    else { ctx.strokeStyle = '#9f1239'; ctx.lineWidth = 2.2; ctx.beginPath(); ctx.arc(0, -84, 7, Math.PI * 0.15, Math.PI * 0.85); ctx.stroke(); }
    // crown
    ctx.fillStyle = look.crown; ctx.strokeStyle = 'rgba(120,53,15,.6)'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(-17, -114); ctx.lineTo(-19, -132); ctx.lineTo(-9, -122); ctx.lineTo(0, -138); ctx.lineTo(9, -122); ctx.lineTo(19, -132); ctx.lineTo(17, -114); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#f472b6'; Art.circle(ctx, 0, -124, 3.5); ctx.fill(); ctx.fillStyle = '#60a5fa'; Art.circle(ctx, -10, -118, 2.5); ctx.fill(); Art.circle(ctx, 10, -118, 2.5); ctx.fill();
    ctx.restore();
  };

  // ---------- particles ----------
  class Particles {
    constructor() { this.list = []; this.texts = []; }
    burst(x, y, o) {
      o = o || {}; const n = o.count || 18; const colors = o.colors || ['#fde047', '#f472b6', '#60a5fa', '#4ade80', '#fb923c', '#c084fc'];
      for (let i = 0; i < n; i++) {
        const a = (o.dir != null ? o.dir : -Math.PI / 2) + (Math.random() - 0.5) * (o.spread != null ? o.spread : Math.PI * 2);
        const sp = (o.speed || 300) * (0.4 + Math.random() * 0.8);
        this.list.push({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, life: (o.life || 0.9) * (0.7 + Math.random() * 0.6), age: 0, size: (o.size || 10) * (0.6 + Math.random() * 0.8), color: colors[i % colors.length], type: o.type || 'circle', emoji: o.emoji, rot: Math.random() * 6, vr: (Math.random() - 0.5) * 10, g: o.gravity != null ? o.gravity : 500 });
      }
    }
    text(x, y, str, o) { o = o || {}; this.texts.push({ x, y, str, age: 0, life: o.life || 1, color: o.color || '#fff', size: o.size || 40, vy: o.vy != null ? o.vy : -90 }); }
    update(dt) {
      this.list = this.list.filter((p) => { p.age += dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vy += p.g * dt; p.vx *= 0.985; p.rot += p.vr * dt; return p.age < p.life; });
      this.texts = this.texts.filter((p) => { p.age += dt; p.y += p.vy * dt; return p.age < p.life; });
    }
    draw(ctx, ox, oy) {
      ox = ox || 0; oy = oy || 0;
      this.list.forEach((p) => {
        const k = 1 - p.age / p.life; ctx.save(); ctx.globalAlpha = Math.min(1, k * 1.5); ctx.translate(p.x - ox, p.y - oy); ctx.rotate(p.rot); ctx.fillStyle = p.color;
        if (p.type === 'star') { Art.starPath(ctx, 0, 0, p.size * (0.5 + k * 0.5), null, 5); ctx.fill(); }
        else if (p.type === 'confetti') { ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2); }
        else if (p.type === 'heart') { Art.heartPath(ctx, 0, 0, p.size * 0.6); ctx.fill(); }
        else if (p.type === 'note') { ctx.font = `${p.size * 2}px ${EMOJI_FONT}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = '#000'; ctx.fillText(['🎵', '🎶', '♪', '♫'][Math.abs(Math.floor(p.rot * 7)) % 4], 0, 0); }
        else if (p.type === 'emoji') { ctx.font = `${p.size * 2}px ${EMOJI_FONT}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = '#000'; ctx.fillText(p.emoji, 0, 0); }
        else { Art.circle(ctx, 0, 0, p.size * 0.5 * (0.4 + k * 0.6)); ctx.fill(); }
        ctx.restore();
      });
      this.texts.forEach((p) => { const k = 1 - p.age / p.life; ctx.save(); ctx.globalAlpha = Math.min(1, k * 2); const s = p.size * (1 + (1 - k) * 0.2); Art.text(ctx, p.str, p.x - ox, p.y - oy, { size: s, color: p.color, stroke: 'rgba(60,20,80,.7)' }); ctx.restore(); });
    }
  }
  Art.Particles = Particles;

  window.FL = window.FL || {};
  FL.Art = Art;
})();
