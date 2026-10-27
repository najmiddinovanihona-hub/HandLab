// ANATOMY: human eye, lungs & ribcage.
import { C, PI, merge, cyl, sphere, torus, tube, ring, disc, beam, rng } from './primitives.js';

// Eye: 1 unit ~ 12 mm (eyeball radius). Looking toward +z (the camera).
export const humanEye = {
  id: 'human-eye',
  name: 'Human Eye',
  specs: '24 mm diameter · 7.5 g · 120 million rods · 6 million cones',
  about: 'A camera made of living tissue: cornea and lens focus light onto the retina, which turns it into nerve signals.',
  parts: [
    { name: 'Sclera', color: C.white, spread: 2.2, edge: 6,
      info: 'The tough white outer coat that keeps the eyeball’s shape.',
      build: () => [
        sphere(1, { ws: 14, hs: 16, phi: [0, PI], theta: [0.42, PI - 0.42], r: [PI / 2, 0, 0] }),
        sphere(1, { ws: 14, hs: 16, phi: [PI, PI], theta: [0.42, PI - 0.42], r: [PI / 2, 0, 0] }),
      ] },
    { name: 'Cornea', color: C.cyan, spread: 0, ex: [0, 0, 2.4], edge: 6,
      info: 'The clear front window; it does about two-thirds of the eye’s focusing.',
      build: () => sphere(0.45, { ws: 18, hs: 6, theta: [0, 0.95], r: [PI / 2, 0, 0], p: [0, 0, 0.6] }) },
    { name: 'Iris', color: C.blue, spread: 0, ex: [0, 0, 1.8],
      info: 'A ring of muscle that widens or narrows the pupil; its pattern is unique to you.',
      build: () => ring(0.13, 0.38, { p: [0, 0, 0.84], seg: 36 }) },
    { name: 'Pupil', color: C.purple, spread: 0, ex: [0, 0.3, 2.1],
      info: 'The opening in the iris: 2 mm in bright light, up to 8 mm in the dark.',
      build: () => disc(0.13, { p: [0, 0, 0.85], seg: 24 }) },
    { name: 'Lens', color: C.yellow, spread: 0, ex: [0, 0, 1.3],
      info: 'Changes shape to focus near or far (accommodation); it stiffens with age.',
      build: () => sphere(0.3, { s: [1, 1, 0.42], p: [0, 0, 0.66], ws: 18, hs: 10 }) },
    { name: 'Ciliary muscle', color: C.lime, spread: 0, ex: [0, 0, 0.9],
      info: 'Ring of muscle that pulls on the lens to change its focus.',
      build: () => torus(0.4, 0.045, { p: [0, 0, 0.66], rs: 6, ts: 32 }) },
    { name: 'Vitreous humour', color: C.teal, spread: 0, ex: [0, 0, 0], edge: 8,
      info: 'Clear jelly filling 80 % of the eye’s volume and holding the retina in place.',
      build: () => sphere(0.86, { p: [0, 0, -0.05], ws: 14, hs: 10 }) },
    { name: 'Retina', color: C.red, spread: 0, ex: [0, 0, -1.4], edge: 6,
      info: 'Light-sensitive layer of rods (dim light) and cones (colour) lining the back of the eye.',
      build: () => sphere(0.93, { ws: 20, hs: 8, theta: [0, 1.6], r: [-PI / 2, 0, 0] }) },
    { name: 'Optic nerve', color: C.orange, spread: 0, ex: [0, 0, -2.2],
      info: 'About 1.2 million nerve fibres carry the image to the brain. Where it leaves is your blind spot.',
      build: () => beam([0.05, -0.02, -0.92], [0.15, -0.08, -1.9], 0.12, { seg: 12 }) },
    { name: 'Eye muscles', color: C.pink, spread: 1.2,
      info: 'Six muscles move the eye; four of the straight (rectus) muscles are shown.',
      build: () => [[0, 1], [0, -1], [1, 0], [-1, 0]].map(([dx, dy]) =>
        beam([0.2 * dx, 0.2 * dy, -1.7], [0.97 * dx, 0.97 * dy, 0.15], 0.06, { rt: 0.09, seg: 6 })) },
  ],
};

// Lungs: 1 unit ~ 12 cm. y up, z toward the viewer (front of the body).
function bronchiTree(side) {
  const random = rng(side > 0 ? 11 : 23);
  const tubes = [];
  const grow = (from, dir, len, r, depth) => {
    const to = [from[0] + dir[0] * len, from[1] + dir[1] * len, from[2] + dir[2] * len];
    tubes.push(tube([from, to], r, { segments: 2, rs: 5 }));
    if (depth === 0) return;
    for (const turn of [-1, 1]) {
      const nd = [dir[0] + turn * 0.5 * side * (0.6 + random() * 0.6), dir[1] - 0.25 + random() * 0.3, dir[2] + (random() - 0.5) * 0.9];
      const n = Math.hypot(...nd);
      grow(to, nd.map((v) => v / n), len * 0.72, r * 0.7, depth - 1);
    }
  };
  grow([0.45 * side, 0.7, 0], [0.35 * side, -0.94, 0], 0.4, 0.03, 3);
  return merge(tubes);
}

export const lungs = {
  id: 'lungs',
  name: 'Lungs & Ribcage',
  specs: '~6 L total capacity · 480 million alveoli · ~70 m² gas-exchange surface',
  about: 'Air flows down the trachea into branching bronchi; oxygen crosses into the blood in tiny air sacs.',
  parts: [
    { name: 'Trachea', color: C.cyan, spread: 0.4, ex: [0, 1.0, 0.4],
      info: 'The windpipe, held open by 16–20 C-shaped rings of cartilage.',
      build: () => merge(
        cyl(0.12, 0.12, 1.0, { p: [0, 1.6, 0], seg: 14, open: true }),
        [0, 1, 2, 3, 4, 5, 6, 7].map((i) => torus(0.13, 0.018, { p: [0, 1.17 + i * 0.12, 0], r: [PI / 2, 0, 0], rs: 4, ts: 20 }))
      ) },
    { name: 'Bronchi', color: C.yellow, spread: 0.4, ex: [0, 0.6, 0.9],
      info: 'The trachea splits into a left and right bronchus — the right one is wider and steeper.',
      build: () => merge(tube([[0, 1.12, 0], [-0.25, 0.95, 0], [-0.45, 0.72, 0]], 0.07), tube([[0, 1.12, 0], [0.25, 0.97, 0], [0.45, 0.72, 0]], 0.065)) },
    { name: 'Bronchioles', color: C.lime, spread: 0.6, ex: [0, 0.2, 1.2],
      info: 'Each lung branches about 23 times, ending in grape-like clusters of alveoli.',
      build: () => [bronchiTree(-1), bronchiTree(1)] },
    { name: 'Right lung', color: C.pink, spread: 1.4, edge: 8,
      info: 'Three lobes, slightly larger than the left lung.',
      build: () => sphere(1, { s: [0.62, 1.25, 0.62], p: [-0.66, 0.25, 0], ws: 18, hs: 14 }) },
    { name: 'Left lung', color: C.magenta, spread: 1.4, edge: 8,
      info: 'Two lobes, with a notch that makes room for the heart.',
      build: () => sphere(1, { s: [0.56, 1.2, 0.6], p: [0.68, 0.22, 0], ws: 18, hs: 14 }) },
    { name: 'Heart', color: C.red, spread: 0, ex: [0, -0.3, 1.6],
      info: 'Sits between the lungs, pumping blood through them to pick up oxygen ~100,000 times a day.',
      build: () => merge(sphere(0.34, { s: [1, 1.15, 0.9], p: [0.18, -0.15, 0.3], ws: 16, hs: 12 }), torus(0.16, 0.05, { p: [0.1, 0.3, 0.15], arc: PI, rs: 6, ts: 16 })) },
    { name: 'Diaphragm', color: C.orange, spread: 0, ex: [0, -1.2, 0], edge: 8,
      info: 'Dome-shaped muscle: when it contracts and flattens, air is pulled into the lungs.',
      build: () => sphere(1.25, { theta: [0, 0.8], s: [1, 0.45, 0.75], p: [0, -1.55, 0], ws: 24, hs: 6 }) },
    { name: 'Ribs (×6 pairs)', color: C.white, spread: 0.15, ex: [0, 0, 1.6],
      info: 'Twelve pairs in total; they swing up and out when you breathe in, enlarging the chest.',
      build: () => [0, 1, 2, 3, 4, 5].map((i) => {
        const R = 0.9 + i * 0.06;
        return torus(R, 0.025, { arc: PI * 1.75, r: [PI / 2, 0, PI * 0.625], s: [1, 0.72, 1], p: [0, 1.0 - i * 0.33, -0.05], rs: 4, ts: 40 });
      }) },
    { name: 'Spine (thoracic vertebrae)', color: C.purple, spread: 0, ex: [0, 0, -1.6],
      info: 'Twelve thoracic vertebrae anchor the ribs at the back.',
      build: () => merge(Array.from({ length: 10 }, (_, i) => cyl(0.09, 0.09, 0.14, { p: [0, 1.3 - i * 0.28, -0.72], seg: 10 }))) },
  ],
};
