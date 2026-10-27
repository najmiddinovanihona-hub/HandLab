// Geometry helpers for building models out of simple primitives.
//
// Every helper returns a NON-indexed BufferGeometry with only `position` + `normal`,
// already transformed by { p: position, r: Euler rotation (XYZ), s: scale }, so any set of
// them can be merged into one part with merge(...).

import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

const _m = new THREE.Matrix4();
const _q = new THREE.Quaternion();
const _e = new THREE.Euler();
const _p = new THREE.Vector3();
const _s = new THREE.Vector3();

export const PI = Math.PI;

/** Hologram palette. */
export const C = {
  cyan: 0x35e0ff,
  blue: 0x4f8cff,
  magenta: 0xff4fd8,
  pink: 0xff8fc8,
  red: 0xff4d5e,
  orange: 0xff8a3d,
  yellow: 0xffd23f,
  lime: 0xc6ff4a,
  green: 0x52ff7a,
  teal: 0x2fffd2,
  purple: 0xa77bff,
  white: 0xe8f4ff,
};

export function prim(geo, { p = [0, 0, 0], r = [0, 0, 0], s = 1 } = {}) {
  const g = geo.index ? geo.toNonIndexed() : geo;
  if (g !== geo) geo.dispose();
  for (const name of Object.keys(g.attributes)) if (name !== 'position' && name !== 'normal') g.deleteAttribute(name);
  if (!g.attributes.normal) g.computeVertexNormals();
  g.clearGroups();
  const sc = Array.isArray(s) ? s : [s, s, s];
  _m.compose(_p.set(...p), _q.setFromEuler(_e.set(...r)), _s.set(...sc));
  g.applyMatrix4(_m);
  return g;
}

/** Merges geometries (nested arrays allowed) into one and frees the inputs. */
export function merge(...geos) {
  const flat = geos.flat(Infinity);
  if (flat.length === 1) return flat[0];
  const m = mergeGeometries(flat);
  flat.forEach((g) => g.dispose());
  return m;
}

export const box = (w, h, d, o) => prim(new THREE.BoxGeometry(w, h, d), o);
export const cyl = (rt, rb, h, o = {}) =>
  prim(new THREE.CylinderGeometry(rt, rb, h, o.seg ?? 16, o.hs ?? 1, o.open ?? false), o);
export const sphere = (r, o = {}) =>
  prim(new THREE.SphereGeometry(r, o.ws ?? 20, o.hs ?? 14, ...(o.phi ?? [0, PI * 2]), ...(o.theta ?? [0, PI])), o);
export const torus = (R, t, o = {}) => prim(new THREE.TorusGeometry(R, t, o.rs ?? 8, o.ts ?? 32, o.arc ?? PI * 2), o);
export const capsule = (r, len, o = {}) => prim(new THREE.CapsuleGeometry(r, len, 4, o.seg ?? 10), o);
export const ring = (ri, ro, o = {}) => prim(new THREE.RingGeometry(ri, ro, o.seg ?? 32), o);
export const disc = (r, o = {}) => prim(new THREE.CircleGeometry(r, o.seg ?? 32), o);

/** Tube through 3D points (Catmull-Rom). */
export function tube(points, r, o = {}) {
  const curve = new THREE.CatmullRomCurve3(points.map((q) => new THREE.Vector3(...q)), o.closed ?? false);
  return prim(new THREE.TubeGeometry(curve, o.segments ?? Math.max(12, points.length * 10), r, o.rs ?? 6, o.closed ?? false), o);
}

/** Surface of revolution around Y from [x, y] profile points. */
export const lathe = (points, o = {}) =>
  prim(new THREE.LatheGeometry(points.map(([x, y]) => new THREE.Vector2(x, y)), o.seg ?? 24), o);

/** Flat 2D outline (XY) extruded along Z, centred on z = 0. */
export function extrude(points, depth, o = {}) {
  const shape = new THREE.Shape(points.map(([x, y]) => new THREE.Vector2(x, y)));
  const g = new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: false });
  g.translate(0, 0, -depth / 2);
  return prim(g, o);
}

/** Thin plate between two points of the XY plane (side profile), `width` deep along Z. */
export function slab([x1, y1], [x2, y2], width, thick = 0.03, o = {}) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  return box(Math.hypot(dx, dy), thick, width, { p: [(x1 + x2) / 2, (y1 + y2) / 2, o.z ?? 0], r: [0, 0, Math.atan2(dy, dx)] });
}

/** Cylinder from point a to point b (radius r at a, o.rt at b). */
export function beam(a, b, r, o = {}) {
  const A = new THREE.Vector3(...a);
  const B = new THREE.Vector3(...b);
  const g = new THREE.CylinderGeometry(o.rt ?? r, r, A.distanceTo(B), o.seg ?? 8, o.hs ?? 1, o.open ?? false);
  const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), B.clone().sub(A).normalize());
  const e = new THREE.Euler().setFromQuaternion(q);
  return prim(g, { p: A.add(B).multiplyScalar(0.5).toArray(), r: [e.x, e.y, e.z] });
}

/** Points along a vertical helix. */
export function helixPoints(radius, height, turns, { y0 = 0, phase = 0, steps = 0, x = 0, z = 0 } = {}) {
  const n = steps || Math.ceil(turns * 24);
  return Array.from({ length: n + 1 }, (_, i) => {
    const t = i / n;
    const a = phase + t * turns * PI * 2;
    return [x + Math.cos(a) * radius, y0 + t * height, z + Math.sin(a) * radius];
  });
}

/** Deterministic random numbers so models look the same every time. */
export function rng(seed = 1) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
