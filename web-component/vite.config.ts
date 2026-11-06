/*
 * Copyright 2026 Ocuco Ltd
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { defineConfig } from 'vite';
import federation from '@originjs/vite-plugin-federation';
import { exposesOf, marketplaceManifest, type MarketplaceComponents } from './marketplace-manifest.ts';

// Every web component the host can load from this build: the module key the host asks for, the
// source that registers it, and the custom-element tag it registers. The federation `exposes` and
// the marketplace.json the portal reads are both built from this, so they can't disagree.
const components: MarketplaceComponents = {
  './Component': { source: './src/index.ts', tag: 'imaging-widget' },
  './PatientComponent': { source: './src/patient-index.ts', tag: 'patient-widget' },
  './DashboardComponent': { source: './src/dashboard-index.ts', tag: 'dashboard-widget' },
  './CheckoutComponent': { source: './src/checkout-index.ts', tag: 'checkout-widget' },
};

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    federation({
      name: 'imagingWidget',
      filename: 'remoteEntry.js',
      exposes: exposesOf(components),
      shared: ['lit'],
    }),
    // `connect` lists every origin your code calls with a fixed address, so the Marketplace security
    // scan can tell your own backend from an undeclared one. These samples call the address in
    // `settings.apiUrl`, which the scan reads from the plugin's settings, so they declare none.
    // Example: marketplaceManifest({ components, connect: ['https://api.partner.example'] })
    marketplaceManifest({ components, connect: [] }),
  ],
  server: {
    port: 9001,
    cors: true,
  },
  preview: {
    port: 9001,
    cors: true,
  },
  build: {
    target: 'esnext',
    minify: false,
    cssCodeSplit: false,
  },
});
