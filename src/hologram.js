// HoloModel: turns a model definition (named parts made of primitives) into a hologram:
//   - additive glowing edges (EdgesGeometry) per part
//   - a faint additive fill (also the raycast target for pointing)
//   - surface particles that fly in from a scattered cloud to "form" the model (custom shader)
// Each part may have several instances (e.g. 4 wheels); every instance explodes outward
// from the model centre on its own, so "Wheels" fly to the four corners.

import * as THREE from 'three';
import { MeshSurfaceSampler } from 'three/addons/math/MeshSurfaceSampler.js';
import { CONFIG } from './config.js';
import { damp } from './filters.js';
import { rng } from './models/primitives.js';

const VERT = /* glsl */ `
  attribute vec3 aScatter;
  attribute float aDelay;
  attribute float aSize;
  uniform float uForm;
  uniform float uTime;
  uniform float uPixelRatio;
  uniform float uSize;
  uniform float uJitter;
  varying float vAlpha;
  void main() {
    // Each particle starts flying at its own delay, so the model assembles in a wave.
    float t = smoothstep(aDelay, aDelay + 0.5, uForm);
    vec3 p = mix(aScatter, position, t);
    float w = aDelay * 50.0;
    p += uJitter * (1.0 + 5.0 * (1.0 - t)) * vec3(sin(uTime * 1.7 + w), cos(uTime * 1.3 + w * 1.3), sin(uTime * 2.1 + w * 0.7));
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mv;
    gl_PointSize = uSize * aSize * uPixelRatio / max(0.1, -mv.z);
    vAlpha = mix(0.45, 1.0, t);
  }
`;

const FRAG = /* glsl */ `
  uniform vec3 uColor;
  uniform float uOpacity;
  uniform float uAlpha;
  varying float vAlpha;
  void main() {
    float d = length(gl_PointCoord - 0.5);
    if (d > 0.5) discard;
    float a = pow(1.0 - d * 2.0, 1.6);
    gl_FragColor = vec4(uColor * 1.25, a * vAlpha * uOpacity * uAlpha);
  }
`;

const WHITE = new THREE.Color(0xffffff);
const ease = (t) => t * t * (3 - 2 * t);
const smooth = (a, b, x) => ease(Math.min(1, Math.max(0, (x - a) / (b - a))));
const _p = new THREE.Vector3();

export class HoloModel {
  constructor(def, { pixelRatio = 1 } = {}) {
    this.def = def;
    this.root = new THREE.Group(); // rotated / scaled by the controller
    this.content = new THREE.Group(); // normalizes the model's own units and centre
    this.root.add(this.content);
    this.uniforms = {
      uForm: { value: 0 },
      uTime: { value: 0 },
      uPixelRatio: { value: pixelRatio },
      uSize: { value: CONFIG.hologram.POINT_SIZE },
      uJitter: { value: 0 },
      uAlpha: { value: CONFIG.hologram.POINT_ALPHA },
    };
    this.form = 0;
    this.formTarget = 1;
    this.explode = 0;
    this.hovered = null;
    this.selected = null;
    this.pulled = null;
    this.parts = [];
    this.pickables = [];
    this.particleCount = 0;
    this._build();
  }

  _build() {
    const H = CONFIG.hologram;
    const raw = [];
    for (const def of this.def.parts) for (const g of [].concat(def.build())) raw.push({ def, g });

    const bbox = new THREE.Box3();
    for (const r of raw) {
      r.g.computeBoundingBox();
      bbox.union(r.g.boundingBox);
    }
    const center = bbox.getCenter(new THREE.Vector3());
    const radius = bbox.getSize(new THREE.Vector3()).length() / 2 || 1;
    this.radius = radius;
    const scale = H.TARGET_RADIUS / radius;
    this.content.scale.setScalar(scale);
    this.content.position.copy(center).multiplyScalar(-scale);
    this.uniforms.uJitter.value = radius * 0.003;

    // Particle budget is split by surface area so density looks even across parts.
    for (const r of raw) {
      r.sampler = new MeshSurfaceSampler(new THREE.Mesh(r.g)).build();
      r.area = r.sampler.distribution[r.sampler.distribution.length - 1] || 0;
    }
    const totalArea = raw.reduce((s, r) => s + r.area, 0) || 1;
    const random = rng(7);

    const byDef = new Map();
    for (const r of raw) {
      let part = byDef.get(r.def);
      if (!part) {
        part = this._makePart(r.def);
        byDef.set(r.def, part);
        this.parts.push(part);
      }
      const c = r.g.boundingBox.getCenter(new THREE.Vector3());
      r.g.translate(-c.x, -c.y, -c.z); // instance origin = its own centre (explode pivot)
      r.g.computeBoundingSphere();

      const group = new THREE.Group();
      group.position.copy(c);
      this.content.add(group);

      const fill = new THREE.Mesh(r.g, part.mats.fill);
      fill.userData.part = part;
      this.pickables.push(fill);
      const lines = new THREE.LineSegments(new THREE.EdgesGeometry(r.g, r.def.edge ?? 20), part.mats.lines);
      const n = Math.max(H.MIN_POINTS_PER_INSTANCE, Math.round((H.PARTICLES_PER_MODEL * r.area) / totalArea));
      const points = this._makePoints(r.sampler, n, c, center, radius, part, random);
      group.add(fill, lines, points);
      this.particleCount += n;

      // Explode offset: radially away from the model centre, scaled by distance, plus an
      // optional hand-tuned direction `ex` (in units of half the model radius).
      const dir = c.clone().sub(center);
      const len = dir.length();
      const spread = r.def.spread ?? 1;
      const offset =
        len > 1e-4 ? dir.multiplyScalar(((len * H.EXPLODE_GAIN + radius * H.EXPLODE_BASE) * spread) / len) : new THREE.Vector3();
      if (r.def.ex) offset.add(new THREE.Vector3(...r.def.ex).multiplyScalar(radius * 0.5));
      part.instances.push({ group, base: c, offset });
    }
  }

  _makePart(def) {
    const color = new THREE.Color(def.color);
    const common = { transparent: true, depthWrite: false, blending: THREE.AdditiveBlending };
    const mats = {
      fill: new THREE.MeshBasicMaterial({ ...common, color: color.clone(), opacity: 0.05, side: THREE.DoubleSide }),
      lines: new THREE.LineBasicMaterial({ ...common, color: color.clone(), opacity: 0.8 }),
      points: new THREE.ShaderMaterial({
        ...common,
        uniforms: { ...this.uniforms, uColor: { value: color.clone() }, uOpacity: { value: 1 } },
        vertexShader: VERT,
        fragmentShader: FRAG,
      }),
    };
    return {
      def,
      modelId: this.def.id,
      name: def.name,
      info: def.info,
      color,
      mats,
      instances: [],
      emph: 0.72,
      pull: new THREE.Vector3(),
      pullTarget: new THREE.Vector3(),
    };
  }

  _makePoints(sampler, n, c, center, radius, part, random) {
    const pos = new Float32Array(n * 3);
    const scatter = new Float32Array(n * 3);
    const delay = new Float32Array(n);
    const size = new Float32Array(n);
    for (let i = 0; i < n; i++) {
      sampler.sample(_p);
      pos.set([_p.x, _p.y, _p.z], i * 3);
      // Scatter cloud: random point in a shell around the model centre, in instance space.
      const u = random() * 2 - 1;
      const a = random() * Math.PI * 2;
      const s = Math.sqrt(1 - u * u);
      const rr = radius * (0.5 + random() * 1.1);
      scatter.set(
        [center.x + rr * s * Math.cos(a) - c.x, center.y + rr * u - c.y, center.z + rr * s * Math.sin(a) - c.z],
        i * 3
      );
      delay[i] = random() * 0.5;
      size[i] = 0.5 + random();
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    g.setAttribute('aScatter', new THREE.BufferAttribute(scatter, 3));
    g.setAttribute('aDelay', new THREE.BufferAttribute(delay, 1));
    g.setAttribute('aSize', new THREE.BufferAttribute(size, 1));
    const points = new THREE.Points(g, part.mats.points);
    points.frustumCulled = false; // scattered particles live outside the surface bounds
    points.raycast = () => {};
    return points;
  }

  // ---------------------------------------------------------------- state
  setExplode(f) {
    this.explode = f;
  }
  setFormed(on) {
    this.formTarget = on ? 1 : 0;
  }
  toggleFormed() {
    this.setFormed(this.formTarget < 0.5);
    return this.formTarget > 0.5;
  }
  get formState() {
    if (this.formTarget > 0.5) return this.form >= 0.999 ? 'FORMED' : 'FORMING';
    return this.form <= 0.001 ? 'DISSOLVED' : 'DISSOLVING';
  }
  hover(part) {
    this.hovered = part;
  }
  select(part) {
    this.selected = part;
  }
  setPulled(part) {
    this.pulled = part;
  }

  /** First part hit by the ray (only once the model is mostly formed). */
  pick(raycaster) {
    if (this.form < 0.6) return null;
    const hit = raycaster.intersectObjects(this.pickables, false)[0];
    return hit ? hit.object.userData.part : null;
  }

  /** World position of a part's label anchor (its first instance). */
  anchor(part, target) {
    return part.instances[0].group.getWorldPosition(target);
  }

  update(dt) {
    const H = CONFIG.hologram;
    const rate = this.formTarget > this.form ? 1 / H.FORM_SECONDS : 1 / H.DISSOLVE_SECONDS;
    const step = rate * dt;
    this.form = this.formTarget > this.form ? Math.min(this.formTarget, this.form + step) : Math.max(this.formTarget, this.form - step);
    this.uniforms.uForm.value = this.form;
    this.uniforms.uTime.value += dt;

    // Lines and fill only appear once most particles have arrived.
    const solid = smooth(0.55, 1, this.form);
    const focus = this.pulled || this.selected;
    const e = ease(this.explode);
    for (const part of this.parts) {
      const hot = part === this.hovered || part === focus;
      const target = hot ? 1 : focus ? 0.25 : 0.72;
      part.emph = damp(part.emph, target, 8, dt);
      part.mats.lines.opacity = part.emph * solid;
      part.mats.lines.color.copy(part.color).lerp(WHITE, hot ? 0.45 : 0);
      part.mats.fill.opacity = (hot ? 0.16 : 0.04) * solid * Math.min(1, part.emph / 0.72);
      part.mats.points.uniforms.uOpacity.value = part.emph;

      part.pull.x = damp(part.pull.x, part.pullTarget.x, CONFIG.smoothing.PULL, dt);
      part.pull.y = damp(part.pull.y, part.pullTarget.y, CONFIG.smoothing.PULL, dt);
      part.pull.z = damp(part.pull.z, part.pullTarget.z, CONFIG.smoothing.PULL, dt);
      for (const inst of part.instances) {
        inst.group.position.copy(inst.base).addScaledVector(inst.offset, e).add(part.pull);
      }
    }
  }

  dispose() {
    const geos = new Set();
    const mats = new Set();
    this.root.traverse((o) => {
      if (o.geometry) geos.add(o.geometry);
      if (o.material) mats.add(o.material);
    });
    geos.forEach((g) => g.dispose());
    mats.forEach((m) => m.dispose());
    this.root.removeFromParent();
  }
}

