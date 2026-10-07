// Renders thumbnails for 3D exhibits by opening them in the built site's viewer (run `npx vite preview --port 4175` first)
import { chromium } from 'playwright';
import { readFileSync } from 'fs';
const ex = JSON.parse(readFileSync('src/exhibits.json', 'utf8')).exhibits.filter(e => e.model);
const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader'] });
const p = await b.newPage({ viewport: { width: 900, height: 900 } });
await p.goto('http://localhost:4175/');
for (const e of ex) {
  await p.evaluate(id => window.__museum.openLB(id), e.id);
  await p.waitForSelector('#three[data-loaded], #three[data-error]', { timeout: 30000 });
  await p.waitForTimeout(1200);
  await p.evaluate(() => { document.querySelectorAll('.nav').forEach(n => n.style.display = 'none'); });
  await p.locator('#three canvas').screenshot({ path: `/tmp/${e.id}.png`, omitBackground: true });
  console.log(e.id, await p.evaluate(() => document.querySelector('#three').dataset.error || 'ok'));
}
await b.close();
