// Germ Patrol title: pick your hero.
(function () {
  const A = FL.Art, UI = FL.UI, G = () => FL.Game, D = FL.Data;
  const scene = {
    t: 0, buttons: [], swatches: [], sel: 0, germs: [], music: 'town',
    enter() {
      this.t = 0; this.sel = FL.Save.data.princess || 0; const g = G(); this.layout();
      const input = document.getElementById('nameInput'); input.value = FL.Save.data.name || ''; input.oninput = () => { FL.Save.data.name = input.value.trim(); FL.Save.save(); };
      this.germs = []; for (let i = 0; i < 10; i++) this.germs.push({ x: Math.random() * g.W, y: Math.random() * g.H * 0.5, g: D.GERMS[i % D.GERMS.length], r: 18 + Math.random() * 14, vx: (Math.random() - 0.5) * 30, vy: (Math.random() - 0.5) * 20 });
    },
    layout() {
      const g = G(); this.buttons = [new UI.Button({ x: g.W / 2 - 170, y: g.H - 128, w: 340, h: 104, label: 'PLAY!', emoji: '🦸', color: '#4ade80', size: 48, pulse: true, onTap: () => this.play() })];
      const CC = A.capeColors(); this.swatches = CC.map((c, i) => new UI.Button({ x: g.W / 2 - (CC.length * 62) / 2 + i * 62 + 4, y: g.H - 205, w: 54, h: 54, color: c[0], round: true, onTap: () => { FL.Save.data.dress = c; FL.Save.save(); G().refreshLook(); FL.Audio.sfx.sparkle(); } }));
      const wrap = document.getElementById('nameWrap'); wrap.style.left = Math.round(g.offX + 40 * g.scale) + 'px'; wrap.style.top = Math.round(g.offY + (g.H - 130) * g.scale) + 'px'; wrap.style.transform = `scale(${g.scale})`; wrap.style.transformOrigin = 'top left';
    },
    resize() { this.layout(); },
    play() { FL.Save.data.princess = this.sel; FL.Save.save(); const n = FL.Save.data.name; FL.Audio.say(n ? `Welcome to Germ Patrol, Captain ${n}! Let's keep the germs away!` : 'Welcome to Germ Patrol! Let\'s keep the germs away!', { alt: ['Welcome to Germ Patrol! Let\'s keep the germs away!'] }); G().go('town'); },
    heroAt(i) { const g = G(); return { x: g.W / 2 + (i - 1.5) * 190, y: g.H / 2 + 150 }; },
    down(p) { UI.pressDown(this.buttons, p) || UI.pressDown(this.swatches, p); },
    up(p) {
      if (UI.pressUp(this.buttons, p) || UI.pressUp(this.swatches, p)) return;
      for (let i = 0; i < D.HEROES.length; i++) { const pos = this.heroAt(i); if (Math.abs(p.x - pos.x) < 80 && p.y > pos.y - 190 && p.y < pos.y + 20) { this.sel = i; FL.Save.data.princess = i; FL.Save.data.dress = null; FL.Save.save(); G().refreshLook(); FL.Audio.sfx.sparkle(); FL.Audio.say(`Hi! I'm ${D.HEROES[i].name}!`); return; } }
    },
    key(k) { if (k === 'Enter' || k === ' ') this.play(); },
    update(dt) { this.t += dt; const g = G(); this.germs.forEach((b) => { b.x += b.vx * dt; b.y += b.vy * dt; if (b.x < 0 || b.x > g.W) b.vx *= -1; if (b.y < 0 || b.y > g.H * 0.55) b.vy *= -1; }); },
    draw(ctx) {
      const g = G(); const t = this.t;
      const grad = ctx.createLinearGradient(0, 0, 0, g.H); grad.addColorStop(0, '#0ea5e9'); grad.addColorStop(0.6, '#7dd3fc'); grad.addColorStop(1, '#bbf7d0'); ctx.fillStyle = grad; ctx.fillRect(0, 0, g.W, g.H);
      this.germs.forEach((b) => A.germ(ctx, b.x, b.y, b.r, b.g, t, { alpha: 0.5 }));
      for (let i = 0; i < 12; i++) A.bubble(ctx, (i * 131 + t * 20) % g.W, g.H - ((i * 97 + t * 40) % g.H), 10 + (i % 4) * 5, 0.6);
      A.cloud(ctx, g.W * 0.15 + Math.sin(t * 0.2) * 20, 160, 36, 0.9); A.cloud(ctx, g.W * 0.85, 120, 44, 0.9);
      A.hills(ctx, g.W, g.H, g.H * 0.68, '#86efac', 1); A.hills(ctx, g.W, g.H, g.H * 0.76, '#4ade80', 3);
      ctx.save(); ctx.translate(g.W / 2, 118); ctx.rotate(Math.sin(t * 1.5) * 0.02);
      A.text(ctx, 'Germ Patrol', 0, 0, { size: 100, color: '#fde047', stroke: '#0c4a6e', strokeWidth: 14, shadow: 8 });
      A.text(ctx, '🧼 Be a hero. Keep the germs away! 🦸', 0, 82, { size: 32, color: '#fff', stroke: 'rgba(12,74,110,.6)', strokeWidth: 6 });
      ctx.restore();
      A.text(ctx, 'Pick your hero!', g.W / 2, g.H / 2 - 100, { size: 38, color: '#fff', stroke: 'rgba(12,74,110,.6)' });
      for (let i = 0; i < D.HEROES.length; i++) { const pos = this.heroAt(i); const look = i === this.sel ? g.look : D.HEROES[i]; if (i === this.sel) { ctx.fillStyle = 'rgba(253,224,71,.45)'; A.ellipse(ctx, pos.x, pos.y + 4, 80, 24); ctx.fill(); ctx.strokeStyle = '#fde047'; ctx.lineWidth = 6; A.roundRect(ctx, pos.x - 90, pos.y - 205, 180, 240, 30); ctx.stroke(); } A.hero(ctx, pos.x, pos.y, look, { t: t + i, wave: i === this.sel, seed: i }, i === this.sel ? 1.25 : 1.1); A.text(ctx, D.HEROES[i].name, pos.x, pos.y + 30, { size: 28, color: '#fff', stroke: 'rgba(12,74,110,.6)' }); }
      A.text(ctx, 'Cape colour:', g.W / 2, g.H - 228, { size: 22, color: '#fff', stroke: 'rgba(12,74,110,.5)' });
      this.swatches.forEach((b) => b.draw(ctx, t)); this.buttons.forEach((b) => b.draw(ctx, t));
      A.text(ctx, `⭐ ${FL.Save.data.stars} stars collected`, g.W - 30, g.H - 30, { size: 24, color: '#fff', align: 'right', stroke: 'rgba(12,74,110,.5)' });
    },
  };
  FL.scenes.title = scene;
})();
