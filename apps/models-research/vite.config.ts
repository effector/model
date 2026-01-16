import { defineConfig } from 'vite';
// import react from '@vitejs/plugin-react';
import react from '@vitejs/plugin-react-swc';
import tsconfigPaths from 'vite-tsconfig-paths';
// import { viteSingleFile } from 'vite-plugin-singlefile';

export default defineConfig({
  esbuild: {
    loader: 'tsx',
  },
  cacheDir: '../../../node_modules/.vite/models-research',
  plugins: [tsconfigPaths(), react()],
  build: {
    outDir: '../../../dist/apps/models-research',
    rollupOptions: {
      // Future-proofing for Rolldown
    },
  },
});
