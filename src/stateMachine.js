// Interaction state machine: stable per-hand gestures -> one interaction mode + values.
//
// Gesture vocabulary
//   Snap (thumb+middle)       -> 'snap' event: summon particles / dissolve the model
//   Fist                      -> FIST: put the model back together
//   Open hand                 -> MOVING: openness opens the exploded view,
//                                twist spins the model, raising/lowering tilts it
//   Point (index only)        -> POINTING: hover a part, hold still to learn about it
//   Pinch while pointing      -> PINCHING: pull the pointed part out of the model
//   Two hands                 -> ZOOMING: hand distance relative to the start
//   Peace sign                -> 'next' event: jump to the next model
//
// The hand that is already driving keeps priority while it is visible.

import { CONFIG } from './config.js';
import { GESTURES as G } from './gestures.js';
import { Cooldown, clamp, clamp01 } from './filters.js';

export const MODES = Object.freeze({
  NONE: 'NONE',
  MOVING: 'MOVING',
  FIST: 'FIST',
  POINTING: 'POINTING',
  PINCHING: 'PINCHING',
  ZOOMING: 'ZOOMING',
  PEACE: 'PEACE',
});

const C = CONFIG.interaction;
const dist3 = (a, b) => Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);
// Gestures that are a deliberate command and must not be read as "two hands -> zoom".
const COMMANDS = new Set([G.POINT, G.PINCH, G.PEACE, G.FIST]);

export class InteractionStateMachine {
  constructor() {
    this.peaceCooldown = new Cooldown(C.PEACE_COOLDOWN_MS);
    this.reset();
  }

  reset() {
    this.mode = MODES.NONE;
    this.activeHandId = null;
    this.lastHandTime = -Infinity;
    this.lastDefinite = -Infinity;
    this.zoomStart = null;
    this.lastPointer = null;
    this.lastPinch = null;
    this.lastPalm = null;
  }

  _enter(mode, out) {
    if (mode === this.mode) return;
    this.lastPalm = null;
    if (this.mode === MODES.PINCHING) out.events.push({ type: 'pinchEnd' });
    if (mode === MODES.PINCHING) out.events.push({ type: 'pinchStart' });
    out.events.push({ type: 'mode', from: this.mode, to: mode });
    this.mode = mode;
    if (mode !== MODES.ZOOMING) this.zoomStart = null;
  }

  /**
   * @param hands [{ id, gesture (stable), confidence, openness, rollDeg, snapped, keypoints }]
   * @param now   ms timestamp
   */
  update(hands, now) {
    const out = {
      mode: this.mode,
      events: [],
      hand: null,
      openness: null,
      explodeTarget: null, // 0..1, only while MOVING
      yawVelocity: 0, // rad/s from twisting the hand
      yawDelta: 0, // rad from moving the open hand sideways
      pitchTarget: null, // rad from hand height
      zoom: null, // { start, ratio }
      pointer: null, // index tip, screen units (mirrored video coords)
      pinch: null, // pinch point, screen units
      activeGesture: null, // which row of the gesture list to light up
    };
    const finish = () => {
      out.mode = this.mode;
      return out;
    };

    for (const h of hands) {
      if (h.snapped) out.events.push({ type: 'snap' });
    }
    const snapped = out.events.length > 0;

    if (hands.length === 0) {
      if (now - this.lastHandTime > C.STATE_GRACE_MS) {
        this._enter(MODES.NONE, out);
        this.activeHandId = null;
      }
      return finish();
    }
    this.lastHandTime = now;

    // --- two hands, neither giving a command -> zoom (scale-free distance ratio)
    if (hands.length >= 2 && !COMMANDS.has(hands[0].gesture) && !COMMANDS.has(hands[1].gesture)) {
      const [a, b] = hands;
      const d = dist3(a.keypoints.palmM, b.keypoints.palmM) / ((a.keypoints.scale + b.keypoints.scale) / 2);
      if (this.mode !== MODES.ZOOMING || !this.zoomStart) {
        this._enter(MODES.ZOOMING, out);
        this.zoomStart = Math.max(d, 1e-6);
        out.zoom = { start: true, ratio: 1 };
      } else {
        out.zoom = { start: false, ratio: d / this.zoomStart };
      }
      out.activeGesture = snapped ? 'snap' : 'zoom';
      this.lastDefinite = now;
      return finish();
    }

    const hand = this._pickHand(hands);
    this.activeHandId = hand.id;
    out.hand = hand;
    out.openness = hand.openness;

    switch (hand.gesture) {
      case G.FIST:
        this._enter(MODES.FIST, out);
        out.activeGesture = 'fist';
        this.lastDefinite = now;
        break;

      case G.POINT:
        this._enter(MODES.POINTING, out);
        out.pointer = this.lastPointer = { ...hand.keypoints.index };
        out.activeGesture = 'point';
        this.lastDefinite = now;
        break;

      case G.PINCH:
        this._enter(MODES.PINCHING, out);
        out.pinch = this.lastPinch = { ...hand.keypoints.pinch };
        out.activeGesture = 'point';
        this.lastDefinite = now;
        break;

      case G.PEACE:
        if (this.mode !== MODES.PEACE && this.peaceCooldown.ready(now)) {
          this.peaceCooldown.trigger(now);
          out.events.push({ type: 'next' });
        }
        this._enter(MODES.PEACE, out);
        out.activeGesture = 'peace';
        this.lastDefinite = now;
        break;

      default: {
        // Between two commands the hand passes through ambiguous shapes; keep the
        // previous command alive for a moment instead of jumping to MOVING.
        const holding =
          hand.gesture === G.NONE &&
          this.mode !== MODES.MOVING &&
          this.mode !== MODES.NONE &&
          now - this.lastDefinite < C.STATE_GRACE_MS;
        if (holding) {
          if (this.mode === MODES.POINTING) out.pointer = this.lastPointer;
          if (this.mode === MODES.PINCHING) out.pinch = this.lastPinch;
          break;
        }
        const enteringMove = this.mode !== MODES.MOVING;
        this._enter(MODES.MOVING, out);
        const palm = hand.keypoints.palm;
        if (!enteringMove && this.lastPalm) {
          const dx = clamp(palm.x - this.lastPalm.x, -C.MOVE_MAX_STEP, C.MOVE_MAX_STEP);
          out.yawDelta = dx * C.MOVE_YAW_GAIN;
        }
        this.lastPalm = { x: palm.x, y: palm.y };
        out.explodeTarget = clamp01((hand.openness - C.OPEN_MIN) / (C.OPEN_MAX - C.OPEN_MIN));

        // Twist: dead zone, then speed grows linearly up to TWIST_MAX_DEG.
        const roll = hand.rollDeg;
        const over = Math.max(0, Math.abs(roll) - C.TWIST_DEADZONE_DEG);
        const k = clamp(over / (C.TWIST_MAX_DEG - C.TWIST_DEADZONE_DEG), 0, 1);
        out.yawVelocity = Math.sign(roll) * k * C.TWIST_MAX_SPEED;

        // Raise / lower: palm height -> pitch (hand up = model tilts toward you).
        const y = hand.keypoints.palm.y;
        const t = clamp((y - C.TILT_Y_TOP) / (C.TILT_Y_BOTTOM - C.TILT_Y_TOP), 0, 1);
        out.pitchTarget = (0.5 - t) * 2 * C.TILT_MAX;

        out.activeGesture = k > 0 || Math.abs(out.yawDelta) > 0.01 ? 'twist' : 'open';
        if (hand.gesture !== G.NONE) this.lastDefinite = now;
      }
    }
    if (snapped) out.activeGesture = 'snap';
    return finish();
  }

  _pickHand(hands) {
    const active = hands.find((h) => h.id === this.activeHandId);
    if (active) return active;
    return hands.reduce((best, h) => (h.confidence > best.confidence ? h : best), hands[0]);
  }
}
