import { execSync } from 'node:child_process'
import path from 'path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

const gitCommit = (() => {
  try {
    return execSync('git rev-parse --short HEAD', { encoding: 'utf8' }).trim()
  } catch {
    return 'dev'
  }
})()

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    host: "0.0.0.0",
    port: 5173,
    proxy: {
      '/api/': {
        changeOrigin: true,
        target: 'http://localhost:8080',
      },
    },
  },
  define: {
    __APP_GIT_COMMIT__: JSON.stringify(gitCommit),
    global: 'globalThis',
  },
})
