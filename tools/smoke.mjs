// Browser smoke test: serves the repo, opens the hub, the legal pages and every game in games.json
// (live + template), and fails on any page error or console error. Screenshots land in tools/out/.
// Usage: node tools/smoke.mjs            (needs `npm install` once, or a global playwright)
import { readFileSync, existsSync, mkdirSync, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { join, dirname, extname, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(import.meta.url);
let chromium;
try { ({ chromium } = require('playwright')); } catch (e) { ({ chromium } = createRequire('/opt/node22/lib/node_modules/playwright/package.json')('playwright')); }

const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.mp3': 'audio/mpeg', '.webmanifest': 'application/manifest+json', '.xml': 'application/xml', '.txt': 'text/plain' };
// In-memory stand-in for supabase/functions/family so the client flows can be tested without a project.
const mock = { families: new Map(), progress: new Map(), plays: [], emails: [] };
function mockFamily(body) {
  const fam = (code) => { const f = mock.families.get(String(code || '').toUpperCase()); if (!f) throw new Error('We don\'t know that family code. Check the letters and try again.'); return f; };
  const pub = (f) => ({ code: f.code, email: f.email, supporter: { active: !!f.until && f.until > Date.now(), until: f.until ? new Date(f.until).toISOString() : null, plan: f.plan || null } });
  switch (body.action) {
    case 'create': { if (!/@/.test(body.email || '')) throw new Error('Please enter a valid email address.'); const code = 'TEST-' + String(mock.families.size + 1).padStart(4, '0').replace(/0/g, 'X'); const f = { code, email: body.email, until: null }; mock.families.set(code, f); mock.emails.push(body.email); return pub(f); }
    case 'join': case 'status': return pub(fam(body.code));
    case 'recover': mock.emails.push(body.email); return { ok: true };
    case 'pull': { fam(body.code); const row = mock.progress.get(body.code + '/' + body.game); return row ? { data: row.data, updatedAt: row.updatedAt } : { data: null, updatedAt: null }; }
    case 'push': { fam(body.code); const row = { data: body.data, updatedAt: new Date().toISOString() }; mock.progress.set(body.code + '/' + body.game, row); return { updatedAt: row.updatedAt }; }
    case 'ping': mock.plays.push(body.game); return { ok: true };
    default: throw new Error('Unknown action.');
  }
}
const server = createServer((req, res) => {
  const url = new URL(req.url, 'http://x');
  if (url.pathname === '/mock/functions/v1/family') {
    if (req.method === 'OPTIONS') { res.writeHead(200, { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*' }); return res.end(); }
    let raw = ''; req.on('data', (c) => { raw += c; }); req.on('end', () => {
      try { const out = mockFamily(JSON.parse(raw || '{}')); res.writeHead(200, { 'content-type': 'application/json' }); res.end(JSON.stringify(out)); }
      catch (e) { res.writeHead(400, { 'content-type': 'application/json' }); res.end(JSON.stringify({ error: e.message })); }
    }); return;
  }
  let p = decodeURIComponent(url.pathname); if (p.endsWith('/')) p += 'index.html';
  const file = normalize(join(root, p)); if (!file.startsWith(root)) { res.writeHead(403); return res.end(); }
  if (!existsSync(file) || statSync(file).isDirectory()) { res.writeHead(404); return res.end('not found'); }
  res.writeHead(200, { 'content-type': MIME[extname(file)] || 'application/octet-stream', 'cache-control': 'no-store' }); res.end(readFileSync(file));
});
await new Promise((r) => server.listen(0, '127.0.0.1', r));
const base = `http://127.0.0.1:${server.address().port}/`;
mkdirSync(join(root, 'tools', 'out'), { recursive: true });

const reg = JSON.parse(readFileSync(join(root, 'games.json'), 'utf8'));
const browser = await chromium.launch();
const failures = [];
async function visit(name, path, check) {
  const page = await browser.newPage({ viewport: { width: 1366, height: 1024 } });
  const errors = [];
  page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
  page.on('console', (m) => {
    if (m.type() !== 'error') return;
    const url = (m.location() && m.location().url) || '';
    if (url && !url.startsWith(base)) return;                       // fonts.googleapis etc. may be unreachable offline
    if (/voice\/manifest\.json/.test(url) || (/Failed to load resource/.test(m.text()) && /404/.test(m.text()) && !url)) return;   // optional voice pack
    errors.push('console: ' + m.text() + (url ? ' @ ' + url : ''));
  });
  page.on('response', (r) => { if (r.status() >= 400 && !/fonts\.g|\/voice\/manifest\.json$/.test(r.url())) errors.push(`http ${r.status()}: ${r.url()}`); });
  try {
    const res = await page.goto(base + path, { waitUntil: 'networkidle', timeout: 30000 });
    if (!res || res.status() !== 200) errors.push(`status ${res && res.status()}`);
    await page.waitForTimeout(800);
    if (check) await check(page, errors);
    await page.screenshot({ path: join(root, 'tools', 'out', name.replace(/[^a-z0-9_-]+/gi, '_') + '.png') });
  } catch (e) { errors.push('exception: ' + e.message); }
  await page.close();
  console.log(`${errors.length ? '✗' : '✓'} ${name}  ${errors.length ? '\n    ' + errors.join('\n    ') : ''}`);
  if (errors.length) failures.push(name);
}

const listed = reg.games.filter((g) => g.status === 'live' || g.status === 'soon');
await visit('hub', '', async (page, errors) => {
  const n = await page.locator('#games .card').count(); if (n !== listed.length) errors.push(`expected ${listed.length} cards from games.json, saw ${n}`);
  const enabled = await page.evaluate(() => window.LW && LW.enabled);
  const famHidden = await page.locator('#family').isHidden(); if (!enabled && !famHidden) errors.push('family panel should be hidden in local mode');
  const supportHidden = await page.locator('#support').isHidden(); const links = await page.evaluate(() => !!(LW.config.stripeMonthly || LW.config.stripeYearly));
  if (links === supportHidden) errors.push('support buttons visibility does not match config');
});
await visit('privacy', 'privacy.html'); await visit('terms', 'terms.html'); await visit('404', '404.html');
for (const g of reg.games) {
  if (g.status === 'soon') { await visit(`${g.id} (coming soon page)`, g.path); continue; }
  await visit(`${g.id} (${g.title})`, g.path, async (page, errors) => {
    const ok = await page.evaluate(() => !!(window.FL && FL.Game && FL.Game.scene && FL.Save && window.LW));
    if (!ok) errors.push('engine did not boot (FL.Game.scene / FL.Save / LW missing)');
    const canvas = await page.locator('canvas#game').boundingBox(); if (!canvas || canvas.width < 100) errors.push('canvas not laid out');
    // first tap unlocks audio and starts the game; make sure nothing throws afterwards
    await page.mouse.click(683, 900); await page.waitForTimeout(1200);
    const scene = await page.evaluate(() => FL.Game.sceneName); if (!scene) errors.push('no scene after first tap');
    // the platform hooks exist and progress is stored under the game's own key
    const keyed = await page.evaluate(() => { FL.Save.addStars(0); return !!localStorage.getItem(FL.config.storageKey); });
    if (!keyed) errors.push('progress not written under FL.config.storageKey');
  });
}

// ---- server mode: same pages, but platform/config.js points at the mock API ----
console.log('server mode (mock API):');
const serverConfig = readFileSync(join(root, 'platform', 'config.js'), 'utf8')
  .replace("supabaseUrl: ''", `supabaseUrl: '${base}mock'`).replace("supabaseAnonKey: ''", "supabaseAnonKey: 'anon-test'")
  .replace("stripeMonthly: ''", "stripeMonthly: 'https://buy.stripe.com/test_month'").replace("stripeYearly: ''", "stripeYearly: 'https://buy.stripe.com/test_year'");
const ctx = await browser.newContext({ viewport: { width: 1366, height: 1024 } });
await ctx.route('**/platform/config.js', (route) => route.fulfill({ status: 200, contentType: 'text/javascript', body: serverConfig }));
async function flow(name, fn) {
  const page = await ctx.newPage(); const errors = [];
  page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
  try { await fn(page, errors); } catch (e) { errors.push('exception: ' + e.message); }
  await page.close();
  console.log(`${errors.length ? '✗' : '✓'} ${name}  ${errors.length ? '\n    ' + errors.join('\n    ') : ''}`);
  if (errors.length) failures.push(name);
}
const expect = (errors, cond, what) => { if (!cond) errors.push(what); };
let code = null;
await flow('hub: create a family code, support links carry it', async (page, errors) => {
  await page.goto(base, { waitUntil: 'networkidle' });
  expect(errors, await page.locator('#family').isVisible(), 'family panel should show in server mode');
  expect(errors, await page.locator('#support').isVisible(), 'support buttons should show when payment links are set');
  await page.fill('#createEmail', 'parent@example.com'); await page.click('#createForm button');
  await page.waitForSelector('#familyHas:not([hidden])', { timeout: 5000 });
  code = (await page.textContent('#familyCode')).trim();
  expect(errors, /^[A-Z0-9]{4}-[A-Z0-9]{4}$/.test(code), 'code should look like ABCD-EFGH, got ' + code);
  expect(errors, mock.emails.includes('parent@example.com'), 'creating a family should email the code');
  const href = await page.getAttribute('#supportYear', 'href');
  expect(errors, href.includes('client_reference_id=' + code) && href.includes('prefilled_email=parent%40example.com'), 'support link should carry the family code and email: ' + href);
  expect(errors, await page.locator('#supporterBadge').isHidden(), 'no supporter badge before paying');
  await page.evaluate(() => LW.family.leave());
  expect(errors, await page.locator('#familyNone').isVisible(), 'forgetting the code should show the sign-up forms again');
});
await flow('hub: supporter badge after the webhook marks the family', async (page, errors) => {
  mock.families.get(code).until = Date.now() + 86400000; mock.families.get(code).plan = 'year';
  await page.goto(base, { waitUntil: 'networkidle' });
  await page.fill('#joinCode', code.toLowerCase().replace('-', '')); await page.click('#joinForm button');
  await page.waitForSelector('#supporterBadge:not([hidden])', { timeout: 5000 });
  expect(errors, await page.locator('#supporterBadge').isVisible(), 'supporter badge should show');
  expect(errors, await page.locator('#portalLink').isHidden(), 'portal link stays hidden until a portal URL is configured');
});
await flow('hub: a wrong code is rejected', async (page, errors) => {
  await page.goto(base, { waitUntil: 'networkidle' }); await page.evaluate(() => LW.family.leave());
  await page.fill('#joinCode', 'ZZZZ-ZZZZ'); await page.click('#joinForm button');
  await page.waitForFunction(() => /know that family code/.test(document.getElementById('familyMsg').textContent), null, { timeout: 5000 });
  expect(errors, await page.locator('#familyNone').isVisible(), 'should stay signed out');
});
const game = reg.games.find((g) => g.id === '_template');
await flow('game: progress pushes to the family, then pulls onto a fresh device', async (page, errors) => {
  await page.goto(base, { waitUntil: 'networkidle' });
  await page.evaluate((c) => LW.family.join(c), code);
  await page.goto(base + game.path, { waitUntil: 'networkidle' }); await page.mouse.click(683, 900); await page.waitForTimeout(500);
  await page.evaluate(() => { FL.Save.addStars(7); FL.Save.unlock('🦄'); });
  await page.waitForFunction(() => !Object.keys(LW.sync._timers).length, null, { timeout: 8000 });   // debounce flushed
  await page.waitForTimeout(300);
  const key = code + '/' + game.id.replace(/^_/, '');
  const pushed = mock.progress.get(key);
  expect(errors, pushed && pushed.data.stars === 7 && pushed.data.unlocked.includes('🦄'), 'progress should be pushed to the server: ' + JSON.stringify(pushed && pushed.data));
  expect(errors, mock.plays.includes(game.id.replace(/^_/, '')), 'a play should be counted');
  // "new device": wipe local progress but keep the family code, reload, expect the stars back
  await page.evaluate(() => localStorage.removeItem(FL.config.storageKey));
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForFunction(() => FL.Save.data.stars === 7, null, { timeout: 8000 }).catch(() => errors.push('stars did not sync back after reload'));
  expect(errors, await page.evaluate(() => FL.Save.data.unlocked.includes('🦄')), 'unlocked friend should sync back');
  // grown-up corner shows the family code
  await page.evaluate(() => FL.UI.showParent());
  await page.waitForTimeout(400); await page.screenshot({ path: join(root, 'tools', 'out', 'grown-up-corner-family.png') });
});
await ctx.close();
await browser.close(); server.close();
if (failures.length) { console.error(`smoke: ${failures.length} page(s) failed: ${failures.join(', ')}`); process.exit(1); }
console.log('smoke: all pages ok');
