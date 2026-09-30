# One-film scroll page (opt-in: only when the request names it)

The whole page plays like one continuous shot. **Scroll is the playhead of a single master
timeline**, measured in screens of scroll. Different from `scroll-scenes.md` (one section enters,
holds, exits): here every scene, camera move and text layer shares one clock, overlaps precisely,
reverses perfectly and can loop.

## Anatomy

```text
fixed layers (canvas, text, UI)          ← nothing actually scrolls past you
invisible track: (TOTAL + 1) × 100vh     ← only gives the browser a scrollbar
ScrollTrigger (track top → bottom) ──► master timeline (TOTAL units) ──► dials object ──► renderers & DOM
```

- **Units = screens.** TOTAL = 16 means 16 screens of scrolling; a 1.5-long tween takes one and a
  half flicks of the wheel. The track is `TOTAL + 1` screens tall because the last screen is filled
  by the viewport itself.
- **Tween numbers, not only elements.** A plain object holds the dials (`scene`, `explode`,
  `cameraRise`, `carousel`…). The timeline writes them; WebGL scenes and components read them every
  frame. DOM layers (hero copy, ghost text) go on the same timeline.
- **`ease: 'none'` by default, `scrub: true`.** Smooth scrolling already smooths; curves only on
  tweens that need character (a carousel that parks on each item).
- **Overlap acts** by 0.3 to 0.5 screens so it never feels like slides.

## Code

```ts
const dials = { scene: 0, rise: 0, explode: 0, carousel: -0.8 }      // plain object, not React state

useGSAP(() => {
  const tl = gsap.timeline({ defaults: { ease: 'none' } })
  tl.to('.hero', { autoAlpha: 0, y: -30, duration: 0.7 }, 0.15)      // position = screen number
    .to(dials, { rise: 1, duration: 1.7, ease: 'ease.inOut' }, 0.2)
    .to(dials, { explode: 1, duration: 1.5 }, 0.3)
    .to(dials, { scene: 1, duration: 1, ease: 'ease.inOut' }, 1.3)    // cross-fade to act 2
    .to(dials, { carousel: 1, duration: 1.45, ease: 'ease.inOut' }, 2.4)
    .set({}, {}, TOTAL)                                              // pad to exactly TOTAL

  ScrollTrigger.create({
    trigger: track.current, start: 'top top', end: 'bottom bottom',
    animation: tl, scrub: true,
    onUpdate: (self) => {                                            // discrete UI, see progress-mapping.md §6
      const s = sectionAt(self.progress * TOTAL)
      if (s !== current) { current = s; setSection(s) }
      railFill.style.transform = `scaleY(${self.progress})`
    },
  })
})
return <div ref={track} aria-hidden style={{ height: `${(TOTAL + 1) * 100}vh` }} />
```

## Around the timeline

- **Storyboard first**, in screens: act, from, to, what moves. Write it as data; the timeline reads it.
- **Section rail + jump links:** `lenis.scrollTo(at * innerHeight, { duration: 2.4 })` fast-forwards
  through the film instead of cutting.
- **Captions** that decode or rise play on their own clock, remounted per section (`key={section}`).
- **Intro lock:** `lenis.stop()` until the intro finishes, then `lenis.start()`; also stop while an
  overlay is open. `history.scrollRestoration = 'manual'` and scroll to 0 on load, so a reload never
  lands mid-story with half-built scenes.
- **Looping:** Lenis `infinite: true` (needs `syncTouch: true` on touch) plus a final act that rebuilds
  the first scene, so the wrap is invisible.
- **Scroll speed** (`lenis.velocity`) is available for `scroll-velocity.md` effects.

## Reduced motion and accessibility

- Reduced motion: no scrub. Show each act as a still, in-flow section with its text (the dials set to
  each act's resting values), one short fade per section; no loop.
- All text lives in the DOM (never only in canvas); headings in order; the rail is real buttons.
- Keyboard: Page Down / Space scroll the film; rail buttons are focusable and labelled.

## Checklist

- [ ] Storyboard table exists and matches the timeline positions
- [ ] Track height = (TOTAL + 1) × 100vh; `.set({}, {}, TOTAL)` pads the timeline
- [ ] Only discrete changes reach React; per-frame values stay in the dials object
- [ ] Reload anywhere starts at the top with the intro; scroll locked until it ends
- [ ] Scrolling back up reverses everything exactly
- [ ] Reduced-motion version reads as a normal page
