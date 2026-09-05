// A complete, tiny game: a menu scene called 'world' (the engine's home button goes there) and one
// quiz built on FL.makeQuiz. Everything drawn here uses the shared engine, so it already gets the
// HUD, results screen with stars, difficulty levels, grown-up corner, toasts and progress sync.
(function () {
  const A = FL.Art, UI = FL.UI, G = () => FL.Game;

  // ---- the quiz: "which animal says ...?" ----
  const ANIMALS = [['🐶', 'dog', 'woof'], ['🐱', 'cat', 'meow'], ['🐮', 'cow', 'moo'], ['🐑', 'sheep', 'baa'], ['🐸', 'frog', 'ribbit'], ['🦆', 'duck', 'quack'], ['🐷', 'pig', 'oink'], ['🐴', 'horse', 'neigh']];
  FL.makeQuiz({
    id: 'sounds', title: 'Animal Sounds', emoji: '🐶', total: 6, cardColor: '#f59e0b', music: 'forest',
    bg: (ctx, g, t) => FL.bg.forest(ctx, g, t),
    newRound(scene) {
      const n = Math.min(4, 2 + scene.level);            // difficulty: more cards as the level rises
      const pool = FL.shuffle(ANIMALS).slice(0, n); const [emoji, name, sound] = FL.rnd(pool);
      return {
        prompt: `Who says ${sound}?`, promptEmoji: '👂',
        choices: pool.map(([e, nm, snd]) => ({ emoji: e, correct: e === emoji, sayRight: `Yes! The ${nm} says ${snd}!`, sayWrong: `That's the ${nm}. It says ${snd}. Try again!` })),
      };
    },
  });

  // ---- the menu ("world") ----
  FL.scenes.world = {
    t: 0, buttons: [], music: 'kingdom', hud: null,
    enter() {
      this.t = 0; const g = G();
      this.buttons = [
        new UI.Button({ x: g.W / 2 - 200, y: g.H / 2 - 40, w: 400, h: 110, label: 'Animal Sounds', emoji: '🐶', color: '#4ade80', size: 40, pulse: true, onTap: () => G().go('sounds') }),
        new UI.Button({ x: 18, y: 18, w: 84, h: 84, emoji: '⚙️', color: '#a78bfa', round: true, emojiSize: 40, onTap: () => UI.showParent() }),
      ];
      if (FL.Save.data.firstRun) { FL.Save.data.firstRun = false; FL.Save.save(); FL.Audio.say('Welcome! Tap a game to play.'); }
    },
    resize() { this.enter(); },
    down(p) { UI.pressDown(this.buttons, p); },
    up(p) { UI.pressUp(this.buttons, p); },
    update(dt) { this.t += dt; },
    draw(ctx) {
      const g = G(); const t = this.t;
      const grad = ctx.createLinearGradient(0, 0, 0, g.H); grad.addColorStop(0, '#7dd3fc'); grad.addColorStop(1, '#bbf7d0'); ctx.fillStyle = grad; ctx.fillRect(0, 0, g.W, g.H);
      A.sun(ctx, g.W - 160, 160, 60, t); A.grass(ctx, g.W, g.H, g.H * 0.7, '#4ade80', '#15803d');
      A.text(ctx, FL.config.title, g.W / 2, 150, { size: 72, color: '#fff', stroke: '#4c1d95', strokeWidth: 8 });
      A.text(ctx, `${FL.Save.data.stars} ⭐ so far`, g.W / 2, 220, { size: 32, color: '#4c1d95' });
      this.buttons.forEach((b) => b.draw(ctx, t));
      A.princess(ctx, 200, g.H - 60, g.look, { t, facing: 1 }, 1);
    },
  };
})();
