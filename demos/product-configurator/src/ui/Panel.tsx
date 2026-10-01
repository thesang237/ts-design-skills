import { useEffect, useRef, useState } from "react";

import { type CartLine, mockCart, toCartLine } from "../commerce/cart";
import { availability, choiceById, formatPrice, price, summary, visibleChoices } from "../config/engine";
import { PRODUCT, shareUrl, useConfigurator } from "../config/store";
import type { Option } from "../config/types";

const fmt = (cents: number) => formatPrice(PRODUCT, cents);
const delta = (cents: number) => (cents ? `+${fmt(cents)}` : "Included");

function OptionGroup({ option }: { option: Option }) {
  const config = useConfigurator((s) => s.config);
  const repairs = useConfigurator((s) => s.repairs);
  const choose = useConfigurator((s) => s.choose);
  const focusView = useConfigurator((s) => s.focusView);
  const choices = visibleChoices(PRODUCT, config, option.id);
  const current = choiceById(PRODUCT, option.id, config[option.id] ?? "");
  const blocked = choices.filter((c) => !availability(PRODUCT, config, option.id, c.id).available);
  const reason = blocked[0] ? (availability(PRODUCT, config, option.id, blocked[0].id) as { reason: string }).reason : null;
  const repair = repairs.find((r) => r.option === option.id);
  const noteId = `note-${option.id}`;

  return (
    <fieldset className="option" onFocus={() => focusView(option.view)}>
      <legend className="option-legend">
        <strong>{option.label}</strong>
        <span>
          {current?.label}
          {current && current.price ? ` · ${delta(current.price)}` : ""}
        </span>
      </legend>
      <div className={option.display === "swatch" ? "swatches" : "tiles"}>
        {choices.map((c) => {
          const unavailable = blocked.includes(c);
          const inputProps = {
            type: "radio" as const,
            name: option.id,
            value: c.id,
            checked: config[option.id] === c.id,
            "aria-disabled": unavailable || undefined,
            "aria-describedby": unavailable ? noteId : undefined,
            "aria-label": option.display === "swatch" ? `${c.label}${c.price ? `, ${delta(c.price)}` : ""}${unavailable ? ", unavailable" : ""}` : undefined,
            // Unavailable choices stay focusable and clickable: choosing one explains why and offers a fix.
            onChange: () => choose(option.id, c.id),
          };
          return option.display === "swatch" ? (
            <label key={c.id} className="swatch" title={c.label}>
              <input {...inputProps} />
              <span className="swatch-dot" style={{ backgroundColor: c.swatch.color }} />
            </label>
          ) : (
            <label key={c.id} className="tile">
              <input {...inputProps} />
              <span className="tile-face">
                {c.label}
                <small>{unavailable ? "Unavailable" : delta(c.price)}</small>
              </span>
            </label>
          );
        })}
      </div>
      {repair ? (
        <p className="option-note" data-kind="repair" role="status">
          Changed to {choiceById(PRODUCT, option.id, repair.to)?.label}. {repair.reason}
        </p>
      ) : reason ? (
        <p className="option-note" id={noteId}>
          {blocked.map((b) => b.label).join(", ")} {blocked.length > 1 ? "aren't" : "isn't"} available. {reason}
        </p>
      ) : null}
    </fieldset>
  );
}

function PriceTag({ cents }: { cents: number }) {
  const [flash, setFlash] = useState(false);
  const first = useRef(true);
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    setFlash(true);
    const id = requestAnimationFrame(() => requestAnimationFrame(() => setFlash(false)));
    return () => cancelAnimationFrame(id);
  }, [cents]);
  return (
    <span className="price" data-flash={flash} aria-live="polite">
      {fmt(cents)}
    </span>
  );
}

type AddState = "idle" | "adding" | "added" | "error";

export function Panel({ onAdded }: { onAdded: (line: CartLine) => void }) {
  const config = useConfigurator((s) => s.config);
  const canUndo = useConfigurator((s) => s.past.length > 0);
  const canRedo = useConfigurator((s) => s.future.length > 0);
  const undo = useConfigurator((s) => s.undo);
  const redo = useConfigurator((s) => s.redo);
  const reset = useConfigurator((s) => s.reset);
  const notify = useConfigurator((s) => s.notify);
  const total = price(PRODUCT, config);
  const [add, setAdd] = useState<{ state: AddState; message?: string }>({ state: "idle" });
  const [copied, setCopied] = useState(false);

  // Any change after an attempt returns the button to its normal label.
  useEffect(() => setAdd((a) => (a.state === "adding" ? a : { state: "idle" })), [config]);

  const addToCart = async () => {
    setAdd({ state: "adding" });
    // Loaded on demand so three.js stays out of the first-paint bundle (the 3D chunk already has it cached).
    const { renderSnapshot } = await import("../three/snapshot");
    const line = toCartLine(PRODUCT, config, renderSnapshot());
    const result = await mockCart.add(line);
    if (result.ok) {
      setAdd({ state: "added" });
      onAdded(line);
    } else {
      setAdd({ state: "error", message: result.message });
    }
  };

  const share = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl(config));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      notify("Couldn't copy automatically. The link to this configuration is in the address bar.");
    }
  };

  return (
    <aside className="sheet" aria-label="Configure">
      <div className="sheet-head">
        <div>
          <p className="eyebrow">Configure</p>
          <h1 className="title">{PRODUCT.name}</h1>
        </div>
        <div className="head-actions">
          <button type="button" className="text-btn" onClick={undo} disabled={!canUndo}>
            Undo
          </button>
          <button type="button" className="text-btn" onClick={redo} disabled={!canRedo}>
            Redo
          </button>
          <button type="button" className="text-btn" onClick={reset}>
            Reset
          </button>
        </div>
      </div>
      <div className="sheet-body">
        {PRODUCT.options.map((o) => (
          <OptionGroup key={o.id} option={o} />
        ))}
        <dl className="summary" aria-label="Your configuration">
          <dt>Base price</dt>
          <dd>{fmt(PRODUCT.basePrice)}</dd>
          {summary(PRODUCT, config).map((row) => (
            <div key={row.option} style={{ display: "contents" }}>
              <dt>
                {row.option}: {row.choice}
              </dt>
              <dd>{row.price ? `+${fmt(row.price)}` : "—"}</dd>
            </div>
          ))}
        </dl>
      </div>
      <div className="sheet-foot">
        <div className="price-row">
          <PriceTag cents={total} />
          <span className="price-note">Ships in 6–8 weeks · free returns</span>
        </div>
        <div className="foot-actions">
          <button
            type="button"
            className="btn btn-primary"
            data-state={add.state}
            disabled={add.state === "adding"}
            aria-busy={add.state === "adding"}
            onClick={addToCart}
          >
            {add.state === "adding" ? (
              <>
                <span className="spinner" aria-hidden="true" /> Adding…
              </>
            ) : add.state === "added" ? (
              "Added to cart ✓"
            ) : add.state === "error" ? (
              "Try again"
            ) : (
              "Add to cart"
            )}
          </button>
          <button type="button" className="btn" onClick={share}>
            {copied ? "Link copied" : "Share"}
          </button>
        </div>
        {add.state === "error" ? (
          <p className="foot-error" role="alert">
            {add.message}
          </p>
        ) : null}
      </div>
    </aside>
  );
}
