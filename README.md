# naiwa
## 奶娃纸牌 · Spider Solitaire (`spider-solitaire/`)

A static web Spider Solitaire game starring Naiwa, the yellow frog blob. Works on desktop and mobile: touch or mouse drag, tap a card to auto-move it, and the screen stays fixed on mobile.

- Rules: 104 cards, 10 columns (54 dealt, last card face up). The stock deals one card to every column, but only when no column is empty. You can move a descending same-suit run onto any card one rank higher, or onto an empty column. A complete K→A same-suit run is removed automatically, and 8 runs wins.
- Score starts at 500, goes down 1 per move or deal, and goes up 100 per completed run. Also has undo (Ctrl/Cmd+Z), hint (H), new game, 1/2/4-suit difficulty, a win animation, and progress saved in localStorage.
- Cards show the rank, a colored suit symbol (♠ black, ♥ red, ♣ green, ♦ orange), and a naiwa character icon for each suit.

```bash
cd spider-solitaire
npm install
npm run dev      # local dev
npm test         # rule unit tests (vitest)
npm run build    # static output in dist/ (relative base, works on GitHub Pages / Vercel)
```

### ASSETS / credits (`spider-solitaire/public/assets/`)

⚠️ These are **fan-made 奶蛙 (Naiwa) assets taken from third-party fan games. They are NOT owned by this repo and are NOT licensed for redistribution.** They are used here at the repo owner's own discretion. All rights belong to their original creators. Images were cropped, resized, and converted to webp (transparency kept).

| File | Source image | Source game |
|---|---|---|
| suit-spade.webp (nun) | frog-rare-10 | 青蛙矿工 frog-miner — https://66970010-boop.github.io/frog-miner/ |
| suit-heart.webp (holding heart) | frog-rare-25 | frog-miner |
| suit-club.webp (flower bouquet) | frog-rare-8 | frog-miner |
| suit-diamond.webp (punk hair) | frog-rare-13 | frog-miner |
| face-J.webp (top hat gentleman) | frog-rare-15 | frog-miner |
| face-Q.webp (galaxy shepherd skin) | skins/naiwa-galaxy-shepherd | 奶蛙咕咕碰 gugupeng — https://naiwa-gugupeng.pages.dev/ |
| face-K.webp (night foreman skin) | skins/naiwa-night-foreman | gugupeng |
| face-A.webp (Santa hat) | frog-rare-40 | frog-miner |
| win.webp (laughing pose) | 0a01725bd3bac957 (stray sprite fragments removed) | gugupeng |
| back.webp | green card background drawn for this repo + frog-rare-22 (奶蛙人 flag) | frog-miner |
| table.webp | felt tile drawn for this repo | original |

## 奶蛙扫雷 · Minesweeper (`minesweeper/`)

Live: https://hanjing-laura.vercel.app/naiwa/minesweeper/

Classic Minesweeper with naiwa art:
- Levels: 初级 9×9/10, 中级 16×16/40, 高级 30×16/99. The first click is always safe and opens an empty area.
- Gameplay: flood reveal, flags, chord (tap a number, or both/middle mouse buttons), timer, mine counter, and best times saved in localStorage.
- The face button changes expression: idle, worried while pressing, a wink on a win, dizzy on a loss. Win and lose pop-ups.
- Mobile: tap to reveal, long-press to flag, and a 插旗模式 toggle. The screen is fixed, and on a portrait phone the expert board is rotated 90° so it fits.
- `npm test` runs the board logic tests. `npm run build:vercel` builds for the `/naiwa/minesweeper/` path. `npm run assets` rebuilds the images from the local survey dump.

### ASSETS / credits (`minesweeper/public/assets/`)

⚠️ These are **fan-made 奶蛙 assets taken from third-party fan games. They are NOT owned by this repo and are NOT licensed for redistribution.** They are used at the repo owner's discretion. They were cropped (stray sprite fragments removed), resized and converted to webp.

| File | Source image | Source game |
|---|---|---|
| mine.webp | 3cf447de0a6da507 (dizzy, flat) | 奶蛙咕咕碰 gugupeng — https://naiwa-gugupeng.pages.dev/ |
| flag.webp | frog-rare-22 (奶蛙人 flag) | 青蛙矿工 frog-miner — https://66970010-boop.github.io/frog-miner/ |
| face-idle.webp | 93db9f6eda3e71a5 | gugupeng |
| face-worried.webp | 810e9d06af4c98a9 | gugupeng |
| face-win.webp | bdde48ade4583f2a | gugupeng |
| face-dizzy.webp | a01bb7af93d35e5c | gugupeng |
| win.webp | 0a01725bd3bac957 (laughing) | gugupeng |
| lose.webp | e818016a0d25c224 (dizzy) | gugupeng |
