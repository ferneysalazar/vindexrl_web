import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      '/html-files': { target: 'http://localhost:3000', changeOrigin: true, rewrite: path => '/api' + path },
    },
  },
})
