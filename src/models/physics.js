// PHYSICS: carbon atom, bar magnet, DC electric motor, Newton's cradle, dynamometer (tool).
// Texts are bilingual inline: `uz` on a model = { name, specs, about }, on a part = [nom, ma’lumot].
import * as THREE from 'three';
import { C, PI, merge, box, cyl, sphere, torus, tube, beam, helixPoints } from './primitives.js';

// ---------------------------------------------------------------- carbon atom (Bohr model)
// Electron shells are drawn as tilted rings; each shell spins around its own normal.
const tilted = (euler) => new THREE.Vector3(0, 0, 1).applyEuler(new THREE.Euler(...euler)).toArray();
const K_TILT = [0.35, 0, 0];
const L_TILT = [1.15, 0.5, 0];

function shell(R, electrons, tilt) {
  return merge(
    torus(R, 0.015, { r: tilt, rs: 4, ts: 96 }),
    Array.from({ length: electrons }, (_, k) => {
      const a = (k / electrons) * PI * 2;
      const p = new THREE.Vector3(Math.cos(a) * R, Math.sin(a) * R, 0).applyEuler(new THREE.Euler(...tilt));
      return sphere(0.11, { p: p.toArray(), ws: 12, hs: 8 });
    })
  );
}

// 12 nucleons packed on two small shells (Fibonacci sphere), alternating p / n.
const NUCLEONS = Array.from({ length: 12 }, (_, i) => {
  const r = i < 4 ? 0.16 : 0.36;
  const k = i < 4 ? i : i - 4;
  const n = i < 4 ? 4 : 8;
  const y = 1 - (2 * (k + 0.5)) / n;
  const a = k * 2.39996;
  const s = Math.sqrt(1 - y * y);
  return { p: [Math.cos(a) * s * r, y * r, Math.sin(a) * s * r], proton: i % 2 === 0 };
});

export const carbonAtom = {
  id: 'carbon-atom',
  name: 'Carbon Atom (Bohr model)',
  specs: 'Z = 6 · ¹²C: 6 protons, 6 neutrons, 6 electrons · shells 2, 4',
  about: 'Electrons occupy shells around a tiny dense nucleus. The 4 outer electrons let carbon form 4 bonds — the basis of all life.',
  uz: {
    name: 'Uglerod atomi (Bor modeli)',
    specs: 'Z = 6 · ¹²C: 6 proton, 6 neytron, 6 elektron · qobiqlar 2, 4',
    about: 'Elektronlar kichkina, zich yadro atrofidagi qobiqlarda joylashadi. Tashqi 4 ta elektron uglerodga 4 ta bog‘ hosil qilish imkonini beradi — barcha tirik mavjudotlar asosi.',
  },
  parts: [
    { name: 'Protons (6)', color: C.red, spread: 3,
      uz: ['Protonlar (6)', 'Musbat zaryadli zarralar. Ularning soni (6) atom raqami va element turini belgilaydi.'],
      info: 'Positively charged. Their number (6) is the atomic number — it decides which element this is.',
      build: () => NUCLEONS.filter((n) => n.proton).map((n) => sphere(0.15, { p: n.p, ws: 14, hs: 10 })) },
    { name: 'Neutrons (6)', color: C.white, spread: 3,
      uz: ['Neytronlar (6)', 'Zaryadsiz zarralar; ular yadroni birga ushlab turadi. Neytron soni har xil bo‘lsa — izotoplar (¹²C, ¹⁴C).'],
      info: 'No charge; they help hold the nucleus together. Different neutron counts give isotopes (¹²C, ¹⁴C).',
      build: () => NUCLEONS.filter((n) => !n.proton).map((n) => sphere(0.15, { p: n.p, ws: 14, hs: 10 })) },
    { name: 'K shell — 2 electrons', color: C.cyan, spread: 0, ex: [0, 0, 1.2], edge: 1,
      spin: { axis: tilted(K_TILT), speed: 1.6 },
      uz: ['K qobiq — 2 elektron', 'Yadroga eng yaqin qobiq; ko‘pi bilan 2 ta elektron sig‘adi.'],
      info: 'The innermost shell holds at most 2 electrons.',
      build: () => shell(1.25, 2, K_TILT) },
    { name: 'L shell — 4 valence electrons', color: C.lime, spread: 0, ex: [0, 0, -1.2], edge: 1,
      spin: { axis: tilted(L_TILT), speed: -1.0 },
      uz: ['L qobiq — 4 valent elektron', 'Tashqi qobiq 8 tagacha elektron sig‘diradi; ugleroddagi 4 ta elektron kimyoviy bog‘larda qatnashadi.'],
      info: 'The outer shell can hold 8; carbon’s 4 valence electrons take part in chemical bonds.',
      build: () => shell(2.2, 4, L_TILT) },
  ],
};

// ---------------------------------------------------------------- bar magnet + field lines
// Dipole field line in polar form: r = L·sin²θ (θ from the magnet axis, here the x axis),
// rotated around the axis by φ to fill 3D space.
function fieldLine(L, phi) {
  const pts = [];
  for (let k = 0; k <= 40; k++) {
    const th = 0.22 + (k / 40) * (PI - 0.44);
    const r = L * Math.sin(th) ** 2;
    const v = new THREE.Vector3(r * Math.cos(th), r * Math.sin(th), 0).applyAxisAngle(new THREE.Vector3(1, 0, 0), phi);
    pts.push(v.toArray());
  }
  return tube(pts, 0.012, { segments: 80, rs: 4 });
}

export const barMagnet = {
  id: 'bar-magnet',
  name: 'Bar Magnet & Field',
  specs: 'Field lines leave N and enter S · B ≈ 0.1–1 T at the poles',
  about: 'Opposite poles attract, like poles repel. Iron filings and compass needles line up along the invisible field lines.',
  uz: {
    name: 'Polosali magnit va maydon',
    specs: 'Kuch chiziqlari N qutbdan chiqib, S qutbga kiradi · qutblarda B ≈ 0,1–1 T',
    about: 'Har xil qutblar tortishadi, bir xil qutblar itarishadi. Temir qipiqlari va kompas strelkalari ko‘rinmas kuch chiziqlari bo‘ylab tiziladi.',
  },
  parts: [
    { name: 'North pole (N)', color: C.red, spread: 0, ex: [0.8, 0, 0],
      uz: ['Shimoliy qutb (N)', 'Kuch chiziqlari shu qutbdan chiqadi. Erkin osilgan magnitning bu uchi Yerning shimoliga qaraydi.'],
      info: 'Field lines leave from here. A freely hanging magnet points this end to Earth’s north.',
      build: () => box(0.9, 0.4, 0.4, { p: [0.45, 0, 0] }) },
    { name: 'South pole (S)', color: C.blue, spread: 0, ex: [-0.8, 0, 0],
      uz: ['Janubiy qutb (S)', 'Kuch chiziqlari shu qutbga qaytib kiradi. Magnitni sindirsangiz ham har bo‘lagida yana N va S bo‘ladi.'],
      info: 'Field lines return here. Break a magnet and each piece again has an N and an S.',
      build: () => box(0.9, 0.4, 0.4, { p: [-0.45, 0, 0] }) },
    { name: 'Magnetic field lines', color: C.yellow, spread: 0.6, edge: 40,
      uz: ['Magnit kuch chiziqlari', 'Chiziqlar zich joyda maydon kuchli. Ular hech qachon kesishmaydi.'],
      info: 'Where lines are closer together the field is stronger. They never cross.',
      build: () => [1.6, 2.4, 3.3].flatMap((L) => [0, 1, 2, 3, 4, 5].map((k) => fieldLine(L, (k * PI) / 3))) },
    { name: 'Compass needles', color: C.white, spread: 0.4,
      uz: ['Kompas strelkalari', 'Strelka maydon yo‘nalishi bo‘ylab buriladi: magnit tashqarisida N dan S tomonga.'],
      info: 'Each needle turns to follow the field: outside the magnet it points from N toward S.',
      build: () => [0, 1, 2, 3, 4, 5].map((k) => {
        const p = new THREE.Vector3(0, 2.0, 0).applyAxisAngle(new THREE.Vector3(1, 0, 0), (k * PI) / 3);
        return merge(cyl(0, 0.07, 0.25, { p: [p.x - 0.12, p.y, p.z], r: [0, 0, PI / 2], seg: 8 }), cyl(0.07, 0, 0.25, { p: [p.x + 0.12, p.y, p.z], r: [0, 0, PI / 2], seg: 8 }));
      }) },
  ],
};

// ---------------------------------------------------------------- DC electric motor (axis = x)
const alongX = (o = {}) => ({ ...o, r: [0, 0, PI / 2] });

export const dcMotor = {
  id: 'dc-motor',
  name: 'DC Electric Motor',
  specs: 'Permanent-magnet stator · 3-pole armature · split-ring commutator · 6–12 V',
  about: 'Current in the coil makes it an electromagnet; the magnets push and pull it round. The commutator flips the current every half-turn so it keeps spinning.',
  uz: {
    name: 'O‘zgarmas tok elektr motori',
    specs: 'Doimiy magnitli stator · 3 qutbli yakor · bo‘lingan halqali kollektor · 6–12 V',
    about: 'G‘altakdan oqqan tok uni elektromagnitga aylantiradi; magnitlar uni itarib-tortib aylantiradi. Kollektor har yarim aylanishda tok yo‘nalishini almashtiradi, shuning uchun motor to‘xtamay aylanadi.',
  },
  parts: [
    { name: 'Housing', color: C.blue, spread: 0, ex: [0, 1.6, 0], edge: 8,
      uz: ['Korpus', 'Hamma qismlarni ushlab turadi va magnit oqimini yopiq zanjirga keltiradi.'],
      info: 'Holds everything together and closes the magnetic circuit.',
      build: () => cyl(0.95, 0.95, 1.6, alongX({ seg: 32, hs: 3, open: true })) },
    { name: 'Permanent magnets (stator)', color: C.red, spread: 1.3, metal: 0.6,
      uz: ['Doimiy magnitlar (stator)', 'Qo‘zg‘almas qism: yakorni o‘rab turuvchi ikki yarim silindrsimon N va S magnit.'],
      info: 'The stationary part: two curved magnets, N and S, around the armature.',
      // Two curved shells, each covering ~140° of the circle, opposite each other.
      build: () => [0, 1].map((i) => cylFrom(new THREE.CylinderGeometry(0.85, 0.85, 1.4, 16, 1, true, i * PI + 0.35, PI - 0.7), alongX())) },
    { name: 'Armature (rotor coils)', color: C.orange, spread: 0, ex: [0, 0, 1.5], metal: 0.7,
      spin: { axis: [1, 0, 0], speed: 4 },
      uz: ['Yakor (rotor g‘altaklari)', 'Temir o‘zakka o‘ralgan mis g‘altaklar; tok o‘tganda elektromagnitga aylanadi va aylanadi.'],
      info: 'Copper coils on an iron core; with current they become electromagnets and turn.',
      build: () => merge(cyl(0.22, 0.22, 1.1, alongX({ seg: 16 })), [0, 1, 2].map((k) => {
        const a = (k * 2 * PI) / 3;
        return [box(1.0, 0.36, 0.22, { p: [0, Math.cos(a) * 0.45, Math.sin(a) * 0.45], r: [a, 0, 0] }), box(1.05, 0.08, 0.42, { p: [0, Math.cos(a) * 0.68, Math.sin(a) * 0.68], r: [a, 0, 0] })];
      })) },
    { name: 'Commutator', color: C.yellow, spread: 0, ex: [1.4, 0.6, 0], metal: 0.9,
      spin: { axis: [1, 0, 0], speed: 4 },
      uz: ['Kollektor', 'Bo‘laklangan mis halqa: har yarim aylanishda g‘altakdagi tok yo‘nalishini almashtiradi.'],
      info: 'A split copper ring that reverses the coil current every half-turn.',
      build: () => merge([0, 1, 2].map((k) => {
        const g = new THREE.CylinderGeometry(0.16, 0.16, 0.3, 8, 1, true, (k * 2 * PI) / 3 + 0.1, (2 * PI) / 3 - 0.2);
        return cylFrom(g, alongX({ p: [0.95, 0, 0] }));
      })) },
    { name: 'Carbon brushes', color: C.white, spread: 1.4,
      uz: ['Ko‘mir cho‘tkalar', 'Aylanayotgan kollektorga sirpanib tegib, unga tok yetkazadi.'],
      info: 'Slide on the spinning commutator and feed it current.',
      build: () => [1, -1].map((s) => box(0.14, 0.22, 0.12, { p: [0.95, 0.28 * s, 0] })) },
    { name: 'Shaft', color: C.white, spread: 0, ex: [0, -1.4, 0], metal: 0.9,
      spin: { axis: [1, 0, 0], speed: 4 },
      uz: ['Val', 'Aylanish harakatini tashqariga — g‘ildirak, ventilyator yoki nasosga uzatadi.'],
      info: 'Carries the rotation out to a wheel, fan or pump.',
      build: () => cyl(0.05, 0.05, 2.6, alongX({ p: [0.1, 0, 0], seg: 10 })) },
    { name: 'Terminals', color: C.lime, spread: 0, ex: [1.2, -0.9, 0],
      uz: ['Kontaktlar', 'Batareyaning + va − simlari shu yerga ulanadi; qutblarni almashtirsangiz motor teskari aylanadi.'],
      info: 'Battery + and − connect here; swap them and the motor spins the other way.',
      build: () => [1, -1].map((s) => box(0.06, 0.3, 0.1, { p: [1.15, -0.55, 0.25 * s] })) },
  ],
};

// Turn any CylinderGeometry (e.g. a partial one) into a prim geometry along an axis.
function cylFrom(g, o = {}) {
  const geo = g.toNonIndexed();
  g.dispose();
  for (const name of Object.keys(geo.attributes)) if (name !== 'position' && name !== 'normal') geo.deleteAttribute(name);
  const m = new THREE.Matrix4().compose(
    new THREE.Vector3(...(o.p || [0, 0, 0])),
    new THREE.Quaternion().setFromEuler(new THREE.Euler(...(o.r || [0, 0, PI / 2]))),
    new THREE.Vector3(1, 1, 1)
  );
  geo.applyMatrix4(m);
  return geo;
}

// ---------------------------------------------------------------- Newton's cradle
const BALL_X = [-0.84, -0.42, 0, 0.42, 0.84];

export const newtonsCradle = {
  id: 'newtons-cradle',
  name: 'Newton’s Cradle',
  specs: '5 steel balls · elastic collisions · momentum p = m·v and energy are conserved',
  about: 'Lift one ball and release it: one ball flies out the other side. Momentum and kinetic energy pass through the row almost without loss.',
  uz: {
    name: 'Nyuton beshigi',
    specs: '5 ta po‘lat shar · elastik to‘qnashuvlar · impuls p = m·v va energiya saqlanadi',
    about: 'Bitta sharni ko‘tarib qo‘yib yuboring — narigi tomondan bitta shar uchib chiqadi. Impuls va kinetik energiya qator bo‘ylab deyarli yo‘qolmasdan uzatiladi.',
  },
  parts: [
    { name: 'Steel balls', color: C.cyan, spread: 1.2, metal: 0.95, rough: 0.15,
      uz: ['Po‘lat sharlar', 'Bir xil massali qattiq sharlar: urilganda energiyani deyarli yo‘qotmasdan uzatadi.'],
      info: 'Equal-mass hard balls: they pass energy on almost without loss.',
      build: () => BALL_X.map((x) => sphere(0.2, { p: [x, 0, 0], ws: 20, hs: 14 })) },
    { name: 'Strings', color: C.white, spread: 0.6, ex: [0, 0.6, 0],
      uz: ['Iplar', 'Har bir shar V shaklidagi ikki ipga osilgan — shunda u faqat bir tekislikda tebranadi.'],
      info: 'Each ball hangs on a V of two strings so it can only swing in one plane.',
      build: () => BALL_X.map((x) => merge(beam([x, 0.2, 0], [x, 1.6, 0.45], 0.006, { seg: 4 }), beam([x, 0.2, 0], [x, 1.6, -0.45], 0.006, { seg: 4 }))) },
    { name: 'Frame', color: C.purple, spread: 0, ex: [0, 1.2, 0], metal: 0.8,
      uz: ['Rama', 'Iplar osilgan ikki ko‘ndalang tayoq va ularni ushlab turuvchi tirgaklar.'],
      info: 'Two top rails the strings hang from, on four uprights.',
      build: () => merge(
        [0.45, -0.45].map((z) => beam([-1.4, 1.6, z], [1.4, 1.6, z], 0.03)),
        [-1.4, 1.4].flatMap((x) => [0.45, -0.45].map((z) => beam([x, -0.5, z], [x, 1.6, z], 0.03)))
      ) },
    { name: 'Base', color: C.orange, spread: 0, ex: [0, -1.2, 0],
      uz: ['Asos', 'Og‘ir taglik — tebranish paytida qurilmani qimirlatmay ushlab turadi.'],
      info: 'A heavy base keeps the cradle still while the balls swing.',
      build: () => box(3.1, 0.1, 1.2, { p: [0, -0.55, 0] }) },
  ],
};

// ---------------------------------------------------------------- dynamometer (tool)
export const dynamometer = {
  id: 'dynamometer',
  name: 'Dynamometer (spring scale)',
  specs: 'Measures force in newtons · Hooke’s law F = k·x · range 0–10 N',
  about: 'The spring stretches in proportion to the force (Hooke’s law), so the pointer on the scale shows the force directly.',
  uz: {
    name: 'Dinamometr (prujinali tarozi)',
    specs: 'Kuchni nyutonda o‘lchaydi · Guk qonuni F = k·x · o‘lchash oralig‘i 0–10 N',
    about: 'Prujina kuchga proporsional cho‘ziladi (Guk qonuni), shuning uchun shkaladagi ko‘rsatkich kuchni to‘g‘ridan-to‘g‘ri ko‘rsatadi.',
  },
  parts: [
    { name: 'Spring', color: C.yellow, spread: 0, ex: [1.2, 0, 0], metal: 0.9,
      uz: ['Prujina', 'Cho‘zilishi x qo‘yilgan kuch F ga proporsional: F = k·x (k — bikirlik).'],
      info: 'Its stretch x is proportional to the force F: F = k·x (k is the stiffness).',
      build: () => tube(helixPoints(0.16, 1.6, 12, { y0: -0.2 }), 0.02, { segments: 320, rs: 5 }) },
    { name: 'Housing tube', color: C.cyan, spread: 0, ex: [-1.3, 0, 0], edge: 10,
      uz: ['Korpus naychasi', 'Prujinani himoya qiladi va shkalani ushlab turadi.'],
      info: 'Protects the spring and carries the scale.',
      build: () => cyl(0.26, 0.26, 2.4, { p: [0, 0.6, 0], seg: 20, hs: 2, open: true }) },
    { name: 'Scale (newtons)', color: C.white, spread: 0, ex: [0, 0, 1.4],
      uz: ['Shkala (nyuton)', 'Teng bo‘linmalar: prujina chiziqli cho‘zilgani uchun shkala ham bir tekis.'],
      info: 'Evenly spaced marks — because the spring stretches linearly, the scale is uniform.',
      build: () => merge(box(0.3, 2.0, 0.02, { p: [0, 0.6, 0.27] }), Array.from({ length: 11 }, (_, i) => box(i % 5 === 0 ? 0.2 : 0.12, 0.012, 0.03, { p: [0.04, -0.3 + i * 0.18, 0.29] }))) },
    { name: 'Pointer', color: C.red, spread: 0, ex: [0.6, 0, 1.6],
      uz: ['Ko‘rsatkich', 'Prujina uchiga mahkamlangan; shkalada kuch qiymatini ko‘rsatadi.'],
      info: 'Fixed to the end of the spring; shows the force on the scale.',
      build: () => cyl(0, 0.05, 0.25, { p: [0.12, -0.25, 0.3], r: [0, 0, PI / 2], seg: 6 }) },
    { name: 'Hook & ring', color: C.lime, spread: 0, ex: [0, -1.2, 0],
      uz: ['Ilgak va halqa', 'Yuqoridagi halqadan ushlanadi, pastki ilgakka yuk osiladi.'],
      info: 'Hold it by the top ring; hang the load on the bottom hook.',
      build: () => [torus(0.16, 0.025, { p: [0, 2.0, 0], rs: 5, ts: 24 }), merge(cyl(0.02, 0.02, 0.5, { p: [0, -0.6, 0], seg: 6 }), torus(0.12, 0.022, { p: [0.12, -0.95, 0], arc: PI * 1.3, r: [0, 0, PI], rs: 5, ts: 20 }))] },
  ],
};
