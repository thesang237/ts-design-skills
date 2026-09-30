# Text reveals

Signature reveal: **lines rising from a mask**, 70ms apart, 700ms, smooth-out. The full working
version of everything here (7 effects, each with scroll-once / every-time / manual triggers,
enter, exit and hover) is in `demos/web-motion/src/text/`.

## Which effect, where

| Effect | Split | Use for | Limit |
| --- | --- | --- | --- |
| Mask up | lines | Section and hero headings (signature) | Any length |
| Mask up | words | Short headings, one or two lines | ~12 words |
| Mask up | characters | One hero word or a short name | ~20 characters |
| Fade up, no mask | lines / words | Softer headings, intros | Paragraph: lines only |
| Fade in, no movement | words or whole block | Body text, calm pages; closest to reduced motion | Any |
| Scramble (random ASCII) | characters | Technical labels, counters, short status lines | ~40 characters, uppercase or monospace reads best |
| Terminal typing | characters | Code/terminal moments, one line | ~60 characters |

Never split long body text into characters or words (hundreds of elements, choppy reading).
One expressive text effect per screen; everything else gets the signature reveal or a fade.

## Structure that keeps text accessible and React-safe

```tsx
<Tag ref={root} className="tx">
  <span className="sr-only">{text}</span>                       {/* read once, as normal text */}
  <span ref={visual} className="tx-visual" aria-hidden="true" /> {/* the engine fills this */}
</Tag>
```
- Screen readers get the plain sentence once. Don't rely on `aria-label` on a `<p>` or `<span>`:
  it's ignored on generic elements. So pass `aria: 'none'` to SplitText and use the hidden copy instead.
- React renders the visual element **empty**; the animation code sets its text and splits it. React
  never touches split nodes, so there are no "removeChild" errors when props change.
  (Server-rendered text is fine too if it never changes after hydration; key the element by its text otherwise.)
- Hide only when JavaScript runs and only until the first frame is set:
  `.js .tx:not([data-ready]) .tx-visual { visibility: hidden; }`, then set `data-ready` right after splitting.

## Masked and unmasked split reveals (GSAP SplitText)

```ts
let tl = gsap.timeline({ paused: true })
let shown = false, moving = false
const settle = () => (moving = false)

SplitText.create(visual, {
  type: split === 'chars' ? 'words,chars' : split,   // words stay unbroken when splitting characters
  mask: masked ? split : undefined,                   // wraps each piece in an overflow: clip box
  linesClass: 'tx-line', wordsClass: 'tx-word', charsClass: 'tx-char',
  aria: 'none',
  autoSplit: split === 'lines',                       // re-split on font load and width change
  onSplit(self) {
    const units = self[split]
    tl = gsap.timeline({ paused: true, onComplete: settle, onReverseComplete: settle })
      .fromTo(units,
        masked ? { yPercent: 120 } : { y: 18, autoAlpha: 0 },
        { ...(masked ? { yPercent: 0 } : { y: 0, autoAlpha: 1 }), duration: 0.7, ease: 'ease.out', stagger: staggerStep(units.length, split) })
    // A re-split can land mid-animation: keep going in the same direction.
    if (moving && shown) tl.play()
    else if (moving) tl.timeScale(1 / 0.6).reverse()
    else tl.progress(shown ? 1 : 0)
    return tl   // SplitText moves the playhead to where the old timeline was
  },
})

const enter = () => { shown = true; moving = tl.progress() < 1; tl.timeScale(1).play() }
const exit = () => { shown = false; moving = tl.progress() > 0; tl.timeScale(1 / 0.6).reverse() }
```

Pixel details:
- **Pad the masks** so descenders (g, y, p) and accents aren't clipped, and cancel the padding so
  layout is unchanged. Then travel 120%, not 100%, so nothing peeks into the padding:
  ```css
  .tx-line-mask, .tx-word-mask, .tx-char-mask { padding-block: .1em .16em; margin-block: -.1em -.16em; }
  .tx-char-mask { padding-inline: .03em; margin-inline: -.03em; }
  .tx-word { white-space: nowrap; }
  ```
- Hero text on first load: wait for `document.fonts.ready` (max ~1s) before playing, so lines are
  measured with the real font.
- `text-wrap: balance` works with line splitting; set it before splitting.
- Keep `line-height` at least 1.0 for masked lines, or the masks overlap and clip neighbours.
- Don't revert the split after the reveal if you need exit or hover later. Otherwise
  `onComplete: () => split.revert()` returns clean text.

Hover flourish (mouse/trackpad only, and only when fully shown and idle):
- Masked: roll through the mask. Pieces exit upwards (`fast`, ease-in), jump below, return (`base`, ease-out), half the stagger.
- Unmasked: a small wave (`yPercent: -14` and back). Opacity is untouched so the text stays readable.

## Random ASCII (scramble)

Letters appear one after another as random characters, then settle into the real text.

**Pixel-perfect trick:** give every letter a slot that contains the *real* letter (which fixes
width and line breaks) plus an absolutely positioned overlay for the random glyph. The real letter
is `visibility: hidden` while scrambling, so the line never changes width, in any font.

```html
<span class="tx-word"><span class="tx-slot"><span class="tx-real" data-p="scramble">S</span><span class="tx-glyph">#</span></span>…</span>
```
```css
.tx-slot { position: relative; }
.tx-real[data-p='hidden'], .tx-real[data-p='scramble'] { visibility: hidden; }
.tx-glyph { position: absolute; inset: 0 0 auto; text-align: center; visibility: hidden; color: var(--muted); }
.tx-real[data-p='scramble'] + .tx-glyph { visibility: visible; }
```
Driving it: one paused GSAP tween on `{ time }` from 0 to total, with `onUpdate` deciding each
letter's phase (hidden → scramble → real) from its start time. Change glyphs about 20 times a
second, not every frame, and choose them with a deterministic hash of (letter, frame) so reversing
shows the same frames. Exit = `reverse()` at 1/0.6 speed. Hover = a quick left-to-right re-scramble
where letters never disappear. Write `textContent` only when the glyph actually changes.

GSAP's ScrambleTextPlugin is fine for monospace text; in proportional fonts it changes the line's
width while scrambling, so prefer the slot technique.

## Terminal typing

- **Lay out all letters from the start**, untyped ones `visibility: hidden`: the line wraps exactly
  as it will at the end and nothing shifts.
- **Caret via CSS** on the last typed letter (`::after`, `position: absolute; left: 100%`), or before
  the first letter when empty. It takes no space, so typing never pushes text.
- **Solid while typing, blinking at rest** (`steps(1)` blink, paused with an `is-typing` class), like a real terminal.
- **Human rhythm:** 22 to 80ms per letter with ±35% jitter from a seeded hash, extra pauses after
  punctuation (x4 after `,;:`, x8 after `.!?`), and a short "thinking" pause with the caret blinking first.
- **Exit backspaces** evenly (about 18ms per letter, capped at the exit duration).
- Hover (optional): retype the last word at double speed.

## Reduced motion

No splitting at all. The whole block fades in (160ms) and out (100ms). No scramble flicker, no
typing (text shown complete), caret doesn't blink, hover flourishes off. Rebuild when the setting changes.

## Triggers

| Trigger | Behaviour |
| --- | --- |
| `load` | After fonts (max 1s), with an optional delay to sequence with neighbours |
| `scroll-once` | ScrollTrigger `start: 'top 88%'`, `once: true`, `onEnter` + `onEnterBack` → enter |
| `scroll-repeat` | Also `onLeave` / `onLeaveBack` → exit. Only for short, decorative text |
| `manual` | Enter/exit called from buttons or state (menus, tabs, carousels) |

Rebuild with `useGSAP({ dependencies: [...], revertOnUpdate: true })` when the text, split, presets
or reduced-motion setting change, and restore the shown/hidden state without animating.
