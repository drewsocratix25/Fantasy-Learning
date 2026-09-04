// Title screen: pick a princess, type a name (optional), press play.
(function () {
  const A = FL.Art, UI = FL.UI, G = () => FL.Game;
  const scene = {
    t: 0, buttons: [], swatches: [], sel: 0, notes: [], hud: null,
    enter() {
      this.t = 0; this.sel = FL.Save.data.princess || 0;
      const g = G(); this.layout();
      const input = document.getElementById('nameInput'); input.value = FL.Save.data.name || '';
      input.oninput = () => { FL.Save.data.name = input.value.trim(); FL.Save.save(); };
      this.notes = []; for (let i = 0; i < 14; i++) this.notes.push({ x: Math.random() * g.W, y: Math.random() * g.H, s: 22 + Math.random() * 26, v: 20 + Math.random() * 30, ph: Math.random() * 6, e: ['🎵', '🎶', '⭐', '✨', '💖'][i % 5] });
      if (!this.said) { this.said = true; }
    },
    layout() {
      const g = G(); this.buttons = [];
      this.buttons.push(new UI.Button({ x: g.W / 2 - 170, y: g.H - 128, w: 340, h: 104, label: 'PLAY!', emoji: '🎵', color: '#4ade80', size: 48, pulse: true, onTap: () => this.play() }));
      const DC = A.dressColors(); this.swatches = DC.map((c, i) => new UI.Button({ x: g.W / 2 - (DC.length * 62) / 2 + i * 62 + 4, y: g.H - 205, w: 54, h: 54, color: c[0], round: true, onTap: () => { FL.Save.data.dress = c; FL.Save.save(); G().refreshLook(); FL.Audio.sfx.sparkle(); } }));
      this.positionInput();
    },
    positionInput() {
      const g = G(); const wrap = document.getElementById('nameWrap');
      wrap.style.left = Math.round(g.offX + 40 * g.scale) + 'px'; wrap.style.top = Math.round(g.offY + (g.H - 130) * g.scale) + 'px';
      wrap.style.transform = `scale(${g.scale})`; wrap.style.transformOrigin = 'top left';
    },
    resize() { this.layout(); },
    play() {
      FL.Save.data.princess = this.sel; FL.Save.save();
      const name = FL.Save.data.name;
      FL.Audio.say(name ? `Welcome to Melody Kingdom, Princess ${name}! Let's go explore!` : 'Welcome to Melody Kingdom! Let\'s go explore!', { alt: ['Welcome to Melody Kingdom! Let\'s go explore!'] });
      G().go('world');
    },
    princessAt(i) { const g = G(); const n = A.PRINCESSES.length; return { x: g.W / 2 + (i - (n - 1) / 2) * 190, y: g.H / 2 + 150 }; },
    down(p) { if (UI.pressDown(this.buttons, p)) return; if (UI.pressDown(this.swatches, p)) return; },
    up(p) {
      if (UI.pressUp(this.buttons, p)) return; if (UI.pressUp(this.swatches, p)) return;
      for (let i = 0; i < A.PRINCESSES.length; i++) { const pos = this.princessAt(i); if (Math.abs(p.x - pos.x) < 80 && p.y > pos.y - 190 && p.y < pos.y + 20) { this.sel = i; FL.Save.data.princess = i; FL.Save.data.dress = null; FL.Save.save(); G().refreshLook(); FL.Audio.sfx.sparkle(); FL.Audio.say(`Hi! I'm ${A.PRINCESSES[i].name}!`); return; } }
    },
    key(k) { if (k === 'Enter' || k === ' ') this.play(); },
    update(dt) { this.t += dt; const g = G(); this.notes.forEach((n) => { n.y -= n.v * dt; if (n.y < -40) { n.y = g.H + 40; n.x = Math.random() * g.W; } }); },
    draw(ctx) {
      const g = G(); const t = this.t;
      const grad = ctx.createLinearGradient(0, 0, 0, g.H); grad.addColorStop(0, '#5b21b6'); grad.addColorStop(0.55, '#c084fc'); grad.addColorStop(1, '#fbcfe8');
      ctx.fillStyle = grad; ctx.fillRect(0, 0, g.W, g.H);
      // stars
      for (let i = 0; i < 40; i++) { const x = (i * 137.5) % g.W, y = (i * 91.7) % (g.H * 0.5); ctx.fillStyle = `rgba(255,255,255,${0.4 + 0.6 * Math.abs(Math.sin(t * 2 + i))})`; A.starPath(ctx, x, y, 4 + (i % 3) * 2, null, 4); ctx.fill(); }
      A.cloud(ctx, g.W * 0.15 + Math.sin(t * 0.2) * 20, g.H * 0.28, 40, 0.8); A.cloud(ctx, g.W * 0.85 + Math.cos(t * 0.15) * 20, g.H * 0.22, 50, 0.85);
      A.castle(ctx, g.W / 2, g.H * 0.62, 0.9, t);
      A.hills(ctx, g.W, g.H, g.H * 0.68, '#86efac', 1); A.hills(ctx, g.W, g.H, g.H * 0.76, '#4ade80', 3);
      this.notes.forEach((n) => A.emoji(ctx, n.e, n.x + Math.sin(t + n.ph) * 12, n.y, n.s, { alpha: 0.7 }));
      // title
      ctx.save(); ctx.translate(g.W / 2, 120); ctx.rotate(Math.sin(t * 1.5) * 0.02);
      A.text(ctx, 'Melody Kingdom', 0, 0, { size: 96, color: '#fde047', stroke: '#9d174d', strokeWidth: 14, shadow: 8 });
      A.text(ctx, '✨ A Princess Music Adventure ✨', 0, 80, { size: 34, color: '#fff', stroke: 'rgba(80,20,90,.6)', strokeWidth: 6 });
      ctx.restore();
      A.text(ctx, 'Pick your princess!', g.W / 2, g.H / 2 - 100, { size: 38, color: '#fff', stroke: 'rgba(80,20,90,.6)' });
      for (let i = 0; i < A.PRINCESSES.length; i++) {
        const pos = this.princessAt(i); const look = i === this.sel ? g.look : A.PRINCESSES[i];
        if (i === this.sel) { ctx.fillStyle = 'rgba(253,224,71,.45)'; A.ellipse(ctx, pos.x, pos.y + 4, 80, 24); ctx.fill(); ctx.strokeStyle = '#fde047'; ctx.lineWidth = 6; A.roundRect(ctx, pos.x - 90, pos.y - 205, 180, 240, 30); ctx.stroke(); }
        A.princess(ctx, pos.x, pos.y, look, { t: t + i, wave: i === this.sel, seed: i }, i === this.sel ? 1.25 : 1.1);
        A.text(ctx, look.name, pos.x, pos.y + 30, { size: 28, color: '#fff', stroke: 'rgba(80,20,90,.6)' });
      }
      A.text(ctx, 'Dress colour:', g.W / 2, g.H - 228, { size: 22, color: '#fff', stroke: 'rgba(80,20,90,.5)' });
      this.swatches.forEach((b) => b.draw(ctx, t));
      this.buttons.forEach((b) => b.draw(ctx, t));
      A.text(ctx, `⭐ ${FL.Save.data.stars} stars collected`, g.W - 30, g.H - 30, { size: 24, color: '#fff', align: 'right', stroke: 'rgba(80,20,90,.5)' });
    },
  };
  scene.music = 'title';
  FL.scenes.title = scene;
})();
