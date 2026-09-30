# Reduced motion

"Reduce" means less movement, not nothing at all. Remove travel, scaling, parallax, scrubbing,
springs, smooth scrolling and flicker. Keep short opacity and colour changes so state changes are
still visible (fade in 160ms, out 100ms, linear or ease-out). Same numbers as page-transitions.

Read the setting live: people switch it while the site is open. Test with the OS setting, or in
Chrome DevTools > Rendering > "Emulate CSS media feature prefers-reduced-motion".

| Piece | Normal | Reduced |
| --- | --- | --- |
| Reveals on scroll | Rise 18px + fade, 700ms | Fade 160ms, no rise |
| Text reveals | Split, mask, stagger | No splitting; whole block fades |
| Scramble / typing | Letter by letter | Text shown complete (short fade); caret doesn't blink |
| Stagger | 70ms | None (or 20ms max) |
| Hover | Lift, zoom, roll | Colour/opacity only |
| Press | Scale 0.97 | Colour change only |
| Springs / drag release | Spring | Instant |
| Scrubbed / parallax / pinned animations | Scroll-linked | End state shown, no scrubbing |
| Smooth scrolling | Lenis (opt-in sites) | Off |
| Loops (typing dots, spinners) | Movement | Slow opacity pulse, or static |
| Autoplay video / marquees | Play | Paused, with a play control |

## CSS

```css
@media (prefers-reduced-motion: reduce) {
  :root { --rise: 0px; --lift: 0px; --press: 1; --spring: 0ms linear; }
  .card:hover .card-img { transform: none; }
  .roll-char { transition: none; transform: none !important; }
  .dot { animation: pulse 1.6s ease-in-out infinite; }   /* opacity-only keyframes */
  .marquee { animation-play-state: paused; }
}
```
Driving movement through the preset variables (`--rise`, `--lift`, `--press`) means most components
need no rule of their own.

Avoid the blanket `* { animation: none !important; transition: none !important; }`: it also kills
helpful fades and can break components that wait for `transitionend`.

## Motion

```tsx
<MotionConfig reducedMotion="user">{children}</MotionConfig>
```
This turns off transform and layout animations everywhere and keeps opacity and colour. For custom
cases, `const reduce = useReducedMotion()`: e.g. `animate(x, 0, reduce ? { duration: 0 } : spring)`,
or pass zero offsets to parallax `useTransform`.

## GSAP

```ts
useGSAP(() => {
  const mm = gsap.matchMedia()
  mm.add({ full: '(prefers-reduced-motion: no-preference)', reduce: '(prefers-reduced-motion: reduce)' }, (ctx) => {
    const { reduce } = ctx.conditions!
    if (reduce) {
      gsap.from(el, { autoAlpha: 0, duration: 0.16, ease: 'none' })   // fade only, no split
      return
    }
    // full version: SplitText, stagger, ScrollTrigger scrub...
  })
}, { scope })
```
`matchMedia` reverts the whole branch automatically when the setting changes, including
ScrollTriggers and SplitText splits.

## Lenis

Lenis 1.3.26+ disables smoothing and makes programmatic scrolls instant when reduced motion is on
(`respectReducedMotion`, default true). With older versions, don't create Lenis when the query matches.

## Page transitions and loaders

See page-transitions: short sequential fades, no curtain, shared elements snap.

## Checklist

- [ ] OS setting on: scroll the whole page. Nothing moves position or scale; content still fades in.
- [ ] Toggle the setting while the page is open: the page follows without a reload.
- [ ] Hover, press and focus still give visible feedback (colour/opacity).
- [ ] Nothing flickers (scramble) or blinks more than about 3 times a second.
