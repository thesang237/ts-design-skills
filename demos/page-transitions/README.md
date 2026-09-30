# Page transitions demo

A small Next.js app that shows what the `page-transitions` skill builds: a first-load intro and three
page transition styles. All content is placeholder.

## Run it

```
npm install
npm run build && npm start      # then open http://localhost:3000
```

Use the production build (`build` + `start`). `npm run dev` also works, but it is slower and hides
problems that only appear in production.

## What to try

- **The intro**: plays once per session (1.4s). Use "Replay the loader" to see it again.
- **Fade + rise**: the old page fades out completely, then the new page fades in and rises. No overlap.
- **Directional slide**: Work → About → Journal slide one way; going back slides the other way.
- **Curtain (GSAP)**: a box covers the page, the route changes underneath, the box leaves onto an empty page, then the content arrives. Choose whether the box leaves up or down.
- **Shared element**: open a card on Work; the swatch glides into the detail page.
- **Slow page**: open Journal. It answers at once with a skeleton (the data takes 1.4s).
- **Reduced motion**: turn on "Reduce motion" in your OS; movement disappears, a short fade stays.
- **No View Transitions**: tick the box in the panel; navigation still works, it just swaps.
- **Back button**: the browser's Back button cuts instantly (a Next.js 16.3 limit) but restores your scroll position.

The panel at the bottom-left is demo-only. It changes the style, the total duration (default 800ms),
the easing, and can make loading slower to test the loader.

## Where things are

| File | What it does |
| --- | --- |
| `src/lib/boot-script.ts`, `components/boot-controller.tsx`, `styles/boot.css` | The intro/loader |
| `src/app/template.tsx`, `components/page-transition.tsx`, `lib/transition-types.ts` | Native page transitions |
| `src/components/transition-link.tsx` | Link that picks the style at click time |
| `src/components/curtain.tsx` | The GSAP curtain |
| `src/components/reveal.tsx`, `lib/entrance.ts` | First-load entrances (Motion) |
| `src/components/route-focus.tsx` | Moves focus to the new heading after navigation |
| `src/styles/transitions.css` | All transition timing and CSS |

The reasoning and rules are in `plugins/page-transitions/skills/page-transitions/`.
