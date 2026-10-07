import { chromium, devices } from 'playwright';
const [url, prefix] = [process.argv[2], process.argv[3]];
const b = await chromium.launch(); const O = '/workspace/naiwa-stack';
async function run(name, opts) {
  const ctx = await b.newContext(opts); const p = await ctx.newPage(); const errs = [], bad = [];
  p.on('pageerror', e => errs.push(e.message)); p.on('console', m => m.type() === 'error' && errs.push(m.text()));
  p.on('response', r => r.status() >= 400 && bad.push(r.status() + ' ' + r.url()));
  await p.goto(url, { waitUntil: 'networkidle' }); await p.screenshot({ path: `${O}/${prefix}-${name}-start.png` });
  opts.hasTouch ? await p.tap('#go') : await p.click('#go'); await p.waitForTimeout(300);
  for (let k = 0; k < 8; k++) { // wait until mover is near the top block, then tap the stage for real
    await p.waitForFunction(() => { const s = window.__stack.s; const t = s.blocks.at(-1) ?? s.base; return Math.abs(s.mover.x - t.x) < 2; }, null, { timeout: 8000, polling: 'raf' });
    const st = p.locator('#stage'); opts.hasTouch ? await st.tap({ position: { x: 20, y: 20 } }) : await st.click({ position: { x: 20, y: 20 } }); await p.waitForTimeout(250);
  }
  await p.waitForTimeout(300); const h = await p.evaluate(() => ({ height: window.__stack.s.blocks.length, perfects: window.__stack.s.perfects, over: window.__stack.s.over }));
  await p.screenshot({ path: `${O}/${prefix}-${name}-play.png` });
  await p.evaluate(() => { const s = window.__stack.s; s.mover.x = 95; window.__stack.onDrop(); }); await p.waitForTimeout(1600);
  await p.screenshot({ path: `${O}/${prefix}-${name}-end.png` });
  console.log(name, h, errs, bad); await ctx.close();
}
await run('desktop', { viewport: { width: 1280, height: 800 } });
await run('mobile', devices['iPhone 13']);
await b.close();
