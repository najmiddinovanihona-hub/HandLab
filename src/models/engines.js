// ENGINES: inline-4 car engine, turbofan jet engine.
import { C, PI, merge, box, cyl, sphere, torus, tube, beam, lathe } from './primitives.js';

// Inline-4: 1 unit ~ 25 cm. x = along the crankshaft, y = up.
const CYL_X = [-0.75, -0.25, 0.25, 0.75];
const PISTON_Y = [0.82, 0.55, 0.55, 0.82]; // pistons 1 & 4 up, 2 & 3 down (180° crank)

export const inline4 = {
  id: 'inline-4',
  name: 'Inline-4 Engine',
  specs: '2.0 L · 4 cylinders in a row · 16 valves · ~150 hp at 6,000 rpm',
  about: 'Four-stroke cycle: intake, compression, power, exhaust. Two pistons go up while the other two go down.',
  parts: [
    { name: 'Engine block', color: C.cyan, spread: 0, edge: 10,
      info: 'Cast aluminium or iron block with the four cylinder bores and coolant passages.',
      build: () => merge(box(2.0, 1.0, 0.9, { p: [0, 0.5, 0] }), CYL_X.map((x) => cyl(0.2, 0.2, 1.0, { p: [x, 0.5, 0], seg: 16, open: true }))) },
    { name: 'Cylinder head', color: C.blue, spread: 0, ex: [0, 1.2, 0],
      info: 'Closes the cylinders and holds the valves, spark plugs and camshafts.',
      build: () => box(2.0, 0.32, 0.85, { p: [0, 1.17, 0] }) },
    { name: 'Valve cover', color: C.purple, spread: 0, ex: [0, 2.0, 0],
      info: 'Keeps oil in around the camshafts and valve springs.',
      build: () => box(1.9, 0.16, 0.6, { p: [0, 1.42, 0] }) },
    { name: 'Camshafts', color: C.lime, spread: 0, ex: [0, 1.5, -1.3],
      info: 'Egg-shaped lobes push the valves open at exactly the right moment.',
      build: () => merge(
        cyl(0.04, 0.04, 2.2, { p: [0, 1.28, 0.18], r: [0, 0, PI / 2], seg: 8 }),
        CYL_X.flatMap((x) => [-0.08, 0.08].map((dx) => sphere(0.07, { p: [x + dx, 1.28, 0.18], s: [0.4, 1.3, 1], ws: 8, hs: 6 })))
      ) },
    { name: 'Spark plugs', color: C.yellow, spread: 0.4, ex: [0, 2.6, 0.4],
      info: 'A 20,000-volt spark ignites the compressed fuel–air mixture.',
      build: () => CYL_X.map((x) => cyl(0.03, 0.03, 0.35, { p: [x, 1.45, 0], seg: 6 })) },
    { name: 'Pistons', color: C.orange, spread: 0.3, ex: [0, 0.4, 1.6],
      info: 'The burning gas pushes each piston down with a force of several tonnes.',
      build: () => CYL_X.map((x, i) => cyl(0.18, 0.18, 0.24, { p: [x, PISTON_Y[i], 0], seg: 16 })) },
    { name: 'Connecting rods', color: C.yellow, spread: 0.3, ex: [0, -0.2, 2.2],
      info: 'Link each piston to the crankshaft, turning up-down motion into rotation.',
      build: () => CYL_X.map((x, i) => beam([x, PISTON_Y[i] - 0.05, 0], [x, i === 0 || i === 3 ? 0.08 : -0.28, 0], 0.04, { seg: 6 })) },
    { name: 'Crankshaft', color: C.white, spread: 0, ex: [0, -1.2, 0.5],
      info: 'Converts the pistons’ push into torque; its counterweights keep it balanced.',
      build: () => merge(
        cyl(0.06, 0.06, 2.4, { p: [0, -0.1, 0], r: [0, 0, PI / 2], seg: 10 }),
        CYL_X.map((x, i) => box(0.08, 0.36, 0.22, { p: [x, i === 0 || i === 3 ? -0.03 : -0.17, 0] }))
      ) },
    { name: 'Oil pan (sump)', color: C.teal, spread: 0, ex: [0, -2.2, 0],
      info: 'Holds ~4 L of oil that is pumped up to lubricate every moving part.',
      build: () => box(1.8, 0.35, 0.7, { p: [0, -0.4, 0] }) },
    { name: 'Intake manifold', color: C.green, spread: 0.3, ex: [0, 0.4, 1.4],
      info: 'Shares incoming air evenly between the four cylinders.',
      build: () => merge(
        CYL_X.map((x) => tube([[x, 1.12, 0.45], [x, 1.2, 0.75], [x * 0.9, 1.0, 0.95]], 0.06, { segments: 12 })),
        cyl(0.11, 0.11, 1.9, { p: [0, 1.0, 0.98], r: [0, 0, PI / 2], seg: 12 })
      ) },
    { name: 'Exhaust manifold', color: C.red, spread: 0.3, ex: [0, 0, -1.6],
      info: 'Collects hot exhaust gas (up to 900 °C) from each cylinder into one pipe.',
      build: () => merge(CYL_X.map((x) => tube([[x, 1.1, -0.45], [x, 1.0, -0.7], [0.6, 0.55, -0.75], [0.9, 0.2, -0.75]], 0.055, { segments: 16 }))) },
    { name: 'Timing belt & pulleys', color: C.magenta, spread: 0.2, ex: [-1.3, 0, 0],
      info: 'Keeps the camshafts turning at exactly half crankshaft speed.',
      build: () => merge(
        tube([[-1.1, 1.42, 0.18], [-1.1, 1.28, 0.36], [-1.1, -0.1, 0.18], [-1.1, -0.26, 0], [-1.1, -0.1, -0.18], [-1.1, 1.28, 0.0]], 0.02, { closed: true, segments: 80, rs: 4 }),
        cyl(0.16, 0.16, 0.05, { p: [-1.1, 1.28, 0.18], r: [0, 0, PI / 2], seg: 20 }),
        cyl(0.13, 0.13, 0.05, { p: [-1.1, -0.1, 0], r: [0, 0, PI / 2], seg: 20 })
      ) },
    { name: 'Flywheel', color: C.orange, spread: 0, ex: [1.4, -0.2, 0],
      info: 'A heavy disc that smooths out the pulses of the four power strokes.',
      build: () => cyl(0.55, 0.55, 0.07, { p: [1.15, -0.1, 0], r: [0, 0, PI / 2], seg: 28 }) },
  ],
};

// Turbofan: 1 unit ~ 1 m. x = forward (air enters at +x).
const along = (o = {}) => ({ ...o, r: [0, 0, -PI / 2] }); // cylinder axis y -> x (top points to +x)
const discAt = (x, r, w = 0.05) => cyl(r, r, w, along({ p: [x, 0, 0], seg: 24 }));
const bladeRing = (x, r, n, len, twist = 0.35, w = 0.06) =>
  Array.from({ length: n }, (_, k) => {
    const a = (k / n) * PI * 2;
    return box(w * 0.4, len, w, { p: [x, Math.cos(a) * r, Math.sin(a) * r], r: [a, twist, 0] });
  });

export const turbofan = {
  id: 'turbofan',
  name: 'Turbofan Jet Engine',
  specs: '~3 m fan diameter · bypass ratio 10:1 · ~150 kN thrust',
  about: 'Air is squeezed, mixed with fuel and burned; the hot gas spins turbines that drive the fan and compressors.',
  parts: [
    { name: 'Spinner (nose cone)', color: C.white, spread: 1,
      info: 'Smooths the airflow into the fan and sheds ice.',
      build: () => cyl(0, 0.25, 0.45, along({ p: [2.0, 0, 0], seg: 16 })) },
    { name: 'Fan', color: C.cyan, spread: 1,
      info: 'The big front fan makes ~80 % of the thrust by pushing air around the core (bypass).',
      build: () => merge(discAt(1.68, 0.25, 0.15), bladeRing(1.68, 0.62, 18, 0.72, 0.45, 0.14)) },
    { name: 'Nacelle (cowling)', color: C.blue, spread: 0, ex: [0, 1.8, 0], edge: 8,
      info: 'Streamlined casing that guides the bypass air and absorbs fan noise.',
      build: () => cyl(1.0, 0.92, 3.2, along({ p: [0.3, 0, 0], seg: 32, hs: 4, open: true })) },
    { name: 'Low-pressure compressor', color: C.green, spread: 1,
      info: 'First squeeze: a few slow stages driven by the same shaft as the fan.',
      build: () => merge([1.25, 1.12, 0.99, 0.86].map((x) => [discAt(x, 0.22), ...bladeRing(x, 0.36, 16, 0.26, 0.4)])) },
    { name: 'High-pressure compressor', color: C.lime, spread: 1,
      info: 'Ten fast stages raise the pressure ~40× — and the air to ~600 °C.',
      build: () => merge([0.7, 0.6, 0.5, 0.4, 0.3, 0.2, 0.1].map((x, i) => [discAt(x, 0.18, 0.04), ...bladeRing(x, 0.28 - i * 0.008, 14, 0.18 - i * 0.008, 0.4, 0.05)])) },
    { name: 'Combustion chamber', color: C.orange, spread: 1,
      info: 'Fuel is sprayed in and burns at ~2,000 °C — hotter than the metal can melt, so it is film-cooled.',
      build: () => merge(torus(0.3, 0.1, { p: [-0.15, 0, 0], r: [0, PI / 2, 0], rs: 10, ts: 32 }), Array.from({ length: 12 }, (_, k) => cyl(0.015, 0.015, 0.15, along({ p: [0.0, Math.cos((k * PI) / 6) * 0.3, Math.sin((k * PI) / 6) * 0.3], seg: 6 })))) },
    { name: 'High-pressure turbine', color: C.red, spread: 1,
      info: 'Single-crystal blades spin at ~13,000 rpm in gas hotter than their melting point.',
      build: () => merge([-0.45, -0.55].map((x) => [discAt(x, 0.2), ...bladeRing(x, 0.3, 20, 0.16, -0.4)])) },
    { name: 'Low-pressure turbine', color: C.magenta, spread: 1,
      info: 'Slower turbine stages that drive the fan through a long inner shaft.',
      build: () => merge([-0.72, -0.86, -1.0, -1.14].map((x, i) => [discAt(x, 0.2), ...bladeRing(x, 0.36 + i * 0.03, 22, 0.26 + i * 0.03, -0.4)])) },
    { name: 'Shafts', color: C.white, spread: 0, ex: [0, -1.6, 0],
      info: 'Two shafts, one inside the other: fan + LP turbine, and HP compressor + HP turbine.',
      build: () => merge(cyl(0.05, 0.05, 3.3, along({ p: [0.25, 0, 0], seg: 8 })), cyl(0.09, 0.09, 1.4, along({ p: [0.1, 0, 0], seg: 10 }))) },
    { name: 'Core casing', color: C.purple, spread: 0, ex: [0, 0, 1.8], edge: 10,
      info: 'Holds the hot core; bypass air flows around its outside.',
      build: () => cyl(0.52, 0.42, 2.4, along({ p: [-0.05, 0, 0], seg: 24, hs: 3, open: true })) },
    { name: 'Exhaust nozzle & cone', color: C.yellow, spread: 1,
      info: 'Accelerates the hot core gas rearward — the reaction pushes the aircraft forward.',
      build: () => merge(cyl(0.48, 0.38, 0.6, along({ p: [-1.55, 0, 0], seg: 24, open: true })), lathe([[0.001, 0], [0.2, 0.6]], { p: [-1.85, 0, 0], r: [0, 0, -PI / 2], seg: 16 })) },
  ],
};
