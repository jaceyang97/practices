import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { artworksManifestPlugin } from './vite-plugin-artworks.js'

export default defineConfig({
  plugins: [react(), artworksManifestPlugin()],
  server: {
    port: 3000,
    fs: {
      // Allow serving files from project root
      allow: ['..'],
    },
  },
})


