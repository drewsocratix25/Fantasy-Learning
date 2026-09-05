# Adding a game to Little Wonders

Every game is a folder under `games/` that loads the shared engine. The hub, the sync service, the
supporter badge, CI and the deploy all pick a new game up from one registry entry. Plan on about an
hour of plumbing, then all the time on the game itself.

## 1. Copy the template

```bash
cp -r games/_template games/<id>          # id: lowercase letters, digits, - or _
```

Edit `games/<id>/js/config.js`:

| Field | What it does |
| --- | --- |
| `id` | Must match the registry entry. Used for the play counter and the progress sync. |
| `storageKey` | localStorage key for this game's progress. Unique per game, never change it once shipped. |
| `startScene` | Scene the engine boots into. `'world'` is the menu the HUD's home button returns to. |
| `heroLabel`, `heroEmoji` | Labels on the grown-up corner's "change hero" button. |
| `voiceTestLine` | Line the ▶ button in the grown-up corner speaks. |
| `lineFiles` | Files defining `FL.Lines.all()` so `tools/make-voices.py` can pre-render a narrator voice pack. |
| `FL.Data.PRINCESSES`, `FL.Data.PRAISE` | Hero list drawn by `FL.Art.princess`, and the praise words on the results screen. |

## 2. Register it

Add an entry to `games.json`:

```json
{ "id": "germs", "title": "Germ Patrol", "path": "games/germs/", "status": "soon",
  "emoji": "🦸🧼", "theme": "germs", "tagline": "…", "ages": "3–6", "skills": ["hygiene"] }
```

`status` is the launch switch. `soon` shows a Coming-soon card that is not clickable, `live` shows a
Play button and adds the game to the sitemap check, `template` is tested but never listed. `theme`
picks the card colours in `hub.css` (add a `.card.<theme>` rule for a new one).

## 3. Keep the script order

`index.html` must load, in this order: `js/config.js` → `platform/config.js` → `platform/platform.js`
→ `engine/save.js` → the other engine files → your scenes → `engine/main.js` last. `npm run check`
enforces it, because the platform hooks `FL.Save` and `engine/main.js` calls `LW.attachGame()` at boot.

If the game has a service worker (copy `games/melody/sw.js`), list the two platform files in its
`ASSETS` and bump the cache name whenever files change.

## 4. What the engine gives you

- **Scenes**: objects with `enter(params)`, `exit()`, `update(dt)`, `draw(ctx)`, `down/move/up(pointer)`,
  `key(k)`, `resize()`, optional `hud: { home, repeat }` and `music: '<style>'`. Register with
  `FL.scenes.<name> = scene`; switch with `FL.Game.go(name, params)`.
- **Quiz scaffold**: `FL.makeQuiz({ id, title, emoji, total, cardColor, music, bg, newRound(scene) })`
  builds a whole "prompt + tap the right card" game with stars, levels and speech. See
  `games/_template/js/game.js` and the forest/peaks games in Melody Kingdom.
- **Results and stars**: `FL.UI.showResults({ title, subtitle, stars, emoji, again, home })` awards stars
  and calls `FL.UI.hooks.checkUnlocks()` if the game defines rewards (see `games/melody/js/progress.js`).
- **Progress**: `FL.Save.data` is yours to extend with game-specific keys. Call `FL.Save.save()` after
  changing it. Achievements sync across devices with the merge rules in `engine/save.js`: numbers are
  kept at their maximum, lists are unioned, preferences follow the newest device. If you add a new
  achievement-like field, add a rule there (and a case to `tools/test-save.mjs`).
- **Audio**: `FL.Audio.say(text)`, `FL.Audio.sfx.correct()` and friends, `FL.Audio.music.play(style)`.
- **Drawing**: `FL.Art` has the cartoon library (`roundRect`, `text`, `emoji`, `princess`, trees, clouds,
  particles). `FL.bg.forest` / `FL.bg.peaks` are ready-made backgrounds.

## 5. Check it

```bash
npm install                # once
npm run verify             # registry + sitemap check, save-merge unit test, browser smoke test
```

The smoke test opens the hub and every game, fails on any console error, and runs the family-code
sync flow against a mock server. Screenshots land in `tools/out/`. The same checks run on every pull
request, and the deploy runs the registry check before publishing.

## 6. Launch

Flip `status` to `live`, add the game's URL to `sitemap.xml`, merge to `main`. The deploy workflow
publishes it within a minute.
