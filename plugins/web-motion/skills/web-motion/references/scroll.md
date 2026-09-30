# Scroll motion

Two different things:
- **Scroll-triggered**: crossing a point *starts* a normal, timed animation (a reveal). The animation
  keeps its own duration and curve.
- **Scroll-linked (scrubbed)**: the scroll position *is* the playhead (parallax, progress bars,
  pinned sequences). Always `linear`, no duration.

## Scroll-triggered reveals

Trigger when the top of the element passes about 85 to 88% of the viewport height, so it is clearly
on screen but not late.

**Motion (blocks and groups):**
```tsx
<motion.section initial={{ opacity: 0, y: 18 }} whileInView={{ opacity: 1, y: 0 }}
  viewport={{ once: true, amount: 0.25 }} />
```

**GSAP ScrollTrigger (text, timelines):** create the timeline paused and let the trigger play or
reverse it, so enter and exit are one interruptible animation.
```ts
const tl = gsap.timeline({ paused: true }).from(units, { yPercent: 120, stagger: staggerStep(units.length) })
ScrollTrigger.create({
  trigger: el, start: 'top 88%', end: 'bottom 12%',
  once: true,               // "every time": remove once and add onLeave / onLeaveBack
  onEnter: () => tl.play(),
  onEnterBack: () => tl.play(),   // also reveal things scrolled past before the page was ready
  // onLeave: () => tl.timeScale(1 / 0.6).reverse(), onLeaveBack: same
})
```
Many similar elements: `ScrollTrigger.batch('.card', { onEnter: (els) => gsap.from(els, {...}) })`
groups those entering together so the stagger stays correct.

**No library:** one shared `IntersectionObserver` that adds `data-inview`, with the animation in CSS.
```ts
const io = new IntersectionObserver((entries) => entries.forEach((e) => {
  if (e.isIntersecting) { e.target.setAttribute('data-inview', ''); io.unobserve(e.target) }
}), { rootMargin: '0px 0px -12% 0px' })
document.querySelectorAll('[data-reveal]').forEach((el) => io.observe(el))
```
```css
.js [data-reveal] { opacity: 0; transform: translateY(var(--rise)); transition: opacity var(--dur-reveal) var(--ease-out), transform var(--dur-reveal) var(--ease-out); }
.js [data-reveal][data-inview] { opacity: 1; transform: none; }
```
`.js` is added by a one-line inline script in `<head>`, so content is never hidden without JavaScript.

## Scroll-linked (scrubbed)

For whole sections whose heading, text and UI enter, hold still and exit with the scroll (pinned or
in flow, with rewind / play back / stay options when scrolling up), see `scroll-scenes.md`.

- GSAP: `scrollTrigger: { scrub: true }` (or `scrub: 0.5` for a short catch-up). Pin with `pin: true`
  and keep pinned sections short; long pins feel like being stuck.
- Motion: `const { scrollYProgress } = useScroll({ target, offset: ['start end', 'end start'] })`,
  then `useTransform`. Runs on the browser's native scroll timeline when possible.
- CSS: `animation-timeline: view()` inside `@supports (animation-timeline: view())`. Firefox stable
  doesn't support it yet (2026-09), so it must be a pure enhancement.
- Parallax: small offsets (10 to 20% of the element's height), `transform` only, never on text people read.
- Progress bars: animate `scaleX` with `transform-origin: left`, never `width`.

## Smooth scrolling (Lenis): opt-in only

Only for editorial or portfolio sites, never for apps and dashboards. Setup that stays in sync with
ScrollTrigger:

```ts
import Lenis from 'lenis'
import 'lenis/dist/lenis.css'

const lenis = new Lenis({ lerp: 0.1, smoothWheel: true, syncTouch: false, anchors: true })
lenis.on('scroll', ScrollTrigger.update)
gsap.ticker.add((time) => lenis.raf(time * 1000))
gsap.ticker.lagSmoothing(0)
```
React: `<ReactLenis root options={{ autoRaf: false, anchors: true }} ref={lenisRef}>` plus the same ticker lines.

- **Lenis 1.3.26+ turns smoothing off for reduced motion by default.** Older versions don't: upgrade,
  or don't start it when `(prefers-reduced-motion: reduce)` matches.
- Touch stays native (`syncTouch: false`).
- On route change: `lenis.scrollTo(0, { immediate: true })`.
- Nested scroll areas (menus, modals, code blocks): add `data-lenis-prevent`.
- Lenis doesn't support CSS scroll-snap; use `lenis/snap` or skip smooth scrolling on that page.

## Things that keep scroll motion correct

- `ScrollTrigger.config({ ignoreMobileResize: true })`: the phone address bar showing and hiding
  must not recalculate every trigger.
- Create triggers top-to-bottom, or set `refreshPriority`, when pins change positions below them.
- After fonts or images change heights, call `ScrollTrigger.refresh()` once, not on every load event.
- Never read layout (`getBoundingClientRect`, `offsetTop`) in a scroll handler. For "navbar changes
  colour over dark sections", use one ScrollTrigger per section with `toggleClass`, or an
  `IntersectionObserver`.
- Remove `markers: true` before shipping.
- Reduced motion: no scrubbing, no parallax, no pinning sequences that animate; show the end state
  (see `reduced-motion.md`).
