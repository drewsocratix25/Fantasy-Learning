// Buttons, HUD, overlays (results, friends, parent panel), toasts.
(function () {
  const UI = {};
  const Art = () => FL.Art;

  class Button {
    constructor(o) {
      Object.assign(this, { x: 0, y: 0, w: 220, h: 84, label: '', emoji: '', color: '#f472b6', textColor: '#fff', size: 34, r: 26, visible: true, enabled: true, pressed: false, pulse: false, round: false, onTap: null, emojiSize: null, badge: null }, o);
    }
    contains(px, py) { return this.visible && this.enabled && px >= this.x && px <= this.x + this.w && py >= this.y && py <= this.y + this.h; }
    draw(ctx, t) {
      if (!this.visible) return; const A = Art(); if (this.custom) { this.custom(ctx, this, t); return; }
      ctx.save();
      const cx = this.x + this.w / 2, cy = this.y + this.h / 2;
      let sc = this.pressed ? 0.94 : 1; if (this.pulse) sc *= 1 + Math.sin((t || 0) * 5) * 0.03;
      ctx.translate(cx, cy); ctx.scale(sc, sc); ctx.translate(-cx, -cy);
      if (!this.enabled) ctx.globalAlpha = 0.45;
      const r = this.round ? Math.min(this.w, this.h) / 2 : this.r;
      const dark = A.shade(this.color, -0.28);
      ctx.fillStyle = 'rgba(0,0,0,.18)'; A.roundRect(ctx, this.x, this.y + 8, this.w, this.h, r); ctx.fill();
      ctx.fillStyle = dark; A.roundRect(ctx, this.x, this.y + (this.pressed ? 2 : 6), this.w, this.h, r); ctx.fill();
      const g = ctx.createLinearGradient(0, this.y, 0, this.y + this.h); g.addColorStop(0, A.shade(this.color, 0.22)); g.addColorStop(1, this.color);
      ctx.fillStyle = g; A.roundRect(ctx, this.x, this.y + (this.pressed ? 2 : 0), this.w, this.h, r); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,.35)'; A.roundRect(ctx, this.x + 8, this.y + 5 + (this.pressed ? 2 : 0), this.w - 16, this.h * 0.32, r * 0.8); ctx.fill();
      const oy = this.pressed ? 2 : 0;
      if (this.emoji && this.label) {
        const lw = A.measure(ctx, this.label, this.size); const es = this.emojiSize || this.size * 1.25; const total = lw + es + 12; const sx = cx - total / 2;
        A.emoji(ctx, this.emoji, sx + es / 2, cy + oy, es);
        A.text(ctx, this.label, sx + es + 12 + lw / 2, cy + oy, { size: this.size, color: this.textColor, stroke: this.textStroke || 'rgba(0,0,0,.25)', strokeWidth: 4 });
      } else if (this.emoji) A.emoji(ctx, this.emoji, cx, cy + oy, this.emojiSize || this.size * 1.4);
      else A.text(ctx, this.label, cx, cy + oy, { size: this.size, color: this.textColor, stroke: this.textStroke || 'rgba(0,0,0,.25)', strokeWidth: 4 });
      if (this.badge) { ctx.fillStyle = '#ef4444'; A.circle(ctx, this.x + this.w - 6, this.y + 6, 16); ctx.fill(); A.text(ctx, String(this.badge), this.x + this.w - 6, this.y + 6, { size: 20 }); }
      ctx.restore();
    }
  }
  UI.Button = Button;
  UI.pressDown = function (buttons, p) { for (const b of buttons) { if (b.contains(p.x, p.y)) { b.pressed = true; p.button = b; return b; } } return null; };
  UI.pressUp = function (buttons, p) {
    let fired = null;
    for (const b of buttons) { if (b.pressed) { b.pressed = false; if (b.contains(p.x, p.y) && b.onTap) { fired = b; } } }
    if (fired) { FL.Audio.sfx.tap(); fired.onTap(fired); }
    return fired;
  };
  UI.cancelPress = function (buttons) { buttons.forEach((b) => { b.pressed = false; }); };

  // ---------- HUD ----------
  const hud = { starPop: 0, lastStars: null, buttons: [] };
  UI.homeBtn = new Button({ x: 18, y: 18, w: 84, h: 84, emoji: '🏡', color: '#60a5fa', round: true, emojiSize: 46, onTap: () => FL.Game.go('world') });
  UI.repeatBtn = new Button({ x: 116, y: 18, w: 84, h: 84, emoji: '🔊', color: '#fbbf24', round: true, emojiSize: 44, onTap: () => { const s = FL.Game.scene; if (s && s.repeatPrompt) s.repeatPrompt(); } });
  UI.drawHUD = function (ctx, o) {
    o = o || {}; const A = Art(); const G = FL.Game; const t = G.time;
    if (o.home) UI.homeBtn.draw(ctx, t);
    if (o.repeat) UI.repeatBtn.draw(ctx, t);
    // stars pill
    const stars = FL.Save.data.stars;
    if (hud.lastStars == null) hud.lastStars = stars;
    if (stars !== hud.lastStars) { hud.starPop = 1; hud.lastStars = stars; }
    hud.starPop = Math.max(0, hud.starPop - G.dt * 2);
    const sc = 1 + hud.starPop * 0.25; const w = 150, h = 62; const x = G.W - w - 20, y = 24;
    ctx.save(); ctx.translate(x + w / 2, y + h / 2); ctx.scale(sc, sc); ctx.translate(-(x + w / 2), -(y + h / 2));
    ctx.fillStyle = 'rgba(0,0,0,.2)'; A.roundRect(ctx, x, y + 5, w, h, 31); ctx.fill();
    ctx.fillStyle = '#7c3aed'; A.roundRect(ctx, x, y, w, h, 31); ctx.fill();
    ctx.strokeStyle = '#fde047'; ctx.lineWidth = 4; A.roundRect(ctx, x, y, w, h, 31); ctx.stroke();
    A.emoji(ctx, '⭐', x + 36, y + h / 2, 38);
    A.text(ctx, String(stars), x + 98, y + h / 2 + 1, { size: 34, color: '#fff' });
    ctx.restore();
  };
  UI.hudDown = function (p, o) { const bs = []; if (o.home) bs.push(UI.homeBtn); if (o.repeat) bs.push(UI.repeatBtn); return !!UI.pressDown(bs, p); };
  UI.hudUp = function (p, o) { const bs = []; if (o.home) bs.push(UI.homeBtn); if (o.repeat) bs.push(UI.repeatBtn); return !!UI.pressUp(bs, p); };

  // ---------- toast ----------
  const toasts = [];
  UI.toast = function (text, emoji, color) { toasts.push({ text, emoji, color: color || '#7c3aed', age: 0, life: 3 }); };
  UI.drawToasts = function (ctx, dt) {
    const A = Art(); const G = FL.Game;
    for (let i = toasts.length - 1; i >= 0; i--) {
      const tt = toasts[i]; tt.age += dt; if (tt.age > tt.life) { toasts.splice(i, 1); continue; }
      const k = tt.age < 0.3 ? tt.age / 0.3 : tt.age > tt.life - 0.3 ? (tt.life - tt.age) / 0.3 : 1;
      const w = Math.max(360, A.measure(ctx, tt.text, 32) + 140), h = 84; const x = G.W / 2 - w / 2, y = 110 - (1 - k) * 60;
      ctx.save(); ctx.globalAlpha = k;
      ctx.fillStyle = 'rgba(0,0,0,.25)'; A.roundRect(ctx, x, y + 6, w, h, 40); ctx.fill();
      ctx.fillStyle = tt.color; A.roundRect(ctx, x, y, w, h, 40); ctx.fill(); ctx.strokeStyle = '#fff'; ctx.lineWidth = 5; ctx.stroke();
      if (tt.emoji) A.emoji(ctx, tt.emoji, x + 52, y + h / 2, 48);
      A.text(ctx, tt.text, x + w / 2 + (tt.emoji ? 30 : 0), y + h / 2, { size: 32, color: '#fff' });
      ctx.restore();
    }
  };

  // ---------- generic overlay (results / friends / parent) ----------
  const overlay = { kind: null, t: 0, data: null, buttons: [] };
  UI.overlayActive = () => !!overlay.kind;
  UI.closeOverlay = function () { overlay.kind = null; overlay.buttons = []; overlay.data = null; };

  UI.showResults = function (o) {
    // o: {title, subtitle, stars(1-3), emoji, again(fn), other(fn, label), home(fn)}
    const G = FL.Game;
    overlay.kind = 'results'; overlay.t = 0; overlay.data = o; overlay.data.shown = 0;
    FL.Save.addStars(o.stars); FL.Audio.sfx.fanfare();
    const bw = 260, bh = 92, gap = 26; const n = 2 + (o.other ? 1 : 0); const total = n * bw + (n - 1) * gap; let bx = G.W / 2 - total / 2; const by = G.H / 2 + 175;
    overlay.buttons = [];
    overlay.buttons.push(new Button({ x: bx, y: by, w: bw, h: bh, label: 'Again!', emoji: '🔁', color: '#4ade80', onTap: () => { UI.closeOverlay(); o.again(); } })); bx += bw + gap;
    if (o.other) { overlay.buttons.push(new Button({ x: bx, y: by, w: bw, h: bh, label: o.otherLabel || 'More', emoji: o.otherEmoji || '🎵', color: '#fbbf24', onTap: () => { UI.closeOverlay(); o.other(); } })); bx += bw + gap; }
    overlay.buttons.push(new Button({ x: bx, y: by, w: bw, h: bh, label: (FL.config && FL.config.homeLabel) || 'Kingdom', emoji: (FL.config && FL.config.homeEmoji) || '🏡', color: '#60a5fa', onTap: () => { UI.closeOverlay(); (o.home || (() => G.go('world')))(); } }));
    G.fx.burst(G.W / 2, G.H / 2 - 100, { count: 90, type: 'confetti', speed: 700, life: 2.2, size: 16, gravity: 500 });
    if (UI.hooks.checkUnlocks) UI.hooks.checkUnlocks();
    const name = FL.Save.data.name; const PR = (FL.Data && FL.Data.PRAISE) || ['Wonderful', 'Amazing', 'Fantastic']; const praise = PR[Math.floor(Math.random() * PR.length)]; const tail = `You earned ${o.stars} star${o.stars > 1 ? 's' : ''}!`;
    setTimeout(() => FL.Audio.say(name ? `${praise}, ${name}! ${tail}` : `${praise}! ${tail}`, { alt: [`${praise}! ${tail}`] }), 600);
  };
  UI.hooks = {};   // games set: checkUnlocks(), nextUnlock() -> {stars, emoji, name}, prevThreshold()
  // Generic "collection" panel (friends, badges, treasures...). Games build the buttons and labels.
  UI.showCollection = function (o) {
    overlay.kind = 'collection'; overlay.t = 0; overlay.buttons = o.buttons || []; overlay.data = { title: o.title, labels: o.labels || [], lines: o.lines || [] };
    const G = FL.Game; const pw = 920, ph = 620; const py = G.H / 2 - ph / 2;
    overlay.buttons.push(new Button({ x: G.W / 2 - 120, y: py + ph - 96, w: 240, h: 76, label: 'Done', emoji: '✅', color: '#4ade80', onTap: () => UI.closeOverlay() }));
  };
  UI.panelOrigin = function () { const G = FL.Game; return { px: G.W / 2 - 460, py: G.H / 2 - 310 }; };
  UI.showParent = function () {
    const G = FL.Game; overlay.kind = 'parent'; overlay.t = 0; overlay.buttons = []; const s = FL.Save.data.settings;
    const py = G.H / 2 - 280; const L = G.W / 2 - 410, R = G.W / 2 + 20, W = 390, H = 78;
    const refresh = () => UI.showParent();
    const voices = FL.Audio.voices(); const vname = FL.Audio.voiceName();
    overlay.buttons.push(new Button({ x: L, y: py + 140, w: W, h: H, label: `Music: ${s.music ? 'On' : 'Off'}`, emoji: '🎵', color: s.music ? '#4ade80' : '#94a3b8', size: 28, onTap: () => { s.music = !s.music; FL.Save.save(); FL.Audio.applySettings(); refresh(); } }));
    overlay.buttons.push(new Button({ x: R, y: py + 140, w: W, h: H, label: `Voice: ${s.speech ? 'On' : 'Off'}`, emoji: '🗣️', color: s.speech ? '#4ade80' : '#94a3b8', size: 28, onTap: () => { s.speech = !s.speech; FL.Save.save(); if (!s.speech) FL.Audio.hush(); refresh(); } }));
    overlay.buttons.push(new Button({ x: L, y: py + 262, w: W - 90, h: H, label: vname.length > 15 ? vname.slice(0, 14) + '…' : vname, emoji: '🎙️', color: '#c084fc', size: 24, onTap: () => { if (!voices.length) { UI.toast('No extra voices on this device', '🎙️', '#475569'); return; } const want = FL.Save.data.settings.voice || ''; const cur = voices.findIndex((v) => v.voiceURI === want || v.name === want); const nxt = voices[(Math.max(0, cur) + 1) % voices.length]; FL.Audio.setVoice(nxt); refresh(); FL.Audio.say(`Hello. I'm ${nxt.name.split(' ')[0]}. Let's play in ${(FL.config && FL.config.title) || 'Melody Kingdom'}.`, { tts: true }); } }));
    overlay.buttons.push(new Button({ x: L + W - 80, y: py + 262, w: 80, h: H, emoji: '▶️', color: '#fbbf24', emojiSize: 34, onTap: () => { const plain = (FL.config && FL.config.voiceTestLine) || 'Hello. Can you find the letter B? Wonderful. B is for butterfly.'; const named = FL.config && FL.config.voiceTestLineNamed && FL.Save.data.name ? FL.config.voiceTestLineNamed(FL.Save.data.name) : null; FL.Audio.say(named || plain, { alt: [plain] }); } }));
    overlay.buttons.push(new Button({ x: R, y: py + 262, w: W, h: H, label: (FL.config && FL.config.heroLabel) || 'Change hero', emoji: (FL.config && FL.config.heroEmoji) || '🧒', color: '#f472b6', size: 28, onTap: () => { UI.closeOverlay(); G.go((FL.config && FL.config.startScene) || 'title'); } }));
    overlay.buttons.push(new Button({ x: L, y: py + 362, w: W, h: H, label: 'Reset all progress', emoji: '🧹', color: '#f87171', size: 28, onTap: () => { if (overlay.data && overlay.data.confirm) { FL.Save.reset(); UI.closeOverlay(); G.go((FL.config && FL.config.startScene) || 'title'); } else { overlay.data = Object.assign(overlay.data || {}, { confirm: true }); UI.toast('Tap again to confirm reset', '⚠️', '#b91c1c'); } } }));
    overlay.buttons.push(new Button({ x: R, y: py + 362, w: W, h: H, label: 'Close', emoji: '✅', color: '#60a5fa', size: 28, onTap: () => UI.closeOverlay() }));
    overlay.data = Object.assign(overlay.data || {}, { voiceCount: voices.length });
  };

  UI.updateOverlay = function (dt) { if (!overlay.kind) return; overlay.t += dt; };
  UI.drawOverlay = function (ctx) {
    if (!overlay.kind) return; const A = Art(); const G = FL.Game; const t = overlay.t;
    ctx.fillStyle = 'rgba(46,16,101,.6)'; ctx.fillRect(0, 0, G.W, G.H);
    const k = Math.min(1, t / 0.35); const ease = 1 - Math.pow(1 - k, 3);
    const pw = overlay.kind === 'collection' ? 920 : 860, ph = overlay.kind === 'collection' ? 620 : 560; const px = G.W / 2 - pw / 2, py = G.H / 2 - ph / 2 + (1 - ease) * 60;
    ctx.save(); ctx.globalAlpha = ease;
    ctx.fillStyle = 'rgba(0,0,0,.25)'; A.roundRect(ctx, px, py + 10, pw, ph, 40); ctx.fill();
    ctx.fillStyle = '#fff7ed'; A.roundRect(ctx, px, py, pw, ph, 40); ctx.fill(); ctx.strokeStyle = '#f9a8d4'; ctx.lineWidth = 8; ctx.stroke();
    if (overlay.kind === 'results') {
      const d = overlay.data;
      A.text(ctx, d.title, G.W / 2, py + 70, { size: A.fitSize(ctx, d.title, pw - 260, 54), color: '#7c3aed' });
      if (d.subtitle) A.text(ctx, d.subtitle, G.W / 2, py + 125, { size: A.fitSize(ctx, d.subtitle, pw - 260, 28), color: '#9d174d' });
      if (d.emoji) A.emoji(ctx, d.emoji, px + 70, py + 75, 70);
      A.emoji(ctx, '🏆', px + pw - 70, py + 75, 64);
      // stars reveal
      for (let i = 0; i < 3; i++) {
        const sx = G.W / 2 + (i - 1) * 150, sy = py + 250; const show = t > 0.6 + i * 0.4 && i < d.stars;
        if (show && d.shown <= i) { d.shown = i + 1; FL.Audio.sfx.star(i); G.fx.burst(sx, sy, { count: 16, type: 'star', colors: ['#fde047', '#fbbf24', '#fff'], speed: 260, life: 0.8 }); }
        const pop = show ? Math.min(1, (t - (0.6 + i * 0.4)) / 0.3) : 0; const s = 60 * (show ? 1 + Math.sin(pop * Math.PI) * 0.4 : 1);
        ctx.fillStyle = show ? '#fde047' : '#e5e7eb'; ctx.strokeStyle = show ? '#d97706' : '#cbd5e1'; ctx.lineWidth = 6; ctx.lineJoin = 'round';
        A.starPath(ctx, sx, sy - (i === 1 ? 20 : 0), s, s * 0.48, 5); ctx.fill(); ctx.stroke();
      }
      A.text(ctx, `+${d.stars} ⭐`, G.W / 2, py + 360, { size: 40, color: '#b45309' });
      const nu = UI.hooks.nextUnlock ? UI.hooks.nextUnlock() : null; if (nu) A.text(ctx, `${Math.max(0, nu.stars - FL.Save.data.stars)} more ⭐ until ${nu.emoji} ${nu.name}!`, G.W / 2, py + 405, { size: 24, color: '#6b7280' });
    } else if (overlay.kind === 'collection') {
      const d = overlay.data || {};
      A.text(ctx, d.title || 'My Things', G.W / 2, py + 48, { size: 44, color: '#7c3aed' });
      const dy = py - (G.H / 2 - ph / 2);
      (d.labels || []).forEach((l) => A.text(ctx, l.text, l.x, l.y + dy, { size: 20, color: '#9d174d', align: 'left' }));
      (d.lines || []).forEach((l) => A.text(ctx, l.text, l.x != null ? l.x : G.W / 2, l.y + dy, { size: l.size || 22, color: l.color || '#166534' }));
    } else if (overlay.kind === 'parent') {
      A.text(ctx, 'Grown-up Corner', G.W / 2, py + 60, { size: 46, color: '#7c3aed' });
      const p = FL.Save.data.plays; const played = Object.keys(p).reduce((a, k) => a + p[k], 0);
      const lv = Object.keys(FL.Save.data.levels).map((k) => `${k} ${FL.Save.data.levels[k]}`).join(', ');
      A.text(ctx, `${FL.Save.data.stars} stars · ${played} games played${lv ? ' · levels: ' + lv : ''}`, G.W / 2, py + 108, { size: A.fitSize(ctx, `${FL.Save.data.stars} stars · ${played} games played${lv ? ' · levels: ' + lv : ''}`, pw - 40, 20), color: '#6b7280' });
      const vp = FL.Audio.voicePack; A.text(ctx, vp.ready ? `Narrator: ${vp.name} (built in) · fallback voice below · ▶ to hear` : `Narrator voice · ${(overlay.data && overlay.data.voiceCount) || 0} on this device · tap to change, ▶ to hear`, G.W / 2 - 410, py + 248, { size: 17, color: '#6b7280', align: 'left' });
      const h1 = vp.ready ? 'The narrator is a built-in studio voice, so it sounds the same on every device. The fallback voice is only used' : 'For a much more natural voice on iPad: Settings › Accessibility › Spoken Content › Voices › English,'; const h2 = vp.ready ? 'for lines that include a custom name (see README to bake a name into the voice pack).' : 'download "Ava (Premium)" or "Samantha (Enhanced)", restart the game, then pick it above.';
      A.text(ctx, h1, G.W / 2, py + ph - 70, { size: A.fitSize(ctx, h1, pw - 60, 17), color: '#6b7280' });
      A.text(ctx, h2, G.W / 2, py + ph - 44, { size: A.fitSize(ctx, h2, pw - 60, 17), color: '#6b7280' });
    }
    overlay.buttons.forEach((b) => b.draw(ctx, G.time));
    ctx.restore();
  };
  UI.overlayDown = function (p) { if (!overlay.kind) return false; UI.pressDown(overlay.buttons, p); return true; };
  UI.overlayUp = function (p) { if (!overlay.kind) return false; UI.pressUp(overlay.buttons, p); return true; };

  // ---------- shared helpers for games ----------
  UI.banner = function (ctx, text, o) { // instruction banner at the top centre
    o = o || {}; const A = Art(); const G = FL.Game; const w = Math.max(o.minW || 520, A.measure(ctx, text, o.size || 40) + (o.emoji ? 190 : 100)); const h = o.h || 96; const x = G.W / 2 - w / 2, y = o.y != null ? o.y : 22;
    ctx.fillStyle = 'rgba(0,0,0,.18)'; A.roundRect(ctx, x, y + 6, w, h, h / 2); ctx.fill();
    ctx.fillStyle = o.color || 'rgba(255,255,255,.92)'; A.roundRect(ctx, x, y, w, h, h / 2); ctx.fill();
    ctx.strokeStyle = o.border || '#f9a8d4'; ctx.lineWidth = 5; A.roundRect(ctx, x, y, w, h, h / 2); ctx.stroke();
    if (o.emoji) A.emoji(ctx, o.emoji, x + 60, y + h / 2, h * 0.62);
    A.text(ctx, text, x + w / 2 + (o.emoji ? 40 : 0), y + h / 2 + 2, { size: o.size || 40, color: o.textColor || '#7c3aed' });
  };
  UI.progressDots = function (ctx, done, total, y) {
    const A = Art(); const G = FL.Game; const gap = 34; const x0 = G.W / 2 - ((total - 1) * gap) / 2;
    for (let i = 0; i < total; i++) { ctx.fillStyle = i < done ? '#fde047' : 'rgba(255,255,255,.55)'; ctx.strokeStyle = 'rgba(0,0,0,.2)'; ctx.lineWidth = 2; A.circle(ctx, x0 + i * gap, y, i < done ? 12 : 9); ctx.fill(); ctx.stroke(); }
  };
  UI.starsFor = function (good, total) { const r = good / total; return r >= 0.85 ? 3 : r >= 0.5 ? 2 : 1; };

  window.FL = window.FL || {};
  FL.UI = UI;
})();
