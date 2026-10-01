import { encode, price, summary } from "../config/engine";
import type { Config, Product } from "../config/types";

/**
 * What a configuration becomes in a cart. The store recomputes the price from `code` on its side;
 * the client-side price is only for display.
 */
export type CartLine = {
  productId: string;
  /** Shareable configuration code, also the key the server re-validates. */
  code: string;
  title: string;
  lines: Array<{ option: string; choice: string }>;
  unitPrice: number;
  image: string | null;
};

export interface CartAdapter {
  add(line: CartLine): Promise<{ ok: true } | { ok: false; message: string }>;
}

export function toCartLine(product: Product, config: Config, image: string | null): CartLine {
  return {
    productId: product.id,
    code: encode(product, config),
    title: product.name,
    lines: summary(product, config).map(({ option, choice }) => ({ option, choice })),
    unitPrice: price(product, config),
    image,
  };
}

/** Demo adapter: waits like a network call; `?cartFail=1` in the URL makes it fail so the error state can be seen. */
export const mockCart: CartAdapter = {
  async add() {
    await new Promise((r) => setTimeout(r, 700));
    if (new URLSearchParams(window.location.search).get("cartFail") === "1") {
      return { ok: false, message: "The store didn't respond. Your configuration is kept, try again." };
    }
    return { ok: true };
  },
};

/**
 * Shopify example (not used in the demo): one variant for the base product, the configuration in
 * line item properties. Keys starting with "_" are hidden from the shopper but visible to the merchant.
 */
export function shopifyCart(variantId: number): CartAdapter {
  return {
    async add(line) {
      const res = await fetch("/cart/add.js", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: [
            {
              id: variantId,
              quantity: 1,
              properties: {
                ...Object.fromEntries(line.lines.map((l) => [l.option, l.choice])),
                _config: line.code,
              },
            },
          ],
        }),
      });
      return res.ok ? { ok: true } : { ok: false, message: "Couldn't add to cart. Try again." };
    },
  };
}
