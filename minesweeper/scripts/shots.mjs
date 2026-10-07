import { chromium, devices } from 'playwright';
const [url, prefix] = [process.argv[2], process.argv[3]];
const b = await chromium.launch(); const O = '/workspace/naiwa-minesweeper';
async function run(name, opts, level) {
  const ctx = await b.newContext(opts); const p = await ctx.newPage(); const errs = [], bad = [];
  p.on('pageerror', e => errs.push(e.message)); p.on('console', m => m.type() === 'error' && errs.push(m.text()));
  p.on('response', r => r.status() >= 400 && bad.push(r.status() + ' ' + r.url()));
  await p.goto(url, { waitUntil: 'networkidle' });
  await p.click(`.levels button[data-l=${level}]`);
  const cells = await p.$$('.c'); if (opts.hasTouch) await cells[Math.floor(cells.length / 2)].tap(); else await cells[Math.floor(cells.length / 2)].click();
  if (opts.hasTouch) await p.evaluate(async () => { // long-press flag
    const i = window.__ms.b.cells.findIndex(c => !c.open); const el = document.querySelector(`.c[data-i="${i}"]`);
    const ev = t => el.dispatchEvent(new PointerEvent(t, { bubbles: true, pointerType: 'touch', button: 0, buttons: t === 'pointerdown' ? 1 : 0 }));
    ev('pointerdown'); await new Promise(r => setTimeout(r, 500)); ev('pointerup'); });
  else { const i = await p.evaluate(() => window.__ms.b.cells.findIndex(c => !c.open)); await p.click(`.c[data-i="${i}"]`, { button: 'right' }); }
  await p.waitForTimeout(300);
  const st = await p.evaluate(() => ({ status: window.__ms.b.status, open: window.__ms.b.cells.filter(c => c.open).length, flags: window.__ms.b.cells.filter(c => c.flag).length, fitsViewport: (r => r.left >= 0 && r.top >= 0 && r.right <= innerWidth && r.bottom <= innerHeight)(document.getElementById('grid').getBoundingClientRect()) }));
  await p.screenshot({ path: `${O}/${prefix}-${name}.png` });
  console.log(name, st, errs, bad); await ctx.close();
}
await run('desktop', { viewport: { width: 1280, height: 800 } }, 'expert');
await run('mobile', devices['iPhone 13'], 'expert');
await run('mobile-beginner', devices['iPhone 13'], 'beginner');
await b.close();
