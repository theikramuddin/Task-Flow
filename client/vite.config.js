import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  preview: {
    allowedHosts: ['tasks-manager.up.railway.app'],
  },
  server: {
    proxy: {
      '/api': 'http://localhost:5000'
    }
  }
})
