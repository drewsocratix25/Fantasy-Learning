// Every sentence the Castle Quest narrator can say, so a voice pack can be pre-rendered
// (python3 tools/make-voices.py --game castle). Keep in sync with the rooms' prompts and feedback.
(function () {
  const D = () => FL.Data;
  const cap = (s) => s[0].toUpperCase() + s.slice(1);
  const art = (w) => FL.Lines.article(w);
  FL.Lines.all = function (name) {
    const L = []; const seen = new Set(); const add = (text, speak) => { if (seen.has(text)) return; seen.add(text); L.push(speak && speak !== text ? { text, speak } : { text }); };
    const D_ = D();
    // title, castle, grown-up corner
    add('Welcome to Castle Quest! Let\'s go exploring!'); if (name) add(`Welcome to Castle Quest, ${name}! Let's go exploring!`);
    D_.PRINCESSES.forEach((p) => add(`Hi! I'm ${p.name}!`));
    add('Tap a room to go inside!');
    D_.ROOMS.forEach((r) => { add(`${r.name}! ${r.hint}`); add(`Let's go to the ${r.name}!`); });
    D_.PRAISE.forEach((p) => [1, 2, 3].forEach((n) => { add(`${p}! You earned ${n} star${n > 1 ? 's' : ''}!`); if (name) add(`${p}, ${name}! You earned ${n} star${n > 1 ? 's' : ''}!`); }));
    D_.FRIENDS.forEach(([, f]) => { add(`${f} will come with you!`); add(`A new companion! ${f} wants to explore with you!`); });
    D_.TREASURES.forEach((t) => add(t.line));
    add('Crack! The dragon egg hatched! A baby dragon wants to explore with you!');
    add(FL.config.voiceTestLine); if (name) add(FL.config.voiceTestLineNamed(name));
    // Sky Tower
    add('Is it day or night?'); add("Yes! It's day. The sun is shining!"); add("Look, the moon is out. It's night!"); add("Yes! It's night. The moon and stars are out!"); add("Look, the sun is out. It's day!");
    D_.WEATHER.forEach((w) => { add(`It's ${w.name}! What should we take?`); add(`Yes! ${cap(w.wear[1])} for a ${w.name} day!`); D_.WEAR_WRONG.concat(D_.WEATHER.filter((o) => o !== w).map((o) => o.wear)).forEach(([, n]) => add(`${cap(n)} won't help on a ${w.name} day.`)); });
    D_.SKY_THINGS.forEach(([, n]) => { add(`Which one is the ${n}?`); add(`Yes! That's the ${n}!`); add(`That's the ${n}.`); });
    D_.SEASONS.forEach((s) => { add(`Which season is it when ${s.fact}?`); add(`Yes! In ${s.name}, ${s.fact}!`); add(`That's ${s.name}.`); });
    // Royal Greenhouse
    const SP = ['The seed is thirsty! What does it need?', 'The sprout is reaching up! What does it need?', 'The leaves are dry! What does it need?', 'The flower wants to open! What does it need?'];
    SP.forEach((p) => add(p)); D_.PLANTS.forEach(([, pn]) => { add(`Let's grow ${pn}! ${SP[0]}`); D_.PLANT_NEEDS.forEach(([, nd]) => add(`Yes! ${cap(nd)}! Look, ${pn}!`)); });
    D_.PLANT_NEEDS.forEach(([, nd]) => { add(`Yes! ${cap(nd)} helps it grow!`); add(`Not ${nd} right now. Listen again!`); });
    D_.PLANT_WRONG.forEach(([, n]) => add(`A plant can't use ${n}.`));
    // Wizard's Lab
    add('Welcome to my lab! Does it sink, or does it float? Heavy things sink. Light things float.'); add('Welcome back to my lab! Does it sink, or does it float?'); add("Let's see!");
    D_.SINK_FLOAT.forEach(([, n, f]) => { add(`Here is ${art(n)} ${n}. Does it sink or float?`); add(`The ${n} ${f ? 'floats' : 'sinks'}! You were right!`); add(`The ${n} ${f ? 'floats' : 'sinks'}! Now you know!`); });
    // Royal Menagerie
    D_.ANIMALS.forEach((a) => {
      add(`Where does the ${a.name} live?`); add(`Yes! The ${a.name} lives ${D_.HOMES[a.home][1]}!`); Object.keys(D_.HOMES).forEach((h) => { if (h !== a.home) add(`The ${a.name} doesn't live ${D_.HOMES[h][1]}.`); });
      add(`What does the ${a.name} eat?`); add(`Yes! The ${a.name} eats ${a.foodName}!`); D_.ANIMALS.forEach((o) => { if (o.foodName !== a.foodName) add(`The ${a.name} doesn't eat ${o.foodName}.`); });
      if (a.sound) { add(`Which animal says ${a.sound}?`); add(`Yes! The ${a.name} says ${a.sound}!`); add(`The ${a.name} says ${a.sound}.`); }
      if (a.egg) add(`Yes! The ${a.name} hatches from an egg!`); else add(`The ${a.name} doesn't hatch from an egg.`);
      add(`Yes! The ${a.name} is ${D_.GROUPS[a.group]}!`); add(`The ${a.name} is ${D_.GROUPS[a.group]}.`);
    });
    add('Which animal hatches from an egg?');
    Object.keys(D_.GROUPS).forEach((gk) => add(`Which one is ${D_.GROUPS[gk].split(',')[0]}?`));
    D_.BABIES.forEach(([, parent, , baby]) => { add(`Which one is the baby ${parent}?`); add(`Yes! A baby ${parent} is called ${art(baby)} ${baby}!`); add(`That's ${art(baby)} ${baby}.`); });
    // Treasure Vault
    ['heavier', 'lighter', 'bigger', 'smaller'].forEach((c) => { add(`Which one is ${c}?`); D_.THINGS.forEach(([, n]) => { add(`Yes! The ${n} is ${c}!`); add(`The ${n} is ${c}.`); }); });
    ['biggest', 'heaviest'].forEach((c) => { add(`Which one is the ${c}?`); D_.THINGS.forEach(([, n]) => add(`Yes! The ${n} is the ${c}!`)); });
    add('Which pile has more coins?'); for (let a = 1; a <= D_.COIN_MAX; a++) for (let b = 1; b <= D_.COIN_MAX; b++) { if (a > b) { add(`Yes! ${a} coins is more than ${b}!`); add(`${b} is fewer than ${a}.`); } }
    return L;
  };
})();
