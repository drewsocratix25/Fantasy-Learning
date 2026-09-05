// DOM-level interaction tests; these do not claim browser rendering or device coverage.
import test from "node:test";
import assert from "node:assert/strict";
import vm from "node:vm";
import { readFileSync } from "node:fs";
import { parseHTML } from "linkedom";
import * as core from "../app/core.mjs";

function app(saved, blockedStorage = false) {
  const { document, HTMLElement, HTMLSelectElement, Event } = parseHTML(
    readFileSync(new URL("../index.html", import.meta.url), "utf8"),
  );
  const handlers = new Map(),
    jobs = new Map(),
    storage = new Map();
  let now = 0,
    serial = 0,
    hash = "",
    spoken = [];
  if (saved) storage.set(core.STORAGE_KEY, JSON.stringify(saved));
  HTMLElement.prototype.focus = function () {
    Object.defineProperty(document, "activeElement", {
      configurable: true,
      value: this,
    });
  };
  Object.defineProperty(HTMLSelectElement.prototype, "value", {
    configurable: true,
    get() {
      return (
        [...this.options].find((o) => o.hasAttribute("selected"))?.value ||
        this.options[0]?.value
      );
    },
    set(value) {
      [...this.options].forEach((o) =>
        o.toggleAttribute("selected", o.value === value),
      );
    },
  });
  const dialog = document.querySelector("dialog");
  dialog.showModal = () => {
    dialog.open = true;
  };
  dialog.close = () => {
    dialog.open = false;
    dialog.dispatchEvent(new Event("close"));
  };
  const location = {
    protocol: "https:",
    get hash() {
      return hash;
    },
    set hash(value) {
      hash = value;
      handlers.get("hashchange")?.();
    },
  };
  const fakeWindow = {
    document,
    matchMedia: () => ({ matches: false, addEventListener() {} }),
    addEventListener(name, fn) {
      handlers.set(name, fn);
    },
    scrollTo() {},
  };
  const FakeDate = class extends Date {
    static now() {
      return now;
    }
  };
  class Sound {
    unlock() {}
    note() {}
    stop() {}
    say(text) {
      spoken.push(text);
    }
  }
  const context = {
    ...core,
    window: fakeWindow,
    document,
    location,
    navigator: {},
    Sound,
    Date: FakeDate,
    console,
    setTimeout(fn, delay) {
      const id = ++serial;
      jobs.set(id, { fn, when: now + delay });
      return id;
    },
    clearTimeout(id) {
      jobs.delete(id);
    },
    localStorage: {
      getItem(key) {
        if (blockedStorage) throw Error("blocked");
        return storage.get(key) || null;
      },
      setItem(key, value) {
        if (blockedStorage) throw Error("blocked");
        storage.set(key, value);
      },
    },
  };
  vm.createContext(context);
  vm.runInContext(
    readFileSync(new URL("../app/main.mjs", import.meta.url), "utf8").replace(
      /^import[\s\S]*?;\n/gm,
      "",
    ),
    context,
  );
  const $ = (s) => document.querySelector(s);
  const $$ = (s) => [...document.querySelectorAll(s)];
  function click(selector) {
    const el = typeof selector === "string" ? $(selector) : selector;
    assert(el, `Missing control: ${selector}`);
    assert(!el.disabled, `Disabled control: ${selector}`);
    if (el.tagName === "A" && el.getAttribute("href")?.startsWith("#"))
      location.hash = el.getAttribute("href");
    else el.click();
  }
  function tick(ms = 10000) {
    const end = now + ms;
    let guard = 0;
    while (true) {
      const next = [...jobs]
        .filter(([, t]) => t.when <= end)
        .sort((a, b) => a[1].when - b[1].when)[0];
      if (!next) break;
      if (++guard > 1000) throw Error("Timer loop");
      jobs.delete(next[0]);
      now = next[1].when;
      next[1].fn();
    }
    now = end;
  }
  function open(id) {
    location.hash = `#play/${id}`;
  }
  return {
    $,
    $$,
    click,
    tick,
    open,
    document,
    dialog,
    storage,
    spoken,
    handlers,
  };
}
test("the home screen exposes six real activities without a setup wall", () => {
  const a = app();
  assert.equal(a.$$(".activity-link").length, 6);
  for (const activity of core.ACTIVITIES)
    assert(a.$(`[href="#play/${activity.id}"]`));
});
test("all five rounds complete and persist for counting, letters, shapes, patterns, and science", () => {
  for (const id of ["count", "letters", "shapes", "patterns", "science"]) {
    const a = app();
    a.open(id);
    for (let round = 0; round < 5; round++) {
      if (id === "count") {
        while (a.$("#number-choices").hidden) {
          a.click(
            a
              .$$(".carrot")
              .find((b) => b.getAttribute("aria-disabled") !== "true"),
          );
        }
        a.click("[data-answer]");
      } else if (id === "science") {
        a.click('[data-predict="sink"]');
        a.tick(1500);
      } else a.click("[data-answer]");
      assert.equal(a.$("#next").hidden, false, `${id} round ${round + 1}`);
      a.click("#next");
    }
    assert(a.$(".finish-screen"), id);
    assert.equal(JSON.parse(a.storage.get(core.STORAGE_KEY)).completed[id], 1);
    a.click("#finish-home");
    assert.equal(a.$("#discovery-count").textContent, "1");
  }
});
test("wrong choices get a scaffold, repeated taps never skip rounds, and early exit cancels callbacks", () => {
  const a = app();
  a.open("letters");
  const wrong = a.$$(".choice").find((b) => !b.hasAttribute("data-answer"));
  a.click(wrong);
  a.click(wrong);
  assert(a.$("[data-answer]").classList.contains("hinted"));
  a.click("[data-answer]");
  a.click("[data-answer]");
  a.click("#next");
  assert.equal(a.$(".progress").getAttribute("aria-label"), "Discovery 2 of 5");
  a.click("#back");
  a.tick();
  assert(a.$(".worlds"));
});
test("counting never counts the same carrot twice and the oldest level can collect ten", () => {
  const a = app({ ...core.defaults(), pace: "stretch" });
  a.open("count");
  const first = a.$(".carrot");
  a.click(first);
  a.click(first);
  assert.equal(a.$("#picked-count").textContent, "1");
  for (let round = 0; round < 5; round++) {
    while (a.$("#number-choices").hidden)
      a.click(
        a.$$(".carrot").find((b) => b.getAttribute("aria-disabled") !== "true"),
      );
    assert.equal(Number(a.$("#picked-count").textContent), round + 6);
    a.click("[data-answer]");
    a.click("#next");
  }
  assert(a.$(".finish-screen"));
});
test("music echoes can complete using visual cues, and pausing during a tune is recoverable", () => {
  const a = app();
  a.open("music");
  a.click("#play-tune");
  a.tick(400);
  a.click("#pause");
  a.tick();
  assert(a.dialog.open);
  a.click("#resume");
  assert(!a.$("#play-tune").disabled);
  for (let i = 0; i < 5; i++) {
    a.click("#play-tune");
    const notes = a
      .$$(".cue .shape")
      .map((el) => core.NOTES.findIndex((n) => el.classList.contains(n.shape)));
    a.tick();
    for (const n of notes) a.click(`[data-note="${n}"]`);
    assert.equal(a.$("#next").hidden, false);
    a.click("#next");
  }
  assert(a.$(".finish-screen"));
});
test("free music stays playable after a discovery and can return to echo mode", () => {
  const a = app();
  a.open("music");
  a.click("#free-mode");
  for (let i = 0; i < 20; i++) a.click(`[data-note="${i % 4}"]`);
  assert.equal(a.$("#next").hidden, false);
  assert(!a.$(".finish-screen"));
  a.click("#echo-mode");
  assert.equal(a.$("#next").hidden, true);
  a.click("#play-tune");
  a.tick();
  assert(!a.$(".music-pad").disabled);
  a.click("#free-mode");
  for (let i = 0; i < 8; i++) a.click('[data-note="0"]');
  a.click("#next");
  assert(a.$(".finish-screen"));
});
test("pause suspends a science experiment until the child returns", () => {
  const a = app();
  a.open("science");
  a.click('[data-predict="float"]');
  a.tick(300);
  a.click("#pause");
  a.tick(3000);
  assert.equal(a.$("#next").hidden, true);
  a.click("#resume");
  a.tick(1000);
  assert.equal(a.$("#next").hidden, false);
});
test("grown-up gate, settings, discovery reset, and blocked storage all work", () => {
  const a = app();
  a.click("#grownups");
  a.$("#gate-word").value = "child";
  a.$("#gate").dispatchEvent(
    new a.document.defaultView.Event("submit", { cancelable: true }),
  );
  assert(a.$("#gate-error").textContent);
  a.$("#gate-word").value = "grownup";
  a.$("#gate").dispatchEvent(
    new a.document.defaultView.Event("submit", { cancelable: true }),
  );
  assert(a.$("#pace"));
  a.$("#pace").value = "stretch";
  a.$("#pace").dispatchEvent(new a.document.defaultView.Event("change"));
  assert.equal(JSON.parse(a.storage.get(core.STORAGE_KEY)).pace, "stretch");
  a.click("#reset");
  a.click("#keep-progress");
  assert(a.$("#pace"));
  a.click("#reset");
  a.click("#confirm-reset");
  assert.deepEqual(JSON.parse(a.storage.get(core.STORAGE_KEY)).completed, {});
  const blocked = app(null, true);
  blocked.open("letters");
  blocked.click("[data-answer]");
  assert.equal(blocked.$("#next").hidden, false);
});
test("leaving from pause cancels pending work and the rest screen is reversible", () => {
  const a = app();
  a.open("science");
  a.click('[data-predict="float"]');
  a.click("#pause");
  a.click("#stop-playing");
  a.tick();
  assert(a.$(".rest-screen"));
  a.click("#return-world");
  assert(a.$(".worlds"));
});
