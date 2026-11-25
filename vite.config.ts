import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';
import { defineConfig } from 'vite';

export default defineConfig(() => {
  return {
    base: '/',
    plugins: [
      react(),
      tailwindcss(),
      // Copies src/assets into dist/ so root-relative URLs like
      // "/src/assets/images/..." still resolve in production builds,
      // and strips internal AI Studio scratch files from dist/.
      {
        name: 'prepare-vercel-dist-assets',
        apply: 'build',
        transformIndexHtml(html: string) {
          const rawHost = (
            process.env.VITE_SITE_URL ||
            process.env.VERCEL_PROJECT_PRODUCTION_URL ||
            process.env.VERCEL_URL ||
            ''
          ).trim();
          if (!rawHost) return html;
          const origin = rawHost.startsWith('http') ? rawHost.replace(/\/+$/, '') : `https://${rawHost.replace(/\/+$/, '')}`;
          return html
            .replace(/content="\/og-lado\.jpg"/g, `content="${origin}/og-lado.jpg"`)
            .replace(
              '<meta property="og:type" content="website" />',
              `<meta property="og:type" content="website" />\n    <meta property="og:url" content="${origin}/" />`
            );
        },
        closeBundle(error?: Error): void {
          if (error) {
            return;
          }
          const rootDir = import.meta.dirname;
          const distDir = path.resolve(rootDir, 'dist');
          const srcAssets = path.resolve(rootDir, 'src/assets');
          const distAssets = path.resolve(distDir, 'src/assets');
          if (fs.existsSync(distDir) && fs.existsSync(srcAssets)) {
            fs.cpSync(srcAssets, distAssets, { recursive: true, force: true });
          }
          const aiStudioArtifacts = path.resolve(distDir, 'assets/aistudio');
          if (fs.existsSync(aiStudioArtifacts)) {
            fs.rmSync(aiStudioArtifacts, { recursive: true, force: true });
          }
        },
      },
    ],
    resolve: {
      alias: {
        '@': path.resolve(import.meta.dirname, '.'),
      },
    },
    optimizeDeps: {
      exclude: ['maplibre-gl'],
    },
    server: {
      // HMR can be disabled via DISABLE_HMR=true when needed.
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
