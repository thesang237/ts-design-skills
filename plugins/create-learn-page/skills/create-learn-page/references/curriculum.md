# Studying the source and planning the curriculum

## 1. Study the source (before any design)

1. **Map the files.** Entry page, stores/state, scenes, UI components, utils. Count lines; read all of it.
2. **Trace the data flow** in one sentence per step: input → smoothing → progress → timeline → state
   ("dials") → renderers → screen. This becomes chapter 0's diagram.
3. **Run it and look.** Screenshot each scene/section at desktop and phone width.
4. **Measure** (don't guess): frame times while scrolling the whole page, draw calls per frame,
   memory after leaving and returning, console errors. A headless browser on the real GPU works when
   a preview pane is unavailable (see `verification.md`).
5. **Write the technique inventory**: technique · file · one-sentence "what it does" · values worth
   quoting · fragile points. Example row:
   `Stagger windows · canvas/BrickWorld.tsx · each brick waits for its height before moving · delay = h × 0.5 + rand × 0.14 · delays hard-coded twice`.
6. **Note what's newer or better** in the official docs of each tool, for the "upgrades" callouts.

## 2. Plan the chapters

Rules:
- Order by dependency: nothing uses an idea before its chapter.
- Chapter 0 is always **the map** (the whole system in one picture, the storyboard, a vocabulary
  bridge, where files live). The last is always **build your own** (recipe, a planning tool, briefs,
  final quiz, further reading).
- One technique family per chapter, 4 to 7 sections, 1 to 3 demos.
- Each chapter gets: a short title (tab label), a one-line promise, the "Remember" sentence, demos,
  source files, flashcards.

Show the plan as a table and wait for approval:

| # | Tab | Promise | Demos | Source files |
| --- | --- | --- | --- | --- |
| 00 | The map | How one input runs the whole show | pipeline diagram, timeline x-ray, exploded layers | page entry, store |

## The standard chapter set (scroll-driven / WebGL projects)

Adapt, drop or merge; don't pad.

| Tab | Teaches | Typical demos |
| --- | --- | --- |
| The map | System overview, storyboard, vocabulary | Pipeline diagram (hover nodes), timeline x-ray (scrubbable real timeline), exploded layer stack |
| Smooth scroll | Lenis, lerp vs damp, one clock | Native vs smooth side by side with scroll graphs; lerp/damp follower with simulated frame rates |
| Progress mapping | normalise → clamp → ease → lerp, stagger windows | Range mapper with live formula; stagger windows; scroll-scrubbed words; ease gallery |
| Scroll timeline | One master timeline, units = screens, onUpdate bridge | Timeline in a scroll box with its tracks; a real pinned section |
| Text motion | Masked reveals, decode, drawn lines, micro-hovers | Split lab with presets; scramble lab; draw-on lines; hover recipes with CSS |
| 3D stage | Scene/camera/renderer/light/fog, camera rails | Build-up slider 1→7; camera path with a director inset |
| 3D objects | Instancing, procedural layout, per-item data, noise terrain | The hero object rebuilt with its real dials; terrain layers with a cross-section |
| Shaders | Fragment/vertex, uniforms, fresnel, palettes, GPU motion | Shader in six steps; material with every effect on a dial; palette maker; GPU points |
| Transitions & FX | Render targets, blending worlds, post effects | Compositor with two real worlds and per-effect dials |
| Particles | Springs, energy, morphs, data textures | Particle figure (sweep/click/drag); "particles as pixels" texture view |
| Interaction | Pointer smoothing, picking, HUD anchoring, magnetism, sound | Parallax layers; picking + projected labels; magnetic buttons; sound lab |
| Performance | Frame budget, React off the hot path, draw calls, checklist | Render counter; draw-call bench; persistent checklist |
| Build your own | Recipe, storyboard tool, briefs, quiz | Storyboard → timeline code generator; final quiz |

For a small single-effect page: 5 to 8 steps on one page, same teaching pattern, no tabs.
