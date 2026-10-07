import { describe, it, expect } from 'vitest';
import { createBoard, placeMines, reveal, toggleFlag, chord, neighbors, computeNumbers, flagsLeft, LEVELS } from '../src/board';
let s = 7; const rng = () => ((s = (s * 16807) % 2147483647) / 2147483647);
const fixed = (w: number, h: number, mines: number[]) => {
  const b = createBoard(w, h, mines.length); mines.forEach(i => (b.cells[i].mine = true)); computeNumbers(b); b.status = 'playing'; return b;
};
describe('board', () => {
  it('levels match classic sizes', () => {
    expect(LEVELS.beginner).toMatchObject({ w: 9, h: 9, mines: 10 });
    expect(LEVELS.intermediate).toMatchObject({ w: 16, h: 16, mines: 40 });
    expect(LEVELS.expert).toMatchObject({ w: 30, h: 16, mines: 99 });
  });
  it('neighbors at corner/edge/center', () => {
    const b = createBoard(9, 9, 10);
    expect(neighbors(b, 0).length).toBe(3); expect(neighbors(b, 4).length).toBe(5); expect(neighbors(b, 40).length).toBe(8);
  });
  it('first click is always safe and opens a zero region (all levels)', () => {
    for (const L of Object.values(LEVELS)) for (let t = 0; t < 30; t++) {
      const b = createBoard(L.w, L.h, L.mines); const i = Math.floor(rng() * L.w * L.h);
      reveal(b, i, rng);
      expect(b.status).not.toBe('lost'); expect(b.cells[i].n).toBe(0);
      expect(b.cells.filter(c => c.mine).length).toBe(L.mines);
    }
  });
  it('numbers count adjacent mines', () => {
    const b = fixed(3, 3, [0, 2]); expect(b.cells[1].n).toBe(2); expect(b.cells[4].n).toBe(2); expect(b.cells[6].n).toBe(0);
  });
  it('flood reveal opens connected zeros and their border', () => {
    const b = fixed(5, 5, [24]); reveal(b, 0);
    expect(b.cells.filter(c => c.open).length).toBe(24); expect(b.status).toBe('won');
  });
  it('revealing a mine loses and exposes all mines', () => {
    const b = fixed(3, 3, [0, 8]); reveal(b, 0);
    expect(b.status).toBe('lost'); expect(b.boom).toBe(0); expect(b.cells[8].open).toBe(true);
  });
  it('flags block reveal and adjust counter', () => {
    const b = fixed(3, 3, [0]); toggleFlag(b, 0); expect(flagsLeft(b)).toBe(0);
    expect(reveal(b, 0)).toEqual([]); expect(b.status).toBe('playing');
    toggleFlag(b, 0); expect(flagsLeft(b)).toBe(1);
  });
  it('chord opens neighbours only when flag count matches', () => {
    const b = fixed(3, 3, [0]); reveal(b, 4);
    expect(chord(b, 4)).toEqual([]);
    toggleFlag(b, 0); const opened = chord(b, 4);
    expect(opened.length).toBe(7); expect(b.status).toBe('won');
  });
  it('wrong flag + chord can lose', () => {
    const b = fixed(3, 3, [0]); reveal(b, 4); toggleFlag(b, 1); chord(b, 4); expect(b.status).toBe('lost');
  });
});
