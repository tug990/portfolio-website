import * as THREE from "three";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
import { ShaderPass } from "three/examples/jsm/postprocessing/ShaderPass.js";
import { OutputPass } from "three/examples/jsm/postprocessing/OutputPass.js";
import { GTAOPass } from "three/examples/jsm/postprocessing/GTAOPass.js";
import { RectAreaLightUniformsLib } from "three/examples/jsm/lights/RectAreaLightUniformsLib.js";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import type { Project } from "@/content/projects";
import {
  doorLightTexture,
  leafTextures,
  poolTexture,
  skylightTexture,
  textTexture,
  wallWashTexture,
} from "./textures";
import { marbleFloorMaterial } from "./marble";
import {
  addBench,
  addFloorReflection,
  addFramedPicture,
  addPrismPlinth,
  addCoveLighting,
  microcement,
  addWallTitle,
  sizeFloorReflection,
  type SetCtx,
} from "./warmset";
import type { Reflector } from "three/examples/jsm/objects/Reflector.js";

/*
  The gallery room, rendered with three.js.

  Everything is in metres. The side-wall films start just past z = 0; the room
  runs back to the far wall at z = -D and forward to the door wall at
  z = front. x runs across from -W/2 to W/2, and the floor is at y = 0.

  Every surface is smooth and seamless. Light does the work: a recessed
  spotlight on every screen (casting its shadow on the wall), a long skylight
  down the ceiling, a line of warm light under every wall so the walls seem to
  float, and the doors' prism light. The floor is smooth honed stone: solid and
  matte, with no mirror reflections.
  A finishing pass adds glow on what emits light and a gentle vignette.
*/

export const ROOM = { W: 10, H: 4.2, eye: 1.6 };
export const SCREEN = { w: 1.76, h: 0.99, y: 1.62 };
const WORK_START = 4.2; // first side-wall screen, metres in from z = 0
const WORK_GAP = 3.2; // between screens along a side wall
const CENTRE_GAP = 3.4; // between the screens on the far wall
const FAR_SCALE = 1.35; // the far wall's two films hang larger, as the room's main pieces
const DOOR = { w: 1.15, h: 2.45, x: 1.35 };
const LABEL = { w: 0.34, h: 0.21 };

export type Pose = { x: number; z: number; yaw: number }; // yaw: 0 looks down the room (-z)
export type StopKind = "centre" | "work" | "doors";
export type Stop = Pose & { s: number; kind: StopKind; index: number };
export type Pick = { kind: "work" | "door"; index: number } | null;

type WorkSpot = {
  scale: number; // the far wall's films hang larger
  x: number;
  z: number;
  yaw: number;
  face: number;
  nx: number; // out of the wall, into the room
  nz: number;
  tx: number; // along the wall, to your right as you face it
  tz: number;
};

/* Vertical field of view for a window shape: taller windows see a little wider. */
// Tall screens get a wide lens, as in the art direction: the room wraps round you.
export const fovFor = (aspect: number) => (aspect < 0.6 ? 80 : aspect < 0.8 ? 72 : 50);

/*
  How far back from z = 0 you stand to see the whole room: far enough that
  the nearest film on each side wall is in view. Tall phone screens see less
  to the sides, so they stand much further back.
*/
export function overviewZ(aspect: number) {
  const tanH = Math.tan((fovFor(aspect) * Math.PI) / 180 / 2) * aspect;
  return Math.max(-2.6, -WORK_START + (ROOM.W / 2 + 0.25) / (tanH * 0.94));
}

/*
  Where everything goes, and the path the camera takes.

  Films hang on the three walls you face when you arrive: the left wall, the
  far wall and the right wall (two each for six). The doors are on the wall
  behind you, at z = front. The walk: the overview, the left wall (front to
  back), the far wall (left to right), the right wall (back to front), then
  you turn round to the doors.

  Viewing distances come from the real field of view, so a film and its
  label always fit the window, whatever its shape. On windows taller than
  wide the label hangs under the film instead of beside it.
*/
export function buildLayout(count: number, aspect: number, front: number) {
  const W = ROOM.W;
  const nLeft = Math.ceil(count / 3);
  const nCentre = Math.ceil((count - nLeft) / 2);
  const nRight = count - nLeft - nCentre;
  const sideN = Math.max(nLeft, nRight, 1);
  const D = Math.max(10.6, WORK_START + (sideN - 1) * WORK_GAP + 3.4);
  const vfov = (fovFor(aspect) * Math.PI) / 180;
  const tanV = Math.tan(vfov / 2);
  const tanH = tanV * aspect;
  const stacked = aspect < 1.1;

  // The film and its label, as seen from in front
  const rowW = stacked ? SCREEN.w : SCREEN.w + 0.14 + LABEL.w;
  const rowH = stacked ? SCREEN.h + 0.26 + LABEL.h : SCREEN.h;
  const fit = Math.max(rowW / (2 * tanH * 0.84), rowH / (2 * tanV * 0.6));
  const near = Math.min(fit, W - 2.2, D - 2.2); // how far you stand from a film
  const far = near; // glide straight to the viewing spot: no extra lean-in step
  // Far enough back from the doors to see both and their signs
  const doorDist = Math.min(front + 1, Math.max(4.6 / (2 * tanH * 0.9), 3.4 / (2 * tanV * 0.85)));

  const works: WorkSpot[] = [];
  for (let i = 0; i < nLeft; i++) {
    // Left wall, facing into the room (+x). Looking at it, your right is -z.
    const z = -(WORK_START + i * WORK_GAP);
    works.push({
      scale: 1,
      x: -W / 2,
      z,
      yaw: Math.PI / 2,
      face: Math.PI / 2,
      nx: 1,
      nz: 0,
      tx: 0,
      tz: -1,
    });
  }
  for (let i = 0; i < nCentre; i++) {
    // Far wall, facing you (+z), left to right.
    const x = (i - (nCentre - 1) / 2) * CENTRE_GAP;
    works.push({ scale: FAR_SCALE, x, z: -D, yaw: 0, face: 0, nx: 0, nz: 1, tx: 1, tz: 0 });
  }
  for (let i = nRight - 1; i >= 0; i--) {
    // Right wall, back to front, facing into the room (-x). Your right is +z.
    const z = -(WORK_START + i * WORK_GAP);
    works.push({
      scale: 1,
      x: W / 2,
      z,
      yaw: -Math.PI / 2,
      face: -Math.PI / 2,
      nx: -1,
      nz: 0,
      tx: 0,
      tz: 1,
    });
  }
  // With the label beside the film, stand centred on both.
  const along = stacked ? 0 : (LABEL.w + 0.14) / 2;
  const stops: Stop[] = [
    { x: 0, z: Math.min(front - 1, overviewZ(aspect)), yaw: 0, s: 0, kind: "centre", index: 0 },
    ...works.map((w, i) => ({
      // a larger film is viewed from further back, in proportion
      x: w.x + (w.nx * far + w.tx * along) * w.scale,
      z: w.z + (w.nz * far + w.tz * along) * w.scale,
      yaw: w.yaw,
      s: 0,
      kind: "work" as const,
      index: i,
    })),
    // Turn round: the doors are on the wall behind where you came in.
    { x: 0, z: front - doorDist, yaw: Math.PI, s: 0, kind: "doors", index: 0 },
  ];
  for (let i = 1; i < stops.length; i++) {
    const a = stops[i - 1];
    const b = stops[i];
    b.yaw = a.yaw + Math.atan2(Math.sin(b.yaw - a.yaw), Math.cos(b.yaw - a.yaw)); // turn the short way
    b.s = a.s + Math.max(0.9, Math.hypot(b.x - a.x, b.z - a.z) + Math.abs(b.yaw - a.yaw) * 1.6);
  }
  const span = stops[stops.length - 1].s / (stops.length - 1);
  return { W, D, near, far, works, stops, span, stacked, front };
}
export type Layout = ReturnType<typeof buildLayout>;

/* Ambient occlusion at half resolution: soft by nature, and a quarter of the cost. */
class HalfResAO extends GTAOPass {
  setSize(width: number, height: number) {
    super.setSize(Math.max(1, Math.round(width / 2)), Math.max(1, Math.round(height / 2)));
  }
  /* Glows (added light, sprites, lines) aren't solid: keep them out of the shadow pass. */
  _overrideVisibility() {
    const cache = (this as unknown as { _visibilityCache: THREE.Object3D[] })._visibilityCache;
    this.scene.traverse((o) => {
      const m = (o as THREE.Mesh).material;
      const glow =
        (o as THREE.Sprite).isSprite ||
        (o as THREE.Points).isPoints ||
        (o as THREE.Line).isLine ||
        (!!m && !Array.isArray(m) && m.blending === THREE.AdditiveBlending) ||
        o.layers.mask === 2; // seen-only things (glows, the journey's corridor)
      if (glow && o.visible) {
        o.visible = false;
        cache.push(o);
      }
    });
  }
}

/* Finishing: just a gentle vignette. (No grain or lens fringing: the room stays smooth.) */
const FilmShader = {
  uniforms: {
    tDiffuse: { value: null as THREE.Texture | null },
    uTime: { value: 0 },
    uRes: { value: new THREE.Vector2(1, 1) },
    uCA: { value: 0 }, // radial colour fringe (the journey only)
    uFlash: { value: 0 }, // white light out of the logo (the journey only)
  },
  vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
  fragmentShader: `
    uniform sampler2D tDiffuse; uniform float uCA; uniform float uFlash; varying vec2 vUv;
    void main(){
      vec2 d = vUv - 0.5;
      vec3 c;
      if (uCA > 0.0) {
        // a lens's lateral colour: red and blue pulled apart radially, none at the centre
        vec2 o = d * uCA * (0.3 + dot(d, d) * 4.0);
        c = vec3(texture2D(tDiffuse, vUv + o).r, texture2D(tDiffuse, vUv).g, texture2D(tDiffuse, vUv - o).b);
      } else {
        c = texture2D(tDiffuse, vUv).rgb;
      }
      c *= 1.0 - 0.3 * smoothstep(0.15, 0.75, dot(d, d) * 1.7);
      c = mix(c, vec3(2.0), uFlash);
      gl_FragColor = vec4(c, 1.0);
    }`,
};

/*
  A placeholder film until a project has a trailer or image: prism light
  moving through the dark like footage, breathing gently, with a progress
  bar, so it reads as a clip playing. Clean gradients only: no dust or grain.
*/
function placeholderMaterial(title: THREE.Texture, seed: number) {
  return new THREE.ShaderMaterial({
    uniforms: { uTime: { value: 0 }, uSeed: { value: seed }, uTitle: { value: title } },
    vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
    fragmentShader: `
      uniform float uTime; uniform float uSeed; uniform sampler2D uTitle; varying vec2 vUv;
      void main(){
        float t = uTime + uSeed * 7.3;
        // the light drifts like a slow camera move, and breathes a little
        float x = vUv.x - 0.5 - 0.11 * sin(t * 0.21) - 0.03 * sin(t * 0.57);
        float y = 1.0 - vUv.y;
        float flick = 0.94 + 0.06 * sin(t * 0.9);
        float w = exp(-pow(x / (0.05 + 0.015 * sin(t * 0.4)), 2.0)) * exp(-y * 1.9);
        float b = exp(-pow((x + 0.18 + 0.03 * sin(t * 0.5)) / 0.17, 2.0)) * exp(-y * 2.4);
        float o = exp(-pow((x - 0.18 - 0.03 * cos(t * 0.45)) / 0.17, 2.0)) * exp(-y * 2.4);
        vec3 c = vec3(0.012) + (vec3(1.0) * w * 0.9 + vec3(0.12, 0.17, 1.0) * b * 0.85 + vec3(1.0, 0.54, 0.12) * o * 0.85) * flick;
        // title
        vec4 tt = texture2D(uTitle, vUv);
        c = mix(c, vec3(1.0), tt.a * 0.92);
        // progress bar along the bottom, like a clip playing
        float prog = fract(t / 26.0);
        float bar = step(vUv.y, 0.012) * step(0.004, vUv.y);
        c = mix(c, vec3(0.32), bar * 0.8);
        c = mix(c, vec3(1.0), bar * step(vUv.x, prog) * 0.85);
        gl_FragColor = vec4(pow(max(c, 0.0), vec3(2.2)), 1.0);
      }`,
  });
}

type WorkMesh = {
  group: THREE.Group;
  video?: HTMLVideoElement;
  shader?: THREE.ShaderMaterial;
  screen: THREE.Mesh;
};

type DoorMesh = {
  left: THREE.Group;
  right: THREE.Group;
  lights: THREE.PointLight[];
  base: number[];
  gap: THREE.MeshBasicMaterial;
  spill: THREE.MeshBasicMaterial;
  signLit: THREE.MeshBasicMaterial;
  bar: THREE.Mesh;
  ang: number;
  lit: number;
};

export class GalleryScene {
  readonly renderer: THREE.WebGLRenderer;
  readonly camera: THREE.PerspectiveCamera;
  private scene = new THREE.Scene();
  private composer: EffectComposer;
  private bloom: UnrealBloomPass;
  private film: ShaderPass;
  private works: WorkMesh[] = [];
  private doors: DoorMesh[] = [];
  private pickables: THREE.Object3D[] = [];
  private disposables: { dispose: () => void }[] = [];
  private raycaster = new THREE.Raycaster();
  private hq: boolean;
  layout: Layout;
  private labels: THREE.Mesh[] = [];
  private count: number;
  readonly front: number; // z of the wall with the doors, behind where you arrive
  private reflector?: Reflector;
  private ao?: HalfResAO;
  private entranceParts: THREE.Object3D[] = []; // the wall behind you as you arrive
  private entranceShown = true;

  constructor(
    canvas: HTMLCanvasElement,
    opts: { projects: Project[]; aspect: number; hq: boolean },
  ) {
    this.hq = opts.hq;
    this.count = opts.projects.length;
    // Deep enough behind the overview spot to stand back and see the doors.
    this.front = Math.max(7.5, overviewZ(opts.aspect) + 4.5);
    this.layout = buildLayout(opts.projects.length, opts.aspect, this.front);
    const { W, D } = this.layout;
    const H = ROOM.H;

    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: false, // the composer's multisampled target does this
      powerPreference: "high-performance",
    });
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    // Neutral keeps white walls white (ACES greys them), as a camera would see them.
    renderer.toneMapping = THREE.NeutralToneMapping;
    renderer.toneMappingExposure = 1;
    renderer.shadowMap.enabled = this.hq;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.shadowMap.autoUpdate = false; // the room doesn't move: draw shadows once
    this.renderer = renderer;
    const aniso = renderer.capabilities.getMaxAnisotropy();

    this.camera = new THREE.PerspectiveCamera(50, 1, 0.05, 80);
    this.camera.rotation.order = "YXZ";
    this.camera.layers.enable(1); // lamp halos and beams: seen, but not reflected in the floor

    // Soft ambient light and reflections from a neutral studio environment
    const pmrem = new THREE.PMREMGenerator(renderer);
    const env = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    this.scene.environment = env;
    this.scene.environmentIntensity = 0.16;
    this.scene.background = new THREE.Color(0x15110e);
    pmrem.dispose();
    this.disposables.push(env);

    // An evening exhibition: a low warm fill; the spotlights and the skylight do the drama.
    const hemi = new THREE.HemisphereLight(0xffcf98, 0x3a2a1c, 0.55);
    this.scene.add(hemi);

    /* ---------- the room: smooth, seamless surfaces ---------- */

    const matte = (color: number, roughness = 0.96) => {
      const m = new THREE.MeshStandardMaterial({ color, roughness, metalness: 0 });
      this.disposables.push(m);
      return m;
    };
    const plane = (w: number, h: number, mat: THREE.Material) => {
      const g = new THREE.PlaneGeometry(w, h);
      this.disposables.push(g);
      const m = new THREE.Mesh(g, mat);
      m.receiveShadow = this.hq;
      return m;
    };

    /*
      Walls: left, right, far, and the door wall. The room runs from z = front
      back to -D. In the far corners, openings lead into a side gallery
      behind the far wall (BACK deep), so the space carries on.
    */
    const FRONT = this.front;
    const BACK = 7; // the passages behind the far wall run well back: open ways, not alcoves
    const OPEN = 1.0; // width of each opening
    const OPEN_H = 3.0;
    const len = D + FRONT; // the main room
    const mid = (FRONT - D) / 2;
    const allLen = len + BACK; // with the side gallery
    const allMid = (FRONT - D - BACK) / 2;
    const wallMat = matte(0xddc6a8, 0.9); // warm beige microcement
    microcement(wallMat);
    wallMat.emissive.set(0x1e130a); // the warm light the cove and skylight leave on the walls
    const left = plane(allLen, H, wallMat);
    left.position.set(-W / 2, H / 2, allMid);
    left.rotation.y = Math.PI / 2;
    const right = plane(allLen, H, wallMat);
    right.position.set(W / 2, H / 2, allMid);
    right.rotation.y = -Math.PI / 2;
    const entrance = plane(W, H, wallMat);
    entrance.position.set(0, H / 2, FRONT);
    entrance.rotation.y = Math.PI;
    const galleryBack = plane(W, H, wallMat);
    galleryBack.position.set(0, H / 2, -D - BACK);
    this.scene.add(left, right, entrance, galleryBack);
    this.entranceParts.push(entrance);
    // The far wall: solid in the middle, openings at both ends with a lintel over each
    const block = (bw: number, bh: number, x: number, y: number) => {
      const g = new THREE.BoxGeometry(bw, bh, 0.2);
      this.disposables.push(g);
      const m = new THREE.Mesh(g, wallMat);
      m.position.set(x, y, -D - 0.1);
      m.receiveShadow = this.hq;
      m.castShadow = this.hq;
      this.scene.add(m);
    };
    block(W - 2 * OPEN, H, 0, H / 2);
    for (const sx of [-1, 1]) block(OPEN, H - OPEN_H, sx * (W / 2 - OPEN / 2), (H + OPEN_H) / 2);

    // Ceiling: darker, warm grey
    const ceilMat = matte(0x8a7766, 0.95);
    ceilMat.emissive.set(0x3d2b1e); // warm light bouncing up off the lit walls
    const ceiling = plane(W, allLen, ceilMat);
    ceiling.position.set(0, H, allMid);
    ceiling.rotation.x = Math.PI / 2;
    this.scene.add(ceiling);

    // Dark polished stone, in large slabs (see marble.ts), with a soft reflection on capable devices
    const floorMat = marbleFloorMaterial({ dark: true });
    this.disposables.push(floorMat);
    const floor = plane(W, allLen, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.set(0, 0, allMid);
    const set: SetCtx = {
      scene: this.scene,
      keep: (...things) => this.disposables.push(...things),
      hq: this.hq,
    };
    if (this.hq) {
      this.reflector = addFloorReflection(set, W, allLen, allMid);
      floorMat.transparent = true;
      floorMat.opacity = 0.84; // mostly stone, with a soft sheen of the room in it
      floor.renderOrder = -1; // before the glows that lie on it
    }
    this.scene.add(floor);

    // The passages beyond the openings: lit, and running back out of sight
    const panelMat = new THREE.MeshBasicMaterial({
      color: new THREE.Color(0.95, 0.97, 1).multiplyScalar(2.4),
      toneMapped: false,
    });
    const panelGeo = new THREE.PlaneGeometry(0.5, 1.6);
    this.disposables.push(panelMat, panelGeo);
    for (const sx of [-1, 1]) {
      // a cool ceiling light, seen through the opening
      const panel = new THREE.Mesh(panelGeo, panelMat);
      panel.rotation.x = Math.PI / 2;
      panel.position.set(sx * (W / 2 - 0.55), H - 0.005, -D - 1.1);
      this.scene.add(panel);
      const l = new THREE.PointLight(0xffb36b, 10, 7, 2);
      l.position.set(sx * (W / 2 - 1.2), 2.9, -D - 2.4);
      this.scene.add(l);
      const deep = new THREE.PointLight(0xffb36b, 6, 6, 2);
      deep.position.set(sx * (W / 2 - 1.2), 2.9, -D - 5.2);
      this.scene.add(deep);
    }

    this.entranceParts.push(this.addFloatingWalls(W, D, FRONT, len, mid, OPEN, BACK));
    // Concealed cove light along the top of the room's walls: the architecture lights itself
    const coves = addCoveLighting(set, H, [
      { len, x: -W / 2, z: mid, ry: Math.PI / 2 },
      { len, x: W / 2, z: mid, ry: -Math.PI / 2 },
      { len: W - 2 * OPEN, x: 0, z: -D, ry: 0 },
      { len: W, x: 0, z: FRONT, ry: Math.PI },
    ]);
    this.entranceParts.push(coves[3]);
    this.addSkylight(H, len, mid);

    /* ---------- the screens ---------- */
    opts.projects.forEach((p, i) => this.addWork(p, i, aniso));
    this.placeLabels();

    /* ---------- the exhibition set ---------- */
    this.addExhibition(set, W, D, H, aniso);

    /* ---------- the doors, on the wall behind where you arrive ---------- */
    // Built as if on a wall facing +z, then turned round to face back into the room.
    const doorWall = new THREE.Group();
    doorWall.position.set(0, 0, this.front);
    doorWall.rotation.y = Math.PI;
    this.scene.add(doorWall);
    this.entranceParts.push(doorWall);
    [
      { label: "All work", x: -DOOR.x },
      { label: "About us", x: DOOR.x },
    ].forEach((d, i) => this.addDoor(d.label, d.x, doorWall, i, aniso));

    /* ---------- finishing ---------- */
    const target = new THREE.WebGLRenderTarget(1, 1, {
      type: THREE.HalfFloatType,
      samples: 4, // smooth edges (three.js runs on WebGL 2, which always supports this)
    });
    this.composer = new EffectComposer(renderer, target);
    this.composer.addPass(new RenderPass(this.scene, this.camera));
    if (this.hq) {
      // Soft contact shadows where surfaces meet (wall and floor, wall and
      // ceiling, behind each screen): what makes a room read as real.
      const ao = new HalfResAO(this.scene, this.camera, 512, 512);
      ao.blendIntensity = 0.7;
      ao.updateGtaoMaterial({
        radius: 0.45,
        distanceExponent: 1.5,
        thickness: 1.5,
        scale: 1,
        samples: 16,
      });
      ao.updatePdMaterial({
        lumaPhi: 10,
        depthPhi: 2,
        normalPhi: 3,
        radius: 6,
        rings: 2,
        samples: 16,
      });
      this.composer.addPass(ao);
      this.ao = ao;
    }
    // Glow only on what truly emits light: the skylight, the light lines, the doors.
    // Glow on what emits light, and a little on the brightest light falling on things, as a lens sees it
    this.bloom = new UnrealBloomPass(new THREE.Vector2(256, 256), 0.55, 0.6, 0.86);
    this.composer.addPass(this.bloom);
    this.film = new ShaderPass(FilmShader);
    this.composer.addPass(this.film);
    this.composer.addPass(new OutputPass());

    renderer.shadowMap.needsUpdate = true;
  }

  /*
    The evening exhibition around the films: framed landscapes and the title
    on the walls, the prism on its plinth, the bench, and the light on the walls
    that lights it all.
  */
  private addExhibition(set: SetCtx, W: number, D: number, H: number, aniso: number) {
    const v = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);
    // The far wall: the exhibition title, centred above its two films
    // (their tops are at ~2.3 m; the cove light begins ~3.4 m)
    const farN = v(0, 0, 1);
    addWallTitle(set, v(0, 2.93, -D), farN, aniso);

    // In each passage, a film on the outer wall, seen through the opening:
    // a glimpse of more work (not one of the stops)
    for (const sx of [-1, 1]) {
      const n = v(-sx, 0, 0);
      const at = v(sx * (W / 2 - 0.004), SCREEN.y, -D - 1.95);
      this.addGlimpseFilm(at, n, sx > 0 ? 7 : 8, aniso);
    }

    const prismAt = v(0, 0, -D + 3.6);
    const benchAt = v(0, 0, this.layout.stops[0].z - 4.4);

    // The prism on its plinth, out from the far wall between the films
    addPrismPlinth(set, prismAt, "/brand/mark-transparent.webp");

    // The bench, in front of where you arrive
    // Far enough ahead that it sits whole in the lower part of the view, legs and all
    addBench(set, benchAt);
  }

  /* A film playing in a passage: a glimpse of more work, seen from the room. */
  private glimpses: THREE.ShaderMaterial[] = [];
  private addGlimpseFilm(at: THREE.Vector3, normal: THREE.Vector3, seed: number, aniso: number) {
    const g = new THREE.Group();
    g.position.copy(at);
    g.lookAt(at.clone().add(normal));
    const bezelMat = new THREE.MeshStandardMaterial({
      color: 0x0b0b0c,
      roughness: 0.38,
      metalness: 0.25,
    });
    const bezelGeo = new THREE.BoxGeometry(SCREEN.w + 0.07, SCREEN.h + 0.07, 0.045);
    const scrGeo = new THREE.PlaneGeometry(SCREEN.w, SCREEN.h);
    const title = textTexture(
      (ctx, cw, ch) => {
        ctx.clearRect(0, 0, cw, ch);
        ctx.fillStyle = "#fff";
        ctx.font = "500 30px Jost, ui-sans-serif, system-ui";
        let x = 54;
        for (const chr of "SAMPLE FILM") {
          ctx.fillText(chr, x, ch - 52);
          x += ctx.measureText(chr).width + 9;
        }
      },
      1600,
      900,
      aniso,
    );
    const mat = placeholderMaterial(title, seed);
    this.disposables.push(bezelMat, bezelGeo, scrGeo, title, mat);
    const bezel = new THREE.Mesh(bezelGeo, bezelMat);
    bezel.position.z = 0.0225;
    const screen = new THREE.Mesh(scrGeo, mat);
    screen.position.z = 0.0455;
    g.add(bezel, screen);
    this.scene.add(g);
    this.glimpses.push(mat);
  }

  /*
    Floating walls: a fine line of warm light along the foot of every wall,
    washing softly up it, so the walls seem to hover just above the floor.
  */
  private addFloatingWalls(
    W: number,
    D: number,
    front: number,
    len: number,
    mid: number,
    open: number,
    back: number,
  ) {
    const lineMat = new THREE.MeshBasicMaterial({
      color: new THREE.Color(1, 0.88, 0.7).multiplyScalar(1.7),
    });
    const washTex = wallWashTexture();
    const washMat = new THREE.MeshBasicMaterial({
      map: washTex,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      opacity: 0.32,
    });
    this.disposables.push(lineMat, washTex, washMat);
    const walls = [
      { len, x: -W / 2, z: mid, ry: Math.PI / 2 },
      { len, x: W / 2, z: mid, ry: -Math.PI / 2 },
      { len: W - 2 * open, x: 0, z: -D, ry: 0 }, // the far wall, between its openings
      { len: W, x: 0, z: -D - back, ry: 0 }, // the side gallery's back wall
      { len: W, x: 0, z: front, ry: Math.PI },
    ];
    let entrance!: THREE.Group;
    walls.forEach((w, i) => {
      const g = new THREE.Group();
      if (i === walls.length - 1) entrance = g;
      g.position.set(w.x, 0, w.z);
      g.rotation.y = w.ry;
      const lineGeo = new THREE.BoxGeometry(w.len, 0.012, 0.012);
      const washGeo = new THREE.PlaneGeometry(w.len, 0.75);
      this.disposables.push(lineGeo, washGeo);
      const line = new THREE.Mesh(lineGeo, lineMat);
      line.position.set(0, 0.03, 0.03);
      const wash = new THREE.Mesh(washGeo, washMat);
      wash.position.set(0, 0.375, 0.006);
      g.add(line, wash);
      this.scene.add(g);
    });
    return entrance;
  }

  /*
    A long skylight down the middle of the ceiling: a softly glowing panel in a
    shallow recess, lighting the room like daylight through a diffuser.
  */
  private addSkylight(H: number, len: number, mid: number) {
    RectAreaLightUniformsLib.init();
    const w = 3.2; // a large recessed luminous panel
    const l = len - 2.4;
    const tex = skylightTexture();
    const panelMat = new THREE.MeshBasicMaterial({
      map: tex,
      color: new THREE.Color(1, 0.95, 0.88).multiplyScalar(0.82), // warm white, never glaring
    });
    const geo = new THREE.PlaneGeometry(w, l);
    this.disposables.push(tex, panelMat, geo);
    const panel = new THREE.Mesh(geo, panelMat);
    panel.rotation.x = Math.PI / 2;
    panel.position.set(0, H - 0.13, mid);
    this.scene.add(panel);
    // The recess around it: four shallow white sides
    const sideMat = new THREE.MeshStandardMaterial({ color: 0xf4f2ee, roughness: 0.95 });
    this.disposables.push(sideMat);
    const box = (bw: number, bd: number, x: number, z: number) => {
      const g = new THREE.BoxGeometry(bw, 0.13, bd);
      this.disposables.push(g);
      const m = new THREE.Mesh(g, sideMat);
      m.position.set(x, H - 0.065, z);
      this.scene.add(m);
    };
    box(0.02, l, -w / 2, mid);
    box(0.02, l, w / 2, mid);
    box(w, 0.02, 0, mid - l / 2);
    box(w, 0.02, 0, mid + l / 2);
    const light = new THREE.RectAreaLight(0xf2f4ff, this.hq ? 2.2 : 2, w, l); // cool, against the warm spots
    light.position.set(0, H - 0.14, mid);
    light.lookAt(0, 0, mid);
    this.scene.add(light);
  }

  private addWork(p: Project, i: number, aniso: number) {
    const spot = this.layout.works[i];
    const group = new THREE.Group();
    group.position.set(spot.x + spot.nx * 0.004, SCREEN.y, spot.z + spot.nz * 0.004);
    group.rotation.y = spot.face;
    group.scale.setScalar(spot.scale);
    this.scene.add(group);

    // Bezel
    const bezelMat = new THREE.MeshStandardMaterial({
      color: 0x0b0b0c,
      roughness: 0.38,
      metalness: 0.25,
    });
    const bezelGeo = new THREE.BoxGeometry(SCREEN.w + 0.07, SCREEN.h + 0.07, 0.045);
    this.disposables.push(bezelMat, bezelGeo);
    const bezel = new THREE.Mesh(bezelGeo, bezelMat);
    bezel.position.z = 0.0225;
    bezel.castShadow = this.hq;
    group.add(bezel);

    // The picture: a trailer, a still, or the placeholder film
    const scrGeo = new THREE.PlaneGeometry(SCREEN.w, SCREEN.h);
    this.disposables.push(scrGeo);
    let mat: THREE.Material;
    const w: WorkMesh = { group, screen: undefined as unknown as THREE.Mesh };
    if (p.trailer) {
      const v = document.createElement("video");
      v.src = p.trailer;
      v.muted = true;
      v.loop = true;
      v.playsInline = true;
      v.crossOrigin = "anonymous";
      v.preload = "none";
      if (p.image) v.poster = p.image;
      const tex = new THREE.VideoTexture(v);
      tex.colorSpace = THREE.SRGBColorSpace;
      mat = new THREE.MeshBasicMaterial({ map: tex, toneMapped: false });
      w.video = v;
      this.disposables.push(tex);
    } else if (p.image) {
      const tex = new THREE.TextureLoader().load(p.image);
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.anisotropy = aniso;
      mat = new THREE.MeshBasicMaterial({ map: tex, toneMapped: false });
      this.disposables.push(tex);
    } else {
      const title = textTexture(
        (ctx, cw, ch) => {
          ctx.clearRect(0, 0, cw, ch);
          ctx.fillStyle = "#fff";
          ctx.font = "500 30px Jost, ui-sans-serif, system-ui";
          const text = p.title.toUpperCase();
          let x = 54;
          for (const chr of text) {
            ctx.fillText(chr, x, ch - 52);
            x += ctx.measureText(chr).width + 9;
          }
        },
        1600,
        900,
        aniso,
      );
      const sm = placeholderMaterial(title, i + 1);
      mat = sm;
      w.shader = sm;
      this.disposables.push(title);
    }
    this.disposables.push(mat);
    const screen = new THREE.Mesh(scrGeo, mat);
    screen.position.z = 0.0455;
    group.add(screen);
    w.screen = screen;

    // Glass: adds only reflections on top of the picture
    // A soft, broad sheen rather than mirror-sharp reflections, which read as
    // lines across the picture.
    const glassMat = new THREE.MeshStandardMaterial({
      color: 0x000000,
      roughness: 0.42,
      metalness: 0,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      envMapIntensity: 0.5,
      opacity: 0.6,
    });
    this.disposables.push(glassMat);
    const glass = new THREE.Mesh(scrGeo, glassMat);
    glass.position.z = 0.0465;
    group.add(glass);

    // Museum label
    const label = textTexture(
      (ctx, cw, ch) => {
        ctx.fillStyle = "#fbfaf7";
        ctx.fillRect(0, 0, cw, ch);
        ctx.fillStyle = "#121212";
        ctx.font = "500 74px Jost, ui-sans-serif, system-ui";
        ctx.fillText(p.title, 70, 150, cw - 140);
        ctx.fillStyle = "#6f6f6f";
        ctx.font = "400 46px Jost, ui-sans-serif, system-ui";
        ctx.fillText(`${p.year}${p.client ? `, for ${p.client}` : ""}`, 70, 230, cw - 140);
        ctx.fillStyle = "#9a9a9a";
        ctx.font = "400 40px Jost, ui-sans-serif, system-ui";
        ctx.fillText(p.tags.join(", "), 70, ch - 90, cw - 140);
      },
      1024,
      634,
      aniso,
    );
    const labelFront = new THREE.MeshStandardMaterial({ map: label, roughness: 0.85 });
    const labelSide = new THREE.MeshStandardMaterial({ color: 0xe9e6df, roughness: 0.9 });
    const labelGeo = new THREE.BoxGeometry(LABEL.w, LABEL.h, 0.006);
    this.disposables.push(label, labelFront, labelSide, labelGeo);
    const lab = new THREE.Mesh(labelGeo, [
      labelSide,
      labelSide,
      labelSide,
      labelSide,
      labelFront,
      labelSide,
    ]);
    this.labels.push(lab);
    lab.castShadow = this.hq;
    group.add(lab);

    [bezel, screen, glass, lab].forEach((m) => {
      m.userData.pick = { kind: "work", index: i };
      this.pickables.push(m);
    });

    this.works.push(w);
  }

  private addDoor(text: string, x: number, parent: THREE.Object3D, i: number, aniso: number) {
    const z = 0; // the wall's surface, in the door wall's own space
    const { w, h } = DOOR;

    // The light in the doorway
    const gapTex = doorLightTexture();
    const gapMat = new THREE.MeshBasicMaterial({
      map: gapTex,
      color: new THREE.Color(1, 1, 1).multiplyScalar(1.6),
      toneMapped: false,
    });
    const gapGeo = new THREE.PlaneGeometry(w, h);
    this.disposables.push(gapTex, gapMat, gapGeo);
    const gap = new THREE.Mesh(gapGeo, gapMat);
    gap.position.set(x, h / 2, z + 0.004);
    parent.add(gap);

    // Black frame around the opening
    const frameMat = new THREE.MeshStandardMaterial({
      color: 0x0f0f10,
      roughness: 0.5,
      metalness: 0.2,
    });
    this.disposables.push(frameMat);
    const bar = (bw: number, bh: number, bx: number, by: number) => {
      const g = new THREE.BoxGeometry(bw, bh, 0.07);
      this.disposables.push(g);
      const m = new THREE.Mesh(g, frameMat);
      m.position.set(bx, by, z + 0.035);
      m.castShadow = this.hq;
      parent.add(m);
    };
    bar(w + 0.16, 0.08, x, h + 0.04);
    bar(0.08, h, x - w / 2 - 0.04, h / 2);
    bar(0.08, h, x + w / 2 + 0.04, h / 2);

    // Two leaves, hinged on the outer edges, the logo's light on their top inner corners
    const leaf = (side: "left" | "right") => {
      const tex = leafTextures(side);
      const front = new THREE.MeshStandardMaterial({
        map: tex.map,
        emissive: 0xffffff,
        emissiveMap: tex.glow,
        emissiveIntensity: 1.1,
        roughness: 0.55,
        metalness: 0.1,
      });
      const sideMat = new THREE.MeshStandardMaterial({ color: 0x0c0c0d, roughness: 0.55 });
      const geo = new THREE.BoxGeometry(w / 2 - 0.004, h - 0.01, 0.04);
      this.disposables.push(tex.map, tex.glow, front, sideMat, geo);
      const m = new THREE.Mesh(geo, [sideMat, sideMat, sideMat, sideMat, front, sideMat]);
      const pivot = new THREE.Group();
      const sgn = side === "left" ? 1 : -1;
      pivot.position.set(x - (sgn * w) / 2, 0, z + 0.025);
      m.position.set((sgn * w) / 4, h / 2, 0);
      pivot.add(m);
      // Handle
      const hg = new THREE.BoxGeometry(0.018, 0.6, 0.03);
      const hm = new THREE.MeshStandardMaterial({
        color: 0xd8d8d8,
        metalness: 0.9,
        roughness: 0.22,
      });
      this.disposables.push(hg, hm);
      const handle = new THREE.Mesh(hg, hm);
      handle.position.set(sgn * (w / 2 - 0.09), 1.12, 0.04);
      pivot.add(handle);
      m.userData.pick = { kind: "door", index: i };
      this.pickables.push(m);
      parent.add(pivot);
      return pivot;
    };
    const leftLeaf = leaf("left");
    const rightLeaf = leaf("right");

    // Light leaking through where the leaves meet
    const seamMat = new THREE.MeshBasicMaterial({
      color: new THREE.Color(1, 1, 1).multiplyScalar(2),
      toneMapped: false,
    });
    const seamGeo = new THREE.PlaneGeometry(0.012, h - 0.02);
    this.disposables.push(seamMat, seamGeo);
    const seam = new THREE.Mesh(seamGeo, seamMat);
    seam.position.set(x, h / 2, z + 0.047);
    parent.add(seam);

    // Prism light spilling into the room: blue left, orange right, white in front
    const lights = this.hq
      ? [
          new THREE.PointLight(0x3a55ff, 2.6, 5.5, 2),
          new THREE.PointLight(0xff8a2a, 2.6, 5.5, 2),
          new THREE.PointLight(0xfff8ee, 1.6, 5.5, 2),
        ]
      : [new THREE.PointLight(0xfff8ee, 2, 5.5, 2)];
    if (this.hq) {
      // Far enough from the wall that their light spreads into a soft wash, not a hot spot
      lights[0].position.set(x - 0.45, 2.25, z + 1.15);
      lights[1].position.set(x + 0.45, 2.25, z + 1.15);
      lights[2].position.set(x, 1.1, z + 0.8);
    } else {
      lights[0].position.set(x, 1.3, z + 0.8);
    }
    lights.forEach((l) => parent.add(l));

    // A pool of prism light on the floor in front
    const spillTex = poolTexture([
      [0, "rgba(255,255,255,0.9)"],
      [0.35, "rgba(200,215,255,0.35)"],
      [1, "rgba(0,0,0,0)"],
    ]);
    const spillMat = new THREE.MeshBasicMaterial({
      map: spillTex,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      opacity: 0.25,
    });
    const spillGeo = new THREE.PlaneGeometry(2.6, 2.6);
    this.disposables.push(spillTex, spillMat, spillGeo);
    const spill = new THREE.Mesh(spillGeo, spillMat);
    spill.rotation.x = -Math.PI / 2;
    spill.position.set(x, 0.004, z + 1.05);
    parent.add(spill);

    // The sign above: pale until you arrive, then dark with the light-beam underline
    const sign = (lit: boolean) =>
      textTexture(
        (ctx, cw, ch) => {
          ctx.clearRect(0, 0, cw, ch);
          ctx.fillStyle = lit ? "#0a0a0a" : "rgba(10,10,10,0.25)";
          ctx.font = "500 190px Jost, ui-sans-serif, system-ui";
          ctx.textAlign = "center";
          ctx.fillText(text, cw / 2, ch - 70);
        },
        1400,
        320,
        aniso,
      );
    const dimTex = sign(false);
    const litTex = sign(true);
    const signGeo = new THREE.PlaneGeometry(1.5, 1.5 * (320 / 1400));
    const dimMat = new THREE.MeshBasicMaterial({
      map: dimTex,
      transparent: true,
      toneMapped: false,
    });
    const litMat = new THREE.MeshBasicMaterial({
      map: litTex,
      transparent: true,
      opacity: 0,
      toneMapped: false,
    });
    this.disposables.push(dimTex, litTex, signGeo, dimMat, litMat);
    const signDim = new THREE.Mesh(signGeo, dimMat);
    const signLit = new THREE.Mesh(signGeo, litMat);
    signDim.position.set(x, h + 0.42, z + 0.006);
    signLit.position.set(x, h + 0.42, z + 0.007);
    signDim.userData.pick = { kind: "door", index: i };
    this.pickables.push(signDim);
    parent.add(signDim, signLit);
    // Underline: drawn from the left, so scale it from its left end
    const barTex = textTexture(
      (ctx, cw, ch) => {
        const g = ctx.createLinearGradient(0, 0, cw, 0);
        g.addColorStop(0, "#1f2cff");
        g.addColorStop(0.3, "#2bb8ff");
        g.addColorStop(0.5, "#ffffff");
        g.addColorStop(0.72, "#ff8a1f");
        g.addColorStop(1, "#ff3d1f");
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, cw, ch);
      },
      512,
      8,
      aniso,
    );
    const barGeo = new THREE.PlaneGeometry(0.62, 0.018);
    barGeo.translate(0.31, 0, 0);
    const barMat = new THREE.MeshBasicMaterial({ map: barTex, toneMapped: false });
    this.disposables.push(barTex, barGeo, barMat);
    const underline = new THREE.Mesh(barGeo, barMat);
    underline.position.set(x - 0.31, h + 0.28, z + 0.008);
    underline.scale.x = 0.0001;
    parent.add(underline);

    this.doors.push({
      left: leftLeaf,
      right: rightLeaf,
      lights,
      base: lights.map((l) => l.intensity),
      gap: gapMat,
      spill: spillMat,
      signLit: litMat,
      bar: underline,
      ang: 0,
      lit: 0,
    });
  }

  /* ---------- per-frame controls ---------- */

  /* Labels beside the screens on wide windows, underneath on tall ones. */
  private placeLabels() {
    this.labels.forEach((lab) => {
      if (this.layout.stacked)
        lab.position.set(-SCREEN.w / 2 + LABEL.w / 2, -SCREEN.h / 2 - 0.26, 0.003);
      else lab.position.set(SCREEN.w / 2 + 0.14 + LABEL.w / 2, -0.28, 0.003);
    });
    if (this.hq) this.renderer.shadowMap.needsUpdate = true;
  }

  setSize(w: number, h: number) {
    // Re-fit the viewing distances (and label placement) to the window's shape.
    this.layout = buildLayout(this.count, w / h, this.front);
    this.placeLabels();
    const dpr = Math.min(window.devicePixelRatio || 1, this.hq ? 2 : 1.75);
    this.renderer.setPixelRatio(dpr);
    this.renderer.setSize(w, h, false);
    this.composer.setPixelRatio(dpr);
    this.composer.setSize(w, h);
    this.bloom.resolution.set((w * dpr) / 2, (h * dpr) / 2);
    this.film.uniforms.uRes.value.set(w * dpr, h * dpr);
    if (this.reflector) sizeFloorReflection(this.reflector, w * dpr, h * dpr);
    this.camera.aspect = w / h;
    // Taller-than-wide screens get a wider view so the screens still fit
    this.camera.fov = fovFor(w / h);
    this.camera.updateProjectionMatrix();
  }

  setPose(x: number, y: number, z: number, yaw: number, pitch = 0) {
    this.camera.position.set(x, y, z);
    this.camera.rotation.set(pitch, yaw, 0);
  }

  /* ---------- the journey in (see PrismTunnel.ts) ---------- */

  /* The corridor is built in this room's own scene: one renderer, one camera, one exposure. */
  addJourney(o: THREE.Object3D) {
    this.scene.add(o);
  }

  get environment() {
    return this.scene.environment;
  }

  /* The gallery's own lens for this window's shape: where the journey's lens ends. */
  galleryFov() {
    return fovFor(this.camera.aspect);
  }

  /* The entrance wall (and its doors) stands aside while you come through it. */
  showEntrance(on: boolean) {
    if (on === this.entranceShown) return;
    this.entranceShown = on;
    this.entranceParts.forEach((o) => (o.visible = on));
  }

  /*
    Post-processing during the journey, blended back to the gallery's own as
    you arrive (null: the gallery's own). bloom 1 = the corridor's selective
    bloom (only light sources: a higher threshold, more strength); ao 0..1
    fades the room's contact shadows in for the arrival.
  */
  setJourneyPost(p: { flash: number; ca: number; bloom: number; ao: number } | null) {
    const b = p?.bloom ?? 0;
    this.bloom.strength = 0.55 + 0.4 * b;
    this.bloom.threshold = 0.86 + 0.24 * b;
    this.bloom.radius = 0.6 + 0.15 * b;
    this.film.uniforms.uCA.value = p?.ca ?? 0;
    this.film.uniforms.uFlash.value = p?.flash ?? 0;
    if (this.ao) {
      const a = p ? p.ao : 1;
      this.ao.enabled = a > 0.01;
      this.ao.blendIntensity = 0.7 * a;
    }
  }

  setExposure(e: number) {
    this.renderer.toneMappingExposure = e;
  }

  /* Open a door to `ang` degrees; `lit` 0..1 lights its sign. */
  setDoor(i: number, ang: number, lit: number) {
    const d = this.doors[i];
    if (!d) return;
    d.ang = ang;
    d.lit = lit;
    const r = THREE.MathUtils.degToRad(ang);
    d.left.rotation.y = -r; // swing out towards you
    d.right.rotation.y = r;
    const open = THREE.MathUtils.smoothstep(ang, 0, 30);
    d.lights.forEach((l, k) => (l.intensity = d.base[k] * (0.55 + 0.9 * open)));
    d.gap.color.setScalar(1.6 + open * 1.2);
    d.spill.opacity = 0.18 + open * 0.5;
    d.signLit.opacity = lit;
    d.bar.scale.x = Math.max(0.0001, lit);
  }

  /* Play only the films near the stop you're at. */
  playNear(stopIndex: number) {
    const stops = this.layout.stops;
    this.works.forEach((w, i) => {
      if (!w.video) return;
      const k = stops.findIndex((s) => s.kind === "work" && s.index === i);
      // From the overview every film is in view, so they all play.
      const atCentre = stops[stopIndex]?.kind === "centre";
      const near = stopIndex >= 0 && (Math.abs(k - stopIndex) <= 1 || atCentre);
      if (near && w.video.paused) w.video.play().catch(() => {});
      else if (!near && !w.video.paused) w.video.pause();
    });
  }

  /* What's under a point on the screen (CSS pixels). */
  pick(x: number, y: number, rect: DOMRect): Pick {
    const ndc = new THREE.Vector2(
      ((x - rect.left) / rect.width) * 2 - 1,
      -((y - rect.top) / rect.height) * 2 + 1,
    );
    this.raycaster.setFromCamera(ndc, this.camera);
    const hit = this.raycaster.intersectObjects(this.pickables, false)[0];
    return (hit?.object.userData.pick as Pick) ?? null;
  }

  /* Where work i's screen is on the page right now (CSS pixels), for the film to fly from. */
  screenRect(i: number, rect: DOMRect) {
    const w = this.works[i];
    this.camera.updateMatrixWorld();
    w.screen.updateWorldMatrix(true, false);
    const xs: number[] = [];
    const ys: number[] = [];
    for (const [cx, cy] of [
      [-1, -1],
      [1, -1],
      [1, 1],
      [-1, 1],
    ]) {
      const v = new THREE.Vector3((cx * SCREEN.w) / 2, (cy * SCREEN.h) / 2, 0)
        .applyMatrix4(w.screen.matrixWorld)
        .project(this.camera);
      xs.push(rect.left + ((v.x + 1) / 2) * rect.width);
      ys.push(rect.top + ((1 - v.y) / 2) * rect.height);
    }
    const l = Math.min(...xs);
    const t = Math.min(...ys);
    return new DOMRect(l, t, Math.max(...xs) - l, Math.max(...ys) - t);
  }

  /* Where a work's screen centre is, to walk up to it. */
  workCentre(i: number) {
    const s = this.layout.works[i];
    return {
      x: s.x + s.nx * 0.05,
      z: s.z + s.nz * 0.05,
      yaw: s.yaw,
      nx: s.nx,
      nz: s.nz,
      scale: s.scale,
    };
  }

  /* Where door i is in the room (the door wall is turned round, so x flips). */
  doorX(i: number) {
    return i === 0 ? DOOR.x : -DOOR.x;
  }

  render(time: number) {
    this.works.forEach((w) => {
      if (w.shader) w.shader.uniforms.uTime.value = time;
    });
    this.glimpses.forEach((m) => (m.uniforms.uTime.value = time));
    this.film.uniforms.uTime.value = time;
    this.composer.render();
  }

  dispose() {
    this.works.forEach((w) => {
      if (w.video) {
        w.video.pause();
        w.video.removeAttribute("src");
        w.video.load();
      }
    });
    this.disposables.forEach((d) => d.dispose());
    this.composer.dispose();
    this.renderer.dispose();
  }
}
