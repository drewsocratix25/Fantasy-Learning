// Germ Patrol progression: sidekicks, capes, goggles, town decorations and patrol badges.
(function () {
  const UI = FL.UI, D = FL.Data, Button = UI.Button;
  UI.sidekickName = (e) => (D.SIDEKICKS.find((s) => s[0] === e) || [e, 'Buddy'])[1];
  UI.nextUnlock = function () {
    const s = FL.Save.data.stars; const c = [];
    D.SIDEKICKS.forEach(([e, name, need]) => { if (!FL.Save.data.unlocked.includes(e)) c.push({ stars: need, emoji: e, name }); });
    D.UNLOCKS.forEach((u) => { if (!FL.Save.has(u.type, u.id)) c.push({ stars: u.stars, emoji: u.emoji, name: u.name }); });
    c.sort((a, b) => a.stars - b.stars); return c.find((x) => x.stars > s) || c[0] || null;
  };
  UI.prevThreshold = function () { const s = FL.Save.data.stars; let p = 0; D.SIDEKICKS.forEach((f) => { if (f[2] <= s) p = Math.max(p, f[2]); }); D.UNLOCKS.forEach((u) => { if (u.stars <= s) p = Math.max(p, u.stars); }); return p; };
  UI.checkUnlocks = function () {
    const s = FL.Save.data.stars; const ev = [];
    D.SIDEKICKS.forEach(([e, name, need]) => { if (s >= need && FL.Save.unlock(e)) ev.push({ emoji: e, text: `New sidekick: ${name}!`, say: `A new sidekick! ${name} joins the patrol!`, color: '#0369a1' }); });
    D.UNLOCKS.forEach((u) => { if (s >= u.stars && FL.Save.give(u.type, u.id)) { if (u.type === 'goggles') { FL.Save.data.goggles = u.id; FL.Save.save(); } ev.push({ emoji: u.emoji, text: `${u.name}!`, say: u.line, color: '#7c3aed' }); } });
    D.BADGES.forEach(([id, name, emoji]) => { if ((FL.Save.data.plays[id] || 0) >= D.BADGE_PLAYS && FL.Save.give('badge', id)) ev.push({ emoji, text: `${name} badge!`, say: `You earned the ${name} badge!`, color: '#b45309' }); });
    ev.forEach((e, i) => setTimeout(() => { UI.toast(e.text, e.emoji, e.color); FL.Audio.sfx.unlock(); FL.Audio.say(e.say, { interrupt: false }); if (FL.Game.refreshLook) FL.Game.refreshLook(); }, 2500 + i * 3400));
    return ev.length;
  };
  UI.showGear = function () {
    const G = FL.Game; const { px, py } = UI.panelOrigin(); const un = FL.Save.data.unlocked; const buttons = [], labels = [], lines = []; const size = 74, gap = 10;
    labels.push({ text: 'Sidekicks (they come along on patrol)', x: px + 40, y: py + 100 });
    D.SIDEKICKS.forEach(([e, name, need], i) => { const has = un.includes(e); buttons.push(new Button({ x: px + 40 + i * (size + gap), y: py + 118, w: size, h: size, emoji: has ? e : '🔒', label: has ? '' : `${need}⭐`, size: 14, color: !has ? '#cbd5e1' : FL.Save.data.companion === e ? '#fde047' : '#bae6fd', emojiSize: has ? 44 : 22, enabled: has, r: 18, onTap: () => { FL.Save.data.companion = e; FL.Save.save(); FL.Audio.say(`${name} will come with you!`); UI.showGear(); } })); });
    labels.push({ text: 'Patrol badges (play a station 3 times)', x: px + 40, y: py + 228 });
    D.BADGES.forEach(([id, name, emoji], i) => { const has = FL.Save.has('badge', id); const p = FL.Save.data.plays[id] || 0; buttons.push(new Button({ x: px + 40 + i * (size + gap), y: py + 246, w: size, h: size, emoji: has ? emoji : '🔒', label: has ? '' : `${Math.min(p, D.BADGE_PLAYS)}/${D.BADGE_PLAYS}`, size: 14, color: has ? '#fde68a' : '#cbd5e1', emojiSize: has ? 42 : 22, enabled: true, r: 18, onTap: () => FL.Audio.say(has ? `You earned the ${name} badge!` : `${name} badge: play ${D.BADGE_PLAYS - p} more time${D.BADGE_PLAYS - p === 1 ? '' : 's'}!`, { tts: !has }) })); });
    labels.push({ text: 'Goggles', x: px + 40, y: py + 356 });
    [['plain', '🥽', 0], ['star', '⭐', 16], ['rainbow', '🌈', 48]].forEach(([id, e, need], i) => { const has = id === 'plain' || FL.Save.has('goggles', id); buttons.push(new Button({ x: px + 40 + i * (size + gap), y: py + 374, w: size, h: size, emoji: has ? e : '🔒', label: has ? '' : `${need}⭐`, size: 14, color: !has ? '#cbd5e1' : (FL.Save.data.goggles || 'plain') === id ? '#fde047' : '#e9d5ff', emojiSize: has ? 40 : 22, enabled: has, r: 18, onTap: () => { FL.Save.data.goggles = id; FL.Save.save(); G.refreshLook(); FL.Audio.sfx.sparkle(); UI.showGear(); } })); });
    labels.push({ text: 'Cape colour', x: px + 40 + 4 * (size + gap), y: py + 356 });
    FL.Art.capeColors().forEach((c, i) => { buttons.push(new Button({ x: px + 40 + 4 * (size + gap) + i * 52, y: py + 374, w: 46, h: size, color: c[0], r: 14, onTap: () => { FL.Save.data.dress = c; FL.Save.save(); G.refreshLook(); FL.Audio.sfx.sparkle(); UI.showGear(); } })); });
    const nu = UI.nextUnlock(); if (nu) lines.push({ text: `Next: ${nu.emoji} ${nu.name} in ${Math.max(0, nu.stars - FL.Save.data.stars)} ⭐`, y: py + 480, color: '#6b7280' });
    UI.showCollection({ title: 'My Gear', buttons, labels, lines });
  };
  UI.hooks.checkUnlocks = UI.checkUnlocks; UI.hooks.nextUnlock = UI.nextUnlock; UI.hooks.prevThreshold = UI.prevThreshold;
  // Hero look: engine's refreshLook uses Art.PRINCESSES + dress; extend it with goggles.
  const baseRefresh = () => { const G = FL.Game; let look = Object.assign({}, D.HEROES[FL.Save.data.princess] || D.HEROES[0]); if (FL.Save.data.dress) { look.cape = FL.Save.data.dress[0]; look.capeDark = FL.Save.data.dress[1]; } look.goggles = FL.Save.data.goggles || 'plain'; G.look = look; return look; };
  FL.heroRefresh = baseRefresh;
  // Music styles for this game
  Object.assign(FL.Audio.music.styles, {
    town: { bpm: 108, keys: ['C', 'F', 'G'], leads: ['bell', 'music', 'marimba'], arpInst: 'marimba', meter: 4, pad: 0.6, perc: 0.6, vol: 0.9 },
    bath: { bpm: 112, keys: ['F', 'Bb'], leads: ['marimba', 'bell'], arpInst: 'marimba', meter: 4, pad: 0.4, perc: 0.5, vol: 0.85 },
    body: { bpm: 92, keys: ['D', 'G'], leads: ['harp', 'flute'], arpInst: 'pad', meter: 4, pad: 1, perc: 0.9, vol: 0.7 },
    lab: { bpm: 84, keys: ['E', 'A'], leads: ['bell'], arpInst: 'music', meter: 3, pad: 1, perc: 0, vol: 0.6 },
    play: { bpm: 124, keys: ['G', 'C', 'D'], leads: ['music', 'flute'], arpInst: 'harp', meter: 4, pad: 0.5, perc: 0.7, vol: 0.85 },
  });
  // "Did you know?" fact after a game, spoken before the results praise.
  FL.sayFact = function (game) { const arr = D.FACTS[game]; if (!arr) return; const f = arr[Math.floor(Math.random() * arr.length)]; FL.Game.later(() => { FL.Audio.say('Did you know?', { interrupt: false }); FL.Audio.say(f, { interrupt: false }); }, 3800); };
})();
