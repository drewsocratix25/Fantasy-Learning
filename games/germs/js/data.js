// Germ Patrol content. Everything here is meant to be scientifically accurate but cartoon-friendly.
(function () {
  const Data = {};
  Data.HEROES = [
    { name: 'Max', skin: '#fde0c8', hair: '#7c2d12', hairStyle: 'spiky', cape: '#ef4444', capeDark: '#b91c1c', shirt: '#3b82f6' },
    { name: 'Zara', skin: '#8d5524', hair: '#1f1235', hairStyle: 'puffs', cape: '#a855f7', capeDark: '#7e22ce', shirt: '#facc15' },
    { name: 'Leo', skin: '#f1c27d', hair: '#f59e0b', hairStyle: 'swoop', cape: '#22c55e', capeDark: '#15803d', shirt: '#f97316' },
    { name: 'Mia', skin: '#c68642', hair: '#3b1f0e', hairStyle: 'ponytail', cape: '#ec4899', capeDark: '#be185d', shirt: '#14b8a6' },
  ];
  Data.CAPE_SETS = { set1: [['#ef4444', '#b91c1c'], ['#a855f7', '#7e22ce'], ['#22c55e', '#15803d'], ['#ec4899', '#be185d']], set2: [['#3b82f6', '#1d4ed8'], ['#f97316', '#c2410c'], ['#14b8a6', '#0f766e'], ['#fde047', '#ca8a04']], set3: [['#f0abfc', '#c026d3'], ['#e2e8f0', '#64748b'], ['#0f172a', '#334155'], ['#fb7185', '#e11d48']] };
  Data.PRAISE = ['Wonderful', 'Amazing', 'Super', 'Fantastic', 'Way to go'];
  // Town map places (positions are fractions of the screen).
  Data.LOCS = [
    { id: 'wash', name: 'Wash Station', emoji: '🧼', x: 0.18, y: 0.5, scene: 'wash', hint: 'Wash the germs away!' },
    { id: 'teeth', name: 'Toothbrush Time', emoji: '🪥', x: 0.40, y: 0.42, scene: 'teeth', hint: 'Brush away the sugar bugs!' },
    { id: 'kitchen', name: 'Kitchen Clean-Up', emoji: '🍎', x: 0.62, y: 0.5, scene: 'kitchen', hint: 'Keep the food safe!' },
    { id: 'lab', name: 'Microscope Lab', emoji: '🔬', x: 0.84, y: 0.46, scene: 'lab', hint: 'Look at germs up close!' },
    { id: 'sneeze', name: 'Sneeze Catcher', emoji: '🤧', x: 0.24, y: 0.82, scene: 'sneeze', hint: 'Catch the sneezes!' },
    { id: 'defend', name: 'Body Base', emoji: '🛡️', x: 0.66, y: 0.82, scene: 'defend', hint: 'Help your body guards!' },
  ];
  // Cartoon germs. Shapes match real germ types: round/rod bacteria, tiny spiky viruses, fuzzy branching fungi.
  Data.GERMS = [
    { id: 'sniffle', name: 'Sniffle', kind: 'virus', color: '#a78bfa', shape: 'spiky', size: 0.6 },
    { id: 'dotty', name: 'Dotty', kind: 'bacteria', color: '#fb923c', shape: 'round', size: 1 },
    { id: 'bumpy', name: 'Bumpy', kind: 'bacteria', color: '#4ade80', shape: 'rod', size: 1 },
    { id: 'fuzz', name: 'Fuzz', kind: 'fungus', color: '#94a3b8', shape: 'fuzzy', size: 1.4 },
    { id: 'lacto', name: 'Lacto', kind: 'helper', color: '#f9a8d4', shape: 'round', size: 1, good: true },
  ];
  Data.KINDS = {
    virus: { label: 'a virus', fact: 'Viruses are the tiniest germs. They can only grow inside your body\'s cells.' },
    bacteria: { label: 'bacteria', fact: 'Bacteria are tiny living things. Some make you sick, and some are helpers.' },
    fungus: { label: 'a fungus', fact: 'Fungi are germs like the fuzzy mold on old bread.' },
    helper: { label: 'a helper germ', fact: 'Helper bacteria live in yogurt and in your tummy, and they help you digest food.' },
  };
  Data.FACTS = {
    wash: ['Soap grabs the germs and water washes them down the drain.', 'Twenty seconds of scrubbing is the magic number. That is Happy Birthday twice!', 'Germs love to hide between fingers and under nails.', 'Wash your hands before eating and after using the bathroom.'],
    teeth: ['Sugar bugs are bacteria that eat sugar and make acid that hurts your teeth.', 'Brush in the morning and at night, for two whole minutes.', 'Brush the fronts, the backs, and the tops of your teeth.', 'A little toothpaste is enough. About the size of a pea!'],
    sneeze: ['A sneeze can send germs six feet away. That is as far as a tall grown-up lying down!', 'Sneeze or cough into your elbow, not your hands.', 'If you use a tissue, throw it away and wash your hands.', 'When you are sick, stay home and rest so your friends stay well.'],
    lab: ['Germs are so tiny that you need a microscope to see them.', 'Most germs are harmless, and some even help us.', 'Viruses are much smaller than bacteria.', 'Germs travel on hands, in sneezes, and on food.'],
    defend: ['White blood cells are your body\'s guards. They catch germs.', 'A fever means your body is turning up the heat to fight germs.', 'Vaccines show your guards a picture of a germ, so they know it next time.', 'Sleep, water and healthy food help your guards stay strong.'],
    kitchen: ['Wash fruits and vegetables before you eat them.', 'Cooking makes food hot enough to kill germs.', 'Cold keeps germs from growing, so leftovers go in the fridge.', 'Food that fell on the floor has germs on it, even after one second.'],
  };
  Data.KITCHEN = [['strawberries', '🍓', 'wash'], ['chicken', '🍗', 'cook'], ['milk', '🥛', 'fridge'], ['carrots', '🥕', 'wash'], ['bacon', '🥓', 'cook'], ['ice cream', '🍦', 'fridge'], ['an apple', '🍎', 'wash'], ['leftover pasta', '🍝', 'fridge'], ['fish', '🐟', 'cook'], ['grapes', '🍇', 'wash'], ['a sandwich that sat out all day', '🥪', 'trash'], ['a cookie that fell on the floor', '🍪', 'trash'], ['yogurt', '🥣', 'fridge'], ['broccoli', '🥦', 'wash'], ['cheese', '🧀', 'fridge'], ['a burger', '🍔', 'cook']];
  Data.ACTIONS = { wash: ['Wash it', '🚿', 'Yes! Wash it first to rinse the germs off!'], cook: ['Cook it', '🔥', 'Yes! Cooking makes food hot enough to kill germs!'], fridge: ['Keep it cold', '❄️', 'Yes! Cold keeps germs from growing!'], trash: ['Throw it away', '🗑️', 'Yes! Food that sat out or fell on the floor goes in the trash!'] };
  Data.HIDE = [['dirty hands', '🖐️', true], ['a sneeze', '🤧', true], ['food left out', '🥪', true], ['a doorknob', '🚪', true], ['a runny nose', '👃', true], ['soap', '🧼', false], ['a clean towel', '🧻', false], ['a bar of soap', '🧼', false]];
  Data.SIDEKICKS = [['🫧', 'Bubbles', 0], ['🦆', 'Ducky', 5], ['🧽', 'Sponge', 12], ['🦠', 'Lacto', 20], ['🐶', 'Pup', 30], ['🪥', 'Brushy', 42], ['🩺', 'Doc', 55], ['🛡️', 'Guardy', 70], ['🐱', 'Whiskers', 90], ['🤖', 'Scrub-Bot', 115]];
  Data.UNLOCKS = [
    { stars: 8, type: 'cape', id: 'set2', name: 'New cape colours', emoji: '🦸', line: 'You unlocked new cape colours!' },
    { stars: 16, type: 'goggles', id: 'star', name: 'Star Goggles', emoji: '🥽', line: 'You unlocked star goggles!' },
    { stars: 25, type: 'cape', id: 'set3', name: 'Shiny cape colours', emoji: '✨', line: 'You unlocked shiny cape colours!' },
    { stars: 35, type: 'decor', id: 'flag', name: 'Patrol Flag', emoji: '🚩', line: 'A Germ Patrol flag now flies over town!' },
    { stars: 48, type: 'goggles', id: 'rainbow', name: 'Rainbow Goggles', emoji: '🌈', line: 'You unlocked rainbow goggles!' },
    { stars: 62, type: 'decor', id: 'statue', name: 'Hero Statue', emoji: '🗽', line: 'The town built a statue of you!' },
    { stars: 80, type: 'decor', id: 'fireworks', name: 'Fireworks', emoji: '🎆', line: 'Fireworks over Germ Patrol town!' },
  ];
  Data.BADGES = [['wash', 'Handwashing Hero', '🧼'], ['teeth', 'Tooth Titan', '🦷'], ['sneeze', 'Sneeze Catcher', '🤧'], ['lab', 'Lab Scientist', '🔬'], ['defend', 'Body Guard', '🛡️'], ['kitchen', 'Kitchen Captain', '🍎']];
  Data.BADGE_PLAYS = 3;
  // Happy Birthday for the 20-second wash (public domain).
  Data.BIRTHDAY = 'G4:0.75 G4:0.25 A4:1 G4:1 C5:1 B4:2 G4:0.75 G4:0.25 A4:1 G4:1 D5:1 C5:2 G4:0.75 G4:0.25 G5:1 E5:1 C5:1 B4:1 A4:2 F5:0.75 F5:0.25 E5:1 C5:1 D5:1 C5:2';
  window.FL = window.FL || {};
  FL.Data = Data;
})();
