import { useEffect, useRef, useState } from 'react';
import { bloom } from 'three/examples/jsm/tsl/display/BloomNode.js';
import { color, mix, normalView, oneMinus, pass, positionViewDirection, sin, time, uniform } from 'three/tsl';
import * as THREE from 'three/webgpu';

/**
 * Loaded only when asked (its own chunk: three/webgpu is a separate copy of three).
 * The same scene runs on WebGPU, or on the automatic WebGL 2 fallback.
 */
export default function WebGPUScene({ forceWebGL }: { forceWebGL: boolean }) {
    const host = useRef<HTMLDivElement>(null);
    const [backend, setBackend] = useState('starting…');
    const [glowValue, setGlowValue] = useState(1.2);
    const glow = useRef(uniform(1.2));

    useEffect(() => {
        const el = host.current;
        if (!el) return;
        let disposed = false;
        const renderer = new THREE.WebGPURenderer({ antialias: true, forceWebGL });
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
        renderer.toneMapping = THREE.NeutralToneMapping;
        el.appendChild(renderer.domElement);
        renderer.domElement.style.cssText = 'display:block;width:100%;height:100%';

        const scene = new THREE.Scene();
        scene.background = new THREE.Color('#0b0c10');
        const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 100);
        camera.position.set(0, 0, 6);
        scene.add(new THREE.HemisphereLight('#dfe8ff', '#1a1c24', 0.8));
        const key = new THREE.DirectionalLight('#ffffff', 1.8);
        key.position.set(-3, 4, 5);
        scene.add(key);

        // TSL: a rim glow built from nodes (no GLSL string). Works on both backends.
        const rim = oneMinus(normalView.dot(positionViewDirection).abs()).pow(2.5);
        const pulse = sin(time.mul(1.4)).mul(0.15).add(0.85);
        const mat = new THREE.MeshStandardNodeMaterial({ color: '#1b2233', roughness: 0.35, metalness: 0.3 });
        mat.emissiveNode = mix(color('#000000'), color('#7fc4ff'), rim.mul(glow.current).mul(pulse));
        const knot = new THREE.Mesh(new THREE.TorusKnotGeometry(1, 0.32, 220, 32), mat);
        scene.add(knot);

        // post-processing on WebGPU: RenderPipeline + TSL nodes
        const pipeline = new THREE.RenderPipeline(renderer);
        const scenePass = pass(scene, camera);
        const color0 = scenePass.getTextureNode('output');
        pipeline.outputNode = color0.add(bloom(color0, 0.7, 0.3, 0.2));

        const resize = () => {
            const r = el.getBoundingClientRect();
            renderer.setSize(r.width, r.height, false);
            camera.aspect = r.width / Math.max(1, r.height);
            camera.updateProjectionMatrix();
        };
        const ro = new ResizeObserver(resize);
        ro.observe(el);

        renderer
            .init()
            .then(() => {
                if (disposed) return;
                resize();
                const isWebGPU = (renderer.backend as { isWebGPUBackend?: boolean }).isWebGPUBackend === true;
                setBackend(isWebGPU ? 'WebGPU' : 'WebGL 2 (automatic fallback)');
                renderer.setAnimationLoop((t) => {
                    knot.rotation.set(t * 0.00025, t * 0.0004, 0);
                    pipeline.render();
                });
            })
            .catch((e: unknown) => setBackend(`failed: ${String(e)}`));

        return () => {
            disposed = true;
            ro.disconnect();
            renderer.setAnimationLoop(null);
            knot.geometry.dispose();
            mat.dispose();
            pipeline.dispose();
            renderer.dispose();
            renderer.domElement.remove();
        };
    }, [forceWebGL]);

    return (
        <div className="gpu-card">
            <div ref={host} className="gpu-stage" aria-hidden="true" />
            <div className="gpu-meta">
                <span className="badge">{backend}</span>
                <label className="slider">
                    <span>Rim glow (a TSL uniform)</span>
                    <input
                        type="range"
                        min={0}
                        max={3}
                        step={0.01}
                        value={glowValue}
                        onChange={(e) => {
                            const v = parseFloat(e.target.value);
                            glow.current.value = v;
                            setGlowValue(v);
                        }}
                    />
                    <output>{glowValue.toFixed(2)}</output>
                </label>
            </div>
        </div>
    );
}
