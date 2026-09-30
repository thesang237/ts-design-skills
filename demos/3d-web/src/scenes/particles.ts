import * as THREE from 'three';

import type { SceneFactory } from '../stage/Stage';

import { damp, disposeScene, rng } from './shared';

const MAX = 60000;

const vertex = /* glsl */ `
uniform float uTime;
uniform float uSize;
uniform vec2 uPointer;
uniform float uPush;
attribute float aSeed;
varying float vGlow;
void main() {
  vec3 p = position;
  // slow breathing + a swirl, all on the GPU: JavaScript only sends time and the pointer
  float r = length(p);
  p *= 1.0 + sin(uTime * 0.8 + r * 3.0) * 0.03;
  float a = uTime * 0.12 * (0.5 + aSeed);
  p.xz = mat2(cos(a), -sin(a), sin(a), cos(a)) * p.xz;
  // push away from the cursor (pointer mapped onto the z = 0 plane)
  vec2 d = p.xy - uPointer;
  float f = exp(-dot(d, d) * 1.6) * uPush;
  p.xy += normalize(d + 1e-4) * f * 0.9;
  vGlow = f;
  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  gl_Position = projectionMatrix * mv;
  gl_PointSize = uSize * (0.6 + aSeed * 0.8) * (8.0 / -mv.z);
}
`;

const fragment = /* glsl */ `
varying float vGlow;
void main() {
  float d = length(gl_PointCoord - 0.5);
  float a = smoothstep(0.5, 0.1, d);
  if (a < 0.02) discard;
  vec3 col = mix(vec3(0.55, 0.62, 0.78), vec3(1.6, 1.7, 2.0), vGlow);
  gl_FragColor = vec4(col, a * 0.85);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}
`;

/** 60k GPU points; the tier changes how many are drawn (drawRange), not the geometry. */
export const createParticles: SceneFactory = () => {
    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#0b0c10');
    const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 100);
    camera.position.set(0, 0, 7);

    const r = rng(11);
    const pos = new Float32Array(MAX * 3);
    const seed = new Float32Array(MAX);
    for (let i = 0; i < MAX; i++) {
        const u = r() * 2 - 1;
        const th = r() * Math.PI * 2;
        const rad = 1.4 + Math.pow(r(), 3) * 1.4;
        const s = Math.sqrt(1 - u * u);
        pos.set([Math.cos(th) * s * rad, u * rad * 0.8, Math.sin(th) * s * rad], i * 3);
        seed[i] = r();
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.setAttribute('aSeed', new THREE.BufferAttribute(seed, 1));
    const mat = new THREE.ShaderMaterial({
        vertexShader: vertex,
        fragmentShader: fragment,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        uniforms: { uTime: { value: 0 }, uSize: { value: 2 }, uPointer: { value: new THREE.Vector2(99, 99) }, uPush: { value: 0 } },
    });
    const points = new THREE.Points(geo, mat);
    points.frustumCulled = false;
    scene.add(points);
    const s = { px: 0, py: 0, push: 0 };

    return {
        scene,
        camera,
        applyTier: (t) => {
            geo.setDrawRange(0, Math.round(MAX * t.share));
            mat.uniforms.uSize.value = 2 * (t.share < 0.5 ? 1.35 : 1); // fewer points: slightly bigger
        },
        update: ({ time, dt, pointer }) => {
            // pointer NDC → world units on the z = 0 plane at the camera distance
            const h = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * camera.position.z;
            s.px = damp(s.px, pointer.x * h * camera.aspect, 10, dt);
            s.py = damp(s.py, pointer.y * h, 10, dt);
            s.push = damp(s.push, pointer.over ? 1 : 0, 5, dt);
            const u = mat.uniforms;
            u.uTime.value = time;
            u.uPointer.value.set(s.px, s.py);
            u.uPush.value = s.push;
        },
        dispose: () => disposeScene(scene),
    };
};
