import './style.css';
import { State, create, step, setFrog, saveBest } from './catch';

const A = (n: string) => `${import.meta.env.BASE_URL}assets/${n}.webp`;
const $ = <T extends HTMLElement = HTMLElement>(id: string) => document.getElementById(id) as T;
const cv = $<HTMLCanvasElement>('cv');
const ctx = cv.getContext('2d')!;
let s: State | null = null; let raf = 0; let last = 0;
let sound = localStorage.getItem('naiwa-catch-sound') !== '0'; let ac: AudioContext | null = null;
const imgs: Record<string, HTMLImageElement> = {};
const load = (n: string) => new Promise<void>(res => { const i = new Image(); i.onload = () => { imgs[n] = i; res(); }; i.onerror = () => res(); i.src = A(n); });
const beep = (f: number, d = 0.08, type: OscillatorType = 'triangle') => {
  if (!sound) return;
  try { ac ||= new AudioContext(); const o = ac.createOscillator(), g = ac.createGain();
    o.type = type; o.frequency.value = f; g.gain.setValueAtTime(.12, ac.currentTime);
    g.gain.exponentialRampToValueAtTime(.001, ac.currentTime + d); o.connect(g).connect(ac.destination);
    o.start(); o.stop(ac.currentTime + d); } catch {}
};
$('best').textContent = localStorage.getItem('naiwa-catch-best') || '0';

function resize() {
  const st = $('stage'); const dpr = Math.min(2, devicePixelRatio || 1);
  cv.width = st.clientWidth * dpr; cv.height = st.clientHeight * dpr;
  cv.style.width = st.clientWidth + 'px'; cv.style.height = st.clientHeight + 'px';
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}
function world() {
  const W = cv.clientWidth || 1, H = cv.clientHeight || 1;
  return { W, H, sx: W / 100, sy: H / 160 };
}
function draw() {
  if (!s) return;
  const { W, H, sx, sy } = world();
  ctx.clearRect(0, 0, W, H);
  const hills = imgs['hills'];
  if (hills) ctx.drawImage(hills, 0, H - H * 0.28, W, H * 0.28);
  for (const d of s.drops) {
    const key = d.kind === 'bomb' ? 'bomb' : d.kind === 'gem' ? 'gem' : 'fruit' + d.variant;
    const im = imgs[key];
    const rw = d.r * 2 * sx, rh = d.r * 2 * sy;
    const x = d.x * sx - rw / 2, y = d.y * sy - rh / 2;
    if (im) ctx.drawImage(im, x, y, rw, rh);
    else { ctx.fillStyle = d.kind === 'bomb' ? '#e44' : '#fc6'; ctx.beginPath(); ctx.arc(d.x * sx, d.y * sy, d.r * sx, 0, Math.PI * 2); ctx.fill(); }
  }
  const frog = imgs[s.lives <= 1 ? 'frog-dizzy' : 'frog'];
  const fw = s.frogW * sx, fh = fw * 1.05;
  const fx = s.frogX * sx - fw / 2, fy = H - fh - 8;
  if (frog) ctx.drawImage(frog, fx, fy, fw, fh);
  else { ctx.fillStyle = '#ffe566'; ctx.fillRect(fx, fy, fw, fh); }
}
function loop(t: number) {
  if (!s) return;
  const dt = Math.min(0.05, (t - last) / 1000); last = t;
  const prev = s.score; const lives = s.lives; const combo = s.combo;
  step(s, dt);
  if (s.score > prev) beep(660 + Math.min(400, s.combo * 40), .07);
  if (s.lives < lives) beep(120, .3, 'sawtooth');
  $('score').textContent = String(s.score);
  $('lives').textContent = String(s.lives);
  draw();
  if (s.over) return end();
  raf = requestAnimationFrame(loop);
}
function begin() {
  cancelAnimationFrame(raf); s = create(); $('overlay').hidden = true;
  $('score').textContent = '0'; $('lives').textContent = '3';
  last = performance.now(); raf = requestAnimationFrame(loop);
}
function end() {
  if (!s) return;
  const { best, isNew } = saveBest(s.score, localStorage);
  $('best').textContent = String(best);
  $<HTMLImageElement>('popimg').src = A(isNew ? 'win' : 'lose');
  $('poptitle').textContent = isNew ? '新纪录！' : '接不住啦！';
  $('poptext').innerHTML = `得分 <b>${s.score}</b> · 接到 ${s.caught} 个 · 最高连击 ${s.maxCombo}<br/>历史最高 ${best}`;
  $('go').textContent = '再来一局'; $('overlay').hidden = false;
}
function pointerX(e: PointerEvent) {
  const rect = cv.getBoundingClientRect();
  return ((e.clientX - rect.left) / rect.width) * 100;
}
cv.addEventListener('pointerdown', e => { if (!s || s.over) return; e.preventDefault(); setFrog(s, pointerX(e)); });
cv.addEventListener('pointermove', e => { if (!s || s.over || !(e.buttons & 1) && e.pointerType === 'mouse') { if (e.pointerType !== 'touch' && e.pointerType !== 'pen' && !(e.buttons & 1)) return; } if (!s || s.over) return; setFrog(s, pointerX(e)); });
addEventListener('keydown', e => {
  if (!s || s.over) { if (e.code === 'Space') begin(); return; }
  if (e.code === 'ArrowLeft') setFrog(s, s.frogX - 6);
  if (e.code === 'ArrowRight') setFrog(s, s.frogX + 6);
});
$('go').onclick = begin;
$('snd').textContent = sound ? '🔊' : '🔇';
$('snd').onclick = () => { sound = !sound; localStorage.setItem('naiwa-catch-sound', sound ? '1' : '0'); $('snd').textContent = sound ? '🔊' : '🔇'; };
addEventListener('resize', () => { resize(); draw(); });
document.addEventListener('touchmove', e => e.preventDefault(), { passive: false });
(window as any).__catch = { get s() { return s; }, begin };
Promise.all(['frog','frog-dizzy','hills','bomb','gem',...Array.from({length:8},(_,i)=>'fruit'+i)].map(load)).then(() => { resize(); });
