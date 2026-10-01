# Tokens: spacing, type, colour, radius, depth

One rule: **a component never contains a raw number or colour.** It reads a token. Tokens live in
one CSS file (`tokens.css`), light and dark. Tailwind, shadcn/ui or plain CSS all read from it. The
values below are the defaults from the taste session (4px base, hairline-first, warm paper neutrals,
one accent); a runnable copy with a live contrast checker is in `demos/ui-craft/tokens.css`.

## Spacing: 4px base, a fixed named scale

| Token | px | Use it for |
| --- | --- | --- |
| `--space-1` | 4 | Icon to label, tight inline gaps |
| `--space-2` | 8 | Inside small controls, between related items |
| `--space-3` | 12 | Control padding (vertical 8 to 12), list row gaps |
| `--space-4` | 16 | Default gap, card padding on phones, gutter on phones |
| `--space-5` | 24 | Card padding, gutter on tablet, between groups |
| `--space-6` | 32 | Between groups, gutter on desktop |
| `--space-7` | 48 | Between sections inside a page (product) |
| `--space-8` | 64 | Between page sections (product), small section (showcase) |
| `--space-9` | 96 | Showcase sections |
| `--space-10` | 128 | Showcase sections, hero padding |

- **Only these steps.** In Tailwind that means `1, 2, 3, 4, 6, 8, 12, 16, 24, 32` (units of 4px). Not 5, 7, 9, 10, 11, 14, 20, and not the half steps (0.5, 1.5, 2.5, 3.5).
- **Proximity groups things.** Space inside a group is smaller than the space between groups, always; if you can't tell groups apart, the gaps are too even.
- **Control sizes:** small 32, medium 40, large 48 tall. Icon sizes 16, 20, 24.
- Gutters (page padding): 16 phone, 24 tablet, 32 desktop. Container max widths: prose 720, forms 560 to 640, app content 1200 to 1320.
- **Audit:** this finds off-scale Tailwind spacing (expect a few false positives):
  `grep -rnE "\b(p|px|py|pt|pb|pl|pr|m|mx|my|mt|mb|ml|mr|gap|gap-x|gap-y|space-x|space-y)-(0\.5|1\.5|2\.5|3\.5|5|7|9|10|11|14|20)\b" src`
- Showcase pages may size in `em` (see `showcase.md`), but with the same discipline: a handful of named multiples, one gutter.

## Type: a short scale, two families

| Token | Size / line | Weight | Use |
| --- | --- | --- | --- |
| `--text-xs` | 12 / 16 | 400 to 500 | Captions, legal, badges. Never for body |
| `--text-sm` | 14 / 20 | 400 to 500 | Dense UI, table cells, helper text |
| `--text-base` | 16 / 24 | 400 | Body (use 14/20 in dense product UI) |
| `--text-lg` | 20 / 28 | 500 | Lead paragraph, card titles |
| `--text-xl` | 24 / 32 | 500 to 600 | Section titles |
| `--text-2xl` | 32 / 40 | 500 to 600 | Page titles |
| `--text-3xl` | 40 / 44 | 500 | Marketing titles |
| `--text-4xl` | 56 / 60 | 500 | Display (product ceiling) |

- Roughly a 1.25 ratio. Add a step only when you can name the job it does that no other step does.
- **Two families at most** (a sans for everything, a mono for code, labels and numbers). Weights **400, 500, 600** only, and only those the font really ships: `font-synthesis: none` stops fake bold.
- **Line height:** body 1.5, UI text 1.25 to 1.4, headings 1.1 to 1.25, display 0.85 to 1.0. Tighten display tracking (`-0.02em` to `-0.035em`); open small uppercase labels (`+0.08em` to `+0.14em`).
- **Measure:** 60 to 72 characters (`max-width: 68ch`). Never centre-align more than two lines.
- `text-wrap: balance` on headings and captions (6 lines or fewer in Chromium, 10 in Firefox, then it is ignored); `text-wrap: pretty` on paragraphs.
- `font-variant-numeric: tabular-nums` on prices, counters, timers and table columns so digits don't jiggle.
- Uppercase is for short labels, never sentences. Sentence case for buttons and headings.
- Inputs use **16px minimum on phones** (below that iOS zooms in on focus).
- Showcase fluid type: `font-size: clamp(2.5rem, 1.2rem + 6vw, 8rem)`. Product UI stays on the fixed scale and uses `rem`, so the browser's text-size setting works.

## Colour: roles, not hues

Name colours by **job**. Components use roles; only `tokens.css` knows the actual values.

| Role tokens | Job |
| --- | --- |
| `--bg`, `--bg-subtle`, `--panel`, `--raised` | Four surface levels: page, quiet band, card, popover or hovered card |
| `--border`, `--border-strong` | Hairline (decorative) and component boundary (inputs, outlined buttons: 3:1) |
| `--ink`, `--ink-dim`, `--ink-faint` | Text: primary, secondary, tertiary (all at least 4.5:1 on `--bg`) |
| `--accent`, `--accent-ink`, `--on-accent` | The one accent, the same hue tuned for text on `--bg`, and text placed on the accent |
| `--danger`, `--warning`, `--success`, `--info` | Meaning only. Each has `-bg` (tint), `-border` and `-ink` (text) variants |
| `--focus`, `--focus-inner` | The two rings of the focus system |

```css
:root {
  color-scheme: light dark;                       /* form controls and scrollbars follow the theme */
  /* warm paper neutrals, OKLCH: lightness chroma hue */
  --bg:          oklch(0.965 0.005 85);
  --bg-subtle:   oklch(0.935 0.007 85);
  --panel:       oklch(0.985 0.003 85);
  --raised:      oklch(1 0 0);
  --border:      oklch(0.87 0.009 85);
  --border-strong: oklch(0.62 0.014 85);          /* ≥ 3:1 on --bg: input and button outlines */
  --ink:         oklch(0.2 0.008 85);
  --ink-dim:     oklch(0.42 0.014 85);
  --ink-faint:   oklch(0.52 0.014 85);            /* still ≥ 4.5:1: use for hints, never lighter */
  --accent:      oklch(0.68 0.19 40);
  --accent-ink:  oklch(0.52 0.17 40);             /* the accent as text or a thin line on --bg */
  --on-accent:   var(--ink);                      /* ink on the orange passes; white on it does not */
  --danger:      oklch(0.55 0.2 27);   --danger-bg:  oklch(0.95 0.03 27);
  --warning:     oklch(0.72 0.15 75);  --warning-bg: oklch(0.96 0.05 85);  --warning-ink: oklch(0.45 0.1 70);
  --success:     oklch(0.5 0.13 150);  --success-bg: oklch(0.95 0.04 150);
  --info:        oklch(0.5 0.12 250);  --info-bg:    oklch(0.95 0.025 250);
  --focus:       var(--ink);           --focus-inner: var(--bg);
}
.dark { /* lift surfaces, don't invert; lower the accent's chroma; soften the white */
  --bg:          oklch(0.17 0.006 85);
  --bg-subtle:   oklch(0.2 0.006 85);
  --panel:       oklch(0.22 0.006 85);
  --raised:      oklch(0.26 0.006 85);
  --border:      oklch(1 0 0 / 0.12);
  --border-strong: oklch(0.62 0.01 85);
  --ink:         oklch(0.94 0.004 85);
  --ink-dim:     oklch(0.74 0.008 85);
  --ink-faint:   oklch(0.64 0.01 85);
  --accent:      oklch(0.74 0.16 45);
  --accent-ink:  oklch(0.78 0.14 45);
  --focus:       var(--ink);           --focus-inner: var(--bg);
}
```
(Pick one switch: the `.dark` class, or `light-dark(<light>, <dark>)` with `color-scheme: light dark`, which needs no media queries and is Baseline 2024.)

- **The values above are a starting point. Verify the pairs you actually use** with the contrast checker in the demo (or any audit) and move lightness until they pass; lightness is the knob in OKLCH.
- **Contrast targets (WCAG 2.2):** text 4.5:1 (large text, 24px or 18.7px bold, 3:1); meaningful icons, input and button boundaries, and focus rings 3:1 against their surroundings (1.4.11).
- **One accent in any view.** Use it for the primary action and the current item. If two things are orange, neither is.
- **Semantic colours** appear with an icon and a word. A red border alone is not an error.
- **Dark mode:** raise surfaces step by step instead of inverting; never pure white text (use about 92 to 95% lightness); shadows barely show, so use border and a lighter surface; re-check the accent's contrast; dim photos slightly if they glare.
- **No raw hex in components.** `bg-[#e7e4df]` is a bug even when it looks right.

## Radius and depth: hairline-first

| Token | px | Use |
| --- | --- | --- |
| `--radius-1` | 4 | Chips, small badges, checkboxes |
| `--radius-2` | 6 | Buttons, inputs, selects, tabs |
| `--radius-3` | 10 | Cards, panels, table containers |
| `--radius-4` | 16 | Dialogs, sheets, large media |
| `--radius-full` | 999 | Avatars, status dots, tags and filter pills only |

- **Nested radius = outer radius minus the padding** between them: a 16px dialog with 12px padding holds a 4px child (use 4px as the floor). Mismatched radii are the fastest way to look cheap.
- **Borders:** 1px `--border` for structure; `--border-strong` where the boundary must be perceivable (inputs, outlined buttons). Reserve the border width on hover and focus so nothing shifts (use `box-shadow: inset` or an outline instead of changing border width).
- **Depth:** three levels at most. Flat (the page), raised (a surface with a hairline border), floating (menus, popovers, dialogs, toasts: border plus one shadow).
```css
--shadow-float:  0 1px 2px oklch(0.2 0.01 85 / 0.08), 0 8px 24px oklch(0.2 0.01 85 / 0.12);
--shadow-dialog: 0 2px 4px oklch(0.2 0.01 85 / 0.08), 0 24px 64px oklch(0.2 0.01 85 / 0.18);
```
- Never combine a gradient, a shadow and a border on one surface. Pick one way to say “this is a surface”.

## Z-index and other scales

```css
--z-sticky: 10; --z-header: 20; --z-dropdown: 30; --z-backdrop: 40; --z-dialog: 50; --z-toast: 60; --z-tooltip: 70;
```
No `z-index: 9999`. Each new layer takes the next named step. Durations and curves come from web-motion's presets (`--dur-*`, `--ease-*`); do not redefine them here.

## Wiring

**Tailwind 4 (CSS-first).** Keep tokens as plain CSS variables, then expose them to utilities with `@theme inline` (the same pattern shadcn/ui uses):
```css
@import "tailwindcss";
@theme {
  --spacing: 0.25rem;                       /* p-1 = 4px, p-2 = 8px … only use the named steps */
  --color-*: initial;                       /* drop the default palette so only tokens exist */
}
@theme inline {
  --color-bg: var(--bg);  --color-panel: var(--panel);  --color-ink: var(--ink);
  --color-border: var(--border);  --color-accent: var(--accent);  --color-danger: var(--danger);
  --radius-sm: var(--radius-1);  --radius-md: var(--radius-2);  --radius-lg: var(--radius-3);
  --shadow-float: var(--shadow-float);
}
```
Renamed in v4 (check when migrating): `shadow-sm` → `shadow-xs`, `rounded-sm` → `rounded-xs`, `outline-none` → `outline-hidden`, `ring` (3px, blue) → `ring-3`, default border and ring colour is now `currentColor` (always name it: `border-border`). Needs Safari 16.4+, Chrome 111+, Firefox 128+. `npx @tailwindcss/upgrade` does most of it.

**Tailwind 3.4 (a `tailwind.config`).** Replace the spacing and colour scales instead of extending them, and read the variables:
```ts
theme: {
  spacing: { 0: '0', px: '1px', 1: '4px', 2: '8px', 3: '12px', 4: '16px', 6: '24px', 8: '32px', 12: '48px', 16: '64px', 24: '96px', 32: '128px' },
  colors: { transparent: 'transparent', current: 'currentColor', bg: 'var(--bg)', panel: 'var(--panel)', ink: 'var(--ink)', border: 'var(--border)', accent: 'var(--accent)', danger: 'var(--danger)' },
  borderRadius: { none: '0', sm: 'var(--radius-1)', md: 'var(--radius-2)', lg: 'var(--radius-3)', xl: 'var(--radius-4)', full: '9999px' },
}
```
Because the scale is closed, an off-scale class (`p-5`) simply doesn't exist: the compiler becomes the linter. (With raw OKLCH variables the `bg-ink/50` opacity syntax doesn't work in v3; use `color-mix(in oklch, var(--ink) 50%, transparent)` or define the alpha variants as tokens.)

**shadcn/ui.** Its tokens are background/foreground pairs (`--card`, `--card-foreground`, `--primary`, `--muted`, `--border`, `--input`, `--ring`, a base `--radius` that derives the scale), now in OKLCH. Map the roles above onto those names instead of inventing parallel ones: `--primary` = the ink, `--accent`-coloured actions use a custom `--brand` token exposed with `@theme inline`.
