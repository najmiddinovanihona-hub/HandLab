// HandLab configuration: every tunable number lives here.
//
// Units used below:
//   "scale"   = palm length = distance(WRIST, MIDDLE_MCP) in an aspect-corrected image space.
//               Ratios against it make every rule independent of the distance to the camera.
//   "screen"  = normalized, mirrored camera coordinates in [0, 1] (0 = user's left / top).
//   ms / s    = milliseconds / seconds.

export const CONFIG = {
  // ---------------------------------------------------------------- assets (pinned)
  assets: {
    MEDIAPIPE_WASM_URL: 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm',
    HAND_MODEL_URL:
      'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task',
  },

  // ---------------------------------------------------------------- webcam
  camera: {
    WIDTH: 1280, // the video is the full-screen background, so ask for HD
    HEIGHT: 720,
    FRAME_RATE: 30,
  },

  // ---------------------------------------------------------------- MediaPipe
  tracking: {
    NUM_HANDS: 2,
    MIN_DETECTION_CONFIDENCE: 0.6, // raise if random objects get detected as hands
    MIN_PRESENCE_CONFIDENCE: 0.5,
    MIN_TRACKING_CONFIDENCE: 0.5, // lower = keeps tracking through motion blur, more jitter
    DETECT_MIN_INTERVAL_MS: 30, // never detect more often than ~33 Hz
    // If one detection took `cost` ms we wait cost * factor before the next one, so a slow
    // laptop drops detection rate instead of render rate.
    DETECT_BUDGET_FACTOR: 1.2,
    // MediaPipe's handedness assumes a mirrored (selfie) image; we feed the raw video.
    SWAP_HANDEDNESS: true,
  },

  // ---------------------------------------------------------------- One Euro filter
  // Jittery while holding still -> lower MIN_CUTOFF.  Laggy while moving fast -> raise BETA.
  filter: {
    MIN_CUTOFF: 1.6, // Hz at zero speed
    BETA: 6.0, // extra Hz per (screen unit / s) of speed (high = almost no lag)
    D_CUTOFF: 1.0,
  },

  // ---------------------------------------------------------------- finger states (Standard preset)
  fingers: {
    // ratio = |wrist->tip| / |wrist->PIP|. Straight finger ~1.35, curled ~0.6-0.9.
    EXTENDED_RATIO: 1.12,
    CURLED_RATIO: 1.0,
    PIP_STRAIGHT_DEG: 140, // angle MCP-PIP-TIP; 180 = perfectly straight
    THUMB_IP_STRAIGHT_DEG: 140,
    THUMB_OUT_RATIO: 0.55, // |thumbTip - indexMCP| / scale. Open ~0.8-1.0, tucked ~0.35
  },

  // ---------------------------------------------------------------- gesture rules (Standard preset)
  gestures: {
    PINCH_ON_RATIO: 0.25, // |thumbTip - indexTip| / scale to start a pinch...
    PINCH_OFF_RATIO: 0.4, // ...and to end it (hysteresis)
    FIST_INDEX_MAX_RATIO: 0.8, // fist: index tip buried in the palm (pinch is ~0.85)
    THUMBS_UP_MAX_TILT_DEG: 40,
    OPEN_PALM_REQUIRE_THUMB: true,
    STABLE_FRAMES: 5, // a gesture must win this many detection frames in a row
  },

  // "Gesture sensitivity" dropdown. Each preset overwrites the fingers/gestures values above.
  sensitivity: {
    // Default: the lightest touch. Fewer confirmation frames and wide thresholds.
    ultra: {
      fingers: { EXTENDED_RATIO: 1.05, CURLED_RATIO: 1.02, PIP_STRAIGHT_DEG: 118 },
      gestures: { PINCH_ON_RATIO: 0.36, PINCH_OFF_RATIO: 0.5, FIST_INDEX_MAX_RATIO: 0.9, STABLE_FRAMES: 2 },
    },
    strict: {
      fingers: { EXTENDED_RATIO: 1.18, CURLED_RATIO: 0.95, PIP_STRAIGHT_DEG: 150 },
      gestures: { PINCH_ON_RATIO: 0.2, PINCH_OFF_RATIO: 0.35, FIST_INDEX_MAX_RATIO: 0.72, STABLE_FRAMES: 7 },
    },
    standard: {
      fingers: { EXTENDED_RATIO: 1.12, CURLED_RATIO: 1.0, PIP_STRAIGHT_DEG: 140 },
      gestures: { PINCH_ON_RATIO: 0.25, PINCH_OFF_RATIO: 0.4, FIST_INDEX_MAX_RATIO: 0.8, STABLE_FRAMES: 5 },
    },
    forgiving: {
      fingers: { EXTENDED_RATIO: 1.06, CURLED_RATIO: 1.05, PIP_STRAIGHT_DEG: 125 },
      gestures: { PINCH_ON_RATIO: 0.32, PINCH_OFF_RATIO: 0.48, FIST_INDEX_MAX_RATIO: 0.88, STABLE_FRAMES: 3 },
    },
  },

  // ---------------------------------------------------------------- snap (thumb + middle finger)
  // Snap = thumb tip touches middle tip (index free), then they fly apart quickly.
  snap: {
    CONTACT_RATIO: 0.36, // |thumbTip - middleTip| / scale counted as "touching"
    RELEASE_RATIO: 0.55, // ...and as "snapped apart"
    MIN_CONTACT_FRAMES: 1,
    MAX_CONTACT_MS: 1500, // longer holds are not a snap
    RELEASE_WINDOW_MS: 400, // release must follow the last contact frame within this time
    COOLDOWN_MS: 1000,
  },

  // ---------------------------------------------------------------- interaction mapping
  interaction: {
    STATE_GRACE_MS: 200, // hold a state through short tracking dropouts

    // Open hand -> explode. Openness (0 = fist, 1 = all fingers straight) mapped to 0..1.
    // Explode only grows while the hand is open; a fist puts the model back together.
    OPEN_MIN: 0.2, // a slightly opened hand already starts to explode...
    OPEN_MAX: 0.6, // ...and a half-open hand reaches 100 %

    // Twist the open hand (tilt it like a steering wheel) -> spin around the vertical axis.
    TWIST_DEADZONE_DEG: 7, // natural hand tilt is ignored
    TWIST_MAX_DEG: 28, // full speed at this tilt
    TWIST_MAX_SPEED: 2.8, // rad/s
    // Moving the open hand sideways spins the model directly (like dragging it).
    MOVE_YAW_GAIN: 9, // radians per screen-width of palm travel (small moves = big turns)
    MOVE_MAX_STEP: 0.08, // clamp per frame so a re-found hand cannot jump
    // Raise / lower the open hand -> tilt the model. Palm y (screen) mapped to pitch.
    TILT_Y_TOP: 0.38, // a small raise / lower already tilts fully
    TILT_Y_BOTTOM: 0.62,
    TILT_MAX: 0.8, // rad

    // Two hands -> zoom = zoomAtStart * (distance / distanceAtStart) ^ SENSITIVITY
    ZOOM_SENSITIVITY: 2.2,
    ZOOM_MIN: 0.4,
    ZOOM_MAX: 3.0,

    DWELL_MS: 350, // point at a part this long to open its info card
    PULL_HOVER_MEMORY_MS: 700, // pinch grabs the part pointed at within this time
    PULL_FORWARD: 0.8, // a pulled part also comes this far toward the camera (world units)

    PEACE_COOLDOWN_MS: 1200,
    NO_HAND_FALLBACK_MS: 600, // mouse controls take over after this long without hands
    AUTO_ROTATE_SPEED: 0.25, // rad/s when no hand is driving
  },

  // ---------------------------------------------------------------- smoothing of the 3D view
  // Exponential damping rates (1/s): higher = snappier, lower = floatier.
  smoothing: {
    ROTATE: 10,
    ZOOM: 9,
    EXPLODE: 4, // still smooth, but follows the hand quickly
    PULL: 7,
  },

  // ---------------------------------------------------------------- hologram look
  hologram: {
    TARGET_RADIUS: 1.9, // every model is normalized to this bounding radius (world units)
    PARTICLES_PER_MODEL: 32000, // split between parts by surface area
    MIN_POINTS_PER_INSTANCE: 80,
    POINT_SIZE: 16, // pixels at 1 unit distance; divided by depth
    POINT_ALPHA: 0.55, // particle brightness (additive, so keep it modest)
    FORM_SECONDS: 1.6, // particles flying in to form the model
    DISSOLVE_SECONDS: 0.8,
    EXPLODE_ZOOM_OUT: 0.3, // the view shrinks by up to 30 % as parts fly apart, so they stay on screen
    EXPLODE_GAIN: 0.45, // part offset = (distance from centre * GAIN + radius * BASE) * spread
    EXPLODE_BASE: 0.12,
  },
};
