import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tsconfigPaths from 'vite-tsconfig-paths';
import { viteSingleFile } from 'vite-plugin-singlefile';
// import { babel } from '@rollup/plugin-babel';

export default defineConfig({
  cacheDir: '../../../node_modules/.vite/fast-food',
  plugins: [
    tsconfigPaths(),
    viteSingleFile({ removeViteModuleLoader: true }),
    // babel({ extensions: ['.ts', '.tsx'], babelHelpers: 'bundled' }),
    react({
      babel: {
        plugins: [
          ['effector/babel-plugin', { factories: ['@withease/factories'] }],
        ],
      },
    }),
  ],
  build: { outDir: '../../../dist/apps/fast-food' },
});
