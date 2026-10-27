# HandLab — form · explode · learn, with your hand

Your webcam fills the screen. A glowing hologram floats in front of you, and you control it with bare hands:
snap to summon it from particles, open your hand to pull it apart, point at a part to learn what it is, and pinch to
pull that part out.

- **Three.js r160** (pinned `three@0.160.0`): additive wireframes and particle shaders
- **MediaPipe Tasks Vision `HandLandmarker`** (pinned `@mediapipe/tasks-vision@0.10.14`, float16 model v1): 2 hands × 21 landmarks, GPU with CPU fallback
- **No build step, no backend.** Plain ES modules and an import map

## Run

```bash
cd HandLab
npx serve .
```

Open the printed `http://localhost:3000` in **Chrome or Edge** and allow the camera. The camera only works on `localhost`
or `https://`, never on `file://`. The first load downloads about 10 MB (WASM + model) from a CDN.

> The in-app browser of some editors (e.g. the Claude desktop app's preview pane) blocks webcams.
> Use a normal browser window.

## Gestures

| Gesture | What it does | Rule (all distances ÷ palm length, so it works at any distance) |
|---|---|---|
| ✨ **Snap** | Summon the model from particles / dissolve it | thumb tip touches middle tip (index free) for ≥ 2 frames and ≤ 1.5 s, then they separate (> 0.6) within 400 ms |
| ✊ **Fist** (+ move it) | Put it back together · **move the fist to drag the model around** | 4 fingers curled, index tip buried in the palm (ratio < 0.8), thumb tucked |
| ✋ **Open slowly** | Explode it, see inside | hand openness (mean extension of 5 digits) mapped 0.3 → 0.85 onto explode 0 → 1. Explode only grows while open; a fist closes it |
| 🤚 **Twist / raise hand** | Rotate and tilt | palm axis (wrist → middle knuckle) tilted > 15° spins the model, full speed at 55°. Hand height sets the tilt (±35°) |
| ☝️ **Point** | Highlight a part; hold 0.5 s to show its info card | only the index finger extended. The fingertip is mapped through the same crop as the video, so you point where you see your finger |
| 🤏 **Pinch** | On a part you pointed at: pull it out · **on empty space: grab and rotate the model** | thumb–index < 0.25 to start, > 0.40 to release. The part follows the pinch and comes toward you, and flies back on release |
| 🙌 **Two hands** | Zoom (apart / together) · **move both to drag the model** | distance between palms relative to when the second hand appeared, ^1.3 |
| ✌️ **Peace** | Next model | index + middle extended, ring + pinky folded. Edge-triggered, 1.5 s cooldown |

**Finger extended:** `|wrist→tip| / |wrist→PIP| > 1.12` and PIP joint straighter than 140°. **Curled:** that ratio is below 1.0.
The default **Ultra sensitive** preset needs very little movement. A gesture counts after **2 frames**. A half-open
hand already explodes fully. Moving the open hand 2 % of the screen sideways turns the model ~10°. A 7° tilt of the
hand starts it spinning. The **Gesture sensitivity** dropdown (Ultra / Strict / Standard / Forgiving) changes the
thresholds and the frame count in one go.

Mouse / keyboard fallback: drag = rotate, right-drag or Shift+drag = move, wheel = zoom, click = select, slider = explode. Keys: `←/→` model, `S` snap,
`E` explode, `R` reset, `L` labels, `A` auto-rotate, `V` camera background, `1–4` view style, `H` hacker theme, `Esc` deselect.

## Subjects (11 categories, 46 models)

| Subject | Models (🔧 = instrument used in that subject) |
|---|---|
| REAL 3D | Ferrari 458 Italia, Two-cylinder engine (67 parts), Gearbox (95 parts), Off-road buggy (190 parts), Antique camera, Street lantern, Sci-fi helmet — detailed textured models |
| GEOMETRY | Cube, Tetrahedron, Octahedron, Dodecahedron, Icosahedron, Square Pyramid, Triangular & Hexagonal Prism, Cylinder, Cone, Sphere, Torus, 🔧 Drawing tools (ruler, compass, protractor, set square, pencil) |
| PHYSICS | Carbon atom (spinning electron shells), Bar magnet & field lines, DC electric motor (spinning rotor), Newton’s cradle, 🔧 Dynamometer |
| CHEMISTRY | Water H₂O, Methane CH₄, Benzene C₆H₆, Salt crystal NaCl, 🔧 Lab glassware (flask, beaker, test tubes, Bunsen burner, graduated cylinder) |
| BIOLOGY | Animal cell, DNA double helix, 🔧 Light microscope |
| ANATOMY | Human eye, Lungs & ribcage |
| ASTRONOMY | Solar system (Sun + 8 planets), Earth interior, Saturn V, 🔧 Refracting telescope |
| WONDERS | Great Pyramid of Giza, Eiffel Tower |
| ENGINES | Inline-4 engine, Turbofan |
| VEHICLES | Sports car, Airliner |
| MACHINES | Quadcopter drone |

Each part has a name, colour and one-line fact. Polyhedra are split automatically into **faces**, **edges** and
**vertices** (counted from the geometry, so V − E + F = 2 always matches), and they explode as three layers.

## Real 3D models and realistic rendering

The **REAL 3D** category loads detailed, textured GLB / glTF models at runtime. Every mesh becomes its own piece
(so a 190-part buggy explodes into 190 pieces), and meshes are grouped into named parts by their names
(Ferrari: body, glass, wheels, brakes, interior…). In the realistic style they keep their original PBR materials
and textures. Wireframe edges are only computed when you switch to a style that draws them, so loading stays fast.

**Realistic** is the default view style. It uses filmic (ACES) tone mapping, studio reflections (`RoomEnvironment`) and
physically based materials. Procedural models get natural materials by part type: chrome, steel, car paint with
clear-coat, rubber, glass with transmission, stone and wet organic tissue. The Earth uses a real satellite texture.

## View styles (panel → "View style", keys 1–4)

| Style | Look |
|---|---|
| **Dotted** (Nuqtali) | Glowing edges + surface particles — the hologram |
| **X-ray** (Rentgen) | See-through bluish shells that glow where surfaces turn away (fresnel), like a radiograph |
| **Realistic** (Realistik, default) | Photographic: PBR materials, reflections, real textures |
| **Fantasy** (Fantastik) | Rainbow colours shifting over time, drifting particles |

Whatever the style, particles still carry the snap / form / dissolve animation.

## Hacker theme (toolbar `>_` or key `H`)

Green-on-black terminal look: monospace font, CRT scanlines, Matrix digital rain over a green-tinted camera image, and
every model drawn in shades of green. It can be combined with any view style.

## Language: O‘zbekcha / English

The **UZ / EN** button in the toolbar switches every text: panel, gestures, messages, model names, part names and facts.
The default is Uzbek, and the choice is remembered. UI strings are in `src/i18n.js`. Uzbek model texts are in `src/models/uz.js`
(geometry texts are in `src/models/geometry.js`), keyed by model id and the English part name. Anything missing falls back to
English.

To add a model, write its definition and add its Uzbek texts:

```js
export const myThing = {
  id: 'my-thing', name: 'My Thing', specs: 'one-line specs', about: 'short intro',
  parts: [
    { name: 'Housing', color: C.cyan, info: 'What it does.', build: () => box(1, 0.5, 1) },
    // build() may return an array -> several instances that explode separately (e.g. 4 wheels)
    { name: 'Feet', color: C.yellow, spread: 1.2, ex: [0, -1, 0], info: '…',
      build: () => [-1, 1].map((x) => cyl(0.1, 0.1, 0.3, { p: [x, -0.4, 0] })) },
  ],
};
```

`spread` scales the automatic radial explode and `ex` adds a hand-tuned direction. Both are in units of half the model radius.

## Architecture

```
webcam ─► camera.js ─► handTracker.js (detectForVideo, adaptive rate)
                           ▼
main.js: mirror X ─► One Euro filter ─► gestures.analyzeHand (gesture, openness, twist)
                     + SnapDetector (per hand)   ─► StableValue (N-frame hysteresis)
                           ▼
stateMachine.js   NONE · MOVING · FIST · POINTING · PINCHING · ZOOMING · PEACE  (+ snap / next events)
                           ▼
controller.js     targets ─► damping every frame ─► HoloModel (rotate, zoom, explode, hover, select, pull)
                           ▼
hologram.js (wireframe + particle shader)   labels.js (leader lines)   handOverlay.js (skeleton + openness ring)
```

| File | Role |
|---|---|
| `src/config.js` | **Every** threshold, sensitivity preset and visual constant, with comments |
| `src/gestures.js` | Finger states, ordered gesture rules, openness, twist angle, `SnapDetector` |
| `src/stateMachine.js` | Gestures → mode, values and events; the hand that is already driving keeps priority |
| `src/controller.js` | Smoothing, pointing/dwell, pinch-to-pull (screen ray → plane → model space), mouse |
| `src/hologram.js` | Builds parts → edges + faint fill + surface particles (MeshSurfaceSampler), form/dissolve shader, explode |
| `src/labels.js` | Two label columns with collision-free stacking and elbow leader lines |
| `src/handOverlay.js` | Full-screen skeleton + golden openness ring, mapped through the video's `object-fit: cover` crop |
| `src/models/` | `primitives.js` (geometry helpers) + one file per category + `catalog.js` |
| `src/ui.js` · `index.html` · `src/styles.css` | Panel, category bar, toolbar, stats, toasts |

Switching models dissolves the old one into particles while the new one forms. Its GPU resources are freed as soon
as it has fully dissolved.

## Tuning

| Symptom | Change in `src/config.js` (or pick a sensitivity preset) |
|---|---|
| Gestures hard to trigger | Sensitivity → **Forgiving** |
| Random gestures fire | Sensitivity → **Strict** |
| Model explodes too easily | `interaction.OPEN_MIN` ↑ / `OPEN_MAX` ↑ |
| Model spins when you don't want it to | `TWIST_DEADZONE_DEG` ↑ |
| Snap not detected | `snap.CONTACT_RATIO` ↑ (0.35), `RELEASE_WINDOW_MS` ↑ (600) |
| Snap fires by accident | `snap.MIN_CONTACT_FRAMES` ↑ (3) |
| Landmarks jitter | `filter.MIN_CUTOFF` ↓. Laggy: `filter.BETA` ↑ |
| Too many / too few particles | `hologram.PARTICLES_PER_MODEL`, `POINT_SIZE`, `POINT_ALPHA` |
| Low fps | lower `camera.WIDTH/HEIGHT` (e.g. 960×540) and `PARTICLES_PER_MODEL` |

Live values are in the browser console: `handlab.model`, `handlab.controller.target`, `handlab.stateMachine.mode`,
`handlab.CONFIG`.

## Troubleshooting

| Problem | Fix |
|---|---|
| "Camera permission was denied" | Click the camera icon in the address bar → Allow → reload. Windows: *Settings → Privacy & security → Camera* → allow apps and desktop apps. |
| "Webcam is in use by another app" | Close Zoom, Teams, OBS or other tabs using the camera. |
| "only works on https or localhost" | Use `http://localhost:…` from `npx serve .`, not `file://`. |
| "Hand-tracking model failed to load" | Needs internet (jsDelivr + storage.googleapis.com). Disable VPN or ad blockers, or self-host the files and change `CONFIG.assets`. |
| Stats show `CPU` and tracking is slow | GPU delegate unavailable. Lower the camera resolution. |
| Gestures flicker | Light your hands from the front, keep the whole hand in frame, stand 50–100 cm away. |

## Next steps

1. **Custom gestures via a tiny MLP**: record landmark samples per gesture in the browser and train a 63→32→N network to run alongside the rules.
2. **Voice**: Web Speech API ("explode", "show the lens", "next"), combined with pointing.
3. **Multi-user**: sync the controller targets over WebRTC so a teacher's hand drives every student's screen.
4. **glTF models**: load real models whose named meshes become parts automatically.
5. **Quiz mode**: "Point at the mitochondria" with a score and a timer.

## Credits

Real 3D models are downloaded at runtime from public sample repositories and keep their own licences (some are
CC-BY, some CC-BY-NC — check each one before any commercial use):

- Ferrari 458 Italia — three.js examples (`examples/models/gltf/ferrari.glb`)
- 2CylinderEngine, GearboxAssy, Buggy, AntiqueCamera, Lantern, DamagedHelmet — Khronos Group
  [glTF-Sample-Models](https://github.com/KhronosGroup/glTF-Sample-Models), each folder has its README with the licence
- Earth texture — three.js examples (`textures/planets/earth_atmos_2048.jpg`)
