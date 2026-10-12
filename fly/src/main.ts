import './style.css';
import { State, create, step, flap, saveBest, PIPE_W } from './fly';

const A = (n: string) => `${import.meta.env.BASE_URL}assets/${n}.webp`;
const $ = <T extends HTMLElement = HTMLElement>(id: string) => document.getElementById(id) as T;
const cv = $<HTMLCanvasElement>('cv'); const ctx = cv.getContext('2d')!;
let s: State | null = null; let raf = 0; let last = 0;
let sound = localStorage.getItem('naiwa-fly-sound') !== '0'; let ac: AudioContext | null = null;
const imgs: Record<string, HTMLImageElement> = {};
const load = (n: string) => new Promise<void>(res => { const i = new Image(); i.onload = () => { imgs[n] = i; res(); }; i.onerror = () => res(); i.src = A(n); });
const beep = (f: number, d = 0.07, type: OscillatorType = 'square') => {
  if (!sound) return;
  try { ac ||= new AudioContext(); const o = ac.createOscillator(), g = ac.createGain();
    o.type = type; o.frequency.value = f; g.gain.setValueAtTime(.1, ac.currentTime);
    g.gain.exponentialRampToValueAtTime(.001, ac.currentTime + d); o.connect(g).connect(ac.destination);
    o.start(); o.stop(ac.currentTime + d); } catch {}
};
$('best').textContent = localStorage.getItem('naiwa-fly-best') || '0';

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
  // pipes
  for (const p of s.pipes) {
    const im = imgs['block'] || imgs['platG'];
    const x = (p.x - PIPE_W / 2) * sx, w = PIPE_W * sx;
    const topH = (p.gapY - p.gapH / 2) * sy;
    const botY = (p.gapY + p.gapH / 2) * sy;
    if (im) {
      // tile vertically
      for (let y = topH - 48; y > -48; y -= 48) ctx.drawImage(im, x, y, w, 50);
      for (let y = botY; y < H; y += 48) ctx.drawImage(im, x, y, w, 50);
      // caps
      const cap = imgs['platG'] || im;
      ctx.drawImage(cap, x - 4, topH - 18, w + 8, 20);
      ctx.drawImage(cap, x - 4, botY, w + 8, 20);
    } else {
      ctx.fillStyle = '#5aaa3a'; ctx.fillRect(x, 0, w, topH); ctx.fillRect(x, botY, w, H - botY);
    }
  }
  const frog = imgs[s.alive ? 'frog' : 'frog-dizzy'];
  const fs = 14 * sx;
  const fx = 28 * sx - fs / 2, fy = s.y * sy - fs / 2;
  ctx.save();
  ctx.translate(28 * sx, s.y * sy);
  ctx.rotate(Math.max(-0.6, Math.min(0.9, s.vy / 80)));
  if (frog) ctx.drawImage(frog, -fs / 2, -fs / 2, fs, fs);
  else { ctx.fillStyle = '#ffe566'; ctx.fillRect(-fs / 2, -fs / 2, fs, fs); }
  ctx.restore();
  if (!s.started) {
    ctx.fillStyle = 'rgba(43,58,85,.55)'; ctx.font = '600 15px system-ui'; ctx.textAlign = 'center';
    ctx.fillText('点击起飞', W / 2, H * 0.4);
  }
}
function loop(t: number) {
  if (!s) return;
  const dt = Math.min(0.05, (t - last) / 1000); last = t;
  const prev = s.score;
  step(s, dt);
  if (s.score > prev) beep(780, .06, 'sine');
  $('score').textContent = String(s.score);
  draw();
  if (!s.alive) { beep(130, .4, 'sawtooth'); return end(); }
  raf = requestAnimationFrame(loop);
}
function begin() {
  cancelAnimationFrame(raf); s = create(); $('overlay').hidden = true; $('score').textContent = '0';
  last = performance.now(); raf = requestAnimationFrame(loop);
}
function end() {
  if (!s) return;
  const { best, isNew } = saveBest(s.score, localStorage);
  $('best').textContent = String(best);
  $<HTMLImageElement>('popimg').src = A(isNew ? 'win' : 'lose');
  $('poptitle').textContent = isNew ? '新纪录！' : '撞到啦！';
  $('poptext').innerHTML = `穿过 <b>${s.score}</b> 道缝<br/>历史最高 ${best}`;
  $('go').textContent = '再飞一次'; $('overlay').hidden = false;
}
function doFlap() { if (!s || !s.alive) return; flap(s); beep(520, .05, 'sine'); }
$('stage').addEventListener('pointerdown', e => { e.preventDefault(); doFlap(); });
addEventListener('keydown', e => { if (e.code === 'Space') { e.preventDefault(); if (!s || !s.alive) begin(); else doFlap(); } });
$('go').onclick = begin;
$('snd').textContent = sound ? '🔊' : '🔇';
$('snd').onclick = () => { sound = !sound; localStorage.setItem('naiwa-fly-sound', sound ? '1' : '0'); $('snd').textContent = sound ? '🔊' : '🔇'; };
addEventListener('resize', () => { resize(); draw(); });
document.addEventListener('touchmove', e => e.preventDefault(), { passive: false });
(window as any).__fly = { get s() { return s; }, begin };
Promise.all(['frog','frog-dizzy','block','platG','win','lose','hills'].map(load)).then(() => resize());
