import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { uplookzAuthPlugin } from './server/authMiddleware.js';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  // Populate process.env so server middleware and email services can access SMTP credentials
  Object.assign(process.env, env);

  return {
    plugins: [react(), uplookzAuthPlugin()],
    server: {
      port: 5173,
      host: true,
    },
  };
});
