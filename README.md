# naiwa
## 奶娃纸牌 · Spider Solitaire (`spider-solitaire/`)

A static web Spider Solitaire game starring Naiwa, the yellow frog blob. Works on desktop and mobile: touch or mouse drag, tap a card to auto-move it, and the screen stays fixed on mobile.

- Rules: 104 cards, 10 columns (54 dealt, last card face up). The stock deals one card to every column, but only when no column is empty. You can move a descending same-suit run onto any card one rank higher, or onto an empty column. A complete K→A same-suit run is removed automatically, and 8 runs wins.
- Score starts at 500, goes down 1 per move or deal, and goes up 100 per completed run. Also has undo (Ctrl/Cmd+Z), hint (H), new game, 1/2/4-suit difficulty, a win animation, and progress saved in localStorage.
- All art is original: SVG drawn in `scripts/make-art.mjs`, rendered to transparent webp (`npm run art` needs Playwright + Python Pillow).

```bash
cd spider-solitaire
npm install
npm run dev      # local dev
npm test         # rule unit tests (vitest)
npm run build    # static output in dist/ (relative base, works on GitHub Pages / Vercel)
```
