import { defineConfig } from 'vite';
// BASE_PATH lets Vercel serve the game under /naiwa/spider-solitaire/ (homepage rewrites there); default is relative for GitHub Pages / anywhere.
export default defineConfig({ base: process.env.BASE_PATH || './', test: { include: ['tests/**/*.test.ts'] } } as any);
