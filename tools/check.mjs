// Static checks that need no browser: the games registry, sitemap, and the load order of every game page.
// Usage: node tools/check.mjs
import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const problems = [];
const fail = (m) => problems.push(m);

const reg = JSON.parse(readFileSync(join(root, 'games.json'), 'utf8'));
const ids = new Set();
for (const g of reg.games) {
  const where = `games.json › ${g.id}`;
  if (!/^[a-z0-9_-]{1,32}$/.test(g.id || '')) fail(`${where}: id must be lowercase letters, digits, - or _`);
  if (ids.has(g.id)) fail(`${where}: duplicate id`); ids.add(g.id);
  if (!['live', 'soon', 'template'].includes(g.status)) fail(`${where}: status must be live | soon | template`);
  if (!g.title || !g.tagline) fail(`${where}: title and tagline are required`);
  if (!g.path || !g.path.endsWith('/')) fail(`${where}: path must end with /`);
  const dir = join(root, g.path || '');
  if (!existsSync(join(dir, 'index.html'))) fail(`${where}: ${g.path}index.html is missing`);
  if (g.status !== 'soon') {
    const html = existsSync(join(dir, 'index.html')) ? readFileSync(join(dir, 'index.html'), 'utf8') : '';
    const cfg = join(dir, 'js', 'config.js');
    if (!existsSync(cfg)) fail(`${where}: js/config.js is missing (see games/_template)`);
    else {
      const idMatch = readFileSync(cfg, 'utf8').match(/\bid:\s*'([^']+)'/);
      if (idMatch && idMatch[1] !== g.id.replace(/^_/, '')) fail(`${where}: js/config.js id '${idMatch[1]}' does not match registry id`);
    }
    const order = ['platform/config.js', 'platform/platform.js', 'engine/save.js', 'engine/main.js'].map((f) => html.indexOf(f + '"'));   // the closing quote skips mentions in comments
    if (order.some((i) => i < 0)) fail(`${where}: index.html must load platform/config.js, platform/platform.js, engine/save.js and engine/main.js`);
    else if (!(order[0] < order[1] && order[1] < order[2] && order[2] < order[3])) fail(`${where}: load order must be platform/config.js → platform/platform.js → engine/save.js → … → engine/main.js`);
    if (existsSync(join(dir, 'sw.js'))) {
      const sw = readFileSync(join(dir, 'sw.js'), 'utf8');
      for (const f of ['platform/config.js', 'platform/platform.js']) if (!sw.includes(f)) fail(`${where}: sw.js does not cache ../../${f}`);
    }
  }
}

// Sitemap lists the hub, the legal pages and every live game.
const sitemap = readFileSync(join(root, 'sitemap.xml'), 'utf8');
const siteUrl = reg.site.url.replace(/\/$/, '') + '/';
for (const g of reg.games.filter((x) => x.status === 'live')) if (!sitemap.includes(siteUrl + g.path)) fail(`sitemap.xml: missing ${siteUrl + g.path}`);
for (const p of ['', 'privacy.html', 'terms.html']) if (!sitemap.includes('<loc>' + siteUrl + p + '</loc>')) fail(`sitemap.xml: missing ${siteUrl + p}`);

// The public platform config must stay a plain object literal with no secrets.
const pcfg = readFileSync(join(root, 'platform', 'config.js'), 'utf8');
if (/sk_(live|test)_|whsec_|re_[A-Za-z0-9]{10,}|service_role/i.test(pcfg)) fail('platform/config.js: looks like it contains a secret key; only the anon key and public links belong there');

if (problems.length) { console.error('check: ' + problems.length + ' problem(s)\n - ' + problems.join('\n - ')); process.exit(1); }
console.log(`check: games.json ok (${reg.games.length} entries), sitemap ok, platform config ok`);
