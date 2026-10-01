# Camera and presentation

The product should look like a good studio photo the whole time: framed with room around it, lit
softly, standing on a shadow. The camera helps people see what they're changing, then gets out of
the way.

## 1. The stage

- **Own box, plain studio.** A seamless background a step darker than the page (warm paper on light
  pages), no visible floor edge, a soft contact shadow under the product, and the same background
  colour on the stage element and in the canvas so the poster and the 3D meet without a seam.
- **Light:** a studio environment (drei `<Environment>` with `<Lightformer>` rectangles: a large soft
  top light, a side strip, a weaker opposite fill, a mid-grey surround), one directional key light
  with soft shadows, a faint hemisphere fill. Neutral tone mapping (`THREE.NeutralToneMapping`) so
  colours match the swatches. Details in 3d-web `camera-light.md`.
- **Lens:** 30 to 35° vertical field of view for products. Wide lenses distort.
- **Real scale** (metres) so lights, shadows and AR all agree.

## 2. View presets per option group

Each option names a view; each view is a camera position and a target.

```ts
views: {
  overview: { label: "Overview", position: [1.75, 1.15, 2.15], target: [0, 0.36, 0] },
  seat:     { label: "Seat",     position: [1.0, 1.2, 1.65],   target: [0, 0.44, 0] },
  base:     { label: "Base",     position: [1.6, 0.42, 1.55],  target: [0, 0.26, 0] },
  side:     { label: "Side",     position: [2.25, 0.8, 0.3],   target: [0, 0.4, 0] },
}
```

- Frame the **whole product with the edited part prominent**, not a crop of the part. Cropped close-ups
  feel broken on narrow stages.
- Design presets on a landscape stage, then **scale the offset for narrow stages**:
  `fit = clamp(designAspect / stageAspect, 1, 1.7)`; position = target + (preset − target) × fit.
- Show the views as buttons on the stage (also the keyboard path for people who can't drag).

## 3. Glide to the part being edited (about 0.8 s, no overshoot)

```tsx
function CameraDirector() {
  const view = useConfigurator((s) => s.view);              // set by the store when an option changes
  const controls = useThree((s) => s.controls) as OrbitControls | null;
  const camera = useThree((s) => s.camera);
  const glide = useRef<null | { from: Vector3; fromT: Vector3; to: Vector3; toT: Vector3; t: number }>(null);

  useEffect(() => {
    if (!controls) return;
    const { to, toT } = fittedPreset(view);                  // with the aspect fit above
    if (reducedMotion()) { camera.position.copy(to); controls.target.copy(toT); controls.update(); return; }
    glide.current = { from: camera.position.clone(), fromT: controls.target.clone(), to, toT, t: 0 };
  }, [view]);

  useEffect(() => {
    const cancel = () => (glide.current = null);             // the person takes over immediately
    controls?.addEventListener("start", cancel);
    return () => controls?.removeEventListener("start", cancel);
  }, [controls]);

  useFrame((state, dt) => {
    const g = glide.current;
    if (!g || !controls) return;
    g.t = Math.min(1, g.t + dt / 0.8);
    const k = easeInOut(g.t);                                // web-motion ease-in-out, no spring
    camera.position.lerpVectors(g.from, g.to, k);
    controls.target.lerpVectors(g.fromT, g.toT, k);
    controls.update();
    if (g.t === 1) glide.current = null;
    state.invalidate();
  });
  return null;
}
```

- Glide when an option **changes** and when its group gets keyboard focus; don't glide on mouse hover
  over the panel (the camera would wander while the pointer travels).
- Lerping position and target together keeps the motion calm. For long moves around the product,
  interpolate in spherical coordinates around the target instead, so the camera doesn't cut through it.
- Orbit limits: no going under the floor (`maxPolarAngle` about 1.5), sensible zoom limits, no pan on
  product pages. Light damping (0.08 to 0.1) is fine; it's inertia, not bounce.
- **Never auto-rotate while people choose.** If a hero needs life, use a very slow turntable that
  stops on the first interaction and doesn't restart on its own.

## 4. Highlight the part being edited (optional)

A brief, quiet cue helps on complex products: a 1 to 2 px outline (inverted hull with a screen-space
width, or postprocessing Outline) for about 600 ms, or dimming other parts to 85%. Never tint the
part itself: it changes the colour people are judging.

## 5. Overlay layouts: re-frame instead of hiding

When a panel floats over a full-screen canvas, move the product into the free area with
`camera.setViewOffset(fullW, fullH, offsetX, offsetY, fullW, fullH)`. Compute the fit from the
product's bounding box projected through the camera (corners → screen), not a fixed offset, and animate
offset and distance with the camera glide (the keyboard build does this with an exploded stack,
labels and an inspector):

```ts
// For a camera at distance d looking at T with basis (right r, up u, back b), a corner p projects to
// x = (p−T)·r / (d − (p−T)·b), y = (p−T)·u / (d − (p−T)·b)   (in tan-of-angle units).
// Binary-search the smallest d where the spans fit the free area (fitW/f, fitH/f with f = H/2/tan(fov/2)),
// then shift the principal point so the projected box is centred in it:
offsetX = W / 2 - freeCenterX + ((maxX + minX) / 2) * f;
offsetY = H / 2 - freeCenterY - ((maxY + minY) / 2) * f;
```

Fit for a few azimuths around the default view, so slow turning never pushes the product out of frame.

## 6. Snapshots from a hero camera

Cart thumbnails and "save image" use a fixed camera, not wherever the shopper orbited.

```ts
export function renderSnapshot(gl: WebGLRenderer, scene: Scene, view: View, size = 480) {
  const w = gl.domElement.width, h = gl.domElement.height;
  const cam = new PerspectiveCamera(30, w / h, 0.05, 50);
  cam.position.set(...view.position);
  cam.lookAt(new Vector3(...view.target));
  gl.render(scene, cam);                                   // read back in the same task: nothing flashes
  const out = Object.assign(document.createElement("canvas"), { width: size, height: size });
  const side = Math.min(w, h);
  out.getContext("2d")!.drawImage(gl.domElement, (w - side) / 2, (h - side) / 2, side, side, 0, 0, size, size);
  invalidate();                                            // redraw the shopper's own view next frame
  return out.toDataURL("image/webp", 0.9);
}
```

No `preserveDrawingBuffer` needed (it costs performance every frame). Postprocessing effects aren't
included unless you render through the composer; for configurators that's usually fine.

## 7. Posters

The first thing on screen is a still image of the default configuration, rendered **from the
configurator itself** so it matches exactly (the demo's `scripts/make-poster.mjs` screenshots the canvas
with the overlay controls hidden). `object-fit: contain` on the stage background colour; fade it out
(400 ms) after the first real 3D frame. For a shared link with a different configuration, show the
default poster with the panel already showing the shared choices, or render posters per popular
configuration on the server.
