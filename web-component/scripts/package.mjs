// Zips the build output for upload to the Acuitas Marketplace portal.
//
// The zip holds the *contents* of dist/ (remote entry, every chunk, and the marketplace.json the
// build writes), which is what the portal reads to fill in the entry file, module export,
// component name and version. Run it through `npm run package`, which builds first.
import { readFileSync, readdirSync, statSync, mkdirSync, writeFileSync, existsSync } from 'node:fs'
import { join, relative, sep } from 'node:path'
import { fileURLToPath } from 'node:url'
import { zipSync } from 'fflate'

const root = fileURLToPath(new URL('..', import.meta.url))
const dist = join(root, 'dist')
const manifestPath = join(dist, 'marketplace.json')
if (!existsSync(manifestPath)) {
  console.error('dist/marketplace.json is missing: run `npm run package` (it builds first), not this script on its own.')
  process.exit(1)
}

const walk = dir => readdirSync(dir).flatMap(name => {
  const path = join(dir, name)
  return statSync(path).isDirectory() ? walk(path) : [path]
})

const files = Object.fromEntries(walk(dist).map(path => [relative(dist, path).split(sep).join('/'), readFileSync(path)]))
const { name } = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'))
const { version } = JSON.parse(readFileSync(manifestPath, 'utf8'))

const outDir = join(root, 'marketplace-upload')
mkdirSync(outDir, { recursive: true })
const zipPath = join(outDir, `${name}-${version ?? 'unversioned'}.zip`)
writeFileSync(zipPath, zipSync(files))

console.log(`Wrote ${relative(root, zipPath)} (${Object.keys(files).length} files).`)
console.log('Upload it on your plugin\'s Web Components page in the Marketplace portal; the rest of the form fills itself in.')
