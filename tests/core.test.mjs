import test from "node:test";
import assert from "node:assert/strict";
import vm from "node:vm";
import { readFileSync } from "node:fs";
import {
  ACTIVITIES,
  defaults,
  sanitize,
  finishSession,
  levelFor,
  newRound,
  shuffle,
} from "../app/core.mjs";

function seeded(seed) {
  return () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 4294967296;
  };
}
test("every level always produces a solvable, bounded learning activity", () => {
  for (const a of ACTIVITIES)
    for (let level = 1; level <= 3; level++)
      for (let i = 0; i < 300; i++) {
        const r = newRound(a.id, level, i % 5, seeded(i));
        if (a.id === "count") {
          assert(r.target <= r.total);
          assert(r.choices.includes(r.target));
          assert.equal(new Set(r.choices).size, r.choices.length);
          assert(r.target >= 1 && r.target <= 10);
        }
        if (a.id === "letters") {
          assert.equal(r.choices.filter((c) => c === r.word[0]).length, 1);
          assert.equal(new Set(r.choices).size, r.choices.length);
        }
        if (a.id === "shapes")
          assert.equal(
            r.choices.filter(
              (c) => c.shape === r.shape && c.color.name === r.color.name,
            ).length,
            1,
          );
        if (a.id === "patterns") assert(r.choices.includes(r.target));
        if (a.id === "music") {
          assert(r.sequence.length >= 2 && r.sequence.length <= 5);
          assert(r.sequence.every((n) => n >= 0 && n <= 3));
        }
        if (a.id === "science") assert.equal(typeof r.floats, "boolean");
      }
});
test("the oldest counting level actually reaches ten", () => {
  assert.deepEqual(
    Array.from({ length: 5 }, (_, i) => newRound("count", 3, i).target),
    [6, 7, 8, 9, 10],
  );
});
test("adaptive progress is gradual, reversible, and does not punish mistakes", () => {
  const original = defaults();
  const first = finishSession(original, "letters", 0);
  assert.equal(levelFor(first, "letters"), 1);
  const second = finishSession(first, "letters", 0);
  assert.equal(levelFor(second, "letters"), 2);
  const helped = finishSession(second, "letters", 4);
  assert.equal(levelFor(helped, "letters"), 1);
  assert.equal(helped.completed.letters, 3);
  assert.deepEqual(original.completed, {});
  assert.equal(levelFor({ ...second, pace: "gentle" }, "letters"), 1);
  assert.equal(levelFor({ ...second, pace: "stretch" }, "letters"), 3);
});
test("malformed or injected saves cannot become app settings", () => {
  for (const raw of [
    null,
    [],
    42,
    "bad",
    {
      sound: "no",
      completed: { count: -9, music: Infinity, science: "two" },
      skill: { letters: 99 },
      last: "<script>",
      pace: "bogus",
    },
  ]) {
    const s = sanitize(raw);
    assert.equal(typeof s.sound, "boolean");
    assert.equal(s.last, null);
    assert(s.skill.letters === undefined || s.skill.letters === 3);
  }
  const s = sanitize(
    JSON.parse(
      '{"__proto__":{"polluted":true},"completed":{"__proto__":{"polluted":true},"count":2}}',
    ),
  );
  assert.equal({}.polluted, undefined);
  assert.equal(s.completed.count, 2);
  assert.equal(s.polluted, undefined);
});
test("shuffle preserves inputs and all options", () => {
  const original = [1, 2, 3, 4];
  assert.deepEqual(shuffle(original, seeded(2)).sort(), original);
  assert.deepEqual(original, [1, 2, 3, 4]);
});
test("legacy number choices terminate even when count exceeds available numbers", () => {
  const context = { FL: { Art: {}, UI: {}, scenes: {} }, Math };
  vm.createContext(context);
  vm.runInContext(
    readFileSync(new URL("../engine/quiz.js", import.meta.url), "utf8"),
    context,
  );
  const choices = context.FL.numberChoices(2, 6, 1, 3);
  assert.equal(choices.length, 3);
  assert.equal(choices.filter((c) => c.correct).length, 1);
  assert.throws(() => context.FL.numberChoices(9, 3, 1, 3), /range/);
});
test("legacy buttons only respond to the pointer that pressed them", () => {
  let taps = 0;
  const context = { FL: { Art: {}, Audio: { sfx: { tap() {} } } } };
  context.window = context;
  vm.createContext(context);
  vm.runInContext(
    readFileSync(new URL("../engine/ui.js", import.meta.url), "utf8"),
    context,
  );
  const { UI } = context.FL;
  const button = new UI.Button({
    x: 0,
    y: 0,
    w: 50,
    h: 50,
    onTap() {
      taps++;
    },
  });
  const first = { x: 20, y: 20 },
    second = { x: 20, y: 20 };
  UI.pressDown([button], first);
  UI.pressUp([button], second);
  assert.equal(taps, 0);
  UI.pressUp([button], first);
  assert.equal(taps, 1);
});
