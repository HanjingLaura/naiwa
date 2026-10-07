import './style.css';
import { Board, createBoard, reveal, toggleFlag, chord, flagsLeft, LEVELS, Level } from './board';

const A = (n: string) => `${import.meta.env.BASE_URL}assets/${n}.webp`;
const $ = <T extends HTMLElement = HTMLElement>(id: string) => document.getElementById(id) as T;
const grid = $('grid'), wrap = $('wrap'), faceImg = $<HTMLImageElement>('faceimg');
const touch = matchMedia('(pointer: coarse)').matches;
let level: Level = (localStorage.getItem('naiwa-ms-level') as Level) || 'beginner';
if (!(level in LEVELS)) level = 'beginner';
let b: Board; let t0 = 0; let timer = 0; let flagMode = false; let transposed = false;
let cells: HTMLDivElement[] = [];

function newGame(l = level) {
  level = l; localStorage.setItem('naiwa-ms-level', l);
  const L = LEVELS[l]; b = createBoard(L.w, L.h, L.mines);
  clearInterval(timer); timer = 0; t0 = 0; $('timer').textContent = '000';
  $('overlay').hidden = true; setFace('idle');
  document.querySelectorAll<HTMLButtonElement>('.levels button').forEach(x => x.classList.toggle('on', x.dataset.l === l));
  build();
}
function setFace(f: 'idle' | 'worried' | 'win' | 'dizzy') { faceImg.src = A('face-' + f); }
/** logical index <-> display position (portrait phones show wide boards rotated 90°) */
function build() {
  const W = wrap.clientWidth - 12, H = wrap.clientHeight - 12;
  transposed = b.w > b.h && H > W;
  const cols = transposed ? b.h : b.w, rows = transposed ? b.w : b.h;
  const size = Math.max(14, Math.min(44, Math.floor(Math.min((W - 8) / cols, (H - 8) / rows) - 2)));
  grid.style.gridTemplateColumns = `repeat(${cols}, ${size}px)`;
  grid.style.gridAutoRows = `${size}px`; grid.style.fontSize = Math.round(size * 0.6) + 'px';
  grid.innerHTML = ''; cells = new Array(b.w * b.h);
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
    const i = transposed ? c * b.w + r : r * b.w + c;
    const d = document.createElement('div'); d.className = 'c'; d.dataset.i = String(i); cells[i] = d; grid.appendChild(d);
  }
  paint();
}
function paint() {
  b.cells.forEach((c, i) => {
    const d = cells[i]; let cls = 'c', html = '';
    if (c.open) {
      cls += ' o';
      if (c.mine) { html = `<img src="${A('mine')}" alt="">`; if (i === b.boom) cls += ' boom'; }
      else if (c.n) { html = String(c.n); cls += ' n' + c.n; }
    } else if (c.flag) { html = `<img src="${A('flag')}" alt="">`; if (b.status === 'lost' && !c.mine) cls += ' wrong'; }
    if (d.className !== cls) d.className = cls;
    if (d.innerHTML !== html) d.innerHTML = html;
  });
  const left = flagsLeft(b); $('count').textContent = (left < 0 ? '-' : '') + String(Math.abs(left)).padStart(left < 0 ? 2 : 3, '0');
  $('mode').classList.toggle('on', flagMode); $('mode').querySelector('span')!.textContent = `插旗模式：${flagMode ? '开' : '关'}`;
}
function after() {
  if (b.status === 'playing' && !timer) { t0 = Date.now(); timer = window.setInterval(tick, 250); }
  paint();
  if (b.status === 'won' || b.status === 'lost') end();
}
function tick() { $('timer').textContent = String(Math.min(999, Math.floor((Date.now() - t0) / 1000))).padStart(3, '0'); }
function end() {
  clearInterval(timer); tick(); const win = b.status === 'won'; const secs = Math.floor((Date.now() - t0) / 1000);
  setFace(win ? 'win' : 'dizzy');
  let best = '';
  if (win) { const k = 'naiwa-ms-best-' + level; const prev = +(localStorage.getItem(k) || 0); if (!prev || secs < prev) { localStorage.setItem(k, String(secs)); best = ' · 新纪录！'; } else best = ` · 最佳 ${prev} 秒`; }
  setTimeout(() => {
    const pop = document.querySelector('.pop')!; pop.className = 'pop ' + (win ? 'win' : 'lose');
    $<HTMLImageElement>('popimg').src = A(win ? 'win' : 'lose');
    $('poptitle').textContent = win ? '奶蛙安全啦！' : '奶蛙被砸晕了…';
    $('poptext').textContent = win ? `${LEVELS[level].label} · ${secs} 秒${best}` : '别灰心，再来一局吧';
    $('overlay').hidden = false;
  }, win ? 500 : 900);
}
// ---- input ----
const idxOf = (e: Event) => { const t = (e.target as HTMLElement).closest('.c') as HTMLElement | null; return t ? +t.dataset.i! : -1; };
let press: { i: number; timer: number; long: boolean; btn: number; x: number; y: number } | null = null;
const pressed: HTMLElement[] = [];
function showPress(i: number, withNeighbours: boolean) {
  clearPress(); if (b.status === 'won' || b.status === 'lost') return;
  const list = [i]; if (withNeighbours) { const x = i % b.w, y = (i / b.w) | 0; for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { const nx = x + dx, ny = y + dy; if (nx >= 0 && ny >= 0 && nx < b.w && ny < b.h) list.push(ny * b.w + nx); } }
  for (const j of list) { const c = b.cells[j]; if (!c.open && !c.flag) { cells[j].classList.add('press'); pressed.push(cells[j]); } }
  setFace('worried');
}
function clearPress() { pressed.splice(0).forEach(e => e.classList.remove('press')); if (b.status !== 'won' && b.status !== 'lost') setFace('idle'); }
function act(i: number, kind: 'reveal' | 'flag' | 'chord') {
  const c = b.cells[i];
  if (kind === 'flag') { if (toggleFlag(b, i)) { navigator.vibrate?.(20); paint(); } return; }
  if (c.open || kind === 'chord') chord(b, i); else reveal(b, i);
  after();
}
grid.addEventListener('contextmenu', e => e.preventDefault());
grid.addEventListener('pointerdown', e => {
  const i = idxOf(e); if (i < 0) return; e.preventDefault();
  const both = e.buttons === 3 || e.button === 1;
  press = { i, long: false, btn: both ? 1 : e.button, x: e.clientX, y: e.clientY, timer: 0 };
  if (e.button === 2 && !both) return; // right click handled on up
  showPress(i, both || b.cells[i].open);
  if (e.pointerType !== 'mouse') press.timer = window.setTimeout(() => { if (!press) return; press.long = true; clearPress(); act(press.i, flagMode ? 'reveal' : 'flag'); }, 380);
});
grid.addEventListener('pointermove', e => { if (press && Math.hypot(e.clientX - press.x, e.clientY - press.y) > 12) { clearTimeout(press.timer); clearPress(); press = null; } });
grid.addEventListener('pointerup', e => {
  if (!press) return; const p = press; press = null; clearTimeout(p.timer); clearPress();
  if (p.long) return;
  const i = idxOf(e) >= 0 ? idxOf(e) : p.i;
  if (p.btn === 1 || e.buttons === 1 && p.btn === 2) return act(i, 'chord');
  if (p.btn === 2) return act(i, 'flag');
  if (b.cells[i].open) return act(i, 'chord');
  act(i, flagMode ? 'flag' : 'reveal');
});
grid.addEventListener('pointercancel', () => { if (press) clearTimeout(press.timer); press = null; clearPress(); });
document.querySelectorAll<HTMLButtonElement>('.levels button').forEach(x => x.onclick = () => newGame(x.dataset.l as Level));
$('face').onclick = () => newGame(); $('again').onclick = () => newGame();
$('mode').onclick = () => { flagMode = !flagMode; paint(); };
addEventListener('keydown', e => { if (e.key === 'f') $('mode').click(); if (e.key === 'n' || e.key === 'F2') newGame(); });
addEventListener('resize', () => build());
document.addEventListener('touchmove', e => e.preventDefault(), { passive: false });
$('tip').textContent = touch ? '点按翻开 · 长按插旗 · 点数字快开' : '左键翻开 · 右键插旗 · 双键/中键/点数字快开';
(window as any).__ms = { get b() { return b; }, after, newGame };
newGame();
