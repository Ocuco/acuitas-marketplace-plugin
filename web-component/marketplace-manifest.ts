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

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { Plugin, ResolvedConfig } from 'vite';

/**
 * One web component the Acuitas host can load: the federation module it asks for, the source
 * file that registers the custom element, and that element's tag.
 */
export interface MarketplaceComponent {
  /** Source file exposed under the module key, e.g. './src/index.ts'. */
  source: string;
  /** The tag the source registers with @customElement(...) / customElements.define(...). */
  tag: string;
  /**
   * Other custom elements the component registers for its own use, such as the ones it renders inside
   * its shadow root. The host only ever loads `tag`; these are declared so the Marketplace security
   * scan (MKT011) and reviewers know about them. Use a prefix of your own, as for `tag`.
   */
  elements?: string[];
}

export type MarketplaceComponents = Record<string, MarketplaceComponent>;

/**
 * Turns one `connect` entry into the origin the Marketplace compares requests against, or explains
 * why it can't. An origin is scheme, host and port only: `https://api.example.com`, not a URL with a
 * path. Plain http is accepted for localhost only, for development builds.
 */
export function originOf(entry: string): { origin?: string; error?: string } {
  let url: URL;
  try {
    url = new URL(entry);
  } catch {
    return { error: `'${entry}' is not an absolute URL. Write it as https://host[:port].` };
  }
  const isLocal = ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname);
  if (url.protocol !== 'https:' && !(url.protocol === 'http:' && isLocal)) {
    return { error: `'${entry}' must use https (http is only allowed for localhost).` };
  }
  if ((url.pathname !== '/' && url.pathname !== '') || url.search || url.hash || url.username || url.password) {
    return { error: `'${entry}' must be an origin only (scheme, host and port), with no path, query or credentials.` };
  }
  return { origin: url.origin };
}

/** The `exposes` map for @originjs/vite-plugin-federation. */
export const exposesOf = (components: MarketplaceComponents): Record<string, string> =>
  Object.fromEntries(Object.entries(components).map(([module, { source }]) => [module, source]));

/**
 * Writes `marketplace.json` next to the build output. The Marketplace portal reads it from the
 * uploaded zip to fill in the entry file, module export, component name and version, so a partner
 * doesn't have to type them:
 *
 *   { "entry": "assets/remoteEntry.js", "version": "1.0.0",
 *     "components": { "./Component": { "tag": "imaging-widget", "elements": ["imaging-viewer"] } },
 *     "connect": ["https://api.partner.example"] }
 *
 * `connect` lists every origin your components send requests to with a fixed address in the code
 * (your backend, an analytics service). The Marketplace security scan reports a request to any
 * other fixed origin as an error that blocks approval. Addresses that come from your plugin's
 * settings (such as `settings.apiUrl`) don't need listing: the scan reads those from the plugin.
 *
 * `elements` lists, per component, the other custom elements it registers for its own use. The
 * security scan warns about any custom element the manifest declares neither as a `tag` nor in
 * `elements`.
 *
 * It also fails the build when a tag listed here does not appear in the bundled code, which is
 * the mistake that otherwise only shows up as an empty area inside the host, or when a `connect`
 * entry is not a plain https origin.
 */
export function marketplaceManifest(options: {
  components: MarketplaceComponents;
  remoteEntry?: string;
  /** Origins your code calls with a fixed address, e.g. ['https://api.partner.example']. */
  connect?: string[];
}): Plugin {
  const remoteEntry = options.remoteEntry ?? 'remoteEntry.js';
  let config: ResolvedConfig;

  return {
    name: 'acuitas-marketplace-manifest',
    apply: 'build',
    // After the federation plugin has added the remote entry to the bundle.
    enforce: 'post',
    configResolved(resolved) {
      config = resolved;
    },
    generateBundle(_, bundle) {
      const files = Object.keys(bundle);
      const entry = files.find(f => f === remoteEntry || f.endsWith(`/${remoteEntry}`));
      if (!entry) {
        this.error(`marketplace.json: ${remoteEntry} is not in the build output. Is the federation filename different?`);
      }

      const code = Object.values(bundle)
        .map(output => (output.type === 'chunk' ? output.code : ''))
        .join('\n');
      for (const { tag, elements = [] } of Object.values(options.components)) {
        for (const name of [tag, ...elements]) {
          if (![`"${name}"`, `'${name}'`, `\`${name}\``].some(quoted => code.includes(quoted))) {
            this.error(
              `marketplace.json: no custom element named '${name}' is registered in the build. ` +
                'Make the tags in vite.config.ts match the @customElement(...) in your source.',
            );
          }
        }
      }

      const connect: string[] = [];
      for (const entry of options.connect ?? []) {
        const { origin, error } = originOf(entry);
        if (error) {
          this.error(`marketplace.json: connect ${error}`);
        }
        if (origin && !connect.includes(origin)) {
          connect.push(origin);
        }
      }

      const { version } = JSON.parse(readFileSync(join(config.root, 'package.json'), 'utf8')) as { version?: string };
      const manifest = {
        entry,
        version,
        components: Object.fromEntries(
          Object.entries(options.components).map(([module, { tag, elements }]) => [
            module,
            elements?.length ? { tag, elements } : { tag },
          ]),
        ),
        connect,
      };
      this.emitFile({ type: 'asset', fileName: 'marketplace.json', source: `${JSON.stringify(manifest, null, 2)}\n` });
    },
  };
}
