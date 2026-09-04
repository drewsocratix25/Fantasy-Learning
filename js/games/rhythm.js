// Melody Castle: gems fall down four lanes; tap the lane when the gem reaches the glowing pad.
(function () {
  const A = FL.Art, UI = FL.UI, G = () => FL.Game;
  const LANES = 4; const LANE_COLORS = ['#f43f5e', '#f59e0b', '#22c55e', '#3b82f6']; const LANE_EMOJI = ['💎', '⭐', '🍀', '💙'];
  const KEYS = { a: 0, s: 1, d: 2, f: 3, ArrowLeft: 0, ArrowDown: 1, ArrowUp: 2, ArrowRight: 3, 1: 0, 2: 1, 3: 2, 4: 3 };
  const LEAD = 2.3; // seconds a gem is visible before it should be hit
  const scene = {
    t: 0, hud: { home: true }, song: null, notes: [], state: 'count', start: 0, group: null, hits: 0, perfects: 0, misses: 0, combo: 0, best: 0, padFlash: [0, 0, 0, 0], laneMap: null, beatPulse: 0, lastBeat: -1, audience: [], curLine: 0, ended: false, speedMul: 1,
    enter(params) {
      const g = G(); this.t = 0; this.ended = false;
      this.song = FL.Songs.byId(params.song) || FL.Songs.list[0];
      const sp = FL.Save.data.settings.speed; this.speedMul = sp === 'slow' ? 0.78 : sp === 'fast' ? 1.1 : 0.94;
      this.tl = FL.Songs.timeline(this.song, this.song.bpm * this.speedMul);
      this.laneMap = FL.Songs.lanes(this.song, LANES);
      this.notes = this.tl.filter((n) => !n.rest).map((n, i) => ({ ...n, lane: this.laneMap[n.note], hit: false, missed: false, id: i }));
      this.hits = 0; this.perfects = 0; this.misses = 0; this.combo = 0; this.best = 0; this.padFlash = [0, 0, 0, 0]; this.lastBeat = -1; this.curLine = 0;
      this.state = 'count'; this.countT = 0; this.group = null;
      this.audience = ['🐰', '🦊', '🐻', '🐱', '🐶', '🐼', '🦄', '🐸'].map((e, i) => ({ e, x: 0, i }));
      FL.Save.addPlay('rhythm');
      FL.Audio.say(`${this.song.title}! Tap the gems when they reach the sparkly pads. Ready?`);
      this.layout();
    },
    layout() { const g = G(); this.laneW = 150; this.laneX0 = g.W / 2 - (LANES * this.laneW) / 2; this.hitY = g.H - 170; this.topY = 120; },
    resize() { this.layout(); },
    exit() { if (this.group) this.group.stop(); if (this.perc) this.perc.stop(); this.group = null; },
    startSong() {
      const now = FL.Audio.now(); this.start = now + LEAD + 0.2;
      this.group = FL.Audio.playSong(this.song, { when: this.start, bpm: this.song.bpm * this.speedMul, inst: 'music', vol: 0.4 });
      // gentle percussion on the beat
      this.perc = FL.Audio.group(); const spb = this.tl.spb; const beats = Math.ceil(this.tl.duration / spb);
      for (let b = 0; b < beats; b++) { FL.Audio.note(0, { inst: b % 4 === 0 ? 'kick' : 'shaker', when: this.start + b * spb, vol: b % 4 === 0 ? 0.35 : 0.12, group: this.perc, bus: 'music' }); if (b % 2 === 1) FL.Audio.note(0, { inst: 'shaker', when: this.start + b * spb + spb / 2, vol: 0.06, group: this.perc, bus: 'music' }); }
      this.state = 'play';
    },
    songTime() { return FL.Audio.now() - this.start; },
    laneAt(x) { const l = Math.floor((x - this.laneX0) / this.laneW); return l >= 0 && l < LANES ? l : -1; },
    down(p) { if (this.state !== 'play') return; const l = this.laneAt(p.x); if (l >= 0 && p.y > this.topY - 40) this.strike(l); },
    key(k) { if (this.state !== 'play') return; if (KEYS[k] != null) this.strike(KEYS[k]); },
    strike(l) {
      const now = this.songTime(); this.padFlash[l] = 1;
      let best = null, bd = 0.3;
      for (const n of this.notes) { if (n.hit || n.missed || n.lane !== l) continue; const d = Math.abs(n.t - now); if (d < bd) { bd = d; best = n; } }
      const x = this.laneX0 + l * this.laneW + this.laneW / 2;
      if (best) {
        best.hit = true; this.hits++; this.combo++; this.best = Math.max(this.best, this.combo); const perfect = bd < 0.13; if (perfect) this.perfects++;
        FL.Audio.note(best.note, { inst: 'bell', vol: perfect ? 0.45 : 0.3, dur: 0.4 });
        G().fx.burst(x, this.hitY, { count: perfect ? 26 : 14, type: 'star', colors: [LANE_COLORS[l], '#fff', '#fde047'], speed: perfect ? 420 : 280, life: 0.7, size: 12 });
        G().fx.text(x, this.hitY - 80, perfect ? 'Perfect!' : 'Great!', { color: perfect ? '#fde047' : '#fff', size: perfect ? 44 : 36 });
        if (this.combo > 0 && this.combo % 10 === 0) { G().fx.text(G().W / 2, 250, `${this.combo} in a row! 🌟`, { color: '#fde047', size: 54, life: 1.4 }); G().fx.burst(G().W / 2, 250, { count: 30, type: 'confetti', speed: 400, life: 1.4 }); }
      } else { FL.Audio.note(['C5', 'D5', 'E5', 'G5'][l], { inst: 'wood', vol: 0.15, dur: 0.1 }); G().fx.burst(x, this.hitY, { count: 5, colors: ['rgba(255,255,255,.6)'], speed: 120, life: 0.4, size: 8 }); }
    },
    update(dt) {
      const g = G(); this.t += dt;
      for (let i = 0; i < LANES; i++) this.padFlash[i] = Math.max(0, this.padFlash[i] - dt * 4);
      if (this.state === 'count') { this.countT += dt; if (this.countT > 1.2 && FL.Audio.ready) this.startSong(); return; }
      const now = this.songTime();
      const beat = Math.floor(now / this.tl.spb); if (beat !== this.lastBeat && now >= 0) { this.lastBeat = beat; this.beatPulse = 1; } this.beatPulse = Math.max(0, this.beatPulse - dt * 3);
      for (const n of this.notes) { if (!n.hit && !n.missed && now - n.t > 0.3) { n.missed = true; this.misses++; this.combo = 0; } if (!n.rest && now >= n.t - 0.05 && n.line != null) this.curLine = n.line; }
      if (this.state === 'play' && now > this.tl.duration + 1.2 && !this.ended) { this.ended = true; this.finish(); }
    },
    finish() {
      this.state = 'done';
      const total = this.notes.length; const stars = this.hits / total >= 0.8 ? 3 : this.hits / total >= 0.45 ? 2 : 1;
      FL.Save.setSongBest(this.song.id, stars);
      UI.showResults({ title: `You played ${this.song.title}!`, subtitle: `${this.hits} of ${total} gems · ${this.perfects} perfect · best streak ${this.best}`, stars, emoji: this.song.emoji, again: () => G().go('rhythm', { song: this.song.id }), other: () => G().go('songs'), otherLabel: 'Songs', otherEmoji: '🎼', home: () => G().go('world', { at: 'rhythm' }) });
    },
    repeatPrompt() { FL.Audio.say('Tap the gems when they reach the sparkly pads!'); },
    draw(ctx) {
      const g = G(); const t = this.t; const now = this.state === 'play' || this.state === 'done' ? this.songTime() : -LEAD;
      // ballroom
      const grad = ctx.createLinearGradient(0, 0, 0, g.H); grad.addColorStop(0, '#312e81'); grad.addColorStop(0.6, '#6d28d9'); grad.addColorStop(1, '#9d174d'); ctx.fillStyle = grad; ctx.fillRect(0, 0, g.W, g.H);
      // stage lights sweeping
      for (let i = 0; i < 4; i++) { ctx.save(); ctx.globalAlpha = 0.12 + this.beatPulse * 0.12; ctx.fillStyle = LANE_COLORS[i]; const lx = (i + 0.5) * (g.W / 4) + Math.sin(t * 1.3 + i) * 120; ctx.beginPath(); ctx.moveTo(lx, 0); ctx.lineTo(lx - 160, g.H); ctx.lineTo(lx + 160, g.H); ctx.closePath(); ctx.fill(); ctx.restore(); }
      // bunting
      for (let i = 0; i < 18; i++) { const bx = 40 + i * ((g.W - 80) / 17); const by = 40 + Math.sin((i / 17) * Math.PI) * 30; ctx.fillStyle = ['#f472b6', '#fde047', '#60a5fa', '#4ade80'][i % 4]; ctx.beginPath(); ctx.moveTo(bx - 18, by); ctx.lineTo(bx + 18, by); ctx.lineTo(bx, by + 34); ctx.closePath(); ctx.fill(); }
      // curtains
      ctx.fillStyle = '#be123c'; for (const side of [0, 1]) { for (let i = 0; i < 5; i++) { const x = side ? g.W - 90 + i * 18 : 0 + i * 18; ctx.fillStyle = i % 2 ? '#e11d48' : '#be123c'; ctx.fillRect(x, 0, 18, g.H); } }
      // lanes
      const lx0 = this.laneX0, lw = this.laneW;
      ctx.fillStyle = 'rgba(0,0,0,.28)'; A.roundRect(ctx, lx0 - 14, this.topY - 20, LANES * lw + 28, g.H - this.topY - 40, 30); ctx.fill();
      for (let l = 0; l < LANES; l++) {
        const x = lx0 + l * lw; ctx.fillStyle = `rgba(255,255,255,${l % 2 ? 0.05 : 0.09})`; ctx.fillRect(x, this.topY - 10, lw, g.H - this.topY - 60);
        // pad
        const cx = x + lw / 2; const f = this.padFlash[l]; const pr = 52 + f * 12 + this.beatPulse * 3;
        ctx.save(); ctx.shadowColor = LANE_COLORS[l]; ctx.shadowBlur = 20 + f * 30; ctx.fillStyle = `rgba(255,255,255,${0.18 + f * 0.5})`; A.circle(ctx, cx, this.hitY, pr); ctx.fill(); ctx.restore();
        ctx.strokeStyle = LANE_COLORS[l]; ctx.lineWidth = 7; A.circle(ctx, cx, this.hitY, pr); ctx.stroke();
        A.emoji(ctx, LANE_EMOJI[l], cx, this.hitY, 44, { alpha: 0.5 + f * 0.5 });
        ctx.fillStyle = 'rgba(255,255,255,.25)'; A.roundRect(ctx, x + 24, this.hitY + 78, lw - 48, 30, 15); ctx.fill(); A.text(ctx, ['A', 'S', 'D', 'F'][l], cx, this.hitY + 93, { size: 20, color: 'rgba(255,255,255,.7)' });
      }
      // gems
      const speed = (this.hitY - this.topY) / LEAD;
      for (const n of this.notes) {
        if (n.hit) continue; const dy = (n.t - now) * speed; const y = this.hitY - dy; if (y < this.topY - 60 || y > g.H) continue;
        const cx = lx0 + n.lane * lw + lw / 2; const alpha = n.missed ? Math.max(0, 1 - (now - n.t - 0.3) * 3) : 1; if (alpha <= 0) continue;
        ctx.save(); ctx.globalAlpha = alpha; ctx.translate(cx, y);
        const s = 40 + Math.sin(t * 8 + n.id) * 2; ctx.shadowColor = LANE_COLORS[n.lane]; ctx.shadowBlur = 18;
        ctx.fillStyle = LANE_COLORS[n.lane]; ctx.strokeStyle = '#fff'; ctx.lineWidth = 4;
        A.shapePath(ctx, ['diamond', 'star', 'heart', 'circle'][n.lane], 0, 0, s * 0.85); ctx.fill(); ctx.stroke();
        ctx.shadowBlur = 0; ctx.fillStyle = 'rgba(255,255,255,.55)'; A.ellipse(ctx, -s * 0.25, -s * 0.3, s * 0.2, s * 0.12); ctx.fill();
        if (n.lyric) A.text(ctx, n.lyric, 0, s + 14, { size: 26, color: '#fff', stroke: 'rgba(60,20,80,.6)' });
        ctx.restore();
        // long-note tail
        if (n.beats >= 2) { ctx.fillStyle = LANE_COLORS[n.lane]; ctx.globalAlpha = 0.25 * alpha; ctx.fillRect(cx - 10, y - n.dur * speed, 20, n.dur * speed); ctx.globalAlpha = 1; }
      }
      // karaoke line: words light up as their syllables are sung
      const words = this.tl.lines[this.curLine] || [];
      ctx.fillStyle = 'rgba(0,0,0,.35)'; A.roundRect(ctx, g.W / 2 - 480, 14, 960, 74, 37); ctx.fill();
      ctx.save(); ctx.font = A.font(34); const widths = words.map((w) => ctx.measureText(w + '  ').width); const total = widths.reduce((a, b) => a + b, 0); let wx = g.W / 2 - total / 2;
      const lineNotes = this.notes.filter((n) => n.line === this.curLine);
      words.forEach((w, i) => { const mine = lineNotes.filter((n) => n.word === i); const active = mine.length && mine.every((n) => now >= n.t - 0.05); const bounce = active && mine.some((n) => now - n.t < 0.25) ? -8 : 0; A.text(ctx, w, wx + widths[i] / 2, 51 + bounce, { size: active ? 38 : 34, color: active ? '#fde047' : '#fff', align: 'center' }); wx += widths[i]; });
      ctx.restore();
      // princess + audience on sides
      const dance = this.combo > 3 ? 1 : 0.4;
      const leftC = lx0 / 2, rightC = (lx0 + LANES * lw + g.W) / 2;
      A.princess(ctx, leftC, g.H - 50, g.look, { t, dance, sing: now > 0 && now < this.tl.duration, facing: 1 }, 1.15);
      this.audience.forEach((a, i) => { const col = i % 4, row = Math.floor(i / 4); const ax = rightC + (col - 1.5) * 64 + (row ? 32 : 0); const ay = g.H - 70 - row * 70 - Math.abs(Math.sin(t * 6 + i)) * (8 + this.beatPulse * 12); A.emoji(ctx, a.e, ax, ay, 54); });
      A.emoji(ctx, FL.Save.data.companion, rightC, g.H - 230 - Math.abs(Math.sin(t * 6)) * 20, 72);
      // score
      ctx.fillStyle = 'rgba(0,0,0,.35)'; A.roundRect(ctx, 22, 120, 200, 110, 24); ctx.fill();
      A.text(ctx, `🎵 ${this.hits}`, 122, 152, { size: 32, color: '#fff' }); A.text(ctx, this.combo > 1 ? `${this.combo} in a row!` : 'Tap the gems!', 122, 200, { size: 22, color: '#fde047' });
      // countdown
      if (this.state === 'count' || now < 0) {
        const n = Math.ceil(-now); const label = this.state === 'count' ? 'Ready?' : n > 0 ? String(n) : 'Go!';
        A.text(ctx, label, g.W / 2, g.H / 2 - 40, { size: 120, color: '#fde047', stroke: '#9d174d', strokeWidth: 16 });
      }
    },
  };
  FL.scenes.rhythm = scene;
})();
