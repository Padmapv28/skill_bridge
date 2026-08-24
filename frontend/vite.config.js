import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  base: '/skill_bridge/',
  plugins: [react()],
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      'framer-motion',
      'three',
      '@react-three/fiber',
      'lucide-react',
      'axios',
      'canvas-confetti'
    ]
  },
  server: {
    port: 5173,
    host: true
  }
});