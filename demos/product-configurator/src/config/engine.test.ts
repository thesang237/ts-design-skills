import { describe, expect, it } from "vitest";

import { appearanceFor, availability, decode, defaultConfig, encode, price, resolve, select, visibleChoices } from "./engine";
import { CHAIR } from "./product";
import type { Product } from "./types";

describe("configuration engine", () => {
  const start = defaultConfig(CHAIR);

  it("starts from valid defaults", () => {
    expect(start).toEqual({ upholstery: "boucle", color: "oat", base: "legs", finish: "oak", arms: "arms" });
    expect(resolve(CHAIR, start).changes).toEqual([]);
  });

  it("hides choices that belong to another family", () => {
    expect(visibleChoices(CHAIR, start, "color").map((c) => c.id)).toEqual(["oat", "sage", "rust", "charcoal"]);
    const leather = select(CHAIR, start, "upholstery", "leather");
    expect(visibleChoices(CHAIR, leather.config, "color").map((c) => c.id)).toEqual(["cognac", "espresso", "ink"]);
  });

  it("repairs a hidden choice and says why", () => {
    const { config, changes } = select(CHAIR, start, "upholstery", "leather");
    expect(config.color).toBe("cognac");
    expect(changes).toEqual([{ option: "color", from: "oat", to: "cognac", reason: "Oat isn't offered with Leather." }]);
  });

  it("disables rule-breaking choices with a reason instead of hiding them", () => {
    expect(availability(CHAIR, start, "finish", "brushed")).toEqual({ available: false, reason: "Wooden legs come in Oak or Walnut." });
    expect(availability(CHAIR, start, "finish", "walnut")).toEqual({ available: true });
    expect(select(CHAIR, start, "finish", "brushed").blocked).toBe("Wooden legs come in Oak or Walnut.");
  });

  it("lets the leading option change and repairs the dependant", () => {
    const { config, changes } = select(CHAIR, start, "base", "swivel");
    expect(config.finish).toBe("black");
    expect(changes[0]).toMatchObject({ option: "finish", from: "oak", to: "black", reason: "Metal bases come in Black, Brushed or Bronze." });
  });

  it("adds up the price from the base price and choice deltas", () => {
    expect(price(CHAIR, start)).toBe(129000 + 12000);
    const c = select(CHAIR, select(CHAIR, start, "upholstery", "leather").config, "base", "swivel").config;
    expect(price(CHAIR, c)).toBe(129000 + 45000 + 18000 + 12000);
  });

  it("round-trips a readable share code and repairs bad ones", () => {
    const c = select(CHAIR, start, "upholstery", "leather").config;
    expect(encode(CHAIR, c)).toBe("leather.cognac.legs.oak.arms");
    expect(decode(CHAIR, encode(CHAIR, c))).toEqual({ config: c, repaired: false });
    const bad = decode(CHAIR, "leather.oat.sled.oak.wings");
    expect(bad.repaired).toBe(true);
    expect(bad.config).toEqual({ upholstery: "leather", color: "cognac", base: "sled", finish: "black", arms: "arms" });
    expect(decode(CHAIR, null)).toEqual({ config: start, repaired: false });
  });

  it("merges material values from several options, later options winning", () => {
    expect(appearanceFor(CHAIR, start, "body")).toMatchObject({ kind: "fabric", color: "#d9cfbd", sheen: 0.6 });
    expect(appearanceFor(CHAIR, start, "base")).toMatchObject({ kind: "wood" });
  });

  it("works for any product shape (a sneaker defined only as data)", () => {
    const shoe: Product = {
      id: "sneaker",
      name: "Sneaker",
      currency: "EUR",
      basePrice: 12000,
      views: { overview: { label: "Overview", position: [0, 0, 1], target: [0, 0, 0] } },
      materials: { upper: ["upper"], sole: ["sole"] },
      options: [
        { id: "upper", label: "Upper", view: "overview", display: "swatch", default: "knit", choices: [
          { id: "knit", label: "Knit", price: 0, swatch: { color: "#eee" } },
          { id: "suede", label: "Suede", price: 2000, swatch: { color: "#a87" } },
        ] },
        { id: "sole", label: "Sole", view: "overview", display: "swatch", default: "foam", choices: [
          { id: "foam", label: "Foam", price: 0, swatch: { color: "#fff" } },
          { id: "gum", label: "Gum", price: 1000, swatch: { color: "#c84" } },
        ] },
      ],
      rules: [{ if: { option: "upper", in: ["suede"] }, then: { option: "sole", in: ["gum"] }, message: "Suede pairs with the gum sole." }],
    };
    const s = select(shoe, defaultConfig(shoe), "upper", "suede");
    expect(s.config.sole).toBe("gum");
    expect(price(shoe, s.config)).toBe(15000);
  });
});

describe("fix suggestions", () => {
  it("proposes the leading change that unlocks a disabled choice", async () => {
    const { suggestFix, defaultConfig, select } = await import("./engine");
    const start = defaultConfig(CHAIR);
    expect(suggestFix(CHAIR, start, "finish", "bronze")).toEqual({ option: "base", choice: "sled" });
    const fixed = select(CHAIR, select(CHAIR, start, "base", "sled").config, "finish", "bronze").config;
    expect(fixed).toMatchObject({ base: "sled", finish: "bronze" });
    expect(suggestFix(CHAIR, start, "finish", "walnut")).toBeNull();
  });
});
