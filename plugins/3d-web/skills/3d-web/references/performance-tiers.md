# Frame budgets and device tiers

At 60fps everything (input, timeline, scene updates, simulation, rendering, post) shares **16.7ms**.
Two costs dominate: **draw calls** (CPU) and **pixels × shader cost** (GPU).

## Tiers

Pick a starting tier from the device, then let measured frame time move it down (or back up).

| Tier | Typical device | Pixel ratio | Particles / instances | Shadows | Post | Target |
| --- | --- | --- | --- | --- | --- | --- |
| **high** | Desktop / recent laptop with a real GPU | min(dpr, 1.5 to 2) | 100% | on (1024) | full | 60fps |
| **mid** | Most laptops, tablets, recent phones | min(dpr, 1.25) | ~50% | on (512) or blob | lighter (no CA/warp) | 60fps |
| **low** | Older phones, low-power laptops | 1 | ~25% | off (blob) | vignette + grain only | ≥ 45fps |
| **poster** | No WebGL, lost context, reduced motion, or low tier still failing | — | — | — | — | a designed still image |

Starting guess (cheap, no network):
```ts
function initialTier(): Tier {
  const gl = document.createElement('canvas').getContext('webgl2')
  if (!gl || matchMedia('(prefers-reduced-motion: reduce)').matches) return 'poster'
  const cores = navigator.hardwareConcurrency ?? 4
  const mem = (navigator as any).deviceMemory ?? 4          // Chromium only
  const small = Math.min(screen.width, screen.height) < 768
  if (cores <= 4 || mem <= 2) return 'low'
  if (small || cores <= 6) return 'mid'
  return 'high'
}
```
For a benchmark-based guess use `detect-gpu` (`getGPUTier()` → tier 0 to 3), which looks up the GPU name.

## Runtime adjustment (the important part)

Measure the average frame time over ~1.5s windows. If it stays above ~20ms (under 50fps) for two
windows, step down one tier; if it stays under ~12ms for a long time on a lowered tier, step up.
Never flip back and forth more than a couple of times (cap the changes). R3F has this built in:

```tsx
<PerformanceMonitor onDecline={() => setTier(lower)} onIncline={() => setTier(higher)} flipflops={3} onFallback={() => setTier('poster')}>
```
Change things that are cheap to change: pixel ratio (`setPixelRatio` + `setSize`), draw range of
particles (`geometry.setDrawRange(0, count)` instead of rebuilding), shadows on/off, post effects.
While the camera moves fast, a temporary drop in resolution (R3F `performance.regress()`) is invisible.

## Frame loop rules

- Skip hidden scenes (`weight <= 0`), pause off screen (`IntersectionObserver`) and when
  `document.hidden`.
- No allocations per frame; no `getBoundingClientRect` in the loop except once per frame for views.
- Clamp `dt`; sub-step stiff physics.
- Still scenes: `frameloop="demand"` and `invalidate()` on change.

## Measure it

Run against a production build when possible. Chromium with the real GPU (macOS):
`--use-angle=metal --enable-gpu --ignore-gpu-blocklist`. The page hook below counts draw calls and
frame times while you scroll:

```js
// inject before the page's scripts (Playwright: page.addInitScript)
(() => {
  const s = (window.__gl = { calls: 0, frames: [], perFrame: [] })
  for (const P of [WebGL2RenderingContext.prototype, WebGLRenderingContext.prototype])
    for (const fn of ['drawArrays', 'drawElements', 'drawArraysInstanced', 'drawElementsInstanced']) {
      const o = P[fn]; if (o) P[fn] = function (...a) { s.calls++; return o.apply(this, a) }
    }
  let last = performance.now()
  requestAnimationFrame(function loop(t) { s.frames.push(t - last); s.perFrame.push(s.calls); s.calls = 0; last = t; requestAnimationFrame(loop) })
})()
```
Then scroll the whole page in steps, and read p50/p95 frame time, frames over 33ms, and draw calls
per frame. Repeat with a phone viewport and 4× CPU throttling (CDP `Emulation.setCPUThrottlingRate`).
Reference result from a well-built scroll-driven WebGL page (4 worlds, 65k GPU particles): p95
16.8ms, 1 to 3 frames over 33ms in ~700, 16 to 28 draw calls per frame, memory flat after 3 returns.

In-app while developing: `renderer.info.render.calls / triangles`, `renderer.info.memory.geometries / textures`, and `r3f-perf` in R3F.
