// Part labels in two columns beside the model, joined to their parts by leader lines.
//
// Each frame: project every part's anchor to the screen, put parts left of the model
// centre in the left column and the rest in the right column, sort each column by height
// and push labels apart so they never overlap, then draw an elbow line to the anchor.

import * as THREE from 'three';
import { partText } from './i18n.js';

const _v = new THREE.Vector3();
const SVG_NS = 'http://www.w3.org/2000/svg';
const GAP = 22; // px between label rows

export class LabelLayer {
  constructor(root) {
    this.root = root;
    this.svg = root.querySelector('svg');
    this.items = [];
  }

  setModel(model) {
    for (const it of this.items) {
      it.el.remove();
      it.line.remove();
      it.dot.remove();
    }
    this.items = model.parts.map((part) => {
      const el = document.createElement('div');
      el.className = 'part-label';
      el.textContent = partText(part).name;
      el.style.setProperty('--c', `#${part.color.getHexString()}`);
      const line = document.createElementNS(SVG_NS, 'polyline');
      const dot = document.createElementNS(SVG_NS, 'circle');
      dot.setAttribute('r', '2.5');
      line.style.stroke = dot.style.fill = `#${part.color.getHexString()}`;
      this.root.appendChild(el);
      this.svg.append(line, dot);
      return { part, el, line, dot, a: null, y: 0 };
    });
  }

  /** @param minLeft  px the left column must stay right of (the side panel) */
  update(model, camera, { visible, minLeft = 0, bottomInset = 130 }) {
    this.root.classList.toggle('show', visible);
    if (!visible || !model) return;

    const W = window.innerWidth;
    const H = window.innerHeight;
    const project = (v) => {
      v.project(camera);
      return { x: ((v.x + 1) / 2) * W, y: ((1 - v.y) / 2) * H, ok: v.z < 1 };
    };
    model.root.getWorldPosition(_v);
    const c = project(_v);

    const left = [];
    const right = [];
    for (const it of this.items) {
      model.anchor(it.part, _v);
      it.a = project(_v);
      (it.a.x < c.x ? left : right).push(it);
    }

    const top = 70;
    const bottom = H - bottomInset;
    const layout = (col) => {
      col.sort((p, q) => p.a.y - q.a.y);
      let prev = top - GAP;
      for (const it of col) prev = it.y = Math.max(it.a.y, prev + GAP);
      const overflow = prev - bottom;
      if (overflow > 0) for (const it of col) it.y -= overflow;
      prev = top - GAP;
      for (const it of col) prev = it.y = Math.max(it.y, prev + GAP);
    };
    layout(left);
    layout(right);

    const leftX = Math.max(minLeft + 160, Math.min(...left.map((i) => i.a.x), c.x) - 60);
    const rightX = Math.min(W - 190, Math.max(...right.map((i) => i.a.x), c.x) + 60);

    const focus = new Set([model.hovered, model.selected, model.pulled]);
    for (const it of this.items) {
      const isLeft = left.includes(it);
      const x = isLeft ? leftX : rightX;
      it.el.style.transform = isLeft
        ? `translate(${x - 8}px, ${it.y}px) translate(-100%, -50%)`
        : `translate(${x + 8}px, ${it.y}px) translate(0, -50%)`;
      const elbow = isLeft ? x + 14 : x - 14;
      it.line.setAttribute('points', `${x},${it.y} ${elbow},${it.y} ${it.a.x},${it.a.y}`);
      it.dot.setAttribute('cx', it.a.x);
      it.dot.setAttribute('cy', it.a.y);
      const hot = focus.has(it.part);
      it.el.classList.toggle('hot', hot);
      it.line.classList.toggle('hot', hot);
      const hidden = !it.a.ok;
      it.el.style.visibility = it.line.style.visibility = it.dot.style.visibility = hidden ? 'hidden' : '';
    }
  }
}
