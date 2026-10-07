import { describe, it, expect } from 'vitest';
import { Game, Tile, isCovered, clickable, pick, trayInsert, undo, moveOut, shuffle, generate, LEVELS, TRAY } from '../src/game';
let s = 3; const rng = () => ((s = (s * 16807) % 2147483647) / 2147483647);
const T = (id: number, type: number, layer: number, x: number, y: number): Tile => ({ id, type, layer, x, y, gone: false });
const G = (tiles: Tile[]): Game => ({ tiles, tray: [], buffer: [], level: 0, status: 'playing', props: { undo: 1, shuffle: 1, moveOut: 1 }, history: [], cols: 10, rows: 10 });
describe('coverage', () => {
  it('higher overlapping tile covers; half-offset overlaps; adjacent does not', () => {
    const a = T(0, 0, 0, 0, 0), b = T(1, 0, 1, 1, 1), c = T(2, 0, 1, 2, 0);
    expect(isCovered([a, b, c], a)).toBe(true);
    expect(isCovered([a, c], a)).toBe(false);
    expect(isCovered([a, b], b)).toBe(false);
    expect(isCovered([{ ...b, gone: true }, a], a)).toBe(false);
  });
  it('only uncovered tiles are clickable', () => {
    const g = G([T(0, 0, 0, 0, 0), T(1, 1, 1, 1, 0)]);
    expect(clickable(g, 0)).toBe(false); expect(clickable(g, 1)).toBe(true);
    pick(g, 1); expect(clickable(g, 0)).toBe(true);
  });
});
describe('tray', () => {
  it('groups same types together and clears triples', () => {
    const g = G([0, 1, 0, 1, 0].map((t, i) => T(i, t, 0, i * 2, 0)));
    trayInsert(g, 0); trayInsert(g, 1); trayInsert(g, 2);
    expect(g.tray.map(i => g.tiles[i].type)).toEqual([0, 0, 1]);
    expect(trayInsert(g, 4)).toBe(0); expect(g.tray).toEqual([1]); expect(g.tiles[0].gone && g.tiles[2].gone && g.tiles[4].gone).toBe(true);
  });
  it('lose when tray reaches 7 without a clear; win when all cleared', () => {
    const g = G(Array.from({ length: 7 }, (_, i) => T(i, i, 0, i * 2, 0)));
    for (let i = 0; i < 7; i++) pick(g, i); expect(g.tray.length).toBe(TRAY); expect(g.status).toBe('lost');
    const w = G([0, 0, 0].map((t, i) => T(i, t, 0, i * 2, 0))); [0, 1, 2].forEach(i => pick(w, i)); expect(w.status).toBe('won');
  });
  it('props: undo returns last tile, move-out frees 3 slots into clickable buffer, shuffle keeps type counts; each once', () => {
    const g = G([0, 1, 2, 3, 0, 0].map((t, i) => T(i, t, 0, i * 2, 0)));
    pick(g, 0); pick(g, 1); expect(undo(g)).toBe(true); expect(g.tray).toEqual([0]); expect(undo(g)).toBe(false);
    pick(g, 1); pick(g, 2); expect(moveOut(g)).toBe(true); expect(g.tray).toEqual([]); expect(g.buffer.length).toBe(3);
    expect(clickable(g, g.buffer[0])).toBe(true); expect(moveOut(g)).toBe(false);
    const before = g.tiles.filter(t => !t.gone).map(t => t.type).sort();
    expect(shuffle(g, rng)).toBe(true); expect(g.tiles.filter(t => !t.gone).map(t => t.type).sort()).toEqual(before); expect(shuffle(g)).toBe(false);
  });
});
describe('generation is always solvable', () => {
  for (const li of [0, 1]) it(`level ${li + 1}: following the generated solution clears the board (20 seeds)`, () => {
    for (let n = 0; n < 20; n++) {
      const g = generate(li, rng); const L = LEVELS[li];
      expect(g.tiles.length).toBe(L.tiles); expect(L.tiles % 3).toBe(0);
      const counts = new Map<number, number>(); g.tiles.forEach(t => counts.set(t.type, (counts.get(t.type) || 0) + 1));
      for (const c of counts.values()) expect(c % 3).toBe(0);
      for (const id of g.solution) { expect(clickable(g, id)).toBe(true); pick(g, id); expect(g.tray.length).toBeLessThan(3); }
      expect(g.status).toBe('won');
    }
  });
  it('level 2 is harder than level 1', () => { expect(LEVELS[1].tiles).toBeGreaterThan(LEVELS[0].tiles * 3); expect(LEVELS[1].types).toBeGreaterThan(LEVELS[0].types); });
});
