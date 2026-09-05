// Song picker for Melody Castle.
(function () {
  const A = FL.Art, UI = FL.UI, G = () => FL.Game;
  const scene = {
    t: 0, cards: [], buttons: [], hud: { home: true },
    enter() { this.t = 0; this.layout(); FL.Audio.say('Pick a song to play!'); },
    layout() {
      const g = G(); const songs = FL.Songs.list; this.cards = []; this.buttons = [];
      const cols = 5, gapx = 22, gapy = 26; const cw = Math.min(230, (g.W - 80 - (cols - 1) * gapx) / cols), ch = 215; const rows = Math.ceil(songs.length / cols);
      const x0 = g.W / 2 - (cols * cw + (cols - 1) * gapx) / 2, y0 = 150; const stars = FL.Save.data.stars;
      songs.forEach((s, i) => { const r = Math.floor(i / cols), c = i % cols; const locked = (s.unlock || 0) > stars; this.cards.push(new UI.Button({ x: x0 + c * (cw + gapx), y: y0 + r * (ch + gapy), w: cw, h: ch, color: locked ? '#cbd5e1' : s.color, song: s, locked, onTap: () => G().go('rhythm', { song: s.id }) })); if (locked) this.cards[this.cards.length - 1].enabled = false; });
      const speed = FL.Save.data.settings.speed;
      this.speedBtn = new UI.Button({ x: g.W / 2 - 200, y: g.H - 120, w: 400, h: 84, label: speed === 'slow' ? 'Speed: Slow' : speed === 'fast' ? 'Speed: Fast' : 'Speed: Medium', emoji: speed === 'slow' ? '🐢' : speed === 'fast' ? '🐇' : '🐈', color: '#a78bfa', size: 30, onTap: () => { const o = ['slow', 'medium', 'fast']; FL.Save.data.settings.speed = o[(o.indexOf(speed) + 1) % 3]; FL.Save.save(); this.layout(); } });
      this.buttons = [this.speedBtn];
      void rows;
    },
    resize() { this.layout(); },
    down(p) { UI.pressDown(this.cards, p) || UI.pressDown(this.buttons, p); },
    up(p) { UI.pressUp(this.cards, p) || UI.pressUp(this.buttons, p); },
    update(dt) { this.t += dt; },
    draw(ctx) {
      const g = G(); const t = this.t;
      const grad = ctx.createLinearGradient(0, 0, 0, g.H); grad.addColorStop(0, '#4c1d95'); grad.addColorStop(1, '#9d174d'); ctx.fillStyle = grad; ctx.fillRect(0, 0, g.W, g.H);
      for (let i = 0; i < 30; i++) { const x = (i * 197.3) % g.W, y = (i * 131.7 + t * 20) % g.H; A.emoji(ctx, ['🎵', '🎶', '✨'][i % 3], x, y, 26, { alpha: 0.35 }); }
      UI.banner(ctx, 'Choose a song!', { emoji: '🏰', color: '#fde68a', border: '#f59e0b', textColor: '#7c2d12' });
      this.cards.forEach((c, i) => {
        const s = c.song; c.draw(ctx, t);
        const cx = c.x + c.w / 2; const bob = Math.sin(t * 3 + i) * 4;
        if (c.locked) { ctx.save(); ctx.globalAlpha = 0.9; A.emoji(ctx, '🔒', cx, c.y + 70, 64); A.text(ctx, s.title, cx, c.y + 140, { size: A.fitSize(ctx, s.title, c.w - 20, 24), color: '#475569' }); A.text(ctx, `${s.unlock} ⭐ to unlock`, cx, c.y + 180, { size: 20, color: '#475569' }); ctx.restore(); return; }
        A.emoji(ctx, s.emoji, cx, c.y + 72 + bob, 76);
        A.text(ctx, s.title, cx, c.y + 143, { size: A.fitSize(ctx, s.title, c.w - 20, 26), color: '#3b0764', weight: 700 });
        const best = FL.Save.data.songBest[s.id] || 0;
        for (let k = 0; k < 3; k++) { ctx.fillStyle = k < best ? '#fde047' : 'rgba(255,255,255,.55)'; ctx.strokeStyle = 'rgba(0,0,0,.25)'; ctx.lineWidth = 2; A.starPath(ctx, cx + (k - 1) * 40, c.y + 184, 15, 7, 5); ctx.fill(); ctx.stroke(); }
      });
      this.buttons.forEach((b) => b.draw(ctx, t));
      A.princess(ctx, 110, g.H - 40, g.look, { t, dance: 0.6 }, 1);
    },
  };
  scene.music = 'title';
  FL.scenes.songs = scene;
})();
