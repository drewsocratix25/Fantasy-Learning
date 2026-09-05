// Castle Quest data (pure data, no DOM): used by the rooms and by the voice-line generator.
(function () {
  const Data = {};
  // Explorers. Field names match what the engine expects for a hero look:
  // dress = tunic colour, dressDark = cape colour, crown = hat band colour.
  Data.PRINCESSES = [
    { name: 'Pip', dress: '#60a5fa', dressDark: '#1d4ed8', hair: '#7c2d12', skin: '#fde0c8', crown: '#fde047' },
    { name: 'Wren', dress: '#4ade80', dressDark: '#15803d', hair: '#1f1235', skin: '#8d5524', crown: '#fb923c' },
    { name: 'Juno', dress: '#f472b6', dressDark: '#be185d', hair: '#f59e0b', skin: '#f1c27d', crown: '#a78bfa' },
    { name: 'Remy', dress: '#fbbf24', dressDark: '#b45309', hair: '#3b1f0e', skin: '#c68642', crown: '#22d3ee' },
  ];
  Data.DRESS_SETS = { set1: [['#60a5fa', '#1d4ed8'], ['#4ade80', '#15803d'], ['#f472b6', '#be185d'], ['#fbbf24', '#b45309']], set2: [['#a78bfa', '#6d28d9'], ['#f87171', '#b91c1c'], ['#2dd4bf', '#0f766e'], ['#e2e8f0', '#64748b']], set3: [['#f0abfc', '#c026d3'], ['#fde68a', '#ca8a04'], ['#93c5fd', '#1e40af'], ['#fdba74', '#c2410c']] };
  // Rooms of the castle. Positions are on the castle cutaway (see castle.js); scene = the game scene id.
  Data.ROOMS = [
    { id: 'tower', name: 'Sky Tower', emoji: '🔭', scene: 'tower', hint: 'Look at the sky!', music: 'peaks', color: '#93c5fd' },
    { id: 'greenhouse', name: 'Royal Greenhouse', emoji: '🌱', scene: 'greenhouse', hint: 'Help the plants grow!', music: 'garden', color: '#86efac' },
    { id: 'lab', name: "Wizard's Lab", emoji: '🧪', scene: 'lab', hint: 'Sink or float?', music: 'cave', color: '#c4b5fd' },
    { id: 'menagerie', name: 'Royal Menagerie', emoji: '🐾', scene: 'menagerie', hint: 'Meet the animals!', music: 'pond', color: '#fdba74' },
    { id: 'vault', name: 'Treasure Vault', emoji: '⚖️', scene: 'vault', hint: 'Heavy or light?', music: 'kingdom', color: '#fde68a' },
  ];
  // Companions: [emoji, name, stars needed]
  Data.FRIENDS = [['🐭', 'Mouse', 0], ['🦉', 'Owl', 4], ['🐈', 'Cat', 9], ['🐸', 'Frog', 15], ['🐦‍⬛', 'Raven', 22], ['🦇', 'Bat', 32], ['🐉', 'Baby Dragon', 45], ['🦄', 'Unicorn', 60]];
  // Treasures that appear in the castle: {stars, id, name, emoji, line}
  Data.TREASURES = [
    { stars: 2, id: 'key', name: 'Golden Key', emoji: '🗝️', line: 'You found a golden key!' },
    { stars: 6, id: 'spyglass', name: 'Spyglass', emoji: '🔭', line: 'You found a spyglass!' },
    { stars: 12, id: 'crown', name: 'Jewelled Crown', emoji: '👑', line: 'You found a jewelled crown!' },
    { stars: 18, id: 'lantern', name: 'Magic Lantern', emoji: '🏮', line: 'You found a magic lantern!' },
    { stars: 26, id: 'egg', name: 'Dragon Egg', emoji: '🥚', line: 'You found a dragon egg! Keep it warm!' },
    { stars: 38, id: 'sword', name: 'Sword in the Stone', emoji: '🗡️', line: 'You found the sword in the stone!' },
    { stars: 52, id: 'carpet', name: 'Flying Carpet', emoji: '🧞', line: 'You found a flying carpet!' },
    { stars: 70, id: 'ball', name: 'Crystal Ball', emoji: '🔮', line: 'You found a crystal ball!' },
    { stars: 90, id: 'chest', name: 'Treasure Chest', emoji: '🧰', line: 'You opened the great treasure chest!' },
  ];
  Data.PRAISE = ['Wonderful', 'Amazing', 'Brilliant', 'Fantastic', 'Bravo'];

  // ---- Sky Tower ----
  Data.WEATHER = [
    { id: 'sunny', name: 'sunny', emoji: '☀️', wear: ['🕶️', 'sunglasses'], line: 'It is sunny!' },
    { id: 'rain', name: 'rainy', emoji: '🌧️', wear: ['☂️', 'an umbrella'], line: 'It is raining!' },
    { id: 'snow', name: 'snowy', emoji: '❄️', wear: ['🧤', 'warm mittens'], line: 'It is snowing!' },
    { id: 'wind', name: 'windy', emoji: '🌬️', wear: ['🧣', 'a scarf'], line: 'It is windy!' },
  ];
  Data.WEAR_WRONG = [['🩴', 'flip-flops'], ['🎩', 'a top hat'], ['🩱', 'a swimsuit'], ['🧦', 'socks']];
  Data.SKY_THINGS = [['☀️', 'sun'], ['🌙', 'moon'], ['⭐', 'star'], ['☁️', 'cloud'], ['🌈', 'rainbow']];
  Data.SEASONS = [
    { id: 'spring', name: 'spring', emoji: '🌷', fact: 'flowers start to bloom' },
    { id: 'summer', name: 'summer', emoji: '🏖️', fact: 'it is hot and sunny' },
    { id: 'autumn', name: 'autumn', emoji: '🍂', fact: 'the leaves fall down' },
    { id: 'winter', name: 'winter', emoji: '⛄', fact: 'it snows' },
  ];

  // ---- Royal Greenhouse ----
  Data.PLANTS = [['🍎', 'an apple tree'], ['🌻', 'a sunflower'], ['🍓', 'a strawberry plant'], ['🍅', 'a tomato plant'], ['🌷', 'a tulip']];
  Data.PLANT_NEEDS = [['💧', 'water'], ['☀️', 'sunshine']];
  Data.PLANT_WRONG = [['🍭', 'a lollipop'], ['⚽', 'a ball'], ['🧦', 'a sock'], ['🍕', 'pizza'], ['🎩', 'a hat'], ['🧸', 'a teddy bear']];

  // ---- Wizard's Lab: [emoji, name, floats]
  Data.SINK_FLOAT = [
    ['🍎', 'apple', true], ['🪨', 'rock', false], ['🦆', 'rubber duck', true], ['🔑', 'key', false], ['⚽', 'ball', true], ['🥄', 'spoon', false],
    ['🪵', 'log', true], ['🧱', 'brick', false], ['🍋', 'lemon', true], ['🥥', 'coconut', true], ['🪙', 'coin', false], ['🍇', 'grape', false],
    ['🧊', 'ice cube', true], ['🛶', 'boat', true], ['⚓', 'anchor', false], ['🥕', 'carrot', false], ['🍌', 'banana', true], ['🪶', 'feather', true],
    ['🎾', 'tennis ball', true], ['🥔', 'potato', false], ['🥚', 'egg', false], ['🔔', 'bell', false], ['🧽', 'sponge', true], ['🍩', 'donut', true],
  ];

  // ---- Royal Menagerie ----
  Data.ANIMALS = [
    { e: '🐟', name: 'fish', home: 'water', food: '🪱', foodName: 'worms', sound: null, egg: true, group: 'fish' },
    { e: '🐦', name: 'bird', home: 'tree', food: '🪱', foodName: 'worms', sound: 'tweet', egg: true, group: 'bird' },
    { e: '🐰', name: 'rabbit', home: 'burrow', food: '🥕', foodName: 'carrots', sound: null, egg: false, group: 'mammal' },
    { e: '🐄', name: 'cow', home: 'barn', food: '🌾', foodName: 'grass', sound: 'moo', egg: false, group: 'mammal' },
    { e: '🐸', name: 'frog', home: 'water', food: '🪰', foodName: 'flies', sound: 'ribbit', egg: true, group: 'amphibian' },
    { e: '🐔', name: 'hen', home: 'barn', food: '🌽', foodName: 'corn', sound: 'cluck', egg: true, group: 'bird' },
    { e: '🐻', name: 'bear', home: 'cave', food: '🍯', foodName: 'honey', sound: 'growl', egg: false, group: 'mammal' },
    { e: '🐝', name: 'bee', home: 'hive', food: '🌸', foodName: 'flowers', sound: 'buzz', egg: true, group: 'insect' },
    { e: '🐶', name: 'dog', home: 'kennel', food: '🦴', foodName: 'bones', sound: 'woof', egg: false, group: 'mammal' },
    { e: '🐢', name: 'turtle', home: 'water', food: '🥬', foodName: 'lettuce', sound: null, egg: true, group: 'reptile' },
    { e: '🐑', name: 'sheep', home: 'barn', food: '🌾', foodName: 'grass', sound: 'baa', egg: false, group: 'mammal' },
    { e: '🦉', name: 'owl', home: 'tree', food: '🐭', foodName: 'mice', sound: 'hoot', egg: true, group: 'bird' },
    { e: '🐱', name: 'cat', home: 'house', food: '🐟', foodName: 'fish', sound: 'meow', egg: false, group: 'mammal' },
    { e: '🐴', name: 'horse', home: 'barn', food: '🍎', foodName: 'apples', sound: 'neigh', egg: false, group: 'mammal' },
  ];
  Data.HOMES = { water: ['🌊', 'in the water'], tree: ['🌳', 'in a tree'], burrow: ['🕳️', 'in a burrow'], barn: ['🏚️', 'in the barn'], cave: ['🏔️', 'in a cave'], hive: ['🍯', 'in a hive'], kennel: ['🏠', 'in a kennel'], house: ['🏠', 'in the house'] };
  Data.GROUPS = { bird: 'a bird, with feathers and wings', fish: 'a fish, with fins', mammal: 'a mammal, with fur', amphibian: 'a frog, an amphibian', insect: 'an insect, with six legs', reptile: 'a reptile, with a shell' };
  Data.BABIES = [['🐔', 'hen', '🐥', 'chick'], ['🦋', 'butterfly', '🐛', 'caterpillar'], ['🐸', 'frog', '🪱', 'tadpole'], ['🐑', 'sheep', '🐑', 'lamb'], ['🐶', 'dog', '🐕', 'puppy'], ['🐈', 'cat', '🐱', 'kitten']];

  // ---- Treasure Vault: pairs for heavy/light and big/small: [emoji, name, weight 1..5, size 1..5]
  Data.THINGS = [
    ['🪶', 'feather', 1, 1], ['🎈', 'balloon', 1, 2], ['🍓', 'strawberry', 1, 1], ['🧸', 'teddy bear', 2, 2], ['📚', 'books', 3, 2], ['🪨', 'rock', 4, 2],
    ['🐘', 'elephant', 5, 5], ['🐭', 'mouse', 1, 1], ['🚗', 'car', 5, 4], ['🚲', 'bicycle', 3, 3], ['🏰', 'castle', 5, 5], ['🐜', 'ant', 1, 1],
    ['🍉', 'watermelon', 3, 2], ['🍇', 'grape', 1, 1], ['🐋', 'whale', 5, 5], ['🐟', 'little fish', 1, 1], ['🌳', 'tree', 5, 5], ['🌷', 'flower', 1, 1],
    ['🪑', 'chair', 3, 3], ['🥄', 'spoon', 1, 1], ['🐻', 'bear', 4, 4], ['🐿️', 'squirrel', 1, 1], ['🚌', 'bus', 5, 5], ['🍪', 'cookie', 1, 1],
  ];
  Data.COIN_MAX = 6;

  window.FL = window.FL || {};
  FL.Data = Data;
})();
