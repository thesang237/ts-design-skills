---
name: page-transitions
description: Use when adding, changing or reviewing a page loader or intro, page/route transitions, shared-element (morph) transitions or navigation animation on a React or Next.js (App Router) site. Helps choose between native View Transitions, GSAP and Motion, builds a first-load intro/loader and a per-navigation transition that never overlap old and new content, and enforces reduced-motion, keyboard/screen-reader, scroll-restoration and 60fps rules. Timing and easing values come from the web-motion skill.
---

# Page transitions

Make moving between pages feel continuous, without slowing anyone down or leaving anyone out.
Checked on 2026-09-30 against Next.js 16.3, React 19.3, Motion 13, GSAP 3.15. Working code for
everything below lives in `references/`, and a runnable demo is in `demos/page-transitions/`.

Two separate pieces, never mixed up:
- **Loader / intro**: plays **once per session**, on first load.
- **Page transition**: plays **every time** the visitor goes to another internal page.

## Before writing any code: ask the designer

Never pick these silently. Ask, then write the answers down in the project.

1. How long should a page change feel in total? (Fast ~300ms, medium ~500ms, slow and cinematic 800ms+.)
2. Which style: fade + rise, directional slide, curtain, or shared-element morph?
3. What must never happen? (overlapping old/new content, content appearing early, blur, 3D depth, bouncy springs, a loader on every visit...)
4. Loader: a fixed-length intro (once per session), or only when loading is actually slow? What is its minimum visible time?

Timing and easing numbers: use the **web-motion** skill's presets. Page-specific phases (the 800ms
split, curtain, loader) are in `references/timing-values-to-move.md`.

### Sang's answers (taste session, 2026-09-30). Use these unless told otherwise

- Page change feels **slow and cinematic: 800ms total**, from click to new page fully in.
- Favourite style: **Fade + rise**. Slide is acceptable. Curtain is fine **only** in the form below.
- **Never** show the old and new page's content at the same time, and never show the next page's
  content before the transition has finished. Sequence: old content fully gone, *then* new content in.
- **Curtain**: a box (same colour every time) slides up and covers the old page; the route changes while
  hidden; the new page's content stays hidden; the box slides away (up or down) onto an *empty* page; only then does the content come in.
- **Fixed-length intro/loader once per session** + **a page transition on every internal navigation**.
- The loader **never disappears immediately**: it stays visible for its whole animation (a Lottie's full
  duration, or the CSS intro's length), never less than 400ms. The page appears only after the loader has fully left.

## Which technique? (decision guide)

| The job | Use | Why |
| --- | --- | --- |
| Page leaves/enters: fade, slide, direction | **Native View Transitions** via React `<ViewTransition>` | Browser does the work on the GPU, no exit-animation hacks, degrades to an instant swap |
| An image/card that becomes the next page's hero | **Native**, same `name` on both ends | The browser moves one element, so it reads as one object |
| Loading state on a slow route | **Suspense + skeleton** (with native reveal) | Screen never freezes; content fades in when ready |
| First-visit loader / intro | **CSS + a tiny inline script** (no library); a self-hosted Lottie only if the designer wants one | Must work before React and the animation libraries have loaded |
| Choreographed cover/curtain, timelines, split text, canvas/SVG | **GSAP** | Precise sequencing, works in every browser |
| Springs, interruptible motion, first-load entrances, overlays | **Motion** | Physical feel, easy React lifecycle |
| Spring-based morph across pages | **Motion `AnimateView`** (React 19.3+) | Native transition with spring timing. Test before shipping |

Combine like this: native transitions own the *route change*; Motion or GSAP own what happens
*around* it (intro, curtain, overlays, first-load entrances). Never let two systems animate the same
element in the same moment. Avoid the old "AnimatePresence + frozen router" pattern in the App Router; it is fragile.

## Core rules

1. **Only transform and opacity move.** No animating width, height, top, left, margin, box-shadow, or blur on large areas. (`translate`, `scale`, `rotate` are fine.)
2. **60fps**: no frame over ~33ms during a transition in normal use; test with 4x CPU slowdown on a phone-sized viewport.
3. **Never overlap.** Old content is completely gone before new content starts to appear. Split the total duration (fade: old out 0-35%, new in 35-100%). The loader has fully left before the page fades in. Same for the curtain: box away first, content after.
4. **Content entrances belong to the first load only**, after the intro. On navigation the transition owns the moment; next-page content must not start moving early.
5. **The loader is a designed, fixed-length intro** (or, if the designer prefers, shown only when loading is slow). Either way: it is server-rendered CSS, not dependent on the libraries it waits for; it stays visible for its whole animation (min 400ms); once per session; hard cap of ~4s waiting on assets.
6. **Never freeze the screen.** Slow pages get an instant skeleton, not a held-open transition.
7. **Reduced motion is designed, not switched off**: keep a short fade (still sequential), remove movement (slides, curtain, scaling, morphs), make shared elements snap.
8. **Without View Transitions support, navigation still works** and simply swaps. Test by deleting `document.startViewTransition`.
9. **After navigating, move focus to the new page's `<h1>`** (not on first load) and make sure `<title>` changes; Next's built-in route announcer reads it. Do not add a second live region. Add a skip link.
10. **Keep the window as the scroller** so scroll restoration on Back/Forward just works.
11. **One owner per style.** Class names in one map (`transition-types`), timing in CSS variables (`--pt-dur` is the *total*). **Read durations with their unit**: build tools rewrite `800ms` as `.8s`.
12. **Interruption**: native styles must not swallow a second click. The curtain deliberately blocks input while its box is up (about one second); say so.
13. **No brand or client specifics** in reusable code: names, logos, copy and colours are placeholders.
14. Know the limit: **the browser's own Back/Forward buttons are not animated** by Next 16.3 (they cut instantly, scroll is still restored). Say so; do not promise otherwise. See `references/pitfalls.md`.

## Quality checklist (run before calling it done)

- [ ] Intro: visible from the first frame, stays its full length (>= 400ms), leaves completely, *then* the page fades in; never both visible at once; not shown again in the same session or on later navigations
- [ ] Every transition style: old content fully gone before new content starts (check animation timings), total = the agreed duration
- [ ] Curtain: new content invisible while the box is on screen and until it has left
- [ ] Nothing from the new page moves before the transition ends (no early entrances)
- [ ] Every style plays at 60fps on desktop and on a phone with 4x CPU slowdown
- [ ] Only `transform`/`opacity` appear in the animated properties (check `document.getAnimations()`)
- [ ] Reduced motion on: no sliding, scaling, curtain or morph movement; fade only
- [ ] `document.startViewTransition` deleted: every link and button still navigates
- [ ] Keyboard: Enter navigates, focus lands on the new `<h1>`, Tab continues from there; skip link works
- [ ] Screen reader: `<title>` changes on every page and is announced once
- [ ] Scroll: leave a scrolled page, open an item, press Back: same scroll position
- [ ] Slow route (add a 1.5s server delay): the click answers within ~150ms, no frozen gap over 100ms
- [ ] A second click mid-transition ends on the last link (native styles)
- [ ] Production build only: durations correct (a minified `.8s` parsed right), no console or hydration errors
- [ ] Works in Chromium, Firefox and WebKit engines
- [ ] The designer's answers above are respected and written down

## Reference files

- `references/view-transitions.md`: native transitions in Next.js (page, direction, morph, Suspense), plus plain-JS version
- `references/page-loader.md`: the first-load intro/loader, sequencing, readiness, session rule
- `references/transitions-gsap.md`: the curtain (cover, hold, uncover, content) and other GSAP choreography
- `references/transitions-motion.md`: first-load entrances, overlays and spring morphs with Motion
- `references/accessibility.md`: reduced motion, focus, screen readers, skip link, scroll
- `references/performance.md`: budgets and a script that measures them
- `references/pitfalls.md`: what breaks, and how it was found
- `references/timing-values-to-move.md`: page-specific timings (phases, curtain, loader); general values are in web-motion
