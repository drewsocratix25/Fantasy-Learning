// Renders the PNG app icons from icons/icon.svg using headless Chromium. Run: node tools/make-icons.mjs
import { createRequire } from 'module';
import { readFileSync } from 'fs';
const require = createRequire('/opt/node22/lib/node_modules/playwright/package.json');
const { chromium } = require('playwright');
const game = process.argv[2] || 'melody';
const svg = readFileSync(new URL(`../games/${game}/icons/icon.svg`, import.meta.url), 'utf8');
const browser = await chromium.launch();
for (const [size, name] of [[192, 'icon-192.png'], [512, 'icon-512.png'], [180, 'apple-touch-icon.png']]) {
  const page = await browser.newPage({ viewport: { width: size, height: size }, deviceScaleFactor: 1 });
  await page.setContent(`<html><body style="margin:0;background:#6d28d9">${svg.replace('<svg ', `<svg width="${size}" height="${size}" `)}</body></html>`);
  await page.screenshot({ path: new URL(`../games/${game}/icons/${name}`, import.meta.url).pathname, omitBackground: false });
  await page.close();
}
await browser.close();
console.log('icons written');
