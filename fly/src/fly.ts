/** 奶蛙飞飞 — flappy-style. World 100×160. */
export interface Pipe { x: number; gapY: number; gapH: number; scored: boolean }
export interface State {
  w: number; h: number; y: number; vy: number; alive: boolean; started: boolean;
  pipes: Pipe[]; score: number; elapsed: number; speed: number;
}
export const GRAVITY = 140, FLAP = -58, PIPE_W = 14;
export function create(): State {
  return { w: 100, h: 160, y: 80, vy: 0, alive: true, started: false, pipes: [], score: 0, elapsed: 0, speed: 32 };
}
export function flap(s: State) {
  if (!s.alive) return;
  s.started = true; s.vy = FLAP;
}
function spawnPipe(s: State, rng = Math.random) {
  const gapH = Math.max(32, 48 - s.score * 0.35);
  const margin = 18;
  const gapY = margin + gapH / 2 + rng() * (s.h - margin * 2 - gapH);
  s.pipes.push({ x: s.w + PIPE_W, gapY, gapH, scored: false });
}
export function step(s: State, dt: number, rng = Math.random) {
  if (!s.alive || !s.started) return;
  s.elapsed += dt;
  s.speed = Math.min(58, 32 + s.score * 0.6);
  s.vy += GRAVITY * dt; s.y += s.vy * dt;
  if (s.y < 4 || s.y > s.h - 18) { s.alive = false; return; }
  // spawn
  const last = s.pipes[s.pipes.length - 1];
  if (!last || last.x < s.w - 48) spawnPipe(s, rng);
  const frogX = 28, frogR = 5;
  for (const p of s.pipes) {
    p.x -= s.speed * dt;
    if (!p.scored && p.x + PIPE_W / 2 < frogX) { p.scored = true; s.score += 1; }
    // collision with pipe body
    if (Math.abs(p.x - frogX) < PIPE_W / 2 + frogR) {
      const top = p.gapY - p.gapH / 2, bot = p.gapY + p.gapH / 2;
      if (s.y - frogR < top || s.y + frogR > bot) { s.alive = false; return; }
    }
  }
  s.pipes = s.pipes.filter(p => p.x > -20);
}
export function saveBest(score: number, store: Pick<Storage, 'getItem' | 'setItem'>, key = 'naiwa-fly-best') {
  const prev = +(store.getItem(key) || 0);
  if (score > prev) { store.setItem(key, String(score)); return { best: score, isNew: true }; }
  return { best: prev, isNew: false };
}
