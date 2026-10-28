// The street, the second line and the visitor, ported from Nick's Second Line World Studio (world.js).
// Figures face +z, toward the visitor; the line comes up the block toward them.
import * as T from 'three';
import { asphalt, b, line, m, mesh, quarterStreetDetails, realisticBuilding, realisticPlanter, streetDetails } from './realism';

export type Instrument = 'snare' | 'trumpet' | 'trombone' | 'tuba';

/** Where the visitor stands. The camera's last keyframes sit just behind this point. */
export const VISITOR_Z = 19;

const ball = new T.SphereGeometry(1, 10, 8);
const BRASS = new T.MeshStandardMaterial({ color: '#dfb644', metalness: 0.7, roughness: 0.25 });
const COLORS = ['#d3c2a4', '#b1937c', '#decba9', '#acb3a0', '#b79781', '#b9b1a4'];
const ACCENTS = ['#e3b638', '#c94b81', '#238c87', '#f4cf56', '#f4efe0', '#d55648'];
const BAND: Instrument[] = ['tuba', 'trumpet', 'trombone', 'snare'];

let randseed = 17;
function rnd() {
  randseed = (randseed * 1664525 + 1013904223) >>> 0;
  return randseed / 4294967296;
}
const pick = <V>(a: V[]) => a[Math.floor(rnd() * a.length)];

type V3 = [number, number, number];

/**
 * A second liner. The body sits in a 'rig' group so it can bob without moving the figure's footprint.
 * With an instrument, the arms come forward to hold it.
 */
export function person(g: T.Object3D, c: string, seed: number, instrument?: Instrument) {
  const body = new T.Group();
  body.name = 'rig';
  g.add(body);
  g.userData.rig = body;
  const skin = ['#6d4330', '#9b6241', '#c78e65', '#4c3027'][seed % 4];
  const pants = seed % 3 ? '#344c50' : '#b79a64';
  mesh(body, new T.CylinderGeometry(0.19, 0.23, 0.6, 12), c, 0, 1.12, 0, 1, 1, 0.75);
  mesh(body, ball, c, 0, 1.36, 0, 0.24, 0.13, 0.16);
  mesh(body, ball, skin, 0, 1.67, 0, 0.205, 0.25, 0.19);
  mesh(body, ball, '#2f2923', 0, 1.83, -0.03, 0.21, 0.15, 0.19);
  for (const x of [-0.072, 0.072]) mesh(body, ball, '#26221b', x, 1.7, 0.174, 0.018, 0.015, 0.012);
  mesh(body, ball, skin, 0, 1.64, 0.196, 0.036, 0.045, 0.035);
  b(body, skin, 0, 1.42, 0, 0.13, 0.2, 0.14);

  // Arm poses: hands up to the mouth for horns, low and forward for the drum, raised to dance otherwise.
  const drum = instrument === 'snare';
  const elbow = (side: number): V3 => (drum ? [side * 0.42, 1.08, 0.12] : [side * 0.48, 1.05, instrument ? 0.2 : 0]);
  const hand = (side: number): V3 => (drum ? [side * 0.2, 1.08, 0.38] : [side * 0.4, instrument ? 1.42 : 1.48, 0.25]);
  for (const side of [-1, 1]) {
    line(body, pants, [side * 0.13, 0.85, 0], [side * 0.16, 0.25, side * 0.09], 0.095);
    b(body, '#eeeee3', side * 0.16, 0.12, side * 0.09 + 0.07, 0.18, 0.15, 0.35);
    line(body, skin, [side * 0.28, 1.34, 0], elbow(side), 0.07);
    line(body, skin, elbow(side), hand(side), 0.065);
  }
  if (seed % 5 === 0 && !instrument) {
    mesh(body, new T.CylinderGeometry(0.33, 0.33, 0.06, 16), '#dcc99b', 0, 1.98, 0);
    mesh(body, new T.CylinderGeometry(0.21, 0.23, 0.2, 12), '#e2d2ac', 0, 2.08, 0);
  }
  if (instrument) INSTRUMENTS[instrument](body);
}

// Each instrument is built on the figure's rig, in front of the chest (+z), with a part that shows from behind.
const INSTRUMENTS: Record<Instrument, (g: T.Object3D) => void> = {
  tuba(g) {
    // Sousaphone: the loop wraps the body and the bell rises over the shoulder.
    mesh(g, new T.TorusGeometry(0.34, 0.075, 7, 20), BRASS, 0.23, 1.24, 0.25);
    mesh(g, new T.CylinderGeometry(0.28, 0.065, 0.45, 16, 1, true), BRASS, 0.4, 1.78, 0.24);
    mesh(g, new T.CircleGeometry(0.22, 16), '#514324', 0.4, 2.008, 0.24).rotation.x = -Math.PI / 2;
  },
  trumpet(g) {
    line(g, BRASS, [0.06, 1.54, 0.2], [0.08, 1.44, 0.95], 0.06);
    const bell = mesh(g, new T.CylinderGeometry(0.2, 0.055, 0.3, 14, 1, true), BRASS, 0.08, 1.44, 0.9);
    bell.rotation.x = Math.PI / 2;
  },
  trombone(g) {
    // Two slide tubes reaching forward, the bell beside them, and the tuning loop back over the shoulder.
    for (const x of [-0.04, 0.06]) line(g, BRASS, [x, 1.56, 0.2], [x, 1.46, 1.45], 0.022);
    line(g, BRASS, [-0.04, 1.46, 1.45], [0.06, 1.46, 1.45], 0.022);
    line(g, BRASS, [0.18, 1.6, -0.25], [0.18, 1.6, 0.55], 0.03);
    const bell = mesh(g, new T.CylinderGeometry(0.2, 0.05, 0.36, 14, 1, true), BRASS, 0.18, 1.6, 0.7);
    bell.rotation.x = Math.PI / 2;
    mesh(g, new T.TorusGeometry(0.1, 0.022, 6, 14, Math.PI), BRASS, 0.18, 1.6, -0.25).rotation.set(Math.PI / 2, 0, Math.PI / 2);
  },
  snare(g) {
    // Slung at the left hip, the way it's marched, so it shows past the body from behind.
    const shell = mesh(g, new T.CylinderGeometry(0.3, 0.3, 0.22, 20), '#b23a3a', -0.3, 0.96, 0.24);
    shell.rotation.set(0.2, 0, 0.18);
    const head = mesh(g, new T.CylinderGeometry(0.29, 0.29, 0.015, 20), '#f1ede1', -0.28, 1.075, 0.22);
    head.rotation.set(0.2, 0, 0.18);
    // Sling from the right shoulder across the back; sticks in both hands, tips on the head.
    line(g, '#2c2a26', [0.2, 1.42, -0.12], [-0.3, 0.98, -0.06], 0.03);
    line(g, '#2c2a26', [-0.3, 0.98, -0.06], [-0.3, 1.0, 0.1], 0.025);
    for (const side of [-1, 1]) line(g, '#d9c08a', [side * 0.2, 1.08, 0.38], [-0.28 + side * 0.08, 1.1, 0.26], 0.015);
  },
};

function umbrella(g: T.Object3D, c: string) {
  line(g, '#b9a16a', [0, 0, 0], [0, 2.8, 0], 0.035);
  const canopy = new T.Group();
  canopy.position.y = 2.65;
  g.add(canopy);
  const geo = new T.SphereGeometry(1, 24, 7, 0, Math.PI * 2, 0, Math.PI * 0.47);
  const mm = new T.MeshStandardMaterial({ color: c, side: T.DoubleSide, roughness: 0.8 });
  mesh(canopy, geo, mm, 0, 0, 0, 1.12, 0.5, 1.12);
  for (let a = 0; a < 12; a++) {
    const theta = (a / 12) * Math.PI * 2;
    line(canopy, '#f1dfae', [0, 0.5, 0], [Math.cos(theta) * 1.11, 0.045, Math.sin(theta) * 1.11], 0.012);
    mesh(canopy, ball, c, Math.cos(theta) * 1.04, 0.025, Math.sin(theta) * 1.04, 0.12, 0.09, 0.12);
  }
  mesh(g, ball, '#cb9f36', 0, 3.2, 0, 0.08, 0.16, 0.08);
}

function lamp(g: T.Object3D) {
  line(g, '#253e35', [0, 0, 0], [0, 4.5, 0], 0.065);
  mesh(g, new T.CylinderGeometry(0.2, 0.33, 0.3, 8), '#253e35', 0, 0.15, 0);
  b(g, '#334c3e', 0, 4.5, 0, 0.52, 0.1, 0.52);
  b(g, '#e5cd7f', 0, 4.86, 0, 0.34, 0.62, 0.34);
  mesh(g, new T.ConeGeometry(0.45, 0.4, 4), '#253e35', 0, 5.3, 0).rotation.y = Math.PI / 4;
  for (const x of [-0.19, 0.19]) for (const z of [-0.19, 0.19]) line(g, '#253e35', [x, 4.5, z], [x, 5.22, z], 0.025);
}

function environment(g: T.Object3D) {
  b(g, asphalt, 0, -0.16, -60, 11, 0.3, 300);
  b(g, '#b8b4a4', -7.5, -0.06, -60, 4, 0.35, 300);
  b(g, '#b8b4a4', 7.5, -0.06, -60, 4, 0.35, 300);
  b(g, '#bdc3ad', 0, -0.4, -25, 250, 0.2, 250);
  // Curbs and paving joints.
  for (let z = -120; z < 56; z += 2.8) {
    for (const side of [-1, 1]) {
      b(g, '#d4d0bd', side * 5.65, 0.12, z, 0.34, 0.34, 2.73);
      b(g, '#a29f92', side * 7.3, 0.125, z, 4.2, 0.018, 0.035);
    }
  }
  for (const z of [-5, -43, 25]) {
    mesh(g, new T.CylinderGeometry(0.55, 0.55, 0.025, 24), '#4e5f59', 2, 0.008, z);
    for (let a = 0; a < 5; a++) b(g, '#78827b', 2, 0.025, z - 0.3 + a * 0.15, 0.7, 0.015, 0.025);
  }
  streetDetails(g);
  quarterStreetDetails(g);
  // Rue St. Ann, the cross street on the east side.
  b(g, asphalt, 16, -0.04, 14.9, 22, 0.08, 6.6);
}

function place(parent: T.Object3D, x: number, z: number) {
  const g = new T.Group();
  g.position.set(x, 0, z);
  parent.add(g);
  return g;
}

export interface World {
  /** Everyone who dances: the rigs bob with the music. */
  dancers: { rig: T.Object3D; seed: number }[];
  /** The line itself; moving it along z marches it up the block. */
  parade: T.Group;
  /** The visitor, standing at VISITOR_Z with their back to the camera. */
  visitor: T.Group;
  setInstrument(instrument: Instrument): void;
}

export function buildWorld(scene: T.Scene, { small }: { small: boolean }): World {
  randseed = 17;
  const world = new T.Group();
  scene.add(world);
  environment(world);

  // Townhouses on both sides, with a gap on the east for the cross street; phones get a shorter block.
  const house = (x: number, z: number, color: string, index: number) => {
    const g = place(world, x, z);
    realisticBuilding(g, color, index);
    g.rotation.y = x < 0 ? Math.PI / 2 : -Math.PI / 2;
  };
  const blocks = small ? 8 : 14;
  for (let i = 0; i < blocks; i++) {
    for (const s of [-1, 1]) {
      if (s === 1 && i === 2) continue;
      house(s * 12.4, 29 - i * 7.05, COLORS[(i + (s === 1 ? 2 : 0)) % COLORS.length], i + (s === 1 ? 10 : 0));
    }
  }
  // Creole townhouses at the near end, seen from the aerial opening.
  for (let j = 1; j <= (small ? 2 : 4); j++) {
    for (const s of [-1, 1]) house(s * 12.4, 29 + j * 7.05, COLORS[(j + 2) % COLORS.length], 30 + j + (s === 1 ? 4 : 0));
  }
  for (let i = 0; i < (small ? 6 : 9); i++) {
    for (const s of [-1, 1]) {
      lamp(place(world, s * 5.95, 26 - i * 9));
      if (i % 2 === 0) realisticPlanter(place(world, s * 7.3, 24 - i * 9));
    }
  }

  const dancers: World['dancers'] = [];
  const parade = new T.Group();
  world.add(parade);
  // A tight line down the middle of the street, about four abreast, each dancer jostled off the grid.
  const WIDE = 4;
  const count = small ? 64 : 104;
  const rows = Math.ceil(count / WIDE);
  for (let i = 0; i < count; i++) {
    const row = Math.floor(i / WIDE);
    const col = i % WIDE;
    const x = (col - (WIDE - 1) / 2) * 1.15 + (rnd() - 0.5) * 0.7;
    const z = 12 - row * 1.45 + (rnd() - 0.5) * 0.9;
    // The band marches in the middle third of the line.
    const inBand = row >= rows / 3 && row < rows / 2;
    const g = place(parade, x, z);
    person(g, inBand ? '#f2eee0' : pick(ACCENTS), i, inBand ? BAND[i % BAND.length] : undefined);
    g.rotation.y = (rnd() - 0.5) * 0.6;
    dancers.push({ rig: g.userData.rig, seed: i });
    if (!inBand && i % 9 === 1) {
      const u = place(parade, x + 0.35, z + 0.15);
      u.position.y = 0.12;
      umbrella(u, pick(['#e9bb37', '#c14480', '#f4cf56', '#238c87']));
    }
  }
  // Neighbours on the sidewalks, turned toward the street.
  for (let i = 0; i < (small ? 10 : 16); i++) {
    const g = place(world, (i % 2 ? 1 : -1) * (6.4 + rnd() * 0.7), 22 - i * 4);
    person(g, pick(ACCENTS), i + 71);
    g.rotation.y = i % 2 ? -1.1 : 1.1;
    dancers.push({ rig: g.userData.rig, seed: i + 71 });
  }

  return { dancers, parade, ...addVisitor(world, dancers) };
}

// The visitor stands at the back of the line, back to the camera, and redraws with each instrument picked.
function addVisitor(world: T.Object3D, dancers: World['dancers']) {
  const visitor = place(world, 0, VISITOR_Z);
  visitor.rotation.y = Math.PI;
  const visitorDancer = { rig: new T.Object3D(), seed: 3 };
  dancers.push(visitorDancer);
  return {
    visitor,
    setInstrument(instrument: Instrument) {
      visitor.clear();
      person(visitor, '#f4efe0', 3, instrument);
      visitorDancer.rig = visitor.userData.rig;
    },
  };
}

/**
 * The street from a Second Line World Studio export (Export 3D), instead of building it in code.
 * The export is static, so the parade is regrouped by name to march, and each 'Dance rig' keeps its sway.
 */
export async function loadWorld(scene: T.Scene, url: string): Promise<World> {
  const { GLTFLoader } = await import('three/examples/jsm/loaders/GLTFLoader.js');
  const gltf = await new GLTFLoader().loadAsync(url);
  const world = gltf.scene;
  scene.add(world);

  const parade = new T.Group();
  world.add(parade);
  const dancers: World['dancers'] = [];
  const marchers: T.Object3D[] = [];
  world.traverse((o) => {
    if (o instanceof T.Mesh) o.castShadow = o.receiveShadow = true;
    // GLTFLoader turns spaces into underscores and numbers repeats ('Dance_rig_12').
    if (/^Dance[ _]rig/.test(o.name)) dancers.push({ rig: o, seed: dancers.length });
    // Figures and parasols in the roadway march; neighbours on the sidewalks stay put.
    if (/^(Dancer|Brass[ _]musician|Parasol)/.test(o.name) && Math.abs(o.position.x) < 5.5) marchers.push(o);
  });
  marchers.forEach((o) => parade.attach(o));

  return { dancers, parade, ...addVisitor(world, dancers) };
}
