import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': { target: 'http://localhost:8080', changeOrigin: true },
      '/uploads': { target: 'http://localhost:8080', changeOrigin: true },
    },
  },
  build: {
    target: 'es2020',
    cssCodeSplit: true,
    chunkSizeWarningLimit: 500,
    rollupOptions: {
      output: {
        manualChunks(id: string) {
          if (!id.includes('node_modules')) return undefined;
          if (id.includes('react') || id.includes('react-dom') || id.includes('react-router')) return 'vendor-react';
          if (id.includes('i18next')) return 'vendor-i18n';
          if (id.includes('markdown') || id.includes('remark') || id.includes('rehype')) return 'vendor-markdown';
          if (id.includes('highlight.js')) return 'vendor-highlight';
          if (id.includes('katex')) return 'vendor-katex';
          if (id.includes('axios')) return 'vendor-utils';
          return 'vendor-other';
        },
        chunkFileNames: 'assets/js/[name].[hash].js',
        entryFileNames: 'assets/js/[name].[hash].js',
        assetFileNames: (assetInfo) => {
          const ext = assetInfo.name?.split('.').pop() || '';
          if (/png|jpe?g|svg|gif|tiff|bmp|ico/i.test(ext)) return `assets/img/[name].[hash][extname]`;
          if (/woff2?|eot|ttf|otf/i.test(ext)) return `assets/fonts/[name].[hash][extname]`;
          if (/css/i.test(ext)) return `assets/css/[name].[hash][extname]`;
          return `assets/[name].[hash][extname]`;
        },
      },
    },
    reportCompressedSize: false,
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom', 'react-helmet-async'],
  },
})
