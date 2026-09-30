# Decode HUD (opt-in: only when the request names it)

A technical, "receiving a signal" layer of small monospace labels: text decodes from random glyphs,
rules and leader lines draw themselves, and a few numbers flicker like live telemetry. Often anchored
to 3D objects (anchoring itself is in 3d-web). Built from pieces already in this skill; this file
is the recipe for combining them.

## The pieces

| Piece | Technique | Timing |
| --- | --- | --- |
| Label decode | Scramble (`text-reveals.md`: slot technique in proportional fonts; ScrambleText is fine in monospace) with a glyph set like `!<>-_\/[]{}=+*^?#01` | ~0.35s + 18ms per character, capped at 1.6s; 80ms between labels |
| Rules | 1px element, `scaleX: 0 → 1`, `transform-origin` on the anchored side | `base` to `slow` |
| Leader lines | SVG `<path pathLength="1">`, `stroke-dasharray: 1`, `stroke-dashoffset: 1 → 0` | same as rules, starting together |
| Telemetry | Swap a number's text every ~220ms with a small random offset; `tabular-nums` so width never changes | runs only while the label is visible |
| Hover | Quick re-decode of the hovered label (`isTweening` guard so it never stacks) | ~0.4s |

## Code (one HUD node)

```ts
const tl = gsap.timeline()
node.querySelectorAll('[data-text]').forEach((el, i) => tl.add(scrambleIn(el), i * 0.08))
tl.fromTo(node.querySelectorAll('.rule'), { scaleX: 0 }, { scaleX: 1, duration: 0.8, stagger: 0.1 }, 0.1)
tl.fromTo(node.querySelectorAll('.leader'), { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 0.7, stagger: 0.1 }, 0)
```
```html
<svg class="leaders" width="1" height="1" style="overflow: visible" aria-hidden="true">
  <path class="leader" pathLength="1" d="M -150 -196 L -72 -118" />
</svg>
```
- Real text in `data-text`, element starts empty, so the final copy never flashes before the decode.
- Replay on activation (the item becomes current), not on every frame of scroll.

## Rules

- Monospace or tabular numerals only; short labels (≤ 40 characters).
- Glyph flicker ≤ 20 changes per second; stop telemetry when hidden or off screen.
- Screen readers get the final text once (hidden copy, `text-reveals.md`); telemetry numbers are
  `aria-hidden` unless they carry real meaning.
- Reduced motion: labels appear with a 160ms fade, lines appear drawn, telemetry static.
