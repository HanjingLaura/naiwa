import './style.css';
import { State, create, startCharge, tickCharge, release, stepFly, saveBest } from './jump';

const A = (n: string) => `${import.meta.env.BASE_URL}assets/${n}.webp`;
const $ = <T extends HTMLElement = HTMLElement>(id: string) => document.getElementById(id) as T;
const cv = $<HTMLCanvasElement>('cv'); const ctx = cv.getContext('2d')!;
let s: State | null = null; let raf = 0; let last = 0;
let sound = localStorage.getItem('naiwa-jump-sound') !== '0'; let ac: AudioContext | null = null;
const imgs: Record<string, HTMLImageElement> = {};
const BLOCKS = ['block', 'block2', 'block3', 'block4'];
const load = (n: string) => new Promise<void>(res => { const i = new Image(); i.onload = () => { imgs[n] = i; res(); }; i.onerror = () => res(); i.src = A(n); });
const beep = (f: number, d = 0.08, type: OscillatorType = 'triangle') => {
  if (!sound) return;
  try { ac ||= new AudioContext(); const o = ac.createOscillator(), g = ac.createGain();
    o.type = type; o.frequency.value = f; g.gain.setValueAtTime(.12, ac.currentTime);
    g.gain.exponentialRampToValueAtTime(.001, ac.currentTime + d); o.connect(g).connect(ac.destination);
    o.start(); o.stop(ac.currentTime + d); } catch {}
};
$('best').textContent = localStorage.getItem('naiwa-jump-best') || '0';

function resize() {
  const st = $('stage'); const dpr = Math.min(2, devicePixelRatio || 1);
  cv.width = st.clientWidth * dpr; cv.height = st.clientHeight * dpr;
  cv.style.width = st.clientWidth + 'px'; cv.style.height = st.clientHeight + 'px';
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}
/** isometric-ish project */
function proj(x: number, z: number, y: number, W: number, H: number) {
  const camX = s ? s.frogX : 0, camZ = s ? s.frogZ : 0;
  const dx = x - camX, dz = z - camZ;
  const px = W * 0.5 + (dx - dz) * 2.1;
  const py = H * 0.62 + (dx + dz) * 1.05 - y * 2.4;
  return { px, py };
}
function draw() {
  if (!s) return;
  const W = cv.clientWidth, H = cv.clientHeight;
  ctx.clearRect(0, 0, W, H);
  const hills = imgs['hills'];
  if (hills) ctx.drawImage(hills, 0, H * 0.55, W, H * 0.35);
  // platforms back-to-front
  const order = [...s.plats.keys()].sort((a, b) => (s!.plats[a].x + s!.plats[a].z) - (s!.plats[b].x + s!.plats[b].z));
  for (const i of order) {
    const p = s.plats[i];
    const { px, py } = proj(p.x, p.z, 0, W, H);
    const im = imgs[BLOCKS[p.variant % 4]];
    const sz = p.size * 2.6;
    if (im) ctx.drawImage(im, px - sz / 2, py - sz * 0.35, sz, sz * 0.7);
    else { ctx.fillStyle = '#8d6'; ctx.beginPath(); ctx.ellipse(px, py, sz / 2, sz / 4, 0, 0, Math.PI * 2); ctx.fill(); }
  }
  const { px, py } = proj(s.frogX, s.frogZ, s.frogY, W, H);
  const frog = imgs[s.phase === 'charging' ? 'frog-dizzy' : 'frog'];
  const fs = 42 * (s.phase === 'charging' ? 1 - s.charge * 0.15 : 1);
  const fh = fs * (s.phase === 'charging' ? 1 - s.charge * 0.35 : 1);
  if (frog) ctx.drawImage(frog, px - fs / 2, py - fh - 8, fs, fh);
  else { ctx.fillStyle = '#ffe566'; ctx.fillRect(px - 16, py - 28, 32, 28); }
  $('bar').style.width = (s.charge * 100) + '%';
  $('power').classList.toggle('show', s.phase === 'charging');
}
function loop(t: number) {
  if (!s) return;
  const dt = Math.min(0.05, (t - last) / 1000); last = t;
  if (s.phase === 'charging') tickCharge(s, dt);
  if (s.phase === 'flying') {
    const r = stepFly(s, dt);
    if (r === 'ok') { beep(520, .08); $('score').textContent = String(s.score); }
    if (r === 'perfect') { beep(880, .12); $('score').textContent = String(s.score); }
    if (r === 'miss') { beep(140, .4, 'sawtooth'); return end(); }
  }
  draw();
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
  $('poptitle').textContent = isNew ? '新纪录！' : '掉下去了！';
  $('poptext').innerHTML = `跳了 <b>${s.score}</b> 分 · 完美 ${s.perfects} 次<br/>历史最高 ${best}`;
  $('go').textContent = '再跳一次'; $('overlay').hidden = false;
}
const stage = $('stage');
stage.addEventListener('pointerdown', e => { if (!s || s.phase === 'over') return; e.preventDefault(); startCharge(s); beep(200, .05, 'sine'); });
stage.addEventListener('pointerup', () => { if (!s) return; if (s.phase === 'charging') { release(s); beep(400, .06); } });
stage.addEventListener('pointercancel', () => { if (s && s.phase === 'charging') release(s); });
addEventListener('keydown', e => {
  if (e.code !== 'Space') return; e.preventDefault();
  if (!s || s.phase === 'over') return begin();
  if (e.repeat) return;
  if (s.phase === 'idle') startCharge(s);
});
addEventListener('keyup', e => { if (e.code === 'Space' && s?.phase === 'charging') release(s); });
$('go').onclick = begin;
$('snd').textContent = sound ? '🔊' : '🔇';
$('snd').onclick = () => { sound = !sound; localStorage.setItem('naiwa-jump-sound', sound ? '1' : '0'); $('snd').textContent = sound ? '🔊' : '🔇'; };
addEventListener('resize', () => { resize(); draw(); });
document.addEventListener('touchmove', e => e.preventDefault(), { passive: false });
(window as any).__jump = { get s() { return s; }, begin };
Promise.all(['frog','frog-dizzy','hills','win','lose',...BLOCKS].map(load)).then(() => resize());
