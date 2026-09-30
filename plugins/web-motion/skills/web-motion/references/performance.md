# Performance

Budget: **60fps while scrolling and interacting on a phone-sized screen with 4x CPU slowdown**, no
frame over about 33ms, no long animation frames over 50ms caused by motion code.

## What is cheap and what isn't

| Cheap (compositor) | Costs paint | Costs layout (avoid) |
| --- | --- | --- |
| `transform` (translate, scale, rotate), `opacity` | `color`, `background-color`, `clip-path`, `filter`, `box-shadow`, SVG attributes, `stroke-dashoffset` | `width`, `height`, `top`, `left`, `margin`, `padding`, `font-size`, `grid-template-*`, changing text |

- Paint-cost properties are fine on **small** elements (a button's colour, a short underline, an icon
  stroke), not on full-width images or sections.
- Instead of animating `width` of a bar, animate `scaleX` with `transform-origin: left`.
- Instead of animating `box-shadow`, fade the `opacity` of a pseudo-element that already has the shadow.
- Instead of `filter: grayscale()` on a big image on hover, fade a tinted overlay.
- Instead of animating many SVG `<rect>` sizes, transform groups or use a `clip-path` on the container.
- Accordions: `grid-template-rows: 0fr → 1fr` is a deliberate layout animation. OK for one small
  panel at a time; never for lists.
- Scramble and typing change text on purpose: keep them short and write only characters that
  changed. Letter slots keep the layout fixed.

## Layout thrashing

Reading layout (`getBoundingClientRect`, `offsetHeight`, `scrollTop`) right after writing styles
forces the browser to recalculate synchronously. Inside a scroll or animation loop this repeats
every frame.

- Never measure in a `scroll` handler. Use ScrollTrigger (it caches positions and refreshes on
  resize), `IntersectionObserver`, or Motion's `useScroll`.
- When you must measure: read everything first, then write everything (never read, write, read, write).
- Measure once on setup and on resize (debounced), not per frame.
- Scroll listeners are `{ passive: true }`.

## `will-change`

GSAP and Motion promote elements while they animate. Only add `will-change: transform` by hand to
something that animates constantly (a cursor follower, a marquee), and never to hundreds of split
letters: every layer costs GPU memory.

## Motion-specific

Motion's `x`, `y`, `scale` shorthands use CSS variables that aren't hardware-accelerated. Fine for a
handful of elements; for many elements or long-running motion, animate `transform` directly or use GSAP/CSS.

## Loops and off-screen work

- Pause infinite CSS animations off screen (`animation-play-state: paused` via `IntersectionObserver`).
- Pause canvas/WebGL loops off screen (see 3d-web).
- Kill ScrollTriggers and tweens on unmount: `useGSAP` does it for you.

## Measure it (paste into the browser console, or run through Playwright)

Records frame times while scrolling the page, which CSS properties animations change, and long
animation frames.

```js
(async () => {
  const props = {}, frames = [], loafs = []
  const parse = (s) => Object.fromEntries((s || '').split(';').map((d) => d.split(':').map((x) => x.trim())).filter(([k]) => k))
  const mo = new MutationObserver((ms) => ms.forEach((m) => {
    const a = parse(m.oldValue), b = parse(m.target.getAttribute('style'))
    for (const k of new Set([...Object.keys(a), ...Object.keys(b)])) if (a[k] !== b[k]) props[k] = (props[k] || 0) + 1
  }))
  mo.observe(document.body, { attributes: true, attributeOldValue: true, attributeFilter: ['style'], subtree: true })
  let last = performance.now(), run = true
  requestAnimationFrame(function loop(t) { frames.push(t - last); last = t; if (run) requestAnimationFrame(loop) })
  try { new PerformanceObserver((l) => l.getEntries().forEach((e) => loafs.push(Math.round(e.duration)))).observe({ type: 'long-animation-frame' }) } catch {}
  for (let y = 0; y < document.documentElement.scrollHeight; y += innerHeight * 0.3) { scrollTo(0, y); await new Promise((r) => setTimeout(r, 60)) }
  await new Promise((r) => setTimeout(r, 1500)); run = false; mo.disconnect()
  const skip = ['offset', 'easing', 'composite', 'computedOffset']
  const cssProps = [...new Set(document.getAnimations().flatMap((a) => a.effect?.getKeyframes().flatMap(Object.keys) ?? []))].filter((k) => !skip.includes(k))
  const f = frames.slice(3).sort((a, b) => a - b)
  console.table({ p50: f[f.length >> 1], p95: f[Math.floor(f.length * 0.95)], over33ms: f.filter((x) => x > 33).length, worstLongFrame: Math.max(0, ...loafs) })
  console.log('style properties that changed (count):', props, 'CSS animation/transition properties:', cssProps)
})()
```

Read the result:
- `over33ms` should be 0 on desktop and near 0 with 4x slowdown.
- Changed properties should be `transform`/`translate`/`rotate`/`scale`, `opacity`, `visibility`.
  Anything like `width`, `height`, `top`, `left`, `margin`, `filter` needs a reason.
- ScrollTrigger pinning writes sizes once when it sets up; that's expected.
- Run it on the production build. Dev servers are slower and add their own work.
