# Compositing: blending worlds and post effects in one pass

## Render to images, then mix

1. Each visible world renders into its own render target (an offscreen image the size of the canvas).
2. One full-screen quad with a fragment shader samples the images and outputs the final pixel.
3. Only the world(s) with weight > 0 render; at most two during a transition.

```ts
const s = ((dials.scene % N) + N) % N, a = Math.floor(s), t = s - a   // 1.35 → world 1 at 65%, world 2 at 35%
renderer.setRenderTarget(rtA); renderer.render(worlds[a].scene, worlds[a].camera)
if (t > 0.0005) { renderer.setRenderTarget(rtB); renderer.render(worlds[(a + 1) % N].scene, worlds[(a + 1) % N].camera) }
renderer.setRenderTarget(null)
quad.material.uniforms.uT.value = t
renderer.render(quadScene, quadCamera)
```
In R3F, do this in a `useFrame(..., 1)` (priority ≥ 1 takes over R3F's own render).

Targets: `new THREE.WebGLRenderTarget(w, h, { type: HalfFloatType, samples: 4, generateMipmaps: true, minFilter: LinearMipmapLinearFilter })`
- `HalfFloatType` keeps HDR values (> 1) for bloom; `samples: 4` = MSAA, so the canvas can use
  `antialias: false`; mipmaps give free blur levels. Resize them with the canvas × pixel ratio.

## Effects in the same shader

| Effect | Idea | Tip |
| --- | --- | --- |
| Noise dissolve between worlds | `m = smoothstep(n - e, n + e, t * (1 + 2e) - e)` with `n` = drifting fbm | Reads as fog rolling in, not a slideshow |
| Mid-transition only | multiply lens effects by `mid = sin(t · π)` | Calm at rest, dramatic while moving |
| Whiteout / fog | `mix(col, fogColour, mid * (0.55 + 0.35n))` | Hides the seam between worlds |
| Barrel warp | `uv += c * dot(c, c) * mid * 0.55` (c = uv − 0.5) | |
| Glitch bands | random rows shifted: `step(0.72, hash(row))` re-rolled ~14×/s | Tie to scroll speed too |
| Chromatic aberration | sample R, G, B at offsets along the direction from centre | Keep ≤ 0.02 |
| Bloom (cheap) | add `max(textureLod(t, uv, 2/3.5/5) - threshold, 0)` from the mip chain | Only HDR pixels glow |
| Vignette + grain | `smoothstep` on distance from centre; `(hash(fragCoord + time) - 0.5) * 0.035` | Always on, subtle |
| Overlay blur | `mix(col, slate + textureLod(tA, uv, 4.0) * 0.035, amount)` | Replaces CSS backdrop blur |

End with `#include <tonemapping_fragment>` and `#include <colorspace_fragment>`.

## When to use a library instead

- R3F: `@react-three/postprocessing` (EffectComposer, Bloom, Vignette, Noise…) merges effects into
  few passes; good default when you don't need custom transitions.
- WebGPU: `RenderPipeline` with TSL nodes (`pass()`, `bloom()`), see `webgpu.md`.
- Write your own single pass (above) when transitions between worlds are the signature moment.
