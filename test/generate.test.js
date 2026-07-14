import { test } from 'node:test'
import assert from 'node:assert/strict'
import { generate } from '../src/generate.js'
import { resolveConfig } from '../src/config.js'

const FIXTURES = new URL('./fixtures/', import.meta.url).pathname

const baseConfig = {
  center: [20, 20],
  detail: 1,
  // The same two-square FeatureCollection serves as backdrop (land = merge,
  // borders = shared edge) and as the region source.
  sources: {
    backdrop: 'regions.geojson',
  },
  regions: {
    source: 'regions.geojson',
    key: 'code',
    groups: [
      { id: 'west', codes: ['A'] },
      { id: 'east', codes: ['B'] },
    ],
  },
}

test('generates backdrop SVG and an aligned region layer', async () => {
  const { svg, layer, warnings } = await generate(baseConfig, { baseDir: FIXTURES, quiet: true })

  assert.match(svg, /^<svg xmlns="http:\/\/www\.w3\.org\/2000\/svg" viewBox="0 0 1000 1000"/)
  assert.ok((svg.match(/<path /g) ?? []).length >= 3, 'graticule + land + borders paths')

  assert.equal(layer.viewBox, '0 0 1000 1000')
  assert.deepEqual(
    layer.regions.map((r) => r.id),
    ['west', 'east']
  )
  for (const region of layer.regions) {
    assert.match(region.d, /^M/, `region "${region.id}" has a path`)
  }
  assert.match(layer.borders, /^M/, 'shared edge between groups is drawn')
  assert.deepEqual(warnings, [])
})

test('warns about codes missing from the source', async () => {
  const config = structuredClone(baseConfig)
  config.regions.groups[0].codes.push('ZZ')
  const { warnings } = await generate(config, { baseDir: FIXTURES, quiet: true })
  assert.equal(warnings.length, 1)
  assert.match(warnings[0], /ZZ/)
})

test('skips the region layer when "regions" is absent', async () => {
  const { layer } = await generate(
    { center: [20, 20], detail: 1, sources: { backdrop: 'regions.geojson' } },
    { baseDir: FIXTURES, quiet: true }
  )
  assert.equal(layer, null)
})

test('rejects invalid configs with a clear message', () => {
  assert.throws(() => resolveConfig({ center: [200, 0] }), /"center"/)
  assert.throws(() => resolveConfig({ detail: 0 }), /"detail"/)
  assert.throws(
    () => resolveConfig({ regions: { key: 'code', groups: [] } }),
    /"regions\.groups"/
  )
})
