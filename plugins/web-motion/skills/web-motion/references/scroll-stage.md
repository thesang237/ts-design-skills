# Scroll stage: a pinned stage with many layers on one progress

For a section that stays on screen for several screens of scroll while many layers (photos, headings,
counters, a vector animation) enter, move and change. It extends `scroll-scenes.md`, which covers the
text-led enter, hold and exit scene. Use this when the scene has **several independent layers with their
own start and end**, or when the whole page has one long scrubbed story. Worked from a real editorial
page (a ten-screen photo stage and a logo that falls apart); numbers below are starting points, not
rules, and the designer decides length, smoothing and layers.

## Build it as: a tall track, a sticky stage, tracks per layer

```css
.stage-track { position: relative; height: 1000svh; }                 /* the scroll you spend: 10 screens */
.stage       { position: sticky; top: 0; height: 100svh; overflow: clip; }   /* stays on screen */
.layer       { position: absolute; will-change: transform, opacity; }
.page        { overflow: clip; }   /* NOT hidden: hidden makes a scroll container and sticky silently stops */
```

| | CSS `position: sticky` | GSAP `ScrollTrigger` `pin: true` |
| --- | --- | --- |
| Use for | A plain stage in the normal page (default) | Pinning inside a nested scroller, when you need `pinSpacing` control, or when sticky can't |
| Extra DOM | none | a `.pin-spacer` wrapper |
| Breaks when | an ancestor has `overflow: hidden / auto / scroll` | transformed ancestors; layout changes after setup |
| Progress | measure the track | `self.progress` |

**Progress of a track** (0 to 1): `clamp(-track.getBoundingClientRect().top / track.offsetHeight)`. The
stage is stuck until the track's bottom meets the window's bottom, so it holds for
`(trackHeight - stageHeight) / trackHeight` of the progress (about 90% for ten screens). Design the last 10% as the
hold and release, and keep every layer's last key at or before it.

Keep stages rare: one to three per page, and ten screens needs ten screens of change (a counter,
active-item highlights, text), or it feels like being stuck. Long pins on phones: don't (see below).

## Tracks: keyframes in scroll percent

A **track** is a list of `[position %, value]` for one property of one layer. Before the first key
and after the last the value **holds**. Between keys it is **linear**.

```ts
type Key = [at: number, value: number]
const sample = (keys: Key[], pct: number) => {
  let from = keys[0], to: Key | null = null
  for (let i = 0; i < keys.length; i++) if (pct >= keys[i][0]) { from = keys[i]; to = keys[i + 1] && pct !== keys[i][0] ? keys[i + 1] : null }
  if (!to) return from[1]
  return from[1] + (to[1] - from[1]) * ((pct - from[0]) / (to[0] - from[0]))
}
// layer "photo B": rises 3 → 12 %, waits, slides right 13 → 30 %
const photoY: Key[] = [[3, 100], [12, 0]]        // vh
const photoX: Key[] = [[0, 0], [12, 0], [13, 0], [30, 110]]   // %
```
- **Stagger is a different start position**, not a delay: photo A starts at 3%, photo B at 6%. A scrubbed stagger can't drift out of sync when the person scrolls back.
- **Equal values on two keys make a hold** (`[12, 0], [13, 0]`). Put holds where the eye needs to read.
- **Offset the signposts from the move.** A slide moves 35 to 45%; its counter changes 40 to 45%, so the number updates as the picture settles.
- Write a **segment map** (a table of percent ranges and what happens) before coding. It is the whole scene on one page.
- **Linear, always.** Scroll is the playhead; the wheel and the smoothing already shape the motion. A curve on a scrubbed track finishes early and leaves dead scroll. Put easing on timed things (reveals, overlays). If you port from a tool that exports curves per key (Webflow interactions, some timeline editors), check what the engine honours: one engine used a key's curve only on a track's **first** key, so curves on later keys silently did nothing.
- Units: `vh` → measure the stage in pixels in the ticker (or `svh` in CSS); `%` is relative to the layer; `em` moves with the layout (a counter strip moved in em scales with the type).

## One ticker, smoothed progress, writes

```ts
const smooth = (cur: number, target: number, smoothing: number, frames = 1) => {
  const keep = (1 - Math.max(1 - smoothing / 100, 0.01)) ** frames    // 0.7 per 60Hz frame at smoothing 70
  return target + (cur - target) * keep
}
gsap.ticker.add((_t, dtMs) => {
  const frames = Math.min(Math.max(dtMs / (1000 / 60), 0.25), 4)       // elapsed 60Hz frames
  p = smooth(p, targetProgress(), 70, frames)                           // one smoothing per scene
  for (const [el, tracks] of layers) write(el, tracks, p * 100)         // transform + opacity only
})
```
- **Smoothing 70** (30% of the gap per 60Hz frame, about 0.17s to cover 97% of a jump) is the default; 60 on phones. In GSAP terms it is `scrub: 0.15` to `0.2`. The exponent makes the glide last the same on 60, 120 and 144Hz screens (see `progress-mapping.md`: damp).
- Skip writes when the value didn't change; write only `transform` and `opacity`; never read layout of every layer in the loop.
- **Measure the track once and on resize**, or let ScrollTrigger do it. (A prototype that calls `getBoundingClientRect()` for two elements on every tick is acceptable for two scenes, but it is the pattern `SKILL.md` rule 3 warns about; cache the offsets for more.)
- Discrete UI (active dot, counter digit, name highlight) comes from the same tracks but only touches the DOM when its value changes.

## Scrubbing a vector animation (Lottie) with scroll

A Lottie file is a pre-rendered motion comp you can set to any frame. Map scroll to the frame with a
track, so the file's own pacing is bent by your keys: a 340-frame fall can finish in the first 22% of the page and then rest.

```ts
const frameTrack: Key[] = [[0, 0], [10, 37], [17, 61], [22, 99], [100, 99]]   // % of the file
anim.goToAndStop((anim.totalFrames * sample(frameTrack, p * 100)) / 100, true)   // sub-frames allowed
write(wrapper, { scale: [[19, 1], [23, 4]], opacity: [[34, 1], [35, 0]] }, p * 100)   // zoom into black, then vanish
```
- Use the SVG light build (`lottie-web/build/player/lottie_light`), `loop: false, autoplay: false`, lazy-import it, and `destroy()` on unmount.
- The SVG container needs a definite size (an aspect-ratio box); give the lottie wrapper a column parent so `height: 100%` resolves.
- **Reduced motion:** don't scrub; show one meaningful frame (the final logo) and skip the zoom.
- A scrubbed Lottie plus another long scene is heavy: pause the ticker work when the scene is off screen (`IntersectionObserver`).

## Responsive: different tracks, usually no pin on phones

Pinned stages need a stage the size of a screen and a patient wheel. On phones, **replace them**:
stack the layers into plain cards, and give the one scene that survives (a logo, a hero) its own shorter track set.
Read `matchMedia('(max-width: 479px)')` live in the ticker, so rotating a tablet or resizing a window works; when it flips, clear the
inline `transform`/`opacity` the other layout wrote and redraw. Don't `display: none` a layer and keep animating it.

## Reduced motion and robustness

- Reduced motion: no pin, no scrub. Show each layer in its end state in a stacked layout; one short fade the first time it appears.
- **Reload halfway:** compute progress at once and write every layer, so nothing is missing.
- **Keyboard and focus:** content that is part of the story (links, buttons) must be in the DOM and reachable; moving focus into the stage scrolls the page to the matching progress or shows the layer.
- Test: scroll slowly and fast, both directions; stop on a hold (nothing should creep); resize mid-scroll; phone width; reduced motion; 4x CPU slowdown.
