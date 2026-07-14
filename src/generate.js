/**
 * Core generator: Natural Earth data -> orthographic globe as
 *   - a self-contained backdrop SVG (ocean disc, graticule, land, borders, rim)
 *   - an optional region layer (path per region group + inter-region borders)
 *     sharing the same projection and viewBox, so the two overlay pixel-perfectly.
 */

import { geoOrthographic, geoPath, geoGraticule10 } from 'd3-geo'
import { feature, merge, mesh } from 'topojson-client'
import { topology } from 'topojson-server'
import { presimplify, simplify, quantile } from 'topojson-simplify'
import { resolveConfig } from './config.js'
import { loadDataset, DEFAULT_KEY } from './sources.js'

/** Simplify a topology keeping roughly `detail` fraction of its points. */
function simplified(topo, detail) {
  const pre = presimplify(topo)
  return simplify(pre, quantile(pre, detail))
}

/** Natural Earth mixes property casings across releases; look up leniently. */
function prop(properties, key) {
  return properties?.[key] ?? properties?.[key.toUpperCase()] ?? properties?.[key.toLowerCase()]
}

/**
 * Generate the globe.
 * @param {object} userConfig see README / src/config.js for the schema
 * @param {{ baseDir?: string, quiet?: boolean }} options
 *   baseDir resolves relative dataset paths (defaults to CWD).
 * @returns {Promise<{ svg: string, layer: object|null, warnings: string[] }>}
 */
export async function generate(userConfig, { baseDir = '.', quiet = false } = {}) {
  const config = resolveConfig(userConfig)
  const warnings = []
  const load = (ref) => loadDataset(ref, { baseDir, quiet })

  const [landTopo, countriesTopo] = await Promise.all([
    load(config.sources.land ?? 'land'),
    load(config.sources.countries ?? 'countries'),
  ])

  const radius = config.size / 2 - config.margin
  const half = config.size / 2
  const projection = geoOrthographic()
    .rotate([-config.center[0], -config.center[1]])
    .translate([half, half])
    .scale(radius)
  const pathOf = geoPath(projection).digits(config.digits)
  // mesh() of a single feature (or an empty selection) yields no visible arcs.
  const draw = (geometry) => (geometry && pathOf(geometry)) || ''

  // --- Backdrop ---
  const land = simplified(landTopo, config.detail)
  const countries = simplified(countriesTopo, config.detail)
  const dLand = draw(feature(land, land.objects.land))
  const dBorders = draw(mesh(countries, countries.objects.countries, (a, b) => a !== b))
  const dGraticule = config.graticule ? draw(geoGraticule10()) : ''

  const c = config.colors
  const svg = [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${config.size} ${config.size}" role="img" aria-hidden="true">`,
    '<defs>',
    '<radialGradient id="globe-disc" cx="38%" cy="30%" r="75%">',
    `<stop offset="0%" stop-color="${c.disc[0]}"/>`,
    `<stop offset="100%" stop-color="${c.disc[1]}"/>`,
    '</radialGradient>',
    '</defs>',
    `<circle cx="${half}" cy="${half}" r="${radius}" fill="url(#globe-disc)"/>`,
    dGraticule && `<path d="${dGraticule}" fill="none" stroke="${c.graticule}" stroke-width="1"/>`,
    `<path d="${dLand}" fill="${c.land}"/>`,
    dBorders && `<path d="${dBorders}" fill="none" stroke="${c.borders}" stroke-width="1"/>`,
    `<circle cx="${half}" cy="${half}" r="${radius}" fill="none" stroke="${c.rim}" stroke-width="1.5"/>`,
    '</svg>',
    '',
  ]
    .filter((line) => line !== '')
    .join('\n')

  // --- Region layer ---
  let layer = null
  if (config.regions) {
    const spec = config.regions
    const key = spec.key ?? DEFAULT_KEY[spec.source]
    const dataset = await load(spec.source)
    const features = dataset.type === 'FeatureCollection' ? dataset.features : null
    if (!features) throw new Error('Region source must be a GeoJSON FeatureCollection')

    const codeToGroup = new Map(spec.groups.flatMap((g) => g.codes.map((code) => [code, g.id])))
    const matched = features.filter((f) => codeToGroup.has(prop(f.properties, key)))

    const found = new Set(matched.map((f) => prop(f.properties, key)))
    const missing = [...codeToGroup.keys()].filter((code) => !found.has(code))
    if (missing.length) {
      warnings.push(`codes not found in region source (check "${key}" values): ${missing.join(', ')}`)
    }

    const topo = simplified(
      topology({ regions: { type: 'FeatureCollection', features: matched } }, 1e5),
      config.detail
    )
    const geometries = topo.objects.regions.geometries
    const groupOf = (geometry) => codeToGroup.get(prop(geometry.properties, key))

    const regions = spec.groups.map((g) => {
      const own = geometries.filter((geometry) => groupOf(geometry) === g.id)
      if (own.length === 0) throw new Error(`Region group "${g.id}" matched no features`)
      return { id: g.id, d: draw(merge(topo, own)) }
    })
    const empty = regions.filter((r) => !r.d)
    if (empty.length) {
      warnings.push(
        `region path is empty (outside the visible hemisphere?): ${empty.map((r) => r.id).join(', ')}`
      )
    }

    layer = {
      viewBox: `0 0 ${config.size} ${config.size}`,
      // Borders between different groups only — no coastlines, no inner admin lines.
      borders: draw(mesh(topo, topo.objects.regions, (a, b) => groupOf(a) !== groupOf(b))),
      regions,
    }
  }

  return { svg, layer, warnings }
}
