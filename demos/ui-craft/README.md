# ui-craft demo

One static page, no build step. Open `index.html` in a browser (double-click it, or `open index.html` on a Mac).

`tokens.css` is the single source of truth: spacing, type, colour roles (OKLCH), radius and depth, focus, density. Copy it into a project.

What to try:

- **Theme and control height** (top right): the whole page re-reads the tokens. Dark mode lifts surfaces instead of inverting.
- **Contrast**: computed live from the token values for the current theme (text 4.5:1, boundaries and focus rings 3:1).
- **States**: every component in default, hover, focus, active, disabled, loading and error, side by side. Press <kbd>Tab</kbd> anywhere to see the double focus ring.
- **Forms**: a wired form. Click a label (its input focuses), tab away from an empty field (the error appears after interaction), submit with errors (focus moves to the error summary).
- **Empty, loading, error**: the states people actually see.
- **Dialects**: product UI next to a showcase layout that scales with its container (`1em = 1cqw`).
- **Don't / do**: four never-do items as before and after.

Respects `prefers-reduced-motion` and `prefers-contrast: more`.
