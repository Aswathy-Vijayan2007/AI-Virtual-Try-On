import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  server: {
    allowedHosts: true,
    host: '0.0.0.0',
    port: 5173,
    cors: false,
    proxy: {
      '/api/groq': {
        target: 'https://api.groq.com/openai/v1',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/groq/, ''),
        secure: false,
        configure: (proxy, _options) => {
          proxy.on('error', (err, _req, _res) => {
            console.log('proxy error', err);
          });
          proxy.on('proxyReq', (proxyReq, req, _res) => {
            console.log('Sending Request to the Target:', req.method, req.url);
          });
          proxy.on('proxyRes', (proxyRes, req, _res) => {
            console.log('Received Response from the Target:', proxyRes.statusCode, req.url);
          });
        },
      }
    },
    hmr: {
      port: 5173,
      host: '0.0.0.0'
    },
    watch: {
      usePolling: true,
      interval: 1000
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  },
  optimizeDeps: {
    force: true,
    include: [
      'react',
      'react-dom',
      '@tensorflow/tfjs',
      '@tensorflow-models/pose-detection'
    ]
  },
  build: {
    target: 'esnext',
    rollupOptions: {
      output: {
        manualChunks: {
          tensorflow: ['@tensorflow/tfjs', '@tensorflow-models/pose-detection'],
          react: ['react', 'react-dom'],
          ui: ['lucide-react', 'clsx', 'tailwind-merge']
        }
      }
    }
  },
  css: {
    postcss: './postcss.config.js'
  }
})