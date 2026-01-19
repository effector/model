import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import { defineConfig } from 'vitest/config';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  test: {
    reporters: 'default',
    typecheck: { ignoreSourceErrors: true },
    include: [relativePath('./src/__tests__/**/*.test.ts')],
  },
  plugins: [tsconfigPaths()],
});

function relativePath(path: string) {
  return resolve(dirname(fileURLToPath(import.meta.url)), path);
}
