// CHEMISTRY: water, methane, benzene, sodium-chloride crystal, laboratory glassware (tool).
// Ball-and-stick models in CPK colours: H white, C dark grey, O red, Na purple, Cl green.
import * as THREE from 'three';
import { C, PI, merge, box, cyl, sphere, torus, lathe, beam } from './primitives.js';

const bond = (a, b, r = 0.07) => beam(a, b, r, { seg: 8 });
const atom = (p, r) => sphere(r, { p, ws: 18, hs: 12 });
const GREY = 0x8d96a8;

// ---------------------------------------------------------------- water
const HALF = THREE.MathUtils.degToRad(104.5 / 2);
const OH = 1.0;
const H1 = [Math.sin(HALF) * OH, -Math.cos(HALF) * OH, 0];
const H2 = [-Math.sin(HALF) * OH, -Math.cos(HALF) * OH, 0];

export const water = {
  id: 'water',
  name: 'Water Molecule — H₂O',
  specs: 'Bent shape · H–O–H angle 104.5° · O–H bond 0.96 Å · polar',
  about: 'Oxygen pulls the shared electrons toward itself, so the molecule has a negative and a positive end. That polarity makes water dissolve so many substances.',
  uz: {
    name: 'Suv molekulasi — H₂O',
    specs: 'Burchakli shakl · H–O–H burchagi 104,5° · O–H bog‘i 0,96 Å · qutbli',
    about: 'Kislorod umumiy elektronlarni o‘ziga tortadi, shuning uchun molekulaning manfiy va musbat uchlari bor. Aynan shu qutblilik suvni ko‘p moddalarni eritadigan qiladi.',
  },
  parts: [
    { name: 'Oxygen atom (O)', color: C.red, spread: 0, ex: [0, 0.8, 0],
      uz: ['Kislorod atomi (O)', '8 proton; tashqi qobig‘ida 6 elektron. Elektromanfiyligi yuqori — elektronlarni o‘ziga tortadi.'],
      info: '8 protons, 6 outer electrons. Highly electronegative — it pulls electrons toward itself.',
      build: () => atom([0, 0, 0], 0.42) },
    { name: 'Hydrogen atoms (H)', color: C.white, spread: 1.4,
      uz: ['Vodorod atomlari (H)', 'Eng yengil element: 1 proton va 1 elektron. Bu yerda ular biroz musbat zaryadlangan.'],
      info: 'The lightest element: 1 proton, 1 electron. Here they carry a slight positive charge.',
      build: () => [atom(H1, 0.26), atom(H2, 0.26)] },
    { name: 'Covalent bonds (O–H)', color: GREY, spread: 1.0,
      uz: ['Kovalent bog‘lar (O–H)', 'Har bir bog‘ — ikki atom o‘rtasida bo‘lingan bir juft elektron.'],
      info: 'Each bond is a pair of electrons shared between two atoms.',
      build: () => [bond([0, 0, 0], H1), bond([0, 0, 0], H2)] },
    { name: 'Lone electron pairs', color: C.magenta, spread: 1.2, edge: 6,
      uz: ['Bo‘linmagan elektron juftlar', 'Kislorodning ikki erkin elektron jufti molekulani “bukib” qo‘yadi — shuning uchun burchak 104,5°.'],
      info: 'Oxygen’s two unshared electron pairs push the bonds together — that is why the molecule is bent.',
      build: () => [1, -1].map((s) => sphere(0.2, { p: [0, 0.38, 0.3 * s], s: [0.8, 1.4, 0.8], r: [0.6 * s, 0, 0], ws: 12, hs: 8 })) },
  ],
};

// ---------------------------------------------------------------- methane
const CH = 1.05;
const TETRA = [[1, 1, 1], [1, -1, -1], [-1, 1, -1], [-1, -1, 1]].map((v) => v.map((x) => (x * CH) / Math.sqrt(3)));

export const methane = {
  id: 'methane',
  name: 'Methane — CH₄',
  specs: 'Tetrahedral · H–C–H angle 109.5° · C–H bond 1.09 Å · non-polar',
  about: 'The main part of natural gas. Four identical bonds spread out as far apart as possible, making a perfect tetrahedron.',
  uz: {
    name: 'Metan — CH₄',
    specs: 'Tetraedrik · H–C–H burchagi 109,5° · C–H bog‘i 1,09 Å · qutbsiz',
    about: 'Tabiiy gazning asosiy qismi. To‘rtta bir xil bog‘ bir-biridan iloji boricha uzoqlashib, mukammal tetraedr hosil qiladi.',
  },
  parts: [
    { name: 'Carbon atom (C)', color: 0x5a5f6b, spread: 0, ex: [0, 0.9, 0],
      uz: ['Uglerod atomi (C)', '4 ta valent elektroni bor, shuning uchun 4 ta bog‘ hosil qiladi.'],
      info: 'Has 4 valence electrons, so it forms 4 bonds.',
      build: () => atom([0, 0, 0], 0.38) },
    { name: 'Hydrogen atoms (H)', color: C.white, spread: 1.4,
      uz: ['Vodorod atomlari (H)', 'To‘rtta vodorod tetraedr uchlarida joylashgan.'],
      info: 'Four hydrogens sit at the corners of a tetrahedron.',
      build: () => TETRA.map((p) => atom(p, 0.25)) },
    { name: 'C–H bonds', color: GREY, spread: 1.0,
      uz: ['C–H bog‘lari', 'To‘rtta bir xil kovalent bog‘; ular orasidagi burchak 109,5°.'],
      info: 'Four identical covalent bonds, 109.5° apart.',
      build: () => TETRA.map((p) => bond([0, 0, 0], p)) },
  ],
};

// ---------------------------------------------------------------- benzene
const RING = Array.from({ length: 6 }, (_, k) => [Math.cos((k * PI) / 3) * 1.4, Math.sin((k * PI) / 3) * 1.4, 0]);
const RING_H = RING.map(([x, y]) => [x * 1.78, y * 1.78, 0]);

export const benzene = {
  id: 'benzene',
  name: 'Benzene — C₆H₆',
  specs: 'Flat hexagon · all C–C bonds 1.39 Å · 6 delocalised π electrons',
  about: 'Kekulé dreamt of a snake biting its tail. The six C–C bonds are all equal because the π electrons are shared around the whole ring.',
  uz: {
    name: 'Benzol — C₆H₆',
    specs: 'Yassi oltiburchak · barcha C–C bog‘lari 1,39 Å · 6 ta delokallashgan π elektron',
    about: 'Kekule tushida o‘z dumini tishlagan ilonni ko‘rgan. Oltita C–C bog‘ bir xil, chunki π elektronlar butun halqa bo‘ylab taqsimlangan.',
  },
  parts: [
    { name: 'Carbon ring (C₆)', color: 0x5a5f6b, spread: 0.8,
      uz: ['Uglerod halqasi (C₆)', 'Oltita uglerod atomi yassi muntazam oltiburchak hosil qiladi.'],
      info: 'Six carbon atoms form a flat regular hexagon.',
      build: () => RING.map((p) => atom(p, 0.32)) },
    { name: 'Hydrogen atoms (H)', color: C.white, spread: 1.0,
      uz: ['Vodorod atomlari (H)', 'Har bir uglerodga bittadan vodorod tashqariga qarab birikkan.'],
      info: 'One hydrogen on each carbon, pointing outward.',
      build: () => RING_H.map((p) => atom(p, 0.22)) },
    { name: 'σ bonds', color: GREY, spread: 0.6,
      uz: ['σ (sigma) bog‘lar', 'Atomlarni bevosita bog‘lovchi kuchli bog‘lar: 6 ta C–C va 6 ta C–H.'],
      info: 'The strong direct bonds: 6 C–C and 6 C–H.',
      build: () => [...RING.map((p, k) => bond(p, RING[(k + 1) % 6], 0.06)), ...RING.map((p, k) => bond(p, RING_H[k], 0.05))] },
    { name: 'π electron cloud', color: C.cyan, spread: 0, ex: [0, 0, 1.4], edge: 6,
      uz: ['π elektron buluti', 'Halqaning ustida va ostida aylanuvchi 6 ta umumiy elektron — benzolni barqaror qiladi.'],
      info: 'Six shared electrons circling above and below the ring — this makes benzene very stable.',
      build: () => [torus(1.4, 0.16, { p: [0, 0, 0.35], rs: 10, ts: 48 }), torus(1.4, 0.16, { p: [0, 0, -0.35], rs: 10, ts: 48 })] },
  ],
};

// ---------------------------------------------------------------- NaCl crystal (3×3×3)
const LAT = [];
for (let i = -1; i <= 1; i++) for (let j = -1; j <= 1; j++) for (let k = -1; k <= 1; k++) LAT.push({ p: [i * 0.9, j * 0.9, k * 0.9], na: (i + j + k + 3) % 2 === 0 });

export const saltCrystal = {
  id: 'nacl-crystal',
  name: 'Salt Crystal — NaCl',
  specs: 'Cubic lattice · each ion has 6 neighbours · ionic bonds · melts at 801 °C',
  about: 'Sodium gives its outer electron to chlorine; the Na⁺ and Cl⁻ ions then attract and stack into a perfect cube — that is why salt grains are cubes.',
  uz: {
    name: 'Osh tuzi kristali — NaCl',
    specs: 'Kubik panjara · har bir ionning 6 ta qo‘shnisi bor · ion bog‘lar · 801 °C da eriydi',
    about: 'Natriy tashqi elektronini xlorga beradi; keyin Na⁺ va Cl⁻ ionlari tortishib, mukammal kub shaklida teriladi — shuning uchun tuz donalari kubsimon.',
  },
  parts: [
    { name: 'Sodium ions (Na⁺)', color: C.purple, spread: 1.1,
      uz: ['Natriy ionlari (Na⁺)', 'Bitta elektronini yo‘qotgan natriy — musbat ion, xlor ionidan kichikroq.'],
      info: 'Sodium that lost one electron — a positive ion, smaller than chloride.',
      build: () => LAT.filter((a) => a.na).map((a) => atom(a.p, 0.2)) },
    { name: 'Chloride ions (Cl⁻)', color: C.green, spread: 1.1,
      uz: ['Xlor ionlari (Cl⁻)', 'Bitta elektron olgan xlor — manfiy ion, kattaroq.'],
      info: 'Chlorine that gained one electron — a larger negative ion.',
      build: () => LAT.filter((a) => !a.na).map((a) => atom(a.p, 0.3)) },
    { name: 'Ionic bonds (lattice)', color: GREY, spread: 0.3,
      uz: ['Ion bog‘lar (panjara)', 'Qarama-qarshi zaryadli ionlar orasidagi elektr tortishish kuchi.'],
      info: 'The electric attraction between oppositely charged ions.',
      build: () => {
        const b = [];
        for (const a of LAT) for (const c of LAT) {
          const d = Math.hypot(a.p[0] - c.p[0], a.p[1] - c.p[1], a.p[2] - c.p[2]);
          if (Math.abs(d - 0.9) < 1e-3 && a.p.join() < c.p.join()) b.push(bond(a.p, c.p, 0.025));
        }
        return merge(b);
      } },
  ],
};

// ---------------------------------------------------------------- lab glassware (tool)
export const labGlassware = {
  id: 'lab-glassware',
  name: 'Chemistry Lab Glassware',
  specs: 'Borosilicate glass · resists ~500 °C and sudden temperature changes',
  about: 'The basic tools of a chemistry lab: vessels to mix and heat, a burner, and graduated glass to measure volumes.',
  uz: {
    name: 'Kimyo laboratoriyasi idishlari',
    specs: 'Borosilikat shisha · ~500 °C ga va keskin harorat o‘zgarishiga chidaydi',
    about: 'Kimyo laboratoriyasining asosiy asboblari: aralashtirish va qizdirish uchun idishlar, gorelka va hajm o‘lchash uchun darajali shisha idishlar.',
  },
  parts: [
    { name: 'Erlenmeyer flask', color: C.cyan, spread: 0.8, edge: 8,
      uz: ['Konussimon kolba (Erlenmeyer)', 'Tor bo‘g‘zi aralashtirganda suyuqlik sachrashini oldini oladi.'],
      info: 'Its narrow neck stops liquid splashing out when you swirl it.',
      build: () => lathe([[0.01, 0], [0.55, 0], [0.55, 0.08], [0.15, 0.85], [0.15, 1.25], [0.19, 1.3]], { p: [-1.3, -0.6, 0.3], seg: 28 }) },
    { name: 'Beaker', color: C.blue, spread: 0.8, edge: 8,
      uz: ['Stakan (beher)', 'Suyuqliklarni aralashtirish va qizdirish uchun; shkalasi taxminiy.'],
      info: 'For mixing and heating; its scale is only approximate.',
      build: () => merge(cyl(0.45, 0.45, 1.0, { p: [0, -0.1, 0.4], seg: 28, open: true }), cyl(0.45, 0.45, 0.01, { p: [0, -0.6, 0.4], seg: 28 })) },
    { name: 'Test tubes & rack', color: C.white, spread: 0.8,
      uz: ['Probirkalar va shtativ', 'Kichik miqdordagi moddalar bilan tajriba o‘tkazish uchun.'],
      info: 'For small-scale reactions.',
      build: () => [merge(box(1.3, 0.06, 0.3, { p: [1.4, 0.2, -0.4] }), box(1.3, 0.06, 0.3, { p: [1.4, -0.55, -0.4] }), [-0.6, 0.6].map((x) => box(0.05, 0.8, 0.3, { p: [1.4 + x, -0.17, -0.4] }))),
        ...[1.0, 1.4, 1.8].map((x) => merge(cyl(0.09, 0.09, 1.0, { p: [x, 0.0, -0.4], seg: 14, open: true }), sphere(0.09, { p: [x, -0.5, -0.4], theta: [PI / 2, PI / 2], ws: 14, hs: 6 })))] },
    { name: 'Bunsen burner', color: C.orange, spread: 0.8, metal: 0.8,
      uz: ['Bunzen gorelkasi', 'Gaz havo bilan aralashib yonadi; havo teshigini ochsangiz, alanga ko‘k va issiqroq bo‘ladi.'],
      info: 'Gas mixes with air and burns; open the air hole for a hotter blue flame.',
      build: () => merge(cyl(0.3, 0.35, 0.08, { p: [-0.2, -0.6, -1.1], seg: 20 }), cyl(0.06, 0.06, 0.9, { p: [-0.2, -0.12, -1.1], seg: 12 })) },
    { name: 'Flame', color: C.yellow, spread: 0.8, ex: [0, 0.8, 0],
      uz: ['Alanga', 'Ichki ko‘k konus eng issiq joy — taxminan 1500 °C.'],
      info: 'The inner blue cone is the hottest part — about 1,500 °C.',
      build: () => merge(cyl(0, 0.07, 0.45, { p: [-0.2, 0.55, -1.1], seg: 12 }), cyl(0, 0.04, 0.25, { p: [-0.2, 0.45, -1.1], seg: 10 })) },
    { name: 'Graduated cylinder', color: C.lime, spread: 0.8,
      uz: ['O‘lchov silindri', 'Hajmni aniq o‘lchaydi; suyuqlik sathini meniskning pastidan o‘qing.'],
      info: 'Measures volume accurately; read the bottom of the meniscus.',
      build: () => merge(cyl(0.16, 0.16, 1.9, { p: [0.9, 0.35, 1.0], seg: 16, open: true }), cyl(0.32, 0.32, 0.06, { p: [0.9, -0.6, 1.0], seg: 16 }), Array.from({ length: 8 }, (_, i) => box(0.1, 0.01, 0.01, { p: [0.9, -0.3 + i * 0.2, 1.17] }))) },
  ],
};
