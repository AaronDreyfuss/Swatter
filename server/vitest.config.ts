import { defineConfig } from 'vitest/config';
import dotenv from 'dotenv';

// Load test env before workers spin up so DATABASE_URL is set when Prisma client is created
dotenv.config({ path: '.env.test' });

export default defineConfig({
  test: {
    fileParallelism: false, // parallel test files cause FK violations when resetDb() calls overlap
    hookTimeout: 30000,
    testTimeout: 30000,
    environment: 'node',
    include: ['tests/**/*.test.ts'],
  },
});
