// Title screen: pick an explorer, type a name (optional), press play.
(function () {
  const A = FL.Art, UI = FL.UI, G = () => FL.Game;
  // Stone castle facade for the title screen (feet of the castle at (x, y)).
  A.castleQuest = function (ctx, x, y, s, t) {
    t = t || 0; ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
    ctx.fillStyle = 'rgba(0,0,0,.15)'; A.ellipse(ctx, 0, 6, 320, 26); ctx.fill();
    const wall = '#e7e5e4', wallDark = '#d6d3d1', roof = '#2563eb', roofLight = '#60a5fa', stone = '#a8a29e';
    ctx.strokeStyle = 'rgba(60,50,70,.5)'; ctx.lineWidth = 3;
    function tower(tx, ty, tw, th) {
      ctx.fillStyle = wallDark; A.roundRect(ctx, tx - tw / 2, ty - th, tw, th, 8); ctx.fill(); ctx.stroke();
      ctx.fillStyle = wall; ctx.fillRect(tx - tw / 2 + 6, ty - th + 6, tw * 0.4, th - 12);
      ctx.fillStyle = stone; for (let i = -1; i <= 1; i++) ctx.fillRect(tx + i * tw * 0.36 - tw * 0.12, ty - th - 12, tw * 0.24, 14);
      ctx.fillStyle = roof; ctx.beginPath(); ctx.moveTo(tx - tw * 0.7, ty - th - 8); ctx.lineTo(tx, ty - th - tw * 1.35); ctx.lineTo(tx + tw * 0.7, ty - th - 8); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.fillStyle = roofLight; ctx.beginPath(); ctx.moveTo(tx - tw * 0.7, ty - th - 8); ctx.lineTo(tx, ty - th - tw * 1.35); ctx.lineTo(tx - tw * 0.15, ty - th - 8); ctx.closePath(); ctx.fill();
      const fx = tx, fy = ty - th - tw * 1.35; ctx.strokeStyle = '#78350f'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(fx, fy); ctx.lineTo(fx, fy - 34); ctx.stroke();
      const wave = Math.sin(t * 6 + tx) * 4; ctx.fillStyle = '#fde047'; ctx.beginPath(); ctx.moveTo(fx, fy - 34); ctx.quadraticCurveTo(fx + 14, fy - 30 + wave, fx + 28, fy - 26); ctx.lineTo(fx, fy - 16); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = 'rgba(60,50,70,.5)'; ctx.lineWidth = 3; ctx.fillStyle = '#7dd3fc'; A.roundRect(ctx, tx - 10, ty - th * 0.62, 20, 30, 10); ctx.fill(); ctx.stroke();
    }
    ctx.fillStyle = wallDark; A.roundRect(ctx, -240, -190, 480, 190, 10); ctx.fill(); ctx.stroke();
    ctx.fillStyle = wall; ctx.fillRect(-232, -182, 464, 174);
    ctx.fillStyle = 'rgba(0,0,0,.06)'; for (let r = 0; r < 6; r++) for (let c = 0; c < 8; c++) ctx.fillRect(-232 + c * 58 + (r % 2) * 29, -175 + r * 29, 52, 22);
    ctx.fillStyle = stone; for (let i = 0; i < 12; i++) ctx.fillRect(-240 + i * 40 + 8, -202, 24, 16);
    tower(-250, 0, 74, 250); tower(250, 0, 74, 250); tower(0, -140, 96, 190);
    ctx.fillStyle = '#92400e'; ctx.beginPath(); ctx.moveTo(-52, 0); ctx.lineTo(-52, -76); ctx.arc(0, -76, 52, Math.PI, 0); ctx.lineTo(52, 0); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#b45309'; ctx.fillRect(-2, -120, 4, 118); ctx.strokeStyle = '#78350f'; ctx.lineWidth = 3; for (let i = 1; i < 4; i++) { ctx.beginPath(); ctx.moveTo(-52, -i * 24); ctx.lineTo(52, -i * 24); ctx.stroke(); }
    ctx.strokeStyle = 'rgba(60,50,70,.5)'; ctx.fillStyle = '#7dd3fc'; [-160, -105, 105, 160].forEach((wx) => { A.roundRect(ctx, wx - 12, -140, 24, 36, 12); ctx.fill(); ctx.stroke(); });
    [[-200, '#ef4444'], [200, '#3b82f6']].forEach(([bx, c]) => { ctx.fillStyle = c; ctx.beginPath(); ctx.moveTo(bx - 16, -175); ctx.lineTo(bx + 16, -175); ctx.lineTo(bx + 16, -115); ctx.lineTo(bx, -102); ctx.lineTo(bx - 16, -115); ctx.closePath(); ctx.fill(); ctx.stroke(); });
    A.emoji(ctx, '🔭', -200, -145, 22); A.emoji(ctx, '🗝️', 200, -145, 22);
    ctx.fillStyle = '#d6d3d1'; A.roundRect(ctx, -80, -4, 160, 22, 8); ctx.fill();
    ctx.restore();
  };
  const scene = {
    t: 0, buttons: [], swatches: [], sel: 0, motes: [], hud: null, music: 'title',
    enter() {
      this.t = 0; this.sel = FL.Save.data.princess || 0; const g = G(); this.layout();
      const input = document.getElementById('nameInput'); input.value = FL.Save.data.name || '';
      input.oninput = () => { FL.Save.data.name = input.value.trim(); FL.Save.save(); };
      this.motes = []; for (let i = 0; i < 16; i++) this.motes.push({ x: Math.random() * g.W, y: Math.random() * g.H, s: 20 + Math.random() * 24, v: 15 + Math.random() * 25, ph: Math.random() * 6, e: ['⭐', '✨', '🗝️', '🔭', '🦋'][i % 5] });
    },
    layout() {
      const g = G(); this.buttons = [];
      this.buttons.push(new UI.Button({ x: g.W / 2 - 170, y: g.H - 128, w: 340, h: 104, label: 'EXPLORE!', emoji: '🏰', color: '#4ade80', size: 44, pulse: true, onTap: () => this.play() }));
      const DC = A.dressColors(); this.swatches = DC.map((c) => new UI.Button({ x: 0, y: g.H - 205, w: 54, h: 54, color: c[0], round: true, onTap: () => { FL.Save.data.dress = c; FL.Save.save(); G().refreshLook(); FL.Audio.sfx.sparkle(); } }));
      this.swatches.forEach((b, i) => { b.x = g.W / 2 - (DC.length * 62) / 2 + i * 62 + 4; });
      this.positionInput();
    },
    positionInput() {
      const g = G(); const wrap = document.getElementById('nameWrap');
      wrap.style.left = Math.round(g.offX + 40 * g.scale) + 'px'; wrap.style.top = Math.round(g.offY + (g.H - 130) * g.scale) + 'px';
      wrap.style.transform = `scale(${g.scale})`; wrap.style.transformOrigin = 'top left';
    },
    resize() { this.layout(); },
    play() {
      FL.Save.data.princess = this.sel; FL.Save.save(); const name = FL.Save.data.name;
      FL.Audio.say(name ? `Welcome to Castle Quest, ${name}! Let's go exploring!` : 'Welcome to Castle Quest! Let\'s go exploring!', { alt: ['Welcome to Castle Quest! Let\'s go exploring!'] });
      G().go('world');
    },
    heroAt(i) { const g = G(); const n = A.PRINCESSES.length; return { x: g.W / 2 + (i - (n - 1) / 2) * 190, y: g.H / 2 + 150 }; },
    down(p) { if (UI.pressDown(this.buttons, p)) return; if (UI.pressDown(this.swatches, p)) return; },
    up(p) {
      if (UI.pressUp(this.buttons, p)) return; if (UI.pressUp(this.swatches, p)) return;
      for (let i = 0; i < A.PRINCESSES.length; i++) { const pos = this.heroAt(i); if (Math.abs(p.x - pos.x) < 80 && p.y > pos.y - 190 && p.y < pos.y + 20) { this.sel = i; FL.Save.data.princess = i; FL.Save.data.dress = null; FL.Save.save(); G().refreshLook(); FL.Audio.sfx.sparkle(); FL.Audio.say(`Hi! I'm ${A.PRINCESSES[i].name}!`); return; } }
    },
    key(k) { if (k === 'Enter' || k === ' ') this.play(); },
    update(dt) { this.t += dt; const g = G(); this.motes.forEach((n) => { n.y -= n.v * dt; if (n.y < -40) { n.y = g.H + 40; n.x = Math.random() * g.W; } }); },
    draw(ctx) {
      const g = G(); const t = this.t;
      const grad = ctx.createLinearGradient(0, 0, 0, g.H); grad.addColorStop(0, '#1e3a8a'); grad.addColorStop(0.55, '#60a5fa'); grad.addColorStop(1, '#fde68a');
      ctx.fillStyle = grad; ctx.fillRect(0, 0, g.W, g.H);
      for (let i = 0; i < 40; i++) { const x = (i * 137.5) % g.W, y = (i * 91.7) % (g.H * 0.45); ctx.fillStyle = `rgba(255,255,255,${0.4 + 0.6 * Math.abs(Math.sin(t * 2 + i))})`; A.starPath(ctx, x, y, 4 + (i % 3) * 2, null, 4); ctx.fill(); }
      A.cloud(ctx, g.W * 0.15 + Math.sin(t * 0.2) * 20, g.H * 0.3, 40, 0.8); A.cloud(ctx, g.W * 0.85 + Math.cos(t * 0.15) * 20, g.H * 0.24, 50, 0.85);
      A.hills(ctx, g.W, g.H, g.H * 0.66, '#86efac', 1); A.castleQuest(ctx, g.W / 2, g.H * 0.7, 0.9, t); A.hills(ctx, g.W, g.H, g.H * 0.76, '#4ade80', 3);
      this.motes.forEach((n) => A.emoji(ctx, n.e, n.x + Math.sin(t + n.ph) * 12, n.y, n.s, { alpha: 0.7 }));
      ctx.save(); ctx.translate(g.W / 2, 120); ctx.rotate(Math.sin(t * 1.5) * 0.02);
      A.text(ctx, 'Castle Quest', 0, 0, { size: 96, color: '#fde047', stroke: '#7c2d12', strokeWidth: 14, shadow: 8 });
      A.text(ctx, '🔭 Discover how the world works 🔭', 0, 80, { size: 34, color: '#fff', stroke: 'rgba(30,20,80,.6)', strokeWidth: 6 });
      ctx.restore();
      A.text(ctx, 'Pick your explorer!', g.W / 2, g.H / 2 - 100, { size: 38, color: '#fff', stroke: 'rgba(30,20,80,.6)' });
      for (let i = 0; i < A.PRINCESSES.length; i++) {
        const pos = this.heroAt(i); const look = i === this.sel ? g.look : A.PRINCESSES[i];
        if (i === this.sel) { ctx.fillStyle = 'rgba(253,224,71,.45)'; A.ellipse(ctx, pos.x, pos.y + 4, 80, 24); ctx.fill(); ctx.strokeStyle = '#fde047'; ctx.lineWidth = 6; A.roundRect(ctx, pos.x - 90, pos.y - 215, 180, 250, 30); ctx.stroke(); }
        A.explorer(ctx, pos.x, pos.y, look, { t: t + i, wave: i === this.sel, seed: i }, i === this.sel ? 1.25 : 1.1);
        A.text(ctx, look.name, pos.x, pos.y + 30, { size: 28, color: '#fff', stroke: 'rgba(30,20,80,.6)' });
      }
      A.text(ctx, 'Tunic colour:', g.W / 2, g.H - 228, { size: 22, color: '#fff', stroke: 'rgba(30,20,80,.5)' });
      this.swatches.forEach((b) => b.draw(ctx, t)); this.buttons.forEach((b) => b.draw(ctx, t));
      A.text(ctx, `⭐ ${FL.Save.data.stars} stars collected`, g.W - 30, g.H - 30, { size: 24, color: '#fff', align: 'right', stroke: 'rgba(30,20,80,.5)' });
    },
  };
  FL.scenes.title = scene;
})();
