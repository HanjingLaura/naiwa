import './style.css';
import { State, create, step, drop, saveBest, Block } from './stack';

const A = (n: string) => `${import.meta.env.BASE_URL}assets/${n}.webp`;
const $ = <T extends HTMLElement = HTMLElement>(id: string) => document.getElementById(id) as T;
const stage = $('stage'), world = $('world'); const N = 22;
let s: State | null = null; let last = 0; let raf = 0; let aspects: number[] = [];
let sound = localStorage.getItem('naiwa-stack-sound') !== '0'; let ac: AudioContext | null = null;
const beep = (f: number, d = 0.08, type: OscillatorType = 'triangle') => { if (!sound) return; try { ac ||= new AudioContext(); const o = ac.createOscillator(), v = ac.createGain(); o.type = type; o.frequency.value = f; v.gain.setValueAtTime(.14, ac.currentTime); v.gain.exponentialRampToValueAtTime(.001, ac.currentTime + d); o.connect(v).connect(ac.destination); o.start(); o.stop(ac.currentTime + d); } catch {} };
$('best').textContent = localStorage.getItem('naiwa-stack-best') || '0';
const loadAspects = () => Promise.all(Array.from({ length: N }, (_, i) => new Promise<number>(res => { const im = new Image(); im.onload = () => res(im.naturalHeight / im.naturalWidth); im.onerror = () => res(1); im.src = A('b' + i); })));
let u = 1; // px per world unit
const els: HTMLDivElement[] = []; let moverEl: HTMLDivElement | null = null; let baseEl: HTMLDivElement | null = null;
function yOf(i: number) { if (!s) return 0; let y = s.base.h; for (let k = 0; k < i; k++) y += s.blocks[k].h * 0.92; return y; }
function place(e: HTMLElement, b: Block, y: number) { Object.assign(e.style, { left: (b.x - b.w / 2) * u + 'px', width: b.w * u + 'px', height: b.h * u + 'px', bottom: y * u + 'px' }); }
function blockEl(v: number) { const e = document.createElement('div'); e.className = 'blk'; e.innerHTML = `<img src="${A('b' + v)}" alt="">`; world.appendChild(e); return e; }
function layout() {
  if (!s) return; u = stage.clientWidth / 100;
  if (!baseEl) { baseEl = document.createElement('div'); baseEl.className = 'base'; world.appendChild(baseEl); }
  Object.assign(baseEl.style, { left: (s.base.x - s.base.w / 2) * u + 'px', width: s.base.w * u + 'px', height: s.base.h * u + 'px', bottom: '0' });
  s.blocks.forEach((b, i) => { if (!els[i]) els[i] = blockEl(b.v); if (!els[i].classList.contains('fall')) place(els[i], b, yOf(i)); });
  const topY = yOf(s.blocks.length);
  const camera = Math.max(0, topY * u + s.mover.h * u * 1.7 - stage.clientHeight * 0.8);
  world.style.transform = `translateY(${camera}px)`;
  if (!s.over) { if (!moverEl) moverEl = blockEl(s.mover.v); place(moverEl, s.mover, topY + s.mover.h * 0.55); }
}
function loop(t: number) { if (!s) return; const dt = Math.min(0.05, (t - last) / 1000); last = t; step(s, dt); layout(); if (!s.over) raf = requestAnimationFrame(loop); }
function onDrop() {
  if (!s || s.over || !moverEl) return;
  const r = drop(s); const el = moverEl; moverEl = null;
  if (r.kind === 'miss') {
    el.classList.add('fall'); el.style.bottom = '-200px'; el.style.transform = `rotate(${s.mover.x > 50 ? 120 : -120}deg)`; beep(150, .5, 'sawtooth'); return setTimeout(end, 900);
  }
  els[s.blocks.length - 1] = el;
  if (r.kind === 'topple') {
    layout(); beep(150, .5, 'sawtooth');
    const pivot = s.blocks[r.at]; const right = s.blocks.slice(r.at).reduce((a, b) => a + b.x, 0) / (s.blocks.length - r.at) > (r.at ? s.blocks[r.at - 1].x : s.base.x);
    setTimeout(() => els.slice(r.at).forEach((e, k) => { e.classList.add('fall'); e.style.transformOrigin = right ? 'bottom right' : 'bottom left'; e.style.transform = `translateX(${(right ? 1 : -1) * (40 + k * 25)}px) rotate(${right ? 75 + k * 8 : -75 - k * 8}deg)`; e.style.bottom = (parseFloat(e.style.bottom) - 400) + 'px'; }), 200);
    void pivot; return setTimeout(end, 1400);
  }
  if (r.kind === 'perfect') { el.classList.add('perfect'); beep(660 + s.combo * 110, .15); if (s.combo >= 2) { const c = $('combo'); c.textContent = `完美 ×${s.combo}！`; c.classList.remove('show'); void c.offsetWidth; c.classList.add('show'); } }
  else beep(440, .07);
  $('score').textContent = String(s.blocks.length);
}
function begin() {
  cancelAnimationFrame(raf); world.innerHTML = ''; els.length = 0; moverEl = null; baseEl = null;
  s = create(aspects); $('overlay').hidden = true; $('score').textContent = '0'; last = performance.now(); raf = requestAnimationFrame(loop);
}
function end() {
  if (!s) return; const h = s.blocks.length - (s.fellAt >= 0 && s.fellAt < s.blocks.length ? s.blocks.length - s.fellAt : 0);
  const { best, isNew } = saveBest(h, localStorage); $('best').textContent = String(best);
  $<HTMLImageElement>('popimg').src = A(isNew ? 'win' : 'fall');
  $('poptitle').textContent = isNew ? '新纪录！' : '塌啦！';
  $('poptext').innerHTML = `叠了 <b>${h}</b> 只奶蛙 · 完美 ${s.perfects} 次 · 得分 ${s.score}<br/>历史最高 ${best} 只`;
  $('go').textContent = '再叠一次'; $('overlay').hidden = false;
}
stage.addEventListener('pointerdown', e => { e.preventDefault(); onDrop(); });
addEventListener('keydown', e => { if (e.code === 'Space') { e.preventDefault(); $('overlay').hidden ? onDrop() : begin(); } });
$('go').onclick = begin;
$('snd').textContent = sound ? '🔊' : '🔇';
$('snd').onclick = () => { sound = !sound; localStorage.setItem('naiwa-stack-sound', sound ? '1' : '0'); $('snd').textContent = sound ? '🔊' : '🔇'; };
addEventListener('resize', layout);
document.addEventListener('touchmove', e => e.preventDefault(), { passive: false });
(window as any).__stack = { get s() { return s; }, onDrop, begin };
loadAspects().then(a => { aspects = a; });
