/**
 * Pure configuration logic: defaults, visibility, availability with reasons, repairs, price,
 * a shareable code and a readable summary. No React, no three.js, so it can be tested and reused
 * on the server (for example to re-check the price before checkout).
 */
import type { Appearance, Choice, Condition, Config, Option, OptionId, Product } from "./types";

export type Change = { option: OptionId; from: string; to: string; reason: string };
export type Availability = { available: true } | { available: false; reason: string };

const holds = (config: Config, c: Condition) => c.in.includes(config[c.option] ?? "");

export function optionById(product: Product, id: OptionId): Option {
  const o = product.options.find((x) => x.id === id);
  if (!o) throw new Error(`Unknown option ${id}`);
  return o;
}

export function choiceById(product: Product, optionId: OptionId, choiceId: string): Choice | undefined {
  return optionById(product, optionId).choices.find((c) => c.id === choiceId);
}

/** Choices that belong to the current context (e.g. leather colours only when leather is chosen). */
export function visibleChoices(product: Product, config: Config, optionId: OptionId): Choice[] {
  return optionById(product, optionId).choices.filter((c) => !c.showWhen || holds(config, c.showWhen));
}

/** A visible choice can still be unavailable because of a rule; it is shown disabled, with the reason. */
export function availability(product: Product, config: Config, optionId: OptionId, choiceId: string): Availability {
  for (const rule of product.rules) {
    if (rule.then.option === optionId && holds(config, rule.if) && !rule.then.in.includes(choiceId)) {
      return { available: false, reason: rule.message };
    }
  }
  return { available: true };
}

function labelOf(product: Product, optionId: OptionId, choiceId: string) {
  return choiceById(product, optionId, choiceId)?.label ?? choiceId;
}

/**
 * Brings a configuration back to a valid state after a change: hidden choices and rule violations
 * are replaced by the option's default when allowed, otherwise by the first allowed choice.
 * Every repair is reported so the panel can say what changed and why.
 */
export function resolve(product: Product, input: Config): { config: Config; changes: Change[] } {
  const config = { ...input };
  const changes: Change[] = [];
  for (let pass = 0; pass < product.options.length + 1; pass++) {
    let changed = false;
    for (const option of product.options) {
      const current = config[option.id] ?? "";
      const visible = visibleChoices(product, config, option.id);
      const allowed = visible.filter((c) => availability(product, config, option.id, c.id).available);
      if (allowed.some((c) => c.id === current)) continue;
      const next = allowed.find((c) => c.id === option.default) ?? allowed[0];
      if (!next) throw new Error(`No valid choice left for ${option.id}: check the rules`);
      const hiddenBy = visible.every((c) => c.id !== current);
      const rule = product.rules.find((r) => r.then.option === option.id && holds(config, r.if));
      const showOption = findShowWhenOption(option, current);
      const reason =
        hiddenBy && showOption
          ? `${labelOf(product, option.id, current)} isn't offered with ${labelOf(product, showOption, config[showOption] ?? "")}.`
          : (rule?.message ?? `${labelOf(product, option.id, current)} isn't available.`);
      if (current) changes.push({ option: option.id, from: current, to: next.id, reason });
      config[option.id] = next.id;
      changed = true;
    }
    if (!changed) return { config, changes };
  }
  return { config, changes };
}

function findShowWhenOption(option: Option, choiceId: string): OptionId | undefined {
  return option.choices.find((c) => c.id === choiceId)?.showWhen?.option;
}

export function defaultConfig(product: Product): Config {
  const config: Config = {};
  for (const o of product.options) config[o.id] = o.default;
  return resolve(product, config).config;
}

/** Selecting a choice always succeeds for the leading side of a rule; dependants are repaired. */
export function select(
  product: Product,
  config: Config,
  optionId: OptionId,
  choiceId: string,
): { config: Config; changes: Change[]; blocked?: string } {
  if (!choiceById(product, optionId, choiceId)) return { config, changes: [] };
  const avail = availability(product, config, optionId, choiceId);
  if (!avail.available) return { config, changes: [], blocked: avail.reason };
  return resolve(product, { ...config, [optionId]: choiceId });
}

export function price(product: Product, config: Config): number {
  let total = product.basePrice;
  for (const o of product.options) total += choiceById(product, o.id, config[o.id] ?? "")?.price ?? 0;
  return total;
}

export function formatPrice(product: Product, cents: number, locale?: string): string {
  return new Intl.NumberFormat(locale, { style: "currency", currency: product.currency, maximumFractionDigits: 0 }).format(cents / 100);
}

/** Readable, shareable code: one choice id per option, in option order (e.g. "leather.cognac.swivel.black.arms"). */
export function encode(product: Product, config: Config): string {
  return product.options.map((o) => config[o.id]).join(".");
}

export function decode(product: Product, code: string | null): { config: Config; repaired: boolean } {
  const fallback = defaultConfig(product);
  if (!code) return { config: fallback, repaired: false };
  const parts = code.split(".");
  const raw: Config = {};
  let unknown = parts.length !== product.options.length;
  product.options.forEach((o, i) => {
    const id = parts[i];
    if (id && o.choices.some((c) => c.id === id)) raw[o.id] = id;
    else {
      raw[o.id] = o.default;
      unknown = true;
    }
  });
  const { config, changes } = resolve(product, raw);
  return { config, repaired: unknown || changes.length > 0 };
}

export function summary(product: Product, config: Config) {
  return product.options.map((o) => {
    const c = choiceById(product, o.id, config[o.id] ?? "");
    return { option: o.label, choice: c?.label ?? "", price: c?.price ?? 0 };
  });
}

/** Merged PBR values for a part, from the options listed in product.materials. */
export function appearanceFor(product: Product, config: Config, part: string): Appearance {
  const out: Appearance = {};
  for (const optionId of product.materials[part] ?? []) {
    Object.assign(out, choiceById(product, optionId, config[optionId] ?? "")?.appearance);
  }
  return out;
}

/**
 * For a disabled choice, finds the smallest change that would make it available: a different choice
 * in the option that leads the blocking rule. Lets the panel offer "Switch to Sled base" instead of a dead end.
 */
export function suggestFix(product: Product, config: Config, optionId: OptionId, choiceId: string): { option: OptionId; choice: string } | null {
  for (const rule of product.rules) {
    if (rule.then.option !== optionId || !holds(config, rule.if) || rule.then.in.includes(choiceId)) continue;
    for (const candidate of visibleChoices(product, config, rule.if.option)) {
      if (candidate.id === config[rule.if.option]) continue;
      const trial = resolve(product, { ...config, [rule.if.option]: candidate.id }).config;
      if (availability(product, trial, optionId, choiceId).available) return { option: rule.if.option, choice: candidate.id };
    }
  }
  return null;
}
