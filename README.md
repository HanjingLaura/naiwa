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

**Mines (v2):** revealed mines rotate through gugupeng 3cf447, naishu-v24-dizzy, e7c4, naishu-yogurt-punk skin, 04fd2f (奶蛋) and frog-miner rare-45. Fan assets; not owned by this repo.

## 奶蛙博物馆 · Naiwa Museum (`museum/`)

Live: https://hanjing-laura.vercel.app/naiwa/museum/

A cute museum site with 222 exhibits in 7 halls:
- 📷 奶蛙影像馆: Laura's cinematic photos.
- 🖼️ 奶蛙名画馆: art parodies, Western and Chinese.
- 👗 服装造型 (costumes), 🤸 动作姿势 (poses), ✉️ 旅行明信片 (travel postcards), ✨ 特效道具 (effects and props).
- 🧊 3D 模型: a three.js GLB viewer, lazy-loaded, with drag to rotate.

Also includes an entrance page with a hall map, a big lightbox (swipe, arrow keys and Esc work), search, tag filters within each hall, a 游戏厅 page linking the naiwa games, and a credits page.

The exhibit images are built by `scripts/build-exhibits.py`, which reads from the local survey dump and Laura's photo attachments. It makes webp files plus thumbnails, crops the screenshots (black bars and app UI removed), and writes `src/exhibits.json`. 3D thumbnails are made by `scripts/model-thumbs.mjs`.

### ASSETS / credits (`museum/public/ex`, `museum/public/models`)

⚠️ Except for the 影像馆 and 名画馆 images (provided by Laura), all exhibits are **fan-made 奶蛙 assets taken from third-party fan games. They are NOT owned by this repo and are NOT licensed for redistribution.** They are used at the repo owner's discretion. Each exhibit's lightbox shows its source game and a link.

| Hall | Source |
|---|---|
| 影像馆, 名画馆 | Laura's collection (images and screenshots she shared, cropped) |
| 服装造型 | 青蛙矿工 frog-miner (`frog-rare-*`) — https://66970010-boop.github.io/frog-miner/ ; 奶蛙咕咕碰 skins — https://naiwa-gugupeng.pages.dev/ |
| 动作姿势 | 奶蛙咕咕碰 gugupeng sprites |
| 旅行明信片 | 奶蛙旅行小屋 TravelMilkyFrog — https://www.bilibili.com/toy/TravelMilkyFrog/index.html |
| 特效道具 | gugupeng effects; 合成大奶蛙 BigNaiWa fruits — https://yhsome.github.io/BigNaiWa/ ; frog-miner props |
| 3D 模型 | 奶蛙跳舞 nailong-dance (`rigged.glb`, `baby1.glb`, `gifts/*.glb` plus their external texture `gifts/Textures/colormap.png`, saved as `models/Textures/colormap.png`) — https://nailong-dance.pages.dev/ |

**v2:** gallery-style look (warm wall, serif labels, framed works, No. numbers); captions shortened to hand-written wall labels in `museum/scripts/captions.py`.

## 奶了个蛙 · Triple-match (`nailegewa/`)

Live: https://hanjing-laura.vercel.app/naiwa/nailegewa/

A 羊了个羊-style game with naiwa tile faces:
- Tiles are stacked in overlapping layers, and only uncovered tiles can be tapped.
- Tapped tiles go into a 7-slot tray, grouped by face. Three of the same face clear. You lose when the tray fills up, and win when the board is empty.
- Level 1 is easy (36 tiles, 6 faces, 3 layers). Level 2 is hard (156 tiles, 13 faces, 9 layers).
- Props, each usable once per game: 移出 (move 3 tiles out of the tray), 撤回 (undo), 洗牌 (shuffle).
- Optional WebAudio sounds, and a fixed screen on mobile.
- **Every level is solvable:** levels are built by "reverse play". The generator repeatedly takes 3 currently uncovered tiles and gives them the same face, so playing in that order always clears the board. The tests replay this solution for 20 seeds per level.

### ASSETS / credits (`nailegewa/public/assets/`)

⚠️ These are **fan-made 奶蛙 assets taken from third-party fan games. They are NOT owned by this repo and are NOT licensed for redistribution.** They are used at the repo owner's discretion.

| File | Source image | Source game |
|---|---|---|
| t0–t13.webp (tile faces) | frog-rare-10, 11, 12, 13, 14, 15, 16, 25, 40, 8, 30, 38, 4, 45 | 青蛙矿工 frog-miner — https://66970010-boop.github.io/frog-miner/ |
| logo.webp | frog-rare-22 | frog-miner |
| win.webp | bdde48ade4583f2a | 奶蛙咕咕碰 gugupeng — https://naiwa-gugupeng.pages.dev/ |
| lose.webp | a01bb7af93d35e5c | gugupeng |

**v2 — 羊了个羊 style:** level 1 is a 3-type tutorial; level 2 has 216 tiles, 12 layers, 18 types and two 18-card blind side piles (only the top card is playable). Every level is still generated solvable by reverse play.
**Tiles t0–t17:** frog-miner rare-10/13/15/16/40/45/25/38/24/11; gugupeng 0a01, 3cf447, naishu-v24-idle (奶鼠), 04fd2f (奶蛋); skins galaxy-shepherd, night-foreman, naidan-caramel-pop, naishu-yogurt-punk. Fan assets; not owned by this repo.

## 打奶蛙 · Whack-a-Naiwa (`whack/`)

Live: https://hanjing-laura.vercel.app/naiwa/whack/

- Naiwa pop out of 9 holes. Normal naiwa are +10, golden naiwa +50. The dizzy naiwa is −30, resets your combo and stuns you briefly.
- Hit naiwa change to a reaction pose. Combo multiplier: ×1.5 at 5 hits, ×2 at 10, and so on. Missing or letting a naiwa escape breaks the combo.
- 60-second round that speeds up over time. High score saved in localStorage, optional sounds, fixed mobile screen with tap input.
- The game logic in `src/whack.ts` is pure and time-injected, so it can be unit-tested (`npm test`). It was written fresh, not ported from 胡同地鼠.

### ASSETS / credits (`whack/public/assets/`)

⚠️ These are **fan-made 奶蛙 assets taken from 奶蛙咕咕碰 gugupeng (https://naiwa-gugupeng.pages.dev/). They are NOT owned by this repo and are NOT licensed for redistribution.** They are used at the repo owner's discretion.

| File | Source image |
|---|---|
| normal.webp / hit.webp | 07a8abdf58338ff6 / e3d3581cc9141994 |
| gold.webp / gold-hit.webp | skins/naiwa-galaxy-shepherd / bdde48ade4583f2a |
| bomb.webp / bomb-hit.webp | e7c4f898cd836e40 / 3cf447de0a6da507 |
| win.webp | 0a01725bd3bac957 |

**Asset pools (v2):** normal0–11 = gugupeng 07a8, 93db9f, 01662141, 97e2373e, 4690b22b, 04fd2f (奶蛋), naishu-v24-idle (奶鼠) + frog-miner rare-16/15/13/45/40; hit0–3 = gugupeng e3d3, 810e9d, ef2ebd8b, naishu-v24-hit; gold0–2 = skins galaxy-shepherd / night-foreman / naidan-caramel-pop; bomb0–2 = e7c4, a01bb7, naishu-v24-dizzy. All fan assets from 咕咕碰 (10-gugupeng) and 青蛙矿工 frog-miner; this repo does not own them.

## 奶蛙叠叠乐 · Naiwa Stack (`stack/`)

Live: https://hanjing-laura.vercel.app/naiwa/stack/

- Tap (or press Space) to drop the naiwa sliding across the top onto the tower.
- Landing within 2.5 units of the centre is a perfect drop: it snaps to the centre, and consecutive perfects give combo bonus points.
- The tower collapses when the centre of mass above any naiwa moves past that naiwa's footprint. Missing the tower ends the game too.
- It speeds up as the tower grows. The best height is saved in localStorage. Optional sounds, fixed mobile screen.
- The logic in `src/stack.ts` is pure and covered by unit tests (bounce, perfect snap and combo, offset, miss, centre-of-mass collapse, speed-up, best score).

### ASSETS / credits (`stack/public/assets/`)

⚠️ These are **fan-made 奶蛙 assets taken from third-party fan games. They are NOT owned by this repo and are NOT licensed for redistribution.** They are used at the repo owner's discretion.

| File | Source image | Source game |
|---|---|---|
| b0–b11.webp (stack naiwa) | frog-rare-9, 34, 36, 32, 25, 4, 8, 44, 38, 26, 30, 35 | 青蛙矿工 frog-miner — https://66970010-boop.github.io/frog-miner/ |
| logo.webp | frog-rare-22 | frog-miner |
| fall.webp | a01bb7af93d35e5c | 奶蛙咕咕碰 gugupeng — https://naiwa-gugupeng.pages.dev/ |
| win.webp | bdde48ade4583f2a | gugupeng |

**Blocks (v2):** b0–b21 interleave frog-miner costumes with gugupeng 93db9f, 01662141, 04fd2f (奶蛋), naishu-v24-idle, 97e2373e, 4690b22b and skins galaxy-shepherd, night-foreman, naidan-caramel-pop, naishu-yogurt-punk. Fan assets; not owned by this repo.
