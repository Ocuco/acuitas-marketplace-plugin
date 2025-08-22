import { defineConfig } from 'vite'
import federation from '@originjs/vite-plugin-federation'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    federation({
      name: 'sampleWidget',
      filename: 'remoteEntry.js',
      exposes: {
        './Component': './src/index.ts',
      },
      shared: ['lit']
    })
  ],
  server: {
    port: 9001,
    cors: true
  },
  preview: {
    port: 9001,
    cors: true
  },
  build: {
    target: 'esnext',
    minify: false,
    cssCodeSplit: false
  }
})
