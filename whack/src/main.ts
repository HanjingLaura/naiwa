import type { Mole } from './whack';
import './style.css';
import { State, create, tick, whack, timeLeft, saveBest, HOLES } from './whack';

// each pop gets a stable variant from its spawn time, so every mole looks different
const v = (m: Mole, n: number) => Math.floor(m.up / 7) % n;
const pick = (m: Mole) => m.kind === 'normal' ? (m.hit ? `hit${v(m, 4)}` : `normal${v(m, 12)}`) : m.kind === 'gold' ? (m.hit ? 'gold-hit' : `gold${v(m, 3)}`) : (m.hit ? 'bomb-hit' : `bomb${v(m, 3)}`);
const A = (n: string) => `${import.meta.env.BASE_URL}assets/${n}.webp`;
const $ = <T extends HTMLElement = HTMLElement>(id: string) => document.getElementById(id) as T;
const field = $('field'); let s: State | null = null; let raf = 0;
let sound = localStorage.getItem('naiwa-whack-sound') !== '0'; let ac: AudioContext | null = null;
const beep = (f: number, d = 0.08, type: OscillatorType = 'square') => { if (!sound) return; try { ac ||= new AudioContext(); const o = ac.createOscillator(), v = ac.createGain(); o.type = type; o.frequency.value = f; v.gain.setValueAtTime(.12, ac.currentTime); v.gain.exponentialRampToValueAtTime(.001, ac.currentTime + d); o.connect(v).connect(ac.destination); o.start(); o.stop(ac.currentTime + d); } catch {} };
$('best').textContent = localStorage.getItem('naiwa-whack-best') || '0';
const holes: HTMLDivElement[] = [];
for (let i = 0; i < HOLES; i++) {
  const h = document.createElement('div'); h.className = 'hole'; h.dataset.i = String(i);
  h.innerHTML = `<div class="mole"><img alt=""/></div><div class="lip"></div>`; field.appendChild(h); holes.push(h);
}
function paint(now: number) {
  if (!s) return;
  s.holes.forEach((m, i) => {
    const h = holes[i]; const img = h.querySelector('img')!;
    h.classList.toggle('up', !!m && (!m.hit || now - m.hitAt < 250)); h.classList.toggle('gold', m?.kind === 'gold'); h.classList.toggle('hit', !!m?.hit);
    if (m) { const src = A(pick(m)); if (img.getAttribute('src') !== src) img.src = src; }
  });
  const t = Math.ceil(timeLeft(s, now) / 1000); $('time').textContent = String(t); $('time').classList.toggle('low', t <= 10);
  $('score').textContent = String(s.score); $('combo').textContent = s.combo >= 5 ? `${s.combo} 🔥` : String(s.combo);
  document.body.classList.toggle('stun', now < s.stunUntil);
}
function loop() {
  if (!s) return; const now = performance.now(); const r = tick(s, now); if (r.spawned.length) beep(330, .04, 'sine');
  paint(now); if (s.over) return end(); raf = requestAnimationFrame(loop);
}
function floatText(i: number, txt: string, cls: string) { const f = document.createElement('div'); f.className = 'float ' + cls; f.textContent = txt; holes[i].appendChild(f); setTimeout(() => f.remove(), 700); }
field.addEventListener('pointerdown', e => {
  if (!s || s.over) return; const h = (e.target as HTMLElement).closest('.hole') as HTMLElement | null; if (!h) return; e.preventDefault();
  const i = +h.dataset.i!; const now = performance.now(); const r = whack(s, i, now);
  if (r.kind === 'normal' || r.kind === 'gold') { beep(r.kind === 'gold' ? 1200 : 760, .1); navigator.vibrate?.(15); floatText(i, `+${r.points}${r.combo >= 5 ? ` x${r.combo}` : ''}`, r.kind === 'gold' ? 'gold' : '');
    const b = document.createElement('div'); b.className = 'boom'; b.textContent = '💥'; holes[i].appendChild(b); setTimeout(() => b.remove(), 350); }
  else if (r.kind === 'bomb') { beep(120, .35, 'sawtooth'); navigator.vibrate?.([40, 40, 40]); floatText(i, `${r.points}`, 'neg'); }
  paint(now);
});
function begin() { cancelAnimationFrame(raf); s = create(performance.now()); $('overlay').hidden = true; loop(); }
function end() {
  if (!s) return; const { best, isNew } = saveBest(s.score, localStorage); $('best').textContent = String(best);
  beep(isNew ? 1046 : 440, .4, 'sine');
  $<HTMLImageElement>('popimg').src = A(isNew ? 'win' : 'normal0');
  $('poptitle').textContent = isNew ? '新纪录！' : '时间到！';
  $('poptext').innerHTML = `得分 <b>${s.score}</b> · 命中 ${s.hits} · 最高连击 ${s.maxCombo}<br/>历史最高 ${best}`;
  $('go').textContent = '再来一局'; $('overlay').hidden = false;
}
$('go').onclick = begin;
$('snd').textContent = sound ? '🔊' : '🔇';
$('snd').onclick = () => { sound = !sound; localStorage.setItem('naiwa-whack-sound', sound ? '1' : '0'); $('snd').textContent = sound ? '🔊' : '🔇'; };
document.addEventListener('touchmove', e => e.preventDefault(), { passive: false });
(window as any).__whack = { get s() { return s; }, begin };
