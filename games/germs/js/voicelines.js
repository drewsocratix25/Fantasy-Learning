// Every sentence Germ Patrol's narrator can say.
(function () {
  FL.Lines.all = function (name) {
    const D = FL.Data; const L = []; const add = (text, speak) => L.push(speak && speak !== text ? { text, speak } : { text });
    add('Welcome to Germ Patrol! Let\'s keep the germs away!'); if (name) add(`Welcome to Germ Patrol, Captain ${name}! Let's keep the germs away!`);
    D.HEROES.forEach((h) => add(`Hi! I'm ${h.name}!`));
    add('Tap a place to go there. Let\'s start at the Wash Station!');
    D.LOCS.forEach((l) => { add(`${l.name}! ${l.hint}`); add(`Let's go to the ${l.name}!`); });
    D.PRAISE.forEach((p) => [1, 2, 3].forEach((n) => { add(`${p}! You earned ${n} star${n > 1 ? 's' : ''}!`); if (name) add(`${p}, ${name}! You earned ${n} star${n > 1 ? 's' : ''}!`); }));
    D.SIDEKICKS.forEach(([, s]) => { add(`${s} will come with you!`); add(`A new sidekick! ${s} joins the patrol!`); });
    D.UNLOCKS.forEach((u) => add(u.line)); D.BADGES.forEach(([, b]) => add(`You earned the ${b} badge!`));
    add(FL.config.voiceTestLine); if (name) add(FL.config.voiceTestLineNamed(name));
    Object.values(D.FACTS).forEach((arr) => arr.forEach((f) => add(f))); Object.values(D.KINDS).forEach((k) => add(k.fact));
    add('Did you know?');
    // wash
    ['First, turn on the water. Tap the tap!', 'Now get some soap. Tap the soap!', 'Scrub scrub scrub! Rub the hands until the song ends!', 'Scrub the palms!', 'Now the backs of the hands!', 'Between the fingers!', 'Don\'t forget the thumbs!', 'Fingertips and nails!', 'Time to rinse! Tap the tap!', 'Dry your hands. Tap the towel!', 'Sparkle check! Let\'s look for leftover germs.', 'All clean! The germs went down the drain!', 'Almost! A few germs are hiding. Next time scrub a little longer.', 'Keep scrubbing!'].forEach((t) => add(t));
    // teeth
    ['Sugar bugs are hiding on the teeth! Grab the toothbrush and scrub!', 'Brush the top teeth!', 'Now the bottom teeth!', 'Brush the fronts!', 'Brush the backs!', 'Rinse and spit! Tap the cup!', 'Sparkly clean teeth!', 'A few sugar bugs are still hiding. Keep brushing!', 'Squeeze a pea of toothpaste. Tap the toothpaste!'].forEach((t) => add(t));
    // sneeze
    ['When a friend is about to sneeze, tap them fast so they catch it in their elbow!', 'Caught it in the elbow!', 'Oops! The sneeze got away. Germs can fly far!', 'Great catching! Now everybody wash your hands!', 'Here comes another one!', 'Achoo!'].forEach((t) => add(t));
    // lab
    add('Which one is a virus?'); add('Which one is bacteria?'); add('Which one is a fungus?'); add('Which germ is a helper?'); add('Which one is the smallest?'); add('Where do germs love to hide?'); add('Which one does NOT have germs on it?');
    D.GERMS.forEach((g) => { const k = D.KINDS[g.kind]; add(`Yes! ${g.name} is ${k.label}.`); add(`That's ${g.name}. ${g.name} is ${k.label}.`); });
    add('Yes! A virus is the smallest. Even smaller than bacteria!'); add('Yes! Germs love dirty hands, sneezes and food left out.'); add('Yes! Soap and clean towels help get rid of germs.');
    D.HIDE.forEach(([w, , bad]) => { add(bad ? `Yes! Germs hide on ${w}.` : `That's ${w}. That helps get rid of germs!`); });
    // body base
    ['Germs are sneaking in! Tap them and your body guards will catch them!', 'Rest helps your body fight! The germs slow down.', 'Water! Your guards feel great!', 'Healthy food! An extra guard joins the team!', 'A vaccine card! Now your guards know that germ and will catch it fast!', 'A fever! Your body turned up the heat to fight the germs.', 'You kept the body safe!', 'Some germs got through, but your guards caught most of them!'].forEach((t) => add(t));
    // kitchen
    D.KITCHEN.forEach(([item]) => add(`What should we do with ${item}?`)); Object.values(D.ACTIONS).forEach((a) => add(a[2]));
    add('Hmm, not that one. Try again!'); add('Before we eat, what do we do?'); add('Yes! Wash your hands before eating!');
    return L;
  };
})();
