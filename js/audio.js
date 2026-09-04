// Web Audio synth: instruments, song scheduling, gentle background music, sound effects and speech.
(function () {
  const A = { ready: false, settings: null };
  let ctx = null, master = null, musicBus = null, sfxBus = null, reverbSend = null, noiseBuf = null;

  const NOTE_INDEX = { C: 0, 'C#': 1, Db: 1, D: 2, 'D#': 3, Eb: 3, E: 4, F: 5, 'F#': 6, Gb: 6, G: 7, 'G#': 8, Ab: 8, A: 9, 'A#': 10, Bb: 10, B: 11 };
  A.freq = function (name) {
    if (typeof name === 'number') return name;
    const m = /^([A-G][#b]?)(-?\d)$/.exec(name);
    if (!m) return 440;
    const semis = NOTE_INDEX[m[1]] + (parseInt(m[2], 10) + 1) * 12;
    return 440 * Math.pow(2, (semis - 69) / 12);
  };
  A.transpose = function (name, semis) {
    const m = /^([A-G][#b]?)(-?\d)$/.exec(name);
    const NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    let idx = NOTE_INDEX[m[1]] + (parseInt(m[2], 10) + 1) * 12 + semis;
    return NAMES[idx % 12] + (Math.floor(idx / 12) - 1);
  };

  A.unlock = function () {
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      ctx = new AC();
      master = ctx.createGain(); master.gain.value = 0.9;
      const comp = ctx.createDynamicsCompressor();
      comp.threshold.value = -16; comp.knee.value = 20; comp.ratio.value = 4; comp.attack.value = 0.003; comp.release.value = 0.2;
      master.connect(comp); comp.connect(ctx.destination);
      musicBus = ctx.createGain(); musicBus.gain.value = 0.8; musicBus.connect(master);
      sfxBus = ctx.createGain(); sfxBus.gain.value = 1; sfxBus.connect(master);
      // Small feedback-delay "reverb" for sparkle.
      const delay = ctx.createDelay(1.0); delay.delayTime.value = 0.21;
      const fb = ctx.createGain(); fb.gain.value = 0.32;
      const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 2400;
      reverbSend = ctx.createGain(); reverbSend.gain.value = 0.28;
      reverbSend.connect(delay); delay.connect(lp); lp.connect(fb); fb.connect(delay); lp.connect(master);
      // Noise buffer for shakers / pops.
      noiseBuf = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
      const d = noiseBuf.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
      A.ready = true;
    }
    if (ctx.state === 'suspended') ctx.resume();
    try { const b = ctx.createBuffer(1, 1, 22050); const s = ctx.createBufferSource(); s.buffer = b; s.connect(ctx.destination); s.start(0); } catch (e) { /* ignore */ }
    A.applySettings(); if (A.music) A.music.resume();
  };
  A.now = () => (ctx ? ctx.currentTime : 0);
  A.applySettings = function () {
    const s = FL.Save.data.settings;
    if (musicBus) musicBus.gain.setTargetAtTime(s.music ? 0.8 : 0, ctx.currentTime, 0.05);
  };

  // ---- voices -------------------------------------------------------------
  function osc(type, f, t) { const o = ctx.createOscillator(); o.type = type; o.frequency.setValueAtTime(f, t); return o; }
  function env(g, t, a, peak, d, sus, dur, r) {
    // attack a -> peak, decay d -> sus*peak, hold to dur, release r
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(peak, t + a);
    g.gain.exponentialRampToValueAtTime(Math.max(0.0001, peak * sus), t + a + d);
    const end = t + Math.max(a + d, dur);
    g.gain.setValueAtTime(Math.max(0.0001, peak * sus), end);
    g.gain.exponentialRampToValueAtTime(0.0001, end + r);
    return end + r;
  }
  function track(group, nodes, endAt) { if (group) group.nodes.push({ nodes, endAt }); }

  const INST = {
    music(f, t, dur, v, out, group) { // music box
      const g = ctx.createGain(); const g2 = ctx.createGain(); g2.gain.value = 0.35; const g3 = ctx.createGain(); g3.gain.value = 0.12;
      const o1 = osc('sine', f, t), o2 = osc('triangle', f * 2, t), o3 = osc('sine', f * 4, t);
      o1.connect(g); o2.connect(g2); g2.connect(g); o3.connect(g3); g3.connect(g);
      const end = env(g, t, 0.004, v, 0.25, 0.35, Math.max(0.3, dur * 0.8), 0.7);
      g.connect(out); g.connect(reverbSend);
      [o1, o2, o3].forEach((o) => { o.start(t); o.stop(end + 0.05); });
      track(group, [o1, o2, o3, g], end);
    },
    piano(f, t, dur, v, out, group) {
      const g = ctx.createGain(); const lp = ctx.createBiquadFilter(); lp.type = 'lowpass';
      lp.frequency.setValueAtTime(Math.min(9000, f * 8), t); lp.frequency.exponentialRampToValueAtTime(Math.max(300, f * 1.5), t + 0.5);
      const o1 = osc('triangle', f, t), o2 = osc('sawtooth', f, t); o2.detune.value = 4; const g2 = ctx.createGain(); g2.gain.value = 0.25;
      const o3 = osc('sine', f * 2, t); const g3 = ctx.createGain(); g3.gain.value = 0.2;
      o1.connect(lp); o2.connect(g2); g2.connect(lp); o3.connect(g3); g3.connect(lp); lp.connect(g);
      const end = env(g, t, 0.005, v, 0.35, 0.4, Math.max(0.25, dur * 0.9), 0.35);
      g.connect(out); g.connect(reverbSend);
      [o1, o2, o3].forEach((o) => { o.start(t); o.stop(end + 0.05); });
      track(group, [o1, o2, o3, g], end);
    },
    bell(f, t, dur, v, out, group) {
      const parts = [[1, 1, 1.4], [2.76, 0.35, 0.5], [5.4, 0.12, 0.25]]; const nodes = []; let end = t;
      parts.forEach(([r, a, dec]) => {
        const o = osc('sine', f * r, t); const g = ctx.createGain();
        g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(v * a, t + 0.003); g.gain.exponentialRampToValueAtTime(0.0001, t + dec);
        o.connect(g); g.connect(out); g.connect(reverbSend); o.start(t); o.stop(t + dec + 0.05); nodes.push(o, g); end = Math.max(end, t + dec);
      });
      track(group, nodes, end);
    },
    flute(f, t, dur, v, out, group) {
      const g = ctx.createGain(); const o1 = osc('sine', f, t); const o2 = osc('triangle', f, t); const g2 = ctx.createGain(); g2.gain.value = 0.18;
      const lfo = osc('sine', 5.5, t); const lg = ctx.createGain(); lg.gain.value = f * 0.006; lfo.connect(lg); lg.connect(o1.frequency); lg.connect(o2.frequency);
      o1.connect(g); o2.connect(g2); g2.connect(g);
      const end = env(g, t, 0.07, v * 0.9, 0.1, 0.85, Math.max(0.25, dur * 0.95), 0.18);
      g.connect(out); g.connect(reverbSend);
      [o1, o2, lfo].forEach((o) => { o.start(t); o.stop(end + 0.05); });
      track(group, [o1, o2, lfo, g], end);
    },
    kick(f, t, dur, v, out, group) {
      const o = osc('sine', 160, t); o.frequency.exponentialRampToValueAtTime(45, t + 0.12);
      const g = ctx.createGain(); g.gain.setValueAtTime(v, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.3);
      o.connect(g); g.connect(out); o.start(t); o.stop(t + 0.35); track(group, [o, g], t + 0.35);
    },
    shaker(f, t, dur, v, out, group) {
      const s = ctx.createBufferSource(); s.buffer = noiseBuf; s.loop = true;
      const hp = ctx.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 6000;
      const g = ctx.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(v, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.09);
      s.connect(hp); hp.connect(g); g.connect(out); s.start(t); s.stop(t + 0.12); track(group, [s, g], t + 0.12);
    },
    wood(f, t, dur, v, out, group) {
      const o = osc('triangle', f || 900, t); const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = f || 900; bp.Q.value = 6;
      const g = ctx.createGain(); g.gain.setValueAtTime(v * 1.6, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.12);
      o.connect(bp); bp.connect(g); g.connect(out); g.connect(reverbSend); o.start(t); o.stop(t + 0.15); track(group, [o, g], t + 0.15);
    },
  };

  A.group = function () {
    return {
      nodes: [],
      stop() {
        if (!ctx) return; const now = ctx.currentTime;
        this.nodes.forEach(({ nodes }) => nodes.forEach((n) => {
          try {
            if (n.gain) { n.gain.cancelScheduledValues(now); n.gain.setValueAtTime(n.gain.value, now); n.gain.linearRampToValueAtTime(0.0001, now + 0.06); }
            if (n.stop) n.stop(now + 0.08);
          } catch (e) { /* already stopped */ }
        }));
        this.nodes = [];
      },
    };
  };

  A.note = function (name, o) {
    if (!ctx) return; o = o || {};
    const inst = INST[o.inst || 'music'] || INST.music;
    const when = Math.max(ctx.currentTime, o.when != null ? o.when : ctx.currentTime);
    const out = o.bus === 'music' ? musicBus : sfxBus;
    inst(A.freq(name), when, o.dur != null ? o.dur : 0.5, o.vol != null ? o.vol : 0.5, out, o.group);
  };

  // Schedule a whole song; returns the group so it can be stopped.
  A.playSong = function (song, o) {
    o = o || {}; if (!ctx) return null;
    const group = A.group();
    const start = o.when != null ? o.when : ctx.currentTime + 0.05;
    const tl = FL.Songs.timeline(song, o.bpm || song.bpm);
    tl.forEach((n) => { if (!n.rest) A.note(n.note, { inst: o.inst || 'music', when: start + n.t, dur: n.dur, vol: o.vol != null ? o.vol : 0.45, group, bus: o.bus || 'music' }); });
    group.duration = tl.duration; group.start = start;
    return group;
  };

  // ---- generative background music ---------------------------------------
  // Composes as it plays: rotating chord progressions, a motif-based melody that
  // varies itself, textures and instruments that change every phrase, and gentle
  // key changes, so nothing loops verbatim.
  INST.pad = function (f, t, dur, v, out, group) {
    const g = ctx.createGain(); const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 1100; lp.Q.value = 0.4;
    const o1 = osc('triangle', f, t); o1.detune.value = -6; const o2 = osc('triangle', f, t); o2.detune.value = 6; const o3 = osc('sine', f / 2, t); const g3 = ctx.createGain(); g3.gain.value = 0.6;
    o1.connect(lp); o2.connect(lp); o3.connect(g3); g3.connect(lp); lp.connect(g);
    g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(v, t + 0.5); g.gain.setValueAtTime(v, t + dur - 0.2); g.gain.linearRampToValueAtTime(0.0001, t + dur + 0.9);
    g.connect(out); g.connect(reverbSend);
    [o1, o2, o3].forEach((o) => { o.start(t); o.stop(t + dur + 1); });
    track(group, [o1, o2, o3, g], t + dur + 1);
  };
  INST.harp = function (f, t, dur, v, out, group) { // soft pluck for arpeggios
    const g = ctx.createGain(); const o1 = osc('triangle', f, t); const o2 = osc('sine', f * 2, t); const g2 = ctx.createGain(); g2.gain.value = 0.2;
    const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.setValueAtTime(Math.min(8000, f * 6), t); lp.frequency.exponentialRampToValueAtTime(Math.max(400, f * 1.2), t + 0.6);
    o1.connect(lp); o2.connect(g2); g2.connect(lp); lp.connect(g);
    g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(v, t + 0.006); g.gain.exponentialRampToValueAtTime(0.0001, t + Math.max(0.5, dur * 1.4));
    g.connect(out); g.connect(reverbSend); [o1, o2].forEach((o) => { o.start(t); o.stop(t + Math.max(0.5, dur * 1.4) + 0.05); });
    track(group, [o1, o2, g], t + dur * 1.4 + 0.05);
  };
  INST.marimba = function (f, t, dur, v, out, group) {
    const g = ctx.createGain(); const o1 = osc('sine', f, t); const o2 = osc('sine', f * 4, t); const g2 = ctx.createGain(); g2.gain.value = 0.18; const o3 = osc('triangle', f, t); const g3 = ctx.createGain(); g3.gain.value = 0.25;
    o1.connect(g); o2.connect(g2); g2.connect(g); o3.connect(g3); g3.connect(g);
    g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(v * 1.3, t + 0.004); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.45);
    g.connect(out); g.connect(reverbSend); [o1, o2, o3].forEach((o) => { o.start(t); o.stop(t + 0.5); }); track(group, [o1, o2, o3, g], t + 0.5);
  };

  const MAJOR = [0, 2, 4, 5, 7, 9, 11];
  const KEY_ROOTS = { C: 60, Db: 61, D: 62, Eb: 63, E: 64, F: 65, Gb: 66, G: 67, Ab: 68, A: 69, Bb: 70, B: 71 };
  const PROGRESSIONS = [[1, 5, 6, 4], [1, 6, 4, 5], [6, 4, 1, 5], [1, 4, 6, 5], [1, 3, 6, 4], [4, 5, 3, 6], [1, 4, 5, 4], [2, 5, 1, 1], [1, 5, 4, 4], [6, 5, 4, 5]];
  const ARPS = { 4: [[0, 1, 2, 3, 2, 1, 2, 3], [0, 2, 1, 3, 0, 2, 1, 3], [0, 1, 2, 1, 3, 2, 1, 2], [0, 3, 2, 3, 1, 3, 2, 3], [0, 2, 3, 2, 0, 2, 3, 2]], 3: [[0, 1, 2, 3, 2, 1], [0, 2, 1, 3, 1, 2], [0, 1, 3, 2, 1, 2], [0, 3, 1, 2, 3, 1]] };
  const RHYTHMS = { 4: [[2, 2, 1, 1, 2], [1, 1, 2, 4], [3, 1, 2, 2], [2, 1, 1, 2, 2], [4, 2, 2], [2, 2, 4], [1, 1, 1, 1, 2, 2], [6, 2], [2, 6]], 3: [[2, 2, 2], [4, 2], [2, 4], [1, 1, 2, 2], [3, 3], [2, 1, 1, 2], [6]] };
  const STYLES = {
    kingdom: { bpm: 96, keys: ['C', 'F', 'G', 'D'], leads: ['music', 'flute', 'bell', 'harp'], arpInst: 'harp', meter: 4, pad: 0.8, perc: 0.35, vol: 1 },
    title: { bpm: 84, keys: ['C', 'F'], leads: ['music', 'bell'], arpInst: 'music', meter: 4, pad: 1, perc: 0, vol: 0.8 },
    garden: { bpm: 104, keys: ['F', 'Bb', 'C'], leads: ['flute', 'music', 'harp'], arpInst: 'harp', meter: 3, pad: 0.9, perc: 0, vol: 0.85 },
    pond: { bpm: 100, keys: ['G', 'C', 'D'], leads: ['marimba', 'wood', 'music'], arpInst: 'marimba', meter: 4, pad: 0.3, perc: 0.7, vol: 0.85, pentatonic: true },
    meadow: { bpm: 126, keys: ['D', 'G', 'A'], leads: ['bell', 'music', 'flute'], arpInst: 'harp', meter: 3, pad: 0.9, perc: 0.25, vol: 0.85 },
    bridge: { bpm: 80, keys: ['A', 'D'], leads: ['harp'], arpInst: 'pad', meter: 4, pad: 1, perc: 0, vol: 0.5, sparse: true },
  };
  const music = { timer: null, group: null, style: null, next: 0, step: 0, phrase: null, phraseNo: 0, lastPitch: 72, motif: null, keyIdx: 0, duck: 1 };
  function rnd(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
  function midi(m) { return 440 * Math.pow(2, (m - 69) / 12); }
  function chordTones(root, degree) { // midi numbers for a triad + octave, degree 1..7
    const d = degree - 1; const base = root + MAJOR[d];
    const third = root + MAJOR[(d + 2) % 7] + (d + 2 >= 7 ? 12 : 0); const fifth = root + MAJOR[(d + 4) % 7] + (d + 4 >= 7 ? 12 : 0);
    return [base, third, fifth, base + 12];
  }
  function scaleNear(root, pitch, dir, st) { // move `dir` scale steps from pitch within the key
    const scale = st.pentatonic ? [0, 2, 4, 7, 9] : MAJOR; const rel = ((pitch - root) % 12 + 12) % 12;
    let idx = 0; for (let i = 0; i < scale.length; i++) if (scale[i] <= rel) idx = i;
    let oct = Math.floor((pitch - root) / 12); idx += dir;
    while (idx < 0) { idx += scale.length; oct--; } while (idx >= scale.length) { idx -= scale.length; oct++; }
    return root + oct * 12 + scale[idx];
  }
  function newPhrase(st) {
    const prev = music.phrase; music.phraseNo++;
    if (music.phraseNo % 4 === 0 && st.keys.length > 1) music.keyIdx = (music.keyIdx + 1 + Math.floor(Math.random() * (st.keys.length - 1))) % st.keys.length;
    const root = KEY_ROOTS[st.keys[music.keyIdx]] - 12; // chords around octave 3/4
    let prog = rnd(PROGRESSIONS); if (prev && prev.prog === prog) prog = rnd(PROGRESSIONS);
    const arp = rnd(ARPS[st.meter]);
    const lead = music.phraseNo % 2 === 0 ? rnd(st.leads) : (prev ? prev.lead : rnd(st.leads));
    const melodyOn = st.sparse ? Math.random() < 0.35 : music.phraseNo === 1 ? false : Math.random() < 0.82;
    const arpOn = st.sparse ? false : music.phraseNo === 1 || Math.random() < 0.85;
    const padOn = Math.random() < st.pad; const percOn = Math.random() < st.perc; const bassOn = !st.sparse && Math.random() < 0.85;
    // a rhythmic motif for the melody, reused with variation across the phrase
    const motif = music.motif && Math.random() < 0.6 ? music.motif : rnd(RHYTHMS[st.meter]); music.motif = motif;
    return { root, prog, arp, lead, melodyOn, arpOn, padOn, percOn, bassOn, motif, bars: prog.length };
  }
  function scheduleBar(st, ph, bar, t0, stepDur) {
    const steps = st.meter * 2; const degree = ph.prog[bar % ph.bars]; const tones = chordTones(ph.root, degree); const g = music.group; const v = st.vol * music.duck;
    const barDur = steps * stepDur; const hum = () => (Math.random() - 0.5) * 0.012; const dyn = () => 0.85 + Math.random() * 0.3;
    if (ph.padOn) A.note(midi(tones[0] + 12), { inst: 'pad', when: t0, dur: barDur, vol: 0.05 * v, group: g, bus: 'music' });
    if (ph.padOn) A.note(midi(tones[2] + 12), { inst: 'pad', when: t0, dur: barDur, vol: 0.035 * v, group: g, bus: 'music' });
    if (ph.bassOn) { A.note(midi(tones[0] - 12), { inst: 'piano', when: t0, dur: barDur * 0.9, vol: 0.13 * v, group: g, bus: 'music' }); if (st.meter === 4 && Math.random() < 0.5) A.note(midi(tones[2] - 12), { inst: 'piano', when: t0 + stepDur * 4, dur: barDur * 0.4, vol: 0.08 * v, group: g, bus: 'music' }); }
    if (ph.arpOn) { for (let s = 0; s < steps; s++) { const tone = tones[ph.arp[s % ph.arp.length]] + 12; A.note(midi(tone), { inst: st.arpInst, when: t0 + s * stepDur + hum(), dur: stepDur * 1.6, vol: (s % 2 ? 0.055 : 0.075) * dyn() * v, group: g, bus: 'music' }); } }
    if (ph.percOn) { for (let s = 0; s < steps; s++) { if (s % 2 === 1) A.note(0, { inst: 'shaker', when: t0 + s * stepDur, vol: 0.05 * v, group: g, bus: 'music' }); if (s === 0) A.note(0, { inst: 'kick', when: t0, vol: 0.12 * v, group: g, bus: 'music' }); if (st.meter === 4 && s === 4) A.note(0, { inst: 'wood', when: t0 + s * stepDur, vol: 0.05 * v, group: g, bus: 'music' }); } }
    if (ph.melodyOn) {
      // bars 0 and 2 state the motif, bars 1 and 3 answer with a variation; sometimes a rest bar
      if (bar % ph.bars === ph.bars - 1 && Math.random() < 0.3) return;
      let rhythm = ph.motif; if (bar % 2 === 1) rhythm = Math.random() < 0.5 ? rnd(RHYTHMS[st.meter]) : ph.motif;
      let pos = 0; let pitch = music.lastPitch; const lo = ph.root + 14, hi = ph.root + 31; if (pitch < lo || pitch > hi) pitch = ph.root + 24;
      rhythm.forEach((len, i) => {
        if (pos >= steps) return;
        const strong = pos === 0 || pos === steps / 2 || pos === Math.floor(steps / 2);
        if (strong || Math.random() < 0.4) { // land on a nearby chord tone (small leaps only)
          const cands = []; for (let o = 12; o <= 48; o += 12) tones.slice(0, 3).forEach((c) => { const m = c + o - 12; if (m >= lo && m <= hi) cands.push(m); });
          cands.sort((a, b) => Math.abs(a - pitch) - Math.abs(b - pitch));
          pitch = cands.length > 1 && Math.random() < 0.3 && Math.abs(cands[1] - pitch) <= 5 ? cands[1] : cands[0];
        } else { let dir = Math.random() < 0.5 ? -1 : 1; if (pitch - lo < 3) dir = 1; if (hi - pitch < 3) dir = -1; pitch = scaleNear(ph.root, pitch, dir * (Math.random() < 0.8 ? 1 : 2), st); }
        while (pitch < lo) pitch += 12; while (pitch > hi) pitch -= 12;
        const dur = len * stepDur; const last = i === rhythm.length - 1;
        A.note(midi(pitch), { inst: ph.lead, role: 'melody', when: t0 + pos * stepDur + hum(), dur: dur * (last ? 1.1 : 0.9), vol: (ph.lead === 'flute' ? 0.09 : ph.lead === 'bell' ? 0.1 : 0.16) * dyn() * v, group: g, bus: 'music' });
        pos += len;
      });
      music.lastPitch = pitch;
    }
  }
  A.music = {
    current: () => music.style,
    play(styleName) {
      if (!styleName) { this.stop(); return; }
      if (music.style === styleName && music.timer) return;
      this.stop(0.8);
      if (!ctx) { music.pending = styleName; return; }
      const st = STYLES[styleName]; if (!st) return;
      music.style = styleName; music.group = A.group(); music.step = 0; music.phraseNo = 0; music.phrase = null; music.keyIdx = 0; music.motif = null; music.lastPitch = KEY_ROOTS[st.keys[0]] + 12;
      const stepDur = 60 / st.bpm / 2; const steps = st.meter * 2; music.next = ctx.currentTime + 0.15; let bar = 0;
      music.timer = setInterval(() => {
        if (!ctx) return;
        while (music.next < ctx.currentTime + 0.6) {
          if (!music.phrase || bar >= music.phrase.bars) { music.phrase = newPhrase(st); bar = 0; }
          scheduleBar(st, music.phrase, bar, music.next, stepDur); bar++;
          music.next += steps * stepDur;
          if (music.group.nodes.length > 400) music.group.nodes = music.group.nodes.filter((e) => e.endAt > ctx.currentTime);
        }
      }, 80);
    },
    stop(fade) {
      if (music.timer) { clearInterval(music.timer); music.timer = null; }
      if (music.group) { const grp = music.group; music.group = null; if (fade && ctx) { const now = ctx.currentTime; grp.nodes.forEach(({ nodes }) => nodes.forEach((n) => { try { if (n.gain) { n.gain.cancelScheduledValues(now); n.gain.setValueAtTime(n.gain.value, now); n.gain.linearRampToValueAtTime(0.0001, now + fade); } if (n.stop) n.stop(now + fade + 0.05); } catch (e) { /* stopped */ } })); } else grp.stop(); }
      music.style = null; music.pending = null;
    },
    resume() { if (music.pending && ctx) { const p = music.pending; music.pending = null; this.play(p); } },
  };
  // Lower the music while the narrator speaks so the words stay clear.
  A.duck = function (on) { if (!musicBus) return; const s = FL.Save.data.settings; const target = !s.music ? 0 : on ? 0.3 : 0.8; musicBus.gain.setTargetAtTime(target, ctx.currentTime, on ? 0.08 : 0.5); };
  // Backwards-compatible aliases.
  A.startBgm = (style) => A.music.play(style || 'kingdom'); A.stopBgm = () => A.music.stop(0.6); A.bgmPlaying = () => !!music.timer;

  // ---- sound effects ------------------------------------------------------
  const SCALE = ['C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4', 'C5', 'D5', 'E5', 'F5', 'G5', 'A5', 'B5', 'C6'];
  A.SCALE = SCALE;
  A.sfx = {
    tap() { A.note('G5', { inst: 'wood', dur: 0.1, vol: 0.25 }); },
    pop() { A.note('C6', { inst: 'bell', dur: 0.1, vol: 0.3 }); A.note(2400, { inst: 'wood', dur: 0.05, vol: 0.2 }); },
    sparkle() { const t = A.now(); ['C6', 'E6', 'G6'].forEach((n, i) => A.note(n, { inst: 'bell', when: t + i * 0.05, vol: 0.18 })); },
    correct() { const t = A.now(); ['C5', 'E5', 'G5', 'C6'].forEach((n, i) => A.note(n, { inst: 'music', when: t + i * 0.09, dur: 0.4, vol: 0.4 })); },
    wrong() { const t = A.now(); A.note('E4', { inst: 'flute', when: t, dur: 0.18, vol: 0.25 }); A.note('C4', { inst: 'flute', when: t + 0.18, dur: 0.3, vol: 0.22 }); },
    fanfare() { const t = A.now(); const seq = [['C5', 0], ['E5', .12], ['G5', .24], ['C6', .36], ['G5', .55], ['C6', .7]]; seq.forEach(([n, d]) => { A.note(n, { inst: 'piano', when: t + d, dur: 0.5, vol: 0.5 }); A.note(n, { inst: 'bell', when: t + d, dur: 0.5, vol: 0.2 }); }); A.note('C4', { inst: 'piano', when: t + 0.7, dur: 1.2, vol: 0.4 }); },
    star(i) { A.note(SCALE[Math.min(SCALE.length - 1, 7 + i * 2)], { inst: 'bell', dur: 0.4, vol: 0.4 }); },
    count(i) { A.note(SCALE[i % SCALE.length], { inst: 'music', dur: 0.5, vol: 0.5 }); },
    ribbit() { if (!ctx) return; const t = ctx.currentTime; const o = osc('sawtooth', 220, t); o.frequency.exponentialRampToValueAtTime(110, t + 0.16); const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 900; const g = ctx.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(0.25, t + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.2); o.connect(lp); lp.connect(g); g.connect(sfxBus); o.start(t); o.stop(t + 0.25); },
    whoosh() { if (!ctx) return; const t = ctx.currentTime; const s = ctx.createBufferSource(); s.buffer = noiseBuf; const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.Q.value = 1; bp.frequency.setValueAtTime(400, t); bp.frequency.exponentialRampToValueAtTime(3000, t + 0.25); const g = ctx.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(0.2, t + 0.08); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.3); s.connect(bp); bp.connect(g); g.connect(sfxBus); s.start(t); s.stop(t + 0.35); },
    hop() { A.note('E5', { inst: 'wood', dur: 0.1, vol: 0.2 }); A.note('C6', { inst: 'wood', when: A.now() + 0.07, dur: 0.1, vol: 0.15 }); },
    squeak() { if (!ctx) return; const t = ctx.currentTime; const o = osc('square', 900, t); o.frequency.exponentialRampToValueAtTime(1400, t + 0.1); const g = ctx.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(0.08, t + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.15); o.connect(g); g.connect(sfxBus); o.start(t); o.stop(t + 0.2); },
    unlock() { const t = A.now(); ['C5', 'D5', 'E5', 'G5', 'C6', 'E6', 'G6'].forEach((n, i) => A.note(n, { inst: 'bell', when: t + i * 0.08, vol: 0.3 })); },
  };

  // ---- speech -------------------------------------------------------------
  // Quality depends entirely on the voices installed on the device. Apple's
  // "Enhanced"/"Premium" voices (downloadable in iPad Settings) sound far more natural
  // than the compact defaults, so rank those first and let grown-ups pick.
  const BAD = /compact|eloquence|fred|albert|bahh|bells|boing|bubbles|cellos|deranged|good news|hysterical|jester|junior|kathy|organ|superstar|trinoids|whisper|wobble|zarvox|ralph|grandma|grandpa|rocko|shelley|flo|sandy|eddy|reed|novelty/i;
  const PREF = ['Ava', 'Zoe', 'Allison', 'Samantha', 'Nicky', 'Joelle', 'Susan', 'Karen', 'Moira', 'Tessa', 'Serena', 'Kate', 'Fiona', 'Google US English', 'Microsoft Aria', 'Microsoft Jenny', 'Microsoft Zira', 'Microsoft Sonia', 'Google UK English Female'];
  function voiceScore(v) {
    if (!v.lang || !/^en/i.test(v.lang)) return -1; if (BAD.test(v.name)) return -1;
    let s = 1; const n = v.name;
    if (/premium/i.test(n)) s += 40; else if (/enhanced/i.test(n)) s += 30; else if (/natural|neural|online/i.test(n)) s += 25;
    if (/siri/i.test(n)) s += 20;
    const pi = PREF.findIndex((p) => n.includes(p)); if (pi >= 0) s += 15 - pi * 0.5;
    if (/^en-US/i.test(v.lang)) s += 4; else if (/^en-(GB|AU|IE)/i.test(v.lang)) s += 2;
    if (v.localService === false) s += 3; // cloud voices are usually the neural ones
    if (/male|daniel|alex|tom|aaron|arthur|gordon|rishi|david|mark|guy/i.test(n) && !/female/i.test(n)) s -= 6;
    return s;
  }
  A.voices = function () { if (!('speechSynthesis' in window)) return []; return speechSynthesis.getVoices().map((v) => ({ v, s: voiceScore(v) })).filter((x) => x.s >= 0).sort((a, b) => b.s - a.s).map((x) => x.v); };
  let voice = null;
  function pickVoice() {
    const list = A.voices(); if (!list.length) return null;
    const want = FL.Save.data.settings.voice; if (want) { const m = list.find((v) => v.voiceURI === want || v.name === want); if (m) { voice = m; return m; } }
    voice = list[0]; return voice;
  }
  if ('speechSynthesis' in window) { speechSynthesis.onvoiceschanged = () => { voice = null; pickVoice(); }; setTimeout(pickVoice, 300); }
  A.voiceName = function () { const v = pickVoice(); return v ? v.name.replace(/\(.*?\)/g, '').trim() : 'Default'; };
  A.setVoice = function (v) { FL.Save.data.settings.voice = v ? v.voiceURI || v.name : null; FL.Save.save(); voice = null; pickVoice(); };
  // ---- pre-rendered voice pack (voice/*.mp3, see tools/make-voices.py) --------
  let voiceBus = null; const clipCache = new Map(); let voiceQueueEnd = 0; let activeVoices = [];
  A.voicePack = { ready: false, name: '', clips: null };
  A.loadVoicePack = function () {
    return fetch('voice/manifest.json', { cache: 'no-cache' }).then((r) => (r.ok ? r.json() : null)).then((m) => {
      if (!m || !m.clips || !Object.keys(m.clips).length) return false;
      A.voicePack = { ready: true, name: (m.voice || 'Kokoro').replace(/^[a-z]+_/, '').replace(/^\w/, (c) => c.toUpperCase()), clips: m.clips, engine: m.engine };
      return true;
    }).catch(() => false);
  };
  function clipFor(text) { if (!A.voicePack.ready) return null; const id = FL.Lines.id(text); return A.voicePack.clips[id] ? id : null; }
  function loadClip(id) {
    if (clipCache.has(id)) return clipCache.get(id);
    const p = fetch(`voice/${id}.mp3`).then((r) => r.arrayBuffer()).then((buf) => new Promise((res, rej) => ctx.decodeAudioData(buf, res, rej))).catch((e) => { clipCache.delete(id); throw e; });
    clipCache.set(id, p); return p;
  }
  A.warmVoicePack = function () { // decode everything in the background so lines play instantly (and cache offline)
    if (!ctx || !A.voicePack.ready || A._warmed) return; A._warmed = true;
    const ids = Object.keys(A.voicePack.clips); let i = 0;
    const next = () => { if (i >= ids.length) return; const id = ids[i++]; loadClip(id).catch(() => {}).then(() => setTimeout(next, 40)); };
    next(); setTimeout(next, 500);
  };
  function stopClips() { const now = ctx ? ctx.currentTime : 0; activeVoices.forEach((v) => { try { v.g.gain.cancelScheduledValues(now); v.g.gain.setValueAtTime(v.g.gain.value, now); v.g.gain.linearRampToValueAtTime(0.0001, now + 0.05); v.src.stop(now + 0.06); } catch (e) { /* done */ } }); activeVoices = []; voiceQueueEnd = 0; }
  function playClip(id, o) {
    if (!ctx) return; if (!voiceBus) { voiceBus = ctx.createGain(); voiceBus.gain.value = 1.15; voiceBus.connect(master); }
    if (o.interrupt !== false) stopClips();
    const token = { src: null, g: null, cancelled: false }; activeVoices.push(token);
    A.duck(true);
    loadClip(id).then((buf) => {
      if (token.cancelled || !activeVoices.includes(token)) return;
      const now = ctx.currentTime; const start = Math.max(now + 0.02, voiceQueueEnd); voiceQueueEnd = start + buf.duration + 0.25;
      const src = ctx.createBufferSource(); src.buffer = buf; const g = ctx.createGain(); g.gain.value = 1; src.connect(g); g.connect(voiceBus); token.src = src; token.g = g;
      src.onended = () => { activeVoices = activeVoices.filter((v) => v !== token); if (!activeVoices.length) { A.duck(false); voiceQueueEnd = 0; } };
      src.start(start);
    }).catch(() => { activeVoices = activeVoices.filter((v) => v !== token); if (!activeVoices.length) A.duck(false); });
  }
  A.speakingNow = () => activeVoices.length > 0 || speaking > 0;
  A._voiceDebug = () => ({ active: activeVoices.length, tts: speaking, queueEnd: voiceQueueEnd, now: ctx ? ctx.currentTime : 0 });

  let speaking = 0;
  A.say = function (text, o) {
    o = o || {};
    if (!FL.Save.data.settings.speech) return;
    if (!o.tts && A.voicePack.ready && ctx) {
      const id = clipFor(text) || (o.alt || []).map(clipFor).find(Boolean);
      if (id) { if ('speechSynthesis' in window && o.interrupt !== false) speechSynthesis.cancel(); playClip(id, o); return; }
    }
    if (!('speechSynthesis' in window)) return;
    try {
      if (o.interrupt !== false) { speechSynthesis.cancel(); speaking = 0; }
      // Small pauses after punctuation read more naturally; exclamation marks get shouty on some voices.
      const clean = text.replace(/!+/g, '.').replace(/\.\s*\./g, '.').replace(/,/g, ', ');
      const u = new SpeechSynthesisUtterance(clean);
      u.rate = o.rate || 0.97; u.pitch = o.pitch || 1.04; u.volume = 1;
      const v = pickVoice(); if (v) { u.voice = v; u.lang = v.lang; } else u.lang = 'en-US';
      u.onstart = () => { speaking++; A.duck(true); };
      const done = () => { speaking = Math.max(0, speaking - 1); if (!speaking) A.duck(false); };
      let finished = false; const once = () => { if (!finished) { finished = true; done(); } };
      u.onend = once; u.onerror = once; setTimeout(once, 2500 + clean.length * 90); // safety: never leave the music ducked
      speechSynthesis.speak(u);
    } catch (e) { /* ignore */ }
  };
  A.hush = function () { try { if ('speechSynthesis' in window) speechSynthesis.cancel(); } catch (e) { /* ignore */ } speaking = 0; stopClips(); A.duck(false); };

  window.FL = window.FL || {};
  FL.Audio = A;
})();
