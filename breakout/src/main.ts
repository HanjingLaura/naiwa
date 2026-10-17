import './style.css';
import { State, create, step, setPaddle, launch, saveBest } from './breakout';

const A = (n: string) => `${import.meta.env.BASE_URL}assets/${n}.webp`;
const $ = <T extends HTMLElement = HTMLElement>(id: string) => document.getElementById(id) as T;
const cv = $<HTMLCanvasElement>('cv'); const ctx = cv.getContext('2d')!;
let s: State | null = null; let raf = 0; let last = 0;
let sound = localStorage.getItem('naiwa-breakout-sound') !== '0'; let ac: AudioContext | null = null;
const imgs: Record<string, HTMLImageElement> = {};
const load = (n: string) => new Promise<void>(res => { const i = new Image(); i.onload = () => { imgs[n] = i; res(); }; i.onerror = () => res(); i.src = A(n); });
const beep = (f: number, d = 0.07, type: OscillatorType = 'square') => {
  if (!sound) return;
  try { ac ||= new AudioContext(); const o = ac.createOscillator(), g = ac.createGain();
    o.type = type; o.frequency.value = f; g.gain.setValueAtTime(.1, ac.currentTime);
    g.gain.exponentialRampToValueAtTime(.001, ac.currentTime + d); o.connect(g).connect(ac.destination);
    o.start(); o.stop(ac.currentTime + d); } catch {}
};
$('best').textContent = localStorage.getItem('naiwa-breakout-best') || '0';
const BRICK_KEYS = ['brickY', 'brickB', 'brickG', 'brickR'];

function resize() {
  const st = $('stage'); const dpr = Math.min(2, devicePixelRatio || 1);
  cv.width = st.clientWidth * dpr; cv.height = st.clientHeight * dpr;
  cv.style.width = st.clientWidth + 'px'; cv.style.height = st.clientHeight + 'px';
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}
function draw() {
  if (!s) return;
  const W = cv.clientWidth, H = cv.clientHeight, sx = W / 100, sy = H / 160;
  ctx.clearRect(0, 0, W, H);
  for (const b of s.bricks) {
    if (!b.alive) continue;
    const im = imgs[BRICK_KEYS[b.color]];
    const x = (b.x - b.w / 2) * sx, y = (b.y - b.h / 2) * sy, w = b.w * sx, h = b.h * sy;
    if (im) { ctx.globalAlpha = b.hp > 1 ? 1 : 0.75; ctx.drawImage(im, x, y, w, h); ctx.globalAlpha = 1; }
    else { ctx.fillStyle = ['#f5c542','#5ba3e0','#6cbc4a','#d4884a'][b.color]; ctx.fillRect(x, y, w, h); }
  }
  // paddle as frog
  const frog = imgs['frog'];
  const pw = s.paddleW * sx, ph = pw * 0.7;
  const px = s.paddleX * sx - pw / 2, py = H - 12 * sy - ph / 2;
  if (frog) ctx.drawImage(frog, px, py, pw, ph);
  else { ctx.fillStyle = '#ffe566'; ctx.fillRect(px, py, pw, ph * 0.4); }
  // ball as gem
  const gem = imgs['gem'];
  const br = s.ballR * sx * 1.6;
  if (gem) ctx.drawImage(gem, s.ballX * sx - br, s.ballY * sy - br, br * 2, br * 2);
  else { ctx.fillStyle = '#fff36a'; ctx.beginPath(); ctx.arc(s.ballX * sx, s.ballY * sy, br, 0, Math.PI * 2); ctx.fill(); }
  if (!s.launched) {
    ctx.fillStyle = 'rgba(43,58,85,.55)'; ctx.font = '600 14px system-ui'; ctx.textAlign = 'center';
    ctx.fillText('点击发射', W / 2, H * 0.72);
  }
}
function loop(t: number) {
  if (!s) return;
  const dt = Math.min(0.05, (t - last) / 1000); last = t;
  const prevCleared = s.cleared; const prevBalls = s.balls;
  step(s, dt);
  if (s.cleared > prevCleared) beep(520 + s.cleared * 8, .05);
  if (s.balls < prevBalls) beep(140, .35, 'sawtooth');
  $('score').textContent = String(s.score); $('balls').textContent = String(s.balls);
  draw();
  if (s.over) return end();
  raf = requestAnimationFrame(loop);
}
function begin() {
  cancelAnimationFrame(raf); s = create(); $('overlay').hidden = true;
  $('score').textContent = '0'; $('balls').textContent = '3';
  last = performance.now(); raf = requestAnimationFrame(loop);
}
function end() {
  if (!s) return;
  const { best, isNew } = saveBest(s.score, localStorage);
  $('best').textContent = String(best);
  $<HTMLImageElement>('popimg').src = A(s.won || isNew ? 'win' : 'lose');
  $('poptitle').textContent = s.won ? '清台！' : isNew ? '新纪录！' : '球掉啦！';
  $('poptext').innerHTML = `得分 <b>${s.score}</b> · 打掉 ${s.cleared} 块<br/>历史最高 ${best}`;
  $('go').textContent = '再来一局'; $('overlay').hidden = false;
}
function px(e: PointerEvent) { const r = cv.getBoundingClientRect(); return ((e.clientX - r.left) / r.width) * 100; }
cv.addEventListener('pointerdown', e => { if (!s || s.over) return; e.preventDefault(); setPaddle(s, px(e)); if (!s.launched) { launch(s); beep(880, .05, 'sine'); } });
cv.addEventListener('pointermove', e => { if (!s || s.over) return; if (e.pointerType === 'mouse' && !(e.buttons & 1)) { setPaddle(s, px(e)); return; } setPaddle(s, px(e)); });
addEventListener('keydown', e => {
  if (!s || s.over) { if (e.code === 'Space') begin(); return; }
  if (e.code === 'ArrowLeft') setPaddle(s, s.paddleX - 5);
  if (e.code === 'ArrowRight') setPaddle(s, s.paddleX + 5);
  if (e.code === 'Space') { if (!s.launched) launch(s); }
});
$('go').onclick = begin;
$('snd').textContent = sound ? '🔊' : '🔇';
$('snd').onclick = () => { sound = !sound; localStorage.setItem('naiwa-breakout-sound', sound ? '1' : '0'); $('snd').textContent = sound ? '🔊' : '🔇'; };
addEventListener('resize', () => { resize(); draw(); });
document.addEventListener('touchmove', e => e.preventDefault(), { passive: false });
(window as any).__breakout = { get s() { return s; }, begin };
Promise.all(['frog','gem','win','lose',...BRICK_KEYS].map(load)).then(() => resize());
