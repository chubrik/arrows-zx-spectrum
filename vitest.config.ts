import { defineConfig } from 'vitest/config';

export default defineConfig({
  define: { TEST: 'true' },
  test: {
    globalSetup: ['./build/build-test.ts'],
    setupFiles: ['./test/setup.ts'],
    include: ['test/**/*.test.ts'],
  },
});
