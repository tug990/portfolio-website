import * as THREE from "three";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
import { ShaderPass } from "three/examples/jsm/postprocessing/ShaderPass.js";
import { OutputPass } from "three/examples/jsm/postprocessing/OutputPass.js";
import { GTAOPass } from "three/examples/jsm/postprocessing/GTAOPass.js";
import { RectAreaLightUniformsLib } from "three/examples/jsm/lights/RectAreaLightUniformsLib.js";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { CSS3DObject, CSS3DRenderer } from "three/examples/jsm/renderers/CSS3DRenderer.js";
import { StereoEffect } from "three/examples/jsm/effects/StereoEffect.js";
import { buildWorld, roomSpots, UPPER, type Collider, type World, type Zone } from "./world";
import { makeSurfaces, type Surfaces } from "./surfaces";
import type { Project } from "@/content/projects";
import { WORK_CLIENTS } from "@/content/site";
import {
  YT_HOST,
  keepLooping,
  loadYouTubeApi,
  youtubeCoverJpeg,
  youtubeId,
  ytPlayerVars,
  type YTPlayer,
} from "@/lib/youtube";
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
  PRISM_TOP,
  addCoveLighting,
  PHONE_GLASS_OPACITY,
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
// Metres from where you arrive to the prism's plinth: closer on tall (phone)
// screens, whose wide lens makes everything look further away
// (on tall screens the title rule below usually sets it, a little further back)
const PRISM_AHEAD = { wide: 7.2, tall: 4.5 };
const TITLE_BASE = 2.55; // the far wall title's lettering starts this high, just above the films
const TITLE_CLEAR = 0.13; // the prism's tip stays this far below it, seen from where you arrive
// The camera never walks through the prism: within this many metres of it,
// it's eased out sideways along a smooth curve (see setPose)
const PRISM_KEEP_OUT = 3.0; // passes clear the plinth by 0.55 m or more; stops move 6 cm at most
const DOOR = { w: 1.15, h: 2.45, x: 1.35 };
const LABEL = { w: 0.34, h: 0.21 };

export type Pose = { x: number; z: number; yaw: number }; // yaw: 0 looks down the room (-z)
export type StopKind = "centre" | "work" | "doors" | "place";
export type Stop = Pose & { s: number; kind: StopKind; index: number; y?: number }; // y: its floor (0 if not given)
export type Pick = { kind: "work" | "door" | "bench"; index: number } | null;

type WorkSpot = {
  scale: number; // the far wall's films hang larger
  x: number;
  y?: number; // the floor it hangs on (upstairs: 6), 0 if not given
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
  far wall (two at most) and the right wall: two each for six; for more, the
  side walls run on into a long hall. The doors are on the wall
  behind you, at z = front. The walk: the overview, the left wall (front to
  back), the far wall (left to right), the right wall (back to front), then
  you turn round to the doors.

  Viewing distances come from the real field of view, so a film and its
  label always fit the window, whatever its shape. On windows taller than
  wide the label hangs under the film instead of beside it.
*/
export function buildLayout(count: number, aspect: number, front: number) {
  const W = ROOM.W;
  // The far wall holds two films at most (the room's main pieces); the rest
  // hang down the side walls, so more films make a longer hall, as a
  // museum's long gallery: six make the original room; twenty, a 33 m hall.
  const nCentre = Math.min(2, Math.ceil(count / 3));
  const nLeft = Math.ceil((count - nCentre) / 2);
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
  // `end`: the journey's last stop (in the world, the doors out; the entrance doors come after it)
  return { W, D, near, far, works, stops, span, stacked, front, end: stops.length - 1 };
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

/*
  Sharpening, last of all (after tone mapping): contrast-adaptive, as AMD's
  CAS: each pixel is pushed away from its four neighbours, less where the
  contrast is already strong, so edges and fine grain read crisp without halos.
*/
const SharpenShader = {
  uniforms: {
    tDiffuse: { value: null },
    uRes: { value: new THREE.Vector2(1, 1) },
    uAmount: { value: 0.16 },
  },
  vertexShader: /* glsl */ `
    varying vec2 vUv;
    void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
  fragmentShader: /* glsl */ `
    uniform sampler2D tDiffuse;
    uniform vec2 uRes;
    uniform float uAmount;
    varying vec2 vUv;
    void main() {
      vec2 px = 1.0 / uRes;
      vec4 c4 = texture2D(tDiffuse, vUv);
      vec3 c = c4.rgb;
      vec3 n = texture2D(tDiffuse, vUv + vec2(0.0, px.y)).rgb;
      vec3 s = texture2D(tDiffuse, vUv - vec2(0.0, px.y)).rgb;
      vec3 e = texture2D(tDiffuse, vUv + vec2(px.x, 0.0)).rgb;
      vec3 w = texture2D(tDiffuse, vUv - vec2(px.x, 0.0)).rgb;
      vec3 mn = min(c, min(min(n, s), min(e, w)));
      vec3 mx = max(c, max(max(n, s), max(e, w)));
      vec3 amp = sqrt(clamp(min(mn, 1.0 - mx) / max(mx, vec3(1e-4)), 0.0, 1.0));
      vec3 wt = -amp * uAmount;
      gl_FragColor = vec4(clamp((c + (n + s + e + w) * wt) / (1.0 + 4.0 * wt), 0.0, 1.0), c4.a);
    }`,
};

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
  yt?: WallYouTube;
  /* a stand-in's light, held still (paused in the room) */
  paused?: boolean;
};

/* A bench down the middle of the hall, and the places to sit on it (eye height, facing a wall). */
export type Bench = {
  x: number;
  z: number;
  floor?: number; // its floor's height (upstairs: 6)
  seats: { x: number; z: number; yaw: number }[];
};
export const SEATED_EYE = 1.18;

/*
  A YouTube video on a wall screen. WebGL can't draw another site's player, so
  a real YouTube player (an iframe) is laid over the screen in 3D by the CSS3D
  renderer, lined up with it from any angle. Under it, the WebGL screen shows
  the video's cover. It loads the first time you're near and keeps playing
  (muted, looped); it's hidden when you're away or behind it.
*/
type WallYouTube = {
  id: string;
  obj: CSS3DObject;
  box: HTMLDivElement;
  started: boolean;
  pending?: number; // the timer that will load it
  player?: YTPlayer;
  poll?: number;
  placed: boolean;
  near: boolean;
};
const YT_PX = 1280; // the overlay's width in CSS pixels, scaled down to the screen's size
const YT_LOAD_DELAY = 1200; // ms after you first come near (past the way in's settle)

/* The convex hull of some points, in order round the outside (Andrew's monotone chain). */
function convexHull(points: [number, number][]) {
  const p = [...points].sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  if (p.length < 3) return p;
  const cross = (o: number[], a: number[], b: number[]) =>
    (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const half = (list: [number, number][]) => {
    const out: [number, number][] = [];
    for (const q of list) {
      while (out.length >= 2 && cross(out[out.length - 2], out[out.length - 1], q) <= 0) out.pop();
      out.push(q);
    }
    out.pop();
    return out;
  };
  return [...half(p), ...half([...p].reverse())];
}

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
  private sharpen: ShaderPass;
  /* the building's surfaces (the gallery page): shared by the hall and the world */
  surfaces?: Surfaces;
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
  // YouTube players laid over wall screens (see WallYouTube); made only if a film needs one
  private css?: CSS3DRenderer;
  private cssScene = new THREE.Scene();
  private canvas: HTMLCanvasElement;
  private disposed = false;
  private prismPoints: THREE.Vector3[] = []; // the glass pyramid's outline, for the hole in the YouTube layer
  private prismAt?: THREE.Vector3; // where the prism stands, for the camera to walk round it
  private tall = false; // a phone-shaped window when the room was built
  /* many films (a long hall): smaller textures for each, so memory stays modest */
  private many = false;
  /* the projects on the walls, in order */
  private projects: Project[] = [];
  /* benches down the middle of the hall, to sit on */
  benches: Bench[] = [];
  /* the film playing with sound in the room, if any */
  private sounding = -1;
  /* the world beyond the hall (the gallery page) */
  private worldOn = false;
  private hallCount = 0;
  private roomClients: typeof WORK_CLIENTS = [];
  private perRoom: number[] = [];
  world?: World;
  private static BACK = 7; // the side gallery behind the far wall
  /* the room's warm evening fill (softer in the daylit world, where the probes light it) */
  private hemi!: THREE.HemisphereLight;
  /*
    Reflection probes for the world: the scene, caught from a point (a cube of
    six views), blurred for each roughness (PMREM) and used as the light
    all round you. So steel and glass reflect the real atrium round them, and
    the white walls and pale stone light everything else softly, as bounced
    light does (a step towards baked light). Caught twice after building
    (once the pictures have loaded); the hall keeps its studio light.
  */
  private probe?: {
    cam: THREE.CubeCamera;
    rt: THREE.WebGLCubeRenderTarget;
    pmrem: THREE.PMREMGenerator;
    spots: { at: THREE.Vector3; rt: THREE.WebGLRenderTarget | null }[];
    hallEnv: THREE.Texture;
    due: number[]; // when to (re)catch, in ms after building
    t0: number;
  };
  private static WORLD_ENV = 0.9; // how strongly the caught light lights the world
  private static DAY_SKY = new THREE.Color(0xf6f7fb);
  private static DAY_GROUND = new THREE.Color(0x9a9288);
  /* where the hall ends and the atrium begins */
  get zA() {
    return -(this.layout.D + GalleryScene.BACK);
  }

  /*
    The layout: the hall's (buildLayout, for its films), and in the world the
    rooms' films after them, and the tour's stops: the hall's, the doors, the
    atrium's pieces, the balcony, each room's films, then the doors out.
  */
  private makeLayout(aspect: number) {
    const L = buildLayout(this.hallCount, aspect, this.front);
    if (!this.worldOn) return L;
    const zA = -(L.D + GalleryScene.BACK);
    const spots = roomSpots(zA, this.perRoom);
    const works = [...L.works, ...spots];
    const along = L.stacked ? 0 : (LABEL.w + 0.14) / 2;
    const places: Stop[] = (this.world?.places ?? []).map((p, k) => ({
      x: p.x,
      y: p.y,
      z: p.z,
      yaw: p.yaw,
      s: 0,
      kind: "place" as const,
      index: k,
    }));
    const roomStops: Stop[] = spots.map((w, j) => ({
      x: w.x + (w.nx * L.far * 1.15 + w.tx * along) * w.scale,
      y: w.y,
      z: w.z + (w.nz * L.far * 1.15 + w.tz * along) * w.scale,
      yaw: w.yaw,
      s: 0,
      kind: "work" as const,
      index: L.works.length + j,
    }));
    /*
      The journey, start to end, as one person walks it (a scroll, N, a tap on
      Next, the VR stick all follow it): the entrance; the hall's films down
      the hall a pair at a time, across and back (so you cross once a pair);
      the far wall's; through the portal to the atrium's pieces; up the
      stairs; the balcony; each room's films; and last the doors out (About,
      Contact): `end`. The hall's entrance doors (behind you at the start)
      stay a stop, after the end.
    */
    const [centre, ...hallRest] = L.stops;
    const hallDoors = hallRest.pop()!;
    const wallOf = (st: Stop) => L.works[st.index].nx; // 1: the left wall, -1: the right, 0: the far wall
    const left = hallRest.filter((st) => wallOf(st) > 0).sort((a, b) => b.z - a.z);
    const right = hallRest.filter((st) => wallOf(st) < 0).sort((a, b) => b.z - a.z);
    const hall: Stop[] = [];
    for (let r = 0; r < Math.max(left.length, right.length); r++) {
      const pair = [left[r], right[r]].filter(Boolean);
      hall.push(...(r % 2 ? pair.reverse() : pair));
    }
    const endX = hall[hall.length - 1]?.x ?? 0;
    const farWall = hallRest
      .filter((st) => wallOf(st) === 0)
      .sort((a, b) => (endX > 0 ? b.x - a.x : a.x - b.x));
    const isLast = (p: Stop) => this.world?.places[p.index]?.name === "About & Contact";
    const stops: Stop[] = [
      centre,
      ...hall,
      ...farWall,
      ...places.filter((p) => !isLast(p)),
      ...roomStops,
      ...places.filter(isLast),
      hallDoors,
    ].map((st) => ({ ...st, s: 0 }));
    for (let i = 1; i < stops.length; i++) {
      const a = stops[i - 1];
      stops[i].s = a.s + Math.max(0.9, Math.hypot(stops[i].x - a.x, stops[i].z - a.z));
    }
    return { ...L, works, stops, end: stops.length - 2 };
  }
  private clipKey = "";
  /* the floor, for teleporting onto in VR, and its material (opaque in VR, where there's no mirror) */
  private floor!: THREE.Mesh;
  private floorMat!: THREE.Material;
  /*
    What carries you in VR: the camera sits in this rig. Outside VR it stays
    at the origin (setPose moves the camera itself); in VR the headset moves
    the camera within it, and teleporting moves the rig.
  */
  private rig = new THREE.Group();
  private xr: {
    session: XRSession | null;
    onPick?: (p: Pick, stop: number) => void;
    onEnd?: () => void;
    stick: number; // the thumbstick was pushed (wait for it to come back)
    rays: THREE.Line[];
    time0: number;
  } = { session: null, stick: 0, rays: [], time0: 0 };
  /* side by side, for a phone in a VR holder (no WebXR, e.g. iPhone) */
  private stereo?: StereoEffect;

  constructor(
    canvas: HTMLCanvasElement,
    opts: { projects: Project[]; aspect: number; hq: boolean; world?: boolean },
  ) {
    this.hq = opts.hq;
    this.tall = opts.aspect < 1;
    this.count = opts.projects.length;
    this.many = this.count > 8;
    this.projects = opts.projects;
    // The world (the gallery page): the hall holds the studio's own films; each
    // initiative's are in its room upstairs (world.ts)
    if (opts.world) {
      this.worldOn = true;
      this.hallCount = opts.projects.filter(
        (p) => !WORK_CLIENTS.some((c) => c.name === p.client),
      ).length;
      this.roomClients = WORK_CLIENTS.filter((c) => opts.projects.some((p) => p.client === c.name));
      this.perRoom = this.roomClients.map(
        (c) => opts.projects.filter((p) => p.client === c.name).length,
      );
      this.many = this.hallCount > 8;
    } else this.hallCount = this.count;
    // Deep enough behind the overview spot to stand back and see the doors.
    this.front = Math.max(7.5, overviewZ(opts.aspect) + 4.5);
    this.layout = this.makeLayout(opts.aspect);
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
    this.canvas = canvas;
    const aniso = renderer.capabilities.getMaxAnisotropy();

    this.camera = new THREE.PerspectiveCamera(50, 1, 0.05, opts.world ? 200 : 80);
    this.camera.rotation.order = "YXZ";
    this.camera.layers.enable(1); // lamp halos and beams: seen, but not reflected in the floor
    this.rig.add(this.camera);
    this.scene.add(this.rig);

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
    this.hemi = hemi;

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

    // The gallery page: one set of surfaces for the whole building (surfaces.ts)
    const set: SetCtx = {
      scene: this.scene,
      keep: (...things) => this.disposables.push(...things),
      hq: this.hq,
    };
    const S = this.worldOn ? makeSurfaces(set, aniso) : null;
    if (S) this.surfaces = S;

    /*
      Walls: left, right, far, and the door wall. The room runs from z = front
      back to -D. In the far corners, openings lead into a side gallery
      behind the far wall (BACK deep), so the space carries on.
    */
    const FRONT = this.front;
    const BACK = 7; // the passages behind the far wall run well back: open ways, not alcoves
    const OPEN = this.worldOn ? 1.6 : 1.0; // width of each opening (wider in the world: a way through)
    const OPEN_H = 3.0;
    const len = D + FRONT; // the main room
    const mid = (FRONT - D) / 2;
    const allLen = len + BACK; // with the side gallery
    const allMid = (FRONT - D - BACK) / 2;
    // the building's white plaster (the gallery page), or warm beige microcement
    const wallMat = S ? S.wall : matte(0xddc6a8, 0.9);
    if (!S) {
      microcement(wallMat);
      wallMat.emissive.set(0x1e130a); // the warm light the cove and skylight leave on the walls
    }
    const left = plane(allLen, H, wallMat);
    left.position.set(-W / 2, H / 2, allMid);
    left.rotation.y = Math.PI / 2;
    const right = plane(allLen, H, wallMat);
    right.position.set(W / 2, H / 2, allMid);
    right.rotation.y = -Math.PI / 2;
    const entrance = plane(W, H, wallMat);
    entrance.position.set(0, H / 2, FRONT);
    entrance.rotation.y = Math.PI;
    this.scene.add(left, right, entrance);
    if (this.worldOn) {
      // the side gallery's back wall opens in the middle: a portal into the atrium (world.ts)
      for (const sx of [-1, 1]) {
        const seg = plane(W / 2 - 3, H, wallMat);
        seg.position.set(sx * (3 + (W / 2 - 3) / 2), H / 2, -D - BACK);
        this.scene.add(seg);
      }
    } else {
      const galleryBack = plane(W, H, wallMat);
      galleryBack.position.set(0, H / 2, -D - BACK);
      this.scene.add(galleryBack);
    }
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
    const ceilMat = S ? S.ceil : matte(0x8a7766, 0.95);
    if (!S) ceilMat.emissive.set(0x3d2b1e); // warm light bouncing up off the lit walls
    const ceiling = plane(W, allLen, ceilMat);
    ceiling.position.set(0, H, allMid);
    ceiling.rotation.x = Math.PI / 2;
    this.scene.add(ceiling);

    // Dark polished stone, in large slabs (see marble.ts), with a soft reflection on capable devices
    // (the gallery page: the building's oak, as everywhere)
    const floorMat = S ? S.oak : marbleFloorMaterial({ dark: true });
    if (!S) this.disposables.push(floorMat);
    const floor = plane(W, allLen, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.set(0, 0, allMid);
    this.floor = floor;
    this.floorMat = floorMat;
    if (this.hq && !S) {
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

    this.entranceParts.push(
      S
        ? this.addShadowGaps(S, W, D, FRONT, len, mid, OPEN, BACK)
        : this.addFloatingWalls(W, D, FRONT, len, mid, OPEN, BACK),
    );
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
    /* ---------- the long hall: a wall text for each initiative, benches to sit on ---------- */
    if (!this.worldOn) this.addSections(aniso);
    this.addBenches(set);
    /* ---------- the world beyond: the atrium, the stairs, the rooms upstairs ---------- */
    if (this.worldOn) {
      this.world = buildWorld(set, {
        zA: -(D + GalleryScene.BACK),
        hallW: W,
        clients: this.roomClients,
        aniso,
        filmSpots: roomSpots(-(D + GalleryScene.BACK), this.perRoom),
        surfaces: S!,
      });
      this.benches.push(...this.world.benches);
      this.pickables.push(...this.world.pickDoors);
      const rt = new THREE.WebGLCubeRenderTarget(256, { type: THREE.HalfFloatType });
      this.probe = {
        cam: new THREE.CubeCamera(0.1, 200, rt),
        rt,
        pmrem: new THREE.PMREMGenerator(renderer),
        // the hall's, then the world's (the atrium, the upper floor)
        spots: [new THREE.Vector3(0, 1.8, allMid), ...this.world.probes].map((at) => ({
          at,
          rt: null,
        })),
        hallEnv: env,
        due: [700, 3200],
        t0: performance.now(),
      };
      S!.loaded.then(() => this.catchSoon());
      // daylight everywhere in the building from the start (see worldLight)
      this.hemi.color.copy(GalleryScene.DAY_SKY);
      this.hemi.groundColor.copy(GalleryScene.DAY_GROUND);
      this.hemi.intensity = 0.75;
      this.layout = this.makeLayout(opts.aspect); // now with the world's places on the tour
    }

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
    // (in the daylit building only light sources glow, never a sunlit wall)
    this.bloom = new UnrealBloomPass(
      new THREE.Vector2(256, 256),
      0.55,
      0.6,
      this.worldOn ? 1.5 : 0.86,
    );
    this.composer.addPass(this.bloom);
    this.film = new ShaderPass(FilmShader);
    this.composer.addPass(this.film);
    this.composer.addPass(new OutputPass());
    // and last a touch of sharpening, so walls, edges and the grain of things read crisp
    this.sharpen = new ShaderPass(SharpenShader);
    this.composer.addPass(this.sharpen);

    renderer.shadowMap.needsUpdate = true;
  }

  /*
    The evening exhibition around the films: framed landscapes and the title
    on the walls, the prism on its plinth, and the light on the walls that
    lights it all.
  */
  private addExhibition(set: SetCtx, W: number, D: number, H: number, aniso: number) {
    const v = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);
    // The far wall: the exhibition title, centred above its two films
    // (their tops, frames included, are at ~2.33 m; the wall runs up to H)
    const farN = v(0, 0, 1);
    addWallTitle(set, v(0, TITLE_BASE, -D), farN, aniso);

    // In each passage, a film on the outer wall, seen through the opening:
    // a glimpse of more work (not one of the stops)
    for (const sx of [-1, 1]) {
      const n = v(-sx, 0, 0);
      const at = v(sx * (W / 2 - 0.004), SCREEN.y, -D - 1.95);
      this.addGlimpseFilm(at, n, sx > 0 ? 7 : 8, aniso);
    }

    // The prism on its plinth, a set distance ahead of where you arrive (never
    // further back than its old spot out from the far wall). But never so close
    // that, from where you arrive, its tip rises over the wall title: seen from
    // eye height, the tip lands on the far wall at
    //   eye + (PRISM_TOP - eye) * (distance to the wall / distance to the prism)
    // which must stay TITLE_CLEAR below the title's lettering.
    const z0 = this.layout.stops[0].z;
    const eye = ROOM.eye;
    const tipClear = ((z0 + D) * (PRISM_TOP - eye)) / (TITLE_BASE - TITLE_CLEAR - eye);
    const ahead = Math.max(this.tall ? PRISM_AHEAD.tall : PRISM_AHEAD.wide, tipClear);
    const prismAt = v(0, 0, Math.max(z0 - ahead, -D + 3.6));
    this.prismAt = prismAt;
    this.prismPoints = addPrismPlinth(set, prismAt, "/brand/mark-transparent.webp").pyramidPoints;
  }

  /*
    A wall text for each initiative, as a museum titles each section: on the
    wall just before the first of a client's films (along the way you walk),
    their emblem on a white plate, their name in spaced capitals under it, and
    a line of prism light.
  */
  private addSections(aniso: number) {
    const PLATE = { w: 0.5, h: 0.64 };
    let prev: string | undefined;
    this.projects.forEach((p, i) => {
      const client = WORK_CLIENTS.find((c) => c.name === p.client);
      if (!client || p.client === prev) {
        prev = p.client;
        return;
      }
      prev = p.client;
      const spot = this.layout.works[i];
      const along = 1.32 * spot.scale; // before the film, between it and the one before
      const g = new THREE.Group();
      g.position.set(
        spot.x - spot.tx * along + spot.nx * 0.006,
        SCREEN.y - 0.02,
        spot.z - spot.tz * along + spot.nz * 0.006,
      );
      g.rotation.y = spot.face;
      this.scene.add(g);

      // the plate, its words drawn now and the emblem laid on when it loads
      const canvas = document.createElement("canvas");
      canvas.width = 500;
      canvas.height = 640;
      const ctx = canvas.getContext("2d")!;
      const tex = new THREE.CanvasTexture(canvas);
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.anisotropy = aniso;
      const draw = (img?: HTMLImageElement) => {
        ctx.fillStyle = "#fbfaf7";
        ctx.fillRect(0, 0, 500, 640);
        if (img) {
          const h = client.markIsLogo ? 120 : 210;
          const w = (img.width / img.height) * h;
          const fw = Math.min(w, 380);
          const fh = (fw / w) * h;
          ctx.drawImage(img, 250 - fw / 2, 80 + (210 - fh) / 2, fw, fh);
        }
        ctx.fillStyle = "#121212";
        ctx.font = "300 30px Jost, ui-sans-serif, system-ui";
        ctx.textAlign = "center";
        // the name in wide-spaced capitals, on two lines if it's long
        const words = client.name.toUpperCase().split(" ");
        const lines: string[] = [];
        for (const wd of words) {
          const last = lines[lines.length - 1];
          if (last && (last + " " + wd).length <= 16) lines[lines.length - 1] = last + " " + wd;
          else lines.push(wd);
        }
        lines.slice(0, 3).forEach((ln, k) => {
          const spaced = ln.split("").join("\u200a");
          ctx.fillText(spaced, 250, 380 + k * 44, 440);
        });
        const grad = ctx.createLinearGradient(170, 0, 330, 0);
        ["#1f2cff", "#2bb8ff", "#ffffff", "#ff8a1f", "#ff3d1f"].forEach((c, k) =>
          grad.addColorStop(k / 4, c),
        );
        ctx.fillStyle = grad;
        ctx.fillRect(170, 560, 160, 4);
        tex.needsUpdate = true;
      };
      draw();
      const img = new Image();
      img.onload = () => !this.disposed && draw(img);
      img.src = client.mark;

      const front = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.85 });
      const side = new THREE.MeshStandardMaterial({ color: 0xe9e6df, roughness: 0.9 });
      const geo = new THREE.BoxGeometry(PLATE.w, PLATE.h, 0.012);
      this.disposables.push(tex, front, side, geo);
      const plate = new THREE.Mesh(geo, [side, side, side, side, front, side]);
      plate.position.z = 0.006;
      plate.castShadow = this.hq;
      g.add(plate);
    });
  }

  /*
    Benches down the middle of the hall, every other pair of films (as
    museums set them along the way, facing the work), clear of the prism and
    of where you arrive; and one facing the far wall. Each has a seat facing
    each wall it faces.
  */
  private addBenches(set: SetCtx) {
    if (!this.many) return; // the original room keeps its open floor
    const { works, D } = this.layout;
    const left = works.filter((w) => w.nx === 1);
    const prism = this.prismAt;
    const clear = (z: number) => !prism || Math.abs(z - prism.z) > 3.4;
    left.forEach((w, i) => {
      if (i % 2 !== 0 || i === 0 || !clear(w.z) || w.z < -D + 5.5) return;
      const g = addBench(set, new THREE.Vector3(0, 0, w.z), Math.PI / 2);
      this.addBenchPick(g, this.benches.length);
      this.benches.push({
        x: 0,
        z: w.z,
        seats: [
          { x: 0.06, z: w.z, yaw: Math.PI / 2 }, // facing the left wall
          { x: -0.06, z: w.z, yaw: -Math.PI / 2 }, // facing the right wall
        ],
      });
    });
    // facing the far wall's films
    const zf = -D + 4.8;
    if (clear(zf)) {
      const g = addBench(set, new THREE.Vector3(0, 0, zf), 0);
      this.addBenchPick(g, this.benches.length);
      this.benches.push({ x: 0, z: zf, seats: [{ x: 0, z: zf + 0.06, yaw: 0 }] });
    }
  }
  private addBenchPick(g: THREE.Object3D, index: number) {
    g.traverse((o) => {
      if ((o as THREE.Mesh).isMesh) {
        o.userData.pick = { kind: "bench", index };
        this.pickables.push(o);
      }
    });
  }

  /* ---------- for walking round ---------- */

  /* Where you can stand: inside the walls, with room to spare. */
  get bounds() {
    const { W, D } = this.layout;
    if (this.world) {
      const b = this.world.bounds;
      return {
        minX: b.minX + 0.55,
        maxX: b.maxX - 0.55,
        minZ: b.minZ + 0.6,
        maxZ: this.front - 0.6,
      };
    }
    return { minX: -W / 2 + 0.55, maxX: W / 2 - 0.55, minZ: -D + 0.6, maxZ: this.front - 0.6 };
  }

  /* The areas you can stand in, for the map: the hall, and the world's floors */
  get areas() {
    const { W } = this.layout;
    const hall = { minX: -W / 2, maxX: W / 2, minZ: this.zA, maxZ: this.front, level: 0 };
    if (!this.world) return [hall];
    return [
      hall,
      ...this.world.zones.filter((z) => !z.over).map((z) => ({ ...z, level: z.level as number })),
    ];
  }

  /* ---------- walking: floors, stairs, walls ---------- */

  private walkZones(): Zone[] {
    const { W, D } = this.layout;
    const back = this.worldOn ? this.zA : -(D + GalleryScene.BACK) + 0.45;
    const hall: Zone = {
      minX: -W / 2 + 0.45,
      maxX: W / 2 - 0.45,
      minZ: back,
      maxZ: this.front - 0.6,
      floor: () => 0,
      level: 0,
    };
    return this.world ? [hall, ...this.world.zones] : [hall];
  }
  private walkColliders(): Collider[] {
    const { W, D } = this.layout;
    const OPEN = this.worldOn ? 1.6 : 1.0;
    const r = 0.3;
    const c: Collider[] = [
      // the far wall, between its openings
      {
        kind: "box",
        minX: -(W / 2 - OPEN) - r,
        maxX: W / 2 - OPEN + r,
        minZ: -D - 0.2 - r,
        maxZ: -D + r,
        level: 0,
      },
    ];
    if (this.worldOn) {
      // the side gallery's back wall, either side of the portal
      const zA = this.zA;
      c.push({ kind: "box", minX: -W / 2, maxX: -3 + r, minZ: zA - r, maxZ: zA + r, level: 0 });
      c.push({ kind: "box", minX: 3 - r, maxX: W / 2, minZ: zA - r, maxZ: zA + r, level: 0 });
    }
    if (this.prismAt)
      c.push({ kind: "circle", x: this.prismAt.x, z: this.prismAt.z, r: 1.3, level: 0 });
    // the hall's benches
    this.benches.forEach((b) => {
      if (b.floor !== undefined) return; // the world's: in its own colliders
      const along = b.seats.length > 1;
      const hx = along ? 0.45 : 1.35;
      const hz = along ? 1.35 : 0.45;
      c.push({
        kind: "box",
        minX: b.x - hx,
        maxX: b.x + hx,
        minZ: b.z - hz,
        maxZ: b.z + hz,
        level: 0,
      });
    });
    return this.world ? [...c, ...this.world.colliders] : c;
  }
  private _zones?: Zone[];
  private _colliders?: Collider[];
  /* where you can stand on findPath's grid (kept: the building doesn't move) */
  private grid?: { sig: string; floor: Map<number, number | null>; tight: Map<number, boolean> };

  /*
    The floor's height where you'd stand at (x, z), coming from a floor at
    `from` (where floors overlap, the nearest; on the stairs, the stairs'), or
    null if you can't stand there.
  */
  floorAt(x: number, z: number, from = 0) {
    this._zones ??= this.walkZones();
    let best: number | null = null;
    for (const zn of this._zones) {
      if (x < zn.minX || x > zn.maxX || z < zn.minZ || z > zn.maxZ) continue;
      const f = zn.floor(x, z);
      if (zn.over) return f;
      if (best === null || Math.abs(f - from) < Math.abs(best - from)) best = f;
    }
    return best;
  }
  private blocked(x: number, z: number, floor: number) {
    this._colliders ??= this.walkColliders();
    const level = floor > 3 ? 1 : 0;
    return this._colliders.some((c) =>
      c.level !== level
        ? false
        : c.kind === "box"
          ? x > c.minX && x < c.maxX && z > c.minZ && z < c.maxZ
          : Math.hypot(x - c.x, z - c.z) < c.r,
    );
  }
  /* Can you step from a floor at `from` to (x, z)? Then the floor there. */
  private stepTo(x: number, z: number, from: number) {
    const f = this.floorAt(x, z, from);
    if (f === null || Math.abs(f - from) > 0.6 || this.blocked(x, z, f)) return null;
    return f;
  }
  /*
    One step of walking from (x, z) on a floor at `floor` towards (nx, nz):
    where you end up (sliding along a wall rather than stopping dead).
  */
  move(x: number, z: number, floor: number, nx: number, nz: number) {
    let f = this.stepTo(nx, nz, floor);
    if (f !== null) return { x: nx, z: nz, floor: f };
    f = this.stepTo(nx, z, floor);
    if (f !== null) return { x: nx, z, floor: f };
    f = this.stepTo(x, nz, floor);
    if (f !== null) return { x, z: nz, floor: f };
    return { x, z, floor };
  }
  /* Is there a clear walk in a straight line from a to b (no wall, no drop)? */
  clearPath(a: { x: number; z: number; floor: number }, b: { x: number; z: number }) {
    const n = Math.ceil(Math.hypot(b.x - a.x, b.z - a.z) / 0.35);
    let f = a.floor;
    for (let i = 1; i <= n; i++) {
      const t = i / n;
      const g = this.stepTo(a.x + (b.x - a.x) * t, a.z + (b.z - a.z) * t, f);
      if (g === null) return false;
      f = g;
    }
    return true;
  }
  /*
    The visible surface at (x, z) (on the stairs, the tread you'd stand on,
    not the slope you walk), for things laid on the floor; null off the floor.
  */
  surfaceAt(x: number, z: number, from = 0) {
    this._zones ??= this.walkZones();
    let best: number | null = null;
    for (const zn of this._zones) {
      if (x < zn.minX || x > zn.maxX || z < zn.minZ || z > zn.maxZ) continue;
      const f = (zn.surface ?? zn.floor)(x, z);
      if (zn.over) return f;
      if (best === null || Math.abs(f - from) < Math.abs(best - from)) best = f;
    }
    return best;
  }

  /*
    The way a person would walk from a to b: round walls and sculpture,
    through doorways, up or down the stairs. A search (A*) over a grid of
    places you can stand (half a metre apart, each on a floor), keeping a
    little clear of walls; then straightened wherever a straight walk is clear
    (with room for your shoulders). Each point carries its floor. Null if
    there's no way (or b isn't somewhere you can stand).
  */
  findPath(
    a: { x: number; z: number; floor: number },
    b: { x: number; z: number; floor?: number },
  ) {
    const G = 0.5;
    const B = this.bounds;
    const NX = Math.ceil((B.maxX - B.minX) / G) + 1;
    const NZ = Math.ceil((B.maxZ - B.minZ) / G) + 1;
    const cx = (i: number) => B.minX + i * G;
    const cz = (j: number) => B.minZ + j * G;
    const lvl = (f: number) => (f > 3 ? 1 : 0);
    const key = (i: number, j: number, l: number) => (l * NZ + j) * NX + i;
    // where you can stand on the grid (each point, on each level), worked out once and kept
    const sig = `${NX}x${NZ}@${B.minX},${B.minZ}`;
    if (this.grid?.sig !== sig) this.grid = { sig, floor: new Map(), tight: new Map() };
    const grid = this.grid;
    const at = (i: number, j: number, l: number): number | null => {
      if (i < 0 || j < 0 || i >= NX || j >= NZ) return null;
      const k = key(i, j, l);
      let f = grid.floor.get(k);
      if (f === undefined) {
        const x = cx(i);
        const z = cz(j);
        const ff = this.floorAt(x, z, l ? UPPER.y : 0);
        f = ff === null || lvl(ff) !== l || this.blocked(x, z, ff) ? null : ff;
        grid.floor.set(k, f);
      }
      return f;
    };
    // a step from a floor at f onto grid point (i, j), on whichever level is there: its floor
    const onto = (i: number, j: number, f: number) => {
      const l = lvl(f);
      let nf = at(i, j, l);
      if (nf === null) nf = at(i, j, 1 - l);
      return nf !== null && Math.abs(nf - f) <= 0.6 ? nf : null;
    };
    // close to a wall (a neighbour you can't stand on): walked only if need be
    const tight = (i: number, j: number, l: number) => {
      const k = key(i, j, l);
      let t = grid.tight.get(k);
      if (t === undefined) {
        t = [
          [1, 0],
          [-1, 0],
          [0, 1],
          [0, -1],
        ].some(([di, dj]) => at(i + di, j + dj, l) === null && at(i + di, j + dj, 1 - l) === null);
        grid.tight.set(k, t);
      }
      return t;
    };
    const goalF = this.floorAt(b.x, b.z, b.floor ?? a.floor);
    if (goalF === null) return null;
    const gi = Math.round((b.x - B.minX) / G);
    const gj = Math.round((b.z - B.minZ) / G);
    const gl = lvl(goalF);
    // where we start: the nearest grid point you can step to (or the nearest one round it)
    let si = Math.round((a.x - B.minX) / G);
    let sj = Math.round((a.z - B.minZ) / G);
    let startF = onto(si, sj, a.floor);
    for (let r = 1; startF === null && r <= 2; r++)
      for (let di = -r; di <= r && startF === null; di++)
        for (let dj = -r; dj <= r && startF === null; dj++) {
          const f = onto(si + di, sj + dj, a.floor);
          if (f !== null) {
            si += di;
            sj += dj;
            startF = f;
          }
        }
    if (startF === null) return null;
    const fOf = new Map<number, number>();
    const g = new Map<number, number>();
    const from = new Map<number, number>();
    const open: { k: number; f: number }[] = []; // a binary heap on f
    const push = (k: number, f: number) => {
      open.push({ k, f });
      let i = open.length - 1;
      while (i > 0) {
        const p = (i - 1) >> 1;
        if (open[p].f <= open[i].f) break;
        [open[p], open[i]] = [open[i], open[p]];
        i = p;
      }
    };
    const pop = () => {
      const top = open[0];
      const last = open.pop()!;
      if (open.length) {
        open[0] = last;
        let i = 0;
        for (;;) {
          const l = i * 2 + 1;
          const r = l + 1;
          let m = i;
          if (l < open.length && open[l].f < open[m].f) m = l;
          if (r < open.length && open[r].f < open[m].f) m = r;
          if (m === i) break;
          [open[m], open[i]] = [open[i], open[m]];
          i = m;
        }
      }
      return top;
    };
    const h = (i: number, j: number, f: number) =>
      Math.hypot(cx(i) - b.x, cz(j) - b.z) + Math.abs(f - goalF) * 2;
    const k0 = key(si, sj, lvl(startF));
    fOf.set(k0, startF);
    g.set(k0, 0);
    push(k0, h(si, sj, startF));
    const closed = new Set<number>();
    let found = -1;
    while (open.length && closed.size < 60000) {
      const { k } = pop();
      if (closed.has(k)) continue;
      closed.add(k);
      const i = k % NX;
      const j = Math.floor(k / NX) % NZ;
      const f = fOf.get(k)!;
      if (Math.abs(i - gi) <= 1 && Math.abs(j - gj) <= 1 && lvl(f) === gl) {
        found = k;
        break;
      }
      const gk = g.get(k)!;
      for (let di = -1; di <= 1; di++)
        for (let dj = -1; dj <= 1; dj++) {
          if (!di && !dj) continue;
          const ni = i + di;
          const nj = j + dj;
          const nf = onto(ni, nj, f);
          if (nf === null) continue;
          if (di && dj && (onto(ni, j, f) === null || onto(i, nj, f) === null)) continue; // no cutting corners
          const nl = lvl(nf);
          const nk = key(ni, nj, nl);
          if (closed.has(nk)) continue;
          const cost = gk + (di && dj ? G * Math.SQRT2 : G) * (tight(ni, nj, nl) ? 2.5 : 1);
          if (cost >= (g.get(nk) ?? Infinity)) continue;
          g.set(nk, cost);
          fOf.set(nk, nf);
          from.set(nk, k);
          push(nk, cost + h(ni, nj, nf));
        }
    }
    if (found < 0) return null;
    const cells: { x: number; z: number; floor: number }[] = [];
    for (let k: number | undefined = found; k !== undefined; k = from.get(k))
      cells.push({ x: cx(k % NX), z: cz(Math.floor(k / NX) % NZ), floor: fOf.get(k)! });
    cells.reverse();
    const pts = [{ ...a }, ...cells.slice(1), { x: b.x, z: b.z, floor: goalF }];
    // straighten: from each point, on to the furthest one in a clear line (shoulders' room either side)
    const wide = (p: { x: number; z: number; floor: number }, q: { x: number; z: number }) => {
      if (!this.clearPath(p, q)) return false;
      const len = Math.hypot(q.x - p.x, q.z - p.z) || 1;
      const ox = (-(q.z - p.z) / len) * 0.28;
      const oz = ((q.x - p.x) / len) * 0.28;
      for (const sgn of [-1, 1]) {
        const p2 = { x: p.x + ox * sgn, z: p.z + oz * sgn, floor: p.floor };
        if (this.stepTo(p2.x, p2.z, p.floor) === null) continue; // already at a wall: the line itself must do
        if (!this.clearPath(p2, { x: q.x + ox * sgn, z: q.z + oz * sgn })) return false;
      }
      return true;
    };
    const out = [pts[0]];
    let i = 0;
    while (i < pts.length - 1) {
      let j = i + 1;
      while (j + 1 < pts.length && wide(pts[i], pts[j + 1])) j++;
      out.push(pts[j]);
      i = j;
    }
    return out;
  }

  /*
    The route guide: a line of soft light along the floor to where you go
    next (as a game marks the way), little dots every 55 cm with a pulse
    running along them towards the stop; laid on the floor's surface (on the
    stairs, each tread). Null clears it.
  */
  setGuide(path: { x: number; z: number; floor: number }[] | null) {
    const MAX = 260;
    if (!this.guide) {
      const geo = new THREE.CircleGeometry(0.045, 20);
      geo.rotateX(-Math.PI / 2);
      const mat = new THREE.MeshBasicMaterial({
        color: 0xffffff,
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        toneMapped: false,
      });
      const mesh = new THREE.InstancedMesh(geo, mat, MAX);
      mesh.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(MAX * 3), 3);
      mesh.count = 0;
      mesh.frustumCulled = false;
      mesh.renderOrder = 2;
      this.scene.add(mesh);
      this.disposables.push(geo, mat);
      this.guide = { mesh, along: [], len: 0 };
    }
    const gd = this.guide;
    const m4 = new THREE.Matrix4();
    let n = 0;
    gd.along = [];
    if (path && path.length > 1) {
      let total = 0;
      for (let i = 1; i < path.length; i++)
        total += Math.hypot(path[i].x - path[i - 1].x, path[i].z - path[i - 1].z);
      gd.len = total;
      let walked = 0;
      let next = 0.9; // the first dot a little ahead of you
      let f = path[0].floor;
      for (let i = 1; i < path.length && n < MAX; i++) {
        const p = path[i - 1];
        const q = path[i];
        const l = Math.hypot(q.x - p.x, q.z - p.z);
        while (next <= walked + l && next < total - 0.5 && n < MAX) {
          const t = l ? (next - walked) / l : 0;
          const x = p.x + (q.x - p.x) * t;
          const z = p.z + (q.z - p.z) * t;
          f = this.floorAt(x, z, f) ?? f;
          const y = (this.surfaceAt(x, z, f) ?? f) + 0.012;
          m4.makeTranslation(x, y, z);
          gd.mesh.setMatrixAt(n, m4);
          gd.along.push(next);
          n++;
          next += 0.55;
        }
        walked += l;
      }
    }
    gd.mesh.count = n;
    gd.mesh.instanceMatrix.needsUpdate = true;
  }
  private guide?: { mesh: THREE.InstancedMesh; along: number[]; len: number };
  /* the guide's dots: dim, a pulse of light running along them to the stop, fading far ahead */
  private glowGuide(time: number) {
    const gd = this.guide;
    if (!gd || !gd.mesh.count) return;
    const col = gd.mesh.instanceColor!;
    for (let k = 0; k < gd.mesh.count; k++) {
      const d = gd.along[k];
      const wave = (((time * 2.2 - d) % 4.4) + 4.4) % 4.4; // a pulse every 4.4 m, moving on
      const pulse = Math.exp(-wave * wave * 2.2);
      const near = Math.min(1, (d - 0.6) / 1.2); // fades in just ahead of you
      const far = Math.max(0.25, 1 - d / 34);
      const end = Math.min(1, (gd.len - d) / 1.2);
      const v = (0.32 + 0.9 * pulse) * near * far * Math.max(0.3, end);
      col.setXYZ(k, v, v * 0.93, v * 0.82);
    }
    col.needsUpdate = true;
  }

  /* The prism's plinth (you walk round it) */
  get prism() {
    return this.prismAt ? { x: this.prismAt.x, z: this.prismAt.z } : null;
  }
  /* The projects on the walls, in order */
  get films() {
    return this.projects;
  }

  /*
    The film you're looking at, if one is near enough (within 6.5 m, roughly
    straight ahead, and you're in front of it), else -1.
  */
  facing(x: number, z: number, yaw: number, floor = 0) {
    let best = -1;
    let bestScore = Infinity;
    const fx = -Math.sin(yaw);
    const fz = -Math.cos(yaw);
    this.layout.works.forEach((w, i) => {
      if (Math.abs((w.y ?? 0) - floor) > 2) return; // another floor
      const dx = w.x - x;
      const dz = w.z - z;
      const d = Math.hypot(dx, dz);
      if (d > 6.5 * w.scale || d < 0.3) return;
      if (dx * w.nx + dz * w.nz > 0) return; // behind its wall
      const cos = (dx * fx + dz * fz) / d;
      if (cos < Math.cos(0.42)) return; // more than ~24° off
      const score = d * (2 - cos);
      // and nothing in between (a wall: the film in the next room doesn't count)
      if (score < bestScore && this.worldOn) {
        const front = { x: w.x + w.nx * 0.75, z: w.z + w.nz * 0.75 };
        if (!this.clearPath({ x, z, floor }, front)) return;
      }
      if (score < bestScore) {
        bestScore = score;
        best = i;
      }
    });
    return best;
  }

  /*
    Play or pause film i in the room. The first time, it plays with sound
    from the start (YouTube or a video file; any other film playing with
    sound goes quiet); after that, play / pause. A stand-in's light stops or
    moves again. Returns whether it's now playing.
  */
  toggleWork(i: number) {
    const w = this.works[i];
    if (!w) return false;
    if (w.yt) {
      const yt = w.yt;
      const p = yt.player;
      if (!p) {
        // not loaded yet: load it now, and it starts with sound once ready
        yt.near = true;
        window.clearTimeout(yt.pending);
        yt.pending = undefined;
        if (!yt.started) this.loadWallYouTube(yt);
        this.quiet(i);
        this.sounding = i;
        return true;
      }
      if (this.sounding !== i) {
        this.quiet(i);
        this.sounding = i;
        p.unMute();
        p.seekTo(0, true);
        p.playVideo();
        return true;
      }
      if (p.getPlayerState() === 1) {
        p.pauseVideo();
        return false;
      }
      p.playVideo();
      return true;
    }
    if (w.video) {
      const v = w.video;
      if (this.sounding !== i) {
        this.quiet(i);
        this.sounding = i;
        v.muted = false;
        v.currentTime = 0;
        v.play().catch(() => {});
        return true;
      }
      if (v.paused) v.play().catch(() => {});
      else v.pause();
      return !v.paused;
    }
    w.paused = !w.paused;
    return !w.paused;
  }

  /* Is film i playing, and with sound? */
  workState(i: number) {
    const w = this.works[i];
    if (!w) return { playing: false, sound: false, real: false };
    const sound = this.sounding === i;
    if (w.yt) {
      const st = w.yt.player?.getPlayerState();
      return { playing: st === 1 || st === 3 || (sound && !w.yt.player), sound, real: true };
    }
    if (w.video) return { playing: !w.video.paused, sound, real: true };
    return { playing: !w.paused, sound: false, real: false };
  }

  /* Any film playing with sound goes back to playing quietly (but `except`). */
  private quiet(except = -1) {
    const i = this.sounding;
    if (i < 0 || i === except) return;
    const w = this.works[i];
    if (w?.yt?.player) {
      w.yt.player.mute();
      w.yt.player.playVideo();
    }
    if (w?.video) w.video.muted = true;
    this.sounding = -1;
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
    The gallery page: a shadow gap at the foot of every wall (as in the world,
    world.ts), the crisp dark line where a gallery wall stops short of the
    floor. Returns the entrance wall's, which stands aside with it.
  */
  private addShadowGaps(
    S: Surfaces,
    W: number,
    D: number,
    front: number,
    len: number,
    mid: number,
    open: number,
    back: number,
  ) {
    const walls = [
      { len, x: -W / 2, z: mid, ry: Math.PI / 2 },
      { len, x: W / 2, z: mid, ry: -Math.PI / 2 },
      { len: W - 2 * open, x: 0, z: -D, ry: 0 },
      { len: W - 2 * open, x: 0, z: -D - 0.2, ry: Math.PI }, // the far wall's back
      { len: back, x: -W / 2, z: -D - back / 2, ry: Math.PI / 2 },
      { len: back, x: W / 2, z: -D - back / 2, ry: -Math.PI / 2 },
      { len: W / 2 - 3, x: -(3 + (W / 2 - 3) / 2), z: -D - back, ry: 0 },
      { len: W / 2 - 3, x: 3 + (W / 2 - 3) / 2, z: -D - back, ry: 0 },
      { len: W, x: 0, z: front, ry: Math.PI },
    ];
    let entrance!: THREE.Group;
    walls.forEach((w, i) => {
      const g = new THREE.Group();
      if (i === walls.length - 1) entrance = g;
      g.position.set(w.x, 0, w.z);
      g.rotation.y = w.ry;
      const geo = new THREE.BoxGeometry(w.len, 0.035, 0.024);
      this.disposables.push(geo);
      const line = new THREE.Mesh(geo, S.gap);
      line.position.set(0, 0.0175, 0.01);
      g.add(line);
      this.scene.add(g);
    });
    return entrance;
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
    group.position.set(
      spot.x + spot.nx * 0.004,
      (spot.y ?? 0) + SCREEN.y,
      spot.z + spot.nz * 0.004,
    );
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
    // A YouTube film plays over the screen (a trailer file, if there is one, wins)
    const ytId = !p.trailer && p.youtube ? youtubeId(p.youtube) : undefined;
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
    } else if (p.image || ytId) {
      const tex = new THREE.TextureLoader().load(p.image ?? youtubeCoverJpeg(ytId!));
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.anisotropy = aniso;
      mat = new THREE.MeshBasicMaterial({ map: tex, toneMapped: false });
      this.disposables.push(tex);
    } else {
      const title = textTexture(
        (ctx, cw, ch) => {
          ctx.clearRect(0, 0, cw, ch);
          ctx.fillStyle = "#fff";
          ctx.font = `500 ${30 * (cw / 1600)}px Jost, ui-sans-serif, system-ui`;
          const text = p.title.toUpperCase();
          let x = 54 * (cw / 1600);
          for (const chr of text) {
            ctx.fillText(chr, x, ch - 52 * (ch / 900));
            x += ctx.measureText(chr).width + 9 * (cw / 1600);
          }
        },
        this.many ? 800 : 1600,
        this.many ? 450 : 900,
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
    if (ytId) w.yt = this.addWallYouTube(ytId);

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
        const k = cw / 1024; // drawn at 1024 wide, smaller when there are many
        ctx.scale(k, k);
        ctx.fillStyle = "#fbfaf7";
        ctx.fillRect(0, 0, 1024, 634);
        ctx.fillStyle = "#121212";
        ctx.font = "500 74px Jost, ui-sans-serif, system-ui";
        ctx.fillText(p.title, 70, 150, 884);
        ctx.fillStyle = "#6f6f6f";
        ctx.font = "400 46px Jost, ui-sans-serif, system-ui";
        ctx.fillText(`${p.year}${p.client ? `, for ${p.client}` : ""}`, 70, 230, 884);
        ctx.fillStyle = "#9a9a9a";
        ctx.font = "400 40px Jost, ui-sans-serif, system-ui";
        ctx.fillText(p.tags.join(", "), 70, 544, 884);
      },
      this.many ? 640 : 1024,
      this.many ? 396 : 634,
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

  /* A YouTube player over a wall screen (see WallYouTube). The iframe itself loads in playNear. */
  private addWallYouTube(id: string): WallYouTube {
    if (!this.css) {
      this.css = new CSS3DRenderer();
      const el = this.css.domElement;
      el.setAttribute("aria-hidden", "true");
      // Over the room, under everything else; clicks and scrolling go through to the room
      Object.assign(el.style, { position: "absolute", inset: "0", pointerEvents: "none" });
      this.canvas.after(el);
      const r = this.canvas.getBoundingClientRect();
      this.css.setSize(Math.max(1, r.width), Math.max(1, r.height));
    }
    const box = document.createElement("div");
    Object.assign(box.style, {
      width: `${YT_PX}px`,
      height: `${Math.round((YT_PX * SCREEN.h) / SCREEN.w)}px`,
      overflow: "hidden",
      position: "relative",
      pointerEvents: "none",
      // No background: until the video plays, the room's own screen (with the
      // cover, lit like the room) shows through, so nothing pops in on the way in
    });
    const obj = new CSS3DObject(box);
    obj.element.style.pointerEvents = "none";
    obj.visible = false;
    this.cssScene.add(obj);
    return { id, obj, box, started: false, placed: false, near: false };
  }

  /* Load a wall's YouTube player the first time it's needed; it then stays, looping. */
  private loadWallYouTube(yt: WallYouTube) {
    if (yt.started) return;
    yt.started = true;
    // Exactly the screen's size. (Not oversized and clipped to hide YouTube's
    // title bar: iPhone Safari doesn't clip a 3D-transformed iframe, so the
    // player spilled below the screen.)
    const wrap = document.createElement("div");
    Object.assign(wrap.style, {
      position: "absolute",
      inset: "0",
      pointerEvents: "none",
      opacity: "0", // shown only while it's playing; otherwise the cover shows, never black
      transition: "opacity 600ms ease",
    });
    const mount = document.createElement("div"); // YouTube replaces this with its iframe
    wrap.appendChild(mount);
    yt.box.appendChild(wrap);
    loadYouTubeApi()
      .then((YT) => {
        if (this.disposed) return;
        yt.player = new YT.Player(mount, {
          videoId: yt.id,
          host: YT_HOST,
          width: "100%",
          height: "100%",
          playerVars: ytPlayerVars(),
          events: {
            onReady: () => {
              const f = yt.player?.getIframe();
              if (f) {
                f.tabIndex = -1;
                Object.assign(f.style, {
                  display: "block",
                  width: "100%",
                  height: "100%",
                  border: "0",
                  pointerEvents: "none",
                });
              }
              // Some phones ignore autoplay in the embed but allow a muted play() call
              yt.player?.mute();
              yt.player?.playVideo();
              yt.poll = window.setInterval(() => yt.player && keepLooping(yt.player), 200);
            },
            // Playing (1): show it. Not started, paused, ended or cued (-1, 2, 0, 5), as
            // when a phone blocks autoplay: back to the cover. Buffering (3): leave as is.
            onStateChange: (e) => {
              if (e.data === 1) wrap.style.opacity = "1";
              else if (e.data !== 3) wrap.style.opacity = "0";
            },
          },
        });
      })
      .catch(() => {
        /* no YouTube (offline, blocked): the screen keeps the cover */
      });
  }

  /* Line the YouTube players up with their screens, and show only the ones you can see. */
  private updateWallYouTube() {
    if (!this.css) return;
    const toCam = new THREE.Vector3();
    const normal = new THREE.Vector3();
    let anyShown = false;
    this.works.forEach((w) => {
      const yt = w.yt;
      if (!yt) return;
      if (!yt.placed) {
        w.screen.updateWorldMatrix(true, false);
        w.screen.matrixWorld.decompose(yt.obj.position, yt.obj.quaternion, yt.obj.scale);
        yt.obj.scale.multiplyScalar(SCREEN.w / YT_PX);
        yt.placed = true;
      }
      // in front of the screen, not behind it
      normal.set(0, 0, 1).applyQuaternion(yt.obj.quaternion);
      toCam.copy(this.camera.position).sub(yt.obj.position);
      yt.obj.visible = yt.near && toCam.dot(normal) > 0.05;
      anyShown ||= yt.obj.visible;
    });
    this.clipPrism(anyShown);
    this.css.render(this.cssScene, this.camera);
  }

  /*
    The YouTube layer is drawn over the room, so it can't pass behind anything.
    The prism can stand in front of a far-wall film: cut the pyramid's outline
    out of the layer, and the room (which draws the glass over the screen)
    shows through there instead.
  */
  private clipPrism(anyShown: boolean) {
    const el = this.css!.domElement;
    const w = el.clientWidth;
    const h = el.clientHeight;
    let key = "";
    let clip = "";
    if (anyShown && this.prismPoints.length && w && h) {
      this.camera.updateMatrixWorld();
      const v = new THREE.Vector3();
      const pts: [number, number][] = [];
      for (const p of this.prismPoints) {
        v.copy(p).project(this.camera);
        if (v.z > 1) break; // behind you: it can't be in front of a film
        pts.push([((v.x + 1) / 2) * w, ((1 - v.y) / 2) * h]);
      }
      if (pts.length === this.prismPoints.length) {
        const hull = convexHull(pts);
        const ring = hull.map(([x, y]) => `${x.toFixed(1)}px ${y.toFixed(1)}px`);
        key = `${w}x${h}:${ring.join(",")}`;
        if (this.hq) {
          // Refracting glass: a clean hole, so the room's refraction shows there.
          // The whole layer, then the hull: with evenodd, the hull is a hole
          // (the seam back to the corner is drawn both ways, so it cancels out)
          clip = `polygon(evenodd, 0 0, ${w}px 0, ${w}px ${h}px, 0 ${h}px, 0 0, ${ring.join(", ")}, ${ring[0]})`;
        } else {
          // Plain see-through glass (phones): a soft hole. Inside the prism the live
          // video shows at (1 - the glass's opacity) over the room's glass, which is
          // just how a pane that faint mixes them
          const poly = hull.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
          const svg =
            `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}">` +
            `<path fill-rule="evenodd" fill="#fff" d="M0 0H${w}V${h}H0Z M${poly.replace(/ /g, " L")}Z"/>` +
            `<polygon fill="#fff" fill-opacity="${(1 - PHONE_GLASS_OPACITY).toFixed(2)}" points="${poly}"/></svg>`;
          clip = `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
        }
      }
    }
    if (key === this.clipKey) return; // unchanged: don't touch the style
    this.clipKey = key;
    const st = el.style as CSSStyleDeclaration & {
      webkitClipPath?: string;
      webkitMaskImage?: string;
    };
    const isMask = clip.startsWith("url(");
    st.clipPath = st.webkitClipPath = isMask ? "" : clip;
    st.maskImage = st.webkitMaskImage = isMask ? clip : "";
    st.maskSize = isMask ? "100% 100%" : "";
    st.maskRepeat = isMask ? "no-repeat" : "";
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
    this.layout = this.makeLayout(w / h);
    this.placeLabels();
    const dpr = Math.min(window.devicePixelRatio || 1, this.hq ? 2 : 1.75);
    this.renderer.setPixelRatio(dpr);
    this.renderer.setSize(w, h, false);
    this.css?.setSize(w, h);
    this.composer.setPixelRatio(dpr);
    this.composer.setSize(w, h);
    this.bloom.resolution.set((w * dpr) / 2, (h * dpr) / 2);
    this.film.uniforms.uRes.value.set(w * dpr, h * dpr);
    this.sharpen.uniforms.uRes.value.set(w * dpr, h * dpr);
    if (this.reflector) sizeFloorReflection(this.reflector, w * dpr, h * dpr);
    this.camera.aspect = w / h;
    // Taller-than-wide screens get a wider view so the screens still fit
    this.camera.fov = fovFor(w / h);
    if (this.stereo) {
      this.stereo.setSize(w, h);
      this.camera.aspect = w / 2 / h;
      this.camera.fov = 80;
    }
    this.camera.updateProjectionMatrix();
  }

  setPose(x: number, y: number, z: number, yaw: number, pitch = 0) {
    // Walk round the prism, never through it. Within PRISM_KEEP_OUT (R) of it,
    // a distance d becomes (d² + R²) / 2R: unchanged at R, smooth there (no kink),
    // and never less than R / 2 at the centre. Further away, nothing changes.
    const p = this.prismAt;
    if (p) {
      const R = PRISM_KEEP_OUT;
      const dx = x - p.x;
      const dz = z - p.z;
      const d = Math.hypot(dx, dz);
      if (d < R) {
        const to = (d * d + R * R) / (2 * R);
        const [ux, uz] = d > 1e-4 ? [dx / d, dz / d] : [1, 0];
        x = p.x + ux * to;
        z = p.z + uz * to;
      }
    }
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
    // walked away from the film playing with sound: it goes quiet
    if (this.sounding >= 0) {
      const k = stops.findIndex((s) => s.kind === "work" && s.index === this.sounding);
      if (stopIndex < 0 || Math.abs(k - stopIndex) > 2) this.quiet();
    }
    this.works.forEach((w, i) => {
      if (!w.video && !w.yt) return;
      const k = stops.findIndex((s) => s.kind === "work" && s.index === i);
      // From the overview every film is in view, so they all play.
      const atCentre = stops[stopIndex]?.kind === "centre";
      const near = stopIndex >= 0 && (Math.abs(k - stopIndex) <= 1 || atCentre);
      if (w.yt) {
        const yt = w.yt;
        yt.near = near;
        // Load it a moment after you first come near, not in the middle of the way
        // in (making a YouTube player stalls a frame or two)
        if (near && !yt.started && !yt.pending) {
          yt.pending = window.setTimeout(() => {
            yt.pending = undefined;
            if (yt.near && !this.disposed) this.loadWallYouTube(yt);
          }, YT_LOAD_DELAY);
        }
        return;
      }
      if (!w.video) return;
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
      y: s.y ?? 0, // its floor
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
    if (this.xr.session) return; // the headset draws (xrFrame)
    this.tick(time);
    this.worldLight();
    if (this.stereo) {
      // side by side for a VR holder: straight to the screen (no finishing passes)
      this.stereo.render(this.scene, this.camera);
      return;
    }
    this.composer.render();
    this.updateWallYouTube();
  }

  /* The world's doors out (About, Contact): picked as doors 2 and 3 */
  get worldDoors() {
    return this.world?.doors ?? [];
  }
  /* The tour's stop in front of the world's doors (-1 without the world) */
  worldDoorStop() {
    const places = this.world?.places ?? [];
    return this.layout.stops.findIndex(
      (st) => st.kind === "place" && places[st.index]?.name === "About & Contact",
    );
  }

  /* Catch the world's light again in a moment (its photographed surfaces have loaded) */
  private catchSoon() {
    const p = this.probe;
    if (!p || this.disposed) return;
    p.due.unshift(performance.now() - p.t0 + 120);
  }
  /* Catch the world's light into its probes (see `probe`) */
  private catchLight() {
    const p = this.probe;
    if (!p) return;
    for (const sp of p.spots) {
      p.cam.position.copy(sp.at);
      p.cam.update(this.renderer, this.scene);
      const next = p.pmrem.fromCubemap(p.rt.texture);
      if (this.scene.environment === sp.rt?.texture) this.scene.environment = next.texture;
      sp.rt?.dispose();
      sp.rt = next;
    }
  }
  /*
    Light by where you are: in the hall its studio light; in the world the
    light caught there (the atrium's, or the upper floor's), and a softer warm
    fill, easing across as you go through the portal or up the stairs.
  */
  private worldLight() {
    const p = this.probe;
    if (!p) return;
    const since = performance.now() - p.t0;
    if (p.due.length && since > p.due[0]) {
      p.due.shift();
      this.catchLight();
    }
    const at = this.camera.getWorldPosition(this.tmpV);
    const inWorld = at.z < this.zA - 0.6;
    const up = at.y > UPPER.y + 0.6;
    // the light caught where you are: the hall's, the atrium's, the upper floor's
    const sp = p.spots[inWorld ? (up ? 2 : 1) : 0];
    const env = sp.rt?.texture ?? p.hallEnv;
    if (this.scene.environment !== env) this.scene.environment = env;
    const k = 0.08;
    const goal = sp.rt ? GalleryScene.WORLD_ENV : 0.16;
    this.scene.environmentIntensity += (goal - this.scene.environmentIntensity) * k;
    // the same daylight everywhere; upstairs, under the rooms' laylights, even and bright, as a laylight's is
    this.hemi.intensity += ((up ? 1.25 : 0.75) - this.hemi.intensity) * k;
  }
  private tmpV = new THREE.Vector3();

  private tick(time: number) {
    this.world?.update(time);
    this.glowGuide(time);
    this.works.forEach((w) => {
      if (w.shader && !w.paused) w.shader.uniforms.uTime.value = time;
    });
    this.glimpses.forEach((m) => (m.uniforms.uTime.value = time));
    this.film.uniforms.uTime.value = time;
  }

  /* ---------- VR ---------- */

  /* Can this device step inside (a headset's browser: Meta Quest, Apple Vision Pro, Pico…)? */
  static async vrSupported() {
    try {
      return !!navigator.xr && (await navigator.xr.isSessionSupported("immersive-vr"));
    } catch {
      return false;
    }
  }

  get inVR() {
    return !!this.xr.session;
  }

  /*
    Step inside, standing where `at` is. The headset draws the room directly
    (WebXR can't take the finishing passes: no glow or vignette there, and the
    floor's mirror becomes plain stone). Pointing and selecting (a controller's
    trigger, or on Vision Pro looking and pinching) at a film walks you to it;
    at a door, to the doors; at the floor, to that spot. A thumbstick turns
    you (left / right, 30° at a time) and walks you between stops (forward /
    back). `onPick` hears where you went, `onEnd` when you take it off.
  */
  async enterVR(
    at: Pose,
    stopIndex: number,
    onPick: (p: Pick, stop: number) => void,
    onEnd: () => void,
  ) {
    if (!navigator.xr || this.xr.session) return;
    const session = await navigator.xr.requestSession("immersive-vr", {
      optionalFeatures: ["local-floor", "bounded-floor", "hand-tracking"],
    });
    const r = this.renderer;
    r.xr.enabled = true;
    r.xr.setFramebufferScaleFactor(1);
    let floorLevel = true;
    r.xr.setReferenceSpaceType("local-floor");
    try {
      await r.xr.setSession(session);
    } catch {
      // no floor-level space: stand the rig at eye height instead
      floorLevel = false;
      r.xr.setReferenceSpaceType("local");
      await r.xr.setSession(session);
    }
    this.xr = { ...this.xr, session, onPick, onEnd, stick: 0, time0: performance.now() };
    this.camera.position.set(0, 0, 0);
    this.camera.rotation.set(0, 0, 0);
    this.xrFloorLevel = floorLevel;
    const f0 = this.floorAt(at.x, at.z, 0) ?? 0;
    this.rig.position.set(at.x, f0 + (floorLevel ? 0 : ROOM.eye), at.z);
    this.rig.rotation.set(0, at.yaw, 0);
    this.stopIndex = stopIndex;
    // no mirror in VR: the floor is solid stone
    if (this.reflector) this.reflector.visible = false;
    this.floorMat.transparent = false;
    this.floorMat.opacity = 1;
    this.floorMat.needsUpdate = true;
    if (this.css) this.css.domElement.style.visibility = "hidden";

    // a thin ray from each controller you point with (not for hands or gaze)
    for (let i = 0; i < 4; i++) {
      const c = r.xr.getController(i);
      const ray = new THREE.Line(
        new THREE.BufferGeometry().setFromPoints([
          new THREE.Vector3(),
          new THREE.Vector3(0, 0, -1),
        ]),
        new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.55 }),
      );
      ray.scale.z = 4;
      ray.visible = false;
      c.add(ray);
      c.addEventListener("connected", (e) => {
        ray.visible =
          (e as unknown as { data: XRInputSource }).data.targetRayMode === "tracked-pointer";
      });
      c.addEventListener("disconnected", () => (ray.visible = false));
      this.rig.add(c);
      this.xr.rays.push(ray);
    }

    // every input's select, whichever slot it's in (Vision Pro's look-and-pinch
    // comes as inputs 2 and 3 when hands are tracked)
    session.addEventListener("select", (e) => this.xrSelect(e as XRInputSourceEvent));
    session.addEventListener("end", () => this.leaveVR());
    r.setAnimationLoop((t, frame) => this.xrFrame(t, frame));
    this.playNear(stopIndex);
  }

  exitVR() {
    this.xr.session?.end().catch(() => this.leaveVR());
  }

  private stopIndex = 0;
  private xrFloorLevel = true;
  /* every floor you can point at to go there */
  private get floorMeshes() {
    return this.world ? [this.floor, ...this.world.floors] : [this.floor];
  }

  private leaveVR() {
    if (!this.xr.session) return;
    const r = this.renderer;
    r.setAnimationLoop(null);
    r.xr.enabled = false;
    for (let i = 0; i < 4; i++) this.rig.remove(r.xr.getController(i));
    this.xr.rays.forEach((l) => {
      l.parent?.remove(l);
      l.geometry.dispose();
      (l.material as THREE.Material).dispose();
    });
    const onEnd = this.xr.onEnd;
    this.xr = { session: null, stick: 0, rays: [], time0: 0 };
    this.rig.position.set(0, 0, 0);
    this.rig.rotation.set(0, 0, 0);
    if (this.reflector) {
      this.reflector.visible = true;
      this.floorMat.transparent = true;
      this.floorMat.opacity = 0.84;
      this.floorMat.needsUpdate = true;
    }
    if (this.css) this.css.domElement.style.visibility = "";
    // back to the window's own size and lens
    this.setSize(
      this.canvas.clientWidth || window.innerWidth,
      this.canvas.clientHeight || window.innerHeight,
    );
    onEnd?.();
  }

  /* Where the headset is, inside the rig (metres, and which way it faces). */
  private headInRig(frame: XRFrame) {
    const ref = this.renderer.xr.getReferenceSpace();
    const pose = ref ? frame.getViewerPose(ref) : null;
    if (!pose) return { x: 0, z: 0, yaw: 0 };
    const { position: p, orientation: o } = pose.transform;
    const q = new THREE.Quaternion(o.x, o.y, o.z, o.w);
    const e = new THREE.Euler().setFromQuaternion(q, "YXZ");
    return { x: p.x, z: p.z, yaw: e.y };
  }

  /* Move the rig so your head ends up standing at `to`, facing its yaw. */
  private teleport(frame: XRFrame, to: Pose, keepFacing = false, floor?: number) {
    const head = this.headInRig(frame);
    // stand on the floor there (upstairs, on the stairs)
    const f =
      floor ??
      this.floorAt(to.x, to.z, this.rig.position.y - (this.xrFloorLevel ? 0 : ROOM.eye)) ??
      0;
    this.rig.position.y = f + (this.xrFloorLevel ? 0 : ROOM.eye);
    const yaw = keepFacing ? this.rig.rotation.y : to.yaw - head.yaw;
    const c = Math.cos(yaw);
    const sn = Math.sin(yaw);
    // the head's offset in the rig, turned by the rig's new yaw
    const hx = head.x * c + head.z * sn;
    const hz = -head.x * sn + head.z * c;
    this.rig.rotation.y = yaw;
    this.rig.position.x = to.x - hx;
    this.rig.position.z = to.z - hz;
  }

  private goToStop(frame: XRFrame, k: number) {
    const stops = this.layout.stops;
    const st = stops[Math.max(0, Math.min(stops.length - 1, k))];
    const i = stops.indexOf(st);
    this.stopIndex = i;
    this.teleport(frame, st);
    this.playNear(i);
    return i;
  }

  private xrSelect(e: XRInputSourceEvent) {
    const ref = this.renderer.xr.getReferenceSpace();
    const pose = ref ? e.frame.getPose(e.inputSource.targetRaySpace, ref) : null;
    if (!pose) return;
    // the ray, from the rig's space into the room's
    const m = new THREE.Matrix4().fromArray(pose.transform.matrix);
    this.rig.updateMatrixWorld();
    m.premultiply(this.rig.matrixWorld);
    const origin = new THREE.Vector3().setFromMatrixPosition(m);
    const dir = new THREE.Vector3(0, 0, -1).transformDirection(m);
    this.raycaster.set(origin, dir);
    const hit = this.raycaster.intersectObjects([...this.pickables, ...this.floorMeshes], false)[0];
    if (!hit) return;
    const pick = hit.object.userData.pick as Pick | undefined;
    const stops = this.layout.stops;
    if (pick?.kind === "bench") {
      // stand by the bench, facing the wall on the side you pointed from
      const b = this.benches[pick.index];
      const seat = b.seats.reduce((a, c) =>
        Math.hypot(c.x - origin.x, c.z - origin.z) < Math.hypot(a.x - origin.x, a.z - origin.z)
          ? c
          : a,
      );
      this.teleport(e.frame, {
        x: seat.x - Math.sin(seat.yaw) * -0.5,
        z: seat.z - Math.cos(seat.yaw) * -0.5,
        yaw: seat.yaw,
      });
    } else if (pick) {
      const k =
        pick.kind === "work"
          ? stops.findIndex((s) => s.kind === "work" && s.index === pick.index)
          : pick.index >= 2
            ? this.worldDoorStop() // the world's doors (About, Contact)
            : stops.findIndex((s) => s.kind === "doors");
      const i = this.goToStop(e.frame, k);
      this.xr.onPick?.(pick, i);
    } else {
      // the floor (any floor): stand there, if you can stand there
      const { x, z } = hit.point;
      const f = this.floorAt(x, z, hit.point.y);
      if (f === null || Math.abs(f - hit.point.y) > 0.3 || this.blocked(x, z, f)) return;
      this.teleport(e.frame, { x, z, yaw: 0 }, true, f);
    }
  }

  private xrFrame(time: number, frame?: XRFrame) {
    if (!frame || !this.xr.session) return;
    this.tick((performance.now() - this.xr.time0) / 1000);
    this.worldLight();
    // thumbsticks: turn and walk, one notch at a time
    let sx = 0;
    let sy = 0;
    for (const src of this.xr.session.inputSources) {
      const a = src.gamepad?.axes;
      if (!a) continue;
      const x = a.length >= 4 ? a[2] : a[0];
      const y = a.length >= 4 ? a[3] : a[1];
      if (Math.abs(x) > Math.abs(sx)) sx = x;
      if (Math.abs(y) > Math.abs(sy)) sy = y;
    }
    const pushed = Math.max(Math.abs(sx), Math.abs(sy));
    if (this.xr.stick && pushed < 0.3) this.xr.stick = 0;
    if (!this.xr.stick && pushed > 0.75) {
      this.xr.stick = 1;
      if (Math.abs(sx) > Math.abs(sy)) {
        // turn about where you stand
        const head = this.headInRig(frame);
        const before = new THREE.Vector3(head.x, 0, head.z).applyMatrix4(this.rig.matrixWorld);
        this.rig.rotation.y += sx > 0 ? -Math.PI / 6 : Math.PI / 6;
        this.rig.updateMatrixWorld();
        const after = new THREE.Vector3(head.x, 0, head.z).applyMatrix4(this.rig.matrixWorld);
        this.rig.position.x += before.x - after.x;
        this.rig.position.z += before.z - after.z;
      } else {
        const cur = this.stopIndex > this.layout.end ? 0 : this.stopIndex;
        const i = this.goToStop(frame, Math.min(this.layout.end, cur + (sy < 0 ? 1 : -1)));
        const st = this.layout.stops[i];
        this.xr.onPick?.(st.kind === "work" ? { kind: "work", index: st.index } : null, i);
      }
    }
    // each ray reaches as far as what it points at
    this.xr.rays.forEach((ray) => {
      if (!ray.visible || !ray.parent) return;
      ray.parent.updateMatrixWorld();
      const o = new THREE.Vector3().setFromMatrixPosition(ray.parent.matrixWorld);
      const d = new THREE.Vector3(0, 0, -1).transformDirection(ray.parent.matrixWorld);
      this.raycaster.set(o, d);
      const hit = this.raycaster.intersectObjects(
        [...this.pickables, ...this.floorMeshes],
        false,
      )[0];
      ray.scale.z = hit ? hit.distance : 4;
    });
    this.renderer.render(this.scene, this.camera);
  }

  /*
    Which way a phone is pointing, as a yaw and pitch (radians) in the room's
    terms (from the browser's alpha / beta / gamma and the screen's turn), for
    looking round the room by moving the phone.
  */
  static lookFromDevice(alpha: number, beta: number, gamma: number, screenAngle: number) {
    const d = Math.PI / 180;
    const q = new THREE.Quaternion().setFromEuler(
      new THREE.Euler(beta * d, alpha * d, -gamma * d, "YXZ"),
    );
    q.multiply(new THREE.Quaternion(-Math.sqrt(0.5), 0, 0, Math.sqrt(0.5))); // the camera looks out of the back of the phone
    q.multiply(
      new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), -screenAngle * d),
    );
    const e = new THREE.Euler().setFromQuaternion(q, "YXZ");
    return { yaw: e.y, pitch: e.x };
  }

  /* ---------- side by side, for a phone in a VR holder ---------- */

  setStereo(on: boolean) {
    if (on && !this.stereo) {
      this.stereo = new StereoEffect(this.renderer);
      this.stereo.setEyeSeparation(0.064);
      const w = this.canvas.clientWidth || window.innerWidth;
      const h = this.canvas.clientHeight || window.innerHeight;
      this.stereo.setSize(w, h);
      // each eye gets half the width: a lens for that shape
      this.camera.aspect = w / 2 / h;
      this.camera.fov = 80;
      this.camera.updateProjectionMatrix();
      if (this.css) this.css.domElement.style.visibility = "hidden";
    } else if (!on && this.stereo) {
      this.stereo = undefined;
      if (this.css) this.css.domElement.style.visibility = "";
      this.setSize(
        this.canvas.clientWidth || window.innerWidth,
        this.canvas.clientHeight || window.innerHeight,
      );
      this.renderer.setScissorTest(false);
    }
  }

  dispose() {
    this.exitVR();
    this.works.forEach((w) => {
      if (w.video) {
        w.video.pause();
        w.video.removeAttribute("src");
        w.video.load();
      }
    });
    this.disposed = true;
    this.works.forEach((w) => {
      if (!w.yt) return;
      window.clearTimeout(w.yt.pending);
      window.clearInterval(w.yt.poll);
      w.yt.player?.destroy();
    });
    this.css?.domElement.remove(); // and the YouTube players in it
    if (this.probe) {
      this.probe.rt.dispose();
      this.probe.spots.forEach((sp) => sp.rt?.dispose());
      this.probe.pmrem.dispose();
    }
    this.disposables.forEach((d) => d.dispose());
    this.composer.dispose();
    this.renderer.dispose();
  }
}
