import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import path from 'path';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'robots.txt', 'apple-touch-icon.png'],
      manifest: {
        name: 'Modern HRMS Application',
        short_name: 'HRMS',
        description: 'Modern Human Resource Management System',
        theme_color: '#3B82F6',
        background_color: '#ffffff',
        display: 'standalone',
        scope: '/',
        start_url: '/',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,jpg,jpeg}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/firebasestorage\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'firebase-storage-cache',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 24 * 30 // 30 days
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          }
        ]
      }
    })
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@components': path.resolve(__dirname, './src/components'),
      '@pages': path.resolve(__dirname, './src/pages'),
      '@services': path.resolve(__dirname, './src/services'),
      '@utils': path.resolve(__dirname, './src/utils'),
      '@hooks': path.resolve(__dirname, './src/hooks'),
      '@stores': path.resolve(__dirname, './src/stores'),
      '@types': path.resolve(__dirname, './src/types'),
    },
  },
  server: {
    port: 3000,
    open: true,
    host: true,
  },
  build: {
    outDir: 'dist',
    sourcemap: false, // Disable source maps for production security
    chunkSizeWarningLimit: 1000,
    minify: 'esbuild', // Use esbuild for faster minification
    target: 'es2015', // Support modern browsers
    rollupOptions: {
      output: {
        manualChunks(id) {
          // Core vendor libraries
          if (id.includes('node_modules')) {
            // React core
            if (id.includes('react') || id.includes('react-dom') || id.includes('react-router')) {
              return 'vendor-react';
            }
            
            // Firebase
            if (id.includes('firebase')) {
              return 'vendor-firebase';
            }
            
            // Material UI
            if (id.includes('@mui') || id.includes('@emotion')) {
              return 'vendor-mui';
            }
            
            // Charts
            if (id.includes('recharts') || id.includes('d3-')) {
              return 'vendor-charts';
            }
            
            // PDF generation
            if (id.includes('jspdf') || id.includes('html2canvas')) {
              return 'vendor-pdf';
            }
            
            // Maps
            if (id.includes('leaflet') || id.includes('react-leaflet')) {
              return 'vendor-maps';
            }
            
            // Excel/CSV
            if (id.includes('xlsx')) {
              return 'vendor-excel';
            }
            
            // Other utilities
            if (id.includes('date-fns') || id.includes('clsx') || id.includes('zustand')) {
              return 'vendor-utils';
            }
            
            // Animation
            if (id.includes('framer-motion')) {
              return 'vendor-animation';
            }
            
            // Icons
            if (id.includes('lucide-react')) {
              return 'vendor-icons';
            }
            
            // Remaining node_modules
            return 'vendor-misc';
          }
          
          // App modules - split by feature
          if (id.includes('src/modules/admin')) {
            return 'module-admin';
          }
          if (id.includes('src/modules/hr')) {
            return 'module-hr';
          }
          if (id.includes('src/modules/manager')) {
            return 'module-manager';
          }
          if (id.includes('src/modules/employee')) {
            return 'module-employee';
          }
          
          // Core libraries
          if (id.includes('src/lib/analytics')) {
            return 'lib-analytics';
          }
          if (id.includes('src/lib/workflows')) {
            return 'lib-workflows';
          }
          if (id.includes('src/lib/rbac')) {
            return 'lib-rbac';
          }
          if (id.includes('src/lib/security')) {
            return 'lib-security';
          }
          if (id.includes('src/lib/integrations')) {
            return 'lib-integrations';
          }
          
          // Services
          if (id.includes('src/services')) {
            return 'services';
          }
          
          // Large pages - split individually
          if (id.includes('src/pages/Attendance')) {
            return 'page-attendance';
          }
          if (id.includes('src/pages/Payroll')) {
            return 'page-payroll';
          }
          if (id.includes('src/pages/Reports')) {
            return 'page-reports';
          }
          if (id.includes('src/pages/AdvancedAnalytics')) {
            return 'page-analytics';
          }
          if (id.includes('src/pages/LiveTrackingMap')) {
            return 'page-tracking';
          }
          
          // Default: no manual chunking (let Vite decide)
          return undefined;
        },
        // Optimize chunk naming
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]'
      },
    },
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'firebase/app', 'firebase/auth', 'firebase/firestore'],
  },
});
