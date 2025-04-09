import { defineConfig } from 'vitest/config';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  test: {
    reporters: 'default',
    typecheck: { ignoreSourceErrors: true },
  },
  plugins: [tsconfigPaths()],
});
