# Architecture of a chapter guide (Next.js App Router)

## File layout

```text
app/[...]/<page>/learn/
  layout.tsx          # metadata (title, description) — the page itself is a client component
  page.tsx            # 'use client'; imports the stylesheet, dynamic(() => import(Guide), { ssr: false })
modules/<Page>Learn/
  Guide.tsx           # shell: Lenis + ticker, hero, tabs, chapter view, TOC, prev/next
  learn.scss          # theme tokens + the few custom pieces (range slider, flip cards, tooltips)
  content/
    chapters.ts       # [{ id, n, label, blurb }] — the single source for tabs, nav and quiz
    cards.ts          # flashcards per chapter id
    glossary.ts       # term → { plain, lens }
  kit/
    ui.tsx            # ChapterHead, Section, P, C, Term, Lens, KeyIdea, Callout, Where, Code, Steps, Table, TryThis, Card, Grid
    controls.tsx      # Demo frame, Slider, Toggle, Segmented, Btn, Readout, Group, ColorInput
    loop.ts           # useParams, useTicker, useThreeCanvas, disposeTree
    gsap.ts           # registers plugins once, re-exports gsap
    math.ts / glsl.ts # re-export the SOURCE project's helpers (read-only reuse)
    Flashcards.tsx
  chapters/<Name>.tsx # one file per chapter, default export
  demos/<Name>.tsx    # one file per demo
```

## Route

```tsx
// page.tsx
'use client';
import '@/modules/PageLearn/learn.scss';   // load styles with the route, not inside the lazy chunk
import dynamic from 'next/dynamic';
const Guide = dynamic(() => import('@/modules/PageLearn/Guide'), { ssr: false });
export default function Learn() { return <Guide />; }
```
Client-only (`ssr: false`) because every chapter uses WebGL, canvas, localStorage or the hash. It
also means lazy state initialisers may read `window`, `location.hash` and `localStorage` directly.

## Shell responsibilities

- **One clock:** `<ReactLenis root options={{ autoRaf: false }}>` driven by `gsap.ticker`;
  `lenis.on('scroll', ScrollTrigger.update)` (via `useLenis` callback). Demos use the same ticker.
- **Chapters are lazy:** `const VIEWS = { map: dynamic(() => import('./chapters/Map'), { ssr: false, loading }) , … }`.
  Only the open chapter's code (and its WebGL contexts) exists.
- **Hash routing:** initial chapter from `location.hash` in the `useState` initialiser; `pushState`
  on tab click; listen to `hashchange` + `popstate`. Scroll to the tabs' top when switching chapters
  if the reader is below it.
- **Visited chapters** in state initialised from `localStorage`; persist in an effect that writes
  storage (never setState inside the effect body).
- **Chapter container is keyed** by chapter id (`key={active}`) so every chapter mounts fresh and
  cleans up fully.
- **Scroll triggers stay correct:** a `ResizeObserver` on the chapter container calls
  `ScrollTrigger.refresh()` (debounced) whenever its height changes (lazy chapters, async code
  highlighting, images).
- **Table of contents:** scan `[data-toc]` headings with a `MutationObserver`, highlight the current
  one with an `IntersectionObserver` (`rootMargin: '-20% 0px -70% 0px'`).
- **Progress bar** in the top bar: write `transform: scaleX(progress)` directly from the Lenis scroll callback.
- **Top bar and tabs:** fixed top bar (back link, current chapter, "n/13 read"), sticky tab row with
  horizontal scroll; the active tab is scrolled into view.
- **Footer of each chapter:** flashcards, then previous/next cards with the chapter blurbs.

## Theme

- Tokens on the guide root (`--bg`, `--panel`, `--line`, `--ink`, `--dim`, `--faint`, one accent,
  two supporting accents, warning). Tailwind arbitrary values read them: `text-[var(--dim)]`.
- Two families: a readable sans for prose (16px / 1.75, ≤ 68ch), a mono for labels, values and code.
- `overflow-x: clip` on the root (hidden tooltips and wide demos can't widen the page; sticky still works).
- If the host site scales its root font-size, scope a fixed root size to the guide:
  `html:has(.guide-root) { font-size: 16px; }`.
- A subtle grain overlay and dot grid are enough decoration; demos carry the visual interest.

## Kit components (what each is for)

| Component | Use |
| --- | --- |
| `ChapterHead` | number, kicker, big title (the promise), lead paragraph |
| `Section` | numbered section with `data-toc` heading |
| `P`, `C` | prose paragraph; inline code chip |
| `Term` | dotted word with a tooltip from the glossary: plain meaning + designer lens |
| `Lens` | "Designer lens" card: the idea in Figma / After Effects terms |
| `KeyIdea` | the one sentence to remember |
| `Callout` | tip / watch out / "this page does it too" |
| `Where` | "In the source →" file chips |
| `Code` | highlighted code with a file caption and highlighted lines |
| `Table`, `Steps`, `Card`, `Grid` | comparisons, recipes, side-by-side ideas |
| `TryThis` | 2 to 4 prompts under a demo |
| `Demo` | frame: title, hint line, stage, controls panel (side on wide screens, below on narrow), reset |
| `Slider`, `Toggle`, `Segmented`, `ColorInput`, `Readout`, `Group` | dials, each with a one-line meaning |
| `Flashcards` | flip cards; the quiz pools the same data |
