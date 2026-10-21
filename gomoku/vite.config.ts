import { defineConfig } from 'vite';
export default defineConfig({
  base: process.env.BASE_PATH || './',
  test: {
    include: ['tests/**/*.test.ts']
  }
} as any);
