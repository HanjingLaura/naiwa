export interface Cell { mine: boolean; open: boolean; flag: boolean; n: number }
export type Status = 'ready' | 'playing' | 'won' | 'lost';
export interface Board { w: number; h: number; mines: number; cells: Cell[]; status: Status; boom: number }
export const LEVELS = {
  beginner: { w: 9, h: 9, mines: 10, label: '初级' },
  intermediate: { w: 16, h: 16, mines: 40, label: '中级' },
  expert: { w: 30, h: 16, mines: 99, label: '高级' },
} as const;
export type Level = keyof typeof LEVELS;

export function createBoard(w: number, h: number, mines: number): Board {
  return { w, h, mines, status: 'ready', boom: -1, cells: Array.from({ length: w * h }, () => ({ mine: false, open: false, flag: false, n: 0 })) };
}
export function neighbors(b: Board, i: number): number[] {
  const x = i % b.w, y = (i / b.w) | 0, out: number[] = [];
  for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
    if (!dx && !dy) continue; const nx = x + dx, ny = y + dy;
    if (nx >= 0 && ny >= 0 && nx < b.w && ny < b.h) out.push(ny * b.w + nx);
  }
  return out;
}
/** place mines avoiding the first-clicked cell (and its neighbours when there is room) */
export function placeMines(b: Board, safe: number, rng = Math.random) {
  const excl = new Set([safe]);
  if (b.w * b.h - b.mines >= 9) neighbors(b, safe).forEach(n => excl.add(n));
  const pool = b.cells.map((_, i) => i).filter(i => !excl.has(i));
  for (let k = 0; k < b.mines; k++) { const j = k + Math.floor(rng() * (pool.length - k)); [pool[k], pool[j]] = [pool[j], pool[k]]; b.cells[pool[k]].mine = true; }
  computeNumbers(b);
}
export function computeNumbers(b: Board) { b.cells.forEach((c, i) => { c.n = neighbors(b, i).filter(j => b.cells[j].mine).length; }); }
function checkWin(b: Board) {
  if (b.status === 'playing' && b.cells.every(c => c.mine || c.open)) {
    b.status = 'won'; b.cells.forEach(c => { if (c.mine) c.flag = true; });
  }
}
/** reveal a cell; flood-fills zeros. returns indices opened */
export function reveal(b: Board, i: number, rng = Math.random): number[] {
  if (b.status === 'won' || b.status === 'lost') return [];
  if (b.status === 'ready') { placeMines(b, i, rng); b.status = 'playing'; }
  const c = b.cells[i]; if (c.open || c.flag) return [];
  if (c.mine) { c.open = true; b.status = 'lost'; b.boom = i; b.cells.forEach(x => { if (x.mine) x.open = true; }); return [i]; }
  const opened: number[] = []; const stack = [i];
  while (stack.length) {
    const k = stack.pop()!; const x = b.cells[k];
    if (x.open || x.flag || x.mine) continue;
    x.open = true; opened.push(k);
    if (x.n === 0) stack.push(...neighbors(b, k));
  }
  checkWin(b); return opened;
}
export function toggleFlag(b: Board, i: number): boolean {
  if (b.status === 'won' || b.status === 'lost') return false;
  const c = b.cells[i]; if (c.open) return false; c.flag = !c.flag; return true;
}
/** chord: on an opened number whose flag count matches, reveal all unflagged neighbours */
export function chord(b: Board, i: number): number[] {
  const c = b.cells[i]; if (b.status !== 'playing' || !c.open || c.n === 0) return [];
  const ns = neighbors(b, i);
  if (ns.filter(j => b.cells[j].flag).length !== c.n) return [];
  const out: number[] = [];
  for (const j of ns) { if (b.status !== 'playing') break; out.push(...reveal(b, j)); }
  return out;
}
export const flagsLeft = (b: Board) => b.mines - b.cells.filter(c => c.flag).length;
