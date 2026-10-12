/** 奶蛙跳一跳 — charge-jump between platforms. World units. */
export interface Plat { x: number; z: number; size: number; variant: number }
export type Phase = 'idle' | 'charging' | 'flying' | 'over';
export interface State {
  plats: Plat[]; frogX: number; frogZ: number; frogY: number;
  phase: Phase; charge: number; score: number; perfects: number;
  vx: number; vz: number; vy: number; targetIdx: number; dir: 1 | -1;
}
export function create(rng = Math.random): State {
  const p0: Plat = { x: 0, z: 0, size: 22, variant: 0 };
  const s: State = {
    plats: [p0], frogX: 0, frogZ: 0, frogY: 0, phase: 'idle', charge: 0,
    score: 0, perfects: 0, vx: 0, vz: 0, vy: 0, targetIdx: 1, dir: 1,
  };
  s.plats.push(nextPlat(s, rng));
  return s;
}
export function nextPlat(s: State, rng = Math.random): Plat {
  const last = s.plats[s.plats.length - 1];
  const dist = 28 + rng() * 38;
  const size = 14 + rng() * 12;
  const dir: 1 | -1 = rng() < 0.5 ? 1 : -1;
  s.dir = dir;
  return { x: last.x + (dir === 1 ? dist : 0), z: last.z + (dir === -1 ? dist : 0), size, variant: Math.floor(rng() * 4) };
}
export function startCharge(s: State) { if (s.phase === 'idle') { s.phase = 'charging'; s.charge = 0; } }
export function tickCharge(s: State, dt: number) {
  if (s.phase !== 'charging') return;
  s.charge = Math.min(1, s.charge + dt * 0.55);
}
export function release(s: State) {
  if (s.phase !== 'charging') return;
  const power = 18 + s.charge * 72;
  const target = s.plats[s.targetIdx];
  const dx = target.x - s.frogX, dz = target.z - s.frogZ;
  const len = Math.hypot(dx, dz) || 1;
  // aim along the axis toward next platform, distance = power
  const travel = power;
  s.vx = (dx / len) * travel; s.vz = (dz / len) * travel;
  s.vy = 22 + s.charge * 18;
  s.phase = 'flying'; s.charge = 0;
}
export function stepFly(s: State, dt: number, rng = Math.random): 'ok' | 'perfect' | 'miss' | 'air' {
  if (s.phase !== 'flying') return 'air';
  s.frogX += s.vx * dt; s.frogZ += s.vz * dt; s.frogY += s.vy * dt; s.vy -= 70 * dt;
  if (s.frogY > 0) return 'air';
  s.frogY = 0; s.phase = 'idle';
  const p = s.plats[s.targetIdx];
  const dist = Math.hypot(s.frogX - p.x, s.frogZ - p.z);
  if (dist <= p.size * 0.48) {
    const perfect = dist <= p.size * 0.18;
    s.frogX = p.x; s.frogZ = p.z;
    s.score += perfect ? 2 : 1;
    if (perfect) s.perfects += 1;
    s.plats.push(nextPlat(s, rng));
    s.targetIdx += 1;
    // keep only last few plats
    if (s.plats.length > 6) { s.plats.shift(); s.targetIdx -= 1; }
    return perfect ? 'perfect' : 'ok';
  }
  s.phase = 'over';
  return 'miss';
}
export function saveBest(score: number, store: Pick<Storage, 'getItem' | 'setItem'>, key = 'naiwa-jump-best') {
  const prev = +(store.getItem(key) || 0);
  if (score > prev) { store.setItem(key, String(score)); return { best: score, isNew: true }; }
  return { best: prev, isNew: false };
}
