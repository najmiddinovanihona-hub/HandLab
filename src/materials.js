// Physically based materials for the "realistic" style of procedural models.
//
// Every part gets a material *kind* (glass, chrome, metal, paint, rubber, plastic, organic,
// stone, glow): either set explicitly with `mat` on the part, or guessed from its English name.
// Kinds use natural colours (steel, rubber black, clear glass) instead of the neon hologram
// colours, and the scene's studio environment map provides reflections.

import * as THREE from 'three';

const KIND_RULES = [
  ['glow', /\b(sun|flame)\b/i],
  ['glass', /glass|window|windshield|lens|cornea|flask|beaker|test tube|graduated|vitreous|dew shield/i],
  ['rubber', /tyre|tire|hose|skid|landing gear|\bbelt\b/i],
  ['chrome', /chrome|steel ball|spring|shaft|piston|connecting rod|crank|camshaft|spark|needle|pointer|hook|compass\b|valve|commutator|brush/i],
  ['metal', /engine|block|head|motor|magnet|brake|disc|turbine|compressor|nozzle|exhaust|frame|chassis|\barms?\b|gear|fan\b|flywheel|pulley|manifold|stage|tripod|mount|casing|housing|antenna|legs?\b|pylon|floor|arches|elevator|focuser|nosepiece|pan\b|knob|caliper|instrument unit|escape tower|burner|ruler|protractor/i],
  ['paint', /door|hood|roof|fender|bumper|trunk|fuselage|wing|stabili|\bfin\b|body|panel|nacelle|cowling|cover|module|stage \(|tank|tube|adapter|battery/i],
];
const ORGANIC_MODELS = new Set(['human-eye', 'lungs', 'animal-cell']);
const STONE_MODELS = new Set(['great-pyramid']);

const STEEL = new THREE.Color(0xa7adb6);
const FLESH = new THREE.Color(0xd99a8c);
const SAND = new THREE.Color(0xd8c39a);

export function materialKind(partDef, modelDef) {
  if (partDef.mat) return partDef.mat;
  for (const [kind, re] of KIND_RULES) if (re.test(partDef.name)) return kind;
  if (ORGANIC_MODELS.has(modelDef.id)) return 'organic';
  if (STONE_MODELS.has(modelDef.id)) return 'stone';
  return 'plastic';
}

const textureCache = new Map();
function loadTexture(url) {
  if (!textureCache.has(url)) {
    const tex = new THREE.TextureLoader().load(url);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 8;
    textureCache.set(url, tex);
  }
  return textureCache.get(url);
}

/** Natural base colour + MeshPhysicalMaterial settings for one part. */
export function realisticMaterial(partDef, modelDef) {
  const kind = materialKind(partDef, modelDef);
  const own = new THREE.Color(partDef.color);
  const p = { side: THREE.DoubleSide, transparent: true, envMapIntensity: 1 };
  switch (kind) {
    case 'glass':
      Object.assign(p, { color: new THREE.Color(0xeaf6ff), metalness: 0, roughness: 0.04, transmission: 0.95, thickness: 0.3, ior: 1.5 });
      break;
    case 'chrome':
      Object.assign(p, { color: new THREE.Color(0xe3e6eb), metalness: 1, roughness: 0.1 });
      break;
    case 'metal':
      Object.assign(p, { color: new THREE.Color(modelDef.metalColor ?? STEEL.clone().lerp(own, 0.18)), metalness: 1, roughness: 0.32 });
      break;
    case 'paint':
      Object.assign(p, { color: new THREE.Color(modelDef.paint ?? own.clone().multiplyScalar(0.75)), metalness: 0.45, roughness: 0.3, clearcoat: 1, clearcoatRoughness: 0.06 });
      break;
    case 'rubber':
      Object.assign(p, { color: new THREE.Color(0x1c1d20), metalness: 0, roughness: 0.88 });
      break;
    case 'organic':
      Object.assign(p, { color: FLESH.clone().lerp(own, 0.45), metalness: 0, roughness: 0.42, clearcoat: 0.7, clearcoatRoughness: 0.25, sheen: 0.6, sheenColor: new THREE.Color(0xffd0c8) });
      break;
    case 'stone':
      Object.assign(p, { color: SAND.clone().lerp(own, 0.12), metalness: 0, roughness: 0.95 });
      break;
    case 'glow':
      Object.assign(p, { color: own, emissive: own, emissiveIntensity: 2.2, metalness: 0, roughness: 1 });
      break;
    default: // plastic, atoms, planets
      Object.assign(p, { color: own, metalness: 0.05, roughness: 0.38, clearcoat: 0.4, clearcoatRoughness: 0.2 });
  }
  if (partDef.map) {
    p.map = loadTexture(partDef.map);
    p.color = new THREE.Color(0xffffff);
  }
  const mat = new THREE.MeshPhysicalMaterial(p);
  mat.userData.kind = kind;
  mat.userData.baseColor = mat.color.clone();
  return mat;
}
