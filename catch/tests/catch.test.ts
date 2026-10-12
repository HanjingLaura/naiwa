import { describe, it, expect } from 'vitest';
import { create, step, setFrog, saveBest } from '../src/catch';

describe('catch', () => {
  it('creates with 3 lives', () => {
    const s = create();
    expect(s.lives).toBe(3);
    expect(s.score).toBe(0);
  });
  it('frog stays in bounds', () => {
    const s = create();
    setFrog(s, -10); expect(s.frogX).toBeGreaterThan(0);
    setFrog(s, 999); expect(s.frogX).toBeLessThan(s.w);
  });
  it('catching fruit scores', () => {
    const s = create();
    s.drops = [{ x: s.frogX, y: s.h - 14, vy: 0, kind: 'fruit', variant: 0, r: 6 }];
    step(s, 0.016);
    expect(s.score).toBeGreaterThan(0);
    expect(s.caught).toBe(1);
  });
  it('bomb costs a life', () => {
    const s = create();
    s.drops = [{ x: s.frogX, y: s.h - 14, vy: 0, kind: 'bomb', variant: 0, r: 7 }];
    step(s, 0.016);
    expect(s.lives).toBe(2);
  });
  it('saveBest updates', () => {
    const store = { data: {} as Record<string,string>, getItem(k: string){return this.data[k]??null;}, setItem(k:string,v:string){this.data[k]=v;} };
    expect(saveBest(10, store).isNew).toBe(true);
    expect(saveBest(5, store).isNew).toBe(false);
    expect(saveBest(20, store).best).toBe(20);
  });
});
