import { build } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function buildPreload() {
  await build({
    configFile: false,
    build: {
      outDir: 'dist/preload',
      lib: {
        entry: path.resolve(__dirname, '../src/preload/preload.ts'),
        formats: ['cjs'],
        fileName: () => 'preload.cjs',
      },
      rollupOptions: {
        external: ['electron'],
      },
      emptyOutDir: true,
    },
  });
}

buildPreload().catch(console.error);
