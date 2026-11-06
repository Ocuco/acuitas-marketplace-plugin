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

import type { PluginSection, PluginSettings, ScreenContext } from '@acuitas/shared';
import { PLUGIN_ID } from '../services/pluginIdentity';

// Host screens correspond to the plugin view types
export type AppScreen = ScreenContext['view'];

/**
 * Configuration of a federated remote module.
 */
export interface RemoteConfig {
  /** URL to the remote module */
  url: string;

  /** Name of the remote container */
  name: string;

  /** Module path to load from the container */
  module: string;

  /** Type of component */
  type: 'react' | 'webcomponent';

  /**
   * Custom element tag the exposed module registers (e.g. 'snappit-widget'). Defaults to the
   * sample widget's tag for that screen, so set it when you host your own component.
   */
  elementTag?: string;
}

/**
 * Declares where a plugin renders: on which screen and in which section.
 * This is the single place that dictates plugin placement across the host.
 */
export interface PluginPlacement {
  /**
   * Unique key for this entry in the registry. It names a place the plugin renders, not the plugin
   * — the host uses it for React keys and in the partner-module URL, and never passes it to the
   * plugin.
   */
  placementId: string;

  /**
   * The Marketplace plugin id. Acuitas passes it to the web component as its `id` property and
   * mints every PST for it, so all placements share one value (`VITE_PLUGIN_ID`, or the `plugin_id`
   * claim of `VITE_PST`) — see services/pluginIdentity.ts.
   */
  pluginId: string;

  /** Human-readable plugin name */
  pluginName: string;

  /** Screen the plugin renders on */
  screen: AppScreen;

  /** Section of the screen the plugin renders in */
  section: PluginSection;

  /** Federation configuration for the remote */
  remote: RemoteConfig;

  /**
   * The plugin settings Ocuco configured for the plugin on the Marketplace portal. Partners cannot
   * edit them there, so ask the Marketplace team for a new one; here you stand in for that by
   * adding it to this entry. Acuitas adds `plugin-id` and `supported-contexts` itself, as
   * buildPluginSettings does below.
   */
  settings?: PluginSettings;

  /**
   * Home-screen only: the dashboard category the launcher tile appears in
   * (e.g. "Patient Care"). The tile opens the plugin full-page in the shell.
   */
  category?: string;

  /** Home-screen only: emoji/glyph shown on the launcher tile. */
  tileIcon?: string;
}

const imagingRemote: RemoteConfig = {
  url: 'http://localhost:9001/assets/remoteEntry.js',
  name: 'imagingWidget',
  module: './Component',
  type: 'webcomponent',
  elementTag: 'imaging-widget',
};

const patientRemote: RemoteConfig = {
  url: 'http://localhost:9001/assets/remoteEntry.js',
  name: 'imagingWidget',
  module: './PatientComponent',
  type: 'webcomponent',
};

const dashboardRemote: RemoteConfig = {
  url: 'http://localhost:9001/assets/remoteEntry.js',
  name: 'imagingWidget',
  module: './DashboardComponent',
  type: 'webcomponent',
};

const checkoutRemote: RemoteConfig = {
  url: 'http://localhost:9001/assets/remoteEntry.js',
  name: 'imagingWidget',
  module: './CheckoutComponent',
  type: 'webcomponent',
};

/**
 * Placement registry.
 * - The imaging widget renders in the Medical Images side panel.
 * - The patient widget is hosted twice on the patient screen: once in the main
 *   section ("blue box") and once in the side panel.
 * - The dashboard widget is registered as a launcher tile in a home-screen
 *   category; clicking the tile opens it full-page inside the shell.
 */
export const pluginPlacements: PluginPlacement[] = [
  {
    placementId: 'medical-imaging-widget-001',
    pluginId: PLUGIN_ID,
    pluginName: 'Medical Image Analysis Widget',
    screen: 'MEDICAL_IMAGES',
    section: 'SIDE_PANEL',
    remote: imagingRemote,
    settings: {
      'analysis-endpoint': 'https://api.example.com/v1/imaging/analyze',
      'api-key': '<api key>',
    },
  },
  {
    placementId: 'patient-widget-main',
    pluginId: PLUGIN_ID,
    pluginName: 'Patient Insights',
    screen: 'PATIENT',
    section: 'MAIN',
    remote: patientRemote,
    settings: {
      'api-key': '<api key>',
    },
  },
  {
    placementId: 'patient-widget-side',
    pluginId: PLUGIN_ID,
    pluginName: 'Patient Quick View',
    screen: 'PATIENT',
    section: 'SIDE_PANEL',
    remote: patientRemote,
    settings: {
      'api-key': '<api key>',
    },
  },
  {
    placementId: 'partner-dashboard',
    pluginId: PLUGIN_ID,
    pluginName: 'Partner Insights',
    screen: 'HOME',
    section: 'MAIN',
    remote: dashboardRemote,
    settings: {
      'api-key': '<api key>',
    },
    category: 'Patient Care',
    tileIcon: '🧩',
  },
  {
    placementId: 'checkout-widget-cart',
    pluginId: PLUGIN_ID,
    pluginName: 'Product protection available',
    screen: 'CHECKOUT',
    section: 'MAIN',
    remote: checkoutRemote,
    settings: {
      'api-key': '<api key>',
      // Optional A3 tax type the partner line's VAT is recorded against.
      taxTypeId: import.meta.env.VITE_CHECKOUT_TAX_TYPE_ID || '',
    },
  },
];

/** The context type Acuitas reports to a plugin for each screen; a home tile declares none. */
const SCREEN_CONTEXTS: Record<AppScreen, string> = {
  HOME: '',
  MEDICAL_IMAGES: 'MEDICAL_IMAGES',
  PATIENT: 'PATIENT_CONTEXT',
  CHECKOUT: 'SALE_CONTEXT',
};

/**
 * The settings dictionary a plugin receives. Acuitas builds it from the settings Ocuco configured
 * for the plugin and always adds `plugin-id` and `supported-contexts` of its own, so the shell does
 * the same. `extra` carries the values a screen only knows at runtime.
 */
export const buildPluginSettings = (placement: PluginPlacement, extra: PluginSettings = {}): PluginSettings => ({
  'plugin-id': placement.pluginId,
  'supported-contexts': SCREEN_CONTEXTS[placement.screen],
  ...placement.settings,
  ...extra,
});

/** Returns the placements configured for a given screen. */
export const getPlacementsForScreen = (screen: AppScreen): PluginPlacement[] =>
  pluginPlacements.filter(placement => placement.screen === screen);
