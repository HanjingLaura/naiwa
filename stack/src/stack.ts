/** 奶蛙叠叠乐 core logic. World is 100 units wide; y grows upward. Pure functions for testing. */
export interface Block { x: number; w: number; h: number; v: number }
export interface Mover extends Block { dir: 1 | -1; speed: number }
export interface State { base: Block; blocks: Block[]; mover: Mover; score: number; combo: number; perfects: number; over: boolean; fellAt: number; variants: number[] }
export const WIDTH = 100, PERFECT = 2.5;
/** h/w aspect for each variant (filled from image sizes by the UI; tests use defaults) */
export function create(aspects: number[] = [1], rng = Math.random): State {
  const s: State = { base: { x: 50, w: 46, h: 8, v: -1 }, blocks: [], mover: null as unknown as Mover, score: 0, combo: 0, perfects: 0, over: false, fellAt: -1, variants: aspects };
  s.mover = nextMover(s, rng); return s;
}
export const speedFor = (height: number) => Math.min(95, 32 + height * 3.2); // units per second
export function nextMover(s: State, rng = Math.random): Mover {
  const v = Math.floor(rng() * s.variants.length); const w = 22; const h = Math.max(14, Math.min(30, w * s.variants[v]));
  const dir = rng() < 0.5 ? 1 : -1;
  return { x: dir === 1 ? w / 2 : WIDTH - w / 2, w, h, v, dir, speed: speedFor(s.blocks.length) };
}
export function step(s: State, dt: number) {
  if (s.over) return; const m = s.mover; m.x += m.dir * m.speed * dt;
  if (m.x > WIDTH - m.w / 2) { m.x = WIDTH - m.w / 2; m.dir = -1; }
  if (m.x < m.w / 2) { m.x = m.w / 2; m.dir = 1; }
}
export const top = (s: State) => s.blocks[s.blocks.length - 1] ?? s.base;
export const height = (s: State) => s.blocks.length;
/** index (-1 = base) of the lowest block whose stack above it has its centre of mass outside its footprint, or null if stable */
export function unstableAt(base: Block, blocks: Block[]): number | null {
  const all = [base, ...blocks];
  for (let k = all.length - 2; k >= 0; k--) {
    const above = all.slice(k + 1); const mass = above.reduce((a, b) => a + b.w * b.h, 0);
    const com = above.reduce((a, b) => a + b.x * b.w * b.h, 0) / mass;
    if (Math.abs(com - all[k].x) > all[k].w / 2) return k - 1;
  }
  return null;
}
export type DropResult = { kind: 'perfect' | 'ok' | 'miss' | 'topple'; points: number; at: number };
export function drop(s: State, rng = Math.random): DropResult {
  if (s.over) return { kind: 'miss', points: 0, at: -1 };
  const t = top(s); const m = s.mover; let x = m.x; const off = x - t.x;
  if (Math.abs(off) >= (t.w + m.w) / 2 * 0.85) { s.over = true; s.fellAt = s.blocks.length; return { kind: 'miss', points: 0, at: s.blocks.length }; }
  let kind: DropResult['kind'] = 'ok';
  if (Math.abs(off) <= PERFECT) { x = t.x; kind = 'perfect'; s.combo++; s.perfects++; } else s.combo = 0;
  const b: Block = { x, w: m.w, h: m.h, v: m.v }; s.blocks.push(b);
  const u = unstableAt(s.base, s.blocks);
  if (u !== null) { s.over = true; s.fellAt = u + 1; return { kind: 'topple', points: 0, at: u + 1 }; }
  const pts = kind === 'perfect' ? 1 + Math.min(4, s.combo) : 1; s.score += pts;
  s.mover = nextMover(s, rng); return { kind, points: pts, at: s.blocks.length - 1 };
}
export function saveBest(score: number, store: Pick<Storage, 'getItem' | 'setItem'>, key = 'naiwa-stack-best') {
  const prev = +(store.getItem(key) || 0); if (score > prev) { store.setItem(key, String(score)); return { best: score, isNew: true }; } return { best: prev, isNew: false };
}
