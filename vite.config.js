import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  base: '/dj-organizer/', // GitHub Pages の公開URLに合わせる
  plugins: [react()],
});
