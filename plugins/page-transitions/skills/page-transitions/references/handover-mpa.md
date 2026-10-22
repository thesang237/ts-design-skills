# Hand-over transitions on multi-page (non-SPA) sites

Use this when each route is a real page load (Astro, plain HTML, Webflow exports) and there is no
client router to hold the old page. Found while rebuilding a tile-based brand site.

## The idea: a match cut

Do not animate "from page A to page B". Make the **last frame of A equal the first frame of B**, then
navigate. A clicked tile grows to the full window and becomes the dark opening state of the next page;
the next page starts in that same state and draws its header in. The page change is invisible.

| Step | Page | What happens |
| --- | --- | --- |
| 1. Outro | A | add a class: others fade (0.2 s), the clicked tile grows to the window (0.6 s, `cubic-bezier(.65,0,.15,1)`), its title scales up |
| 2. Wait | A | `event.preventDefault()`, then `setTimeout(() => location.href = href, <same ms as the CSS>)` |
| 3. Opening | B | CSS starts already in the enlarged state; a small inline script at the top of `<main>` plays the opening (lines first, pieces 80 ms apart) |

```js
link.addEventListener('click', (e) => {
  if (innerWidth <= 991 || matchMedia('(prefers-reduced-motion: reduce)').matches) return;  // plain navigation
  e.preventDefault();
  nav.classList.add('close'); tile.classList.add('enlarge');
  setTimeout(() => { location.href = link.href; }, 600);
});
addEventListener('pageshow', (e) => { if (e.persisted) location.reload(); });   // bfcache would show a half-finished outro
```

## Rules

1. **Timer equals the CSS duration.** Keep the number in one variable; a mismatch shows as a flash.
2. **Old leaves completely before new arrives.** Overlapping the new opening with the outro puts two
   titles and two sets of lines on screen: it looks like a bug.
3. **Keep it under about 0.7 s.** Longer turns navigation into waiting.
4. **Skip it where it cannot work:** phones, reduced motion, middle-click and modified clicks.
5. **Reload on `pageshow` with `persisted`**, and set `history.scrollRestoration = 'manual'` plus
   `scrollTo(0, 0)` on pages that open with an intro.
6. **Mark the hidden nav `inert`** until it is interactive; add `.no-transitions` for ~100 ms after a
   resize so the opening does not glitch.
7. **Run the opening early.** Start it from an inline script at the top of the page content (not on
   `DOMContentLoaded`) so it begins while the rest of the page parses.

## Native cross-document option

Where supported, `@view-transition { navigation: auto; }` plus matching `view-transition-name`s gives
the same match cut with no timer. Treat it as progressive enhancement and keep the class-and-timer path
as the fallback for browsers without it.

## Same-document shared-element morph (list to detail)

Set the name on the old element, run the change inside `document.startViewTransition`, and move the name
to the new element inside the callback. While it runs, disable the root cross-fade so only the morph
moves:

```css
html.vt-demo::view-transition-old(root), html.vt-demo::view-transition-new(root) { animation: none; }
::view-transition-group(hero) { animation-duration: var(--vt-dur, .5s); animation-timing-function: var(--vt-ease); }
```

Clear the name after the transition finishes, and keep the instant swap when the API is missing.
