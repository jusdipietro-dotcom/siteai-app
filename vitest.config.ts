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
 * `environment: 'node'` because every module under test is pure logic — no DOM,
 * no React. Prisma is never reached: the functions that touch it take an
 * injectable delegate, and the tests pass fakes.
 */
export default defineConfig({
  resolve: {
    // Mirrors the `@/*` -> `./*` mapping in tsconfig.json.
    alias: {
      '@': fileURLToPath(new URL('.', import.meta.url)),
    },
  },
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    // Deterministic by construction: no test reads the wall clock, every
    // time-dependent function under test accepts an injected `now`.
    restoreMocks: true,
    unstubEnvs: true,
  },
})
