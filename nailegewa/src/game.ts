/** 奶了个蛙 core logic: layered tiles, 7-slot tray, triples clear. Coordinates are in half-tile units (a tile spans 2×2). */
/** stack: side blind pile (0 = left, 1 = right); idx: position in the pile (higher = on top). Board tiles have no stack. */
export interface Tile { id: number; type: number; layer: number; x: number; y: number; gone: boolean; stack?: number; idx?: number }
export interface Game {
  tiles: Tile[]; tray: number[]; buffer: number[]; level: number; status: 'playing' | 'won' | 'lost';
  props: { undo: number; shuffle: number; moveOut: number }; history: number[]; cols: number; rows: number;
}
export const TRAY = 7;
export interface LevelDef { types: number; layers: number; cols: number; rows: number; density: number; tiles: number; stacks: number }
export const LEVELS: LevelDef[] = [
  { types: 3, layers: 2, cols: 10, rows: 8, density: 1, tiles: 18, stacks: 0 },      // level 1: tutorial
  { types: 18, layers: 12, cols: 14, rows: 16, density: 1, tiles: 216, stacks: 18 }, // level 2: brutal (+2 blind side piles of 18)
];
const overlap = (a: Tile, b: Tile) => Math.abs(a.x - b.x) < 2 && Math.abs(a.y - b.y) < 2;
/** a tile is covered when any live tile on a higher layer overlaps it */
export function isCovered(tiles: Tile[], t: Tile): boolean {
  if (t.stack !== undefined) return tiles.some(o => !o.gone && o.stack === t.stack && o.idx! > t.idx!);
  return tiles.some(o => !o.gone && o !== t && o.stack === undefined && o.layer > t.layer && overlap(o, t));
}
export const onBoard = (g: Game, t: Tile) => !t.gone && !g.tray.includes(t.id) && !g.buffer.includes(t.id);
export function clickable(g: Game, id: number): boolean {
  const t = g.tiles[id]; if (g.status !== 'playing' || t.gone || g.tray.includes(id)) return false;
  if (g.buffer.includes(id)) return true;
  return !isCovered(g.tiles.filter(o => onBoard(g, o)), t);
}
/** insert into tray grouped by type; clear any triple; returns cleared type or -1 */
export function trayInsert(g: Game, id: number): number {
  const type = g.tiles[id].type; let pos = g.tray.length;
  for (let i = g.tray.length - 1; i >= 0; i--) if (g.tiles[g.tray[i]].type === type) { pos = i + 1; break; }
  g.tray.splice(pos, 0, id);
  const same = g.tray.filter(t => g.tiles[t].type === type);
  if (same.length >= 3) {
    const rm = same.slice(0, 3); g.tray = g.tray.filter(t => !rm.includes(t)); rm.forEach(t => (g.tiles[t].gone = true));
    g.history = g.history.filter(h => !rm.includes(h)); return type;
  }
  return -1;
}
export function pick(g: Game, id: number): { ok: boolean; cleared: number } {
  if (!clickable(g, id)) return { ok: false, cleared: -1 };
  g.buffer = g.buffer.filter(b => b !== id);
  const cleared = trayInsert(g, id); if (cleared < 0) g.history.push(id);
  if (g.tiles.every(t => t.gone)) g.status = 'won';
  else if (g.tray.length >= TRAY) g.status = 'lost';
  return { ok: true, cleared };
}
export function undo(g: Game): boolean {
  if (g.props.undo <= 0 || g.status !== 'playing') return false;
  const id = g.history.pop(); if (id === undefined || !g.tray.includes(id)) return false;
  g.tray = g.tray.filter(t => t !== id); g.props.undo--; return true;
}
export function moveOut(g: Game): boolean {
  if (g.props.moveOut <= 0 || g.status !== 'playing' || !g.tray.length) return false;
  const out = g.tray.splice(0, 3); g.buffer.push(...out); g.history = g.history.filter(h => !out.includes(h)); g.props.moveOut--; return true;
}
export function shuffle(g: Game, rng = Math.random): boolean {
  if (g.props.shuffle <= 0 || g.status !== 'playing') return false;
  const live = g.tiles.filter(t => onBoard(g, t)); const types = live.map(t => t.type);
  for (let i = types.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [types[i], types[j]] = [types[j], types[i]]; }
  live.forEach((t, i) => (t.type = types[i])); g.props.shuffle--; return true;
}
/** Build positions layer by layer, then assign types by "reverse play": repeatedly take 3 currently-uncovered tiles
 *  (as a player would) and give them the same type. Playing in that order always clears, so every level is solvable. */
export function generate(levelIdx: number, rng = Math.random): Game & { solution: number[] } {
  const L = LEVELS[levelIdx];
  for (let attempt = 0; attempt < 200; attempt++) {
    const tiles: Tile[] = []; const per = Math.ceil(L.tiles / L.layers);
    for (let layer = 0; layer < L.layers && tiles.length < L.tiles; layer++) {
      const off = layer % 2; let tries = 0, placed = 0; const want = Math.min(per, L.tiles - tiles.length);
      while (placed < want && tries++ < 4000) {
        const shrink = Math.floor(layer / 3);
        const x = off + shrink + 2 * Math.floor(rng() * ((L.cols - 2 - off - 2 * shrink) / 2 + 1));
        const y = off + shrink + 2 * Math.floor(rng() * ((L.rows - 2 - off - 2 * shrink) / 2 + 1));
        if (x > L.cols - 2 || y > L.rows - 2) continue;
        if (tiles.some(t => t.layer === layer && overlap(t, { x, y } as Tile))) continue;
        tiles.push({ id: tiles.length, type: -1, layer, x, y, gone: false }); placed++;
      }
    }
    if (tiles.length !== L.tiles) continue;
    for (let st = 0; st < 2 && L.stacks; st++) for (let i = 0; i < L.stacks; i++) tiles.push({ id: tiles.length, type: -1, layer: 0, x: 0, y: 0, gone: false, stack: st, idx: i });
    // reverse play
    const order: number[] = []; const removed = new Set<number>();
    const live = () => tiles.filter(t => !removed.has(t.id));
    const free = () => { const l = live(); return l.filter(t => !isCovered(l, t)); };
    let ok = true; let k = 0; const typeSeq: number[] = [];
    const nTriples = tiles.length / 3; for (let i = 0; i < nTriples; i++) typeSeq.push(i % L.types);
    for (let i = typeSeq.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [typeSeq[i], typeSeq[j]] = [typeSeq[j], typeSeq[i]]; }
    while (removed.size < tiles.length) {
      const f = free(); if (f.length < 1) { ok = false; break; }
      // pick 3 free tiles one at a time (later picks may be uncovered by earlier ones)
      const triple: Tile[] = [];
      for (let n = 0; n < 3; n++) {
        const fr = free(); if (!fr.length) { ok = false; break; }
        const t = fr[Math.floor(rng() * fr.length)]; removed.add(t.id); triple.push(t);
      }
      if (!ok) break;
      // reshuffle-free hardness: triples drawn from random far-apart free tiles; types are spread evenly
      const type = typeSeq[k++]; triple.forEach(t => { t.type = type; order.push(t.id); });
    }
    if (!ok) continue;
    return { tiles, tray: [], buffer: [], level: levelIdx, status: 'playing', props: { undo: 1, shuffle: 1, moveOut: 1 }, history: [], cols: L.cols, rows: L.rows, solution: order };
  }
  throw new Error('failed to generate level');
}
