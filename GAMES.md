# Adding a game to Little Wonders

Every game is a static folder under `games/<id>/` that loads the shared engine from `engine/`.
Melody Kingdom (`games/melody/`) and Germ Patrol (`games/germs/`) are the references.

## Folder layout

```
games/<id>/
  index.html            loads js/config.js, then engine scripts, then the game's scripts, then engine/main.js
  css/style.css         copy from another game; only the background colours differ
  manifest.webmanifest  installable web app (start_url ./index.html, scope ./)
  sw.js                 offline cache; list your files in ASSETS and bump CACHE when they change
  icons/icon.svg        run `node tools/make-icons.mjs <id>` to produce the PNGs
  js/config.js          FL.config = { id, title, storageKey, startScene, heroLabel, heroEmoji, lineFiles, defaults }
  js/data.js            FL.Data: all content (pure data, no DOM; the voice generator loads it in Node)
  js/voicelines.js      FL.Lines.all(name) -> every sentence the narrator can say
  js/progress.js        rewards: set UI.hooks.checkUnlocks / nextUnlock / prevThreshold; register music styles
  js/*.js               scenes; register with FL.scenes.<name> = scene
  voice/                pre-rendered MP3 narrator clips + manifest.json (generated, commit them)
```

## Engine contract

- A scene is an object with `enter(params)`, `exit()`, `update(dt)`, `draw(ctx)`, pointer handlers `down/move/up(p)`, `key(k)`, optional `resize()`, `hud: {home, repeat}`, `music: '<style>'`, `repeatPrompt()`.
- Logical canvas: height 900, width 1200 to 1700 depending on aspect. Read `FL.Game.W/H` every frame.
- Timers: use `FL.Game.later(fn, ms)` (cancelled on scene change), never raw `setTimeout` in game code.
- Narration: `FL.Audio.say(text, {interrupt, alt, tts})` plays a clip when the text matches a line in the voice pack, else falls back to the device voice. Every string you pass to `say` must be produced by `FL.Lines.all()`.
- Sounds: `FL.Audio.note(name, {inst, vol, dur})`, `FL.Audio.sfx.*`. Music: `FL.Audio.music.styles.<name> = {...}` then `scene.music = '<name>'`.
- UI: `FL.UI.Button`, `UI.banner`, `UI.progressDots`, `UI.showResults({title, stars, emoji, again, home})`, `UI.showCollection(...)`, `UI.toast`.
- Quiz games: `FL.makeQuiz({ id, title, emoji, music, bg, home, newRound(scene) -> {prompt, choices:[{emoji|text|draw, correct, sayRight, sayWrong}], display} })`.
- Progress: `FL.Save.data` (stars, levels, plays, unlocked, items...), `FL.Save.addStars/addPlay/levelUp/give/has/unlock`.

## Voice pack

```
pip install kokoro-onnx lameenc numpy          # once
python3 tools/make-voices.py --game <id>        # renders only missing lines into games/<id>/voice
```

## Hub

Add a card for the game in the root `index.html`. Deployment is the GitHub Pages workflow; nothing to build.
