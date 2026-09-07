import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// GitHub Pages роздає сайт з підтеки /<repo>/, тому для нього потрібен інший
// base. Локальна збірка і dev лишаються на корені.
const base = process.env.GITHUB_PAGES ? '/2026-quitcode-01-maryan/' : '/'

// https://vite.dev/config/
export default defineConfig({
  base,
  plugins: [react()],
})
