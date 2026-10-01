---
name: product-configurator
description: Use when building, changing or reviewing a 3D product configurator on the web (any product - furniture, shoes, bikes, lamps, keyboards, cars), on a landing page or in an e-commerce store, usually with three.js / React Three Fiber in React or Next.js. Covers the product-as-data model (options, variants, compatibility rules with reasons, pricing, shareable links, undo and reset), PBR materials and stutter-free swaps, the options panel (all control states, accessibility, phone layout), camera presets that follow the part being edited, performance budgets and lazy loading, posters and fallbacks, and connecting a configuration to cart, checkout, snapshot images and optional AR. General 3D comes from 3d-web, interface rules from ui-craft, motion from web-motion, the review pass from quality-check.
---

# Product configurator

A configurator is a **shop page with a 3D product in it**, not a 3D scene with buttons on it. The
product is data, the rules explain themselves, every choice shows instantly and smoothly, and the
result can be shared, priced and bought. Checked on 2026-10-01 against three.js r186, React Three
Fiber 9.8, drei 10.7, Next.js 16.3, the glTF `KHR_materials_variants` extension, `<model-viewer>`
and the Shopify Ajax Cart API. Learned from two builds (a 75% keyboard configurator and the chair
demo in `demos/product-configurator`); their problems are in `references/pitfalls.md`.

Related skills (don't repeat them here):
- **3d-web**: canvas setup, lights, glTF compression, quality tiers, posters and fallbacks, WebGPU, cleanup.
- **ui-craft**: tokens, the state matrix, focus, forms. This skill says *which* panel states a configurator needs.
- **web-motion**: easing and durations. This skill sets swap and camera timing on top of it.
- **quality-check**: the full review pass.

## Before writing any code: ask the designer

1. The product: its parts, which options change shape vs. only material, and real photos or samples to match.
2. Where it lives: a landing-page hero, a product page next to photos, or a full-screen "build yours" page? Is there a real cart?
3. The model: an existing CAD/glTF file (who owns it, what license), a commissioned model, or built in code?
4. Options, prices, rules and stock: who owns the data, and where does the final price get checked?
5. Panel feel, swap and camera speed, and anything they never want to see (questions below are already answered for Sang).

### Sang's answers (taste session, 2026-10-01). Use these unless told otherwise

- **Panel: a shop sheet.** A light, roomy side sheet (bottom sheet on phones) with big swatches,
  option names, the current choice and its price difference, a live total and an Add to cart button.
  ui-craft's warm paper tokens, one accent for the primary action only.
- **Speed: balanced.** Material and shape swaps crossfade in **200 ms** (ease-in-out). The camera
  glides to a part in **about 0.8 s** (ease-in-out). Price updates instantly with a quiet highlight.
- **Never:** a product that keeps spinning while people choose or read (no auto-rotate by default;
  if a client insists, it stops on the first interaction and never restarts by itself), a loading
  spinner on a blank canvas (always a poster image of the product first), bouncy or springy camera,
  panel or swap motion (no overshoot anywhere).

## Approach (a new configurator, step by step)

1. **Write the product as data first** (`references/config-model.md`): options, choices, prices,
   rules with plain-language reasons, camera views, which options feed which part's material. Write the
   engine's tests before any 3D.
2. **Get the model ready** (3d-web `assets.md`): split into named parts that match the options, real
   scale in metres, one material per swappable surface. Prefer one glTF with `KHR_materials_variants`
   when the variants come from a 3D artist. Compress (Meshopt + KTX2). Note every asset's license.
3. **Build the material library** (`references/materials.md`): one shared material per look, all
   textures uploaded and every shader variant compiled before the product appears, then crossfade swaps.
4. **Stage and camera** (`references/camera-and-presentation.md`): give the canvas its own box, a studio
   light, contact shadow, a view preset per option group, glide on edit, hand over to the person on drag.
5. **Panel** (`references/panel-ui.md`): real radio groups, every state, reasons for disabled choices,
   repair notes, live price, sticky actions, phone layout.
6. **Poster, lazy load, budgets** (`references/performance.md`): poster on first paint, 3D after it,
   measure against the budget on a phone.
7. **Commerce** (`references/commerce.md`): share code in the URL, cart line with the code and a
   snapshot, the store re-checks the price, optional AR.
8. **Verify** with the checklist below and quality-check; read `references/pitfalls.md` first.

## Core rules

1. **The product is data; the code is generic.** Options, choices, prices, rules, views and part to
   material mapping live in one definition. No product names in components, no `if (chair)` anywhere.
2. **One configuration, many readers.** A configuration is one choice id per option. The panel, the
   3D scene, the price, the URL and the cart all derive from it. Nothing else holds option state.
3. **Rules explain themselves.** Hide choices that belong to another family (leather colours under
   fabric). Disable choices that a rule forbids, but keep them visible and focusable with the reason
   next to them, and offer the change that would allow them. When a choice forces a repair, say what
   changed and why. Never let an option silently change price or availability.
4. **The leading choice always wins.** Picking the "if" side of a rule is never blocked; the dependent
   option is repaired to its default or the first allowed choice, in the same undo step.
5. **Every configuration is a link.** Keep a readable share code in the URL (`replaceState`, not a new
   history entry per click). Decode defensively: unknown or impossible codes are repaired and the
   person is told.
6. **Undo, redo and reset are part of the product,** one step per decision (a repair or a "switch to"
   fix is the same step as the choice that caused it). Hover, camera moves and panel state never enter history.
7. **No stutter on swap.** Build every variant's geometry once; share one material per look; upload
   all textures and compile every shader variant, *exactly as the real meshes use them*, before the
   reveal. Crossfade materials and shapes in 200 ms; rapid clicks resolve to the latest choice.
8. **The camera follows the edit, the person can always take over.** A view preset per option group;
   glide to it when that group changes; any drag cancels the glide at once. Presets adapt to the stage's
   aspect so nothing crops on phones. Never auto-rotate while choosing.
9. **A poster before anything else.** First paint shows a still image of the product (rendered from the
   configurator itself) next to a working panel. The 3D bundle loads after it and fades in when a real
   frame has been drawn. Without WebGL, or after a GPU reset, the poster stays and the panel still works.
10. **The price you show is a preview.** The store recomputes it from the configuration code before
    checkout. Show what's included ("Included", "+$90"), the total with tabular numbers, and delivery info.
11. **Cart lines carry the code, a summary and a snapshot.** The snapshot comes from a fixed hero
    camera, not wherever the shopper last orbited.
12. **Product pages render on demand.** `frameloop="demand"`, invalidate during glides and fades only.
    Budgets in `references/performance.md`. Measure frame time while swapping, not just while idle.
13. **Accessible by construction.** Options are real radio groups (one tab stop per group, arrow keys);
    names include price and availability; repair notes and price are announced; the canvas has keyboard
    orbit or view buttons; reduced motion turns glides into cuts and fades into swaps.
14. **No brand assets or copied client code** in reusable code or demos. Placeholder products, prices
    and colours; every model and texture has a noted license (CC0 or built in code for demos).

## Quality checklist (run before calling it done)

- [ ] The product definition is the only place options, prices and rules live; the engine has tests (including a second, made-up product)
- [ ] Every rule has a reason; disabled choices show it; clicking one offers a fix; repairs say what changed
- [ ] The URL reproduces the configuration in a new tab; a broken link is repaired with a notice
- [ ] Undo, redo and reset work, one step per decision, and never record hover or camera moves
- [ ] First swap of each material kind and each shape has no frame over 50 ms (long-task observer)
- [ ] 60 fps while orbiting, swapping and gliding on a laptop; at least 50 fps on a mid-range phone
- [ ] Poster on screen within 0.3 s; 3D interactive within 1.5 s on a fast connection; no spinner on a blank stage
- [ ] Without WebGL and after a lost context: poster stays, panel and price keep working, a short note explains
- [ ] Panel states: default, hover, focus-visible, selected, disabled with reason, repair note, adding, added, error with retry
- [ ] Keyboard only: Tab reaches each group once, arrows change choices, the camera has view buttons, focus is always visible
- [ ] Phone: the product stays visible while choosing (pinned stage), price and Add to cart stay reachable, 44 px targets
- [ ] Reduced motion: glides become cuts, fades become instant swaps, nothing moves on its own
- [ ] Cart line has the code, a readable summary and a hero-camera snapshot; the server recomputes the price
- [ ] Nothing auto-rotates, nothing bounces, nothing spins on a blank stage
- [ ] Every asset's source and license is written down
- [ ] The designer's answers above are respected and written down

## Reference files

- `references/config-model.md`: the product data shape, the rules engine (visibility, availability, repairs, fix suggestions), price, share code, undo/reset, tests
- `references/materials.md`: PBR looks per material kind, the material library, warm-up, crossfades and shape swaps, `KHR_materials_variants`, texture compression
- `references/panel-ui.md`: the shop sheet, swatches vs. tiles, every state, reasons and repairs, price, actions, keyboard and screen readers, phone layout
- `references/camera-and-presentation.md`: stage box, studio light, view presets per option, glides, hand-over, aspect fitting, snapshots, posters
- `references/performance.md`: budgets per device, asset pipeline, lazy loading in Vite and Next.js, render on demand, measuring swaps, fallbacks, cleanup
- `references/commerce.md`: cart lines, server-side price check, Shopify example, snapshots, saved designs, AR with `<model-viewer>`
- `references/upgrades.md`: what to add beyond the basics, in plain words
- `references/pitfalls.md`: what went wrong in real builds, and the fix
