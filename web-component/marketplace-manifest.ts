import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import type { Plugin, ResolvedConfig } from 'vite'

/**
 * One web component the Acuitas host can load: the federation module it asks for, the source
 * file that registers the custom element, and that element's tag.
 */
export interface MarketplaceComponent {
  /** Source file exposed under the module key, e.g. './src/index.ts'. */
  source: string
  /** The tag the source registers with @customElement(...) / customElements.define(...). */
  tag: string
}

export type MarketplaceComponents = Record<string, MarketplaceComponent>

/** The `exposes` map for @originjs/vite-plugin-federation. */
export const exposesOf = (components: MarketplaceComponents): Record<string, string> =>
  Object.fromEntries(Object.entries(components).map(([module, { source }]) => [module, source]))

/**
 * Writes `marketplace.json` next to the build output. The Marketplace portal reads it from the
 * uploaded zip to fill in the entry file, module export, component name and version, so a partner
 * doesn't have to type them:
 *
 *   { "entry": "assets/remoteEntry.js", "version": "1.0.0",
 *     "components": { "./Component": { "tag": "imaging-widget" } } }
 *
 * It also fails the build when a tag listed here does not appear in the bundled code, which is
 * the mistake that otherwise only shows up as an empty area inside the host.
 */
export function marketplaceManifest(options: { components: MarketplaceComponents; remoteEntry?: string }): Plugin {
  const remoteEntry = options.remoteEntry ?? 'remoteEntry.js'
  let config: ResolvedConfig

  return {
    name: 'acuitas-marketplace-manifest',
    apply: 'build',
    // After the federation plugin has added the remote entry to the bundle.
    enforce: 'post',
    configResolved(resolved) {
      config = resolved
    },
    generateBundle(_, bundle) {
      const files = Object.keys(bundle)
      const entry = files.find(f => f === remoteEntry || f.endsWith(`/${remoteEntry}`))
      if (!entry) {
        this.error(`marketplace.json: ${remoteEntry} is not in the build output. Is the federation filename different?`)
      }

      const code = Object.values(bundle)
        .map(output => (output.type === 'chunk' ? output.code : ''))
        .join('\n')
      for (const { tag } of Object.values(options.components)) {
        if (![`"${tag}"`, `'${tag}'`, `\`${tag}\``].some(quoted => code.includes(quoted))) {
          this.error(`marketplace.json: no custom element named '${tag}' is registered in the build. ` +
            'Make the tag in vite.config.ts match the @customElement(...) in your source.')
        }
      }

      const { version } = JSON.parse(readFileSync(join(config.root, 'package.json'), 'utf8')) as { version?: string }
      const manifest = {
        entry,
        version,
        components: Object.fromEntries(Object.entries(options.components).map(([module, { tag }]) => [module, { tag }])),
      }
      this.emitFile({ type: 'asset', fileName: 'marketplace.json', source: `${JSON.stringify(manifest, null, 2)}\n` })
    },
  }
}
