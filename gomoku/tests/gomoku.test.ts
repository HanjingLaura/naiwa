import { describe, it, expect } from 'vitest';
import {
  createGame,
  placeMove,
  undoMove,
  checkWin,
  findBestMove,
  evaluatePoint,
  recordGameResult,
  loadStats,
  BOARD_SIZE,
  idx,
} from '../src/gomoku';

describe('Gomoku Game Logic', () => {
  it('initializes game properly', () => {
    const game = createGame('pvp');
    expect(game.turn).toBe('B');
    expect(game.status).toBe('playing');
    expect(game.winner).toBeNull();
    expect(game.board.length).toBe(BOARD_SIZE * BOARD_SIZE);
    expect(game.board.every(cell => cell === null)).toBe(true);
  });

  it('handles valid moves and alternates turns', () => {
    const game = createGame('pvp');
    expect(placeMove(game, 7, 7)).toBe(true);
    expect(game.board[idx(7, 7)]).toBe('B');
    expect(game.turn).toBe('W');

    expect(placeMove(game, 7, 8)).toBe(true);
    expect(game.board[idx(7, 8)]).toBe('W');
    expect(game.turn).toBe('B');
  });

  it('rejects moves on occupied cells or out of bounds', () => {
    const game = createGame('pvp');
    expect(placeMove(game, 7, 7)).toBe(true);
    expect(placeMove(game, 7, 7)).toBe(false);
    expect(placeMove(game, -1, 0)).toBe(false);
    expect(placeMove(game, 15, 15)).toBe(false);
  });

  it('detects horizontal win', () => {
    const game = createGame('pvp');
    for (let x = 0; x < 4; x++) {
      placeMove(game, x, 0); // B
      placeMove(game, x, 1); // W
    }
    expect(game.status).toBe('playing');
    placeMove(game, 4, 0); // B completes 5 horizontally
    expect(game.status).toBe('won');
    expect(game.winner).toBe('B');
    expect(game.winningLine).toBeDefined();
    expect(game.winningLine?.length).toBe(5);
  });

  it('detects vertical win', () => {
    const game = createGame('pvp');
    for (let y = 0; y < 4; y++) {
      placeMove(game, 5, y); // B
      placeMove(game, 6, y); // W
    }
    placeMove(game, 5, 4); // B completes 5 vertically
    expect(game.status).toBe('won');
    expect(game.winner).toBe('B');
  });

  it('detects diagonal win', () => {
    const game = createGame('pvp');
    for (let i = 0; i < 4; i++) {
      placeMove(game, i, i);     // B
      placeMove(game, i, i + 1); // W
    }
    placeMove(game, 4, 4); // B completes diagonal \
    expect(game.status).toBe('won');
    expect(game.winner).toBe('B');
  });

  it('detects anti-diagonal win', () => {
    const game = createGame('pvp');
    for (let i = 0; i < 4; i++) {
      placeMove(game, 10 - i, i);     // B
      placeMove(game, 10 - i, i + 1); // W
    }
    placeMove(game, 6, 4); // B completes anti-diagonal /
    expect(game.status).toBe('won');
    expect(game.winner).toBe('B');
  });

  it('supports undo in PvP mode', () => {
    const game = createGame('pvp');
    placeMove(game, 7, 7); // B
    placeMove(game, 7, 8); // W
    expect(undoMove(game)).toBe(true);
    expect(game.board[idx(7, 8)]).toBeNull();
    expect(game.turn).toBe('W');
    expect(game.board[idx(7, 7)]).toBe('B');
  });

  it('supports undo in PvE mode after AI move', () => {
    const game = createGame('pve', 'B');
    placeMove(game, 7, 7); // Human B
    placeMove(game, 8, 8); // AI W
    expect(game.turn).toBe('B');

    expect(undoMove(game)).toBe(true);
    expect(game.board[idx(8, 8)]).toBeNull();
    expect(game.board[idx(7, 7)]).toBeNull();
    expect(game.turn).toBe('B');
    expect(game.history.length).toBe(0);
  });
});

describe('Gomoku AI Engine', () => {
  it('chooses center (7, 7) on empty board', () => {
    const game = createGame('pve', 'W'); // AI plays Black (first)
    const move = findBestMove(game);
    expect(move.x).toBe(7);
    expect(move.y).toBe(7);
  });

  it('takes immediate winning 5-in-a-row', () => {
    const game = createGame('pve', 'B'); // AI is W
    // Set up 4 W stones in a row: (2, 5), (3, 5), (4, 5), (5, 5)
    game.board[idx(2, 5)] = 'W';
    game.board[idx(3, 5)] = 'W';
    game.board[idx(4, 5)] = 'W';
    game.board[idx(5, 5)] = 'W';
    game.turn = 'W';

    const best = findBestMove(game);
    // Should choose (1, 5) or (6, 5) to win!
    expect(best.y).toBe(5);
    expect([1, 6]).toContain(best.x);
  });

  it('blocks opponent 4-in-a-row to prevent loss', () => {
    const game = createGame('pve', 'B'); // AI is W
    // Set up 4 B stones in a row: (3, 7), (4, 7), (5, 7), (6, 7)
    game.board[idx(3, 7)] = 'B';
    game.board[idx(4, 7)] = 'B';
    game.board[idx(5, 7)] = 'B';
    game.board[idx(6, 7)] = 'B';
    game.turn = 'W';

    const best = findBestMove(game);
    // AI must block at (2, 7) or (7, 7)
    expect(best.y).toBe(7);
    expect([2, 7]).toContain(best.x);
  });

  it('blocks opponent open 3', () => {
    const game = createGame('pve', 'B'); // AI is W
    // Set up 3 B stones in a row with both ends open: (4, 6), (5, 6), (6, 6)
    game.board[idx(4, 6)] = 'B';
    game.board[idx(5, 6)] = 'B';
    game.board[idx(6, 6)] = 'B';
    game.turn = 'W';

    const best = findBestMove(game);
    // AI should block either at (3, 6) or (7, 6)
    expect(best.y).toBe(6);
    expect([3, 7]).toContain(best.x);
  });
});

describe('Stats recording', () => {
  it('saves and loads stats correctly', () => {
    const memStore: Record<string, string> = {};
    const mockStorage = {
      getItem: (k: string) => memStore[k] ?? null,
      setItem: (k: string, v: string) => { memStore[k] = v; },
    };

    const game = createGame('pve', 'B');
    game.status = 'won';
    game.winner = 'B';

    const stats = recordGameResult(game, mockStorage);
    expect(stats.pveWins).toBe(1);
    expect(stats.pveLosses).toBe(0);

    const loaded = loadStats(mockStorage);
    expect(loaded.pveWins).toBe(1);
  });
});
