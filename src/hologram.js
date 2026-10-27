// HoloModel: turns a model definition (named parts made of primitives) into a 3D model that
// can be drawn in four styles:
//   hologram  - "Nuqtali": glowing edges + faint fill + surface particles (default)
//   xray      - "Rentgen": see-through bluish shells, bright where surfaces turn away (fresnel)
//   realistic - "Realistik": opaque lit materials (metal / plastic), no particles
//   fantasy   - "Fantastik": rainbow-shifting glow, colour-cycling particles and edges
// Particles always carry the form / dissolve animation ("snap"), whatever the style.
// Each part may have several instances (e.g. 4 wheels); every instance explodes outward from
// the model centre on its own, so "Wheels" fly to the four corners.

import * as THREE from 'three';
import { MeshSurfaceSampler } from 'three/addons/math/MeshSurfaceSampler.js';
import { CONFIG } from './config.js';
import { damp } from './filters.js';
import { rng } from './models/primitives.js';
import { realisticMaterial } from './materials.js';
import { loadGltfParts } from './gltfParts.js';

export const STYLES = ['hologram', 'xray', 'realistic', 'fantasy'];

const POINT_VERT = /* glsl */ `
  attribute vec3 aScatter;
  attribute float aDelay;
  attribute float aSize;
  uniform float uForm;
  uniform float uTime;
  uniform float uPixelRatio;
  uniform float uSize;
  uniform float uJitter;
  uniform float uDrift;
  varying float vAlpha;
  void main() {
    // Each particle starts flying at its own delay, so the model assembles in a wave.
    float t = smoothstep(aDelay, aDelay + 0.5, uForm);
    vec3 p = mix(aScatter, position, t);
    float w = aDelay * 50.0;
    p += uJitter * (1.0 + 5.0 * (1.0 - t) + uDrift) * vec3(sin(uTime * 1.7 + w), cos(uTime * 1.3 + w * 1.3), sin(uTime * 2.1 + w * 0.7));
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mv;
    gl_PointSize = uSize * aSize * uPixelRatio / max(0.1, -mv.z);
    vAlpha = mix(0.45, 1.0, t);
  }
`;

const POINT_FRAG = /* glsl */ `
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

// Shared by the X-ray and fantasy fills: brightness from the fresnel term (surfaces seen
// edge-on glow, surfaces facing you are almost clear), like a real radiograph of a shell.
const SHELL_VERT = /* glsl */ `
  varying vec3 vN;
  varying vec3 vV;
  varying vec3 vW;
  void main() {
    vec4 world = modelMatrix * vec4(position, 1.0);
    vec4 mv = viewMatrix * world;
    vN = normalize(normalMatrix * normal);
    vV = normalize(-mv.xyz);
    vW = world.xyz;
    gl_Position = projectionMatrix * mv;
  }
`;

const SHELL_FRAG = /* glsl */ `
  uniform vec3 uColor;
  uniform float uOpacity;
  uniform float uTime;
  uniform float uHue;
  uniform float uMode; // 0 = x-ray, 1 = fantasy
  varying vec3 vN;
  varying vec3 vV;
  varying vec3 vW;
  vec3 hsv2rgb(vec3 c) {
    vec3 p = abs(fract(c.xxx + vec3(0.0, 2.0 / 3.0, 1.0 / 3.0)) * 6.0 - 3.0);
    return c.z * mix(vec3(1.0), clamp(p - 1.0, 0.0, 1.0), c.y);
  }
  void main() {
    float f = pow(1.0 - abs(dot(normalize(vN), normalize(vV))), 2.0);
    vec3 col;
    float a;
    if (uMode < 0.5) {
      col = mix(uColor * 0.6, vec3(0.92, 0.97, 1.0), f);
      a = 0.035 + 0.75 * f;
    } else {
      float hue = fract(uHue + uTime * 0.07 + vW.y * 0.18 + vW.x * 0.07);
      col = hsv2rgb(vec3(hue, 0.8, 1.0));
      a = 0.05 + 0.5 * f;
    }
    gl_FragColor = vec4(col, a * uOpacity);
  }
`;

const WHITE = new THREE.Color(0xffffff);
const XRAY = new THREE.Color(0x9fc8ff);
const ease = (t) => t * t * (3 - 2 * t);
const smooth = (a, b, x) => ease(Math.min(1, Math.max(0, (x - a) / (b - a))));
const _p = new THREE.Vector3();
const _c = new THREE.Color();

export class HoloModel {
  /** Async factory: real (glTF) models are downloaded first, procedural ones build at once. */
  static async create(def, opts = {}) {
    const raw = def.gltf ? await loadGltfParts(def) : null;
    return new HoloModel(def, { ...opts, raw });
  }

  constructor(def, { pixelRatio = 1, style = 'hologram', tint = null, raw = null } = {}) {
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
      uDrift: { value: 0 },
    };
    this.form = 0;
    this.formTarget = 1;
    this.explode = 0;
    this.time = 0;
    this.hovered = null;
    this.selected = null;
    this.pulled = null;
    this.parts = [];
    this.pickables = [];
    this.particleCount = 0;
    this.tint = null;
    this._build(raw);
    this.setTint(tint);
    this.setStyle(style);
  }

  _build(rawIn) {
    const H = CONFIG.hologram;
    // raw = [{ def: part definition, g: geometry, material?: original glTF material }]
    const raw = rawIn ?? [];
    if (!rawIn) for (const def of this.def.parts) for (const g of [].concat(def.build())) raw.push({ def, g });
    const minPoints = rawIn ? 24 : H.MIN_POINTS_PER_INSTANCE; // glTF models can have 100+ meshes

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
    // Optional built-in viewing tilt (e.g. the flat Solar System), applied around the centre.
    if (this.def.tilt) this.content.rotation.set(this.def.tilt, 0, 0);
    this.content.position.copy(center).applyQuaternion(this.content.quaternion).multiplyScalar(-scale);
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
        part = this._makePart(r.def, this.parts.length);
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
      const n = Math.max(minPoints, Math.round((H.PARTICLES_PER_MODEL * r.area) / totalArea));
      const points = this._makePoints(r.sampler, n, c, center, radius, part, random);
      group.add(fill, points);
      // Edges are expensive on big real models (100k+ triangles), so they are built lazily
      // the first time a style that draws them is selected (see _ensureLines).
      const lines = null;
      this.particleCount += n;

      // Explode offset: radially away from the model centre, scaled by distance, plus an
      // optional hand-tuned direction `ex` (in units of half the model radius).
      const dir = c.clone().sub(center);
      const len = dir.length();
      const spread = r.def.spread ?? 1;
      const offset =
        len > 1e-4 ? dir.multiplyScalar(((len * H.EXPLODE_GAIN + radius * H.EXPLODE_BASE) * spread) / len) : new THREE.Vector3();
      if (r.def.ex) offset.add(new THREE.Vector3(...r.def.ex).multiplyScalar(radius * 0.5));
      // Real models keep their own textured PBR material for the realistic style.
      const realMat = r.material ? cloneRealMaterial(r.material) : null;
      part.instances.push({ group, base: c, offset, fill, lines, points, realMat });
    }
  }

  _makePart(def, index) {
    const color = new THREE.Color(def.color);
    const additive = { transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false };
    const shell = (mode) =>
      new THREE.ShaderMaterial({
        ...additive,
        side: THREE.DoubleSide,
        uniforms: {
          uColor: { value: color.clone() },
          uOpacity: { value: 1 },
          uTime: this.uniforms.uTime,
          uHue: { value: (index * 0.13) % 1 },
          uMode: { value: mode },
        },
        vertexShader: SHELL_VERT,
        fragmentShader: SHELL_FRAG,
      });
    const fills = {
      hologram: new THREE.MeshBasicMaterial({ ...additive, color: color.clone(), opacity: 0.05, side: THREE.DoubleSide }),
      xray: shell(0),
      realistic: realisticMaterial(def, this.def),
      fantasy: shell(1),
    };
    const mats = {
      fills,
      fill: fills.hologram,
      lines: new THREE.LineBasicMaterial({ ...additive, color: color.clone(), opacity: 0.8 }),
      points: new THREE.ShaderMaterial({
        ...additive,
        uniforms: { ...this.uniforms, uColor: { value: color.clone() }, uOpacity: { value: 1 } },
        vertexShader: POINT_VERT,
        fragmentShader: POINT_FRAG,
      }),
    };
    return {
      def,
      index,
      modelId: this.def.id,
      name: def.name,
      info: def.info,
      color, // the part's own colour
      drawColor: color.clone(), // colour actually used (tinted in hacker theme)
      mats,
      instances: [],
      emph: 0.72,
      pull: new THREE.Vector3(),
      pullTarget: new THREE.Vector3(),
      spinAxis: def.spin ? new THREE.Vector3(...def.spin.axis).normalize() : null,
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

  // ---------------------------------------------------------------- appearance
  _ensureLines() {
    for (const part of this.parts) {
      for (const inst of part.instances) {
        if (inst.lines) continue;
        inst.lines = new THREE.LineSegments(new THREE.EdgesGeometry(inst.fill.geometry, part.def.edge ?? 20), part.mats.lines);
        inst.group.add(inst.lines);
      }
    }
  }

  setStyle(style) {
    this.style = STYLES.includes(style) ? style : 'hologram';
    if (this.style !== 'realistic') this._ensureLines();
    for (const part of this.parts) {
      part.mats.fill = part.mats.fills[this.style];
      for (const inst of part.instances) inst.fill.material = this.style === 'realistic' && inst.realMat ? inst.realMat : part.mats.fill;
    }
    this.uniforms.uDrift.value = this.style === 'fantasy' ? 2.5 : 0;
    this.uniforms.uSize.value = CONFIG.hologram.POINT_SIZE * (this.style === 'fantasy' ? 1.5 : 1);
  }

  /** Hacker theme: every part drawn in shades of one colour (null = own colours). */
  setTint(tint) {
    this.tint = tint ? new THREE.Color(tint) : null;
    for (const part of this.parts) {
      if (!this.tint) part.drawColor.copy(part.color);
      else part.drawColor.copy(this.tint).multiplyScalar(0.55 + 0.45 * ((part.index * 0.37) % 1));
    }
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
    this.time += dt;
    this.uniforms.uForm.value = this.form;
    this.uniforms.uTime.value = this.time;

    // Solid surfaces and edges appear once most particles have arrived.
    const solid = smooth(0.55, 1, this.form);
    const style = this.style;
    // Particles carry the form/dissolve animation in every style; in the solid styles they
    // fade out once the model is complete.
    const pointVis = style === 'hologram' || style === 'fantasy' ? 1 : 1 - solid;
    const focus = this.pulled || this.selected;
    const e = ease(this.explode);

    for (const part of this.parts) {
      const hot = part === this.hovered || part === focus;
      const target = hot ? 1 : focus ? 0.25 : 0.72;
      part.emph = damp(part.emph, target, 8, dt);
      const dim = Math.min(1, part.emph / 0.72);
      const m = part.mats;

      // Colour: own (or tinted) colour; fantasy cycles hue over time.
      if (style === 'fantasy' && !this.tint) _c.setHSL((part.index * 0.13 + this.time * 0.07) % 1, 0.85, 0.6);
      else _c.copy(part.drawColor);

      m.points.uniforms.uColor.value.copy(_c);
      m.points.uniforms.uOpacity.value = part.emph * pointVis;

      if (style === 'hologram') {
        m.lines.opacity = part.emph * solid;
        m.lines.color.copy(_c).lerp(WHITE, hot ? 0.45 : 0);
        m.fill.color.copy(_c);
        m.fill.opacity = (hot ? 0.16 : 0.04) * solid * dim;
      } else if (style === 'xray') {
        m.lines.opacity = 0.22 * part.emph * solid;
        m.lines.color.copy(hot ? _c : XRAY);
        m.fill.uniforms.uColor.value.copy(hot ? _c : this.tint ? _c : XRAY);
        m.fill.uniforms.uOpacity.value = (hot ? 1.6 : 1) * solid * dim;
      } else if (style === 'realistic') {
        m.lines.opacity = 0;
        // Natural material colours; only the hacker tint recolours them.
        const opacity = solid * (focus && !hot ? 0.3 : 1);
        const mats = [m.fill, ...part.instances.map((i) => i.realMat).filter(Boolean).flat()];
        for (const mat of new Set(mats)) {
          if (mat === m.fill && mat.userData.baseColor) mat.color.copy(this.tint ? _c : mat.userData.baseColor);
          if (mat.emissive && mat.userData.kind !== 'glow') {
            if (hot) mat.emissive.copy(_c).multiplyScalar(0.35);
            else if (mat.userData.baseEmissive) mat.emissive.copy(mat.userData.baseEmissive);
            else mat.emissive.setRGB(0, 0, 0);
          }
          mat.opacity = opacity;
          mat.depthWrite = opacity > 0.95;
        }
      } else {
        m.lines.opacity = 0.9 * part.emph * solid;
        m.lines.color.copy(_c).lerp(WHITE, hot ? 0.5 : 0.1);
        m.fill.uniforms.uOpacity.value = (hot ? 1.5 : 1) * solid * dim;
      }

      part.pull.x = damp(part.pull.x, part.pullTarget.x, CONFIG.smoothing.PULL, dt);
      part.pull.y = damp(part.pull.y, part.pullTarget.y, CONFIG.smoothing.PULL, dt);
      part.pull.z = damp(part.pull.z, part.pullTarget.z, CONFIG.smoothing.PULL, dt);
      for (const inst of part.instances) {
        if (inst.lines) inst.lines.visible = m.lines.opacity > 0.001;
        inst.points.visible = m.points.uniforms.uOpacity.value > 0.001;
        inst.group.position.copy(inst.base).addScaledVector(inst.offset, e).add(part.pull);
        // Spinning parts (electrons, rotors) turn around their own centre.
        if (part.spinAxis) inst.group.quaternion.setFromAxisAngle(part.spinAxis, this.time * part.def.spin.speed);
      }
    }
  }

  dispose() {
    const geos = new Set();
    const mats = new Set();
    this.root.traverse((o) => {
      if (o.geometry) geos.add(o.geometry);
    });
    for (const part of this.parts) {
      Object.values(part.mats.fills).forEach((m) => mats.add(m));
      mats.add(part.mats.lines);
      mats.add(part.mats.points);
      // Cloned glTF materials are freed; their textures stay cached for the next visit.
      for (const inst of part.instances) [].concat(inst.realMat ?? []).forEach((m) => mats.add(m));
    }
    geos.forEach((g) => g.dispose());
    mats.forEach((m) => m.dispose());
    this.root.removeFromParent();
  }
}

/** Per-instance copy of an original glTF material (textures stay shared). */
function cloneRealMaterial(material) {
  const clone = (m) => {
    const c = m.clone();
    c.transparent = true;
    c.side = THREE.DoubleSide;
    if (c.emissive) c.userData.baseEmissive = c.emissive.clone();
    return c;
  };
  return Array.isArray(material) ? material.map(clone) : clone(material);
}
