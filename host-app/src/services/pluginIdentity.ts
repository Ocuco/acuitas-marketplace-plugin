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

// Which plugin this shell stands in for. Acuitas passes the Marketplace plugin id as the web
// component's `id` prop and mints every PST for that same id, so the shell uses one plugin id for
// all of its placements rather than a per-placement name of its own — a widget that reads `this.id`
// then sees in development exactly what it sees in Acuitas.

/** Used when neither `VITE_PLUGIN_ID` nor `VITE_PST` says which plugin this is. */
const FALLBACK_PLUGIN_ID = 'your-plugin-id';

// The PST names the plugin it was issued for; the session claim must be made for that plugin.
export function pluginIdFromPst(pst: string): string {
  const payload = pst.split('.')[1];
  if (!payload) throw new Error('VITE_PST is not a JWT');

  const json = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
  const pluginId = (JSON.parse(json) as { plugin_id?: string }).plugin_id;
  if (!pluginId) throw new Error('VITE_PST has no plugin_id claim');

  return pluginId;
}

function resolvePluginId(): string {
  const configured = (import.meta.env.VITE_PLUGIN_ID || '').trim();
  if (configured) return configured;

  try {
    return pluginIdFromPst(import.meta.env.VITE_PST || '');
  } catch {
    console.warn(
      `No VITE_PLUGIN_ID, and VITE_PST carries no plugin_id: plugins run as "${FALLBACK_PLUGIN_ID}". ` +
        "Use Get PST on your plugin's page on the Marketplace portal, or set VITE_PLUGIN_ID.",
    );
    return FALLBACK_PLUGIN_ID;
  }
}

/** The plugin id every placement renders under, as Acuitas would pass it. */
export const PLUGIN_ID = resolvePluginId();
