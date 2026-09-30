# Blending 3D with page UI

## Layer stack (full-screen 3D pages)

```text
z-40  loader / intro                (page-transitions)
z-30  overlays (detail, menus)      real DOM, focus-trapped
z-20  chrome: logo, nav, rail, sound toggle
z-10  text layers + HUD labels      real DOM, pointer-events only on controls
z-0   fixed <canvas>                aria-hidden
      invisible scroll track        gives the page its scrollbar (web-motion one-film scroll)
```
- Text layers are `pointer-events: none` except their buttons/links, so the canvas still gets hover.
- Mark UI panels so the scene ignores the pointer over them (`onPointerEnter → overUI = true`).
- Legibility over bright or moving 3D: a soft `text-shadow` (0 0 18px at ~18% of the dark colour),
  not boxes. Check contrast on the brightest frame.

## HTML labels anchored to 3D

Project the 3D point to screen pixels every frame and move the label with a transform (no React
render):

```ts
v.copy(object.position).project(camera)                  // NDC −1..1
const x = (v.x * 0.5 + 0.5) * width, y = (-v.y * 0.5 + 0.5) * height
label.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0)`
label.style.opacity = String(visibility)                  // e.g. smoothstep on distance from centre
```
- Hide labels behind the camera (`v.z > 1`) or occluded (raycast from camera, or drei `<Html occlude>`).
- drei `<Html>` does this for you inside R3F (with `transform` for 3D-perspective labels).
- Decode/draw-on label animation: web-motion `effects/decode-hud.md` (only when asked).

## 3D inside normal page sections

Don't create a canvas per section (context limit, memory, cost). Use **one fixed canvas** and draw
each section's scene into that section's rectangle:

- R3F: drei `<View track={ref}>` inside one `<Canvas eventSource={document.body}>` with `<View.Port />`.
- Vanilla: for each visible section, read its rect once per frame, then
  `renderer.setViewport(x, y, w, h); renderer.setScissor(x, y, w, h); renderer.setScissorTest(true); renderer.render(scene, camera)`
  (y measured from the bottom of the canvas).
- Skip sections whose rect is off screen. Each section keeps its own camera aspect.

## Overlays over 3D

- Dim and blur the 3D behind an overlay in the post pass (a blurred mip level mixed with a dark
  colour), not with CSS `backdrop-filter` on a full-screen layer (expensive over WebGL).
- Freeze or slow the scene and stop scroll (`lenis.stop()`) while an overlay is open; restore focus
  when it closes.

## Mixing with CSS effects

- CSS `mix-blend-mode` over a WebGL canvas works but forces extra compositing; use sparingly.
- A grain/noise overlay can live in the post pass (cheaper) or as a small tiled CSS background.
- Never put `transform`/`filter` on ancestors of the fixed canvas (it breaks `position: fixed` and
  costs a layer).
