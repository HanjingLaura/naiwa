export type Suit = 0 | 1 | 2 | 3; // spade, heart, club, diamond
export interface Card { id: number; suit: Suit; rank: number; up: boolean }
export interface State {
  cols: Card[][]; stock: Card[]; done: Suit[]; score: number; moves: number; suits: 1 | 2 | 4;
}
export const SUIT_NAMES = ['spade', 'heart', 'club', 'diamond'] as const;

export function makeDeck(suits: 1 | 2 | 4): Card[] {
  const deck: Card[] = []; let id = 0;
  for (let d = 0; d < 8; d++) {
    const suit = (d % suits) as Suit;
    for (let r = 1; r <= 13; r++) deck.push({ id: id++, suit, rank: r, up: false });
  }
  return deck;
}
export function shuffle<T>(a: T[], rng = Math.random): T[] {
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}
export function newGame(suits: 1 | 2 | 4, rng = Math.random): State {
  const deck = shuffle(makeDeck(suits), rng);
  const cols: Card[][] = [];
  for (let c = 0; c < 10; c++) {
    const n = c < 4 ? 6 : 5;
    const col = deck.splice(0, n); col[n - 1].up = true; cols.push(col);
  }
  return { cols, stock: deck, done: [], score: 500, moves: 0, suits };
}
/** cards from idx to end are face-up, same suit, strictly descending by 1 */
export function isMovableRun(col: Card[], idx: number): boolean {
  if (idx < 0 || idx >= col.length || !col[idx].up) return false;
  for (let i = idx + 1; i < col.length; i++) {
    const a = col[i - 1], b = col[i];
    if (!b.up || b.suit !== a.suit || b.rank !== a.rank - 1) return false;
  }
  return true;
}
export function canDrop(s: State, card: Card, to: number): boolean {
  const t = s.cols[to]; if (!t.length) return true;
  const top = t[t.length - 1]; return top.up && top.rank === card.rank + 1;
}
export function canMove(s: State, from: number, idx: number, to: number): boolean {
  return from !== to && isMovableRun(s.cols[from], idx) && canDrop(s, s.cols[from][idx], to);
}
function flipTop(col: Card[]) { if (col.length && !col[col.length - 1].up) col[col.length - 1].up = true; }
/** remove a completed K..A same-suit run from the end of a column; returns true if removed */
export function collectRun(s: State, c: number): boolean {
  const col = s.cols[c]; if (col.length < 13) return false;
  const i = col.length - 13;
  if (col[i].rank !== 13 || !isMovableRun(col, i)) return false;
  s.done.push(col[i].suit); col.splice(i, 13); s.score += 100; flipTop(col); return true;
}
export const clone = (s: State): State => JSON.parse(JSON.stringify(s));
/** returns new state, or null if illegal */
export function move(s0: State, from: number, idx: number, to: number): State | null {
  if (!canMove(s0, from, idx, to)) return null;
  const s = clone(s0);
  s.cols[to].push(...s.cols[from].splice(idx));
  flipTop(s.cols[from]); s.score -= 1; s.moves += 1; collectRun(s, to);
  return s;
}
export function canDeal(s: State): boolean { return s.stock.length > 0 && s.cols.every(c => c.length > 0); }
export function deal(s0: State): State | null {
  if (!canDeal(s0)) return null;
  const s = clone(s0);
  for (const col of s.cols) { const c = s.stock.pop()!; c.up = true; col.push(c); }
  s.score -= 1; s.moves += 1;
  for (let i = 0; i < 10; i++) collectRun(s, i);
  return s;
}
export const isWon = (s: State) => s.done.length === 8;
export interface Hint { from: number; idx: number; to: number; score: number }
export function hints(s: State): Hint[] {
  const out: Hint[] = [];
  s.cols.forEach((col, from) => {
    for (let idx = col.length - 1; idx >= 0 && isMovableRun(col, idx); idx--) {
      const card = col[idx];
      s.cols.forEach((t, to) => {
        if (!canMove(s, from, idx, to)) return;
        let sc = 0;
        if (!t.length) { if (idx === 0) return; sc = 1; }
        else { sc = t[t.length - 1].suit === card.suit ? 10 : 4; }
        if (idx > 0 && !col[idx - 1].up) sc += 5; // reveals a card
        else if (idx > 0 && t.length && col[idx - 1].rank === card.rank + 1 && col[idx - 1].suit === card.suit) return; // pointless
        out.push({ from, idx, to, score: sc + (13 - card.rank) * 0.01 });
      });
    }
  });
  return out.sort((a, b) => b.score - a.score);
}
