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
    build: {
      outDir: Config.modulesDirRelativePath + "/secretsanta2024"
    },
    assetsInclude: [
      '/assets/**/*.js',
      '/assets/models/*'
    ],
  },
});