import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// VITE_BASE lets the game be served from a sub-path (e.g. VITE_BASE=/corrupted/ npm run build).
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '')
  return {
    base: env.VITE_BASE || '/',
    plugins: [react(), tailwindcss()],
    build: {
      // The 3D engine alone is ~1.1 MB minified (about 315 KB gzipped), so the default 500 kB warning is
      // noise here. The limit still flags real growth. Levels and postprocessing are lazy chunks;
      // `npm run check:build` fails if the entry ever loads them eagerly.
      chunkSizeWarningLimit: 1300,
    },
    test: {
      environment: 'node',
      include: ['tests/**/*.test.js'],
    },
  }
})
