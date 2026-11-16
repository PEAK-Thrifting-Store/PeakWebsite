import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  base: '/',
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    proxy: {
      // In full-stack local dev (npm run dev:full / vercel dev), api is on :3000
      // For pure frontend dev (npm run dev), API calls will fail gracefully
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          admin: [
            './src/pages/admin/AdminApp',
            './src/pages/admin/AdminLogin',
            './src/pages/admin/AdminRails',
            './src/pages/admin/AdminPosts',
            './src/pages/admin/AdminMessages',
          ],
        },
      },
    },
  },
})
