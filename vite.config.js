import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    allowedHosts: ['singular-catfish-deciding.ngrok-free.app'] // Replace with your Ngrok URL
  }
})
