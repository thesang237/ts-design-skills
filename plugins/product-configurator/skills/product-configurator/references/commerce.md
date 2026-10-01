# Commerce: from configuration to cart

A configuration becomes an order line. Three things travel with it: **the code** (what to make),
**a readable summary** (what the shopper and the merchant read), and **a snapshot** (what it looks
like). The price shown in the configurator is a preview; the store decides the real one.

## 1. The cart line

```ts
export type CartLine = {
  productId: string;
  code: string;                                   // e.g. "leather.cognac.swivel.black.arms"
  title: string;
  lines: Array<{ option: string; choice: string }>; // "Upholstery: Leather", "Colour: Cognac"…
  unitPrice: number;                              // display only
  image: string | null;                           // hero-camera snapshot (data URL or uploaded URL)
};

export interface CartAdapter {
  add(line: CartLine): Promise<{ ok: true } | { ok: false; message: string }>;
}
```

The panel only knows the adapter interface. A mock adapter (with a way to force failure, e.g.
`?cartFail=1`) lets you design the adding, added and error states before the store exists.

## 2. The price is checked on the server

Never trust a price from the browser. The server (or the platform) receives the code, runs **the same
engine** (`decode`, `resolve`, `price`) against its own copy of the product definition, rejects
codes that don't resolve, and charges its own total. Sharing one engine module between the
configurator and the server is the main reason the engine has no React or three.js in it.

## 3. Platform patterns

| Platform | How a configuration becomes a line |
| --- | --- |
| **Shopify (Ajax Cart API)** | `POST /cart/add.js` with the base variant id and `properties`: readable ones ("Upholstery": "Leather") plus hidden ones whose key starts with `_` (`_config`: the code, `_image`: a hosted snapshot URL). Properties don't change the price, so price differences need variants, an add-on product per paid option, or an app using a Cart Transform function |
| **Shopify headless (Storefront API)** | `cartLinesAdd` with `attributes: [{ key, value }]`, same idea |
| **Custom store** | `POST /api/cart` with `{ productId, code }`; the server resolves, prices and stores the line |
| **Quote-based (B2B, made to order)** | "Request a quote" sends the code, summary, snapshot and contact details; no price promise in the UI beyond "from" |

```ts
// Shopify example adapter
export const shopifyCart = (variantId: number): CartAdapter => ({
  async add(line) {
    const res = await fetch("/cart/add.js", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        items: [{
          id: variantId,
          quantity: 1,
          properties: { ...Object.fromEntries(line.lines.map((l) => [l.option, l.choice])), _config: line.code },
        }],
      }),
    });
    return res.ok ? { ok: true } : { ok: false, message: "Couldn't add to cart. Try again." };
  },
});
```

Map choices to **SKUs or part numbers** in the product definition when the warehouse needs them
(`sku: "BASE-SLED-BRZ"`), and stock as data: an out-of-stock choice is a rule with a reason
("Bronze is back in March"), shown disabled like any other.

## 4. Snapshots

- From the fixed hero camera (`camera-and-presentation.md`), 480 to 800 px square, WebP.
- Data URLs are fine for a local cart drawer. For orders, upload the image (or better: re-render it on
  the server from the code with a headless renderer) and store a URL; don't put megabytes in cart attributes.
- Offer "Save image" from the same function: people share configurations as pictures.

## 5. Share and save

- **Share:** copy the URL (it already holds the code). Use `navigator.share` on phones when available,
  falling back to copy. Tell people when it worked ("Link copied").
- **Saved designs** (for stores with accounts, or locally): store the code plus a name and a snapshot.
  Locally, keep a schema version, validate on load, keep a backup of unreadable data, debounce saves
  and show "Saved" / "Saving…" honestly (the keyboard build's pattern).
- **Restoring an old link** after the catalogue changed: decode, repair, and say so ("That link had
  options we no longer offer, so we picked the closest valid ones.").

## 6. Optional: view in your room (AR)

The lowest-effort route is Google's `<model-viewer>` web component next to (or instead of) the
three.js stage for the AR step:

```html
<model-viewer src="/models/chair.glb" ar ar-modes="webxr scene-viewer quick-look"
              ar-scale="fixed" variant-name="Walnut" camera-controls></model-viewer>
```

- `ar-modes`: WebXR in the browser on Android, Scene Viewer on Android, Quick Look on iOS. With
  `quick-look` and no `ios-src`, it builds the USDZ on the fly, so variant and scene-graph changes show up in AR.
- `ar-scale="fixed"` for furniture and anything where real size matters.
- Needs a real glTF of the configured product (procedural products: export the current scene with
  three.js `GLTFExporter`). Keep the AR button off devices that can't use it; on desktop, show a QR
  code that opens the same configuration link on a phone.
- Shopify product media: GLB and USDZ are converted for each other automatically; keep GLB under
  about 5 MB and textures at 2K or less for AR.
