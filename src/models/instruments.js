// Subject instruments: a light microscope (biology) and drawing instruments (geometry).
import { C, PI, merge, box, cyl, torus, extrude, beam } from './primitives.js';

// ---------------------------------------------------------------- light microscope
export const microscope = {
  id: 'microscope',
  name: 'Light Microscope',
  specs: 'Magnification 40×–1000× · eyepiece 10× × objectives 4× / 10× / 40× / 100×',
  about: 'Two sets of lenses work together: the objective makes an enlarged image of the specimen, and the eyepiece enlarges it again. Total = eyepiece × objective.',
  uz: {
    name: 'Yorug‘lik mikroskopi',
    specs: 'Kattalashtirish 40×–1000× · okulyar 10× × obyektivlar 4× / 10× / 40× / 100×',
    about: 'Ikki xil linza birga ishlaydi: obyektiv namunaning kattalashgan tasvirini hosil qiladi, okulyar uni yana kattalashtiradi. Umumiy kattalashtirish = okulyar × obyektiv.',
  },
  parts: [
    { name: 'Eyepiece', color: C.yellow, spread: 0, ex: [-0.6, 1.2, 0],
      uz: ['Okulyar', 'Ko‘z qo‘yiladigan linza, odatda 10× kattalashtiradi.'],
      info: 'The lens you look through, usually 10×.',
      build: () => beam([-0.55, 1.75, 0], [-0.8, 2.15, 0], 0.11, { seg: 16, open: true }) },
    { name: 'Body tube', color: C.cyan, spread: 0, ex: [-0.4, 0.8, 0], edge: 10,
      uz: ['Tubus', 'Okulyar va obyektivlarni to‘g‘ri masofada ushlab turadi.'],
      info: 'Keeps the eyepiece and objectives the right distance apart.',
      build: () => beam([-0.1, 1.0, 0], [-0.55, 1.75, 0], 0.14, { seg: 16, open: true }) },
    { name: 'Revolving nosepiece & objectives', color: C.orange, spread: 0, ex: [0.6, 0.6, 0], metal: 0.8,
      uz: ['Revolver va obyektivlar', 'Aylanuvchi kallakdagi 3–4 ta obyektiv: buraganda kattalashtirish o‘zgaradi.'],
      info: 'A rotating head holding 3–4 objectives: turn it to change magnification.',
      build: () => merge(cyl(0.22, 0.25, 0.12, { p: [-0.05, 0.95, 0], seg: 20 }), [0, 1, 2].map((k) => {
        const a = (k * 2 * PI) / 3;
        return beam([-0.05 + Math.cos(a) * 0.12, 0.9, Math.sin(a) * 0.12], [-0.05 + Math.cos(a) * 0.16, 0.62 - k * 0.06, Math.sin(a) * 0.16], 0.045, { seg: 10 });
      })) },
    { name: 'Stage & clips', color: C.white, spread: 0, ex: [0.8, 0, 0.6],
      uz: ['Predmet stolchasi va qisqichlar', 'Namunali shisha shu yerga qo‘yilib, qisqichlar bilan mahkamlanadi.'],
      info: 'The slide sits here, held by two clips.',
      build: () => merge(box(0.9, 0.05, 0.9, { p: [-0.05, 0.42, 0] }), [1, -1].map((s) => box(0.3, 0.02, 0.06, { p: [-0.05 + 0.2 * s, 0.46, 0.3] }))) },
    { name: 'Slide (specimen)', color: C.pink, spread: 0, ex: [0.6, 0.4, 1.4],
      uz: ['Preparat (namuna)', 'Yupqa shisha plastinkadagi namuna — masalan, piyoz po‘sti hujayralari.'],
      info: 'A thin glass slide with the specimen — e.g. onion-skin cells.',
      build: () => box(0.6, 0.012, 0.2, { p: [-0.05, 0.455, 0] }) },
    { name: 'Focus knobs', color: C.lime, spread: 0, ex: [0, 0, 1.6], metal: 0.6,
      uz: ['Fokuslash vintlari', 'Katta vint — tez (dag‘al) fokus, kichigi — aniq (mayin) fokus.'],
      info: 'The large knob focuses quickly (coarse), the small one precisely (fine).',
      build: () => [1, -1].map((s) => merge(cyl(0.18, 0.18, 0.08, { p: [0.55, 0.55, 0.22 * s], r: [PI / 2, 0, 0], seg: 20 }), cyl(0.1, 0.1, 0.06, { p: [0.55, 0.55, 0.3 * s], r: [PI / 2, 0, 0], seg: 16 }))) },
    { name: 'Arm', color: C.blue, spread: 0, ex: [1.2, 0.2, 0], edge: 25,
      uz: ['Shtativ (dasta)', 'Mikroskopni ko‘chirganda shu yeridan ushlanadi.'],
      info: 'Carry the microscope by this part.',
      build: () => extrude([[0.35, -0.6], [0.75, -0.6], [0.75, 1.0], [0.25, 1.5], [0.0, 1.3], [0.45, 0.9]], 0.18) },
    { name: 'Light source & condenser', color: C.yellow, spread: 0, ex: [0, -0.6, 1.2],
      uz: ['Yorug‘lik manbai va kondensor', 'Lampa yorug‘ligini kondensor namunaga yo‘naltiradi; diafragma yorug‘lik miqdorini boshqaradi.'],
      info: 'The condenser focuses lamp light onto the specimen; the diaphragm sets how much.',
      build: () => merge(cyl(0.16, 0.12, 0.12, { p: [-0.05, 0.3, 0], seg: 16 }), cyl(0.14, 0.14, 0.06, { p: [-0.05, -0.45, 0], seg: 16 })) },
    { name: 'Base', color: C.purple, spread: 0, ex: [0, -1.2, 0],
      uz: ['Asos', 'Og‘ir taglik mikroskopni barqaror ushlab turadi.'],
      info: 'A heavy base keeps the microscope steady.',
      build: () => box(1.4, 0.15, 1.0, { p: [0.15, -0.58, 0] }) },
  ],
};

// ---------------------------------------------------------------- geometry drawing instruments
export const drawingTools = {
  id: 'drawing-tools',
  name: 'Geometry Drawing Tools',
  specs: 'Ruler · compass · protractor · set square · pencil',
  about: 'With just a straightedge and a compass the ancient Greeks constructed bisectors, perpendiculars and regular polygons.',
  uz: {
    name: 'Chizma asboblari',
    specs: 'Chizg‘ich · sirkul · transportir · uchburchak chizg‘ich · qalam',
    about: 'Qadimgi yunonlar faqat chizg‘ich va sirkul yordamida bissektrisa, perpendikular va muntazam ko‘pburchaklarni yasashgan.',
  },
  parts: [
    { name: 'Ruler', color: C.cyan, spread: 0.6, ex: [0, -0.8, 0],
      uz: ['Chizg‘ich', 'To‘g‘ri chiziq chizadi va uzunlikni santimetr/millimetrda o‘lchaydi.'],
      info: 'Draws straight lines and measures length in cm / mm.',
      build: () => merge(box(3.0, 0.04, 0.45, { p: [0, -0.8, 0.6] }), Array.from({ length: 31 }, (_, i) => box(0.008, 0.01, i % 10 === 0 ? 0.18 : i % 5 === 0 ? 0.13 : 0.08, { p: [-1.45 + i * 0.0967, -0.775, 0.43 + (i % 10 === 0 ? 0.09 : i % 5 === 0 ? 0.065 : 0.04)] }))) },
    { name: 'Compass', color: C.white, spread: 0.6, ex: [0, 1.0, 0], metal: 0.85,
      uz: ['Sirkul', 'Aylana va yoy chizadi, kesmalarni bir joydan boshqa joyga ko‘chiradi.'],
      info: 'Draws circles and arcs and copies lengths from one place to another.',
      build: () => merge(beam([-0.9, 1.35, -0.3], [-1.3, 0.0, -0.3], 0.03, { seg: 8 }), beam([-0.9, 1.35, -0.3], [-0.5, 0.0, -0.3], 0.03, { seg: 8 }), cyl(0.06, 0.06, 0.08, { p: [-0.9, 1.38, -0.3], r: [PI / 2, 0, 0], seg: 12 }), cyl(0.02, 0.02, 0.3, { p: [-0.9, 1.6, -0.3], seg: 8 })) },
    { name: 'Protractor', color: C.yellow, spread: 0.6, ex: [0.6, 0.4, 0],
      uz: ['Transportir', 'Burchaklarni gradusda (0°–180°) o‘lchaydi va chizadi.'],
      info: 'Measures and draws angles in degrees (0°–180°).',
      build: () => ringHalf() },
    { name: 'Set square', color: C.magenta, spread: 0.6, ex: [0.8, -0.2, 0.6],
      uz: ['Uchburchak chizg‘ich', '90° li to‘g‘ri burchak va 30°/60° yoki 45° burchaklarni chizish uchun.'],
      info: 'For drawing right angles and 30°/60° or 45° angles.',
      build: () => extrude([[0, 0], [1.3, 0], [0, 0.75], [0, 0]], 0.03, { p: [-0.4, -0.55, -0.9] }) },
    { name: 'Pencil', color: C.orange, spread: 0.6, ex: [0, 0.4, 1.2],
      uz: ['Qalam', 'Oltiburchakli prizma va konus — qalamning o‘zi ham geometrik jismlardan iborat!'],
      info: 'A hexagonal prism plus a cone — a pencil is made of geometric solids too!',
      build: () => merge(beam([1.4, 0.5, 0.6], [0.2, 0.5, 0.6], 0.06, { seg: 6 }), beam([0.2, 0.5, 0.6], [0.0, 0.5, 0.6], 0.06, { rt: 0.005, seg: 6 })) },
  ],
};

// Half ring (0°–180°) with degree ticks.
function ringHalf() {
  return merge(
    torus(0.95, 0.012, { arc: PI, p: [0.9, -0.05, -0.2], rs: 3, ts: 48 }),
    beam([-0.05, -0.05, -0.2], [1.85, -0.05, -0.2], 0.012, { seg: 4 }),
    Array.from({ length: 19 }, (_, i) => {
      const a = (i * PI) / 18;
      const r1 = i % 9 === 0 ? 0.7 : 0.82;
      return beam([0.9 + Math.cos(a) * r1, -0.05 + Math.sin(a) * r1, -0.2], [0.9 + Math.cos(a) * 0.95, -0.05 + Math.sin(a) * 0.95, -0.2], 0.006, { seg: 3 });
    })
  );
}
