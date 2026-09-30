# Choreography: stagger, sequence, enter and exit

## How much motion does this deserve?

Decide by how often someone sees it:

| Seen | Examples | Motion |
| --- | --- | --- |
| Hundreds of times a day | Keyboard shortcuts, command palette, typing | None |
| Tens of times a day | Hover, list navigation, tabs, toggles | Tiny and fast (100 to 160ms), or none |
| Occasionally | Menus, modals, drawers, toasts | Standard (200 to 400ms) |
| Once per visit or rarer | First-load intro, hero reveal, empty states, success moments | Can be expressive (700ms+, text reveals) |

## Stagger

- **70ms between items** (cards, list rows, lines of a heading). Words: about 35ms. Characters: about 14ms.
- **Cap the group**: the last item starts within about 490ms of the first. A 20-item list spaces its
  items closer rather than taking 1.4s. Use `staggerStep(count, unit)` from the presets.
- **Order follows reading order**: top-left to bottom-right. From the centre only for a symmetric
  single word or a radial layout. Random only for decorative particles, never for text people read.
- **Only stagger what enters together.** Items revealed as you scroll each get their own trigger;
  don't make item 12 wait for items 1 to 11.
- **Groups of 2 don't need a stagger**; groups of 30 are one block (fade the container).

## Sequencing inside a moment

- **Overlap, don't queue.** Start the next piece when the previous one is about 60 to 70% done
  (GSAP position `'-=0.25'` or `'<0.2'`). Queued steps feel slow.
- **Lead with the most important thing**: heading, then supporting text about 200 to 250ms later,
  then actions. Decorations last, or not at all.
- **Total moment**: a hero reveal should be readable within about a second; nothing important
  appears later than about 1.2s after the page is ready.
- Use GSAP timelines with labels for anything with more than two steps; the numbers stay readable.

```ts
gsap.timeline({ defaults: { ease: 'ease.out', duration: 0.7 } })
  .add(revealLines(title))              // lines, 70ms apart
  .from(sub, { y: 18, autoAlpha: 0 }, '<0.25')
  .from(actions, { y: 18, autoAlpha: 0 }, '<0.15')
```

## Enter and exit

- **Exit is about 60% of the entrance** and accelerates away (ease-in). In GSAP, the simplest correct
  exit is `tl.timeScale(1 / 0.6).reverse()`: a reversed ease-out *is* an ease-in, and it reverses
  from wherever the entrance got to.
- **Groups exit in reverse order**, or all at once. Never make people wait for an exit.
- **Exits travel less**: fade plus a short move, never a long slide.
- **Old before new**: never show outgoing and incoming content overlapping in the same place
  (same rule as page-transitions).

## Interruption

- Hover in/out rapidly: must reverse smoothly from the current position. CSS transitions and GSAP
  `play()`/`reverse()` on one timeline do this; restarting `fromTo` tweens do not.
- Clicking "open" while "close" is still playing: reverse the running animation. Never queue.
- Kill or finish a hover flourish before starting an enter or exit on the same elements.

## Repeat or once?

- **Once** (default): content reveals the first time it scrolls into view, then stays. Right for almost all content.
- **Every time**: only for small, decorative or playful pieces (a counter, a marquee label, an
  illustration), never long text people are reading while scrolling back up.
- Elements already in view at load reveal on load. Elements the visitor scrolled past before the
  script was ready reveal when scrolled back to (`onEnterBack`), or are simply shown.
