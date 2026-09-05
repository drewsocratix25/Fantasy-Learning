// Stage only public runtime files; dependencies, tests and tooling stay out of Pages.
import { cp, mkdir, rm, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
const root = new URL('../', import.meta.url);
const out = new URL('../dist/', import.meta.url);
await rm(out, { recursive: true, force: true });
await mkdir(out, { recursive: true });
for (const name of ['index.html', 'hub.css', 'manifest.webmanifest', 'sw.js', 'app', 'assets', 'engine', 'games']) {
  await cp(new URL(name, root), new URL(name, out), { recursive: true, filter: source => !source.endsWith('.md') });
}
await writeFile(new URL('.nojekyll', out), '');
await writeFile(new URL('release.json', out), JSON.stringify({ revision: process.env.GITHUB_SHA || 'local' }) + '\n');
console.log(`Public site staged at ${resolve('dist')}`);
