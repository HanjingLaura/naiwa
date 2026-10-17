import { describe, it, expect } from 'vitest';
import { create, findMatches, swap, SIZE, fillNoMatch } from '../src/match3';

function mulberry32(seed: number) {
  return () => {
    seed |= 0; seed = seed + 0x6D2B79F5 | 0;
    let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

describe('match3', () => {
  it('fills without initial matches', () => {
    for (let seed = 1; seed <= 20; seed++) {
      const g = fillNoMatch(mulberry32(seed));
      expect(findMatches(g).size).toBe(0);
    }
  });
  it('creates with 20 moves', () => expect(create().moves).toBe(20));
  it('rejects non-adjacent swap', () => {
    const s = create(mulberry32(7));
    expect(swap(s, 0, SIZE * SIZE - 1)).toBe(false);
  });
});
