import { describe, it, expect } from 'vitest';
import { create, step, launch, setPaddle, makeBricks } from '../src/breakout';
describe('breakout', () => {
  it('makes bricks', () => expect(makeBricks().length).toBe(40));
  it('launch starts ball', () => { const s = create(); launch(s); expect(s.launched).toBe(true); expect(s.ballVY).toBeLessThan(0); });
  it('paddle clamps', () => { const s = create(); setPaddle(s, -1); expect(s.paddleX).toBeGreaterThan(0); });
  it('losing ball decrements', () => {
    const s = create(); launch(s); s.ballY = 200; s.ballVY = 10; step(s, 0.05);
    expect(s.balls).toBe(2);
  });
});
