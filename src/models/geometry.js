// GEOMETRY: Platonic solids, pyramid, prisms and the round solids, each with its facts in
// English and Uzbek.
//
// Polyhedra are built from a three.js geometry and split automatically into three parts:
//   Faces    - triangles grouped by their (rounded) normal, shrunk slightly so gaps show
//   Edges    - one thin beam per edge (EdgesGeometry, i.e. creases between faces)
//   Vertices - one small ball per edge endpoint (cap-centre helper vertices are excluded)
// Each face / edge / vertex is its own instance, so "explode" pulls the solid apart into
// layers: faces nearest, then edges, then vertices furthest out.

import * as THREE from 'three';
import { C, PI, prim, sphere, beam, cyl, torus, disc } from './primitives.js';

const SHRINK = 0.93; // faces are drawn at 93 % around their centre so edges stand apart

function faceGeos(make) {
  const g = make();
  const src = g.index ? g.toNonIndexed() : g;
  const pos = src.attributes.position;
  const a = new THREE.Vector3(), b = new THREE.Vector3(), c = new THREE.Vector3();
  const n = new THREE.Vector3(), ab = new THREE.Vector3(), ac = new THREE.Vector3();
  const faces = new Map();
  for (let i = 0; i < pos.count; i += 3) {
    a.fromBufferAttribute(pos, i);
    b.fromBufferAttribute(pos, i + 1);
    c.fromBufferAttribute(pos, i + 2);
    n.crossVectors(ab.subVectors(b, a), ac.subVectors(c, a));
    if (n.length() < 1e-8) continue; // degenerate (cone apex)
    n.normalize();
    const key = `${Math.round(n.x * 100)},${Math.round(n.y * 100)},${Math.round(n.z * 100)}`;
    if (!faces.has(key)) faces.set(key, []);
    faces.get(key).push(a.clone(), b.clone(), c.clone());
  }
  if (src !== g) src.dispose();
  g.dispose();
  return [...faces.values()].map((pts) => {
    const centre = pts.reduce((s, p) => s.add(p), new THREE.Vector3()).multiplyScalar(1 / pts.length);
    const arr = new Float32Array(pts.length * 3);
    pts.forEach((p, i) => p.sub(centre).multiplyScalar(SHRINK).add(centre).toArray(arr, i * 3));
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(arr, 3));
    return prim(geo);
  });
}

function edgeSegments(make) {
  const g = make();
  const e = new THREE.EdgesGeometry(g, 1);
  const p = e.attributes.position.array;
  const segs = [];
  for (let i = 0; i < p.length; i += 6) segs.push([[p[i], p[i + 1], p[i + 2]], [p[i + 3], p[i + 4], p[i + 5]]]);
  g.dispose();
  e.dispose();
  return segs;
}

function vertexPoints(make) {
  const seen = new Map();
  for (const seg of edgeSegments(make)) {
    for (const v of seg) seen.set(v.map((x) => Math.round(x * 1000)).join(','), v);
  }
  return [...seen.values()];
}

/** One polyhedron model (+ its Uzbek texts). */
function polyhedron({ id, name, nameUz, make, V, E, F, facesEn, facesUz, formula, about, aboutUz, color, size = 1.2 }) {
  const rEdge = 0.022 * size;
  const rVert = 0.065 * size;
  const def = {
    id,
    name,
    specs: `V ${V} · E ${E} · F ${F} · V − E + F = 2 · ${formula}`,
    about,
    parts: [
      { name: 'Faces', color, spread: 0.9, edge: 1,
        info: `${F} faces: ${facesEn}. Each face is a flat polygon.`,
        build: () => faceGeos(make) },
      { name: 'Edges', color: C.white, spread: 1.5,
        info: `${E} edges. Every edge is where exactly two faces meet.`,
        build: () => edgeSegments(make).map(([a, b]) => beam(a, b, rEdge, { seg: 6 })) },
      { name: 'Vertices', color: C.yellow, spread: 2.1,
        info: `${V} vertices (corners). Euler’s formula: ${V} − ${E} + ${F} = 2.`,
        build: () => vertexPoints(make).map((p) => sphere(rVert, { p, ws: 10, hs: 8 })) },
    ],
  };
  const uz = {
    name: nameUz,
    specs: `Uchlar ${V} · qirralar ${E} · yoqlar ${F} · Eyler: ${V} − ${E} + ${F} = 2 · ${formula}`,
    about: aboutUz,
    parts: {
      Faces: ['Yoqlar', `${F} ta yoq: ${facesUz}. Har bir yoq — tekis ko‘pburchak.`],
      Edges: ['Qirralar', `${E} ta qirra. Har bir qirrada aynan ikkita yoq tutashadi.`],
      Vertices: ['Uchlar', `${V} ta uch (burchak). Eyler formulasi: ${V} − ${E} + ${F} = 2.`],
    },
  };
  return { def, uz };
}

const POLY = [
  polyhedron({
    id: 'cube', name: 'Cube', nameUz: 'Kub', color: C.cyan,
    make: () => new THREE.BoxGeometry(1.6, 1.6, 1.6), V: 8, E: 12, F: 6,
    facesEn: '6 squares', facesUz: '6 ta kvadrat', formula: 'V = a³ · S = 6a²',
    about: 'A regular hexahedron — one of the five Platonic solids. Dice and salt crystals have this shape.',
    aboutUz: 'Muntazam oltiyoqlik — beshta Platon jismidan biri. O‘yin soqqasi va osh tuzi kristallari shu shaklda.',
  }),
  polyhedron({
    id: 'tetrahedron', name: 'Tetrahedron', nameUz: 'Tetraedr', color: C.magenta,
    make: () => new THREE.TetrahedronGeometry(1.3), V: 4, E: 6, F: 4,
    facesEn: '4 equilateral triangles', facesUz: '4 ta teng tomonli uchburchak', formula: 'V = a³√2⁄12 · S = √3·a²',
    about: 'The simplest polyhedron: four equilateral triangles. A methane molecule (CH₄) has this shape.',
    aboutUz: 'Eng sodda ko‘pyoqlik: to‘rtta teng tomonli uchburchak. Metan molekulasi (CH₄) shu shaklda.',
  }),
  polyhedron({
    id: 'octahedron', name: 'Octahedron', nameUz: 'Oktaedr', color: C.green,
    make: () => new THREE.OctahedronGeometry(1.3), V: 6, E: 12, F: 8,
    facesEn: '8 equilateral triangles', facesUz: '8 ta teng tomonli uchburchak', formula: 'V = a³√2⁄3 · S = 2√3·a²',
    about: 'Like two square pyramids glued base to base. Diamond and fluorite crystals often grow this way.',
    aboutUz: 'Asoslari bilan yopishtirilgan ikki piramidaga o‘xshaydi. Olmos va flyuorit kristallari ko‘pincha shunday o‘sadi.',
  }),
  polyhedron({
    id: 'dodecahedron', name: 'Dodecahedron', nameUz: 'Dodekaedr', color: C.orange,
    make: () => new THREE.DodecahedronGeometry(1.25), V: 20, E: 30, F: 12,
    facesEn: '12 regular pentagons', facesUz: '12 ta muntazam beshburchak', formula: 'V ≈ 7.66·a³ · S ≈ 20.65·a²',
    about: 'Twelve regular pentagons. Plato linked this solid to the shape of the whole cosmos.',
    aboutUz: 'O‘n ikkita muntazam beshburchak. Platon bu jismni butun koinot shakli bilan bog‘lagan.',
  }),
  polyhedron({
    id: 'icosahedron', name: 'Icosahedron', nameUz: 'Ikosaedr', color: C.purple,
    make: () => new THREE.IcosahedronGeometry(1.25), V: 12, E: 30, F: 20,
    facesEn: '20 equilateral triangles', facesUz: '20 ta teng tomonli uchburchak', formula: 'V ≈ 2.18·a³ · S = 5√3·a²',
    about: 'Twenty equilateral triangles — the shape of many virus shells and of the 20-sided die.',
    aboutUz: 'Yigirmata teng tomonli uchburchak — ko‘plab virus qobiqlari va 20 tomonli soqqa shakli.',
  }),
  polyhedron({
    id: 'square-pyramid', name: 'Square Pyramid', nameUz: 'To‘rtburchakli piramida', color: C.yellow,
    make: () => new THREE.ConeGeometry(1.2, 1.6, 4, 1).rotateY(PI / 4), V: 5, E: 8, F: 5,
    facesEn: '1 square base + 4 triangles', facesUz: '1 ta kvadrat asos + 4 ta uchburchak', formula: 'V = ⅓·a²·h',
    about: 'A square base and four triangles meeting at the apex — like the pyramids of Giza.',
    aboutUz: 'Kvadrat asos va cho‘qqida uchrashuvchi to‘rtta uchburchak — Giza piramidalari kabi.',
  }),
  polyhedron({
    id: 'triangular-prism', name: 'Triangular Prism', nameUz: 'Uchburchakli prizma', color: C.teal,
    make: () => new THREE.CylinderGeometry(1, 1, 1.8, 3, 1), V: 6, E: 9, F: 5,
    facesEn: '2 triangles + 3 rectangles', facesUz: '2 ta uchburchak + 3 ta to‘g‘ri to‘rtburchak', formula: 'V = S(asos)·h',
    about: 'Two parallel triangles joined by three rectangles. A glass prism splits white light into a rainbow.',
    aboutUz: 'Uchta to‘g‘ri to‘rtburchak bilan tutashgan ikki parallel uchburchak. Shisha prizma oq nurni kamalakka ajratadi.',
  }),
  polyhedron({
    id: 'hexagonal-prism', name: 'Hexagonal Prism', nameUz: 'Oltiburchakli prizma', color: C.lime,
    make: () => new THREE.CylinderGeometry(1, 1, 1.6, 6, 1), V: 12, E: 18, F: 8,
    facesEn: '2 hexagons + 6 rectangles', facesUz: '2 ta oltiburchak + 6 ta to‘g‘ri to‘rtburchak', formula: 'V = (3√3⁄2)·a²·h',
    about: 'Two hexagons joined by six rectangles — the shape of a pencil and of a honeycomb cell.',
    aboutUz: 'Oltita to‘g‘ri to‘rtburchak bilan tutashgan ikki oltiburchak — qalam va asalari uyasi katakchasi shakli.',
  }),
];

// ---------------------------------------------------------------- round solids
const flatUp = (r, y, o = {}) => disc(r, { p: [0, y, 0], r: [-PI / 2, 0, 0], seg: 48, ...o });

const cylinder = {
  def: {
    id: 'cylinder', name: 'Cylinder',
    specs: 'V = πr²h · S = 2πr(r + h) · 2 bases + 1 curved lateral surface',
    about: 'Two equal parallel circles joined by a curved surface. Cans and pipes are cylinders.',
    parts: [
      { name: 'Lateral surface', color: C.blue, spread: 0, edge: 6,
        info: 'Unrolled, it is a rectangle 2πr wide and h tall, so its area is 2πrh.',
        build: () => cyl(1, 1, 2, { seg: 40, hs: 6, open: true }) },
      { name: 'Top base', color: C.cyan, spread: 0, ex: [0, 1.6, 0], edge: 1,
        info: 'A circle of radius r: area πr².',
        build: () => flatUp(1, 1) },
      { name: 'Bottom base', color: C.cyan, spread: 0, ex: [0, -1.6, 0], edge: 1,
        info: 'Equal and parallel to the top base.',
        build: () => flatUp(1, -1) },
      { name: 'Height (h)', color: C.yellow, spread: 0, ex: [-1.4, 0, 0],
        info: 'The distance between the bases, along the axis.',
        build: () => beam([0, -1, 0], [0, 1, 0], 0.03) },
      { name: 'Radius (r)', color: C.red, spread: 0, ex: [1.4, 1.0, 0],
        info: 'From the centre of a base to its edge.',
        build: () => beam([0, 1, 0], [1, 1, 0], 0.03) },
    ],
  },
  uz: {
    name: 'Silindr',
    specs: 'V = πr²h · S = 2πr(r + h) · 2 ta asos + 1 ta egri yon sirt',
    about: 'Egri sirt bilan tutashgan ikki teng parallel doira. Konserva bankasi va quvurlar silindr shaklida.',
    parts: {
      'Lateral surface': ['Yon sirt', 'Yoyilsa, eni 2πr va bo‘yi h bo‘lgan to‘g‘ri to‘rtburchak bo‘ladi, shuning uchun yuzi 2πrh.'],
      'Top base': ['Yuqori asos', 'Radiusi r bo‘lgan doira: yuzi πr².'],
      'Bottom base': ['Pastki asos', 'Yuqori asosga teng va parallel.'],
      'Height (h)': ['Balandlik (h)', 'Asoslar orasidagi o‘q bo‘ylab masofa.'],
      'Radius (r)': ['Radius (r)', 'Asos markazidan uning chetigacha bo‘lgan masofa.'],
    },
  },
};

const cone = {
  def: {
    id: 'cone', name: 'Cone',
    specs: 'V = ⅓πr²h · S = πr(r + l) · l = √(r² + h²)',
    about: 'A circular base narrowing to a single point. An ice-cream cone or a traffic cone.',
    parts: [
      { name: 'Lateral surface', color: C.pink, spread: 0, ex: [0, 0.6, 0], edge: 6,
        info: 'Unrolled, it is a circular sector; its area is πrl.',
        build: () => cyl(0, 1.1, 2, { seg: 40, hs: 6, open: true }) },
      { name: 'Base', color: C.magenta, spread: 0, ex: [0, -1.6, 0], edge: 1,
        info: 'A circle of area πr².',
        build: () => flatUp(1.1, -1) },
      { name: 'Apex', color: C.yellow, spread: 0, ex: [0, 1.6, 0],
        info: 'The single vertex of a cone, where the lateral surface ends.',
        build: () => sphere(0.08, { p: [0, 1, 0], ws: 12, hs: 8 }) },
      { name: 'Height (h)', color: C.white, spread: 0, ex: [-1.4, 0, 0],
        info: 'From the apex straight down to the centre of the base.',
        build: () => beam([0, -1, 0], [0, 1, 0], 0.03) },
      { name: 'Slant height (l)', color: C.lime, spread: 0, ex: [1.4, 0.2, 0],
        info: 'From the apex to the edge of the base: l² = r² + h² (Pythagoras).',
        build: () => beam([1.1, -1, 0], [0, 1, 0], 0.03) },
    ],
  },
  uz: {
    name: 'Konus',
    specs: 'V = ⅓πr²h · S = πr(r + l) · l = √(r² + h²)',
    about: 'Bitta nuqtaga torayib boruvchi doiraviy asos. Muzqaymoq vaflisi yoki yo‘l konusi kabi.',
    parts: {
      'Lateral surface': ['Yon sirt', 'Yoyilsa, doiraviy sektor bo‘ladi; yuzi πrl.'],
      Base: ['Asos', 'Yuzi πr² bo‘lgan doira.'],
      Apex: ['Uch (cho‘qqi)', 'Konusning yagona uchi — yon sirt shu yerda tugaydi.'],
      'Height (h)': ['Balandlik (h)', 'Uchdan asos markaziga tik tushirilgan masofa.'],
      'Slant height (l)': ['Yasovchi (l)', 'Uchdan asos chetigacha: l² = r² + h² (Pifagor teoremasi).'],
    },
  },
};

const ball = {
  def: {
    id: 'sphere', name: 'Sphere',
    specs: 'V = 4⁄3·πr³ · S = 4πr²',
    about: 'Every point of the surface is the same distance from the centre. It has the least surface area for a given volume — that is why bubbles are round.',
    parts: [
      { name: 'Northern hemisphere', color: C.blue, spread: 0, ex: [0, 1.4, 0], edge: 6,
        info: 'Half of a sphere: area 2πr², volume ⅔πr³.',
        build: () => sphere(1.2, { ws: 32, hs: 10, theta: [0, PI / 2] }) },
      { name: 'Southern hemisphere', color: C.cyan, spread: 0, ex: [0, -1.4, 0], edge: 6,
        info: 'The other half; together they make the whole sphere.',
        build: () => sphere(1.2, { ws: 32, hs: 10, theta: [PI / 2, PI / 2] }) },
      { name: 'Great circle', color: C.yellow, spread: 0, ex: [1.6, 0, 0],
        info: 'The largest circle on a sphere (like the equator); its length is 2πr.',
        build: () => torus(1.2, 0.02, { r: [PI / 2, 0, 0], rs: 4, ts: 64 }) },
      { name: 'Centre & radius', color: C.red, spread: 0, ex: [-1.6, 0, 0],
        info: 'Every point of the sphere is exactly r away from the centre.',
        build: () => [sphere(0.07, { ws: 10, hs: 8 }), beam([0, 0, 0], [1.2, 0, 0], 0.025)] },
    ],
  },
  uz: {
    name: 'Shar (sfera)',
    specs: 'V = 4⁄3·πr³ · S = 4πr²',
    about: 'Sirtining har bir nuqtasi markazdan bir xil masofada. Berilgan hajm uchun eng kichik sirtga ega — shuning uchun pufakchalar yumaloq.',
    parts: {
      'Northern hemisphere': ['Yuqori yarim shar', 'Sharning yarmi: sirt yuzi 2πr², hajmi ⅔πr³.'],
      'Southern hemisphere': ['Pastki yarim shar', 'Ikkinchi yarmi; ikkalasi birga butun sharni hosil qiladi.'],
      'Great circle': ['Katta aylana', 'Shardagi eng katta aylana (ekvator kabi); uzunligi 2πr.'],
      'Centre & radius': ['Markaz va radius', 'Sharning har bir nuqtasi markazdan aynan r masofada.'],
    },
  },
};

const ring = {
  def: {
    id: 'torus', name: 'Torus',
    specs: 'V = 2π²Rr² · S = 4π²Rr · genus 1 (one hole)',
    about: 'A circle swept around an axis — a doughnut. Because it has one hole, V − E + F = 0 for any mesh drawn on it.',
    parts: [
      { name: 'Torus surface', color: C.orange, spread: 1.2, edge: 6,
        info: 'Shown as two halves; its area equals a cylinder of length 2πR and radius r.',
        build: () => [torus(1.15, 0.42, { arc: PI, rs: 16, ts: 24 }), torus(1.15, 0.42, { arc: PI, r: [0, 0, PI], rs: 16, ts: 24 })] },
      { name: 'Centre circle (R)', color: C.yellow, spread: 0, ex: [0, 0, 1.4],
        info: 'The path traced by the centre of the tube; its radius is R.',
        build: () => torus(1.15, 0.018, { rs: 4, ts: 64 }) },
      { name: 'Tube circle (r)', color: C.lime, spread: 0, ex: [1.4, 0, 0.6],
        info: 'The small circle that is swept around; its radius is r.',
        build: () => torus(0.42, 0.018, { p: [1.15, 0, 0], r: [PI / 2, 0, 0], rs: 4, ts: 40 }) },
    ],
  },
  uz: {
    name: 'Tor',
    specs: 'V = 2π²Rr² · S = 4π²Rr · bitta teshik (jins 1)',
    about: 'O‘q atrofida aylantirilgan aylana — pishiriq (donut) shakli. Bitta teshigi borligi uchun unda V − E + F = 0.',
    parts: {
      'Torus surface': ['Tor sirti', 'Ikki yarmi ko‘rsatilgan; sirt yuzi uzunligi 2πR va radiusi r bo‘lgan silindr yuziga teng.'],
      'Centre circle (R)': ['Markaziy aylana (R)', 'Naycha markazi chizadigan aylana; radiusi R.'],
      'Tube circle (r)': ['Naycha aylanasi (r)', 'O‘q atrofida aylantiriladigan kichik aylana; radiusi r.'],
    },
  },
};

const ALL = [...POLY, cylinder, cone, ball, ring];

export const GEOMETRY_MODELS = ALL.map((m) => m.def);
export const GEOMETRY_UZ = Object.fromEntries(ALL.map((m) => [m.def.id, m.uz]));
