import type { PluginSection, ScreenContext } from '@acuitas/shared'

// Host screens correspond to the plugin view types
export type AppScreen = ScreenContext['view']

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
}

/**
 * Declares where a plugin renders: on which screen and in which section.
 * This is the single place that dictates plugin placement across the host.
 */
export interface PluginPlacement {
  /** Unique identifier for the plugin instance */
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
   * Home-screen only: the dashboard category the launcher tile appears in
   * (e.g. "Patient Care"). The tile opens the plugin full-page in the shell.
   */
  category?: string;

  /** Home-screen only: emoji/glyph shown on the launcher tile. */
  tileIcon?: string;
}

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

/**
 * Placement registry.
 * - The patient widget is hosted twice on the patient screen: once in the main
 *   section ("blue box") and once in the side panel.
 * - The dashboard widget is registered as a launcher tile in a home-screen
 *   category; clicking the tile opens it full-page inside the shell.
 */
export const pluginPlacements: PluginPlacement[] = [
  {
    pluginId: 'patient-widget-main',
    pluginName: 'Patient Insights',
    screen: 'PATIENT',
    section: 'MAIN',
    remote: patientRemote,
  },
  {
    pluginId: 'patient-widget-side',
    pluginName: 'Patient Quick View',
    screen: 'PATIENT',
    section: 'SIDE_PANEL',
    remote: patientRemote,
  },
  {
    pluginId: 'partner-dashboard',
    pluginName: 'Partner Insights',
    screen: 'HOME',
    section: 'MAIN',
    remote: dashboardRemote,
    category: 'Patient Care',
    tileIcon: '🧩',
  },
];

/** Returns the placements configured for a given screen. */
export const getPlacementsForScreen = (screen: AppScreen): PluginPlacement[] =>
  pluginPlacements.filter(placement => placement.screen === screen);
