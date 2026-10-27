// ASTRONOMY additions: the Solar System (planets) and a refracting telescope (tool).
import { C, PI, merge, box, cyl, sphere, torus, beam } from './primitives.js';

// Distances and sizes are compressed so all eight planets fit on screen; the order and the
// relative sizes (giants vs rocky planets) are right.
const PLANETS = [
  ['Mercury', 'Merkuriy', 0.12, 1.4, 0.4, C.white, 'Closest to the Sun; a year lasts 88 days. No air, so −180 °C at night and 430 °C by day.', 'Quyoshga eng yaqin; bir yili 88 kun. Havosi yo‘q: kechasi −180 °C, kunduzi 430 °C.'],
  ['Venus', 'Venera', 0.2, 1.9, 2.1, C.yellow, 'Hottest planet (~465 °C) under thick CO₂ clouds; it spins backwards.', 'Eng issiq sayyora (~465 °C), qalin CO₂ bulutlari ostida; teskari aylanadi.'],
  ['Earth', 'Yer', 0.21, 2.5, 4.0, C.blue, 'Our home: the only known world with liquid surface water and life. One Moon.', 'Bizning uyimiz: suyuq suv va hayot borligi ma’lum bo‘lgan yagona sayyora. Bitta yo‘ldoshi bor — Oy.'],
  ['Mars', 'Mars', 0.16, 3.1, 5.6, C.red, 'The red planet: iron rust in its soil. Home of Olympus Mons, the tallest volcano (~22 km).', 'Qizil sayyora: tuprog‘ida temir zangi bor. Eng baland vulqon — Olimp tog‘i (~22 km) shu yerda.'],
  ['Jupiter', 'Yupiter', 0.55, 4.3, 1.2, C.orange, 'The biggest planet: 1,300 Earths fit inside. The Great Red Spot is a storm older than 300 years.', 'Eng katta sayyora: ichiga 1300 ta Yer sig‘adi. Katta Qizil Dog‘ — 300 yildan ortiq davom etayotgan bo‘ron.'],
  ['Saturn', 'Saturn', 0.46, 5.5, 3.2, C.lime, 'Famous for its rings of ice and rock; it is light enough to float on water.', 'Muz va toshdan iborat halqalari bilan mashhur; suvga solsangiz qalqib turadigan darajada yengil.'],
  ['Uranus', 'Uran', 0.3, 6.5, 5.0, C.teal, 'An ice giant tipped on its side (98°) — it rolls around the Sun.', 'Yonboshlab yotgan muz giganti (98°) — Quyosh atrofida dumalab aylanadi.'],
  ['Neptune', 'Neptun', 0.29, 7.4, 0.2, C.purple, 'The windiest planet: storms reach ~2,100 km/h. Found by mathematics before it was seen.', 'Eng shamolli sayyora: bo‘ronlar ~2100 km/soat. Ko‘rishdan oldin matematik hisob-kitob orqali topilgan.'],
];

export const solarSystem = {
  id: 'solar-system',
  name: 'Solar System',
  tilt: 0.55, // look down onto the orbital plane
  specs: '1 star · 8 planets · ~4.6 billion years old · sizes and distances not to scale',
  about: 'Eight planets orbit the Sun: four small rocky ones close in, four giants of gas and ice further out.',
  uz: {
    name: 'Quyosh tizimi',
    specs: '1 yulduz · 8 sayyora · yoshi ~4,6 milliard yil · o‘lcham va masofalar masshtabda emas',
    about: 'Quyosh atrofida sakkizta sayyora aylanadi: yaqinda to‘rtta kichik toshli sayyora, uzoqroqda gaz va muzdan iborat to‘rtta gigant.',
  },
  parts: [
    { name: 'Sun', color: C.yellow, spread: 0, edge: 6,
      uz: ['Quyosh', 'Tizim massasining 99,86 % i. Har soniyada 600 million tonna vodorodni geliyga aylantiradi.'],
      info: '99.86 % of the system’s mass. It fuses 600 million tonnes of hydrogen into helium every second.',
      build: () => sphere(0.8, { ws: 28, hs: 18 }) },
    { name: 'Orbits', color: C.white, spread: 0, ex: [0, -0.6, 0], edge: 40,
      uz: ['Orbitalar', 'Sayyoralar yo‘llari deyarli bir tekislikda yotadi — tizim gazli diskdan paydo bo‘lgani uchun.'],
      info: 'The planets’ paths lie almost in one plane — the system formed from a flat disc of gas.',
      build: () => merge(PLANETS.map((p) => torus(p[3], 0.006, { r: [PI / 2, 0, 0], rs: 3, ts: 120 }))) },
    ...PLANETS.map(([name, uzName, r, d, a, color, info, uzInfo], i) => ({
      name,
      color,
      spread: 0.5,
      edge: 8,
      uz: [uzName, uzInfo],
      info,
      build: () => {
        const p = [Math.cos(a) * d, 0, Math.sin(a) * d];
        const planet = sphere(r, { p, ws: 20, hs: 14 });
        return i === 5 ? merge(planet, torus(r * 1.75, r * 0.32, { p, r: [PI / 2 - 0.45, 0, 0], s: [1, 1, 0.08], rs: 3, ts: 40 })) : planet;
      },
    })),
  ],
};

// ---------------------------------------------------------------- refracting telescope (tool)
// Tube along a tilted axis; built in local "along x" coordinates then raised 30°.
const TILT = [0, 0, 0.52];
const ax = (x, y = 0, z = 0) => [x * Math.cos(TILT[2]) - y * Math.sin(TILT[2]), x * Math.sin(TILT[2]) + y * Math.cos(TILT[2]) + 1.0, z];
const tubeAlong = (r1, r2, x0, x1, o = {}) => beam(ax(x0), ax(x1), r1, { rt: r2, seg: o.seg ?? 24, open: o.open ?? true, hs: o.hs ?? 2 });

export const telescope = {
  id: 'telescope',
  name: 'Refracting Telescope',
  specs: '80 mm objective lens · 900 mm focal length · magnification = f(objective) ÷ f(eyepiece)',
  about: 'A big lens gathers far more light than your eye and focuses it; the eyepiece then magnifies that image. Galileo first aimed one at the sky in 1609.',
  uz: {
    name: 'Refraktor teleskop',
    specs: 'Obyektiv linzasi 80 mm · fokus masofasi 900 mm · kattalashtirish = f(obyektiv) ÷ f(okulyar)',
    about: 'Katta linza ko‘zdan ancha ko‘p yorug‘lik to‘playdi va uni fokuslaydi; okulyar esa bu tasvirni kattalashtiradi. Galiley uni birinchi bo‘lib 1609-yilda osmonga qaratgan.',
  },
  parts: [
    { name: 'Objective lens', color: C.cyan, spread: 0, ex: [1.2, 0.8, 0], edge: 6,
      uz: ['Obyektiv linza', 'Yorug‘likni yig‘uvchi asosiy linza; diametri qancha katta bo‘lsa, shuncha xira jismlarni ko‘rsatadi.'],
      info: 'The main light-collecting lens; the bigger it is, the fainter the objects you can see.',
      build: () => sphere(0.42, { p: ax(1.55), s: [0.18, 1, 1], r: TILT, ws: 24, hs: 12 }) },
    { name: 'Optical tube', color: C.blue, spread: 0, ex: [0, 1.0, 0], edge: 10,
      uz: ['Optik truba', 'Linzalarni aniq masofada ushlaydi va begona yorug‘likni to‘sadi.'],
      info: 'Holds the lenses at the right distance and blocks stray light.',
      build: () => tubeAlong(0.32, 0.36, -1.4, 1.5) },
    { name: 'Dew shield', color: C.purple, spread: 0, ex: [1.4, 0.4, 0],
      uz: ['Shudring qalqoni', 'Linzani shudring va yon yorug‘likdan himoya qiladi.'],
      info: 'Keeps dew and side light off the lens.',
      build: () => tubeAlong(0.42, 0.42, 1.5, 2.1) },
    { name: 'Focuser', color: C.white, spread: 0, ex: [-1.2, 0.2, 0], metal: 0.8,
      uz: ['Fokuslagich', 'Okulyarni oldinga-orqaga surib, tasvirni tiniq qiladi.'],
      info: 'Moves the eyepiece in and out to make the image sharp.',
      build: () => merge(tubeAlong(0.14, 0.14, -1.85, -1.4, { open: false }), cyl(0.07, 0.07, 0.3, { p: ax(-1.6, 0, 0.2), r: [PI / 2, 0, 0], seg: 10 })) },
    { name: 'Eyepiece', color: C.yellow, spread: 0, ex: [-1.6, -0.2, 0],
      uz: ['Okulyar', 'Ko‘z qo‘yiladigan kichik linza: obyektiv hosil qilgan tasvirni kattalashtiradi.'],
      info: 'The small lens you look through: it magnifies the image made by the objective.',
      build: () => merge(tubeAlong(0.08, 0.1, -2.25, -1.85, { open: false }), beam(ax(-2.0), [ax(-2.0)[0] - 0.25, ax(-2.0)[1] - 0.25, 0], 0.07, { seg: 10 })) },
    { name: 'Finder scope', color: C.lime, spread: 0, ex: [0, 1.4, 0.6],
      uz: ['Qidiruv trubasi', 'Keng ko‘rish maydonli kichik truba — avval jismni shu bilan topasiz.'],
      info: 'A small wide-view scope used to aim the telescope first.',
      build: () => beam(ax(-0.6, 0.48), ax(0.4, 0.48), 0.07, { seg: 12, open: true }) },
    { name: 'Mount', color: C.orange, spread: 0, ex: [0, -0.4, 1.2], metal: 0.7,
      uz: ['Montirovka', 'Trubani tepaga-pastga va chapga-o‘ngga aylantiradigan bosh qism.'],
      info: 'The head that lets the tube turn up-down and left-right.',
      build: () => merge(box(0.3, 0.35, 0.3, { p: [0, 0.75, 0] }), cyl(0.05, 0.05, 0.6, { p: [0, 0.95, 0], r: [PI / 2, 0, 0], seg: 10 })) },
    { name: 'Tripod', color: C.white, spread: 0.6, ex: [0, -1.0, 0],
      uz: ['Shtativ', 'Uch oyoq har qanday notekis yerda ham qimirlamay turadi.'],
      info: 'Three legs stand steady on any uneven ground.',
      build: () => [0, 1, 2].map((k) => {
        const a = (k * 2 * PI) / 3 + PI / 2;
        return beam([0, 0.6, 0], [Math.cos(a) * 1.1, -1.4, Math.sin(a) * 1.1], 0.04, { seg: 6 });
      }) },
  ],
};
