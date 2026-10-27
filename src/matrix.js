// "Matrix" digital rain for the hacker theme: columns of falling glyphs on a canvas that sits
// between the webcam video and the 3D layer. Drawn at ~24 fps and only while enabled.

const GLYPHS = 'アイウエオカキクケコサシスセソタチツテトナニヌネノ0123456789ABCDEF<>/{}[]$#*+=';
const CELL = 18; // px per glyph

export class MatrixRain {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.enabled = false;
    this.last = 0;
    this.drops = [];
    this.resize();
    window.addEventListener('resize', () => this.resize());
  }

  resize() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
    const cols = Math.ceil(window.innerWidth / CELL);
    this.drops = Array.from({ length: cols }, () => Math.random() * -50);
    this.ctx.fillStyle = '#000';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
  }

  setEnabled(on) {
    this.enabled = on;
    if (!on) this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }

  update(now) {
    if (!this.enabled || now - this.last < 42) return;
    this.last = now;
    const ctx = this.ctx;
    // Translucent black wash = fading trails.
    ctx.fillStyle = 'rgba(0, 0, 0, 0.12)';
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    ctx.font = `${CELL - 3}px Consolas, "Courier New", monospace`;
    for (let i = 0; i < this.drops.length; i++) {
      const y = this.drops[i] * CELL;
      const ch = GLYPHS[(Math.random() * GLYPHS.length) | 0];
      ctx.fillStyle = Math.random() < 0.06 ? '#d8ffe4' : '#00ff66';
      ctx.fillText(ch, i * CELL, y);
      if (y > this.canvas.height && Math.random() > 0.975) this.drops[i] = 0;
      this.drops[i] += 1;
    }
  }
}
