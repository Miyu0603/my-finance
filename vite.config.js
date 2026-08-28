import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  base: '/my-finance/',
  test: {
    // jsdom for the component tests; the lib tests are environment-agnostic and
    // happen to gain a real localStorage from it.
    environment: 'jsdom',
    restoreMocks: true,
  },
})
