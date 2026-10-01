# 3D lessons for 3d-web (from the configurator builds)

General three.js / React Three Fiber lessons found while building a keyboard configurator and the
`demos/product-configurator` chair. They belong in **3d-web**, not in product-configurator. Kept
here so they can be folded in later (approved: keep as a list for now, 2026-10-01).

| Lesson | Evidence | Where in 3d-web |
| --- | --- | --- |
| Fit the camera from the model's **projected bounding-box corners** (closed form per corner, binary search on distance, then shift the principal point with `setViewOffset` to centre the projected box in the free area). Size guesses let tall or near-camera parts slide under toolbars | Exploded stack overlapped the toolbar until the exact fit | `camera-light.md` |
| Keep **framing separate from orbit**: framing owns view offset, fit distance and an optional presentation tilt; the user owns azimuth, polar and zoom; combine both in one place each frame | Panels opening and exploded views never fought the user's orbit | `camera-light.md` |
| **Warm up shader variants with the real meshes' flags** (castShadow, receiveShadow, transparency for fades). Shadow settings are part of the compiled program; a mismatch means a stall on first use | First material swap took 51 ms until the warm-up matched | `materials-shaders.md`, `performance-tiers.md` |
| Many per-item colours (keycaps, tiles, LEDs): **one merged mesh + item id attribute + a small float data texture**, read with `texelFetch`. Changing a colour rewrites a few texels | 82 keys in one draw call, 60 fps while editing | `materials-shaders.md` |
| **Screen-space inverted-hull outlines**: extrude along the clip-space normal by `width * clip.w * 2 / resolution` for a constant pixel width; use a smoothed-normal twin of the geometry | Clean hover and selection outlines at any zoom | `materials-shaders.md` |
| **Snapshots without `preserveDrawingBuffer`**: render the snapshot camera, read the canvas back in the same task, then invalidate | Cart thumbnails with no per-frame cost and no flash | `dom-blending.md` or a new snapshot section |
| A **hidden preview window pauses `requestAnimationFrame`**: animations appear stuck and timings are meaningless. Measure in a visible window or headless Chrome with GPU flags; clamp frame delta to about 100 ms | Animation progress stuck at 0.36 in a hidden pane | `pitfalls.md`, `performance-tiers.md` |
| **Lathe geometry**: the profile must run bottom to top for outward normals | A turned knob rendered nearly black | `pitfalls.md` |
| **Metals need an environment with bright, varied regions** and a mid-grey surround; fine grain only (large-scale roughness noise reads as a pattern) | Aluminium looked like carbon fibre | `camera-light.md`, `materials-shaders.md` |
| Keep three.js out of the first-paint chunk: a single static import of a three.js helper from UI code pulls in the whole library | 597 KB first chunk until the helper was imported dynamically | `setup-nextjs.md` |
| Postprocessing APIs move between versions (`DepthOfField.focusDistance` became `target`): check installed types first | Type error | `compositing.md` |
