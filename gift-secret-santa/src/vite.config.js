import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        main: './src/main.ts',
      },
      output: {
        entryFileNames: `[name].js`,
      },
    },
    assetsInclude: ['/assets/**/*.js'],
  },
});