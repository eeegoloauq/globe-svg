/** Dataset resolution: built-in Natural Earth sources, URLs, local files, caching. */

import { readFile, writeFile, mkdir } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { homedir } from 'node:os'
import path from 'node:path'

// Single data source: Natural Earth 1:50m (public domain), pinned to a release
// tag for reproducible output. One scale, one version — the backdrop and the
// region layer are derived from the same geometry family, so coastlines match.
const NE = 'https://raw.githubusercontent.com/nvkelso/natural-earth-vector/v5.1.2/geojson'

export const BUILTIN = {
  'ne-admin0-50m': `${NE}/ne_50m_admin_0_countries.geojson`,
  'ne-admin1-50m': `${NE}/ne_50m_admin_1_states_provinces.geojson`,
}

// Default feature property holding the region code, per built-in source.
// ADM0_A3 (not ISO_A3) on purpose: Natural Earth leaves ISO_A3 as "-99" for
// France, Norway and a few others; ADM0_A3 is always populated.
export const DEFAULT_KEY = {
  'ne-admin0-50m': 'ADM0_A3',
  'ne-admin1-50m': 'iso_3166_2',
}

function cacheDir() {
  return process.env.GLOBE_SVG_CACHE || path.join(homedir(), '.cache', 'globe-svg')
}

async function fetchCached(url, { quiet }) {
  const file = path.join(cacheDir(), encodeURIComponent(url))
  if (!existsSync(file)) {
    if (!quiet) console.error(`globe-svg: downloading ${url}`)
    await mkdir(cacheDir(), { recursive: true })
    const res = await fetch(url)
    if (!res.ok) throw new Error(`Download failed (${res.status}): ${url}`)
    await writeFile(file, Buffer.from(await res.arrayBuffer()))
  }
  return JSON.parse(await readFile(file, 'utf8'))
}

/**
 * Load a dataset. `ref` is a built-in name, a `{ url }`, a `{ path }`,
 * or a plain string treated as URL (http/https) or file path.
 * `baseDir` resolves relative file paths (usually the config file's directory).
 */
export async function loadDataset(ref, { baseDir = '.', quiet = false } = {}) {
  if (typeof ref === 'string') {
    if (BUILTIN[ref]) return fetchCached(BUILTIN[ref], { quiet })
    if (/^https?:\/\//.test(ref)) return fetchCached(ref, { quiet })
    return JSON.parse(await readFile(path.resolve(baseDir, ref), 'utf8'))
  }
  if (ref && typeof ref === 'object') {
    if (ref.url) return fetchCached(ref.url, { quiet })
    if (ref.path) return JSON.parse(await readFile(path.resolve(baseDir, ref.path), 'utf8'))
  }
  throw new Error(`Unknown dataset reference: ${JSON.stringify(ref)}`)
}
