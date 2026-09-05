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

  // ---------- the puppy (Puppy Cottage) ----------
  Art.DOG_COATS = [
    { name: 'Golden', body: '#f5c66a', dark: '#d9a24a', belly: '#fde9b8', ear: '#d9a24a', spots: null },
    { name: 'Brown', body: '#a16207', dark: '#7c4a0a', belly: '#fef3c7', ear: '#7c4a0a', spots: null },
    { name: 'Spotty', body: '#f8fafc', dark: '#cbd5e1', belly: '#ffffff', ear: '#1f2937', spots: '#1f2937' },
  ];
  Art.DOG_STAGES = [ // multiplies `scale`
    { scale: 0.75, head: 1.35, legs: 0.6, ears: 'flop', collar: null },
    { scale: 0.90, head: 1.15, legs: 0.8, ears: 'flop', collar: '#ef4444' },
    { scale: 1.05, head: 1.00, legs: 1.0, ears: 'up', collar: '#ef4444', tag: true },
    { scale: 1.20, head: 0.95, legs: 1.1, ears: 'up', collar: null, bandana: true },
  ];
  const DOG_OUT = 'rgba(70,30,70,.55)';
  function dogBase(look) {
    const st = Art.DOG_STAGES[Math.max(0, Math.min(3, (look && look.stage) | 0))];
    const L = 26 * st.legs, rx = 34, ry = 22, hr = 22 * st.head, cy = -(L + ry);
    return { st, L, rx, ry, hr, cy, hx: rx * 0.62, hy: cy - ry * 0.5 - hr * 0.6 };
  }
  // s = final scale; cy = body centre offset from the feet; rx/ry = hit ellipse radii about (x, y + cy); top = topmost offset (ears included)
  Art.dogMetrics = function (look, scale) {
    const b = dogBase(look), s = (scale || 1) * b.st.scale, top = b.hy - b.hr * (b.st.ears === 'up' ? 1.6 : 1.1) - 6;
    return { s, cy: b.cy * s, rx: Math.max(48, (b.rx + b.hr + 16) * s), ry: Math.max(48, (Math.max(b.cy - top, -b.cy) + 8) * s), top: top * s };
  };
  // Draws with feet at (x,y), side view facing +x. look: {coat, stage, mood, mud, bandana, crown}; anim: {t, facing, pose, poseT, walking, wag, seed, rot, alpha}
  Art.dog = function (ctx, x, y, look, anim, scale) {
    look = look || {}; anim = anim || {};
    const b = dogBase(look), st = b.st, co = Art.DOG_COATS[(look.coat | 0) % 3] || Art.DOG_COATS[0];
    const L = b.L, rx = b.rx, ry = b.ry, hr = b.hr, cy = b.cy, hx = b.hx, hy = b.hy;
    const s = (scale || 1) * st.scale, t = anim.t || 0, pT = anim.poseT || 0, pose = anim.pose || 'idle', mood = look.mood || 'happy', mud = look.mud | 0;
    const walking = !!anim.walking || pose === 'walk', wag = Math.max(0, Math.min(1, anim.wag || 0)), gait = Math.sin(t * 11);
    const P = { rot: 0, px: 0, py: 0, lift: walking ? Math.abs(gait) * 3 : Math.sin(t * 2.2) * 1.2, br: 0, bx: 0, by: 0, hrot: 0, hdx: 0, hdy: 0, sx: 1, eyes: null, mouth: null, tongue: mood === 'happy', tail: 0, feet: null, drops: false, ball: false };
    const hip = [[-rx * 0.55 - 7, ry * 0.45], [rx * 0.55 - 7, ry * 0.45], [-rx * 0.55 + 5, ry * 0.45], [rx * 0.55 + 5, ry * 0.45]]; // back-far, front-far, back-near, front-near
    const ground = (dy) => hip.map((h) => [h[0], dy || 0]);
    const sit = () => { P.br = -0.55; P.bx = -4; P.by = L * 0.55; P.feet = [[hip[0][0] + 3, 0], [hip[1][0] + 4, 0], [hip[2][0] + 14, 0], [hip[3][0] + 6, 0]]; P.tail = -0.35; };
    const lie = () => { P.by = L + 2; P.lift = 0; P.feet = [[10, 12, 1], [18, 12, 1], [12, 12, 1], [22, 12, 1]]; P.hdx = hr * 0.45 + 4; P.hdy = ry * 0.5 + hr * 0.5; P.hrot = 0.3; };
    let k;
    switch (pose) {
      case 'sit': sit(); break;
      case 'five': sit(); P.feet[3] = [rx * 0.55 + 26, cy + P.by - ry * 0.3]; P.eyes = 'happy'; break;
      case 'beg': P.br = -1.15; P.bx = -6; P.by = L * 0.5; P.feet = [[hip[0][0] + 6, 0], [12, 10, 1], [hip[2][0] + 14, 0], [16, 12, 1]]; P.eyes = 'big'; P.tail = -0.3; P.lift = Math.sin(t * 6) * 1.5; break;
      case 'sleep': lie(); P.eyes = 'closed'; P.mouth = 'small'; P.tongue = false; P.hdy += Math.sin(t * 2) * 0.8; break;
      case 'roll': lie(); P.rot = Math.min(1, pT / 2) * Math.PI * 2; P.py = -ry - 2; P.eyes = 'happy'; P.tongue = true; P.hrot = 0.1; break;
      case 'eat': case 'drink': P.br = 0.12; P.hrot = 1.1; P.hdx = hr * 0.5; P.hdy = hr * 1.5 + Math.abs(Math.sin(pT * Math.PI * 12)) * 4; P.tongue = false; P.mouth = pose === 'eat' ? 'open' : 'lap'; P.eyes = 'closed'; break;
      case 'sniff': P.br = 0.1; P.hrot = 0.7; P.hdx = hr * 0.4 + Math.sin(pT * 30) * 1.2; P.hdy = hr * 0.9; P.tongue = false; P.mouth = 'small'; break;
      case 'squat': P.br = -0.4; P.bx = -4; P.by = L * 0.5; P.feet = [[hip[0][0] + 4, 0], [hip[1][0] - 2, 0], [hip[2][0] + 16, 0], [hip[3][0] + 2, 0]]; P.tail = -0.7; P.eyes = 'big'; P.mouth = 'small'; P.tongue = false; break;
      case 'kick': k = Math.abs(Math.sin(pT * 10)); P.feet = ground(0); P.feet[2] = [hip[2][0] - 26 - k * 14, -L * 0.45 - k * 10]; P.br = 0.12; P.tail = -0.5; P.eyes = 'happy'; break;
      case 'grab': P.ball = true; P.tongue = false; P.mouth = 'none'; break;
      case 'spin': P.sx = Math.cos(pT * Math.PI * 2); P.lift = 4; P.tail = -0.3; P.eyes = mood === 'pout' ? null : 'happy'; break;
      case 'dance': k = pT * Math.PI * 4; P.lift = Math.abs(Math.sin(k)) * 12; P.rot = Math.sin(k) * 0.12; P.py = -L; P.feet = ground(0); (Math.sin(k) > 0 ? [2, 3] : [0, 1]).forEach((i) => { P.feet[i][1] = -8; }); P.eyes = 'happy'; P.tongue = true; break;
      case 'hop': k = Math.sin(Math.min(1, pT / 0.5) * Math.PI); P.lift = k * 22; P.feet = ground(-k * 8); break;
      case 'tumble': k = Math.sin(Math.min(1, pT / 0.6) * Math.PI); P.rot = k * 1.15; P.px = hip[3][0] + 4; P.eyes = k > 0.3 ? 'happy' : null; break;
      case 'stretch': P.br = 0.42; P.bx = 4; P.by = 7; P.feet = [[hip[0][0], 0], [hip[1][0] + 26, 0], [hip[2][0] + 8, 0], [hip[3][0] + 32, 0]]; P.hrot = -0.25; P.tail = -0.4; break;
      case 'shake': P.rot = Math.sin(pT * 38) * 0.1; P.py = -L; P.hrot = Math.sin(pT * 38 + 1) * 0.4; P.drops = true; P.eyes = 'closed'; P.tongue = false; P.mouth = 'small'; break;
      default: break;
    }
    if (!P.feet) { P.feet = ground(0); if (walking) [1, -1, -1, 1].forEach((d, i) => { const sw = gait * d; P.feet[i] = [hip[i][0] + sw * 9, -Math.max(0, sw) * 7]; }); }
    if (!P.eyes) P.eyes = mood === 'happy' ? 'happy' : (mood === 'pout' ? 'sad' : 'open');
    if (!P.mouth) P.mouth = mood === 'pout' ? 'frown' : 'smile';
    const cb = Math.cos(P.br), sb = Math.sin(P.br), B = [P.bx, cy + P.by];
    const R = (px, py) => [B[0] + px * cb - py * sb, B[1] + px * sb + py * cb];
    const H = hip.map((h) => R(h[0], h[1]));
    const F = P.feet.map((f, i) => (f[2] ? [H[i][0] + f[0], H[i][1] + f[1]] : f));
    const lw = 11 + (1 - st.legs) * 4;
    const leg = (i, color) => {
      const dx = F[i][0] - H[i][0], dy = F[i][1] - H[i][1], len = Math.max(6, Math.hypot(dx, dy));
      ctx.save(); ctx.translate(H[i][0], H[i][1]); ctx.rotate(Math.atan2(-dx, dy)); ctx.fillStyle = color;
      Art.roundRect(ctx, -lw / 2, -lw * 0.3, lw, len + lw * 0.3, lw / 2); ctx.fill(); ctx.stroke();
      Art.ellipse(ctx, lw * 0.15, len - 1, lw * 0.62, lw * 0.4); ctx.fill(); ctx.stroke();
      if (mud > i) { ctx.fillStyle = '#92400e'; Art.circle(ctx, lw * 0.1, len * 0.55, lw * 0.42); ctx.fill(); ctx.fillStyle = '#b45309'; Art.circle(ctx, -lw * 0.1, len * 0.45, lw * 0.18); ctx.fill(); }
      ctx.restore();
    };
    ctx.save(); ctx.translate(x, y); if (anim.alpha != null) ctx.globalAlpha = anim.alpha;
    ctx.scale(s * (anim.facing || 1), s);
    ctx.fillStyle = 'rgba(0,0,0,.18)'; Art.ellipse(ctx, 4, 0, rx * 1.25 * Math.max(0.6, 1 - P.lift / 60), 8); ctx.fill();
    ctx.translate(0, -P.lift);
    if (anim.rot) { ctx.translate(0, cy); ctx.rotate(anim.rot); ctx.translate(0, -cy); }
    if (P.rot) { ctx.translate(P.px, P.py); ctx.rotate(P.rot); ctx.translate(-P.px, -P.py); }
    if (P.sx !== 1) ctx.scale(Math.abs(P.sx) < 0.12 ? (P.sx < 0 ? -0.12 : 0.12) : P.sx, 1);
    ctx.lineJoin = 'round'; ctx.lineCap = 'round'; ctx.strokeStyle = DOG_OUT; ctx.lineWidth = 2.5;
    // far legs, tail, near legs, body
    leg(0, co.dark); leg(1, co.dark);
    ctx.save(); ctx.translate(B[0], B[1]); ctx.rotate(P.br);
    const ta = (mood === 'pout' ? -0.45 : 0.9) + P.tail + Math.sin(t * (9 + wag * 14 + (mood === 'happy' ? 3 : 0))) * (0.2 + wag * 0.5 + (mood === 'happy' ? 0.12 : 0));
    const tx = -rx * 0.88, ty = -ry * 0.15, tl = 30, tipx = tx - Math.cos(ta) * tl, tipy = ty - Math.sin(ta) * tl, cx2 = tx - Math.cos(ta + 0.55) * tl * 0.65, cy2 = ty - Math.sin(ta + 0.55) * tl * 0.65;
    ctx.beginPath(); ctx.moveTo(tx, ty); ctx.quadraticCurveTo(cx2, cy2, tipx, tipy); ctx.lineWidth = 12; ctx.stroke(); ctx.strokeStyle = co.body; ctx.lineWidth = 8.5; ctx.stroke();
    ctx.fillStyle = co.spots || co.dark; Art.circle(ctx, tipx, tipy, 4.5); ctx.fill();
    ctx.restore();
    leg(2, co.body); leg(3, co.body);
    ctx.save(); ctx.translate(B[0], B[1]); ctx.rotate(P.br);
    ctx.fillStyle = co.body; Art.ellipse(ctx, 0, 0, rx, ry); ctx.fill(); ctx.stroke();
    ctx.fillStyle = co.belly; Art.ellipse(ctx, rx * 0.08, ry * 0.42, rx * 0.6, ry * 0.5); ctx.fill();
    if (co.spots) { ctx.fillStyle = co.spots; Art.ellipse(ctx, -rx * 0.38, -ry * 0.3, 11, 8); ctx.fill(); Art.ellipse(ctx, rx * 0.3, -ry * 0.55, 7, 5); ctx.fill(); }
    if (mud > 4) { ctx.fillStyle = '#92400e'; Art.circle(ctx, -rx * 0.2, ry * 0.7, 5); ctx.fill(); }
    if (mud > 5) { ctx.fillStyle = '#92400e'; Art.circle(ctx, rx * 0.3, ry * 0.75, 4); ctx.fill(); }
    ctx.restore();
    // head
    const A = R(hx, 0); A[1] += hy - cy; A[0] += P.hdx; A[1] += P.hdy;
    ctx.save(); ctx.translate(A[0], A[1]); ctx.rotate(P.br * 0.5 + P.hrot);
    const flop = st.ears === 'flop', pout = mood === 'pout', swing = (walking || pose === 'hop' || pose === 'dance') ? Math.sin(t * 11) * 0.12 : Math.sin(t * 2.2) * 0.03;
    const upEar = (bx, by, tx2, ty2, w) => {
      if (pout) { tx2 -= hr * 0.4; ty2 += hr * 0.4; }
      ctx.fillStyle = co.ear; ctx.beginPath(); ctx.moveTo(bx - w / 2, by); ctx.quadraticCurveTo(bx - w * 0.35, ty2, tx2, ty2); ctx.quadraticCurveTo(bx + w * 0.45, by - hr * 0.1, bx + w / 2, by + hr * 0.1); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#fda4af'; ctx.beginPath(); ctx.moveTo(bx - w * 0.2, by); ctx.quadraticCurveTo(bx - w * 0.15, (by + ty2) / 2, (bx + tx2) / 2, (by + ty2) / 2); ctx.quadraticCurveTo(bx + w * 0.2, by - hr * 0.05, bx + w * 0.2, by + hr * 0.05); ctx.closePath(); ctx.fill();
    };
    const flopEar = (px, sz, rot, front) => {
      ctx.save(); ctx.translate(px, -hr * 0.62); ctx.rotate(rot + swing + (pout ? 0.3 : 0)); ctx.fillStyle = co.ear;
      Art.ellipse(ctx, 0, hr * 0.58 * sz, hr * 0.31 * sz, hr * 0.62 * sz); ctx.fill(); ctx.stroke();
      if (front) { ctx.fillStyle = 'rgba(255,255,255,.18)'; Art.ellipse(ctx, -hr * 0.06, hr * 0.5 * sz, hr * 0.12 * sz, hr * 0.32 * sz); ctx.fill(); }
      ctx.restore();
    };
    if (flop) flopEar(-hr * 0.62, 0.95, 0.35, false); else { upEar(-hr * 0.5, -hr * 0.6, -hr * 0.78, -hr * 1.45, hr * 0.5); upEar(hr * 0.1, -hr * 0.72, hr * 0.32, -hr * 1.58, hr * 0.56); }
    // collar / bandana (under the chin, the head overlaps the top half)
    if (st.collar) { ctx.fillStyle = st.collar; Art.ellipse(ctx, -hr * 0.05, hr * 0.84, hr * 0.62, hr * 0.2); ctx.fill(); ctx.stroke(); if (st.tag) { ctx.fillStyle = '#fbbf24'; Art.circle(ctx, hr * 0.06, hr * 1.1, hr * 0.15); ctx.fill(); ctx.stroke(); ctx.fillStyle = '#b45309'; Art.circle(ctx, hr * 0.06, hr * 1.1, hr * 0.05); ctx.fill(); } }
    if (st.bandana) { const bc = look.bandana || '#f472b6'; ctx.fillStyle = bc; ctx.beginPath(); ctx.moveTo(-hr * 0.55, hr * 0.78); ctx.lineTo(hr * 0.5, hr * 0.78); ctx.lineTo(hr * 0.05, hr * 1.55); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.fillStyle = Art.shade(bc, -0.2); Art.ellipse(ctx, -hr * 0.05, hr * 0.8, hr * 0.62, hr * 0.16); ctx.fill(); ctx.stroke(); ctx.fillStyle = 'rgba(255,255,255,.7)'; Art.circle(ctx, -hr * 0.1, hr * 1.1, hr * 0.06); ctx.fill(); Art.circle(ctx, hr * 0.15, hr * 1.25, hr * 0.05); ctx.fill(); }
    ctx.fillStyle = co.body; Art.circle(ctx, 0, 0, hr); ctx.fill(); ctx.stroke();
    if (co.spots) { ctx.save(); Art.circle(ctx, 0, 0, hr - 1); ctx.clip(); ctx.fillStyle = co.spots; Art.circle(ctx, hr * 0.45, -hr * 0.15, hr * 0.45); ctx.fill(); ctx.restore(); }
    ctx.fillStyle = co.belly; ctx.lineWidth = 2; Art.ellipse(ctx, hr * 0.62, hr * 0.32, hr * 0.52, hr * 0.4); ctx.fill(); ctx.stroke(); ctx.lineWidth = 2.5;
    ctx.fillStyle = 'rgba(244,114,182,.4)'; Art.circle(ctx, -hr * 0.5, hr * 0.28, hr * 0.15); ctx.fill(); Art.circle(ctx, hr * 0.08, hr * 0.26, hr * 0.14); ctx.fill();
    // eyes
    const blink = ((t + (anim.seed || 0)) % 3.7) < 0.12, E = [[hr * 0.4, -hr * 0.1, hr * 0.25], [-hr * 0.12, -hr * 0.12, hr * 0.2]];
    ctx.strokeStyle = '#3b2a4a'; ctx.lineWidth = hr * 0.14;
    E.forEach(([ex, ey, er]) => {
      if (P.eyes === 'happy') { ctx.beginPath(); ctx.arc(ex, ey + er * 0.3, er, Math.PI * 1.15, Math.PI * 1.85); ctx.stroke(); return; }
      if (P.eyes === 'closed') { ctx.beginPath(); ctx.arc(ex, ey - er * 0.3, er, Math.PI * 0.15, Math.PI * 0.85); ctx.stroke(); return; }
      const bl = blink ? 0.15 : 1, big = P.eyes === 'big' ? 1.15 : 1;
      ctx.fillStyle = '#fff'; Art.ellipse(ctx, ex, ey, er, er * 1.1 * bl); ctx.fill();
      ctx.fillStyle = '#3b2a4a'; Art.ellipse(ctx, ex + er * 0.15, ey + er * 0.1, er * 0.62 * big, er * 0.72 * big * bl); ctx.fill();
      ctx.fillStyle = '#fff'; Art.circle(ctx, ex + er * 0.35, ey - er * 0.3, er * 0.24 * bl); ctx.fill(); Art.circle(ctx, ex - er * 0.15, ey + er * 0.3, er * 0.1 * bl); ctx.fill();
      if (P.eyes === 'sad') { ctx.lineWidth = hr * 0.09; ctx.beginPath(); ctx.moveTo(ex - er * 0.9, ey - er * 1.25); ctx.lineTo(ex + er * 0.6, ey - er * 1.7); ctx.stroke(); ctx.lineWidth = hr * 0.14; }
    });
    ctx.strokeStyle = DOG_OUT; ctx.lineWidth = 2.5;
    // nose + mouth + tongue
    ctx.fillStyle = '#3b2a4a'; Art.ellipse(ctx, hr * 1.06, hr * 0.2, hr * 0.19, hr * 0.15); ctx.fill(); ctx.fillStyle = 'rgba(255,255,255,.6)'; Art.circle(ctx, hr * 1.0, hr * 0.14, hr * 0.05); ctx.fill();
    ctx.strokeStyle = '#9f1239'; ctx.lineWidth = hr * 0.09;
    if (P.mouth === 'smile') { ctx.beginPath(); ctx.arc(hr * 0.72, hr * 0.4, hr * 0.3, Math.PI * 0.15, Math.PI * 0.85); ctx.stroke(); }
    else if (P.mouth === 'small') { ctx.beginPath(); ctx.arc(hr * 0.8, hr * 0.42, hr * 0.18, Math.PI * 0.2, Math.PI * 0.8); ctx.stroke(); }
    else if (P.mouth === 'frown') { ctx.beginPath(); ctx.arc(hr * 0.78, hr * 0.78, hr * 0.22, Math.PI * 1.2, Math.PI * 1.8); ctx.stroke(); }
    else if (P.mouth === 'open') { ctx.fillStyle = '#9f1239'; Art.ellipse(ctx, hr * 0.78, hr * 0.58, hr * 0.2, hr * 0.14 + Math.abs(Math.sin(pT * Math.PI * 12)) * hr * 0.08); ctx.fill(); }
    else if (P.mouth === 'lap') { ctx.fillStyle = '#fb7185'; Art.ellipse(ctx, hr * 0.85, hr * 0.7 + Math.abs(Math.sin(pT * Math.PI * 10)) * hr * 0.2, hr * 0.13, hr * 0.22); ctx.fill(); }
    if (P.tongue && P.mouth !== 'none') { ctx.fillStyle = '#fb7185'; ctx.strokeStyle = DOG_OUT; ctx.lineWidth = 1.5; Art.roundRect(ctx, hr * 0.55, hr * 0.62, hr * 0.28, hr * 0.38 + Math.sin(t * 8) * hr * 0.03, hr * 0.14); ctx.fill(); ctx.stroke(); ctx.strokeStyle = '#e11d48'; ctx.beginPath(); ctx.moveTo(hr * 0.69, hr * 0.72); ctx.lineTo(hr * 0.69, hr * 0.9); ctx.stroke(); }
    ctx.strokeStyle = DOG_OUT; ctx.lineWidth = 2.5;
    if (flop) flopEar(st.head > 1.2 ? -hr * 0.28 : -hr * 0.42, st.head > 1.2 ? 1.12 : 1, -0.18, true);
    if (look.crown) { ctx.save(); ctx.translate(-hr * 0.15, -hr * 0.95); ctx.scale(hr / 30, hr / 30); ctx.fillStyle = '#fbbf24'; ctx.strokeStyle = 'rgba(120,53,15,.6)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-10, 0); ctx.lineTo(-12, -11); ctx.lineTo(-5, -5); ctx.lineTo(0, -14); ctx.lineTo(5, -5); ctx.lineTo(12, -11); ctx.lineTo(10, 0); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.fillStyle = '#f472b6'; Art.circle(ctx, 0, -4, 3); ctx.fill(); ctx.restore(); }
    if (P.ball) Art.emoji(ctx, '🎾', hr * 1.0, hr * 0.62, hr * 0.95);
    ctx.restore();
    if (P.drops) { ctx.fillStyle = 'rgba(125,211,252,.85)'; for (let i = 0; i < 8; i++) { const a = i * 0.8 + pT * 6, r = 42 + ((pT * 90 + i * 13) % 40); Art.circle(ctx, Math.cos(a) * r, cy + Math.sin(a) * r * 0.7, 3.5); ctx.fill(); } }
    ctx.restore();
  };
  Art.cottage = function (ctx, x, y, s, t, o) {
    t = t || 0; o = o || {};
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s); ctx.lineJoin = 'round'; ctx.strokeStyle = 'rgba(112,26,117,.45)'; ctx.lineWidth = 3;
    ctx.fillStyle = 'rgba(0,0,0,.15)'; Art.ellipse(ctx, 0, 4, 130, 18); ctx.fill();
    for (let i = 0; i < 2; i++) { const p = (t * 0.25 + i * 0.5) % 1; Art.cloud(ctx, 64 + p * 18 + i * 8, -200 - p * 60, 8 + p * 8, 0.8 * (1 - p)); }
    ctx.fillStyle = '#9f1239'; Art.roundRect(ctx, 52, -200, 24, 52, 4); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#fbcfe8'; Art.roundRect(ctx, -100, -130, 200, 130, 8); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#f9a8d4'; ctx.fillRect(-98, -16, 196, 14);
    ctx.fillStyle = '#60a5fa'; ctx.beginPath(); ctx.moveTo(-120, -126); ctx.lineTo(0, -212); ctx.lineTo(120, -126); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#93c5fd'; ctx.beginPath(); ctx.moveTo(-120, -126); ctx.lineTo(0, -212); ctx.lineTo(-34, -126); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#3b82f6'; Art.roundRect(ctx, -124, -132, 248, 12, 6); ctx.fill(); ctx.stroke();
    // door with a dog flap
    ctx.fillStyle = '#92400e'; ctx.beginPath(); ctx.moveTo(-67, 0); ctx.lineTo(-67, -52); ctx.arc(-45, -52, 22, Math.PI, 0); ctx.lineTo(-23, 0); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#b45309'; Art.roundRect(ctx, -57, -24, 24, 22, 5); ctx.fill(); ctx.stroke(); Art.pawPrint(ctx, -45, -13, 5, '#fde68a');
    ctx.fillStyle = '#fbbf24'; Art.circle(ctx, -30, -32, 3.5); ctx.fill(); ctx.fillStyle = '#fde047'; Art.heartPath(ctx, -45, -58, 5); ctx.fill();
    // round window + flower box
    ctx.fillStyle = '#bae6fd'; Art.circle(ctx, 45, -80, 24); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(45, -104); ctx.lineTo(45, -56); ctx.moveTo(21, -80); ctx.lineTo(69, -80); ctx.stroke(); ctx.strokeStyle = 'rgba(112,26,117,.45)'; ctx.lineWidth = 3; Art.circle(ctx, 45, -80, 24); ctx.stroke();
    ctx.fillStyle = '#a16207'; Art.roundRect(ctx, 18, -50, 54, 13, 4); ctx.fill(); ctx.stroke();
    [['#f472b6', 27], ['#fde047', 45], ['#f87171', 63]].forEach(([c, fx]) => { ctx.fillStyle = '#4ade80'; Art.ellipse(ctx, fx, -52, 7, 4); ctx.fill(); ctx.fillStyle = c; Art.circle(ctx, fx, -57, 5.5); ctx.fill(); });
    ctx.fillStyle = '#e9d5a1'; Art.ellipse(ctx, -45, 8, 34, 9); ctx.fill();
    if (o.name) { const w = Math.min(116, Math.max(88, o.name.length * 13 + 26)); ctx.fillStyle = '#fde68a'; ctx.strokeStyle = '#a16207'; ctx.lineWidth = 3; Art.roundRect(ctx, -42 - w / 2, -108, w, 30, 8); ctx.fill(); ctx.stroke(); Art.text(ctx, o.name, -42, -93, { size: Art.fitSize(ctx, o.name, w - 14, 20), color: '#78350f' }); }
    ctx.restore();
  };
  Art.doghouse = function (ctx, x, y, s, name) {
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s); ctx.lineJoin = 'round'; ctx.strokeStyle = 'rgba(112,26,117,.45)'; ctx.lineWidth = 3;
    ctx.fillStyle = 'rgba(0,0,0,.15)'; Art.ellipse(ctx, 0, 3, 56, 10); ctx.fill();
    ctx.fillStyle = '#d97706'; Art.roundRect(ctx, -45, -54, 90, 54, 6); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = 'rgba(120,53,15,.35)'; ctx.lineWidth = 2; [-40, -26, -12].forEach((py) => { ctx.beginPath(); ctx.moveTo(-42, py); ctx.lineTo(-25, py); ctx.moveTo(25, py); ctx.lineTo(42, py); ctx.stroke(); });
    ctx.strokeStyle = 'rgba(112,26,117,.45)'; ctx.lineWidth = 3;
    ctx.fillStyle = '#451a03'; ctx.beginPath(); ctx.moveTo(-21, 0); ctx.lineTo(-21, -28); ctx.arc(0, -28, 21, Math.PI, 0); ctx.lineTo(21, 0); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#b45309'; ctx.beginPath(); ctx.moveTo(-54, -50); ctx.lineTo(0, -82); ctx.lineTo(54, -50); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#f59e0b'; ctx.beginPath(); ctx.moveTo(-54, -50); ctx.lineTo(0, -82); ctx.lineTo(-16, -50); ctx.closePath(); ctx.fill();
    if (name) { const w = Math.min(86, Math.max(52, name.length * 9 + 18)); ctx.fillStyle = '#fde68a'; ctx.strokeStyle = '#a16207'; ctx.lineWidth = 2.5; Art.roundRect(ctx, -w / 2, -70, w, 22, 6); ctx.fill(); ctx.stroke(); Art.text(ctx, name, 0, -59, { size: Art.fitSize(ctx, name, w - 10, 15), color: '#78350f' }); }
    ctx.restore();
  };
  Art.bubble = function (ctx, x, y, emoji, size) {
    size = size || 40;
    ctx.save(); ctx.fillStyle = '#fff'; ctx.strokeStyle = '#f9a8d4'; ctx.lineWidth = 3;
    Art.circle(ctx, x - size * 1.05, y + size * 1.15, size * 0.1); ctx.fill(); ctx.stroke();
    Art.circle(ctx, x - size * 0.78, y + size * 0.8, size * 0.18); ctx.fill(); ctx.stroke();
    Art.ellipse(ctx, x, y, size * 0.9, size * 0.7); ctx.fill(); ctx.stroke();
    Art.emoji(ctx, emoji, x, y, size * 0.9); ctx.restore();
  };
  Art.pawPrint = function (ctx, x, y, r, color) {
    ctx.fillStyle = color; Art.ellipse(ctx, x, y + r * 0.3, r * 0.58, r * 0.46); ctx.fill();
    [[-0.66, -0.12, 0.22], [-0.24, -0.55, 0.25], [0.24, -0.55, 0.25], [0.66, -0.12, 0.22]].forEach(([dx, dy, dr]) => { Art.circle(ctx, x + dx * r, y + dy * r, dr * r); ctx.fill(); });
  };
  Art.bonePath = function (ctx, x, y, w, h) { // (x,y) = top-left of the shaft box; knobs bulge above/below it
    const r = h * 0.55, a = Math.atan2(h / 2, Math.sqrt(Math.max(0, r * r - h * h / 4)));
    ctx.beginPath(); ctx.moveTo(x + r, y); ctx.lineTo(x + w - r, y);
    ctx.arc(x + w, y, r, Math.PI, Math.PI * 2 + a); ctx.arc(x + w, y + h, r, -a, Math.PI);
    ctx.lineTo(x + r, y + h); ctx.arc(x, y + h, r, 0, Math.PI + a); ctx.arc(x, y, r, Math.PI - a, Math.PI * 2); ctx.closePath();
  };
  Art.fence = function (ctx, x0, x1, y, s) {
    s = s || 1; ctx.save(); ctx.fillStyle = '#fff'; ctx.strokeStyle = 'rgba(70,30,70,.35)'; ctx.lineWidth = 2; ctx.lineJoin = 'round';
    for (let px = x0 + 10 * s; px < x1 - 6 * s; px += 26 * s) { ctx.beginPath(); ctx.moveTo(px - 7 * s, y + 52 * s); ctx.lineTo(px - 7 * s, y - 6 * s); ctx.lineTo(px, y - 16 * s); ctx.lineTo(px + 7 * s, y - 6 * s); ctx.lineTo(px + 7 * s, y + 52 * s); ctx.closePath(); ctx.fill(); ctx.stroke(); }
    [0, 28].forEach((dy) => { Art.roundRect(ctx, x0, y + dy * s, x1 - x0, 8 * s, 3 * s); ctx.fill(); ctx.stroke(); });
    ctx.restore();
  };

  window.FL = window.FL || {};
  FL.Art = Art;
})();
