import { useFrame, useThree } from "@react-three/fiber";
import { type ReactNode, useEffect, useLayoutEffect, useRef, useState } from "react";
import * as THREE from "three";

import { fadeCopy } from "./materials";
import { motion } from "./motionPrefs";

/** The balanced swap: 200ms, ease-in-out, no overshoot. */
const SWAP_MS = 200;
const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

/**
 * A mesh whose material can change without a pop: the new material is drawn on top as a transparent
 * copy that fades in, then becomes the real material. Rapid changes always resolve to the latest one.
 */
export function FadingMesh({
  geometry,
  material,
  castShadow = true,
  ...props
}: { geometry: THREE.BufferGeometry; material: THREE.Material; castShadow?: boolean } & Pick<
  React.ComponentProps<"group">,
  "position" | "rotation" | "scale" | "name"
>) {
  const base = useRef<THREE.Mesh>(null);
  const overlay = useRef<THREE.Mesh>(null);
  const fade = useRef<{ to: THREE.Material; copy: THREE.Material; t: number } | null>(null);
  const invalidate = useThree((s) => s.invalidate);
  const last = useRef(material);

  useEffect(() => {
    const mesh = base.current;
    const over = overlay.current;
    // Compare with the last *prop*, not mesh.material: a parent ShapeSwap may be fading this mesh.
    if (!mesh || !over || last.current === material) return;
    last.current = material;
    if (motion.reduced) {
      mesh.material = material;
      invalidate();
      return;
    }
    if (fade.current) {
      // Interrupted: keep whichever is more visible underneath, then fade to the newest choice.
      if (fade.current.t > 0.5) mesh.material = fade.current.to;
      fade.current.copy.dispose();
    }
    const copy = fadeCopy(material);
    over.material = copy;
    over.visible = true;
    fade.current = { to: material, copy, t: 0 };
    invalidate();
  }, [material, invalidate]);

  useEffect(
    () => () => {
      fade.current?.copy.dispose();
    },
    [],
  );

  useFrame((_, delta) => {
    const f = fade.current;
    if (!f || !base.current || !overlay.current) return;
    f.t = Math.min(1, f.t + (delta * 1000) / SWAP_MS);
    f.copy.opacity = easeInOut(f.t);
    if (f.t >= 1) {
      base.current.material = f.to;
      overlay.current.visible = false;
      f.copy.dispose();
      fade.current = null;
    }
    invalidate();
  });

  return (
    <group {...props}>
      <mesh ref={base} geometry={geometry} material={material} castShadow={castShadow} receiveShadow />
      <mesh ref={overlay} geometry={geometry} visible={false} receiveShadow renderOrder={1} raycast={() => null} />
    </group>
  );
}

/**
 * Swaps whole shapes (e.g. a base style) with a short crossfade: the outgoing shape fades out while the
 * incoming one fades in. Children are keyed by `id`; geometry for every variant is built up front.
 */
export function ShapeSwap({ id, render }: { id: string; render: (id: string) => ReactNode }) {
  const [items, setItems] = useState<Array<{ id: string; leaving: boolean }>>([{ id, leaving: false }]);

  useEffect(() => {
    setItems((prev) => {
      if (prev.some((p) => p.id === id && !p.leaving)) return prev;
      return [...prev.filter((p) => p.id !== id).map((p) => ({ ...p, leaving: true })), { id, leaving: false }];
    });
  }, [id]);

  return (
    <>
      {items.map((item) => (
        <FadeGroup
          key={item.id}
          leaving={item.leaving}
          onLeft={() => setItems((prev) => prev.filter((p) => p !== item))}
        >
          {render(item.id)}
        </FadeGroup>
      ))}
    </>
  );
}

function FadeGroup({ leaving, onLeft, children }: { leaving: boolean; onLeft: () => void; children: ReactNode }) {
  const ref = useRef<THREE.Group>(null);
  const invalidate = useThree((s) => s.invalidate);
  const state = useRef({ t: 0, originals: new Map<THREE.Mesh, THREE.Material | THREE.Material[]>(), copies: [] as THREE.Material[], done: false });
  const first = useRef(true);

  // Entering: swap to fading copies before the first frame (skipped for the very first mount).
  useLayoutEffect(() => {
    const g = ref.current;
    if (!g) return;
    const isInitial = first.current && !leaving;
    first.current = false;
    if (motion.reduced || isInitial) {
      if (leaving) onLeft();
      return;
    }
    const s = state.current;
    s.t = 0;
    s.done = false;
    g.traverse((o) => {
      const m = o as THREE.Mesh;
      if (!m.isMesh || Array.isArray(m.material) || !m.visible) return;
      if (!s.originals.has(m)) s.originals.set(m, m.material);
      const copy = fadeCopy(s.originals.get(m) as THREE.Material);
      copy.opacity = leaving ? 1 : 0;
      s.copies.push(copy);
      m.material = copy;
      m.castShadow = false;
    });
    if (leaving && s.copies.length === 0) {
      onLeft(); // Nothing visible to fade (e.g. an "off" variant).
      return;
    }
    invalidate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [leaving]);

  useEffect(
    () => () => {
      state.current.copies.forEach((c) => c.dispose());
    },
    [],
  );

  useFrame((_, delta) => {
    const s = state.current;
    if (s.done || s.copies.length === 0) return;
    s.t = Math.min(1, s.t + (delta * 1000) / SWAP_MS);
    const o = leaving ? 1 - easeInOut(s.t) : easeInOut(s.t);
    s.copies.forEach((c) => (c.opacity = o));
    if (s.t >= 1) {
      s.done = true;
      if (leaving) onLeft();
      else {
        s.originals.forEach((mat, mesh) => {
          mesh.material = mat;
          mesh.castShadow = true;
        });
        s.copies.forEach((c) => c.dispose());
        s.copies = [];
      }
    }
    invalidate();
  });

  return <group ref={ref}>{children}</group>;
}
