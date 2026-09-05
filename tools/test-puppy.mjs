// Puppy Cottage simulation tests: node tools/test-puppy.mjs (exit 0 on pass).
// Loads js/save.js + js/games/puppysim.js into a fake window/localStorage and checks the FL.Puppy contract.
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import vm from 'node:vm';
import assert from 'node:assert/strict';

process.env.TZ = 'America/New_York';   // a zone with DST, so the date-key tests are meaningful
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const store = {};
const localStorage = { getItem: (k) => (k in store ? store[k] : null), setItem: (k, v) => { store[k] = String(v); }, removeItem: (k) => { delete store[k]; } };
globalThis.window = globalThis; globalThis.localStorage = localStorage;   // the IIFEs attach to window.FL, as in the browser
for (const f of ['games/melody/js/config.js', 'engine/save.js', 'games/melody/js/games/puppysim.js']) vm.runInThisContext(readFileSync(path.join(root, f), 'utf8'), { filename: f });
const FL = globalThis.FL, P = FL.Puppy;
assert.ok(P, 'FL.Puppy registered');

// Contract §1 save shape (used for every test dog; injected into the save when save.js does not have it yet).
const CONTRACT_DOG = {
  adopted: false, name: '', pron: 0, coat: 0, born: '', stage: 0, points: 0, pendingGrow: '', rounds: 0,
  pointsDay: { key: '', n: 0 }, needs: { food: 70, water: 70, play: 60, potty: 20 }, lastSeen: 0, dancing: false, mud: 0, messes: [],
  chart: { key: '', fed: false, water: false, potty: false, clean: false, play: false, done: false },
  fetchCount: 0, lastRoundDay: '', week: [], tricks: { sit: 0, spin: 0, five: 0, roll: 0 }, assist: { bag: 0, ball: 0 },
  tutorialDone: false, crown: false, parties: 0, visits: 0, accidentsToday: { key: '', n: 0 },
};
const clone = (o) => JSON.parse(JSON.stringify(o));
if (!FL.Save.data.dog) { FL.Save.data.dog = clone(CONTRACT_DOG); console.log('note: save.js has no DEFAULTS.dog yet; injected the contract shape'); }
else for (const k of Object.keys(CONTRACT_DOG)) if (!(k in FL.Save.data.dog)) console.warn('warning: save.js DEFAULTS.dog is missing key', k);
if (typeof FL.Save.defaultDog === 'function') assert.equal(FL.Save.defaultDog().adopted, false, 'Save.defaultDog() returns an unadopted dog');

let n = 0;
const test = (name, fn) => { try { fn(); n++; } catch (e) { console.error('FAIL', name); throw e; } };
const D = (y, m, d, h = 10, mi = 0) => new Date(y, m - 1, d, h, mi);
const mk = (over = {}) => { const dog = clone(CONTRACT_DOG); Object.assign(dog, { adopted: true, name: 'Biscuit', pron: 0, born: '2026-09-01' }, over); if (over.needs) dog.needs = Object.assign(clone(CONTRACT_DOG.needs), over.needs); return dog; };
const near = (a, b, eps = 1e-6) => assert.ok(Math.abs(a - b) < eps, `${a} ~ ${b}`);

test('date keys use local getters', () => {
  assert.notEqual(D(2026, 1, 1).getTimezoneOffset(), D(2026, 7, 1).getTimezoneOffset(), 'test zone has DST');
  assert.equal(P.todayKey(D(2026, 3, 8, 23, 30)), '2026-03-08');            // toISOString would say 03-09 (UTC)
  assert.equal(P.todayKey(D(2026, 1, 5, 0, 10)), '2026-01-05');
  assert.equal(P.todayKey(D(2026, 12, 25).getTime()), '2026-12-25');        // ms number accepted
  assert.match(P.todayKey(), /^\d{4}-\d{2}-\d{2}$/);
  assert.equal(P.roundKey(D(2026, 3, 8, 14, 59)), '2026-03-08-am');
  assert.equal(P.roundKey(D(2026, 3, 8, 15, 0)), '2026-03-08-pm');
  assert.equal(P.isMorning(D(2026, 3, 8, 0)), true); assert.equal(P.isMorning(D(2026, 3, 8, 23)), false);
});
test('dayDiff is DST safe', () => {
  assert.equal(P.dayDiff('2026-03-07', '2026-03-09'), 2);     // spring forward on 2026-03-08 (23 h day)
  assert.equal(P.dayDiff('2026-03-08', '2026-03-09'), 1);
  assert.equal(P.dayDiff('2026-10-31', '2026-11-02'), 2);     // fall back on 2026-11-01 (25 h day)
  assert.equal(P.dayDiff('2026-11-01', '2026-11-02'), 1);
  assert.equal(P.dayDiff('2026-12-31', '2027-01-01'), 1);
  assert.equal(P.dayDiff('2026-09-05', '2026-09-05'), 0);
  assert.equal(P.dayDiff('2026-09-05', '2026-09-01'), -4);
});
test('age', () => {
  assert.equal(P.age(mk({ adopted: false }), D(2026, 9, 5)), 0);
  assert.equal(P.age(mk({ born: '2026-09-01' }), D(2026, 9, 5)), 4);
  assert.equal(P.age(mk({ born: '2026-09-09' }), D(2026, 9, 5)), 0);   // clock moved back -> never negative
});
test('L() substitutions for both pronoun sets', () => {
  const he = mk({ name: 'Max', pron: 0 }), she = mk({ name: 'Luna', pron: 1 });
  const s = '{name}: {He} said {he} wants {his} ball. Give it to {him}, good {boy}!';
  assert.equal(P.L(he, s), 'Max: He said he wants his ball. Give it to him, good boy!');
  assert.equal(P.L(she, s), 'Luna: She said she wants her ball. Give it to her, good girl!');
  assert.equal(P.L(he, '{meal} {round}', D(2026, 9, 5, 9)), 'breakfast morning');
  assert.equal(P.L(he, '{meal} {round}', D(2026, 9, 5, 18)), 'dinner evening');
  assert.equal(P.L(he, P.LINES.lockedTrick, null, { trick: 'Spin' }), "Max will learn Spin when he's bigger!");
  assert.equal(P.L(he, 'keep {unknown}'), 'keep {unknown}');
  assert.equal(P.L(mk({ name: '' }), '{name}'), 'Puppy');
});
test('tick decays with floors and potty pause', () => {
  const dog = mk({ needs: { food: 12, water: 50, play: 10.5, potty: 20 } });
  P.tick(dog, 60);
  near(dog.needs.food, 10.8); near(dog.needs.water, 48.5); assert.equal(dog.needs.play, 10); near(dog.needs.potty, 21);
  P.tick(dog, 600); assert.equal(dog.needs.food, 10); assert.equal(dog.needs.water, 33.5); assert.equal(dog.needs.play, 10); assert.equal(dog.needs.potty, 31);
  const low = mk({ needs: { food: 5 } }); P.tick(low, 60); assert.equal(low.needs.food, 5);            // never lowers a value already under the floor
  const full = mk({ needs: { potty: 99.9 } }); P.tick(full, 600); assert.equal(full.needs.potty, 100);   // clamps at 100
  const now = D(2026, 9, 5, 12);
  const held = mk({ needs: { potty: 94 }, accidentsToday: { key: P.todayKey(now), n: 2 } }); P.tick(held, 600, now); assert.equal(held.needs.potty, 95);
  P.tick(held, 600, now); assert.equal(held.needs.potty, 95);
  const stale = mk({ needs: { potty: 94 }, accidentsToday: { key: '2026-09-04', n: 2 } }); P.tick(stale, 600, now); assert.equal(stale.needs.potty, 100);
});
test('applyAway: idempotent without lastSeen, negative clock, cap, floors', () => {
  const fresh = mk({ needs: { food: 12, water: 90, play: 20, potty: 85 }, dancing: true }); const snap = clone(fresh.needs);
  let r = P.applyAway(fresh, D(2026, 9, 5)); assert.deepEqual(r, { elapsedMin: 0, accident: false }); assert.deepEqual(fresh.needs, snap); assert.equal(fresh.awayMin, 0); assert.equal(fresh.messes.length, 0);
  const now = D(2026, 9, 5, 12).getTime();
  const back = mk({ lastSeen: now + 3600e3, needs: { food: 100, potty: 20 } }); r = P.applyAway(back, now); assert.equal(r.elapsedMin, 0); assert.equal(back.needs.food, 100); assert.equal(back.needs.potty, 20);
  const short = mk({ lastSeen: now - 30 * 60e3, needs: { food: 100, water: 100, play: 100, potty: 20 } }); r = P.applyAway(short, now);
  assert.equal(r.elapsedMin, 30); assert.equal(r.accident, false); near(short.needs.food, 89.2); near(short.needs.water, 86.5); near(short.needs.play, 86.5); near(short.needs.potty, 29); assert.equal(short.awayMin, 30);
  const week = mk({ lastSeen: now - 7 * 864e5, needs: { food: 100, water: 100, play: 100, potty: 0 } }); r = P.applyAway(week, now);
  assert.equal(r.elapsedMin, 480); assert.equal(week.needs.food, 30); assert.equal(week.needs.water, 30); assert.equal(week.needs.play, 30); assert.equal(week.needs.potty, 70);
  const raised = mk({ lastSeen: now - 60e3, needs: { food: 12, potty: 20 } }); P.applyAway(raised, now); assert.equal(raised.needs.food, 30);   // never in crisis on return
  const walk = mk({ lastSeen: now - 90 * 60e3, needs: { potty: 0 } }); P.applyAway(walk, now); assert.equal(walk.needs.potty, 70);
  const noWalk = mk({ lastSeen: now - 89 * 60e3, needs: { potty: 0 } }); P.applyAway(noWalk, now); near(noWalk.needs.potty, 26.7);
  assert.equal(P.applyAway(mk({ lastSeen: now - 5 * 60e3, needs: { potty: 90 } }), new Date(now)).elapsedMin, 5);   // Date and ms both accepted
});
test('applyAway accident rule', () => {
  const now = D(2026, 9, 5, 12).getTime();
  const d1 = mk({ lastSeen: now - 10 * 60e3, dancing: true, needs: { potty: 92 } }); let r = P.applyAway(d1, now);
  assert.equal(r.accident, true); assert.deepEqual(d1.messes, [{ x: 0.45, y: 0.85, inside: true }]); assert.equal(d1.needs.potty, 0); assert.equal(d1.dancing, false);
  r = P.applyAway(d1, now + 60e3); assert.equal(r.accident, false); assert.equal(d1.messes.length, 1);          // at most one waiting
  const d2 = mk({ lastSeen: now - 10 * 60e3, dancing: true, needs: { potty: 92 }, messes: [{ x: 0.5, y: 0.5, inside: false }] }); r = P.applyAway(d2, now);
  assert.equal(r.accident, false); assert.equal(d2.messes.length, 1); assert.equal(d2.needs.potty, 70); assert.equal(d2.dancing, true);
  const d3 = mk({ lastSeen: now - 10 * 60e3, dancing: false, needs: { potty: 92 } }); r = P.applyAway(d3, now); assert.equal(r.accident, false); assert.equal(d3.messes.length, 0); assert.equal(d3.needs.potty, 70);
});
test('touch', () => { const dog = mk(); P.touch(dog, D(2026, 9, 5, 12)); assert.equal(dog.lastSeen, D(2026, 9, 5, 12).getTime()); P.touch(dog); assert.ok(Date.now() - dog.lastSeen < 1000); });
test('needState / worst / mood', () => {
  const s = (needs, k) => P.needState(mk({ needs }), k);
  assert.equal(s({ food: 60 }, 'food'), 'fine'); assert.equal(s({ food: 59 }, 'food'), 'low'); assert.equal(s({ food: 30 }, 'food'), 'low'); assert.equal(s({ food: 29 }, 'food'), 'needs');
  assert.equal(s({ potty: 49 }, 'potty'), 'fine'); assert.equal(s({ potty: 50 }, 'potty'), 'low'); assert.equal(s({ potty: 69 }, 'potty'), 'low'); assert.equal(s({ potty: 70 }, 'potty'), 'needs');
  assert.equal(P.worst(mk({ needs: { food: 70, water: 70, play: 60, potty: 20 } })), null);
  assert.deepEqual(P.worst(mk({ needs: { food: 20, water: 20, play: 60, potty: 80 } })), { need: 'potty', state: 'needs' });
  assert.deepEqual(P.worst(mk({ needs: { food: 20, water: 20, play: 60, potty: 20 } })), { need: 'food', state: 'needs' });
  assert.deepEqual(P.worst(mk({ needs: { food: 40, water: 20, play: 60, potty: 55 } })), { need: 'water', state: 'needs' });
  assert.deepEqual(P.worst(mk({ needs: { food: 70, water: 70, play: 40, potty: 20 } })), { need: 'play', state: 'low' });
  assert.equal(P.mood(mk()), 'happy'); assert.equal(P.mood(mk({ needs: { play: 40 } })), 'neutral'); assert.equal(P.mood(mk({ needs: { potty: 75 } })), 'pout');
});
test('project is pure and applies the offline formula to a copy', () => {
  const now = D(2026, 9, 5, 12).getTime();
  const dog = mk({ lastSeen: now - 120 * 60e3, dancing: false, needs: { food: 100, water: 100, play: 100, potty: 10 } }); const snap = JSON.stringify(dog);
  assert.equal(P.project(dog, now), 'potty'); assert.equal(JSON.stringify(dog), snap);
  assert.equal(P.project(mk({ lastSeen: now - 5 * 60e3, needs: { food: 100, water: 100, play: 100, potty: 10 } }), now), null);
  const hungry = mk({ lastSeen: 0, needs: { food: 12 } }); const s2 = JSON.stringify(hungry); assert.equal(P.project(hungry, now), 'food'); assert.equal(JSON.stringify(hungry), s2);
  assert.equal(P.project(mk({ lastSeen: now - 480 * 60e3, dancing: true, needs: { potty: 95 } }), now), null);   // accident on the copy drains potty; original untouched
});
test('syncRound resets the chart on a new round', () => {
  const dog = mk(); const am = D(2026, 9, 5, 9), pm = D(2026, 9, 5, 16);
  assert.equal(P.syncRound(dog, am), true); assert.deepEqual(dog.chart, { key: '2026-09-05-am', fed: false, water: false, potty: false, clean: false, play: false, done: false });
  dog.chart.fed = true; dog.fetchCount = 2; assert.equal(P.syncRound(dog, am), false); assert.equal(dog.chart.fed, true); assert.equal(dog.fetchCount, 2);
  assert.equal(P.syncRound(dog, pm), true); assert.equal(dog.chart.key, '2026-09-05-pm'); assert.equal(dog.chart.fed, false); assert.equal(dog.fetchCount, 0);
});
test('stamp: remaining, already, completion, 10/day cap', () => {
  const dog = mk(); const am = D(2026, 9, 5, 9), pm = D(2026, 9, 5, 16), next = D(2026, 9, 6, 9);
  let r = P.stamp(dog, 'fed', am); assert.deepEqual(r, { already: false, remaining: 4, complete: false, grewPending: false }); assert.equal(dog.points, 1); assert.deepEqual(dog.pointsDay, { key: '2026-09-05', n: 1 });
  r = P.stamp(dog, 'fed', am); assert.deepEqual(r, { already: true, remaining: 4, complete: false, grewPending: false }); assert.equal(dog.points, 1);
  assert.equal(P.stamp(dog, 'water', am).remaining, 3); assert.equal(P.stamp(dog, 'potty', am).remaining, 2); assert.equal(P.stamp(dog, 'clean', am).remaining, 1);
  r = P.stamp(dog, 'play', am); assert.equal(r.remaining, 0); assert.equal(r.complete, true); assert.equal(dog.points, 5); assert.equal(dog.chart.done, false);
  P.completeRound(dog, am); assert.equal(dog.chart.done, true); assert.equal(dog.rounds, 1); assert.deepEqual(dog.week, ['2026-09-05']); assert.equal(dog.lastRoundDay, '2026-09-05');
  r = P.stamp(dog, 'play', am); assert.equal(r.already, true); assert.equal(r.complete, false);
  for (const j of P.JOBS) r = P.stamp(dog, j, pm); assert.equal(r.complete, true); assert.equal(dog.points, 10); assert.equal(dog.chart.key, '2026-09-05-pm');
  P.completeRound(dog, pm); assert.equal(dog.rounds, 2); assert.deepEqual(dog.week, ['2026-09-05']);                       // distinct days only
  const capped = mk({ pointsDay: { key: '2026-09-05', n: 10 }, points: 10 }); r = P.stamp(capped, 'fed', pm); assert.equal(r.already, false); assert.equal(capped.points, 10); assert.equal(capped.chart.fed, true);
  r = P.stamp(capped, 'water', next); assert.equal(capped.points, 11); assert.deepEqual(capped.pointsDay, { key: '2026-09-06', n: 1 });   // new day resets the cap
  const nine = mk({ pointsDay: { key: '2026-09-05', n: 9 }, points: 9 }); P.stamp(nine, 'fed', pm); P.stamp(nine, 'water', pm); assert.equal(nine.points, 10);
  const wk = mk({ week: ['a', 'b', 'c', 'd', 'e', 'f', 'g'] }); P.syncRound(wk, am); P.completeRound(wk, am); assert.deepEqual(wk.week, ['b', 'c', 'd', 'e', 'f', 'g', '2026-09-05']);
});
test('canGrow gates on points and age', () => {
  const today = D(2026, 9, 5, 9);
  assert.equal(P.canGrow(mk({ stage: 0, points: 5, born: '2026-09-05' }), today), false);   // age 0 < 1
  assert.equal(P.canGrow(mk({ stage: 0, points: 5, born: '2026-09-04' }), today), true);
  assert.equal(P.canGrow(mk({ stage: 0, points: 4, born: '2026-09-01' }), today), false);   // points
  assert.equal(P.canGrow(mk({ stage: 1, points: 15, born: '2026-09-03' }), today), false);  // age 2 < 3
  assert.equal(P.canGrow(mk({ stage: 1, points: 15, born: '2026-09-02' }), today), true);
  assert.equal(P.canGrow(mk({ stage: 2, points: 30, born: '2026-08-30' }), today), true);
  assert.equal(P.canGrow(mk({ stage: 3, points: 99, born: '2026-01-01' }), today), false);
});
test('checkGrow / shouldCeremony / grow', () => {
  const today = D(2026, 9, 5, 9), tomorrow = D(2026, 9, 6, 9);
  const dog = mk({ stage: 0, points: 4, born: '2026-09-04' });
  assert.equal(P.checkGrow(dog, today), false); assert.equal(dog.pendingGrow, '');
  const r = P.stamp(dog, 'fed', today); assert.equal(r.grewPending, true); assert.equal(dog.pendingGrow, '2026-09-05');
  assert.equal(P.checkGrow(dog, today), false);                                       // only reported once
  assert.equal(P.shouldCeremony(dog, today), false);                                  // same day: nothing yet
  assert.equal(P.shouldCeremony(dog, tomorrow), true);                                // next day's enter()
  const overnight = mk({ stage: 0, points: 5, born: '2026-09-05' }); assert.equal(P.shouldCeremony(overnight, today), false); assert.equal(P.shouldCeremony(overnight, tomorrow), true);   // age gate crossed overnight
  assert.equal(P.shouldCeremony(mk({ stage: 0, points: 2 }), tomorrow), false);
  assert.equal(P.grow(dog), 1); assert.equal(dog.pendingGrow, ''); assert.equal(dog.stage, 1);
  assert.equal(P.grow(mk({ stage: 3 })), 3);
});
test('boneFraction / greetingKind / dogEmoji', () => {
  assert.equal(P.boneFraction(mk({ stage: 0, points: 2 })), 0.4); assert.equal(P.boneFraction(mk({ stage: 1, points: 10 })), 0.5); assert.equal(P.boneFraction(mk({ stage: 2, points: 40 })), 1);
  assert.equal(P.boneFraction(mk({ stage: 3, points: 40 })), 0.5); assert.equal(P.boneFraction(mk({ stage: 3, points: 50 })), 1); assert.equal(P.boneFraction(mk({ stage: 3, points: 70 })), 1);
  const today = D(2026, 9, 5, 9);
  assert.equal(P.greetingKind(mk({ visits: 0 }), today), 'first');
  assert.equal(P.greetingKind(mk({ visits: 3, lastRoundDay: '2026-09-05' }), today), 'recent');
  assert.equal(P.greetingKind(mk({ visits: 3, lastRoundDay: '2026-09-04' }), today), 'recent');
  assert.equal(P.greetingKind(mk({ visits: 3, lastRoundDay: '2026-09-03' }), today), 'gap');
  assert.equal(P.greetingKind(mk({ visits: 3, lastRoundDay: '' }), today), 'gap');
  assert.equal(P.dogEmoji(mk({ stage: 2 })), '🐶'); assert.equal(P.dogEmoji(mk({ stage: 3 })), '🐕');
});
test('tricks', () => {
  const pup = mk({ stage: 0 }); assert.deepEqual(P.trickState(pup, 'sit'), { unlocked: false, count: 0, learned: false });
  assert.deepEqual(P.performTrick(pup, 'sit'), { count: 0, learnedNow: false, wobbly: false }); assert.equal(pup.tricks.sit, 0);
  const dog = mk({ stage: 2 }); assert.equal(P.trickState(dog, 'spin').unlocked, true); assert.equal(P.trickState(dog, 'roll').unlocked, false);
  assert.deepEqual(P.performTrick(dog, 'sit'), { count: 1, learnedNow: false, wobbly: true });
  assert.deepEqual(P.performTrick(dog, 'sit'), { count: 2, learnedNow: false, wobbly: true });
  assert.deepEqual(P.performTrick(dog, 'sit'), { count: 3, learnedNow: true, wobbly: false });
  assert.deepEqual(P.performTrick(dog, 'sit'), { count: 3, learnedNow: false, wobbly: false });
  assert.deepEqual(P.trickState(dog, 'sit'), { unlocked: true, count: 3, learned: true });
});
test('feed / water / play / potty / messes', () => {
  const dog = mk({ needs: { food: 81, water: 81, play: 60, potty: 20 } });
  assert.equal(P.feed(dog), false); assert.equal(dog.needs.food, 81); assert.equal(P.water(dog), false);
  dog.needs.food = 80; dog.needs.water = 80; assert.equal(P.feed(dog), true); assert.equal(dog.needs.food, 100); assert.equal(dog.needs.potty, 50);
  assert.equal(P.water(dog), true); assert.equal(dog.needs.water, 100); assert.equal(dog.needs.potty, 70);
  dog.needs.potty = 95; dog.needs.water = 50; P.water(dog); assert.equal(dog.needs.potty, 100);
  assert.equal(P.addPlay(dog, 25), 85); assert.equal(P.addPlay(dog, 25), 100);
  assert.equal(P.canPotty(mk({ needs: { potty: 34 } })), false); assert.equal(P.canPotty(mk({ needs: { potty: 35 } })), true);
  dog.dancing = true; assert.equal(P.pottyOutside(dog, 0.8, 0.8), true); assert.equal(dog.needs.potty, 0); assert.equal(dog.dancing, false); assert.deepEqual(dog.messes, [{ x: 0.8, y: 0.8, inside: false }]);
  const now = D(2026, 9, 5, 12); dog.needs.potty = 100; dog.dancing = true;
  assert.equal(P.accident(dog, 0.3, 0.7, now), true); assert.equal(dog.messes.length, 2); assert.deepEqual(dog.messes[1], { x: 0.3, y: 0.7, inside: true }); assert.deepEqual(dog.accidentsToday, { key: '2026-09-05', n: 1 }); assert.equal(dog.needs.potty, 0);
  dog.needs.potty = 100; assert.equal(P.accident(dog, 0.3, 0.7, now), false); assert.equal(dog.messes.length, 2); assert.equal(dog.needs.potty, 100); assert.equal(dog.accidentsToday.n, 1);
  P.pottyOutside(dog, 0.9, 0.9); assert.equal(dog.messes.length, 2);   // capped at 2
  P.removeMess(dog, 0); assert.equal(dog.messes.length, 1); assert.equal(dog.messes[0].inside, true); P.removeMess(dog, 5); assert.equal(dog.messes.length, 1);
  const stale = mk({ accidentsToday: { key: '2026-09-04', n: 2 } }); P.accident(stale, 0.5, 0.5, now); assert.deepEqual(stale.accidentsToday, { key: '2026-09-05', n: 1 });
});
test('LINES catalogue, posterLine, boneLine', () => {
  const keys = 'adopt1 adopt2 adoptDone hiRecent hiGap needFood needWater needPotty needPlay happy lowFood lowWater lowPotty lowPlay tapBowl tapThrow tapPoop tapBin tapBrush fullTummy notThirsty useBag bagBin cleanFirst noPotty throwAnywhere sleeping fed watered pottyDone bagged cleaned throw1 throw2 fetched clean loves accident holding alreadyFed alreadyWater alreadyPotty alreadyClean alreadyPlay oneMore roundDone comeBack poster bone1 bone2 bone3 growTonight growSleep growUp grownUp crown trickCmd_sit trickCmd_spin trickCmd_five trickCmd_roll tryAgain goodDog learned_sit learned_spin learned_five learned_roll lockedTrick tooLittle party muddy brushed nap sweet morning'.split(' ');
  for (const k of keys) assert.equal(typeof P.LINES[k], 'string', 'LINES.' + k);
  for (const dog of [mk({ pron: 0 }), mk({ pron: 1, name: 'Rosie' })]) for (const k of Object.keys(P.LINES)) { const out = P.L(dog, P.LINES[k], null, { trick: 'Spin' }); assert.ok(!/[{}]/.test(out), k + ': ' + out); }
  assert.equal(P.L(mk({ pron: 1, name: 'Rosie' }), P.LINES.fetched), 'Good girl! She brought it back!');
  assert.equal(P.L(mk(), P.LINES.fed, D(2026, 9, 5, 8)), 'Yum! Biscuit loves his breakfast.');
  const am = D(2026, 9, 5, 9), dog = mk();
  assert.equal(P.posterLine(dog, am), "Today's morning jobs: Still to do: fed, water, potty walk, clean-up and play.");
  P.stamp(dog, 'fed', am); P.stamp(dog, 'water', am);
  assert.equal(P.posterLine(dog, am), "Today's morning jobs: Fed, check! Water, check! Still to do: potty walk, clean-up and play.");
  assert.equal(P.posterLine(dog, D(2026, 9, 5, 16)), "Today's evening jobs: Still to do: fed, water, potty walk, clean-up and play.");   // stale chart reads as unstamped
  for (const j of P.JOBS) P.stamp(dog, j, am); assert.equal(P.posterLine(dog, am), "Today's morning jobs: Fed, check! Water, check! Potty walk, check! Clean-up, check! Play, check! Every job is done!");
  assert.equal(P.boneLine(mk({ stage: 0, points: 2 }), am), "Keep taking care of him and he'll grow big and strong.");
  assert.equal(P.boneLine(mk({ stage: 0, points: 3 }), am), 'Biscuit is almost ready to grow!');
  assert.equal(P.boneLine(mk({ stage: 0, points: 5, born: '2026-09-05' }), am), 'Biscuit is going to grow very soon!');   // full but age-gated
  assert.equal(P.boneLine(mk({ stage: 3, points: 50 }), am), 'Biscuit is a Royal Pup now!');
});
test('constants match the contract', () => {
  assert.equal(P.NAMES.length, 8); assert.deepEqual(P.NAMES.map((x) => x.pron), [0, 0, 0, 0, 1, 1, 1, 1]);
  assert.deepEqual(P.STAGES.map((s) => [s.points, s.age]), [[0, 0], [5, 1], [15, 3], [30, 6]]);
  assert.deepEqual(P.TRICKS.map((t) => t.id), ['sit', 'spin', 'five', 'roll']); assert.deepEqual(P.JOBS, ['fed', 'water', 'potty', 'clean', 'play']); assert.deepEqual(P.NEEDS, ['food', 'water', 'play', 'potty']);
  assert.deepEqual(P.RATES, { food: 1.2, water: 1.5, play: 1.5, potty: 1.0 });
  for (const f of 'todayKey roundKey isMorning dayDiff age L tick applyAway touch needState worst mood project syncRound stamp completeRound canGrow checkGrow shouldCeremony grow boneFraction greetingKind trickState performTrick addPlay feed water canPotty pottyOutside accident removeMess dogEmoji posterLine boneLine'.split(' ')) assert.equal(typeof P[f], 'function', 'P.' + f);
});
console.log(`puppysim: ${n} test groups passed (TZ=${process.env.TZ})`);
