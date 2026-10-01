# Component states

A component is not finished when its default looks good. It is finished when **every state has been
designed, once, as tokens**, and the same rules apply to every component. Timing and curves come from
web-motion (hover and press 100 to 160ms, press 0.97).

## The state matrix

| State | What changes (change 1 or 2 things, never 5) | Notes |
| --- | --- | --- |
| **Default** | The resting design | Must already look clickable: a boundary, an underline or a fill |
| **Hover** | Surface steps one level, or the underline swaps | **Pointer only:** wrap in `@media (hover: hover) and (pointer: fine)` |
| **Focus-visible** | The double ring, nothing else | Same ring on every control (below). Never remove it |
| **Active / pressed** | Surface one more step darker, `scale(0.97)` | Visible within ~100ms; must work on touch |
| **Selected / current** | A fill, a weight or a marker, plus `aria-current` / `aria-selected` | Never colour alone |
| **Disabled** | 45 to 50% opacity, `cursor: not-allowed`, no hover, no press | Say **why** (helper text, tooltip is not enough). Prefer `aria-disabled` + a message over a dead button when the reason matters |
| **Loading** | Same size, label stays, a small spinner replaces the icon, `aria-busy="true"`, pointer events off | The layout must not move. Show the spinner only after ~300ms so quick actions don't flash |
| **Empty** | One sentence on what belongs here, one action to add the first thing | Never a blank area. Use a quiet illustration only if it earns its space |
| **Error** | Message under the field or on the item, an icon, the danger colour, `aria-invalid` | What happened + how to fix it + keep the person's input |
| **Success** | A short confirmation near the action (inline or toast), then it leaves | Don't make people dismiss good news |

Per component, decide the matrix on paper before coding. Anything “n/a” is written down as n/a, not forgotten.

| Component | Needs all of | Easy to forget |
| --- | --- | --- |
| Button / icon button | default, hover, focus, active, disabled, loading | a visible label for icon buttons, loading width |
| Link | default, hover, focus, visited (if content), current | an underline or other non-colour cue |
| Input / select / textarea | default, hover, focus, filled, disabled, read-only, error, success | the focus ring, a bound label, error space reserved |
| Checkbox / radio / switch | off, on, indeterminate, hover, focus, disabled, error | 24px hit area around a 16px box |
| Tabs / segmented | default, hover, focus, selected, disabled | keyboard arrows, `aria-selected` |
| Card (clickable) | default, hover, focus, active, loading (skeleton), empty content | the whole card or one link, not both |
| Table row / list item | default, hover, focus, selected, loading, empty list, error row | sticky header + focus not hidden |
| Menu / dialog / toast | closed, open, focus moved in, Escape, focus returned | scroll lock and focus trap |

## Focus: one system, everywhere

A **double ring**: an inner ring in the page colour and an outer ring in the ink colour, so it is visible on
light, dark, flat and photographic backgrounds alike. Set it once for all focusable elements.

```css
:where(a, button, input, select, textarea, summary, [tabindex], [role="button"], [role="tab"]):focus-visible {
  outline: 2px solid var(--focus);           /* outer ring */
  outline-offset: 2px;
  box-shadow: 0 0 0 2px var(--focus-inner);  /* inner ring: fills the offset gap in the page colour */
  border-radius: inherit;
}
/* do not write :focus { outline: none } anywhere, ever */
```
- `:focus-visible` shows for keyboard (and script-managed focus), not for mouse clicks. Keep a fallback for old browsers only if you must support them: `@supports not selector(:focus-visible) { :focus { … } }`.
- **A reset that sets `outline: none` on `:focus`, `button` or `input` is a bug**; if a project has one, replace it with the rule above before anything else.
- Focus rings need 3:1 against the surroundings (1.4.11) and must not be fully hidden by sticky UI (2.4.11, AA): give the page `scroll-padding-top` equal to the sticky header and `scroll-padding-bottom` equal to any sticky footer or banner.
- Move focus on purpose: into a dialog when it opens, back to the opener when it closes, to the new `<h1>` after a route change (page-transitions).
- Don't style `:focus` (mouse focus) at all, except form fields where a visible focus border helps typing.

## Buttons (the pattern for everything else)

```css
.btn {
  --h: 40px; --px: var(--space-4);
  display: inline-flex; align-items: center; justify-content: center; gap: var(--space-2);
  min-height: var(--h); padding-inline: var(--px); border-radius: var(--radius-2);
  font: 500 var(--text-sm)/1 var(--font-sans); border: 1px solid transparent;
  transition: background-color var(--dur-hover) var(--ease-out), transform var(--dur-hover) var(--ease-out);
}
.btn-primary   { background: var(--ink);   color: var(--bg); }
.btn-secondary { background: transparent;  color: var(--ink); border-color: var(--border-strong); }
.btn-accent    { background: var(--accent); color: var(--on-accent); }   /* at most one per view */
@media (hover: hover) and (pointer: fine) {
  .btn-primary:hover   { background: color-mix(in oklch, var(--ink) 85%, var(--bg)); }
  .btn-secondary:hover { background: var(--bg-subtle); }
}
.btn:active                  { transform: scale(0.97); }
.btn[aria-disabled="true"], .btn:disabled { opacity: 0.45; cursor: not-allowed; transform: none; }
.btn[aria-busy="true"]       { pointer-events: none; }                /* keep the label and the width */
```
- Sizes: 32 / 40 / 48 tall; a 32px button still gets a 40px hit area with padding or a pseudo-element if it sits in dense UI.
- One filled primary per view. Secondary is outlined with `--border-strong`. Tertiary is text with an underline or a swap on hover.
- Icon-only buttons have an accessible name (`aria-label`) and a tooltip that is a convenience, not the only label.
- Disabled buttons still need a reason somewhere on the page.

## Forms

```html
<div class="field">
  <label for="email">Email</label>
  <input id="email" name="email" type="email" autocomplete="email" required
         aria-describedby="email-hint email-error" aria-invalid="false">
  <p id="email-hint" class="hint">We only use it to send the receipt.</p>
  <p id="email-error" class="error" hidden>Enter an email like name@example.com</p>
</div>
```
- **A visible `<label>` bound to the input** (`for`/`id`, or wrap it). A placeholder is an example, never a label. React: `useId()` for the pair.
- Hint text sits under the field; the error replaces or follows it and **space for it is reserved** (no jump).
- Validate **after interaction**: style with `:user-invalid` (matches an invalid field only after the person has interacted or tried to submit; Baseline since Nov 2023) instead of `:invalid`. For custom validation set `aria-invalid="true"` and unhide the error with a polite live region.
- Error text: what is wrong, how to fix it, in plain language. Never “Invalid input”. Keep what they typed. On submit, move focus to the first error (or an error summary that links to each field).
- Use the right `type`, `inputmode` and `autocomplete`. `font-size: 16px` minimum on phones. Show a password toggle. Mark optional fields as “(optional)” rather than starring required ones, when most are required.
- `field-sizing: content` makes inputs and textareas grow with their text (Baseline, June 2026): use it for chat boxes and notes; keep a `max-height`.
- Submit buttons are not disabled by default; disabled-until-valid hides why it won't work. If you must, say what is missing.
- Group related fields in `<fieldset>` with a `<legend>`; radio and checkbox groups need it.

## Loading

| Wait | Pattern |
| --- | --- |
| Under ~300ms | Nothing. No spinner flash |
| 300ms to ~1s, a button action | Spinner inside the button; keep its width |
| 1 to ~5s, content | Skeleton in the final shape (same sizes, so nothing shifts); a calm, slow shimmer or none |
| Longer, or progress is known | Determinate progress bar and text |
| Longer than ~10s | Explain, and offer cancel or retry |

Skeletons match the real layout's boxes. With reduced motion the shimmer is static. Keep previous
content on screen while refreshing (stale-while-revalidate) instead of blanking it.

## Empty states

One sentence about what appears here (“Projects you create show up here.”), one clear action (“Create a project”), optional quiet icon. Three kinds, written differently:
- **First use** (nothing yet): invite and explain.
- **No results** (a search or filter): say what was searched and offer to clear the filters.
- **Cleared** (all done): a brief positive line, no action needed.

## Error states

- **Field:** under the field. **Item:** on the row, with a retry. **Page:** replaces the content, keeps the header, says what happened and offers a next step (retry, go back, contact). Never expose raw codes or stack traces; log them instead.
- Announce new errors once (`role="alert"` on a message that appears, or move focus to a summary). Don't announce every keystroke.
- Colour + icon + text. The danger colour alone fails the “not colour alone” rule.
- Offline and permission errors deserve their own wording; a generic “Something went wrong” is the last resort.

## Selected, current and open

`aria-current="page"` for the current link, `aria-selected` for tabs and options, `aria-expanded` for disclosure triggers, `aria-pressed` for toggle buttons. The visual cue is never colour alone: a weight change, a marker, a fill.
