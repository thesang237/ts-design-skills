# Pitfalls: what breaks, and how it was found

Findings from auditing a real portfolio site (hand-built transitions with GSAP, Motion, native
View Transitions, a Lottie loader, Next.js 16 App Router; details generalised) and from building and
testing the demo. Numbers are from production builds in headless Chromium unless stated.

## Loader / intro

| Problem | How it showed up | Fix |
| --- | --- | --- |
| Loader waits for a full animation loop *and* every image | ~3.2s on a fast local connection although images were ready in ~150ms; ~30s at 400 kbps / 400 ms latency | A designed fixed-length intro (`MIN_VISIBLE_MS`) plus a hard cap of ~4s; wait only for fonts and `data-critical` images (`page-loader.md`) |
| Animation runtime fetched from a public CDN at run time | A blocked or slow CDN could stall the loader up to its 10s timeout | Self-host, or use CSS/SVG. Always have a fallback timeout |
| Loader depends on the libraries it is waiting for | Blank page until JS loaded | Server-rendered CSS loader + inline script |
| Branching on `useReducedMotion()` for the first render | React hydration error #418 with reduced motion on (server drew a canvas, client did not) | Same markup on server and client; hide with CSS |
| Loader and page visible together while the loader fades out | A crossfade looks like "two pages overlapping" | Sequence it: loader fully out, then page in (`data-boot` states) |
| Loader shown on every visit | Annoying after the first time | `sessionStorage` flag, read in the inline script |

## Transitions

| Problem | How it showed up | Fix |
| --- | --- | --- |
| Old and new page overlapping | Default recipes (and the first version of this demo) start the new page at 25% while the old one is still leaving | Split the total: old out 0 to 35%, new in 35 to 100% (`view-transitions.md` §4) |
| Next page's content moving before the transition ends | Motion entrances started on mount, during the transition | Entrances only on the first load (`entrance.armed`) |
| **CSS minifier turns `800ms` into `.8s`** | JS read `--pt-dur` with `parseFloat` and treated `.8` as 0.8 *milliseconds*: the curtain ran ~1000x too fast in a production build only | Read the unit: `raw.endsWith('ms') ? v/1000 : v` |
| CSS transform *and* GSAP transform on one element | The curtain box started at 200% instead of 100% (offsets add) | Let GSAP own the transform; hide the idle box with `visibility` |
| Named header shows above the curtain | The browser draws named layers above everything during a native transition | Un-name the header while the curtain runs (`html[data-pt-curtain] .site-header{view-transition-name:none}`) |
| Transition held open while the route loads | With a 3s server delay the whole screen froze 3.08s (one frame gap) after the click | Never wait for data inside the transition; show a skeleton immediately (`view-transitions.md` §6) |
| A "navigating" flag that drops clicks | Click About, click Contact 250ms later: ended on About (second click silently lost) | Let React/Next handle interruption; no global flag. (The curtain blocks input on purpose; native styles do not) |
| Global capture-phase click listener | Works, but re-implements what `<Link onNavigate>` gives for free and had to special-case drags, modifier keys, downloads, targets | Use `onNavigate` |
| Browser Back/Forward not animated | 0 view transitions on Back/Forward in all three engines (Next 16.3.7) | Accept a cut (scroll is restored). Options below |
| Depth effect that does nothing | `translateZ(±250px)` with no `perspective` on any ancestor: no depth, only scaling | Remove `translateZ`, or add real `perspective` and test |
| Big motion, long duration | 250px travel + 1.25 to 1 scaling over ~700 to 840ms on every click | Smaller motion; the designer sets the length through web-motion |
| `default="none"` without `share` | Shared-element pair silently stops morphing | Always pass `share` with `default="none"` |
| Same `view-transition-name` twice | Transition skipped with no error (looping galleries that repeat items) | Name only one rendered copy at a time; clean names up afterwards |
| Two systems animating one element | Flicker, jumps | One owner per element per moment |
| Blur inside the fade (`filter: blur`) | Costly on large snapshots | Opacity and translate only |
| Overlay swallows clicks | Clicks lost while `::view-transition` is up | `::view-transition { pointer-events: none }` |
| Transition on hash-only links | Pointless animation | Skip when the pathname is unchanged |
| A `loading.tsx` that repeats the page heading | Heading remounts and its entrance replays when data arrives | Put the Suspense boundary inside the page |

## Scroll and focus

| Problem | How it showed up | Fix |
| --- | --- | --- |
| Custom scroll container + smooth-scroll library | Next's automatic scroll reset/restore only works on the window, so scroll had to be restored by hand. The audited pages happened not to scroll, so that code path was untested | Keep the window as the scroller |
| Focus left on the clicked link | After navigation `activeElement` was the nav link (or `body` in Safari) | `RouteFocus` (`accessibility.md`) |
| No skip link | Keyboard users tab through the header on every page | Add one |
| Test artefact | Playwright's `click()` scrolls the target into view first, so "scroll before opening" looked wrong | Read `scrollY` immediately before the click |
| Test artefact | A hidden panel at rest still "covers" the viewport geometrically | Only measure while `data-active="true"` |

## Options if Back/Forward animation is required (not built or tested here)

1. **Accept the cut.** Scroll is restored; this is what most sites do.
2. **Manual transition around `router.back()`:** call `document.startViewTransition(async () => { router.back(); await routeCommitted })`, where `routeCommitted` resolves from a `usePathname()` effect (with a timeout). It works, but you now own a second transition path with its own CSS and clean-up (the audited site did this).
3. **Navigation API** (`navigation.addEventListener('navigate')`, `event.navigationType === 'traverse'`): available in current Chrome, Safari and Firefox, but it competes with Next's router. Prototype on a branch first.
4. Wait for the framework to run popstate navigations as Transitions.

## Ideas that look good but need a decision

- Gesture-driven "swipe back" that scrubs the transition on touch.
- Nested view-transition groups (`view-transition-group: nearest`, Chrome 140+) so a morphing card stays clipped by its container. Progressive enhancement only.
- `ViewTransition.waitUntil` (upcoming) to hold a transition for a short async step without freezing.
