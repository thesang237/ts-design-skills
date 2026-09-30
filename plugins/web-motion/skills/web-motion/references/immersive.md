# Immersive-site mode

For WebGL and scroll-storytelling sites **the designer has called immersive**. Everywhere else (and
for every product UI inside such a site: menus, forms, settings) the house presets in `presets.md`
apply unchanged. Values taken from studying a scroll-driven WebGL site and approved by the designer
on 2026-09-30.

## What changes

| Preset | House | Immersive | Use it for |
| --- | --- | --- | --- |
| Arrival curve | `ease-out` (0.22, 1, 0.36, 1) | `ease-out-strong` **(0.16, 1, 0.3, 1)** | Text rising over 3D, captions, HUD labels, overlay content |
| Travel curve | `ease-in-out` (0.65, 0, 0.35, 1) | `ease-in-out-strong` **(0.76, 0, 0.24, 1)** | Carousel snaps, scene-to-scene moves that must "park" |
| Text reveal | 700ms | **900 to 1000ms** | Masked line/word rises in hero and captions |
| Word tilt | none | **up to 4°** on masked word rises | "Tossed, not slid" captions |
| Release | none (no elastic) | **elastic.out(1, 0.45), 800ms** | Magnetic buttons returning to rest, only |
| Draw-on | `base` | **1.2 to 1.4s, strong in-out** | Logo strokes, rules and leader lines in a HUD |

## What never changes

- Scroll-scrubbed timelines stay linear (`ease: 'none'` default); curves go on individual tweens.
- Press 0.97, hover 160ms, menus 240ms: product UI stays fast.
- Reduced motion: same recipes as the house style (fades only, no scrub, no travel).
- Springs for drag and gestures stay the house spring.

## Wiring

```ts
// presets.ts
export const EASE_IMMERSIVE = { out: [0.16, 1, 0.3, 1], inOut: [0.76, 0, 0.24, 1] } as const
export const DUR_IMMERSIVE = { reveal: 950, draw: 1300, release: 800 } as const

// GSAP names, registered next to the house ones
CustomEase.create('ease.outStrong', path(EASE_IMMERSIVE.out))
CustomEase.create('ease.inOutStrong', path(EASE_IMMERSIVE.inOut))
```
```css
.immersive { --ease-out: cubic-bezier(0.16, 1, 0.3, 1); --dur-reveal: 950ms; }  /* scope, never global */
```
Scope the mode to the immersive part of the site with a class, so a shared component used on a normal
page keeps the house feel.
