// Rule-based gesture recognition on MediaPipe's 21 hand landmarks.
//
// Pipeline per hand:  raw landmarks -> mirror X -> (One Euro filter, in main.js) -> analyzeHand()
//   -> finger states (extended / curled) -> ordered rules -> { gesture, confidence, keypoints }
//
// All distances are measured in an aspect-corrected space (x * videoAspect) and divided by
// the palm length (WRIST -> MIDDLE_MCP), so every threshold is a dimensionless ratio that
// works at any distance from the camera.

import { CONFIG } from './config.js';
import { clamp01, Cooldown } from './filters.js';

export const GESTURES = Object.freeze({
  NONE: 'NONE',
  OPEN_PALM: 'OPEN_PALM',
  PINCH: 'PINCH',
  FIST: 'FIST',
  POINT: 'POINT',
  PEACE: 'PEACE',
  THUMBS_UP: 'THUMBS_UP',
});

// MediaPipe landmark indices.
export const LM = Object.freeze({
  WRIST: 0,
  THUMB_CMC: 1, THUMB_MCP: 2, THUMB_IP: 3, THUMB_TIP: 4,
  INDEX_MCP: 5, INDEX_PIP: 6, INDEX_DIP: 7, INDEX_TIP: 8,
  MIDDLE_MCP: 9, MIDDLE_PIP: 10, MIDDLE_DIP: 11, MIDDLE_TIP: 12,
  RING_MCP: 13, RING_PIP: 14, RING_DIP: 15, RING_TIP: 16,
  PINKY_MCP: 17, PINKY_PIP: 18, PINKY_DIP: 19, PINKY_TIP: 20,
});

export const HAND_CONNECTIONS = [
  [0, 1], [1, 2], [2, 3], [3, 4],
  [0, 5], [5, 6], [6, 7], [7, 8],
  [5, 9], [9, 10], [10, 11], [11, 12],
  [9, 13], [13, 14], [14, 15], [15, 16],
  [13, 17], [0, 17], [17, 18], [18, 19], [19, 20],
];

const FINGERS = {
  index: [LM.INDEX_MCP, LM.INDEX_PIP, LM.INDEX_DIP, LM.INDEX_TIP],
  middle: [LM.MIDDLE_MCP, LM.MIDDLE_PIP, LM.MIDDLE_DIP, LM.MIDDLE_TIP],
  ring: [LM.RING_MCP, LM.RING_PIP, LM.RING_DIP, LM.RING_TIP],
  pinky: [LM.PINKY_MCP, LM.PINKY_PIP, LM.PINKY_DIP, LM.PINKY_TIP],
};

// ---------------------------------------------------------------- vector helpers
const sub = (a, b) => ({ x: a.x - b.x, y: a.y - b.y, z: a.z - b.z });
const len = (v) => Math.hypot(v.x, v.y, v.z);
const dist = (a, b) => len(sub(a, b));
/** Angle ABC in degrees (at vertex B). 180 = A, B, C collinear (a straight joint). */
function angleDeg(a, b, c) {
  const u = sub(a, b);
  const v = sub(c, b);
  const cos = (u.x * v.x + u.y * v.y + u.z * v.z) / (len(u) * len(v) || 1);
  return (Math.acos(Math.max(-1, Math.min(1, cos))) * 180) / Math.PI;
}

/**
 * Mirrors X so the image behaves like a mirror: moving your hand to your right moves it
 * to the right of the screen. MediaPipe z is relative depth (smaller = closer to camera).
 */
export function mirrorLandmarks(raw) {
  return raw.map((p) => ({ x: 1 - p.x, y: p.y, z: p.z }));
}

/**
 * Finger state from two scale-free cues:
 *  1. tipRatio = |wrist->tip| / |wrist->PIP|. When a finger curls, the tip swings back toward
 *     the wrist, so the ratio drops below 1. Straight fingers sit around 1.3-1.4. A ratio is
 *     used (not a pixel distance) so it does not depend on hand size or camera distance.
 *  2. PIP angle (MCP-PIP-TIP). Guards against a finger that is bent at the PIP but pointing
 *     away from the wrist (which can keep tipRatio > 1).
 */
function fingerState(P, [mcp, pip, , tip]) {
  const F = CONFIG.fingers;
  const tipRatio = dist(P[LM.WRIST], P[tip]) / (dist(P[LM.WRIST], P[pip]) || 1e-6);
  const pipAngle = angleDeg(P[mcp], P[pip], P[tip]);
  const extended = tipRatio > F.EXTENDED_RATIO && pipAngle > F.PIP_STRAIGHT_DEG;
  const curled = tipRatio < F.CURLED_RATIO;
  // 0 = fully curled, 1 = fully extended; used for confidence margins.
  const score = clamp01((tipRatio - 0.75) / (1.3 - 0.75));
  return { extended, curled, tipRatio, pipAngle, score };
}

/**
 * The thumb moves sideways, not toward the wrist, so it needs different cues:
 *  - IP joint straightness (MCP-IP-TIP angle)
 *  - how far the tip sits from the index MCP (tucked thumbs rest against the index).
 */
function thumbState(P, scale) {
  const F = CONFIG.fingers;
  const ipAngle = angleDeg(P[LM.THUMB_MCP], P[LM.THUMB_IP], P[LM.THUMB_TIP]);
  const outRatio = dist(P[LM.THUMB_TIP], P[LM.INDEX_MCP]) / scale;
  const extended = ipAngle > F.THUMB_IP_STRAIGHT_DEG && outRatio > F.THUMB_OUT_RATIO;
  // Direction of the thumb in the image plane; y grows downward, so "up" is -y.
  const d = sub(P[LM.THUMB_TIP], P[LM.THUMB_MCP]);
  const planar = Math.hypot(d.x, d.y) || 1e-6;
  const upTiltDeg = (Math.acos(Math.max(-1, Math.min(1, -d.y / planar))) * 180) / Math.PI;
  return { extended, ipAngle, outRatio, upTiltDeg, score: clamp01((outRatio - 0.35) / 0.5) };
}

/**
 * Classifies one hand.
 * @param lms        mirrored + filtered landmarks (screen units)
 * @param aspect     video width / height (to make x and y the same physical unit)
 * @param wasPinching previous pinch state of this hand (pinch hysteresis)
 * @param handScore  MediaPipe handedness score, folded into confidence
 */
export function analyzeHand(lms, { aspect, wasPinching = false, handScore = 1 }) {
  const G = CONFIG.gestures;
  const P = lms.map((p) => ({ x: p.x * aspect, y: p.y, z: p.z * aspect }));
  // Palm length is the most rigid segment of the hand (no joints), so it is a stable scale.
  const scale = dist(P[LM.WRIST], P[LM.MIDDLE_MCP]) || 1e-6;

  const f = {};
  for (const [name, idx] of Object.entries(FINGERS)) f[name] = fingerState(P, idx);
  const thumb = thumbState(P, scale);
  const pinchRatio = dist(P[LM.THUMB_TIP], P[LM.INDEX_TIP]) / scale;
  const thumbMiddleRatio = dist(P[LM.THUMB_TIP], P[LM.MIDDLE_TIP]) / scale;

  // Openness: mean extension score of all five digits (0 = fist, 1 = flat open hand).
  const openness = clamp01((f.index.score + f.middle.score + f.ring.score + f.pinky.score + thumb.score) / 5);

  // Twist (roll): angle of the palm axis WRIST->MIDDLE_MCP from vertical, in the image plane.
  // 0 = upright hand, + = fingers leaning to the right of the screen. Handedness-independent.
  const axis = sub(P[LM.MIDDLE_MCP], P[LM.WRIST]);
  const rollDeg = (Math.atan2(axis.x, -axis.y) * 180) / Math.PI;

  const four = [f.index, f.middle, f.ring, f.pinky];
  const allCurled = four.every((s) => s.curled);
  const allExtended = four.every((s) => s.extended);
  const pinching = pinchRatio < (wasPinching ? G.PINCH_OFF_RATIO : G.PINCH_ON_RATIO);

  // Rules are ordered: the first match wins. Each yields a margin in [0,1]:
  // how far the measurements sit beyond their thresholds (a crude confidence).
  let gesture = GESTURES.NONE;
  let margin = 0;

  if (allCurled && thumb.extended && thumb.upTiltDeg < G.THUMBS_UP_MAX_TILT_DEG) {
    // THUMBS UP: four fingers curled, thumb straight and pointing up.
    gesture = GESTURES.THUMBS_UP;
    margin = Math.min(1 - Math.max(...four.map((s) => s.score)), 1 - thumb.upTiltDeg / G.THUMBS_UP_MAX_TILT_DEG);
  } else if (allCurled && f.index.tipRatio < G.FIST_INDEX_MAX_RATIO && !thumb.extended) {
    // FIST: four fingers curled with the index buried in the palm, thumb tucked.
    // Checked before PINCH because a fist's thumb can rest near the index tip.
    gesture = GESTURES.FIST;
    margin = 1 - Math.max(...four.map((s) => s.score));
  } else if (pinching) {
    // PINCH: thumb tip touches index tip. Other fingers are ignored.
    gesture = GESTURES.PINCH;
    margin = 1 - pinchRatio / G.PINCH_OFF_RATIO;
  } else if (allExtended && (thumb.extended || !G.OPEN_PALM_REQUIRE_THUMB)) {
    // OPEN PALM: all five digits extended.
    gesture = GESTURES.OPEN_PALM;
    margin = Math.min(...four.map((s) => s.score));
  } else if (f.index.extended && f.middle.extended && !f.ring.extended && !f.pinky.extended) {
    // PEACE: index + middle extended, ring + pinky folded.
    gesture = GESTURES.PEACE;
    margin = Math.min(f.index.score, f.middle.score, 1 - f.ring.score, 1 - f.pinky.score);
  } else if (f.index.extended && !f.middle.extended && !f.ring.extended && !f.pinky.extended) {
    // POINT: only the index extended (thumb may do anything).
    gesture = GESTURES.POINT;
    margin = Math.min(f.index.score, 1 - f.middle.score, 1 - f.ring.score, 1 - f.pinky.score);
  }

  // Confidence = 0.5 for a bare rule match, rising to 1 as the margins grow,
  // scaled by MediaPipe's own handedness/presence score.
  const confidence = gesture === GESTURES.NONE ? 0 : (0.5 + 0.5 * clamp01(margin)) * handScore;

  // Keypoints in screen units (for pointer / pinch / palm) and in metric space (for
  // scale-free distances between hands).
  const palmIdx = [LM.WRIST, LM.INDEX_MCP, LM.MIDDLE_MCP, LM.RING_MCP, LM.PINKY_MCP];
  const avg = (pts, idx) => {
    const s = idx.reduce((a, i) => ({ x: a.x + pts[i].x, y: a.y + pts[i].y, z: a.z + pts[i].z }), { x: 0, y: 0, z: 0 });
    return { x: s.x / idx.length, y: s.y / idx.length, z: s.z / idx.length };
  };
  const pinchIdx = [LM.THUMB_TIP, LM.INDEX_TIP];
  const keypoints = {
    pinch: avg(lms, pinchIdx),
    index: { ...lms[LM.INDEX_TIP] },
    palm: avg(lms, palmIdx),
    pinchM: avg(P, pinchIdx),
    palmM: avg(P, palmIdx),
    scale,
  };

  return {
    gesture,
    confidence,
    pinching: gesture === GESTURES.PINCH,
    openness,
    rollDeg,
    thumbMiddleRatio,
    pinchRatio,
    debug: { thumb, fingers: f, pinchRatio },
    keypoints,
  };
}

/**
 * Finger snap detector (one per hand, stateful).
 * A snap is: thumb tip and middle tip touch (index finger free, so it is not a pinch) for a
 * short moment, then fly apart. MediaPipe often loses the blurred frame of the actual snap,
 * so we only need "touching" followed soon after by "far apart".
 */
export class SnapDetector {
  constructor() {
    this.contactFrames = 0;
    this.contactStart = 0;
    this.lastContact = -Infinity;
    this.cooldown = new Cooldown(CONFIG.snap.COOLDOWN_MS);
  }

  update(a, now) {
    const S = CONFIG.snap;
    const indexFree = a.pinchRatio > CONFIG.gestures.PINCH_OFF_RATIO;
    if (a.thumbMiddleRatio < S.CONTACT_RATIO && indexFree) {
      if (this.contactFrames === 0) this.contactStart = now;
      this.contactFrames++;
      this.lastContact = now;
      return false;
    }
    const armed = this.contactFrames >= S.MIN_CONTACT_FRAMES && this.lastContact - this.contactStart <= S.MAX_CONTACT_MS;
    if (a.thumbMiddleRatio > S.RELEASE_RATIO) {
      const fired = armed && now - this.lastContact <= S.RELEASE_WINDOW_MS && this.cooldown.ready(now);
      this.contactFrames = 0;
      if (fired) this.cooldown.trigger(now);
      return fired;
    }
    if (now - this.lastContact > S.RELEASE_WINDOW_MS) this.contactFrames = 0;
    return false;
  }
}
