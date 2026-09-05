// Screenshot helper: node tools/shoot.mjs <url> <out.png> [actions...]
// actions: click:x,y | key:Name | wait:ms | eval:js
import { createRequire } from 'module';
const require = createRequire('/opt/node22/lib/node_modules/playwright/package.json');
const { chromium } = require('playwright');
const [url, out, ...actions] = process.argv.slice(2);
const browser = await chromium.launch();
const vw = Number(process.env.VW || 1366), vh = Number(process.env.VH || 1024);
const page = await browser.newPage({ viewport: { width: vw, height: vh }, deviceScaleFactor: 1 });
const errors = [];
page.on('pageerror', (e) => errors.push('PAGEERROR ' + e.message));
page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') errors.push(m.type() + ': ' + m.text()); });
await page.goto(url, { waitUntil: 'networkidle' });
await page.waitForTimeout(600);
for (const a of actions) {
  const [k, v] = a.split(/:(.*)/s);
  if (k === 'click') { const [x, y] = v.split(',').map(Number); await page.mouse.click(x, y); }
  else if (k === 'down') { const [x, y] = v.split(',').map(Number); await page.mouse.move(x, y); await page.mouse.down(); }
  else if (k === 'up') { await page.mouse.up(); }
  else if (k === 'moveto') { const [x, y] = v.split(',').map(Number); await page.mouse.move(x, y, { steps: 10 }); }
  else if (k === 'key') await page.keyboard.press(v);
  else if (k === 'hold') { const [key, ms] = v.split(','); await page.keyboard.down(key); await page.waitForTimeout(Number(ms)); await page.keyboard.up(key); }
  else if (k === 'wait') await page.waitForTimeout(Number(v));
  else if (k === 'reload') { await page.reload({ waitUntil: 'networkidle' }); await page.waitForTimeout(800); }
  else if (k === 'eval') { const r = await page.evaluate(v); if (r !== undefined) console.log('eval =>', JSON.stringify(r)); }
  else if (k === 'shot') await page.screenshot({ path: v });
}
await page.screenshot({ path: out });
console.log(errors.length ? errors.join('\n') : 'no console errors');
await browser.close();
