// The castle interior: a scrolling map you walk through. Six connected areas (great hall, treasure
// vault, greenhouse, menagerie, dungeon lab, sky tower), drawn in a 3/4 view with extruded walls,
// pillars, torch lighting and depth-sorted sprites. Registered as the 'world' scene so the engine's
// home button and results overlay return here.
(function () {
  const A = FL.Art, UI = FL.UI, G = () => FL.Game, D = FL.Data;
  const WALL_H = 170, T = 34, MAP_W = 3500, MAP_H = 2650, M = 26; // wall height, wall thickness, map, walk margin

  // ---- floor plan: rooms and corridors (corridors overlap rooms by 60 so doorways are walkable) ----
  const ROOMS = {
    hall: { id: 'hall', x: 1250, y: 1000, w: 1000, h: 850, floor: 'checker', ambient: 0.16, name: 'Great Hall' },
    vault: { id: 'vault', x: 1500, y: 320, w: 520, h: 440, floor: 'dark', ambient: 0.5, name: 'Treasure Vault' },
    green: { id: 'green', x: 150, y: 950, w: 950, h: 850, floor: 'garden', ambient: 0, name: 'Royal Greenhouse' },
    zoo: { id: 'zoo', x: 2400, y: 950, w: 950, h: 850, floor: 'hay', ambient: 0, name: 'Royal Menagerie' },
    lab: { id: 'lab', x: 250, y: 2100, w: 610, h: 460, floor: 'dungeon', ambient: 0.55, name: "Wizard's Lab" },
    tower: { id: 'tower', x: 2550, y: 250, w: 560, h: 510, floor: 'tower', ambient: 0.1, name: 'Sky Tower' },
  };
  const CORS = [
    { id: 'c_vault', x: 1520, y: 700, w: 120, h: 360, floor: 'checker', ambient: 0.3 },
    { id: 'c_west', x: 1040, y: 1350, w: 270, h: 140, floor: 'checker', ambient: 0.08 },
    { id: 'c_east', x: 2190, y: 1350, w: 270, h: 140, floor: 'checker', ambient: 0.08 },
    { id: 'c_south', x: 1330, y: 1790, w: 120, h: 520, floor: 'stairsDown', ambient: 0.4 },
    { id: 'c_lab', x: 800, y: 2190, w: 650, h: 120, floor: 'dark', ambient: 0.5 },
    { id: 'c_north2', x: 2050, y: 700, w: 120, h: 360, floor: 'stairsUp', ambient: 0.25 },
    { id: 'c_tower', x: 2050, y: 700, w: 560, h: 120, floor: 'checker', ambient: 0.2 },
  ];
  const AREAS = Object.values(ROOMS).concat(CORS); AREAS.forEach((a) => { a.x1 = a.x + a.w; a.y1 = a.y + a.h; });
  // Where the games are: a sign with a Play bubble. `at` params put the explorer here on return.
  const LOCS = [
    { id: 'tower', name: 'Sky Tower', emoji: '🔭', x: 2830, y: 600, r: 130, scene: 'tower', hint: 'Look at the sky!', room: 'tower' },
    { id: 'greenhouse', name: 'Royal Greenhouse', emoji: '🌱', x: 620, y: 1420, r: 130, scene: 'greenhouse', hint: 'Help the plants grow!', room: 'green' },
    { id: 'lab', name: "Wizard's Lab", emoji: '🧪', x: 560, y: 2400, r: 130, scene: 'lab', hint: 'Sink or float?', room: 'lab' },
    { id: 'menagerie', name: 'Royal Menagerie', emoji: '🐾', x: 2875, y: 1440, r: 130, scene: 'menagerie', hint: 'Meet the animals!', room: 'zoo' },
    { id: 'vault', name: 'Treasure Vault', emoji: '⚖️', x: 1760, y: 620, r: 130, scene: 'vault', hint: 'Heavy or light?', room: 'vault' },
  ];
  const TORCHES = [[1330, 1000], [1520, 1000], [1990, 1000], [2180, 1000], [1560, 320], [1960, 320], [300, 2100], [800, 2100], [2600, 250], [3060, 250], [1580, 700], [2110, 700], [1100, 2190], [2350, 700]];
  const PENS = [{ x: 2450, y: 1010, w: 380, h: 300, animals: ['🐄', '🐑'] }, { x: 2920, y: 1010, w: 380, h: 300, animals: ['🐔', '🐥', '🐥'] }, { x: 2450, y: 1560, w: 380, h: 220, animals: ['🐴'] }, { x: 2920, y: 1560, w: 380, h: 220, animals: ['🐐', '🐰'] }];
  const PILLARS = [[1400, 1260], [1400, 1560], [2100, 1260], [2100, 1560], [1480, 1090], [2020, 1090]];
  // Things you walk around: [x, y, w, h] rectangles (feet space) and [x, y, r] circles.
  const RECTS = [[1670, 1030, 160, 80], [2450, 1010, 380, 300], [2920, 1010, 380, 300], [2450, 1560, 380, 220], [2920, 1560, 380, 220], [380, 1050, 280, 140], [220, 1000, 260, 200], [220, 1560, 260, 200], [820, 1000, 260, 200], [820, 1560, 260, 200], [1290, 1760, 380, 60], [1840, 1760, 380, 60]];
  const CIRCLES = PILLARS.map(([x, y]) => [x, y, 44]).concat([[300, 1560, 34], [1000, 1560, 34], [1000, 1080, 34], [700, 2390, 70], [2960, 590, 50], [1950, 1130, 40]]);
  const blocked = (x, y) => RECTS.some(([rx, ry, rw, rh]) => x > rx && x < rx + rw && y > ry && y < ry + rh) || CIRCLES.some(([cx, cy, r]) => Math.hypot(cx - x, cy - y) < r);
  const walkable = (x, y) => !blocked(x, y) && AREAS.some((a) => x > a.x + M && x < a.x1 - M && y > a.y + M + 6 && y < a.y1 - M);
  const areaAt = (x, y) => AREAS.find((a) => x >= a.x && x <= a.x1 && y >= a.y && y <= a.y1) || null;
  const roomAt = (x, y) => Object.values(ROOMS).find((a) => x >= a.x && x <= a.x1 && y >= a.y && y <= a.y1) || null;
  // Wall segments per area edge, minus the stretches where another area passes through (doorways).
  function segments(a) {
    const cut = (lo, hi, holes) => { let ivs = [[lo, hi]]; holes.forEach(([s, e]) => { ivs = ivs.flatMap(([p, q]) => { if (e <= p || s >= q) return [[p, q]]; const out = []; if (s > p) out.push([p, s]); if (e < q) out.push([e, q]); return out; }); }); return ivs; };
    const others = AREAS.filter((o) => o !== a); const segs = [];
    cut(a.x, a.x1, others.filter((o) => o.y < a.y && o.y1 > a.y).map((o) => [o.x, o.x1])).forEach(([s, e]) => segs.push({ side: 'n', x0: s, x1: e, y: a.y, a }));
    cut(a.x, a.x1, others.filter((o) => o.y < a.y1 && o.y1 > a.y1).map((o) => [o.x, o.x1])).forEach(([s, e]) => segs.push({ side: 's', x0: s, x1: e, y: a.y1, a }));
    cut(a.y, a.y1, others.filter((o) => o.x < a.x && o.x1 > a.x).map((o) => [o.y, o.y1])).forEach(([s, e]) => segs.push({ side: 'w', y0: s, y1: e, x: a.x, a }));
    cut(a.y, a.y1, others.filter((o) => o.x < a.x1 && o.x1 > a.x1).map((o) => [o.y, o.y1])).forEach(([s, e]) => segs.push({ side: 'e', y0: s, y1: e, x: a.x1, a }));
    return segs;
  }
  const SEGS = AREAS.flatMap(segments);
  const DOORS_N = Object.values(ROOMS).flatMap((a) => AREAS.filter((o) => o !== a && o.y < a.y && o.y1 > a.y && o.x > a.x + 20 && o.x1 < a.x1 - 20).map((o) => ({ x0: o.x, x1: o.x1, y: a.y })));

  // ---- drawing helpers ----
  const STONE = { light: '#d6d3d1', mid: '#a8a29e', dark: '#78716c', line: 'rgba(40,30,30,.45)' };
  function bricks(ctx, x, y, w, h, c1, c2, bw, bh) {
    ctx.fillStyle = c1; ctx.fillRect(x, y, w, h); ctx.fillStyle = c2;
    for (let r = 0; r * bh < h; r++) for (let c = -1; c * bw < w + bw; c++) { const bx = x + c * bw + (r % 2) * bw / 2, by = y + r * bh; const ex = Math.max(x, bx), ey = by, ew = Math.min(x + w, bx + bw - 6) - ex, eh = Math.min(y + h, by + bh - 5) - ey; if (ew > 0 && eh > 0) ctx.fillRect(ex, ey, ew, eh); }
  }
  function floor(ctx, a, t) {
    const { x, y, w, h } = a;
    if (a.floor === 'checker' || a.floor === 'dark') { const c = a.floor === 'dark' ? ['#57534e', '#44403c'] : ['#cbd5e1', '#b6bfcc']; ctx.fillStyle = c[0]; ctx.fillRect(x, y, w, h); ctx.fillStyle = c[1]; for (let r = 0; r * 70 < h; r++) for (let cc = 0; cc * 100 < w; cc++) if ((r + cc) % 2) ctx.fillRect(x + cc * 100, y + r * 70, Math.min(100, w - cc * 100), Math.min(70, h - r * 70)); ctx.strokeStyle = 'rgba(0,0,0,.08)'; ctx.lineWidth = 2; for (let r = 0; r * 70 <= h; r++) { ctx.beginPath(); ctx.moveTo(x, y + r * 70); ctx.lineTo(x + w, y + r * 70); ctx.stroke(); } for (let cc = 0; cc * 100 <= w; cc++) { ctx.beginPath(); ctx.moveTo(x + cc * 100, y); ctx.lineTo(x + cc * 100, y + h); ctx.stroke(); } }
    else if (a.floor === 'garden') { ctx.fillStyle = '#86efac'; ctx.fillRect(x, y, w, h); ctx.fillStyle = '#a7f3d0'; for (let i = 0; i < 40; i++) { A.ellipse(ctx, x + ((i * 233) % w), y + ((i * 151) % h), 50, 24); ctx.fill(); } ctx.fillStyle = '#d6b98c'; A.roundRect(ctx, x + 60, y + h / 2 - 60, w - 120, 120, 40); ctx.fill(); ctx.fillStyle = '#e9d5a1'; for (let i = 0; i < (w - 120) / 90; i++) A.ellipse(ctx, x + 110 + i * 90, y + h / 2, 34, 22); ctx.fill(); }
    else if (a.floor === 'hay') { ctx.fillStyle = '#fde68a'; ctx.fillRect(x, y, w, h); ctx.strokeStyle = 'rgba(180,120,20,.25)'; ctx.lineWidth = 2; for (let i = 0; i < 160; i++) { const sx = x + ((i * 197) % w), sy = y + ((i * 89) % h); ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(sx + 18 + (i % 3) * 6, sy - 4 + (i % 5)); ctx.stroke(); } ctx.fillStyle = '#d6b98c'; ctx.fillRect(x, y + h / 2 - 60, w, 120); }
    else if (a.floor === 'dungeon') { ctx.fillStyle = '#3b3054'; ctx.fillRect(x, y, w, h); ctx.fillStyle = '#2e2544'; for (let r = 0; r * 70 < h; r++) for (let cc = 0; cc * 100 < w; cc++) if ((r + cc) % 2) ctx.fillRect(x + cc * 100, y + r * 70, Math.min(100, w - cc * 100), Math.min(70, h - r * 70)); ctx.fillStyle = 'rgba(74,222,128,.08)'; A.ellipse(ctx, x + w / 2, y + h / 2, w * 0.4, h * 0.3); ctx.fill(); }
    else if (a.floor === 'tower') { ctx.fillStyle = '#d6d3d1'; ctx.fillRect(x, y, w, h); const cx = x + w / 2, cy = y + h / 2; for (let r = 5; r >= 0; r--) { ctx.fillStyle = r % 2 ? '#c7c2bd' : '#d6d3d1'; A.ellipse(ctx, cx, cy, 60 + r * 48, 44 + r * 36); ctx.fill(); } ctx.fillStyle = '#1e3a8a'; A.ellipse(ctx, cx, cy, 130, 92); ctx.fill(); ctx.fillStyle = '#fde047'; for (let i = 0; i < 8; i++) { const ang = (i / 8) * Math.PI * 2 + t * 0.1; A.starPath(ctx, cx + Math.cos(ang) * 90, cy + Math.sin(ang) * 62, 8, 3.5, 5); ctx.fill(); } A.starPath(ctx, cx, cy, 20, 9, 5); ctx.fill(); }
    else if (a.floor === 'stairsDown' || a.floor === 'stairsUp') { const down = a.floor === 'stairsDown'; for (let i = 0; i * 34 < h; i++) { const k = i / (h / 34); const sh = down ? 0.75 - k * 0.45 : 0.45 + k * 0.4; ctx.fillStyle = `rgb(${Math.round(203 * sh)},${Math.round(213 * sh)},${Math.round(225 * sh)})`; ctx.fillRect(x, y + i * 34, w, 34); ctx.fillStyle = 'rgba(0,0,0,.25)'; ctx.fillRect(x, y + i * 34 + 28, w, 6); } }
  }
  function wallNorth(ctx, s, t) {
    const x = s.x0, w = s.x1 - s.x0, y = s.y; const dark = s.a.floor === 'dungeon' || s.a.floor === 'dark' || s.a.id === 'c_lab' || s.a.id === 'c_south';
    bricks(ctx, x, y - WALL_H, w, WALL_H, dark ? '#4c4358' : STONE.mid, dark ? '#5b5169' : STONE.light, 100, 42);
    const g = ctx.createLinearGradient(0, y - WALL_H, 0, y); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,.28)'); ctx.fillStyle = g; ctx.fillRect(x, y - WALL_H, w, WALL_H);
    ctx.fillStyle = dark ? '#6b6178' : STONE.light; ctx.fillRect(x - T, y - WALL_H - T, w + 2 * T, T); ctx.fillStyle = 'rgba(0,0,0,.18)'; ctx.fillRect(x - T, y - WALL_H - 6, w + 2 * T, 6);
    ctx.fillStyle = dark ? '#7c7290' : '#e7e5e4'; for (let i = 0; i * 60 < w + 2 * T; i++) ctx.fillRect(x - T + i * 60, y - WALL_H - T - 14, 32, 14);
    ctx.fillStyle = 'rgba(0,0,0,.12)'; ctx.fillRect(x, y, w, 10);
    // banners in the great hall, windows with daylight, shelves in the lab, sky windows in the tower
    if (s.a.id === 'hall') { for (let wx = x + 120; wx < s.x1 - 60; wx += 190) { window_(ctx, wx, y - 110, 44, 80, t); } [['#dc2626', x + 60], ['#2563eb', s.x1 - 60]].forEach(([c, bx]) => { ctx.fillStyle = c; ctx.strokeStyle = 'rgba(0,0,0,.3)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(bx - 20, y - WALL_H + 10); ctx.lineTo(bx + 20, y - WALL_H + 10); ctx.lineTo(bx + 20, y - 70); ctx.lineTo(bx, y - 52); ctx.lineTo(bx - 20, y - 70); ctx.closePath(); ctx.fill(); ctx.stroke(); A.emoji(ctx, '🏰', bx, y - 100, 20); }); }
    if (s.a.id === 'tower') { for (let wx = x + 90; wx < s.x1 - 60; wx += 150) window_(ctx, wx, y - 105, 40, 90, t, true); }
    if (s.a.id === 'lab') { ctx.fillStyle = '#5b4636'; ctx.fillRect(x + 30, y - 110, w - 60, 10); ctx.fillRect(x + 30, y - 60, w - 60, 10); ['🧪', '⚗️', '📜', '🔮', '🧴', '🕯️', '📕', '🫙'].forEach((e, i) => A.emoji(ctx, e, x + 60 + ((i * 87) % (w - 120)), y - 128 + (i % 2) * 50, 30)); }
    if (s.a.id === 'green') { ctx.fillStyle = 'rgba(186,230,253,.5)'; ctx.fillRect(x, y - WALL_H, w, WALL_H - 40); ctx.strokeStyle = 'rgba(255,255,255,.7)'; ctx.lineWidth = 6; for (let wx = x; wx <= s.x1; wx += 120) { ctx.beginPath(); ctx.moveTo(wx, y - WALL_H); ctx.lineTo(wx, y - 40); ctx.stroke(); } ctx.beginPath(); ctx.moveTo(x, y - 100); ctx.lineTo(s.x1, y - 100); ctx.stroke(); }
    if (s.a.id === 'zoo') { ctx.fillStyle = '#a16207'; for (let wx = x + 20; wx < s.x1 - 10; wx += 70) ctx.fillRect(wx, y - WALL_H + 20, 16, WALL_H - 30); ctx.fillRect(x, y - 120, w, 12); ctx.fillRect(x, y - 60, w, 12); }
    if (s.a.id === 'vault') { ctx.fillStyle = '#78716c'; for (let wx = x + 40; wx < s.x1 - 20; wx += 40) ctx.fillRect(wx, y - WALL_H + 20, 10, WALL_H - 30); ctx.fillRect(x + 20, y - WALL_H + 40, w - 40, 8); ctx.fillRect(x + 20, y - 60, w - 40, 8); }
    TORCHES.forEach(([tx, ty]) => { if (ty === y && tx > x && tx < s.x1) torch(ctx, tx, y - 95, t); });
  }
  function window_(ctx, x, y, w, h, t, sky) {
    ctx.save(); ctx.fillStyle = '#57534e'; A.roundRect(ctx, x - w / 2 - 8, y - h / 2 - 8, w + 16, h + 16, w / 2 + 8); ctx.fill();
    A.roundRect(ctx, x - w / 2, y - h / 2, w, h, w / 2); ctx.clip(); const g = ctx.createLinearGradient(0, y - h / 2, 0, y + h / 2); g.addColorStop(0, sky ? '#1e3a8a' : '#7dd3fc'); g.addColorStop(1, sky ? '#60a5fa' : '#bae6fd'); ctx.fillStyle = g; ctx.fillRect(x - w, y - h, w * 2, h * 2);
    if (sky) { for (let i = 0; i < 5; i++) { ctx.fillStyle = `rgba(255,255,255,${0.5 + Math.sin(t * 3 + i + x) * 0.4})`; A.starPath(ctx, x - w / 2 + ((i * 37 + x) % w), y - h / 2 + ((i * 23) % (h / 2)), 3, 1.5, 4); ctx.fill(); } } A.cloud(ctx, x - w / 2 + ((t * 12 + x) % (w + 60)) - 30, y + 8, 8, 0.9);
    ctx.restore(); ctx.fillStyle = '#57534e'; ctx.fillRect(x - 3, y - h / 2, 6, h);
  }
  function torch(ctx, x, y, t) {
    ctx.fillStyle = '#57534e'; A.roundRect(ctx, x - 6, y, 12, 40, 4); ctx.fill(); ctx.fillStyle = '#78350f'; A.roundRect(ctx, x - 10, y - 6, 20, 14, 5); ctx.fill();
    const f = Math.sin(t * 14 + x) * 3, f2 = Math.cos(t * 9 + x) * 2; ctx.fillStyle = '#f97316'; ctx.beginPath(); ctx.moveTo(x - 12, y - 4); ctx.quadraticCurveTo(x - 14 + f2, y - 30, x + f, y - 44); ctx.quadraticCurveTo(x + 14 + f2, y - 30, x + 12, y - 4); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#fde047'; ctx.beginPath(); ctx.moveTo(x - 6, y - 4); ctx.quadraticCurveTo(x - 6 + f2, y - 20, x + f * 0.5, y - 30); ctx.quadraticCurveTo(x + 6 + f2, y - 20, x + 6, y - 4); ctx.closePath(); ctx.fill();
  }
  function wallSide(ctx, s) {
    const x = s.side === 'w' ? s.x - T : s.x, y0 = s.y0, y1 = s.y1; const dark = s.a.floor === 'dungeon' || s.a.floor === 'dark' || s.a.id === 'c_lab' || s.a.id === 'c_south';
    ctx.fillStyle = dark ? '#6b6178' : STONE.light; ctx.fillRect(x, y0 - WALL_H - T, T, y1 - y0 + WALL_H + T);
    ctx.fillStyle = 'rgba(0,0,0,.18)'; ctx.fillRect(s.side === 'w' ? x + T - 5 : x, y0 - WALL_H - T, 5, y1 - y0 + WALL_H + T);
    ctx.fillStyle = dark ? '#7c7290' : '#e7e5e4'; for (let i = 0; i * 60 < y1 - y0 + WALL_H; i++) ctx.fillRect(x + 4, y0 - WALL_H - T + i * 60, T - 8, 26);
    ctx.fillStyle = dark ? '#4c4358' : STONE.mid; ctx.fillRect(x, y1, T, 50); ctx.fillStyle = 'rgba(0,0,0,.25)'; ctx.fillRect(x, y1 + 44, T, 6);
  }
  function wallSouth(ctx, s) {
    const x = s.x0, w = s.x1 - s.x0, y = s.y; const dark = s.a.floor === 'dungeon' || s.a.floor === 'dark' || s.a.id === 'c_lab' || s.a.id === 'c_south';
    ctx.fillStyle = dark ? '#6b6178' : STONE.light; ctx.fillRect(x - T, y - 6, w + 2 * T, T); ctx.fillStyle = dark ? '#7c7290' : '#e7e5e4'; for (let i = 0; i * 60 < w + 2 * T; i++) ctx.fillRect(x - T + i * 60, y - 20, 32, 14);
    bricks(ctx, x - T, y + T - 6, w + 2 * T, 50, dark ? '#4c4358' : STONE.mid, dark ? '#5b5169' : STONE.light, 100, 25); ctx.fillStyle = 'rgba(0,0,0,.25)'; ctx.fillRect(x - T, y + T + 38, w + 2 * T, 6);
    if (s.a.id === 'hall' && x < 1700 && s.x1 > 1800) { ctx.fillStyle = '#92400e'; ctx.strokeStyle = 'rgba(0,0,0,.4)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(1660, y + T + 40); ctx.lineTo(1660, y + 10); ctx.arc(1750, y + 10, 90, Math.PI, 0); ctx.lineTo(1840, y + T + 40); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.strokeStyle = '#78350f'; ctx.lineWidth = 4; [-40, 0, 40].forEach((dx) => { ctx.beginPath(); ctx.moveTo(1750 + dx, y - 70 + Math.abs(dx) * 0.5); ctx.lineTo(1750 + dx, y + T + 36); ctx.stroke(); }); A.emoji(ctx, '🛡️', 1750, y + 30, 30); }
  }
  function pillar(ctx, x, y, h) {
    ctx.fillStyle = 'rgba(0,0,0,.2)'; A.ellipse(ctx, x + 10, y + 4, 44, 16); ctx.fill();
    ctx.fillStyle = STONE.mid; A.roundRect(ctx, x - 40, y - 16, 80, 26, 8); ctx.fill();
    const g = ctx.createLinearGradient(x - 28, 0, x + 28, 0); g.addColorStop(0, '#a8a29e'); g.addColorStop(0.35, '#e7e5e4'); g.addColorStop(1, '#78716c'); ctx.fillStyle = g; ctx.fillRect(x - 28, y - h, 56, h - 8);
    ctx.fillStyle = STONE.light; A.roundRect(ctx, x - 40, y - h - 24, 80, 26, 8); ctx.fill(); ctx.fillStyle = 'rgba(0,0,0,.15)'; ctx.fillRect(x - 40, y - h - 2, 80, 4);
  }
  function throne(ctx, x, y, t) {
    ctx.fillStyle = 'rgba(0,0,0,.2)'; A.ellipse(ctx, x, y + 6, 90, 22); ctx.fill();
    ctx.fillStyle = '#b45309'; A.roundRect(ctx, x - 70, y - 40, 140, 44, 10); ctx.fill(); ctx.fillStyle = '#fbbf24'; A.roundRect(ctx, x - 62, y - 170, 124, 140, 30); ctx.fill(); ctx.strokeStyle = 'rgba(120,53,15,.6)'; ctx.lineWidth = 4; A.roundRect(ctx, x - 62, y - 170, 124, 140, 30); ctx.stroke();
    ctx.fillStyle = '#dc2626'; A.roundRect(ctx, x - 48, y - 150, 96, 110, 20); ctx.fill(); ctx.fillStyle = '#7f1d1d'; A.roundRect(ctx, x - 60, y - 60, 120, 30, 12); ctx.fill();
    ctx.fillStyle = '#fde047'; [[-50, -150], [50, -150]].forEach(([dx, dy]) => { A.circle(ctx, x + dx, y + dy, 9); ctx.fill(); }); A.emoji(ctx, '👑', x, y - 185 + Math.sin(t * 2) * 3, 40);
  }
  function pedestal(ctx, x, y, emoji, has, t) {
    ctx.fillStyle = 'rgba(0,0,0,.18)'; A.ellipse(ctx, x, y + 3, 34, 12); ctx.fill(); ctx.fillStyle = STONE.mid; A.roundRect(ctx, x - 26, y - 60, 52, 62, 8); ctx.fill(); ctx.fillStyle = STONE.light; A.roundRect(ctx, x - 32, y - 70, 64, 16, 6); ctx.fill(); ctx.fillStyle = 'rgba(0,0,0,.12)'; A.roundRect(ctx, x - 32, y - 8, 64, 10, 4); ctx.fill();
    if (has) { ctx.fillStyle = `rgba(253,224,71,${0.25 + Math.sin(t * 3 + x) * 0.15})`; A.circle(ctx, x, y - 100, 36); ctx.fill(); A.emoji(ctx, emoji, x, y - 100 + Math.sin(t * 2 + x) * 3, 40); } else A.emoji(ctx, '❔', x, y - 100, 30, { alpha: 0.35 });
  }
  function cauldron(ctx, x, y, t) {
    ctx.fillStyle = 'rgba(0,0,0,.25)'; A.ellipse(ctx, x, y + 4, 70, 20); ctx.fill(); ctx.fillStyle = '#f97316'; for (let i = -2; i <= 2; i++) { const f = Math.sin(t * 12 + i) * 6; ctx.beginPath(); ctx.moveTo(x + i * 18 - 8, y); ctx.quadraticCurveTo(x + i * 18 + f, y - 36, x + i * 18 + 8, y); ctx.fill(); }
    ctx.fillStyle = '#1f2937'; A.ellipse(ctx, x, y - 60, 66, 50); ctx.fill(); ctx.fillStyle = '#374151'; A.ellipse(ctx, x, y - 92, 62, 18); ctx.fill(); ctx.fillStyle = '#4ade80'; A.ellipse(ctx, x, y - 92, 52, 12); ctx.fill();
    for (let i = 0; i < 5; i++) { const ph = (t * 0.7 + i * 0.2) % 1; ctx.fillStyle = `rgba(134,239,172,${1 - ph})`; A.circle(ctx, x - 30 + i * 15 + Math.sin(t + i) * 5, y - 100 - ph * 60, 5 + i); ctx.fill(); }
  }
  function telescope(ctx, x, y, t) {
    ctx.fillStyle = 'rgba(0,0,0,.2)'; A.ellipse(ctx, x, y + 3, 50, 14); ctx.fill(); ctx.strokeStyle = '#57534e'; ctx.lineWidth = 8; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(x, y - 90); ctx.lineTo(x - 36, y); ctx.moveTo(x, y - 90); ctx.lineTo(x + 36, y); ctx.moveTo(x, y - 90); ctx.lineTo(x, y - 10); ctx.stroke();
    ctx.save(); ctx.translate(x, y - 100); ctx.rotate(-0.7 + Math.sin(t * 0.5) * 0.05); ctx.fillStyle = '#b45309'; A.roundRect(ctx, -20, -18, 130, 36, 12); ctx.fill(); ctx.fillStyle = '#fbbf24'; A.roundRect(ctx, 90, -24, 30, 48, 10); ctx.fill(); ctx.fillStyle = '#7dd3fc'; A.circle(ctx, 118, 0, 12); ctx.fill(); ctx.restore();
  }
  function fence(ctx, p) { ctx.fillStyle = '#a16207'; ctx.strokeStyle = 'rgba(0,0,0,.3)'; ctx.lineWidth = 2; for (let x = p.x; x <= p.x + p.w; x += 60) { ctx.fillRect(x - 6, p.y - 40, 12, 46); ctx.fillRect(x - 6, p.y + p.h - 40, 12, 46); } [p.y, p.y + p.h].forEach((yy) => { ctx.fillRect(p.x, yy - 32, p.w, 8); ctx.fillRect(p.x, yy - 14, p.w, 8); }); for (let y = p.y; y <= p.y + p.h; y += 50) { ctx.fillRect(p.x - 6, y - 40, 12, 46); ctx.fillRect(p.x + p.w - 6, y - 40, 12, 46); } }
  function pot(ctx, x, y, s, color, t, seed) { ctx.fillStyle = 'rgba(0,0,0,.15)'; A.ellipse(ctx, x, y + 2, 30 * s, 10 * s); ctx.fill(); ctx.fillStyle = '#c2410c'; ctx.beginPath(); ctx.moveTo(x - 26 * s, y - 40 * s); ctx.lineTo(x - 20 * s, y); ctx.lineTo(x + 20 * s, y); ctx.lineTo(x + 26 * s, y - 40 * s); ctx.closePath(); ctx.fill(); ctx.fillStyle = '#ea580c'; A.roundRect(ctx, x - 30 * s, y - 48 * s, 60 * s, 12 * s, 4); ctx.fill(); A.flower(ctx, x, y - 44 * s, 1.2 * s, color, t, seed); }

  const scene = {
    hud: { home: false }, music: 'kingdom', px: 1750, py: 1740, facing: 1, walking: false, t: 0, cam: { x: 0, y: 0 }, target: null, targetLoc: null, joy: null, near: null, idle: 0, hold: 0, greeted: false, buttons: [], fx: new A.Particles(), companion: { x: 1680, y: 1750 }, critters: [], motes: [], hintLoc: null, hintT: 0, lightCv: null,
    init() {
      this.critters = []; PENS.forEach((p) => p.animals.forEach((e, i) => this.critters.push({ pen: p, e, x: p.x + 60 + Math.random() * (p.w - 120), y: p.y + 40 + Math.random() * (p.h - 80), a: Math.random() * 6, sp: 25 + Math.random() * 25, ph: i })));
      for (let i = 0; i < 6; i++) this.critters.push({ room: ROOMS.green, e: '🦋', x: 300 + Math.random() * 700, y: 1050 + Math.random() * 600, a: Math.random() * 6, sp: 60, fly: true, ph: i });
      this.critters.push({ room: ROOMS.tower, e: '🦉', x: 2650, y: 420, a: 0, sp: 0, ph: 0 }); this.critters.push({ room: ROOMS.hall, e: '🐈', x: 2000, y: 1700, a: 0, sp: 30, ph: 3 });
      this.motes = []; for (let i = 0; i < 40; i++) this.motes.push({ x: Math.random() * MAP_W, y: Math.random() * MAP_H, ph: Math.random() * 6 });
      this.inited = true;
    },
    enter(params) {
      if (!this.inited) this.init();
      const g = G(); this.t = 0; this.target = null; this.targetLoc = null; this.joy = null; this.idle = 0; this.hintLoc = null; this.hold = 0;
      if (params && params.at) { const l = LOCS.find((x) => x.id === params.at); if (l) { this.px = l.x; this.py = l.y + 70; } }
      this.companion = { x: this.px - 70, y: this.py + 10 }; this.cam.x = this.px - g.W / 2; this.cam.y = this.py - g.H / 2; this.clampCam(); this.layout();
      if (!this.greeted) { this.greeted = true; FL.Game.later(() => { if (G().sceneName === 'world') FL.Audio.say('Tap anywhere to walk. Walk to a sign and tap Play!', { interrupt: false }); }, 2500); }
    },
    layout() {
      const g = G();
      this.friendsBtn = new UI.Button({ x: g.W - 110, y: g.H - 110, w: 90, h: 90, emoji: FL.Save.data.companion, color: '#bfdbfe', round: true, emojiSize: 52, onTap: () => UI.showFriends() });
      this.parentBtn = new UI.Button({ x: 18, y: 18, w: 64, h: 64, emoji: '⚙️', color: '#94a3b8', round: true, emojiSize: 32 });
      this.hubBtn = new UI.Button({ x: 18, y: g.H - 82, w: 64, h: 64, emoji: '✨', color: '#c4b5fd', round: true, emojiSize: 30, onTap: () => { location.href = '../../'; } });
      this.playBtn = new UI.Button({ x: 0, y: 0, w: 230, h: 90, label: 'Play!', emoji: '▶️', color: '#4ade80', size: 40, pulse: true, onTap: () => this.enterLoc(this.near) });
      this.buttons = [this.friendsBtn, this.hubBtn];
    },
    resize() { this.layout(); },
    clampCam() { const g = G(); this.cam.x = Math.max(0, Math.min(MAP_W - g.W, this.cam.x)); this.cam.y = Math.max(0, Math.min(MAP_H - g.H, this.cam.y)); },
    toWorld(p) { return { x: p.x + this.cam.x, y: p.y + this.cam.y }; },
    enterLoc(loc) { if (!loc) return; if (!FL.Save.data.visited.includes(loc.id)) { FL.Save.data.visited.push(loc.id); FL.Save.save(); } FL.Audio.sfx.whoosh(); G().go(loc.scene, { from: loc.id }); },
    down(p) {
      this.idle = 0;
      if (this.near && this.playBtn.contains(p.x, p.y)) { UI.pressDown([this.playBtn], p); return; }
      if (UI.pressDown(this.buttons, p)) return;
      if (this.parentBtn.contains(p.x, p.y)) { p.parent = true; this.hold = 0; return; }
      if (!this.joy) this.joy = { id: p.id, ox: p.x, oy: p.y, dx: 0, dy: 0, moved: false };
    },
    move(p) { if (this.joy && p.id === this.joy.id) { let dx = p.x - this.joy.ox, dy = p.y - this.joy.oy; const d = Math.hypot(dx, dy); if (d > 18) this.joy.moved = true; if (d > 70) { dx *= 70 / d; dy *= 70 / d; } this.joy.dx = dx; this.joy.dy = dy; if (this.joy.moved) { this.target = null; this.targetLoc = null; } } },
    cancel(p) { if (this.joy?.id === p.id) this.joy = null; this.hold = 0; },
    up(p) {
      if (p.button) { UI.pressUp([this.playBtn].concat(this.buttons), p); return; }
      if (p.parent) { if (this.hold >= 1.2) UI.showParent(); else UI.toast('Grown-ups: hold the gear for 2 seconds', '⚙️', '#475569'); p.parent = false; return; }
      if (this.joy && p.id === this.joy.id) {
        if (!this.joy.moved) {
          const w = this.toWorld(p);
          const loc = LOCS.find((l) => Math.hypot(l.x - w.x, l.y - w.y) < l.r || (Math.abs(l.x - w.x) < 130 && w.y > l.y - 200 && w.y < l.y + 20));
          if (loc) { this.target = { x: loc.x, y: loc.y + 60 }; this.targetLoc = loc; FL.Audio.sfx.tap(); }
          else { this.target = { x: w.x, y: w.y }; this.targetLoc = null; }
          this.fx.burst(w.x, w.y, { count: 8, type: 'star', colors: ['#fff', '#fde047'], speed: 120, life: 0.5, size: 8, gravity: 0 });
        }
        this.joy = null;
      }
    },
    key(k) { this.idle = 0; if ((k === 'Enter' || k === ' ') && this.near) this.enterLoc(this.near); if (k === 'f') UI.showFriends(); const n = parseInt(k, 10); if (n >= 1 && n <= LOCS.length) { const l = LOCS[n - 1]; this.px = l.x; this.py = l.y + 70; } },
    update(dt) {
      const g = G(); this.t += dt; this.idle += dt; const t = this.t;
      let vx = 0, vy = 0; const k = g.keys;
      if (k.ArrowLeft || k.a) vx -= 1; if (k.ArrowRight || k.d) vx += 1; if (k.ArrowUp || k.w) vy -= 1; if (k.ArrowDown || k.s) vy += 1;
      if (vx || vy) { this.target = null; this.targetLoc = null; this.idle = 0; }
      if (this.joy && this.joy.moved) { vx = this.joy.dx / 70; vy = this.joy.dy / 70; }
      if (this.target) { const dx = this.target.x - this.px, dy = this.target.y - this.py; const d = Math.hypot(dx, dy); if (d < 8) { if (this.targetLoc) { const l = this.targetLoc; this.targetLoc = null; this.target = null; this.enterLoc(l); return; } this.target = null; } else { vx = dx / d; vy = dy / d; } }
      const m = Math.hypot(vx, vy); if (m > 1) { vx /= m; vy /= m; }
      this.walking = m > 0.05;
      if (this.walking) {
        const speed = 300; const nx = this.px + vx * speed * dt, ny = this.py + vy * speed * dt; let moved = false;
        if (walkable(nx, this.py)) { this.px = nx; moved = true; } if (walkable(this.px, ny)) { this.py = ny; moved = true; }
        if (!moved && this.target) { this.stuck = (this.stuck || 0) + dt; if (this.stuck > 0.6) { this.stuck = 0; this.target = null; this.targetLoc = null; } } else this.stuck = 0;
        if (Math.abs(vx) > 0.1) this.facing = vx > 0 ? 1 : -1;
        if (Math.random() < dt * 3) this.fx.burst(this.px - this.facing * 10, this.py, { count: 1, colors: ['rgba(255,255,255,.6)'], speed: 30, life: 0.5, size: 8, gravity: -20 });
      }
      const cx = this.px - this.facing * 70, cy = this.py + 12; this.companion.x += (cx - this.companion.x) * Math.min(1, dt * 4); this.companion.y += (cy - this.companion.y) * Math.min(1, dt * 4);
      this.cam.x += (this.px - g.W / 2 - this.cam.x) * Math.min(1, dt * 5); this.cam.y += (this.py - g.H / 2 - 40 - this.cam.y) * Math.min(1, dt * 5); this.clampCam();
      const prev = this.near; this.near = LOCS.find((l) => Math.hypot(l.x - this.px, l.y - this.py) < l.r) || null;
      if (this.near && this.near !== prev) { FL.Audio.sfx.sparkle(); FL.Audio.say(`${this.near.name}! ${this.near.hint}`); }
      if (this.near) { this.playBtn.x = this.near.x - this.cam.x - 115; this.playBtn.y = this.near.y - this.cam.y - 270; }
      const room = roomAt(this.px, this.py); if (room && room !== this.room) { this.room = room; if (room.id !== 'hall' && !this.greetedRooms) this.greetedRooms = {}; }
      for (const p of g.pointers.values()) if (p.parent) this.hold += dt;
      this.critters.forEach((b) => { if (b.sp === 0) return; b.a += (Math.random() - 0.5) * dt * 3; b.x += Math.cos(b.a) * b.sp * dt; b.y += Math.sin(b.a) * b.sp * dt; const r = b.pen ? { x: b.pen.x + 40, y: b.pen.y + 20, x1: b.pen.x + b.pen.w - 40, y1: b.pen.y + b.pen.h - 20 } : { x: b.room.x + 80, y: b.room.y + 60, x1: b.room.x1 - 80, y1: b.room.y1 - 80 }; if (b.x < r.x || b.x > r.x1 || b.y < r.y || b.y > r.y1) { b.a += Math.PI; b.x = Math.max(r.x, Math.min(r.x1, b.x)); b.y = Math.max(r.y, Math.min(r.y1, b.y)); } });
      this.fx.update(dt);
      if (this.idle > 14) { this.idle = 0; const l = LOCS.find((x) => !FL.Save.data.visited.includes(x.id)) || LOCS[Math.floor(Math.random() * LOCS.length)]; this.hintLoc = l; this.hintT = 5; FL.Audio.say(`Let's go to the ${l.name}!`); }
      if (this.hintT > 0) { this.hintT -= dt; if (this.hintT <= 0) this.hintLoc = null; }
      this.friendsBtn.emoji = FL.Save.data.companion; void t;
    },
    drawLandmark(ctx, l, t) {
      switch (l.id) {
        case 'tower': telescope(ctx, l.x + 130, l.y - 10, t); break;
        case 'greenhouse': pot(ctx, l.x - 110, l.y - 10, 1.1, '#f472b6', t, 1); pot(ctx, l.x + 120, l.y - 6, 1.2, '#facc15', t, 2); A.tree(ctx, l.x + 230, l.y - 20, 0.9, 1, t); break;
        case 'lab': cauldron(ctx, l.x + 140, l.y - 10, t); break;
        case 'menagerie': A.emoji(ctx, '🪣', l.x - 110, l.y - 30, 44); A.emoji(ctx, '🌾', l.x + 120, l.y - 30, 50); break;
        case 'vault': { ctx.fillStyle = 'rgba(0,0,0,.2)'; A.ellipse(ctx, l.x + 150, l.y, 60, 16); ctx.fill(); A.emoji(ctx, '🧰', l.x + 150, l.y - 40, 70); A.emoji(ctx, '🪙', l.x - 120, l.y - 24, 46); A.emoji(ctx, '💎', l.x - 160, l.y - 40, 36); break; }
        default: break;
      }
    },
    draw(ctx) {
      const g = G(); const t = this.t; const cx = this.cam.x, cy = this.cam.y; const vis = (x, y, pad) => x > cx - (pad || 300) && x < cx + g.W + (pad || 300) && y > cy - (pad || 300) - WALL_H && y < cy + g.H + (pad || 300);
      // void between rooms: dark rock
      bricks(ctx, 0, 0, g.W, g.H, '#1c1917', '#292524', 120 + 0, 60);
      ctx.save(); ctx.translate(-cx, -cy);
      // floors: corridors first, then rooms cover the corridor stubs
      CORS.forEach((a) => { if (vis(a.x + a.w / 2, a.y + a.h / 2, Math.max(a.w, a.h))) floor(ctx, a, t); });
      Object.values(ROOMS).forEach((a) => { if (vis(a.x + a.w / 2, a.y + a.h / 2, Math.max(a.w, a.h))) floor(ctx, a, t); });
      // floor details: hall carpet, light shafts, pens, greenhouse beds
      ctx.fillStyle = '#b91c1c'; ctx.fillRect(1650, 1010, 200, 830); ctx.fillStyle = '#fbbf24'; ctx.fillRect(1650, 1010, 8, 830); ctx.fillRect(1842, 1010, 8, 830);
      ctx.fillStyle = 'rgba(255,255,255,.1)'; for (let wx = 1370; wx < 2190; wx += 190) { ctx.beginPath(); ctx.moveTo(wx - 30, 1000); ctx.lineTo(wx + 30, 1000); ctx.lineTo(wx + 120, 1300); ctx.lineTo(wx - 60, 1300); ctx.closePath(); ctx.fill(); }
      PENS.forEach((p) => { ctx.fillStyle = 'rgba(0,0,0,.06)'; ctx.fillRect(p.x, p.y, p.w, p.h); });
      ctx.fillStyle = '#92400e'; [[220, 1000], [220, 1560], [820, 1000], [820, 1560]].forEach(([bx, by]) => { A.roundRect(ctx, bx, by, 260, 200, 20); ctx.fill(); });
      ctx.fillStyle = 'rgba(56,189,248,.9)'; A.ellipse(ctx, 520, 1120, 140, 70); ctx.fill(); ctx.fillStyle = 'rgba(255,255,255,.35)'; A.ellipse(ctx, 490, 1100, 40, 16); ctx.fill(); A.lilypad(ctx, 470, 1140, 20); A.lilypad(ctx, 590, 1105, 16);
      if (this.target) { ctx.strokeStyle = 'rgba(255,255,255,.8)'; ctx.lineWidth = 4; A.ellipse(ctx, this.target.x, this.target.y, 24 + Math.sin(t * 6) * 4, 10 + Math.sin(t * 6) * 2); ctx.stroke(); }
      // side walls (top bands), then depth-sorted everything else
      SEGS.forEach((s) => { if ((s.side === 'w' || s.side === 'e') && vis(s.x, (s.y0 + s.y1) / 2, Math.abs(s.y1 - s.y0))) wallSide(ctx, s); });
      const items = [];
      SEGS.forEach((s) => { if (s.side === 'n' && vis((s.x0 + s.x1) / 2, s.y, s.x1 - s.x0)) items.push({ y: s.y - 2, f: () => wallNorth(ctx, s, t) }); if (s.side === 's' && vis((s.x0 + s.x1) / 2, s.y, s.x1 - s.x0)) items.push({ y: s.y + 4, f: () => wallSouth(ctx, s) }); });
      DOORS_N.forEach((d) => { if (!vis((d.x0 + d.x1) / 2, d.y)) return; items.push({ y: d.y - 1, f: () => { ctx.fillStyle = STONE.dark; A.roundRect(ctx, d.x0 - 22, d.y - WALL_H - T, 22, WALL_H + T + 8, 6); ctx.fill(); A.roundRect(ctx, d.x1, d.y - WALL_H - T, 22, WALL_H + T + 8, 6); ctx.fill(); ctx.fillStyle = STONE.light; ctx.beginPath(); ctx.moveTo(d.x0 - 22, d.y - WALL_H - T); ctx.quadraticCurveTo((d.x0 + d.x1) / 2, d.y - WALL_H - T - 50, d.x1 + 22, d.y - WALL_H - T); ctx.lineTo(d.x1 + 22, d.y - WALL_H - T + 16); ctx.quadraticCurveTo((d.x0 + d.x1) / 2, d.y - WALL_H - T - 30, d.x0 - 22, d.y - WALL_H - T + 16); ctx.closePath(); ctx.fill(); } }); });
      PILLARS.forEach(([px, py]) => { if (vis(px, py)) items.push({ y: py, f: () => pillar(ctx, px, py, 210) }); });
      items.push({ y: 1090, f: () => throne(ctx, 1750, 1090, t) });
      items.push({ y: 1240, f: () => { A.emoji(ctx, '🛡️', 1300, 1200, 50); A.emoji(ctx, '⚔️', 2200, 1200, 50); } });
      D.TREASURES.slice(0, 8).forEach((tr, i) => { const px = i < 4 ? 1320 + i * 90 : 1870 + (i - 4) * 90, py = 1810; if (vis(px, py)) items.push({ y: py, f: () => pedestal(ctx, px, py, tr.emoji, FL.Save.has('treasure', tr.id), t) }); });
      if (FL.Save.has('treasure', 'egg')) items.push({ y: 1130, f: () => { ctx.fillStyle = '#a16207'; A.ellipse(ctx, 1950, 1130, 46, 18); ctx.fill(); A.emoji(ctx, FL.Save.has('treasure', 'hatched') ? '🐉' : '🥚', 1950, 1105 + (FL.Save.has('treasure', 'hatched') ? Math.sin(t * 4) * 4 : 0), 48); } });
      PENS.forEach((p) => { if (vis(p.x + p.w / 2, p.y + p.h / 2, p.w)) { items.push({ y: p.y, f: () => { ctx.fillStyle = '#a16207'; ctx.fillRect(p.x, p.y - 32, p.w, 8); ctx.fillRect(p.x, p.y - 14, p.w, 8); for (let x = p.x; x <= p.x + p.w; x += 60) ctx.fillRect(x - 6, p.y - 40, 12, 46); } }); items.push({ y: p.y + p.h, f: () => fence(ctx, { x: p.x, y: p.y + p.h, w: p.w, h: 0 }) }); for (let y = p.y + 50; y < p.y + p.h; y += 50) { items.push({ y, f: () => { ctx.fillStyle = '#a16207'; ctx.fillRect(p.x - 6, y - 40, 12, 46); ctx.fillRect(p.x + p.w - 6, y - 40, 12, 46); } }); } items.push({ y: p.y + 30, f: () => A.emoji(ctx, '🌾', p.x + p.w - 50, p.y + 10, 40) }); } });
      // greenhouse plants, tower props, vault gold, lab props
      [[250, 1180, '#f472b6'], [330, 1150, '#facc15'], [420, 1180, '#c084fc'], [860, 1180, '#fb923c'], [940, 1150, '#f87171'], [1020, 1180, '#60a5fa'], [250, 1740, '#fde047'], [340, 1720, '#f472b6'], [860, 1740, '#c084fc'], [950, 1720, '#facc15']].forEach(([px, py, c], i) => { if (vis(px, py)) items.push({ y: py, f: () => pot(ctx, px, py, 1, c, t, i) }); });
      [[300, 1560], [1000, 1560], [1000, 1080]].forEach(([px, py], i) => { if (vis(px, py)) items.push({ y: py, f: () => A.tree(ctx, px, py, 1.1, i, t) }); });
      [[2620, 440], [3040, 440]].forEach(([px, py]) => { if (vis(px, py)) items.push({ y: py, f: () => { A.emoji(ctx, '📚', px, py - 30, 44); } }); });
      [[1560, 520, '🪙'], [1610, 560, '🪙'], [1560, 600, '💰'], [1950, 520, '💎'], [1990, 580, '🪙'], [1930, 640, '🏺'], [1760, 440, '👑']].forEach(([px, py, e]) => { if (vis(px, py)) items.push({ y: py, f: () => { ctx.fillStyle = 'rgba(0,0,0,.2)'; A.ellipse(ctx, px, py, 26, 9); ctx.fill(); A.emoji(ctx, e, px, py - 22, 44); } }); });
      [[330, 2280, '⛓️'], [780, 2280, '⛓️'], [330, 2520, '🕯️'], [780, 2520, '🕯️']].forEach(([px, py, e]) => { if (vis(px, py)) items.push({ y: py, f: () => A.emoji(ctx, e, px, py - 24, 40) }); });
      // signs and landmarks
      LOCS.forEach((l) => { if (!vis(l.x, l.y)) return; const isNear = this.near === l; const hint = this.hintLoc === l; const b = isNear || hint ? Math.abs(Math.sin(t * 6)) * 12 : 0; items.push({ y: l.y - 30, f: () => this.drawLandmark(ctx, l, t) }); items.push({ y: l.y, f: () => A.sign(ctx, l.x, l.y, l.emoji, l.name, { bounce: b, glow: isNear ? 0.5 + Math.sin(t * 6) * 0.4 : hint ? 0.7 : 0, scale: 1 }) }); if (isNear || hint) items.push({ y: l.y - 1, f: () => { ctx.strokeStyle = 'rgba(255,255,255,.7)'; ctx.lineWidth = 5; ctx.setLineDash([16, 14]); ctx.lineDashOffset = -t * 40; A.ellipse(ctx, l.x, l.y + 30, l.r, l.r * 0.45); ctx.stroke(); ctx.setLineDash([]); } }); });
      // creatures, companion, explorer
      this.critters.forEach((b) => { if (!vis(b.x, b.y)) return; items.push({ y: b.fly ? 99999 : b.y, f: () => { if (!b.fly) { ctx.fillStyle = 'rgba(0,0,0,.15)'; A.ellipse(ctx, b.x, b.y, 20, 7); ctx.fill(); } A.emoji(ctx, b.e, b.x, b.y - 22 + (b.fly ? Math.sin(t * 6 + b.ph) * 10 : Math.abs(Math.sin(t * 6 + b.ph)) * (b.sp ? 4 : 0)), b.fly ? 30 : 46, { flip: Math.cos(b.a) < 0 }); } }); });
      items.push({ y: this.companion.y, f: () => { const hop = Math.abs(Math.sin(t * 8)) * (this.walking ? 14 : 3); ctx.fillStyle = 'rgba(0,0,0,.18)'; A.ellipse(ctx, this.companion.x, this.companion.y, 22, 8); ctx.fill(); A.emoji(ctx, FL.Save.data.companion, this.companion.x, this.companion.y - 28 - hop, 56, { flip: this.facing < 0 }); } });
      items.push({ y: this.py, f: () => A.explorer(ctx, this.px, this.py, g.look, { t, walking: this.walking, facing: this.facing, wave: !this.walking && this.idle > 3 && this.idle < 5 }, 1) });
      items.sort((a, b) => a.y - b.y).forEach((i) => i.f());
      // greenhouse glass roof and sun; lab bubbles; dust motes in the hall light
      if (vis(625, 1375, 900)) { const r = ROOMS.green; ctx.save(); ctx.beginPath(); ctx.rect(r.x - T, r.y - WALL_H - T, r.w + 2 * T, r.h + WALL_H + T); ctx.clip(); ctx.strokeStyle = 'rgba(255,255,255,.28)'; ctx.lineWidth = 10; for (let x = r.x - T; x <= r.x1 + T; x += 150) { ctx.beginPath(); ctx.moveTo(x, r.y - WALL_H - T); ctx.lineTo(x, r.y1); ctx.stroke(); } for (let y = r.y - WALL_H - T; y <= r.y1; y += 150) { ctx.beginPath(); ctx.moveTo(r.x - T, y); ctx.lineTo(r.x1 + T, y); ctx.stroke(); } ctx.fillStyle = 'rgba(253,224,71,.08)'; ctx.beginPath(); ctx.moveTo(r.x + 100, r.y - WALL_H); ctx.lineTo(r.x + 400, r.y - WALL_H); ctx.lineTo(r.x + 700, r.y1); ctx.lineTo(r.x + 250, r.y1); ctx.closePath(); ctx.fill(); ctx.restore(); }
      this.motes.forEach((mt) => { if (!vis(mt.x, mt.y, 0)) return; const a = roomAt(mt.x, mt.y); if (!a) return; const e = a.id === 'lab' ? `rgba(134,239,172,${0.3 + Math.sin(t * 2 + mt.ph) * 0.25})` : a.id === 'vault' ? `rgba(253,224,71,${0.4 + Math.sin(t * 4 + mt.ph) * 0.4})` : `rgba(255,255,255,${0.25 + Math.sin(t * 1.5 + mt.ph) * 0.2})`; ctx.fillStyle = e; A.circle(ctx, mt.x + Math.sin(t * 0.7 + mt.ph) * 12, mt.y + Math.cos(t * 0.5 + mt.ph) * 10 - (a.id === 'lab' ? (t * 20 + mt.ph * 50) % 200 : 0), a.id === 'vault' ? 2.5 : 3); ctx.fill(); });
      this.fx.draw(ctx);
      ctx.restore();
      this.drawLighting(ctx, g, t);
      // joystick, prompt, HUD
      if (this.joy && this.joy.moved) { ctx.fillStyle = 'rgba(255,255,255,.3)'; A.circle(ctx, this.joy.ox, this.joy.oy, 78); ctx.fill(); ctx.strokeStyle = 'rgba(255,255,255,.7)'; ctx.lineWidth = 4; ctx.stroke(); ctx.fillStyle = 'rgba(255,255,255,.85)'; A.circle(ctx, this.joy.ox + this.joy.dx, this.joy.oy + this.joy.dy, 38); ctx.fill(); }
      if (this.near) this.playBtn.draw(ctx, t);
      const name = FL.Save.data.name; if (name) A.text(ctx, name, this.px - cx, this.py - cy - 175, { size: 22, color: '#fff', stroke: 'rgba(30,20,80,.6)' });
      if (this.hintLoc && this.near !== this.hintLoc) { const dx = this.hintLoc.x - this.px, dy = this.hintLoc.y - this.py; const ang = Math.atan2(dy, dx); const ax = this.px - cx + Math.cos(ang) * (110 + Math.sin(t * 6) * 10), ay = this.py - cy - 60 + Math.sin(ang) * (70 + Math.sin(t * 6) * 6); ctx.save(); ctx.translate(ax, ay); ctx.rotate(ang); ctx.fillStyle = '#fde047'; ctx.strokeStyle = '#b45309'; ctx.lineWidth = 4; ctx.lineJoin = 'round'; ctx.beginPath(); ctx.moveTo(-26, -18); ctx.lineTo(10, -18); ctx.lineTo(10, -32); ctx.lineTo(38, 0); ctx.lineTo(10, 32); ctx.lineTo(10, 18); ctx.lineTo(-26, 18); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.restore(); }
      const room = roomAt(this.px, this.py); if (room) { const label = room.name; const w = A.measure(ctx, label, 24) + 60; ctx.fillStyle = 'rgba(0,0,0,.35)'; A.roundRect(ctx, g.W / 2 - w / 2, 22, w, 46, 23); ctx.fill(); A.text(ctx, label, g.W / 2, 45, { size: 24, color: '#fff' }); }
      this.buttons.forEach((b) => b.draw(ctx, t)); this.parentBtn.draw(ctx, t);
      if (this.hold > 0 && this.hold < 1.2) { ctx.strokeStyle = '#fde047'; ctx.lineWidth = 6; ctx.beginPath(); ctx.arc(50, 50, 38, -Math.PI / 2, -Math.PI / 2 + (this.hold / 1.2) * Math.PI * 2); ctx.stroke(); }
      const nu = UI.nextUnlock(); if (nu) { const s = FL.Save.data.stars; const prev = UI.prevThreshold(); const frac = Math.max(0, Math.min(1, (s - prev) / Math.max(1, nu.stars - prev))); const w = 190, h = 54, x = g.W - w - 20, y = 96; ctx.fillStyle = 'rgba(0,0,0,.35)'; A.roundRect(ctx, x, y, w, h, 27); ctx.fill(); A.emoji(ctx, nu.emoji, x + 30, y + h / 2, 32); A.text(ctx, `in ${Math.max(0, nu.stars - s)} ⭐`, x + 120, y + 18, { size: 20, color: '#fff' }); ctx.fillStyle = 'rgba(255,255,255,.3)'; A.roundRect(ctx, x + 60, y + 34, w - 76, 10, 5); ctx.fill(); ctx.fillStyle = '#fde047'; A.roundRect(ctx, x + 60, y + 34, (w - 76) * frac, 10, 5); ctx.fill(); }
      this.drawMinimap(ctx, g);
      if (!FL.Save.data.visited.length && this.t < 40 && !this.near) { const l = LOCS.find((x) => x.id === 'vault'); const sx = l.x - cx, sy = l.y - cy - 190 - Math.abs(Math.sin(t * 4)) * 20; if (sx > 0 && sx < g.W && sy > 0 && sy < g.H) A.emoji(ctx, '👇', sx, sy, 70); }
    },
    // Torch-lit darkness: an offscreen canvas holds the shadow, and lights are cut out of it.
    drawLighting(ctx, g, t) {
      const cv = this.lightCv || (this.lightCv = document.createElement('canvas')); const pw = g.canvas.width, ph = g.canvas.height;
      if (cv.width !== pw || cv.height !== ph) { cv.width = pw; cv.height = ph; }
      const lx = cv.getContext('2d'); const k = pw / g.W; lx.setTransform(k, 0, 0, k, 0, 0); lx.globalCompositeOperation = 'source-over'; lx.clearRect(0, 0, g.W, g.H);
      const cx = this.cam.x, cy = this.cam.y;
      lx.fillStyle = 'rgba(12,8,30,.6)'; lx.fillRect(0, 0, g.W, g.H);
      AREAS.forEach((a) => { lx.clearRect(a.x - cx - T, a.y - cy - WALL_H - T - 20, a.w + 2 * T, a.h + WALL_H + 2 * T + 60); });
      AREAS.forEach((a) => { if (!a.ambient) return; lx.fillStyle = `rgba(12,8,30,${a.ambient})`; lx.fillRect(a.x - cx - T, a.y - cy - WALL_H - T - 20, a.w + 2 * T, a.h + WALL_H + 2 * T + 60); });
      lx.globalCompositeOperation = 'destination-out';
      const light = (x, y, r, str) => { if (x < -r || x > g.W + r || y < -r || y > g.H + r) return; const gr = lx.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, `rgba(0,0,0,${str})`); gr.addColorStop(1, 'rgba(0,0,0,0)'); lx.fillStyle = gr; lx.fillRect(x - r, y - r, r * 2, r * 2); };
      TORCHES.forEach(([x, y], i) => light(x - cx, y - cy - 110, 280 + Math.sin(t * 9 + i) * 12, 0.9));
      light(this.px - cx, this.py - cy - 60, 260, 0.85);
      [[560, 2340], [1760, 1750], [2830, 520]].forEach(([x, y]) => light(x - cx, y - cy, 200, 0.6));
      ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.drawImage(cv, 0, 0); ctx.restore();
      // warm glow around torches
      ctx.save(); ctx.globalCompositeOperation = 'lighter'; TORCHES.forEach(([x, y], i) => { const sx = x - cx, sy = y - cy - 110; if (sx < -200 || sx > g.W + 200 || sy < -200 || sy > g.H + 200) return; const gr = ctx.createRadialGradient(sx, sy, 0, sx, sy, 170); gr.addColorStop(0, `rgba(255,150,50,${0.16 + Math.sin(t * 11 + i) * 0.03})`); gr.addColorStop(1, 'rgba(255,120,30,0)'); ctx.fillStyle = gr; ctx.fillRect(sx - 170, sy - 170, 340, 340); }); ctx.restore();
    },
    drawMinimap(ctx, g) {
      const w = 200, h = 150, x = g.W - w - 20, y = 165; const sx = w / MAP_W, sy = h / MAP_H;
      ctx.save(); ctx.globalAlpha = 0.85; ctx.fillStyle = 'rgba(0,0,0,.45)'; A.roundRect(ctx, x - 6, y - 6, w + 12, h + 12, 14); ctx.fill();
      AREAS.forEach((a) => { ctx.fillStyle = a.id in ROOMS ? (this.room === a ? '#fde68a' : '#cbd5e1') : '#94a3b8'; ctx.fillRect(x + a.x * sx, y + a.y * sy, a.w * sx, a.h * sy); });
      LOCS.forEach((l) => A.emoji(ctx, l.emoji, x + l.x * sx, y + l.y * sy, 14, { alpha: FL.Save.data.visited.includes(l.id) ? 1 : 0.7 }));
      ctx.fillStyle = '#ef4444'; A.circle(ctx, x + this.px * sx, y + this.py * sy, 5); ctx.fill(); ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.stroke();
      ctx.restore();
    },
  };
  FL.scenes.world = scene;
  FL.WORLD_LOCS = LOCS;
})();
