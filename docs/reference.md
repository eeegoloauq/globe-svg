# Reference

## Output

This writes `globe.svg` next to the config and, when a region layer exists, `globe-regions.json`:

| File | What it is | How to use it |
| --- | --- | --- |
| `globe.svg` | Self-contained backdrop: ocean disc, graticule, land, country borders | `<img src>`, cached for the whole site |
| `globe-regions.json` | `{ viewBox, borders, regions: [{ id, d }] }` | Inline the paths in an `<svg>` overlay for interactivity |

Both use the same projection and viewBox, so the overlay lines up with the image:

```html
<div style="position: relative">
  <img src="globe.svg" width="1000" height="1000" style="width: 100%; height: auto" alt="" />
  <svg viewBox="0 0 1000 1000" style="position: absolute; inset: 0; width: 100%; height: 100%">
    <!-- one <path d="…"> per region; style :hover / .active with plain CSS -->
  </svg>
</div>
```

Working integrations: [`examples/astro-component`](../examples/astro-component) and
[`examples/plain-html`](../examples/plain-html). A second example config:
[`examples/world-coverage`](../examples/world-coverage).

## Config

Every key is optional. Set `center` to frame the globe on your area.

| Key | Default | Meaning |
| --- | --- | --- |
| `size` | `1000` | Square viewBox `0 0 size size` |
| `margin` | `22` | Space between globe and viewBox edge; radius = `size/2 − margin` |
| `center` | `[0, 0]` | `[longitude, latitude]` placed at the center of the frame |
| `detail` | `0.08` | Fraction of geometry points kept after simplification (0..1]. `0.08` is clean up to ~1200 px wide; raise it for posters |
| `digits` | `1` | Decimal places in path coordinates |
| `graticule` | `true` | Draw the 10° meridian/parallel grid |
| `colors` | dark theme | `disc: [inner, outer]`, `graticule`, `land`, `borders`, `rim` |
| `regions` | `null` | See below |
| `sources` | built-in | Override the backdrop dataset: `{ "backdrop": … }` (path or URL to an admin-0-like GeoJSON FeatureCollection) |
| `output` | `.` / `globe.svg` / `globe-regions.json` | `dir` is relative to the config file |

## Regions

```json
"regions": {
  "source": "ne-admin1-50m",
  "key": "iso_3166_2",
  "groups": [{ "id": "central", "codes": ["RU-MOW", "RU-MOS", "…"] }]
}
```

- `source`: `"ne-admin0-50m"` (countries), `"ne-admin1-50m"` (states/provinces of the
  ~10 largest countries), a URL, or a local GeoJSON FeatureCollection path.
- `key`: the feature property holding the code. Use `ADM0_A3` for countries (Natural Earth leaves
  `ISO_A3` as `-99` for France, Norway and a few others) and `iso_3166_2` for admin-1. The key is
  also tried in upper and lower case, since Natural Earth releases differ.
- `groups`: each becomes one merged `<path>` in the layer, without the inner boundaries of its
  subdivisions. `layer.borders` holds only the lines between different groups, without
  coastlines.

Codes that match nothing produce a warning listing them; a group that matches nothing
is an error.

## Data & caching

All geometry comes from [Natural Earth](https://www.naturalearthdata.com/)
(public domain) at 1:50m scale, pinned to release v5.1.2 for reproducible output. Land and
country borders both come from the admin-0 dataset (land is the union of all countries), so the
backdrop layers align, and the region layer uses the same scale and release.

Files are downloaded on the first run into `~/.cache/globe-svg` (override with
`GLOBE_SVG_CACHE`) and reused after that.

Disputed territories are drawn as Natural Earth ships them (de facto boundaries). For different
boundaries, point `regions.source` or `sources` at your own GeoJSON.
