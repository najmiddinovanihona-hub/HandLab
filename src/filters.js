// Signal-conditioning helpers: One Euro filter, EMA, hysteresis, cooldown, damping.

class LowPass {
  constructor() {
    this.y = null;
  }
  filter(x, alpha) {
    this.y = this.y === null ? x : alpha * x + (1 - alpha) * this.y;
    return this.y;
  }
  reset() {
    this.y = null;
  }
}

/**
 * One Euro filter (Casiez et al., CHI 2012).
 * A low-pass filter whose cutoff rises with speed: heavy smoothing when the hand is
 * still (kills jitter), light smoothing when it moves fast (kills lag).
 *   cutoff = minCutoff + beta * |speed|
 *   alpha  = 1 / (1 + tau/dt), tau = 1 / (2*pi*cutoff)
 */
export class OneEuroFilter {
  constructor({ minCutoff = 1, beta = 0, dCutoff = 1 } = {}) {
    this.minCutoff = minCutoff;
    this.beta = beta;
    this.dCutoff = dCutoff;
    this.x = new LowPass();
    this.dx = new LowPass();
    this.tPrev = null;
  }

  static alpha(cutoff, dt) {
    const tau = 1 / (2 * Math.PI * cutoff);
    return 1 / (1 + tau / dt);
  }

  filter(value, tSec) {
    if (this.tPrev === null || this.x.y === null) {
      this.tPrev = tSec;
      this.dx.filter(0, 1);
      return this.x.filter(value, 1);
    }
    const dt = Math.max(1e-3, tSec - this.tPrev);
    this.tPrev = tSec;
    const speed = this.dx.filter((value - this.x.y) / dt, OneEuroFilter.alpha(this.dCutoff, dt));
    const cutoff = this.minCutoff + this.beta * Math.abs(speed);
    return this.x.filter(value, OneEuroFilter.alpha(cutoff, dt));
  }

  reset() {
    this.x.reset();
    this.dx.reset();
    this.tPrev = null;
  }
}

/** One Euro filter bank for a whole hand: 21 landmarks x (x, y, z). */
export class LandmarkFilter {
  constructor(count, params) {
    this.filters = Array.from({ length: count * 3 }, () => new OneEuroFilter(params));
  }
  filter(landmarks, tSec) {
    return landmarks.map((p, i) => ({
      x: this.filters[i * 3].filter(p.x, tSec),
      y: this.filters[i * 3 + 1].filter(p.y, tSec),
      z: this.filters[i * 3 + 2].filter(p.z, tSec),
    }));
  }
  reset() {
    this.filters.forEach((f) => f.reset());
  }
}

/** Exponential moving average; alpha = weight of the newest sample. */
export class EMA {
  constructor(alpha) {
    this.alpha = alpha;
    this.value = null;
  }
  update(v) {
    this.value = this.value === null ? v : this.alpha * v + (1 - this.alpha) * this.value;
    return this.value;
  }
  reset() {
    this.value = null;
  }
}

/**
 * Hysteresis on a discrete value: a new candidate must be seen `frames` times in a row
 * before it replaces the stable value. One misclassified frame never switches state.
 */
export class StableValue {
  constructor(frames, initial) {
    this.frames = frames;
    this.value = initial;
    this.candidate = initial;
    this.count = 0;
  }
  update(candidate) {
    if (candidate === this.value) {
      this.candidate = candidate;
      this.count = 0;
      return this.value;
    }
    if (candidate === this.candidate) {
      this.count++;
    } else {
      this.candidate = candidate;
      this.count = 1;
    }
    if (this.count >= this.frames) {
      this.value = candidate;
      this.count = 0;
    }
    return this.value;
  }
  reset(value) {
    this.value = value;
    this.candidate = value;
    this.count = 0;
  }
}

/** Debounce for discrete events: fires at most once per `ms`. */
export class Cooldown {
  constructor(ms) {
    this.ms = ms;
    this.last = -Infinity;
  }
  ready(now) {
    return now - this.last >= this.ms;
  }
  trigger(now) {
    this.last = now;
  }
}

/**
 * Frame-rate-independent exponential damping toward a target.
 * Equivalent to lerp(current, target, 1 - e^(-lambda*dt)).
 */
export function damp(current, target, lambda, dt) {
  return target + (current - target) * Math.exp(-lambda * dt);
}

export const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
export const clamp01 = (v) => clamp(v, 0, 1);
