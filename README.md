# Little Wonders

A small, illustrated world for big discoveries. Six responsive learning activities for children ages 3–6, made by a dad and his daughter.

**Play:** https://drewsocratix25.github.io/Fantasy-Learning/ (the public version follows `main`; pull-request changes are not live until merged).

## One world, six ways to play

| Activity | What children do | Learning focus |
| --- | --- | --- |
| Garden party | Pick a requested number of carrots, then match the numeral | One-to-one counting and cardinality, 1–10 |
| Letter hideaway | Match uppercase letters, connect cases, then identify a word’s first letter | Letter recognition across the alphabet |
| Shape studio | Match outlines, then a shape and colour together | Shape recognition and observing attributes |
| Rainbow trail | Complete AB, AAB, and ABC trails | Repeating patterns and prediction |
| Melody meadow | Echo short tunes using sound and visual cues, or make music freely | Listening, sequencing, creative expression |
| Wonder lab | Predict whether an object floats, observe it, and hear an explanation | Prediction, observation, and scientific curiosity |

The world is open from the first visit. No sign-in, ads, purchases, streaks, countdowns, score penalties, or locked learning. Five rounds lead to a discovery and an invitation to play away from the screen. Free music keeps playing until the child chooses to finish.

## Designed for little hands

- Responsive HTML controls in portrait and landscape. No fixed-width canvas in the new world.
- Large tap targets, keyboard operation, visible focus, text instructions, spoken guidance, and visual music cues.
- A repeat button and contextual hints. There is no penalty for trying again.
- “Grow with me” begins with small choices and changes gradually between sessions. A grown-up can select a gentler or more challenging pace.
- Pause suspends pending activity steps. Leaving an activity clears its timers and narration.
- Device-local discoveries and settings with safe defaults for damaged or unavailable storage.
- Reduced-motion preferences respected; narration can be disabled separately from sound.
- Three original, compressed storybook environments; no external image or font requests.

These are design intentions, not a claim of developmental efficacy, formal accessibility conformance, or usability validation with children. Test on the actual target devices and with caregiver-supervised children before claiming those outcomes.

## Run locally

The game has **no build step or production dependencies**. Serve this directory with any static web server, for example:

```sh
python3 -m http.server 8080
```

Open `http://localhost:8080/`. ES modules need HTTP rather than `file://`.

Development-only validation:

```sh
npm ci
npm test
npm run check
```

Tests cover curriculum invariants, all six activity flows, free music, hints, duplicate taps, pauses, early exits, saved settings, storage failure, offline cache isolation, and retained-engine regressions. DOM tests use LinkeDOM and do not replace visual, real-browser, or child usability tests.

## Project layout

- `index.html`, `hub.css` — accessible app shell and responsive visual system.
- `app/core.mjs` — curriculum, round generation, adaptive progression, save validation.
- `app/main.mjs` — navigation, activities, parent settings, discoveries, timer lifecycle.
- `app/audio.mjs` — local recorded clips where available; device speech fallback; Web Audio notes.
- `assets/` — original environments and app icons.
- `sw.js`, `manifest.webmanifest` — installable, offline-capable main world.
- `games/melody/`, `games/germs/`, `engine/` — preserved original adventures.
- `tests/`, `tools/check-site.mjs` — development checks.

## Offline and privacy

A supporting browser caches the main world’s code and artwork after its first successful online visit. Voice clips cache as they are used; device speech availability varies. The original games keep separate caches and download separately. Progress is local to each browser and does not sync across devices. The app sends no analytics or child identifiers. The hosting provider still receives the normal requests necessary to deliver files.

Each service worker only cleans up its own cache namespace. Missing scripts and audio never receive an HTML fallback. When changing cached app files, bump the relevant worker’s cache version.

## Publishing

The existing GitHub Pages workflow publishes `main`. Review changes on their branch, run the checks, and merge to publish. Repository Settings → Pages must use GitHub Actions as its source.

## Original adventures

Melody Kingdom and Germ Patrol remain in the grown-up corner, with their original saves intact. They are canvas games designed primarily for a landscape tablet. The unfinished Castle Quest URL now leads to Wonder Lab.

See [original adventure documentation](docs/ORIGINAL-ADVENTURES.md), [game authoring](GAMES.md), and [design and validation notes](docs/DESIGN.md).
