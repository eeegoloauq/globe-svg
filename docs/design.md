# Design

## Compared with a mapping library

Runtime globes and vector maps (Leaflet, MapLibre, amCharts, globe.gl, jsvectormap) add 50–300 KB
of JavaScript and project on the user's device; most offer only flat projections. The example SVGs
here are about 80 KB, 35 KB gzipped. The interactive layer is a JSON of path strings and about 30
lines of your own JavaScript.

## Dependencies

Four, all build-time; nothing reaches the browser. The installed tree is 7 packages, about
1.4 MB.

- [`d3-geo`](https://github.com/d3/d3-geo): clipping at the horizon and resampling of great-circle
  arcs.
- [`topojson-server` / `topojson-client` / `topojson-simplify`](https://github.com/topojson):
  shared-arc topology for seamless merged groups, borders without coastlines, and consistent
  simplification along shared edges.

## Scope

Orthographic projection and static output only. For rotation, zoom or pan, use a runtime library
such as d3-geo in the browser or globe.gl.

## Maintenance

Internal work that shouldn't be done in passing. Remove an item when it ships.

- **Critical path tests.** Add coverage for CLI output, dataset downloads/cache, and generated examples; current tests exercise only config and generation with `test/fixtures/regions.geojson` (`src/cli.js`, `src/sources.js`, `test/generate.test.js`).
- **Untrusted config handling.** Review local/remote dataset references and SVG color insertion before accepting untrusted configs (`src/sources.js`, `src/generate.js`).
- **Plain HTML integration.** Add keyboard access and useful region labels, plus a visible JSON loading error state (`examples/plain-html/index.html`).
