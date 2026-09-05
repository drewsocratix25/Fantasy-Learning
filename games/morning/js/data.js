// Rise and Shine content: the girls, the six morning steps, and everything the games ask about.
(function () {
  const Data = {};
  Data.GIRLS = [
    { name: 'Lily', skin: '#fde0c8', hair: '#7c2d12', hairStyle: 'pigtails', pj: '#f9a8d4', pjDark: '#ec4899', top: '#f472b6', bottom: '#db2777' },
    { name: 'Maya', skin: '#8d5524', hair: '#1f1235', hairStyle: 'curls', pj: '#c4b5fd', pjDark: '#8b5cf6', top: '#a78bfa', bottom: '#7c3aed' },
    { name: 'Zoe', skin: '#f1c27d', hair: '#f59e0b', hairStyle: 'bob', pj: '#fde68a', pjDark: '#f59e0b', top: '#fde047', bottom: '#f59e0b' },
    { name: 'Nina', skin: '#c68642', hair: '#3b1f0e', hairStyle: 'braids', pj: '#99f6e4', pjDark: '#14b8a6', top: '#5eead4', bottom: '#0d9488' },
  ];
  Data.OUTFIT_SETS = { set1: [['#f472b6', '#db2777'], ['#a78bfa', '#7c3aed'], ['#fde047', '#f59e0b'], ['#5eead4', '#0d9488']], set2: [['#60a5fa', '#1d4ed8'], ['#fb923c', '#c2410c'], ['#4ade80', '#15803d'], ['#f87171', '#b91c1c']], set3: [['#f0abfc', '#c026d3'], ['#fef3c7', '#a16207'], ['#e0f2fe', '#0369a1'], ['#fecdd3', '#e11d48']] };
  Data.PRAISE = ['Wonderful', 'Amazing', 'Super', 'Fantastic', 'Way to go'];
  Data.NUMS = ['One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten'];
  Data.PET = 'Pip';
  // The morning routine, in order. Positions are fractions of the screen (the house map).
  Data.LOCS = [
    { id: 'wake', name: 'Wake Up', emoji: '⏰', x: 0.135, y: 0.44, scene: 'wake', hint: 'Rise and shine!' },
    { id: 'wash', name: 'Wash Up', emoji: '🪥', x: 0.345, y: 0.44, scene: 'wash', hint: 'Get squeaky clean!' },
    { id: 'dress', name: 'Get Dressed', emoji: '👗', x: 0.555, y: 0.44, scene: 'dress', hint: 'Pick clothes for the weather!' },
    { id: 'breakfast', name: 'Breakfast', emoji: '🥣', x: 0.19, y: 0.9, scene: 'breakfast', hint: 'Make a yummy breakfast!' },
    { id: 'pack', name: 'Backpack', emoji: '🎒', x: 0.5, y: 0.9, scene: 'pack', hint: 'Pack up and put on your shoes!' },
    { id: 'pet', name: 'Pet Chores', emoji: '🐶', x: 0.83, y: 0.74, scene: 'pet', hint: 'Take care of Pip!' },
  ];
  // Weather for the closet game. `wear` is right, `wrong` is silly for that weather.
  Data.WEATHER = [
    { id: 'sunny', name: 'sunny', line: 'It\'s sunny and hot!', wear: [['👒', 'a sun hat'], ['🩳', 'shorts'], ['👕', 'a t-shirt'], ['🩴', 'sandals'], ['🕶️', 'sunglasses']], wrong: [['🧣', 'a scarf'], ['🧤', 'mittens'], ['🥾', 'snow boots'], ['🧥', 'a big coat']] },
    { id: 'rainy', name: 'rainy', line: 'It\'s raining!', wear: [['🧥', 'a raincoat'], ['🥾', 'rain boots'], ['☂️', 'an umbrella']], wrong: [['🩴', 'sandals'], ['🕶️', 'sunglasses'], ['👙', 'a swimsuit'], ['👒', 'a sun hat']] },
    { id: 'snowy', name: 'snowy', line: 'It\'s snowing!', wear: [['🧣', 'a scarf'], ['🧤', 'mittens'], ['🧥', 'a warm coat'], ['🥾', 'snow boots']], wrong: [['🩴', 'sandals'], ['👒', 'a sun hat'], ['🩳', 'shorts'], ['👙', 'a swimsuit']] },
    { id: 'windy', name: 'windy', line: 'It\'s windy and cool!', wear: [['🧥', 'a jacket'], ['👖', 'long pants'], ['🧢', 'a cap']], wrong: [['👙', 'a swimsuit'], ['🩴', 'sandals'], ['🩳', 'shorts'], ['🕶️', 'sunglasses']] },
  ];
  // What goes on first? [first, second]
  Data.ORDER = [[['🧦', 'socks'], ['👟', 'shoes']], [['👕', 'a shirt'], ['🧥', 'a jacket']], [['👖', 'pants'], ['🥾', 'boots']], [['🩲', 'underwear'], ['👖', 'pants']]];
  Data.SOCK_COLORS = ['#f472b6', '#60a5fa', '#4ade80', '#fbbf24', '#c084fc']; Data.SOCK_PATTERNS = ['stripes', 'dots', 'stars', 'hearts'];
  // Breakfast: each food group, with the line for a right answer; treats and silly things are the wrong answers.
  Data.FOOD = {
    fruit: { ask: 'Breakfast needs a fruit! Tap the fruit!', items: [['🍌', 'a banana', 'Yes! A banana is a fruit!'], ['🍓', 'strawberries', 'Yes! Strawberries are fruit!'], ['🍎', 'an apple', 'Yes! An apple is a fruit!'], ['🫐', 'blueberries', 'Yes! Blueberries are fruit!'], ['🍊', 'an orange', 'Yes! An orange is a fruit!']] },
    grain: { ask: 'Breakfast needs a grain! Tap the grain!', items: [['🥣', 'cereal', 'Yes! Cereal is made from grains!'], ['🍞', 'toast', 'Yes! Toast is made from grains!'], ['🥞', 'pancakes', 'Yes! Pancakes are made from grains!'], ['🥯', 'a bagel', 'Yes! A bagel is made from grains!']] },
    drink: { ask: 'Breakfast needs a drink! Tap the drink!', items: [['🥛', 'milk', 'Yes! Milk makes your bones strong!'], ['🧃', 'juice', 'Yes! Juice is a drink!'], ['💧', 'water', 'Yes! Water is the best drink of all!']] },
    protein: { ask: 'Breakfast needs something to make you strong! Tap it!', items: [['🥚', 'eggs', 'Yes! Eggs help you grow strong!'], ['🧀', 'cheese', 'Yes! Cheese helps you grow strong!'], ['🥜', 'peanut butter', 'Yes! Peanut butter helps you grow strong!']] },
  };
  Data.TREATS = [['🍭', 'A lollipop'], ['🍪', 'A cookie'], ['🍩', 'A donut'], ['🍬', 'Candy'], ['🍫', 'Chocolate'], ['🧁', 'A cupcake']];
  Data.SILLY = [['🧦', 'a sock'], ['🧸', 'Teddy'], ['🖍️', 'a crayon'], ['🧽', 'a sponge']];
  // Backpack: things we need, and things that stay home.
  Data.PACK_NEED = [['🍱', 'Lunchbox'], ['🧃', 'Juice box'], ['📘', 'Book'], ['🖍️', 'Crayons'], ['📁', 'Folder'], ['🍎', 'Apple'], ['✏️', 'Pencil'], ['🧢', 'Cap']];
  Data.PACK_STAY = [['🧸', 'Teddy'], ['🦖', 'The dinosaur'], ['🍳', 'The frying pan'], ['🐱', 'Mittens the cat'], ['📺', 'The TV'], ['🪴', 'The plant']];
  // Rewards
  Data.FRIENDS = [['🧸', 'Teddy', 0], ['🐶', 'Pip', 5], ['🐱', 'Mittens', 12], ['🦄', 'Sparkle', 20], ['🐰', 'Hopper', 30], ['🐥', 'Peep', 42], ['🦋', 'Flutter', 55], ['🐢', 'Shelly', 70], ['🐨', 'Koko', 90], ['🐉', 'Ember', 115]];
  Data.CLIPS = [['bow', 'Pink Bow', '🎀', 0], ['star', 'Star Clip', '⭐', 16], ['flower', 'Flower Clip', '🌸', 48], ['crown', 'Rainbow Headband', '🌈', 80]];
  Data.UNLOCKS = [
    { stars: 8, type: 'outfit', id: 'set2', name: 'New outfit colours', emoji: '👚', line: 'You unlocked new outfit colours!' },
    { stars: 16, type: 'clip', id: 'star', name: 'Star Clip', emoji: '⭐', line: 'You unlocked a star hair clip!' },
    { stars: 25, type: 'outfit', id: 'set3', name: 'Sparkly outfit colours', emoji: '✨', line: 'You unlocked sparkly outfit colours!' },
    { stars: 35, type: 'decor', id: 'lights', name: 'Fairy Lights', emoji: '💡', line: 'Fairy lights now twinkle in your bedroom!' },
    { stars: 48, type: 'clip', id: 'flower', name: 'Flower Clip', emoji: '🌸', line: 'You unlocked a flower hair clip!' },
    { stars: 62, type: 'decor', id: 'fish', name: 'Fish Tank', emoji: '🐠', line: 'A fish tank now bubbles in the kitchen!' },
    { stars: 80, type: 'clip', id: 'crown', name: 'Rainbow Headband', emoji: '🌈', line: 'You unlocked a rainbow headband!' },
    { stars: 100, type: 'decor', id: 'treehouse', name: 'Treehouse', emoji: '🌳', line: 'A treehouse grew in the garden!' },
  ];
  Data.BADGES = [['wake', 'Early Bird', '🐦'], ['wash', 'Sparkle Star', '✨'], ['dress', 'Fashion Friend', '👗'], ['breakfast', 'Breakfast Chef', '🍳'], ['pet', 'Pet Pal', '🐶'], ['pack', 'Ready Rocket', '🚀']];
  Data.BADGE_PLAYS = 3;
  Data.FACTS = {
    wake: ['A good night\'s sleep helps your brain grow and remember things.', 'When the short hand points to the 7, it is seven o\'clock.', 'Morning sunlight tells your body it is time to wake up.', 'Making your bed is a great way to start the day.'],
    wash: ['Brush your teeth for two minutes, in the morning and at night.', 'Washing your face wakes up your skin.', 'Start brushing at the ends of your hair, so tangles come out gently.', 'Toothpaste with fluoride makes your teeth strong.'],
    dress: ['Socks go on before shoes, and shirts go on before coats.', 'In the rain, a raincoat and boots keep you dry.', 'In the snow, a coat, a scarf and mittens keep you warm.', 'On hot sunny days, a hat keeps the sun off your head.'],
    breakfast: ['Breakfast gives your body energy for the whole morning.', 'Fruit has vitamins that keep your body healthy.', 'Milk has calcium that makes your bones strong.', 'Whole grains like oats keep your tummy full for longer.'],
    pet: ['Pets need fresh water every single day.', 'Plants drink water through their roots.', 'Brushing a dog keeps its fur soft and clean.', 'Dogs wag their tails when they are happy.'],
    pack: ['Packing your bag the night before makes the morning easy.', 'Shoes have a left and a right. The curve goes on the inside.', 'A cap keeps the sun out of your eyes.', 'Saying goodbye with a hug makes everyone smile.'],
  };
  // Row, Row, Row Your Boat (public domain) for brushing teeth.
  Data.ROW = 'C4:1 C4:1 C4:0.75 D4:0.25 E4:1 E4:0.75 D4:0.25 E4:0.75 F4:0.25 G4:2 C5:0.33 C5:0.33 C5:0.34 G4:0.33 G4:0.33 G4:0.34 E4:0.33 E4:0.33 E4:0.34 C4:0.33 C4:0.33 C4:0.34 G4:0.75 F4:0.25 E4:0.75 D4:0.25 C4:2';
  window.FL = window.FL || {};
  FL.Data = Data;
})();
