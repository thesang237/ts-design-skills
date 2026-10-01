/**
 * A product described as data. Nothing here knows about chairs: the same shape works for a sneaker,
 * a lamp or a bike. The 3D scene and the panel both read this; neither hard-codes options.
 */

export type OptionId = string;
export type ChoiceId = string;
export type ViewId = string;

/** A configuration is one chosen choice per option. */
export type Config = Record<OptionId, ChoiceId>;

/** "This option currently has one of these choices." */
export type Condition = { option: OptionId; in: readonly ChoiceId[] };

/** PBR values a choice contributes to a material. Later options override earlier ones. */
export type Appearance = {
  kind?: "fabric" | "leather" | "wood" | "metal" | "plastic";
  color?: string;
  roughness?: number;
  metalness?: number;
  sheen?: number;
};

export type Choice = {
  id: ChoiceId;
  label: string;
  /** Price difference in cents (0 for included). */
  price: number;
  /** What the swatch shows: a colour, or an image for materials and shapes. */
  swatch: { color: string; image?: string };
  appearance?: Appearance;
  /** Only offered when this holds (e.g. leather colours only for leather). Hidden otherwise. */
  showWhen?: Condition;
};

export type Option = {
  id: OptionId;
  label: string;
  /** Camera view to move to while this option is being edited. */
  view: ViewId;
  /** Round swatches for colours and materials, labelled tiles for shapes and yes/no choices. */
  display: "swatch" | "tile";
  choices: readonly Choice[];
  default: ChoiceId;
};

/**
 * When `if` holds, `then.option` must be one of `then.in`. Choices outside it are shown but disabled,
 * with `message` as the reason. Choosing the `if` side is always allowed and repairs the other option.
 */
export type Rule = { if: Condition; then: Condition; message: string };

export type CameraView = { label: string; position: [number, number, number]; target: [number, number, number] };

export type Product = {
  id: string;
  name: string;
  currency: string;
  /** Cents. */
  basePrice: number;
  options: readonly Option[];
  rules: readonly Rule[];
  views: Record<ViewId, CameraView>;
  /** Which options feed each part's material, in order (later wins). */
  materials: Record<string, readonly OptionId[]>;
};
