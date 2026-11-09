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
const DOOR = { w: 1.15, h: 2.45, x: 1.35 };
const LABEL = { w: 0.34, h: 0.21 };

export type Pose = { x: number; z: number; yaw: number }; // yaw: 0 looks down the room (-z)
export type StopKind = "centre" | "work" | "doors";
export type Stop = Pose & { s: number; kind: StopKind; index: number };
export type Pick = { kind: "work" | "door"; index: number } | null;

type WorkSpot = {
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
export const fovFor = (aspect: number) => (aspect < 0.8 ? 62 : 50);

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
    works.push({ x: -W / 2, z, yaw: Math.PI / 2, face: Math.PI / 2, nx: 1, nz: 0, tx: 0, tz: -1 });
  }
  for (let i = 0; i < nCentre; i++) {
    // Far wall, facing you (+z), left to right.
    const x = (i - (nCentre - 1) / 2) * CENTRE_GAP;
    works.push({ x, z: -D, yaw: 0, face: 0, nx: 0, nz: 1, tx: 1, tz: 0 });
  }
  for (let i = nRight - 1; i >= 0; i--) {
    // Right wall, back to front, facing into the room (-x). Your right is +z.
    const z = -(WORK_START + i * WORK_GAP);
    works.push({ x: W / 2, z, yaw: -Math.PI / 2, face: -Math.PI / 2, nx: -1, nz: 0, tx: 0, tz: 1 });
  }
  // With the label beside the film, stand centred on both.
  const along = stacked ? 0 : (LABEL.w + 0.14) / 2;
  const stops: Stop[] = [
    { x: 0, z: Math.min(front - 1, overviewZ(aspect)), yaw: 0, s: 0, kind: "centre", index: 0 },
    ...works.map((w, i) => ({
      x: w.x + w.nx * far + w.tx * along,
      z: w.z + w.nz * far + w.tz * along,
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
}

/* Finishing: just a gentle vignette. (No grain or lens fringing: the room stays smooth.) */
const FilmShader = {
  uniforms: {
    tDiffuse: { value: null as THREE.Texture | null },
    uTime: { value: 0 },
    uRes: { value: new THREE.Vector2(1, 1) },
  },
  vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
  fragmentShader: `
    uniform sampler2D tDiffuse; varying vec2 vUv;
    void main(){
      vec2 d = vUv - 0.5;
      vec3 c = texture2D(tDiffuse, vUv).rgb;
      c *= 1.0 - 0.2 * smoothstep(0.18, 0.75, dot(d, d) * 1.7);
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

    // Soft ambient light and reflections from a neutral studio environment
    const pmrem = new THREE.PMREMGenerator(renderer);
    const env = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    this.scene.environment = env;
    this.scene.environmentIntensity = 0.32;
    this.scene.background = new THREE.Color(0xf2f0ec);
    pmrem.dispose();
    this.disposables.push(env);

    // A soft fill only: the spotlights and the skylight do the drama.
    const hemi = new THREE.HemisphereLight(0xfffaf2, 0xd9d3c9, 0.62);
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

    // Walls: left, right, far, and the door wall. The room runs from z = front back to -D.
    const FRONT = this.front;
    const len = D + FRONT;
    const mid = (FRONT - D) / 2;
    const wallCol = 0xf2eee7; // warm gallery white
    const left = plane(len, H, matte(wallCol));
    left.position.set(-W / 2, H / 2, mid);
    left.rotation.y = Math.PI / 2;
    const right = plane(len, H, matte(wallCol));
    right.position.set(W / 2, H / 2, mid);
    right.rotation.y = -Math.PI / 2;
    const back = plane(W, H, matte(wallCol));
    back.position.set(0, H / 2, -D);
    const entrance = plane(W, H, matte(wallCol));
    entrance.position.set(0, H / 2, FRONT);
    entrance.rotation.y = Math.PI;
    this.scene.add(left, right, back, entrance);

    // Ceiling
    // Lit by light bouncing up off the walls and floor, as a real ceiling is
    const ceilMat = matte(0xf6f4f0, 0.98);
    ceilMat.emissive.set(0x4a4843);
    const ceiling = plane(W, len, ceilMat);
    ceiling.position.set(0, H, mid);
    ceiling.rotation.x = Math.PI / 2;
    this.scene.add(ceiling);

    // Large polished marble slabs (see marble.ts)
    const floorMat = marbleFloorMaterial();
    this.disposables.push(floorMat);
    const floor = plane(W, len, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.set(0, 0, mid);
    this.scene.add(floor);

    this.addFloatingWalls(W, D, FRONT, len, mid);
    this.addSkylight(H, len, mid);

    /* ---------- the screens ---------- */
    opts.projects.forEach((p, i) => this.addWork(p, i, aniso));
    this.placeLabels();

    /* ---------- the doors, on the wall behind where you arrive ---------- */
    // Built as if on a wall facing +z, then turned round to face back into the room.
    const doorWall = new THREE.Group();
    doorWall.position.set(0, 0, this.front);
    doorWall.rotation.y = Math.PI;
    this.scene.add(doorWall);
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
    }
    // Glow only on what truly emits light: the skylight, the light lines, the doors.
    this.bloom = new UnrealBloomPass(new THREE.Vector2(256, 256), 0.38, 0.55, 0.93);
    this.composer.addPass(this.bloom);
    this.film = new ShaderPass(FilmShader);
    this.composer.addPass(this.film);
    this.composer.addPass(new OutputPass());

    renderer.shadowMap.needsUpdate = true;
  }

  /*
    Floating walls: a fine line of warm light along the foot of every wall,
    washing softly up it, so the walls seem to hover just above the floor.
  */
  private addFloatingWalls(W: number, D: number, front: number, len: number, mid: number) {
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
      { len: W, x: 0, z: -D, ry: 0 },
      { len: W, x: 0, z: front, ry: Math.PI },
    ];
    walls.forEach((w) => {
      const g = new THREE.Group();
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
  }

  /*
    A long skylight down the middle of the ceiling: a softly glowing panel in a
    shallow recess, lighting the room like daylight through a diffuser.
  */
  private addSkylight(H: number, len: number, mid: number) {
    RectAreaLightUniformsLib.init();
    const w = 1.7;
    const l = len - 2.4;
    const tex = skylightTexture();
    const panelMat = new THREE.MeshBasicMaterial({
      map: tex,
      color: new THREE.Color(1, 0.985, 0.96).multiplyScalar(1.05),
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
    const light = new THREE.RectAreaLight(0xfff8ef, this.hq ? 3.4 : 3, w, l);
    light.position.set(0, H - 0.14, mid);
    light.lookAt(0, 0, mid);
    this.scene.add(light);
  }

  /* A small recessed light in the ceiling: just a glowing disc, no fittings. */
  private addDownlight(at: THREE.Vector3) {
    if (!this.downGeo) {
      this.downGeo = new THREE.CircleGeometry(0.055, 32);
      this.downMat = new THREE.MeshBasicMaterial({
        color: new THREE.Color(1, 0.95, 0.85).multiplyScalar(3),
      });
      this.disposables.push(this.downGeo, this.downMat);
    }
    const d = new THREE.Mesh(this.downGeo, this.downMat);
    d.rotation.x = Math.PI / 2;
    d.position.set(at.x, at.y - 0.002, at.z);
    this.scene.add(d);
  }
  private downGeo?: THREE.CircleGeometry;
  private downMat?: THREE.MeshBasicMaterial;

  private addWork(p: Project, i: number, aniso: number) {
    const spot = this.layout.works[i];
    const group = new THREE.Group();
    group.position.set(spot.x + spot.nx * 0.004, SCREEN.y, spot.z + spot.nz * 0.004);
    group.rotation.y = spot.face;
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

    // The spotlight on it, from a head on the ceiling track
    const H = ROOM.H;
    const head = new THREE.Vector3(spot.x + spot.nx * 1.55, H - 0.01, spot.z + spot.nz * 1.55);
    const sl = new THREE.SpotLight(0xffe9cc, this.hq ? 19 : 15, 0, 0.3, 0.75, 2);
    sl.position.copy(head);
    sl.target.position.set(spot.x, SCREEN.y + 0.05, spot.z);
    if (this.hq) {
      sl.castShadow = true;
      sl.shadow.mapSize.set(1024, 1024);
      sl.shadow.bias = -0.0004;
      sl.shadow.normalBias = 0.02;
      sl.shadow.camera.near = 0.3;
      sl.shadow.camera.far = 6;
    }
    this.scene.add(sl, sl.target);
    this.addDownlight(new THREE.Vector3(head.x, H, head.z));

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
    this.camera.aspect = w / h;
    // Taller-than-wide screens get a wider view so the screens still fit
    this.camera.fov = fovFor(w / h);
    this.camera.updateProjectionMatrix();
  }

  setPose(x: number, y: number, z: number, yaw: number, pitch = 0) {
    this.camera.position.set(x, y, z);
    this.camera.rotation.set(pitch, yaw, 0);
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

  /* Where a work's screen centre is, to walk up to it. */
  workCentre(i: number) {
    const s = this.layout.works[i];
    return { x: s.x + s.nx * 0.05, z: s.z + s.nz * 0.05, yaw: s.yaw, nx: s.nx, nz: s.nz };
  }

  /* Where door i is in the room (the door wall is turned round, so x flips). */
  doorX(i: number) {
    return i === 0 ? DOOR.x : -DOOR.x;
  }

  render(time: number) {
    this.works.forEach((w) => {
      if (w.shader) w.shader.uniforms.uTime.value = time;
    });
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
