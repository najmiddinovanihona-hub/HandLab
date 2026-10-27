// Category -> models, in the order shown in the bottom bar.
import { greatPyramid, eiffelTower } from './wonders.js';
import { humanEye, lungs } from './anatomy.js';
import { animalCell, dna } from './biology.js';
import { earth, saturnV } from './space.js';
import { inline4, turbofan } from './engines.js';
import { sportsCar, airliner } from './vehicles.js';
import { drone } from './machines.js';
import { GEOMETRY_MODELS } from './geometry.js';

export const CATALOG = [
  { key: 'GEOMETRY', models: GEOMETRY_MODELS },
  { key: 'WONDERS', models: [greatPyramid, eiffelTower] },
  { key: 'ANATOMY', models: [humanEye, lungs] },
  { key: 'BIOLOGY', models: [animalCell, dna] },
  { key: 'SPACE', models: [earth, saturnV] },
  { key: 'ENGINES', models: [inline4, turbofan] },
  { key: 'VEHICLES', models: [sportsCar, airliner] },
  { key: 'MACHINES', models: [drone] },
];

/** Flat list in catalog order, used by the peace sign / arrow keys. */
export const ALL_MODELS = CATALOG.flatMap((c) => c.models.map((m) => ({ category: c.key, model: m })));
