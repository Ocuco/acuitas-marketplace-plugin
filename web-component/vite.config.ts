import { defineConfig } from 'vite'
import federation from '@originjs/vite-plugin-federation'
import { exposesOf, marketplaceManifest, type MarketplaceComponents } from './marketplace-manifest'

// Every web component the host can load from this build: the module key the host asks for, the
// source that registers it, and the custom-element tag it registers. The federation `exposes` and
// the marketplace.json the portal reads are both built from this, so they can't disagree.
const components: MarketplaceComponents = {
  './Component': { source: './src/index.ts', tag: 'imaging-widget' },
  './PatientComponent': { source: './src/patient-index.ts', tag: 'patient-widget' },
  './DashboardComponent': { source: './src/dashboard-index.ts', tag: 'dashboard-widget' },
  './CheckoutComponent': { source: './src/checkout-index.ts', tag: 'checkout-widget' },
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    federation({
      name: 'imagingWidget',
      filename: 'remoteEntry.js',
      exposes: exposesOf(components),
      shared: ['lit']
    }),
    marketplaceManifest({ components })
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
