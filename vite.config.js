import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { promises as fs } from 'fs';
import path from 'path';
import zlib from 'zlib';

import { verifyUtrViaGmail } from './server/verifyUpi.js';

// High-performance native build compression plugin (Gzip Level 9 + Brotli Quality 11)
function nativeCompressionPlugin() {
  return {
    name: 'lancebuddy-native-compression',
    apply: 'build',
    async closeBundle() {
      const distDir = path.resolve(__dirname, 'dist');
      let count = 0;
      let totalOriginalBytes = 0;
      let totalCompressedBytes = 0;

      async function processDirectory(dir) {
        try {
          const entries = await fs.readdir(dir, { withFileTypes: true });
          for (const entry of entries) {
            const fullPath = path.join(dir, entry.name);
            if (entry.isDirectory()) {
              await processDirectory(fullPath);
            } else if (
              /\.(js|css|html|svg|json)$/i.test(entry.name) &&
              !entry.name.endsWith('.gz') &&
              !entry.name.endsWith('.br')
            ) {
              const fileBuffer = await fs.readFile(fullPath);
              totalOriginalBytes += fileBuffer.length;

              // 1. Generate Gzip (.gz)
              const gzipBuffer = zlib.gzipSync(fileBuffer, { level: 9 });
              await fs.writeFile(`${fullPath}.gz`, gzipBuffer);

              // 2. Generate Brotli (.br)
              const brotliBuffer = zlib.brotliCompressSync(fileBuffer, {
                params: {
                  [zlib.constants.BROTLI_PARAM_QUALITY]: 11,
                },
              });
              await fs.writeFile(`${fullPath}.br`, brotliBuffer);

              totalCompressedBytes += brotliBuffer.length;
              count++;
            }
          }
        } catch (err) {
          console.warn('Compression step error:', err.message);
        }
      }

      await processDirectory(distDir);
      const savedPercent = totalOriginalBytes > 0 
        ? (((totalOriginalBytes - totalCompressedBytes) / totalOriginalBytes) * 100).toFixed(1) 
        : 0;
      console.log(`\n🚀 [LanceBuddy Compressor] Successfully generated .gz & .br for ${count} assets.`);
      console.log(`📦 [Compression Ratio] Reduced asset payload by ${savedPercent}% (Original: ${(totalOriginalBytes / 1024).toFixed(1)} KB ➔ Brotli: ${(totalCompressedBytes / 1024).toFixed(1)} KB).\n`);
    }
  };
}

// Automatic IMAP verification middleware for FamPay / UPI payment receipts
function upiVerificationPlugin() {
  return {
    name: 'lancebuddy-upi-verification',
    configureServer(server) {
      server.middlewares.use('/api/verify-upi', (req, res) => {
        if (req.method !== 'POST') {
          res.statusCode = 405;
          return res.end(JSON.stringify({ error: 'Method not allowed' }));
        }

        let body = '';
        req.on('data', chunk => { body += chunk; });
        req.on('end', async () => {
          try {
            const { utr } = JSON.parse(body || '{}');
            console.log(`🔍 [UPI Verifier] Checking incoming payment for UTR: ${utr}...`);
            const result = await verifyUtrViaGmail(utr);
            console.log(`✅ [UPI Verifier] Result for ${utr}:`, result);
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify(result));
          } catch (err) {
            console.error('❌ [UPI Verifier Error]:', err);
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ verified: false, reason: err.message }));
          }
        });
      });
    }
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  if (env.UPI_VERIFY_EMAIL) process.env.UPI_VERIFY_EMAIL = env.UPI_VERIFY_EMAIL;
  if (env.UPI_VERIFY_APP_PASS) process.env.UPI_VERIFY_APP_PASS = env.UPI_VERIFY_APP_PASS;

  return {
    base: './',
    plugins: [react(), nativeCompressionPlugin(), upiVerificationPlugin()],
    server: {
      port: 5173,
      host: true,
      open: false,
      // Allow Cloudflare Tunnel URLs
      allowedHosts: true
    },
  build: {
    target: 'es2020',
    minify: 'esbuild',
    cssCodeSplit: true,
    assetsInlineLimit: 4096,
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        // Clean chunk splitting without circular dependencies
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('firebase')) {
              if (id.includes('firestore')) {
                return 'vendor-firebase-firestore';
              }
              return 'vendor-firebase-core';
            }
            if (id.includes('framer-motion')) {
              return 'vendor-motion';
            }
            if (id.includes('react') || id.includes('react-dom') || id.includes('react-router')) {
              return 'vendor-framework';
            }
            return 'vendor-misc';
          }
        }
      }
    }
  },
    esbuild: {
      legalComments: 'none',
      drop: process.env.NODE_ENV === 'production' ? ['console', 'debugger'] : []
    }
  };
});
