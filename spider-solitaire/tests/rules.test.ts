import { describe, it, expect } from 'vitest';
import { newGame, makeDeck, isMovableRun, canMove, move, deal, canDeal, collectRun, hints, isWon, Card, State, Suit } from '../src/rules';
const C = (rank: number, suit: Suit = 0, up = true): Card => ({ id: rank * 10 + suit, suit, rank, up });
const blank = (): State => ({ cols: Array.from({ length: 10 }, () => [C(13, 0, false)]), stock: [], done: [], score: 500, moves: 0, suits: 4 });
let seed = 1; const rng = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);

describe('deck & deal', () => {
  it('104 cards with correct suit counts', () => {
    for (const s of [1, 2, 4] as const) {
      const d = makeDeck(s); expect(d.length).toBe(104);
      expect(new Set(d.map(c => c.suit)).size).toBe(s);
    }
  });
  it('initial layout 54 dealt, 50 stock, only last up', () => {
    const g = newGame(4, rng);
    expect(g.cols.map(c => c.length)).toEqual([6, 6, 6, 6, 5, 5, 5, 5, 5, 5]);
    expect(g.stock.length).toBe(50); expect(g.score).toBe(500);
    for (const c of g.cols) c.forEach((x, i) => expect(x.up).toBe(i === c.length - 1));
  });
  it('stock deals one face-up card to each column', () => {
    const g = newGame(1, rng); const n = deal(g)!;
    expect(n.stock.length).toBe(40);
    n.cols.forEach((c, i) => { expect(c.length).toBe(g.cols[i].length + 1); expect(c[c.length - 1].up).toBe(true); });
  });
  it('cannot deal with an empty column or empty stock', () => {
    const g = newGame(1, rng); g.cols[3] = [];
    expect(canDeal(g)).toBe(false); expect(deal(g)).toBeNull();
    const h = newGame(1, rng); h.stock = []; expect(canDeal(h)).toBe(false);
  });
});
describe('moves', () => {
  it('movable run must be same suit descending face-up', () => {
    expect(isMovableRun([C(9), C(8), C(7)], 0)).toBe(true);
    expect(isMovableRun([C(9), C(8, 1), C(7)], 0)).toBe(false);
    expect(isMovableRun([C(9), C(7)], 0)).toBe(false);
    expect(isMovableRun([C(9, 0, false), C(8)], 0)).toBe(false);
    expect(isMovableRun([C(9), C(8, 1)], 1)).toBe(true);
  });
  it('any suit onto rank+1, anything onto empty, not onto wrong rank', () => {
    const s = blank(); s.cols[0] = [C(5, 1)]; s.cols[1] = [C(6, 2)]; s.cols[2] = [C(9)]; s.cols[3] = [];
    expect(canMove(s, 0, 0, 1)).toBe(true);
    expect(canMove(s, 0, 0, 2)).toBe(false);
    expect(canMove(s, 2, 0, 3)).toBe(true);
    expect(canMove(s, 0, 0, 0)).toBe(false);
  });
  it('move scores -1, flips revealed card, does not mutate', () => {
    const s = blank(); s.cols[0] = [C(2, 0, false), C(5)]; s.cols[1] = [C(6)];
    const n = move(s, 0, 1, 1)!;
    expect(n.score).toBe(499); expect(n.cols[0][0].up).toBe(true); expect(s.cols[0].length).toBe(2);
  });
});
describe('run completion & win', () => {
  it('completing K..A same suit removes run, +100', () => {
    const s = blank();
    s.cols[0] = [C(3, 0, false), ...Array.from({ length: 12 }, (_, i) => C(13 - i, 2))];
    s.cols[1] = [C(1, 2)];
    const n = move(s, 1, 0, 0)!;
    expect(n.cols[0].length).toBe(1); expect(n.cols[0][0].up).toBe(true);
    expect(n.done).toEqual([2]); expect(n.score).toBe(500 - 1 + 100);
  });
  it('mixed suit K..A is not collected', () => {
    const s = blank(); s.cols[0] = Array.from({ length: 13 }, (_, i) => C(13 - i, i === 5 ? 1 : 0));
    expect(collectRun(s, 0)).toBe(false);
  });
  it('win at 8 runs', () => { const s = blank(); s.done = [0, 0, 0, 0, 0, 0, 0, 0]; expect(isWon(s)).toBe(true); });
  it('hints are all legal moves', () => {
    const g = newGame(2, rng);
    for (const h of hints(g)) expect(canMove(g, h.from, h.idx, h.to)).toBe(true);
  });
});
