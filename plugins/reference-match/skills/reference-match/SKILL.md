---
name: reference-match
description: Use when rebuilding, cloning or matching a web page from a reference, for example a screen recording of a live site, its saved HTML, its CSS and asset files, or screenshots the designer marks up, and when fine-tuning a build until it matches that reference. Provides the study workflow (frames, measurements, asset identification), side-by-side comparison at the same moments, pointer and hover checks, and rules for keeping the study private and the art and copy original. Motion values come from web-motion, WebGL from 3d-web, loaders from page-transitions.
---

# Reference match

Matching a reference is a measuring job, not a drawing job. **Measure from pixels, compare at the
same moment after every change, and know what every asset is before using it.** Learned over three
study rebuilds of immersive and editorial pages. Checked on 2026-10-03 against ffmpeg 8.1, Playwright
1.63 and Pillow 11.3.

Related skills (don't repeat them here):
- **web-motion**, **page-transitions**, **3d-web**, **ui-craft**: how to build what you measured.
- **quality-check**: the full review once the match is done. **skill-retro**: lessons at the end.
- **create-learn-page**: when the rebuild should also teach how the page works.

## Before starting: ask the designer

1. What are the sources, in order of truth (recording, saved HTML, assets, their screenshots)?
2. Is anything in the recording not real (a repainted background, a debug overlay, a cursor)?
3. Which parts must match exactly, and which may be my own (copy, characters, art)?
4. Desktop only, or phone too? Which screen size is the reference?
5. Where may it live (a private route), and what must never change (shared files, other pages)?

## The workflow

| Step | Do | Output |
| --- | --- | --- |
| 1. Watch | Contact sheets of the recording (one every 0.5–2s), then dense sheets around each transition | A timeline: time → what happens, in the page's own units (e.g. screens of scroll) |
| 2. Measure | Pixel positions from full-size frames: card bounds, rules, type cap heights, gaps | Layout values in the page's unit (often a rem that scales with the viewport) |
| 3. Identify assets | Debug views: each 3D scene from its own camera, each sprite sheet frame by frame, each texture | A table: file → what it is → where it goes |
| 4. Build | Use the real assets where allowed; placeholders keep the right shapes and layers | A first pass of the whole page |
| 5. Compare | Screenshots at the same moments, side by side with the reference frames; pointer pairs; fast hover captures | A list of differences, fixed one by one |

Details and scripts: `references/toolkit.md`. Asset identification and art: `references/assets.md`.

## Core rules

1. **Measure, never eyeball.** Every position, size and gap comes from pixels of the reference,
   converted to the page's own unit; write the numbers down next to the code that uses them.
2. **Compare at the same moment after every change**: the same scroll position (or film time) and the
   same pointer, side by side with the reference frame. "Looks right" without a sheet doesn't count.
3. **Identify every asset before wiring it.** Open it in a small debug view; never guess what a sheet,
   a model or a JSON file contains.
4. **Motion is checked as motion**: dense frame sheets for transitions, pointer at opposite corners for
   parallax, captures every ~25ms for hovers.
5. **Measure on a real GPU** (headless Chrome with GPU flags or a visible window); a hidden preview
   pane pauses animation frames and makes timings meaningless.
6. **Study only, and original where it counts**: a private route, never deployed publicly; copy
   rewritten in my own words; generated art describes original characters, never copies.
7. **Leave the rest of the project alone**: new files only, scoped styles, other pages checked
   unchanged at the end.

## Quality checklist

- [ ] A timeline table maps every reference moment to the build's own clock
- [ ] Every layout value has a measurement behind it
- [ ] Every asset is identified (file → content → where used); unused ones are listed with the reason
- [ ] Side-by-side sheets at the key moments show no unexplained difference
- [ ] Pointer pairs and hover captures confirm the interactions
- [ ] Frame times measured through the whole page (see 3d-web / web-motion budgets)
- [ ] Copy and generated art are original; nothing deployed publicly; other pages unchanged

## Reference files

- `references/toolkit.md`: contact sheets, pixel measuring, the screenshot script (film time, pointer, hover), side-by-side sheets
- `references/assets.md`: identifying 3D scenes, sprite sheets and textures; placeholders; generating original art that fits the set
