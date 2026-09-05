// Echo Cave and Dragon Drums: listen to a sequence, then play it back.
(function () {
  const A = FL.Art, UI = FL.UI, G = () => FL.Game, D = FL.Data;
  function make(id, cfg, opts) {
    const scene = {
      hud: { home: true, repeat: true }, music: opts.music, t: 0, round: 0, total: 6, good: 0, tries: 0, seq: [], idx: 0, state: 'idle', lit: -1, lead: 0,
      enter() { this.t = 0; this.round = 0; this.good = 0; this.level = FL.Save.level(id); FL.Save.addPlay(id); this.layout(); FL.Audio.say(cfg.intro); FL.Game.later(() => this.newRound(), 3800); },
      layout() { const g = G(); const n = cfg.pads.length; this.pads = cfg.pads.map((p, i) => { const a = Math.PI + (Math.PI * (i + 0.5)) / n; const R = n > 3 ? 330 : 260; return { e: p[0], color: p[1], sound: p[2], x: g.W / 2 + 40 + Math.cos(a) * R * 1.15, y: g.H - 130 + Math.sin(a) * R * 0.7, glow: 0 }; }); },
      resize() { this.layout(); },
      newRound() { const start = opts.start + Math.min(this.level - 1, 1); const len = Math.min(8, start + this.round); this.seq = []; for (let i = 0; i < len; i++) { let k; do { k = Math.floor(Math.random() * this.pads.length); } while (i >= 2 && this.seq[i - 1] === k && this.seq[i - 2] === k); this.seq.push(k); } this.tries = 0; this.playSeq(true); },
      playSeq(ask) { this.state = 'listen'; this.idx = 0; const gap = 0.55; this.seq.forEach((k, i) => FL.Game.later(() => { this.hit(k, true); this.lead = 1; }, 400 + i * gap * 1000)); FL.Game.later(() => { this.state = 'input'; this.idx = 0; if (ask) FL.Audio.say('Your turn!'); }, 400 + this.seq.length * gap * 1000 + 300); },
      hit(k, auto) { const p = this.pads[k]; p.glow = 1; this.lit = k; if (cfg.inst) FL.Audio.note(p.sound, { inst: cfg.inst, vol: 0.55, dur: 0.5 }); else FL.Audio.note(p.sound === 'wood' ? 700 : 0, { inst: p.sound, vol: 0.6 }); G().fx.burst(p.x, p.y, { count: 8, type: 'note', colors: [p.color], speed: 160, life: 0.8, size: 10, gravity: -150, spread: 1.2 }); },
      repeatPrompt() { if (this.state === 'input') this.playSeq(true); },
      down(p) { if (this.state !== 'input') return; for (let k = 0; k < this.pads.length; k++) { const pd = this.pads[k]; if (Math.hypot(p.x - pd.x, p.y - pd.y) < 80) { this.tap(k); return; } } },
      tap(k) {
        this.hit(k);
        if (k === this.seq[this.idx]) { this.idx++; if (this.idx >= this.seq.length) { this.state = 'done'; if (this.tries === 0) this.good++; this.round++; FL.Audio.sfx.correct(); G().fx.burst(G().W / 2, G().H / 2, { count: 40, type: 'star', colors: ['#fde047', '#fff', '#c084fc'], speed: 420, life: 1 }); FL.Audio.say(this.round >= this.total ? 'Yes! You did it!' : 'Yes! Now a longer one!'); FL.Game.later(() => { if (this.round >= this.total) this.finish(); else this.newRound(); }, 2200); } }
        else { this.tries++; this.state = 'wait'; FL.Audio.sfx.wrong(); FL.Audio.say('Not quite. Listen again!'); FL.Game.later(() => this.playSeq(false), 1800); }
      },
      finish() { const stars = UI.starsFor(this.good, this.total); if (stars === 3) FL.Save.levelUp(id); UI.showResults({ title: cfg.results, subtitle: `${this.good} of ${this.total} tunes echoed on the first try`, stars, emoji: cfg.leader, again: () => G().go(id), home: () => G().go('world', { at: id }) }); },
      update(dt) { this.t += dt; this.pads.forEach((p) => { p.glow = Math.max(0, p.glow - dt * 3); }); this.lead = Math.max(0, this.lead - dt * 3); },
      draw(ctx) {
        const g = G(); const t = this.t; opts.bg(ctx, g, t);
        const label = this.state === 'listen' ? 'Listen...' : this.state === 'input' ? 'Your turn! Tap the same ones.' : this.state === 'wait' ? 'Listen again...' : this.state === 'done' ? 'Yes!' : cfg.name;
        UI.banner(ctx, label, { emoji: cfg.leader, size: 40 }); UI.progressDots(ctx, this.round, this.total, 140);
        // leader
        const ly = 300; A.emoji(ctx, cfg.leader, g.W / 2, ly - this.lead * 30 - Math.abs(Math.sin(t * 3)) * 6, 130, { shadow: true });
        // sequence progress
        const n = this.seq.length; for (let i = 0; i < n; i++) { const x = g.W / 2 + (i - (n - 1) / 2) * 44; const donePlayed = this.state === 'input' || this.state === 'done' ? i < this.idx : false; ctx.fillStyle = donePlayed ? this.pads[this.seq[i]].color : 'rgba(255,255,255,.5)'; ctx.strokeStyle = 'rgba(0,0,0,.25)'; ctx.lineWidth = 2; A.circle(ctx, x, ly + 110, donePlayed ? 15 : 11); ctx.fill(); ctx.stroke(); }
        this.pads.forEach((p) => {
          ctx.save(); ctx.translate(p.x, p.y); const sc = 1 + p.glow * 0.15; ctx.scale(sc, sc);
          ctx.fillStyle = 'rgba(0,0,0,.18)'; A.ellipse(ctx, 0, 70, 70, 20); ctx.fill();
          if (p.glow > 0) { ctx.shadowColor = p.color; ctx.shadowBlur = 40 * p.glow; }
          ctx.fillStyle = A.shade(p.color, -0.3); A.circle(ctx, 0, 10, 72); ctx.fill(); ctx.fillStyle = A.shade(p.color, p.glow * 0.5); ctx.strokeStyle = 'rgba(255,255,255,.8)'; ctx.lineWidth = 6; A.circle(ctx, 0, 0, 72); ctx.fill(); ctx.stroke(); ctx.shadowBlur = 0;
          A.emoji(ctx, p.e, 0, 0, 74); ctx.restore();
        });
        A.princess(ctx, 80, g.H - 30, g.look, { t, facing: 1, dance: this.state === 'listen' ? 0.6 : 0 }, 0.8);
        A.emoji(ctx, FL.Save.data.companion, 150, g.H - 50 - Math.abs(Math.sin(t * 5)) * 8, 44);
      },
    };
    FL.scenes[id] = scene;
  }
  const caveBg = (ctx, g, t) => { const grad = ctx.createLinearGradient(0, 0, 0, g.H); grad.addColorStop(0, '#1e1b4b'); grad.addColorStop(1, '#4c1d95'); ctx.fillStyle = grad; ctx.fillRect(0, 0, g.W, g.H); ctx.fillStyle = '#312e81'; for (let i = 0; i < 12; i++) { const x = (i / 11) * g.W; ctx.beginPath(); ctx.moveTo(x - 50, 0); ctx.lineTo(x, 90 + (i % 3) * 50); ctx.lineTo(x + 50, 0); ctx.closePath(); ctx.fill(); } for (let i = 0; i < 40; i++) { ctx.fillStyle = `rgba(196,181,253,${0.3 + Math.sin(t * 2 + i) * 0.3})`; A.circle(ctx, (i * 131) % g.W, (i * 71) % g.H, 2.5); ctx.fill(); } ctx.fillStyle = '#3730a3'; A.ellipse(ctx, g.W / 2, g.H + 40, g.W * 0.7, 200); ctx.fill(); for (let i = 0; i < 6; i++) A.mushroom(ctx, 40 + i * (g.W / 6) + 30, g.H - 30 - (i % 2) * 14, 0.9, ['#a855f7', '#22d3ee', '#f472b6'][i % 3], t); };
  make('echo', D.SIMON.echo, { music: 'cave', start: 2, bg: caveBg });
  make('drums', D.SIMON.drums, { music: null, start: 3, bg: FL.bg.peaks });
})();
