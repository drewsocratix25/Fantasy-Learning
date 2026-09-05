// Unit test for engine/save.js merge rules (runs in Node, no browser). Usage: node tools/test-save.mjs
import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';
const mem = {}; globalThis.localStorage = { getItem: (k) => (k in mem ? mem[k] : null), setItem: (k, v) => { mem[k] = String(v); }, removeItem: (k) => { delete mem[k]; } };
globalThis.window = globalThis; window.FL = { config: { storageKey: 'test.v1' } };
new Function(readFileSync(new URL('../engine/save.js', import.meta.url), 'utf8'))();
const S = FL.Save;

// 1. merging nothing changes nothing
assert.equal(S.merge(null), false); assert.equal(S.merge({}), false);

// 2. achievements combine, never lost
S.addStars(5); S.unlock('🦄'); S.levelUp('letters'); S.give('crown', 'flower'); S.data.name = 'Ava'; S.save();
const remote = { stars: 9, unlocked: ['🐰', '🐉'], items: ['wand:star'], levels: { letters: 3, numbers: 2 }, plays: { letters: 4 }, songBest: { twinkle: 3 }, regions: 2, name: 'Zoe', companion: '🐉', updatedAt: Date.now() + 1000 };
assert.equal(S.merge(remote), true);
assert.equal(S.data.stars, 9);
assert.deepEqual(S.data.unlocked.sort(), ['🐉', '🐰', '🦄'].sort());
assert.deepEqual(S.data.items.sort(), ['crown:flower', 'wand:star']);
assert.equal(S.data.levels.letters, 3); assert.equal(S.data.levels.numbers, 2);
assert.equal(S.data.regions, 2); assert.equal(S.data.songBest.twinkle, 3);
// remote was newer, so preferences follow it
assert.equal(S.data.name, 'Zoe'); assert.equal(S.data.companion, '🐉');

// 3. an older remote does not override preferences, but still contributes achievements
const older = { stars: 1, unlocked: ['🦊'], name: 'Old', updatedAt: 1 };
assert.equal(S.merge(older), true);
assert.equal(S.data.name, 'Zoe'); assert.ok(S.data.unlocked.includes('🦊')); assert.equal(S.data.stars, 9);

// 4. merge is idempotent and persisted
assert.equal(S.merge(older), false);
assert.equal(JSON.parse(mem['test.v1']).stars, 9);

// 5. onChange fires on save(), not on merge()
let fired = 0; S.onChange = () => fired++; S.addStars(1); assert.equal(fired, 1); S.merge({ stars: 100, updatedAt: 5 }); assert.equal(fired, 1); assert.equal(S.data.stars, 100);

// 6. snapshot is a copy
const snap = S.snapshot(); snap.stars = 0; assert.equal(S.data.stars, 100);

// 7. game-specific fields (a game may store its own keys) survive a merge
S.merge({ badges: ['soap'], updatedAt: Date.now() + 5000 }); assert.deepEqual(S.data.badges, ['soap']);
console.log('save.js merge: all checks passed');
