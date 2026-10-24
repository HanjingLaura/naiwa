export const BOARD_SIZE = 15;
export const TOTAL_CELLS = BOARD_SIZE * BOARD_SIZE;

export type Player = 'B' | 'W'; // 'B': Black (goes first), 'W': White
export type Cell = Player | null;
export type GameMode = 'pvp' | 'pve';
export type GameStatus = 'playing' | 'won' | 'draw';

export interface Move {
  x: number;
  y: number;
  color: Player;
}

export interface GomokuState {
  board: Cell[];
  turn: Player;
  status: GameStatus;
  winner: Player | null;
  winningLine: [number, number][] | null;
  history: Move[];
  mode: GameMode;
  playerColor: Player; // In PvE mode, which color human plays ('B' or 'W')
}

export interface Stats {
  pveWins: number;
  pveLosses: number;
  pveDraws: number;
  pvpBlackWins: number;
  pvpWhiteWins: number;
  pvpDraws: number;
}

export function idx(x: number, y: number): number {
  return y * BOARD_SIZE + x;
}

export function coord(i: number): [number, number] {
  return [i % BOARD_SIZE, Math.floor(i / BOARD_SIZE)];
}

export function isValidCoord(x: number, y: number): boolean {
  return x >= 0 && x < BOARD_SIZE && y >= 0 && y < BOARD_SIZE;
}

export function createGame(mode: GameMode = 'pve', playerColor: Player = 'B'): GomokuState {
  return {
    board: new Array(TOTAL_CELLS).fill(null),
    turn: 'B',
    status: 'playing',
    winner: null,
    winningLine: null,
    history: [],
    mode,
    playerColor,
  };
}

export const DIRECTIONS: [number, number][] = [
  [1, 0],  // Horizontal
  [0, 1],  // Vertical
  [1, 1],  // Diagonal \
  [1, -1], // Anti-diagonal /
];

export function checkWin(board: Cell[], x: number, y: number, color: Player): [number, number][] | null {
  for (const [dx, dy] of DIRECTIONS) {
    const line: [number, number][] = [[x, y]];

    // Positive direction
    let step = 1;
    while (true) {
      const nx = x + dx * step;
      const ny = y + dy * step;
      if (!isValidCoord(nx, ny) || board[idx(nx, ny)] !== color) break;
      line.push([nx, ny]);
      step++;
    }

    // Negative direction
    step = 1;
    while (true) {
      const nx = x - dx * step;
      const ny = y - dy * step;
      if (!isValidCoord(nx, ny) || board[idx(nx, ny)] !== color) break;
      line.unshift([nx, ny]);
      step++;
    }

    if (line.length >= 5) {
      return line;
    }
  }
  return null;
}

export function placeMove(state: GomokuState, x: number, y: number): boolean {
  if (state.status !== 'playing') return false;
  if (!isValidCoord(x, y)) return false;

  const i = idx(x, y);
  if (state.board[i] !== null) return false;

  const color = state.turn;
  state.board[i] = color;
  state.history.push({ x, y, color });

  const win = checkWin(state.board, x, y, color);
  if (win) {
    state.status = 'won';
    state.winner = color;
    state.winningLine = win;
    return true;
  }

  if (state.history.length === TOTAL_CELLS) {
    state.status = 'draw';
    return true;
  }

  state.turn = color === 'B' ? 'W' : 'B';
  return true;
}

export function undoMove(state: GomokuState): boolean {
  if (state.history.length === 0) return false;

  if (state.mode === 'pvp') {
    const last = state.history.pop()!;
    state.board[idx(last.x, last.y)] = null;
    state.turn = last.color;
    state.status = 'playing';
    state.winner = null;
    state.winningLine = null;
    return true;
  }

  // PvE mode:
  // The computer's opening is not a human move that can be undone.
  if (!state.history.some(move => move.color === state.playerColor)) return false;
  // If game is over and was won by player or draw, undo last 1 or 2 moves
  // If AI just moved (human's turn), undo both AI's move and human's move
  // If human just moved (AI's turn), undo human's move
  const aiColor = state.playerColor === 'B' ? 'W' : 'B';

  if (state.status !== 'playing') {
    const last = state.history.pop()!;
    state.board[idx(last.x, last.y)] = null;
    state.status = 'playing';
    state.winner = null;
    state.winningLine = null;
    if (last.color === aiColor && state.history.length > 0) {
      const prev = state.history.pop()!;
      state.board[idx(prev.x, prev.y)] = null;
    }
    state.turn = state.playerColor;
    return true;
  }

  if (state.turn === state.playerColor) {
    // AI just played, undo AI move then human move
    const aiMove = state.history.pop();
    if (aiMove) state.board[idx(aiMove.x, aiMove.y)] = null;
    const humanMove = state.history.pop();
    if (humanMove) state.board[idx(humanMove.x, humanMove.y)] = null;
    state.turn = state.playerColor;
    return true;
  } else {
    // Human just moved, AI hasn't moved yet
    const humanMove = state.history.pop();
    if (humanMove) state.board[idx(humanMove.x, humanMove.y)] = null;
    state.turn = state.playerColor;
    return true;
  }
}

// ==========================================
// AI Evaluation Engine
// ==========================================

const SCORE_WIN = 100000;
const SCORE_OPEN_4 = 10000;
const SCORE_RUSH_4 = 1200;
const SCORE_OPEN_3 = 1000;
const SCORE_RUSH_3 = 150;
const SCORE_OPEN_2 = 100;
const SCORE_RUSH_2 = 15;

/**
 * Evaluates the strength of placing `color` at `(x, y)` on the given board.
 */
export function evaluatePoint(board: Cell[], x: number, y: number, color: Player): number {
  const opp: Player = color === 'B' ? 'W' : 'B';
  let totalScore = 0;

  for (const [dx, dy] of DIRECTIONS) {
    // Inspect a window of length 9 centered at (x, y), index 4 is (x, y)
    // -4 to +4 along the direction
    const line: (Cell | 'OOB')[] = [];
    for (let k = -4; k <= 4; k++) {
      const nx = x + dx * k;
      const ny = y + dy * k;
      if (!isValidCoord(nx, ny)) {
        line.push('OOB');
      } else if (k === 0) {
        line.push(color); // Temporarily imagine placing the stone here
      } else {
        line.push(board[idx(nx, ny)]);
      }
    }

    // Evaluate all 5-cell contiguous windows containing the center (index 4)
    // Windows start at indices 0, 1, 2, 3, 4
    let dirScore = 0;
    for (let w = 0; w <= 4; w++) {
      let countSelf = 0;
      let blocked = false;

      for (let i = 0; i < 5; i++) {
        const val = line[w + i];
        if (val === opp || val === 'OOB') {
          blocked = true;
          break;
        } else if (val === color) {
          countSelf++;
        }
      }

      if (blocked) continue;

      // Check the two boundaries right outside the 5-cell window
      const leftEnd = w > 0 ? line[w - 1] : 'OOB';
      const rightEnd = w + 5 < line.length ? line[w + 5] : 'OOB';
      const leftOpen = leftEnd === null;
      const rightOpen = rightEnd === null;

      if (countSelf === 5) {
        dirScore = Math.max(dirScore, SCORE_WIN);
      } else if (countSelf === 4) {
        if (leftOpen && rightOpen) {
          dirScore = Math.max(dirScore, SCORE_OPEN_4);
        } else if (leftOpen || rightOpen) {
          dirScore = Math.max(dirScore, SCORE_RUSH_4);
        }
      } else if (countSelf === 3) {
        if (leftOpen && rightOpen) {
          dirScore = Math.max(dirScore, SCORE_OPEN_3);
        } else if (leftOpen || rightOpen) {
          dirScore = Math.max(dirScore, SCORE_RUSH_3);
        }
      } else if (countSelf === 2) {
        if (leftOpen && rightOpen) {
          dirScore = Math.max(dirScore, SCORE_OPEN_2);
        } else if (leftOpen || rightOpen) {
          dirScore = Math.max(dirScore, SCORE_RUSH_2);
        }
      }
    }

    totalScore += dirScore;
  }

  // Small positional preference for center
  const centerDist = Math.abs(x - 7) + Math.abs(y - 7);
  totalScore += Math.max(0, 14 - centerDist);

  return totalScore;
}

export function getCandidates(board: Cell[]): [number, number][] {
  const candidates: [number, number][] = [];
  const visited = new Uint8Array(TOTAL_CELLS);
  let hasStones = false;

  for (let y = 0; y < BOARD_SIZE; y++) {
    for (let x = 0; x < BOARD_SIZE; x++) {
      if (board[idx(x, y)] !== null) {
        hasStones = true;
        // Collect empty neighbors within distance 2
        for (let dy = -2; dy <= 2; dy++) {
          for (let dx = -2; dx <= 2; dx++) {
            const nx = x + dx;
            const ny = y + dy;
            if (isValidCoord(nx, ny)) {
              const ni = idx(nx, ny);
              if (board[ni] === null && !visited[ni]) {
                visited[ni] = 1;
                candidates.push([nx, ny]);
              }
            }
          }
        }
      }
    }
  }

  if (!hasStones) {
    return [[7, 7]];
  }

  return candidates;
}

export function findBestMove(state: GomokuState): { x: number; y: number; score: number } {
  const aiColor = state.turn;
  const oppColor: Player = aiColor === 'B' ? 'W' : 'B';

  const candidates = getCandidates(state.board);
  if (candidates.length === 0) {
    return { x: 7, y: 7, score: 0 };
  }

  let bestMove = candidates[0];
  let maxScore = -Infinity;

  for (const [x, y] of candidates) {
    const attack = evaluatePoint(state.board, x, y, aiColor);
    const defense = evaluatePoint(state.board, x, y, oppColor);

    // If AI can win this move, play immediately
    if (attack >= SCORE_WIN) {
      return { x, y, score: attack };
    }

    // Weight attack slightly higher than defense, but prioritize critical blocks
    // If opponent has win or open 4, defense is paramount
    let combinedScore = attack * 1.1 + defense;
    if (defense >= SCORE_WIN) {
      combinedScore = SCORE_WIN * 1.5 + attack;
    } else if (defense >= SCORE_OPEN_4) {
      combinedScore = SCORE_OPEN_4 * 1.4 + attack;
    } else if (attack >= SCORE_OPEN_4) {
      combinedScore = SCORE_OPEN_4 * 1.3 + defense;
    }

    if (combinedScore > maxScore) {
      maxScore = combinedScore;
      bestMove = [x, y];
    }
  }

  return { x: bestMove[0], y: bestMove[1], score: maxScore };
}

// ==========================================
// Stats Management
// ==========================================

const STATS_KEY = 'naiwa-gomoku-stats';

export function defaultStats(): Stats {
  return {
    pveWins: 0,
    pveLosses: 0,
    pveDraws: 0,
    pvpBlackWins: 0,
    pvpWhiteWins: 0,
    pvpDraws: 0,
  };
}

export function loadStats(storage: Pick<Storage, 'getItem'> = localStorage): Stats {
  try {
    const raw = storage.getItem(STATS_KEY);
    if (!raw) return defaultStats();
    const parsed = JSON.parse(raw);
    return { ...defaultStats(), ...parsed };
  } catch {
    return defaultStats();
  }
}

export function recordGameResult(
  state: GomokuState,
  storage: Pick<Storage, 'getItem' | 'setItem'> = localStorage
): Stats {
  const stats = loadStats(storage);
  if (state.mode === 'pvp') {
    if (state.winner === 'B') stats.pvpBlackWins++;
    else if (state.winner === 'W') stats.pvpWhiteWins++;
    else if (state.status === 'draw') stats.pvpDraws++;
  } else {
    if (state.winner === state.playerColor) {
      stats.pveWins++;
    } else if (state.winner && state.winner !== state.playerColor) {
      stats.pveLosses++;
    } else if (state.status === 'draw') {
      stats.pveDraws++;
    }
  }
  try {
    storage.setItem(STATS_KEY, JSON.stringify(stats));
  } catch {}
  return stats;
}
