// Pure curriculum and progress logic. No network, DOM, or child identifiers.
export const STORAGE_KEY = "littleWonders.world.v1";
export const ACTIVITIES = [
  {
    id: "count",
    name: "Garden party",
    skill: "Count & collect",
    icon: "✿",
    image: "garden",
    color: "garden",
    friend: "Pip",
    description: "Help Pip gather a picnic.",
    sticker: "🥕",
    discovery: "Picnic helper",
    offline:
      "Find three things for a pretend picnic. Count each one as you put it down.",
  },
  {
    id: "letters",
    name: "Letter hideaway",
    skill: "Letters & words",
    icon: "Aa",
    image: "garden",
    color: "letters",
    friend: "Pip",
    description: "Find the letters hiding here.",
    sticker: "🦊",
    discovery: "Letter explorer",
    offline:
      "Look for the first letter of your name on a book or a food packet.",
  },
  {
    id: "shapes",
    name: "Shape studio",
    skill: "Shapes & colours",
    icon: "◇",
    image: "discovery",
    color: "shapes",
    friend: "Clover",
    description: "Find a shape for Clover.",
    sticker: "💎",
    discovery: "Shape spotter",
    offline: "Can you find a circle and a rectangle somewhere in your room?",
  },
  {
    id: "patterns",
    name: "Rainbow trail",
    skill: "Patterns & thinking",
    icon: "▰",
    image: "garden",
    color: "patterns",
    friend: "Pip",
    description: "Make a path, one pattern at a time.",
    sticker: "🌈",
    discovery: "Pattern maker",
    offline: "Make a clap–tap pattern with someone. What comes next?",
  },
  {
    id: "music",
    name: "Melody meadow",
    skill: "Listen & make music",
    icon: "♫",
    image: "music",
    color: "music",
    friend: "Blue",
    description: "Listen, echo, and make your own tune.",
    sticker: "🐦",
    discovery: "Music maker",
    offline: "Hum a tiny tune for someone. Can they hum it back to you?",
  },
  {
    id: "science",
    name: "Wonder lab",
    skill: "Predict & discover",
    icon: "☼",
    image: "discovery",
    color: "science",
    friend: "Clover",
    description: "What will float? Let’s find out.",
    sticker: "🔍",
    discovery: "Wonder finder",
    offline:
      "With a grown-up, try a cork and a metal spoon in a bowl of water. What do you notice?",
  },
];
export const SHAPES = ["circle", "triangle", "square", "star"];
export const COLORS = [
  { name: "blue", hex: "#2877b4" },
  { name: "orange", hex: "#dc702d" },
  { name: "purple", hex: "#8555ab" },
];
export const WORDS = [
  ["A", "apple", "🍎"],
  ["B", "bee", "🐝"],
  ["C", "cat", "🐈"],
  ["D", "dog", "🐕"],
  ["F", "fish", "🐟"],
  ["M", "moon", "🌙"],
  ["S", "sun", "☀️"],
  ["T", "turtle", "🐢"],
  ["P", "pig", "🐖"],
  ["R", "rabbit", "🐇"],
  ["L", "leaf", "🍃"],
  ["H", "hat", "🎩"],
  ["E", "egg", "🥚"],
  ["G", "goat", "🐐"],
  ["I", "ice", "🧊"],
  ["J", "juice", "🧃"],
  ["K", "kite", "🪁"],
  ["N", "nest", "🪺"],
  ["O", "owl", "🦉"],
  ["Q", "queen", "👸"],
  ["U", "umbrella", "☂️"],
  ["V", "violin", "🎻"],
  ["W", "whale", "🐋"],
  ["X", "x-ray", "🩻"],
  ["Y", "yarn", "🧶"],
  ["Z", "zebra", "🦓"],
];
export const EXPERIMENTS = [
  {
    name: "a cork",
    icon: "🟤",
    label: "Cork",
    floats: true,
    fact: "The cork floats. Cork is light for its size, so the water holds it up.",
  },
  {
    name: "a metal spoon",
    icon: "🥄",
    label: "Metal spoon",
    floats: false,
    fact: "The metal spoon sinks. This solid metal spoon is heavy for its size.",
  },
  {
    name: "a wooden block",
    icon: "🪵",
    label: "Wooden block",
    floats: true,
    fact: "This wooden block floats. This kind of wood is light for its size.",
  },
  {
    name: "a stone",
    icon: "🪨",
    label: "Stone",
    floats: false,
    fact: "This stone sinks. Most ordinary stones are heavy for their size. Some special rocks can float!",
  },
  {
    name: "an empty plastic bottle with its cap on",
    icon: "🧴",
    label: "Empty, closed bottle",
    floats: true,
    fact: "The closed, empty bottle floats. The air inside helps keep it light for its size.",
  },
];
export const NOTES = [
  { name: "Do", hz: 261.63, shape: "circle", color: "#d87938" },
  { name: "Re", hz: 293.66, shape: "triangle", color: "#368b87" },
  { name: "Mi", hz: 329.63, shape: "square", color: "#6379ba" },
  { name: "Sol", hz: 392, shape: "star", color: "#aa6599" },
];
export function shuffle(items, rng = Math.random) {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}
export function defaults() {
  return {
    sound: true,
    speech: true,
    motion: true,
    pace: "adaptive",
    completed: {},
    skill: {},
    last: null,
  };
}
export function sanitize(raw) {
  const out = defaults();
  if (!raw || typeof raw !== "object") return out;
  for (const key of ["sound", "speech", "motion"])
    if (typeof raw[key] === "boolean") out[key] = raw[key];
  if (["adaptive", "gentle", "stretch"].includes(raw.pace)) out.pace = raw.pace;
  for (const a of ACTIVITIES) {
    if (Number.isInteger(raw.completed?.[a.id]))
      out.completed[a.id] = Math.max(0, Math.min(10000, raw.completed[a.id]));
    if (Number.isInteger(raw.skill?.[a.id]))
      out.skill[a.id] = Math.max(1, Math.min(3, raw.skill[a.id]));
  }
  if (ACTIVITIES.some((a) => a.id === raw.last)) out.last = raw.last;
  return out;
}
export function levelFor(state, id) {
  return state.pace === "gentle"
    ? 1
    : state.pace === "stretch"
      ? 3
      : state.skill[id] || 1;
}
export function finishSession(state, id, hints) {
  const next = sanitize(state);
  if (!ACTIVITIES.some((a) => a.id === id)) return next;
  next.completed[id] = (next.completed[id] || 0) + 1;
  next.last = id;
  const level = next.skill[id] || 1;
  if (hints === 0 && next.completed[id] % 2 === 0)
    next.skill[id] = Math.min(3, level + 1);
  else if (hints >= 3) next.skill[id] = Math.max(1, level - 1);
  return next;
}
export function newRound(id, level, round, rng = Math.random) {
  level = Math.max(1, Math.min(3, level));
  const choose = (items) => items[Math.floor(rng() * items.length)];
  if (id === "count") {
    const max = [3, 5, 10][level - 1];
    const target = level === 3 ? 6 + (round % 5) : 1 + (round % max);
    return {
      target,
      total: Math.min(12, target + (level === 1 ? 2 : 3)),
      choices: shuffle(
        Array.from({ length: max }, (_, i) => i + 1).filter(
          (n) => n !== target,
        ),
        rng,
      )
        .slice(0, level === 1 ? 1 : 2)
        .concat(target)
        .sort((a, b) => a - b),
    };
  }
  if (id === "letters") {
    const word =
      WORDS[(round + Math.floor(rng() * WORDS.length)) % WORDS.length];
    return {
      word,
      lower: level === 2,
      wordMode: level === 3,
      choices: shuffle(
        [
          word[0],
          ...shuffle(
            WORDS.filter((w) => w[0] !== word[0]),
            rng,
          )
            .slice(0, level === 1 ? 1 : 2)
            .map((w) => w[0]),
        ],
        rng,
      ),
    };
  }
  if (id === "shapes") {
    const shape = choose(SHAPES),
      color = choose(COLORS);
    const choices = shuffle(
      SHAPES.filter((s) => s !== shape),
      rng,
    )
      .slice(0, level === 1 ? 1 : 2)
      .map((s) => ({ shape: s, color }));
    choices.push({ shape, color });
    if (level === 3)
      choices.push({
        shape,
        color: choose(COLORS.filter((c) => c.name !== color.name)),
      });
    return { shape, color, choices: shuffle(choices, rng) };
  }
  if (id === "patterns") {
    const shapes = shuffle(SHAPES, rng);
    const unit =
      level === 1
        ? shapes.slice(0, 2)
        : level === 2
          ? [shapes[0], shapes[0], shapes[1]]
          : shapes.slice(0, 3);
    const sequence = Array.from(
      { length: level === 1 ? 5 : 6 },
      (_, i) => unit[i % unit.length],
    );
    return {
      sequence,
      target: unit[sequence.length % unit.length],
      choices: shuffle([...new Set(unit)], rng),
    };
  }
  if (id === "music")
    return {
      sequence: Array.from(
        { length: Math.min(5, level + 1 + (round > 2 ? 1 : 0)) },
        () => Math.floor(rng() * 4),
      ),
    };
  if (id === "science") return { ...EXPERIMENTS[round % EXPERIMENTS.length] };
  throw new Error(`Unknown activity: ${id}`);
}
