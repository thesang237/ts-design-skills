# Camera and lighting presets

## Lens (field of view)

| FOV | Feel | Use |
| --- | --- | --- |
| 25 to 32° | Long lens: flat, calm, cinematic | Hero objects, landscapes seen from afar |
| 35 to 45° | Natural | Product views, carousels |
| 50 to 70° | Wide: energetic, distorted edges | Interiors, walk-throughs |
| 80 to 100° | Very wide, only while moving | A "dive through" moment, animated back afterwards |

**Portrait screens:** keep the horizontal framing by widening the vertical FOV when the aspect is
narrower than the design aspect:

```ts
export const fitFov = (fov: number, aspect: number, designAspect = 1.3) => {
  if (aspect >= designAspect) return fov
  const half = Math.atan(Math.tan((fov * Math.PI) / 360) * (designAspect / aspect))
  return Math.min(150, (half * 360) / Math.PI)
}
camera.fov = fitFov(30, camera.aspect); camera.updateProjectionMatrix()
```

## Camera rails (scroll or time driven)

No orbit controls on story pages. Two or three keyframe positions + targets, blended by dials:

```ts
const ei = easeInOut(dials.intro)          // loader → hero
const rise = easeInOut(dials.rise)         // scroll → rise above the subject
pos.copy(START).lerp(HERO, ei).lerp(RISE, rise)
target.copy(HERO_TARGET).lerp(RISE_TARGET, rise)
camera.position.set(pos.x + smooth.x * 0.55, pos.y + smooth.y * 0.3 + Math.sin(t * 0.3) * 0.04, pos.z)
camera.lookAt(target)
camera.fov = fitFov(lerp(lerp(38, 30, ei), 44, rise), camera.aspect)
camera.updateProjectionMatrix()
```
- A 0.04-unit sine "breath" and ±0.3 to 0.6 units of pointer parallax keep a still shot alive.
- Product viewers that must be explored: drei `<OrbitControls>` or `<PresentationControls>` with
  limits, damping and no zoom on scroll (it steals page scroll).

## Lighting presets

| Preset | Recipe | Mood |
| --- | --- | --- |
| **Soft studio** | Hemisphere (sky `#dfe6ef`, ground `#5d6574`, 0.8) + one directional key (1.5 to 2, from upper left) + room environment × 0.35 | Clean product, readable forms |
| **Foggy exterior** | Studio preset + `scene.background` = fog colour + `FogExp2(colour, 0.02 to 0.04)` | Atmosphere, no horizon line, depth for free |
| **Glowing interior** | A point light inside the object (shadows on) + a tiny HDR "core" (colour × 2 to 4, `toneMapped: false`) + a dim backing surface behind gaps | Light leaking through seams, warmth in cold scenes |
| **Dark stage** | Low hemisphere (0.2), rim directional behind the subject, a spot from above, bloom on | Premium, dramatic |

Rules: one key light with shadows at most (a second only if the look needs it); animate intensity
with two sines at odd frequencies for a natural flicker (`sin(t·11.3)·0.5 + sin(t·6.7+1.3)·0.5`).

## Fog as a design tool

- Background colour = fog colour → the horizon disappears; the world fades into weather.
- Animate density with the story: thick while loading (hides pop-in), clear for the hero, thicker for
  drama.
- Several scenes that cross-fade: backgrounds within a few % of each other so the sky barely shifts.

## Shadows

- `shadow.mapSize` 1024 (512 on low tier); fit the shadow camera tightly around the subject
  (`left/right/top/bottom` ±6 instead of the default huge box) for sharp shadows.
- `shadow.bias ≈ -0.0004`, `normalBias ≈ 0.02` against acne; point lights need larger normal bias.
- Low tier: shadows off, a soft blob (radial gradient plane) under the object instead.

## Tone mapping

| Mapping | Use |
| --- | --- |
| `NeutralToneMapping` | Faithful colours: products, brand colours, UI-matched scenes |
| `ACESFilmicToneMapping` / `AgXToneMapping` | Cinematic contrast and highlight roll-off |
| `NoToneMapping` (R3F `flat`) | Flat, illustrative scenes where colours must equal the design file |
