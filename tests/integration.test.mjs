// Engine/scene contract tests in Node. No browser, pixel rendering or device claims.
import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { parseHTML } from 'linkedom';

function boot(game, activity = '') {
  const dir = resolve('games', game);
  const html = readFileSync(resolve(dir, 'index.html'), 'utf8');
  const { document, HTMLElement, HTMLCanvasElement } = parseHTML(html);
  const gradient = { addColorStop() {} };
  const ctx = new Proxy({}, { get(target, key) {
    if (key in target) return target[key];
    if (key === 'measureText') return text => ({ width: String(text).length * 15 });
    if (/^create.*Gradient$/.test(key)) return () => gradient;
    return () => {};
  }, set(target, key, value) { target[key] = value; return true; } });
  const listeners = {}, timers = new Map(), store = new Map();
  let serial = 0, now = 0;
  HTMLCanvasElement.prototype.getContext = () => ctx;
  HTMLCanvasElement.prototype.toDataURL = () => 'data:image/png;base64,AA==';
  HTMLElement.prototype.focus = function () {};
  HTMLElement.prototype.blur = function () {};
  HTMLElement.prototype.getBoundingClientRect = () => ({ left: 0, top: 0 });
  HTMLElement.prototype.setPointerCapture = () => {};
  const canvas = document.getElementById('game');
  canvas.addEventListener = (name, fn) => { listeners[name] = fn; };
  const sandbox = { document, console, URL, URLSearchParams, Map, Set, Math,
    innerWidth: 1280, innerHeight: 900, devicePixelRatio: 1,
    location: { search: activity ? `?activity=${activity}` : '', protocol: 'http:', hostname: 'localhost' },
    navigator: {}, performance: { now: () => now },
    requestAnimationFrame() {}, addEventListener() {},
    setTimeout(fn, ms = 0) { const id = ++serial; timers.set(id, { fn, at: now + ms }); return id; },
    clearTimeout(id) { timers.delete(id); }, setInterval() {}, clearInterval() {},
    fetch: async () => ({ ok: false }),
    localStorage: { getItem: key => store.get(key) || null, setItem: (key, value) => store.set(key, value) },
    Image: class { complete = false; naturalWidth = 0; },
  };
  sandbox.window = sandbox;
  vm.createContext(sandbox);
  for (const [, src] of html.matchAll(/<script src="([^"]+)"/g)) {
    vm.runInContext(readFileSync(resolve(dir, src), 'utf8'), sandbox, { filename: src });
  }
  const FL = sandbox.FL, G = FL.Game;
  function enter(name, params = {}) {
    G.scene?.exit?.(); FL.UI.closeOverlay();
    G.scene = FL.scenes[name]; G.sceneName = name; assert(G.scene, name);
    G.scene.enter?.(params);
  }
  function frames(seconds = 1) {
    for (let i = 0; i < seconds * 10; i++) {
      now += 100; G.dt = 0.1; G.time = now / 1000;
      for (const [id, timer] of timers) if (timer.at <= now) { timers.delete(id); timer.fn(); }
      G.scene.update?.(0.1); G.scene.draw?.(ctx);
    }
  }
  function tap(x, y) { const p = { id: 1, x, y, sx: x, sy: y, t: G.time }; G.scene.down?.(p); G.scene.up?.(p); }
  return { FL, G, ctx, enter, frames, tap, document, sandbox, listeners, store };
}

test('all three adventure documents boot against the same engine', () => {
  for (const id of ['melody', 'germs', 'castle']) {
    const a = boot(id); assert.equal(a.G.sceneName, 'title'); a.frames();
    a.enter(id === 'germs' ? 'town' : 'world'); a.frames();
  }
});
test('home adventure links open only allowed entry scenes', () => {
  for (const id of ['drawpick', 'puppy', 'spell']) {
    const a = boot('melody', id); assert.equal(a.G.sceneName, id); a.frames();
    assert.equal(a.document.getElementById('spellWrap').hidden, id !== 'spell');
  }
  assert.equal(boot('melody', 'drawing').G.sceneName, 'title');
});
test('Art Studio cancels a stroke and accepts another pointer', () => {
  const a = boot('melody', 'drawpick');
  a.enter('drawing', { id: a.FL.Drawings.list[0].id });
  const scene = a.G.scene;
  const p = { id: 1, x: scene.R.x + 20, y: scene.R.y + 20 };
  scene.down(p); assert(scene.cur);
  a.G.pointers.set(1, p); a.listeners.pointercancel({ pointerId: 1 });
  assert.equal(scene.cur, null); assert.equal(a.G.pointers.size, 0);
  scene.down({ ...p, id: 2 }); assert.equal(scene.cur.id, 2); a.frames();
});
test('Puppy adoption, feeding, pointer cancellation and save survival work after porting', () => {
  const a = boot('melody', 'puppy'); const scene = a.G.scene;
  let l = scene.layoutInfo();
  a.tap(l.adopt.pups[0].x, l.adopt.pups[0].y); a.frames(2);
  l = scene.layoutInfo(); a.tap(l.adopt.names[0].x, l.adopt.names[0].y);
  a.tap(l.adopt.confirm.x, l.adopt.confirm.y); a.frames(3);
  assert(a.FL.Save.data.dog.adopted);
  l = scene.layoutInfo(); const food = l.items.find(i => i.item === 'food');
  a.tap(food.x, food.y); a.tap(l.bowls.food.x, l.bowls.food.y); a.frames(8);
  assert(a.FL.Save.data.dog.chart.fed);
  const water = l.items.find(i => i.item === 'water');
  const p = { id: 3, x: water.x, y: water.y }; scene.down(p); scene.cancel(p);
  assert.equal(scene.layoutInfo().held, null);
  a.FL.Save.reset(); assert(a.FL.Save.data.dog.adopted);
  a.enter('puppy'); a.frames(); assert(a.FL.Save.data.dog.chart.fed);
});
test('Spelling Owl types and progresses through its visual letter sequence', () => {
  const a = boot('melody', 'spell');
  a.G.scene.input().value = 'how do you spell cat'; a.G.scene.submitTyped();
  assert.equal(a.G.scene.words.map(w => w.text).join(' '), 'cat');
  a.frames(10); assert.equal(a.G.scene.playing, false);
  a.enter('world'); a.frames();
});

test('all Castle Quest rooms initialize and run on the merged engine', () => {
  const a = boot('castle');
  for (const name of Object.keys(a.FL.scenes).filter(n => n !== 'title' && n !== 'world')) {
    a.enter(name); a.frames(3);
  }
});
