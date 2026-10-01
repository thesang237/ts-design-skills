import { ContactShadows, Environment, Lightformer, OrbitControls, PerformanceMonitor } from "@react-three/drei";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";

import { PRODUCT, useConfigurator } from "../config/store";
import { Chair } from "./Chair";
import { MaterialLibrary, warmUp } from "./materials";
import { motion } from "./motionPrefs";
import { snapshotBridge } from "./snapshot";

/** Camera glide to a view preset: about 0.8s, ease-in-out, no overshoot; any drag cancels it. */
const GLIDE_MS = 800;
const DESIGN_ASPECT = 1.15;
const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

function CameraDirector() {
  const view = useConfigurator((s) => s.view);
  const controls = useThree((s) => s.controls) as unknown as OrbitControlsImpl | null;
  const camera = useThree((s) => s.camera);
  const invalidate = useThree((s) => s.invalidate);
  const aspect = useThree((s) => s.size.width / Math.max(1, s.size.height));
  const glide = useRef<{ fromPos: THREE.Vector3; fromTarget: THREE.Vector3; toPos: THREE.Vector3; toTarget: THREE.Vector3; t: number } | null>(null);

  useEffect(() => {
    if (!controls) return;
    const preset = PRODUCT.views[view] ?? PRODUCT.views.overview!;
    const toTarget = new THREE.Vector3(...preset.target);
    // Presets are designed for a landscape stage; narrower stages back the camera off so nothing crops.
    const fit = Math.min(1.7, Math.max(1, DESIGN_ASPECT / aspect));
    const toPos = new THREE.Vector3(...preset.position).sub(toTarget).multiplyScalar(fit).add(toTarget);
    if (motion.reduced) {
      camera.position.copy(toPos);
      controls.target.copy(toTarget);
      controls.update();
      invalidate();
      return;
    }
    glide.current = { fromPos: camera.position.clone(), fromTarget: controls.target.clone(), toPos, toTarget, t: 0 };
    invalidate();
  }, [view, controls, camera, invalidate, aspect]);

  useEffect(() => {
    if (!controls) return;
    // The person takes over: stop the glide where it is.
    const cancel = () => (glide.current = null);
    controls.addEventListener("start", cancel);
    return () => controls.removeEventListener("start", cancel);
  }, [controls]);

  useFrame((_, delta) => {
    const g = glide.current;
    if (!g || !controls) return;
    g.t = Math.min(1, g.t + (delta * 1000) / GLIDE_MS);
    const k = easeInOut(g.t);
    camera.position.lerpVectors(g.fromPos, g.toPos, k);
    controls.target.lerpVectors(g.fromTarget, g.toTarget, k);
    controls.update();
    if (g.t >= 1) glide.current = null;
    invalidate();
  });
  return null;
}

function Scene({ onReady }: { onReady: () => void }) {
  const config = useConfigurator((s) => s.config);
  const lib = useMemo(() => new MaterialLibrary(), []);
  const gl = useThree((s) => s.gl);
  const scene = useThree((s) => s.scene);
  const camera = useThree((s) => s.camera);
  const invalidate = useThree((s) => s.invalidate);
  const [warm, setWarm] = useState(false);

  useEffect(() => {
    let cancelled = false;
    warmUp(lib, gl, scene, camera).then(() => {
      if (cancelled) return;
      setWarm(true);
      invalidate();
    });
    return () => {
      cancelled = true;
    };
  }, [lib, gl, scene, camera, invalidate]);

  // Reveal only after a real frame of the warmed-up product has been drawn.
  useEffect(() => {
    if (!warm) return;
    const id = requestAnimationFrame(() => requestAnimationFrame(onReady));
    return () => cancelAnimationFrame(id);
  }, [warm, onReady]);

  useEffect(() => () => lib.dispose(), [lib]);

  useEffect(() => snapshotBridge.attach(gl, scene, invalidate), [gl, scene, invalidate]);

  return warm ? <Chair product={PRODUCT} config={config} lib={lib} /> : null;
}

export const STAGE_BG = "#f1eee8";

export default function Stage({ onReady, onLost }: { onReady: () => void; onLost: () => void }) {
  const [dpr, setDpr] = useState(1.75);
  const start = PRODUCT.views.overview!;
  return (
    <Canvas
      className="stage-canvas"
      frameloop="demand"
      shadows="percentage"
      dpr={[1, dpr]}
      camera={{ fov: 32, near: 0.05, far: 50, position: start.position }}
      gl={{ antialias: true, toneMapping: THREE.NeutralToneMapping }}
      onCreated={({ gl }) => {
        gl.domElement.addEventListener("webglcontextlost", (e) => {
          e.preventDefault();
          onLost();
        });
      }}
    >
      <color attach="background" args={[STAGE_BG]} />
      <PerformanceMonitor onDecline={() => setDpr(1.25)} onIncline={() => setDpr(1.75)} />
      <Environment resolution={256} frames={1}>
        <mesh scale={30}>
          <sphereGeometry args={[1, 32, 16]} />
          <meshBasicMaterial color="#cfcac2" side={THREE.BackSide} />
        </mesh>
        <Lightformer form="rect" intensity={2.4} position={[0, 6, 2]} rotation-x={Math.PI / 2} scale={[8, 6, 1]} />
        <Lightformer form="rect" intensity={1.6} position={[-5, 2, 3]} rotation-y={Math.PI / 2} scale={[6, 2, 1]} />
        <Lightformer form="rect" intensity={1} position={[5, 2, -2]} rotation-y={-Math.PI / 2} scale={[6, 2, 1]} />
      </Environment>
      <hemisphereLight args={["#ffffff", "#d8d2c8", 0.35]} />
      <directionalLight
        position={[2.5, 4, 2.2]}
        intensity={1.4}
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-bias={-0.0004}
        shadow-normalBias={0.02}
        shadow-radius={4}
        shadow-camera-left={-1}
        shadow-camera-right={1}
        shadow-camera-top={1.2}
        shadow-camera-bottom={-0.6}
      />
      <ContactShadows position={[0, 0, 0]} scale={4} resolution={512} far={1} blur={2.2} opacity={0.5} color="#3b3328" />
      <Scene onReady={onReady} />
      <OrbitControls
        makeDefault
        target={start.target}
        enableDamping
        dampingFactor={0.09}
        enablePan={false}
        minDistance={0.9}
        maxDistance={4}
        minPolarAngle={0.25}
        maxPolarAngle={1.5}
      />
      <CameraDirector />
    </Canvas>
  );
}
