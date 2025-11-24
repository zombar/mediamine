import { build } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function buildMain() {
  await build({
    configFile: false,
    build: {
      outDir: 'dist/main',
      lib: {
        entry: path.resolve(__dirname, '../src/main/main.ts'),
        formats: ['es'],
        fileName: () => 'main.js',
      },
      rollupOptions: {
        external: ['electron', 'path', 'url', 'fs', 'os'],
      },
      emptyOutDir: true,
      ssr: true,
      target: 'node18',
    },
  });
}

buildMain().catch(console.error);
