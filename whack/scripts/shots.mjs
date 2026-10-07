import { chromium, devices } from 'playwright';
const [url, prefix] = [process.argv[2], process.argv[3]];
const b = await chromium.launch(); const O = '/workspace/naiwa-whack';
async function run(name, opts) {
  const ctx = await b.newContext(opts); const p = await ctx.newPage(); const errs = [], bad = [];
  p.on('pageerror', e => errs.push(e.message)); p.on('console', m => m.type() === 'error' && errs.push(m.text()));
  p.on('response', r => r.status() >= 400 && bad.push(r.status() + ' ' + r.url()));
  await p.goto(url, { waitUntil: 'networkidle' }); await p.screenshot({ path: `${O}/${prefix}-${name}-start.png` });
  opts.hasTouch ? await p.tap('#go') : await p.click('#go');
  let hits = 0;
  for (let k = 0; k < 60; k++) { // tap visible non-bomb moles for ~6s
    const i = await p.evaluate(() => window.__whack.s.holes.findIndex(m => m && !m.hit && m.kind !== 'bomb'));
    if (i >= 0) { const loc = p.locator('.hole').nth(i); opts.hasTouch ? await loc.tap() : await loc.click(); hits++; }
    await p.waitForTimeout(100);
  }
  await p.screenshot({ path: `${O}/${prefix}-${name}-play.png` });
  const st = await p.evaluate(() => ({ score: window.__whack.s.score, hits: window.__whack.s.hits, maxCombo: window.__whack.s.maxCombo }));
  await p.evaluate(() => { window.__whack.s.duration = 0; }); await p.waitForTimeout(600);
  await p.screenshot({ path: `${O}/${prefix}-${name}-end.png` });
  const best = await p.evaluate(() => localStorage.getItem('naiwa-whack-best'));
  console.log(name, { taps: hits, ...st, best }, errs, bad); await ctx.close();
}
await run('desktop', { viewport: { width: 1280, height: 800 } });
await run('mobile', devices['iPhone 13']);
await b.close();
