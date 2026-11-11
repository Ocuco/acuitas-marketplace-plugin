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

import type { AppScreen } from './plugin-placements';

/** Maps each host screen to its URL path. */
export const SCREEN_ROUTES: Record<AppScreen, string> = {
  HOME: '/home',
  MEDICAL_IMAGES: '/medical-images',
  PATIENT: '/patient',
  CHECKOUT: '/checkout',
};

/** Screen shown by default (and the redirect target for unknown paths). */
export const DEFAULT_ROUTE = SCREEN_ROUTES.HOME;

/** Route pattern for a partner module launched full-page from a home tile. */
export const PARTNER_MODULE_ROUTE = '/home/plugin/:placementId';

/** Build the full-page partner module path for a given placement. */
export const buildPartnerModulePath = (placementId: string): string => `/home/plugin/${placementId}`;
