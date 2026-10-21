# 奶蛙五子棋 · Naiwa Gomoku

Classic 15×15 Gomoku (五子棋) web game with a cute 奶蛙 theme.
Features local 2-player hot-seat, intelligent and responsive AI, undo, last-move indicator, win ray highlight, WebAudio sound effects, and win statistics in localStorage.

## Run

```bash
cd gomoku
npm install
npm run dev           # local dev server
npm test              # vitest unit tests
npm run build         # production build
npm run build:vercel  # build for /naiwa/gomoku/ base path
```

## How to Play

- **Rules:** Classic 15×15 intersections Gomoku. First player to connect 5 stones in a row (horizontally, vertically, or diagonally) wins.
- **Modes:**
  - **人机对战 (PvE):** Play against an intelligent, responsive heuristic AI. Option to play Black (first move) or White (second move).
  - **双人对战 (PvP):** Local hot-seat two-player match.
- **Controls & Features:**
  - Tap / click any board intersection to place a stone. Hover preview on desktop.
  - **新局:** Start a new match.
  - **悔棋:** Undo moves (undoes both AI and human moves in PvE).
  - **声音:** Toggle procedural WebAudio sound effects (stone placement click, win fanfare, defeat chime, undo pop).
  - **胜率记录:** Persistent win/loss counters saved in localStorage.

## Assets / Credits (`gomoku/public/assets/`)

⚠️ These are **fan-made 奶蛙 assets taken from third-party fan games. They are NOT owned by this repo and are NOT licensed for redistribution.** They are used at the repo owner's discretion.

| File | Source | Source game |
|---|---|---|
| frog-black.webp, face-win.webp, face-dizzy.webp | face-idle, face-win, face-dizzy | 青蛙矿工 frog-miner / 奶蛙扫雷 |
| frog-white.webp, logo.webp | gold0, normal0 | 奶蛙咕咕碰 gugupeng / 打奶蛙 |
| win.webp, lose.webp | win, lose | 奶蛙扫雷 / 奶蛙咕咕碰 gugupeng |
