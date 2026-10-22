import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: { alias: { '@garden': fileURLToPath(new URL('./garden', import.meta.url)) } },
  test: { include: ['tests/**/*.test.ts'] },
});
