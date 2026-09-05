// Melody Kingdom progression: friends, crowns, wands, songs and regions.
(function () {
  const UI = FL.UI, Button = UI.Button;
  UI.showFriends = function () {
    const G = FL.Game; const buttons = []; const labels = []; const lines = [];
    const { px, py } = UI.panelOrigin(); const un = FL.Save.data.unlocked;
    const size = 74, gap = 10;
    labels.push({ text: 'Friends (they follow you around)', x: px + 40, y: py + 100 });
    FL.Data.FRIENDS.forEach(([e, name, need], i) => {
      const row = Math.floor(i / 10), col = i % 10; const x = px + 40 + col * (size + gap), y = py + 118 + row * (size + gap); const has = un.includes(e);
      buttons.push(new Button({ x, y, w: size, h: size, emoji: has ? e : '🔒', label: has ? '' : `${need}⭐`, size: 14, color: !has ? '#cbd5e1' : FL.Save.data.companion === e ? '#fde047' : '#f9a8d4', emojiSize: has ? 44 : 22, enabled: has, r: 18, onTap: () => { FL.Save.data.companion = e; FL.Save.save(); FL.Audio.say(`${name} will come with you!`); UI.showFriends(); } }));
    });
    const crowns = [['gold', '👑', 0], ['flower', '🌸', 8], ['star', '⭐', 35], ['rainbow', '🌈', 62], ['leaf', '🍃', 150], ['ice', '❄️', 200]];
    labels.push({ text: 'Crowns', x: px + 40, y: py + 312 });
    crowns.forEach(([id, e, need], i) => { const has = id === 'gold' || FL.Save.has('crown', id); buttons.push(new Button({ x: px + 40 + i * (size + gap), y: py + 330, w: size, h: size, emoji: has ? e : '🔒', label: has ? '' : `${need}⭐`, size: 14, color: !has ? '#cbd5e1' : FL.Save.data.crown === id ? '#fde047' : '#e9d5ff', emojiSize: has ? 40 : 22, enabled: has, r: 18, onTap: () => { FL.Save.data.crown = id; FL.Save.save(); G.refreshLook(); FL.Audio.sfx.sparkle(); UI.showFriends(); } })); });
    const wands = [[null, '✋', 0], ['star', '🪄', 25], ['moon', '🌙', 110], ['heart', '💖', 172]];
    labels.push({ text: 'Wands', x: px + 40 + 7 * (size + gap), y: py + 312 });
    wands.forEach(([id, e, need], i) => { const has = !id || FL.Save.has('wand', id); buttons.push(new Button({ x: px + 40 + (7 + i) * (size + gap) - (i >= 3 ? 0 : 0), y: py + 330, w: size, h: size, emoji: has ? e : '🔒', label: has ? '' : `${need}⭐`, size: 14, color: !has ? '#cbd5e1' : (FL.Save.data.wand || null) === id ? '#fde047' : '#bae6fd', emojiSize: has ? 40 : 22, enabled: has, r: 18, onTap: () => { FL.Save.data.wand = id; FL.Save.save(); G.refreshLook(); FL.Audio.sfx.sparkle(); UI.showFriends(); } })); });
    // region progress
    const R = FL.Data.REGIONS; const open = FL.Save.data.regions || 1;
    for (let r = 1; r < R.length; r++) { const need = FL.Data.FRIENDS.filter((f) => f[3] === r - 1); const have = need.filter((f) => un.includes(f[0])).length; lines.push({ text: open > r ? `${R[r].name}: open! 🗺️` : `${R[r].name}: ${have} / ${need.length} ${R[r - 1].id} friends`, x: G.W / 2 + (r - 1.5) * 300, y: py + 445 }); }
    const nu = UI.nextUnlock(); if (nu) lines.push({ text: `Next: ${nu.emoji} ${nu.name} in ${Math.max(0, nu.stars - FL.Save.data.stars)} ⭐`, y: py + 485, color: '#6b7280' });
    UI.showCollection({ title: 'My Things', buttons, labels, lines });
  };
  UI.FRIENDS = FL.Data.FRIENDS;
  UI.friendName = (e) => (UI.FRIENDS.find((f) => f[0] === e) || [e, 'Friend'])[1];
  // The next reward of any kind (friend, crown, wand, decoration, song, region).
  UI.nextUnlock = function () {
    const s = FL.Save.data.stars; const c = [];
    FL.Data.FRIENDS.forEach(([e, name, need]) => { if (!FL.Save.data.unlocked.includes(e)) c.push({ stars: need, emoji: e, name }); });
    FL.Data.UNLOCKS.forEach((u) => { if (!FL.Save.has(u.type, u.id)) c.push({ stars: u.stars, emoji: u.emoji, name: u.name }); });
    FL.Songs.list.forEach((sg) => { if (sg.unlock && !FL.Save.has('song', sg.id)) c.push({ stars: sg.unlock, emoji: sg.emoji, name: sg.title }); });
    c.sort((a, b) => a.stars - b.stars); return c.find((x) => x.stars > s) || c[0] || null;
  };
  UI.prevThreshold = function () { const s = FL.Save.data.stars; let p = 0; FL.Data.FRIENDS.forEach((f) => { if (f[2] <= s) p = Math.max(p, f[2]); }); FL.Data.UNLOCKS.forEach((u) => { if (u.stars <= s) p = Math.max(p, u.stars); }); FL.Songs.list.forEach((sg) => { if (sg.unlock && sg.unlock <= s) p = Math.max(p, sg.unlock); }); return p; };
  UI.checkUnlocks = function () {
    const s = FL.Save.data.stars; const events = [];
    FL.Data.FRIENDS.forEach(([e, name, need]) => { if (s >= need && FL.Save.unlock(e)) events.push({ emoji: e, text: `New friend: ${name}!`, say: `A new friend! ${name} wants to play with you!`, color: '#db2777' }); });
    FL.Data.UNLOCKS.forEach((u) => { if (s >= u.stars && FL.Save.give(u.type, u.id)) { if (u.type === 'crown') FL.Save.data.crown = u.id; if (u.type === 'wand') FL.Save.data.wand = u.id; FL.Save.save(); events.push({ emoji: u.emoji, text: `${u.name}!`, say: u.line, color: '#7c3aed' }); } });
    FL.Songs.list.forEach((sg) => { if (sg.unlock && s >= sg.unlock && FL.Save.give('song', sg.id)) events.push({ emoji: sg.emoji, text: `New song: ${sg.title}!`, say: `You unlocked a new song: ${sg.title}!`, color: '#b45309' }); });
    const R = FL.Data.REGIONS;
    for (let r = 1; r < R.length; r++) {
      if ((FL.Save.data.regions || 1) <= r) { const need = FL.Data.FRIENDS.filter((f) => f[3] === r - 1); if (need.every((f) => FL.Save.data.unlocked.includes(f[0]))) { FL.Save.data.regions = r + 1; FL.Save.data.newRegion = r; FL.Save.save(); events.push({ emoji: '🗺️', text: `${R[r].name} is open!`, say: R[r].openLine, color: '#166534' }); } }
    }
    events.forEach((ev, i) => setTimeout(() => { UI.toast(ev.text, ev.emoji, ev.color); FL.Audio.sfx.unlock(); FL.Audio.say(ev.say, { interrupt: false }); if (FL.Game.refreshLook) FL.Game.refreshLook(); }, 2500 + i * 3400));
    return events.length;
  };
  UI.hooks.checkUnlocks = UI.checkUnlocks; UI.hooks.nextUnlock = UI.nextUnlock; UI.hooks.prevThreshold = UI.prevThreshold;
})();
