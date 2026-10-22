# Scroll- and pointer-driven 3D

Choreography, curves and scroll mapping live in **web-motion** (`progress-mapping.md`, and
`effects/one-film-scroll.md` when the whole page is one timeline). This file covers what's specific
to 3D.

## Scroll → dials → scene

- The scroll timeline tweens numbers in a dials object (`rise`, `explode`, `carousel`, `scene`…).
- Each scene reads its dials in the frame loop and turns them into transforms, uniforms, fog,
  camera positions. Nothing in the timeline knows about three.js.
- Per-object timing from data (stagger windows) turns one dial into hundreds of individual moves:
  bricks exploding top-first, particles gathering from a cloud with a random delay each.
- Carousels in 3D: a float dial = index of the centred item; each item's offset = `dial - i`; scale,
  opacity and HUD visibility come from `smoothstep` on `|offset|`.

## Pointer

- Normalised pointer (−1..1) + a damped copy (λ ≈ 3.5) — web-motion `progress-mapping.md` §4–5.
- Camera parallax from the damped copy; hit-testing from the raw one.
- Only react when it makes sense: the pointer has moved at least once (`hasPointer`), it isn't over a
  UI panel (`overUI`), the scene is the one on screen (weight > 0.9), no overlay is open.

## Picking (what is under the cursor?)

| Case | Technique |
| --- | --- |
| A few meshes | `raycaster.setFromCamera(ndc, camera); raycaster.intersectObjects(list, false)` |
| Many instances / heavy meshes | Test a simple proxy shape: an analytic ray–sphere or ray–plane hit, or `three-mesh-bvh` for exact hits |
| Effects around the cursor | Ray–plane hit through the object's centre, converted to the object's local space (`worldToLocal`) |

Ray–sphere (a dome, a planet) in three lines:
```ts
const b = o.dot(d), c = o.lengthSq() - R * R, disc = b * b - c   // o, d = ray origin, direction (sphere at 0)
if (disc > 0) hit.copy(o).addScaledVector(d, -b - Math.sqrt(disc))
```

## Gestures

- Hover amounts per object are damped (λ 6 to 8) so things lift and settle smoothly.
- Click vs drag: pointer up within 350ms and moved < 6px = click (select, shockwave); otherwise drag.
- Drag to spin with inertia: `spinVel += movementX * 0.0022`, then `spinVel = damp(spinVel, 0, 2.2, dt)`.
- Set the cursor (`pointer`, `grab`, `grabbing`) from the frame loop only when it changes, and reset
  it on unmount.
- Keyboard: every clickable 3D thing has a DOM button equivalent (the HUD label, a list).

## Reduced motion

No scroll scrubbing of the camera, no parallax, no auto-rotation. Show each act as a still (dials at
their resting values) or the poster; interactions that don't move the camera (select, open detail)
stay.

## Virtual, looping scroll (the page never scrolls)

For a canvas-is-the-page site, wheel, touch drag and keys move a number measured in **screens**:

```ts
// per frame, in the controller's render
targetY1 = lerpFPSLimited(targetY1, targetY2, 0.075, 100 * K);   // speed limit
y        = lerpFPS(y, targetY1, 0.15);                           // follow
targetY2 = clamp(targetY2, y - 750 * K, y + 750 * K);            // input may not run far ahead
velocity = (velocity + |y - prevY|) * frictionFPS(0.98), clamped 0..1   // feeds shaders
```
`K` converts wheel pixels to screens (≈ 0.00075). Sections are stacked end to end with lengths in screens and
the total **loops** (`y % total`, careful with negatives). At most two sections overlap the viewport.

- **Auto-centre after a pause (~1.4 s idle):** tween to the nearest section edge, or to a section's preferred
  resting points; sync `targetY1/targetY2` in `onUpdate` so input does not fight the tween; ignore input while it
  runs and during route transitions.
- Wheel: `preventDefault` on the canvas, ×33 for Firefox line mode, keep `position`, `delta` and a decaying
  `velocity`; treat `ctrlKey` as pinch.
- Keyboard (arrows), touch drag and Escape/close must reach every state; provide DOM text alternatives (see rule 7).
- Resize resets the targets to the current `y` so nothing jumps.
