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
    A.applySettings();
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

  // ---- background music ---------------------------------------------------
  const bgm = { timer: null, group: null, step: 0, next: 0, style: null };
  const CHORDS = { kingdom: [['C4', 'E4', 'G4', 'C5'], ['G3', 'B3', 'D4', 'G4'], ['A3', 'C4', 'E4', 'A4'], ['F3', 'A3', 'C4', 'F4']] };
  const ARP = [0, 1, 2, 3, 2, 1, 2, 3, 0, 2, 1, 3, 2, 3, 1, 2];
  A.startBgm = function (style) {
    style = style || 'kingdom';
    if (!ctx || bgm.timer) return;
    bgm.group = A.group(); bgm.step = 0; bgm.next = ctx.currentTime + 0.1; bgm.style = style;
    const stepDur = 60 / 92 / 2;
    bgm.timer = setInterval(() => {
      while (bgm.next < ctx.currentTime + 0.4) {
        const chord = CHORDS.kingdom[Math.floor(bgm.step / 16) % 4];
        const idx = ARP[bgm.step % 16];
        const n = chord[idx];
        A.note(A.transpose(n, 12), { inst: 'music', when: bgm.next, dur: 0.5, vol: 0.09, group: bgm.group, bus: 'music' });
        if (bgm.step % 16 === 0) A.note(A.transpose(chord[0], -12), { inst: 'piano', when: bgm.next, dur: 3, vol: 0.12, group: bgm.group, bus: 'music' });
        if (bgm.step % 16 === 8) A.note(chord[2], { inst: 'flute', when: bgm.next, dur: 1.4, vol: 0.05, group: bgm.group, bus: 'music' });
        if (bgm.step % 4 === 0 && bgm.step % 16 !== 0 && Math.random() < 0.25) A.note(A.transpose(chord[(idx + 2) % 4], 24), { inst: 'bell', when: bgm.next + stepDur / 2, dur: 0.3, vol: 0.05, group: bgm.group, bus: 'music' });
        bgm.step++; bgm.next += stepDur;
        // keep the group list from growing forever
        if (bgm.group.nodes.length > 200) bgm.group.nodes = bgm.group.nodes.filter((e) => e.endAt > ctx.currentTime);
      }
    }, 60);
  };
  A.stopBgm = function () { if (bgm.timer) { clearInterval(bgm.timer); bgm.timer = null; } if (bgm.group) { bgm.group.stop(); bgm.group = null; } };
  A.bgmPlaying = () => !!bgm.timer;

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
    bark(stage) {
      if (!ctx) return; const t = ctx.currentTime;
      if (stage >= 2) { const o = osc('sawtooth', 200, t); o.frequency.exponentialRampToValueAtTime(140, t + 0.14); const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 900; const g = ctx.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(0.35, t + 0.015); g.gain.linearRampToValueAtTime(0.2, t + 0.08); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.14); o.connect(lp); lp.connect(g); g.connect(sfxBus); o.start(t); o.stop(t + 0.18); return; }
      [0, 0.13].forEach((d) => { const o = osc('square', 320, t + d); o.frequency.exponentialRampToValueAtTime(220, t + d + 0.09); const g = ctx.createGain(); g.gain.setValueAtTime(0.0001, t + d); g.gain.linearRampToValueAtTime(0.18, t + d + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + d + 0.09); o.connect(g); g.connect(sfxBus); o.start(t + d); o.stop(t + d + 0.12); });
    },
    whine() { if (!ctx) return; const t = ctx.currentTime; const o = osc('sine', 700, t); o.frequency.exponentialRampToValueAtTime(900, t + 0.35); const g = ctx.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(0.08, t + 0.06); g.gain.setValueAtTime(0.08, t + 0.24); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.35); o.connect(g); g.connect(sfxBus); o.start(t); o.stop(t + 0.4); },
    munch() { if (!ctx) return; const t = ctx.currentTime; [0, 0.12, 0.24].forEach((d) => A.note('C3', { inst: 'wood', when: t + d, dur: 0.1, vol: 0.3 })); },
    slurp() { if (!ctx) return; const t = ctx.currentTime; const s = ctx.createBufferSource(); s.buffer = noiseBuf; const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.Q.value = 1.5; bp.frequency.setValueAtTime(2000, t); bp.frequency.exponentialRampToValueAtTime(500, t + 0.25); const g = ctx.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(0.3, t + 0.04); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.25); s.connect(bp); bp.connect(g); g.connect(sfxBus); s.start(t); s.stop(t + 0.3); },
    plop() { if (!ctx) return; const t = ctx.currentTime; const o = osc('sine', 300, t); o.frequency.exponentialRampToValueAtTime(80, t + 0.18); const g = ctx.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(0.35, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.18); o.connect(g); g.connect(sfxBus); o.start(t); o.stop(t + 0.22); },
    snore() { if (!ctx) return; const t = ctx.currentTime; const o = osc('sine', 90, t); const o2 = osc('triangle', 180, t); const g2 = ctx.createGain(); g2.gain.value = 0.35; const w = ctx.createGain(); w.gain.value = 0.7; const lfo = osc('sine', 6, t); const lg = ctx.createGain(); lg.gain.value = 0.3; const g = ctx.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(0.12, t + 0.5); g.gain.linearRampToValueAtTime(0.0001, t + 0.8); lfo.connect(lg); lg.connect(w.gain); o.connect(w); o2.connect(g2); g2.connect(w); w.connect(g); g.connect(sfxBus); [o, o2, lfo].forEach((n) => { n.start(t); n.stop(t + 0.85); }); },
    pant() { if (!ctx) return; const t = ctx.currentTime; [0, 0.22].forEach((d) => { const s = ctx.createBufferSource(); s.buffer = noiseBuf; const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.Q.value = 0.8; bp.frequency.value = 1200; const g = ctx.createGain(); g.gain.setValueAtTime(0.0001, t + d); g.gain.linearRampToValueAtTime(0.1, t + d + 0.04); g.gain.exponentialRampToValueAtTime(0.0001, t + d + 0.16); s.connect(bp); bp.connect(g); g.connect(sfxBus); s.start(t + d); s.stop(t + d + 0.2); }); },
  };

  // ---- speech -------------------------------------------------------------
  let voice = null, voicesTried = false;
  function pickVoice() {
    if (!('speechSynthesis' in window)) return null;
    const voices = speechSynthesis.getVoices();
    if (!voices.length) return null;
    if (voice && voices.includes(voice)) return voice;
    const prefs = ['Samantha', 'Karen', 'Moira', 'Tessa', 'Allison', 'Ava', 'Zoe', 'Google US English', 'Microsoft Aria', 'Microsoft Zira', 'Microsoft Jenny'];
    for (const p of prefs) { const v = voices.find((v) => v.name.includes(p) && v.lang.startsWith('en')); if (v) { voice = v; return v; } }
    voice = voices.find((v) => v.lang === 'en-US') || voices.find((v) => v.lang.startsWith('en')) || voices[0];
    return voice;
  }
  if ('speechSynthesis' in window) { speechSynthesis.onvoiceschanged = () => { voice = null; pickVoice(); }; }
  A.say = function (text, o) {
    o = o || {};
    if (!FL.Save.data.settings.speech) return;
    if (!('speechSynthesis' in window)) return;
    try {
      if (o.interrupt !== false) speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.rate = o.rate || 0.92; u.pitch = o.pitch || 1.15; u.volume = 1; u.lang = 'en-US';
      const v = pickVoice(); if (v) u.voice = v;
      if (!voicesTried) { voicesTried = true; }
      speechSynthesis.speak(u);
    } catch (e) { /* ignore */ }
  };
  A.hush = function () { try { if ('speechSynthesis' in window) speechSynthesis.cancel(); } catch (e) { /* ignore */ } };

  window.FL = window.FL || {};
  FL.Audio = A;
})();
