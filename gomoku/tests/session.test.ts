import { beforeEach, afterEach, expect, it, vi } from 'vitest';
import * as rules from '../src/gomoku';

vi.mock('../src/gomoku', async importOriginal => {
  const original = await importOriginal<typeof import('../src/gomoku')>();
  return { ...original, placeMove: vi.fn(original.placeMove) };
});

const elements = new Map<string, any>();
beforeEach(async () => {
  vi.useFakeTimers();
  vi.resetModules();
  vi.mocked(rules.placeMove).mockClear();
  elements.clear();
  const context = new Proxy({}, { get: () => () => ({ addColorStop() {} }) });
  const element = (id: string): any => {
    if (!elements.has(id)) elements.set(id, {
      style: {}, classList: { add() {}, remove() {}, toggle() {} },
      querySelector: () => null, getContext: () => context,
      getBoundingClientRect: () => ({ left: 0, top: 0, width: 500, height: 500 }),
      addEventListener(type: string, callback: unknown) { this[type] = callback; },
    });
    return elements.get(id);
  };
  vi.stubGlobal('document', { getElementById: element });
  vi.stubGlobal('window', { setTimeout, clearTimeout, devicePixelRatio: 1, addEventListener() {} });
  vi.stubGlobal('localStorage', { getItem: (key: string) => key === 'naiwa-gomoku-sound' ? '0' : null, setItem() {} });
  vi.stubGlobal('Image', class {
    onload?: () => void;
    set src(_: string) { Promise.resolve().then(() => this.onload?.()); }
  });
  await import('../src/main');
  await Promise.resolve();
  await Promise.resolve();
});
afterEach(() => { vi.useRealTimers(); vi.unstubAllGlobals(); });

it.each(['mode-pvp', 'restart'])('discards an AI reply after %s starts a new game', id => {
  elements.get('mode-pve').onclick();
  elements.get('cv').click({ clientX: 250, clientY: 250 });
  const before = vi.mocked(rules.placeMove).mock.calls.length;
  expect(before).toBe(1);
  elements.get(id).onclick();
  vi.advanceTimersByTime(300);
  expect(rules.placeMove).toHaveBeenCalledTimes(before);
});

it('keeps the computer opening when the human plays white', () => {
  const game = rules.createGame('pve', 'W');
  rules.placeMove(game, 7, 7);
  expect(rules.undoMove(game)).toBe(false);
  expect(game.board[rules.idx(7, 7)]).toBe('B');
  expect(game.turn).toBe('W');
});

it('schedules only the new computer opening when switching to white during an AI reply', () => {
  elements.get('mode-pve').onclick();
  elements.get('cv').click({ clientX: 250, clientY: 250 });
  elements.get('swap').onclick();
  vi.advanceTimersByTime(300);
  expect(rules.placeMove).toHaveBeenCalledTimes(2);
  const openingGame = vi.mocked(rules.placeMove).mock.calls[1][0];
  expect(openingGame.history).toHaveLength(1);
  expect(openingGame.turn).toBe('W');
  expect(elements.get('undo').disabled).toBe(true);
});
