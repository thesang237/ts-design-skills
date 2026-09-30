# Scroll-speed reactions (opt-in: only when the request names it)

The page reacts to **how fast** you scroll, not only where you are: a flick adds a hint of glitch,
chromatic split, skew, blur or louder wind, and it calms down as soon as you slow. Subtle is the
point; at rest the page must look untouched.

## The signal

```ts
// with Lenis
lenis.on('scroll', () => { velocity.raw = lenis.velocity })   // px per frame, signed

// every frame: decay toward 0 so the effect fades after the scroll stops, then normalise
velocity.smooth = damp(velocity.smooth, velocity.raw, 6, dt)
velocity.raw = damp(velocity.raw, 0, 2, dt)
const amount = Math.min(Math.abs(velocity.smooth) / 40, 1)    // 0 at rest, 1 on a hard flick
```
Without Lenis: `ScrollTrigger.create({ onUpdate: (self) => (raw = self.getVelocity() / 1000) })`.

## What to drive (pick one or two)

| Target | Mapping | Cap |
| --- | --- | --- |
| Skew of a text or image strip | `skewY = amount * 4deg` | 4° |
| Chromatic split / glitch bands (WebGL post pass) | offset `0.004 * amount` | see 3d-web |
| A marquee's speed | `baseSpeed * (1 + amount * 3)` | 4× |
| Ambient sound (wind filter, see 3d-web sound) | filter resonance `0.7 + amount * 2.5` | only when sound is on |
| Blur | avoid on large areas (paint cost); fine on a small label | 2px |

Use `transform` for DOM effects (skew via `quickTo`), uniforms for WebGL.

## Rules

- **At rest = zero effect.** Check a screenshot after scrolling stops for one second.
- Never on reading text people are in the middle of; on decorative strips, images, 3D and HUD.
- Reduced motion: disabled entirely (amount = 0).
- Clamp everything; a trackpad fling can report huge values.
