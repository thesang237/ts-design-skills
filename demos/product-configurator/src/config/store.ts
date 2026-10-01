import { create } from "zustand";

import { type Change, choiceById, decode, defaultConfig, encode, formatPrice, select, suggestFix } from "./engine";
import { CHAIR } from "./product";
import type { Config, OptionId, ViewId } from "./types";

export const PRODUCT = CHAIR;
const HISTORY_LIMIT = 50;

export type Notice = {
  id: number;
  text: string;
  tone: "info" | "error";
  action?: { label: string; run: () => void };
};

type State = {
  config: Config;
  past: Config[];
  future: Config[];
  /** The view the camera should be at (owned by the panel; the camera only follows). */
  view: ViewId;
  /** Explanations of automatic repairs, shown under the option that changed. */
  repairs: Change[];
  notice: Notice | null;
  choose: (option: OptionId, choice: string) => void;
  focusView: (view: ViewId) => void;
  undo: () => void;
  redo: () => void;
  reset: () => void;
  notify: (text: string, tone?: Notice["tone"], action?: Notice["action"]) => void;
  dismissNotice: () => void;
};

let noticeId = 0;

function initial(): { config: Config; repaired: boolean } {
  if (typeof window === "undefined") return { config: defaultConfig(PRODUCT), repaired: false };
  return decode(PRODUCT, new URLSearchParams(window.location.search).get("c"));
}

const boot = initial();

export const useConfigurator = create<State>((set, get) => ({
  config: boot.config,
  past: [],
  future: [],
  view: "overview",
  repairs: [],
  notice: boot.repaired ? { id: ++noticeId, text: "That link had options we no longer offer, so we picked the closest valid ones.", tone: "info" } : null,

  choose: (option, choice) => {
    const { config, past } = get();
    if (config[option] === choice) return;
    const result = select(PRODUCT, config, option, choice);
    if (result.blocked) {
      // Never a dead end: say why, and offer the change that makes this choice possible.
      const fix = suggestFix(PRODUCT, config, option, choice);
      const fixLabel = fix ? choiceById(PRODUCT, fix.option, fix.choice) : null;
      get().notify(
        result.blocked,
        "info",
        fix && fixLabel
          ? {
              label: `Switch to ${fixLabel.label}${fixLabel.price ? ` (+${formatPrice(PRODUCT, fixLabel.price)})` : ""}`,
              run: () => {
                const lead = select(PRODUCT, get().config, fix.option, fix.choice).config;
                const both = select(PRODUCT, lead, option, choice);
                set({
                  config: both.config,
                  past: [...get().past, get().config].slice(-HISTORY_LIMIT),
                  future: [],
                  repairs: [],
                  notice: null,
                });
              },
            }
          : undefined,
      );
      return;
    }
    set({
      config: result.config,
      past: [...past, config].slice(-HISTORY_LIMIT),
      future: [],
      repairs: result.changes,
      view: PRODUCT.options.find((o) => o.id === option)?.view ?? get().view,
    });
  },

  focusView: (view) => {
    if (get().view !== view) set({ view });
  },

  undo: () => {
    const { past, future, config } = get();
    const prev = past[past.length - 1];
    if (!prev) return;
    set({ config: prev, past: past.slice(0, -1), future: [config, ...future], repairs: [] });
  },

  redo: () => {
    const { past, future, config } = get();
    const next = future[0];
    if (!next) return;
    set({ config: next, past: [...past, config], future: future.slice(1), repairs: [] });
  },

  reset: () => {
    const { config, past } = get();
    const fresh = defaultConfig(PRODUCT);
    if (encode(PRODUCT, fresh) === encode(PRODUCT, config)) return;
    set({ config: fresh, past: [...past, config].slice(-HISTORY_LIMIT), future: [], repairs: [], view: "overview" });
  },

  notify: (text, tone = "info", action) => set({ notice: { id: ++noticeId, text, tone, action } }),
  dismissNotice: () => set({ notice: null }),
}));

// Keep the address bar in sync, so every configuration is a shareable link (replaceState: no history spam).
if (typeof window !== "undefined") {
  useConfigurator.subscribe((s, prev) => {
    if (s.config === prev.config) return;
    const url = new URL(window.location.href);
    url.searchParams.set("c", encode(PRODUCT, s.config));
    window.history.replaceState(null, "", url);
  });
}

export function shareUrl(config: Config): string {
  const url = new URL(window.location.href);
  url.searchParams.set("c", encode(PRODUCT, config));
  return url.toString();
}
