# Choosing a tool: CSS, GSAP or Motion

Start with the simplest tool that can do the job, and move up only when you need to.

## CSS first

Use CSS for anything driven by a state the browser already knows: hover, focus, `:active`, `[open]`,
`:checked`, a class or data attribute.

- **Transitions retarget.** If the pointer leaves halfway, a transition reverses from where it is.
  Keyframe animations restart instead, so never use `@keyframes` for hover.
- **`@starting-style`** gives elements an entrance when they first render or leave `display: none`
  (popovers, dialogs, toasts, menus). Supported everywhere since 2024.
- **`linear()`** lets CSS play a spring curve (generate it from the preset spring; see `presets.md`).
- **Scroll-driven animations** (`animation-timeline: view()` / `scroll()`) work in Chromium and Safari
  26 but not Firefox stable (checked 2026-09). Use them only for enhancements where "no animation" is
  fine, inside `@supports (animation-timeline: view())`.
- **CSS scroll-*triggered* animations** (`timeline-trigger`) shipped only in Chrome 146. Watch, don't rely on it yet.
- **`interpolate-size: allow-keywords`** (animating to `height: auto`) is Chromium only. Fine as an
  enhancement: other browsers snap. Prefer `grid-template-rows: 0fr → 1fr` for accordions today.

```css
/* popover enter + exit without JavaScript */
.menu {
  opacity: 1; transform: none;
  transition: opacity var(--dur-base) var(--ease-out), transform var(--dur-base) var(--ease-out),
              display var(--dur-base) allow-discrete, overlay var(--dur-base) allow-discrete;
  transform-origin: top left; /* grow from the button that opened it */
}
.menu:not(:popover-open) { opacity: 0; transform: translateY(-4px) scale(0.97); transition-duration: 140ms; }
@starting-style { .menu:popover-open { opacity: 0; transform: translateY(-4px) scale(0.97); } }
```

## Motion (React)

Use Motion for React-driven UI: elements that mount and unmount, layout changes, gestures, springs,
and simple in-view reveals.

- Install **one** package: `motion`, import from `motion/react`. (`framer-motion` is the old name;
  having both installed ships two copies.)
- `whileInView` + `viewport={{ once, amount }}` for reveals; `variants` + `delayChildren: stagger(step)` for groups.
- `drag` + a spring for gestures; start the spring with the release velocity.
- `AnimatePresence` for exits of things React removes.
- `useScroll` + `useTransform` for scroll-linked values (runs on the browser's scroll timeline when it can).
- Heads-up: `x`/`y`/`scale` shorthands are not hardware-accelerated. For heavy or many-element
  animations, animate `transform: 'translateY(...)'` or use CSS/GSAP.

```tsx
<motion.ul initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.3 }}
  variants={{ show: { transition: { delayChildren: stagger(staggerStep(items.length)) } } }}>
  {items.map((it) => (
    <motion.li key={it.id} variants={{ hidden: { opacity: 0, y: 18 }, show: { opacity: 1, y: 0 } }} />
  ))}
</motion.ul>
```

## GSAP

Use GSAP for sequences and anything text-based: timelines with overlaps and labels, SplitText,
scramble/typing, ScrollTrigger scrubbing and pinning, SVG drawing and morphing. All plugins are free
since 3.13.

- In React, always use `useGSAP()` (from `@gsap/react`): it records everything created inside and
  reverts it on unmount or when dependencies change (`revertOnUpdate: true`). Wrap event handlers
  in `contextSafe()`. Do not use bare `useEffect` + manual kills.
- Register plugins once in a shared module.
- Use the named house eases (`ease.out`), not `power3.out`, `expo`, `back.out` etc.
- `gsap.matchMedia()` for reduced motion and breakpoints: it reverts automatically when the condition changes.

```tsx
const { contextSafe } = useGSAP(() => {
  gsap.from('.card', { y: 18, autoAlpha: 0, stagger: staggerStep(6), scrollTrigger: { trigger: '.cards', start: 'top 85%', once: true } })
}, { scope: container })
```

## Ownership rule

One property of one element has one owner. Common clashes:
- A CSS `transition: transform` on an element GSAP also moves: GSAP's writes get smoothed by CSS
  (laggy, doubled motion). Remove the transition or animate a wrapper.
- Motion `whileHover` scale on an element a GSAP scroll reveal also moves: wrap one in the other.
- `transition: all`: never. Name the properties.

## Smooth scrolling (Lenis)

Opt-in only (editorial/portfolio sites). See `scroll.md` for the setup and the reduced-motion rule.
