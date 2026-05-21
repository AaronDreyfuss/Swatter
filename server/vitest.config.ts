import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    fileParallelism: false, // parallel test files cause FK violations when resetDb() calls overlap
    hookTimeout: 30000,
    testTimeout: 30000,
    include: ['tests/**/*.test.ts'],
  },
});
