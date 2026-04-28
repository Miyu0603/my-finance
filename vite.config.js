import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
// 部署到 GitHub Pages 時，將 base 改為你的 repo 名稱，例如: base: '/my-finance-app/'
export default defineConfig({
  plugins: [react(), tailwindcss()],
  base: './',
})
