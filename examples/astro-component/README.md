# Astro reference component

`GlobeMap.astro` shows the intended integration pattern: the backdrop stays an
external `<img>` (cached once for the whole site), the region layer is inlined
so every region is a real, CSS-stylable hit-target.

It is a **reference to copy**, not a published component — real projects will
wire their own i18n, design tokens and analytics. Usage:

```astro
---
import GlobeMap from '@/components/GlobeMap.astro'
---
<GlobeMap
  regions={[
    { id: 'nordics', label: 'Nordics', description: 'Oslo · Stockholm · Helsinki · Copenhagen' },
    { id: 'dach', label: 'DACH', description: 'Berlin · Vienna · Zurich' },
    { id: 'iberia', label: 'Iberia', description: 'Madrid · Lisbon' },
  ]}
/>
```

Place `globe.svg` and `globe-regions.json` (from `npx globe-svg`) next to the
component, or adjust the imports. Region `id`s must match the config's group ids.

Gotcha worth keeping: the grid columns use `minmax(0, 1fr)` — a bare `1fr`
track can be blown up by wide content and push the globe off-canvas.
