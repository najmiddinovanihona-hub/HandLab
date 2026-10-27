// VEHICLES: sports car, airliner. Units: metres, x = forward, y = up, z = right.
import { C, PI, merge, box, cyl, sphere, torus, tube, extrude, slab, beam, helixPoints } from './primitives.js';

const WHEELS = [
  [1.3, 0.78],
  [1.3, -0.78],
  [-1.3, 0.78],
  [-1.3, -0.78],
];
const SIDES = [1, -1];

function wheel(x, z) {
  const spokes = Array.from({ length: 5 }, (_, k) =>
    box(0.36, 0.04, 0.02, { p: [x, 0.33, z], r: [0, 0, (k * PI * 2) / 5] })
  );
  return merge(
    torus(0.27, 0.085, { p: [x, 0.33, z], rs: 8, ts: 28 }),
    cyl(0.19, 0.19, 0.03, { p: [x, 0.33, z], r: [PI / 2, 0, 0], seg: 20, open: true }),
    spokes
  );
}

export const sportsCar = {
  id: 'sports-car',
  name: 'Sports Car',
  specs: '440 × 185 × 130 cm · 260 cm wheelbase · front engine, RWD',
  about: 'A two-seat coupé: the engine sits up front and drives the rear wheels through a long driveshaft.',
  parts: [
    { name: 'Roof', color: C.red, ex: [0, 1.2, 0], spread: 0.4,
      info: 'Stiff roof panel; with the pillars it forms the safety cage around the cabin.',
      build: () => box(1.15, 0.04, 1.25, { p: [-0.25, 1.24, 0] }) },
    { name: 'Windshield', color: C.cyan, ex: [0.5, 0.9, 0], spread: 0.4,
      info: 'Laminated glass: a plastic layer between two glass sheets stops it shattering into the cabin.',
      build: () => slab([0.95, 0.86], [0.35, 1.22], 1.35, 0.025) },
    { name: 'Rear window', color: C.cyan, ex: [-0.5, 0.9, 0], spread: 0.4,
      info: 'Tempered glass with a printed heating element to clear fog and ice.',
      build: () => slab([-0.85, 1.22], [-1.45, 0.93], 1.3, 0.025) },
    { name: 'Hood', color: C.yellow, ex: [0.5, 1.0, 0], spread: 0.4,
      info: 'Covers the engine bay; designed to crumple and soften the impact with a pedestrian.',
      build: () => slab([1.0, 0.86], [2.05, 0.72], 1.55, 0.03) },
    { name: 'Trunk lid', color: C.orange, ex: [-0.6, 0.8, 0], spread: 0.4,
      info: 'Rear luggage lid, often with an integrated lip spoiler that reduces lift at speed.',
      build: () => slab([-1.45, 0.93], [-2.15, 0.88], 1.45, 0.03) },
    { name: 'Doors', color: C.magenta,
      info: 'Each door hides a steel side-impact beam that protects occupants in a side crash.',
      build: () => SIDES.map((s) => merge(box(1.15, 0.5, 0.05, { p: [-0.1, 0.62, 0.9 * s] }), box(0.95, 0.04, 0.04, { p: [-0.15, 1.0, 0.86 * s] }))) },
    { name: 'Front fenders', color: C.pink,
      info: 'Body panels over the front wheels that stop spray and stones being thrown up.',
      build: () => SIDES.map((s) => merge(box(0.6, 0.3, 0.05, { p: [1.75, 0.62, 0.9 * s] }), torus(0.42, 0.03, { p: [1.3, 0.34, 0.9 * s], arc: PI, rs: 6, ts: 24 }))) },
    { name: 'Rear quarter panels', color: C.pink,
      info: 'Welded to the body shell (not bolted on) — part of the car’s structure.',
      build: () => SIDES.map((s) => merge(box(0.6, 0.3, 0.05, { p: [-1.8, 0.62, 0.9 * s] }), torus(0.42, 0.03, { p: [-1.3, 0.34, 0.9 * s], arc: PI, rs: 6, ts: 24 }))) },
    { name: 'Front bumper & grille', color: C.white, ex: [0.6, 0, 0],
      info: 'Absorbs low-speed impacts; the grille feeds cooling air to the radiator.',
      build: () => merge(
        box(0.18, 0.3, 1.7, { p: [2.15, 0.42, 0] }),
        [0, 1, 2, 3].map((i) => box(0.02, 0.025, 0.9, { p: [2.25, 0.36 + i * 0.05, 0] })),
        SIDES.map((s) => box(0.1, 0.08, 0.3, { p: [2.12, 0.66, 0.62 * s] }))
      ) },
    { name: 'Rear bumper', color: C.white, ex: [-0.6, 0, 0],
      info: 'Holds the tail lights and the reversing sensors.',
      build: () => merge(box(0.16, 0.28, 1.7, { p: [-2.2, 0.45, 0] }), SIDES.map((s) => box(0.06, 0.08, 0.35, { p: [-2.2, 0.66, 0.6 * s] }))) },
    { name: 'Chassis frame', color: C.white, ex: [0, -1.0, 0], spread: 0.2,
      info: 'The backbone: every other part is mounted to it, and it carries all the loads.',
      build: () => merge(
        SIDES.map((s) => box(3.9, 0.08, 0.08, { p: [0, 0.26, 0.5 * s] })),
        [-1.6, -0.6, 0.4, 1.4].map((x) => box(0.08, 0.06, 1.0, { p: [x, 0.26, 0] }))
      ) },
    { name: 'Engine', color: C.orange, ex: [0.2, 1.4, 0], spread: 0.3,
      info: 'A V8 burns fuel in eight cylinders; ~400 hp turns the crankshaft at up to 7,000 rpm.',
      build: () => merge(
        box(0.6, 0.38, 0.45, { p: [1.45, 0.6, 0] }),
        SIDES.map((s) => box(0.58, 0.1, 0.2, { p: [1.45, 0.86, 0.17 * s], r: [0.5 * s, 0, 0] })),
        box(0.42, 0.08, 0.14, { p: [1.45, 0.95, 0] }),
        cyl(0.08, 0.08, 0.05, { p: [1.78, 0.55, 0], r: [0, 0, PI / 2] })
      ) },
    { name: 'Radiator & fan', color: C.teal, ex: [1.2, 0.2, 0], spread: 0.3,
      info: 'Coolant from the engine passes through thin fins where air carries the heat away.',
      build: () => merge(box(0.06, 0.4, 1.0, { p: [1.97, 0.55, 0] }), cyl(0.17, 0.17, 0.04, { p: [1.88, 0.55, 0], r: [0, 0, PI / 2], seg: 12 })) },
    { name: 'Gearbox', color: C.purple, ex: [0, -0.9, 0], spread: 0.3,
      info: 'Six gear ratios keep the engine in its power band from standstill to top speed.',
      build: () => cyl(0.14, 0.2, 0.6, { p: [0.9, 0.42, 0], r: [0, 0, PI / 2], seg: 12 }) },
    { name: 'Driveshaft & differential', color: C.lime, ex: [0, -1.2, 0], spread: 0.3,
      info: 'The differential lets the rear wheels turn at different speeds in a corner.',
      build: () => merge(
        cyl(0.035, 0.035, 2.1, { p: [-0.35, 0.36, 0], r: [0, 0, PI / 2], seg: 8 }),
        sphere(0.15, { p: [-1.35, 0.34, 0], ws: 12, hs: 8 }),
        cyl(0.03, 0.03, 1.5, { p: [-1.3, 0.34, 0], r: [PI / 2, 0, 0], seg: 8 })
      ) },
    { name: 'Fuel tank', color: C.green, ex: [-0.6, -0.8, 0], spread: 0.3,
      info: 'Placed ahead of the rear axle, the safest place in a rear-end collision. ~65 litres.',
      build: () => box(0.4, 0.22, 0.9, { p: [-1.75, 0.45, 0] }) },
    { name: 'Exhaust system', color: C.pink, ex: [0, -1.1, 0.6], spread: 0.3,
      info: 'A catalytic converter cleans the gases; the muffler quietens them.',
      build: () => merge(
        tube([[1.3, 0.42, 0.25], [0.8, 0.22, 0.3], [-0.5, 0.2, 0.35], [-1.6, 0.24, 0.4], [-2.25, 0.3, 0.45]], 0.035),
        cyl(0.09, 0.09, 0.5, { p: [-1.95, 0.28, 0.43], r: [0, 0, PI / 2], seg: 12 })
      ) },
    { name: 'Suspension (coil-overs)', color: C.yellow, spread: 1.1,
      info: 'A spring and damper on each corner keep the tyres pressed to the road over bumps.',
      build: () => WHEELS.map(([x, z]) => tube(helixPoints(0.07, 0.35, 6, { x, z: z * 0.72, y0: 0.38 }), 0.012, { segments: 160, rs: 4 })) },
    { name: 'Brake discs & calipers', color: C.red, spread: 1.3,
      info: 'Hydraulic calipers squeeze pads onto the spinning discs, turning motion into heat.',
      build: () => WHEELS.map(([x, z]) => merge(cyl(0.2, 0.2, 0.03, { p: [x, 0.33, z * 0.86], r: [PI / 2, 0, 0], seg: 20 }), box(0.1, 0.12, 0.06, { p: [x + 0.13, 0.45, z * 0.86] }))) },
    { name: 'Wheels & tyres', color: C.white, spread: 1.5,
      info: 'Each tyre touches the road over an area about the size of a postcard.',
      build: () => WHEELS.map(([x, z]) => wheel(x, z)) },
    { name: 'Seats', color: C.blue, ex: [0, 1.0, 0], spread: 0.6,
      info: 'Bucket seats with side bolsters hold you in place in hard corners.',
      build: () => SIDES.map((s) => merge(box(0.45, 0.1, 0.42, { p: [-0.35, 0.45, 0.38 * s] }), box(0.1, 0.55, 0.42, { p: [-0.62, 0.72, 0.38 * s], r: [0, 0, 0.2] }))) },
    { name: 'Dashboard & steering', color: C.cyan, ex: [0.4, 0.9, 0], spread: 0.3,
      info: 'Rack-and-pinion steering turns the wheel’s rotation into side-to-side motion of the front wheels.',
      build: () => merge(
        box(0.3, 0.15, 1.4, { p: [0.35, 0.78, 0] }),
        torus(0.16, 0.02, { p: [0.12, 0.82, 0.38], r: [0, PI / 2, 0], rs: 6, ts: 24 }),
        beam([0.12, 0.82, 0.38], [0.45, 0.7, 0.38], 0.025)
      ) },
  ],
};

// Airliner: ~ 1 unit = 8 m. x = forward.
const wingShape = [[0.8, 0], [-0.6, 0], [-1.6, 3.9], [-1.0, 3.9]];
const tailShape = [[0.4, 0], [-0.3, 0], [-0.8, 1.5], [-0.5, 1.5]];

export const airliner = {
  id: 'airliner',
  name: 'Airliner',
  specs: 'Twin-engine narrow-body · 37.6 m long · 35.8 m span · ~180 seats',
  about: 'Wings make lift by deflecting air downward; two turbofans push it to ~840 km/h at 11 km altitude.',
  parts: [
    { name: 'Fuselage', color: C.cyan, spread: 0, ex: [0, 0.9, 0], edge: 8,
      info: 'A pressurised aluminium tube: the cabin is kept at the pressure of ~2,400 m altitude.',
      build: () => merge(
        cyl(0.45, 0.45, 6, { r: [0, 0, PI / 2], seg: 20, hs: 6, open: true }),
        sphere(0.45, { p: [3.0, 0, 0], s: [1.7, 1, 1], ws: 20, hs: 10, phi: [PI / 2, PI] }),
        cyl(0.12, 0.45, 1.8, { p: [-3.9, 0.15, 0], r: [0, 0, PI / 2], seg: 20, open: true })
      ) },
    { name: 'Cockpit', color: C.yellow, ex: [1.2, 0.3, 0], spread: 0.3,
      info: 'Two pilots; fly-by-wire computers turn their stick inputs into control-surface movements.',
      build: () => merge(box(0.3, 0.12, 0.6, { p: [3.45, -0.05, 0] }), [-0.18, 0.18].map((z) => box(0.18, 0.25, 0.16, { p: [3.15, -0.08, z] }))) },
    { name: 'Passenger cabin', color: C.blue, ex: [0, 1.4, 0], spread: 0.1,
      info: 'Rows of seats on a floor that also carries cables, ducts and the cargo hold below.',
      build: () => {
        const seats = [];
        for (let x = -2.4; x <= 2.3; x += 0.36) for (const z of [-0.3, -0.18, 0.18, 0.3]) seats.push(box(0.11, 0.12, 0.1, { p: [x, -0.03, z] }));
        return merge(box(5.0, 0.02, 0.8, { p: [0, -0.1, 0] }), seats);
      } },
    { name: 'Cargo hold', color: C.orange, ex: [0, -1.3, 0], spread: 0.1,
      info: 'Luggage and freight travel in containers below the cabin floor.',
      build: () => box(4.5, 0.25, 0.6, { p: [0, -0.3, 0] }) },
    { name: 'Wings', color: C.blue,
      info: 'Curved upper surface and angle of attack push air down — the wing is pushed up.',
      build: () => SIDES.map((s) => extrude(wingShape, 0.07, { p: [0.2, -0.22, 0.4 * s], r: [(PI / 2) * s, 0, 0] })) },
    { name: 'Wing fuel tanks', color: C.green, ex: [0, -1.0, 0],
      info: 'Most fuel is stored inside the wings; its weight also reduces wing bending in flight.',
      build: () => SIDES.map((s) => box(0.9, 0.05, 2.2, { p: [-0.45, -0.22, 1.8 * s], r: [0, 0.25 * s, 0] })) },
    { name: 'Turbofan engines', color: C.yellow, ex: [0, -0.6, 0],
      info: 'A big fan moves most of the air around the core: quieter and more efficient than a pure jet.',
      build: () => SIDES.map((s) => merge(
        cyl(0.3, 0.26, 1.2, { p: [0.75, -0.62, 1.55 * s], r: [0, 0, PI / 2], seg: 18, open: true }),
        cyl(0.27, 0.27, 0.03, { p: [1.25, -0.62, 1.55 * s], r: [0, 0, PI / 2], seg: 18 }),
        box(0.7, 0.3, 0.06, { p: [0.6, -0.38, 1.55 * s] })
      )) },
    { name: 'Horizontal stabilizers', color: C.purple, spread: 0.6,
      info: 'Keep the nose from pitching up and down; their elevators control climb and descent.',
      build: () => SIDES.map((s) => extrude(tailShape, 0.05, { p: [-4.1, 0.2, 0.15 * s], r: [(PI / 2) * s, 0, 0] })) },
    { name: 'Vertical fin & rudder', color: C.magenta, ex: [-0.5, 1.0, 0], spread: 0.3,
      info: 'Keeps the aircraft pointing into the wind; the rudder yaws the nose left or right.',
      build: () => extrude([[-3.3, 0.35], [-4.6, 0.35], [-5.0, 2.0], [-4.6, 2.0]], 0.07) },
    { name: 'Landing gear', color: C.white, ex: [0, -1.2, 0], spread: 0.3,
      info: 'Retracts into the belly after take-off; the main gear carries ~90 % of the weight on the ground.',
      build: () => [
        merge(beam([2.6, -0.4, 0], [2.6, -0.85, 0], 0.03), torus(0.1, 0.035, { p: [2.6, -0.9, 0], rs: 6, ts: 16 })),
        ...SIDES.map((s) => merge(
          beam([0.0, -0.3, 0.55 * s], [0.0, -0.85, 0.6 * s], 0.04),
          [-0.1, 0.1].map((dx) => torus(0.12, 0.045, { p: [dx, -0.9, 0.6 * s], rs: 6, ts: 16 }))
        )),
      ] },
  ],
};
