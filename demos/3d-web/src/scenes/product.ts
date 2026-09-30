import * as THREE from 'three';

import type { SceneFactory } from '../stage/Stage';

import { clamp, damp, disposeScene, easeInOut, lerp, smoothstep, studioEnv } from './shared';

/** Live readout for the page (the dials the scroll produces). */
export const productDials = { progress: 0, explode: 0, turn: 0 };

/**
 * A made-up object in a soft studio. Scroll through the section and it separates into its parts
 * (each part with its own delay window), then comes back together; the camera moves on a rail.
 */
export const createProduct: SceneFactory = (renderer) => {
    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#e7e8eb');
    const env = studioEnv(renderer);
    scene.environment = env;
    scene.environmentIntensity = 0.5;
    const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 100);

    const hemi = new THREE.HemisphereLight('#ffffff', '#9aa0aa', 0.9);
    const key = new THREE.DirectionalLight('#ffffff', 2.2);
    key.position.set(-3, 6, 4);
    key.castShadow = true;
    key.shadow.mapSize.set(1024, 1024);
    key.shadow.bias = -0.0004;
    key.shadow.normalBias = 0.02;
    Object.assign(key.shadow.camera, { left: -3, right: 3, top: 3, bottom: -3, near: 1, far: 20 });
    scene.add(hemi, key);

    const ground = new THREE.Mesh(new THREE.PlaneGeometry(30, 30), new THREE.ShadowMaterial({ opacity: 0.16 }));
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    scene.add(ground);

    // parts: base, body, cap, ring — each gets an exploded offset and a delay
    const shell = new THREE.MeshStandardMaterial({ color: '#f4f4f2', roughness: 0.45 });
    const dark = new THREE.MeshStandardMaterial({ color: '#23262d', roughness: 0.6 });
    const accent = new THREE.MeshStandardMaterial({ color: '#3056f5', roughness: 0.3, metalness: 0.2 });
    const parts = [
        { mesh: new THREE.Mesh(new THREE.CylinderGeometry(0.9, 1, 0.22, 64), dark), home: new THREE.Vector3(0, 0.11, 0), off: new THREE.Vector3(0, -0.05, 0), delay: 0.3 },
        { mesh: new THREE.Mesh(new THREE.CapsuleGeometry(0.62, 1.1, 12, 48), shell), home: new THREE.Vector3(0, 1.1, 0), off: new THREE.Vector3(0, 0.7, 0), delay: 0.1 },
        { mesh: new THREE.Mesh(new THREE.TorusGeometry(0.66, 0.06, 16, 96), accent), home: new THREE.Vector3(0, 1.25, 0), off: new THREE.Vector3(0, 1.6, 0), delay: 0 },
        { mesh: new THREE.Mesh(new THREE.SphereGeometry(0.28, 32, 16), accent), home: new THREE.Vector3(0, 2.05, 0), off: new THREE.Vector3(0, 2.4, 0), delay: 0.05 },
    ];
    parts[2].mesh.rotation.x = Math.PI / 2;
    const group = new THREE.Group();
    parts.forEach((pt) => {
        pt.mesh.castShadow = true;
        pt.mesh.position.copy(pt.home);
        group.add(pt.mesh);
    });
    scene.add(group);

    const START = new THREE.Vector3(0, 1.4, 7.5);
    const SIDE = new THREE.Vector3(4.6, 2.6, 5.4);
    const TARGET = new THREE.Vector3(0, 1.15, 0);
    const pos = new THREE.Vector3();
    const s = { x: 0, turn: 0 };

    return {
        scene,
        camera,
        update: ({ dt, progress, pointer, time }) => {
            // scroll → dials: explode between 30% and 60% of the section's pass, back by 85%
            const explode = smoothstep(0.3, 0.55, progress) * (1 - smoothstep(0.7, 0.88, progress));
            const rail = easeInOut(clamp((progress - 0.15) / 0.7));
            productDials.progress = progress;
            productDials.explode = explode;
            productDials.turn = rail;

            s.x = damp(s.x, pointer.over ? pointer.x : 0, 3.5, dt);
            pos.copy(START).lerp(SIDE, rail);
            camera.position.set(pos.x + s.x * 0.4, pos.y + Math.sin(time * 0.3) * 0.03, pos.z);
            camera.lookAt(TARGET);

            s.turn = damp(s.turn, rail * Math.PI * 0.6, 4, dt);
            group.rotation.y = s.turn + time * 0.05;
            for (const pt of parts) {
                const local = smoothstep(pt.delay, pt.delay + 0.7, explode); // each part has its own window
                pt.mesh.position.set(pt.home.x, lerp(pt.home.y, pt.off.y, local), pt.home.z);
            }
        },
        dispose: () => {
            disposeScene(scene);
            env.dispose();
        },
    };
};
