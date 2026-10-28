// Fall In: a paper-theatre street the camera drops into, ending over the visitor's shoulder.
// Three.js draws the scene; Theatre.js owns the camera move and crowd timing (src/theatre/fall-in.state.json).
// Every card is drawn on a canvas for now. Swap the draw* functions for Nano Banana cutouts when they land.
import * as THREE from 'three';
import { getProject, types, val } from '@theatre/core';
import state from '../../theatre/fall-in.state.json';
import { drawFacade, drawFigure, drawRail, drawSky, drawStreet, drawVisitor, type Item } from './cards';

export interface FallIn {
  /** Move the shot to a point between 0 (aerial) and 1 (over the shoulder). */
  seek(progress: number): void;
  setItem(item: Item): void;
  /** Start or stop the render loop, e.g. when the section leaves the viewport. */
  setActive(active: boolean): void;
}

interface Options {
  canvas: HTMLCanvasElement;
  /** No idle motion: the scene only redraws when the shot moves. */
  still: boolean;
  item: Item;
  /** Opens the Theatre.js editor (dev only). */
  studio?: boolean;
}

const STREET_HALF = 5;
const BUILDING_X = 7.6;

export async function createFallIn({ canvas, still, item, studio }: Options): Promise<FallIn> {
  // The DEV check lets the production build drop the editor (AGPL) entirely, not just skip loading it.
  if (import.meta.env.DEV && studio) {
    const mod = await import('@theatre/studio');
    // The studio ships as CommonJS, so Vite can nest the default export one level deeper.
    const studioApi = ((mod.default as { default?: typeof mod.default }).default ?? mod.default);
    studioApi.initialize();
  }

  const small = Math.min(window.innerWidth, window.innerHeight) < 700;
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, small ? 1.5 : 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const scene = new THREE.Scene();
  scene.background = texture(drawSky());
  scene.fog = new THREE.Fog(0xcfe9f5, 45, 150);

  const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 400);
  const target = new THREE.Vector3();

  buildStreet(scene);
  buildBlocks(scene, -1);
  buildBlocks(scene, 1);
  buildLamps(scene);

  // Crowd: upright cards that turn to face the camera around their vertical axis.
  const crowd = buildCrowd(scene, small ? 70 : 140);

  // The visitor stands at the back of the line, seen from behind.
  const visitorCanvas = document.createElement('canvas');
  const visitorTex = texture(drawVisitor(item, visitorCanvas));
  const visitor = card(visitorTex, 1.25, 2.3);
  visitor.position.set(0, 0, 4);
  scene.add(visitor);

  // Theatre.js: the shot. Edit with ?studio in dev, export, replace fall-in.state.json.
  const sheet = getProject('Fall In', { state }).sheet('Shot');
  const cam = sheet.object('Camera', {
    position: { x: 0, y: 46, z: 34 },
    target: { x: 0, y: 0, z: -30 },
    fov: types.number(42, { range: [20, 90] }),
  });
  const crowdObj = sheet.object('Crowd', {
    march: types.number(0, { range: [0, 20] }),
    sway: types.number(0.3, { range: [0, 2] }),
  });
  const visitorObj = sheet.object('Visitor', { reveal: types.number(0, { range: [0, 1] }) });

  let dirty = true;
  cam.onValuesChange((v) => {
    camera.position.set(v.position.x, v.position.y, v.position.z);
    target.set(v.target.x, v.target.y, v.target.z);
    camera.fov = v.fov;
    camera.updateProjectionMatrix();
    dirty = true;
  });
  let march = 0;
  let sway = 0;
  crowdObj.onValuesChange((v) => {
    march = v.march;
    sway = v.sway;
    dirty = true;
  });
  visitorObj.onValuesChange((v) => {
    (visitor.material as THREE.MeshBasicMaterial).opacity = v.reveal;
    visitor.position.y = (1 - v.reveal) * -0.6;
    visitor.visible = v.reveal > 0.01;
    dirty = true;
  });

  const resize = () => {
    const { clientWidth: w, clientHeight: h } = canvas;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    // Portrait screens see less street; pull the frame wider so the line still fits.
    camera.zoom = camera.aspect < 1 ? Math.max(0.6, camera.aspect * 1.1) : 1;
    camera.updateProjectionMatrix();
    dirty = true;
  };
  new ResizeObserver(resize).observe(canvas);
  resize();

  const start = performance.now();
  let raf = 0;
  const frame = () => {
    const t = still ? 0 : (performance.now() - start) / 1000;
    if (still && !dirty) return;
    camera.lookAt(target);
    for (const m of crowd) {
      const d = m.userData as CrowdData;
      m.position.z = d.z - march * d.pace;
      m.position.y = Math.abs(Math.sin(t * d.speed + d.phase)) * 0.12 * sway;
      m.rotation.z = Math.sin(t * d.speed * 0.5 + d.phase) * 0.05 * sway;
      faceCamera(m, camera);
    }
    faceCamera(visitor, camera);
    renderer.render(scene, camera);
    dirty = false;
  };
  const loop = () => {
    frame();
    raf = requestAnimationFrame(loop);
  };

  return {
    seek(progress) {
      sheet.sequence.position = Math.min(1, Math.max(0, progress)) * val(sheet.sequence.pointer.length);
      if (still) frame();
    },
    setItem(next) {
      drawVisitor(next, visitorCanvas);
      visitorTex.needsUpdate = true;
      dirty = true;
      if (still) frame();
    },
    setActive(active) {
      cancelAnimationFrame(raf);
      if (still) frame();
      else if (active) loop();
    },
  };
}

interface CrowdData {
  z: number;
  pace: number;
  speed: number;
  phase: number;
}

function texture(source: HTMLCanvasElement) {
  const tex = new THREE.CanvasTexture(source);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

// A flat card standing on the ground, origin at its feet.
function card(map: THREE.Texture, w: number, h: number) {
  const geo = new THREE.PlaneGeometry(w, h);
  geo.translate(0, h / 2, 0);
  const mat = new THREE.MeshBasicMaterial({ map, transparent: true, alphaTest: 0.4, side: THREE.DoubleSide });
  return new THREE.Mesh(geo, mat);
}

function faceCamera(m: THREE.Object3D, camera: THREE.Camera) {
  m.rotation.y = Math.atan2(camera.position.x - m.position.x, camera.position.z - m.position.z);
}

function buildStreet(scene: THREE.Scene) {
  const tex = texture(drawStreet());
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(1, 14);
  const road = new THREE.Mesh(new THREE.PlaneGeometry(STREET_HALF * 2, 200), new THREE.MeshBasicMaterial({ map: tex }));
  road.rotation.x = -Math.PI / 2;
  road.position.z = -80;
  scene.add(road);

  for (const side of [-1, 1]) {
    const walk = new THREE.Mesh(
      new THREE.BoxGeometry(BUILDING_X - STREET_HALF, 0.2, 200),
      new THREE.MeshBasicMaterial({ color: 0xc9c4b8 }),
    );
    walk.position.set(side * (STREET_HALF + (BUILDING_X - STREET_HALF) / 2), 0.1, -80);
    scene.add(walk);
  }
}

// A row of townhouses: each is a box with a painted facade toward the street and a balcony rail in front.
function buildBlocks(scene: THREE.Scene, side: -1 | 1) {
  const roof = new THREE.MeshBasicMaterial({ color: 0x8a8378 });
  const wall = new THREE.MeshBasicMaterial({ color: 0x7a3b2c });
  const railTex = texture(drawRail());
  railTex.wrapS = THREE.RepeatWrapping;

  let z = 14;
  let i = 0;
  while (z > -170) {
    const w = 6 + ((i * 37) % 5);
    const h = 8 + ((i * 53) % 6);
    const depth = 9;
    const facade = new THREE.MeshBasicMaterial({ map: texture(drawFacade(i + (side > 0 ? 100 : 0), w, h)) });
    // BoxGeometry face order: +x, -x, +y, -y, +z, -z. The street-facing side is -x on the right, +x on the left.
    const mats = [wall, wall, roof, roof, wall, wall];
    mats[side > 0 ? 1 : 0] = facade;
    const box = new THREE.Mesh(new THREE.BoxGeometry(depth, h, w), mats);
    box.position.set(side * (BUILDING_X + depth / 2), h / 2, z - w / 2);
    scene.add(box);

    // Balcony: a slab and an iron rail one layer in front of the facade, for depth.
    const railGeo = new THREE.PlaneGeometry(w - 0.6, 1.1);
    railTex.repeat.set(Math.round(w), 1);
    const rail = new THREE.Mesh(railGeo, new THREE.MeshBasicMaterial({ map: railTex, transparent: true, alphaTest: 0.3, side: THREE.DoubleSide }));
    rail.rotation.y = side * -Math.PI / 2;
    rail.position.set(side * (BUILDING_X - 1.1), 4.3 + 0.55, z - w / 2);
    scene.add(rail);
    const slab = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.15, w - 0.6), new THREE.MeshBasicMaterial({ color: 0x2f3a33 }));
    slab.position.set(side * (BUILDING_X - 0.55), 4.3, z - w / 2);
    scene.add(slab);

    z -= w + 0.15;
    i++;
  }
}

function buildLamps(scene: THREE.Scene) {
  const iron = new THREE.MeshBasicMaterial({ color: 0x1f2a24 });
  const glass = new THREE.MeshBasicMaterial({ color: 0xf6e7b0 });
  for (let z = 6; z > -150; z -= 14) {
    for (const side of [-1, 1]) {
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.1, 3.6, 6), iron);
      post.position.set(side * (STREET_HALF + 0.5), 1.8, z + (side > 0 ? 7 : 0));
      const lamp = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.5, 0.35), glass);
      lamp.position.set(post.position.x, 3.75, post.position.z);
      scene.add(post, lamp);
    }
  }
}

function buildCrowd(scene: THREE.Scene, count: number) {
  // A small set of figure cards, reused across the crowd.
  const textures = Array.from({ length: 16 }, (_, i) => texture(drawFigure(i)));
  const rand = mulberry(7);
  const meshes: THREE.Mesh[] = [];
  for (let i = 0; i < count; i++) {
    // Denser near the back of the line, where the visitor joins; the band sits up front.
    const depth = Math.pow(rand(), 0.8);
    const z = 1 - depth * 62;
    const x = (rand() * 2 - 1) * (STREET_HALF - 0.6);
    const kind = i % textures.length;
    const h = 1.75 + rand() * 0.35 + (kind % 4 === 0 ? 0.9 : 0); // umbrella cards are taller
    const m = card(textures[kind], h * 0.55, h);
    m.position.set(x, 0, z);
    m.userData = { z, pace: 0.6 + rand() * 0.5, speed: 3 + rand() * 2.5, phase: rand() * Math.PI * 2 } satisfies CrowdData;
    scene.add(m);
    meshes.push(m);
  }
  return meshes;
}

function mulberry(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
