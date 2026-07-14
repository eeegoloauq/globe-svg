# globe-svg — dev notes

npm CLI/lib: Natural Earth → orthographic globe as static SVG + region-paths JSON.
Public OSS (MIT), canonical repo on GitHub, npm publish via tag → `.github/workflows/publish.yml`.

- Layout: `src/` (cli / generate / config / sources), `test/` (offline, fixtures), `examples/`.
- Tests: `npm test` — no network; fixtures are tiny hand-written topologies.
- Examples double as smoke tests: `npm run examples` (downloads NE data to `~/.cache/globe-svg` on first run).
- `examples/**/preview.svg` are committed demo renders for the README — regenerate after visual changes (compose backdrop + tinted region paths).
- Release: bump version in package.json → commit → `git tag vX.Y.Z && git push --tags` (needs `NPM_TOKEN` secret in GitHub).
- Keep it dependency-light: d3-geo + topojson trio only. No runtime/browser code in the package — interactivity lives in examples.
- Origin: extracted from the terminator-astro dealer map (scripts/map there is the ancestor; that site keeps its own config and will migrate to this CLI eventually).
