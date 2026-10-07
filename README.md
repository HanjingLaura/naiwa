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
