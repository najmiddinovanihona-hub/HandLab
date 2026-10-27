// Controller: interaction output -> smoothed model transform, explode, hover/select, pull.
//
// Gestures and the mouse only move *targets*; every render frame the displayed values are
// damped toward them, so 15-30 Hz hand tracking still produces smooth 60 Hz motion.

import * as THREE from 'three';
import { CONFIG } from './config.js';
import { MODES } from './stateMachine.js';
import { damp, clamp } from './filters.js';
import { t, partText } from './i18n.js';

const I = CONFIG.interaction;
const S = CONFIG.smoothing;
const DEFAULTS = Object.freeze({ yaw: -0.5, pitch: 0.18, zoom: 1, explode: 0 });

export class Controller {
  constructor({ camera, overlay, ui, onNext }) {
    this.camera = camera;
    this.overlay = overlay;
    this.ui = ui;
    this.onNext = onNext;
    this.model = null;
    this.target = { ...DEFAULTS };
    this.current = { ...DEFAULTS };
    this.yawVelocity = 0;
    this.zoomAnchor = 1;
    this.autoRotate = true;
    this.handHovering = false;
    this.pointer = null; // screen px of the hand pointer (for the overlay)
    this.dwell = 0;
    this.lastHover = { part: null, time: -Infinity };
    this.dwellState = { part: null, start: 0, fired: false };
    this.pull = null;
    this.drag = null;
    this.raycaster = new THREE.Raycaster();
    this.ndc = new THREE.Vector2();
  }

  setModel(model) {
    this.model = model;
    this.target.explode = 0;
    this.current.explode = 0;
    this.pull = null;
    this.handHovering = false;
    this.dwellState = { part: null, start: 0, fired: false };
    this.ui.hidePart();
  }

  reset() {
    this.target = { ...DEFAULTS };
    this.yawVelocity = 0;
    this._endPull();
    this.select(null);
  }

  setExplode(v) {
    this.target.explode = clamp(v, 0, 1);
  }

  select(part) {
    this.model?.select(part);
    if (part) this.ui.showPart(part);
    else this.ui.hidePart();
  }

  toggleForm() {
    if (!this.model) return;
    const formed = this.model.toggleFormed();
    this.ui.toast(t(formed ? 'toast.summoned' : 'toast.dissolved'));
  }

  // ---------------------------------------------------------------- hands
  handleHands(out, now) {
    for (const ev of out.events) {
      if (ev.type === 'snap') this.toggleForm();
      else if (ev.type === 'next') this.onNext(+1);
      else if (ev.type === 'pinchStart') this._startPull(now);
      else if (ev.type === 'pinchEnd') this._endPull();
    }

    this.yawVelocity = 0;
    this.pointer = null;
    this.dwell = 0;

    switch (out.mode) {
      case MODES.MOVING:
        // "Open slowly": explode only grows with openness; the low EXPLODE damping makes
        // it unfold gradually. A fist (below) is what puts it back together.
        if (out.explodeTarget !== null) this.target.explode = Math.max(this.target.explode, out.explodeTarget);
        this.yawVelocity = out.yawVelocity;
        if (out.pitchTarget !== null) this.target.pitch = out.pitchTarget;
        break;
      case MODES.FIST:
        this.target.explode = 0;
        break;
      case MODES.ZOOMING:
        if (out.zoom.start) this.zoomAnchor = this.target.zoom;
        this.target.zoom = clamp(this.zoomAnchor * Math.pow(out.zoom.ratio, I.ZOOM_SENSITIVITY), I.ZOOM_MIN, I.ZOOM_MAX);
        break;
      case MODES.POINTING:
        if (out.pointer) {
          this.pointer = this.overlay.toScreen(out.pointer);
          this._handHover(this.pointer, now);
        }
        break;
      case MODES.PINCHING:
        if (out.pinch && this.pull) this._dragPull(this.overlay.toScreen(out.pinch));
        break;
    }

    if (out.mode !== MODES.POINTING && out.mode !== MODES.PINCHING && this.handHovering) {
      this.model?.hover(null);
      this.handHovering = false;
      this.dwellState.part = null;
    }
  }

  _handHover(p, now) {
    const part = this._pick(p);
    this.model.hover(part);
    this.handHovering = true;
    if (part) this.lastHover = { part, time: now };

    // Dwell: the same part under the finger for DWELL_MS -> open its info card.
    const d = this.dwellState;
    if (!part) {
      d.part = null;
      return;
    }
    if (part !== d.part) {
      d.part = part;
      d.start = now;
      d.fired = false;
    }
    this.dwell = Math.min(1, (now - d.start) / I.DWELL_MS);
    if (this.dwell >= 1 && !d.fired) {
      d.fired = true;
      this.select(part);
    }
  }

  // ---------------------------------------------------------------- pull a part out
  _startPull(now) {
    const part = now - this.lastHover.time < I.PULL_HOVER_MEMORY_MS ? this.lastHover.part : null;
    if (!part || !this.model) return;
    const start = this.model.anchor(part, new THREE.Vector3());
    const normal = this.camera.getWorldDirection(new THREE.Vector3());
    this.pull = {
      part,
      start,
      plane: new THREE.Plane().setFromNormalAndCoplanarPoint(normal, start),
      grab: null, // world point under the pinch when dragging starts
      base: part.pullTarget.clone(),
      forward: normal.clone().multiplyScalar(-I.PULL_FORWARD), // toward the camera
    };
    this.model.setPulled(part);
    this.select(part);
    this.ui.toast(`🤏 ${partText(part).name}`);
  }

  _dragPull(p) {
    const pull = this.pull;
    this._ray(p);
    const hit = this.raycaster.ray.intersectPlane(pull.plane, new THREE.Vector3());
    if (!hit) return;
    if (!pull.grab) pull.grab = hit.clone();
    // Desired world position of the part = start + hand travel + a bit toward the camera.
    // Convert both ends into the model's content space (undoes rotation, zoom, normalisation).
    const content = this.model.content;
    const worldTarget = pull.start.clone().add(hit.sub(pull.grab)).add(pull.forward);
    const delta = content.worldToLocal(worldTarget).sub(content.worldToLocal(pull.start.clone()));
    pull.part.pullTarget.copy(pull.base).add(delta);
  }

  _endPull() {
    if (!this.pull) return;
    this.pull.part.pullTarget.set(0, 0, 0); // flies back into place
    this.model?.setPulled(null);
    this.pull = null;
  }

  // ---------------------------------------------------------------- picking
  _ray(p) {
    this.ndc.set((p.x / window.innerWidth) * 2 - 1, -((p.y / window.innerHeight) * 2 - 1));
    this.raycaster.setFromCamera(this.ndc, this.camera);
  }

  _pick(p) {
    if (!this.model) return null;
    this._ray(p);
    return this.model.pick(this.raycaster);
  }

  // ---------------------------------------------------------------- mouse fallback
  mouseDown(p) {
    this.drag = { start: p, last: p, moved: false };
  }
  mouseMove(p) {
    if (this.drag) {
      if (Math.hypot(p.x - this.drag.start.x, p.y - this.drag.start.y) > 4) this.drag.moved = true;
      this.target.yaw += (p.x - this.drag.last.x) * 0.008;
      this.target.pitch = clamp(this.target.pitch + (p.y - this.drag.last.y) * 0.008, -1.4, 1.4);
      this.drag.last = p;
      return;
    }
    if (!this.handHovering) this.model?.hover(this._pick(p));
  }
  mouseUp(p) {
    if (this.drag && !this.drag.moved) this.select(this._pick(p));
    this.drag = null;
  }
  mouseLeave() {
    this.drag = null;
    if (!this.handHovering) this.model?.hover(null);
  }
  wheel(deltaY) {
    this.target.zoom = clamp(this.target.zoom * Math.exp(-deltaY * 0.001), I.ZOOM_MIN, I.ZOOM_MAX);
  }

  // ---------------------------------------------------------------- per render frame
  update(dt, handsActive) {
    const m = this.model;
    if (!m) return;
    const t = this.target;
    const c = this.current;
    if (handsActive) t.yaw += this.yawVelocity * dt;
    else if (this.autoRotate && !this.drag) t.yaw += I.AUTO_ROTATE_SPEED * dt;

    c.yaw = damp(c.yaw, t.yaw, S.ROTATE, dt);
    c.pitch = damp(c.pitch, t.pitch, S.ROTATE, dt);
    c.zoom = damp(c.zoom, t.zoom, S.ZOOM, dt);
    c.explode = damp(c.explode, t.explode, S.EXPLODE, dt);

    // Euler XYZ = yaw about Y first, then pitch about the world X axis (orbit-like).
    m.root.rotation.set(c.pitch, c.yaw, 0);
    const e = c.explode * c.explode * (3 - 2 * c.explode);
    m.root.scale.setScalar(c.zoom * (1 - CONFIG.hologram.EXPLODE_ZOOM_OUT * e));
    m.setExplode(c.explode);
    m.update(dt);
  }
}
