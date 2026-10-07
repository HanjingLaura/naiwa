/** 打奶蛙 core logic. Pure + time-injected (ms) so it is unit-testable. */
export type Kind = 'normal' | 'gold' | 'bomb';
export interface Mole { kind: Kind; up: number; until: number; hit: boolean; hitAt: number }
export interface State {
  holes: (Mole | null)[]; score: number; combo: number; best: number; maxCombo: number; hits: number;
  start: number; duration: number; nextSpawn: number; stunUntil: number; over: boolean;
}
export const HOLES = 9, DURATION = 60_000;
export const POINTS = { normal: 10, gold: 50, bomb: -30 } as const;
export function create(now: number, duration = DURATION): State {
  return { holes: Array(HOLES).fill(null), score: 0, combo: 0, best: 0, maxCombo: 0, hits: 0, start: now, duration, nextSpawn: now + 400, stunUntil: 0, over: false };
}
export const timeLeft = (s: State, now: number) => Math.max(0, s.duration - (now - s.start));
/** later in the round moles appear faster and stay up shorter */
export function pace(s: State, now: number) { const p = Math.min(1, (now - s.start) / s.duration); return { gap: 900 - 550 * p, stay: 1300 - 650 * p }; }
export const multiplier = (combo: number) => 1 + Math.floor(combo / 5) * 0.5; // x1, x1.5 at 5, x2 at 10 ...
export function pickKind(r: number): Kind { return r < 0.1 ? 'gold' : r < 0.27 ? 'bomb' : 'normal'; }
/** advance time: expire moles (an escaped normal/gold breaks the combo), spawn new ones, end the round */
export function tick(s: State, now: number, rng = Math.random): { spawned: number[]; escaped: number[] } {
  const spawned: number[] = [], escaped: number[] = [];
  if (s.over) return { spawned, escaped };
  s.holes.forEach((m, i) => {
    if (!m) return;
    if (m.hit && now - m.hitAt > 350) s.holes[i] = null;
    else if (!m.hit && now >= m.until) { if (m.kind !== 'bomb') { s.combo = 0; escaped.push(i); } s.holes[i] = null; }
  });
  if (timeLeft(s, now) <= 0) { s.over = true; s.holes.fill(null); return { spawned, escaped }; }
  if (now >= s.nextSpawn) {
    const free = s.holes.map((m, i) => (m ? -1 : i)).filter(i => i >= 0);
    const { gap, stay } = pace(s, now);
    const n = free.length && rng() < 0.25 ? 2 : 1;
    for (let k = 0; k < n && free.length; k++) {
      const i = free.splice(Math.floor(rng() * free.length), 1)[0]; const kind = pickKind(rng());
      s.holes[i] = { kind, up: now, until: now + (kind === 'gold' ? stay * 0.7 : stay), hit: false, hitAt: 0 }; spawned.push(i);
    }
    s.nextSpawn = now + gap * (0.7 + rng() * 0.6);
  }
  return { spawned, escaped };
}
export interface HitResult { kind: Kind | 'miss' | 'stunned'; points: number; combo: number }
export function whack(s: State, i: number, now: number): HitResult {
  if (s.over) return { kind: 'miss', points: 0, combo: s.combo };
  if (now < s.stunUntil) return { kind: 'stunned', points: 0, combo: s.combo };
  const m = s.holes[i];
  if (!m || m.hit || now >= m.until) { s.combo = 0; return { kind: 'miss', points: 0, combo: 0 }; }
  m.hit = true; m.hitAt = now;
  if (m.kind === 'bomb') { s.combo = 0; s.stunUntil = now + 800; s.score = Math.max(0, s.score + POINTS.bomb); return { kind: 'bomb', points: POINTS.bomb, combo: 0 }; }
  s.combo++; s.hits++; s.maxCombo = Math.max(s.maxCombo, s.combo);
  const pts = Math.round(POINTS[m.kind] * multiplier(s.combo)); s.score += pts;
  return { kind: m.kind, points: pts, combo: s.combo };
}
export function saveBest(score: number, store: Pick<Storage, 'getItem' | 'setItem'>, key = 'naiwa-whack-best'): { best: number; isNew: boolean } {
  const prev = +(store.getItem(key) || 0); if (score > prev) { store.setItem(key, String(score)); return { best: score, isNew: true }; }
  return { best: prev, isNew: false };
}
