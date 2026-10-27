// MACHINES: quadcopter drone.
import { C, PI, merge, box, cyl, sphere, beam } from './primitives.js';

// 1 unit ~ 20 cm. Arms on the diagonals.
const ARM_ANGLES = [PI / 4, (3 * PI) / 4, (5 * PI) / 4, (7 * PI) / 4];
const D = 1.25; // motor distance from centre
const at = (a, d, y) => [Math.cos(a) * d, y, Math.sin(a) * d];

export const drone = {
  id: 'drone',
  name: 'Quadcopter Drone',
  specs: '450 mm frame · 4 brushless motors · 5,000 mAh battery · ~25 min flight',
  about: 'Four propellers, two spinning clockwise and two counter-clockwise; it steers by changing their speeds.',
  parts: [
    { name: 'Frame body', color: C.cyan, spread: 0, ex: [0, -0.2, 0],
      info: 'Carbon-fibre plates: stiff, light, and they protect the electronics.',
      build: () => merge(
        box(0.7, 0.04, 0.7, { p: [0, 0, 0] }),
        box(0.6, 0.03, 0.6, { p: [0, 0.2, 0] }),
        [0, 1, 2, 3].map((k) => cyl(0.02, 0.02, 0.2, { p: at(ARM_ANGLES[k], 0.38, 0.1), seg: 6 }))
      ) },
    { name: 'Arms', color: C.blue, spread: 0.6,
      info: 'Hollow carbon tubes that hold the motors out of each other’s airflow.',
      build: () => ARM_ANGLES.map((a) => box(1.0, 0.06, 0.1, { p: at(a, 0.75, 0.02), r: [0, -a, 0] })) },
    { name: 'Brushless motors', color: C.orange, spread: 0.9,
      info: 'Spin at up to ~10,000 rpm with no brushes to wear out.',
      build: () => ARM_ANGLES.map((a) => cyl(0.12, 0.12, 0.14, { p: at(a, D, 0.1), seg: 18 })) },
    { name: 'Propellers', color: C.white, spread: 0.9, ex: [0, 1.0, 0],
      info: 'Opposite pairs spin in opposite directions so their twisting forces cancel out.',
      build: () => ARM_ANGLES.map((a, k) => merge(box(0.9, 0.012, 0.08, { p: at(a, D, 0.22), r: [0.12, a + (k % 2 ? 0.4 : -0.4), 0] }), cyl(0.04, 0.04, 0.05, { p: at(a, D, 0.22), seg: 10 }))) },
    { name: 'ESCs (speed controllers)', color: C.yellow, spread: 0.7, ex: [0, -0.6, 0],
      info: 'Turn the battery’s DC into three-phase pulses that drive each motor.',
      build: () => ARM_ANGLES.map((a) => box(0.18, 0.03, 0.08, { p: at(a, 0.62, -0.03), r: [0, -a, 0] })) },
    { name: 'Battery (LiPo)', color: C.green, spread: 0, ex: [0, 1.6, 0],
      info: 'Lithium-polymer cells deliver bursts of over 50 A for take-off.',
      build: () => box(0.5, 0.18, 0.25, { p: [0, 0.33, 0] }) },
    { name: 'Flight controller', color: C.magenta, spread: 0, ex: [0, 1.0, 1.0],
      info: 'Reads gyroscopes and accelerometers ~8,000 times a second to keep the drone level.',
      build: () => merge(box(0.3, 0.02, 0.3, { p: [0, 0.1, 0] }), box(0.08, 0.02, 0.08, { p: [0, 0.12, 0] })) },
    { name: 'GPS module', color: C.lime, spread: 0, ex: [-0.8, 1.6, 0],
      info: 'Mounted on a mast away from motor interference; enables position hold and return-home.',
      build: () => merge(cyl(0.015, 0.015, 0.3, { p: [-0.2, 0.45, 0], seg: 6 }), cyl(0.12, 0.12, 0.04, { p: [-0.2, 0.62, 0], seg: 18 })) },
    { name: 'Camera gimbal', color: C.red, spread: 0, ex: [1.2, -1.2, 0],
      info: 'Three small motors keep the camera steady while the drone tilts.',
      build: () => merge(sphere(0.13, { p: [0.4, -0.28, 0], ws: 14, hs: 10 }), box(0.12, 0.18, 0.04, { p: [0.4, -0.12, 0] }), cyl(0.05, 0.05, 0.05, { p: [0.52, -0.28, 0], r: [0, 0, PI / 2], seg: 12 })) },
    { name: 'Landing gear', color: C.purple, spread: 0.3, ex: [0, -1.4, 0],
      info: 'Skids keep the camera and propellers off the ground.',
      build: () => [1, -1].map((s) => merge(
        beam([0.2, -0.02, 0.22 * s], [0.25, -0.5, 0.35 * s], 0.02, { seg: 6 }),
        beam([-0.2, -0.02, 0.22 * s], [-0.25, -0.5, 0.35 * s], 0.02, { seg: 6 }),
        beam([0.5, -0.5, 0.35 * s], [-0.5, -0.5, 0.35 * s], 0.022, { seg: 6 })
      )) },
  ],
};
