// Loads a real glTF / GLB model and splits it into HandLab parts.
//
// Every mesh becomes one instance (so it explodes on its own); meshes are assigned to the
// model's named parts by matching each part's `match` regex against the mesh name and its
// parents' names ("tire/wheel_fl/Scene"). A part without `match` catches everything left.
// Geometry is baked into model space; the original PBR material is kept for "realistic".

import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';

const DRACO_PATH = 'https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/libs/draco/gltf/';
const cache = new Map(); // url -> Promise<gltf>, so revisiting a model needs no download
let loader = null;

function getLoader() {
  if (!loader) loader = new GLTFLoader().setDRACOLoader(new DRACOLoader().setDecoderPath(DRACO_PATH));
  return loader;
}

export function loadGltf(url) {
  if (!cache.has(url)) {
    cache.set(
      url,
      getLoader()
        .loadAsync(url)
        .catch((err) => {
          cache.delete(url); // allow a retry
          throw err;
        })
    );
  }
  return cache.get(url);
}

/** -> [{ def: part definition, g: baked geometry, material: original material }] */
export async function loadGltfParts(def) {
  const gltf = await loadGltf(def.gltf.url);
  const scene = gltf.scene;
  scene.updateMatrixWorld(true);
  const catchAll = def.parts.find((p) => !p.match);
  const raw = [];
  scene.traverse((o) => {
    if (!o.isMesh) return;
    const names = [];
    for (let x = o; x; x = x.parent) if (x.name) names.push(x.name);
    const path = names.join('/');
    const part = def.parts.find((p) => p.match && p.match.test(path)) ?? catchAll;
    if (!part) return;
    const g = o.geometry.clone();
    g.applyMatrix4(o.matrixWorld);
    if (!g.attributes.normal) g.computeVertexNormals();
    raw.push({ def: part, g, material: o.material });
  });
  return raw;
}
