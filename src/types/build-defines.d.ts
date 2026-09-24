// Compile-time constants substituted by esbuild `define` (build/utils.ts) and vitest `define`
// (vitest.config.ts). Not provided by the game runtime.

/** True in the test build: enables mock ports and the globalThis.__z80 test hook */
declare const TEST: boolean;
