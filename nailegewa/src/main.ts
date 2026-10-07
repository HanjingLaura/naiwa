import './style.css';
import { Game, generate, clickable, pick, undo, moveOut, shuffle, onBoard, TRAY, LEVELS } from './game';

const A = (n: string) => `${import.meta.env.BASE_URL}assets/${n}.webp`;
const $ = <T extends HTMLElement = HTMLElement>(id: string) => document.getElementById(id) as T;
const board = $('board'), tray = $('tray'), buffer = $('buffer'), piles = $('piles');
let g: Game; let level = Math.min(+(localStorage.getItem('naiwa-nlgw-level') || 0), LEVELS.length - 1);
let sound = localStorage.getItem('naiwa-nlgw-sound') !== '0';
let ac: AudioContext | null = null;
function beep(f: number, d = 0.08, type: OscillatorType = 'triangle') {
  if (!sound) return; try { ac ||= new AudioContext(); const o = ac.createOscillator(), v = ac.createGain(); o.type = type; o.frequency.value = f;
    v.gain.setValueAtTime(0.15, ac.currentTime); v.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + d); o.connect(v).connect(ac.destination); o.start(); o.stop(ac.currentTime + d); } catch {}
}
function start(l = level) {
  level = l; localStorage.setItem('naiwa-nlgw-level', String(l)); g = generate(l); $('overlay').hidden = true;
  $('lvl').textContent = `第 ${l + 1} 关${l === 0 ? ' · 教学' : ' · 地狱'}`; build();
}
const els = new Map<number, HTMLDivElement>();
function tileEl(id: number) {
  let e = els.get(id); if (!e) { e = document.createElement('div'); e.className = 'tile'; e.dataset.id = String(id); els.set(id, e); }
  const k = 't' + g.tiles[id].type; if (e.dataset.k !== k) { e.dataset.k = k; e.innerHTML = `<img src="${A(k)}" alt="">`; }
  return e;
}
function build() { board.innerHTML = ""; buffer.innerHTML = ""; els.clear(); render(); render(); } // second pass: board size depends on the side piles row
function render() {
  const W = board.clientWidth, H = board.clientHeight;
  const u = Math.min(W / g.cols, H / g.rows); const ox = (W - u * g.cols) / 2, oy = (H - u * g.rows) / 2;
  const live = g.tiles.filter(t => onBoard(g, t) && t.stack === undefined).sort((a, b) => a.layer - b.layer);
  const keep = new Set(live.map(t => t.id));
  board.querySelectorAll<HTMLElement>('.tile').forEach(e => { if (!keep.has(+e.dataset.id!)) e.remove(); });
  for (const t of live) {
    const e = tileEl(t.id);
    Object.assign(e.style, { left: ox + t.x * u + 'px', top: oy + t.y * u + 'px', width: 2 * u - 2 + 'px', height: 2 * u - 2 + 'px', zIndex: String(t.layer * 10 + 1) });
    e.classList.toggle('covered', !clickable(g, t.id));
    if (e.parentElement !== board) board.appendChild(e);
  }
  const ts = Math.min(56, (tray.clientWidth - 40) / 7);
  piles.innerHTML = ''; piles.hidden = !g.tiles.some(t => t.stack !== undefined);
  for (let st = 0; st < 2; st++) {
    const pile = g.tiles.filter(t => t.stack === st && onBoard(g, t)).sort((a, b) => a.idx! - b.idx!);
    const wrap = document.createElement('div'); wrap.className = 'pile'; wrap.style.width = ts + pile.length * 4 + 'px'; wrap.style.height = ts + 'px';
    pile.forEach((t, k) => {
      const topCard = k === pile.length - 1; const e = topCard ? tileEl(t.id) : document.createElement('div');
      if (!topCard) e.className = 'tile back'; else e.classList.remove('covered');
      Object.assign(e.style, { left: k * 4 + 'px', top: '0', width: ts + 'px', height: ts + 'px', zIndex: String(k + 1) }); wrap.appendChild(e);
    });
    const n = document.createElement('span'); n.className = 'cnt'; n.textContent = String(pile.length); wrap.appendChild(n); piles.appendChild(wrap);
  }
  buffer.innerHTML = ''; g.buffer.forEach(id => { const e = tileEl(id); e.classList.remove('covered'); Object.assign(e.style, { left: '', top: '', width: ts + 'px', height: ts + 'px', zIndex: '' }); buffer.appendChild(e); });
  tray.innerHTML = '';
  for (let i = 0; i < TRAY; i++) {
    const s = document.createElement('div'); s.className = 'slot' + (g.tray.length >= TRAY - 1 && i >= g.tray.length ? ' danger' : '');
    const id = g.tray[i]; if (id !== undefined) { const e = tileEl(id); e.classList.remove('covered'); Object.assign(e.style, { left: '', top: '', width: '', height: '', zIndex: '' }); s.appendChild(e); }
    tray.appendChild(s);
  }
  ($('p-undo') as HTMLButtonElement).disabled = !g.props.undo || !g.history.length;
  ($('p-out') as HTMLButtonElement).disabled = !g.props.moveOut || !g.tray.length;
  ($('p-shuffle') as HTMLButtonElement).disabled = !g.props.shuffle;
}
function onPick(id: number) {
  if (!clickable(g, id)) return;
  const { cleared } = pick(g, id); beep(cleared >= 0 ? 880 : 520, cleared >= 0 ? 0.2 : 0.06);
  render();
  if (cleared >= 0) tray.classList.add('pop-clear'), setTimeout(() => tray.classList.remove('pop-clear'), 350);
  if (g.status !== 'playing') setTimeout(end, 350);
}
function end() {
  const win = g.status === 'won'; beep(win ? 1046 : 180, 0.4, win ? 'sine' : 'sawtooth');
  $<HTMLImageElement>('popimg').src = A(win ? 'win' : 'lose');
  $('poptitle').textContent = win ? (level === LEVELS.length - 1 ? '通关啦！奶蛙之王！' : '过关！') : '槽满了，奶蛙晕了…';
  $('poptext').textContent = win ? (level === LEVELS.length - 1 ? '第 2 关都被你打穿了，你就是奶蛙之王！' : '热身结束。第 2 关是真正的挑战，祝你好运。') : '道具每局各能用一次，记得用哦';
  $('next').hidden = !win || level === LEVELS.length - 1; $('retry').textContent = win ? '再玩一次' : '再试一次';
  $('overlay').hidden = false;
}
board.addEventListener('pointerdown', e => { const t = (e.target as HTMLElement).closest('.tile') as HTMLElement | null; if (t) { e.preventDefault(); onPick(+t.dataset.id!); } });
piles.addEventListener('pointerdown', e => { const t = (e.target as HTMLElement).closest('.tile[data-id]') as HTMLElement | null; if (t) { e.preventDefault(); onPick(+t.dataset.id!); } });
buffer.addEventListener('pointerdown', e => { const t = (e.target as HTMLElement).closest('.tile') as HTMLElement | null; if (t) { e.preventDefault(); onPick(+t.dataset.id!); } });
$('p-undo').onclick = () => { if (undo(g)) { beep(400); render(); } };
$('p-out').onclick = () => { if (moveOut(g)) { beep(600); render(); } };
$('p-shuffle').onclick = () => { if (shuffle(g)) { beep(700); build(); } };
$('restart').onclick = () => start(); $('retry').onclick = () => start(); $('next').onclick = () => start(level + 1);
$('snd').textContent = sound ? '🔊' : '🔇';
$('snd').onclick = () => { sound = !sound; localStorage.setItem('naiwa-nlgw-sound', sound ? '1' : '0'); $('snd').textContent = sound ? '🔊' : '🔇'; };
addEventListener('resize', () => render());
document.addEventListener('touchmove', e => e.preventDefault(), { passive: false });
(window as any).__nlgw = { get g() { return g; }, onPick, start };
start();
