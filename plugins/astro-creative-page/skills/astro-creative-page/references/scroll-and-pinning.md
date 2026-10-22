# Scroll: Lenis on the GSAP ticker, stacking, pinning

## One owner

```ts
export const lenis = new Lenis({ duration: 1.2, smoothWheel: true, touchMultiplier: 2, autoRaf: false });
lenis.on('scroll', ScrollTrigger.update);
gsap.ticker.add((time) => lenis.raf(time * 1000));
gsap.ticker.lagSmoothing(0);
ScrollTrigger.config({ ignoreMobileResize: true });
export const lockScroll = () => lenis.stop();
export const unlockScroll = () => lenis.start();
```
Lock during leave/enter, intros and overlays; unlock in exactly one place. Scroll boxes inside overlays and
demos need `data-lenis-prevent`.

## Stacking sections (the next one slides over)

`[data-stick="bottom"]` pins a section when its **bottom edge** meets the viewport bottom
(`--stick-top = innerHeight - el.offsetHeight`), so whatever follows scrolls over it; `[data-stick]` alone pins
at the top. Re-measure on width changes, `load` and after image decodes, then `ScrollTrigger.refresh()`.
A footer can be `position: sticky; bottom: 0` beneath `<main>` and be revealed as `<main>` ends.

## Pinned category stage

A tall track + sticky stage; per-item progress windows drive image wipes, zoom, a veil and a swing, with a
snap to the centre after the wheel rests (compatible with Lenis: use `lenis.scrollTo`). Scrubbed tracks are
linear; the ease lives in the value mapping (see web-motion `scroll-stage.md`).

## Header and colour on dark

Switch the header logo/colour from section triggers (`data-theme="dark"` on sections), not from scroll
position maths in the header.

## Custom scrollbar

Native bar hidden; a thin thumb appended to `<html>` (persists across swaps), sized from
`innerHeight / scrollHeight`, positioned from `lenis.animatedScroll / lenis.limit`, draggable with pointer
capture. Skip on touch.

## Refresh rules

`ScrollTrigger.refresh()`: after `initPage()`, after fonts, on width-change resize (debounced ~400 ms,
height-only ignored), on `load`, after lazy images get their size. Reserve space (aspect-ratio) so refresh is
rarely needed.
