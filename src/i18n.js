// Interface language (English / O'zbekcha). UI strings live here; model and part texts
// for Uzbek live in models/uz.js, keyed by model id and the English part name.

import { UZ_MODELS } from './models/uz.js';

const STRINGS = {
  en: {
    tagline: 'form · explode · learn — with your hand',
    scene: 'SCENE',
    hand: 'HAND',
    sensitivity: 'GESTURE SENSITIVITY',
    'sens.strict': 'Strict',
    'sens.standard': 'Standard',
    'sens.forgiving': 'Forgiving',
    sensitivityHint: 'More forgiving helps recognize less distinct hand poses',
    openness: 'HAND OPENNESS',
    explode: 'EXPLODED VIEW',
    explodeHint: 'Open your hand to pull it apart · close it to assemble',
    selectedPart: 'SELECTED PART',
    gestures: 'GESTURES',
    'g.snap': '<strong>Snap</strong> — summon particles / dissolve',
    'g.fist': '<strong>Fist</strong> — put it together · <strong>move the fist</strong> to drag the model',
    'g.open': '<strong>Open slowly</strong> — explode it, see inside',
    'g.twist': '<strong>Twist / raise hand</strong> — rotate &amp; tilt it',
    'g.point': '<strong>Point</strong> at a part to learn it · <strong>pinch</strong> 🤏 pulls it out (pinch on empty space = rotate)',
    'g.zoom': '<strong>Two hands</strong> apart / together — zoom · move both — drag',
    'g.peace': '<strong>Peace</strong> — jump to the next model',
    'state.FORMED': 'FORMED',
    'state.FORMING': 'FORMING',
    'state.DISSOLVING': 'DISSOLVING',
    'state.DISSOLVED': 'DISSOLVED',
    'hand.NONE': '— No hand',
    'hand.MOVING': '✋ Moving',
    'hand.FIST': '✊ Assembling',
    'hand.POINTING': '☝️ Pointing',
    'hand.PINCHING': '🤏 Pulling',
    'hand.ZOOMING': '🙌 Zooming',
    'hand.PEACE': '✌️ Next model',
    'cat.REAL3D': 'REAL 3D',
    'cat.GEOMETRY': 'GEOMETRY',
    'loading.model3d': 'Downloading 3D model…',
    'err.model3d': 'Could not download the 3D model. Check your internet connection.',
    'cat.PHYSICS': 'PHYSICS',
    'cat.CHEMISTRY': 'CHEMISTRY',
    'sens.ultra': 'Ultra sensitive',
    view: 'VIEW STYLE',
    'style.hologram': 'Dotted',
    'style.xray': 'X-ray',
    'style.realistic': 'Realistic',
    'style.fantasy': 'Fantasy',
    'tb.theme': 'Hacker theme (H)',
    'toast.hackerOn': '> hacker mode: ON',
    'toast.hackerOff': 'Hacker mode off',
    'cat.WONDERS': 'WONDERS',
    'cat.ANATOMY': 'ANATOMY',
    'cat.BIOLOGY': 'BIOLOGY',
    'cat.SPACE': 'ASTRONOMY',
    'cat.ENGINES': 'ENGINES',
    'cat.VEHICLES': 'VEHICLES',
    'cat.MACHINES': 'MACHINES',
    'tb.lang': 'Language',
    'tb.camera': 'Camera background (V)',
    'tb.labels': 'Labels (L)',
    'tb.snap': 'Summon / dissolve (S)',
    'tb.reset': 'Reset view (R)',
    'tb.fullscreen': 'Fullscreen',
    'tb.rotate': 'Auto-rotate (A)',
    'stats.particles': 'particles',
    'stats.cam': 'cam',
    'stats.hands': 'hands',
    'stats.camOff': 'camera off',
    'toast.summoned': '✨ Summoned',
    'toast.dissolved': '✨ Dissolved',
    'toast.reset': '↺ View reset',
    'toast.showHand': 'Show your hand ✋',
    'toast.lang': '🌐 English',
    'loading.camera': 'Starting camera…',
    'loading.model': 'Loading hand-tracking model…',
    'err.camTitle': 'Camera unavailable — mouse mode',
    'err.modelTitle': 'Hand-tracking model failed to load — mouse mode',
    'err.modelDetail': 'Check your internet connection (the model comes from a CDN) and reload. Details: {msg}',
    'err.webglTitle': 'WebGL is not available',
    'err.webglDetail': 'HandLab needs WebGL. Enable hardware acceleration in your browser settings or try another browser.',
    'cam.insecure': 'The camera only works on https:// or http://localhost. Serve the folder with `npx serve .` and open the localhost URL.',
    'cam.unsupported': 'This browser does not support camera access (getUserMedia).',
    'cam.denied': 'Camera permission was denied. Click the camera icon in the address bar, allow access, then reload.',
    'cam.notfound': 'No webcam was found. Connect a camera and reload.',
    'cam.busy': 'The webcam is in use by another app (Zoom, Teams, OBS...). Close it and reload.',
  },
  uz: {
    tagline: 'yarat · och · o‘rgan — qo‘ling bilan',
    scene: 'SAHNA',
    hand: 'QO‘L',
    sensitivity: 'IMO-ISHORA SEZGIRLIGI',
    'sens.strict': 'Qat’iy',
    'sens.standard': 'Standart',
    'sens.forgiving': 'Yumshoq',
    sensitivityHint: 'Yumshoq rejim noaniqroq qo‘l holatlarini ham taniydi',
    openness: 'QO‘L OCHIQLIGI',
    explode: 'QISMLARGA AJRATISH',
    explodeHint: 'Ajratish uchun qo‘lingizni oching · yig‘ish uchun yuming',
    selectedPart: 'TANLANGAN QISM',
    gestures: 'IMO-ISHORALAR',
    'g.snap': '<strong>Chirt etish</strong> — zarrachalardan yaratish / sochib yuborish',
    'g.fist': '<strong>Musht</strong> — qismlarni yig‘ish · <strong>mushtni suring</strong> — modelni ko‘chirish',
    'g.open': '<strong>Sekin oching</strong> — qismlarga ajratib, ichini ko‘ring',
    'g.twist': '<strong>Burang / ko‘taring</strong> — aylantirish va egish',
    'g.point': 'Qismga <strong>ishora qiling</strong> — u haqida bilib oling · <strong>chimdish</strong> 🤏 uni sug‘urib oladi (bo‘sh joyda chimdib suring — aylantirish)',
    'g.zoom': '<strong>Ikki qo‘l</strong> — uzoqlashtirish / yaqinlashtirish · birga suring — ko‘chirish',
    'g.peace': '<strong>Peace (V belgisi)</strong> — keyingi modelga o‘tish',
    'state.FORMED': 'TAYYOR',
    'state.FORMING': 'YIG‘ILMOQDA',
    'state.DISSOLVING': 'SOCHILMOQDA',
    'state.DISSOLVED': 'SOCHILGAN',
    'hand.NONE': '— Qo‘l yo‘q',
    'hand.MOVING': '✋ Harakat',
    'hand.FIST': '✊ Yig‘ish',
    'hand.POINTING': '☝️ Ishora',
    'hand.PINCHING': '🤏 Sug‘urish',
    'hand.ZOOMING': '🙌 Zoom',
    'hand.PEACE': '✌️ Keyingi model',
    'cat.REAL3D': 'HAQIQIY 3D',
    'cat.GEOMETRY': 'GEOMETRIYA',
    'loading.model3d': '3D model yuklanmoqda…',
    'err.model3d': '3D modelni yuklab bo‘lmadi. Internet aloqasini tekshiring.',
    'cat.PHYSICS': 'FIZIKA',
    'cat.CHEMISTRY': 'KIMYO',
    'sens.ultra': 'Juda sezgir',
    view: 'KO‘RINISH USLUBI',
    'style.hologram': 'Nuqtali',
    'style.xray': 'Rentgen',
    'style.realistic': 'Realistik',
    'style.fantasy': 'Fantastik',
    'tb.theme': 'Xaker uslubi (H)',
    'toast.hackerOn': '> xaker rejimi: YOQILDI',
    'toast.hackerOff': 'Xaker rejimi o‘chirildi',
    'cat.WONDERS': 'MO‘JIZALAR',
    'cat.ANATOMY': 'ANATOMIYA',
    'cat.BIOLOGY': 'BIOLOGIYA',
    'cat.SPACE': 'ASTRONOMIYA',
    'cat.ENGINES': 'DVIGATELLAR',
    'cat.VEHICLES': 'TRANSPORT',
    'cat.MACHINES': 'MASHINALAR',
    'tb.lang': 'Til',
    'tb.camera': 'Kamera foni (V)',
    'tb.labels': 'Yozuvlar (L)',
    'tb.snap': 'Yaratish / sochish (S)',
    'tb.reset': 'Ko‘rinishni tiklash (R)',
    'tb.fullscreen': 'To‘liq ekran',
    'tb.rotate': 'Avto-aylanish (A)',
    'stats.particles': 'zarracha',
    'stats.cam': 'kamera',
    'stats.hands': 'qo‘l',
    'stats.camOff': 'kamera o‘chiq',
    'toast.summoned': '✨ Yaratildi',
    'toast.dissolved': '✨ Sochildi',
    'toast.reset': '↺ Ko‘rinish tiklandi',
    'toast.showHand': 'Qo‘lingizni ko‘rsating ✋',
    'toast.lang': '🌐 O‘zbekcha',
    'loading.camera': 'Kamera ishga tushmoqda…',
    'loading.model': 'Qo‘l kuzatish modeli yuklanmoqda…',
    'err.camTitle': 'Kamera ishlamayapti — sichqoncha rejimi',
    'err.modelTitle': 'Qo‘l kuzatish modeli yuklanmadi — sichqoncha rejimi',
    'err.modelDetail': 'Internet aloqasini tekshiring (model CDN’dan yuklanadi) va sahifani yangilang. Tafsilot: {msg}',
    'err.webglTitle': 'WebGL mavjud emas',
    'err.webglDetail': 'HandLab uchun WebGL kerak. Brauzer sozlamalarida apparat tezlashtirishni yoqing yoki boshqa brauzerdan foydalaning.',
    'cam.insecure': 'Kamera faqat https:// yoki http://localhost manzilida ishlaydi. Papkani `npx serve .` bilan ishga tushirib, localhost manzilini oching.',
    'cam.unsupported': 'Bu brauzer kameradan foydalanishni qo‘llab-quvvatlamaydi.',
    'cam.denied': 'Kameraga ruxsat berilmadi. Manzil satridagi kamera belgisini bosing, ruxsat bering va sahifani yangilang.',
    'cam.notfound': 'Veb-kamera topilmadi. Kamerani ulang va sahifani yangilang.',
    'cam.busy': 'Kamerani boshqa dastur ishlatyapti (Zoom, Teams, OBS...). Uni yoping va sahifani yangilang.',
  },
};

export const LANGS = ['uz', 'en'];
const listeners = new Set();
let lang = 'uz';
try {
  const saved = localStorage.getItem('handlab.lang');
  if (LANGS.includes(saved)) lang = saved;
} catch {
  /* storage unavailable: default language */
}
document.documentElement.lang = lang;

export const getLang = () => lang;

export function setLang(next) {
  if (!LANGS.includes(next) || next === lang) return;
  lang = next;
  document.documentElement.lang = lang;
  try {
    localStorage.setItem('handlab.lang', lang);
  } catch {
    /* ignore */
  }
  listeners.forEach((fn) => fn(lang));
}

export const onLangChange = (fn) => listeners.add(fn);

/** UI string; `{name}` placeholders are filled from vars. Falls back to English, then the key. */
export function t(key, vars) {
  let s = STRINGS[lang][key] ?? STRINGS.en[key] ?? key;
  if (vars) for (const [k, v] of Object.entries(vars)) s = s.replace(`{${k}}`, v);
  return s;
}

/** Localized { name, specs, about } of a model definition. */
export function modelText(def) {
  const uz = lang === 'uz' ? UZ_MODELS[def.id] ?? def.uz : null;
  return { name: uz?.name ?? def.name, specs: uz?.specs ?? def.specs, about: uz?.about ?? def.about };
}

/** Localized { name, info } of a hologram part (part.modelId + English part name as key). */
export function partText(part) {
  const tr = lang === 'uz' ? UZ_MODELS[part.modelId]?.parts?.[part.name] ?? part.def?.uz : null;
  return { name: tr?.[0] ?? part.name, info: tr?.[1] ?? part.info };
}
