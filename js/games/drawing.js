// Art Studio: pick a picture, then follow it step by step. A pencil draws each step on the left
// while she draws along with her finger on the right, then colours it in. Finished pictures go in the gallery.
(function () {
  const A = FL.Art, UI = FL.UI, G = () => FL.Game, DR = () => FL.Drawings;
  const INK = '#374151', ACCENT = '#db2777', GHOST = '#cbd5e1', GHOST_NOW = '#f9a8d4';
  const CRAYONS = [['#1f2937', 'black'], ['#ef4444', 'red'], ['#f97316', 'orange'], ['#facc15', 'yellow'], ['#22c55e', 'green'], ['#3b82f6', 'blue'], ['#a855f7', 'purple'], ['#f472b6', 'pink'], ['#92400e', 'brown']];
  const ERASER = CRAYONS.length;
  const SPEED = 230, PAUSE = 70; // pencil speed in picture units per second; gap between strokes
  const OFF = 800;               // pixel size of the child's drawing layer (the picture is 400 units wide)
  const PRAISE = ['Great job!', 'Nice work!', 'Looking good!', 'Wonderful!', 'You did it!', 'Beautiful!'];

  // ---------- helpers ----------
  function paper(ctx, x, y, S) { ctx.fillStyle = 'rgba(0,0,0,.18)'; A.roundRect(ctx, x, y + 10, S, S, 18); ctx.fill(); ctx.fillStyle = '#fff'; A.roundRect(ctx, x, y, S, S, 18); ctx.fill(); }
  function frame(ctx, x, y, S, color) { ctx.strokeStyle = color; ctx.lineWidth = 7; A.roundRect(ctx, x, y, S, S, 18); ctx.stroke(); }
  function tab(ctx, text, x, y, color, textColor, align) {
    const w = A.measure(ctx, text, 24) + 40, h = 42; const left = align === 'right' ? x - w : x;
    ctx.fillStyle = color; A.roundRect(ctx, left, y, w, h, 21); ctx.fill();
    A.text(ctx, text, left + w / 2, y + h / 2 + 1, { size: 24, color: textColor || '#fff' });
  }
  // Build the canvas path for a flattened shape, stopping after `upto` picture units. Returns the pencil tip.
  function tracePath(ctx, f, upto) {
    const p = f.pts; let tip = { x: p[0], y: p[1] }; ctx.beginPath();
    if (f.dot) { ctx.moveTo(p[0] + f.dot, p[1]); ctx.arc(p[0], p[1], f.dot, 0, Math.PI * 2); return tip; }
    ctx.moveTo(p[0], p[1]); let acc = 0;
    for (let i = 2; i < p.length; i += 2) {
      const dx = p[i] - p[i - 2], dy = p[i + 1] - p[i - 1]; const d = Math.hypot(dx, dy);
      if (upto != null && acc + d > upto) { const k = d ? (upto - acc) / d : 0; tip = { x: p[i - 2] + dx * k, y: p[i - 1] + dy * k }; ctx.lineTo(tip.x, tip.y); return tip; }
      acc += d; tip = { x: p[i], y: p[i + 1] }; ctx.lineTo(tip.x, tip.y);
    }
    return tip;
  }
  function outline(ctx, sh, color, width, upto) { const f = DR().flat(sh); ctx.strokeStyle = color; ctx.fillStyle = color; ctx.lineWidth = width; const tip = tracePath(ctx, f, upto); if (f.dot) ctx.fill(); else ctx.stroke(); return tip; }
  function paint(ctx, sh, alpha) { const f = DR().flat(sh); ctx.save(); ctx.globalAlpha = alpha; ctx.fillStyle = f.fill || '#ddd'; tracePath(ctx, f, null); ctx.closePath(); ctx.fill(); ctx.restore(); }
  function wrap2(ctx, text, maxW, size) { // one or two balanced lines that fit, shrinking the font if needed
    for (let s = size; s >= 20; s -= 2) {
      if (A.measure(ctx, text, s) <= maxW) return { lines: [text], size: s };
      const words = text.split(' '); let best = null;
      for (let i = 1; i < words.length; i++) { const a = words.slice(0, i).join(' '), b = words.slice(i).join(' '); const w = Math.max(A.measure(ctx, a, s), A.measure(ctx, b, s)); if (w <= maxW && (!best || w < best.w)) best = { lines: [a, b], size: s, w }; }
      if (best) return best;
    }
    return { lines: [text], size: 20 };
  }
  function studioBackground(ctx, t) {
    const g = G(); const grad = ctx.createLinearGradient(0, 0, 0, g.H); grad.addColorStop(0, '#ede9fe'); grad.addColorStop(1, '#fce7f3'); ctx.fillStyle = grad; ctx.fillRect(0, 0, g.W, g.H);
    for (let i = 0; i < 22; i++) { const x = (i * 233.7) % g.W, y = (i * 151.3 + t * 12) % g.H; A.emoji(ctx, ['🖍️', '✏️', '🎨', '⭐', '🖌️'][i % 5], x, y, 30, { alpha: 0.18, rot: i }); }
  }

  // ---------- picture chooser ----------
  const pick = {
    t: 0, cards: [], hud: { home: true }, thumbs: {},
    enter() { this.t = 0; this.layout(); this.loadThumbs(); FL.Audio.say('Welcome to the Art Studio! What would you like to draw? Tap a picture!'); },
    loadThumbs() { const d = FL.Save.data.drawings || {}; for (const id in d) { if (!this.thumbs[id] || this.thumbs[id].src !== d[id]) { const img = new Image(); img.src = d[id]; this.thumbs[id] = img; } } },
    layout() {
      const g = G(); const list = DR().list; this.cards = [];
      const cols = 4, rows = Math.ceil(list.length / cols), gap = 22;
      const cw = Math.min(250, (g.W - 80 - (cols - 1) * gap) / cols), ch = Math.min(220, (g.H - 150 - 30 - (rows - 1) * gap) / rows);
      const x0 = g.W / 2 - (cols * cw + (cols - 1) * gap) / 2, y0 = 140; this.x0 = x0;
      list.forEach((d, i) => { const r = Math.floor(i / cols), c = i % cols; this.cards.push(new UI.Button({ x: x0 + c * (cw + gap), y: y0 + r * (ch + gap), w: cw, h: ch, color: d.color, pic: d, onTap: () => { FL.Audio.say(`Let's draw a ${d.name.toLowerCase()}!`); G().go('drawing', { id: d.id }); } })); });
    },
    resize() { this.layout(); },
    down(p) { UI.pressDown(this.cards, p); },
    up(p) { UI.pressUp(this.cards, p); },
    update(dt) { this.t += dt; },
    draw(ctx) {
      const g = G(); const t = this.t; studioBackground(ctx, t);
      UI.banner(ctx, 'What would you like to draw?', { emoji: '🎨', size: 40, color: '#fff', border: '#c084fc' });
      this.cards.forEach((c, i) => {
        const d = c.pic; c.draw(ctx, t); const cx = c.x + c.w / 2; const bob = Math.sin(t * 3 + i) * 3;
        const img = this.thumbs[d.id]; const ok = img && img.complete && img.naturalWidth > 0; const ih = c.h - 92;
        if (ok) { ctx.fillStyle = '#fff'; A.roundRect(ctx, cx - ih / 2, c.y + 14, ih, ih, 12); ctx.fill(); ctx.drawImage(img, cx - ih / 2 + 4, c.y + 18, ih - 8, ih - 8); A.emoji(ctx, '✅', cx + ih / 2 - 4, c.y + 22, 30); }
        else A.emoji(ctx, d.emoji, cx, c.y + 14 + ih / 2 + bob, ih * 0.72);
        A.text(ctx, d.name, cx, c.y + c.h - 52, { size: 28, color: '#3b0764' });
        for (let k = 0; k < d.level; k++) A.emoji(ctx, '✏️', cx + (k - (d.level - 1) / 2) * 24, c.y + c.h - 20, 20);
      });
      if (this.x0 > 210) { A.princess(ctx, this.x0 - 100, g.H - 40, g.look, { t, wave: t % 6 < 2 }, 1); A.emoji(ctx, FL.Save.data.companion, this.x0 - 170, g.H - 60 - Math.abs(Math.sin(t * 5)) * 8, 50); }
    },
  };
  FL.scenes.drawpick = pick;

  // ---------- the lesson ----------
  const lesson = {
    t: 0, hud: { home: true, repeat: true }, pic: null, steps: [], step: 0, prog: 0, stepTotal: 0, anim: false, fillT: 0, stepT: 0, remind: false,
    strokes: [], cur: null, off: null, octx: null, color: 0, eraser: false, thick: true, helper: true, drewOn: null, clearArmed: 0, buttons: [], tools: [], bannerCache: null,
    enter(params) {
      this.t = 0; this.pic = DR().byId(params && params.id) || DR().list[0];
      this.steps = this.pic.steps.concat(this.pic.fills ? [{ say: 'Now colour it in! Use any colours you like, then tap Done.', strokes: [], color: true }] : []);
      this.step = 0; this.strokes = []; this.cur = null; this.drewOn = new Set(); this.color = 0; this.eraser = false; this.thick = true; this.clearArmed = 0; this.bannerCache = null;
      this.helper = FL.Save.data.settings.drawHelper !== false;
      if (!this.off) { this.off = document.createElement('canvas'); this.off.width = this.off.height = OFF; this.octx = this.off.getContext('2d'); }
      this.octx.clearRect(0, 0, OFF, OFF);
      FL.Save.addPlay('drawing');
      this.layout(); this.startStep(true);
    },
    layout() {
      const g = G(); const toolsW = 104, top = 176, rowH = 92, cell = 48, cg = 8;
      const S = Math.floor(Math.min(g.H - top - rowH - 44, (g.W - 40 - 24 - 16 - toolsW) / 2));
      const totalW = S * 2 + 24 + 16 + toolsW; const x0 = Math.round(g.W / 2 - totalW / 2);
      const y0 = Math.round(top + (g.H - top - S - rowH - 16) / 2);
      this.S = S; this.L = { x: x0, y: y0 }; this.R = { x: x0 + S + 24, y: y0 }; this.T = { x: this.R.x + S + 16, y: y0 };
      const by = y0 + S + 14, gap = Math.round(S * 0.02); const wBack = Math.round(S * 0.2), wAgain = Math.round(S * 0.44), wNext = S - wBack - wAgain - gap * 2;
      this.backBtn = new UI.Button({ x: x0, y: by, w: wBack, h: rowH, emoji: '⬅️', color: '#94a3b8', emojiSize: 40, onTap: () => this.back() });
      this.againBtn = new UI.Button({ x: x0 + wBack + gap, y: by, w: wAgain, h: rowH, label: 'Again', emoji: '👀', color: '#fbbf24', size: 28, onTap: () => this.replay() });
      this.nextBtn = new UI.Button({ x: x0 + wBack + wAgain + gap * 2, y: by, w: wNext, h: rowH, label: 'Next', emoji: '➡️', color: '#4ade80', size: 30, pulse: true, onTap: () => this.next() });
      this.helperBtn = new UI.Button({ x: this.R.x + Math.round(S * 0.14), y: by, w: Math.round(S * 0.72), h: rowH, label: 'Helper lines: On', emoji: '✨', color: '#a78bfa', size: 26, onTap: () => this.toggleHelper() });
      this.buttons = [this.backBtn, this.againBtn, this.nextBtn, this.helperBtn];
      this.tools = []; const tx = this.T.x, ty = y0;
      for (let i = 0; i <= ERASER; i++) { const col = i % 2, row = Math.floor(i / 2); const er = i === ERASER; this.tools.push(new UI.Button({ x: tx + col * (cell + cg), y: ty + row * (cell + cg), w: cell, h: cell, round: true, color: er ? '#e5e7eb' : CRAYONS[i][0], emoji: er ? '🧽' : '', emojiSize: 26, tool: i, onTap: () => this.pickTool(i) })); }
      const ty2 = ty + 5 * (cell + cg) + 8; const tw = cell * 2 + cg;
      this.undoBtn = new UI.Button({ x: tx, y: ty2, w: tw, h: cell, emoji: '↩️', color: '#60a5fa', emojiSize: 26, r: 18, onTap: () => this.undo() });
      this.sizeBtn = new UI.Button({ x: tx, y: ty2 + cell + cg, w: tw, h: cell, color: '#fff', r: 18, onTap: () => { this.thick = !this.thick; FL.Audio.sfx.tap(); } });
      this.clearBtn = new UI.Button({ x: tx, y: ty2 + (cell + cg) * 2, w: tw, h: cell, emoji: '🗑️', color: '#f87171', emojiSize: 24, r: 18, onTap: () => this.clear() });
      this.tools.push(this.undoBtn, this.sizeBtn, this.clearBtn);
      this.refreshLabels();
    },
    resize() { this.layout(); this.bannerCache = null; },
    refreshLabels() {
      const st = this.steps[this.step]; const last = this.step === this.steps.length - 1;
      this.nextBtn.label = last ? 'Done!' : 'Next'; this.nextBtn.emoji = last ? '🏆' : '➡️';
      this.backBtn.enabled = this.step > 0; this.againBtn.visible = !st.color;
      this.helperBtn.label = `Helper lines: ${this.helper ? 'On' : 'Off'}`; this.helperBtn.color = this.helper ? '#a78bfa' : '#94a3b8';
    },
    startStep(first, goingBack) {
      const st = this.steps[this.step]; this.prog = 0; this.anim = !st.color; this.fillT = 0; this.stepT = 0; this.remind = false; this.bannerCache = null;
      this.stepTotal = st.strokes.reduce((a, sh) => a + DR().flat(sh).total + PAUSE, 0);
      this.refreshLabels();
      let text = st.say; if (!first && !goingBack && this.drewOn.has(this.step - 1)) text = `${PRAISE[Math.floor(Math.random() * PRAISE.length)]} ${text}`;
      if (first && this.helper) text += ' Watch the pencil, then draw it on your paper. You can trace the dotted lines, or draw it your own way!';
      if (!first) FL.Audio.sfx.whoosh();
      FL.Audio.say(text);
    },
    repeatPrompt() { FL.Audio.say(this.steps[this.step].say); },
    replay() { this.prog = 0; this.anim = true; this.repeatPrompt(); },
    next() { if (this.step >= this.steps.length - 1) this.finish(); else { this.step++; this.startStep(false); } },
    back() { if (this.step > 0) { this.step--; this.startStep(false, true); } },
    toggleHelper() { this.helper = !this.helper; FL.Save.data.settings.drawHelper = this.helper; FL.Save.save(); this.refreshLabels(); },
    pickTool(i) { this.eraser = i === ERASER; if (!this.eraser) this.color = i; FL.Audio.sfx.pop(); },
    undo() { if (this.cur) return; if (this.strokes.pop()) { this.rerender(); FL.Audio.sfx.tap(); } },
    clear() {
      if (this.clearArmed > 0) { this.strokes = []; this.cur = null; this.rerender(); this.clearArmed = 0; UI.toast('All clean! Start again.', '🧽', '#0ea5e9'); FL.Audio.sfx.whoosh(); }
      else { this.clearArmed = 3; UI.toast('Tap the bin again to start over', '🗑️', '#b91c1c'); }
    },
    key(k) { if (k === 'ArrowRight' || k === 'Enter') this.next(); else if (k === 'ArrowLeft') this.back(); else if (k === 'z') this.undo(); else if (k === 'h') this.toggleHelper(); },

    // ---- her drawing layer ----
    inPaper(p) { return p.x >= this.R.x && p.x <= this.R.x + this.S && p.y >= this.R.y && p.y <= this.R.y + this.S; },
    toPic(p) { return { x: ((p.x - this.R.x) / this.S) * 400, y: ((p.y - this.R.y) / this.S) * 400 }; },
    pen(s) { const c = this.octx; const k = OFF / 400; c.lineCap = 'round'; c.lineJoin = 'round'; c.lineWidth = s.w * k; c.globalCompositeOperation = s.color ? 'source-over' : 'destination-out'; c.strokeStyle = s.color || '#000'; c.fillStyle = s.color || '#000'; },
    segment(s, i) { // draw the piece of stroke s that its i-th point adds
      const c = this.octx, k = OFF / 400, p = s.pts; this.pen(s); c.beginPath();
      if (i === 0) { c.arc(p[0] * k, p[1] * k, (s.w * k) / 2, 0, Math.PI * 2); c.fill(); return; }
      if (i === 1) { c.moveTo(p[0] * k, p[1] * k); c.lineTo(p[2] * k, p[3] * k); c.stroke(); return; }
      const ax = p[i * 2 - 4], ay = p[i * 2 - 3], bx = p[i * 2 - 2], by = p[i * 2 - 1], cx = p[i * 2], cy = p[i * 2 + 1];
      c.moveTo(((ax + bx) / 2) * k, ((ay + by) / 2) * k); c.quadraticCurveTo(bx * k, by * k, ((bx + cx) / 2) * k, ((by + cy) / 2) * k); c.stroke();
    },
    finishSegment(s) { const c = this.octx, k = OFF / 400, p = s.pts, n = p.length / 2; if (n < 3) return; this.pen(s); c.beginPath(); c.moveTo(((p[n * 2 - 4] + p[n * 2 - 2]) / 2) * k, ((p[n * 2 - 3] + p[n * 2 - 1]) / 2) * k); c.lineTo(p[n * 2 - 2] * k, p[n * 2 - 1] * k); c.stroke(); },
    rerender() { const c = this.octx; c.globalCompositeOperation = 'source-over'; c.clearRect(0, 0, OFF, OFF); this.strokes.forEach((s) => { for (let i = 0; i < s.pts.length / 2; i++) this.segment(s, i); this.finishSegment(s); }); c.globalCompositeOperation = 'source-over'; },
    addPoint(p) {
      const s = this.cur; const q = this.toPic(p); const n = s.pts.length / 2;
      if (n && Math.hypot(q.x - s.pts[n * 2 - 2], q.y - s.pts[n * 2 - 1]) < 1.5) return;
      s.pts.push(q.x, q.y); this.segment(s, n);
    },
    down(p) {
      if (UI.pressDown(this.buttons.concat(this.tools), p)) return;
      if (this.inPaper(p) && !this.cur) { this.cur = { id: p.id, color: this.eraser ? null : CRAYONS[this.color][0], w: this.eraser ? 28 : this.thick ? 11 : 5, pts: [] }; this.addPoint(p); p.draw = true; }
    },
    move(p) { if (p.draw && this.cur && this.cur.id === p.id) this.addPoint(p); },
    up(p) {
      if (p.button) { UI.pressUp(this.buttons.concat(this.tools), p); return; }
      if (p.draw && this.cur && this.cur.id === p.id) { this.finishSegment(this.cur); this.strokes.push(this.cur); if (this.cur.color) this.drewOn.add(this.step); this.cur = null; this.octx.globalCompositeOperation = 'source-over'; }
    },
    saveThumb() {
      try {
        const c = document.createElement('canvas'); c.width = c.height = 200; const cx = c.getContext('2d');
        cx.fillStyle = '#fff'; cx.fillRect(0, 0, 200, 200); cx.drawImage(this.off, 0, 0, 200, 200);
        FL.Save.data.drawings = FL.Save.data.drawings || {}; FL.Save.data.drawings[this.pic.id] = c.toDataURL('image/png'); FL.Save.save();
      } catch (e) { /* storage full or canvas blocked: the picture just isn't kept */ }
    },
    finish() {
      const ratio = this.drewOn.size / this.steps.length; const stars = ratio >= 0.7 ? 3 : ratio >= 0.3 ? 2 : 1;
      if (this.strokes.some((s) => s.color)) this.saveThumb();
      const name = this.pic.name.toLowerCase(); const id = this.pic.id;
      UI.showResults({ title: `You drew a ${name}!`, subtitle: stars === 3 ? 'What a beautiful picture! It is in your gallery.' : 'Nice! Next time, try drawing along with every step.', stars, emoji: this.pic.emoji,
        again: () => G().go('drawing', { id }), other: () => G().go('drawpick'), otherLabel: 'More', otherEmoji: '🎨', home: () => G().go('world', { at: 'drawing' }) });
    },

    update(dt) {
      this.t += dt; this.stepT += dt; this.clearArmed = Math.max(0, this.clearArmed - dt);
      const st = this.steps[this.step];
      if (this.anim) { this.prog += SPEED * dt; if (this.prog >= this.stepTotal) { this.anim = false; FL.Audio.sfx.sparkle(); } }
      if (st.color) this.fillT = Math.min(1, this.fillT + dt * 1.2);
      if (!this.anim && !st.color && !this.remind && this.stepT > 16 && !this.drewOn.has(this.step)) { this.remind = true; FL.Audio.say('Now you try! Draw it on your paper on the right.'); }
    },

    // ---- drawing the screen ----
    drawDemo(ctx) {
      const { x, y } = this.L, S = this.S; const st = this.steps[this.step]; paper(ctx, x, y, S);
      ctx.save(); A.roundRect(ctx, x, y, S, S, 18); ctx.clip(); ctx.translate(x, y); ctx.scale(S / 400, S / 400); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      if (st.color && this.pic.fills) this.pic.fills.forEach((f) => paint(ctx, f, this.fillT));
      for (let i = 0; i < this.step; i++) this.steps[i].strokes.forEach((sh) => outline(ctx, sh, INK, 5));
      if (!st.color) {
        let off = 0, tip = null;
        for (const sh of st.strokes) {
          const f = DR().flat(sh); const local = this.prog - off; off += f.total + PAUSE;
          if (local < 0) break;
          tip = outline(ctx, sh, ACCENT, 6, local >= f.total ? null : local);
        }
        if (this.anim && tip) A.emoji(ctx, '✏️', tip.x + 19, tip.y - 19, 46);
      } else A.emoji(ctx, '🖍️', 352, 352 + Math.sin(this.t * 4) * 6, 52, { rot: -0.4 });
      ctx.restore();
      frame(ctx, x, y, S, '#fbbf24');
    },
    drawPaper(ctx) {
      const { x, y } = this.R, S = this.S; paper(ctx, x, y, S);
      if (this.helper) {
        ctx.save(); A.roundRect(ctx, x, y, S, S, 18); ctx.clip(); ctx.translate(x, y); ctx.scale(S / 400, S / 400); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
        for (let i = 0; i <= this.step; i++) { const st = this.steps[i]; if (st.color) continue; const now = i === this.step; ctx.setLineDash(now ? [7, 7] : []); st.strokes.forEach((sh) => outline(ctx, sh, now ? GHOST_NOW : GHOST, now ? 5 : 4)); }
        ctx.restore();
      }
      ctx.save(); A.roundRect(ctx, x, y, S, S, 18); ctx.clip(); ctx.drawImage(this.off, x, y, S, S); ctx.restore();
      frame(ctx, x, y, S, '#f472b6');
    },
    drawTools(ctx) {
      const t = this.t; this.tools.forEach((b) => b.draw(ctx, t));
      const sel = this.tools[this.eraser ? ERASER : this.color]; ctx.strokeStyle = '#fff'; ctx.lineWidth = 4; A.circle(ctx, sel.x + sel.w / 2, sel.y + sel.h / 2, sel.w / 2 + 3); ctx.stroke(); ctx.strokeStyle = '#1f2937'; ctx.lineWidth = 2; A.circle(ctx, sel.x + sel.w / 2, sel.y + sel.h / 2, sel.w / 2 + 6); ctx.stroke();
      const sb = this.sizeBtn; ctx.fillStyle = this.eraser ? '#94a3b8' : CRAYONS[this.color][0]; A.circle(ctx, sb.x + sb.w / 2, sb.y + sb.h / 2, this.thick ? 10 : 4); ctx.fill();
    },
    draw(ctx) {
      const g = G(); const t = this.t; const st = this.steps[this.step]; studioBackground(ctx, t);
      // instruction banner (up to two lines) between the HUD buttons and the star counter
      const maxW = g.W - 440; if (!this.bannerCache) this.bannerCache = wrap2(ctx, st.say, maxW - 150, 36);
      const bc = this.bannerCache; const bw = Math.max(560, Math.max(...bc.lines.map((l) => A.measure(ctx, l, bc.size))) + 170), bh = 104; const bx = g.W / 2 - bw / 2, byy = 18;
      ctx.fillStyle = 'rgba(0,0,0,.18)'; A.roundRect(ctx, bx, byy + 6, bw, bh, 40); ctx.fill(); ctx.fillStyle = 'rgba(255,255,255,.94)'; A.roundRect(ctx, bx, byy, bw, bh, 40); ctx.fill(); ctx.strokeStyle = '#f9a8d4'; ctx.lineWidth = 5; A.roundRect(ctx, bx, byy, bw, bh, 40); ctx.stroke();
      A.emoji(ctx, this.pic.emoji, bx + 62, byy + bh / 2, 60);
      bc.lines.forEach((l, i) => A.text(ctx, l, bx + bw / 2 + 40, byy + bh / 2 + (i - (bc.lines.length - 1) / 2) * (bc.size + 6) + 2, { size: bc.size, color: '#7c3aed' }));
      // panels with their tabs
      this.drawDemo(ctx); this.drawPaper(ctx);
      tab(ctx, `Step ${this.step + 1} of ${this.steps.length}`, this.L.x, this.L.y - 48, '#7c3aed');
      tab(ctx, st.color ? '🌈 Colour it in!' : this.anim ? '👀 Watch me...' : '✅ Now you try!', this.L.x + this.S, this.L.y - 48, this.anim || st.color ? '#fbbf24' : '#4ade80', '#3b0764', 'right');
      tab(ctx, '🎨 Your turn', this.R.x, this.R.y - 48, '#f472b6');
      if (!this.anim && !st.color && !this.drewOn.has(this.step) && this.stepT > 3) A.emoji(ctx, '👉', this.R.x - 34, this.R.y + this.S / 2 + Math.sin(t * 6) * 8, 56);
      this.buttons.forEach((b) => b.draw(ctx, t)); this.drawTools(ctx);
    },
  };
  FL.scenes.drawing = lesson;
})();
