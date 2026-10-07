import { chromium, devices } from 'playwright';
const [url, prefix] = [process.argv[2], process.argv[3]];
const b = await chromium.launch(); const O = '/workspace/naiwa-nailegewa';
async function run(name, opts) {
  const ctx = await b.newContext(opts); const p = await ctx.newPage(); const errs = [], bad = [];
  p.on('pageerror', e => errs.push(e.message)); p.on('console', m => m.type() === 'error' && errs.push(m.text()));
  p.on('response', r => r.status() >= 400 && bad.push(r.status() + ' ' + r.url()));
  await p.goto(url, { waitUntil: 'networkidle' }); await p.evaluate(() => window.__nlgw.start(0)); await p.waitForTimeout(300);
  // real taps on the first 2 steps of the solution
  for (let k = 0; k < 2; k++) { const id = await p.evaluate(k => window.__nlgw.g.solution[k], k); const loc = p.locator(`#board .tile[data-id="${id}"]`); opts.hasTouch ? await loc.tap() : await loc.click(); }
  const tray = await p.evaluate(() => window.__nlgw.g.tray.length);
  await p.screenshot({ path: `${O}/${prefix}-${name}-level1.png` });
  await p.evaluate(() => window.__nlgw.start(1)); await p.waitForTimeout(300);
  await p.screenshot({ path: `${O}/${prefix}-${name}-level2.png` });
  const won = await p.evaluate(async () => { const g = window.__nlgw.g; for (const id of g.solution) window.__nlgw.onPick(id); return g.status; });
  await p.waitForTimeout(900); await p.screenshot({ path: `${O}/${prefix}-${name}-win.png` });
  console.log(name, { trayAfter2Taps: tray, level2: won }, errs, bad); await ctx.close();
}
await run('desktop', { viewport: { width: 1280, height: 800 } });
await run('mobile', devices['iPhone 13']);
await b.close();
