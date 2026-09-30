---
name: web-motion
description: Use when adding, changing or reviewing any animation or motion on a website or web app, for example easing and duration choices, entrance and scroll-triggered reveals, scroll-mapped scenes (enter, hold, exit tied to scroll progress, pinned or in flow), stagger and choreography, hover and press micro-interactions, text reveals (split lines/words/characters, masks, scramble, typing), springs and drag, smooth scrolling, or choosing between CSS, GSAP and Motion. Provides named motion presets (one source for CSS, GSAP and Motion), stagger and choreography rules, reduced-motion recipes for every tool, and performance rules (transform/opacity only, no layout thrashing). For page loaders and route transitions use page-transitions; for WebGL/3D motion use 3d-web.
---

# Web motion

Motion should explain what changed and make the interface feel responsive, never make anyone wait.
Checked on 2026-09-30 against GSAP 3.15, Motion 13.4, Lenis 1.3.26, React 19 and current CSS
support. Code for everything below is in `references/`, and a runnable demo with a live tuner is in
`demos/web-motion/`.

Related skills (don't repeat them here):
- **page-transitions**: first-load intro/loader, route changes, shared-element morphs. It takes its timing from this skill.
- **ui-craft**: layout, type, colour. Motion follows the design, never replaces it.
- **3d-web**: WebGL, canvas, shaders, 3D scroll scenes.
- **quality-check**: the full review pass. This skill's checklist is the motion part of it.

## Before writing any code: ask the designer

Never pick these silently. Ask, then write the answers down in the project.

1. Main curve and overall feel (snappy product UI, calm editorial, dramatic)?
2. Reveal speed and travel for content arriving on scroll?
3. Where are springs or bounce allowed?
4. Signature heading reveal (masked lines, words, characters, or no splitting)?
5. How much should hover do, and where may it be expressive?
6. Smooth scrolling: yes, no, or only for some sites?

### Sang's answers (taste session, 2026-09-30). Use these unless told otherwise

- **Main curve: smooth-out `cubic-bezier(0.22, 1, 0.36, 1)` everywhere, and no other arrival curve** (no strong-out, expo-out or library presets), the same curve as page-transitions. In-out `(0.65, 0, 0.35, 1)` only for things moving across the screen, ease-in `(0.4, 0, 1, 1)` only for short exits.
- **Reveals are calm: 700ms, rising 18px** (16 to 24px is fine). Not cinematic 1s+ reveals.
- **Springs only for drag and gestures**, with almost no visible overshoot (0.4s, bounce 0.1). Curves everywhere else. No elastic or back-out on text or layout.
- **Signature heading reveal: lines rising from a mask**, one after another.
- **Stagger 70ms between items**; a group never takes longer than about 0.5s to start its last item.
- **Hover is subtle by default** (colour, opacity, a 2px lift, press at 0.97). Expressive hovers (image zoom, sliding details) **only on showcase/work cards**.
- **Scroll scenes** (added 2026-09-30): a section's heading, text and UI enter with the scroll, hold still, then exit. Layout, hold length and scroll-up behaviour (rewind, play back, stay) are chosen per project; defaults are pinned, medium hold, rewind.
- **Smooth scrolling only for editorial or portfolio sites**, opt-in per project, wheel only, off for reduced motion, never for apps or dashboards.

All values live in one presets file: `references/presets.md`.

## Which tool? (decision guide)

| The job | Use | Why |
| --- | --- | --- |
| Hover, press, focus, small state changes | **CSS transitions** | Retarget smoothly when interrupted, zero JavaScript, run on the compositor |
| Element appearing (popover, dialog, toast, `display:none` to shown) | **CSS `@starting-style`** + `transition-behavior: allow-discrete` | Supported everywhere since 2024; enter and exit without JS |
| Looping indicators (typing dots, spinners, caret) | **CSS keyframes**, paused off screen | Cheap, declarative |
| Scroll-triggered reveals in React | **Motion `whileInView`** for blocks and groups; **GSAP ScrollTrigger** for text and timelines | Motion uses one pooled observer; GSAP gives exact sequencing |
| Scroll-linked (scrubbed) effects | **GSAP ScrollTrigger `scrub`**, or **Motion `useScroll`** (uses the browser's native scroll timeline where it can); CSS `animation-timeline` only as a bonus layer | CSS scroll timelines are not in Firefox stable yet |
| Scroll scenes: a section's heading, text and UI enter, hold, then exit with the scroll | **GSAP**: one timeline (enter, hold, exit) mapped to scroll progress, `position: sticky` for pinning | Direction options (rewind, play back, stay), split text, every browser |
| Split text, masks, scramble, typing, multi-step timelines | **GSAP** (SplitText, timelines, CustomEase) | Precise sequencing, re-splits by itself on font load and resize |
| Drag, swipe, anything that follows a finger | **Motion springs** | They carry the hand's speed and can be interrupted |
| Page loaders and route changes | **page-transitions skill** | |

Combine them freely, but **one tool owns one element's property at a time**. Never let CSS
transitions and GSAP both animate `transform` on the same element.

## Core rules

1. **Presets, not numbers.** Every duration, curve, distance and stagger comes from the presets file (CSS variables + a JS module generated from the same values). No `duration: 0.73` in components.
2. **Only `transform` and `opacity` move.** Also fine: `clip-path` on small elements, colour. Never animate `width`, `height`, `top`, `left`, `margin`, `padding`, or `filter`/`box-shadow` on large areas. Growing bars use `scaleX`; shadows fade a pseudo-element's `opacity`.
3. **No layout thrashing.** Never measure the page (`getBoundingClientRect`, `offsetTop`) inside a scroll handler. Measure once and on resize, and let ScrollTrigger, `IntersectionObserver` or Motion watch the scroll.
4. **UI answers fast; content can breathe.** Press, hover and toggles take 100 to 160ms, menus 200 to 250ms, and nothing a user triggers often goes above 300ms. Reveals are 700ms. Keyboard shortcuts and command palettes don't animate at all.
5. **Exits are quicker than entrances** (about 60%) and accelerate away (ease-in, or the reversed ease-out).
6. **Enter from close by.** Rise 18px, scale from 0.95 at most (never from 0), fade with it. Big travel is for rare hero moments only.
7. **Stagger reads as one gesture:** 70ms between items, about half that for words and a fifth for characters, capped so a group finishes starting within about 0.5s.
8. **Everything is interruptible.** Hover out mid-animation reverses from where it is (CSS transitions or GSAP `reverse()`); a second click never queues a replay.
9. **Hover only where hover exists.** Gate hover styles with `@media (hover: hover) and (pointer: fine)`, give keyboard focus the same effect, and never hide information behind hover on touch screens. Press feedback works on touch too (iOS needs a `touchstart` listener for `:active`).
10. **Reduced motion is designed, not switched off.** Remove travel, scale, parallax, scrubbing, springs and smooth scrolling; keep short opacity and colour changes (fade in 160ms, out 100ms). Every tool has a recipe in `references/reduced-motion.md`. Read the setting live: people change it while the site is open.
11. **Text stays text.** Screen readers get the sentence once (a visually hidden copy); the animated copy is `aria-hidden`. Split only after fonts load, re-split on resize, and never cause layout shift (masks padded for descenders, scramble and typing keep every letter's real width).
12. **Content is never lost.** Hide things before their reveal only when JavaScript runs (`html.js`), and show everything if the animation fails. Elements already on screen at load reveal on load; elements scrolled past reveal when scrolled back to.
13. **Infinite loops pause off screen** and stop entirely for reduced motion if they involve movement.
14. **One Motion package** (`motion`, imported from `motion/react`), GSAP only through `useGSAP()` in React (automatic cleanup), plugins registered once.
15. **No brand or client specifics** in reusable code: placeholder names, copy and colours.

## Quality checklist (run before calling it done)

- [ ] Every duration, curve, distance and stagger comes from the presets; no stray numbers in components
- [ ] Only `transform`/`opacity` (plus colour, or `clip-path` on small elements) change during animations: check the Performance panel, or the audit script in `references/performance.md`
- [ ] 60fps while scrolling and hovering on a phone-sized screen with 4x CPU slowdown; no frame over ~33ms
- [ ] No layout shift: text effects are the same size before, during and after their animation
- [ ] Press feedback appears within ~100ms on mouse and on touch
- [ ] Hover effects don't fire on touch; hidden-on-hover details are visible on touch; keyboard focus gets the same effect as hover
- [ ] Quick hover in and out, and double clicks, never snap or queue
- [ ] Reduced motion (OS setting): nothing travels, scales, scrubs or springs; short fades remain; smooth scroll off; loops calm
- [ ] Screen reader reads split, scrambled or typed text once, as normal text
- [ ] Resize the window during a text reveal: it finishes correctly, lines re-split
- [ ] Scroll scenes: hidden before, still during the hold, gone after; scroll back up and check the chosen rewind / play back / stay behaviour, slowly and fast
- [ ] Reload with the page scrolled halfway: everything above and in view is visible
- [ ] Works in Chromium, Firefox and WebKit, phone and desktop, light and dark
- [ ] The designer's answers above are respected and written down

## Reference files

- `references/presets.md`: the named presets, CSS variables, JS module, GSAP and Motion wiring, the shared spring
- `references/choosing-a-tool.md`: CSS vs GSAP vs Motion in detail, with small examples of each
- `references/choreography.md`: stagger, sequencing, enter/exit, interruption, how often something is seen
- `references/scroll.md`: scroll-triggered (once / every time) and scroll-linked motion, pinning, smooth scrolling
- `references/scroll-scenes.md`: enter / hold / exit mapped to scroll progress, pinned or in flow, scroll-up options (GSAP, Motion, CSS)
- `references/hover-press.md`: buttons, links, rolling text, showcase cards, toggles, status loops
- `references/text-reveals.md`: masked and unmasked split reveals, scramble, typing, with enter/exit/hover
- `references/reduced-motion.md`: a recipe for CSS, Motion, GSAP, Lenis and loops
- `references/performance.md`: budgets, what is cheap and what isn't, a measuring script
- `references/pitfalls.md`: what breaks, and how it was found
