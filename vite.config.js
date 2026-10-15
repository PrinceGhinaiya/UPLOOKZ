import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { uplookzAuthPlugin } from './server/authMiddleware.js';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), uplookzAuthPlugin()],
  server: {
    port: 5173,
    host: true
  }
});
