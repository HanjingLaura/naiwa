import { describe, it, expect } from 'vitest';
import { create, tick, whack, timeLeft, multiplier, pickKind, saveBest, POINTS, State } from '../src/whack';
const up = (s: State, i: number, kind: 'normal' | 'gold' | 'bomb', now: number, stay = 1000) => { s.holes[i] = { kind, up: now, until: now + stay, hit: false, hitAt: 0 }; };
describe('whack', () => {
  it('60s round, timer counts down and ends the game', () => {
    const s = create(0); expect(timeLeft(s, 0)).toBe(60000); expect(timeLeft(s, 59000)).toBe(1000);
    tick(s, 60000); expect(s.over).toBe(true); expect(s.holes.every(h => h === null)).toBe(true);
  });
  it('spawns moles over time into free holes', () => {
    const s = create(0); let n = 0; for (let t = 0; t < 5000; t += 50) n += tick(s, t, () => 0.5).spawned.length;
    expect(n).toBeGreaterThan(3);
  });
  it('scoring: normal 10, gold 50, combo multiplier, bomb -30 resets combo and stuns', () => {
    const s = create(0);
    up(s, 0, 'normal', 0); expect(whack(s, 0, 10).points).toBe(10);
    up(s, 1, 'gold', 0); expect(whack(s, 1, 10).points).toBe(50);
    expect(s.combo).toBe(2);
    for (let i = 0; i < 3; i++) { up(s, 2 + i, 'normal', 0); whack(s, 2 + i, 20); }
    expect(s.combo).toBe(5); expect(multiplier(5)).toBe(1.5);
    const before = s.score; up(s, 8, 'bomb', 0); const r = whack(s, 8, 30);
    expect(r.kind).toBe('bomb'); expect(s.score).toBe(before + POINTS.bomb); expect(s.combo).toBe(0);
    up(s, 0, 'normal', 0, 5000); expect(whack(s, 0, 100).kind).toBe('stunned'); expect(whack(s, 0, 900).kind).toBe('normal');
  });
  it('miss and escaped moles break the combo; bombs escaping do not', () => {
    const s = create(0); up(s, 0, 'normal', 0); whack(s, 0, 10); expect(s.combo).toBe(1);
    expect(whack(s, 4, 20).kind).toBe('miss'); expect(s.combo).toBe(0);
    up(s, 1, 'normal', 0, 100); whack(s, 1, 50); up(s, 2, 'bomb', 0, 100); tick(s, 200); expect(s.combo).toBe(1);
    up(s, 3, 'normal', 200, 100); tick(s, 400); expect(s.combo).toBe(0);
  });
  it('cannot hit the same mole twice; score never negative', () => {
    const s = create(0); up(s, 0, 'normal', 0); whack(s, 0, 10); expect(whack(s, 0, 20).kind).toBe('miss');
    const t = create(0); up(t, 0, 'bomb', 0); whack(t, 0, 10); expect(t.score).toBe(0);
  });
  it('kind distribution and high score persistence', () => {
    expect(pickKind(0.05)).toBe('gold'); expect(pickKind(0.2)).toBe('bomb'); expect(pickKind(0.9)).toBe('normal');
    const m = new Map<string, string>(); const store = { getItem: (k: string) => m.get(k) ?? null, setItem: (k: string, v: string) => void m.set(k, v) };
    expect(saveBest(100, store)).toEqual({ best: 100, isNew: true }); expect(saveBest(50, store)).toEqual({ best: 100, isNew: false });
  });
});
