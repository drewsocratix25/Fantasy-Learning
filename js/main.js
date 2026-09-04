// Game bootstrap: canvas scaling, input, scene manager, main loop.
(function () {
  const G = { W: 1280, H: 900, time: 0, dt: 0, scene: null, sceneName: null, scenes: FL.scenes, keys: {}, fx: null, pointers: new Map(), transition: null, look: null, canvas: null, ctx: null };
  FL.Game = G;

  const canvas = document.getElementById('game'); const ctx = canvas.getContext('2d');
  G.canvas = canvas; G.ctx = ctx;
  let scale = 1, offX = 0, offY = 0;
  function resize() {
    const vw = window.innerWidth, vh = window.innerHeight; const aspect = vw / vh;
    G.H = 900; G.W = Math.round(Math.max(1200, Math.min(1700, 900 * aspect)));
    scale = Math.min(vw / G.W, vh / G.H);
    const cw = Math.round(G.W * scale), ch = Math.round(G.H * scale);
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = Math.round(cw * dpr); canvas.height = Math.round(ch * dpr);
    canvas.style.width = cw + 'px'; canvas.style.height = ch + 'px';
    offX = (vw - cw) / 2; offY = (vh - ch) / 2;
    ctx.setTransform(scale * dpr, 0, 0, scale * dpr, 0, 0);
    G.scale = scale; G.offX = offX; G.offY = offY;
    const rot = document.getElementById('rotate'); rot.hidden = !(vh > vw * 1.15 && 'ontouchstart' in window);
    if (G.scene && G.scene.resize) G.scene.resize();
  }
  window.addEventListener('resize', resize); window.addEventListener('orientationchange', () => setTimeout(resize, 200));

  function toLogical(e) { const r = canvas.getBoundingClientRect(); return { x: (e.clientX - r.left) / scale, y: (e.clientY - r.top) / scale }; }

  // ---- scenes ----
  G.register = function (name, scene) { G.scenes[name] = scene; };
  G.go = function (name, params) {
    if (G.transition) return;
    FL.Audio.hush();
    G.transition = { phase: 'out', t: 0, name, params };
  };
  function switchScene(name, params) {
    if (G.scene && G.scene.exit) G.scene.exit();
    FL.UI.closeOverlay(); G.pointers.clear();
    if (!G.scenes[name]) { console.warn('missing scene', name); name = 'world'; }
    G.scene = G.scenes[name]; G.sceneName = name;
    G.look = FL.Art.PRINCESSES[FL.Save.data.princess] || FL.Art.PRINCESSES[0];
    if (FL.Save.data.dress) { G.look = Object.assign({}, G.look, { dress: FL.Save.data.dress[0], dressDark: FL.Save.data.dress[1] }); }
    document.getElementById('nameWrap').hidden = name !== 'title';
    if (G.scene.enter) G.scene.enter(params || {});
  }

  // ---- input ----
  function onDown(e) {
    e.preventDefault(); FL.Audio.unlock();
    const p = toLogical(e); p.id = e.pointerId; p.sx = p.x; p.sy = p.y; p.t = G.time;
    G.pointers.set(e.pointerId, p);
    try { canvas.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
    if (G.transition) return;
    if (FL.UI.overlayDown(p)) return;
    if (G.scene && G.scene.hud && FL.UI.hudDown(p, G.scene.hud)) return;
    if (G.scene && G.scene.down) G.scene.down(p);
  }
  function onMove(e) {
    const p = G.pointers.get(e.pointerId); if (!p) return;
    const l = toLogical(e); p.x = l.x; p.y = l.y;
    if (G.transition || FL.UI.overlayActive()) return;
    if (G.scene && G.scene.move) G.scene.move(p);
  }
  function onUp(e) {
    const p = G.pointers.get(e.pointerId); if (!p) return;
    const l = toLogical(e); p.x = l.x; p.y = l.y; G.pointers.delete(e.pointerId);
    if (G.transition) return;
    if (FL.UI.overlayUp(p)) return;
    if (G.scene && G.scene.hud && FL.UI.hudUp(p, G.scene.hud)) return;
    if (G.scene && G.scene.up) G.scene.up(p);
  }
  canvas.addEventListener('pointerdown', onDown); canvas.addEventListener('pointermove', onMove);
  canvas.addEventListener('pointerup', onUp); canvas.addEventListener('pointercancel', onUp);
  canvas.addEventListener('contextmenu', (e) => e.preventDefault());
  // iOS Safari: block pinch-zoom and double-tap zoom gestures over the game.
  document.addEventListener('gesturestart', (e) => e.preventDefault());
  document.addEventListener('touchmove', (e) => { if (e.scale && e.scale !== 1) e.preventDefault(); }, { passive: false });
  window.addEventListener('keydown', (e) => {
    if (e.target && e.target.tagName === 'INPUT') return;
    G.keys[e.key] = true; FL.Audio.unlock();
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) e.preventDefault();
    if (G.scene && G.scene.key && !G.transition && !FL.UI.overlayActive()) G.scene.key(e.key, e);
  });
  window.addEventListener('keyup', (e) => { G.keys[e.key] = false; });
  window.addEventListener('blur', () => { G.keys = {}; });

  // ---- loop ----
  let last = performance.now();
  function frame(now) {
    let dt = (now - last) / 1000; last = now; if (dt > 0.1) dt = 0.1; G.dt = dt; G.time += dt;
    // transition
    if (G.transition) {
      const tr = G.transition; tr.t += dt;
      if (tr.phase === 'out' && tr.t >= 0.4) { switchScene(tr.name, tr.params); tr.phase = 'in'; tr.t = 0; }
      else if (tr.phase === 'in' && tr.t >= 0.45) G.transition = null;
    }
    if (G.scene && G.scene.update) G.scene.update(dt);
    G.fx.update(dt); FL.UI.updateOverlay(dt);
    // draw
    ctx.save(); ctx.beginPath(); ctx.rect(0, 0, G.W, G.H); ctx.clip();
    if (G.scene && G.scene.draw) G.scene.draw(ctx);
    if (G.scene && G.scene.hud) FL.UI.drawHUD(ctx, G.scene.hud);
    G.fx.draw(ctx);
    FL.UI.drawOverlay(ctx); FL.UI.drawToasts(ctx, dt);
    if (G.transition) drawTransition(ctx, G.transition);
    ctx.restore();
    requestAnimationFrame(frame);
  }
  function drawTransition(ctx, tr) {
    const maxR = Math.hypot(G.W, G.H) / 2 + 60; let r;
    if (tr.phase === 'out') { const k = Math.min(1, tr.t / 0.4); r = maxR * (1 - k * k); }
    else { const k = Math.min(1, tr.t / 0.45); r = maxR * (k * k); }
    ctx.save(); ctx.fillStyle = '#4c1d95'; ctx.beginPath(); ctx.rect(0, 0, G.W, G.H); FL.Art.starPath(ctx, G.W / 2, G.H / 2, Math.max(0, r) * 1.6, Math.max(0, r) * 0.9, 5); ctx.fill('evenodd'); ctx.restore();
  }

  // ---- boot ----
  G.fx = new FL.Art.Particles();
  resize();
  switchScene('title', {});
  requestAnimationFrame(frame);
  if ('serviceWorker' in navigator && location.protocol.startsWith('http') && !/localhost|127\.0\.0\.1/.test(location.hostname)) {
    window.addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));
  }
  if (document.fonts && document.fonts.load) { document.fonts.load('700 40px Fredoka').catch(() => {}); }
})();
