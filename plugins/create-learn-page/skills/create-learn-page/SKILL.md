---
name: create-learn-page
description: Use when building a "learn", breakdown or case-study page that teaches how an existing page, effect or project works, for example "make a /learn page for this", "break down how this site does X", "teach a designer how this was built". Plans a curriculum from the real source code, builds a chapter guide (tabs, plain-language explanations, live demos with dials, short annotated code, flashcards and a final quiz) in React / Next.js, and verifies every chapter on desktop and phone. For the motion, 3D and UI techniques being taught, follow web-motion, 3d-web and ui-craft.
---

# Create a learn page

A learn page turns a finished project into a course: a designer should finish it able to explain,
tweak and rebuild every technique. **Study the real source first, teach in plain words, and let the
reader break things with dials.** Checked on 2026-09-30 against Next.js 16, React 19, GSAP 3.15,
Lenis 1.3 and three.js r186.

Related skills (don't repeat them here):
- **web-motion**: timing, scroll, text effects the page teaches (and the guide's own motion).
- **3d-web**: WebGL/three.js techniques, the canvas harness rules, 3D performance.
- **ui-craft**: layout and type of the guide itself.
- **quality-check**: the final review pass. **skill-retro**: run it after the guide ships.

## Before writing any code: ask the designer

1. Chapter guide or single long page? 2. Who is the reader (designer, developer, client)?
3. Theme: match the source page, or a neutral reading theme? 4. Anything off-limits (client names, code
that must not be shown)?

### Sang's answers (taste session, 2026-09-30). Use these unless told otherwise

- **Chapter guide by default** (the single long page only for one small effect): hero → "how to use
  this guide" → sticky chapter tabs → chapters → flashcards per chapter → final quiz.
- Reader: a **UI/UX product designer**. Plain language first, a "designer lens" that maps each idea
  to Figma / After Effects, code second and short.
- Every non-trivial idea gets a **live demo with dials**; "break it on purpose" prompts under demos.
- Ask before visual decisions (theme, accent, type). Existing reference: dark slate reading theme,
  one icy accent, sans body + mono labels, bracket-corner tabs.

## The process

1. **Study the source** (`references/curriculum.md` §1). Read every file of the page. Run it and
   measure (fps, draw calls, memory, errors) instead of guessing. List each technique with its file,
   what it does in one sentence, and what's fragile.
2. **Plan the curriculum** (§2). One technique per chapter, ordered so each builds on the previous:
   the map (whole system) first, "build your own" last. 8 to 14 chapters. For each: the one idea to
   remember, 1 to 3 demos, the source files, 3 to 5 flashcards. Show the plan before building.
3. **Build the shell and kit** (`references/architecture.md`): route, lazy-loaded chapters, hash-synced
   tabs, auto table of contents, teaching blocks, demo frame + controls, canvas harness, flashcards, quiz.
4. **Write chapters** with the teaching pattern (`references/teaching-patterns.md`): idea → lens →
   demo → code → try this → remember → where in the source.
5. **Build demos** (`references/demo-kit.md`): teaching copies that import the source's real helpers,
   one clock, paused off screen, disposed on tab change.
6. **Verify** (`references/verification.md`): types, lint, every tab mounts without console errors,
   no sideways scroll at 375px and 1440px, demos render, interactions work.

## Core rules

1. **Never change the source project's code** while building its guide. Import its helpers read-only;
   rebuild everything else as clean teaching copies.
2. **Plain language first.** Each section opens with what it looks like and why, in design words.
   Jargon gets a hover definition (glossary) the first time it appears.
3. **One idea per chapter, one "Remember" line per section.** If a section needs two, split it.
4. **Demos teach by breaking.** Every dial has a one-line meaning; defaults equal the source's values;
   a reset button; at least one "try this" prompt that makes the effect fail or exaggerate.
5. **Code is short and real.** Trimmed from the source with the file path as caption, highlighted
   lines for the key idea. Never a wall of code without the prose above it.
6. **Point to the source.** Each chapter ends with "In the source →" chips (file paths).
7. **Only the open chapter costs anything.** Chapters are lazy-loaded; demos pause off screen and
   free their GPU memory (dispose + lose context) when the tab changes.
8. **The guide uses the techniques it teaches** (one clock, smooth scroll, reveals) and says so.
9. **Respect the host site.** Read its global CSS first (root font-size, resets of `pre`, `blockquote`)
   and scope any fix to the guide (`references/pitfalls.md`).
10. **Memorisation is built in:** flashcards at the end of each chapter, a pooled quiz at the end.
11. **No client names, brand assets or copy** when the guide or its demos will be reused elsewhere.

## Quality checklist

- [ ] Every chapter follows the pattern; every section has one "Remember" line
- [ ] Every demo has a hint, dials with meanings, a reset, and a "try this"
- [ ] Every chapter has "In the source" file chips and 3 to 5 flashcards; the quiz draws from all
- [ ] Tabs sync with the URL hash; back/forward works; a pasted link opens the right chapter
- [ ] Type-check and lint pass, and you confirmed they actually ran (non-empty output or exit code)
- [ ] All chapters mount with zero console errors (script in `references/verification.md`)
- [ ] No sideways scroll at 375px and 1440px on any chapter
- [ ] 3D demos: 60fps on a laptop, pause when off screen, no leak after switching tabs 5 times
- [ ] Reduced motion: demos still usable, nothing auto-plays movement you can't stop
- [ ] Keyboard: tabs, sliders, flashcards and quiz reachable and usable
- [ ] The designer approved the curriculum and the visual direction

## Reference files

- `references/curriculum.md`: studying the source, the chapter plan, the standard chapter set
- `references/architecture.md`: routes, shell, tabs, TOC, kit components, file layout
- `references/teaching-patterns.md`: section pattern, block catalogue, voice and wording
- `references/demo-kit.md`: params hook, one-clock ticker, canvas harness, demo types that teach
- `references/verification.md`: type/lint, mount-all-tabs, overflow scan, headless screenshots
- `references/pitfalls.md`: what broke while building a real guide, with fixes
