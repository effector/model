import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import { defineConfig } from 'vitest/config';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  test: {
    typecheck: { ignoreSourceErrors: true },
    setupFiles: [relativePath('./src/__tests__/testsSetup.ts')],
    environment: 'happy-dom',
    include: [relativePath('./src/__tests__/**/*.test.tsx')],
  },
  plugins: [tsconfigPaths()],
});

function relativePath(path: string) {
  return resolve(dirname(fileURLToPath(import.meta.url)), path);
}
