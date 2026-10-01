import { useMemo } from "react";
import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";

import { appearanceFor } from "../config/engine";
import type { Config, Product } from "../config/types";
import { FadingMesh, ShapeSwap } from "./fades";
import type { MaterialLibrary } from "./materials";

/**
 * A lounge chair built from simple shapes (no downloaded model, nothing to license). Every variant's
 * geometry is created once and kept, so switching options never builds geometry on the fly.
 * Units are metres; the seat top sits at about 46 cm.
 */

function box(w: number, h: number, d: number, r: number, x = 0, y = 0, z = 0, tiltX = 0, pivotY = 0) {
  const g = new RoundedBoxGeometry(w, h, d, 5, r);
  if (tiltX) {
    // Tilt around a pivot (the bottom edge) so backrests lean back like real ones.
    g.translate(0, h / 2 - pivotY, 0);
    g.rotateX(tiltX);
    g.translate(0, pivotY - h / 2, 0);
  }
  g.translate(x, y, z);
  return g;
}

function tube(points: THREE.Vector3[], radius: number) {
  const curve = new THREE.CatmullRomCurve3(points, false, "catmullrom", 0.2);
  return new THREE.TubeGeometry(curve, 96, radius, 16, false);
}

function rod(from: THREE.Vector3, to: THREE.Vector3, rTop: number, rBottom: number) {
  const len = from.distanceTo(to);
  const g = new THREE.CylinderGeometry(rTop, rBottom, len, 24);
  const mid = from.clone().add(to).multiplyScalar(0.5);
  const dir = to.clone().sub(from).normalize();
  g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir));
  g.translate(mid.x, mid.y, mid.z);
  return g;
}

const merge = (parts: THREE.BufferGeometry[]) => {
  // Tube and cylinder geometry differ in attributes; strip to the shared set before merging.
  const cleaned = parts.map((g) => {
    const n = g.index ? g.toNonIndexed() : g;
    for (const name of Object.keys(n.attributes)) if (!["position", "normal", "uv"].includes(name)) n.deleteAttribute(name);
    return n;
  });
  return mergeGeometries(cleaned)!;
};

export type ChairGeometry = ReturnType<typeof buildChair>;
let cached: ChairGeometry | null = null;

export function buildChair() {
  const seatY = 0.3;
  const tilt = -0.17;
  const body = {
    shell: box(0.64, 0.07, 0.64, 0.025, 0, seatY + 0.035, 0),
    seat: box(0.6, 0.11, 0.58, 0.05, 0, seatY + 0.12, 0.02),
    backShell: box(0.64, 0.5, 0.07, 0.03, 0, seatY + 0.07 + 0.25, -0.285, tilt, 0),
    backCushion: box(0.58, 0.38, 0.11, 0.05, 0, seatY + 0.17 + 0.19, -0.215, tilt, 0),
  };
  const arm = (side: number) => box(0.09, 0.27, 0.6, 0.04, side * 0.365, seatY + 0.135, -0.01);
  const arms = merge([arm(-1), arm(1)]);

  // Wooden legs: four tapered, slightly splayed legs.
  const legs = merge(
    [
      [-1, -1],
      [1, -1],
      [-1, 1],
      [1, 1],
    ].map(([sx, sz]) => rod(new THREE.Vector3(sx! * 0.26, seatY, sz! * 0.25), new THREE.Vector3(sx! * 0.29, 0, sz! * 0.29), 0.022, 0.014)),
  );

  // Sled: a continuous tube on each side plus two crossbars under the seat.
  const runner = (x: number) =>
    tube(
      [
        new THREE.Vector3(x, seatY, 0.24),
        new THREE.Vector3(x, seatY - 0.04, 0.27),
        new THREE.Vector3(x, 0.05, 0.31),
        new THREE.Vector3(x, 0.012, 0.25),
        new THREE.Vector3(x, 0.012, -0.25),
        new THREE.Vector3(x, 0.05, -0.31),
        new THREE.Vector3(x, seatY - 0.04, -0.27),
        new THREE.Vector3(x, seatY, -0.24),
      ],
      0.012,
    );
  const sled = merge([
    runner(-0.28),
    runner(0.28),
    rod(new THREE.Vector3(-0.28, seatY - 0.01, 0.2), new THREE.Vector3(0.28, seatY - 0.01, 0.2), 0.01, 0.01),
    rod(new THREE.Vector3(-0.28, seatY - 0.01, -0.2), new THREE.Vector3(0.28, seatY - 0.01, -0.2), 0.01, 0.01),
  ]);

  // Swivel: a column on a five-star base with glides.
  const star: THREE.BufferGeometry[] = [
    rod(new THREE.Vector3(0, 0.07, 0), new THREE.Vector3(0, seatY - 0.02, 0), 0.028, 0.034),
    new THREE.CylinderGeometry(0.14, 0.14, 0.02, 48).translate(0, seatY - 0.01, 0),
  ];
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2 + Math.PI / 2;
    const tip = new THREE.Vector3(Math.cos(a) * 0.34, 0.035, Math.sin(a) * 0.34);
    star.push(rod(new THREE.Vector3(0, 0.08, 0), tip, 0.022, 0.014));
    star.push(new THREE.CylinderGeometry(0.022, 0.022, 0.024, 24).translate(tip.x, 0.012, tip.z));
  }
  const swivel = merge(star);

  return { body, arms, bases: { legs, sled, swivel } as Record<string, THREE.BufferGeometry> };
}

export function getChairGeometry() {
  cached ??= buildChair();
  return cached;
}

export function Chair({ product, config, lib }: { product: Product; config: Config; lib: MaterialLibrary }) {
  const geo = useMemo(getChairGeometry, []);
  const bodyMat = lib.get(appearanceFor(product, config, "body"));
  const baseMat = lib.get(appearanceFor(product, config, "base"));
  const armsOn = config.arms === "arms";

  return (
    <group name="chair">
      <group name="part:body">
        {Object.entries(geo.body).map(([name, g]) => (
          <FadingMesh key={name} geometry={g} material={bodyMat} />
        ))}
      </group>
      <group name="part:arms">
        <ShapeSwap id={armsOn ? "arms" : "none"} render={(id) => (id === "arms" ? <FadingMesh geometry={geo.arms} material={bodyMat} /> : null)} />
      </group>
      <group name="part:base">
        <ShapeSwap
          id={config.base ?? "legs"}
          render={(id) => <FadingMesh geometry={geo.bases[id] ?? geo.bases.legs!} material={baseMat} />}
        />
      </group>
    </group>
  );
}
