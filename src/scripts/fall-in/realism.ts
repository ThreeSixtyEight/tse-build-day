// French Quarter townhouses, street details, lighting and clouds for the fall-in scene.
// Ported from Nick's Second Line World Studio (realism.js). Textures load from public/fall-in/;
// until they're there, surfaces fall back to flat colours instead of breaking.
import * as T from 'three';
import { HDRLoader } from 'three/examples/jsm/loaders/HDRLoader.js';

const ASSETS = '/fall-in/';
const loader = new T.TextureLoader();

// Copies of a textured material (one per wall colour) that should pick up its maps when they load.
const copies = new Map<T.MeshStandardMaterial, T.MeshStandardMaterial[]>();

function copyOf(base: T.MeshStandardMaterial) {
  const mat = base.clone();
  copies.get(base)?.push(mat) ?? copies.set(base, [mat]);
  return mat;
}

// Fills a material's map slot only once the image loads, so a missing file leaves a plain colour.
function tex(mat: T.MeshStandardMaterial, slot: 'map' | 'normalMap' | 'roughnessMap', file: string, x = 1, y = 1) {
  loader.load(
    ASSETS + file,
    (t) => {
      t.wrapS = t.wrapT = T.RepeatWrapping;
      t.repeat.set(x, y);
      t.anisotropy = 8;
      if (slot === 'map') t.colorSpace = T.SRGBColorSpace;
      for (const target of [mat, ...(copies.get(mat) ?? [])]) {
        target[slot] = t;
        target.needsUpdate = true;
      }
    },
    undefined,
    () => {},
  );
}

function textured(color: string, base: string, x: number, y: number, normal: number) {
  const mat = new T.MeshStandardMaterial({ color, roughness: 1, normalScale: new T.Vector2(normal, normal) });
  tex(mat, 'map', `${base}-color.jpg`, x, y);
  tex(mat, 'normalMap', `${base}-normal.jpg`, x, y);
  tex(mat, 'roughnessMap', `${base}-rough.jpg`, x, y);
  return mat;
}

export const asphalt = textured('#9a9b95', 'asphalt', 5, 52, 0.65);
// Walls take their colour per building, so each one clones a textured base.
const plasterBase = textured('#ffffff', 'plaster', 2, 3, 0.4);
const brickBase = textured('#ffffff', 'brick', 2.2, 3, 0.9);

const materials = new Map<string, T.MeshStandardMaterial>();
const box = new T.BoxGeometry(1, 1, 1);

export function m(c: string, metal = false) {
  const k = c + metal;
  if (!materials.has(k)) {
    materials.set(k, new T.MeshStandardMaterial({ color: c, roughness: metal ? 0.55 : 0.87, metalness: metal ? 0.5 : 0 }));
  }
  return materials.get(k)!;
}

type Mat = string | T.Material;
type V3 = [number, number, number];

export function mesh(g: T.Object3D, geo: T.BufferGeometry, mat: Mat, x: number, y: number, z: number, sx = 1, sy = 1, sz = 1) {
  const a = new T.Mesh(geo, typeof mat === 'string' ? m(mat) : mat);
  a.position.set(x, y, z);
  a.scale.set(sx, sy, sz);
  a.castShadow = a.receiveShadow = true;
  g.add(a);
  return a;
}

export function b(g: T.Object3D, c: Mat, x: number, y: number, z: number, w: number, h: number, d: number) {
  return mesh(g, box, c, x, y, z, w, h, d);
}

export function line(g: T.Object3D, c: Mat, a: V3, d: V3, r = 0.03) {
  const v = new T.Vector3(...a);
  const w = new T.Vector3(...d);
  const delta = w.clone().sub(v);
  const q = mesh(g, new T.CylinderGeometry(r, r, delta.length(), 6), c, ...(v.add(w).multiplyScalar(0.5).toArray() as V3));
  q.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), delta.normalize());
  return q;
}

// Cast-iron lace for the galleries, drawn once and tiled.
function ironTexture() {
  const c = document.createElement('canvas');
  c.width = c.height = 256;
  const k = c.getContext('2d')!;
  k.strokeStyle = '#ffffff';
  k.lineWidth = 5;
  for (let x = 0; x <= 256; x += 64) {
    k.beginPath();
    k.moveTo(x, 0);
    k.lineTo(x, 256);
    k.stroke();
  }
  for (const y of [5, 40, 215, 251]) {
    k.beginPath();
    k.moveTo(0, y);
    k.lineTo(256, y);
    k.stroke();
  }
  k.lineWidth = 4;
  for (let x = 32; x < 256; x += 64) {
    for (const y of [77, 174]) {
      for (const side of [-1, 1]) {
        k.beginPath();
        k.ellipse(x + side * 13, y, 15, 28, side * 0.4, 0, Math.PI * 2);
        k.stroke();
      }
      k.beginPath();
      k.moveTo(x, 43);
      k.bezierCurveTo(x + 34, 96, x - 34, 158, x, 213);
      k.stroke();
    }
    k.beginPath();
    k.arc(x, 127, 9, 0, Math.PI * 2);
    k.fillStyle = '#ffffff';
    k.fill();
  }
  const t = new T.CanvasTexture(c);
  t.wrapS = t.wrapT = T.RepeatWrapping;
  return t;
}

const laceTex = ironTexture();
function lace(g: T.Object3D, x: number, y: number, z: number, w: number, h: number, rotation = 0) {
  const t = laceTex.clone();
  t.repeat.set(w / 1.15, 1);
  const mat = new T.MeshStandardMaterial({ color: '#242c27', alphaMap: t, alphaTest: 0.45, side: T.DoubleSide, roughness: 0.65, metalness: 0.45 });
  const q = mesh(g, new T.PlaneGeometry(w, h), mat, x, y, z);
  q.rotation.y = rotation;
  q.customDepthMaterial = new T.MeshDepthMaterial({ depthPacking: T.RGBADepthPacking, alphaMap: t, alphaTest: 0.45, side: T.DoubleSide });
  return q;
}

let seed = 31;
const rnd = () => {
  seed = (seed * 1664525 + 1013904223) >>> 0;
  return seed / 4294967296;
};

const leafGeo = new T.SphereGeometry(1, 5, 3);
const leaves = ['#3c5b24', '#4a6c2d', '#66823d', '#7b9144'].map((c) => m(c));
const potGeo = new T.SphereGeometry(0.25, 10, 7);

export function fern(g: T.Object3D, x: number, y: number, z: number, s = 1) {
  mesh(g, potGeo, m('#79573b'), x, y, z, 1, 0.65, 1);
  const n = 90;
  const inst = new T.InstancedMesh(leafGeo, leaves[Math.floor(rnd() * 4)], n);
  const helper = new T.Object3D();
  for (let i = 0; i < n; i++) {
    const frond = i % 9;
    const t = Math.floor(i / 9) / 9;
    const a = (frond / 9) * Math.PI * 2;
    const rad = (0.1 + t * 0.55) * s;
    helper.position.set(x + Math.cos(a) * rad, y + (0.25 + Math.sin(t * Math.PI) * 0.28 - t * 0.65) * s, z + Math.sin(a) * rad);
    helper.scale.set(0.14 * s, 0.025 * s, 0.055 * s);
    helper.rotation.set(rnd(), a, t);
    helper.updateMatrix();
    inst.setMatrixAt(i, helper.matrix);
  }
  inst.castShadow = true;
  g.add(inst);
}

function label(g: T.Object3D, text: string, x: number, y: number, z: number, w = 2.2, h = 0.45, bg = '#d9ceb5', fg = '#344438') {
  const c = document.createElement('canvas');
  c.width = 512;
  c.height = 128;
  const k = c.getContext('2d')!;
  k.fillStyle = bg;
  k.fillRect(0, 0, 512, 128);
  k.strokeStyle = fg;
  k.lineWidth = 7;
  k.strokeRect(10, 10, 492, 108);
  k.fillStyle = fg;
  k.font = '36px Georgia';
  k.textAlign = 'center';
  k.textBaseline = 'middle';
  k.fillText(text, 256, 65, 470);
  const t = new T.CanvasTexture(c);
  t.colorSpace = T.SRGBColorSpace;
  return mesh(g, new T.PlaneGeometry(w, h), new T.MeshStandardMaterial({ map: t, roughness: 0.8 }), x, y, z);
}

function arch(g: T.Object3D, x: number, y: number, z: number, w: number, h: number, c: Mat) {
  const shape = new T.Shape();
  const r = w / 2;
  shape.moveTo(-r, 0);
  shape.lineTo(-r, h - r);
  shape.absarc(0, h - r, r, Math.PI, 0, true);
  shape.lineTo(r, 0);
  shape.closePath();
  return mesh(g, new T.ShapeGeometry(shape, 20), c, x, y, z);
}

const glass = new T.MeshPhysicalMaterial({ color: '#41564d', metalness: 0.12, roughness: 0.23, envMapIntensity: 0.7 });

/**
 * One townhouse, facing +z. Most lots get one of the six Creole facade families (quarterBuilding);
 * every sixth keeps the original galleried townhouse.
 */
export function realisticBuilding(g: T.Object3D, accent: string, index: number) {
  if (index % 6 !== 0) {
    quarterBuilding(g, accent, index);
    return;
  }
  seed = index * 311 + 17;
  const w = 6.94;
  const floors = index % 4 === 0 ? 3 : 2;
  const h = 3.65 * floors + 0.55;
  const wall = copyOf(index % 4 === 1 ? brickBase : plasterBase);
  wall.color.set(accent);
  b(g, wall, 0, h / 2, 0, w, h, 7);
  const trim = index % 3 === 0 ? '#bcb4a0' : '#d9d0ba';
  const shutter = index % 4 === 0 ? '#4a5145' : index % 4 === 2 ? '#747766' : '#304b3c';

  // Cornice, parapet and low pitched roof, varied per property.
  for (const [yy, ww, dd] of [
    [h - 0.15, w + 0.18, 0.24],
    [h + 0.04, w + 0.38, 0.34],
    [h + 0.22, w + 0.18, 0.28],
  ]) {
    b(g, trim, 0, yy, 3.57, ww, 0.15, dd);
  }
  b(g, '#575b52', 0, h + 0.12, 0, w + 0.05, 0.22, 7.05);
  b(g, trim, 0, h + 0.35, 3.42, w, 0.55, 0.25);
  for (let x = -3.2; x < 3.4; x += 0.38) b(g, trim, x, h - 0.2, 3.73, 0.09, 0.14, 0.2);

  for (let floor = 0; floor < floors; floor++) {
    const y = floor * 3.65;
    for (const x of [-2.2, 0, 2.2]) {
      b(g, '#3a3b30', x, y + 1.55, 3.535, 1.48, 2.9, 0.05);
      b(g, trim, x - 0.76, y + 1.48, 3.62, 0.13, 3.02, 0.2);
      b(g, trim, x + 0.76, y + 1.48, 3.62, 0.13, 3.02, 0.2);
      b(g, trim, x, y + 0.035, 3.66, 1.68, 0.12, 0.32);
      b(g, trim, x, y + 3.03, 3.65, 1.7, 0.16, 0.23);
      if (floor === 0) {
        arch(g, x, y + 2.18, 3.65, 1.34, 0.77, m('#142922'));
        for (let j = -2; j <= 2; j++) {
          line(g, trim, [x, y + 2.3, 3.67], [x + Math.sin(j * 0.52) * 0.64, y + 2.3 + Math.cos(j * 0.52) * 0.55, 3.67], 0.018);
        }
      }
      b(g, glass, x, y + 1.5, 3.59, 1.3, 2.65, 0.035);
      for (const s of [-1, 1]) {
        b(g, shutter, x + s * 0.45, y + 1.37, 3.66, 0.43, 2.55, 0.1);
        for (let j = 0; j < 13; j++) b(g, index % 2 ? '#4b5d47' : '#54614b', x + s * 0.45, y + 0.25 + j * 0.17, 3.73, 0.34, 0.04, 0.075);
        b(g, trim, x + s * 0.2, y + 1.35, 3.75, 0.035, 2.5, 0.035);
      }
      b(g, '#ac9560', x + 0.1, y + 1.15, 3.8, 0.045, 0.12, 0.08);
      if (floor > 0) {
        for (const side of [-1, 1]) {
          const open = b(g, shutter, x + side * 0.91, y + 1.5, 3.79, 0.35, 2.8, 0.12);
          open.rotation.y = side * 0.22;
        }
      }
    }
    if (floor > 0) {
      b(g, trim, 0, y - 0.03, 4.8, w + 0.18, 0.22, 2.8);
      b(g, '#77796c', 0, y + 0.095, 4.8, w, 0.035, 2.6);
      lace(g, 0, y + 0.7, 6.13, w, 1.15);
      lace(g, -w / 2, y + 0.7, 4.8, 2.65, 1.15, Math.PI / 2);
      lace(g, w / 2, y + 0.7, 4.8, 2.65, 1.15, Math.PI / 2);
      for (const yy of [y + 0.16, y + 1.26]) b(g, m('#252f27', true), 0, yy, 6.13, w + 0.12, 0.055, 0.065);
      for (let q = 0; q < 3; q++) {
        const xx = -2.5 + q * 2.5;
        fern(g, xx, y + 0.45, 5.95, 0.9);
        line(g, '#2b332c', [xx, y + 3.35, 5.65], [xx, y + 2.55, 5.65], 0.015);
        fern(g, xx, y + 2.55, 5.65, 0.78);
      }
    }
  }
  for (const x of [-3.35, 0, 3.35]) {
    line(g, m('#28342c', true), [x, 0, 6.13], [x, h - 0.3, 6.13], 0.055);
    for (const yy of [0.2, 3.5, 7.1]) {
      if (yy < h) mesh(g, new T.CylinderGeometry(0.115, 0.115, 0.15, 8), m('#29382c', true), x, yy, 6.13);
    }
  }
  b(g, trim, 0, h - 0.18, 4.8, w + 0.3, 0.16, 2.85);
  lace(g, 0, h - 0.53, 6.12, w, 0.7);
  for (const x of [-3.3, 3.3]) {
    const bracket = mesh(g, new T.TorusGeometry(0.5, 0.035, 5, 18, Math.PI / 2), m('#344233', true), x, h - 0.75, 5.65);
    bracket.rotation.y = Math.PI / 2;
  }
  // Downpipes, plaques and shop-level signs break the repetition.
  line(g, '#676653', [-3.27, 0.1, 3.78], [-3.27, h, 3.78], 0.065);
  b(g, '#656451', -3.27, 0.45, 3.78, 0.13, 0.8, 0.13);
  label(g, String(700 + index * 12), -3, 2.5, 3.83, 0.34, 0.22);
  if (index % 3 === 0) {
    label(g, ['GALERIE ROYALE', 'CAFÉ DU QUARTIER', 'ANTIQUES', 'MAISON DES ARTS'][index % 4], 0, 3.21, 3.84, 4.2, 0.38);
    const awning = b(g, '#7c8267', 0, 2.96, 4.18, 4.35, 0.1, 1.12);
    awning.rotation.x = -0.15;
    for (let j = 0; j < 10; j++) b(g, '#c8c1a1', -2 + j * 0.44, 2.85, 4.69, 0.2, 0.24, 0.06);
  }
}

export function applyLighting(scene: T.Scene, renderer: T.WebGLRenderer) {
  new HDRLoader().load(
    ASSETS + 'sky.hdr',
    (hdr) => {
      hdr.mapping = T.EquirectangularReflectionMapping;
      const pmrem = new T.PMREMGenerator(renderer);
      scene.environment = pmrem.fromEquirectangular(hdr).texture;
      scene.environmentIntensity = 0.65;
      hdr.dispose();
      pmrem.dispose();
    },
    undefined,
    () => {},
  );
}

/** Drains, the Rue Royale street sign and parked bicycles. */
export function streetDetails(g: T.Object3D) {
  seed = 83;
  const dark = m('#3f453d', true);
  for (const side of [-1, 1]) {
    for (let z = -38; z < 33; z += 14) {
      const group = new T.Group();
      group.position.set(side * 5.45, 0, z);
      g.add(group);
      b(group, dark, 0, 0.05, 0, 0.5, 0.07, 1.2);
      for (let i = 0; i < 9; i++) b(group, '#121c19', 0, 0.092, -0.49 + i * 0.12, 0.4, 0.018, 0.045);
    }
  }
  const sign = new T.Group();
  sign.position.set(-6, 0.1, 19);
  sign.rotation.y = Math.PI / 2;
  g.add(sign);
  line(sign, '#424e44', [0, 0, 0], [0, 4.2, 0], 0.045);
  label(sign, 'RUE ROYALE', 0, 4, 0, 1.8, 0.33, '#1f4938', '#eee9cf');
  label(sign, 'RUE ST. ANN', 0.2, 3.6, 0, 1.8, 0.33, '#1f4938', '#eee9cf');

  const rubber = m('#373b32');
  const metal = m('#596759', true);
  for (let j = 0; j < 6; j++) {
    const g2 = new T.Group();
    g2.position.set(j % 2 ? 6.8 : -6.8, 0, 22 - j * 12);
    g2.rotation.y = j % 2 ? -0.15 : 0.15;
    g.add(g2);
    for (const z of [-0.68, 0.68]) {
      const wheel = mesh(g2, new T.TorusGeometry(0.39, 0.035, 6, 22), rubber, 0, 0.43, z);
      wheel.rotation.y = Math.PI / 2;
      for (let k = 0; k < 8; k++) {
        const a = (k * Math.PI) / 4;
        line(g2, '#99a198', [0, 0.43, z], [0, 0.43 + Math.cos(a) * 0.38, z + Math.sin(a) * 0.38], 0.007);
      }
    }
    const frame: [V3, V3][] = [
      [[0, 0.43, -0.68], [0, 0.96, -0.1]],
      [[0, 0.43, -0.68], [0, 0.43, 0.15]],
      [[0, 0.96, -0.1], [0, 0.43, 0.15]],
      [[0, 0.43, 0.15], [0, 1.03, 0.45]],
      [[0, 1.03, 0.45], [0, 0.43, 0.68]],
      [[0, 0.96, -0.1], [0, 1.03, 0.45]],
    ];
    for (const [a, d] of frame) line(g2, metal, a, d, 0.022);
    b(g2, '#3c392c', 0, 1.01, -0.1, 0.18, 0.06, 0.3);
    line(g2, metal, [-0.25, 1.19, 0.45], [0.25, 1.19, 0.45], 0.02);
  }
}

export function realisticPlanter(g: T.Object3D) {
  seed = 64;
  b(g, '#a98368', 0, 0.35, 0, 0.7, 0.7, 0.7);
  b(g, '#8d6e52', 0, 0.73, 0, 0.8, 0.09, 0.8);
  fern(g, 0, 0.85, 0, 1.4);
  for (let i = 0; i < 4; i++) fern(g, Math.cos(i * 1.57) * 0.22, 1 + Math.sin(i) * 0.12, Math.sin(i * 1.57) * 0.22, 0.9);
}

export function addClouds(scene: T.Scene) {
  const c = document.createElement('canvas');
  c.width = 512;
  c.height = 256;
  const k = c.getContext('2d')!;
  seed = 41;
  for (let i = 0; i < 35; i++) {
    const x = 90 + rnd() * 320;
    const y = 100 + rnd() * 45;
    const r = 22 + rnd() * 42;
    const a = k.createRadialGradient(x, y, 0, x, y, r);
    a.addColorStop(0, 'rgba(255,252,239,.25)');
    a.addColorStop(0.5, 'rgba(255,253,244,.16)');
    a.addColorStop(1, 'rgba(255,255,255,0)');
    k.fillStyle = a;
    k.fillRect(x - r, y - r, r * 2, r * 2);
  }
  const t = new T.CanvasTexture(c);
  t.colorSpace = T.SRGBColorSpace;
  for (let i = 0; i < 9; i++) {
    const sp = new T.Sprite(new T.SpriteMaterial({ map: t, transparent: true, opacity: 0.7, depthWrite: false, fog: false }));
    sp.position.set(-100 + i * 26, 24 + (i % 3) * 8, -90 - (i % 2) * 40);
    sp.scale.set(50, 22, 1);
    scene.add(sp);
  }
}

// A varied set of Creole facades, all sharing the same 6.94 × 7 footprint.
function wallMaterial(accent: string, brick = false) {
  const mat = copyOf(brick ? brickBase : plasterBase);
  mat.color.set(accent);
  mat.normalScale.set(0.45, 0.45);
  return mat;
}

const glassMaterial = new T.MeshPhysicalMaterial({ color: '#263d36', roughness: 0.22, metalness: 0.18, envMapIntensity: 1.1 });

function frenchDoor(g: T.Object3D, x: number, y: number, z: number, shutter: string, arched = false) {
  const trim = '#ded5bf';
  b(g, '#242b24', x, y + 1.45, z, 1.42, 2.9, 0.07);
  b(g, glassMaterial, x, y + 1.53, z + 0.045, 1.18, 2.52, 0.025);
  for (const xx of [-0.66, 0.66]) b(g, trim, x + xx, y + 1.46, z + 0.09, 0.11, 2.94, 0.16);
  b(g, trim, x, y + 0.03, z + 0.1, 1.48, 0.1, 0.28);
  b(g, trim, x, y + 2.94, z + 0.09, 1.5, 0.13, 0.17);
  b(g, trim, x, y + 1.4, z + 0.09, 0.055, 2.75, 0.065);
  for (const yy of [0.78, 1.6, 2.4]) b(g, trim, x, y + yy, z + 0.1, 1.2, 0.045, 0.055);
  if (arched) {
    arch(g, x, y + 2.55, z + 0.11, 1.2, 0.66, m('#233b31'));
    for (let a = -2; a <= 2; a++) {
      line(g, trim, [x, y + 2.6, z + 0.14], [x + Math.sin(a * 0.57) * 0.57, y + 2.6 + Math.cos(a * 0.57) * 0.57, z + 0.14], 0.016);
    }
  }
  for (const side of [-1, 1]) {
    const leaf = new T.Group();
    leaf.position.set(x + side * 0.77, y, z + 0.1);
    leaf.rotation.y = side * (0.18 + ((Math.abs(x) * 10) % 3) * 0.12);
    g.add(leaf);
    b(leaf, shutter, side * 0.23, 1.42, 0, 0.48, 2.85, 0.09);
    for (let j = 0; j < 15; j++) b(leaf, shutter, side * 0.23, 0.2 + j * 0.17, 0.075, 0.38, 0.045, 0.06);
    for (const yy of [0.18, 1.45, 2.7]) b(leaf, '#253128', side * 0.23, yy, 0.08, 0.4, 0.055, 0.04);
  }
  b(g, '#b39855', x + 0.13, y + 1.16, z + 0.17, 0.035, 0.12, 0.065);
}

function gallery(g: T.Object3D, y: number, h: number, width = 6.94, deep = 2.4, wrap = false, white = false) {
  const front = 3.5 + deep;
  const c = white ? '#d7cfb9' : '#27392e';
  b(g, '#bdb4a0', 0, y, 3.5 + deep / 2, width + 0.15, 0.2, deep);
  b(g, '#7d8274', 0, y + 0.115, 3.5 + deep / 2, width, 0.02, deep - 0.15);
  lace(g, 0, y + 0.76, front, width, 1.2);
  lace(g, -width / 2, y + 0.76, 3.5 + deep / 2, deep, 1.2, Math.PI / 2);
  lace(g, width / 2, y + 0.76, 3.5 + deep / 2, deep, 1.2, Math.PI / 2);
  for (const yy of [y + 0.18, y + 1.36]) b(g, c, 0, yy, front, width + 0.12, 0.055, 0.07);
  for (const xx of [-3.35, 0, 3.35]) {
    line(g, c, [xx, 0.05, front], [xx, h, front], white ? 0.075 : 0.045);
    const scroll = mesh(g, new T.TorusGeometry(0.4, 0.028, 5, 16, Math.PI / 2), m(c, true), xx, y - 0.5, front - 0.4);
    scroll.rotation.y = Math.PI / 2;
  }
  for (let i = 0; i < 4; i++) {
    const xx = -2.7 + i * 1.8;
    fern(g, xx, y + 0.55, front - 0.12, 0.8);
    if (i % 2 === 0) {
      line(g, c, [xx, h - 0.2, front - 0.25], [xx, h - 1.05, front - 0.25], 0.016);
      fern(g, xx, h - 1.06, front - 0.25, 1.05);
    }
  }
  if (wrap) {
    b(g, '#c1b7a2', -4.25, y, 0.1, 1.6, 0.2, 7);
    lace(g, -5.03, y + 0.76, 0.1, 7, 1.2, Math.PI / 2);
    for (const zz of [-3, 0, 3]) line(g, c, [-5.03, 0.1, zz], [-5.03, h, zz], 0.055);
    b(g, c, -4.2, y + 1.37, -3.42, 1.65, 0.055, 0.07);
    b(g, c, -4.2, y + 1.37, 3.53, 1.65, 0.055, 0.07);
  }
}

// Flat roof, or for the Creole cottage a steep pitched roof with two dormers and a chimney.
function roof(g: T.Object3D, h: number, cottage = false) {
  if (!cottage) {
    b(g, '#606357', 0, h + 0.04, 0, 7, 0.17, 7);
    return;
  }
  const geo = new T.BufferGeometry();
  // prettier-ignore
  const a = [-3.6,h,3.85, 3.6,h,3.85, 3.6,h+2.15,0, -3.6,h,3.85, 3.6,h+2.15,0, -3.6,h+2.15,0,
    -3.6,h+2.15,0, 3.6,h+2.15,0, 3.6,h,-3.85, -3.6,h+2.15,0, 3.6,h,-3.85, -3.6,h,-3.85];
  geo.setAttribute('position', new T.Float32BufferAttribute(a, 3));
  geo.computeVertexNormals();
  mesh(g, geo, new T.MeshStandardMaterial({ color: '#555c57', roughness: 0.94, side: T.DoubleSide }), 0, 0, 0);
  for (let row = 0; row < 12; row++) line(g, '#68706a', [-3.6, h + row * 0.18, 3.85 - row * 0.32], [3.6, h + row * 0.18, 3.85 - row * 0.32], 0.012);
  for (const x of [-1.65, 1.65]) {
    b(g, '#c7c1ad', x, h + 1.1, 1.4, 1.15, 1.6, 1.1);
    b(g, '#2f4439', x, h + 1.1, 1.97, 0.72, 1.05, 0.05);
    b(g, '#ded7c1', x, h + 1.1, 2.02, 0.045, 1.05, 0.06);
    b(g, '#ded7c1', x, h + 1.1, 2.02, 0.72, 0.045, 0.06);
    const top = mesh(g, new T.ConeGeometry(1, 0.6, 4), m('#555e56'), x, h + 2.1, 1.4, 0.95, 1, 0.95);
    top.rotation.y = Math.PI / 4;
  }
  b(g, '#a18e77', 2.75, h + 1.55, -1.6, 0.65, 2.1, 0.65);
  b(g, '#7e7563', 2.75, h + 2.65, -1.6, 0.79, 0.15, 0.79);
}

const lanternGlass = new T.MeshStandardMaterial({ color: '#ead09b', emissive: '#bc7939', emissiveIntensity: 0.35, roughness: 0.3 });
function gasLantern(g: T.Object3D, x: number, y: number, z: number) {
  line(g, '#2d3e31', [x, y + 0.3, z - 0.4], [x, y + 0.3, z], 0.025);
  b(g, '#2a3a2e', x, y - 0.23, z, 0.34, 0.05, 0.32);
  b(g, lanternGlass, x, y, z, 0.23, 0.4, 0.23);
  for (const xx of [-0.14, 0.14]) for (const zz of [-0.14, 0.14]) line(g, '#283b2f', [x + xx, y - 0.22, z + zz], [x + xx, y + 0.22, z + zz], 0.018);
  const q = mesh(g, new T.ConeGeometry(0.26, 0.23, 4), m('#283b2f'), x, y + 0.32, z);
  q.rotation.y = Math.PI / 4;
}

function balcony(g: T.Object3D, y: number) {
  b(g, '#c6bba3', 0, y, 4.13, 6.25, 0.21, 1.25);
  lace(g, 0, y + 0.73, 4.79, 6.25, 1.15);
  for (const xx of [-3.1, 3.1]) lace(g, xx, y + 0.73, 4.14, 1.2, 1.15, Math.PI / 2);
  for (const yy of [y + 0.18, y + 1.32]) b(g, '#26382e', 0, yy, 4.8, 6.35, 0.055, 0.07);
  for (const xx of [-2.65, 0, 2.65]) {
    const br = mesh(g, new T.TorusGeometry(0.48, 0.035, 6, 20, Math.PI / 2), m('#314031', true), xx, y - 0.54, 4.23);
    br.rotation.y = Math.PI / 2;
    fern(g, xx, y + 0.5, 4.65, 0.8);
  }
}

function shop(g: T.Object3D, title: string, index: number) {
  label(g, title, 0, 3.12, 3.81, 5.65, 0.43, '#e0d4b4', '#344634');
  for (const x of [-2.1, 0, 2.1]) {
    b(g, '#3a4639', x, 1.4, 3.6, 1.75, 2.7, 0.12);
    b(g, glassMaterial, x, 1.55, 3.68, 1.55, 2.3, 0.04);
    for (const xx of [-0.84, 0.84]) b(g, '#454f3e', x + xx, 1.4, 3.74, 0.08, 2.7, 0.1);
    b(g, '#9b8c6b', x, 0.25, 3.79, 1.5, 0.4, 0.1);
    b(g, '#c7bfa9', x, 2.59, 3.78, 1.6, 0.07, 0.07);
  }
  const aw = new T.Group();
  aw.position.set(0, 3.16, 3.78);
  aw.rotation.x = -0.15;
  g.add(aw);
  b(aw, index % 2 ? '#597b6e' : '#8a5345', 0, -0.05, 0.67, 6.3, 0.09, 1.38);
  for (let j = 0; j < 15; j++) {
    b(aw, '#d5c6a1', -3.03 + j * 0.42, 0, 0.67, 0.2, 0.03, 1.36);
    b(aw, j % 2 ? '#c7b99a' : index % 2 ? '#58796c' : '#8a5345', -3.03 + j * 0.42, -0.16, 1.33, 0.4, 0.3, 0.04);
  }
  gasLantern(g, -3.15, 2.5, 4);
  gasLantern(g, 3.15, 2.5, 4);
  line(g, '#324534', [2.85, 3.55, 3.7], [2.85, 3.55, 5.2], 0.035);
  const hanging = label(g, index % 2 ? 'CAFÉ' : 'GALERIE', 2.85, 3.1, 4.7, 1, 0.6, '#263e30', '#e7d9ad');
  hanging.rotation.y = Math.PI / 2;
}

function courtyard(g: T.Object3D, h: number, wall: T.Material) {
  b(g, wall, -2.3, h / 2, 0, 2.3, h, 7);
  b(g, wall, 2.3, h / 2, 0, 2.3, h, 7);
  b(g, wall, 0, (h + 3.4) / 2, 0, 2.35, h - 3.4, 7);
  b(g, '#4b4d3c', 0, 0.02, 0.4, 2.25, 0.05, 6);
  lace(g, 0, 1.45, 3.56, 2.2, 2.8);
  arch(g, 0, 2.8, 3.58, 2.2, 1.1, m('#2c3e2f'));
  for (const xx of [-1.22, 1.22]) b(g, '#cbbd9d', xx, 1.72, 3.66, 0.19, 3.45, 0.2);
  label(g, 'COUR DES ARTISTES', 0, 3.66, 3.76, 2.9, 0.3);
  fern(g, 0, 0.65, -1.6, 1.8);
  gasLantern(g, -1.5, 2.4, 3.9);
}

// Weathering: soft stains over the facade and damp at the base.
function patina(g: T.Object3D, h: number, index: number) {
  const c = document.createElement('canvas');
  c.width = c.height = 256;
  const k = c.getContext('2d')!;
  seed = 212 + index;
  for (let i = 0; i < 75; i++) {
    const x = rnd() * 256;
    const y = rnd() * 256;
    const r = 8 + rnd() * 25;
    const grad = k.createRadialGradient(x, y, 0, x, y, r);
    grad.addColorStop(0, 'rgba(67,61,39,.14)');
    grad.addColorStop(1, 'rgba(67,61,39,0)');
    k.fillStyle = grad;
    k.fillRect(x - r, y - r, r * 2, r * 2);
  }
  for (let i = 0; i < 18; i++) {
    k.fillStyle = 'rgba(52,62,33,.12)';
    k.fillRect(rnd() * 256, 210 + rnd() * 45, 2 + rnd() * 8, rnd() * 40);
  }
  const t = new T.CanvasTexture(c);
  t.colorSpace = T.SRGBColorSpace;
  const stain = new T.MeshStandardMaterial({ map: t, transparent: true, depthWrite: false, roughness: 1 });
  mesh(g, new T.PlaneGeometry(6.9, h), stain, 0, h / 2, 3.529);
}

function quarterBuilding(g: T.Object3D, accent: string, index: number) {
  seed = index * 311 + 17;
  // 0: townhouse with balcony, 1: gallery shop, 2: Creole cottage, 3: townhouse, 4: courtyard gate, 5: corner jazz club.
  const kind = index % 6;
  const h = kind === 2 ? 4.45 : kind === 5 ? 10.5 : kind === 4 ? 8.65 : 7.25;
  const wall = wallMaterial(accent, kind === 1 || kind === 5);
  const trim = kind === 3 ? '#e1cbb0' : '#e2dbc6';
  const shutter = ['#244737', '#364e4c', '#495644', '#335d4f', '#5c534d', '#315142'][kind];
  if (kind === 4) courtyard(g, h, wall);
  else b(g, wall, 0, h / 2, 0, 6.94, h, 7);
  patina(g, h, index);
  roof(g, h, kind === 2);
  for (const yy of [h - 0.2, h, h + 0.16]) b(g, trim, 0, yy, 3.57, 7.07 + (yy === h ? 0.16 : 0), 0.15, 0.29);
  for (const x of [-3.35, 3.35]) b(g, trim, x, h / 2, 3.56, 0.16, h, 0.18);

  if (kind === 2) {
    for (const x of [-2.55, -0.85, 0.85, 2.55]) frenchDoor(g, x, 0.22, 3.6, shutter);
    b(g, '#c4bca6', 0, 0.12, 3.93, 7, 0.22, 0.8);
    label(g, 'MAISON CRÉOLE', 0, 3.75, 3.76, 2.3, 0.27);
    gasLantern(g, 0, 3.15, 4);
    fern(g, -3.1, 0.6, 4.05, 1);
    fern(g, 3.1, 0.6, 4.05, 1);
    return;
  }
  if (kind === 1 || kind === 5) shop(g, kind === 1 ? 'GALERIE DES ARTS' : 'LE COIN DU JAZZ', index);
  else if (kind !== 4) {
    for (const x of [-2.2, 0, 2.2]) frenchDoor(g, x, 0.12, 3.6, shutter, true);
    gasLantern(g, -3, 2.5, 4);
    gasLantern(g, 3, 2.5, 4);
  }
  const floorY = 3.65;
  for (const x of [-2.2, 0, 2.2]) frenchDoor(g, x, floorY + 0.15, 3.6, shutter, kind === 3);
  if (kind === 5) {
    for (const x of [-2.2, 0, 2.2]) frenchDoor(g, x, 7.13, 3.6, shutter);
    gallery(g, 3.65, 6.9, 6.94, 2.55, index === 11);
    gallery(g, 7, 10.3, 6.94, 2.55, index === 11);
    b(g, trim, 0, 10.3, 4.77, 7.1, 0.15, 2.6);
  } else if (kind === 1) {
    gallery(g, 3.65, h - 0.2, 6.94, 2.4);
    b(g, trim, 0, h - 0.1, 4.7, 7.1, 0.12, 2.5);
  } else {
    balcony(g, 3.65);
  }
  // Bougainvillea spilling over some balconies.
  if (index % 3 === 1) {
    for (let i = 0; i < 28; i++) {
      const x = -2.8 + rnd() * 1.2;
      const yy = 3.9 + rnd() * 1.1;
      mesh(g, leafGeo, m(i % 3 ? '#a85676' : '#c67d8c'), x, yy, 4.65 + rnd() * 0.12, 0.055, 0.06, 0.055);
    }
  }
  line(g, '#736b52', [-3.2, 0.1, 3.76], [-3.2, h, 3.76], 0.045);
  label(g, String(700 + index * 12), 3, 2.1, 3.81, 0.38, 0.23);
  // Shuttered openings on the corner club's side wall, visible between roof heights.
  if (kind === 5) {
    const side = new T.Group();
    side.position.set(-3.52, 0, 0);
    side.rotation.y = -Math.PI / 2;
    g.add(side);
    for (const y of [3.8, 7.2]) for (const x of [-2.1, 0, 2.1]) frenchDoor(side, x, y, 0, shutter);
  }
}

/** Street-name tiles set in the sidewalk, café tables and LIVE JAZZ boards. */
export function quarterStreetDetails(g: T.Object3D) {
  seed = 41;
  for (const side of [-1, 1]) {
    const tiles = new T.Group();
    tiles.position.set(side * 6.65, 0.15, 18.2);
    tiles.rotation.x = -Math.PI / 2;
    tiles.rotation.z = side < 0 ? 0 : Math.PI;
    g.add(tiles);
    const words = 'ROYAL';
    for (let i = 0; i < words.length; i++) label(tiles, words[i], 0, -i * 0.3, 0, 0.27, 0.27, '#eee8d5', '#315f87');
  }
  const iron = m('#2d4235', true);
  for (let i = 0; i < 6; i++) {
    const group = new T.Group();
    group.position.set((i % 2 ? 1 : -1) * 7, 0, 17 - i * 17);
    g.add(group);
    mesh(group, new T.CylinderGeometry(0.43, 0.43, 0.045, 24), m('#807c6a'), 0, 0.76, 0);
    line(group, iron, [0, 0.05, 0], [0, 0.76, 0], 0.045);
    for (const a of [0, Math.PI]) {
      const x = Math.cos(a) * 0.65;
      const z = Math.sin(a) * 0.65;
      mesh(group, new T.CylinderGeometry(0.24, 0.24, 0.04, 14), iron, x, 0.46, z);
      for (const dx of [-0.16, 0.16]) for (const dz of [-0.14, 0.14]) line(group, iron, [x + dx, 0.05, z + dz], [x + dx, 0.46, z + dz], 0.018);
      mesh(group, new T.TorusGeometry(0.24, 0.023, 5, 16, Math.PI), iron, x, 0.76, z + 0.18);
      for (const dx of [-0.23, 0.23]) line(group, iron, [x + dx, 0.46, z + 0.18], [x + dx, 0.76, z + 0.18], 0.02);
    }
    if (i < 3) {
      const board = new T.Group();
      board.position.set(0.15, 0, 1.25);
      board.rotation.y = 0.22;
      group.add(board);
      b(board, '#735f42', 0, 0.6, 0, 0.65, 1.2, 0.1);
      label(board, 'LIVE JAZZ', 0, 0.82, 0.061, 0.55, 0.27, '#26382c', '#e6e0bc');
      label(board, 'TONIGHT', 0, 0.49, 0.061, 0.55, 0.24, '#26382c', '#e6e0bc');
      for (const x of [-0.28, 0.28]) line(board, '#735f42', [x, 0, 0.27], [x, 1.2, 0], 0.028);
    }
  }
}
