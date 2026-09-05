// Spelling Owl: a helper tool rather than a game. Ask the owl (out loud, or by typing) how to spell a word
// or a whole sentence and it appears in big letter tiles. Tap a letter to hear its name, tap a word to hear
// the word, or let the owl spell it out letter by letter.
(function () {
  const A = FL.Art, UI = FL.UI, G = () => FL.Game;
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition || null;
  const MAX_WORDS = 8, MAX_WORD_LEN = 24;
  const VOWELS = 'aeiou';

  // ---- turning "How do you spell dinosaur?" into "dinosaur" ---------------------------------------
  // Phrases that come before the word. Longest first so "how do you spell" wins over "spell".
  const LEAD = [
    'show me how to spell', 'show me how you spell', 'tell me how to spell', 'tell me how you spell', 'teach me how to spell', 'teach me to spell',
    'help me spell', 'help me to spell', 'i want you to spell', 'i want to spell', 'i need to spell', 'i would like to spell', "i'd like to spell",
    'what is the spelling of', "what's the spelling of", 'whats the spelling of', 'what is the spelling for', "what's the spelling for", 'the spelling of', 'spelling of', 'spelling for',
    'how do you spell', 'how do i spell', 'how do we spell', 'how do u spell', 'how do ya spell', 'how does one spell', 'how would you spell', 'how would i spell',
    'how should i spell', 'how should you spell', 'how can i spell', 'how can you spell', 'how could you spell', 'how to spell', 'how you spell', 'how do you write', 'how to write',
    'can you please spell', 'could you please spell', 'can you spell', 'could you spell', 'will you spell', 'would you spell', 'please spell', 'spell out', 'spell me', 'spell',
    'how is', "how's",
  ];
  const FILLER = ['hey', 'hi', 'hello', 'ok', 'okay', 'um', 'umm', 'uh', 'so', 'please', 'excuse me', 'mister owl', 'mr owl', 'owl', 'siri', 'alexa'];
  const AFTER = ['the word', 'the words', 'the name', 'this word', 'a word', 'the sentence', 'this sentence', 'the phrase', 'this', 'me', 'out', 'for me'];
  const TAIL = ['is spelled', 'is spelt', 'spelled', 'spelt', 'thank you', 'thanks', 'for me', 'please', 'owl'];
  function clean(raw) {
    const text = String(raw || '').replace(/[’‘`]/g, "'").replace(/[^A-Za-z0-9'\s-]/g, ' ').replace(/\s+/g, ' ').trim();
    const lower = text.toLowerCase();
    const at = (phrase, i) => lower.startsWith(phrase, i) && (lower.length === i + phrase.length || lower[i + phrase.length] === ' ');
    const skipSpace = (i) => { while (lower[i] === ' ') i++; return i; };
    let i = 0, asked = false;
    for (;;) { const f = FILLER.find((p) => at(p, i)); if (!f) break; i = skipSpace(i + f.length); }
    const lead = LEAD.find((p) => at(p, i));
    if (lead) {
      asked = true; i = skipSpace(i + lead.length);
      const aft = AFTER.find((p) => at(p, i)); if (aft) i = skipSpace(i + aft.length);
    } else i = 0; // no "spell" phrase: keep everything, "hi" might be the word they want
    let rest = text.slice(i).trim();
    for (;;) { // "cat spelled", "cat please" -> "cat" (but never strip the last word away)
      const l = rest.toLowerCase(); const tail = TAIL.find((p) => l.endsWith(p) && l.length > p.length && l[l.length - p.length - 1] === ' ');
      if (!tail) break; rest = rest.slice(0, rest.length - tail.length).trim();
    }
    const words = rest.split(' ').map((w) => w.replace(/^['-]+|['-]+$/g, '').slice(0, MAX_WORD_LEN)).filter(Boolean);
    return { text: words.slice(0, MAX_WORDS).join(' '), asked, tooLong: words.length > MAX_WORDS };
  }
  function letterSpeech(ch) { // what to say for one tile
    if (/[a-z]/i.test(ch)) return ch.toUpperCase();
    if (/[0-9]/.test(ch)) return ch;
    if (ch === "'") return 'apostrophe';
    if (ch === '-') return 'dash';
    return ch;
  }
  function tileColor(ch) { return /[a-z]/i.test(ch) ? (VOWELS.includes(ch.toLowerCase()) ? '#f9a8d4' : '#93c5fd') : /[0-9]/.test(ch) ? '#fde047' : '#d6d3d1'; }

  const HOME_STATUS = SR ? 'Ask me how to spell something!' : 'Type a word and tap Show me!';

  const scene = {
    t: 0, hud: { home: true, repeat: true }, words: [], tiles: [], pills: [], buttons: [], toolbar: [], status: HOME_STATUS, said: '', upper: true,
    rec: null, listening: false, listenT: 0, heard: '', gotResult: false, recError: null,
    playing: false, playId: 0, steps: [], step: 0, stepT: 0, stepMax: 0, stepDone: false, gap: 0, hl: null, letters: [], showT: 0,
    enter() {
      this.t = 0; this.words = []; this.tiles = []; this.pills = []; this.hl = null; this.playing = false; this.status = HOME_STATUS; this.said = '';
      this.upper = FL.Save.data.settings.spellUpper !== false;
      const g = G(); this.letters = []; for (let i = 0; i < 16; i++) this.letters.push({ x: Math.random() * g.W, y: Math.random() * g.H, s: 26 + Math.random() * 30, v: 12 + Math.random() * 18, ph: Math.random() * 6, ch: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'[i * 3 % 26] });
      const input = this.input(); input.value = '';
      input.onkeydown = (e) => { if (e.key === 'Enter') { e.preventDefault(); this.submitTyped(); } if (e.key === 'Escape') input.blur(); };
      document.getElementById('spellWrap').onsubmit = (e) => { e.preventDefault(); this.submitTyped(); };
      this.layout(); FL.Save.addPlay('spell');
      if (!FL.Save.data.settings.speech) UI.toast('Voice is off. Grown-ups: hold the gear in the kingdom', '🗣️', '#475569');
      setTimeout(() => { if (G().sceneName === 'spell') FL.Audio.say(SR ? 'Hoo hoo! Ask me how to spell anything. Tap the microphone and say the word, or type it!' : 'Hoo hoo! Type a word and I will spell it for you!'); }, 500);
    },
    exit() { this.stopListening(); this.stopPlayback(); const input = this.input(); input.blur(); input.onkeydown = null; document.getElementById('spellWrap').onsubmit = null; },
    input() { return document.getElementById('spellInput'); },
    layout() {
      const g = G(); this.buttons = []; this.toolbar = [];
      const by = g.H - 118, bh = 96;
      const inW = 400, showW = 236; const left = SR ? g.W / 2 - 390 : g.W / 2 - (inW + 20 + showW) / 2;
      const wasPressed = (b) => !!(b && b.pressed);
      if (SR) this.micBtn = new UI.Button({ x: left, y: by, w: 240, h: bh, label: 'Ask me!', emoji: '🎤', color: '#4ade80', size: 34, pulse: true, pressed: wasPressed(this.micBtn), onTap: () => this.listen() });
      const inX = SR ? left + 260 : left;
      this.showBtn = new UI.Button({ x: inX + inW + 20, y: by, w: showW, h: bh, label: 'Show me!', emoji: '✨', color: '#c084fc', size: 30, pressed: wasPressed(this.showBtn), onTap: () => this.submitTyped() });
      this.buttons = SR ? [this.micBtn, this.showBtn] : [this.showBtn];
      // input box lives in the DOM so the iPad keyboard can type into it; keep it lined up with the canvas
      const wrap = document.getElementById('spellWrap'); wrap.style.left = Math.round(g.offX + inX * g.scale) + 'px'; wrap.style.top = Math.round(g.offY + (by + 12) * g.scale) + 'px';
      wrap.style.transform = `scale(${g.scale})`; wrap.style.transformOrigin = 'top left'; this.inputBox = { x: inX, y: by, w: inW, h: bh };
      // right-hand toolbar
      const tx = g.W - 96;
      this.caseBtn = new UI.Button({ x: tx - 36, y: 120, w: 72, h: 72, label: this.upper ? 'ABC' : 'abc', color: '#fbbf24', round: true, size: 24, pressed: wasPressed(this.caseBtn), onTap: () => { this.upper = !this.upper; FL.Save.data.settings.spellUpper = this.upper; FL.Save.save(); this.layout(); } });
      this.readBtn = new UI.Button({ x: tx - 36, y: 208, w: 72, h: 72, emoji: '📖', color: '#60a5fa', round: true, emojiSize: 40, pressed: wasPressed(this.readBtn), onTap: () => this.readAll() });
      this.clearBtn = new UI.Button({ x: tx - 36, y: 296, w: 72, h: 72, emoji: '🧹', color: '#f87171', round: true, emojiSize: 38, pressed: wasPressed(this.clearBtn), onTap: () => this.clear() });
      this.toolbar = [this.caseBtn, this.readBtn, this.clearBtn];
      this.layoutTiles();
    },
    resize() { this.layout(); },
    // ---- words and tiles ---------------------------------------------------------------------------
    ask(raw) {
      const { text, asked, tooLong } = clean(raw);
      if (!text) { this.status = asked ? 'What word should I spell?' : 'Ask me how to spell a word!'; FL.Audio.say(asked ? 'Hoo? What word should I spell?' : 'Ask me how to spell a word!'); return; }
      if (tooLong) UI.toast(`That's a long one! Here are the first ${MAX_WORDS} words`, '🦉', '#7c3aed');
      this.show(text);
    },
    show(text) {
      this.stopPlayback(); FL.Audio.sfx.whoosh(); this.input().value = text;
      this.said = text; this.words = text.split(' ').map((w, i) => ({ text: w, chars: Array.from(w), idx: i }));
      const one = this.words.length === 1;
      this.status = one ? `Here's how you spell ${text}!` : "Here's how you spell it!";
      this.showT = 0; this.layoutTiles();
      const delay = 300 + this.tiles.length * 50; this.autoT = setTimeout(() => { this.autoT = null; if (G().sceneName === 'spell' && this.said === text) this.spellOut(); }, delay);
    },
    layoutTiles() {
      const g = G(); const ctx = g.ctx; const oldTiles = this.tiles, oldPills = this.pills; this.tiles = []; this.pills = [];
      if (!this.words.length) return;
      const areaX = 210, areaW = g.W - 210 - 170, areaY = 140, areaH = g.H - 250 - areaY;
      const sizes = [124, 110, 98, 88, 78, 70, 62, 56, 50, 44, 40, 36, 32];
      // Greedy line wrap of word segments. A word normally stays on one line; when split is allowed a word that is
      // too wide continues on the next line (so "supercalifragilisticexpialidocious" still gets readable tiles).
      const wrap = (T, split) => {
        const gapL = T * 0.12, gapW = T * 0.85; const per = Math.max(1, Math.floor((areaW + gapL) / (T + gapL)));
        const ls = []; let cur = [], curW = 0; let ok = true;
        this.words.forEach((w) => {
          if (w.chars.length > per && !split) { ok = false; return; }
          const chunk = Math.ceil(w.chars.length / Math.ceil(w.chars.length / per)); // even rows: 34 letters -> 9+9+8+8, not 11+11+11+1
          for (let start = 0; start < w.chars.length; start += chunk) {
            const chars = w.chars.slice(start, start + chunk); const ww = chars.length * T + (chars.length - 1) * gapL; const last = start + chars.length >= w.chars.length;
            if (cur.length && (start > 0 || curW + gapW + ww > areaW)) { ls.push(cur); cur = []; curW = 0; }
            cur.push({ w, chars, start, last, ww }); curW = cur.length > 1 ? curW + gapW + ww : ww;
            if (!last) { ls.push(cur); cur = []; curW = 0; }
          }
        });
        if (cur.length) ls.push(cur); return ok ? ls : null;
      };
      // Prefer every word on one row while the tiles stay big enough to read; otherwise let long words wrap.
      let T = sizes[sizes.length - 1], lines = null;
      for (const [split, minT] of [[false, 44], [true, 0]]) { for (const s of sizes) { if (s < minT) break; const ls = wrap(s, split); if (ls && ls.length * s * 2.05 - s * 0.35 <= areaH) { T = s; lines = ls; break; } } if (lines) break; }
      if (!lines) lines = wrap(T, true);
      const gapL = T * 0.12, gapW = T * 0.85, lineH = T * 2.05; const totalH = lines.length * lineH - T * 0.35; let y = areaY + (areaH - totalH) / 2;
      let n = 0;
      lines.forEach((line) => {
        const lineW = line.reduce((a, seg) => a + seg.ww, 0) + (line.length - 1) * gapW;
        let x = areaX + (areaW - lineW) / 2;
        line.forEach((seg) => {
          const w = seg.w;
          seg.chars.forEach((ch, k) => {
            const i = seg.start + k;
            const b = new UI.Button({ x: x + k * (T + gapL), y, w: T, h: T, label: '', color: tileColor(ch), size: T * 0.62, r: T * 0.22, textColor: '#3b0764', textStroke: 'rgba(255,255,255,.35)', onTap: () => this.tapTile(b) });
            b.tile = { ch, w: w.idx, i, pop: 0, delay: n++ * 0.05 }; b.pressed = oldTiles.some((o) => o.pressed && o.tile.w === w.idx && o.tile.i === i); this.tiles.push(b);
          });
          if (seg.last) { // the word pill sits under the (last) row of its letters
            const size = Math.max(22, Math.min(40, T * 0.4)); const pw = Math.min(seg.ww + gapW, A.measure(ctx, w.text, size) + size * 1.4 + 56); // never wider than its row + gap, so pills of neighbouring words don't collide
            const pill = new UI.Button({ x: x + seg.ww / 2 - pw / 2, y: y + T + T * 0.22, w: pw, h: Math.max(44, T * 0.56), label: w.text, emoji: '🔊', color: '#a78bfa', size, emojiSize: size * 1.1, r: 40, onTap: () => this.tapWord(pill) });
            pill.word = w; pill.pop = 0; pill.pressed = oldPills.some((o) => o.pressed && o.word.idx === w.idx); this.pills.push(pill);
          }
          x += seg.ww + gapW;
        });
        y += lineH;
      });
    },
    tileLabel(ch) { return this.upper ? ch.toUpperCase() : ch; },
    tapTile(b) {
      this.stopPlayback(); b.tile.pop = 1; const g = G();
      g.fx.burst(b.x + b.w / 2, b.y + b.h / 2, { count: 12, type: 'star', colors: [b.color, '#fff', '#fde047'], speed: 260, life: 0.7, size: 10 });
      FL.Audio.say(letterSpeech(b.tile.ch), { rate: 0.85 });
    },
    tapWord(pill) {
      this.stopPlayback(); pill.pop = 1; const g = G();
      g.fx.burst(pill.x + pill.w / 2, pill.y + pill.h / 2, { count: 10, type: 'heart', colors: ['#f472b6', '#fb7185', '#fff'], speed: 220, life: 0.8, size: 12 });
      FL.Audio.say(pill.word.text, { rate: 0.9 });
    },
    readAll() { if (!this.words.length) return; this.stopPlayback(); this.pills.forEach((p) => { p.pop = 1; }); FL.Audio.say(this.said, { rate: 0.9 }); },
    clear() { this.stopPlayback(); this.words = []; this.tiles = []; this.pills = []; this.said = ''; this.input().value = ''; this.status = HOME_STATUS; FL.Audio.sfx.whoosh(); },
    repeatPrompt() { if (this.words.length) this.spellOut(); else FL.Audio.say(SR ? 'Tap the microphone and ask me how to spell something!' : 'Type a word and tap Show me!'); },
    // ---- the owl spells it out: one letter at a time, then the word ---------------------------------
    spellOut() {
      if (!this.words.length) return;
      this.stopPlayback(); this.playing = true; this.playId++; this.steps = [];
      this.words.forEach((w) => { w.chars.forEach((ch, i) => this.steps.push({ kind: 'tile', w: w.idx, i })); this.steps.push({ kind: 'word', w: w.idx }); });
      this.step = -1; this.nextStep();
    },
    nextStep() {
      this.step++; const st = this.steps[this.step];
      if (!st) { this.playing = false; this.hl = null; G().fx.burst(G().W / 2, G().H / 2 - 60, { count: 30, type: 'confetti', speed: 500, life: 1.6, size: 12, gravity: 500 }); return; }
      this.hl = st; this.stepT = 0; this.stepDone = false; this.gap = 0; const pid = this.playId, sid = this.step;
      let text, target;
      if (st.kind === 'tile') { target = this.tiles.find((b) => b.tile.w === st.w && b.tile.i === st.i); if (target) { text = letterSpeech(target.tile.ch); target.tile.pop = 1; } }
      else { target = this.pills.find((p) => p.word.idx === st.w); if (target) { text = target.word.text; target.pop = 1; } }
      if (!target) { this.nextStep(); return; }
      G().fx.burst(target.x + target.w / 2, target.y + target.h / 2, { count: 6, type: 'star', colors: ['#fff', '#fde047'], speed: 200, life: 0.6, size: 8 });
      const u = FL.Audio.say(text, { interrupt: false, rate: st.kind === 'tile' ? 0.85 : 0.9, onend: () => { if (this.playing && this.playId === pid && this.step === sid) this.stepDone = true; } });
      this.utter = u; // keep a reference: Chrome drops onend for utterances that get garbage-collected
      // if the voice is off (or onend never fires) the timer below moves things along
      this.stepMax = u ? (st.kind === 'tile' ? 1.8 : 2.2 + text.length * 0.12) : 0.55;
    },
    stopPlayback() { if (this.autoT) { clearTimeout(this.autoT); this.autoT = null; } if (this.playing) { this.playing = false; this.hl = null; this.playId++; FL.Audio.hush(); } },
    // ---- listening ------------------------------------------------------------------------------------
    listen() {
      if (!SR) { this.focusInput(); return; }
      if (this.rec) { this.stopListening(); return; }
      this.stopPlayback(); FL.Audio.hush(); this.input().blur();
      let rec; try { rec = new SR(); } catch (e) { this.status = 'Type the word instead!'; this.focusInput(); return; }
      rec.lang = 'en-US'; rec.interimResults = true; rec.maxAlternatives = 1; rec.continuous = false;
      this.rec = rec; this.heard = ''; this.gotResult = false; this.recError = null; this.listenT = 0; this.status = "I'm listening... say the word!";
      rec.onresult = (e) => {
        let finalT = '', interim = '';
        for (let i = 0; i < e.results.length; i++) { const r = e.results[i]; if (r.isFinal) finalT += r[0].transcript + ' '; else interim += r[0].transcript + ' '; }
        this.heard = (finalT || interim).trim();
        if (finalT.trim() && !this.gotResult) { this.gotResult = true; this.ask(finalT); }
      };
      rec.onerror = (e) => { this.recError = e && e.error; };
      rec.onend = () => {
        if (this.rec !== rec) return; const err = this.recError; this.rec = null; this.listening = false; this.recError = null;
        if (this.gotResult) return;
        if (err === 'not-allowed' || err === 'service-not-allowed') { this.status = 'No microphone. Type the word instead!'; FL.Audio.say("I can't hear through the microphone. Let's type the word instead!"); this.focusInput(); }
        else if (err === 'network') { this.status = 'The microphone needs internet. Type it instead!'; FL.Audio.say('The microphone needs the internet. Type the word instead!'); }
        else if (err === 'aborted') { this.status = HOME_STATUS; }
        else if (this.heard) { this.ask(this.heard); }
        else { this.status = "Hoo? I didn't hear a word. Try again!"; FL.Audio.say("Hoo? I didn't hear a word. Tap the microphone and try again!"); }
      };
      try { rec.start(); this.listening = true; FL.Audio.sfx.pop(); }
      catch (e) { this.rec = null; this.listening = false; this.status = 'Type the word instead!'; this.focusInput(); }
    },
    stopListening() { const rec = this.rec; if (!rec) return; this.rec = null; this.listening = false; this.status = HOME_STATUS; try { rec.abort(); } catch (e) { /* ignore */ } },
    focusInput() { try { this.input().focus(); } catch (e) { /* ignore */ } },
    submitTyped() { const input = this.input(); const v = input.value; input.blur(); if (!v.trim()) { this.focusInput(); return; } this.ask(v); },
    // ---- input ------------------------------------------------------------------------------------------
    down(p) {
      if (this.inputBox && p.x >= this.inputBox.x && p.x <= this.inputBox.x + this.inputBox.w && p.y >= this.inputBox.y && p.y <= this.inputBox.y + this.inputBox.h) { p.typing = true; return; }
      this.input().blur();
      if (UI.pressDown(this.buttons, p) || UI.pressDown(this.toolbar, p)) return;
      if (UI.pressDown(this.tiles, p) || UI.pressDown(this.pills, p)) return;
    },
    up(p) {
      if (p.typing) { this.focusInput(); return; }
      if (UI.pressUp(this.buttons, p) || UI.pressUp(this.toolbar, p)) return;
      if (UI.pressUp(this.tiles, p) || UI.pressUp(this.pills, p)) return;
    },
    key(k) {
      if (k === 'Enter') { if (this.words.length) this.spellOut(); else this.focusInput(); }
      else if (k === 'Escape') this.clear();
      else if (k.length === 1 && /[a-z0-9]/i.test(k)) this.focusInput(); // start typing straight away on a keyboard
    },
    update(dt) {
      const g = G(); this.t += dt; this.showT += dt;
      this.tiles.forEach((b) => { b.tile.pop = Math.max(0, b.tile.pop - dt * 2.2); });
      this.pills.forEach((p) => { p.pop = Math.max(0, p.pop - dt * 2.2); });
      this.readBtn.visible = this.words.length > 1; this.clearBtn.visible = this.words.length > 0; this.caseBtn.visible = this.words.length > 0;
      if (this.listening) { this.listenT += dt; if (this.listenT > 12 && this.rec) { try { this.rec.stop(); } catch (e) { /* ignore */ } } if (this.listenT > 16) this.stopListening(); }
      if (this.playing) {
        this.stepT += dt;
        if (this.stepDone) { this.gap += dt; if (this.gap > 0.16) this.nextStep(); }
        else if (this.stepT > this.stepMax) this.nextStep();
      }
      this.letters.forEach((l) => { l.y -= l.v * dt; if (l.y < -40) { l.y = g.H + 40; l.x = Math.random() * g.W; } });
    },
    draw(ctx) {
      const g = G(); const t = this.t;
      A.sky(ctx, g.W, g.H, '#a5b4fc', '#fce7f3');
      for (let i = 0; i < 30; i++) { const x = (i * 173.3) % g.W, y = (i * 97.1) % (g.H * 0.45); ctx.fillStyle = `rgba(255,255,255,${0.3 + 0.5 * Math.abs(Math.sin(t * 1.5 + i))})`; A.starPath(ctx, x, y, 3 + (i % 3) * 1.5, null, 4); ctx.fill(); }
      this.letters.forEach((l) => A.text(ctx, l.ch, l.x + Math.sin(t + l.ph) * 14, l.y, { size: l.s, color: 'rgba(255,255,255,.35)' }));
      A.cloud(ctx, g.W * 0.7 + Math.sin(t * 0.2) * 20, 150, 34, 0.75);
      A.hills(ctx, g.W, g.H, g.H * 0.62, '#bbf7d0', 4); A.hills(ctx, g.W, g.H, g.H * 0.7, '#86efac', 1); A.grass(ctx, g.W, g.H, g.H * 0.78);
      // the owl's tree
      A.tree(ctx, 118, 470, 2.1, 2, t);
      const owlBob = Math.sin(t * 2) * 3; const talking = this.playing || this.listening;
      A.emoji(ctx, '🦉', 150, 330 + owlBob, 74, { scale: talking ? 1 + Math.abs(Math.sin(t * 9)) * 0.08 : 1 });
      if (this.listening) { const k = Math.abs(Math.sin(t * 5)); A.emoji(ctx, '👂', 208, 300 + owlBob, 30 + k * 6); }
      // tiles
      this.tiles.forEach((b) => {
        const app = Math.min(1, Math.max(0, (this.showT - b.tile.delay) / 0.25)); if (app <= 0) return;
        const hl = this.hl && this.hl.kind === 'tile' && this.hl.w === b.tile.w && this.hl.i === b.tile.i;
        const sc = app * (1 + Math.sin(b.tile.pop * Math.PI) * 0.18) * (hl ? 1.12 : 1);
        const cx = b.x + b.w / 2, cy = b.y + b.h / 2;
        ctx.save(); ctx.translate(cx, cy); ctx.scale(sc, sc); ctx.translate(-cx, -cy);
        if (hl) { ctx.save(); ctx.shadowColor = '#fde047'; ctx.shadowBlur = 30; ctx.fillStyle = 'rgba(253,224,71,.9)'; A.roundRect(ctx, b.x - 8, b.y - 8, b.w + 16, b.h + 16, b.r + 6); ctx.fill(); ctx.restore(); }
        b.label = this.tileLabel(b.tile.ch); b.draw(ctx, t);
        ctx.restore();
      });
      this.pills.forEach((p) => {
        const app = Math.min(1, Math.max(0, (this.showT - 0.3) / 0.3)); if (app <= 0) return;
        const hl = this.hl && this.hl.kind === 'word' && this.hl.w === p.word.idx;
        const sc = app * (1 + Math.sin(p.pop * Math.PI) * 0.12) * (hl ? 1.1 : 1);
        const cx = p.x + p.w / 2, cy = p.y + p.h / 2;
        ctx.save(); ctx.translate(cx, cy); ctx.scale(sc, sc); ctx.translate(-cx, -cy);
        if (hl) { ctx.save(); ctx.shadowColor = '#fde047'; ctx.shadowBlur = 24; ctx.fillStyle = 'rgba(253,224,71,.9)'; A.roundRect(ctx, p.x - 7, p.y - 7, p.w + 14, p.h + 14, 46); ctx.fill(); ctx.restore(); }
        p.draw(ctx, t);
        ctx.restore();
      });
      if (!this.words.length) { // empty state
        const y = g.H / 2 - 40; A.emoji(ctx, '🔤', g.W / 2, y - 70 + Math.sin(t * 2) * 8, 110);
        A.text(ctx, SR ? '"How do you spell dinosaur?"' : 'Type any word or sentence', g.W / 2, y + 40, { size: 40, color: '#fff', stroke: 'rgba(76,29,149,.55)', strokeWidth: 7 });
        A.text(ctx, 'Then tap a letter to hear it, or tap the word to hear the word', g.W / 2, y + 95, { size: 24, color: '#fff', stroke: 'rgba(76,29,149,.45)', strokeWidth: 5 });
      }
      // owl says (banner)
      const text = this.listening && this.heard ? `"${this.heard}"` : this.status;
      const size = A.fitSize(ctx, text, g.W - 650, 36); // stays clear of the HUD buttons on the left and the star pill on the right
      UI.banner(ctx, text, { emoji: '🦉', size, minW: 560, color: this.listening ? '#fee2e2' : 'rgba(255,255,255,.92)', border: this.listening ? '#f87171' : '#c4b5fd' });
      // controls
      if (SR) { this.micBtn.color = this.listening ? '#f87171' : '#4ade80'; this.micBtn.label = this.listening ? 'Listening' : 'Ask me!'; this.micBtn.pulse = !this.listening; }
      if (this.listening && this.micBtn) { const b = this.micBtn; ctx.save(); ctx.strokeStyle = 'rgba(248,113,113,.8)'; ctx.lineWidth = 6; const k = (t * 1.5) % 1; ctx.globalAlpha = 1 - k; A.roundRect(ctx, b.x - 10 - k * 24, b.y - 10 - k * 24, b.w + 20 + k * 48, b.h + 20 + k * 48, 40 + k * 20); ctx.stroke(); ctx.restore(); }
      this.buttons.forEach((b) => b.draw(ctx, t));
      this.toolbar.forEach((b) => b.draw(ctx, t));
      // frame behind the DOM input so it looks like part of the scene
      const ib = this.inputBox; if (ib) { ctx.fillStyle = 'rgba(0,0,0,.15)'; A.roundRect(ctx, ib.x - 6, ib.y + 6, ib.w + 12, ib.h, 30); ctx.fill(); }
      A.princess(ctx, 120, g.H - 40, g.look, { t, facing: 1, wave: this.playing }, 0.95);
      A.emoji(ctx, FL.Save.data.companion, 40, g.H - 70 - Math.abs(Math.sin(t * 5)) * 6, 44);
    },
  };
  FL.scenes.spell = scene;
  FL.Spell = { clean, letterSpeech };
})();
