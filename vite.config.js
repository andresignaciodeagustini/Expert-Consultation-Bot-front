
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: mode === 'development' 
          ? 'http://127.0.0.1:8080'
          : 'https://expert-consultation-bot-back-ab9540834110.herokuapp.com',
        changeOrigin: true,
        secure: false
      }
    }
  }
}))