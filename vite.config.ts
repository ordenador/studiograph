import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

const apiPort = Number(process.env.HAPAX_API_PORT || 8796)
if (!Number.isInteger(apiPort) || apiPort < 1 || apiPort > 65535) throw new Error('Invalid HAPAX_API_PORT')
const proxy = { '/api/hapax': { target: `http://127.0.0.1:${apiPort}`, changeOrigin: true } }

export default defineConfig({
  plugins: [react(), tailwindcss()],
  // Filesystem edits in the desktop workspace may not emit native watch events.
  server: { proxy, watch: { usePolling: process.env.HAPAX_POLLING !== '0', interval: 250 } },
  preview: { proxy },
})
