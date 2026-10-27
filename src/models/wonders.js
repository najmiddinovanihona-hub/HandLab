// WONDERS: Great Pyramid of Giza, Eiffel Tower.
import { C, PI, merge, box, cyl, torus, slab, beam } from './primitives.js';

// Pyramid: 1 unit = 100 m. Base 230 m, height 146.6 m. x = north (passages run north-south).
// Chambers and passages are drawn ~3x larger than real so they are visible.
const pyramid4 = (halfBase, h, y0, o = {}) =>
  cyl(0, halfBase * Math.SQRT2, h, { seg: 4, hs: o.hs ?? 1, p: [0, y0 + h / 2, 0], r: [0, PI / 4, 0], open: o.open });

export const greatPyramid = {
  id: 'great-pyramid',
  name: 'Great Pyramid of Giza',
  specs: '230 × 230 m base · 146.6 m original height · ~2.3 million blocks · c. 2560 BC',
  about: 'Tomb of pharaoh Khufu and the only one of the Seven Wonders of the Ancient World still standing.',
  parts: [
    { name: 'Outer casing', color: C.yellow, spread: 0, ex: [0, 1.4, 0],
      info: 'Polished white limestone once made the pyramid shine; most was later reused in Cairo.',
      build: () => pyramid4(1.15, 1.42, 0, { open: true }) },
    { name: 'Pyramidion (capstone)', color: C.orange, spread: 0, ex: [0, 2.4, 0],
      info: 'The missing top stone, possibly covered in gold or electrum.',
      build: () => pyramid4(0.09, 0.12, 1.42) },
    { name: 'Core masonry', color: C.white, spread: 0, ex: [0, 0.5, 0], edge: 10,
      info: 'Rough local limestone blocks averaging 2.5 tonnes each, laid in ~210 courses.',
      build: () => merge([0, 1, 2, 3, 4, 5].map((i) => box(2.1 - i * 0.33, 0.2, 2.1 - i * 0.33, { p: [0, 0.1 + i * 0.22, 0] }))) },
    { name: 'King’s Chamber', color: C.red, spread: 0, ex: [0.3, 0.6, 1.6],
      info: 'Built of red Aswan granite; it holds Khufu’s empty granite sarcophagus.',
      build: () => merge(box(0.3, 0.17, 0.16, { p: [-0.02, 0.47, 0] }), box(0.09, 0.04, 0.04, { p: [-0.08, 0.41, 0] })) },
    { name: 'Relieving chambers', color: C.magenta, spread: 0, ex: [0.3, 1.2, 1.6],
      info: 'Five stacked voids above the King’s Chamber that spread the weight of the stone above.',
      build: () => merge([0, 1, 2, 3, 4].map((i) => box(0.3, 0.015, 0.16, { p: [-0.02, 0.6 + i * 0.045, 0] }))) },
    { name: 'Queen’s Chamber', color: C.pink, spread: 0, ex: [0.3, 0, 1.6],
      info: 'Misnamed by early explorers — it was never a queen’s burial room.',
      build: () => box(0.17, 0.14, 0.18, { p: [0, 0.24, 0] }) },
    { name: 'Grand Gallery', color: C.cyan, spread: 0, ex: [1.2, 0.5, 1.0],
      info: '47 m long and 8.6 m high with a corbelled roof — an engineering marvel.',
      build: () => slab([0.28, 0.22], [-0.02, 0.43], 0.08, 0.16) },
    { name: 'Ascending passage', color: C.blue, spread: 0, ex: [1.4, 0, 1.0],
      info: 'Still blocked by three granite plugs slid down from the Grand Gallery.',
      build: () => slab([0.62, 0.02], [0.28, 0.22], 0.05, 0.05) },
    { name: 'Descending passage', color: C.green, spread: 0, ex: [1.6, -0.4, 1.0],
      info: 'Runs 105 m from the entrance on the north face down into the bedrock.',
      build: () => slab([0.82, 0.17], [0.05, -0.3], 0.05, 0.05) },
    { name: 'Subterranean chamber', color: C.lime, spread: 0, ex: [0, -1.0, 1.4],
      info: 'Cut into the bedrock 30 m below the base and left unfinished.',
      build: () => box(0.3, 0.08, 0.15, { p: [-0.05, -0.32, 0] }) },
    { name: 'Air shafts', color: C.teal, spread: 0, ex: [0, 0.8, -1.4],
      info: 'Narrow shafts aimed at stars such as Orion’s Belt — perhaps for the king’s soul to rise.',
      build: () => merge(slab([0.12, 0.5], [0.72, 0.85], 0.02, 0.02), slab([-0.17, 0.5], [-0.75, 0.82], 0.02, 0.02)) },
    { name: 'Giza plateau', color: C.purple, spread: 0, ex: [0, -1.6, 0], edge: 1,
      info: 'A level limestone bedrock platform — levelled to within 2 cm over the whole base.',
      build: () => box(3.0, 0.04, 3.0, { p: [0, -0.02, 0] }) },
  ],
};

// Eiffel Tower: 1 unit = 100 m. Height 330 m, base 125 m square.
const CORNERS = [[1, 1], [1, -1], [-1, 1], [-1, -1]];

export const eiffelTower = {
  id: 'eiffel-tower',
  name: 'Eiffel Tower',
  specs: '330 m tall · 125 m square base · 7,300 t of wrought iron · 18,038 parts · 1889',
  about: 'Built for the 1889 World’s Fair; held together by 2.5 million rivets and repainted every 7 years.',
  parts: [
    { name: 'Legs (pillars)', color: C.orange, spread: 0.9, edge: 10,
      info: 'Four curved lattice legs, each resting on its own masonry foundation.',
      build: () => CORNERS.map(([x, z]) => beam([x * 0.6, 0, z * 0.6], [x * 0.34, 0.58, z * 0.34], 0.11, { rt: 0.06, seg: 4, hs: 6 })) },
    { name: 'Decorative arches', color: C.yellow, spread: 0.6, ex: [0, -0.4, 0],
      info: 'Purely decorative — they make the tower look like a gateway to the fair.',
      build: () => [
        torus(0.42, 0.012, { p: [0, 0.13, 0.5], arc: PI, rs: 4, ts: 24 }),
        torus(0.42, 0.012, { p: [0, 0.13, -0.5], arc: PI, rs: 4, ts: 24 }),
        torus(0.42, 0.012, { p: [0.5, 0.13, 0], r: [0, PI / 2, 0], arc: PI, rs: 4, ts: 24 }),
        torus(0.42, 0.012, { p: [-0.5, 0.13, 0], r: [0, PI / 2, 0], arc: PI, rs: 4, ts: 24 }),
      ] },
    { name: 'First floor (57 m)', color: C.cyan, spread: 0.3, ex: [0, 0.3, 1.2],
      info: 'A glass floor here lets visitors look straight down 57 m.',
      build: () => merge([1, -1].map((s) => [box(0.8, 0.05, 0.07, { p: [0, 0.6, 0.37 * s] }), box(0.07, 0.05, 0.8, { p: [0.37 * s, 0.6, 0] })])) },
    { name: 'Middle section', color: C.white, spread: 0.6, edge: 10,
      info: 'The legs lean inward and start to merge — the curve follows the wind loads.',
      build: () => CORNERS.map(([x, z]) => beam([x * 0.33, 0.62, z * 0.33], [x * 0.18, 1.14, z * 0.18], 0.06, { rt: 0.04, seg: 4, hs: 5 })) },
    { name: 'Second floor (115 m)', color: C.blue, spread: 0.3, ex: [0, 0.3, 1.4],
      info: 'Home to a restaurant and the transfer to the top-level lifts.',
      build: () => box(0.44, 0.04, 0.44, { p: [0, 1.16, 0] }) },
    { name: 'Upper pylon', color: C.purple, spread: 0.2, ex: [0, 0.5, 0], edge: 10,
      info: 'The four legs join into one tapering column 160 m tall.',
      build: () => cyl(0.06, 0.24, 1.6, { p: [0, 1.98, 0], seg: 4, hs: 12, r: [0, PI / 4, 0], open: true }) },
    { name: 'Top floor (276 m)', color: C.magenta, spread: 0.2, ex: [0, 0.9, 0.8],
      info: 'Gustave Eiffel’s private apartment is still up here.',
      build: () => merge(box(0.16, 0.05, 0.16, { p: [0, 2.78, 0] }), cyl(0.05, 0.05, 0.12, { p: [0, 2.87, 0], seg: 8 })) },
    { name: 'Antennas', color: C.red, spread: 0.2, ex: [0, 1.2, 0],
      info: 'Radio and TV antennas added the last 54 m — the tower was saved from demolition as a radio mast.',
      build: () => cyl(0.008, 0.02, 0.4, { p: [0, 3.13, 0], seg: 6 }) },
    { name: 'Elevators', color: C.lime, spread: 0.9, ex: [0, 0, -0.8],
      info: 'Lifts climb the curved legs at an angle; the original 1899 hydraulic machinery still runs.',
      build: () => [...CORNERS.map(([x, z]) => beam([x * 0.5, 0.02, z * 0.5], [x * 0.3, 0.6, z * 0.3], 0.025, { seg: 4 })), box(0.04, 1.55, 0.04, { p: [0, 1.95, 0] })] },
  ],
};
