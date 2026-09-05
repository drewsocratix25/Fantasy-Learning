import test from "node:test";
import assert from "node:assert/strict";
import vm from "node:vm";
import { readFileSync } from "node:fs";

function worker(file, key, others) {
  const handlers = {},
    deleted = [],
    stored = new Map([["./index.html", new Response("<html>offline</html>")]]);
  const cache = {
    async match(request) {
      return stored.get(typeof request === "string" ? request : request.url);
    },
    async put(request, value) {
      stored.set(request.url, value);
    },
    async addAll() {},
  };
  const context = {
    URL,
    Response,
    location: { origin: "https://example.test" },
    self: {
      registration: { scope: "https://example.test/Fantasy-Learning/" },
      addEventListener(name, fn) {
        handlers[name] = fn;
      },
      clients: { async claim() {} },
      async skipWaiting() {},
    },
    caches: {
      async keys() {
        return [key, ...others];
      },
      async delete(name) {
        deleted.push(name);
      },
      async open() {
        return cache;
      },
    },
    fetch: async () => {
      throw Error("offline");
    },
  };
  vm.createContext(context);
  vm.runInContext(
    readFileSync(new URL(`../${file}`, import.meta.url), "utf8"),
    context,
  );
  return { handlers, deleted };
}
test("activation only retires this game’s cache versions", async () => {
  const current = [
    "little-wonders-world-v2",
    "melody-kingdom-v6",
    "germ-patrol-v4",
    "castle-quest-v2",
  ];
  for (const [i, file] of [
    "sw.js",
    "games/melody/sw.js",
    "games/germs/sw.js",
    "games/castle/sw.js",
  ].entries()) {
    const old = current[i].replace(/v\d+$/, "v0");
    const w = worker(file, current[i], [
      ...current.filter((_, j) => i !== j),
      old,
      "unrelated-site",
    ]);
    let job;
    w.handlers.activate({
      waitUntil(p) {
        job = p;
      },
    });
    await job;
    assert.deepEqual(w.deleted, [old]);
  }
});
test("missing scripts never receive an HTML navigation fallback", async () => {
  for (const file of ["sw.js", "games/melody/sw.js", "games/germs/sw.js", "games/castle/sw.js"]) {
    const w = worker(file, "", []);
    let result;
    w.handlers.fetch({
      request: {
        method: "GET",
        mode: "cors",
        url: "https://example.test/Fantasy-Learning/app/missing.js",
      },
      respondWith(p) {
        result = p;
      },
    });
    const response = await result;
    assert.equal(response.type, "error");
  }
});
test("new-world navigation still opens offline under a GitHub Pages subpath", async () => {
  const w = worker("sw.js", "", []);
  let result;
  w.handlers.fetch({
    request: {
      method: "GET",
      mode: "navigate",
      url: "https://example.test/Fantasy-Learning/",
    },
    respondWith(p) {
      result = p;
    },
  });
  assert.match(await (await result).text(), /offline/);
});
