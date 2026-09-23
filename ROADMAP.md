# Roadmap

Larger work that shouldn't be done in passing. Remove an item when it ships.

- **Critical path tests.** Add coverage for CLI output, dataset downloads/cache, and generated examples; current tests exercise only config and generation with `test/fixtures/regions.geojson` (`src/cli.js`, `src/sources.js`, `test/generate.test.js`).
- **Untrusted config handling.** Review local/remote dataset references and SVG color insertion before accepting untrusted configs (`src/sources.js`, `src/generate.js`).
- **Plain HTML integration.** Add keyboard access and useful region labels, plus a visible JSON loading error state (`examples/plain-html/index.html`).
