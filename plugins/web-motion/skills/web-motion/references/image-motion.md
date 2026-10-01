# Image motion: placeholders, entrances, cover-and-zoom, group stagger

Photos are the heaviest thing on a page, so they arrive in **two beats**: a colour that is already there,
then the photo easing in over it. Everything here moves only `transform` and `opacity`.

## 1. Colour first, photo second

Put a flat colour (the photo's dominant or average colour) in the box behind the image. The photo
fades in on top; the colour fades out after. There is never an empty hole while the photo loads, and the grid has its overall
tone before any photo shows.

```tsx
<div className="tile" style={{ aspectRatio: '3 / 4', background: colour }}>   {/* the colour box: already visible */}
  <img src={src} alt={alt} width={900} height={1200} style={{ objectFit: 'cover', opacity: 0 }} />
</div>
```
- Get the colour at build time (store it with the asset: Sharp `stats().dominant`, or `thumbhash`/`blurhash` if you want a blurred preview) or in the browser by drawing the image into a 1×1 canvas (same-origin images only).
- The box has a fixed `aspect-ratio` (or width and height), so nothing shifts when the photo arrives. `object-fit: cover`.
- Under reduced motion or with JavaScript off, show the photo directly (`opacity: 1`).

## 2. Entrance: fade in while settling from a slight zoom

| | House (calm) | Showcase / editorial |
| --- | --- | --- |
| Settle zoom | 1.06 → 1 | 1.1 → 1.02 (never exactly 1: it never looks “finished early”) |
| Settle time | 700ms, `ease.out` | 1.8s, `ease.inOut` |
| Fade | 500ms, from the start | 0.8s, starting 0.2s after the zoom |
| Placeholder leaves | after the photo is solid, 200ms | at 2.0s, 0.2s |

Pick the column with the designer (showcase pacing is the immersive/editorial register in `immersive.md`; keep the house column for product UI).

```ts
const tl = gsap.timeline()
tl.to(img, { scale: 1.02, duration: 1.8, ease: 'ease.inOut' }, at)             // settle from ×1.1
  .to(img, { opacity: 1,  duration: 0.8, ease: 'ease.inOutStrong' }, at + 0.2)  // fade a beat later (immersive curve)
  .to(ph,  { opacity: 0,  duration: 0.2, ease: 'none' },       at + 1.2)        // colour leaves last
```
Scale the **image inside a clipping box** (`overflow: hidden`) so the zoom never changes layout.

## 3. Groups: capped stagger, in reading order

- Step and cap come from `presets.md` (70ms, whole group within about 0.5s): `step = min(70, 490 / (n - 1))`.
- **Order:** reading order (left to right, top to bottom). Centre-out only for a symmetric hero cluster; random only for decoration, and then **seeded** so it is the same on every visit.
- **Only stagger what enters together.** For a long grid use `ScrollTrigger.batch(tiles, { start: 'top 92%', once: true, onEnter: (batch) => play(batch) })`: each batch staggers inside itself, so tile 12 never waits for tiles 1 to 11.
- With reduced motion: no zoom and no stagger, one 160ms fade for the whole group.

## 4. Cover and zoom: the photo underneath never stops

When one photo replaces another by *covering* it (a deck, a slideshow on a stage), run three tracks on one window:
the next slide moves up over the current one, its photo fades in as it rises, and the **current photo keeps pushing in** (×1 → ×1.2) while it is being covered.

```ts
// photo 1: pushes in until slide 2 has covered it            (scroll tracks, linear)
{ scale: [[35, 1], [45, 1.2]] }
// photo 2: fades in as its slide rises (35→45), then pushes in while slide 3 covers it (45→55)
{ opacity: [[35, 0], [45, 1]], scale: [[45, 1], [55, 1.2]] }
```
Why it works: a still photo under a moving cover reads as a slideshow; a pushing photo reads as a camera. Give each slide a
colour placeholder behind its photo, so the first frame of a slide is already the right colour.

## 5. Keep it cheap

| Do | Avoid |
| --- | --- |
| Animate `transform` and `opacity` only | Animating `width`, `height`, `top`, `left`, `filter` on photos |
| `object-fit: cover` on a fixed box | Letting the photo's own size set the box |
| Preload the first 1 to 2 photos; lazy-load the rest (the colour makes this safe) | `loading="eager"` on twenty photos |
| One entrance per image, then no repeat motion on scroll | Re-running the entrance each time it re-enters the viewport |
| Serve AVIF/WebP at the displayed size (`sizes`/`srcset`) | A 4000px original in a 300px tile |

`will-change: transform, opacity` only on elements that will animate soon, removed after.
