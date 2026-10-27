// Subject -> models, in the order shown in the bottom bar. Each subject also carries the
// instruments used in it (drawing tools, dynamometer, lab glassware, microscope, telescope).
import { greatPyramid, eiffelTower } from './wonders.js';
import { humanEye, lungs } from './anatomy.js';
import { animalCell, dna } from './biology.js';
import { earth, saturnV } from './space.js';
import { inline4, turbofan } from './engines.js';
import { sportsCar, airliner } from './vehicles.js';
import { drone } from './machines.js';
import { GEOMETRY_MODELS } from './geometry.js';
import { carbonAtom, barMagnet, dcMotor, newtonsCradle, dynamometer } from './physics.js';
import { water, methane, benzene, saltCrystal, labGlassware } from './chemistry.js';
import { solarSystem, telescope } from './astronomy.js';
import { microscope, drawingTools } from './instruments.js';

export const CATALOG = [
  { key: 'GEOMETRY', models: [...GEOMETRY_MODELS, drawingTools] },
  { key: 'PHYSICS', models: [carbonAtom, barMagnet, dcMotor, newtonsCradle, dynamometer] },
  { key: 'CHEMISTRY', models: [water, methane, benzene, saltCrystal, labGlassware] },
  { key: 'BIOLOGY', models: [animalCell, dna, microscope] },
  { key: 'ANATOMY', models: [humanEye, lungs] },
  { key: 'SPACE', models: [solarSystem, earth, saturnV, telescope] },
  { key: 'WONDERS', models: [greatPyramid, eiffelTower] },
  { key: 'ENGINES', models: [inline4, turbofan] },
  { key: 'VEHICLES', models: [sportsCar, airliner] },
  { key: 'MACHINES', models: [drone] },
];

/** Flat list in catalog order, used by the peace sign / arrow keys. */
export const ALL_MODELS = CATALOG.flatMap((c) => c.models.map((m) => ({ category: c.key, model: m })));
