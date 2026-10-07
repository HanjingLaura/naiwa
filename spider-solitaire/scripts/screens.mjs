import { chromium, devices } from 'playwright';
const out = process.argv[2] || 'screens'; const URL = 'http://localhost:4173/';
const b = await chromium.launch(); const errs = [];
async function run(name, ctxOpts) {
  const ctx = await b.newContext(ctxOpts); const p = await ctx.newPage();
  p.on('pageerror', e => errs.push(name + ': ' + e.message));
  await p.goto(URL); await p.waitForTimeout(500);
  // do a few hinted moves through UI drag to exercise pointer events
  for (let k = 0; k < 3; k++) {
    const h = await p.evaluate(() => { const s = window.__naiwa.state; return null; });
  }
  await p.selectOption('#diff', '4'); await p.waitForTimeout(300); await p.click('.stock'); await p.waitForTimeout(400);
  await p.screenshot({ path: `${out}/real-${name}.png` });
  const before = await p.evaluate(() => window.__naiwa.state.moves);
  // tap a movable top card via UI
  const cards = await p.$$('.card[data-col]');
  for (const c of cards.reverse()) { await c.click({ force: true }); }
  const after = await p.evaluate(() => window.__naiwa.state.moves);
  await p.evaluate(() => window.__naiwa.showWin()); await p.waitForTimeout(900);
  await p.screenshot({ path: `${out}/real-${name}-win.png` });
  await ctx.close(); return { name, before, after };
}
console.log(await run('desktop', { viewport: { width: 1280, height: 800 } }));
console.log(await run('mobile', { ...devices['iPhone 13'] }));
console.log('errors', errs); await b.close();
