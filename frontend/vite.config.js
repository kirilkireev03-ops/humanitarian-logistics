import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  // Якщо Spring у тебе на іншому порту — у frontend/.env.local:
  // VITE_DEV_API_PROXY=http://127.0.0.1:8081
  const apiProxyTarget =
    env.VITE_DEV_API_PROXY?.trim() || 'http://127.0.0.1:8080'

  return {
    plugins: [react()],
    server: {
      host: true,
      port: 4185,
      strictPort: true,
      proxy: {
        '/api': {
          target: apiProxyTarget,
          changeOrigin: true
        }
      }
    },
    preview: {
      host: true,
      port: 4185,
      strictPort: true
    }
  }
})
