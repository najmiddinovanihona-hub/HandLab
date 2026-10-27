// BIOLOGY: animal cell, DNA double helix.
import { C, PI, merge, cyl, sphere, torus, capsule, tube, beam, helixPoints, rng } from './primitives.js';

// Animal cell: 1 unit ~ 10 µm.
const R = rng(42);
const around = (rMin, rMax) => {
  const u = R() * 2 - 1;
  const a = R() * PI * 2;
  const r = rMin + R() * (rMax - rMin);
  const s = Math.sqrt(1 - u * u);
  return [r * s * Math.cos(a), r * u, r * s * Math.sin(a)];
};
const MITO = Array.from({ length: 6 }, () => ({ p: around(1.15, 1.55), r: [R() * PI, R() * PI, 0] }));
const LYSO = Array.from({ length: 4 }, () => around(1.0, 1.6));
const RIBO = Array.from({ length: 140 }, () => around(0.9, 1.85));

export const animalCell = {
  id: 'animal-cell',
  name: 'Animal Cell',
  specs: '~20 µm across · ~37 trillion in a human body · ~42 million proteins each',
  about: 'The basic unit of life: a membrane bag of organelles, each with its own job, run by instructions in the nucleus.',
  parts: [
    { name: 'Cell membrane', color: C.cyan, spread: 2.2, edge: 6,
      info: 'A double layer of fat molecules that decides what enters and leaves the cell.',
      build: () => [
        sphere(2, { ws: 14, hs: 18, phi: [-PI / 2, PI] }),
        sphere(2, { ws: 14, hs: 18, phi: [PI / 2, PI] }),
      ] },
    { name: 'Nucleus', color: C.magenta, spread: 0, ex: [0, 0.4, 0.9], edge: 8,
      info: 'Holds the DNA — about 2 m of it, folded into a space 6 µm wide.',
      build: () => sphere(0.7, { p: [0.1, 0.1, 0], ws: 18, hs: 12 }) },
    { name: 'Nucleolus', color: C.pink, spread: 0, ex: [0.8, 1.1, 1.3],
      info: 'Factory inside the nucleus that builds the parts of ribosomes.',
      build: () => sphere(0.24, { p: [0.28, 0.22, 0.15], ws: 12, hs: 8 }) },
    { name: 'Mitochondria', color: C.orange, spread: 1.0,
      info: 'Power stations: they burn sugar with oxygen to make ATP, the cell’s energy currency.',
      build: () => MITO.map((m) => merge(capsule(0.14, 0.42, { p: m.p, r: m.r }), torus(0.1, 0.012, { p: m.p, r: m.r, rs: 4, ts: 12 }))) },
    { name: 'Rough endoplasmic reticulum', color: C.yellow, spread: 0.6, ex: [-0.6, 0.3, 0],
      info: 'Folded membranes studded with ribosomes, where proteins are made and folded.',
      build: () => merge([0, 1, 2, 3].map((i) => torus(0.92 + i * 0.12, 0.025, { arc: PI * 0.9, p: [0.1, 0.1, 0], r: [0.3 + i * 0.15, 0.2, PI * 0.9], s: [1, 1, 3], rs: 4, ts: 30 }))) },
    { name: 'Smooth endoplasmic reticulum', color: C.lime, spread: 0.8,
      info: 'Tubes without ribosomes that make fats and break down toxins.',
      build: () => tube([[-0.4, -0.9, 0.9], [-0.9, -0.6, 0.6], [-1.1, -1.0, 0.1], [-0.6, -1.3, -0.3], [-1.0, -1.1, -0.8]], 0.06, { segments: 60 }) },
    { name: 'Golgi apparatus', color: C.green, spread: 0.9,
      info: 'The post office: it packages proteins and sends them where they are needed.',
      build: () => merge([0, 1, 2, 3, 4].map((i) => sphere(0.5 - i * 0.03, { theta: [0, 0.75], s: [1, 0.3, 0.7], p: [-1.15, 0.55 - i * 0.09, 0.45], r: [0, 0, 0.5], ws: 18, hs: 4 }))) },
    { name: 'Lysosomes', color: C.red, spread: 1.1,
      info: 'Bags of digestive enzymes that recycle worn-out parts of the cell.',
      build: () => LYSO.map((p) => sphere(0.12, { p, ws: 10, hs: 8 })) },
    { name: 'Ribosomes', color: C.white, spread: 0.4,
      info: 'Tiny machines that read RNA and join amino acids into proteins.',
      build: () => merge(RIBO.map((p) => sphere(0.025, { p, ws: 5, hs: 4 }))) },
    { name: 'Centrioles', color: C.purple, spread: 1.0,
      info: 'Two short tubes at right angles that organise the cell when it divides.',
      build: () => merge(cyl(0.06, 0.06, 0.3, { p: [0.9, -0.9, 0.6], seg: 9 }), cyl(0.06, 0.06, 0.3, { p: [0.9, -0.75, 0.6], r: [0, 0, PI / 2], seg: 9 })) },
    { name: 'Vacuole', color: C.teal, spread: 1.0,
      info: 'Storage bubble for water, food or waste — small in animal cells, huge in plant cells.',
      build: () => sphere(0.3, { p: [-0.8, 0.95, -0.7], ws: 12, hs: 10 }) },
  ],
};

// DNA: 1 unit ~ 1 nm. B-DNA: 2 nm wide, 10.5 base pairs per turn, 3.4 nm per turn.
const TURNS = 2.5;
const HEIGHT = 3.4 * TURNS;
const RADIUS = 1.0;
const MINOR_GROOVE = PI * 0.75; // the second strand is offset by ~135°, not 180°
const PAIRS = Math.round(10.5 * TURNS);
const strandPoint = (t, phase) => {
  const a = phase + t * TURNS * PI * 2;
  return [Math.cos(a) * RADIUS, -HEIGHT / 2 + t * HEIGHT, Math.sin(a) * RADIUS];
};
const SEQ = 'ATGCGTACGTTAGCCATGGATCCGA';
const rungs = (types) =>
  Array.from({ length: PAIRS }, (_, i) => i)
    .filter((i) => types.includes(SEQ[i % SEQ.length]))
    .map((i) => {
      const t = (i + 0.5) / PAIRS;
      return beam(strandPoint(t, 0), strandPoint(t, MINOR_GROOVE), 0.07, { seg: 6 });
    });
const strand = (phase) =>
  merge(
    tube(helixPoints(RADIUS, HEIGHT, TURNS, { y0: -HEIGHT / 2, phase }), 0.09, { segments: 200, rs: 6 }),
    Array.from({ length: PAIRS }, (_, i) => sphere(0.14, { p: strandPoint((i + 0.5) / PAIRS, phase), ws: 6, hs: 4 }))
  );

export const dna = {
  id: 'dna',
  name: 'DNA Double Helix',
  specs: '2 nm wide · 10.5 base pairs per turn · 3.2 billion base pairs in the human genome',
  about: 'Two strands twisted together; the order of the four bases (A, T, G, C) spells out the genetic code.',
  parts: [
    { name: 'Sugar–phosphate backbone 1', color: C.cyan, spread: 0, ex: [-1.4, 0, 0],
      info: 'Alternating sugar (deoxyribose) and phosphate groups; the phosphates make DNA negatively charged.',
      build: () => strand(0) },
    { name: 'Sugar–phosphate backbone 2', color: C.blue, spread: 0, ex: [1.4, 0, 0],
      info: 'Runs in the opposite direction to strand 1 (the strands are antiparallel).',
      build: () => strand(MINOR_GROOVE) },
    { name: 'A–T base pairs', color: C.magenta, spread: 0.25,
      info: 'Adenine always pairs with thymine, held by two hydrogen bonds.',
      build: () => rungs('AT') },
    { name: 'G–C base pairs', color: C.lime, spread: 0.25,
      info: 'Guanine pairs with cytosine through three hydrogen bonds — a slightly stronger link.',
      build: () => rungs('GC') },
  ],
};
