# Hover and press micro-interactions

Subtle by default: colour or opacity, a 2px lift, a 0.97 press. Expressive hovers only on
showcase/work cards. All of these are CSS transitions: they retarget smoothly when interrupted.

## Ground rules

- Gate hover with `@media (hover: hover) and (pointer: fine)` so taps on phones don't trigger
  "sticky" hover states.
- Give `:focus-visible` the same effect as hover (keyboard users get the same feedback).
- Press (`:active`) is *not* gated: it's the main feedback on touch. iOS Safari only applies
  `:active` when some touch listener exists; add one passive listener once:
  `document.addEventListener('touchstart', () => {}, { passive: true })`.
- On touch screens nothing important may live behind hover: show it by default under
  `@media (hover: none)`.
- Name the transitioned properties; never `transition: all`.
- Hover in is `fast` to `base`; hover out can match or be a little slower. Press is `fast`.

## Button

```css
.btn {
  transition: background-color var(--dur-fast) var(--ease-out), transform var(--dur-fast) var(--ease-out);
}
@media (hover: hover) and (pointer: fine) {
  .btn:hover { background: color-mix(in srgb, var(--ink) 85%, var(--paper)); }
}
.btn:active { transform: scale(var(--press)); }
```
Never scale above 1 on hover for buttons in dense UI (it pushes against neighbours visually).
A 1 to 2px lift (`translateY(calc(var(--lift) * -1))`) is the maximum.

## Link underline (draws in, leaves forward)

```css
.link { position: relative; text-decoration: none; }
.link::after {
  content: ''; position: absolute; left: 0; right: 0; bottom: -2px; height: 1px; background: currentColor;
  transform: scaleX(0); transform-origin: right; transition: transform var(--dur-base) var(--ease-out);
}
@media (hover: hover) and (pointer: fine) { .link:hover::after { transform: scaleX(1); transform-origin: left; } }
.link:focus-visible::after { transform: scaleX(1); transform-origin: left; }
```

## Rolling letters (for short links and buttons)

Each letter slides up to reveal a copy of itself, 12ms apart. Pure CSS, so a quick in-and-out is smooth.

```tsx
<a className="roll" href={href}>
  <span className="sr-only">{text}</span>
  <span className="roll-visual" aria-hidden="true">
    {[...text].map((c, i) => (
      <span key={i} className="roll-char" data-c={c === ' ' ? ' ' : c} style={{ '--i': i } as CSSProperties}>{c === ' ' ? ' ' : c}</span>
    ))}
  </span>
</a>
```
```css
.roll-visual { display: inline-flex; overflow: clip; padding-block: .1em .16em; margin-block: -.1em -.16em; }
.roll-char { position: relative; display: inline-block; transition: transform var(--dur-slow) var(--ease-out); transition-delay: calc(var(--i) * 12ms); }
.roll-char::after { content: attr(data-c); position: absolute; left: 0; top: calc(100% + .26em); }
@media (hover: hover) and (pointer: fine) { .roll:hover .roll-char { transform: translateY(calc(-100% - .26em)); } }
.roll:focus-visible .roll-char { transform: translateY(calc(-100% - .26em)); }
```
The padding on the mask (cancelled by negative margin) keeps descenders from being clipped; the
copy is offset by the same padding so it never peeks in. Keep it under about 24 characters.

## Showcase card (expressive)

Only for work/portfolio cards. The image moves *inside a fixed frame*; nothing outside the card moves.

```css
.card-media { position: relative; aspect-ratio: 4 / 3; overflow: clip; }
.card-img { position: absolute; inset: 0; transition: transform var(--dur-slow) var(--ease-out); }
.card-more { opacity: 0; transform: translateY(6px); transition: opacity var(--dur-base) var(--ease-out), transform var(--dur-base) var(--ease-out); }
@media (hover: hover) and (pointer: fine) {
  .card:hover .card-img { transform: scale(1.04); }
  .card:hover .card-more { opacity: 1; transform: none; }
}
.card:focus-visible .card-more { opacity: 1; transform: none; }
@media (hover: none), (pointer: coarse) { .card-more { opacity: 1; transform: none; } }
```
Avoid animating `filter` (grayscale, saturate, brightness) on big images: every frame repaints.
Fade an overlay's `opacity` instead. Zoom at most 1.04 to 1.06.

Richer, direction-aware hovers (content enters from the side the pointer came in) are GSAP
timelines: create the enter timeline once, `play()` on enter and `reverse()` on leave, with handlers
wrapped in `contextSafe()`. Gate with `matchMedia('(hover: hover) and (pointer: fine)')`.

## Switch (uses the gesture spring)

```css
.switch-knob { transition: transform 240ms var(--ease-out); transition: transform var(--spring); }
.switch input:checked + .switch-track .switch-knob { transform: translateX(12px); }
```

## Status loops (typing dots, spinners)

```css
.dot { animation: lift 1.2s var(--ease-in-out) infinite; }
.dot:nth-child(2) { animation-delay: .15s; } .dot:nth-child(3) { animation-delay: .3s; }
@keyframes lift { 0%, 60%, 100% { transform: none; opacity: .4 } 30% { transform: translateY(-4px); opacity: 1 } }
[data-paused] .dot { animation-play-state: paused; }   /* set by an IntersectionObserver when off screen */
@media (prefers-reduced-motion: reduce) { .dot { animation: pulse 1.6s ease-in-out infinite; } } /* opacity only */
```
Label it for screen readers once (`<span class="sr-only">Someone is typing</span>`); dots are `aria-hidden`.

## Drag and gestures (Motion)

Follow the finger 1:1 while dragging, then spring home with the release velocity:

```tsx
const x = useMotionValue(0)
<motion.div drag dragMomentum={false} style={{ x, touchAction: 'none' }} whileDrag={{ scale: 1.04 }}
  onDragEnd={(_, info) => animate(x, 0, { type: 'spring', visualDuration: 0.4, bounce: 0.1, velocity: info.velocity.x })} />
```
`dragSnapToOrigin` uses Motion's own inertia settings, not the house spring; animate back yourself
as above to keep one feel. Reduced motion: return instantly (`{ duration: 0 }`).
