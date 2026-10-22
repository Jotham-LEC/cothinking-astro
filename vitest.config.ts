import { defineConfig } from 'vitest/config';

export default defineConfig({
  // The content checks parse every page's Markdown: slow on a busy machine.
  test: { include: ['packages/*/tests/**/*.test.ts', 'sites/*/tests/**/*.test.ts'], testTimeout: 20_000 },
});
