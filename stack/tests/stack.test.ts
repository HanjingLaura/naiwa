import { describe, it, expect } from 'vitest';
import { create, step, drop, unstableAt, speedFor, top, saveBest, WIDTH, Block } from '../src/stack';
const r = () => 0.3;
const at = (s: ReturnType<typeof create>, x: number) => { s.mover.x = x; return drop(s, r); };
describe('stack', () => {
  it('mover bounces inside the play area', () => {
    const s = create([1], r); s.mover.x = WIDTH - s.mover.w / 2 - 1; s.mover.dir = 1; step(s, 1);
    expect(s.mover.x).toBe(WIDTH - s.mover.w / 2); expect(s.mover.dir).toBe(-1);
  });
  it('perfect drop snaps to centre and builds combo bonus', () => {
    const s = create([1], r);
    expect(at(s, 51).kind).toBe('perfect'); expect(top(s).x).toBe(50);
    at(s, 49); const third = at(s, 50.5);
    expect(s.combo).toBe(3); expect(third.points).toBe(4); expect(s.score).toBe(2 + 3 + 4);
  });
  it('an offset drop is ok and breaks the combo', () => {
    const s = create([1], r); at(s, 50); expect(at(s, 58).kind).toBe('ok'); expect(s.combo).toBe(0); expect(top(s).x).toBe(58);
  });
  it('missing the tower ends the game', () => {
    const s = create([1], r); expect(at(s, 90).kind).toBe('miss'); expect(s.over).toBe(true);
  });
  it('tower topples when the centre of mass above a block leaves its footprint', () => {
    const base: Block = { x: 50, w: 46, h: 8, v: -1 };
    expect(unstableAt(base, [{ x: 60, w: 22, h: 20, v: 0 }, { x: 68, w: 22, h: 20, v: 0 }])).toBeNull();
    expect(unstableAt(base, [{ x: 60, w: 22, h: 20, v: 0 }, { x: 72, w: 22, h: 20, v: 0 }])).toBe(0);
    const s = create([1], r); at(s, 60); expect(at(s, 72).kind).toBe('topple'); expect(s.over).toBe(true);
  });
  it('gets faster as the tower grows; best score persists', () => {
    expect(speedFor(10)).toBeGreaterThan(speedFor(0));
    const m = new Map<string, string>(); const st = { getItem: (k: string) => m.get(k) ?? null, setItem: (k: string, v: string) => void m.set(k, v) };
    expect(saveBest(7, st).isNew).toBe(true); expect(saveBest(3, st)).toEqual({ best: 7, isNew: false });
  });
});
