/** 奶蛙消消乐 — simple match-3. */
export const SIZE = 7;
export const TYPES = 5;
export type Grid = number[][]; // -1 empty
export interface State {
  grid: Grid; score: number; moves: number; goal: number; over: boolean; won: boolean; selected: number | null;
}
export function emptyGrid(): Grid { return Array.from({ length: SIZE }, () => Array(SIZE).fill(-1)); }
export function fillNoMatch(rng = Math.random): Grid {
  const g = emptyGrid();
  for (let r = 0; r < SIZE; r++) for (let c = 0; c < SIZE; c++) {
    let t: number, guard = 0;
    do {
      t = Math.floor(rng() * TYPES); guard++;
    } while (guard < 20 && (
      (c >= 2 && g[r][c - 1] === t && g[r][c - 2] === t) ||
      (r >= 2 && g[r - 1][c] === t && g[r - 2][c] === t)
    ));
    g[r][c] = t;
  }
  return g;
}
export function create(rng = Math.random): State {
  return { grid: fillNoMatch(rng), score: 0, moves: 20, goal: 200, over: false, won: false, selected: null };
}
export const idx = (r: number, c: number) => r * SIZE + c;
export const rc = (i: number) => ({ r: Math.floor(i / SIZE), c: i % SIZE });
export function adjacent(a: number, b: number) {
  const A = rc(a), B = rc(b);
  return Math.abs(A.r - B.r) + Math.abs(A.c - B.c) === 1;
}
export function findMatches(g: Grid): Set<number> {
  const hit = new Set<number>();
  for (let r = 0; r < SIZE; r++) {
    let run = 1;
    for (let c = 1; c <= SIZE; c++) {
      if (c < SIZE && g[r][c] === g[r][c - 1] && g[r][c] >= 0) run++;
      else { if (run >= 3) for (let k = 0; k < run; k++) hit.add(idx(r, c - 1 - k)); run = 1; }
    }
  }
  for (let c = 0; c < SIZE; c++) {
    let run = 1;
    for (let r = 1; r <= SIZE; r++) {
      if (r < SIZE && g[r][c] === g[r - 1][c] && g[r][c] >= 0) run++;
      else { if (run >= 3) for (let k = 0; k < run; k++) hit.add(idx(r - 1 - k, c)); run = 1; }
    }
  }
  return hit;
}
export function clearMatches(s: State): number {
  const hit = findMatches(s.grid);
  if (!hit.size) return 0;
  for (const i of hit) { const { r, c } = rc(i); s.grid[r][c] = -1; }
  const pts = hit.size * 10 + Math.max(0, hit.size - 3) * 5;
  s.score += pts;
  return hit.size;
}
export function collapse(s: State, rng = Math.random) {
  for (let c = 0; c < SIZE; c++) {
    let write = SIZE - 1;
    for (let r = SIZE - 1; r >= 0; r--) {
      if (s.grid[r][c] >= 0) { s.grid[write][c] = s.grid[r][c]; if (write !== r) s.grid[r][c] = -1; write--; }
    }
    for (let r = write; r >= 0; r--) s.grid[r][c] = Math.floor(rng() * TYPES);
  }
}
export function resolve(s: State, rng = Math.random): number {
  let total = 0, guard = 0;
  while (guard++ < 20) {
    const n = clearMatches(s);
    if (!n) break;
    total += n;
    collapse(s, rng);
  }
  return total;
}
export function swap(s: State, a: number, b: number, rng = Math.random): boolean {
  if (s.over || !adjacent(a, b)) return false;
  const A = rc(a), B = rc(b);
  const tmp = s.grid[A.r][A.c]; s.grid[A.r][A.c] = s.grid[B.r][B.c]; s.grid[B.r][B.c] = tmp;
  if (!findMatches(s.grid).size) {
    // revert
    s.grid[B.r][B.c] = s.grid[A.r][A.c]; s.grid[A.r][A.c] = tmp;
    return false;
  }
  s.moves -= 1;
  resolve(s, rng);
  if (s.score >= s.goal) { s.won = true; s.over = true; }
  else if (s.moves <= 0) { s.over = true; s.won = false; }
  return true;
}
export function tap(s: State, i: number, rng = Math.random): 'select' | 'swap' | 'reject' | 'noop' {
  if (s.over) return 'noop';
  if (s.selected === null) { s.selected = i; return 'select'; }
  if (s.selected === i) { s.selected = null; return 'select'; }
  const a = s.selected; s.selected = null;
  return swap(s, a, i, rng) ? 'swap' : 'reject';
}
export function saveBest(score: number, store: Pick<Storage, 'getItem' | 'setItem'>, key = 'naiwa-match3-best') {
  const prev = +(store.getItem(key) || 0);
  if (score > prev) { store.setItem(key, String(score)); return { best: score, isNew: true }; }
  return { best: prev, isNew: false };
}
