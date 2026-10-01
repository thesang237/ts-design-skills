import { lazy, Suspense, useCallback, useEffect, useRef, useState } from "react";

import type { CartLine } from "./commerce/cart";
import { formatPrice } from "./config/engine";
import { PRODUCT, useConfigurator } from "./config/store";
import { Panel } from "./ui/Panel";

// The 3D bundle loads after the poster and panel are on screen.
const Stage = lazy(() => import("./three/Stage"));

function hasWebGL2() {
  try {
    return !!document.createElement("canvas").getContext("webgl2");
  } catch {
    return false;
  }
}

function Notice() {
  const notice = useConfigurator((s) => s.notice);
  const dismiss = useConfigurator((s) => s.dismissNotice);
  useEffect(() => {
    if (!notice || notice.action) return;
    const t = setTimeout(dismiss, 5000);
    return () => clearTimeout(t);
  }, [notice, dismiss]);
  if (!notice) return null;
  return (
    <div key={notice.id} className="notice" data-tone={notice.tone} role="status">
      <span>{notice.text}</span>
      {notice.action ? (
        <button type="button" className="btn" style={{ height: 36, padding: "0 12px" }} onClick={notice.action.run}>
          {notice.action.label}
        </button>
      ) : null}
      <button type="button" className="text-btn" aria-label="Dismiss" onClick={dismiss}>
        ✕
      </button>
    </div>
  );
}

function Views() {
  const view = useConfigurator((s) => s.view);
  const focusView = useConfigurator((s) => s.focusView);
  return (
    <div className="views" role="group" aria-label="Camera views">
      {Object.entries(PRODUCT.views).map(([id, v]) => (
        <button key={id} type="button" aria-pressed={view === id} onClick={() => focusView(id)}>
          {v.label}
        </button>
      ))}
    </div>
  );
}

function Cart({ items, open, onClose }: { items: CartLine[]; open: boolean; onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);
  return (
    <dialog ref={ref} className="cart" aria-labelledby="cart-title" onClose={onClose}>
      <div className="cart-inner">
        <div className="sheet-head">
          <h2 id="cart-title" className="title">
            Cart
          </h2>
          <button type="button" className="text-btn" onClick={onClose}>
            Close
          </button>
        </div>
        <div style={{ flex: 1, overflowY: "auto" }}>
          {items.map((item, i) => (
            <div key={i} className="cart-item">
              {item.image ? <img src={item.image} alt={`${item.title} as configured`} /> : <span />}
              <div>
                <strong>{item.title}</strong> · {formatPrice(PRODUCT, item.unitPrice)}
                <ul>
                  {item.lines.map((l) => (
                    <li key={l.option}>
                      {l.option}: {l.choice}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
        <div className="sheet-foot">
          <button type="button" className="btn btn-primary" disabled aria-describedby="checkout-note">
            Checkout
          </button>
          <p id="checkout-note" className="price-note" style={{ margin: 0 }}>
            This is a demo store, so checkout is turned off.
          </p>
        </div>
      </div>
    </dialog>
  );
}

export function App() {
  const [ready, setReady] = useState(false);
  const [webgl] = useState(hasWebGL2);
  const [lost, setLost] = useState(false);
  const [cart, setCart] = useState<CartLine[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const undo = useConfigurator((s) => s.undo);
  const redo = useConfigurator((s) => s.redo);
  const onReady = useCallback(() => setReady(true), []);
  const onLost = useCallback(() => setLost(true), []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === "INPUT" && (t as HTMLInputElement).type === "text")) return;
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "z") {
        e.preventDefault();
        if (e.shiftKey) redo();
        else undo();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [undo, redo]);

  const show3d = webgl && !lost;
  return (
    <div className="app">
      <main className="stage" aria-label={`${PRODUCT.name} preview`}>
        {show3d ? (
          <Suspense fallback={null}>
            <Stage onReady={onReady} onLost={onLost} />
          </Suspense>
        ) : null}
        {/* The still image is there from the first paint; the 3D fades in over it when ready. */}
        <img className="poster" src="/poster.jpg" alt="" data-hidden={show3d && ready} />
        {show3d && !ready ? (
          <div className="stage-status" role="status">
            Preparing the 3D view
          </div>
        ) : null}
        {!show3d ? (
          <div className="stage-status" role="status">
            {lost ? "The 3D view stopped. Your choices are kept; reload to bring it back." : "3D isn't available here. Your choices still update the price and summary."}
          </div>
        ) : null}
        {show3d && ready ? <Views /> : null}
        <Notice />
      </main>
      <Panel
        onAdded={(line) => {
          setCart((c) => [...c, line]);
          setCartOpen(true);
        }}
      />
      <Cart items={cart} open={cartOpen} onClose={() => setCartOpen(false)} />
    </div>
  );
}
