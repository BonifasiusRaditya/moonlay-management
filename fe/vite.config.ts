import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { TanStackRouterVite } from '@tanstack/router-vite-plugin';
import path from 'path';
import fs from 'fs';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const httpsEnabled = (env.VITE_HTTPS_ENABLED || 'false').toLowerCase() === 'true';

  let httpsConfig: false | { key: Buffer; cert: Buffer } = false;

  if (httpsEnabled) {
    const keyPath = env.VITE_HTTPS_KEY_PATH;
    const certPath = env.VITE_HTTPS_CERT_PATH;

    if (!keyPath || !certPath) {
      throw new Error('VITE_HTTPS_ENABLED=true requires VITE_HTTPS_KEY_PATH and VITE_HTTPS_CERT_PATH');
    }

    const resolvedKeyPath = path.isAbsolute(keyPath) ? keyPath : path.resolve(__dirname, keyPath);
    const resolvedCertPath = path.isAbsolute(certPath) ? certPath : path.resolve(__dirname, certPath);

    if (!fs.existsSync(resolvedKeyPath) || !fs.existsSync(resolvedCertPath)) {
      throw new Error(
        `Vite HTTPS certificate files not found. key: ${resolvedKeyPath}, cert: ${resolvedCertPath}`
      );
    }

    httpsConfig = {
      key: fs.readFileSync(resolvedKeyPath),
      cert: fs.readFileSync(resolvedCertPath),
    };
  }

  return {
    plugins: [
      react(),
      TanStackRouterVite(),
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    server: {
      host: env.VITE_HOST || '0.0.0.0',
      https: httpsConfig,
    },
    preview: {
      host: env.VITE_HOST || '0.0.0.0',
      https: httpsConfig,
    },
  };
});

