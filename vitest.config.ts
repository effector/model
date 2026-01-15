import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { playwright } from '@vitest/browser-playwright';
import path from 'path';

export default defineConfig({
  plugins: [react() as any],
  resolve: {
    alias: {
      '@effector-model/core-experimental': path.resolve(
        __dirname,
        './packages/core-experimental/src/index.ts',
      ),
    },
  },
  test: {
    browser: {
      enabled: true,
      provider: playwright(),
      instances: [{ browser: 'chromium' }],
      headless: true,
    },
    globals: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['apps/models-research/src/tree/**'],
    },
  },
  optimizeDeps: {
    include: [
      'vitest-browser-react',
      'effector',
      'effector-react',
      'vitest/browser',
    ],
  },
});
