# Castle Quest, plan

*"Explore a castle full of treasures and discover how the world works."*

The third Little Wonders game. Melody Kingdom teaches letters, numbers and music. Germ Patrol teaches
staying healthy. Castle Quest is the **early science** game: how the world around a 3-to-6 year old
works, taught by poking at it. Every room in the castle is a small experiment she can run with her
fingers, and the castle fills up with treasures as she learns.

## Who it is for and what it teaches

Ages 3 to 6, the same child as the other games. Kindergarten science standards, in kid words:

| Room | Big idea | What she actually does |
| --- | --- | --- |
| 🔭 **Sky Tower** | Day and night, weather, seasons | Look through the telescope. "Is it day or night?" "What do we wear when it rains?" "Which season has snow?" Pick the picture. Level 2 adds seasons and the moon. |
| 🌱 **Royal Greenhouse** | What living things need to grow | Plant a seed, then tap the watering can and the sun in turn. The plant grows a stage each time (seed, sprout, leaves, flower, fruit). Then "What does a plant need?" quiz cards. Level 2 asks the order. |
| 🧪 **Wizard's Lab** | Sink or float, materials | The wizard holds up an object over the moat. Guess "Sink" or "Float", then watch it drop and see. Level 2 adds "heavy things can float too" (a boat) and colour mixing in the cauldron (red + blue = purple). |
| 🐾 **Royal Menagerie** | Animals: homes, babies, food | "Where does the fish live?" (pond, nest, den). "Which baby belongs to the cow?" "What does the rabbit eat?" Level 2 adds animal groups (birds have feathers, fish have fins). |
| ⚖️ **Treasure Vault** | Heavy and light, big and small, more and fewer, matching | The royal scales. "Which one is heavier?" "Which is the biggest?" "Which pile has more coins?" Two objects on the scale tip the right way when she answers. |

Two more rooms are sketched for later, once the first five are played and adjusted:
🗺️ **Map Room** (near and far, left and right, following a path) and 🔔 **Bell Tower** (sound: loud and
quiet, high and low, what makes a sound). Neither is needed for a first version.

## How it fits the platform

Castle Quest is a folder, `games/castle/`, that loads the shared engine exactly the way Melody Kingdom does:

```
games/castle/
  index.html            page shell (loads ../../engine/*.js and js/*.js)
  css/style.css         same shell styles, castle colours
  manifest.webmanifest  installable app "Castle Quest"
  sw.js                 offline cache for this game's files
  icons/                castle icon
  js/config.js          FL.config: id 'castle', storageKey 'castleQuest.v1', startScene 'title'
  js/data.js            pure data: heroes, rooms, every quiz fact (also feeds the voice generator)
  js/hero.js            the explorer drawer (tunic, cape, hat) and companions
  js/title.js           pick an explorer, type a name
  js/castle.js          the hub: a walkable castle interior in 3/4 view (walls, doors, torches, minimap)
  js/progress.js        rewards: keys, treasures, companions, plugged into UI.hooks
  js/voicelines.js      FL.Lines.all(name): every sentence, for the Kokoro voice pack
  js/games/*.js         one file per room
```

Engine pieces it reuses without change: `FL.Save` (stars, levels, items, companions), `FL.Audio`
(synth, generative music, narrator with voice-pack-then-TTS fallback), `FL.Art` (primitives, text,
emoji, particles, castle and props), `FL.UI` (buttons, HUD, results overlay, collection panel, grown-up
corner), `FL.makeQuiz` (prompt plus tap-the-right-card scaffold with adaptive levels), and
`engine/main.js` (canvas scaling, pointer input, scene manager, transitions).

Things the engine assumes are princess-shaped, and how Castle Quest handles them:

- **The hero.** `engine/quiz.js` draws the princess in the corner of every quiz unless the room passes
  `drawHero`. Every Castle Quest room passes `FL.drawExplorer` (defined in `js/hero.js`), so the
  explorer appears instead.
- **The "Kingdom" button** on the results overlay is hard-coded in `engine/ui.js`. This branch adds
  `FL.config.homeLabel` / `FL.config.homeEmoji` (default "Kingdom" / 🏡) so Castle Quest can say
  "Castle" / 🏰. One line; Germ Patrol will want the same.
- **Music styles** live in `engine/audio.js`. Castle Quest uses the existing `title`, `kingdom`,
  `garden`, `pond`, `cave`, `peaks` styles rather than adding new ones. A `castle` style (harpsichord-ish
  harp plus bell, stately 4/4) can be added later.

Nothing else in `engine/` needs to change.

## Rewards and progression

Same loop as Melody Kingdom so the two games feel like siblings:

- Every round gives 1 to 3 **stars**. Stars are shared inside this game only (separate storage key).
- Stars unlock **treasures** that appear in the castle and in the "My Treasures" panel: a golden key
  (5), a spyglass (10), a crown (18), a magic lantern (28), a dragon egg (40), a sword-in-the-stone
  (55), a flying carpet (75), a crystal ball (100).
- Stars also unlock **companions** that follow the explorer: mouse (start), owl, cat, baby dragon,
  raven, bat, frog, unicorn.
- Each room levels up on a three-star round. Levels change the questions (Sky Tower level 2 adds
  seasons; Vault level 3 compares three things).
- The **dragon egg hatches** when every room has been played at level 2 or higher. That is the
  "finished the game" moment, and the hatched dragon becomes the best companion.

## Voice

Every sentence the narrator can say is enumerated in `js/voicelines.js`, so
`python3 tools/make-voices.py --game castle` renders the same Kokoro voice pack Melody Kingdom uses.
Until the pack is rendered the game falls back to the device voice, exactly like Melody Kingdom did
before its pack existed. The voice pack is a follow-up step to run on a Mac; it is not needed to play.

## Milestones

1. **Scaffold** (this branch): folder, shell, config, data, explorer hero, title screen, castle hub,
   rewards, service worker, icon. The hub card on the front page already points here.
   The hub is a walkable castle interior (`js/castle.js`): a 3500 by 2650 map in a 3/4 view with
   extruded stone walls, doorways, pillars, torch-lit shadows, a great hall, vault, greenhouse,
   menagerie, dungeon lab and sky tower, joined by corridors and stairs. Tap-to-walk, thumb
   joystick and arrow keys, a minimap, and a guide arrow when she has been idle for a while.
2. **Five rooms** (this branch): Sky Tower, Greenhouse, Wizard's Lab (sink or float), Menagerie,
   Treasure Vault. Each playable end to end with stars and adaptive levels.
3. **Smoke test**: static server plus `tools/shoot.mjs` screenshots of every scene, no console errors.
4. **Voice pack**: render clips on a Mac, commit `games/castle/voice/`.
5. **Play test with the actual kid**, then adjust: which rooms she returns to, where she gets stuck,
   which prompts need rewording. Only after that: Map Room, Bell Tower, colour mixing.

## Open questions for Drew

- Hero: an explorer kid with a cape and hat (current plan), or the same princesses as Melody Kingdom
  so the games share a character? Both are easy; the explorer is drawn already.
- Should stars be shared across games (one wallet on the hub) or per game (current)? Per game is
  simpler and matches Melody Kingdom today.
