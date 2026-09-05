// Wash Station: water, soap, 20 seconds of scrubbing (Happy Birthday twice), rinse, dry, sparkle check.
(function () {
  const A = FL.Art, UI = FL.UI, G = () => FL.Game, D = FL.Data;
  const ZONES = [['palmL', 'Scrub the palms!'], ['palmR', 'Scrub the palms!'], ['fingersL', 'Between the fingers!'], ['fingersR', 'Between the fingers!'], ['thumbs', 'Don\'t forget the thumbs!'], ['tips', 'Fingertips and nails!']];
  const scene = {
    hud: { home: true, repeat: true }, music: 'bath', t: 0, state: 'water', zones: {}, germs: [], bubbles: [], songGroup: null, scrubT: 0, SCRUB: 20, buttons: [], lastP: null, promptIdx: 0,
    enter() {
      this.t = 0; this.state = 'water'; this.scrubT = 0; this.bubbles = []; this.lastP = null; this.promptIdx = 0; this.promptT = 0; FL.Save.addPlay('wash'); this.layout();
      this.zones = {}; ZONES.forEach(([z]) => { this.zones[z] = { clean: 0, need: 260 }; });
      this.germs = []; ZONES.forEach(([z]) => { for (let i = 0; i < 3; i++) { const p = this.zonePoint(z, i); this.germs.push({ x: p.x, y: p.y, zone: z, g: D.GERMS[(i + z.length) % 4], r: 14 + Math.random() * 6, gone: 0 }); } });
      FL.Audio.say('First, turn on the water. Tap the tap!');
    },
    layout() { const g = G(); this.cx = g.W / 2; this.cy = g.H / 2 + 40; this.tap = new UI.Button({ x: g.W / 2 - 60, y: 130, w: 120, h: 100, emoji: '🚰', color: '#94a3b8', emojiSize: 64, onTap: () => this.tapTap() }); this.soap = new UI.Button({ x: g.W - 200, y: g.H / 2 - 120, w: 130, h: 120, emoji: '🧴', color: '#f9a8d4', emojiSize: 70, onTap: () => this.tapSoap() }); this.towel = new UI.Button({ x: g.W - 200, y: g.H / 2 + 60, w: 130, h: 120, emoji: '🧻', color: '#fde68a', emojiSize: 70, onTap: () => this.tapTowel() }); this.buttons = [this.tap, this.soap, this.towel]; },
    resize() { this.layout(); },
    exit() { if (this.songGroup) this.songGroup.stop(); },
    handPos(side) { return { x: this.cx + side * 190, y: this.cy }; },
    zonePoint(z, i) { const L = this.handPos(-1), R = this.handPos(1); const j = (i - 1) * 34;
      switch (z) { case 'palmL': return { x: L.x + j, y: L.y + 20 + (i % 2) * 30 }; case 'palmR': return { x: R.x + j, y: R.y + 20 + (i % 2) * 30 }; case 'fingersL': return { x: L.x - 60 + i * 45, y: L.y - 120 }; case 'fingersR': return { x: R.x - 60 + i * 45, y: R.y - 120 }; case 'thumbs': return { x: i < 2 ? L.x + 100 : R.x - 100, y: L.y - 20 + (i % 2) * 30 }; default: return { x: (i < 2 ? L.x : R.x) - 40 + (i % 2) * 70, y: L.y - 190 }; } },
    zoneAt(x, y) { const L = this.handPos(-1), R = this.handPos(1); for (const side of [L, R]) { const dx = x - side.x, dy = y - side.y; const left = side === L; if (Math.abs(dx) < 120 && dy > -60 && dy < 110) { if (Math.abs(dx) > 80 && ((left && dx > 0) || (!left && dx < 0))) return 'thumbs'; return left ? 'palmL' : 'palmR'; } if (Math.abs(dx) < 120 && dy < -60 && dy > -160) return left ? 'fingersL' : 'fingersR'; if (Math.abs(dx) < 120 && dy <= -160 && dy > -230) return 'tips'; } return null; },
    tapTap() { if (this.state === 'water') { this.state = 'soap'; FL.Audio.sfx.whoosh(); FL.Audio.say('Now get some soap. Tap the soap!'); } else if (this.state === 'rinse') { this.state = 'dry'; FL.Audio.sfx.whoosh(); this.bubbles = []; this.germs.forEach((gm) => { if (this.zones[gm.zone].clean >= this.zones[gm.zone].need) gm.gone = 1; }); FL.Audio.say('Dry your hands. Tap the towel!'); } },
    tapSoap() { if (this.state !== 'soap') return; this.state = 'scrub'; this.scrubT = 0; FL.Audio.sfx.pop(); for (let i = 0; i < 12; i++) this.spawnBubble(this.cx + (Math.random() - 0.5) * 400, this.cy + (Math.random() - 0.5) * 200); FL.Audio.say('Scrub scrub scrub! Rub the hands until the song ends!'); this.playSong(); },
    tapTowel() { if (this.state !== 'dry') return; this.state = 'check'; FL.Audio.sfx.sparkle(); FL.Audio.say('Sparkle check! Let\'s look for leftover germs.'); FL.Game.later(() => this.finish(), 2600); },
    playSong() { const notes = D.BIRTHDAY.split(/\s+/); const spb = 60 / 150; let t = 0; this.songGroup = FL.Audio.group(); const start = FL.Audio.now() + 0.2; for (let rep = 0; rep < 2; rep++) notes.forEach((tok) => { const [n, d] = tok.split(':'); FL.Audio.note(n, { inst: 'music', when: start + t, dur: parseFloat(d) * spb, vol: 0.35, group: this.songGroup, bus: 'music' }); t += parseFloat(d) * spb; }); this.songLen = t; },
    spawnBubble(x, y) { this.bubbles.push({ x, y, r: 8 + Math.random() * 14, vy: -20 - Math.random() * 30, vx: (Math.random() - 0.5) * 30, life: 1.5 + Math.random() }); },
    repeatPrompt() { const m = { water: 'First, turn on the water. Tap the tap!', soap: 'Now get some soap. Tap the soap!', scrub: 'Keep scrubbing!', rinse: 'Time to rinse! Tap the tap!', dry: 'Dry your hands. Tap the towel!' }; if (m[this.state]) FL.Audio.say(m[this.state]); },
    down(p) { if (UI.pressDown(this.buttons, p)) return; this.lastP = { x: p.x, y: p.y }; if (this.state === 'scrub') this.rub(p, 30); },
    move(p) { if (this.state !== 'scrub' || p.button) return; if (this.lastP) { const d = Math.hypot(p.x - this.lastP.x, p.y - this.lastP.y); if (d > 2) this.rub(p, Math.min(d, 40)); } this.lastP = { x: p.x, y: p.y }; },
    up(p) { UI.pressUp(this.buttons, p); this.lastP = null; },
    rub(p, amt) { const z = this.zoneAt(p.x, p.y); if (!z) return; const Z = this.zones[z]; const was = Z.clean; Z.clean = Math.min(Z.need, Z.clean + amt); if (Math.random() < 0.5) this.spawnBubble(p.x + (Math.random() - 0.5) * 30, p.y + (Math.random() - 0.5) * 30); if (Math.random() < 0.15) FL.Audio.sfx.tap();
      const frac = Z.clean / Z.need; this.germs.filter((gm) => gm.zone === z).forEach((gm, i) => { if (frac > (i + 1) / 3.2 && !gm.gone) { gm.gone = 0.01; G().fx.burst(gm.x, gm.y, { count: 8, colors: ['#bae6fd', '#fff'], speed: 160, life: 0.5, size: 8 }); } });
      if (was < Z.need && Z.clean >= Z.need) FL.Audio.sfx.sparkle(); },
    cleanFrac() { const zs = Object.values(this.zones); return zs.reduce((a, z) => a + z.clean / z.need, 0) / zs.length; },
    finish() { const f = this.cleanFrac(); const stars = f >= 0.98 ? 3 : f >= 0.7 ? 2 : 1; if (stars === 3) FL.Save.levelUp('wash'); FL.Audio.say(f >= 0.98 ? 'All clean! The germs went down the drain!' : 'Almost! A few germs are hiding. Next time scrub a little longer.'); FL.Game.later(() => { UI.showResults({ title: 'Wash Station complete!', subtitle: `${Math.round(f * 100)}% of the hands scrubbed clean`, stars, emoji: '🧼', again: () => G().go('wash'), home: () => G().go('town', { at: 'wash' }) }); FL.sayFact('wash'); }, 2800); },
    update(dt) {
      this.t += dt; this.bubbles.forEach((b) => { b.x += b.vx * dt; b.y += b.vy * dt; b.life -= dt; }); this.bubbles = this.bubbles.filter((b) => b.life > 0);
      this.germs.forEach((gm) => { if (gm.gone > 0 && gm.gone < 1) gm.gone = Math.min(1, gm.gone + dt * 3); });
      if (this.state === 'scrub') { this.scrubT += dt; this.promptT += dt; if (this.promptT > 3.3 && this.promptIdx < ZONES.length) { this.promptT = 0; FL.Audio.say(ZONES[this.promptIdx][1], { interrupt: false }); this.promptIdx += 2; } if (this.scrubT >= this.SCRUB) { this.state = 'rinse'; FL.Audio.say('Time to rinse! Tap the tap!'); } }
    },
    draw(ctx) {
      const g = G(); const t = this.t; const scrub = this.state === 'scrub';
      const grad = ctx.createLinearGradient(0, 0, 0, g.H); grad.addColorStop(0, '#e0f2fe'); grad.addColorStop(1, '#bae6fd'); ctx.fillStyle = grad; ctx.fillRect(0, 0, g.W, g.H);
      for (let i = 0; i < 40; i++) { ctx.fillStyle = 'rgba(255,255,255,.5)'; ctx.fillRect((i % 10) * (g.W / 10) + 4, Math.floor(i / 10) * 60 + 4, g.W / 10 - 8, 52); }
      // sink
      ctx.fillStyle = '#f8fafc'; ctx.strokeStyle = '#94a3b8'; ctx.lineWidth = 4; A.roundRect(ctx, g.W / 2 - 420, this.cy - 40, 840, 360, 60); ctx.fill(); ctx.stroke(); ctx.fillStyle = '#cbd5e1'; A.circle(ctx, g.W / 2, this.cy + 250, 26); ctx.fill();
      // water stream
      if (this.state !== 'water' && this.state !== 'check' && this.state !== 'dry') { ctx.fillStyle = 'rgba(56,189,248,.55)'; A.roundRect(ctx, g.W / 2 - 14, 230, 28, this.cy - 60 - 230 + 20, 10); ctx.fill(); for (let i = 0; i < 6; i++) { ctx.fillStyle = 'rgba(255,255,255,.7)'; A.circle(ctx, g.W / 2 + Math.sin(t * 8 + i) * 8, 250 + ((t * 300 + i * 60) % (this.cy - 300)), 4); ctx.fill(); } }
      // hands
      [-1, 1].forEach((side) => { const P = this.handPos(side); ctx.save(); ctx.translate(P.x, P.y); ctx.scale(side, 1); ctx.fillStyle = g.look.skin; ctx.strokeStyle = 'rgba(120,53,15,.5)'; ctx.lineWidth = 3;
        A.roundRect(ctx, -110, -60, 220, 170, 70); ctx.fill(); ctx.stroke(); // palm
        for (let f = 0; f < 4; f++) { const fx = -85 + f * 55; const fh = [150, 175, 165, 130][f]; A.roundRect(ctx, fx - 22, -60 - fh, 44, fh + 30, 22); ctx.fill(); ctx.stroke(); }
        ctx.save(); ctx.translate(100, 0); ctx.rotate(0.6); A.roundRect(ctx, -22, -120, 44, 140, 22); ctx.fill(); ctx.stroke(); ctx.restore(); // thumb
        ctx.restore(); });
      // germs
      this.germs.forEach((gm) => { if (gm.gone >= 1) return; const a = 1 - gm.gone; A.germ(ctx, gm.x, gm.y, gm.r * (1 - gm.gone * 0.5), gm.g, t, { alpha: this.state === 'check' ? 1 : a * 0.95 }); });
      if (this.state === 'check') { ctx.fillStyle = 'rgba(147,51,234,.18)'; ctx.fillRect(0, 0, g.W, g.H); this.germs.forEach((gm) => { if (gm.gone < 1) { ctx.strokeStyle = '#a855f7'; ctx.lineWidth = 4; A.circle(ctx, gm.x, gm.y, gm.r + 12 + Math.sin(t * 8) * 4); ctx.stroke(); } }); }
      // soap suds
      if (scrub || this.state === 'rinse') { ctx.fillStyle = 'rgba(255,255,255,.55)'; Object.keys(this.zones).forEach((z) => { const Z = this.zones[z]; const p = this.zonePoint(z, 1); if (Z.clean > 0) { A.circle(ctx, p.x, p.y, 40 + (Z.clean / Z.need) * 30); ctx.fill(); } }); }
      this.bubbles.forEach((b) => A.bubble(ctx, b.x, b.y, b.r, Math.min(1, b.life)));
      // zone progress + timer
      if (scrub) { const frac = Math.min(1, this.scrubT / this.SCRUB); ctx.fillStyle = 'rgba(0,0,0,.2)'; A.roundRect(ctx, g.W / 2 - 300, g.H - 70, 600, 30, 15); ctx.fill(); ctx.fillStyle = '#38bdf8'; A.roundRect(ctx, g.W / 2 - 300, g.H - 70, 600 * frac, 30, 15); ctx.fill(); A.text(ctx, `Scrub for ${Math.ceil(this.SCRUB - this.scrubT)} more seconds 🎵`, g.W / 2, g.H - 100, { size: 28, color: '#0c4a6e' }); }
      const step = { water: 'Tap the tap to turn on the water!', soap: 'Tap the soap!', scrub: 'Scrub the hands with your finger!', rinse: 'Tap the tap to rinse!', dry: 'Tap the towel to dry!', check: 'Sparkle check!' }[this.state];
      UI.banner(ctx, step, { emoji: '🧼', size: 38 });
      // step dots
      const steps = ['water', 'soap', 'scrub', 'rinse', 'dry', 'check']; UI.progressDots(ctx, steps.indexOf(this.state), steps.length, 140);
      this.tap.color = this.state === 'water' || this.state === 'rinse' ? '#38bdf8' : '#94a3b8'; this.tap.pulse = this.state === 'water' || this.state === 'rinse'; this.soap.pulse = this.state === 'soap'; this.towel.pulse = this.state === 'dry';
      this.buttons.forEach((b) => b.draw(ctx, t));
      A.hero(ctx, 110, g.H - 40, g.look, { t, facing: 1, cheer: this.state === 'check' }, 0.9);
      A.emoji(ctx, FL.Save.data.companion, 195, g.H - 60 - Math.abs(Math.sin(t * 5)) * 8, 48);
      // zone hint arrows
      if (scrub) { const z = ZONES.find(([zz]) => this.zones[zz].clean < this.zones[zz].need); if (z) { const p = this.zonePoint(z[0], 1); A.emoji(ctx, '👆', p.x + 30, p.y + 50 + Math.sin(t * 6) * 8, 44); } }
    },
  };
  FL.scenes.wash = scene;
})();
