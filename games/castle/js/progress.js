// Castle Quest progression: companions and treasures, plugged into the engine's UI hooks.
(function () {
  const UI = FL.UI, Button = UI.Button, D = FL.Data;
  const ROOMS_MASTERED = () => D.ROOMS.every((r) => FL.Save.level(r.id) >= 2);
  UI.showFriends = function () {
    const G = FL.Game; const buttons = []; const labels = []; const lines = [];
    const { px, py } = UI.panelOrigin(); const un = FL.Save.data.unlocked; const size = 74, gap = 12;
    labels.push({ text: 'Companions (they follow you around)', x: px + 40, y: py + 100 });
    D.FRIENDS.forEach(([e, name, need], i) => {
      const x = px + 40 + i * (size + gap), y = py + 118; const has = un.includes(e);
      buttons.push(new Button({ x, y, w: size, h: size, emoji: has ? e : '🔒', label: has ? '' : `${need}⭐`, size: 14, color: !has ? '#cbd5e1' : FL.Save.data.companion === e ? '#fde047' : '#bfdbfe', emojiSize: has ? 44 : 22, enabled: has, r: 18, onTap: () => { FL.Save.data.companion = e; FL.Save.save(); FL.Audio.say(`${name} will come with you!`); UI.showFriends(); } }));
    });
    labels.push({ text: 'Treasures found in the castle', x: px + 40, y: py + 232 });
    D.TREASURES.forEach((tr, i) => { const has = FL.Save.has('treasure', tr.id); const x = px + 40 + i * (size + gap), y = py + 250; buttons.push(new Button({ x, y, w: size, h: size, emoji: has ? tr.emoji : '🔒', label: has ? '' : `${tr.stars}⭐`, size: 14, color: has ? '#fef3c7' : '#cbd5e1', emojiSize: has ? 42 : 22, enabled: has, r: 18, onTap: () => { FL.Audio.sfx.sparkle(); FL.Audio.say(tr.line); } })); });
    lines.push({ text: `${FL.Save.data.stars} stars · ${D.TREASURES.filter((t) => FL.Save.has('treasure', t.id)).length} of ${D.TREASURES.length} treasures`, y: py + 372, color: '#7c2d12' });
    D.ROOMS.forEach((r, i) => lines.push({ text: `${r.emoji} level ${FL.Save.level(r.id)}`, x: G.W / 2 + (i - 2) * 160, y: py + 415, size: 18, color: '#374151' }));
    const nu = UI.nextUnlock(); if (nu) lines.push({ text: `Next: ${nu.emoji} ${nu.name} in ${Math.max(0, nu.stars - FL.Save.data.stars)} ⭐`, y: py + 460, color: '#6b7280' });
    if (FL.Save.has('treasure', 'egg')) lines.push({ text: FL.Save.has('treasure', 'hatched') ? '🐉 The dragon egg hatched!' : '🥚 Reach level 2 in every room to hatch the dragon egg', y: py + 490, size: 18, color: '#9d174d' });
    UI.showCollection({ title: 'My Treasures', buttons, labels, lines });
  };
  UI.FRIENDS = D.FRIENDS;
  UI.friendName = (e) => (D.FRIENDS.find((f) => f[0] === e) || [e, 'Friend'])[1];
  UI.nextUnlock = function () {
    const s = FL.Save.data.stars; const c = [];
    D.FRIENDS.forEach(([e, name, need]) => { if (!FL.Save.data.unlocked.includes(e)) c.push({ stars: need, emoji: e, name }); });
    D.TREASURES.forEach((tr) => { if (!FL.Save.has('treasure', tr.id)) c.push({ stars: tr.stars, emoji: tr.emoji, name: tr.name }); });
    c.sort((a, b) => a.stars - b.stars); return c.find((x) => x.stars > s) || c[0] || null;
  };
  UI.prevThreshold = function () { const s = FL.Save.data.stars; let p = 0; D.FRIENDS.forEach((f) => { if (f[2] <= s) p = Math.max(p, f[2]); }); D.TREASURES.forEach((t) => { if (t.stars <= s) p = Math.max(p, t.stars); }); return p; };
  UI.checkUnlocks = function () {
    const s = FL.Save.data.stars; const events = [];
    D.FRIENDS.forEach(([e, name, need]) => { if (s >= need && e !== '🐉' && FL.Save.unlock(e)) events.push({ emoji: e, text: `New companion: ${name}!`, say: `A new companion! ${name} wants to explore with you!`, color: '#1d4ed8' }); });
    D.TREASURES.forEach((tr) => { if (s >= tr.stars && FL.Save.give('treasure', tr.id)) events.push({ emoji: tr.emoji, text: `${tr.name}!`, say: tr.line, color: '#b45309' }); });
    if (FL.Save.has('treasure', 'egg') && ROOMS_MASTERED() && FL.Save.give('treasure', 'hatched')) { FL.Save.unlock('🐉'); events.push({ emoji: '🐉', text: 'The dragon egg hatched!', say: 'Crack! The dragon egg hatched! A baby dragon wants to explore with you!', color: '#166534' }); }
    events.forEach((ev, i) => setTimeout(() => { UI.toast(ev.text, ev.emoji, ev.color); FL.Audio.sfx.unlock(); FL.Audio.say(ev.say, { interrupt: false }); if (FL.Game.refreshLook) FL.Game.refreshLook(); }, 2500 + i * 3400));
    return events.length;
  };
  UI.hooks.checkUnlocks = UI.checkUnlocks; UI.hooks.nextUnlock = UI.nextUnlock; UI.hooks.prevThreshold = UI.prevThreshold;
})();
