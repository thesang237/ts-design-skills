# The options panel

The panel is where people decide. It follows ui-craft (tokens, states, focus) and this file adds what
a configurator needs on top: swatches that are real form controls, reasons, repairs, a live price and
actions that never get lost on a phone.

## 1. Layout: the shop sheet

```
Desktop (≥ 820px)                           Phone (< 820px)
┌───────────────────────────┬────────────┐  ┌──────────────────┐
│                           │ Configure  │  │  product (pinned │
│                           │ Lounge…  ↶ │  │  46svh, sticky)  │
│        product            │ Upholstery │  │  [views]         │
│     (own box, no          │ ● ● ●      │  ├──────────────────┤
│      overlapping UI)      │ Colour     │  │ Upholstery       │
│                           │ ● ● ● ●    │  │ ● ● ●            │
│  [Overview Seat Base]     │ …          │  │ … scrolls …      │
│                           ├────────────┤  ├──────────────────┤
│                           │ $1,410     │  │ $1,410  [Add][⇪] │ ← sticky
│                           │[Add] [Share│  └──────────────────┘
└───────────────────────────┴────────────┘
```

- **The canvas gets its own box** (grid column), so the product is never under the panel and needs
  no camera offset tricks. On phones the stage is `position: sticky; top: 0; height: ~46svh` so the
  product stays visible while the options scroll, and the price bar is sticky at the bottom.
- Sheet width 380 to 440 px on desktop. Sections separated by hairlines, not cards.
- Header: an eyebrow ("Configure"), the product name, and quiet Undo / Redo / Reset text buttons.
- Overlay layouts (a full-screen hero with a floating panel) are the exception. Then the camera must
  re-frame into the free area (`setViewOffset`, see `camera-and-presentation.md`).

## 2. Swatches and tiles are radio groups

```tsx
<fieldset className="option" onFocus={() => focusView(option.view)}>
  <legend className="option-legend">               {/* float: left; width: 100% avoids fieldset gaps */}
    <strong>{option.label}</strong>
    <span>{current.label}{current.price ? ` · +${fmt(current.price)}` : ""}</span>
  </legend>
  <div className={option.display === "swatch" ? "swatches" : "tiles"}>
    {visibleChoices(product, config, option.id).map((c) => {
      const blocked = !availability(product, config, option.id, c.id).available;
      return (
        <label key={c.id} className={option.display}>
          <input
            type="radio" name={option.id} value={c.id}
            checked={config[option.id] === c.id}
            aria-disabled={blocked || undefined}          // not `disabled`: it stays focusable and explains itself
            aria-describedby={blocked ? `note-${option.id}` : undefined}
            aria-label={option.display === "swatch" ? `${c.label}, ${priceText(c)}${blocked ? ", unavailable" : ""}` : undefined}
            onChange={() => choose(option.id, c.id)}      // blocked → notice with the reason and a fix
          />
          {option.display === "swatch"
            ? <span className="swatch-dot" style={{ background: c.swatch.image ? `url(${c.swatch.image})` : c.swatch.color }} />
            : <span className="tile-face">{c.label}<small>{blocked ? "Unavailable" : priceText(c)}</small></span>}
        </label>
      );
    })}
  </div>
  {repair ? <p className="option-note" data-kind="repair" role="status">Changed to {repair.toLabel}. {repair.reason}</p>
   : reason ? <p className="option-note" id={`note-${option.id}`}>{blockedNames} aren't available. {reason}</p> : null}
</fieldset>
```

Why native radios: one Tab stop per group, arrow keys between choices, correct screen-reader
announcements and form semantics, all for free. Hide the input visually (absolute, opacity 0, **`z-index: 1`**
so the hover lift on the swatch can't cover it), style the sibling.

- **Swatches** (colours, materials): 44 px circles (a 40 px minimum on desktop is fine; keep 44 on touch),
  12 px gaps, a 1 px inner hairline so light colours don't vanish. Selected = a 2 px ring with a gap
  in the panel colour. Material swatches use a small rendered or photographed sample, not a flat colour.
- **Tiles** (shapes, yes/no, sizes): label plus price ("Included", "+$90"). Selected = ink border.
- Name the current choice in the group header, so nobody has to decode a circle.

## 3. Every state, and what it looks like here

| State | Treatment |
| --- | --- |
| Default | Swatch with hairline; tile with border |
| Hover (pointer only) | Swatch lifts 1 px; tile border darkens. Nothing important only on hover |
| Focus-visible | The ui-craft double ring around the swatch (outline offset clears the selection ring) |
| Selected | 2 px ink ring with a panel-colour gap; tile ink border; header shows the name |
| Disabled with reason | 40% opacity plus a diagonal stroke (never colour alone); still focusable; reason under the group; choosing it shows the reason and a fix |
| Repaired | An info-tinted note under the option that changed: "Changed to Cognac. Oat isn't offered with Leather." Cleared on the next choice |
| Loading (3D not ready) | The panel works from the first paint. The stage shows the poster and a quiet "Preparing the 3D view" pill |
| Adding to cart | Button keeps its width, shows an inline spinner and "Adding…", `aria-busy`, disabled |
| Added | "Added to cart ✓", the cart drawer opens with the snapshot |
| Error | Button becomes "Try again" with a danger outline; a message below says what happened and that the configuration is kept (`role="alert"`) |
| Link copied | The Share button says "Link copied" for 2 s; on failure, a notice says the link is in the address bar |
| No WebGL / lost GPU | Poster stays; a note says choices still update price and summary |

## 4. Price and summary

- The total sits in the sticky footer with tabular numbers. On change it updates instantly and its
  background flashes the accent at 14% for 400 ms (no counting animation, no bounce). It's an
  `aria-live="polite"` region.
- A breakdown list (`<dl>`) under the options: base price, then each option with its difference.
- Say what the price includes next to it (delivery time, returns), not in a tooltip.

## 5. Notices

One notice at a time, top of the stage, dismissible, with at most one action ("Switch to Sled base
(+$90)"). Notices without an action dismiss after 5 s; with an action they stay until used or
dismissed. `role="status"`.

## 6. Keyboard and screen readers

- Order: view buttons (camera) → Undo / Redo / Reset → option groups (one stop each) → summary →
  Add to cart → Share.
- `⌘/Ctrl+Z` and `⇧⌘Z` for undo and redo, ignored while typing in a text field.
- The canvas is decorative for screen readers (`aria-label` on the stage, a text summary in the panel);
  everything the canvas does has a button: views instead of dragging, zoom buttons if zoom matters.
- Tooltips that open on focus must close on blur; the keyboard build left a row of tooltips open
  while tabbing (see pitfalls).

## 7. Phone details

- `100svh`/`dvh`, never `100vh`. Respect `env(safe-area-inset-bottom)` in the sticky footer.
- The view chips move to the top corner of the stage so they don't cover the product's base.
- Swatches stay 44 px; tiles 2 to 3 per row.
- Opening the cart uses a native `<dialog>` with `showModal()`: focus trap, Escape and backdrop for free.

## 8. Copy

Short and specific: "Included", "+$90", "Unavailable", "Wooden legs come in Oak or Walnut.",
"Changed to Cognac.", "Add to cart", "Adding…", "Try again", "Link copied". Sentence case. Prices in
the shopper's currency with `Intl.NumberFormat`, no decimals unless the store uses them.
