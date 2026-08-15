import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  const configuredApiBaseUrl = env.VITE_API_URL || env.VITE_API_BASE_URL || ''
  const proxyTarget = /^https?:\/\//i.test(configuredApiBaseUrl)
    ? configuredApiBaseUrl.replace(/\/api\/?$/, '')
    : 'http://localhost:5000'

  return {
    plugins: [react()],
    server: {
      host: '0.0.0.0',
      port: Number(env.VITE_PORT || 5173),
      proxy: {
        '/api': {
          target: proxyTarget,
          changeOrigin: true,
          secure: false,
        },
        '/static': {
          target: proxyTarget,
          changeOrigin: true,
          secure: false,
        },
      },
    },
    preview: {
      host: '0.0.0.0',
      port: Number(env.VITE_PORT || 4173),
    },
    build: {
      sourcemap: false,
      chunkSizeWarningLimit: 1000,
    },
  }
})
