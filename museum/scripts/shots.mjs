import { chromium, devices } from 'playwright';
const [url, prefix] = [process.argv[2], process.argv[3]];
const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader'] }); const O = '/workspace/naiwa-museum';
async function run(name, opts) {
  const ctx = await b.newContext(opts); const p = await ctx.newPage(); const errs = [], bad = [];
  p.on('pageerror', e => errs.push(e.message)); p.on('console', m => m.type() === 'error' && errs.push(m.text()));
  p.on('response', r => r.status() >= 400 && bad.push(r.status() + ' ' + r.url()));
  await p.goto(url, { waitUntil: 'networkidle' }); await p.waitForTimeout(500);
  await p.screenshot({ path: `${O}/${prefix}-${name}-entrance.png` });
  await p.goto(url + '#/hall/art', { waitUntil: 'networkidle' }); await p.waitForTimeout(800);
  await p.screenshot({ path: `${O}/${prefix}-${name}-art-hall.png` });
  await p.locator('.ex').nth(0).click(); await p.waitForTimeout(1200);
  await p.screenshot({ path: `${O}/${prefix}-${name}-lightbox.png` });
  await p.keyboard.press('Escape');
  await p.goto(url + '#/hall/model', { waitUntil: 'networkidle' }); await p.locator('.ex').nth(0).click();
  await p.waitForSelector('#three[data-loaded], #three[data-error]', { timeout: 30000 }); await p.waitForTimeout(1000);
  await p.screenshot({ path: `${O}/${prefix}-${name}-3d.png` });
  await p.goto(url + '#/search/' + encodeURIComponent('朋克'), { waitUntil: 'networkidle' });
  const n = await p.locator('.ex').count();
  await p.goto(url + '#/games', { waitUntil: 'networkidle' }); await p.waitForTimeout(400);
  await p.screenshot({ path: `${O}/${prefix}-${name}-games.png` });
  const broken = await p.evaluate(() => [...document.images].filter(i => i.complete && !i.naturalWidth).length);
  console.log(name, { search朋克: n, broken }, errs, bad); await ctx.close();
}
await run('desktop', { viewport: { width: 1366, height: 860 } });
await run('mobile', devices['iPhone 13']);
await b.close();
