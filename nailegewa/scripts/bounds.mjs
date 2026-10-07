// Checks that every tile sprite stays inside its tile frame (board, piles, tray) on desktop + iPhone, both levels.
import { chromium, devices } from 'playwright';
const url = process.argv[2], out = process.argv[3] || '/workspace/naiwa-nailegewa/bounds';
const b = await chromium.launch(); let bad = 0;
for (const [name, ctx] of [['desktop', { viewport: { width: 1280, height: 860 } }], ['iphone', devices['iPhone 13']]]) {
  const p = await (await b.newContext(ctx)).newPage(); await p.goto(url); await p.waitForTimeout(800);
  for (const lvl of [1, 2]) {
    if (lvl === 2) { await p.evaluate(() => { localStorage.setItem('naiwa-nlgw-level', '1'); }); await p.goto(url); await p.waitForTimeout(800); }
    for (let k = 0; k < 3; k++) { const t = p.locator('#board .tile:not(.covered)').first(); if (await t.count()) await t.click(); await p.waitForTimeout(250); }
    const r = await p.evaluate(() => [...document.querySelectorAll('.tile img')].filter(i => { const a = i.getBoundingClientRect(), t = i.parentElement.getBoundingClientRect(); return a.left < t.left - .5 || a.top < t.top - .5 || a.right > t.right + .5 || a.bottom > t.bottom + .5; }).length);
    const lab = await p.locator('#level, .level, header').first().innerText().catch(() => '');
    console.log(name, 'L' + lvl, 'overflowing sprites:', r, lab.replace(/\s+/g, ' ').slice(0, 40)); bad += r;
    await p.screenshot({ path: `${out}-${name}-L${lvl}.png` });
  }
}
await b.close(); process.exit(bad ? 1 : 0);
