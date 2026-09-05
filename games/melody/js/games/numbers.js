// Counting Pond: tap each frog to count it (every frog sings a note), then pick the number.
(function () {
  const A = FL.Art, UI = FL.UI, G = () => FL.Game;
  const NUM_WORDS = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen', 'twenty'];
  const scene = {
    t: 0, hud: { home: true, repeat: true }, round: 0, total: 6, good: 0, frogs: [], choices: [], n: 1, mode: 'count', counted: 0, phase: 'count', locked: false, tries: 0, level: 1, hopFrogs: [],
    enter() { this.t = 0; this.round = 0; this.good = 0; this.level = FL.Save.level('numbers'); FL.Save.addPlay('numbers'); this.newRound(true); },
    newRound(first) {
      const g = G(); const max = Math.min(FL.Data.MAX_COUNT, 4 + this.level * 2); this.n = 1 + Math.floor(Math.random() * max);
      this.mode = this.level >= 2 && this.round % 2 === 1 ? 'find' : 'count';
      this.tries = 0; this.locked = false; this.counted = 0; this.roundT = 0; this.choices = []; this.hopFrogs = []; this.frogs = [];
      const cx = g.W / 2, cy = g.H / 2 + 60; // pond centre
      if (this.mode === 'count') {
        this.phase = 'count';
        const cols = this.n <= 4 ? this.n : this.n <= 8 ? 4 : 5; const rows = Math.ceil(this.n / cols);
        for (let i = 0; i < this.n; i++) { const r = Math.floor(i / cols), c = i % cols; const inRow = Math.min(cols, this.n - r * cols); const x = cx + (c - (inRow - 1) / 2) * 190 + (Math.random() - 0.5) * 20; const y = cy - 40 + (r - (rows - 1) / 2) * 150 + (Math.random() - 0.5) * 16; this.frogs.push({ x, y, num: 0, hop: 0, seed: Math.random() * 6, delay: i * 0.1, scale: 0 }); }
      } else {
        this.phase = 'choose';
        const opts = new Set([this.n]); while (opts.size < (this.level >= 3 ? 4 : 3)) opts.add(Math.max(1, Math.min(max, this.n + Math.floor(Math.random() * 7) - 3)));
        const arr = [...opts].sort(() => Math.random() - 0.5); const sp = 220; arr.forEach((v, i) => this.choices.push({ v, x: cx + (i - (arr.length - 1) / 2) * sp, y: cy + 20, wob: 0 }));
      }
      if (!first) FL.Audio.sfx.whoosh();
      FL.Game.later(() => this.repeatPrompt(), first ? 400 : 600);
    },
    repeatPrompt() {
      if (this.mode === 'count') { if (this.phase === 'count') FL.Audio.say('Tap each frog to count them!'); else FL.Audio.say(`How many frogs did you count? Tap the number.`); }
      else FL.Audio.say(`Can you find the number ${this.n}?`);
    },
    showChoices() {
      const g = G(); const max = Math.min(FL.Data.MAX_COUNT, 4 + this.level * 2); const opts = new Set([this.n]); while (opts.size < 3) opts.add(Math.max(1, Math.min(Math.max(max, this.n + 2), this.n + Math.floor(Math.random() * 5) - 2)));
      const arr = [...opts].sort(() => Math.random() - 0.5); arr.forEach((v, i) => this.choices.push({ v, x: g.W / 2 + (i - 1) * 220, y: g.H - 120, wob: 0 }));
      this.phase = 'choose'; FL.Game.later(() => this.repeatPrompt(), 300);
    },
    down(p) {
      if (this.locked) return; const g = G();
      if (this.phase === 'count') {
        for (const f of this.frogs) { if (!f.num && f.scale > 0.9 && Math.hypot(p.x - f.x, p.y - (f.y - 20)) < 60) { this.counted++; f.num = this.counted; f.hop = 1; FL.Audio.sfx.ribbit(); FL.Audio.sfx.count(this.counted - 1); FL.Audio.say(String(this.counted), { rate: 1 }); g.fx.burst(f.x, f.y - 40, { count: 10, colors: ['#bef264', '#fff'], speed: 200, life: 0.6, size: 8 }); if (this.counted === this.n) { this.locked = true; FL.Game.later(() => { this.locked = false; this.showChoices(); }, 900); } return; } }
      } else {
        for (const c of this.choices) { if (Math.hypot(p.x - c.x, p.y - c.y) < 70) { this.choose(c); return; } }
      }
    },
    choose(c) {
      const g = G();
      if (c.v === this.n) {
        this.locked = true; if (this.tries === 0) this.good++; FL.Audio.sfx.correct(); g.fx.burst(c.x, c.y, { count: 30, type: 'star', colors: ['#fde047', '#fff', '#4ade80'], speed: 380, life: 0.9, size: 12 });
        if (this.mode === 'count') { FL.Audio.say(`Yes! ${this.n} frog${this.n > 1 ? 's' : ''}!`); this.frogs.forEach((f, i) => FL.Game.later(() => { f.hop = 1; FL.Audio.sfx.hop(); }, i * 120)); }
        else { FL.Audio.say(`Yes! That's ${this.n}! Let's count ${this.n} frogs!`); for (let i = 0; i < this.n; i++) FL.Game.later(() => { this.hopFrogs.push({ x: 120 + i * ((g.W - 240) / Math.max(1, this.n - 1)) * (this.n === 1 ? 0 : 1) + (this.n === 1 ? g.W / 2 - 120 : 0), y: g.H - 110, t: 0, num: i + 1 }); FL.Audio.sfx.count(i); FL.Audio.say(String(i + 1), { rate: 1.05 }); }, 1500 + i * 550); }
        this.round++;
        const wait = this.mode === 'count' ? 2200 : 2200 + this.n * 550;
        FL.Game.later(() => { if (this.round >= this.total) this.finish(); else this.newRound(false); }, wait);
      } else { this.tries++; c.wob = 1; FL.Audio.sfx.wrong(); FL.Audio.say(`That's ${c.v}.`); FL.Audio.say(this.mode === 'count' ? 'Count the frogs again!' : `Look for ${this.n}!`, { interrupt: false }); }
    },
    finish() {
      const stars = UI.starsFor(this.good, this.total); if (stars === 3) FL.Save.levelUp('numbers');
      UI.showResults({ title: 'Counting Pond complete!', subtitle: `${this.good} of ${this.total} right on the first try`, stars, emoji: '🐸', again: () => G().go('numbers'), home: () => G().go('world', { at: 'numbers' }) });
    },
    update(dt) {
      this.t += dt; this.roundT += dt;
      this.frogs.forEach((f) => { if (this.roundT > f.delay) f.scale = Math.min(1, f.scale + dt * 4); f.hop = Math.max(0, f.hop - dt * 2.2); });
      this.choices.forEach((c) => { c.wob = Math.max(0, c.wob - dt * 2); });
      this.hopFrogs.forEach((f) => { f.t += dt; });
    },
    draw(ctx) {
      const g = G(); const t = this.t;
      A.sky(ctx, g.W, g.H, '#93c5fd', '#dbeafe'); A.sun(ctx, g.W - 150, 215, 56, t);
      A.cloud(ctx, 250 + Math.sin(t * 0.25) * 20, 150, 34, 0.9);
      A.hills(ctx, g.W, g.H, g.H * 0.36, '#bbf7d0', 4); A.grass(ctx, g.W, g.H, g.H * 0.42);
      // reeds + trees
      A.tree(ctx, 90, g.H * 0.48, 1, 2, t); A.tree(ctx, g.W - 90, g.H * 0.5, 1.1, 1, t);
      ctx.strokeStyle = '#15803d'; ctx.lineWidth = 6; ctx.lineCap = 'round'; for (let i = 0; i < 8; i++) { const x = 60 + i * 30 + (i > 3 ? g.W - 360 : 0); ctx.beginPath(); ctx.moveTo(x, g.H * 0.5); ctx.quadraticCurveTo(x + Math.sin(t + i) * 10, g.H * 0.4, x + 6, g.H * 0.32); ctx.stroke(); A.emoji(ctx, '🌾', x + 6, g.H * 0.31, 26); }
      // pond
      const pcx = g.W / 2, pcy = g.H / 2 + 60; const prx = Math.min(g.W * 0.42, 620), pry = 260;
      ctx.fillStyle = '#a3e635'; A.ellipse(ctx, pcx, pcy, prx + 20, pry + 18); ctx.fill();
      const pg = ctx.createRadialGradient(pcx - 100, pcy - 80, 30, pcx, pcy, prx); pg.addColorStop(0, '#bae6fd'); pg.addColorStop(1, '#38bdf8'); ctx.fillStyle = pg; A.ellipse(ctx, pcx, pcy, prx, pry); ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,.5)'; ctx.lineWidth = 3; for (let i = 0; i < 3; i++) { const p = (t * 0.2 + i / 3) % 1; ctx.globalAlpha = 1 - p; A.ellipse(ctx, pcx + 200, pcy - 100, 20 + p * 200, 8 + p * 80); ctx.stroke(); } ctx.globalAlpha = 1;
      A.emoji(ctx, '🦆', pcx + prx * 0.75 * Math.cos(t * 0.3), pcy + pry * 0.8 * Math.sin(t * 0.3), 40, { flip: Math.sin(t * 0.3) > 0 });
      A.emoji(ctx, '🐟', pcx - prx * 0.7 * Math.cos(t * 0.5), pcy + pry * 0.6 * Math.sin(t * 0.7), 30, { alpha: 0.6, flip: Math.sin(t * 0.5) > 0 });
      // prompt
      if (this.mode === 'count') UI.banner(ctx, this.phase === 'count' ? 'Tap each frog to count!' : 'How many frogs?', { emoji: '🐸', size: 42 });
      else UI.banner(ctx, `Find the number ${this.n}`, { emoji: '🔢', size: 44 });
      UI.progressDots(ctx, this.round, this.total, 140);
      // frogs on lilypads
      this.frogs.forEach((f) => {
        if (f.scale <= 0) return; ctx.save(); ctx.translate(f.x, f.y); ctx.scale(f.scale, f.scale);
        A.lilypad(ctx, 0, 10, 62); const hop = Math.sin(f.hop * Math.PI) * 40;
        A.emoji(ctx, '🐸', 0, -34 - hop - Math.abs(Math.sin(t * 3 + f.seed)) * 3, 84, { shadow: true });
        if (f.num) { ctx.fillStyle = '#fde047'; ctx.strokeStyle = '#b45309'; ctx.lineWidth = 4; A.circle(ctx, 44, -70 - hop, 30); ctx.fill(); ctx.stroke(); A.text(ctx, String(f.num), 44, -68 - hop, { size: 36, color: '#7c2d12' }); }
        ctx.restore();
      });
      // number choices
      this.choices.forEach((c) => {
        const wob = Math.sin(t * 30) * c.wob * 0.12; ctx.save(); ctx.translate(c.x, c.y + Math.sin(t * 2 + c.v) * 4); ctx.rotate(wob);
        A.lilypad(ctx, 0, 8, 74, { color: '#4ade80' }); ctx.fillStyle = '#fff7ed'; ctx.strokeStyle = '#f472b6'; ctx.lineWidth = 6; A.circle(ctx, 0, 0, 56); ctx.fill(); ctx.stroke();
        A.text(ctx, String(c.v), 0, 2, { size: 64, color: '#7c3aed' }); ctx.restore();
      });
      if (this.phase === 'count' && this.mode === 'count') A.text(ctx, `${this.counted}`, g.W - 120, g.H - 90, { size: 110, color: '#fff', stroke: '#0ea5e9', strokeWidth: 12 });
      this.hopFrogs.forEach((f) => { const k = Math.min(1, f.t / 0.4); const hop = Math.sin(Math.min(1, f.t / 0.5) * Math.PI) * 60; A.emoji(ctx, '🐸', f.x, f.y - hop, 70 * k); ctx.fillStyle = '#fde047'; ctx.strokeStyle = '#b45309'; ctx.lineWidth = 3; A.circle(ctx, f.x, f.y - 90 - hop, 24 * k); ctx.fill(); ctx.stroke(); A.text(ctx, String(f.num), f.x, f.y - 88 - hop, { size: 30 * k, color: '#7c2d12' }); });
      A.princess(ctx, 120, g.H - 40, g.look, { t, facing: 1 }, 1);
      A.emoji(ctx, FL.Save.data.companion, 215, g.H - 60 - Math.abs(Math.sin(t * 5)) * 8, 56);
    },
  };
  scene.music = 'pond';
  FL.scenes.numbers = scene;
})();
