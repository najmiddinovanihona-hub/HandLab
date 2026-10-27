// SPACE: Earth's interior, Saturn V rocket.
import { C, PI, merge, box, cyl, sphere, lathe, beam } from './primitives.js';

// Hemispheres split along x: phi in [-pi/2, pi/2] gives the x <= 0 half (three.js sphere
// parametrisation x = -r cos(phi) sin(theta)).
const halves = (r, o = {}) => [
  sphere(r, { ws: 14, hs: 18, ...o, phi: [-PI / 2, PI] }),
  sphere(r, { ws: 14, hs: 18, ...o, phi: [PI / 2, PI] }),
];

export const earth = {
  id: 'earth',
  name: 'Earth Interior',
  specs: 'Radius 6,371 km · mass 5.97 × 10²⁴ kg · 4.5 billion years old',
  about: 'Open your hand and the shells split like a clam — crust, mantle, liquid outer core and the solid inner core.',
  parts: [
    { name: 'Atmosphere', color: C.blue, spread: 3.4, edge: 6, mat: 'glass',
      info: '78 % nitrogen, 21 % oxygen. Half of all air lies below 5.5 km.',
      build: () => halves(1.12) },
    { name: 'Crust', color: C.green, spread: 2.4, edge: 6, map: 'https://cdn.jsdelivr.net/gh/mrdoob/three.js@r160/examples/textures/planets/earth_atmos_2048.jpg',
      info: '5–70 km of solid rock, broken into tectonic plates that drift a few cm per year.',
      build: () => halves(1.0, { uv: true, ws: 32, hs: 32 }) },
    { name: 'Mantle', color: C.orange, spread: 1.5, edge: 6,
      info: '2,900 km of hot rock that flows like very thick toffee; its convection moves the plates.',
      build: () => halves(0.9, { ws: 12, hs: 16 }) },
    { name: 'Outer core', color: C.yellow, spread: 0.8, edge: 6,
      info: 'Liquid iron and nickel at 4,000–6,000 °C. Its swirling creates Earth’s magnetic field.',
      build: () => halves(0.546, { ws: 10, hs: 12 }) },
    { name: 'Inner core', color: C.white, spread: 0, edge: 6,
      info: 'A solid iron ball as hot as the Sun’s surface, kept solid by 3.6 million times air pressure.',
      build: () => sphere(0.19, { ws: 12, hs: 10 }) },
  ],
};

// Saturn V: 1 unit = 10 m, y up. Total height 110.6 m.
const bell = (s, x, y, z) => lathe([[0.04 * s, 0.6 * s], [0.08 * s, 0.45 * s], [0.15 * s, 0.22 * s], [0.24 * s, 0]], { p: [x, y, z], seg: 16 });
const RING5 = [[0, 0], [0.26, 0.26], [-0.26, 0.26], [0.26, -0.26], [-0.26, -0.26]];

export const saturnV = {
  id: 'saturn-v',
  name: 'Saturn V',
  specs: '110.6 m tall · 10.1 m diameter · 2,970 t at launch · 3 stages',
  about: 'The rocket that sent Apollo astronauts to the Moon (1967–1973). Each stage drops away when its fuel runs out.',
  parts: [
    { name: 'F-1 engines (×5)', color: C.orange, spread: 0.5, ex: [0, -1.6, 0],
      info: 'Five F-1s made 34 MN of thrust — still the most powerful single-chamber rocket engines flown.',
      build: () => RING5.map(([x, z]) => bell(1.2, x, -0.72, z)) },
    { name: 'First stage (S-IC)', color: C.cyan, spread: 0.3, ex: [0, -0.9, 0], edge: 10,
      info: 'Burned 2,100 t of kerosene and liquid oxygen in 2.5 minutes, lifting the rocket to 67 km.',
      build: () => merge(
        cyl(0.5, 0.5, 4.2, { p: [0, 2.1, 0], seg: 24, hs: 6, open: true }),
        [0, 1, 2, 3].map((k) => box(0.04, 0.6, 0.35, { p: [Math.cos((k * PI) / 2 + PI / 4) * 0.6, 0.3, Math.sin((k * PI) / 2 + PI / 4) * 0.6], r: [0, -(k * PI) / 2 - PI / 4, 0] }))
      ) },
    { name: 'Kerosene & LOX tanks', color: C.yellow, spread: 0.3, ex: [1.4, -0.6, 0],
      info: 'The upper tank held liquid oxygen at −183 °C, the lower one RP-1 kerosene.',
      build: () => merge(cyl(0.42, 0.42, 1.6, { p: [0, 1.1, 0], seg: 16 }), cyl(0.42, 0.42, 1.9, { p: [0, 3.0, 0], seg: 16 })) },
    { name: 'Second stage (S-II)', color: C.blue, spread: 0.3, edge: 10,
      info: 'Five J-2 engines burned liquid hydrogen for 6 minutes to reach almost orbital speed.',
      build: () => merge(cyl(0.5, 0.5, 0.3, { p: [0, 4.35, 0], seg: 24, open: true }), cyl(0.5, 0.5, 2.5, { p: [0, 5.75, 0], seg: 24, hs: 4, open: true })) },
    { name: 'J-2 engines (S-II)', color: C.lime, spread: 0.3, ex: [-1.4, -0.3, 0],
      info: 'Hydrogen-fuelled and restartable — a first for a large rocket engine.',
      build: () => merge(RING5.map(([x, z]) => bell(0.6, x * 0.7, 4.2, z * 0.7))) },
    { name: 'Third stage (S-IVB)', color: C.purple, spread: 0.3, edge: 10,
      info: 'Fired twice: once to reach orbit, then again to send Apollo on its way to the Moon.',
      build: () => merge(cyl(0.33, 0.5, 0.4, { p: [0, 7.2, 0], seg: 24, open: true }), cyl(0.33, 0.33, 1.6, { p: [0, 8.2, 0], seg: 20, hs: 3, open: true }), bell(0.5, 0, 7.05, 0)) },
    { name: 'Instrument unit', color: C.white, spread: 0.3, ex: [1.2, 0, 0],
      info: 'The rocket’s brain: a ring of computers and gyroscopes that steered all three stages.',
      build: () => cyl(0.33, 0.33, 0.1, { p: [0, 9.05, 0], seg: 24, open: true }) },
    { name: 'Lunar module', color: C.yellow, spread: 0.3, ex: [-1.6, 0.3, 0],
      info: 'Rode folded inside the adapter; it landed two astronauts on the Moon.',
      build: () => merge(
        box(0.22, 0.16, 0.22, { p: [0, 9.5, 0] }),
        box(0.16, 0.14, 0.16, { p: [0, 9.66, 0], r: [0, PI / 4, 0] }),
        [0, 1, 2, 3].map((k) => beam([0, 9.45, 0], [Math.cos((k * PI) / 2) * 0.22, 9.32, Math.sin((k * PI) / 2) * 0.22], 0.01))
      ) },
    { name: 'Lunar module adapter', color: C.cyan, spread: 0.3, edge: 10,
      info: 'Four panels that opened like petals in space to release the lunar module.',
      build: () => cyl(0.26, 0.33, 0.8, { p: [0, 9.5, 0], seg: 20, hs: 2, open: true }) },
    { name: 'Service module', color: C.blue, spread: 0.3, ex: [1.2, 0.3, 0],
      info: 'Power, oxygen and the main engine that put Apollo into lunar orbit and brought it home.',
      build: () => merge(cyl(0.26, 0.26, 0.55, { p: [0, 10.18, 0], seg: 20 }), bell(0.4, 0, 9.85, 0)) },
    { name: 'Command module', color: C.magenta, spread: 0.3, ex: [0, 0.4, 0],
      info: 'The only part that came back: three astronauts in a capsule 3.9 m wide with a heat shield.',
      build: () => cyl(0.05, 0.26, 0.35, { p: [0, 10.63, 0], seg: 20 }) },
    { name: 'Launch escape tower', color: C.red, spread: 0.3, ex: [0, 0.6, 0],
      info: 'A small rocket that could yank the capsule away from an exploding launcher.',
      build: () => merge(
        [0, 1, 2, 3].map((k) => beam([Math.cos((k * PI) / 2) * 0.08, 10.8, Math.sin((k * PI) / 2) * 0.08], [0, 11.25, 0], 0.008)),
        cyl(0.04, 0.04, 0.7, { p: [0, 11.6, 0], seg: 8 }),
        cyl(0, 0.04, 0.12, { p: [0, 12.01, 0], seg: 8 })
      ) },
  ],
};
