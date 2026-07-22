import { defineConfig } from 'vitest/config'
import { fileURLToPath } from 'node:url'

/**
 * Test runner config.
 *
 * Deliberately NOT wired into the Docker build or the deploy path: the
 * Dockerfile runs `npx next build` and nothing else, so the image is produced
 * exactly as fast as before. `npm test` is the single command a future CI would
 * run.
 *
 * `environment: 'node'` still holds even though React components are now under
 * test: the section snapshot renders through `react-dom/server`, which needs no
 * DOM. Nothing here mounts, so jsdom would be dead weight. Prisma is never
 * reached: the functions that touch it take an injectable delegate, and the
 * tests pass fakes.
 *
 * `esbuild.jsx: 'automatic'` is required because tsconfig.json sets
 * `"jsx": "preserve"` — Next.js compiles JSX itself, so esbuild would otherwise
 * hand un-transformed JSX to the runtime and every `.tsx` test would fail to
 * parse.
 */
export default defineConfig({
  resolve: {
    // Mirrors the `@/*` -> `./*` mapping in tsconfig.json.
    alias: {
      '@': fileURLToPath(new URL('.', import.meta.url)),
    },
  },
  esbuild: {
    jsx: 'automatic',
  },
  test: {
    environment: 'node',
    include: ['tests/**/*.test.{ts,tsx}'],
    // Deterministic by construction: no test reads the wall clock, every
    // time-dependent function under test accepts an injected `now`.
    restoreMocks: true,
    unstubEnvs: true,
  },
})
