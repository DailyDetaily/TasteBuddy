import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';

const projectRoot = path.resolve(__dirname, '../..');
const originalTasteBuddySupabasePath = path.resolve(projectRoot, 'src/lib/tasteBuddySupabase.ts');
const mockedTasteBuddySupabasePath = path.resolve(__dirname, './mockedTasteBuddySupabase.ts');

export default defineConfig({
  root: __dirname,
  envDir: projectRoot,
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: [
      {
        find: originalTasteBuddySupabasePath,
        replacement: mockedTasteBuddySupabasePath,
      },
      {
        find: '@/',
        replacement: `${path.resolve(projectRoot, 'src')}/`,
      },
      {
        find: '@',
        replacement: path.resolve(projectRoot, 'src'),
      },
    ],
  },
  server: {
    host: '127.0.0.1',
    open: false,
    port: 3000,
  },
});
