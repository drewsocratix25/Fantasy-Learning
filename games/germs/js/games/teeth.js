// Toothbrush Time: scrub the sugar bugs off every tooth, then rinse.
(function () {
  const A = FL.Art, UI = FL.UI, G = () => FL.Game, D = FL.Data;
  const scene = {
    hud: { home: true, repeat: true }, music: 'bath', t: 0, state: 'paste', teeth: [], foam: [], brushT: 0, BRUSH: 30, pointer: null, said: {},
    enter() {
      const g = G(); this.t = 0; this.state = 'paste'; this.brushT = 0; this.foam = []; this.pointer = null; this.said = {}; FL.Save.addPlay('teeth'); this.layout();
      this.teeth = []; for (let i = 0; i < 6; i++) { const arc = Math.abs(i - 2.5) * 6; this.teeth.push({ x: g.W / 2 + (i - 2.5) * 92, y: g.H / 2 - 60 + arc, row: 'top', dirt: 1, bugs: 2 + (i % 2) }); this.teeth.push({ x: g.W / 2 + (i - 2.5) * 92, y: g.H / 2 + 100 - arc, row: 'bottom', dirt: 1, bugs: 2 + ((i + 1) % 2) }); }
      FL.Audio.say('Sugar bugs are hiding on the teeth! Grab the toothbrush and scrub!'); FL.Game.later(() => FL.Audio.say('Squeeze a pea of toothpaste. Tap the toothpaste!', { interrupt: false }), 300);
    },
    layout() { const g = G(); this.paste = new UI.Button({ x: g.W - 200, y: g.H / 2 - 150, w: 130, h: 120, emoji: '🪥', color: '#f9a8d4', emojiSize: 70, pulse: true, onTap: () => this.tapPaste() }); this.cup = new UI.Button({ x: g.W - 200, y: g.H / 2 + 40, w: 130, h: 120, emoji: '🥤', color: '#bae6fd', emojiSize: 70, onTap: () => this.tapCup() }); this.buttons = [this.paste, this.cup]; },
    resize() { this.layout(); },
    tapPaste() { if (this.state !== 'paste') return; this.state = 'brush'; this.paste.pulse = false; FL.Audio.sfx.pop(); FL.Audio.say('Brush the top teeth!'); },
    tapCup() { if (this.state !== 'rinse') return; this.state = 'done'; FL.Audio.sfx.whoosh(); this.foam = []; G().fx.burst(G().W / 2, G().H / 2, { count: 30, colors: ['#bae6fd', '#fff'], speed: 300, life: 0.8 }); this.finish(); },
    repeatPrompt() { FL.Audio.say({ paste: 'Squeeze a pea of toothpaste. Tap the toothpaste!', brush: 'Brush the fronts!', rinse: 'Rinse and spit! Tap the cup!' }[this.state] || 'Sparkly clean teeth!'); },
    down(p) { if (UI.pressDown(this.buttons, p)) return; this.pointer = { x: p.x, y: p.y }; if (this.state === 'brush') this.scrub(p, 20); },
    move(p) { if (p.button) return; if (this.pointer && this.state === 'brush') { const d = Math.hypot(p.x - this.pointer.x, p.y - this.pointer.y); if (d > 2) this.scrub(p, Math.min(d, 40)); } this.pointer = { x: p.x, y: p.y }; },
    up(p) { UI.pressUp(this.buttons, p); this.pointer = null; },
    scrub(p, amt) { const tooth = this.teeth.find((th) => Math.abs(p.x - th.x) < 48 && Math.abs(p.y - th.y) < 70); if (!tooth) return; const was = tooth.dirt; tooth.dirt = Math.max(0, tooth.dirt - amt / 320); if (Math.random() < 0.5) this.foam.push({ x: p.x + (Math.random() - 0.5) * 30, y: p.y + (Math.random() - 0.5) * 30, r: 6 + Math.random() * 10, life: 1 }); if (was > 0 && tooth.dirt === 0) { FL.Audio.sfx.sparkle(); G().fx.burst(tooth.x, tooth.y, { count: 10, type: 'star', colors: ['#fff', '#fde047'], speed: 160, life: 0.6, size: 8 }); } if (Math.random() < 0.1) FL.Audio.sfx.tap(); },
    cleanFrac() { return this.teeth.reduce((a, th) => a + (1 - th.dirt), 0) / this.teeth.length; },
    finish() { const f = this.cleanFrac(); const stars = f >= 0.98 ? 3 : f >= 0.7 ? 2 : 1; if (stars === 3) FL.Save.levelUp('teeth'); FL.Audio.say(f >= 0.98 ? 'Sparkly clean teeth!' : 'A few sugar bugs are still hiding. Keep brushing!'); FL.Game.later(() => { UI.showResults({ title: 'Toothbrush Time complete!', subtitle: `${Math.round(f * 100)}% of the teeth brushed clean`, stars, emoji: '🦷', again: () => G().go('teeth'), home: () => G().go('town', { at: 'teeth' }) }); FL.sayFact('teeth'); }, 2600); },
    update(dt) {
      this.t += dt; this.foam.forEach((b) => { b.life -= dt * 0.8; b.y -= 10 * dt; }); this.foam = this.foam.filter((b) => b.life > 0);
      if (this.state === 'brush') { this.brushT += dt; if (this.brushT > 10 && !this.said.b) { this.said.b = 1; FL.Audio.say('Now the bottom teeth!', { interrupt: false }); } if (this.brushT > 20 && !this.said.c) { this.said.c = 1; FL.Audio.say('Brush the fronts!', { interrupt: false }); } if (this.brushT >= this.BRUSH || this.cleanFrac() >= 0.999) { this.state = 'rinse'; this.cup.pulse = true; FL.Audio.say('Rinse and spit! Tap the cup!'); } }
    },
    draw(ctx) {
      const g = G(); const t = this.t;
      const grad = ctx.createLinearGradient(0, 0, 0, g.H); grad.addColorStop(0, '#fce7f3'); grad.addColorStop(1, '#fbcfe8'); ctx.fillStyle = grad; ctx.fillRect(0, 0, g.W, g.H);
      // big smiling mouth
      A.mouth(ctx, g.W / 2, g.H / 2 + 20, 400, 230, t);
      this.teeth.forEach((th) => { A.tooth2(ctx, th.x, th.y, 78, 108, th.row === 'bottom', { dirty: th.dirt > 0.5 }); const n = Math.ceil(th.bugs * th.dirt); for (let i = 0; i < n; i++) A.germ(ctx, th.x - 18 + i * 20, th.y - 18 + (i % 2) * 34, 11, { shape: 'round', color: '#fb923c' }, t + i); });
      this.foam.forEach((b) => A.bubble(ctx, b.x, b.y, b.r, Math.min(1, b.life)));
      if (this.state === 'brush' && this.pointer) { A.emoji(ctx, '🪥', this.pointer.x + 30, this.pointer.y - 30, 90, { rot: -0.6 }); }
      if (this.state === 'brush') { const frac = Math.min(1, this.brushT / this.BRUSH); ctx.fillStyle = 'rgba(0,0,0,.2)'; A.roundRect(ctx, g.W / 2 - 300, g.H - 70, 600, 30, 15); ctx.fill(); ctx.fillStyle = '#ec4899'; A.roundRect(ctx, g.W / 2 - 300, g.H - 70, 600 * frac, 30, 15); ctx.fill(); A.text(ctx, `${Math.round(this.cleanFrac() * 100)}% clean · brush all the teeth!`, g.W / 2, g.H - 100, { size: 28, color: '#831843' }); }
      UI.banner(ctx, { paste: 'Tap the toothpaste!', brush: 'Scrub the sugar bugs off!', rinse: 'Tap the cup to rinse and spit!', done: 'Sparkly clean!' }[this.state], { emoji: '🦷', size: 38 });
      this.buttons.forEach((b) => b.draw(ctx, t));
      A.hero(ctx, 110, g.H - 40, g.look, { t, facing: 1, cheer: this.state === 'done' }, 0.9);
      A.emoji(ctx, FL.Save.data.companion, 195, g.H - 60 - Math.abs(Math.sin(t * 5)) * 8, 48);
    },
  };
  FL.scenes.teeth = scene;
})();
