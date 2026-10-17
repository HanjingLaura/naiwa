import { describe, it, expect } from 'vitest';
import { create, flap, step } from '../src/fly';
describe('fly', () => {
  it('flap starts and lifts', () => { const s = create(); flap(s); expect(s.started).toBe(true); expect(s.vy).toBeLessThan(0); });
  it('gravity pulls down', () => { const s = create(); flap(s); const y = s.y; step(s, 0.5); expect(s.y).not.toBe(y); });
});
