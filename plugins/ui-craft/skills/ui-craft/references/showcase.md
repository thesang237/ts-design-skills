# The showcase dialect

For creative portfolios, campaign and landing pages, editorial and case-study sites: **one visit, one
impression.** Everything here is chosen for impact, and most of it should *not* be used in dashboards,
shops, forms or web apps. The values come from taking apart a real editorial page and measuring it.

## What defines it

1. **One scalable unit.** `font-size: 1vw` on the page root makes `1em` equal 1% of the window width; every length is a multiple of it. At 1920px 1em = 19.2px, at 1440px 14.4px, and the whole layout scales like one image. (The `font-size` is set on the page wrapper, not on `html`, so `rem`-based components elsewhere keep working.)
2. **A tiny vocabulary of em values.** One gutter (about `0.97em`), one thick bar (`3.19em`), one label size (`0.95em`), a big text size (`5.5em`), a display size (`9.5em`), a few named gaps (`5.5em`, `9.7em`, `20em`). The discipline is the same as the 4px scale in product UI, in a different unit.
3. **Structure from hairlines.** A 1px rule inset by one gutter, a vertical 1px divider between a 33% and a 66% column, a single heavy bar. No cards, no shadows, no filled panels.
4. **Display type that does the layout.** 5 to 10vw, line-height 0.85 to 0.92, tracking −0.03em, weight 500. Lines anchored to the bottom of their column, a lot of empty paper above.
5. **Full-height images, one idea per screen.** Photos fill a third or a whole screen, covered with `object-fit: cover`, sitting on a colour placeholder.
6. **One signature detail used everywhere.** For example a link underline that swaps (one line leaves, one arrives), reused on every link, arrow and button rule.
7. **A phone layout with its own multipliers.** 1vw is 3.75px on a phone, so at ≤ 479px the same em values are replaced with larger multipliers (hero 9.6em instead of 5.69em, label 3.8em instead of 0.95em) and the columns stack. The pinned stage becomes a plain list.

## Rules when you use it

- **Contain it.** Showcase tokens live on the marketing routes; product routes use product tokens. Share colour roles, the spacing discipline, states and focus.
- Keep the same states discipline: hover only on `(hover: hover)`, a visible focus ring, reduced motion respected. A poster page is still a web page.
- **Contrast still applies.** Small label text on paper must reach 4.5:1; huge display type may be lighter (3:1).
- **A control must still look like a control.** Text-only buttons with a swap-on-hover are fine when there is still an underline, an arrow or a rule at rest.
- Full-screen blocks use `svh`; the wrapper uses `overflow: clip` (so `position: sticky` still works); text that is masked for a reveal gets descender padding.
- Don't scale up body text beyond what is comfortable: long paragraphs stay at 60 to 72ch even on a 27-inch screen. Em-based layouts can make small text too small on narrow laptops; clamp the label size (`max(12px, 0.95em)`).
- Motion: masks, scrubbing and pinned stages are in web-motion (immersive mode); loaders and overlays in page-transitions.

## What to borrow for product UI

| Borrow | Why it works in an app |
| --- | --- |
| One gutter, one scale, used without exception | Consistency without effort |
| Hairlines instead of boxes (and no shadow except on floating layers) | Calm, fast to scan, cheap to render |
| Hierarchy from size and space, colour last | Survives dark mode and colour blindness |
| A hard left edge and a few alignment lines | Order |
| Generous empty space around the primary action | Focus |
| One signature hover used everywhere | Brand without decoration |
| Every state designed (default, hover, focus, active, disabled) | Trust |

## What not to borrow

Giant type, full-height images, scale-with-window layout, scroll-pinned stages, text revealed by masks on content people reread, controls with no visible boundary at rest, tiny label type.
