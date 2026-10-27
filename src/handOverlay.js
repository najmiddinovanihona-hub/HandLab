// Full-screen hand overlay drawn on top of the webcam background: white skeleton, a golden
// ring around the active palm whose arc shows hand openness, and a pointer with a dwell ring.
//
// The video is shown with object-fit: cover and mirrored, so landmark coordinates (already
// mirrored, [0,1] of the video frame) must be mapped through the same crop to land exactly
// on the hand you see. toScreen() is also used for pointing, so the finger points where it
// appears to point.

import { HAND_CONNECTIONS, LM } from './gestures.js';

const TIPS = new Set([LM.THUMB_TIP, LM.INDEX_TIP, LM.MIDDLE_TIP, LM.RING_TIP, LM.PINKY_TIP]);

export class HandOverlay {
  constructor(canvas, video) {
    this.canvas = canvas;
    this.video = video;
    this.ctx = canvas.getContext('2d');
    this.resize();
    window.addEventListener('resize', () => this.resize());
  }

  resize() {
    const dpr = Math.min(window.devicePixelRatio, 2);
    this.canvas.width = window.innerWidth * dpr;
    this.canvas.height = window.innerHeight * dpr;
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  /** Mirrored video coordinates [0,1] -> screen pixels (object-fit: cover crop). */
  toScreen(p) {
    const vw = this.video.videoWidth || 1280;
    const vh = this.video.videoHeight || 720;
    const W = window.innerWidth;
    const H = window.innerHeight;
    const s = Math.max(W / vw, H / vh);
    const dw = vw * s;
    const dh = vh * s;
    return { x: (W - dw) / 2 + p.x * dw, y: (H - dh) / 2 + p.y * dh };
  }

  clear() {
    this.ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
  }

  draw(hands, { activeId, pointer, dwell = 0 }) {
    const ctx = this.ctx;
    this.clear();
    for (const h of hands) {
      const pts = h.landmarks.map((p) => this.toScreen(p));
      const active = h.id === activeId;

      if (active) {
        // Ring around the palm: faint full circle + glowing arc = openness.
        const palm = this.toScreen(h.keypoints.palm);
        const scalePx = Math.hypot(pts[LM.WRIST].x - pts[LM.MIDDLE_MCP].x, pts[LM.WRIST].y - pts[LM.MIDDLE_MCP].y);
        const R = scalePx * 1.9;
        ctx.lineWidth = 2;
        ctx.strokeStyle = 'rgba(255, 200, 60, 0.18)';
        ctx.beginPath();
        ctx.arc(palm.x, palm.y, R, 0, Math.PI * 2);
        ctx.stroke();
        ctx.save();
        ctx.shadowColor = '#ffc53d';
        ctx.shadowBlur = 18;
        ctx.strokeStyle = '#ffc53d';
        ctx.lineWidth = 4;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.arc(palm.x, palm.y, R, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * Math.max(0.02, h.openness));
        ctx.stroke();
        ctx.restore();
      }

      ctx.lineWidth = active ? 2.5 : 1.5;
      ctx.strokeStyle = active ? 'rgba(255, 255, 255, 0.9)' : 'rgba(255, 255, 255, 0.5)';
      ctx.beginPath();
      for (const [a, b] of HAND_CONNECTIONS) {
        ctx.moveTo(pts[a].x, pts[a].y);
        ctx.lineTo(pts[b].x, pts[b].y);
      }
      ctx.stroke();
      ctx.fillStyle = '#fff';
      pts.forEach((p, i) => {
        ctx.beginPath();
        ctx.arc(p.x, p.y, TIPS.has(i) ? 4.5 : 2.8, 0, Math.PI * 2);
        ctx.fill();
      });
    }

    if (pointer) {
      ctx.lineWidth = 2;
      ctx.strokeStyle = 'rgba(53, 224, 255, 0.35)';
      ctx.beginPath();
      ctx.arc(pointer.x, pointer.y, 16, 0, Math.PI * 2);
      ctx.stroke();
      if (dwell > 0) {
        ctx.save();
        ctx.shadowColor = '#35e0ff';
        ctx.shadowBlur = 12;
        ctx.strokeStyle = dwell >= 1 ? '#ffc53d' : '#35e0ff';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(pointer.x, pointer.y, 16, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * dwell);
        ctx.stroke();
        ctx.restore();
      }
    }
  }
}
