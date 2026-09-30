import * as THREE from 'three';

import type { SceneFactory } from '../stage/Stage';

import { damp, disposeScene, rng, smoothstep, studioEnv } from './shared';

const MAX = 900;

/** An instanced field of crystals: one draw call, a hover that lifts pieces near the cursor. */
export const createCrystals: SceneFactory = (renderer) => {
    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#10141b');
    scene.fog = new THREE.Fog('#10141b', 10, 26);
    const env = studioEnv(renderer);
    scene.environment = env;
    scene.environmentIntensity = 0.6;
    const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 100);

    const geo = new THREE.IcosahedronGeometry(0.32, 0);
    const mat = new THREE.MeshStandardMaterial({ color: '#b9d3ea', roughness: 0.25, metalness: 0.15, flatShading: true });
    const mesh = new THREE.InstancedMesh(geo, mat, MAX);
    mesh.frustumCulled = false;
    scene.add(mesh);
    const key = new THREE.DirectionalLight('#ffffff', 1.6);
    key.position.set(-4, 6, 5);
    scene.add(key, new THREE.HemisphereLight('#d8e6f5', '#1b2230', 0.6));

    // per-instance data, from a seeded random
    const r = rng(7);
    const items = Array.from({ length: MAX }, () => ({
        x: (r() - 0.5) * 22,
        y: (r() - 0.5) * 12,
        z: -r() * 8,
        s: 0.5 + r() * 1.1,
        spin: new THREE.Vector3(r() - 0.5, r() - 0.5, r() - 0.5).normalize(),
        phase: r() * Math.PI * 2,
        hover: 0,
    }));
    // shuffle order is already random, so drawing the first N keeps an even spread at any tier
    const m = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    const p = new THREE.Vector3();
    const sc = new THREE.Vector3();
    const ray = new THREE.Raycaster();
    const ndc = new THREE.Vector2();
    const plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
    const hit = new THREE.Vector3();
    const look = { x: 0, y: 0 };
    let hasHit = false;

    return {
        scene,
        camera,
        applyTier: (s) => {
            mesh.count = Math.round(MAX * s.share);
        },
        update: ({ time, dt, pointer }) => {
            look.x = damp(look.x, pointer.over ? pointer.x : 0, 3.5, dt);
            look.y = damp(look.y, pointer.over ? pointer.y : 0, 3.5, dt);
            camera.position.set(look.x * 0.8, look.y * 0.5, 12);
            camera.lookAt(0, 0, -3);

            hasHit = false;
            if (pointer.over) {
                ray.setFromCamera(ndc.set(pointer.x, pointer.y), camera);
                hasHit = !!ray.ray.intersectPlane(plane, hit);
            }
            for (let i = 0; i < mesh.count; i++) {
                const it = items[i];
                const d = hasHit ? Math.hypot(it.x - hit.x, it.y - hit.y) : 99;
                it.hover = damp(it.hover, hasHit ? smoothstep(2.6, 0, d) : 0, 7, dt);
                p.set(it.x, it.y + Math.sin(time * 0.6 + it.phase) * 0.12, it.z + it.hover * 1.4);
                q.setFromAxisAngle(it.spin, time * 0.3 + it.phase + it.hover * 1.5);
                sc.setScalar(it.s * (1 + it.hover * 0.4));
                m.compose(p, q, sc);
                mesh.setMatrixAt(i, m);
            }
            mesh.instanceMatrix.needsUpdate = true;
        },
        dispose: () => {
            disposeScene(scene);
            env.dispose();
        },
    };
};
