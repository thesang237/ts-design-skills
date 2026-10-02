# Painted scenes inside cards

For immersive pages where pictures live in shaped cards (folder tabs, cut corners) that lean, turn,
fly and hand off to each other, and the pictures themselves have depth. Learned on a one-film scroll
page with five painted scenes and seven rounds of fine-tuning with the designer.

The one idea to keep: **a card is a mask.** Its shape leans, turns and travels; the picture behind it
stays upright and moves only with its own parallax.

## 1. A layered painting is a small scene

Painted parallax art is usually delivered (or best built) as **a few painted planes at different
depths** in a glTF, sometimes with a head mesh that the painting is projected onto. Moving a camera
gives real parallax: near planes shift more than far ones, a face even turns a little.

- Render each painting from its own camera into a render target the size of the viewport; the card
  shows that texture. Unlit materials (`MeshBasicMaterial`, the paint already has its light), alpha
  blended, `depthWrite: false`, draw order from the planes' own order (front = drawn last).
- Effect planes without a texture (hair, energy, sparks) play a flipbook (TexturePacker sheet;
  respect the `spriteSourceSize` trim when frames are trimmed).
- **Render only paintings that are on screen**, once per frame even if two cards show the same one.
  A card that is nearly edge-on also renders the face it is about to reveal.
- Zoom into a painting (a close-up that becomes a mid-shot) with `camera.setViewOffset`, which keeps
  the true perspective of the planes; don't scale the texture.
- Warm every painting up behind the loader (`renderer.compile` + one render each) so its first frame
  on screen doesn't stall on texture upload.

## 2. The card is a mask (screen-space picture)

Sample the picture from where the pixel is **on screen inside the card's upright rectangle**, not from
the card's own UVs. Then the card's lean, turn and tilt only move its outline.

```glsl
uniform vec4 uRect;   // the card's upright rect on screen: centre x, y, width, height (CSS px, y up)
uniform vec4 uView;   // viewport size (CSS px), drawing-buffer size (device px)
vec2 sp  = gl_FragCoord.xy / uView.zw * uView.xy - uView.xy * 0.5;   // this pixel, CSS px from centre
vec2 fuv = (sp - uRect.xy) / uRect.zw + 0.5;                          // 0..1 inside the upright rect
// cover-fit fuv to the picture's aspect, then sample
```

- The shape (SDF, below) still uses the mesh's own UVs, so the outline turns with the card.
- **Picture frame:** let a card carry an optional fixed rect for its picture. While a card shrinks
  into a sliver or turns away, point the frame at the full screen (or where the picture was) so the
  painting stays still and only the mask changes.
- **Page-scroll parallax for free:** offset the sample by a little of the card's vertical position on
  screen (about 3–4 % of the picture when the card is half a screen off centre), with a matching
  overscan zoom so edges never show.
- Images with a baked shape (cut-out portraits, a word texture) keep mapping to the card instead.

## 3. Pointer parallax turns, it doesn't slide

- **The painting:** orbit its camera around a pivot about as far away as the subject (yaw/pitch of a
  few hundredths of a radian at the screen edge). Planes nearer than the pivot swing with the
  pointer, farther ones against it. A zoomed view magnifies the turn: divide by `zoom^0.65`.
- **Flat images:** a small slide inside the frame (about 1–2 % of the picture) with overscan.
- **The frame:** leans toward the pointer (about 0.10 rad pitch, 0.16 rad yaw at the edge), damped
  more slowly than the picture inside (λ ≈ 3 vs ≈ 5.5, varied a little per card) so the two read as
  separate layers. Cards that nearly fill the screen stop leaning (their edges would show).
- Never let the frame's lean turn the picture (that undoes the mask).

## 4. One card, several faces

A card that turns to reveal the next scene: list its faces in turning order. Every half turn of
`rotY` moves one step along the list; the face that is facing away is swapped while hidden.

```ts
const k = Math.round(Math.abs(rotY) / Math.PI)        // which face is showing
const front = faces.length === 1 ? faces[0] : faces[k % 2 === 0 ? k : k + 1]
const back  = faces.length === 1 ? faces[0] : faces[k % 2 === 0 ? k + 1 : k]
```

- Mirror the back face's UVs in the shader (`gl_FrontFacing`) and evaluate the shape in viewer
  space, so a "top right" notch is top right on both sides.
- Keep turning **in one direction** through a whole sequence, around the screen centre; dip back in
  depth during the turn (`z = -k · sin(π · progress)`).
- **One-sided cards** (`discard` on the back) disappear by turning past 90°: the cleanest exit for
  cards that shouldn't show a back.
- Hand-offs between full-screen scenes: the outgoing and incoming cards are driven by **one curve**
  (size, position and tilt together): the outgoing shrinks and leaves, the incoming starts small and
  far away and grows into full screen.

## 5. Shaped cards as an SDF

A rounded box minus a stepped "folder tab" notch (45° step) and an optional 45° corner cut, in pixel
units, so every parameter can animate and edges stay crisp at any size.

```glsl
float d = sdRoundBox(p, halfSize, r);
// notch: inside the cut when above the step line AND right of the 45° step (smooth min of the two)
float k = min(r * 1.1, notchDepth * 0.75);          // round the joints, never more than the step is deep
d = smax(d, notchCut(p, halfSize, notch, k), k);    // smax = smooth max
float mask = 1.0 - smoothstep(-0.5 * fwidth(d), 0.5 * fwidth(d), d);
```

- Radius: about 6 % of the card's short side, clamped to a range in the page's unit; the joints of
  the notch and the corner cut (including the obtuse 135° ones) get the same softness.
- Cap the joint rounding by the notch depth, or shallow steps melt into waves.
- A second notch slot covers shapes with two steps.

## Checklist

- [ ] Pointer left vs right screenshots: the frame leans, the picture inside stays upright and shifts by depth
- [ ] While a card shrinks or turns away, its picture doesn't move or rescale
- [ ] Hand-offs: both cards change size and position at the same time, on one curve
- [ ] Only on-screen paintings render (count them per frame); first appearance doesn't stall
- [ ] No faint outline on resting cards (effect widths that should be 0 are treated as off)
