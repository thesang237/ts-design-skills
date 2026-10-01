import * as THREE from "three";

import type { Appearance } from "../config/types";

/**
 * Material library: every texture is made (or loaded) once, uploaded to the GPU up front, and every
 * material *type* is compiled before the first swap, so changing an option never stalls a frame.
 * Colours and roughness are uniforms: a new colour reuses the compiled program.
 *
 * Textures here are generated in code (no downloads, nothing to license). With real scans you would
 * load KTX2 textures instead; the warm-up step stays the same.
 */

function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Converts a tileable height field into a tangent-space normal map. */
function heightToNormal(h: Float32Array, size: number, strength: number): THREE.DataTexture {
  const data = new Uint8Array(size * size * 4);
  const at = (x: number, y: number) => h[((y + size) % size) * size + ((x + size) % size)]!;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const dx = (at(x + 1, y) - at(x - 1, y)) * strength;
      const dy = (at(x, y + 1) - at(x, y - 1)) * strength;
      const len = Math.hypot(dx, dy, 1);
      const i = (y * size + x) * 4;
      data[i] = Math.round(((-dx / len) * 0.5 + 0.5) * 255);
      data[i + 1] = Math.round(((-dy / len) * 0.5 + 0.5) * 255);
      data[i + 2] = Math.round(((1 / len) * 0.5 + 0.5) * 255);
      data[i + 3] = 255;
    }
  }
  return tileable(new THREE.DataTexture(data, size, size), THREE.NoColorSpace);
}

function tileable<T extends THREE.Texture>(tex: T, colorSpace: THREE.ColorSpace): T {
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.colorSpace = colorSpace;
  tex.generateMipmaps = true;
  tex.minFilter = THREE.LinearMipmapLinearFilter;
  tex.magFilter = THREE.LinearFilter;
  tex.anisotropy = 8;
  tex.needsUpdate = true;
  return tex;
}

/** Soft round bumps scattered on a grid with jitter: reads as bouclé loops or pebbled leather. */
function bumps(size: number, count: number, radius: [number, number], seed: number): Float32Array {
  const h = new Float32Array(size * size);
  const r = rng(seed);
  for (let i = 0; i < count; i++) {
    const cx = r() * size;
    const cy = r() * size;
    const rad = radius[0] + r() * (radius[1] - radius[0]);
    const r2 = rad * rad;
    for (let y = Math.floor(cy - rad); y <= cy + rad; y++) {
      for (let x = Math.floor(cx - rad); x <= cx + rad; x++) {
        const d2 = (x - cx) ** 2 + (y - cy) ** 2;
        if (d2 > r2) continue;
        const idx = ((y + size) % size) * size + ((x + size) % size);
        h[idx] = Math.max(h[idx]!, Math.sqrt(1 - d2 / r2));
      }
    }
  }
  return h;
}

function noise(size: number, seed: number, amount: number): Float32Array {
  const r = rng(seed);
  const h = new Float32Array(size * size);
  for (let i = 0; i < h.length; i++) h[i] = r() * amount;
  return h;
}

function woodGrain(size: number, seed: number): THREE.DataTexture {
  const r = rng(seed);
  const data = new Uint8Array(size * size * 4);
  const phase = Array.from({ length: 8 }, () => r() * Math.PI * 2);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const u = x / size;
      const v = y / size;
      // Long, gently wandering grain lines along v (the length of a leg), not zigzags.
      const warp = Math.sin(v * 6.283 + phase[0]!) * 0.012 + Math.sin(v * 6.283 * 3 + phase[1]!) * 0.004;
      const ring = Math.sin((u + warp) * 6.283 * 7 + phase[2]!);
      const fine = Math.sin((u + warp * 2) * 6.283 * 41 + phase[3]!) * 0.5 + 0.5;
      const g = 0.84 + ring * 0.06 + fine * 0.05 + (r() - 0.5) * 0.03;
      const i = (y * size + x) * 4;
      const c = Math.round(Math.min(1, Math.max(0, g)) * 255);
      data[i] = c;
      data[i + 1] = c;
      data[i + 2] = c;
      data[i + 3] = 255;
    }
  }
  return tileable(new THREE.DataTexture(data, size, size), THREE.SRGBColorSpace);
}

export type Kind = NonNullable<Appearance["kind"]>;
export const KINDS: readonly Kind[] = ["fabric", "leather", "wood", "metal", "plastic"];

export class MaterialLibrary {
  readonly textures: { boucle: THREE.Texture; felt: THREE.Texture; leather: THREE.Texture; wood: THREE.Texture };
  private cache = new Map<string, THREE.MeshPhysicalMaterial>();

  constructor() {
    const size = 256;
    this.textures = {
      boucle: heightToNormal(bumps(size, 1400, [2.5, 5], 3), size, 1.6),
      felt: heightToNormal(noise(size, 5, 1), size, 0.35),
      leather: heightToNormal(bumps(size, 900, [3, 7], 9), size, 0.9),
      wood: woodGrain(size, 11),
    };
    this.textures.boucle.repeat.set(5, 5);
    this.textures.felt.repeat.set(6, 6);
    this.textures.leather.repeat.set(3, 3);
    this.textures.wood.repeat.set(1, 1);
  }

  private key(a: Appearance) {
    return JSON.stringify([a.kind ?? "plastic", a.color ?? "#ffffff", a.roughness ?? 0.5, a.metalness ?? 0, a.sheen ?? 0]);
  }

  /** One shared material per distinct appearance. Never mutate it: other parts may use it too. */
  get(a: Appearance): THREE.MeshPhysicalMaterial {
    const k = this.key(a);
    let m = this.cache.get(k);
    if (m) return m;
    const kind = a.kind ?? "plastic";
    m = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color(a.color ?? "#ffffff"),
      roughness: a.roughness ?? 0.5,
      metalness: a.metalness ?? 0,
    });
    if (kind === "fabric") {
      m.normalMap = (a.roughness ?? 1) > 0.92 ? this.textures.boucle : this.textures.felt;
      m.normalScale.set(0.9, 0.9);
      m.sheen = a.sheen ?? 0.5;
      m.sheenRoughness = 0.75;
      m.sheenColor = new THREE.Color(a.color ?? "#ffffff").lerp(new THREE.Color("#ffffff"), 0.4);
    } else if (kind === "leather") {
      m.normalMap = this.textures.leather;
      m.normalScale.set(0.35, 0.35);
      m.clearcoat = 0.25;
      m.clearcoatRoughness = 0.55;
    } else if (kind === "wood") {
      m.map = this.textures.wood;
      m.clearcoat = 0.4;
      m.clearcoatRoughness = 0.35;
    } else if (kind === "metal") {
      m.anisotropy = 0.5;
    }
    m.name = `material:${k}`;
    this.cache.set(k, m);
    return m;
  }

  /** A representative appearance per kind, used to compile every shader variant before the first swap. */
  warmupSet(): Appearance[] {
    return [
      { kind: "fabric", roughness: 0.95, sheen: 0.6 },
      { kind: "fabric", roughness: 0.9, sheen: 0.35 },
      { kind: "leather", roughness: 0.48 },
      { kind: "wood", roughness: 0.55 },
      { kind: "metal", roughness: 0.3, metalness: 1 },
    ];
  }

  dispose() {
    this.cache.forEach((m) => m.dispose());
    this.cache.clear();
    Object.values(this.textures).forEach((t) => t.dispose());
  }
}

/** The transparent copy used while fading in. Same program as other fades of this type; disposed after. */
export function fadeCopy(m: THREE.Material): THREE.Material {
  const c = m.clone();
  c.transparent = true;
  c.depthWrite = false;
  c.opacity = 0;
  return c;
}

/**
 * Compiles opaque and fading variants of every material type and uploads all textures, off the
 * critical path, so the first swap of each kind is as smooth as the tenth.
 */
export async function warmUp(lib: MaterialLibrary, gl: THREE.WebGLRenderer, scene: THREE.Scene, camera: THREE.Camera) {
  const group = new THREE.Group();
  const geo = new THREE.PlaneGeometry(0.001, 0.001);
  const created: THREE.Material[] = [];
  for (const a of lib.warmupSet()) {
    const m = lib.get(a);
    const f = fadeCopy(m);
    created.push(f);
    // Match the real meshes exactly: shadow settings are part of the compiled program.
    const solid = new THREE.Mesh(geo, m);
    solid.castShadow = solid.receiveShadow = true;
    const fading = new THREE.Mesh(geo, f);
    fading.receiveShadow = true;
    group.add(solid, fading);
  }
  Object.values(lib.textures).forEach((t) => gl.initTexture(t));
  scene.add(group);
  await gl.compileAsync(group, camera, scene);
  scene.remove(group);
  geo.dispose();
  created.forEach((m) => m.dispose());
}
