import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    allowedHosts: ['a1db-178-175-106-158.ngrok-free.app'] // Replace with your Ngrok URL
  }
})
