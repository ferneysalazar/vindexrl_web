import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      '/entity-type': { target: 'http://localhost:3000', changeOrigin: true, rewrite: path => '/api' + path },
      '/norm-type':   { target: 'http://localhost:3000', changeOrigin: true, rewrite: path => '/api' + path },
      '/entity':      { target: 'http://localhost:3000', changeOrigin: true, rewrite: path => '/api' + path },
      '/theme':       { target: 'http://localhost:3000', changeOrigin: true, rewrite: path => '/api' + path },
      '/subtheme':    { target: 'http://localhost:3000', changeOrigin: true, rewrite: path => '/api' + path },
      '/html-files':  { target: 'http://localhost:3000', changeOrigin: true, rewrite: path => '/api' + path },
    },
  },
})
