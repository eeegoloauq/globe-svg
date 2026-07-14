/** Config defaults, merging and validation. */

export const DEFAULTS = {
  // Canvas: square viewBox `0 0 size size`; globe radius = size/2 - margin.
  size: 1000,
  margin: 22,
  // [longitude, latitude] placed at the center of the frame.
  center: [0, 0],
  // Fraction of geometry points kept after simplification (0..1).
  // 0.08 keeps files small and looks clean at up to ~1200 px wide.
  detail: 0.08,
  // Decimal places in path coordinates.
  digits: 1,
  graticule: true,
  colors: {
    // Radial gradient of the ocean disc, [inner, outer].
    disc: ['#242424', '#1d1d1d'],
    graticule: 'rgba(255,255,255,0.035)',
    land: '#2b2b2b',
    borders: 'rgba(255,255,255,0.055)',
    rim: 'rgba(255,255,255,0.09)',
  },
  // Optional highlighted regions:
  // { source: 'ne-admin1-50m' | 'ne-admin0-50m' | { url } | { path },
  //   key: '<feature property holding the code>',
  //   groups: [{ id: 'my-region', codes: ['RU-MOW', ...] }] }
  regions: null,
  // Override backdrop datasets (file paths or URLs); used for tests/pinning.
  sources: {},
  output: {
    dir: '.',
    svg: 'globe.svg',
    layer: 'globe-regions.json',
  },
}

class ConfigError extends Error {}

function fail(message) {
  throw new ConfigError(`Invalid config: ${message}`)
}

/** Deep-merge user config over defaults and validate the result. */
export function resolveConfig(user) {
  if (typeof user !== 'object' || user === null || Array.isArray(user)) {
    fail('expected a JSON object')
  }
  const config = {
    ...DEFAULTS,
    ...user,
    colors: { ...DEFAULTS.colors, ...(user.colors ?? {}) },
    sources: { ...(user.sources ?? {}) },
    output: { ...DEFAULTS.output, ...(user.output ?? {}) },
  }

  if (!Number.isFinite(config.size) || config.size <= 0) fail('"size" must be a positive number')
  if (!Number.isFinite(config.margin) || config.margin < 0 || config.margin >= config.size / 2) {
    fail('"margin" must be in [0, size/2)')
  }
  const [lon, lat] = Array.isArray(config.center) ? config.center : []
  if (!Number.isFinite(lon) || !Number.isFinite(lat) || Math.abs(lon) > 180 || Math.abs(lat) > 90) {
    fail('"center" must be [longitude, latitude]')
  }
  if (!Number.isFinite(config.detail) || config.detail <= 0 || config.detail > 1) {
    fail('"detail" must be in (0, 1]')
  }
  if (!Number.isInteger(config.digits) || config.digits < 0 || config.digits > 6) {
    fail('"digits" must be an integer in [0, 6]')
  }

  if (config.regions !== null) {
    const r = config.regions
    if (typeof r !== 'object' || Array.isArray(r)) fail('"regions" must be an object')
    if (typeof r.key !== 'string' || !r.key) fail('"regions.key" must be a property name')
    if (!Array.isArray(r.groups) || r.groups.length === 0) {
      fail('"regions.groups" must be a non-empty array')
    }
    const seen = new Set()
    for (const g of r.groups) {
      if (typeof g.id !== 'string' || !g.id) fail('every group needs a string "id"')
      if (seen.has(g.id)) fail(`duplicate group id "${g.id}"`)
      seen.add(g.id)
      if (!Array.isArray(g.codes) || g.codes.length === 0) {
        fail(`group "${g.id}" needs a non-empty "codes" array`)
      }
    }
  }

  return config
}
