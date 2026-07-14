#!/usr/bin/env node
/** CLI entry: `globe-svg --config globe.config.json [--out DIR] [--quiet]` */

import { readFile, writeFile, mkdir } from 'node:fs/promises'
import path from 'node:path'
import { parseArgs } from 'node:util'
import { generate } from './generate.js'

const HELP = `globe-svg — render an orthographic globe with highlighted regions to static SVG

Usage:
  globe-svg --config <file> [options]

Options:
  -c, --config <file>   Path to a JSON config (required). See README for the schema.
  -o, --out <dir>       Override output directory from the config.
  -q, --quiet           Suppress progress output (warnings still print).
  -h, --help            Show this help.
  -v, --version         Show version.

Outputs (paths from the config's "output" section, relative to --out / output.dir):
  globe.svg             Self-contained backdrop — use as <img src>, cacheable.
  globe-regions.json    Region paths sharing the same viewBox — inline them in an
                        <svg> overlay for hover/click interactivity.
`

async function main() {
  const { values } = parseArgs({
    options: {
      config: { type: 'string', short: 'c' },
      out: { type: 'string', short: 'o' },
      quiet: { type: 'boolean', short: 'q', default: false },
      help: { type: 'boolean', short: 'h', default: false },
      version: { type: 'boolean', short: 'v', default: false },
    },
  })

  if (values.help) {
    process.stdout.write(HELP)
    return
  }
  if (values.version) {
    const pkg = JSON.parse(await readFile(new URL('../package.json', import.meta.url), 'utf8'))
    console.log(pkg.version)
    return
  }
  if (!values.config) {
    process.stderr.write(HELP)
    process.exitCode = 2
    return
  }

  const configPath = path.resolve(values.config)
  const config = JSON.parse(await readFile(configPath, 'utf8'))
  const baseDir = path.dirname(configPath)

  const { svg, layer, warnings } = await generate(config, { baseDir, quiet: values.quiet })
  for (const warning of warnings) console.error(`globe-svg: warning: ${warning}`)

  const outDir = path.resolve(values.out ?? path.resolve(baseDir, config.output?.dir ?? '.'))
  await mkdir(outDir, { recursive: true })

  const kb = (s) => `${(Buffer.byteLength(s) / 1024).toFixed(1)} KB`
  const svgPath = path.join(outDir, config.output?.svg ?? 'globe.svg')
  await writeFile(svgPath, svg)
  if (!values.quiet) console.error(`globe-svg: wrote ${svgPath} (${kb(svg)})`)

  if (layer) {
    const layerJson = JSON.stringify(layer, null, 1)
    const layerPath = path.join(outDir, config.output?.layer ?? 'globe-regions.json')
    await writeFile(layerPath, layerJson)
    if (!values.quiet) console.error(`globe-svg: wrote ${layerPath} (${kb(layerJson)})`)
  }
}

main().catch((error) => {
  console.error(`globe-svg: ${error.message}`)
  process.exitCode = 1
})
