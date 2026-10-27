// MediaPipe Tasks Vision HandLandmarker wrapper.
import { FilesetResolver, HandLandmarker } from '@mediapipe/tasks-vision';
import { CONFIG } from './config.js';

export class HandTracker {
  constructor() {
    this.landmarker = null;
    this.delegate = null;
    this.lastVideoTime = -1;
    this.lastTimestamp = 0;
  }

  /** Loads WASM + model. Tries the GPU delegate first and falls back to CPU. */
  async init() {
    const { assets, tracking } = CONFIG;
    const fileset = await FilesetResolver.forVisionTasks(assets.MEDIAPIPE_WASM_URL);
    const options = (delegate) => ({
      baseOptions: { modelAssetPath: assets.HAND_MODEL_URL, delegate },
      runningMode: 'VIDEO',
      numHands: tracking.NUM_HANDS,
      minHandDetectionConfidence: tracking.MIN_DETECTION_CONFIDENCE,
      minHandPresenceConfidence: tracking.MIN_PRESENCE_CONFIDENCE,
      minTrackingConfidence: tracking.MIN_TRACKING_CONFIDENCE,
    });
    try {
      this.landmarker = await HandLandmarker.createFromOptions(fileset, options('GPU'));
      this.delegate = 'GPU';
    } catch (gpuErr) {
      console.warn('[HandLab] GPU delegate unavailable, using CPU:', gpuErr);
      this.landmarker = await HandLandmarker.createFromOptions(fileset, options('CPU'));
      this.delegate = 'CPU';
    }
  }

  get ready() {
    return this.landmarker !== null;
  }

  /**
   * Runs detection on the current video frame.
   * Returns null when there is no new frame (detecting the same frame twice is wasted work).
   * Result: [{ landmarks: [{x,y,z}x21] (raw, unmirrored, normalized), handedness, score }]
   */
  detect(video, nowMs) {
    if (!this.landmarker || video.readyState < 2) return null;
    if (video.currentTime === this.lastVideoTime) return null;
    this.lastVideoTime = video.currentTime;
    // detectForVideo requires strictly increasing timestamps.
    const ts = Math.max(nowMs, this.lastTimestamp + 1);
    this.lastTimestamp = ts;

    const result = this.landmarker.detectForVideo(video, ts);
    const handedness = result.handedness || result.handednesses || [];
    return (result.landmarks || []).map((landmarks, i) => {
      const cat = handedness[i]?.[0];
      let label = cat?.categoryName || 'Unknown';
      if (CONFIG.tracking.SWAP_HANDEDNESS) {
        label = label === 'Left' ? 'Right' : label === 'Right' ? 'Left' : label;
      }
      return { landmarks, handedness: label, score: cat?.score ?? 1 };
    });
  }

  dispose() {
    this.landmarker?.close();
    this.landmarker = null;
  }
}
