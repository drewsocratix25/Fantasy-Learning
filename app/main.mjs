import {
  ACTIVITIES,
  NOTES,
  STORAGE_KEY,
  defaults,
  sanitize,
  levelFor,
  finishSession,
  newRound,
} from "./core.mjs";
import { Sound } from "./audio.mjs";

const $ = (selector, parent = document) => parent.querySelector(selector);
const $$ = (selector, parent = document) => [
  ...parent.querySelectorAll(selector),
];
const main = $("#main"),
  dialog = $("#dialog");
let state = defaults(),
  storageAvailable = true;
try {
  state = sanitize(JSON.parse(localStorage.getItem(STORAGE_KEY)));
} catch {
  storageAvailable = false;
}
const sound = new Sound(() => state);
let session = null,
  prompt = "",
  timers = new Set(),
  lastFocus = null,
  pausedMusic = false;
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
const activity = (id) => ACTIVITIES.find((a) => a.id === id);
function save() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    storageAvailable = true;
  } catch {
    storageAvailable = false;
  }
  refreshChrome();
}
function schedule(task) {
  task.due = Date.now() + task.remaining;
  task.id = setTimeout(() => {
    timers.delete(task);
    task.fn();
  }, task.remaining);
}
function later(fn, delay) {
  const task = { fn, remaining: delay, due: 0, id: null };
  timers.add(task);
  if (!dialog.open) schedule(task);
  return task;
}
function clearTimers() {
  timers.forEach((task) => clearTimeout(task.id));
  timers.clear();
}
function suspendTimers() {
  timers.forEach((task) => {
    if (task.id !== null) {
      clearTimeout(task.id);
      task.remaining = Math.max(0, task.due - Date.now());
      task.id = null;
    }
  });
}
function resumeTimers() {
  timers.forEach((task) => {
    if (task.id === null) schedule(task);
  });
}
function announce(text, speak = true) {
  $("#announce").textContent = text;
  if (speak) sound.say(text);
}
function focusHeading() {
  $("h1", main)?.focus({ preventScroll: true });
}
function shape(name, color = "#2877b4", extra = "") {
  return `<span class="shape ${name} ${extra}" style="--shape-color:${color}" aria-hidden="true"></span>`;
}
function refreshChrome() {
  $("#sound").setAttribute("aria-pressed", String(state.sound));
  $("#sound").setAttribute(
    "aria-label",
    state.sound ? "Turn sound off" : "Turn sound on",
  );
  $("#sound .tool-label").textContent = state.sound ? "Sound on" : "Sound off";
  $("#sound > span").textContent = state.sound ? "♫" : "♪";
  $("#discovery-count").textContent = ACTIVITIES.filter(
    (a) => state.completed[a.id],
  ).length;
  document.documentElement.classList.toggle(
    "calm",
    !state.motion || reducedMotion.matches,
  );
}
function navigate(hash = "") {
  if (location.hash === hash || (!hash && !location.hash)) route();
  else location.hash = hash;
}
function home() {
  document.title = "Little Wonders · A world to discover";
  document.body.className = "at-home";
  session = null;
  const groups = [
    {
      name: "Pip’s garden",
      image: "garden",
      ids: ["count", "letters"],
      kicker: "A little curiosity",
      color: "garden",
      position: "42% 58%",
    },
    {
      name: "Melody meadow",
      image: "music",
      ids: ["music", "patterns"],
      kicker: "A little imagination",
      color: "music",
      position: "35% 55%",
    },
    {
      name: "Clover’s workshop",
      image: "discovery",
      ids: ["shapes", "science"],
      kicker: "A little wonder",
      color: "science",
      position: "37% 64%",
    },
  ];
  main.innerHTML = `<section class="welcome"><div><p class="eyebrow">COME ON IN, LITTLE EXPLORER</p><h1 tabindex="-1">What will you<br><em>discover</em> today?</h1></div><button class="welcome-voice" id="welcome-voice"><span class="voice-symbol" aria-hidden="true">♫</span><span>Pick a place.<br><strong>Let’s play!</strong></span><span aria-hidden="true">▷</span></button></section>
  <section class="worlds" aria-label="Choose an activity">${groups
    .map(
      (g) =>
        `<article class="world-card ${g.color}"><div class="world-picture"><img src="assets/${g.image}-small.webp" srcset="assets/${g.image}-small.webp 768w, assets/${g.image}.webp 1536w" sizes="(max-width: 680px) 92vw, (max-width: 1000px) 46vw, 31vw" alt="${g.image === "garden" ? "Pip the fox and a frog in their sunny garden" : g.image === "music" ? "Blue the bird beside colourful wooden instruments" : "Clover the rabbit at a glowing outdoor workshop"}" style="object-position:${g.position}" width="768" height="512"><span class="world-label">${g.kicker}</span></div><div class="world-body"><h2>${g.name}</h2><div class="world-activities">${g.ids
          .map((id) => {
            const a = activity(id);
            return `<a href="#play/${id}" class="activity-link"><span class="activity-icon ${a.color}" aria-hidden="true">${a.icon}</span><span><strong>${a.name}</strong><small>${a.skill}</small></span><span class="play-disc" aria-hidden="true">▶</span></a>`;
          })
          .join("")}</div></div></article>`,
    )
    .join("")}</section>
  <section class="home-bottom"><div class="little-note"><span aria-hidden="true">✳</span><p>Big discoveries. Little steps.<small>Always time to try, wonder, and try again.</small></p></div><button class="passport-link" id="passport-link"><span aria-hidden="true">✷</span> My discoveries <span>${ACTIVITIES.filter((a) => state.completed[a.id]).length} / 6</span></button></section>
  <footer class="home-footer"><span>Made by a dad & his daughter</span><span>Ages 3–6 <span aria-hidden="true">·</span> No ads. Just play.</span></footer>`;
  prompt =
    "Welcome to Little Wonders! Pick a place to play. Garden party, letters, music, patterns, shapes, or the wonder lab.";
  $("#welcome-voice").onclick = () => {
    sound.unlock();
    announce(prompt);
  };
  $("#passport-link").onclick = collection;
}
function start(id) {
  const a = activity(id);
  if (!a) return navigate("");
  session = {
    id,
    level: levelFor(state, id),
    round: 0,
    total: 5,
    hints: 0,
    locked: false,
    tries: 0,
    count: 0,
    phase: "play",
    input: [],
    free: false,
  };
  state.last = id;
  save();
  document.title = `${a.name} · Little Wonders`;
  document.body.className = `in-game theme-${a.color}`;
  nextRound();
}
function nextRound() {
  clearTimers();
  sound.stop();
  session.data = newRound(session.id, session.level, session.round);
  session.locked = false;
  session.tries = 0;
  session.count = 0;
  session.input = [];
  session.showTune = false;
  session.phase = "play";
  renderGame();
}
function renderGame() {
  const a = activity(session.id);
  main.innerHTML = `<section class="game-shell"><div class="game-nav"><button class="tool back-world" id="back"><span aria-hidden="true">⌂</span> My world</button><span class="game-name">${a.name}</span><button class="tool" id="pause"><span aria-hidden="true">Ⅱ</span> Pause</button></div><div class="play-layout"><aside class="scene-window" aria-label="${a.friend}’s world"><img src="assets/${a.image}.webp" alt="" width="1536" height="1024"><div class="friend-note"><span class="eyebrow">${a.friend.toUpperCase()}’S LITTLE ADVENTURE</span><p>${a.description}</p></div></aside><section class="play-panel" aria-label="Learning activity"><div class="round-top"><div class="progress" aria-label="Discovery ${session.round + 1} of ${session.total}">${Array.from({ length: session.total }, (_, i) => `<span class="progress-dot ${i < session.round ? "done" : i === session.round ? "current" : ""}" aria-hidden="true">${i < session.round ? "✓" : ""}</span>`).join("")}</div><button id="repeat" class="listen" aria-label="Hear the instructions again">♫ <span>Listen</span></button></div><h1 id="prompt" tabindex="-1"></h1><p id="instruction" class="instruction"></p><div id="play-area"></div><div class="feedback" id="feedback" role="status" aria-live="polite"></div><div class="game-actions"><button class="secondary" id="hint">A little help <span aria-hidden="true">✧</span></button><button class="primary" id="next" hidden>Next <span aria-hidden="true">→</span></button></div></section></div></section>`;
  $("#back").onclick = () => navigate("");
  $("#pause").onclick = pause;
  $("#repeat").onclick = () => {
    sound.unlock();
    if (session.id === "music" && !session.free && !session.locked)
      playSequence();
    else announce(prompt);
  };
  $("#hint").onclick = hint;
  $("#next").onclick = () => {
    if (!session.locked) return;
    session.round++;
    if (session.round >= session.total) finish();
    else nextRound();
  };
  ({
    count: renderCount,
    letters: renderLetters,
    shapes: renderShapes,
    patterns: renderPatterns,
    music: renderMusic,
    science: renderScience,
  })[session.id]();
  focusHeading();
  if (session.id !== "music") later(() => announce(prompt), 150);
}
function setPrompt(title, instruction, spoken = `${title}. ${instruction}`) {
  $("#prompt").textContent = title;
  $("#instruction").textContent = instruction;
  prompt = spoken;
}
function feedback(text) {
  $("#feedback").textContent = text;
  announce(text);
}
function complete(text) {
  if (session.locked) return;
  session.locked = true;
  clearTimers();
  $("#hint").hidden = true;
  $("#next").hidden = false;
  $("#next").innerHTML =
    session.round === session.total - 1
      ? 'My discovery <span aria-hidden="true">✷</span>'
      : 'Next <span aria-hidden="true">→</span>';
  $(".play-panel").classList.add("celebrate");
  sound.note(523.25);
  later(() => sound.note(659.25), 120);
  later(() => sound.note(783.99), 250);
  feedback(text);
  $("#next").focus({ preventScroll: true });
}
function choose(button, correct, right, wrong) {
  if (session.locked || dialog.open) return;
  if (correct) {
    button.classList.add("correct");
    button.setAttribute("aria-pressed", "true");
    complete(right);
  } else {
    session.tries++;
    session.hints++;
    button.classList.add("tried");
    button.setAttribute(
      "aria-label",
      `${button.getAttribute("aria-label") || button.textContent}. Try another one.`,
    );
    feedback(wrong);
    if (session.tries >= 2) hint(false);
  }
}
function renderCount() {
  const r = session.data;
  setPrompt(
    `Pick ${r.target} ${r.target === 1 ? "carrot" : "carrots"}`,
    "Tap one at a time for Pip’s picnic.",
  );
  $("#play-area").innerHTML =
    `<div class="picnic-meter" aria-label="Carrots in the picnic"><span aria-hidden="true">🧺</span><strong id="picked-count">0</strong><span>of ${r.target}</span></div><div class="carrot-patch">${Array.from({ length: r.total }, (_, i) => `<button class="carrot" aria-label="Pick carrot ${i + 1}" data-index="${i}"><span aria-hidden="true">🥕</span><span class="carrot-number"></span></button>`).join("")}</div><div id="number-choices" class="choices" hidden></div>`;
  $$(".carrot").forEach(
    (b) =>
      (b.onclick = () => {
        if (
          session.locked ||
          session.phase !== "play" ||
          b.getAttribute("aria-disabled") === "true"
        )
          return;
        session.count++;
        b.setAttribute("aria-disabled", "true");
        b.classList.add("picked");
        $(".carrot-number", b).textContent = session.count;
        $("#picked-count").textContent = session.count;
        sound.note(261.63 * 2 ** (session.count / 12));
        announce(String(session.count));
        if (session.count === r.target) {
          session.phase = "number";
          setPrompt(
            "How many did you pick?",
            "Choose the number that matches your picnic.",
          );
          $$(".carrot:not(.picked)").forEach((el) => {
            el.hidden = true;
          });
          const container = $("#number-choices");
          container.hidden = false;
          container.innerHTML = r.choices
            .map(
              (n) =>
                `<button class="choice number" data-value="${n}" aria-label="${n}" ${n === r.target ? "data-answer" : ""}>${n}</button>`,
            )
            .join("");
          $$("button", container).forEach(
            (el) =>
              (el.onclick = () =>
                choose(
                  el,
                  Number(el.dataset.value) === r.target,
                  `You counted ${r.target} ${r.target === 1 ? "carrot" : "carrots"}! Picnic ready.`,
                  `Let’s count the carrots again. You picked ${r.target}.`,
                )),
          );
          later(() => announce(prompt), 700);
          $("button", container)?.focus({ preventScroll: true });
        }
      }),
  );
}
function renderLetters() {
  const r = session.data,
    [letter, word, emoji] = r.word;
  setPrompt(
    r.wordMode ? `What starts “${word}”?` : `Find ${letter}`,
    r.wordMode
      ? "Choose its first letter."
      : r.lower
        ? "Big and little letters belong together."
        : "Find the matching letter.",
    r.wordMode
      ? `Which letter does ${word} start with?`
      : `Can you find the letter ${letter}?`,
  );
  $("#play-area").innerHTML =
    `<div class="letter-clue">${r.wordMode ? `<span class="word-picture" role="img" aria-label="${word}">${emoji}</span><span class="word-label">${word}</span>` : `<span class="big-letter">${letter}</span><span class="word-picture" aria-hidden="true">${emoji}</span><span class="word-label">${letter} is for ${word}</span>`}</div><div class="choices">${r.choices.map((c) => `<button class="choice letter" aria-label="Letter ${r.lower ? c.toLowerCase() : c}" data-letter="${c}" ${c === letter ? "data-answer" : ""}>${r.lower ? c.toLowerCase() : c}</button>`).join("")}</div>`;
  $$(".choice").forEach(
    (b) =>
      (b.onclick = () =>
        choose(
          b,
          b.dataset.letter === letter,
          `${letter}! ${letter} is for ${word}!`,
          `That’s ${b.dataset.letter}. Look for ${letter}.`,
        )),
  );
}
function renderShapes() {
  const r = session.data;
  setPrompt(
    `Find the ${session.level === 3 ? r.color.name + " " : ""}${r.shape}`,
    "Look at the shape. Which one matches?",
  );
  $("#play-area").innerHTML =
    `<div class="shape-target">${shape(r.shape, session.level === 3 ? r.color.hex : "#ced9d3")}<span>${session.level === 3 ? r.color.name + " " : ""}${r.shape}</span></div><div class="choices shape-choices">${r.choices.map((c, i) => `<button class="choice" data-index="${i}" aria-label="${c.color.name} ${c.shape}" ${c.shape === r.shape && c.color.name === r.color.name ? "data-answer" : ""}>${shape(c.shape, c.color.hex)}<small>${session.level === 3 ? c.color.name + " " : ""}${c.shape}</small></button>`).join("")}</div>`;
  $$(".choice").forEach((b) => {
    const c = r.choices[Number(b.dataset.index)];
    b.onclick = () =>
      choose(
        b,
        c.shape === r.shape && c.color.name === r.color.name,
        `You found the ${r.shape}! ${r.shape === "triangle" ? "Three straight sides." : r.shape === "square" ? "Four equal sides." : r.shape === "circle" ? "Round, with no corners." : "Look at all its points."}`,
        `That’s a ${c.color.name} ${c.shape}. Let’s look again.`,
      );
  });
}
function patternColor(s) {
  return {
    circle: "#d87938",
    triangle: "#368b87",
    square: "#6379ba",
    star: "#aa6599",
  }[s];
}
function renderPatterns() {
  const r = session.data;
  setPrompt("What comes next?", "Follow the pattern to finish the trail.");
  $("#play-area").innerHTML =
    `<div class="pattern-trail" aria-label="Pattern: ${r.sequence.join(", ")}, then a missing shape">${r.sequence.map((s) => `<span class="pattern-step">${shape(s, patternColor(s))}</span>`).join("")}<span class="pattern-step missing" id="missing">?</span></div><div class="choices">${r.choices.map((s) => `<button class="choice" data-shape="${s}" aria-label="${s}" ${s === r.target ? "data-answer" : ""}>${shape(s, patternColor(s))}<small>${s}</small></button>`).join("")}</div>`;
  $$(".choice").forEach(
    (b) =>
      (b.onclick = () => {
        if (session.locked) return;
        const correct = b.dataset.shape === r.target;
        if (correct)
          $("#missing").innerHTML = shape(r.target, patternColor(r.target));
        choose(
          b,
          correct,
          `The ${r.target} comes next. You made a pattern!`,
          "Let’s say the pattern together.",
        );
      }),
  );
}
function renderMusic() {
  setPrompt(
    "Listen. Then play it back.",
    "Tap Listen, watch the shapes, and copy Blue’s tune.",
  );
  $("#play-area").innerHTML =
    `<div class="music-mode" role="group" aria-label="Music mode"><button id="echo-mode" class="mode active" aria-pressed="true">Echo Blue</button><button id="free-mode" class="mode" aria-pressed="false">Make music</button></div><div class="music-cues" id="music-cues" aria-label="Notes to copy"></div><div class="music-pads">${NOTES.map((n, i) => `<button class="music-pad" style="--pad:${n.color}" data-note="${i}" aria-label="${n.name}, ${n.shape}, key ${i + 1}">${shape(n.shape, "#fff")}<span>${n.name}</span><small>${i + 1}</small></button>`).join("")}</div><button class="secondary replay-tune" id="play-tune">♫ Listen to Blue</button>`;
  $("#hint").textContent = "Show me the tune";
  $("#play-tune").onclick = playSequence;
  $("#echo-mode").onclick = () => setMusicMode(false);
  $("#free-mode").onclick = () => setMusicMode(true);
  $$(".music-pad").forEach(
    (b) => (b.onclick = () => playNote(Number(b.dataset.note))),
  );
  renderCues();
  announce(prompt);
}
function renderCues(show = false) {
  const r = session.data;
  $("#music-cues").innerHTML = session.free
    ? '<span class="free-message">Your tune. Your way.</span>'
    : r.sequence
        .map(
          (n, i) =>
            `<span class="cue ${i < session.input.length ? "played" : ""}">${show || session.showTune || i < session.input.length ? shape(NOTES[n].shape, NOTES[n].color) : '<span aria-hidden="true">·</span>'}</span>`,
        )
        .join("");
}
function setMusicMode(free) {
  clearTimers();
  sound.stop();
  session.free = free;
  session.input = [];
  session.phase = "play";
  session.locked = false;
  session.count = 0;
  session.showTune = false;
  $("#next").hidden = true;
  $("#hint").hidden = free;
  $("#play-tune").hidden = free;
  $("#free-mode").classList.toggle("active", free);
  $("#echo-mode").classList.toggle("active", !free);
  $("#free-mode").setAttribute("aria-pressed", String(free));
  $("#echo-mode").setAttribute("aria-pressed", String(!free));
  setPrompt(
    free ? "Make a little music." : "Listen. Then play it back.",
    free
      ? "Tap the shapes. Every tune is yours."
      : "Tap Listen, watch the shapes, and copy Blue’s tune.",
  );
  $("#feedback").textContent = "";
  $$(".music-pad").forEach((b) => {
    b.classList.remove("lit");
    b.disabled = false;
  });
  renderCues();
  announce(prompt);
}
function lightNote(n) {
  const b = $(`[data-note="${n}"]`);
  if (!b) return;
  b.classList.add("lit");
  sound.note(NOTES[n].hz, 0.48);
  later(() => b.classList.remove("lit"), 420);
}
function playSequence() {
  if (
    !session ||
    session.id !== "music" ||
    session.locked ||
    session.free ||
    dialog.open
  )
    return;
  sound.unlock();
  clearTimers();
  sound.stop();
  session.input = [];
  session.phase = "listen";
  $("#feedback").textContent = "Listen and watch…";
  $("#play-tune").disabled = true;
  $$(".music-pad").forEach((b) => {
    b.disabled = true;
    b.classList.remove("lit");
  });
  renderCues(true);
  session.data.sequence.forEach((n, i) =>
    later(() => lightNote(n), 350 + i * 750),
  );
  later(
    () => {
      session.phase = "play";
      $("#play-tune").disabled = false;
      $$(".music-pad").forEach((b) => (b.disabled = false));
      renderCues(session.tries >= 2);
      $("#feedback").textContent = "Your turn!";
      announce("Your turn!");
      $(".music-pad").focus({ preventScroll: true });
    },
    450 + session.data.sequence.length * 750,
  );
}
function playNote(n) {
  if (
    !session ||
    session.id !== "music" ||
    session.phase === "listen" ||
    session.locked ||
    dialog.open
  )
    return;
  sound.unlock();
  lightNote(n);
  if (session.free) {
    session.count++;
    if (session.count === 8) {
      $("#feedback").textContent =
        "Your tune is wonderful. Keep playing, or save your discovery.";
      $("#next").hidden = false;
      $("#next").innerHTML = 'My discovery <span aria-hidden="true">✷</span>';
      $("#next").onclick = finish;
    }
    return;
  }
  if (n === session.data.sequence[session.input.length]) {
    session.input.push(n);
    renderCues(session.tries >= 2);
    if (session.input.length === session.data.sequence.length)
      complete("You listened and played Blue’s tune!");
  } else {
    session.tries++;
    session.hints++;
    session.input = [];
    feedback("Let’s try the tune together. Tap Listen when you’re ready.");
    renderCues(true);
    if (session.tries >= 2) session.showTune = true;
  }
}
function renderScience() {
  const r = session.data;
  setPrompt(
    "Will it float or sink?",
    "Make a guess. Then we’ll try it together.",
    `Here is ${r.name}. Will it float or sink? Make a guess. Then we’ll try it together.`,
  );
  $("#hint").hidden = true;
  $("#play-area").innerHTML =
    `<div class="experiment"><div class="experiment-object" id="experiment-object"><span role="img" aria-label="${r.label}">${r.icon}</span><strong>${r.label}</strong></div><div class="water-tank" aria-label="Water experiment"><span class="water-label">water</span></div></div><div class="choices predictions"><button class="choice prediction" data-predict="float"><span aria-hidden="true">↑</span><strong>Float</strong><small>Stay at the top</small></button><button class="choice prediction" data-predict="sink"><span aria-hidden="true">↓</span><strong>Sink</strong><small>Go to the bottom</small></button></div>`;
  $$(".prediction").forEach(
    (b) =>
      (b.onclick = () => {
        if (session.locked || session.phase === "experiment") return;
        session.phase = "experiment";
        b.classList.add("selected");
        $$(".prediction").forEach((el) => (el.disabled = true));
        $("#experiment-object").classList.add(
          r.floats ? "floating" : "sinking",
        );
        // Predictions are not scored; observation, not guessing correctly, is the goal.
        later(() => complete(r.fact), 1200);
      }),
  );
}
function hint(count = true) {
  if (!session || session.locked) return;
  if (count) session.hints++;
  if (session.id === "music") {
    session.showTune = true;
    renderCues(true);
    playSequence();
    return;
  }
  $$("[data-answer]").forEach((b) => b.classList.add("hinted"));
  const r = session.data;
  const text =
    session.id === "count"
      ? session.phase === "play"
        ? `Tap ${r.target - session.count} more ${r.target - session.count === 1 ? "carrot" : "carrots"}.`
        : `You picked ${r.target}. Find ${r.target}.`
      : session.id === "letters"
        ? `Look for ${r.word[0]}. ${r.word[0]} is for ${r.word[1]}.`
        : session.id === "shapes"
          ? `Look for the ${session.level === 3 ? r.color.name + " " : ""}${r.shape}.`
          : `${r.sequence.join(", ")}. Next comes ${r.target}.`;
  if (session.id === "count" && session.phase === "play")
    $(".carrot:not(.picked)")?.classList.add("hinted");
  feedback(text);
}
function finish() {
  if (!session || session.phase === "finished") return;
  clearTimers();
  sound.stop();
  const a = activity(session.id);
  state = finishSession(state, a.id, session.hints);
  save();
  session.phase = "finished";
  session.locked = true;
  main.innerHTML = `<section class="finish-screen"><div class="finish-art"><img src="assets/${a.image}.webp" alt="${a.friend}’s world" width="1536" height="1024"></div><div class="finish-content"><p class="eyebrow">LOOK WHAT YOU DISCOVERED</p><div class="discovery-sticker" aria-hidden="true">${a.sticker}</div><h1 tabindex="-1">${a.discovery}!</h1><p>You explored, tried, and learned.<br>This discovery is yours.</p><div class="finish-buttons"><button class="primary" id="finish-home">Back to my world <span aria-hidden="true">⌂</span></button><button class="secondary" id="again">Play again <span aria-hidden="true">↻</span></button></div><div class="offscreen"><span aria-hidden="true">✳</span><div><strong>A little wonder away from the screen</strong><p>${a.offline}</p></div></div><button class="text-button" id="all-done">All done for now</button></div></section>`;
  $("#finish-home").onclick = () => navigate("");
  $("#again").onclick = () => start(a.id);
  $("#all-done").onclick = rest;
  prompt = `${a.discovery}! You explored, tried, and learned. This discovery is yours. ${a.offline}`;
  focusHeading();
  announce(prompt);
}
function rest() {
  clearTimers();
  sound.stop();
  session = null;
  main.innerHTML = `<section class="rest-screen"><span class="rest-symbol" aria-hidden="true">✳</span><h1 tabindex="-1">See you, little wonder.</h1><p>Your discoveries will be here.<br>Go find something wonderful outside the screen.</p><button class="secondary" id="return-world">Back to my world</button></section>`;
  $("#return-world").onclick = () => navigate("");
  focusHeading();
  announce(
    "See you, little wonder. Go find something wonderful outside the screen.",
  );
}
function openDialog(content) {
  if (!dialog.open) lastFocus = document.activeElement;
  sound.stop();
  if (session?.id === "music" && session.phase === "listen") {
    clearTimers();
    pausedMusic = true;
  }
  suspendTimers();
  dialog.innerHTML = `<button class="close-dialog" aria-label="Close">×</button>${content}`;
  $(".close-dialog", dialog).onclick = () => dialog.close();
  if (!dialog.open) dialog.showModal();
}
function pause() {
  openDialog(
    '<div class="dialog-emblem" aria-hidden="true">Ⅱ</div><h2 id="dialog-title">A little pause.</h2><p>Take your time. Your adventure can wait.</p><button class="primary wide" id="resume">Keep playing ▶</button><button class="secondary wide" id="stop-playing">All done for now</button>',
  );
  $("#resume").onclick = () => dialog.close();
  $("#stop-playing").onclick = () => {
    dialog.close();
    rest();
  };
}
function collection() {
  openDialog(
    `<p class="eyebrow">YOUR LITTLE TREASURES</p><h2 id="dialog-title">My discoveries</h2><p>Every place has something to discover.<br>You can explore them in any order.</p><div class="sticker-grid">${ACTIVITIES.map((a) => `<button class="sticker-item ${state.completed[a.id] ? "collected" : ""}" data-activity="${a.id}"><span aria-hidden="true">${state.completed[a.id] ? a.sticker : "✧"}</span><strong>${a.discovery}</strong><small>${state.completed[a.id] ? "Explore again" : "Let’s discover"}</small></button>`).join("")}</div>`,
  );
  $$("[data-activity]", dialog).forEach(
    (b) =>
      (b.onclick = () => {
        dialog.close();
        navigate(`#play/${b.dataset.activity}`);
      }),
  );
}
function grownups() {
  openDialog(
    '<p class="eyebrow">A MOMENT FOR GROWN-UPS</p><h2 id="dialog-title">Hello, big wonder.</h2><p>To open settings, type <strong>GROWNUP</strong> below.</p><form id="gate"><label for="gate-word">Type the word</label><input id="gate-word" autocomplete="off" autocapitalize="characters" spellcheck="false" maxlength="12" required><p id="gate-error" role="status"></p><button class="primary wide" type="submit">Open grown-up corner</button></form>',
  );
  $("#gate").onsubmit = (event) => {
    event.preventDefault();
    if ($("#gate-word").value.trim().toUpperCase() === "GROWNUP") parentPanel();
    else {
      $("#gate-error").textContent = "Type GROWNUP to continue.";
      $("#gate-word").focus();
    }
  };
}
function parentPanel() {
  openDialog(`<p class="eyebrow">GROWN-UP CORNER</p><h2 id="dialog-title">Little steps. Real discovery.</h2><p>Play together, follow their curiosity, and stop whenever it feels right. Every activity has five short discoveries; music also has a free-play mode.</p>
    <div class="settings"><label class="setting"><span><strong>Spoken guidance</strong><small>Instructions are also shown on screen.</small></span><input type="checkbox" id="speech-setting" ${state.speech ? "checked" : ""}></label><label class="setting"><span><strong>Gentle animation</strong><small>Your device’s reduced-motion setting comes first.</small></span><input type="checkbox" id="motion-setting" ${state.motion ? "checked" : ""}></label><label class="setting" for="pace"><span><strong>Learning pace</strong><small>Applies when an activity starts.</small></span><select id="pace"><option value="adaptive">Grow with me</option><option value="gentle">Little steps · often 3–4</option><option value="stretch">More to explore · often 5–6</option></select></label></div>
    <details><summary>What we’re practising</summary><ul class="curriculum">${ACTIVITIES.map((a) => `<li><strong>${a.name}</strong><span>${a.skill} · ${state.completed[a.id] || 0} completed sessions</span></li>`).join("")}</ul><p>These counts describe play, not an assessment. “Grow with me” starts gently, adds challenge after two sessions without help, and eases back when more support is needed.</p></details>
    <details><summary>The original adventures</summary><p>The original canvas adventures are best on a tablet held sideways. Their progress is separate.</p><a class="legacy-link" href="games/melody/">Melody Kingdom →</a><a class="legacy-link" href="games/germs/">Germ Patrol →</a></details>
    <details><summary>About, privacy & offline play</summary><p>Made by a dad and his daughter. No ads, purchases, accounts, analytics, or personal profiles. Progress stays in this browser. Hosting providers still receive ordinary requests needed to load the game.</p><p>After the first successful load, the main world is saved for offline play when your browser supports it. Narration uses available local clips or your device’s voice; voice availability varies. The original adventures download separately. The app works without sound.</p><p>${storageAvailable ? "Progress is being saved on this device." : "This browser is not saving progress. Play still works for this visit."}</p><a class="legacy-link" href="https://github.com/drewsocratix25/Fantasy-Learning" target="_blank" rel="noopener noreferrer">View the project →</a></details>
    <button class="text-button danger" id="reset">Reset this world’s discoveries</button>`);
  $("#pace").value = state.pace;
  $("#speech-setting").onchange = (e) => {
    state.speech = e.target.checked;
    sound.stop();
    save();
  };
  $("#motion-setting").onchange = (e) => {
    state.motion = e.target.checked;
    save();
  };
  $("#pace").onchange = (e) => {
    state.pace = e.target.value;
    save();
  };
  $("#reset").onclick = () => {
    openDialog(
      '<h2 id="dialog-title">Start a fresh discovery book?</h2><p>This clears discoveries in the new world on this device. Original adventure saves stay as they are.</p><button class="secondary wide" id="keep-progress">Keep discoveries</button><button class="primary wide" id="confirm-reset">Clear discoveries</button>',
    );
    $("#keep-progress").onclick = parentPanel;
    $("#confirm-reset").onclick = () => {
      state.completed = {};
      state.skill = {};
      state.last = null;
      save();
      parentPanel();
    };
  };
}
function route() {
  clearTimers();
  sound.stop();
  if (dialog.open) dialog.close();
  const match = /^#play\/([a-z]+)$/.exec(location.hash);
  if (match && activity(match[1])) start(match[1]);
  else home();
  window.scrollTo({ top: 0, behavior: "instant" });
  focusHeading();
}
$("#sound").onclick = () => {
  sound.unlock();
  state.sound = !state.sound;
  sound.stop();
  save();
  if (state.sound) announce("Sound is on.");
};
$("#collection").onclick = collection;
$("#grownups").onclick = grownups;
dialog.addEventListener("close", () => {
  resumeTimers();
  if (pausedMusic && session?.id === "music") {
    pausedMusic = false;
    session.phase = "play";
    const replay = $("#play-tune");
    if (replay) replay.disabled = false;
    $$(".music-pad").forEach((b) => {
      b.disabled = false;
      b.classList.remove("lit");
    });
    if ($("#feedback"))
      $("#feedback").textContent = "Tap Listen to hear the tune again.";
  }
  if (lastFocus?.isConnected) lastFocus.focus({ preventScroll: true });
});
document.addEventListener("pointerdown", () => sound.unlock(), {
  passive: true,
});
document.addEventListener("keydown", (e) => {
  if (e.target.matches("input, select, textarea") || dialog.open) return;
  sound.unlock();
  if (session?.id === "music" && /^[1-4]$/.test(e.key) && !e.repeat) {
    e.preventDefault();
    playNote(Number(e.key) - 1);
  }
});
document.addEventListener("visibilitychange", () => {
  if (document.hidden) {
    sound.stop();
    if (session && session.phase !== "finished" && !dialog.open) pause();
  }
});
window.addEventListener("pagehide", () => {
  clearTimers();
  sound.stop();
});
window.addEventListener("hashchange", route);
reducedMotion.addEventListener("change", refreshChrome);
refreshChrome();
route();
if ("serviceWorker" in navigator && location.protocol.startsWith("http"))
  window.addEventListener("load", () =>
    navigator.serviceWorker.register("./sw.js").catch(() => {}),
  );
