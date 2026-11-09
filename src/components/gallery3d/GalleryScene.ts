import * as THREE from "three";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
import { ShaderPass } from "three/examples/jsm/postprocessing/ShaderPass.js";
import { OutputPass } from "three/examples/jsm/postprocessing/OutputPass.js";
import { RectAreaLightUniformsLib } from "three/examples/jsm/lights/RectAreaLightUniformsLib.js";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { Reflector } from "three/examples/jsm/objects/Reflector.js";
import type { Project } from "@/content/projects";
import {
  concreteTextures,
  doorLightTexture,
  leafTextures,
  plasterTextures,
  poolTexture,
  textTexture,
} from "./textures";

/*
  The gallery room, rendered with three.js.

  Everything is in metres. The entrance wall is at z = 0, the room runs back to
  z = -D, x runs across from -W/2 to W/2, and the floor is at y = 0.

  Lighting is real: a ceiling track spotlight on every screen (casting the
  screens' shadows on the wall), suspended linear lights lighting the room,
  soft ambient light, and the doors' prism light tinting the wall and floor.
  The polished concrete floor reflects the room on capable devices. A finishing
  pass adds glow on bright light, subtle lens fringing, a vignette and grain.
*/

export const ROOM = { W: 10, H: 4.2, eye: 1.6 };
export const SCREEN = { w: 1.76, h: 0.99, y: 1.62 };
const WORK_START = 4.2; // first screen, metres from the entrance
const WORK_GAP = 3.2; // between screens along a wall
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
  nx: number;
  tx: number;
  tz: number;
};

/* Vertical field of view for a window shape: taller windows see a little wider. */
export const fovFor = (aspect: number) => (aspect < 0.8 ? 62 : 50);

/*
  Where everything goes, and the path the camera takes. Viewing distances come
  from the real field of view, so a screen and its label always fit the window,
  whatever its shape. On windows taller than wide the label hangs under the
  screen instead of beside it.
*/
export function buildLayout(count: number, aspect: number) {
  const perWall = Math.max(3, Math.ceil(count / 2));
  const D = Math.max(15, WORK_START + (perWall - 1) * WORK_GAP + 4.4);
  const W = ROOM.W;
  const vfov = (fovFor(aspect) * Math.PI) / 180;
  const tanV = Math.tan(vfov / 2);
  const tanH = tanV * aspect;
  const stacked = aspect < 1.1;

  // The screen and its label, as seen from in front
  const rowW = stacked ? SCREEN.w : SCREEN.w + 0.14 + LABEL.w;
  const rowH = stacked ? SCREEN.h + 0.26 + LABEL.h : SCREEN.h;
  const fit = Math.max(rowW / (2 * tanH * 0.84), rowH / (2 * tanV * 0.6));
  const near = Math.min(fit, W - 2.2); // how far you stand when settled at a film
  const far = Math.min(near + 0.7, W - 1.4); // ...and while moving between them
  // Far enough back to see both doors and their signs
  const doorDist = Math.min(D - 3, Math.max(4.6 / (2 * tanH * 0.9), 3.4 / (2 * tanV * 0.85)));

  const works: WorkSpot[] = [];
  for (let i = 0; i < count; i++) {
    const left = i < perWall;
    const k = left ? i : i - perWall;
    const z = -(WORK_START + k * WORK_GAP);
    if (left) {
      // On the left wall, facing into the room (+x). Looking at it, your right is -z.
      works.push({ x: -W / 2, z, yaw: Math.PI / 2, face: Math.PI / 2, nx: 1, tx: 0, tz: -1 });
    } else {
      works.push({ x: W / 2, z, yaw: -Math.PI / 2, face: -Math.PI / 2, nx: -1, tx: 0, tz: 1 });
    }
  }
  // With the label beside the screen, stand centred on both.
  const along = stacked ? 0 : (LABEL.w + 0.14) / 2;
  const stops: Stop[] = [
    { x: 0, z: -2.6, yaw: 0, s: 0, kind: "centre", index: 0 },
    ...works.map((w, i) => ({
      x: w.x + w.nx * far + w.tx * along,
      z: w.z + w.tz * along,
      yaw: w.yaw,
      s: 0,
      kind: "work" as const,
      index: i,
    })),
    { x: 0, z: -D + doorDist, yaw: 0, s: 0, kind: "doors", index: 0 },
  ];
  for (let i = 1; i < stops.length; i++) {
    const a = stops[i - 1];
    const b = stops[i];
    b.yaw = a.yaw + Math.atan2(Math.sin(b.yaw - a.yaw), Math.cos(b.yaw - a.yaw)); // turn the short way
    b.s = a.s + Math.max(0.9, Math.hypot(b.x - a.x, b.z - a.z) + Math.abs(b.yaw - a.yaw) * 1.6);
  }
  const span = stops[stops.length - 1].s / (stops.length - 1);
  return { W, D, near, far, works, stops, span, stacked };
}
export type Layout = ReturnType<typeof buildLayout>;

/* Film grain, a vignette and the faintest lens fringing at the edges. */
const FilmShader = {
  uniforms: {
    tDiffuse: { value: null as THREE.Texture | null },
    uTime: { value: 0 },
    uRes: { value: new THREE.Vector2(1, 1) },
  },
  vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
  fragmentShader: `
    uniform sampler2D tDiffuse; uniform float uTime; uniform vec2 uRes; varying vec2 vUv;
    float hash(vec2 p){ return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
    void main(){
      vec2 d = vUv - 0.5;
      float r2 = dot(d, d);
      float ca = 0.006 * r2;
      vec3 c = vec3(texture2D(tDiffuse, vUv + d * ca).r, texture2D(tDiffuse, vUv).g, texture2D(tDiffuse, vUv - d * ca).b);
      c *= 1.0 - 0.28 * smoothstep(0.12, 0.62, r2 * 1.7);
      float g = hash(floor(vUv * uRes) + floor(uTime * 24.0) * vec2(13.0, 7.0)) - 0.5;
      c += g * 0.03 * (0.5 + 0.5 * clamp(1.0 - c.g, 0.0, 1.0));
      gl_FragColor = vec4(c, 1.0);
    }`,
};

/* A placeholder film until a project has a trailer or image: prism light drifting in the dark. */
function placeholderMaterial(title: THREE.Texture) {
  return new THREE.ShaderMaterial({
    uniforms: { uTime: { value: Math.random() * 20 }, uTitle: { value: title } },
    vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
    fragmentShader: `
      uniform float uTime; uniform sampler2D uTitle; varying vec2 vUv;
      float hash(vec2 p){ return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
      void main(){
        float x = vUv.x - 0.5 - 0.05 * sin(uTime * 0.37);
        float y = 1.0 - vUv.y;
        float w = exp(-pow(x / 0.055, 2.0)) * exp(-y * 2.0);
        float b = exp(-pow((x + 0.17 + 0.02 * sin(uTime * 0.5)) / 0.16, 2.0)) * exp(-y * 2.5);
        float o = exp(-pow((x - 0.17 - 0.02 * cos(uTime * 0.45)) / 0.16, 2.0)) * exp(-y * 2.5);
        vec3 c = vec3(0.01) + vec3(1.0) * w * 0.85 + vec3(0.12, 0.17, 1.0) * b * 0.85 + vec3(1.0, 0.54, 0.12) * o * 0.85;
        c += (hash(floor(vUv * vec2(800.0, 450.0)) + floor(uTime * 24.0)) - 0.5) * 0.035;
        vec4 t = texture2D(uTitle, vUv);
        c = mix(c, vec3(1.0), t.a * 0.92);
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
  private reflector?: Reflector;
  private raycaster = new THREE.Raycaster();
  private hq: boolean;
  layout: Layout;
  private labels: THREE.Mesh[] = [];
  private count: number;

  constructor(
    canvas: HTMLCanvasElement,
    opts: { projects: Project[]; aspect: number; hq: boolean },
  ) {
    this.hq = opts.hq;
    this.count = opts.projects.length;
    this.layout = buildLayout(opts.projects.length, opts.aspect);
    const { W, D } = this.layout;
    const H = ROOM.H;

    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: false, // the composer's multisampled target does this
      powerPreference: "high-performance",
    });
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
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
    this.scene.environmentIntensity = 0.28;
    this.scene.background = new THREE.Color(0xf2f0ec);
    pmrem.dispose();
    this.disposables.push(env);

    const hemi = new THREE.HemisphereLight(0xffffff, 0xd8d2c8, 0.55);
    this.scene.add(hemi);

    /* ---------- the room ---------- */

    const plaster = plasterTextures(aniso);
    const concrete = concreteTextures(aniso);
    this.disposables.push(plaster.map, plaster.bump, concrete.map, concrete.rough);

    const wallMat = (w: number, h: number) => {
      const map = plaster.map.clone();
      const bump = plaster.bump.clone();
      [map, bump].forEach((t) => {
        t.repeat.set(w / 2.2, h / 2.2);
        t.needsUpdate = true;
        this.disposables.push(t);
      });
      const m = new THREE.MeshStandardMaterial({
        map,
        bumpMap: bump,
        bumpScale: 0.35,
        roughness: 0.93,
        metalness: 0,
        color: 0xf4f2ee,
      });
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

    // Walls: left, right, back, entrance
    const left = plane(D, H, wallMat(D, H));
    left.position.set(-W / 2, H / 2, -D / 2);
    left.rotation.y = Math.PI / 2;
    const right = plane(D, H, wallMat(D, H));
    right.position.set(W / 2, H / 2, -D / 2);
    right.rotation.y = -Math.PI / 2;
    const back = plane(W, H, wallMat(W, H));
    back.position.set(0, H / 2, -D);
    const entrance = plane(W, H, wallMat(W, H));
    entrance.position.set(0, H / 2, 0);
    entrance.rotation.y = Math.PI;
    this.scene.add(left, right, back, entrance);

    // Ceiling
    const ceilMat = wallMat(W, D);
    ceilMat.color.set(0xf7f6f3);
    const ceiling = plane(W, D, ceilMat);
    ceiling.position.set(0, H, -D / 2);
    ceiling.rotation.x = Math.PI / 2;
    this.scene.add(ceiling);

    // Polished concrete floor, in 2.5 m slabs
    const floorMap = concrete.map.clone();
    const floorRough = concrete.rough.clone();
    [floorMap, floorRough].forEach((t) => {
      t.repeat.set(W / 2.5, D / 2.5);
      t.needsUpdate = true;
      this.disposables.push(t);
    });
    const floorMat = new THREE.MeshStandardMaterial({
      map: floorMap,
      roughnessMap: floorRough,
      roughness: 1,
      metalness: 0,
      envMapIntensity: 0.9,
    });
    this.disposables.push(floorMat);
    const floor = plane(W, D, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.set(0, 0, -D / 2);
    if (this.hq) {
      // A true mirror just under a slightly see-through floor: polished, not glassy.
      const rg = new THREE.PlaneGeometry(W, D);
      this.disposables.push(rg);
      this.reflector = new Reflector(rg, {
        textureWidth: 512,
        textureHeight: 512,
        color: new THREE.Color(0x5c5c5c),
      });
      this.reflector.rotation.x = -Math.PI / 2;
      this.reflector.position.set(0, -0.001, -D / 2);
      this.scene.add(this.reflector);
      floorMat.transparent = true;
      floorMat.opacity = 0.9;
    }
    this.scene.add(floor);

    // Shadow gap where the walls meet the floor
    const skirtMat = new THREE.MeshStandardMaterial({ color: 0x2f2d2b, roughness: 0.8 });
    this.disposables.push(skirtMat);
    const skirt = (len: number, x: number, z: number, ry: number) => {
      const g = new THREE.BoxGeometry(len, 0.045, 0.012);
      this.disposables.push(g);
      const m = new THREE.Mesh(g, skirtMat);
      m.position.set(x, 0.0225, z);
      m.rotation.y = ry;
      this.scene.add(m);
    };
    skirt(D, -W / 2 + 0.006, -D / 2, Math.PI / 2);
    skirt(D, W / 2 - 0.006, -D / 2, Math.PI / 2);
    skirt(W, 0, -D + 0.006, 0);
    skirt(W, 0, -0.006, 0);

    this.addCeilingLights(W, D, H);
    this.addTrack(W, D, H);

    /* ---------- the screens ---------- */
    opts.projects.forEach((p, i) => this.addWork(p, i, aniso));
    this.placeLabels();

    /* ---------- the doors on the back wall ---------- */
    [
      { label: "All work", x: -DOOR.x },
      { label: "About us", x: DOOR.x },
    ].forEach((d, i) => this.addDoor(d.label, d.x, D, i, aniso));

    /* ---------- finishing ---------- */
    const target = new THREE.WebGLRenderTarget(1, 1, {
      type: THREE.HalfFloatType,
      samples: 4, // smooth edges (three.js runs on WebGL 2, which always supports this)
    });
    this.composer = new EffectComposer(renderer, target);
    this.composer.addPass(new RenderPass(this.scene, this.camera));
    this.bloom = new UnrealBloomPass(new THREE.Vector2(256, 256), 0.32, 0.6, 0.9);
    this.composer.addPass(this.bloom);
    this.film = new ShaderPass(FilmShader);
    this.composer.addPass(this.film);
    this.composer.addPass(new OutputPass());

    renderer.shadowMap.needsUpdate = true;
  }

  /* Suspended linear lights: aluminium body, glowing diffuser, cables, and real area light. */
  private addCeilingLights(W: number, D: number, H: number) {
    RectAreaLightUniformsLib.init();
    const len = Math.min(5.2, W * 0.52);
    const bodyMat = new THREE.MeshStandardMaterial({
      color: 0xd9d8d4,
      metalness: 0.7,
      roughness: 0.32,
    });
    const diffMat = new THREE.MeshBasicMaterial({
      color: new THREE.Color(1, 1, 1).multiplyScalar(2.2),
    });
    const cableMat = new THREE.MeshStandardMaterial({
      color: 0x555555,
      metalness: 0.5,
      roughness: 0.4,
    });
    this.disposables.push(bodyMat, diffMat, cableMat);
    const body = new THREE.BoxGeometry(len, 0.06, 0.16);
    const diff = new THREE.PlaneGeometry(len - 0.04, 0.12);
    const cable = new THREE.CylinderGeometry(0.003, 0.003, 0.55, 6);
    this.disposables.push(body, diff, cable);
    const rows = Math.max(3, Math.round((D - 3) / 4.2));
    for (let r = 0; r < rows; r++) {
      const z = -2.4 - (r * (D - 4.4)) / Math.max(1, rows - 1);
      const y = H - 0.58;
      const b = new THREE.Mesh(body, bodyMat);
      b.position.set(0, y, z);
      const d = new THREE.Mesh(diff, diffMat);
      d.rotation.x = Math.PI / 2;
      d.position.set(0, y - 0.031, z);
      this.scene.add(b, d);
      [-0.38, 0.38].forEach((f) => {
        const c = new THREE.Mesh(cable, cableMat);
        c.position.set(len * f, H - 0.28, z);
        this.scene.add(c);
      });
      const light = new THREE.RectAreaLight(0xfff6ec, this.hq ? 7 : 5, len, 0.12);
      light.position.set(0, y - 0.035, z);
      light.lookAt(0, 0, z);
      this.scene.add(light);
    }
  }

  /* Track rails near each side wall, with a spot head over every screen. */
  private addTrack(W: number, D: number, H: number) {
    const railMat = new THREE.MeshStandardMaterial({
      color: 0xeceae6, // white track, as in most galleries
      metalness: 0.2,
      roughness: 0.5,
    });
    this.disposables.push(railMat);
    const rail = new THREE.BoxGeometry(0.045, 0.035, D - 3.4);
    this.disposables.push(rail);
    [-1, 1].forEach((sd) => {
      const r = new THREE.Mesh(rail, railMat);
      r.position.set(sd * (W / 2 - 1.55), H - 0.02, -D / 2 - 0.7);
      this.scene.add(r);
    });
  }

  private addWork(p: Project, i: number, aniso: number) {
    const spot = this.layout.works[i];
    const group = new THREE.Group();
    group.position.set(spot.x + spot.nx * 0.004, SCREEN.y, spot.z);
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
      const sm = placeholderMaterial(title);
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
    const glassMat = new THREE.MeshStandardMaterial({
      color: 0x000000,
      roughness: 0.06,
      metalness: 0,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      envMapIntensity: 1.2,
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
    const head = new THREE.Vector3(spot.x + spot.nx * 1.55, H - 0.12, spot.z);
    const sl = new THREE.SpotLight(0xfff0dc, this.hq ? 14 : 11, 0, 0.36, 0.6, 2);
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
    // The head itself: a short black can angled at the screen, with a lit lens
    const canGeo = new THREE.CylinderGeometry(0.055, 0.05, 0.17, 20);
    const canMat = new THREE.MeshStandardMaterial({
      color: 0x151515,
      metalness: 0.5,
      roughness: 0.4,
    });
    const lensMat = new THREE.MeshBasicMaterial({
      color: new THREE.Color(1, 0.97, 0.9).multiplyScalar(3),
    });
    const lensGeo = new THREE.CircleGeometry(0.045, 20);
    this.disposables.push(canGeo, canMat, lensMat, lensGeo);
    const can = new THREE.Group();
    can.position.copy(head);
    can.lookAt(sl.target.position);
    const body = new THREE.Mesh(canGeo, canMat);
    body.rotation.x = Math.PI / 2;
    const lens = new THREE.Mesh(lensGeo, lensMat);
    lens.position.z = 0.086;
    can.add(body, lens);
    this.scene.add(can);

    this.works.push(w);
  }

  private addDoor(text: string, x: number, D: number, i: number, aniso: number) {
    const z = -D;
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
    this.scene.add(gap);

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
      this.scene.add(m);
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
      this.scene.add(pivot);
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
    this.scene.add(seam);

    // Prism light spilling into the room: blue left, orange right, white in front
    const lights = this.hq
      ? [
          new THREE.PointLight(0x3a55ff, 2.2, 4.5, 2),
          new THREE.PointLight(0xff8a2a, 2.2, 4.5, 2),
          new THREE.PointLight(0xfff8ee, 1.6, 5.5, 2),
        ]
      : [new THREE.PointLight(0xfff8ee, 2, 5.5, 2)];
    if (this.hq) {
      lights[0].position.set(x - 0.45, 2.25, z + 0.55);
      lights[1].position.set(x + 0.45, 2.25, z + 0.55);
      lights[2].position.set(x, 1.1, z + 0.8);
    } else {
      lights[0].position.set(x, 1.3, z + 0.8);
    }
    lights.forEach((l) => this.scene.add(l));

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
    this.scene.add(spill);

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
    this.scene.add(signDim, signLit);
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
    this.scene.add(underline);

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
    this.layout = buildLayout(this.count, w / h);
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
    // A lower-resolution reflection reads as the soft sheen of polished concrete.
    this.reflector
      ?.getRenderTarget()
      .setSize(Math.round(w * dpr * 0.35), Math.round(h * dpr * 0.35));
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
      const near = stopIndex >= 0 && Math.abs(k - stopIndex) <= 1;
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
    return { x: s.x + s.nx * 0.05, z: s.z, yaw: s.yaw, nx: s.nx };
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
    this.reflector?.dispose();
    this.composer.dispose();
    this.renderer.dispose();
  }
}
