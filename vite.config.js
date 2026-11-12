import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite' // Tambahkan baris ini

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(), // Tambahkan baris ini
  ],
  build: {
    rolldownOptions: {
      output: {
        codeSplitting: {
          groups: [
            {
              name: 'vendor-react',
              test: /node_modules\/(react|react-dom|react-router|react-router-dom|scheduler)\//,
              priority: 30,
            },
            {
              name: 'vendor-icons',
              test: /node_modules\/lucide-react\//,
              priority: 20,
            },
            {
              name: 'vendor-charts',
              test: /node_modules\/(recharts|d3-[^/]+|victory-vendor)\//,
              priority: 15,
            },
          ],
        },
      },
    },
  },
})