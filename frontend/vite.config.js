import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/storage': { target: 'http://localhost:8218', changeOrigin: false },
      '/api': {
        target: 'http://localhost:8218',
        changeOrigin: false
      }
    }
  }
})

