import * as THREE from "three";

import { PRODUCT } from "../config/store";

/**
 * Renders the product from a fixed "hero" camera for cart thumbnails and saved images, independent of
 * where the shopper has orbited. Rendered into the main canvas and read back in the same task, so
 * nothing flashes on screen and the drawing buffer doesn't need to be preserved every frame.
 */
export const snapshotBridge = {
  gl: null as THREE.WebGLRenderer | null,
  scene: null as THREE.Scene | null,
  invalidate: () => {},
  attach(gl: THREE.WebGLRenderer, scene: THREE.Scene, invalidate: () => void) {
    this.gl = gl;
    this.scene = scene;
    this.invalidate = invalidate;
    return () => {
      this.gl = null;
      this.scene = null;
      this.invalidate = () => {};
    };
  },
};

export function renderSnapshot(size = 480, viewId = "overview"): string | null {
  const { gl, scene } = snapshotBridge;
  if (!gl || !scene) return null;
  const canvas = gl.domElement;
  const w = canvas.width;
  const h = canvas.height;
  const view = PRODUCT.views[viewId] ?? PRODUCT.views.overview!;
  const cam = new THREE.PerspectiveCamera(30, w / h, 0.05, 50);
  cam.position.set(...view.position);
  cam.lookAt(new THREE.Vector3(...view.target));
  gl.render(scene, cam);
  const side = Math.min(w, h);
  const out = document.createElement("canvas");
  out.width = out.height = size;
  const ctx = out.getContext("2d")!;
  ctx.drawImage(canvas, (w - side) / 2, (h - side) / 2, side, side, 0, 0, size, size);
  const url = out.toDataURL("image/webp", 0.9);
  snapshotBridge.invalidate(); // Draw the shopper's own view again on the next frame.
  return url;
}
