import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import tsconfigPaths from 'vite-tsconfig-paths';

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
