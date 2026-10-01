import type { Product } from "./types";

const FABRICS = ["boucle", "felt"] as const;
const WOOD = ["oak", "walnut"] as const;
const METAL = ["black", "brushed", "bronze"] as const;

/** Placeholder product: a generic lounge chair. Names, prices and colours are made up. */
export const CHAIR: Product = {
  id: "lounge-chair",
  name: "Lounge chair",
  currency: "USD",
  basePrice: 129000,
  options: [
    {
      id: "upholstery",
      display: "swatch",
      label: "Upholstery",
      view: "seat",
      default: "boucle",
      choices: [
        { id: "boucle", label: "Bouclé", price: 0, swatch: { color: "#e4ddd0" }, appearance: { kind: "fabric", roughness: 0.95, sheen: 0.6 } },
        { id: "felt", label: "Wool felt", price: 9000, swatch: { color: "#b9b2a6" }, appearance: { kind: "fabric", roughness: 0.9, sheen: 0.35 } },
        { id: "leather", label: "Leather", price: 45000, swatch: { color: "#8a5a3c" }, appearance: { kind: "leather", roughness: 0.48, sheen: 0 } },
      ],
    },
    {
      id: "color",
      display: "swatch",
      label: "Colour",
      view: "seat",
      default: "oat",
      choices: [
        { id: "oat", label: "Oat", price: 0, swatch: { color: "#d9cfbd" }, appearance: { color: "#d9cfbd" }, showWhen: { option: "upholstery", in: FABRICS } },
        { id: "sage", label: "Sage", price: 0, swatch: { color: "#9aa58f" }, appearance: { color: "#8f9b84" }, showWhen: { option: "upholstery", in: FABRICS } },
        { id: "rust", label: "Rust", price: 0, swatch: { color: "#b5643f" }, appearance: { color: "#a85a38" }, showWhen: { option: "upholstery", in: FABRICS } },
        { id: "charcoal", label: "Charcoal", price: 0, swatch: { color: "#4a4845" }, appearance: { color: "#3f3d3b" }, showWhen: { option: "upholstery", in: FABRICS } },
        { id: "cognac", label: "Cognac", price: 0, swatch: { color: "#7a4528" }, appearance: { color: "#6f3f24" }, showWhen: { option: "upholstery", in: ["leather"] } },
        { id: "espresso", label: "Espresso", price: 0, swatch: { color: "#4b3326" }, appearance: { color: "#3e2a1f" }, showWhen: { option: "upholstery", in: ["leather"] } },
        { id: "ink", label: "Ink", price: 0, swatch: { color: "#24272c" }, appearance: { color: "#1f2226" }, showWhen: { option: "upholstery", in: ["leather"] } },
      ],
    },
    {
      id: "base",
      display: "tile",
      label: "Base",
      view: "base",
      default: "legs",
      choices: [
        { id: "legs", label: "Wooden legs", price: 0, swatch: { color: "#c49a6c" } },
        { id: "sled", label: "Sled", price: 9000, swatch: { color: "#6b6e73" } },
        { id: "swivel", label: "Swivel", price: 18000, swatch: { color: "#9b9ea3" } },
      ],
    },
    {
      id: "finish",
      display: "swatch",
      label: "Base finish",
      view: "base",
      default: "oak",
      choices: [
        { id: "oak", label: "Oak", price: 0, swatch: { color: "#c9a273" }, appearance: { kind: "wood", color: "#c79f6e", roughness: 0.55 } },
        { id: "walnut", label: "Walnut", price: 6000, swatch: { color: "#6b4630" }, appearance: { kind: "wood", color: "#5e3d29", roughness: 0.5 } },
        { id: "black", label: "Black steel", price: 0, swatch: { color: "#25272a" }, appearance: { kind: "metal", color: "#1c1d20", roughness: 0.42, metalness: 0.9 } },
        { id: "brushed", label: "Brushed steel", price: 4000, swatch: { color: "#b9bcbf" }, appearance: { kind: "metal", color: "#c4c7ca", roughness: 0.3, metalness: 1 } },
        { id: "bronze", label: "Bronze", price: 8000, swatch: { color: "#7a644c" }, appearance: { kind: "metal", color: "#6e5a44", roughness: 0.34, metalness: 1 } },
      ],
    },
    {
      id: "arms",
      display: "tile",
      label: "Armrests",
      view: "side",
      default: "arms",
      choices: [
        { id: "arms", label: "With armrests", price: 12000, swatch: { color: "#d9cfbd" } },
        { id: "none", label: "Armless", price: 0, swatch: { color: "#d9cfbd" } },
      ],
    },
  ],
  rules: [
    { if: { option: "base", in: ["legs"] }, then: { option: "finish", in: WOOD }, message: "Wooden legs come in Oak or Walnut." },
    { if: { option: "base", in: ["sled", "swivel"] }, then: { option: "finish", in: METAL }, message: "Metal bases come in Black, Brushed or Bronze." },
  ],
  views: {
    overview: { label: "Overview", position: [1.75, 1.15, 2.15], target: [0, 0.36, 0] },
    seat: { label: "Seat", position: [1.0, 1.2, 1.65], target: [0, 0.44, 0] },
    base: { label: "Base", position: [1.6, 0.42, 1.55], target: [0, 0.26, 0] },
    side: { label: "Side", position: [2.25, 0.8, 0.3], target: [0, 0.4, 0] },
  },
  materials: {
    body: ["upholstery", "color"],
    base: ["finish"],
  },
};
