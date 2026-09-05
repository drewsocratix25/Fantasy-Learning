# ✨ Little Wonders

Simple, ad-free learning games for ages 3–6, made by a dad and his daughter. A static site (no build step)
with a games hub, a shared engine, and a small platform layer for family progress sync and supporters.

| | |
| --- | --- |
| The hub and every game | `index.html`, `games.json`, `games/<id>/` |
| Shared engine | `engine/` (audio, art, UI, quiz scaffold, save/merge, main loop) |
| Platform (family codes, sync, supporters, play counts) | `platform/`, `supabase/`, and the runbook in [`docs/PLATFORM.md`](docs/PLATFORM.md) |
| Adding a game | [`docs/ADDING-A-GAME.md`](docs/ADDING-A-GAME.md) and the `games/_template` folder |
| Checks | `npm install && npm run verify` (registry check, save-merge unit test, browser smoke test); the same runs in CI on every pull request |

The first game is below.

# 👑 Melody Kingdom

A cartoon princess music adventure that teaches kindergarten skills. Built for an iPad in the browser, no app store needed.

Explore a kingdom with your princess and a companion who hops along behind you. Walk up to any sign and tap **Play!**

| Place | What she learns | How it plays |
| --- | --- | --- |
| 🏰 **Melody Castle** | Rhythm, listening, song lyrics | Guitar-Hero style: gems fall down four lanes; tap them when they hit the sparkly pads. Eight real nursery songs (Twinkle Twinkle, the ABC song, Old MacDonald, Row Your Boat, London Bridge, Itsy Bitsy Spider, Mary Had a Little Lamb, Happy Birthday) with karaoke words. Turtle / cat / rabbit speed. |
| 🌸 **Letter Garden** | Letter names, uppercase and lowercase, first sounds ("which letter does *frog* start with?") | Tap the singing flower with the right letter. Every letter reveals a picture word. |
| 🐸 **Counting Pond** | Counting to 10, number recognition | Tap each frog to count it (every frog sings the next note of the scale), then pick the number. |
| 🌈 **Rainbow Meadow** | Colours and shapes | Pop the balloon that matches: "the blue star", "the triangle", "the purple heart". |
| 🎹 **Piano Pavilion** | Notes, melody, following a tune | A rainbow piano with four instruments. Free play, Listen (keys light up), and Teach me (follow the glowing key through a whole song). |
| 🐻 **Pattern Bridge** | AB / AAB / ABC patterns | Musical creatures play a pattern; pick what comes next and hop across the stones. |

Everything is read aloud, every game gives stars, and difficulty grows on its own as she earns three-star rounds. Progress is saved on the device.

## Stars, rewards, and a growing world

Stars pay out often. Roughly every few stars something new happens: a new **friend** who follows her around (unicorn at 5 stars, then dragon, chick, butterfly, penguin, fox, dolphin), a new **song** for the castle, a new **crown** (flower, star, rainbow, leaf, ice), new **dress colours**, a **magic wand** that leaves a sparkle trail, and **decorations** that appear in the kingdom (a fountain, a hot-air balloon, fireworks). The kingdom shows the next reward and how many stars away it is, and everything collected lives in *My Things* (the friend button in the corner).

When all eight kingdom friends are collected, the gate at the east edge of the map opens onto the **Enchanted Forest**, with four harder games and six forest friends (owl, deer, squirrel, hedgehog, wolf, fairy). Collecting all of those opens the **Crystal Peaks** with four more games and five more friends (polar bear, eagle, goat, seal, swan).

| Enchanted Forest | What she learns | How it plays |
| --- | --- | --- |
| 🌳 **Rhyme Tree** | Rhyming | "Which one rhymes with cat?" Tap the picture that rhymes. |
| 🐿️ **Acorn Spelling** | Spelling three-letter words | Tap the acorn letters in order; every letter sings a note. |
| 🦉 **Owl School** | Adding, then taking away, within 10 | Picture sums: "What is 3 plus 2?" with apples, acorns, ladybugs. |
| 🍄 **Echo Cave** | Musical memory | The owl plays a tune on singing mushrooms; play it back. It gets one note longer each round. |

| Crystal Peaks | What she learns | How it plays |
| --- | --- | --- |
| 🕰️ **Cloud Clock** | Telling time to the hour, then half past | Read the clock, tap the time. |
| 📖 **Reading Rock** | Reading simple words | Read the word, tap its picture. |
| 💎 **Crystal Stairs** | Number order, then counting by 2s, 5s and 10s | Find the missing number on the stairs. |
| 🥁 **Dragon Drums** | Rhythm memory | The dragon drums a pattern; drum it back on three drums. |

## Voice and music

**The narrator is a pre-rendered studio voice.** Every sentence the game can say (about 1,100 lines) is rendered ahead of time with [Kokoro-82M](https://huggingface.co/hexgrad/Kokoro-82M), an open-source (Apache-2.0) neural text-to-speech model, and shipped as small MP3 clips in `voice/`. The game plays those clips through its own audio engine, so the voice sounds the same on every device, works offline, and needs no setup. If a line has no clip (for example one that includes a custom name), the game falls back to the device's built-in speech, ranking Apple's Enhanced/Premium voices first; the grown-up corner lets you pick and preview that fallback voice.

**Baking her name into the voice** (optional, on your Mac):

```bash
pip install kokoro-onnx lameenc numpy      # once
python3 tools/make-voices.py --name Ava     # renders only the new name lines
git add voice && git commit -m "Voice pack with Ava" && git push
```

The script fetches the Kokoro model through npm (`expo-kokoro` bundles the weights), so it works without a HuggingFace account. Existing clips are kept. Use `--voice af_bella` (or any voice in the model: af_heart, af_bella, af_nicole, af_sarah, bf_emma, bf_isabella...) to change the narrator; delete the `voice/` folder first to re-render everything.

**The background music is generated live**, not looped: it composes from rotating chord progressions, a melody that develops a short motif and answers it, instruments and textures that change every phrase, and gentle key changes. Each area has its own mood (a music-box kingdom theme, a flute waltz in the garden, marimba at the pond, a bright waltz in the meadow, a soft pad on the bridge), the music ducks whenever the narrator speaks, and the music games play with no backing track so the songs stay clear.

There is a small **grown-up corner** (hold the ⚙️ in the top-left corner of the kingdom for two seconds) to mute music, turn the voice off or change it, change princess, or reset progress.

## Deploying it (about 5 minutes, one time)

The game is plain HTML, CSS, and JavaScript. There is nothing to build and nothing to install. GitHub Pages hosts it for free.

1. **Merge this branch into `main`** (open the pull request on GitHub and click *Merge*). Every later push to `main` redeploys automatically.
2. On GitHub open **Settings → Pages**. Under *Build and deployment* set **Source** to **GitHub Actions**. That is the only setting to change.
3. Open the **Actions** tab. The workflow *Deploy Melody Kingdom to GitHub Pages* runs for about a minute. When it finishes, the game is live at:

   **https://drewsocratix25.github.io/Fantasy-Learning/**

   (If the repository is private, GitHub Pages needs a GitHub Pro / Team plan. Making the repository public avoids that.)

If you ever want to deploy somewhere else, the whole folder is a static site: drag it onto [Netlify Drop](https://app.netlify.com/drop) or Vercel and it works the same way.

## Putting it on the iPad

1. Open the link above in **Safari** on the iPad.
2. Tap the **Share** button, then **Add to Home Screen**, then **Add**.
3. Open *Melody Kingdom* from the home screen. It runs full-screen in landscape, with no browser bars, and keeps working offline once it has loaded once.

If you hear the voice but no music, flip the iPad's side switch off silent or turn the volume up: Safari mutes synthesized music while the ringer is silenced.

Tip: turn on **Guided Access** (Settings → Accessibility → Guided Access) so she can't swipe out of the game.

## Controls

- **iPad**: tap anywhere to walk there, or press and drag anywhere for a thumb-joystick. Tap the big **Play!** bubble near a sign. Everything else is big tap targets, and multi-touch works on the piano and in the castle.
- **Mac / keyboard**: arrow keys or WASD to walk, Enter to play, A S D F for the four rhythm lanes, A–L for the piano keys.

## Running it locally

Any static file server works, for example:

```bash
npx http-server -p 8080 .
# then open http://localhost:8080
```

`tools/shoot.mjs` and `tools/make-icons.mjs` are optional development helpers that use Playwright to take screenshots and regenerate the PNG icons.

## Project layout

```
index.html, hub.css       the Little Wonders hub (cards rendered from games.json)
games.json                registry of games: id, path, status (live | soon | template)
privacy.html, terms.html  legal pages
platform/config.js        public platform config (Supabase URL + anon key, Stripe links); empty = local mode
platform/platform.js      family codes, progress sync, supporter status, play counts (loaded by hub + games)
platform/hub.js           hub behaviour
engine/save.js            progress + settings (localStorage) and the cross-device merge rules
engine/audio.js           Web Audio synth: instruments, song scheduler, background music, sound effects, speech
engine/art.js             cartoon drawing library (princess, castle, trees, particles)
engine/ui.js              buttons, HUD, results / collection / grown-up overlays
engine/quiz.js            "prompt + tap the right card" scaffold
engine/main.js            canvas scaling, input, scene manager, main loop
games/melody/             Melody Kingdom (its own css, icons, songs, voice pack, scenes, mini-games, sw.js)
games/_template/          starting point for a new game
supabase/                 schema migration + edge functions (family API, Stripe webhook)
tools/                    check.mjs, smoke.mjs, test-save.mjs, screenshot + voice-pack helpers
.github/workflows         Checks (CI) and the GitHub Pages deploy
```

All artwork is drawn in code or uses emoji, and all music is synthesized, so the whole game is a few hundred kilobytes and needs no asset downloads.
