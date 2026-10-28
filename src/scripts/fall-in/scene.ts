// Fall In: the camera drops from above a French Quarter street into the second line,
// ending over the visitor's shoulder with the instrument they picked.
// The street and figures come from Nick's Second Line World Studio (world.ts, realism.ts).
// Theatre.js owns the camera move and the parade's timing (src/theatre/fall-in.state.json).
import * as T from 'three';
import { getProject, types, val } from '@theatre/core';
import state from '../../theatre/fall-in.state.json';
import { addClouds, applyLighting } from './realism';
import { buildWorld, loadWorld, type Instrument } from './world';

export interface FallIn {
  /** Move the shot to a point between 0 (aerial) and 1 (over the shoulder). */
  seek(progress: number): void;
  setInstrument(instrument: Instrument): void;
  /** Start or stop the render loop, e.g. when the section leaves the viewport. */
  setActive(active: boolean): void;
}

interface Options {
  canvas: HTMLCanvasElement;
  /** No idle motion: the scene only redraws when the shot moves. */
  still: boolean;
  instrument: Instrument;
  /** Opens the Theatre.js editor (dev only). */
  studio?: boolean;
  /** A Second Line World Studio export (.glb) to use instead of the street built in code. */
  worldUrl?: string;
}

const SKY = '#bdd4dd';

export async function createFallIn({ canvas, still, instrument, studio, worldUrl }: Options): Promise<FallIn> {
  // The DEV check lets the production build drop the editor (AGPL) entirely, not just skip loading it.
  if (import.meta.env.DEV && studio) {
    const mod = await import('@theatre/studio');
    // The studio ships as CommonJS, so Vite can nest the default export one level deeper.
    const studioApi = (mod.default as { default?: typeof mod.default }).default ?? mod.default;
    studioApi.initialize();
  }

  // Phones get a shorter street, fewer people and no shadows.
  const small = Math.min(window.innerWidth, window.innerHeight) < 700;
  const renderer = new T.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, small ? 1.5 : 1.75));
  renderer.outputColorSpace = T.SRGBColorSpace;
  renderer.toneMapping = T.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.shadowMap.enabled = !small;
  renderer.shadowMap.type = T.PCFSoftShadowMap;

  const scene = new T.Scene();
  scene.background = new T.Color(SKY);
  // Fog starts further out than in the studio so the aerial opening stays clear.
  scene.fog = new T.Fog(SKY, 85, 190);
  scene.add(new T.HemisphereLight('#e2f3ff', '#a99e77', 1.4));
  const sun = new T.DirectionalLight('#fff0ce', 2.7);
  sun.position.set(-24, 43, 25);
  sun.castShadow = !small;
  sun.shadow.mapSize.set(2048, 2048);
  Object.assign(sun.shadow.camera, { left: -45, right: 45, top: 65, bottom: -65, near: 1, far: 130 });
  sun.shadow.bias = -0.0006;
  sun.shadow.normalBias = 0.025;
  sun.shadow.radius = 3;
  scene.add(sun, sun.target);
  applyLighting(scene, renderer);
  addClouds(scene);

  const world = worldUrl ? await loadWorld(scene, worldUrl) : buildWorld(scene, { small });
  world.setInstrument(instrument);
  // Nothing moves far enough to need fresh shadows every frame; redraw them only when the line or visitor moves.
  renderer.shadowMap.autoUpdate = false;
  renderer.shadowMap.needsUpdate = true;

  const camera = new T.PerspectiveCamera(48, 1, 0.1, 350);
  const target = new T.Vector3();

  // Theatre.js: the shot. Edit with ?studio in dev, export, replace fall-in.state.json.
  const sheet = getProject('Fall In', { state }).sheet('Shot');
  const cam = sheet.object('Camera', {
    position: { x: 0, y: 13, z: 44 },
    target: { x: 0, y: 3, z: -20 },
    fov: types.number(50, { range: [20, 90] }),
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
  let sway = 0;
  crowdObj.onValuesChange((v) => {
    // The line comes up the block toward the visitor.
    world.parade.position.z = v.march;
    sway = v.sway;
    renderer.shadowMap.needsUpdate = true;
    dirty = true;
  });
  visitorObj.onValuesChange((v) => {
    // The visitor rises into place rather than fading, since their materials are shared.
    world.visitor.position.y = (1 - v.reveal) * -2.2;
    world.visitor.visible = v.reveal > 0.01;
    renderer.shadowMap.needsUpdate = true;
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
    if (still && !dirty) return;
    const t = still ? 0 : (performance.now() - start) / 1000;
    camera.lookAt(target);
    if (!still) {
      for (const { rig, seed } of world.dancers) {
        rig.position.y = Math.sin(t * 5 + seed) * 0.065 * sway;
        rig.rotation.z = Math.sin(t * 2.5 + seed) * 0.045 * sway;
      }
    }
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
    setInstrument(next) {
      world.setInstrument(next);
      renderer.shadowMap.needsUpdate = true;
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
