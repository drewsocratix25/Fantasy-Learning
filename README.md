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

Everything is read aloud, every game gives stars, and stars unlock new companions (unicorn, dragon, butterfly, chick, penguin, fox, dolphin). Difficulty grows on its own as she earns three-star rounds. Progress is saved on the device.

## Voice and music

**The narrator's voice comes from the iPad itself** (the browser's built-in speech), so its quality depends on which voices are installed. The compact default voice sounds robotic; Apple's downloadable voices sound natural. One-time setup on the iPad:

1. Settings → Accessibility → Spoken Content → Voices → English.
2. Download **Ava (Premium)** or **Samantha (Enhanced)** (Zoe, Allison, and Nicky Premium are also good).
3. Reopen Melody Kingdom. It picks the best installed voice automatically, and you can switch and preview voices in the grown-up corner.

On a Mac, Chrome's "Google US English" voice or the same downloaded Apple voices in Safari work well.

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
index.html            page shell
css/style.css
js/save.js            progress + settings (localStorage)
js/audio.js           Web Audio synth: instruments, song scheduler, background music, sound effects, speech
js/songs.js           nursery songs with syllable-aligned lyrics
js/art.js             cartoon drawing library (princess, castle, trees, particles)
js/ui.js              buttons, HUD, results / friends / grown-up overlays
js/title.js           choose a princess
js/world.js           the explorable kingdom
js/games/*.js         the six mini-games
manifest.webmanifest  installable web app
sw.js                 offline cache
.github/workflows     GitHub Pages deploy
```

All artwork is drawn in code or uses emoji, and all music is synthesized, so the whole game is a few hundred kilobytes and needs no asset downloads.
