import './style.css';
import {
  GomokuState,
  GameMode,
  Player,
  createGame,
  placeMove,
  undoMove,
  findBestMove,
  recordGameResult,
  loadStats,
  BOARD_SIZE,
  idx,
} from './gomoku';

const A = (name: string) => `${import.meta.env.BASE_URL}assets/${name}.webp`;
const $ = <T extends HTMLElement = HTMLElement>(id: string) => document.getElementById(id) as T;

// Canvas & DOM
const cv = $<HTMLCanvasElement>('cv');
const ctx = cv.getContext('2d')!;
const boardBox = $('board-box');
const sndBtn = $('snd');
const restartBtn = $('restart');
const modePveBtn = $('mode-pve');
const modePvpBtn = $('mode-pvp');
const swapBtn = $('swap');
const undoBtn = $<HTMLButtonElement>('undo');
const overlay = $('overlay');
const againBtn = $('again');
const popImg = $<HTMLImageElement>('popimg');
const popTitle = $('poptitle');
const popText = $('poptext');
const popDiv = overlay.querySelector('.pop')!;

const cardBlack = $('card-black');
const cardWhite = $('card-white');
const tagBlack = $('tag-black');
const tagWhite = $('tag-white');
const statBlack = $('stat-black');
const statWhite = $('stat-white');
const turnBox = $('turn-box');
const turnDot = $('turn-dot');
const turnText = $('turn-text');
const tip = $('tip');

// Images
const IMAGES: Record<string, HTMLImageElement> = {};
const ASSET_NAMES = ['frog-black', 'frog-white', 'win', 'lose', 'face-win', 'face-dizzy'];

function preloadImages(): Promise<void[]> {
  return Promise.all(
    ASSET_NAMES.map(
      name =>
        new Promise<void>(resolve => {
          const img = new Image();
          img.onload = () => {
            IMAGES[name] = img;
            resolve();
          };
          img.onerror = () => resolve();
          img.src = A(name);
        })
    )
  );
}

// State
let mode: GameMode = (localStorage.getItem('naiwa-gomoku-mode') as GameMode) || 'pve';
let humanColor: Player = (localStorage.getItem('naiwa-gomoku-human') as Player) || 'B';
let soundEnabled = localStorage.getItem('naiwa-gomoku-sound') !== '0';
let game: GomokuState = createGame(mode, humanColor);
let isAiThinking = false;
let aiTimer: number | undefined;
let hoverCoord: [number, number] | null = null;
let ac: AudioContext | null = null;

// Sound Synthesizer (WebAudio)
function playTone(freq: number, duration: number, type: OscillatorType = 'triangle', gainVal = 0.2) {
  if (!soundEnabled) return;
  try {
    ac ||= new AudioContext();
    const t = ac.currentTime;
    const osc = ac.createOscillator();
    const gain = ac.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t);
    gain.gain.setValueAtTime(gainVal, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + duration);
    osc.connect(gain);
    gain.connect(ac.destination);
    osc.start(t);
    osc.stop(t + duration);
  } catch {}
}

function playStoneSound() {
  if (!soundEnabled) return;
  try {
    ac ||= new AudioContext();
    const t = ac.currentTime;
    const o1 = ac.createOscillator();
    const o2 = ac.createOscillator();
    const g = ac.createGain();
    o1.frequency.setValueAtTime(420, t);
    o1.frequency.exponentialRampToValueAtTime(160, t + 0.05);
    o2.frequency.setValueAtTime(740, t);
    o2.frequency.exponentialRampToValueAtTime(280, t + 0.04);
    g.gain.setValueAtTime(0.32, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.06);
    o1.connect(g);
    o2.connect(g);
    g.connect(ac.destination);
    o1.start(t);
    o2.start(t);
    o1.stop(t + 0.06);
    o2.stop(t + 0.06);
  } catch {}
}

function playWinSound() {
  if (!soundEnabled) return;
  const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
  notes.forEach((freq, idx) => {
    setTimeout(() => playTone(freq, 0.18, 'sine', 0.25), idx * 110);
  });
}

function playDefeatSound() {
  if (!soundEnabled) return;
  const notes = [440, 392, 349.23, 293.66]; // A4, G4, F4, D4
  notes.forEach((freq, idx) => {
    setTimeout(() => playTone(freq, 0.22, 'sawtooth', 0.18), idx * 130);
  });
}

function playUndoSound() {
  playTone(320, 0.08, 'triangle', 0.15);
}

// Geometry Helpers
function getBoardMetrics() {
  const rect = cv.getBoundingClientRect();
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  const size = rect.width;
  const paddingRatio = 0.65;
  const step = size / (BOARD_SIZE - 1 + paddingRatio * 2);
  const margin = step * paddingRatio;
  return { rect, dpr, size, step, margin };
}

function clientToBoard(clientX: number, clientY: number): [number, number] | null {
  const { rect, step, margin } = getBoardMetrics();
  const px = clientX - rect.left;
  const py = clientY - rect.top;

  const x = Math.round((px - margin) / step);
  const y = Math.round((py - margin) / step);

  if (x >= 0 && x < BOARD_SIZE && y >= 0 && y < BOARD_SIZE) {
    const targetX = margin + x * step;
    const targetY = margin + y * step;
    const distSq = (px - targetX) ** 2 + (py - targetY) ** 2;
    if (distSq <= (step * 0.48) ** 2) {
      return [x, y];
    }
  }
  return null;
}

// Rendering
function render() {
  const { dpr, size, step, margin } = getBoardMetrics();
  cv.width = size * dpr;
  cv.height = size * dpr;
  ctx.resetTransform();
  ctx.scale(dpr, dpr);

  ctx.clearRect(0, 0, size, size);

  // 1. Grid Lines
  ctx.strokeStyle = 'rgba(92, 54, 12, 0.75)';
  ctx.lineWidth = 1.2;

  for (let i = 0; i < BOARD_SIZE; i++) {
    const pos = margin + i * step;

    // Horizontal
    ctx.beginPath();
    ctx.moveTo(margin, pos);
    ctx.lineTo(margin + (BOARD_SIZE - 1) * step, pos);
    ctx.stroke();

    // Vertical
    ctx.beginPath();
    ctx.moveTo(pos, margin);
    ctx.lineTo(pos, margin + (BOARD_SIZE - 1) * step);
    ctx.stroke();
  }

  // 2. Star Points (天元与星位)
  const starCoords = [
    [3, 3], [11, 3],
    [7, 7],
    [3, 11], [11, 11],
  ];
  ctx.fillStyle = '#5c360c';
  for (const [sx, sy] of starCoords) {
    const cx = margin + sx * step;
    const cy = margin + sy * step;
    ctx.beginPath();
    ctx.arc(cx, cy, Math.max(2.5, step * 0.08), 0, Math.PI * 2);
    ctx.fill();
  }

  // 3. Ghost Stone (Desktop hover)
  if (hoverCoord && game.status === 'playing' && !isAiThinking) {
    const [hx, hy] = hoverCoord;
    if (game.board[idx(hx, hy)] === null) {
      const cx = margin + hx * step;
      const cy = margin + hy * step;
      const r = step * 0.44;
      ctx.save();
      ctx.globalAlpha = 0.35;
      drawStoneDisc(cx, cy, r, game.turn);
      ctx.restore();
    }
  }

  // 4. Stones
  const r = step * 0.44;
  for (let y = 0; y < BOARD_SIZE; y++) {
    for (let x = 0; x < BOARD_SIZE; x++) {
      const stone = game.board[idx(x, y)];
      if (stone !== null) {
        const cx = margin + x * step;
        const cy = margin + y * step;
        drawStone(cx, cy, r, stone);
      }
    }
  }

  // 5. Last Move Indicator
  if (game.history.length > 0) {
    const last = game.history[game.history.length - 1];
    const lx = margin + last.x * step;
    const ly = margin + last.y * step;

    // Glowing dot or ring on last stone
    ctx.save();
    ctx.beginPath();
    ctx.arc(lx, ly, r * 0.28, 0, Math.PI * 2);
    ctx.fillStyle = last.color === 'B' ? '#ffcc00' : '#e65100';
    ctx.shadowColor = last.color === 'B' ? '#ffea75' : '#ff9800';
    ctx.shadowBlur = 6;
    ctx.fill();
    ctx.restore();
  }

  // 6. Winning Line & Highlighting
  if (game.status === 'won' && game.winningLine) {
    // Connect line
    ctx.save();
    ctx.strokeStyle = '#ffd700';
    ctx.lineWidth = Math.max(4, step * 0.12);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.shadowColor = '#ff6f00';
    ctx.shadowBlur = 10;

    ctx.beginPath();
    game.winningLine.forEach(([wx, wy], i) => {
      const px = margin + wx * step;
      const py = margin + wy * step;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    });
    ctx.stroke();

    // Pulse circles around winning stones
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2.5;
    game.winningLine.forEach(([wx, wy]) => {
      const px = margin + wx * step;
      const py = margin + wy * step;
      ctx.beginPath();
      ctx.arc(px, py, r * 1.05, 0, Math.PI * 2);
      ctx.stroke();
    });
    ctx.restore();
  }
}

function drawStoneDisc(cx: number, cy: number, r: number, color: Player) {
  ctx.save();
  ctx.shadowColor = 'rgba(50, 25, 0, 0.4)';
  ctx.shadowBlur = 4;
  ctx.shadowOffsetY = 2;

  const grad = ctx.createRadialGradient(cx - r * 0.35, cy - r * 0.35, r * 0.1, cx, cy, r);
  if (color === 'B') {
    grad.addColorStop(0, '#555555');
    grad.addColorStop(0.7, '#1f1f1f');
    grad.addColorStop(1, '#080808');
  } else {
    grad.addColorStop(0, '#ffffff');
    grad.addColorStop(0.75, '#f0efe6');
    grad.addColorStop(1, '#d0cec0');
  }
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawStone(cx: number, cy: number, r: number, color: Player) {
  drawStoneDisc(cx, cy, r, color);

  // Draw cute Naiwa Face inside the stone
  const spriteName = color === 'B' ? 'frog-black' : 'frog-white';
  const img = IMAGES[spriteName];
  if (img) {
    ctx.save();
    // Clip inside the circular stone with small inset
    ctx.beginPath();
    ctx.arc(cx, cy, r * 0.88, 0, Math.PI * 2);
    ctx.clip();

    const w = r * 1.6;
    const h = r * 1.6;
    ctx.drawImage(img, cx - w / 2, cy - h / 2, w, h);
    ctx.restore();
  }
}

// HUD & UI Updates
function updateUI() {
  const stats = loadStats();

  if (game.mode === 'pve') {
    modePveBtn.classList.add('on');
    modePvpBtn.classList.remove('on');
    swapBtn.style.display = 'inline-block';
    swapBtn.textContent = game.playerColor === 'B' ? '执黑(先)' : '执白(后)';

    tagBlack.textContent = game.playerColor === 'B' ? '玩家' : '电脑';
    tagWhite.textContent = game.playerColor === 'W' ? '玩家' : '电脑';

    statBlack.textContent = game.playerColor === 'B' ? `胜 ${stats.pveWins}` : `负 ${stats.pveWins}`;
    statWhite.textContent = game.playerColor === 'W' ? `胜 ${stats.pveWins}` : `胜 ${stats.pveLosses}`;
  } else {
    modePveBtn.classList.remove('on');
    modePvpBtn.classList.add('on');
    swapBtn.style.display = 'none';

    tagBlack.textContent = '玩家1';
    tagWhite.textContent = '玩家2';

    statBlack.textContent = `胜 ${stats.pvpBlackWins}`;
    statWhite.textContent = `胜 ${stats.pvpWhiteWins}`;
  }

  // Active player highlighting
  cardBlack.classList.toggle('active', game.status === 'playing' && game.turn === 'B');
  cardWhite.classList.toggle('active', game.status === 'playing' && game.turn === 'W');

  // Turn Indicator
  turnDot.className = 'turn-dot';
  if (game.turn === 'W') turnDot.classList.add('white');

  if (game.status === 'playing') {
    if (game.mode === 'pve' && game.turn !== game.playerColor) {
      turnDot.classList.add('thinking');
      turnText.textContent = '奶蛙思考中...';
    } else {
      turnText.textContent = game.turn === 'B' ? '黑棋回合' : '白棋回合';
    }
  } else if (game.status === 'won') {
    turnText.textContent = game.winner === 'B' ? '黑棋胜出！' : '白棋胜出！';
  } else if (game.status === 'draw') {
    turnText.textContent = '势均力敌(平局)';
  }

  undoBtn.disabled = isAiThinking || !game.history.some(move =>
    game.mode === 'pvp' || move.color === game.playerColor);
  render();
}

function handleGameEnd() {
  const stats = recordGameResult(game);
  overlay.hidden = false;
  popDiv.className = 'pop';

  if (game.status === 'won') {
    const isPlayerWin = game.mode === 'pvp' || game.winner === game.playerColor;
    if (isPlayerWin) {
      playWinSound();
      popDiv.classList.add('win');
      popImg.src = A('win');
      popTitle.textContent = game.mode === 'pvp' ? `${game.winner === 'B' ? '黑棋' : '白棋'}获胜！` : '恭喜大获全胜！';
      popText.textContent = `五子连珠！奶蛙为你欢呼雀跃（共 ${game.history.length} 步）。`;
    } else {
      playDefeatSound();
      popDiv.classList.add('lose');
      popImg.src = A('lose');
      popTitle.textContent = '奶蛙棋圣赢了！';
      popText.textContent = `棋差一着，别灰心，再来一局挑战奶蛙吧！`;
    }
  } else {
    // Draw
    popImg.src = A('face-dizzy');
    popTitle.textContent = '握手言和！';
    popText.textContent = `棋盘已经下满，双方棋逢对手不分上下！`;
  }
}

// Moves
function triggerMove(x: number, y: number) {
  if (game.status !== 'playing' || isAiThinking) return;

  // In PvE mode, only allow move if it's human's turn
  if (game.mode === 'pve' && game.turn !== game.playerColor) return;

  const success = placeMove(game, x, y);
  if (!success) return;

  playStoneSound();
  updateUI();

  if (game.status !== 'playing') {
    handleGameEnd();
    return;
  }

  // If PvE and now AI's turn
  if (game.mode === 'pve' && game.turn !== game.playerColor) {
    runAiTurn();
  }
}

function runAiTurn() {
  const scheduledGame = game;
  isAiThinking = true;
  updateUI();

  // Natural thinking pause (100 - 180ms)
  const delay = Math.floor(Math.random() * 80) + 100;
  aiTimer = window.setTimeout(() => {
    if (game !== scheduledGame) return;
    aiTimer = undefined;
    if (game.status !== 'playing' || game.mode !== 'pve' || game.turn === game.playerColor) {
      isAiThinking = false;
      return;
    }

    const best = findBestMove(game);
    placeMove(game, best.x, best.y);
    playStoneSound();
    isAiThinking = false;
    updateUI();

    if (game.status !== 'playing') {
      handleGameEnd();
    }
  }, delay);
}

// User Actions
function newGame() {
  if (aiTimer !== undefined) window.clearTimeout(aiTimer);
  aiTimer = undefined;
  overlay.hidden = true;
  isAiThinking = false;
  game = createGame(mode, humanColor);
  updateUI();

  // If PvE and human chose White, AI moves first as Black
  if (mode === 'pve' && humanColor === 'W') {
    runAiTurn();
  }
}

function switchMode(newMode: GameMode) {
  mode = newMode;
  localStorage.setItem('naiwa-gomoku-mode', mode);
  newGame();
}

function toggleSwap() {
  humanColor = humanColor === 'B' ? 'W' : 'B';
  localStorage.setItem('naiwa-gomoku-human', humanColor);
  newGame();
}

function handleUndo() {
  if (isAiThinking || game.history.length === 0) return;
  overlay.hidden = true;
  if (undoMove(game)) {
    playUndoSound();
    updateUI();
  }
}

function toggleSound() {
  soundEnabled = !soundEnabled;
  localStorage.setItem('naiwa-gomoku-sound', soundEnabled ? '1' : '0');
  sndBtn.textContent = soundEnabled ? '🔊' : '🔇';
}

// Event Listeners
sndBtn.onclick = toggleSound;
restartBtn.onclick = newGame;
againBtn.onclick = newGame;
modePveBtn.onclick = () => switchMode('pve');
modePvpBtn.onclick = () => switchMode('pvp');
swapBtn.onclick = toggleSwap;
undoBtn.onclick = handleUndo;

// Click / Touch on Canvas
cv.addEventListener('click', e => {
  const coord = clientToBoard(e.clientX, e.clientY);
  if (coord) {
    triggerMove(coord[0], coord[1]);
  }
});

cv.addEventListener('mousemove', e => {
  hoverCoord = clientToBoard(e.clientX, e.clientY);
  render();
});

cv.addEventListener('mouseleave', () => {
  hoverCoord = null;
  render();
});

// Touch handler
cv.addEventListener('touchstart', e => {
  e.preventDefault();
  if (e.touches.length > 0) {
    const t = e.touches[0];
    const coord = clientToBoard(t.clientX, t.clientY);
    if (coord) {
      triggerMove(coord[0], coord[1]);
    }
  }
}, { passive: false });

window.addEventListener('resize', render);

// Initialization
async function init() {
  sndBtn.textContent = soundEnabled ? '🔊' : '🔇';
  const imgBlack = cardBlack.querySelector<HTMLImageElement>('.avatar');
  const imgWhite = cardWhite.querySelector<HTMLImageElement>('.avatar');
  if (imgBlack) imgBlack.src = A('frog-black');
  if (imgWhite) imgWhite.src = A('frog-white');
  await preloadImages();
  newGame();
}

init();
