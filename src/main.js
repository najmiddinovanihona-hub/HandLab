// HandLab bootstrap: renderer, hologram models, camera + hand tracking, and the main loop.
//
// Loop (requestAnimationFrame):
//   1. If tracking is ready and the detection budget allows:
//        detectForVideo -> mirror -> One Euro filter -> analyzeHand -> per-hand StableValue
//        + SnapDetector -> InteractionStateMachine -> Controller.handleHands
//   2. Controller.update(dt): damp toward targets, animate the hologram
//   3. Render WebGL (transparent, over the webcam video), labels, hand overlay

import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

import { CONFIG } from './config.js';
import { startCamera } from './camera.js';
import { HandTracker } from './handTracker.js';
import { LandmarkFilter, StableValue, EMA } from './filters.js';
import { analyzeHand, mirrorLandmarks, SnapDetector, GESTURES } from './gestures.js';
import { InteractionStateMachine, MODES } from './stateMachine.js';
import { Controller } from './controller.js';
import { HoloModel, STYLES } from './hologram.js';
import { MatrixRain } from './matrix.js';
import { LabelLayer } from './labels.js';
import { HandOverlay } from './handOverlay.js';
import { UI } from './ui.js';
import { CATALOG, ALL_MODELS } from './models/catalog.js';
import { t, getLang, setLang, onLangChange, modelText } from './i18n.js';

const ui = new UI();
const video = document.getElementById('webcam');

function webglAvailable() {
  try {
    const c = document.createElement('canvas');
    return !!c.getContext('webgl2') || !!c.getContext('webgl');
  } catch {
    return false;
  }
}

// ---------------------------------------------------------------- 3D setup
let renderer, camera, scene, controller, labels, overlay;
let model = null;
let catIndex = 0;
let modelIndex = 0;
const dying = []; // models dissolving away after a switch
let labelsOn = true;
let viewStyle = load('handlab.style2', 'realistic'); // realistic by default
let hacker = load('handlab.hacker', '0') === '1';
let matrix = null;
const HACKER_GREEN = 0x00ff66;

function load(key, fallback) {
  try {
    return localStorage.getItem(key) ?? fallback;
  } catch {
    return fallback;
  }
}
function save(key, value) {
  try {
    localStorage.setItem(key, value);
  } catch {
    /* storage unavailable: setting just won't persist */
  }
}

function setup3D() {
  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setClearColor(0x000000, 0); // transparent: the webcam shows through
  // Photographic look for the realistic style: filmic tone mapping + studio reflections.
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  document.getElementById('stage').appendChild(renderer.domElement);

  scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  // Lights only matter for the "realistic" style; the other styles use unlit materials.
  scene.add(new THREE.HemisphereLight(0xdfe9ff, 0x20242e, 0.6));
  const sun = new THREE.DirectionalLight(0xffffff, 1.6);
  sun.position.set(4, 6, 8);
  scene.add(sun);
  camera = new THREE.PerspectiveCamera(40, window.innerWidth / window.innerHeight, 0.05, 200);
  camera.position.set(0, 0, 7.2);

  overlay = new HandOverlay(document.getElementById('hand-canvas'), video);
  labels = new LabelLayer(document.getElementById('labels'));
  controller = new Controller({ camera, overlay, ui, onNext: (d) => stepModel(d) });

  const fitView = () => {
    const W = window.innerWidth;
    const H = window.innerHeight;
    camera.aspect = W / H;
    // Centre the model in the free space right of the side panel (not behind it).
    camera.setViewOffset(W, H, -ui.panelRight / 2, 0, W, H);
    camera.updateProjectionMatrix();
    renderer.setSize(W, H);
  };
  fitView();
  window.addEventListener('resize', fitView);

  // Mouse fallback: drag = rotate, wheel = zoom, click = select, hover = highlight.
  const el = renderer.domElement;
  const pt = (e) => ({ x: e.clientX, y: e.clientY });
  el.addEventListener('pointerdown', (e) => {
    el.setPointerCapture(e.pointerId);
    controller.mouseDown(pt(e), { move: e.button === 2 || e.shiftKey });
  });
  el.addEventListener('contextmenu', (e) => e.preventDefault()); // right-drag = move
  el.addEventListener('pointermove', (e) => controller.mouseMove(pt(e)));
  el.addEventListener('pointerup', (e) => controller.mouseUp(pt(e)));
  el.addEventListener('pointerleave', () => controller.mouseLeave());
  el.addEventListener('wheel', (e) => {
    e.preventDefault();
    controller.wheel(e.deltaY);
  }, { passive: false });
}

let loadToken = 0;

async function showModel(ci, mi) {
  const def = CATALOG[ci].models[mi];
  const token = ++loadToken;
  ui.setModel(ci, mi);
  if (def.gltf) ui.setLoading(t('loading.model3d'));
  let next;
  try {
    next = await HoloModel.create(def, { pixelRatio: renderer.getPixelRatio(), style: viewStyle, tint: hacker ? HACKER_GREEN : null });
  } catch (err) {
    console.error(err);
    if (token === loadToken) {
      ui.setLoading(null);
      ui.toast(t('err.model3d'), 3500);
      ui.setModel(catIndex, modelIndex);
    }
    return;
  }
  if (token !== loadToken) return next.dispose(); // another model was picked meanwhile
  ui.setLoading(null);
  catIndex = ci;
  modelIndex = mi;
  if (model) {
    model.setFormed(false); // old model dissolves into particles while the new one forms
    model.select(null);
    model.hover(null);
    dying.push(model);
  }
  model = next;
  scene.add(model.root);
  controller.setModel(model);
  labels.setModel(model);
}

function stepModel(d) {
  const i = ALL_MODELS.findIndex((m) => m.model === CATALOG[catIndex].models[modelIndex]);
  const next = ALL_MODELS[(i + d + ALL_MODELS.length) % ALL_MODELS.length];
  const ci = CATALOG.findIndex((c) => c.key === next.category);
  showModel(ci, CATALOG[ci].models.indexOf(next.model));
  ui.toast(`✌️ ${modelText(next.model).name}`);
}

// ---------------------------------------------------------------- view style + theme
function setViewStyle(style) {
  if (!STYLES.includes(style)) return;
  viewStyle = style;
  save('handlab.style2', style);
  model?.setStyle(style);
  ui.setStyle(style);
  ui.toast(`◆ ${t(`style.${style}`)}`);
}

function setHacker(on) {
  hacker = on;
  save('handlab.hacker', on ? '1' : '0');
  document.body.classList.toggle('theme-hacker', on);
  matrix?.setEnabled(on);
  model?.setTint(on ? HACKER_GREEN : null);
  ui.setToolbarState('theme', on);
}

// ---------------------------------------------------------------- sensitivity
function applySensitivity(name) {
  const preset = CONFIG.sensitivity[name] || CONFIG.sensitivity.standard;
  Object.assign(CONFIG.fingers, preset.fingers);
  Object.assign(CONFIG.gestures, preset.gestures);
  for (const slot of handSlots.values()) slot.stable.frames = CONFIG.gestures.STABLE_FRAMES;
  try {
    localStorage.setItem('handlab.sensitivity2', name);
  } catch {
    /* storage unavailable: setting just won't persist */
  }
}

// ---------------------------------------------------------------- tracking
const tracker = new HandTracker();
const stateMachine = new InteractionStateMachine();
const handSlots = new Map(); // id -> { filter, stable, pinching, snap }
let cameraOn = false;
let trackingOn = false;
let lastDetect = 0;
let detectInterval = CONFIG.tracking.DETECT_MIN_INTERVAL_MS;
let lastHandSeen = -Infinity;
let lastOut = null;
let lastHands = [];
const detectFps = new EMA(0.1);
const detectCost = new EMA(0.1);
const renderFps = new EMA(0.05);

async function startTracking() {
  try {
    ui.setLoading(t('loading.camera'));
    await startCamera(video, { width: CONFIG.camera.WIDTH, height: CONFIG.camera.HEIGHT, frameRate: CONFIG.camera.FRAME_RATE });
    cameraOn = true;
    document.body.classList.remove('no-camera');
  } catch (err) {
    ui.setLoading(null);
    ui.showError(t('err.camTitle'), err.code && err.code !== 'unknown' ? t(`cam.${err.code}`) : err.message);
    return;
  }
  try {
    ui.setLoading(t('loading.model'));
    await tracker.init();
    trackingOn = true;
    ui.setLoading(null);
    ui.toast(t('toast.showHand'), 2200);
  } catch (err) {
    console.error(err);
    ui.setLoading(null);
    ui.showError(t('err.modelTitle'), t('err.modelDetail', { msg: err.message || err }));
  }
}

function processDetections(detections, now) {
  const aspect = video.videoWidth / video.videoHeight || 16 / 9;
  const tSec = now / 1000;
  const seen = new Set();
  const hands = [];

  for (const det of detections) {
    let id = det.handedness;
    if (seen.has(id)) id = `${id}#2`;
    seen.add(id);

    let slot = handSlots.get(id);
    if (!slot) {
      slot = {
        filter: new LandmarkFilter(21, { minCutoff: CONFIG.filter.MIN_CUTOFF, beta: CONFIG.filter.BETA, dCutoff: CONFIG.filter.D_CUTOFF }),
        stable: new StableValue(CONFIG.gestures.STABLE_FRAMES, GESTURES.NONE),
        pinching: false,
        snap: new SnapDetector(),
      };
      handSlots.set(id, slot);
    }

    const landmarks = slot.filter.filter(mirrorLandmarks(det.landmarks), tSec);
    const a = analyzeHand(landmarks, { aspect, wasPinching: slot.pinching, handScore: det.score });
    slot.pinching = a.pinching;
    const gesture = slot.stable.update(a.gesture);
    hands.push({
      id,
      handedness: det.handedness,
      gesture,
      rawGesture: a.gesture,
      confidence: gesture === a.gesture ? a.confidence : a.confidence * 0.5,
      openness: a.openness,
      rollDeg: a.rollDeg,
      snapped: slot.snap.update(a, now),
      keypoints: a.keypoints,
      landmarks,
    });
  }
  for (const id of handSlots.keys()) if (!seen.has(id)) handSlots.delete(id);

  if (hands.length) lastHandSeen = now;
  const out = stateMachine.update(hands, now);
  controller.handleHands(out, now);
  lastOut = out;
  lastHands = hands;

  ui.setHand(out.mode, out.openness);
  ui.setActiveGesture(out.activeGesture);
}

// ---------------------------------------------------------------- toolbar + keyboard
function act(action) {
  switch (action) {
    case 'lang':
      setLang(getLang() === 'uz' ? 'en' : 'uz');
      break;
    case 'theme':
      setHacker(!hacker);
      ui.toast(t(hacker ? 'toast.hackerOn' : 'toast.hackerOff'));
      break;
    case 'camera': {
      const hidden = document.body.classList.toggle('hide-video');
      ui.setToolbarState('camera', !hidden);
      break;
    }
    case 'labels':
      labelsOn = !labelsOn;
      ui.setToolbarState('labels', labelsOn);
      break;
    case 'snap':
      controller.toggleForm();
      break;
    case 'reset':
      controller.reset();
      ui.toast(t('toast.reset'));
      break;
    case 'fullscreen':
      if (document.fullscreenElement) document.exitFullscreen();
      else document.documentElement.requestFullscreen?.();
      break;
    case 'rotate':
      controller.autoRotate = !controller.autoRotate;
      ui.setToolbarState('rotate', controller.autoRotate);
      break;
  }
}

function setupKeyboard() {
  window.addEventListener('keydown', (e) => {
    if (e.target instanceof HTMLInputElement || e.target instanceof HTMLSelectElement) return;
    const k = e.key.toLowerCase();
    if (e.key === 'ArrowRight') stepModel(+1);
    else if (e.key === 'ArrowLeft') stepModel(-1);
    else if (k === 's') act('snap');
    else if (k === 'r') act('reset');
    else if (k === 'l') act('labels');
    else if (k === 'a') act('rotate');
    else if (k === 'v') act('camera');
    else if (k === 'e') controller.setExplode(controller.target.explode > 0.5 ? 0 : 1);
    else if (k === 'h') act('theme');
    else if (['1', '2', '3', '4'].includes(e.key)) setViewStyle(STYLES[Number(e.key) - 1]);
    else if (e.key === 'Escape') controller.select(null);
  });
}

// ---------------------------------------------------------------- main loop
let lastFrame = performance.now();
let lastStats = 0;

function frame(now) {
  requestAnimationFrame(frame);
  const dt = Math.min(0.05, (now - lastFrame) / 1000);
  lastFrame = now;
  renderFps.update(1 / Math.max(dt, 1e-3));

  if (trackingOn && now - lastDetect >= detectInterval) {
    const t0 = performance.now();
    const detections = tracker.detect(video, now);
    if (detections) {
      const cost = performance.now() - t0;
      detectCost.update(cost);
      detectInterval = Math.max(CONFIG.tracking.DETECT_MIN_INTERVAL_MS, cost * CONFIG.tracking.DETECT_BUDGET_FACTOR);
      if (lastDetect) detectFps.update(1000 / (now - lastDetect));
      lastDetect = now;
      processDetections(detections, now);
    }
  }

  const handsActive = trackingOn && now - lastHandSeen < CONFIG.interaction.NO_HAND_FALLBACK_MS;
  if (!handsActive && lastHands.length) lastHands = [];
  controller.update(dt, handsActive);

  for (let i = dying.length - 1; i >= 0; i--) {
    const m = dying[i];
    m.update(dt);
    if (m.form <= 0.001) {
      m.dispose();
      dying.splice(i, 1);
    }
  }

  matrix.update(now);
  ui.setExplode(controller.current.explode);
  if (!model) {
    renderer.render(scene, camera);
    return;
  }
  ui.setSceneState(model.formState);
  labels.update(model, camera, {
    visible: labelsOn && model.form > 0.85 && controller.current.explode > 0.15,
    minLeft: ui.panelRight,
  });
  overlay.draw(lastHands, {
    activeId: lastOut?.mode !== MODES.NONE ? stateMachine.activeHandId : null,
    pointer: controller.pointer,
    dwell: controller.dwell,
  });

  if (now - lastStats > 250) {
    lastStats = now;
    ui.setStats({
      fps: renderFps.value,
      particles: model.particleCount,
      camFps: cameraOn ? detectFps.value ?? 0 : null,
      handsMs: detectCost.value ?? 0,
      delegate: tracker.delegate,
      zoom: controller.current.zoom,
    });
  }

  renderer.render(scene, camera);
}

// ---------------------------------------------------------------- boot
function boot() {
  if (!webglAvailable()) {
    ui.applyStatic();
    ui.showError(t('err.webglTitle'), t('err.webglDetail'));
    return;
  }
  setup3D();
  ui.setCatalog(CATALOG, (ci, mi) => showModel(ci, mi));
  ui.applyStatic();
  // Switching language re-renders every text: panel, tabs, chips, part labels, info card.
  onLangChange(() => {
    ui.applyStatic();
    ui.setModel(catIndex, modelIndex, { keepPart: true });
    if (model?.selected) ui.showPart(model.selected);
    if (model) labels.setModel(model);
    ui.toast(t('toast.lang'));
  });
  ui.onExplode((v) => controller.setExplode(v));
  ui.onSensitivity(applySensitivity);
  ui.onToolbar(act);
  ui.onStyle(setViewStyle);
  ui.setStyle(viewStyle);
  matrix = new MatrixRain(document.getElementById('matrix'));
  setHacker(hacker);
  ui.onPartClose = () => controller.select(null);
  setupKeyboard();

  // New storage key so everyone starts on the new, very sensitive default.
  const saved = load('handlab.sensitivity2', 'ultra');
  applySensitivity(saved);
  ui.setSensitivity(saved);

  showModel(CATALOG.findIndex((c) => c.key === 'REAL3D'), 0);
  // Debug handle for the browser console (see README > Troubleshooting).
  window.handlab = { controller, stateMachine, tracker, renderer, CONFIG, showModel, get model() { return model; } };
  requestAnimationFrame(frame);
  startTracking();
}

boot();
