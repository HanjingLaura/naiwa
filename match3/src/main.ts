import './style.css';
import { State, create, tap, SIZE, saveBest } from './match3';

const A = (n: string) => `${import.meta.env.BASE_URL}assets/${n}.webp`;
const FACE = ['face0','face1','face2','face3','face4']; // TYPES=5; frog as bonus look via face — also fruit mix
const TILE = ['face0','face1','fruit0','fruit2','fruit4'];
const $ = <T extends HTMLElement = HTMLElement>(id: string) => document.getElementById(id) as T;
const board = $('board');
let s: State | null = null;
let sound = localStorage.getItem('naiwa-match3-sound') !== '0'; let ac: AudioContext | null = null;
const beep = (f: number, d = 0.07, type: OscillatorType = 'triangle') => {
  if (!sound) return;
  try { ac ||= new AudioContext(); const o = ac.createOscillator(), g = ac.createGain();
    o.type = type; o.frequency.value = f; g.gain.setValueAtTime(.11, ac.currentTime);
    g.gain.exponentialRampToValueAtTime(.001, ac.currentTime + d); o.connect(g).connect(ac.destination);
    o.start(); o.stop(ac.currentTime + d); } catch {}
};

function layout() {
  const side = Math.min($('stage').clientWidth, $('stage').clientHeight) - 24;
  const cs = Math.floor((side - 4 * (SIZE - 1) - 16) / SIZE);
  board.style.setProperty('--cs', cs + 'px');
  board.style.gridTemplateColumns = `repeat(${SIZE}, ${cs}px)`;
}
function paint() {
  if (!s) return;
  board.innerHTML = '';
  for (let r = 0; r < SIZE; r++) for (let c = 0; c < SIZE; c++) {
    const i = r * SIZE + c;
    const cell = document.createElement('div');
    cell.className = 'cell' + (s.selected === i ? ' sel' : '');
    const t = s.grid[r][c];
    if (t >= 0) cell.innerHTML = `<img src="${A(TILE[t])}" alt="">`;
    cell.onclick = () => onTap(i);
    board.appendChild(cell);
  }
  $('score').textContent = String(s.score);
  $('moves').textContent = String(s.moves);
  $('goal').textContent = String(s.goal);
}
function onTap(i: number) {
  if (!s || s.over) return;
  const r = tap(s, i);
  if (r === 'select') beep(400, .04, 'sine');
  if (r === 'swap') beep(660, .1);
  if (r === 'reject') beep(160, .1, 'sawtooth');
  paint();
  if (s.over) end();
}
function begin() {
  s = create(); $('overlay').hidden = true; layout(); paint();
}
function end() {
  if (!s) return;
  const { best, isNew } = saveBest(s.score, localStorage);
  $<HTMLImageElement>('popimg').src = A(s.won || isNew ? 'win' : 'lose');
  $('poptitle').textContent = s.won ? '过关！' : isNew ? '新纪录！' : '步数用完';
  $('poptext').innerHTML = `得分 <b>${s.score}</b> / 目标 ${s.goal}<br/>历史最高 ${best}`;
  $('go').textContent = '再来一局'; $('overlay').hidden = false;
}
$('go').onclick = begin;
$('snd').textContent = sound ? '🔊' : '🔇';
$('snd').onclick = () => { sound = !sound; localStorage.setItem('naiwa-match3-sound', sound ? '1' : '0'); $('snd').textContent = sound ? '🔊' : '🔇'; };
addEventListener('resize', () => { layout(); });
document.addEventListener('touchmove', e => e.preventDefault(), { passive: false });
(window as any).__match3 = { get s() { return s; }, begin };
layout();
