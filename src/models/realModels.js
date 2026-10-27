// REAL 3D: detailed, textured models downloaded at runtime (GLB / glTF) from
//   - three.js examples (Ferrari 458 Italia)
//   - Khronos glTF-Sample-Models (engine, gearbox, buggy, helmets, camera, lantern)
// Each model keeps its own licence from those repositories; see README > Credits.
// `match` picks meshes by name; a part without `match` takes all remaining meshes.

import { C } from './primitives.js';

const K = 'https://cdn.jsdelivr.net/gh/KhronosGroup/glTF-Sample-Models@master/2.0';
const T = 'https://cdn.jsdelivr.net/gh/mrdoob/three.js@r160/examples/models/gltf';

export const ferrari = {
  id: 'ferrari-458',
  name: 'Ferrari 458 Italia',
  gltf: { url: `${T}/ferrari.glb` },
  specs: '4.5 L V8 · 570 hp · 0–100 km/h in 3.4 s · 325 km/h top speed',
  about: 'A mid-engined Italian supercar (2009) as a detailed real 3D model. Open your hand and the body, glass, wheels, brakes and cabin come apart.',
  uz: {
    name: 'Ferrari 458 Italia',
    specs: '4,5 l V8 · 570 o.k. · 0–100 km/soat 3,4 soniyada · maksimal tezlik 325 km/soat',
    about: 'Dvigateli o‘rtada joylashgan italyan superkari (2009) — batafsil haqiqiy 3D model. Qo‘lingizni oching: kuzov, oynalar, g‘ildiraklar, tormozlar va salon ajraladi.',
  },
  parts: [
    { name: 'Body', match: /^body/i, color: C.red,
      uz: ['Kuzov', 'Aerodinamik shakl tezlikda mashinani yo‘lga bosib turadi; bo‘yoq ustida tiniq lak qatlami bor.'],
      info: 'The aerodynamic shape presses the car onto the road at speed; the paint has a clear-coat on top.' },
    { name: 'Glass', match: /^glass/i, color: C.cyan,
      uz: ['Oynalar', 'Old oyna laminatlangan: sinsa ham bo‘laklari salonga sochilmaydi.'],
      info: 'The windscreen is laminated, so even when broken it does not shatter into the cabin.' },
    { name: 'Wheels & tyres', match: /^(wheel|tire|tyre|rim|centre|nuts)/i, color: C.white,
      uz: ['G‘ildiraklar va shinalar', 'Yengil qotishmali disklar va keng past profilli shinalar burilishda yaxshi tutadi.'],
      info: 'Light alloy rims and wide low-profile tyres give grip in corners.' },
    { name: 'Brakes', match: /^brake/i, color: C.orange,
      uz: ['Tormozlar', 'Uglerod-keramik disklar 300 km/soatdan ham ishonchli to‘xtatadi.'],
      info: 'Carbon-ceramic discs stop the car reliably even from 300 km/h.' },
    { name: 'Interior', match: /^(leather|carpet|interior|steering)/i, color: C.yellow,
      uz: ['Salon', 'Charm o‘rindiqlar, gilam va uglerod tolali rul.'],
      info: 'Leather seats, carpet and a carbon-fibre steering wheel.' },
    { name: 'Lights', match: /^(lights|leds)/i, color: C.lime,
      uz: ['Chiroqlar', 'LED faralar va orqa chiroqlar.'],
      info: 'LED headlights and tail lights.' },
    { name: 'Carbon fibre', match: /^carbon/i, color: C.purple,
      uz: ['Uglerod tola', 'Po‘latdan 5 baravar yengil, lekin mustahkam — og‘irlikni kamaytiradi.'],
      info: 'Five times lighter than steel yet strong — it saves weight.' },
    { name: 'Chrome & trim', match: /^(chrome|trim|yellow_trim|metal|blue)/i, color: C.teal,
      uz: ['Xrom va bezaklar', 'Xromlangan va bo‘yalgan bezak detallari, Ferrari nishonlari.'],
      info: 'Chrome and painted trim pieces and the Ferrari badges.' },
    { name: 'Other parts', color: C.blue,
      uz: ['Boshqa qismlar', 'Panjaralar, plastik detallar va oyna tozalagichlar.'],
      info: 'Grilles, plastic pieces and wipers.' },
  ],
};

export const twoCylinderEngine = {
  id: 'two-cylinder-engine',
  name: 'Two-Cylinder Engine',
  gltf: { url: `${K}/2CylinderEngine/glTF-Binary/2CylinderEngine.glb` },
  specs: 'Real CAD model · 67 machined parts · crankcase, pistons, rods, crankshaft, lifters',
  about: 'An engineering CAD model of a small two-cylinder engine. Open your hand: every bolt, rod and lifter flies out on its own.',
  uz: {
    name: 'Ikki silindrli dvigatel',
    specs: 'Haqiqiy CAD model · 67 ta detal · karter, porshenlar, shatunlar, tirsakli val, itargichlar',
    about: 'Kichik ikki silindrli dvigatelning muhandislik CAD modeli. Qo‘lingizni oching: har bir bolt, shatun va itargich alohida uchib chiqadi.',
  },
  parts: [
    { name: 'Engine components (67)', color: C.orange,
      uz: ['Dvigatel detallari (67 ta)', 'Porshenlar silindrda yuradi, shatunlar ularni tirsakli valga ulaydi, itargichlar esa klapanlarni ochadi.'],
      info: 'Pistons slide in the cylinders, connecting rods link them to the crankshaft, lifters open the valves.' },
  ],
};

export const gearbox = {
  id: 'gearbox-assembly',
  name: 'Gearbox Assembly',
  gltf: { url: `${K}/GearboxAssy/glTF-Binary/GearboxAssy.glb` },
  specs: 'Real CAD model · 95 parts · gears, shafts, bearings, housing',
  about: 'Meshing gears of different sizes trade speed for torque. A small gear driving a big one turns it slower but with more force.',
  uz: {
    name: 'Reduktor (uzatmalar qutisi)',
    specs: 'Haqiqiy CAD model · 95 ta detal · tishli g‘ildiraklar, vallar, podshipniklar, korpus',
    about: 'Har xil o‘lchamdagi tishli g‘ildiraklar tezlikni kuchga almashtiradi: kichik g‘ildirak kattasini sekinroq, lekin kuchliroq aylantiradi.',
  },
  parts: [
    { name: 'Gears, shafts & housing (95)', color: C.cyan,
      uz: ['Tishli g‘ildiraklar, vallar va korpus (95 ta)', 'Uzatish soni = yetaklanuvchi g‘ildirak tishlari ÷ yetaklovchi g‘ildirak tishlari.'],
      info: 'Gear ratio = teeth on the driven gear ÷ teeth on the driving gear.' },
  ],
};

export const buggy = {
  id: 'buggy',
  name: 'Off-road Buggy',
  gltf: { url: `${K}/Buggy/glTF-Binary/Buggy.glb` },
  specs: 'Real CAD model · 190 parts · tubular frame, long-travel suspension, wheels, engine',
  about: 'A lightweight tube-frame buggy built for sand and dirt. Open your hand to fly all 190 parts apart.',
  uz: {
    name: 'Yo‘ltanlamas bagi',
    specs: 'Haqiqiy CAD model · 190 ta detal · quvurli rama, uzun yo‘lli osma, g‘ildiraklar, dvigatel',
    about: 'Qum va loy yo‘llar uchun yengil quvurli ramali bagi. Qo‘lingizni oching — 190 ta detalning hammasi ajralib ketadi.',
  },
  parts: [
    { name: 'Buggy parts (190)', color: C.lime,
      uz: ['Bagi detallari (190 ta)', 'Quvurli rama yengil va mustahkam; uzun osma notekis yerda g‘ildiraklarni yerga bosib turadi.'],
      info: 'The tube frame is light and strong; the long suspension keeps the wheels on rough ground.' },
  ],
};

export const flightHelmet = {
  id: 'flight-helmet',
  name: 'Pilot Flight Helmet',
  gltf: { url: `${K}/FlightHelmet/glTF/FlightHelmet.gltf` },
  specs: 'WWII-era leather flying helmet · goggles · oxygen mask and hose',
  about: 'Open-cockpit pilots needed warm leather, goggles against the wind and an oxygen mask at high altitude.',
  uz: {
    name: 'Uchuvchi dubulg‘asi',
    specs: 'Ikkinchi jahon urushi davri charm dubulg‘asi · ko‘zoynak · kislorod niqobi va shlangi',
    about: 'Ochiq kabinali uchuvchilarga issiq charm, shamoldan himoya qiluvchi ko‘zoynak va balandda kislorod niqobi kerak bo‘lgan.',
  },
  parts: [
    { name: 'Leather cap', match: /^Leather/i, color: C.orange,
      uz: ['Charm qalpoq', 'Sovuq balandlikda boshni issiq saqlaydi.'], info: 'Keeps the head warm at cold altitudes.' },
    { name: 'Goggle lenses', match: /^Lenses/i, color: C.cyan,
      uz: ['Ko‘zoynak linzalari', 'Ko‘zlarni shamol, sovuq va moydan himoya qiladi.'], info: 'Protect the eyes from wind, cold and oil.' },
    { name: 'Glass & plastic', match: /^GlassPlastic/i, color: C.blue,
      uz: ['Shisha va plastik', 'Ko‘zoynak romi va niqob qismlari.'], info: 'Goggle frames and mask pieces.' },
    { name: 'Metal parts', match: /^MetalParts/i, color: C.white,
      uz: ['Metall qismlar', 'Toqalar, halqalar va ulagichlar.'], info: 'Buckles, rings and connectors.' },
    { name: 'Rubber & wood', match: /^RubberWood/i, color: C.yellow,
      uz: ['Rezina va yog‘och', 'Niqob rezinasi va yog‘och taglik.'], info: 'Mask rubber and the wooden stand.' },
    { name: 'Oxygen hose', match: /^Hose/i, color: C.lime,
      uz: ['Kislorod shlangi', 'Balandda kislorodni niqobga yetkazadi.'], info: 'Brings oxygen to the mask at altitude.' },
  ],
};

export const antiqueCamera = {
  id: 'antique-camera',
  name: 'Antique Camera',
  gltf: { url: `${K}/AntiqueCamera/glTF-Binary/AntiqueCamera.glb` },
  specs: 'Bellows plate camera on a wooden tripod · lens, bellows, ground-glass screen',
  about: 'The lens projects an upside-down image onto a glass plate; the leather bellows slide to focus. Photography’s great-grandfather.',
  uz: {
    name: 'Qadimiy fotoapparat',
    specs: 'Yog‘och shtativdagi mexli plastinkali fotoapparat · obyektiv, mexlar, xira shisha ekran',
    about: 'Obyektiv teskari tasvirni shisha plastinkaga tushiradi; charm mexlar surilib fokuslanadi. Fotografiyaning bobokaloni.',
  },
  parts: [
    { name: 'Camera body', match: /^camera/i, color: C.orange,
      uz: ['Fotoapparat korpusi', 'Obyektiv, mexlar va tasvir tushadigan plastinka.'], info: 'The lens, bellows and the plate the image falls on.' },
    { name: 'Tripod', match: /^tripod/i, color: C.yellow,
      uz: ['Shtativ', 'Uzoq ekspozitsiya paytida apparatni qimirlatmay ushlab turadi.'], info: 'Holds the camera dead still during long exposures.' },
  ],
};

export const lantern = {
  id: 'lantern',
  name: 'Street Lantern',
  gltf: { url: `${K}/Lantern/glTF-Binary/Lantern.glb` },
  specs: 'Cast-iron lamp post · chain · glass lantern',
  about: 'Before electricity, gas lanterns like this lit city streets; a lamplighter lit each one by hand every evening.',
  uz: {
    name: 'Ko‘cha fonari',
    specs: 'Cho‘yan ustun · zanjir · shisha fonar',
    about: 'Elektr paydo bo‘lishidan oldin shahar ko‘chalarini shunday gaz fonarlari yoritgan; har kecha fonarchi ularni birma-bir yoqib chiqqan.',
  },
  parts: [
    { name: 'Lamp post', match: /^LanternPole_Body/i, color: C.blue,
      uz: ['Fonar ustuni', 'Og‘ir cho‘yan ustun shamolda ham qimirlamaydi.'], info: 'A heavy cast-iron post that stays put in the wind.' },
    { name: 'Chain', match: /^LanternPole_Chain/i, color: C.white,
      uz: ['Zanjir', 'Fonarni ilib turadi.'], info: 'Holds the lantern up.' },
    { name: 'Lantern', match: /^LanternPole_Lantern/i, color: C.yellow,
      uz: ['Fonar', 'Shisha ichida alanga yoki lampa yonadi.'], info: 'A flame or bulb burns inside the glass.' },
  ],
};

export const sciFiHelmet = {
  id: 'scifi-helmet',
  name: 'Battle-Damaged Sci-Fi Helmet',
  gltf: { url: `${K}/DamagedHelmet/glTF-Binary/DamagedHelmet.glb` },
  specs: 'Photo-real PBR scan-style model · scratches, burns, glowing visor',
  about: 'A showcase of physically based rendering: metal, paint, glass and glowing lights all from texture maps.',
  uz: {
    name: 'Fantastik jangovar dubulg‘a',
    specs: 'Fotorealistik PBR model · tirnalgan, kuygan joylar, yonib turuvchi visor',
    about: 'Fizik asosli renderlash namunasi: metall, bo‘yoq, shisha va yonib turuvchi chiroqlarning hammasi teksturalardan.',
  },
  parts: [
    { name: 'Helmet', color: C.cyan,
      uz: ['Dubulg‘a', 'Yorug‘lik sirtga qanday tushishiga qarab metall, bo‘yoq va shisha boshqacha yaltiraydi.'],
      info: 'Metal, paint and glass each reflect light differently — that is what makes it look real.' },
  ],
};

// flightHelmet is kept above for reference but not listed: its ~60 MB of PNG textures take too long to load.
export const REAL_MODELS = [ferrari, twoCylinderEngine, gearbox, buggy, antiqueCamera, lantern, sciFiHelmet];
