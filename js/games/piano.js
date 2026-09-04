// Piano Pavilion: a rainbow piano. Free play, listen to a song, or learn it key by key.
(function () {
  const A = FL.Art, UI = FL.UI, G = () => FL.Game;
  const KEYS = [['C4', '#ef4444'], ['D4', '#f97316'], ['E4', '#facc15'], ['F4', '#22c55e'], ['G4', '#14b8a6'], ['A4', '#3b82f6'], ['B4', '#8b5cf6'], ['C5', '#ec4899'], ['D5', '#f43f5e'], ['E5', '#fb923c']];
  const KB = { a: 0, s: 1, d: 2, f: 3, g: 4, h: 5, j: 6, k: 7, l: 8, ';': 9 };
  const INSTS = [['music', '🎵', 'Music box'], ['piano', '🎹', 'Piano'], ['bell', '🔔', 'Bells'], ['flute', '🎺', 'Flute']];
  const scene = {
    t: 0, hud: { home: true }, mode: 'free', inst: 0, song: 0, press: [], seq: [], step: 0, group: null, listenStart: 0, buttons: [], stepT: 0, cheer: 0, keyCount: 10,
    enter() { this.t = 0; this.mode = 'free'; this.press = KEYS.map(() => 0); this.step = 0; this.group = null; this.cheer = 0; FL.Save.addPlay('piano'); this.layout(); FL.Audio.say('Welcome to the Piano Pavilion! Tap the colourful keys to make music!'); },
    layout() {
      const g = G(); this.buttons = [];
      this.keyCount = g.W >= 1400 ? 10 : 8;
      this.keyW = Math.min(150, (g.W - 120) / this.keyCount); this.keyX0 = g.W / 2 - (this.keyCount * this.keyW) / 2; this.keyY = g.H - 300; this.keyH = 270;
      const mk = (i, label, emoji, color, fn) => new UI.Button({ x: 30 + i * 250, y: 120, w: 232, h: 84, label, emoji, color, size: 28, onTap: fn });
      this.buttons.push(mk(0, 'Free play', '🎨', this.mode === 'free' ? '#4ade80' : '#94a3b8', () => this.setMode('free')));
      this.buttons.push(mk(1, 'Listen', '👂', this.mode === 'listen' ? '#4ade80' : '#94a3b8', () => this.setMode('listen')));
      this.buttons.push(mk(2, 'Teach me', '🌟', this.mode === 'teach' ? '#4ade80' : '#94a3b8', () => this.setMode('teach')));
      // song chooser
      const s = FL.Songs.list[this.song];
      const sy = 226; const sx = g.W - 30;
      this.buttons.push(new UI.Button({ x: sx - 450, y: sy, w: 70, h: 72, emoji: '⬅️', color: '#f9a8d4', emojiSize: 30, onTap: () => { this.song = (this.song + FL.Songs.list.length - 1) % FL.Songs.list.length; this.setMode(this.mode); } }));
      this.buttons.push(new UI.Button({ x: sx - 370, y: sy, w: 290, h: 72, label: s.title, emoji: s.emoji, color: '#fde68a', textColor: '#7c2d12', textStroke: 'rgba(0,0,0,0)', size: s.title.length > 14 ? 20 : 24, onTap: () => this.setMode(this.mode === 'free' ? 'listen' : this.mode) }));
      this.buttons.push(new UI.Button({ x: sx - 70, y: sy, w: 70, h: 72, emoji: '➡️', color: '#f9a8d4', emojiSize: 30, onTap: () => { this.song = (this.song + 1) % FL.Songs.list.length; this.setMode(this.mode); } }));
      // instruments
      INSTS.forEach((it, i) => this.buttons.push(new UI.Button({ x: 30 + i * 96, y: 226, w: 84, h: 72, emoji: it[1], color: this.inst === i ? '#fde047' : '#e9d5ff', emojiSize: 38, onTap: () => { this.inst = i; this.layout(); FL.Audio.note('C5', { inst: INSTS[i][0], vol: 0.4 }); } })));
    },
    resize() { this.layout(); },
    exit() { this.stopSong(); },
    stopSong() { if (this.group) { this.group.stop(); this.group = null; } },
    setMode(m) {
      this.stopSong(); this.mode = m; this.step = 0; this.stepT = 0; this.layout();
      const song = FL.Songs.list[this.song]; this.tl = FL.Songs.timeline(song, song.bpm * 0.85); this.seq = this.tl.filter((n) => !n.rest);
      this.keyIndex = {}; KEYS.forEach((k, i) => { this.keyIndex[k[0]] = i; });
      // songs above the keyboard range get shifted down an octave
      const maxIdx = this.keyCount - 1; this.shift = this.seq.some((n) => this.keyIndex[n.note] == null || this.keyIndex[n.note] > maxIdx) ? -12 : 0;
      if (this.shift) { this.seq = this.seq.map((n) => ({ ...n, note: FL.Audio.transpose(n.note, this.shift) })); }
      if (m === 'listen') { this.listenStart = FL.Audio.now() + 0.6; this.group = FL.Audio.group(); this.seq.forEach((n) => FL.Audio.note(n.note, { inst: INSTS[this.inst][0], when: this.listenStart + n.t, dur: n.dur, vol: 0.45, group: this.group })); FL.Audio.say(`Listen to ${song.title}!`); }
      else if (m === 'teach') FL.Audio.say(`Let's learn ${song.title}! Tap the glowing key.`);
      else FL.Audio.say('Free play! Make up your own song!');
    },
    keyAt(x, y) { if (y < this.keyY - 30) return -1; const i = Math.floor((x - this.keyX0) / this.keyW); return i >= 0 && i < this.keyCount ? i : -1; },
    down(p) { if (UI.pressDown(this.buttons, p)) return; const k = this.keyAt(p.x, p.y); if (k >= 0) this.play(k); },
    up(p) { UI.pressUp(this.buttons, p); },
    key(k) { if (KB[k] != null && KB[k] < this.keyCount) this.play(KB[k]); },
    play(i) {
      const g = G(); this.press[i] = 1; const note = KEYS[i][0];
      FL.Audio.note(note, { inst: INSTS[this.inst][0], vol: 0.5, dur: 0.6 });
      const x = this.keyX0 + i * this.keyW + this.keyW / 2;
      g.fx.burst(x, this.keyY - 10, { count: 10, type: 'note', colors: [KEYS[i][1]], speed: 220, life: 0.9, size: 12, gravity: -200, spread: 1.2 });
      if (this.mode === 'teach' && this.step < this.seq.length) {
        const want = this.keyIndex[this.seq[this.step].note];
        if (want === i) {
          this.step++; g.fx.burst(x, this.keyY + 40, { count: 14, type: 'star', colors: ['#fde047', '#fff'], speed: 260, life: 0.7, size: 10 }); this.stepT = 0;
          const prevLine = this.seq[this.step - 1].line; const nextLine = this.step < this.seq.length ? this.seq[this.step].line : -1;
          if (this.step >= this.seq.length) { this.cheer = 3; FL.Audio.sfx.fanfare(); g.fx.burst(g.W / 2, g.H / 2, { count: 80, type: 'confetti', speed: 600, life: 2 }); FL.Audio.say(`You played the whole song! Beautiful!`); FL.Save.addStars(3); UI.checkUnlocks(); UI.toast('You learned a song! +3 stars', '🌟'); setTimeout(() => { if (G().sceneName === 'piano') this.setMode('teach'); }, 4000); }
          else if (nextLine !== prevLine) { g.fx.text(g.W / 2, g.H / 2 - 40, ['Great!', 'Lovely!', 'Keep going!', 'Wonderful!'][prevLine % 4], { color: '#fde047', size: 52 }); }
        }
      }
    },
    update(dt) {
      this.t += dt; this.stepT += dt; this.cheer = Math.max(0, this.cheer - dt);
      for (let i = 0; i < KEYS.length; i++) this.press[i] = Math.max(0, this.press[i] - dt * 5);
      if (this.mode === 'listen' && this.group) {
        const now = FL.Audio.now() - this.listenStart; this.seq.forEach((n) => { if (!n.lit && now >= n.t && now < n.t + 0.15) { n.lit = true; const ki = this.keyIndex[n.note]; if (ki != null) { this.press[ki] = 1; G().fx.burst(this.keyX0 + ki * this.keyW + this.keyW / 2, this.keyY - 10, { count: 6, type: 'note', colors: [KEYS[ki][1]], speed: 180, life: 0.8, size: 11, gravity: -200, spread: 1 }); } } });
        if (now > this.tl.duration + 1) { this.group = null; this.seq.forEach((n) => { n.lit = false; }); FL.Audio.say('Now you try! Tap Teach me.'); }
      }
    },
    draw(ctx) {
      const g = G(); const t = this.t;
      const grad = ctx.createLinearGradient(0, 0, 0, g.H); grad.addColorStop(0, '#c084fc'); grad.addColorStop(0.5, '#f9a8d4'); grad.addColorStop(1, '#fde68a'); ctx.fillStyle = grad; ctx.fillRect(0, 0, g.W, g.H);
      A.cloud(ctx, 200 + Math.sin(t * 0.3) * 30, 80, 30, 0.7); A.cloud(ctx, g.W - 300, 60, 36, 0.7);
      // pavilion roof and pillars
      ctx.fillStyle = 'rgba(255,255,255,.35)'; A.roundRect(ctx, 0, 0, g.W, 60, 0); ctx.fill();
      for (let i = 0; i < 14; i++) { const bx = 40 + i * ((g.W - 80) / 13); ctx.fillStyle = ['#f472b6', '#fde047', '#60a5fa', '#4ade80'][i % 4]; ctx.beginPath(); ctx.moveTo(bx - 16, 58); ctx.lineTo(bx + 16, 58); ctx.lineTo(bx, 90); ctx.closePath(); ctx.fill(); }
      // stage floor
      ctx.fillStyle = '#e9d5ff'; A.roundRect(ctx, 0, this.keyY - 90, g.W, g.H, 0); ctx.fill(); ctx.fillStyle = '#d8b4fe'; ctx.fillRect(0, this.keyY - 90, g.W, 12);
      // piano body
      ctx.fillStyle = '#3b0764'; A.roundRect(ctx, this.keyX0 - 26, this.keyY - 60, this.keyCount * this.keyW + 52, this.keyH + 90, 30); ctx.fill();
      ctx.fillStyle = '#6d28d9'; A.roundRect(ctx, this.keyX0 - 16, this.keyY - 50, this.keyCount * this.keyW + 32, 40, 16); ctx.fill();
      // keys
      const nextIdx = this.mode === 'teach' && this.step < this.seq.length ? this.keyIndex[this.seq[this.step].note] : -1;
      for (let i = 0; i < this.keyCount; i++) {
        const [note, color] = KEYS[i]; const x = this.keyX0 + i * this.keyW + 4, w = this.keyW - 8; const pr = this.press[i]; const y = this.keyY + pr * 10;
        ctx.fillStyle = A.shade(color, -0.35); A.roundRect(ctx, x, this.keyY + 10, w, this.keyH - 10, 18); ctx.fill();
        const kg = ctx.createLinearGradient(0, y, 0, y + this.keyH); kg.addColorStop(0, A.shade(color, 0.35 + pr * 0.4)); kg.addColorStop(1, color); ctx.fillStyle = kg; A.roundRect(ctx, x, y, w, this.keyH - 12, 18); ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,.35)'; A.roundRect(ctx, x + 10, y + 10, w - 20, 40, 14); ctx.fill();
        A.text(ctx, note[0], x + w / 2, y + this.keyH - 70, { size: 54, color: '#fff', stroke: 'rgba(0,0,0,.25)', strokeWidth: 5 });
        A.text(ctx, ['do', 're', 'mi', 'fa', 'sol', 'la', 'ti', 'do', 're', 'mi'][i], x + w / 2, y + this.keyH - 30, { size: 22, color: 'rgba(255,255,255,.85)' });
        if (nextIdx === i) { const b = Math.abs(Math.sin(t * 5)); ctx.save(); ctx.shadowColor = '#fff'; ctx.shadowBlur = 30 + b * 30; ctx.strokeStyle = '#fff'; ctx.lineWidth = 8; A.roundRect(ctx, x + 4, y + 4, w - 8, this.keyH - 20, 16); ctx.stroke(); ctx.restore(); A.emoji(ctx, '👇', x + w / 2, y - 60 - b * 18, 60); const lyr = this.seq[this.step].lyric; if (lyr) A.text(ctx, lyr, x + w / 2, y - 120 - b * 18, { size: 34, color: '#fff', stroke: '#7c3aed', strokeWidth: 6 }); }
      }
      // progress in teach mode
      if (this.mode === 'teach') { const pct = this.step / this.seq.length; ctx.fillStyle = 'rgba(255,255,255,.5)'; A.roundRect(ctx, g.W / 2 - 300, 330, 600, 28, 14); ctx.fill(); ctx.fillStyle = '#fde047'; A.roundRect(ctx, g.W / 2 - 300, 330, 600 * pct, 28, 14); ctx.fill(); A.text(ctx, `${this.step} / ${this.seq.length} notes`, g.W / 2, 385, { size: 26, color: '#fff', stroke: 'rgba(80,20,90,.5)' }); if (this.stepT > 6 && this.step < this.seq.length) A.text(ctx, 'Tap the glowing key!', g.W / 2, 430, { size: 32, color: '#fff', stroke: 'rgba(80,20,90,.5)' }); }
      if (this.mode === 'listen' && this.group) A.text(ctx, '👂 Listen and watch the keys light up...', g.W / 2, 350, { size: 34, color: '#fff', stroke: 'rgba(80,20,90,.5)' });
      this.buttons.forEach((b) => b.draw(ctx, t));
      A.text(ctx, INSTS[this.inst][2], 30 + 2 * 96, 320, { size: 22, color: '#fff', stroke: 'rgba(80,20,90,.5)' }); A.text(ctx, 'Song:', g.W - 30 - 450 - 40, 262, { size: 22, color: '#fff', stroke: 'rgba(80,20,90,.5)', align: 'right' });
      A.princess(ctx, g.W - 110, this.keyY - 70, g.look, { t, dance: this.cheer > 0 ? 1 : 0.5, sing: this.mode !== 'free' || this.press.some((p) => p > 0.3) }, 1);
      A.emoji(ctx, FL.Save.data.companion, g.W - 200, this.keyY - 100 - Math.abs(Math.sin(t * 5)) * 10, 56);
    },
  };
  FL.scenes.piano = scene;
})();
