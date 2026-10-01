# The configuration model

Everything starts here, before any 3D. A product is a **definition** (data). A **configuration** is
one choice per option. A small **engine** of pure functions answers every question the panel, the
scene and the cart ask. Because it has no React or three.js in it, it can be tested in milliseconds
and reused on the server to re-check prices.

## 1. The product definition

```ts
// config/types.ts
export type Config = Record<string, string>; // option id → choice id

export type Condition = { option: string; in: readonly string[] };

export type Appearance = {
  kind?: "fabric" | "leather" | "wood" | "metal" | "plastic" | "glass";
  color?: string;
  roughness?: number;
  metalness?: number;
  sheen?: number;
};

export type Choice = {
  id: string;            // stable, readable, used in URLs and orders: never rename once live
  label: string;         // what the shopper reads
  price: number;         // difference in cents; 0 = "Included"
  swatch: { color: string; image?: string };
  appearance?: Appearance; // what it does to the material of the parts it feeds
  showWhen?: Condition;    // only offered in this context (e.g. leather colours with leather)
};

export type Option = {
  id: string;
  label: string;
  view: string;            // camera preset to glide to while editing this option
  display: "swatch" | "tile"; // round swatches for colours and materials, tiles for shapes and yes/no
  default: string;
  choices: readonly Choice[];
};

/** When `if` holds, `then.option` must be one of `then.in`. `message` is shown to the shopper. */
export type Rule = { if: Condition; then: Condition; message: string };

export type Product = {
  id: string;
  name: string;
  currency: string;
  basePrice: number;                                    // cents
  options: readonly Option[];                           // in panel order
  rules: readonly Rule[];
  views: Record<string, { label: string; position: [number, number, number]; target: [number, number, number] }>;
  materials: Record<string, readonly string[]>;         // part → options feeding its material, later wins
};
```

Two kinds of "not available", on purpose:
- **Hidden** (`showWhen`): the choice belongs to another family. Leather colours don't exist for
  fabric, so they aren't shown at all.
- **Disabled with a reason** (`Rule`): the choice exists but conflicts with another option.
  Brushed steel exists, but not with wooden legs. Show it disabled, say why, offer a fix.

Rules have a direction. The `if` side **leads** (never blocked) and the `then` side **follows**
(repaired or disabled). Choose the direction people think in: "the base decides the finish", not the
other way round. This also makes dead ends impossible.

Keep ids stable forever once orders exist: renaming `oak` breaks shared links and order history. Change
the label instead.

## 2. The engine (pure functions)

```ts
// config/engine.ts
const holds = (c: Config, cond: Condition) => cond.in.includes(c[cond.option] ?? "");

export function visibleChoices(p: Product, c: Config, optionId: string) {
  return option(p, optionId).choices.filter((ch) => !ch.showWhen || holds(c, ch.showWhen));
}

export function availability(p: Product, c: Config, optionId: string, choiceId: string) {
  for (const r of p.rules)
    if (r.then.option === optionId && holds(c, r.if) && !r.then.in.includes(choiceId))
      return { available: false as const, reason: r.message };
  return { available: true as const };
}

/** Repairs hidden or forbidden choices, preferring the option's default; reports every repair. */
export function resolve(p: Product, input: Config) {
  const config = { ...input };
  const changes: Array<{ option: string; from: string; to: string; reason: string }> = [];
  for (let pass = 0; pass <= p.options.length; pass++) {
    let changed = false;
    for (const o of p.options) {
      const allowed = visibleChoices(p, config, o.id).filter((ch) => availability(p, config, o.id, ch.id).available);
      if (allowed.some((ch) => ch.id === config[o.id])) continue;
      const next = allowed.find((ch) => ch.id === o.default) ?? allowed[0];
      if (!next) throw new Error(`No valid choice for ${o.id}: the rules contradict each other`);
      changes.push({ option: o.id, from: config[o.id] ?? "", to: next.id, reason: reasonFor(p, config, o.id) });
      config[o.id] = next.id;
      changed = true;
    }
    if (!changed) break;
  }
  return { config, changes };
}

/** The leading side is always allowed; a forbidden follower is refused with its reason. */
export function select(p: Product, c: Config, optionId: string, choiceId: string) {
  const a = availability(p, c, optionId, choiceId);
  if (!a.available) return { config: c, changes: [], blocked: a.reason };
  return resolve(p, { ...c, [optionId]: choiceId });
}

/** For a disabled choice: the one leading change that would allow it ("Switch to Sled base"). */
export function suggestFix(p: Product, c: Config, optionId: string, choiceId: string) {
  for (const r of p.rules) {
    if (r.then.option !== optionId || !holds(c, r.if) || r.then.in.includes(choiceId)) continue;
    for (const cand of visibleChoices(p, c, r.if.option)) {
      if (cand.id === c[r.if.option]) continue;
      const trial = resolve(p, { ...c, [r.if.option]: cand.id }).config;
      if (availability(p, trial, optionId, choiceId).available) return { option: r.if.option, choice: cand.id };
    }
  }
  return null;
}

export const price = (p: Product, c: Config) =>
  p.options.reduce((sum, o) => sum + (choice(p, o.id, c[o.id])?.price ?? 0), p.basePrice);

/** Readable share code: one choice id per option, in order, e.g. "leather.cognac.swivel.black.arms". */
export const encode = (p: Product, c: Config) => p.options.map((o) => c[o.id]).join(".");

export function decode(p: Product, code: string | null) {
  if (!code) return { config: defaults(p), repaired: false };
  const parts = code.split(".");
  let unknown = parts.length !== p.options.length;
  const raw: Config = {};
  p.options.forEach((o, i) => {
    const ok = o.choices.some((ch) => ch.id === parts[i]);
    raw[o.id] = ok ? parts[i]! : o.default;
    if (!ok) unknown = true;
  });
  const { config, changes } = resolve(p, raw);
  return { config, repaired: unknown || changes.length > 0 };
}

/** Material values for a part, merged from its options (kind from one, colour from another). */
export function appearanceFor(p: Product, c: Config, part: string) {
  return Object.assign({}, ...(p.materials[part] ?? []).map((id) => choice(p, id, c[id])?.appearance));
}
```

Readable codes beat opaque ones: they survive copy and paste, analysts can read them, support can
read them on the phone. Use opaque short codes (a hash stored server-side) only when the
configuration is too long for a URL, for example with engraving text or uploaded images.

## 3. State: one store, history built in

```ts
// config/store.ts (zustand)
export const useConfigurator = create<State>((set, get) => ({
  config: decode(PRODUCT, new URLSearchParams(location.search).get("c")).config,
  past: [], future: [], repairs: [], view: "overview", notice: null,

  choose(option, choice) {
    const { config, past } = get();
    if (config[option] === choice) return;
    const r = select(PRODUCT, config, option, choice);
    if (r.blocked) {
      const fix = suggestFix(PRODUCT, config, option, choice);
      get().notify(r.blocked, fix && { label: `Switch to ${label(fix)}`, run: () => get().applyFix(fix, option, choice) });
      return;
    }
    set({
      config: r.config,
      past: [...past, config].slice(-50),     // one step per decision, repairs included
      future: [],
      repairs: r.changes,                      // shown under the options that changed
      view: optionById(option).view,           // the camera follows the edit
    });
  },
  undo() { /* pop past → config, push config → future, clear repairs */ },
  redo() { /* the reverse */ },
  reset() { /* push current, set defaults, view "overview"; a no-op when already default */ },
}));

// Every configuration is a link; replaceState so the Back button isn't full of colour clicks.
useConfigurator.subscribe((s, prev) => {
  if (s.config === prev.config) return;
  const url = new URL(location.href);
  url.searchParams.set("c", encode(PRODUCT, s.config));
  history.replaceState(null, "", url);
});
```

What goes in history: choices, fixes, reset. What never does: hover, camera moves, panel open and
close, notices.

Bigger editors (the keyboard build): when people edit **many surfaces at once** (per-key colours,
multi-select, "apply to all"), keep shared defaults plus sparse per-item overrides, show a **Mixed**
state when a selection disagrees, and merge a continuous slider drag into one undo step (a group id per
drag). Save designs locally with a schema version and validate on load; see `commerce.md` for saved designs.

## 4. Steps or one long sheet?

- **Up to about 8 options:** one sheet, groups in the order people decide (shape, then material,
  then colour, then extras). Each group shows its current choice and price difference in the header.
- **More, or options that only make sense after others:** steps (Shape, then Fabric, then Details,
  then Review) with the same sheet. Later steps never undo earlier ones silently; repairs are explained.
- Put the most visual option first: it gets people moving the product immediately.

## 5. Tests to write first

```ts
it("starts from valid defaults", () => expect(resolve(P, defaults(P)).changes).toEqual([]));
it("hides other families", ...);                // leather colours only with leather
it("repairs a hidden choice and says why", ...);// Oat → Cognac, "Oat isn't offered with Leather."
it("disables with a reason, never hides", ...);
it("the leading side repairs the follower", ...);
it("suggests the change that unlocks a choice", ...);
it("adds up the price", ...);
it("round-trips the share code and repairs bad ones", ...);
it("works for a second, made-up product", ...); // proves nothing is product-specific
```

The demo's `src/config/engine.test.ts` has all of these, including a sneaker defined only as data.
