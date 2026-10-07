// Generates ORIGINAL naiwa art as SVG, rasterizes to transparent PNG via Playwright, then webp via PIL.
import { chromium } from 'playwright';
import { writeFileSync } from 'fs';
const OUT = 'public/assets';
let gid = 0;
function naiwa({ body = '#ffd84a', shade = '#e8a91c', x = 100, y = 110, s = 1, extra = '', belly = '' } = {}) {
  const g = 'g' + gid++;
  return `<g transform="translate(${x} ${y}) scale(${s})">
  <defs><radialGradient id="${g}" cx="35%" cy="28%" r="80%"><stop offset="0" stop-color="#fffbe0"/><stop offset=".25" stop-color="${body}"/><stop offset="1" stop-color="${shade}"/></radialGradient>
  <radialGradient id="${g}b" cx="50%" cy="30%" r="70%"><stop offset="0" stop-color="#fffdf3"/><stop offset="1" stop-color="#f3e2b8"/></radialGradient></defs>
  <ellipse cx="0" cy="62" rx="62" ry="10" fill="#000" opacity=".15"/>
  <ellipse cx="-34" cy="55" rx="18" ry="9" fill="${shade}"/><ellipse cx="34" cy="55" rx="18" ry="9" fill="${shade}"/>
  <path d="M-66 20 C-70 -40 -40 -62 0 -62 C40 -62 70 -40 66 20 C62 58 -62 58 -66 20Z" fill="url(#${g})"/>
  <ellipse cx="0" cy="24" rx="40" ry="28" fill="url(#${g}b)"/>${belly}
  <circle cx="-24" cy="-22" r="7" fill="#2b2118"/><circle cx="24" cy="-22" r="7" fill="#2b2118"/>
  <circle cx="-22" cy="-25" r="2.4" fill="#fff"/><circle cx="26" cy="-25" r="2.4" fill="#fff"/>
  <ellipse cx="-42" cy="-6" rx="9" ry="5" fill="#ff8a8a" opacity=".55"/><ellipse cx="42" cy="-6" rx="9" ry="5" fill="#ff8a8a" opacity=".55"/>
  <path d="M-8 -8 Q0 0 8 -8" stroke="#2b2118" stroke-width="3" fill="none" stroke-linecap="round"/>
  <ellipse cx="-30" cy="-44" rx="14" ry="6" fill="#fff" opacity=".5" transform="rotate(-25 -30 -44)"/>
  ${extra}</g>`;
}
const SUITPATH = {
  spade: 'M0 -20 C14 -6 22 2 22 10 C22 20 10 22 3 15 L6 26 L-6 26 L-3 15 C-10 22 -22 20 -22 10 C-22 2 -14 -6 0 -20Z',
  heart: 'M0 22 C-26 4 -24 -18 -10 -18 C-4 -18 0 -12 0 -8 C0 -12 4 -18 10 -18 C24 -18 26 4 0 22Z',
  club: 'M0 -22 a10 10 0 1 1 -1 0Z M-12 -2 a10 10 0 1 0 1 0Z M12 -2 a10 10 0 1 0 -1 0Z M-4 6 L-7 26 L7 26 L4 6Z',
  diamond: 'M0 -24 L18 0 L0 24 L-18 0Z',
};
const SUITS = [
  ['spade', '#ffd84a', '#d99a12', '#3a3550'],
  ['heart', '#ffb3c4', '#e0708c', '#e23d5a'],
  ['club', '#b8e986', '#6fb53a', '#2f7d32'],
  ['diamond', '#9fd8ff', '#4a9be0', '#e2731d'],
];
const sym = (n, c, x, y, s) => `<path d="${SUITPATH[n]}" fill="${c}" transform="translate(${x} ${y}) scale(${s})" stroke="#fff" stroke-width="2"/>`;
const svg = (w, h, inner) => `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">${inner}</svg>`;
const crown = (c = '#ffcf33') => `<path d="M-30 -58 L-30 -82 L-15 -68 L0 -90 L15 -68 L30 -82 L30 -58Z" fill="${c}" stroke="#b07a00" stroke-width="3" stroke-linejoin="round"/><circle cx="0" cy="-70" r="4" fill="#e23d5a"/>`;
const assets = {};
SUITS.forEach(([n, b, sh, c]) => {
  assets['suit-' + n] = svg(200, 200, naiwa({ body: b, shade: sh, y: 112, belly: sym(n, c, 0, 26, .8),
    extra: `<g transform="translate(0 -62)">${sym(n, c, 0, 0, .7)}</g>` }));
});
const Y = ['#ffd84a', '#d99a12'];
assets['face-J'] = svg(240, 300, `<circle cx="120" cy="150" r="105" fill="#e9f6ff"/>` + naiwa({ body: Y[0], shade: Y[1], x: 120, y: 170, s: 1.3,
  extra: `<path d="M-46 -52 Q0 -95 46 -52 Z" fill="#3e7bd6"/><rect x="-6" y="-60" width="70" height="10" rx="5" fill="#3e7bd6"/><circle cx="0" cy="-78" r="6" fill="#fff"/>` }));
assets['face-Q'] = svg(240, 300, `<circle cx="120" cy="150" r="105" fill="#ffeef3"/>` + naiwa({ body: Y[0], shade: Y[1], x: 120, y: 170, s: 1.3,
  extra: crown('#ffd9e6') + `<path d="M30 -50 l22 -12 l0 24Z M30 -50 l-4 -18 l18 6Z" fill="#ff6f9c"/>` }));
assets['face-K'] = svg(240, 300, `<circle cx="120" cy="150" r="105" fill="#fff4d6"/>` + naiwa({ body: Y[0], shade: Y[1], x: 120, y: 170, s: 1.3,
  extra: crown() + `<path d="M-62 20 Q-80 50 -60 60 L-40 40Z M62 20 Q80 50 60 60 L40 40Z" fill="#c0392b"/>` }));
assets['face-A'] = svg(240, 300, `<circle cx="120" cy="150" r="105" fill="#f0ffe6"/>` + naiwa({ body: Y[0], shade: Y[1], x: 120, y: 175, s: 1.25,
  extra: `<path d="M0 -112 l9 18 l20 3 l-15 14 l4 20 l-18 -10 l-18 10 l4 -20 l-15 -14 l20 -3Z" fill="#ffcf33" stroke="#b07a00" stroke-width="3"/>` }));
let backPat = '';
for (let i = 0; i < 5; i++) for (let j = 0; j < 7; j++) backPat += `<circle cx="${20 + i * 40 + (j % 2) * 20}" cy="${20 + j * 42}" r="6" fill="#fff" opacity=".18"/>`;
assets['back'] = svg(200, 290, `<rect x="4" y="4" width="192" height="282" rx="18" fill="#4fae5a"/><rect x="14" y="14" width="172" height="262" rx="12" fill="none" stroke="#fff" stroke-width="4" opacity=".8"/>${backPat}` + naiwa({ x: 100, y: 150, s: .9 }));
let tbl = `<defs><radialGradient id="felt" cx="50%" cy="40%" r="75%"><stop offset="0" stop-color="#5cbf74"/><stop offset="1" stop-color="#2f7d4a"/></radialGradient></defs><rect width="512" height="512" fill="#43a35e"/>`;
for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) tbl += `<g opacity=".07">${naiwa({ x: 64 + i * 128 + (j % 2) * 64, y: 64 + j * 128, s: .35, body: '#fff', shade: '#fff' })}</g>`;
assets['table'] = svg(512, 512, tbl);
let conf = ''; const cols = ['#ff6f9c', '#ffcf33', '#4a9be0', '#6fb53a', '#e2731d'];
for (let i = 0; i < 40; i++) conf += `<rect x="${(i * 97) % 380 + 10}" y="${(i * 53) % 160 + 10}" width="10" height="6" fill="${cols[i % 5]}" transform="rotate(${i * 37} ${(i * 97) % 380 + 15} ${(i * 53) % 160 + 13})"/>`;
assets['win'] = svg(400, 360, conf + naiwa({ x: 200, y: 190, s: 1.6, extra: crown() +
  `<path d="M-64 0 Q-100 -40 -90 -70" stroke="${Y[1]}" stroke-width="14" fill="none" stroke-linecap="round"/><path d="M64 0 Q100 -40 90 -70" stroke="${Y[1]}" stroke-width="14" fill="none" stroke-linecap="round"/><path d="M-12 -10 Q0 8 12 -10Z" fill="#c0392b"/>` }));
const b = await chromium.launch(); const p = await b.newPage({ deviceScaleFactor: 2 });
for (const [k, v] of Object.entries(assets)) {
  writeFileSync(`scripts/.tmp-${k}.svg`, v);
  await p.setContent(`<body style="margin:0;background:transparent">${v}</body>`);
  await p.locator('svg').screenshot({ path: `${OUT}/${k}.png`, omitBackground: true });
}
await b.close(); console.log(Object.keys(assets).join(' '));
