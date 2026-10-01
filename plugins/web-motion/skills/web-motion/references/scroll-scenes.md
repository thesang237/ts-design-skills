# Scroll scenes: enter, hold, exit mapped to the scroll

A section's heading, short description and UI (chips, buttons, cards) **enter as the visitor
scrolls to it, hold still while they read, then exit**, with progress tied to the scroll position
rather than a timer. Working version with every option: `demos/web-motion/src/components/ScrollScenes.tsx`.

## Decisions to make (ask the designer)

| Option | Choices | Default |
| --- | --- | --- |
| Layout | **Pinned**: the section holds perfectly still on screen (a tall section with a `position: sticky` stage) · **In flow**: content scrolls with the page | Pinned for a few key moments, In flow for everything else |
| Hold | Share of the scroll range where nothing moves: short 20% · medium 40% · long 55%. Enter and exit split the rest | Medium |
| Scroll up through the **enter** | **Rewind** (plays backwards with the scroll) · **Play back** (plays backwards on its own, timed, once you scroll back into it) · **Stay** (once entered, never un-enters) | Rewind |
| Scroll up through the **exit** | **Rewind** · **Play back** (content returns on its own in `reveal` time as soon as you scroll back into it) | Rewind |
| Smoothing | A 0.35s catch-up so mouse-wheel steps don't look choppy · or exact | On |

Keep scenes rare: one to three per page. A whole page of pinned scenes makes reading slow.

## Which tool

| Need | Tool |
| --- | --- |
| Full control, direction options, split text, any browser | **GSAP ScrollTrigger** + one timeline (below) |
| React, simple fades/moves per element, rewind only | **Motion `useScroll` + `useTransform`** |
| No JavaScript, rewind only, enhancement only | **CSS `animation-timeline: view()`** with `animation-range` (not in Firefox stable, 2026-09) |

## GSAP: one timeline, three segments

Build **one** paused timeline of total length 1: enter, an empty hold, exit. Map scroll progress onto
it. One timeline means scrubbing backwards is always consistent.

```ts
const enterEnd = (1 - hold) / 2          // 0.3 for a 40% hold
const exitStart = enterEnd + hold         // 0.7

const enter = gsap.timeline({ defaults: { ease: 'ease.inOut' } })
  .fromTo(eyebrow, { opacity: 0, y: 18 }, { opacity: 1, y: 0, duration: 0.5 }, 0)
  .fromTo(lines,   { yPercent: 120 },     { yPercent: 0, duration: 0.7, stagger: staggerStep(lines.length) }, 0.05)
  .fromTo(words,   { opacity: 0, y: 18 }, { opacity: 1, y: 0, duration: 0.6, stagger: staggerStep(words.length, 'words') }, 0.2)
  .fromTo(uiItems, { opacity: 0, y: 18 }, { opacity: 1, y: 0, duration: 0.6, stagger: staggerStep(uiItems.length) }, 0.35)

const exit = gsap.timeline({ defaults: { ease: 'ease.inOut' } })
  .fromTo(lines, { yPercent: 0 }, { yPercent: -120, duration: 0.5, stagger: staggerStep(lines.length) * 0.6, immediateRender: false }, 0)
  .fromTo([eyebrow, descBlock, ...uiItems], { opacity: 1, y: 0 }, { opacity: 0, y: -18, duration: 0.45, stagger: 0.03, immediateRender: false }, 0.05)

enter.duration(enterEnd)                 // squeeze each segment into its share of the scroll
exit.duration(1 - exitStart)
const master = gsap.timeline({ paused: true }).add(enter, 0).add(exit, exitStart)
```

Rules inside the timeline:
- **Enter animates the pieces (lines, words, chips); exit animates their containers** (description
  block, eyebrow). Where both must touch the same property (the masked lines), use `fromTo` with
  `immediateRender: false` on the exit so it doesn't overwrite the enter's start state at build time.
- **Use the gentle in-out curve (or `none`) for scroll-mapped pieces.** The scroll is the pacing; a
  strong ease-out finishes each piece in the first half of its range and then nothing happens.
- Exit is shorter and travels less than enter, and leans upward (the direction the page moves).
- Keep `opacity` (not `autoAlpha`/`visibility`) for UI pieces, so buttons stay focusable.

### Mapping and the scroll-up options

```ts
const pinned = layout === 'pinned'
ScrollTrigger.create({
  trigger: pinned ? section : content,
  start: pinned ? 'top 50%' : 'top 88%',        // pinned: enter while the stage arrives...
  end: pinned ? 'bottom bottom' : 'bottom 12%',  // ...and finish the exit before it scrolls away
  onUpdate: (self) => drive(self.progress, self.direction),
})

let entered = false, playingTo = null
function drive(p, dir, instant = false) {
  let target = p
  if (upEnter === 'stay' && entered) target = Math.max(target, enterEnd)
  if (dir < 0 && p > exitStart && upExit === 'play') return playTo(enterEnd, DUR.reveal, 1 - exitStart)
  if (dir < 0 && p < enterEnd && upEnter === 'play') return playTo(0, exitMs(DUR.reveal), enterEnd)
  if (target >= enterEnd) entered = true
  scrubTo(target, instant)
}
const scrubTo = (target, instant) => {
  playingTo = null
  if (instant || !smooth) { gsap.killTweensOf(master); master.progress(target) }
  else gsap.to(master, { progress: target, duration: 0.35, ease: 'ease.out', overwrite: true })
}
const playTo = (target, ms, span) => {                     // timed, independent of the scroll
  if (playingTo === target) return
  playingTo = target
  const duration = (Math.abs(master.progress() - target) / span) * (ms / 1000)
  gsap.to(master, { progress: target, duration, ease: 'none', overwrite: true, onComplete: () => (playingTo = null) })
}
drive(trigger.progress, 1, true)   // correct state when the page loads already scrolled
```

### Pinned layout without a JS pin

```css
.scene { height: 250vh; }                                  /* scroll length of the scene */
.scene-stage { position: sticky; top: 0; height: 100vh; height: 100svh; display: grid; align-content: center; }
```
`position: sticky` needs no pin spacer and never jumps. It fails silently if any ancestor has
`overflow: hidden/auto` (use `overflow: clip` for horizontal clipping instead).

### Split text in a scene

Split lines with `mask: 'lines'` and `autoSplit: true`. In `onSplit`, rebuild the master timeline
and return it: SplitText restores the playhead after a re-split, so a resize mid-scroll doesn't jump.

## Motion (React)

`useTransform` with several stops expresses enter, hold and exit in one line per property:

```tsx
const ref = useRef(null)
const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] })
const y = useTransform(scrollYProgress, [0, 0.3, 0.7, 1], [18, 0, 0, -18])
const opacity = useTransform(scrollYProgress, [0, 0.3, 0.7, 1], [0, 1, 1, 0])
return <motion.div ref={ref} style={{ y, opacity }} />
```
Stagger by giving each piece slightly shifted stops (heading `[0, .25, …]`, text `[.05, .3, …]`).
Rewind only; for play-back or stay options use the GSAP version.

## CSS only (enhancement)

Each piece gets its own enter and exit range on its view timeline, so the stagger is in scroll distance:

```css
@supports (animation-timeline: view()) {
  @media (prefers-reduced-motion: no-preference) {
    .scene-piece { animation: piece-in linear both, piece-out linear forwards; animation-timeline: view(), view(); }
    .scene-eyebrow { animation-range: entry 0% cover 30%, exit 20% exit 80%; }
    .scene-title   { animation-range: entry 10% cover 36%, exit 10% exit 70%; }
    .scene-desc    { animation-range: entry 20% cover 42%, exit 0% exit 60%; }
  }
}
@keyframes piece-in  { from { opacity: 0; transform: translateY(var(--rise)); } }
@keyframes piece-out { to   { opacity: 0; transform: translateY(calc(var(--rise) * -1)); } }
```
Without support (Firefox stable today) the content is simply shown, so the un-animated state must
be the readable one. Named ranges: `entry` (coming in at the bottom), `contain`/`cover` (on screen),
`exit` (leaving at the top).

## Many layers, a pinned stage, a Lottie

For a stage with several independent layers (photos rising, a slide deck, a counter) or a long scrubbed story, use keyframe **tracks** on
one progress instead of one enter/hold/exit timeline: `scroll-stage.md`. For images arriving or covering each other: `image-motion.md`.

## Reduced motion

No scrubbing, no pinning: switch to the in-flow layout, show the content, one short fade the first
time it appears. The CSS version sits inside `prefers-reduced-motion: no-preference`.

## Accessibility and robustness

- Headings and text use the hidden-copy structure from `text-reveals.md`, so screen readers read
  them normally regardless of scroll position.
- Moving keyboard focus into a scene shows it (`focusin` → scrub to the hold).
- Reload halfway down: `drive(progress, 1, true)` puts every scene in its correct state at once.
- Test both directions at a slow and a fast scroll, in all three engines, at phone size (the sticky
  stage must use `100svh` so the address bar doesn't make it jump).
