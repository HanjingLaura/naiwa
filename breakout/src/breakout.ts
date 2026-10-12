/** 奶蛙打砖块 — pure logic. World 100×160. */
export interface Brick { x: number; y: number; w: number; h: number; hp: number; color: number; alive: boolean }
export interface State {
  w: number; h: number; paddleX: number; paddleW: number; paddleH: number;
  ballX: number; ballY: number; ballVX: number; ballVY: number; ballR: number; launched: boolean;
  bricks: Brick[]; score: number; balls: number; over: boolean; won: boolean; cleared: number;
}
const COLORS = 4;
export function makeBricks(rows = 5, cols = 8): Brick[] {
  const bricks: Brick[] = [];
  const gap = 1.2, top = 18, bw = (100 - gap * (cols + 1)) / cols, bh = 6;
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
    bricks.push({ x: gap + c * (bw + gap) + bw / 2, y: top + r * (bh + gap) + bh / 2, w: bw, h: bh, hp: r < 2 ? 2 : 1, color: r % COLORS, alive: true });
  }
  return bricks;
}
export function create(): State {
  const s: State = {
    w: 100, h: 160, paddleX: 50, paddleW: 22, paddleH: 4,
    ballX: 50, ballY: 140, ballVX: 0, ballVY: 0, ballR: 2.4, launched: false,
    bricks: makeBricks(), score: 0, balls: 3, over: false, won: false, cleared: 0,
  };
  return s;
}
export function setPaddle(s: State, x: number) {
  s.paddleX = Math.max(s.paddleW / 2, Math.min(s.w - s.paddleW / 2, x));
  if (!s.launched) s.ballX = s.paddleX;
}
export function launch(s: State) {
  if (s.launched || s.over) return;
  s.launched = true; s.ballVX = (Math.random() < 0.5 ? -1 : 1) * 38; s.ballVY = -52;
}
function resetBall(s: State) {
  s.launched = false; s.ballX = s.paddleX; s.ballY = s.h - 18; s.ballVX = 0; s.ballVY = 0;
}
export function step(s: State, dt: number) {
  if (s.over || s.won) return;
  if (!s.launched) { s.ballX = s.paddleX; s.ballY = s.h - 18; return; }
  s.ballX += s.ballVX * dt; s.ballY += s.ballVY * dt;
  if (s.ballX < s.ballR) { s.ballX = s.ballR; s.ballVX = Math.abs(s.ballVX); }
  if (s.ballX > s.w - s.ballR) { s.ballX = s.w - s.ballR; s.ballVX = -Math.abs(s.ballVX); }
  if (s.ballY < s.ballR) { s.ballY = s.ballR; s.ballVY = Math.abs(s.ballVY); }
  // paddle
  const py = s.h - 12;
  if (s.ballVY > 0 && s.ballY + s.ballR >= py - s.paddleH / 2 && s.ballY - s.ballR <= py + s.paddleH / 2) {
    if (Math.abs(s.ballX - s.paddleX) <= s.paddleW / 2 + s.ballR) {
      s.ballY = py - s.paddleH / 2 - s.ballR;
      const hit = (s.ballX - s.paddleX) / (s.paddleW / 2);
      s.ballVX = hit * 55; s.ballVY = -Math.abs(s.ballVY);
      const spd = Math.hypot(s.ballVX, s.ballVY); const target = Math.min(90, 55 + s.cleared * 0.4);
      s.ballVX = s.ballVX / spd * target; s.ballVY = s.ballVY / spd * target;
    }
  }
  // bricks
  for (const b of s.bricks) {
    if (!b.alive) continue;
    if (Math.abs(s.ballX - b.x) < b.w / 2 + s.ballR && Math.abs(s.ballY - b.y) < b.h / 2 + s.ballR) {
      const ox = (b.w / 2 + s.ballR) - Math.abs(s.ballX - b.x);
      const oy = (b.h / 2 + s.ballR) - Math.abs(s.ballY - b.y);
      if (ox < oy) s.ballVX *= -1; else s.ballVY *= -1;
      b.hp -= 1;
      if (b.hp <= 0) { b.alive = false; s.cleared += 1; s.score += 10 + b.color * 5; }
      else s.score += 3;
      break;
    }
  }
  if (s.bricks.every(b => !b.alive)) { s.won = true; s.over = true; return; }
  if (s.ballY > s.h + 5) {
    s.balls -= 1;
    if (s.balls <= 0) { s.over = true; s.won = false; }
    else resetBall(s);
  }
}
export function saveBest(score: number, store: Pick<Storage, 'getItem' | 'setItem'>, key = 'naiwa-breakout-best') {
  const prev = +(store.getItem(key) || 0);
  if (score > prev) { store.setItem(key, String(score)); return { best: score, isNew: true }; }
  return { best: prev, isNew: false };
}
