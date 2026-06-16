import type { AppScreen } from './plugin-placements'

/** Maps each host screen to its URL path. */
export const SCREEN_ROUTES: Record<AppScreen, string> = {
  HOME: '/home',
  MEDICAL_IMAGES: '/medical-images',
  PATIENT: '/patient',
}

/** Screen shown by default (and the redirect target for unknown paths). */
export const DEFAULT_ROUTE = SCREEN_ROUTES.HOME

/** Route pattern for a partner module launched full-page from a home tile. */
export const PARTNER_MODULE_ROUTE = '/home/plugin/:pluginId'

/** Build the full-page partner module path for a given plugin id. */
export const buildPartnerModulePath = (pluginId: string): string =>
  `/home/plugin/${pluginId}`
