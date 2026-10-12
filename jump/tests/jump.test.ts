import { describe, it, expect } from 'vitest';
import { create, startCharge, tickCharge, release, stepFly } from '../src/jump';
describe('jump', () => {
  it('starts idle with 2 plats', () => { const s = create(() => 0.5); expect(s.phase).toBe('idle'); expect(s.plats.length).toBe(2); });
  it('charges then flies', () => {
    const s = create(() => 0.5); startCharge(s); tickCharge(s, 1); expect(s.charge).toBeGreaterThan(0.4); release(s); expect(s.phase).toBe('flying');
  });
});
