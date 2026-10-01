# Performance: budgets, loading, fallbacks

A configurator sells on phones over shop Wi-Fi. The rule of thumb: **the product is visible almost
immediately (poster), interactive soon after, and never stutters when someone taps a swatch.** General
tiers, compression and cleanup are in 3d-web; this file adds the configurator-specific parts.

## 1. Budgets

| | Laptop (mid) | Phone (mid-range, 2023+) |
| --- | --- | --- |
| Poster on screen | < 0.3 s | < 0.5 s |
| 3D interactive | < 1.5 s | < 3 s on 4G |
| Frame rate while orbiting, gliding, swapping | 60 fps | ≥ 50 fps |
| Longest frame during any swap (incl. the first) | < 50 ms | < 50 ms |
| First-paint JavaScript (panel + poster) | < 100 KB gzipped | same |
| 3D JavaScript (loaded after) | < 300 KB gzipped | same |
| Model download | < 3 MB (Meshopt + KTX2) | < 3 MB |
| Draw calls | < 100 | < 60 |
| Triangles | < 500k | < 200k |
| Pixel ratio cap | 2 (auto-lowered under load) | 1.5 to 2 |

The demo measured 0.16 s poster, 0.7 s interactive, 60 fps and no long tasks during swaps on a laptop.
The keyboard build: 1.1 s, 60 fps everywhere, flat memory after 10 design switches.

## 2. Load order

1. **HTML + panel + poster** (tiny). The poster is `<link rel="preload" as="image">` in the head.
2. **The 3D chunk** with `React.lazy` / `next/dynamic` after first paint. Keep three.js out of the first
   chunk: a single static import of a three.js helper from the panel pulls the whole library in
   (it happened in the demo: 597 KB first chunk until the snapshot helper became a dynamic import).
3. **The model** for the current configuration, then other variants of the option being edited, then the rest when idle.
4. **Warm-up** (compile + upload, `materials.md`), one real frame, then fade the poster out.

```tsx
// Vite / plain React
const Stage = lazy(() => import("./three/Stage"));

// Next.js App Router: ssr:false is only allowed inside a Client Component
"use client";
import dynamic from "next/dynamic";
const Stage = dynamic(() => import("./three/Stage"), { ssr: false, loading: () => null }); // the poster is already there
```

On long landing pages, mount the stage only when it's near the viewport (`IntersectionObserver` with a
`rootMargin` of about one screen) and unmount it far away (3d-web `cleanup.md`).

## 3. Render on demand

`<Canvas frameloop="demand">` and call `invalidate()` from: glides, fades, damping (drei's controls do
it), and any state change that affects the picture (subscribe the stores once and invalidate). Nothing
renders while the product is still, which saves phone batteries on long product pages.

## 4. Adaptive quality

drei `<PerformanceMonitor onDecline={() => setDpr(1.25)} onIncline={() => setDpr(1.75)} />`. Lower the
pixel ratio first, then shadow-map size, then turn off the key light's shadow (keep the contact shadow).
Never change saved material values to gain speed.

## 5. Measure what matters: the swap

Idle fps tells you nothing. Measure while doing the thing people do:

```js
// In the page, before a scripted run of swaps (Playwright or by hand)
window.__long = [];
new PerformanceObserver((l) => l.getEntries().forEach((e) => window.__long.push(e.duration)))
  .observe({ entryTypes: ["longtask"] });
// Then log which action caused each long task: the first swap of each kind is the usual culprit.
```

Run headless Chrome **with the GPU** for meaningful numbers (`--use-angle=metal --enable-gpu
--ignore-gpu-blocklist` on macOS). A hidden preview window or background tab pauses animation frames
entirely, so its numbers are meaningless. CPU throttling doesn't slow the GPU: confirm on a real
mid-range phone.

## 6. Asset pipeline (summary; details in 3d-web assets.md)

- Ask for **real-scale, named parts** that match the options, one material per swappable surface,
  UVs that suit tileable textures, and variants via `KHR_materials_variants`.
- `gltf-transform inspect model.glb`, then `gltf-transform optimize model.glb out.glb --compress meshopt --texture-compress ktx2`.
- Self-host decoders (Meshopt, Draco, Basis); drei `useGLTF` defaults Draco to a Google CDN.
- `useGLTF.preload(url)` for the default configuration's model as soon as the 3D chunk starts loading.
- Every variant's geometry is created or loaded once; switching shows and hides, it never rebuilds.

## 7. Fallbacks

| Situation | What people see |
| --- | --- |
| No WebGL 2 | The poster stays; a one-line note; panel, price, summary, share and cart all work |
| GPU context lost | `webglcontextlost` → `preventDefault()`, show the poster and a "Reload the 3D view" action; choices kept |
| Reduced motion | Glides become cuts, crossfades become instant swaps, no turntable |
| Slow device | Lower pixel ratio and shadows (above); never a frozen spinner |
| Model fails to load | Poster plus "We couldn't load the 3D view" with Retry; panel keeps working |

WebGPU: three.js's `WebGPURenderer` falls back to WebGL 2 by itself, but `onBeforeCompile` and
`ShaderMaterial` don't work there. Use it only when the project needs it (3d-web `webgpu.md`).

## 8. Memory

Dispose materials, textures and geometries the stage created when it unmounts (the material library's
`dispose()`), and the transparent copies after every fade. Check: switch designs or configurations
ten times, force garbage collection, and the JS heap and `renderer.info.memory` should be flat.
