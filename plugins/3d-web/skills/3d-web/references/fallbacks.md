# Fallbacks

Every 3D experience has a **poster**: a designed still image (or a few, one per act) that tells the
same story. It is the loading state, the no-WebGL state, the lost-context state and the
reduced-motion state.

## When to show the poster

| Situation | Detect | Show |
| --- | --- | --- |
| Loading | before the first rendered frame | Poster, cross-fade to live 3D after the first frame |
| No WebGL 2 | `canvas.getContext('webgl2')` is null; R3F `<Canvas fallback>`; error boundary | Poster |
| Context lost (GPU reset, memory pressure, too many contexts) | `webglcontextlost` event | Poster; try to restore on `webglcontextrestored` |
| Reduced motion | `matchMedia('(prefers-reduced-motion: reduce)')`, read live | Poster or a still, non-scrubbed scene (designer's choice per project) |
| Too slow even on the low tier | runtime monitor falls through | Poster |
| Missing capability (float render targets for GPGPU) | `gl.getExtension('EXT_color_buffer_float')` | Lighter effect (CPU particles) or poster for that part |
| WebGPU wanted | `await navigator.gpu?.requestAdapter()` | `WebGPURenderer` falls back to WebGL 2 by itself (`webgpu.md`) |

## Context loss

```ts
canvas.addEventListener('webglcontextlost', (e) => { e.preventDefault(); stopLoop(); showPoster() })
canvas.addEventListener('webglcontextrestored', () => { rebuildGpuResources(); hidePoster(); startLoop() })
```
- `preventDefault()` tells the browser you want the context back.
- three.js re-uploads most things itself; render targets and anything created outside three.js must
  be rebuilt. If restore doesn't come within a few seconds, stay on the poster.
- Test it: get the extension **before** losing the context (`const ext = gl.getExtension('WEBGL_lose_context')`;
  after a loss `getExtension` returns null), then `ext.loseContext()` and `ext.restoreContext()`.
- Don't call `renderer.forceContextLoss()` on a context that is already lost (it warns and does nothing).

## Making the poster

- Designed, not a screenshot of a loading state: the hero moment, correct colours, the same framing
  as the live first frame (so the cross-fade is invisible).
- One per act for scroll stories (reduced-motion version = the acts as normal sections with their posters).
- Serve responsive sizes (`<img srcset>` / `next/image`), AVIF/WebP, with `alt` text describing it.
- Can be captured from the scene during development (`renderer.domElement.toDataURL()` after a
  render with `preserveDrawingBuffer: true`), then art-directed.

## Reduced motion for 3D

- No camera travel on scroll, no parallax, no auto-rotation, no particles flying.
- Keep: selecting things, opening details, static lighting.
- Scroll stories become normal sections (still per act + text). Read the setting live.
