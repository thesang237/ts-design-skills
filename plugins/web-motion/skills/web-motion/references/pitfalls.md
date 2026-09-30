# Pitfalls

Found by auditing a real portfolio project (14 pages measured in Chromium, Firefox and WebKit,
normal, reduced motion, and phone with 4x CPU slowdown) and by building the demo. Names removed.

## Taste drift

- **Eleven custom curves, 25 GSAP eases, durations from 0.1s to 1.6s** across one site. Two
  different "ease-out" constants lived in two files. The shared reveal component defaulted to 1.6s
  with 48px travel, contradicting the project's own "keep UI under 300ms" guidance.
  Fix: one presets file; components read names, never numbers.
- **The guide page taught rules the code didn't follow** (reduced motion, hover gating, Lenis +
  ScrollTrigger sync were all documented, not implemented). Put rules in shared components, not only docs.

## Reduced motion

- **Measured: with reduced motion on, every page moved exactly as much as before.** Only a
  handful of CSS rules existed, and the GSAP example was never used.
- Lenis older than 1.3.26 ignores reduced motion. Upgrade, or don't start it for those users.

## Performance

- Animating the heights of 180 SVG rectangles on scroll dropped about 13 frames per pass, the only
  janky page in the audit. Transform groups, or clip the container instead.
- Progress bars driven by `style.width` on every scroll update: use `scaleX`.
- Hover effects animating `filter: saturate() brightness()` on large images: fade an overlay instead.
- A navbar that measured five sections with `getBoundingClientRect()` on every scroll event (not
  passive, not throttled). Use ScrollTrigger `toggleClass` or `IntersectionObserver`.
- An "in view?" helper that could never return true (`Math.abs(x) < 0`), so the "already on screen"
  branch never ran. Test helpers like this with an element in view at load.

## React and cleanup

- 23 files ran GSAP inside a plain `useEffect`, cleaning up by hand (one killed ScrollTriggers by
  matching a selector string). Use `useGSAP()`; it reverts everything it created.
- Both `framer-motion` and `motion` installed: two copies of the same library. Use `motion`, import `motion/react`.
- React rendered text inside an element that SplitText then split. Changing that text prop later
  makes React update nodes that no longer exist. Render the animated layer empty and let the
  engine fill it (see `text-reveals.md`).

## Text effects (found while building the demo)

- **SplitText re-split mid-animation froze the text halfway.** With `autoSplit`, SplitText reverts the
  old timeline, calls `onSplit`, then moves the new timeline's playhead to the old time. If the new
  timeline is created paused, it stays frozen there. Track whether an enter/exit is in progress and
  resume it in `onSplit`. Test: resize the window during a reveal and during an exit.
- Mask boxes clip descenders unless padded (and the padding cancelled with negative margin); then
  the hidden position must be about 120%, not 100%, or the tops of letters peek through the padding.
- `aria-label` on a `<p>` or `<span>` is ignored by screen readers; use a visually hidden copy.
- A scramble that swaps letters in a proportional font jitters the line width every frame. Keep
  the real letter in place (hidden) and overlay the random glyph.
- A typing caret inserted as an element pushes the text on each keystroke and at line ends. Draw it
  as a pseudo-element with `position: absolute`.

## Scroll and smooth scrolling

- The shared Lenis wrapper drove Lenis from GSAP's ticker but never called `ScrollTrigger.update` on
  Lenis's scroll event, and never set `lagSmoothing(0)` or loaded `lenis.css`. Triggers can lag
  behind the smoothed position.
- CSS `animation-timeline` used without an `@supports` check. Firefox stable doesn't run it
  (2026-09), so the un-animated state must be the finished, readable one.
- Mobile address bar resizes re-running every ScrollTrigger: `ScrollTrigger.config({ ignoreMobileResize: true })`.

## Touch and hover

- Hover animations bound to `mouseenter` with no pointer check also fire on tap on phones, leaving
  "stuck" hover states. Gate with `(hover: hover) and (pointer: fine)`.
- A hover grid caused horizontal scrolling on phones. Check `scrollWidth <= innerWidth` at 390px wide.
- iOS doesn't show `:active` without a touch listener.
- Motion's `dragSnapToOrigin` returns with its own inertia physics, not the house spring.
