# Timing values for page transitions

General motion values (curves, durations, distances, stagger, spring, reduced-motion fades) now live
in the **web-motion** skill: `plugins/web-motion/skills/web-motion/references/presets.md`. Use those.
This file keeps only the numbers that are specific to page changes and loaders. (The audited
project's original values are summarised, without names, in web-motion's `pitfalls.md`.)

## Page-specific values (Sang's choices, 2026-09-30)

Total page change: **`--pt-dur: 800ms`** ("slow and cinematic"), adjustable 300 to 1400ms in the demo.
Curves are web-motion's: `--pt-ease` = ease-out `cubic-bezier(0.22, 1, 0.36, 1)`, `--pt-ease-inout` =
ease-in-out `(0.65, 0, 0.35, 1)`, `--pt-ease-in` = ease-in `(0.4, 0, 1, 1)`.

- **fade + rise (favourite)**: old page out 0 to 0.35 x dur (ease-in, 280ms); new page in 0.35 to 1.0 x dur (ease-out, 520ms) with a 16px rise; no overlap
- **slide**: 56px travel; same 0.35 / 0.65 split
- **morph** (shared element): 1.0 x dur, in-out easing
- **Suspense reveal**: skeleton out 150ms, then content in 0.5 x dur with 16px rise
- **curtain (GSAP, `power3.inOut`)**: cover 0.30 x dur (240ms), route swaps while hidden, uncover 0.35 x dur (280ms, +50ms delay), content in 0.35 x dur (280ms); box leaves up (continues) or down (shutter); total ~925ms with the route-commit wait
- **first-load entrance (Motion)**: web-motion's `reveal` (700ms), `rise` (18px) and `stagger` (70ms per item, after a 50ms delay); smooth-out `[0.22, 1, 0.36, 1]`; first load only
- **intro/loader**: visible from first frame; minimum visible = full intro length (**1400ms** in the demo; never under 400ms; a Lottie = its full duration); wordmark in 0.4 x length; bar fills to 92% over the length; then loader out 0.4 x dur (320ms, in-out), then page in 0.4 x dur (320ms); hard cap 4s waiting for assets
- **reduced motion**: web-motion's fades (out 100ms, in 160ms starting at 100ms, still sequential), linear, no movement

## Rules behind the numbers

- Old content leaves fast; new content arrives gently and never before the old is gone (Next's guide makes the same asymmetry point).
- One duration variable (`--pt-dur`) is the *total*; every phase is a fraction of it, so one slider retunes everything.
- Read durations with their unit in JavaScript (`800ms` may be minified to `.8s`).
