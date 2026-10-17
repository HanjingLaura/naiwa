/** 奶蛙接水果 — pure logic */
export type Kind = 'fruit' | 'bomb' | 'gem';
export interface Drop { x: number; y: number; vy: number; kind: Kind; variant: number; r: number }
export interface State {
  w: number; h: number; frogX: number; frogW: number;
  drops: Drop[]; score: number; lives: number; combo: number; maxCombo: number;
  over: boolean; elapsed: number; spawnIn: number; caught: number;
}
export const create = (w = 100, h = 160): State => ({
  w, h, frogX: w / 2, frogW: 18, drops: [], score: 0, lives: 3, combo: 0, maxCombo: 0,
  over: false, elapsed: 0, spawnIn: 0.6, caught: 0,
});
export function setFrog(s: State, x: number) {
  s.frogX = Math.max(s.frogW / 2, Math.min(s.w - s.frogW / 2, x));
}
function spawn(s: State, rng = Math.random) {
  const roll = rng();
  const kind: Kind = roll < 0.12 ? 'bomb' : roll < 0.22 ? 'gem' : 'fruit';
  const variant = kind === 'fruit' ? Math.floor(rng() * 8) : kind === 'gem' ? 0 : 0;
  const r = kind === 'bomb' ? 7 : kind === 'gem' ? 6 : 6.5;
  const speed = 28 + Math.min(50, s.elapsed * 1.8) + rng() * 18;
  s.drops.push({ x: r + rng() * (s.w - 2 * r), y: -r, vy: speed, kind, variant, r });
}
export function step(s: State, dt: number, rng = Math.random) {
  if (s.over) return;
  s.elapsed += dt;
  s.spawnIn -= dt;
  const interval = Math.max(0.28, 0.85 - s.elapsed * 0.012);
  while (s.spawnIn <= 0) { spawn(s, rng); s.spawnIn += interval; }
  const frogY = s.h - 14;
  const next: Drop[] = [];
  for (const d of s.drops) {
    d.y += d.vy * dt;
    const dx = Math.abs(d.x - s.frogX);
    const dy = Math.abs(d.y - frogY);
    if (dx < (s.frogW / 2 + d.r * 0.7) && dy < (10 + d.r * 0.7)) {
      if (d.kind === 'bomb') {
        s.lives -= 1; s.combo = 0;
        if (s.lives <= 0) s.over = true;
      } else {
        const pts = d.kind === 'gem' ? 50 : 10;
        s.combo += 1; s.maxCombo = Math.max(s.maxCombo, s.combo);
        const mult = s.combo >= 10 ? 2 : s.combo >= 5 ? 1.5 : 1;
        s.score += Math.round(pts * mult);
        s.caught += 1;
      }
      continue;
    }
    if (d.y > s.h + d.r) {
      if (d.kind === 'fruit' || d.kind === 'gem') { s.combo = 0; }
      continue;
    }
    next.push(d);
  }
  s.drops = next;
}
export function saveBest(score: number, store: Pick<Storage, 'getItem' | 'setItem'>, key = 'naiwa-catch-best') {
  const prev = +(store.getItem(key) || 0);
  if (score > prev) { store.setItem(key, String(score)); return { best: score, isNew: true }; }
  return { best: prev, isNew: false };
}
