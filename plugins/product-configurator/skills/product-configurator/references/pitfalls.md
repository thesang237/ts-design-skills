# Pitfalls: what went wrong, and the fix

From two builds: a 75% keyboard configurator (exploded view, per-key editing, saved designs) and the
lounge chair demo. Every row was found by a screenshot, a test or a measurement, not guessed. The
designer gave one brief and made no corrections in the keyboard build, so these are all "Broke" or
"Fragile" items found by checking. Names removed.

## Looks

| Problem | How it showed up | Fix |
| --- | --- | --- |
| Brushed aluminium looked like black carbon fibre | First screenshot | Metals reflect their surroundings: a studio environment with big soft lights and a mid-grey surround, not a dark void; and grain noise kept fine (low-frequency noise reads as a pattern) |
| A selection tint turned charcoal parts navy | Screenshot after selecting the whole set | Show selection with outlines (and at most an edge-only rim), never by tinting the part people are judging |
| A turned knob rendered almost black | Close-up screenshot | Lathe geometry needs its profile from bottom to top for outward normals |
| Wood grain zigzagged on legs | Screenshot | Grain runs along the length of the part (texture `v`), with gentle wander, low contrast |
| Swatch colours looked more saturated in 3D than in the panel (cognac, bronze) | Side-by-side check | Tune choice colours under the studio light against the swatch; store the rendered colour, not the catalogue hex |
| Light text labels unreadable over the model on a light background | Light-background screenshot | Labels sit in columns outside the projected model bounds and have a quiet pill background |

## Motion and camera

| Problem | How it showed up | Fix |
| --- | --- | --- |
| An exploded or tall model slid under the toolbar | Screenshot at 1440 × 900 | Fit the camera from the model's projected bounding-box corners (exact, perspective-aware), not a size guess |
| Exploded layers looked crowded from the default height | Screenshot | A framing-owned extra tilt toward a lower view while exploded, separate from the user's orbit |
| Close-up camera presets cropped the product on phones | Phone screenshot | Scale the preset's offset by `designAspect / stageAspect` (clamped) |
| Reversing an animation mid-way flips direction instantly | Unit test of the progress curve | Acceptable for 0.2 to 1 s moves; for longer ones use a critically damped value instead of a linear progress |
| Animation crawled in the preview window | Progress stuck at 0.36 | The preview pane was hidden: browsers pause animation frames in hidden tabs. Measure in a visible window or headless Chrome with the GPU; clamp frame delta to 100 ms, not 50 |

## Performance

| Problem | How it showed up | Fix |
| --- | --- | --- |
| The **first** swap of each kind took 51 ms, never again | Long-task observer per action | The warm-up meshes didn't receive shadows, the real ones did; shadow settings are part of the compiled shader. Warm up with exactly the real meshes' flags, including the transparent crossfade copies |
| three.js landed in the first-paint bundle (597 KB) | Build output | One static import of a three.js helper from the panel; import it dynamically where it's used |
| `preserveDrawingBuffer` for screenshots slows every frame | Reading the docs | Render the snapshot camera and read the canvas back in the same task, then invalidate |
| A depth-of-field API changed between versions (`focusDistance` → `target`) | Type error | Check the installed version's types before writing effect code |
| Hundreds of swatchable items (keycaps) as separate materials | Planning | One merged mesh with a per-item id attribute and a small data texture for colours and states |

## Interaction and UI

| Problem | How it showed up | Fix |
| --- | --- | --- |
| Clicking a design's name did nothing | Playwright: "span intercepts pointer events" | Text layered over a full-size row button must be `pointer-events: none` |
| A swatch's hover lift covered its own radio input | Playwright | Give the hidden input `z-index: 1` above the decorative swatch |
| Escape didn't close the panel after a popover | E2E test | A tooltip reopened on the refocused trigger and swallowed Escape; handle Escape in the capture phase and ignore popups that are animating out (`[data-closed]`) |
| Tabbing through the toolbar left every tooltip open at once | Keyboard screenshot during measuring | Tooltips must close on blur, and only one may be open at a time |
| A fieldset legend added an odd gap above swatches | Screenshot | `legend { float: left; width: 100% }` and `clear: both` on the next block |
| Clicking a rule-blocked choice was a dead end | Design review | Keep it focusable (`aria-disabled`, not `disabled`), show the reason, offer the fix |
| Automated tests can't click `aria-disabled` controls | Playwright refused | That's correct behaviour for assistive tech; use `force: true` only in the test |
| Labels (or popover chrome) captured in the poster | Looking at the generated poster | Hide overlay controls before screenshotting the canvas for posters |

## Process

| Problem | How it showed up | Fix |
| --- | --- | --- |
| Test expectations written with the wrong sign (view offset) | Failing test, correct code | Derive expected values from first principles (screen y grows downward) before blaming code |
| "Looks fine" in a small preview | Details missed until full-size screenshots | Check at 1440 × 900, 820 × 1180 and 390 × 844 with full-resolution screenshots, cropped where needed |
| No git history in the keyboard project | Retro had only the conversation | Start every project with `git init` and small commits, so the process can be studied later |
