import './style.css';
import { State, Card, newGame, move, deal, canDeal, canMove, isMovableRun, hints, isWon, SUIT_NAMES } from './rules';

const KEY = 'naiwa-spider-v1';
const A = (n: string) => `${import.meta.env.BASE_URL}assets/${n}.webp`;
const RANKS = ['', 'A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;
const board = $('board');
let state: State; let history: State[] = [];
let hintIdx = 0; let won = false;

function save() { try { localStorage.setItem(KEY, JSON.stringify({ state, history: history.slice(-200) })); } catch {} }
function load(): boolean {
  try { const d = JSON.parse(localStorage.getItem(KEY) || ''); if (d?.state?.cols?.length === 10) { state = d.state; history = d.history || []; return true; } } catch {}
  return false;
}
function start(suits: 1 | 2 | 4) { state = newGame(suits); history = []; won = false; $('win').hidden = true; save(); render(); }
function commit(n: State | null) {
  if (!n) return false;
  history.push(state); state = n; hintIdx = 0; save(); render();
  if (isWon(state) && !won) { won = true; setTimeout(showWin, 400); }
  return true;
}

// ---------- layout ----------
let L = { cw: 0, ch: 0, gap: 0, left: 0, top: 0, colX: (i: number) => 0, offs: [] as number[][] };
function layout() {
  const W = board.clientWidth, H = board.clientHeight;
  const gap = Math.max(3, W * 0.008);
  const cw = Math.min((W - gap * 11) / 10, (H * 0.25) / 1.4);
  const ch = cw * 1.4;
  const left = (W - (cw * 10 + gap * 9)) / 2;
  const top = ch * 0.2 + 4 + ch * 0.85; // row for stock/foundation on top
  const offs = state.cols.map(col => {
    const avail = H - top - ch - 4;
    let down = ch * 0.12, up = ch * 0.27;
    const nd = col.filter(c => !c.up).length, nu = col.length - nd;
    const need = nd * down + Math.max(0, nu - 1) * up;
    if (need > avail && need > 0) { const k = avail / need; down *= k; up *= k; }
    let y = 0; return col.map(c => { const v = y; y += c.up ? up : down; return v; });
  });
  L = { cw, ch, gap, left, top, colX: i => left + i * (cw + gap), offs };
}

// ---------- rendering ----------
const els = new Map<number, HTMLDivElement>();
function cardEl(c: Card): HTMLDivElement {
  let e = els.get(c.id);
  if (!e) { e = document.createElement('div'); e.dataset.id = String(c.id); els.set(c.id, e); }
  const key = c.up ? `u${c.rank}${c.suit}` : 'b';
  if (e.dataset.k !== key) {
    e.dataset.k = key;
    e.className = 'card' + (c.up ? (c.suit === 1 || c.suit === 3 ? ' red' : '') : ' back');
    const s = A('suit-' + SUIT_NAMES[c.suit]);
    e.innerHTML = c.up ? `<div class="corner">${RANKS[c.rank]}<img src="${s}" alt=""></div>` +
      (c.rank >= 11 || c.rank === 1 ? `<div class="face" style="background-image:url(${A('face-' + RANKS[c.rank])})"></div>` : `<div class="pip" style="background-image:url(${s})"></div><div class="num">${RANKS[c.rank]}</div>`) : '';
  }
  return e;
}
function render() {
  layout();
  const { cw, ch, top } = L;
  board.querySelectorAll('.slot,.stock,.found').forEach(e => e.remove());
  const keep = new Set<number>();
  const fs = Math.max(10, cw * 0.22);
  state.cols.forEach((col, i) => {
    const slot = document.createElement('div'); slot.className = 'slot';
    Object.assign(slot.style, { left: L.colX(i) + 'px', top: top + 'px', width: cw + 'px', height: ch + 'px' });
    board.appendChild(slot);
    col.forEach((c, j) => {
      const e = cardEl(c); keep.add(c.id);
      Object.assign(e.style, { left: L.colX(i) + 'px', top: top + L.offs[i][j] + 'px', width: cw + 'px', height: ch + 'px', zIndex: String(j + 1), fontSize: fs + 'px' });
      e.dataset.col = String(i); e.dataset.idx = String(j); e.classList.remove('hint');
      if (e.parentElement !== board) board.appendChild(e);
    });
  });
  for (const [id, e] of els) if (!keep.has(id)) { e.remove(); els.delete(id); }
  // stock (top-right)
  const st = document.createElement('div'); st.className = 'stock';
  const piles = Math.ceil(state.stock.length / 10);
  for (let p = 0; p < piles; p++) {
    const b = document.createElement('div'); b.className = 'card back';
    Object.assign(b.style, { left: p * cw * 0.18 + 'px', top: '0', width: cw + 'px', height: ch + 'px' }); st.appendChild(b);
  }
  Object.assign(st.style, { left: L.colX(9) - (piles - 1) * cw * 0.18 + 'px', top: '4px', width: cw + 'px', height: ch + 'px', opacity: canDeal(state) ? '1' : '.6' });
  st.onclick = () => { if (!commit(deal(state)) && state.stock.length) flash('有空列时不能发牌'); };
  board.appendChild(st);
  // foundation (top-left)
  const fd = document.createElement('div'); fd.className = 'found';
  Object.assign(fd.style, { left: L.left + 'px', top: '4px', height: ch + 'px', gap: '2px' });
  state.done.forEach(s => { const im = document.createElement('img'); im.src = A('suit-' + SUIT_NAMES[s]); im.style.width = cw * 0.8 + 'px'; im.style.height = cw * 0.8 + 'px'; fd.appendChild(im); });
  board.appendChild(fd);
  $('score').textContent = String(state.score); $('moves').textContent = String(state.moves); $('done').textContent = String(state.done.length);
  ($('undo') as HTMLButtonElement).disabled = !history.length;
  ($('diff') as HTMLSelectElement).value = String(state.suits);
}
function flash(msg: string) {
  const t = document.createElement('div'); t.textContent = msg;
  Object.assign(t.style, { position: 'fixed', left: '50%', bottom: '12%', transform: 'translateX(-50%)', background: 'rgba(0,0,0,.7)', padding: '8px 16px', borderRadius: '999px', zIndex: '3000' });
  document.body.appendChild(t); setTimeout(() => t.remove(), 1400);
}

// ---------- drag (pointer events: mouse + touch) ----------
let drag: { col: number; idx: number; els: HTMLDivElement[]; sx: number; sy: number; ox: number[]; oy: number[]; moved: boolean } | null = null;
board.addEventListener('pointerdown', ev => {
  const t = (ev.target as HTMLElement).closest('.card') as HTMLDivElement | null;
  if (!t || !t.dataset.col) return;
  const col = +t.dataset.col, idx = +t.dataset.idx!;
  if (!isMovableRun(state.cols[col], idx)) return;
  const list = state.cols[col].slice(idx).map(c => els.get(c.id)!);
  drag = { col, idx, els: list, sx: ev.clientX, sy: ev.clientY, ox: list.map(e => parseFloat(e.style.left)), oy: list.map(e => parseFloat(e.style.top)), moved: false };
  board.setPointerCapture(ev.pointerId); ev.preventDefault();
});
board.addEventListener('pointermove', ev => {
  if (!drag) return;
  const dx = ev.clientX - drag.sx, dy = ev.clientY - drag.sy;
  if (!drag.moved && Math.hypot(dx, dy) < 6) return;
  drag.moved = true;
  drag.els.forEach((e, i) => { e.classList.add('dragging'); e.style.left = drag!.ox[i] + dx + 'px'; e.style.top = drag!.oy[i] + dy + 'px'; e.style.zIndex = String(1000 + i); });
});
board.addEventListener('pointerup', ev => {
  if (!drag) return;
  const d = drag; drag = null; d.els.forEach(e => e.classList.remove('dragging'));
  let to = -1;
  if (d.moved) {
    const cx = parseFloat(d.els[0].style.left) + L.cw / 2;
    let best = Infinity;
    for (let i = 0; i < 10; i++) { const dist = Math.abs(L.colX(i) + L.cw / 2 - cx); if (dist < best && canMove(state, d.col, d.idx, i)) { best = dist; to = i; } }
    if (best > L.cw * 1.2) to = -1;
  } else {
    // tap: auto-move to best destination
    const opts = []; for (let i = 0; i < 10; i++) if (canMove(state, d.col, d.idx, i)) opts.push(i);
    const card = state.cols[d.col][d.idx];
    opts.sort((a, b) => score(b) - score(a));
    function score(i: number) { const t = state.cols[i]; if (!t.length) return 0; return t[t.length - 1].suit === card.suit ? 2 : 1; }
    to = opts[0] ?? -1;
  }
  if (to < 0 || !commit(move(state, d.col, d.idx, to))) render();
});
board.addEventListener('pointercancel', () => { drag = null; render(); });

// ---------- controls ----------
function showHint() {
  const hs = hints(state);
  if (!hs.length) { flash(canDeal(state) ? '没有可移动的牌，试试发牌' : '没有可用的移动'); return; }
  const h = hs[hintIdx++ % hs.length]; render();
  state.cols[h.from].slice(h.idx).forEach(c => els.get(c.id)!.classList.add('hint'));
  const t = state.cols[h.to]; if (t.length) els.get(t[t.length - 1].id)!.classList.add('hint');
  setTimeout(() => board.querySelectorAll('.hint').forEach(e => e.classList.remove('hint')), 1500);
}
function showWin() {
  $('winscore').textContent = `分数 ${state.score} · ${state.moves} 步`; $('win').hidden = false;
  for (let i = 0; i < 24; i++) {
    const im = document.createElement('img'); im.className = 'fly'; im.src = A('suit-' + SUIT_NAMES[i % 4]);
    const sz = 40 + Math.random() * 40; im.style.width = sz + 'px';
    document.body.appendChild(im);
    im.animate([{ transform: `translate(${Math.random() * innerWidth}px, ${innerHeight}px) rotate(0)` }, { transform: `translate(${Math.random() * innerWidth}px, ${-sz}px) rotate(${720 * Math.random()}deg)` }],
      { duration: 1800 + Math.random() * 1500, delay: Math.random() * 800, easing: 'ease-out', fill: 'forwards' }).onfinish = () => im.remove();
  }
}
$('new').onclick = () => { if (history.length === 0 || confirm('开始新局？')) start(+($('diff') as HTMLSelectElement).value as 1 | 2 | 4); };
$('diff').onchange = () => start(+($('diff') as HTMLSelectElement).value as 1 | 2 | 4);
$('undo').onclick = () => { const p = history.pop(); if (p) { state = p; won = isWon(state); save(); render(); } };
$('hint').onclick = showHint;
$('again').onclick = () => start(state.suits);
addEventListener('keydown', e => { if ((e.ctrlKey || e.metaKey) && e.key === 'z') $('undo').click(); if (e.key === 'h') showHint(); });
addEventListener('resize', () => render());
document.addEventListener('touchmove', e => e.preventDefault(), { passive: false });
(window as any).__naiwa = { get state() { return state; }, set: (s: State) => { state = s; history = []; won = false; render(); }, commit, showWin };

if (!load()) start(1); else render();
