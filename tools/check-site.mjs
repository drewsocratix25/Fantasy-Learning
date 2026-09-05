// Static integrity checks for a build-free GitHub Pages deployment.
import { readFile, readdir, stat } from "node:fs/promises";
import { resolve, dirname, extname } from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
let checked = 0;
async function exists(path) {
  try {
    await stat(path);
  } catch {
    throw Error(`Missing local asset: ${path}`);
  }
}
async function walk(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    if (["node_modules", ".git", ".kokoro-cache", "voice"].includes(entry.name))
      continue;
    const file = resolve(dir, entry.name);
    if (entry.isDirectory()) {
      await walk(file);
      continue;
    }
    const ext = extname(file);
    if ([".js", ".mjs", ".cjs"].includes(ext)) {
      execFileSync(process.execPath, ["--check", file]);
      checked++;
    }
    if (ext === ".html") {
      const html = await readFile(file, "utf8");
      for (const match of html.matchAll(/(?:src|href)="([^"#]+)"/g)) {
        const target = match[1];
        if (/^(?:https?:|data:|mailto:)/.test(target)) continue;
        await exists(resolve(dirname(file), target.split(/[?#]/)[0]));
      }
      if (!html.includes('name="viewport"'))
        throw Error(`Missing mobile viewport: ${file}`);
    }
    if (ext === ".webmanifest") {
      const manifest = JSON.parse(await readFile(file, "utf8"));
      for (const icon of manifest.icons || [])
        await exists(resolve(dirname(file), icon.src));
    }
  }
}
await walk(root);
for (const worker of ["sw.js", "games/melody/sw.js", "games/germs/sw.js"]) {
  const text = await readFile(resolve(root, worker), "utf8");
  const block = /const (?:CORE|ASSETS) = (\[[\s\S]*?\]);/.exec(text)?.[1];
  if (!block) throw Error(`Missing pre-cache list: ${worker}`);
  for (const match of block.matchAll(/['"]([^'"]+)['"]/g))
    await exists(resolve(root, dirname(worker), match[1]));
}
console.log(
  `Checked ${checked} JavaScript files, HTML references, manifests, and all three offline asset lists.`,
);
