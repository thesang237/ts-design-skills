# Web motion demo

A small Vite + React page that shows what the `web-motion` skill builds: one set of motion presets
shared by CSS, GSAP and Motion, a text-effect library, hover and press details, a staggered group,
and one spring used by both CSS and JavaScript. All content is placeholder.

## Run it

```
npm install
npm run dev          # then open the address it prints (usually http://localhost:5173)
```

`npm run build` creates a static copy in `dist/` that works from any folder or static host.

## What to try

- **Tune motion** (bottom right): see the main curve (smooth-out), change the reveal duration, rise, stagger, exit length
  and the spring. Everything on the page follows. "Replay all" plays every reveal again; "Reset"
  restores the defaults.
- **Reduce motion**: switch it on in the tuner (or in your system settings). Movement disappears;
  short fades stay; text is no longer split.
- **Text cards**: each has a trigger (Scroll, once / Every time / Manual), Enter and Exit buttons and a
  Hover switch. Try Exit halfway through Enter: it turns around smoothly.
  - Mask up by lines, words and characters (hover: the text rolls through its mask)
  - Fade up without a mask (switch between lines, words and characters)
  - Fade in with no movement
  - Random ASCII: letters scramble and settle, and the line never changes width (hover re-scrambles)
  - Terminal typing: human rhythm, a caret that's solid while typing and blinks at rest; Exit backspaces
- **Hover & press**: buttons (press on touch too), underline, rolling letters, typing dots, and
  showcase cards (the only expressive hover). On a phone, card details are always visible.
- **Groups**: eight items 70ms apart; "Every time" replays them when you scroll back.
- **Scroll scenes**: three sections whose heading, text and buttons enter as you scroll, hold still,
  then leave. The bar at the bottom switches Pinned / In flow, the hold length, and what happens when
  you scroll back up (Rewind, Play back, Stay). The last block does the same with CSS only (Chrome and
  Safari; static in Firefox).
- **Spring**: "Move both" moves a CSS box and a Motion box with the same spring; they travel
  together. Drag the chip and throw it: it springs home with your speed.

## Where things are

| File | What it does |
| --- | --- |
| `src/motion/tokens.ts` | The presets: curves, durations, distances, stagger, spring |
| `src/motion/MotionProvider.tsx` | Writes presets to CSS variables, registers GSAP curves, configures Motion, handles reduced motion |
| `src/text/engines.ts` | The text effects (split reveals, scramble, typing), each with enter / exit / hover |
| `src/text/TextEffect.tsx` | Connects an effect to scroll, buttons and hover; accessible text structure |
| `src/components/HoverPress.tsx`, `src/styles.css` | Hover and press details (CSS) |
| `src/components/StaggerGrid.tsx` | Motion group reveal with a capped stagger |
| `src/components/SpringDemo.tsx` | The shared spring (CSS `linear()` + Motion) and drag |
| `src/components/ScrollScenes.tsx` | Scroll scenes: enter / hold / exit mapped to scroll, plus the CSS-only version |
| `src/components/Tuner.tsx` | Demo-only tuning panel |

Checked in Chromium, Firefox and WebKit, at phone and desktop sizes, with reduced motion, and with 4x
CPU slowdown: 60fps, no layout shift, only `transform`, `opacity` and `visibility` change.

The rules and reasoning are in `plugins/web-motion/skills/web-motion/`.
