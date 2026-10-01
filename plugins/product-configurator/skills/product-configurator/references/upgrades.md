# Upgrades beyond the basics (plain words)

Five things that make a configurator feel premium, ordered by value for effort. The first four are
built into the chair demo (`demos/product-configurator`).

## 1. Rules that offer a way out

**What it is:** when something isn't available, the panel says why *and* offers the one change that
makes it possible: "Wooden legs come in Oak or Walnut. [Switch to Sled base (+$90)]". When a choice
forces another option to change, a note says what changed and why.
**Why:** dead ends make people leave. Most configurators either hide options (people wonder where they
went) or silently change them (people distrust the price).
**How:** `suggestFix()` in `config-model.md`; one undo step for both changes.

## 2. Every configuration is a link

**What it is:** the address bar always holds a short, readable code for the current product. Copy it,
send it, open it later: same chair. Broken or old links are repaired with a polite note.
**Why:** people decide with someone else ("which one do you like?"); support and sales can open exactly
what the customer sees; marketing can link to curated configurations.
**How:** `encode`/`decode` plus `history.replaceState` in `config-model.md`.

## 3. The camera follows what you edit

**What it is:** choosing a new base glides the camera to a low view of the base; choosing upholstery
glides to the seat. Dragging takes over instantly. View buttons do the same by hand.
**Why:** people see the effect of their choice without hunting for it, and phones (small stage) benefit most.
**How:** a view per option and the glide in `camera-and-presentation.md`.

## 4. A poster first, no blank waiting

**What it is:** a still image of the product appears almost instantly, with a working panel; the 3D
loads behind it and fades in. If 3D can't run, the poster stays and everything else still works.
**Why:** a blank box with a spinner is where people bounce; a product photo is already selling.
**How:** `performance.md` load order, posters rendered from the configurator itself.

## 5. Compare and "view in your room" (next)

**What it is:** pin the current configuration, try another, and flip between them (or see both side by
side as snapshots). Then place the chosen one in your room with the phone camera.
**Why:** the hardest moment is choosing between two good options; seeing it at real size in a room
removes the last doubt for furniture and larger products.
**How:** store up to three pinned codes with hero-camera snapshots; AR with `<model-viewer>` as in
`commerce.md`. Not in the demo yet: it needs a glTF export of the configured product.
