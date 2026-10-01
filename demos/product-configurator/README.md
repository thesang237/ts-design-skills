# Product configurator demo

A lounge chair configurator built with the `product-configurator` skill: Vite + React + React Three
Fiber. The point of the demo is that **the product is just data**. The panel, rules, price, share
link, cart and camera all read one product definition, and the tests run the same engine on a
sneaker defined only as data.

## Run it

```
npm install
npm run dev          # then open the address it prints (usually http://localhost:5173)
npm test             # the configuration engine's tests
npm run build        # static copy in dist/
```

## What to try

- **Swap materials**: pick colours and upholstery. Every swap crossfades in 200 ms, and the first swap
  of each kind is as smooth as the tenth because shaders and textures are prepared before the
  product appears.
- **Rules that explain themselves**: with wooden legs, the metal finishes are shown but disabled, with
  the reason underneath. Click one anyway: the notice offers "Switch to Sled (+$90)", which changes
  both in one undo step. Choose Leather: the colour jumps to Cognac and the panel says why.
- **The camera follows what you edit**: changing the base glides to a low view of the base in about
  0.8 s; any drag takes over at once. The view chips (Overview, Seat, Base, Side) do the same by hand.
- **Shareable link**: the address bar always holds the configuration
  (`?c=leather.cognac.swivel.black.arms`). Open it in a new tab to get the same chair. Edit the
  link to an impossible combination: it's repaired, and a notice says so.
- **Undo, redo, reset** (also ⌘Z / ⇧⌘Z).
- **Add to cart**: shows Adding… then opens the cart with a rendered thumbnail from a fixed hero
  camera and a readable summary. Add `?cartFail=1` to the address to see the error state; your
  configuration is kept.
- **Poster first**: a still image of the chair is on screen in about 0.1 s; the 3D loads after it
  and fades in. There is no spinner on a blank stage. Without WebGL, or after a GPU reset, the poster
  stays and the panel keeps working.
- **Phone**: the 3D stays pinned at the top while you scroll the options; price and Add to cart stay
  pinned at the bottom.

## Where things are

| File | What it shows |
| --- | --- |
| `src/config/types.ts` | The product data shape: options, choices, prices, rules, camera views, material mapping |
| `src/config/product.ts` | The chair, as data only |
| `src/config/engine.ts` | Pure logic: visibility, availability with reasons, repairs, fix suggestions, price, share code, summary |
| `src/config/engine.test.ts` | Tests, including a sneaker that reuses the same engine |
| `src/config/store.ts` | State: configuration, undo/redo/reset, camera view, notices, URL sync |
| `src/three/materials.ts` | Material library, generated textures, warm-up (compile + upload before first swap) |
| `src/three/fades.tsx` | Material crossfade and shape swap, interruptible |
| `src/three/Chair.tsx` | The chair built from simple shapes, every variant built once |
| `src/three/Stage.tsx` | Canvas, studio light, camera glides to view presets, quality monitor |
| `src/three/snapshot.ts` | Fixed-camera thumbnail for the cart |
| `src/commerce/cart.ts` | Cart line format, mock store, and a Shopify example |
| `src/ui/Panel.tsx` | The shop sheet: swatches and tiles as real radio groups, notes, price, actions |
| `scripts/make-poster.mjs` | Renders `public/poster.jpg` from the running demo |

## Assets and licenses

| Asset | Source | License |
| --- | --- | --- |
| Chair geometry | Built in code (`src/three/Chair.tsx`) | Part of this repo |
| Fabric, leather and wood textures | Generated in code (`src/three/materials.ts`) | Part of this repo |
| Studio lighting | drei `Lightformer` shapes, rendered locally; no HDR download | Part of this repo |
| `public/poster.jpg` | Rendered from this demo by `scripts/make-poster.mjs` | Part of this repo |
| Fonts | The visitor's system font | — |

No third-party models, textures, HDRs, logos or fonts are used. Product name, prices and colours are
placeholders.

## Measured (production build, Chrome, Apple M4 GPU)

| | Desktop | Phone size, CPU 4× slower |
| --- | --- | --- |
| Poster on screen | 0.16 s | 0.22 s |
| 3D ready | 0.7 s | 0.9 s |
| First-paint JavaScript | 67 KB gzipped (the 3D loads after it: 181 KB + 104 KB) | same |
| Material swaps | 60 fps, no long tasks | 59 fps, one 50 ms frame in 16 swaps |
| Shape swaps, camera glides, orbit | 60 fps, no long tasks | 60 fps |

CPU throttling doesn't slow the GPU, so check on a real mid-range phone before shipping.
