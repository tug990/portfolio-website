import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { ROOM, type GalleryScene } from "./GalleryScene";

/*
  The prism journey: from the logo, through a corridor of glass, into the gallery.

  It is real architecture built in front of the gallery's entrance, in the
  gallery's own scene, drawn by the gallery's own renderer, camera and
  post-processing. The corridor has exactly the room's cross-section (10 x
  4.2 m, floor at 0), so its far end *is* the room: the screens, the prism,
  the walls and the bench come into view through it and fill the frame as
  the camera walks in. There is no second renderer, no mask, no picture in a
  picture, and nothing to swap at the end.

  Coordinates (metres, gallery world space)
    x across, centred on the room's axis; y up from the floor; z along the
    corridor. The corridor runs from z = F (the room's entrance plane) to
    z = F + length (the facade with the logo doors). The camera travels -z.

  Parts
    facade      dark polished wall at the entrance, with a doorway the size
                and shape of the logo; the logo's two panels are its doors
    frames      U-shaped portal ribs every `frameSpacing`, one InstancedMesh,
                dark polished framing, an emissive edge on their inner faces
    glass       structural glass between the ribs (walls and ceiling) with a
                Fresnel shader; on capable devices the ceiling is physical
                prism glass (transmission, IOR 1.5, dispersion)
    shell       the light box behind the glass: soft spectral light panels
    floor       dark polished glass reflecting the corridor (a mirrored copy
                of the frames and ribbons beneath a semi-transparent floor)
    ribbons     a few continuous light ribbons (CatmullRom + TubeGeometry)
    particles   dust in the light, each with a position, velocity, size,
                lifetime and fade, drifting against the camera's motion
*/

export type JourneyQuality = "high" | "medium" | "low";

export const CORRIDOR = {
  width: ROOM.W,
  height: ROOM.H,
  length: 30,
  frameSpacing: 2.0, // rounded so a whole number of bays fits
  bar: 0.07, // the frame's face width, seen from inside
  frameDepth: 0.22, // along the corridor
  cavity: 0.9, // between the glass and the light box behind it
  porch: 9, // floor in front of the facade
};

const QUALITY = {
  high: { particles: 500, ribbons: 1, physicalGlass: true, mirror: true, outerGlass: true },
  medium: { particles: 300, ribbons: 1, physicalGlass: false, mirror: true, outerGlass: false },
  low: { particles: 160, ribbons: 1, physicalGlass: false, mirror: false, outerGlass: false },
};

// Logo shapes (logo pixels, y down) -> metres, with the top of the gap at the origin
const PX = 4.0 / 428;
const LEFT = [530, 258, 620, 301, 620, 640, 530, 686];
const RIGHT = [668, 324, 745, 361, 745, 686, 668, 640];
const FOCUS = { x: 644, y: 318 };
const LOGO_BOTTOM = 0.1; // the doors stand just off the floor
const FOCUS_Y = LOGO_BOTTOM + (686 - FOCUS.y) * PX; // height of the logo's focus point
const DOORWAY = {
  x0: (526 - FOCUS.x) * PX,
  x1: (749 - FOCUS.x) * PX,
  y0: 0,
  y1: FOCUS_Y + (FOCUS.y - 254) * PX,
};

const SPECTRUM = /* glsl */ `
  vec3 spectrum(float t) {
    t = fract(t);
    vec3 c = mix(vec3(0.48, 0.16, 1.00), vec3(0.16, 0.36, 1.00), smoothstep(0.00, 0.16, t)); // violet, electric blue
    c = mix(c, vec3(0.15, 0.85, 1.00), smoothstep(0.16, 0.32, t));                           // cyan
    c = mix(c, vec3(0.95, 0.95, 1.00), smoothstep(0.34, 0.39, t));                           // a thread of white
    c = mix(c, vec3(1.00, 0.62, 0.18), smoothstep(0.41, 0.56, t));                           // amber
    c = mix(c, vec3(1.00, 0.22, 0.72), smoothstep(0.58, 0.78, t));                           // magenta
    c = mix(c, vec3(0.55, 0.28, 1.00), smoothstep(0.78, 1.00, t));
    return c;
  }
`;

const COMMON = /* glsl */ `
  uniform float uTime;
  uniform float uWarm;  // 0 in the corridor, 1 arriving in the warm room
  uniform float uF;     // z of the room's entrance
  uniform float uLen;   // corridor length
  ${SPECTRUM}
  // Where along the corridor (0 at the room, 1 at the facade) a point is
  float along(vec3 p) { return clamp((p.z - uF) / uLen, 0.0, 1.0); }
  // The corridor's light at a place: violet at the doors, through blue and
  // cyan, to warm white at the room's end
  vec3 corridorHue(float a) { return spectrum(0.06 + 0.40 * (1.0 - a)); }
  // Prism glass, as the storyboard has it: layered vertical panes with bright
  // seams, broad angled flares with the spectrum spread across each, over deep violet.
  // q: (along the corridor, up the wall); side: which wall
  vec3 prismGlass(vec2 q, float side, float top) {
    float seam = fract(q.x / 0.9 + side * 0.31);
    float seamL = exp(-min(seam, 1.0 - seam) * 80.0);
    float f1 = fract((q.x * 0.55 + q.y * 1.0) / 3.2 + side * 0.37 + uTime * 0.05);
    float b1 = smoothstep(0.0, 0.1, f1) * smoothstep(0.4, 0.2, f1);
    float f2 = fract((q.x * 0.4 - q.y * 1.3) / 4.1 + 0.6 + side * 0.21);
    float b2 = smoothstep(0.0, 0.08, f2) * smoothstep(0.28, 0.14, f2);
    vec3 base = mix(vec3(0.04, 0.025, 0.14), vec3(0.13, 0.06, 0.26), smoothstep(0.0, top, q.y));
    // saturated: the white thread of the spectrum taken out, so flares stay colour
    vec3 h1 = spectrum(f1 * 2.4 + 0.05);
    vec3 h2 = spectrum(f2 * 3.2 + 0.5);
    h1 -= min(h1.r, min(h1.g, h1.b)) * 0.85;
    h2 -= min(h2.r, min(h2.g, h2.b)) * 0.85;
    return base + h1 * b1 * 0.75 + h2 * b2 * 0.45 + vec3(0.7, 0.6, 1.0) * seamL * 0.3;
  }

  // A procedural environment for reflections: what the corridor looks like
  // in direction r from point p (both ends bright, the light boxes at the sides)
  vec3 env(vec3 r, vec3 p) {
    float a = along(p);
    vec3 room = vec3(1.0, 0.80, 0.58) * pow(max(-r.z, 0.0), 10.0) * 0.9;  // the gallery, warm
    vec3 door = vec3(0.45, 0.30, 1.0) * pow(max(r.z, 0.0), 10.0) * 0.7;   // back towards the doors
    vec3 side = corridorHue(a) * (1.0 - abs(r.z)) * 0.35;                 // the light boxes
    vec3 sky = vec3(0.75, 0.85, 1.0) * pow(max(r.y, 0.0), 6.0) * 0.4;     // the light slot above
    return room + door + side + sky;
  }
`;

const VERT_WORLD = /* glsl */ `
  varying vec3 vW; varying vec3 vN; varying vec2 vUv;
  #ifdef USE_INSTANCING_COLOR
    varying vec3 vColor;
  #endif
  void main() {
    vUv = uv;
    mat4 m = modelMatrix;
    #ifdef USE_INSTANCING
      m = m * instanceMatrix;
    #endif
    #ifdef USE_INSTANCING_COLOR
      vColor = instanceColor;
    #endif
    vec4 w = m * vec4(position, 1.0);
    vW = w.xyz;
    vN = normalize(mat3(m) * normal);
    gl_Position = projectionMatrix * viewMatrix * w;
  }
`;

type Uniforms = {
  uTime: { value: number };
  uWarm: { value: number };
  uF: { value: number };
  uLen: { value: number };
};

const smooth = (a: number, b: number, x: number) => {
  const k = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return k * k * (3 - 2 * k);
};

/* Smooth, never-reversing interpolation through (t, u) keys (Fritsch-Carlson). */
function monotone(keys: [number, number][], t: number) {
  const n = keys.length;
  if (t <= keys[0][0]) return keys[0][1];
  if (t >= keys[n - 1][0]) return keys[n - 1][1];
  const d: number[] = [];
  for (let i = 0; i < n - 1; i++)
    d.push((keys[i + 1][1] - keys[i][1]) / (keys[i + 1][0] - keys[i][0]));
  const m: number[] = [d[0] * 0.5];
  for (let i = 1; i < n - 1; i++)
    m.push(d[i - 1] * d[i] <= 0 ? 0 : (2 * d[i - 1] * d[i]) / (d[i - 1] + d[i]));
  m.push(0); // arrive gently
  m[0] = 0; // start gently
  let i = 0;
  while (t > keys[i + 1][0]) i++;
  const h = keys[i + 1][0] - keys[i][0];
  const s = (t - keys[i][0]) / h;
  const s2 = s * s;
  const s3 = s2 * s;
  return (
    (2 * s3 - 3 * s2 + 1) * keys[i][1] +
    (s3 - 2 * s2 + s) * h * m[i] +
    (-2 * s3 + 3 * s2) * keys[i + 1][1] +
    (s3 - s2) * h * m[i + 1]
  );
}

// The same spectrum on the CPU, for instance colours
const STOPS: [number, number, number, number][] = [
  [0, 0.48, 0.16, 1],
  [0.16, 0.16, 0.36, 1],
  [0.32, 0.15, 0.85, 1],
  [0.37, 0.95, 0.95, 1],
  [0.52, 1, 0.62, 0.18],
  [0.7, 1, 0.22, 0.72],
  [1, 0.55, 0.28, 1],
];
function spectrumRGB(t: number, out = new THREE.Color()) {
  t = t - Math.floor(t);
  for (let i = 1; i < STOPS.length; i++) {
    const [b, ...cb] = STOPS[i];
    const [a, ...ca] = STOPS[i - 1];
    if (t <= b) {
      const k = smooth(a, b, t);
      return out.setRGB(
        ca[0] + (cb[0] - ca[0]) * k,
        ca[1] + (cb[1] - ca[1]) * k,
        ca[2] + (cb[2] - ca[2]) * k,
      );
    }
  }
  return out.setRGB(STOPS[0][1], STOPS[0][2], STOPS[0][3]);
}

export class PrismTunnel {
  private gallery: GalleryScene;
  private root = new THREE.Group();
  private mirror = new THREE.Group();
  private u: Uniforms;
  private disposables: { dispose: () => void }[] = [];
  private q: (typeof QUALITY)[JourneyQuality];
  private F: number;
  private Fe: number;
  private leftDoor!: THREE.Group;
  private rightDoor!: THREE.Group;
  private facadeGlow = { value: 0 };
  private exitFade = { value: 0 };
  private particles!: THREE.Points;
  private particleMat!: THREE.ShaderMaterial;
  private doorFraction = 0.4;
  private active = false;
  private path?: {
    key: string;
    curve: THREE.CatmullRomCurve3;
    len: number;
    keys: [number, number][];
  };
  private look = new THREE.Vector3();
  private frameTimes: number[] = [];
  private lastFrame = 0;
  private reduced = false;
  private floorMat?: THREE.ShaderMaterial;

  constructor(gallery: GalleryScene, opts: { quality: JourneyQuality }) {
    this.gallery = gallery;
    this.q = QUALITY[opts.quality];
    this.F = gallery.front;
    this.Fe = this.F + CORRIDOR.length;
    this.u = {
      uTime: { value: 0 },
      uWarm: { value: 0 },
      uF: { value: this.F },
      uLen: { value: CORRIDOR.length },
    };
    this.mirror.scale.y = -1; // the floor's reflection
    this.root.add(this.mirror);

    this.addShell();
    this.addFrames();
    this.addGlass();
    this.addFloor();
    this.addCornerLines();
    this.addExitGlass();
    this.addFacade();
    this.addDoors();
    this.addRibbons(this.q.ribbons);
    this.addParticles(this.q.particles);
    if (!this.q.mirror) this.mirror.visible = false;

    // Seen by the camera, but not by the room's own floor mirror or the picker
    this.root.traverse((o) => {
      o.layers.set(1);
      o.frustumCulled = false;
    });
    this.root.visible = false;
    gallery.addJourney(this.root);
  }

  private keep<T extends { dispose: () => void }>(...t: T[]) {
    this.disposables.push(...t);
    return t[0];
  }

  private shader(
    fragment: string,
    opts: {
      vertex?: string;
      additive?: boolean;
      extra?: Record<string, THREE.IUniform>;
      side?: THREE.Side;
      transparent?: boolean;
    } = {},
  ) {
    const m = new THREE.ShaderMaterial({
      uniforms: { ...this.u, ...(opts.extra ?? {}) },
      vertexShader: opts.vertex ?? VERT_WORLD,
      fragmentShader: fragment,
      side: opts.side ?? THREE.FrontSide,
    });
    if (opts.additive) {
      m.transparent = true;
      m.depthWrite = false;
      m.blending = THREE.AdditiveBlending;
    } else if (opts.transparent) {
      m.transparent = true;
    }
    return this.keep(m);
  }

  /* An InstancedMesh, and (optionally) its reflection in the floor sharing the same instances. */
  private instanced(
    geo: THREE.BufferGeometry,
    mat: THREE.Material,
    matrices: THREE.Matrix4[],
    colors?: THREE.Color[],
    mirrored = true,
  ) {
    const m = new THREE.InstancedMesh(geo, mat, matrices.length);
    matrices.forEach((x, i) => m.setMatrixAt(i, x));
    colors?.forEach((c, i) => m.setColorAt(i, c));
    this.root.add(m);
    if (mirrored) {
      const r = new THREE.InstancedMesh(geo, mat, matrices.length);
      r.instanceMatrix = m.instanceMatrix;
      if (m.instanceColor) r.instanceColor = m.instanceColor;
      r.renderOrder = -6; // under the floor, drawn before it
      this.mirror.add(r);
    }
    this.keep(geo);
    return m;
  }

  /* ---------- geometry: a parametric corridor ---------- */

  private bays() {
    const n = Math.max(4, Math.round(CORRIDOR.length / CORRIDOR.frameSpacing));
    return { n, gap: CORRIDOR.length / n };
  }

  /* The ribs: a U of three bars per frame (two posts and a lintel), every bay. */
  private addFrames() {
    const { width: W, height: H, bar, frameDepth: d } = CORRIDOR;
    const LIFT = 0.02; // off the floor, so the frame and its reflection never touch the floor plane
    const box = (x0: number, x1: number, y0: number, y1: number) => {
      const g = new THREE.BoxGeometry(x1 - x0, y1 - y0, d);
      g.translate((x0 + x1) / 2, (y0 + y1) / 2, 0);
      return g;
    };
    // a slim profile, just proud of the glass
    const back = 0.04;
    const parts = [
      box(-W / 2 - back, -W / 2 + bar, LIFT, H - bar),
      box(W / 2 - bar, W / 2 + back, LIFT, H - bar),
      box(-W / 2 - back, W / 2 + back, H - bar, H + back),
    ];
    const ring = mergeGeometries(parts)!;
    parts.forEach((p) => p.dispose());

    // Dark polished framing: almost black, with the corridor's light in its reflections
    const mat = this.shader(/* glsl */ `
      ${COMMON}
      varying vec3 vW; varying vec3 vN;
      void main() {
        vec3 n = normalize(vN);
        vec3 v = normalize(cameraPosition - vW);
        vec3 r = reflect(-v, n);
        float fres = 0.04 + 0.96 * pow(1.0 - max(dot(n, v), 0.0), 5.0);
        vec3 c = vec3(0.006, 0.005, 0.01) + env(r, vW) * (0.02 + 0.32 * fres);
        gl_FragColor = vec4(c, 1.0);
      }`);

    const { n, gap } = this.bays();
    const mats: THREE.Matrix4[] = [];
    for (let k = 0; k < n; k++)
      mats.push(new THREE.Matrix4().makeTranslation(0, 0, this.F + k * gap));
    this.instanced(ring, mat, mats);

    // The light along each frame's inner edge: posts and lintel...
    const t = 0.02;
    const ins = 0.006; // stands proud of the frame by this much
    const eParts = [
      box(-W / 2 + bar - t + ins, -W / 2 + bar + ins, 0.06, H - bar),
      box(W / 2 - bar - ins, W / 2 - bar + t - ins, 0.06, H - bar),
      box(-W / 2 + bar, W / 2 - bar, H - bar - ins, H - bar - ins + t),
    ];
    eParts.forEach((g) => g.scale(1, 1, 0.035 / d));
    const edge = mergeGeometries(eParts)!;
    eParts.forEach((p) => p.dispose());
    const edgeMat = this.shader(/* glsl */ `
      ${COMMON}
      varying vec3 vW; varying vec3 vColor;
      void main() {
        float a = along(vW);
        // a slow pulse of light running towards the room
        float pulse = pow(0.5 + 0.5 * sin(a * 18.0 + uTime * 5.0), 8.0);
        vec3 c = mix(vColor, vec3(1.0, 0.86, 1.0), 0.6) * (2.0 + 0.8 * pulse);
        c = mix(c, vec3(1.0, 0.8, 0.6) * 2.0, uWarm * 0.5);
        gl_FragColor = vec4(c, 1.0);
      }`);
    const colors = mats.map((_, k) => spectrumRGB(0.06 + 0.4 * (1 - k / n)).multiplyScalar(1.0));
    this.instanced(edge, edgeMat, mats, colors);

    // ...and an inlay across the floor
    const inlay = new THREE.PlaneGeometry(W - 2 * bar, 0.035);
    inlay.rotateX(-Math.PI / 2);
    const inlayMat = this.shader(
      /* glsl */ `
      ${COMMON}
      varying vec3 vW; varying vec3 vColor; varying vec2 vUv;
      void main() {
        float ends = smoothstep(0.0, 0.04, vUv.x) * smoothstep(1.0, 0.96, vUv.x);
        gl_FragColor = vec4(vColor * 0.5 * ends, 1.0);
      }`,
      { additive: true },
    );
    inlayMat.polygonOffset = true;
    inlayMat.polygonOffsetFactor = -2;
    inlayMat.polygonOffsetUnits = -4;
    this.instanced(inlay, inlayMat, mats, colors, false);
  }

  /*
    Structural glass between the ribs: walls and ceiling. A Fresnel shader
    (clear face-on, reflective and faintly iridescent at a glance) instead of
    transmission on every pane, which would cost a pass and sort badly.
  */
  private addGlass() {
    const { width: W, height: H, bar, cavity: cav } = CORRIDOR;
    const { n, gap } = this.bays();
    const fresnel = this.shader(
      /* glsl */ `
      ${COMMON}
      uniform float uLayer;
      varying vec3 vW; varying vec3 vN; varying vec2 vUv;
      void main() {
        vec3 n = normalize(vN);
        vec3 v = normalize(cameraPosition - vW);
        if (dot(n, v) < 0.0) n = -n;
        float cosT = max(dot(n, v), 0.0);
        float fres = 0.04 + 0.96 * pow(1.0 - cosT, 5.0);
        vec3 r = reflect(-v, n);
        vec3 c = env(r, vW) * fres * 0.15;
        // thin-film colour at a glance: a stable shift through the spectrum with angle
        c += spectrum(0.15 + cosT * 0.6 + uLayer * 0.2) * pow(1.0 - cosT, 3.0) * 0.06;
        // the polished edges of each pane catch the light
        vec2 e = min(vUv, 1.0 - vUv);
        float edge = exp(-min(e.x * 40.0, e.y * 16.0) * 3.0);
        c += corridorHue(along(vW)) * edge * 0.12;
        gl_FragColor = vec4(c * (1.0 - 0.35 * uLayer), 1.0);
      }`,
      { additive: true, side: THREE.DoubleSide, extra: { uLayer: { value: 0 } } },
    );
    const pane = (w: number, h: number) => this.keep(new THREE.PlaneGeometry(w, h));
    const layer = (inset: number, mat: THREE.Material, ceilingMat: THREE.Material) => {
      const wallX = W / 2 - inset;
      const top = H - inset;
      const wall = pane(gap, top);
      const roof = pane(2 * wallX, gap);
      const wallsM: THREE.Matrix4[] = [];
      const roofM: THREE.Matrix4[] = [];
      const e = new THREE.Euler();
      const q = new THREE.Quaternion();
      const one = new THREE.Vector3(1, 1, 1);
      for (let k = 0; k < n; k++) {
        const z = this.F + (k + 0.5) * gap;
        for (const s of [-1, 1]) {
          q.setFromEuler(e.set(0, (s * Math.PI) / 2, 0));
          wallsM.push(
            new THREE.Matrix4().compose(new THREE.Vector3(s * wallX, top / 2, z), q, one),
          );
        }
        q.setFromEuler(e.set(Math.PI / 2, 0, 0)); // facing down
        roofM.push(new THREE.Matrix4().compose(new THREE.Vector3(0, top, z), q, one));
      }
      const wm = new THREE.InstancedMesh(wall, mat, wallsM.length);
      wallsM.forEach((x, i) => wm.setMatrixAt(i, x));
      const rm = new THREE.InstancedMesh(roof, ceilingMat, roofM.length);
      roofM.forEach((x, i) => rm.setMatrixAt(i, x));
      this.root.add(wm, rm);
      return rm;
    };

    // Prism glass for the ceiling where the device can afford it: one transmissive
    // InstancedMesh, so a single extra pass (the gallery's prism already uses it)
    let ceiling: THREE.Material = fresnel;
    if (this.q.physicalGlass) {
      const g = new THREE.MeshPhysicalMaterial({
        color: 0xffffff,
        metalness: 0,
        roughness: 0.05,
        transmission: 0.94,
        ior: 1.5,
        thickness: 0.04,
        dispersion: 4,
        specularIntensity: 1,
        envMap: this.gallery.environment,
        envMapIntensity: 0.15,
        attenuationColor: new THREE.Color(0.8, 0.75, 1.0), // a faint violet body tint
        attenuationDistance: 0.6,
        side: THREE.DoubleSide,
      });
      this.keep(g);
      ceiling = g;
    }
    layer(bar / 2, fresnel, ceiling);
    if (this.q.outerGlass) {
      // A second skin: double glazing, for depth
      const outer = fresnel.clone();
      outer.uniforms = { ...this.u, uLayer: { value: 1 } };
      this.keep(outer);
      layer(-cav * 0.45, outer, outer);
    }
  }

  /* The light box behind the glass: soft panels of spectral light, one per bay. */
  private addShell() {
    const { width: W, height: H, cavity: cav, length: L } = CORRIDOR;
    const { gap } = this.bays();
    const mat = this.shader(
      /* glsl */ `
      ${COMMON}
      uniform float uGap; uniform float uTop;
      varying vec3 vW; varying vec3 vN;
      void main() {
        float a = along(vW);
        float y = abs(vW.y);                 // symmetric about the floor, for its reflection
        float bay = fract((vW.z - uF) / uGap);
        float panel = exp(-pow((bay - 0.5) * 3.2, 2.0));
        // light refracted through prism glass: soft diagonal caustics, each
        // band its own colour of the spectrum, over a violet glow
        vec2 q = abs(vN.y) > 0.5 ? vec2(vW.z - uF, vW.x + 6.0) : vec2(vW.z - uF, y);
        float side = abs(vN.y) > 0.5 ? 2.0 : (vN.x > 0.0 ? 0.0 : 1.0);
        vec3 c = prismGlass(q, side, uTop) * (0.85 + 0.3 * panel);
        c = mix(c, vec3(1.0, 0.8, 0.6) * dot(c, vec3(0.33)), uWarm * 0.5);
        gl_FragColor = vec4(c, 1.0);
      }`,
      { extra: { uGap: { value: gap }, uTop: { value: H + cav } } },
    );
    const zc = this.F + L / 2;
    const span = 2 * (H + cav);
    const side = (s: number) => {
      const g = new THREE.PlaneGeometry(L, span);
      g.rotateY((-s * Math.PI) / 2);
      g.translate(s * (W / 2 + cav), 0, zc);
      return g;
    };
    const lid = (s: number) => {
      const g = new THREE.PlaneGeometry(W + 2 * cav, L);
      g.rotateX((s * Math.PI) / 2);
      g.translate(0, s * (H + cav), zc);
      return g;
    };
    const parts = [side(-1), side(1), lid(1), lid(-1)];
    const geo = mergeGeometries(parts)!;
    parts.forEach((p) => p.dispose());
    this.keep(geo);
    this.root.add(new THREE.Mesh(geo, mat));

    // Close the gap round the room's entrance, between the room and the light box
    const s = new THREE.Shape();
    s.moveTo(-W / 2 - cav - 0.1, -H - cav);
    s.lineTo(W / 2 + cav + 0.1, -H - cav);
    s.lineTo(W / 2 + cav + 0.1, H + cav + 0.1);
    s.lineTo(-W / 2 - cav - 0.1, H + cav + 0.1);
    const hole = new THREE.Path();
    hole.moveTo(-W / 2, 0);
    hole.lineTo(-W / 2, H);
    hole.lineTo(W / 2, H);
    hole.lineTo(W / 2, 0);
    s.holes.push(hole);
    const capGeo = this.keep(new THREE.ShapeGeometry(s));
    const capMat = this.keep(new THREE.MeshBasicMaterial({ color: 0x050308 }));
    const cap = new THREE.Mesh(capGeo, capMat);
    cap.position.z = this.F - 0.05;
    this.root.add(cap);
  }

  /*
    The floor: dark polished glass. The corridor's reflection is a mirrored
    copy of the frames and ribbons beneath it; the floor lets part of it through,
    more at a glance (Fresnel), as polished stone or glass does.
  */
  private addFloor() {
    const { length: L, porch } = CORRIDOR;
    const len = L + porch;
    const geo = this.keep(new THREE.PlaneGeometry(60, len));
    geo.rotateX(-Math.PI / 2);
    geo.translate(0, 0, this.F + len / 2);
    const mirror = this.q.mirror;
    const mat = this.shader(
      /* glsl */ `
      ${COMMON}
      uniform float uMirror; uniform float uFe; uniform float uGlow;
      varying vec3 vW;
      void main() {
        vec3 v = normalize(cameraPosition - vW);
        float cosT = max(v.y, 0.0);
        float fres = 0.04 + 0.96 * pow(1.0 - cosT, 5.0);
        vec3 r = reflect(-v, vec3(0.0, 1.0, 0.0));
        vec3 c = vec3(0.04, 0.025, 0.08) + env(r, vW) * fres * 0.15;
        if (uMirror < 0.5) c += env(r, vW) * fres * 0.22; // no mirror: the environment instead
        // how much of the reflection shows: more at a glance
        float show = uMirror * mix(0.72, 0.9, fres);
        // in front of the doors: light pours out across the floor in rays,
        // white down the middle, the spectrum at the sides
        float dz = vW.z - uFe;
        if (dz > 0.0) {
          float ang = atan(vW.x, dz + 0.3);
          float fan = exp(-abs(vW.x) / (0.6 + 0.6 * dz)) * exp(-dz / 4.5);
          float rays = 0.5 + 0.5 * pow(0.5 + 0.5 * sin(ang * 16.0), 3.0);
          vec3 rc = mix(vec3(1.0, 0.95, 0.92), spectrum(fract(ang * 0.45 + 0.5)), smoothstep(0.08, 0.5, abs(ang)));
          c += rc * fan * rays * uGlow * 1.6;
          show *= 0.35;
        }
        gl_FragColor = vec4(c, 1.0 - show);
      }`,
      {
        transparent: true,
        extra: {
          uMirror: { value: mirror ? 1 : 0 },
          uFe: { value: this.Fe },
          uGlow: this.facadeGlow,
        },
      },
    );
    this.floorMat = mat;
    const floor = new THREE.Mesh(geo, mat);
    floor.renderOrder = -5;
    this.root.add(floor);
  }

  /* Lines of light along the corridor's four long corners, where glass meets floor and ceiling. */
  private addCornerLines() {
    const { width: W, height: H, bar, length: L } = CORRIDOR;
    const zc = this.F + L / 2;
    const x = W / 2 - bar - 0.02;
    const parts = [
      new THREE.BoxGeometry(0.025, 0.025, L).translate(-x, 0.03, zc),
      new THREE.BoxGeometry(0.025, 0.025, L).translate(x, 0.03, zc),
      new THREE.BoxGeometry(0.025, 0.025, L).translate(-x, H - bar - 0.03, zc),
      new THREE.BoxGeometry(0.025, 0.025, L).translate(x, H - bar - 0.03, zc),
    ];
    const geo = mergeGeometries(parts)!;
    parts.forEach((p) => p.dispose());
    this.keep(geo);
    const mat = this.shader(/* glsl */ `
      ${COMMON}
      varying vec3 vW;
      void main() {
        float a = along(vW);
        vec3 c = mix(vec3(1.0, 0.75, 0.55), vec3(0.95, 0.85, 1.0), a) * 2.4;
        gl_FragColor = vec4(c, 1.0);
      }`);
    this.root.add(new THREE.Mesh(geo, mat));
    const r = new THREE.Mesh(geo, mat);
    this.mirror.add(r);
  }

  /*
    Frame 07: as you step into the room, prism glass still stands along both
    sides of its entrance, then fades as the gallery settles.
  */
  private addExitGlass() {
    const { width: W, height: H } = CORRIDOR;
    const len = 6.5;
    const parts = [-1, 1].map((s) => {
      const g = new THREE.PlaneGeometry(len, H);
      g.rotateY((-s * Math.PI) / 2);
      g.translate(s * (W / 2 - 0.3), H / 2, this.F - len / 2);
      return g;
    });
    const geo = mergeGeometries(parts)!;
    parts.forEach((p) => p.dispose());
    this.keep(geo);
    const mat = this.shader(
      /* glsl */ `
      ${COMMON}
      uniform float uExit;
      varying vec3 vW; varying vec2 vUv;
      void main() {
        vec3 c = prismGlass(vec2(vW.z - uF, vW.y), vW.x > 0.0 ? 0.0 : 1.0, 4.2) * 1.6;
        float fade = smoothstep(0.0, 0.35, vUv.x);
        gl_FragColor = vec4(c, 0.85 * fade * uExit);
      }`,
      { transparent: true, side: THREE.DoubleSide, extra: { uExit: this.exitFade } },
    );
    mat.depthWrite = false;
    this.root.add(new THREE.Mesh(geo, mat));
  }

  /* The entrance: a dark wall with the logo's doorway in it, and a polished jamb round it. */
  private addFacade() {
    const { x0, x1, y0, y1 } = DOORWAY;
    const s = new THREE.Shape();
    s.moveTo(-40, 0);
    s.lineTo(40, 0);
    s.lineTo(40, 24);
    s.lineTo(-40, 24);
    const hole = new THREE.Path();
    hole.moveTo(x0, y0);
    hole.lineTo(x0, y1);
    hole.lineTo(x1, y1);
    hole.lineTo(x1, y0);
    s.holes.push(hole);
    const geo = this.keep(new THREE.ShapeGeometry(s));
    const mat = this.shader(
      /* glsl */ `
      ${COMMON}
      uniform float uGlow; uniform vec4 uDoor;
      varying vec3 vW;
      void main() {
        // a mauve wall, lit by prism light spilling out of the doorway
        vec2 c0 = vec2(0.5 * (uDoor.x + uDoor.y), 0.5 * (uDoor.z + uDoor.w));
        vec2 q = abs(vW.xy - c0) - 0.5 * vec2(uDoor.y - uDoor.x, uDoor.w - uDoor.z);
        float d = length(max(q, 0.0));
        float ang = atan(vW.y - c0.y, vW.x - c0.x);
        float caust = pow(0.5 + 0.5 * sin(ang * 5.0 + d * 1.3), 4.0);
        vec3 spill = mix(vec3(1.0, 0.95, 0.95), spectrum(fract(ang / 6.28318 + d * 0.05)), 0.7)
          * exp(-d * 0.6) * (0.25 + 0.5 * caust) * uGlow;
        gl_FragColor = vec4(vec3(0.07, 0.055, 0.08) + spill, 1.0);
      }`,
      { extra: { uGlow: this.facadeGlow, uDoor: { value: new THREE.Vector4(x0, x1, y0, y1) } } },
    );
    const facade = new THREE.Mesh(geo, mat);
    facade.position.z = this.Fe;
    this.root.add(facade);

    // The jamb: the doorway's depth, in dark polished framing
    const depth = 0.4;
    const t = 0.06;
    const parts = [
      new THREE.BoxGeometry(t, y1 - y0, depth).translate(x0 - t / 2, (y0 + y1) / 2, 0),
      new THREE.BoxGeometry(t, y1 - y0, depth).translate(x1 + t / 2, (y0 + y1) / 2, 0),
      new THREE.BoxGeometry(x1 - x0 + 2 * t, t, depth).translate((x0 + x1) / 2, y1 + t / 2, 0),
    ];
    const jamb = mergeGeometries(parts)!;
    parts.forEach((p) => p.dispose());
    this.keep(jamb);
    const jambMat = this.shader(/* glsl */ `
      ${COMMON}
      varying vec3 vW; varying vec3 vN;
      void main() {
        vec3 n = normalize(vN);
        vec3 v = normalize(cameraPosition - vW);
        float fres = 0.04 + 0.96 * pow(1.0 - max(dot(n, v), 0.0), 5.0);
        vec3 c = vec3(0.01, 0.008, 0.016) + env(reflect(-v, n), vW) * (0.08 + 0.7 * fres);
        gl_FragColor = vec4(c, 1.0);
      }`);
    const j = new THREE.Mesh(jamb, jambMat);
    j.position.z = this.Fe - depth / 2 + 0.001;
    this.root.add(j);
  }

  /* The logo's two panels: black glass doors, hinged on their outer edges. */
  private addDoors() {
    const shapeOf = (pts: number[]) => {
      const s = new THREE.Shape();
      for (let i = 0; i < pts.length; i += 2) {
        const x = (pts[i] - FOCUS.x) * PX;
        const y = FOCUS_Y - (pts[i + 1] - FOCUS.y) * PX;
        if (i === 0) s.moveTo(x, y);
        else s.lineTo(x, y);
      }
      s.closePath();
      return s;
    };
    const mat = this.shader(
      /* glsl */ `
      ${COMMON}
      varying vec3 vW; varying vec3 vN; varying vec3 vON;
      void main() {
        vec3 n = normalize(vN);
        vec3 v = normalize(cameraPosition - vW);
        if (dot(n, v) < 0.0) n = -n;
        float fres = 0.04 + 0.96 * pow(1.0 - max(dot(n, v), 0.0), 5.0);
        // black glass, its thin edges catching the light from the doorway
        vec3 c = vec3(0.008) + env(reflect(-v, n), vW) * fres * 0.3;
        if (abs(vON.z) < 0.5) c += (vW.x < 0.0 ? spectrum(0.2) : spectrum(0.5)) * 2.0;
        gl_FragColor = vec4(c, 1.0);
      }`,
      {
        side: THREE.DoubleSide,
        vertex: /* glsl */ `
        varying vec3 vW; varying vec3 vN; varying vec3 vON;
        void main() {
          vON = normal;
          vec4 w = modelMatrix * vec4(position, 1.0);
          vW = w.xyz;
          vN = normalize(mat3(modelMatrix) * normal);
          gl_Position = projectionMatrix * viewMatrix * w;
        }`,
      },
    );
    const make = (pts: number[], side: number) => {
      const geo = this.keep(
        new THREE.ExtrudeGeometry(shapeOf(pts), { depth: 0.08, bevelEnabled: false }),
      );
      geo.translate(0, 0, -0.08);
      const mesh = new THREE.Mesh(geo, mat);
      const hingeX = side < 0 ? (530 - FOCUS.x) * PX : (745 - FOCUS.x) * PX;
      const pivot = new THREE.Group();
      pivot.position.set(hingeX, 0, this.Fe - 0.02);
      mesh.position.x = -hingeX;
      pivot.add(mesh);
      this.root.add(pivot);
      return pivot;
    };
    this.leftDoor = make(LEFT, -1);
    this.rightDoor = make(RIGHT, 1);
  }

  /* A few continuous ribbons of light down the corridor, on gentle splines. */
  private addRibbons(count: number) {
    const { width: W, height: H, length: L } = CORRIDOR;
    const lanes = [
      { x: -W / 2 + 0.75, y: H - 0.55, ph: 0.0, hue: 0.0 },
      { x: W / 2 - 0.75, y: H - 0.55, ph: 2.1, hue: 0.22 },
      { x: -W / 2 + 1.4, y: 0.45, ph: 4.2, hue: 0.12 },
      { x: W / 2 - 1.4, y: 0.45, ph: 1.3, hue: 0.3 },
      { x: -1.3, y: H - 0.3, ph: 3.3, hue: 0.06 },
      { x: 1.3, y: H - 0.3, ph: 5.1, hue: 0.26 },
    ].slice(0, count);
    const parts: THREE.BufferGeometry[] = [];
    lanes.forEach((ln, i) => {
      const pts: THREE.Vector3[] = [];
      if (i === 0) {
        // the storyboard's ribbon: in high on the right, sweeping down across
        // to the floor on the left as it reaches the gallery
        for (let k = 0; k <= 12; k++) {
          const s = k / 12;
          const e = s * s * (3 - 2 * s);
          pts.push(
            new THREE.Vector3(
              3.4 - 5.2 * e + 0.5 * Math.sin(s * 9),
              H - 0.35 - (H - 0.45) * e,
              this.Fe - 0.6 - s * (L - 1.4),
            ),
          );
        }
      } else
        for (let z = this.Fe - 0.6; z >= this.F + 0.4; z -= 2) {
          pts.push(
            new THREE.Vector3(
              ln.x + 0.35 * Math.sin(z * 0.19 + ln.ph),
              ln.y + 0.16 * Math.sin(z * 0.13 + ln.ph * 1.7),
              z,
            ),
          );
        }
      const curve = new THREE.CatmullRomCurve3(pts, false, "centripetal");
      const g = new THREE.TubeGeometry(curve, Math.round(L * 10), i === 0 ? 0.035 : 0.02, 6, false);
      const n = g.attributes.position.count;
      g.setAttribute(
        "aSeed",
        new THREE.BufferAttribute(new Float32Array(n).fill(ln.hue + i * 0.001), 1),
      );
      parts.push(g);
    });
    const geo = mergeGeometries(parts)!;
    parts.forEach((p) => p.dispose());
    const mat = this.shader(
      /* glsl */ `
      ${COMMON}
      varying vec3 vW; varying vec3 vN; varying vec2 vUv; varying float vSeed;
      void main() {
        vec3 n = normalize(vN);
        vec3 v = normalize(cameraPosition - vW);
        float core = pow(abs(dot(n, v)), 2.0);                 // bright along the tube's middle
        float a = along(vW);
        float h = vSeed + a * 0.35 - uTime * 0.08;
        // subtle dispersion: the rim of the tube shifts a little along the spectrum
        vec3 col = mix(spectrum(h + 0.07), spectrum(h), core);
        float pulse = pow(0.5 + 0.5 * sin(vUv.x * 46.0 - uTime * 7.0 + vSeed * 20.0), 6.0);
        float ends = smoothstep(0.0, 0.04, vUv.x) * smoothstep(1.0, 0.94, vUv.x);
        float dist = length(cameraPosition - vW);
        vec3 c = col * (0.35 + 1.5 * core + 1.2 * pulse * core) * ends * (0.4 + 0.6 * exp(-dist * 0.04));
        c = mix(c, vec3(1.0, 0.8, 0.6) * dot(c, vec3(0.33)), uWarm * 0.7);
        gl_FragColor = vec4(c, 1.0);
      }`,
      {
        vertex: /* glsl */ `
        attribute float aSeed;
        varying vec3 vW; varying vec3 vN; varying vec2 vUv; varying float vSeed;
        void main() {
          vUv = uv; vSeed = aSeed;
          vec4 w = modelMatrix * vec4(position, 1.0);
          vW = w.xyz;
          vN = normalize(mat3(modelMatrix) * normal);
          gl_Position = projectionMatrix * viewMatrix * w;
        }`,
        additive: true,
      },
    );
    this.keep(geo);
    this.root.add(new THREE.Mesh(geo, mat));
    const r = new THREE.Mesh(geo, mat);
    r.renderOrder = -6;
    this.mirror.add(r);
  }

  /*
    Dust in the light: each particle has a start, a velocity, a size, a
    lifetime and a phase, so it fades in, drifts towards the doors (against
    the camera's travel) and fades out, then begins again elsewhere.
  */
  private addParticles(n: number) {
    const { width: W, height: H } = CORRIDOR;
    let s = 5;
    const rand = () => {
      s = (s * 16807) % 2147483647;
      return (s - 1) / 2147483646;
    };
    const start = new Float32Array(n * 3);
    const vel = new Float32Array(n * 3);
    const life = new Float32Array(n * 4); // life, size, phase, hue
    for (let i = 0; i < n; i++) {
      start[i * 3] = (rand() - 0.5) * (W - 1);
      start[i * 3 + 1] = 0.15 + rand() * (H - 0.4);
      start[i * 3 + 2] = this.F + rand() * CORRIDOR.length;
      vel[i * 3] = (rand() - 0.5) * 0.08;
      vel[i * 3 + 1] = (rand() - 0.5) * 0.06;
      vel[i * 3 + 2] = 0.3 + rand() * 0.9;
      life[i * 4] = 2 + rand() * 3;
      life[i * 4 + 1] = 0.5 + Math.pow(rand(), 2) * 1.3;
      life[i * 4 + 2] = rand();
      life[i * 4 + 3] = rand();
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(start, 3));
    geo.setAttribute("aVel", new THREE.BufferAttribute(vel, 3));
    geo.setAttribute("aLife", new THREE.BufferAttribute(life, 4));
    this.keep(geo);
    this.particleMat = this.shader(
      /* glsl */ `
      ${COMMON}
      varying float vAlpha; varying float vHue;
      void main() {
        vec2 d = gl_PointCoord - 0.5;
        float a = exp(-dot(d, d) * 18.0);
        vec3 c = mix(vec3(1.0), spectrum(vHue), 0.55) * a * vAlpha * 1.4;
        c = mix(c, vec3(1.0, 0.8, 0.6) * dot(c, vec3(0.33)), uWarm * 0.6);
        gl_FragColor = vec4(c, 1.0);
      }`,
      {
        vertex: /* glsl */ `
        uniform float uTime; uniform float uF; uniform float uLen; uniform float uPx;
        attribute vec3 aVel; attribute vec4 aLife;
        varying float vAlpha; varying float vHue;
        void main() {
          float life = aLife.x;
          float age = mod(uTime + aLife.z * life, life);
          float k = age / life;
          vec3 p = position + aVel * age;
          p.z = uF + mod(p.z - uF, uLen);
          vec4 mv = viewMatrix * vec4(p, 1.0);
          float depth = -mv.z;
          gl_PointSize = min(uPx * aLife.y / max(depth, 0.3), 40.0);
          vAlpha = sin(3.14159 * k) * smoothstep(0.4, 2.0, depth) * exp(-depth * 0.035);
          vHue = aLife.w;
          gl_Position = projectionMatrix * mv;
        }`,
        additive: true,
        extra: { uPx: { value: 40 } },
      },
    );
    this.particles = new THREE.Points(geo, this.particleMat);
    this.root.add(this.particles);
  }

  /* ---------- the camera ---------- */

  /* How tall the logo stood on screen (fraction of the screen's height) as it handed over. */
  setDoorFraction(f: number) {
    this.doorFraction = Math.max(0.05, f);
  }

  /*
    One spline for the whole way: from in front of the doors (where they
    stand as tall on screen as the logo did), through the doorway, down the
    corridor's axis with a gentle sway, through the room's entrance, and to
    the spot where the gallery's own camera takes over.
  */
  private pathFor(d0: number, arrive: { x: number; z: number }) {
    const key = `${d0.toFixed(3)}|${arrive.x.toFixed(2)}|${arrive.z.toFixed(2)}`;
    if (this.path?.key === key) return this.path;
    const { height: H, length: L } = CORRIDOR;
    const Fe = this.Fe;
    const eye = 1.6;
    const pts = [
      new THREE.Vector3(0, FOCUS_Y, Fe + d0),
      new THREE.Vector3(0, (FOCUS_Y + DOORWAY.y1 / 2) / 2, Fe + d0 * 0.45),
      new THREE.Vector3(0, DOORWAY.y1 / 2 + 0.3, Fe - 1.2),
      new THREE.Vector3(0.28, H / 2 + 0.2, Fe - L * 0.3),
      new THREE.Vector3(-0.28, H / 2, Fe - L * 0.62),
      new THREE.Vector3(0, (H / 2 + eye) / 2, this.F + 2.2),
      new THREE.Vector3(arrive.x, eye, arrive.z + 1.0),
      new THREE.Vector3(arrive.x, eye, arrive.z),
    ];
    const curve = new THREE.CatmullRomCurve3(pts, false, "centripetal");
    curve.arcLengthDivisions = 400;
    // where along the path (0..1) the camera reaches a given z
    const uAtZ = (z: number) => {
      let lo = 0;
      let hi = 1;
      for (let i = 0; i < 30; i++) {
        const m = (lo + hi) / 2;
        if (curve.getPointAt(m).z > z) lo = m;
        else hi = m;
      }
      return (lo + hi) / 2;
    };
    const keys: [number, number][] = [
      [0, 0],
      [0.14, uAtZ(Fe + d0 * 0.4)], // 03: the doors swing open as you near them
      [0.26, uAtZ(Fe - 1.0)], // through
      [0.5, uAtZ(this.F + 15)], // 04-05: down the corridor
      [0.72, uAtZ(this.F + 10.5)], // 06: the gallery framed in the glass, held
      [1, 1], // 07-09: into the room
    ];
    this.path = { key, curve, len: curve.getLength(), keys };
    return this.path;
  }

  /*
    Place the gallery's camera for journey progress t (0 = the doors, 1 =
    arrived), and set the corridor's light and the post-processing to match.
  */
  update(t: number, time: number, arrive: { x: number; z: number }) {
    const g = this.gallery;
    const cam = g.camera;
    if (!this.active) {
      this.active = true;
      this.root.visible = true;
      cam.near = 0.1;
      cam.far = 170;
    }
    this.adapt();

    const fovG = g.galleryFov();
    const fov0 = fovG + 6;
    const tan0 = Math.tan((fov0 * Math.PI) / 360);
    const d0 = (428 * PX) / (2 * tan0 * this.doorFraction);
    const path = this.pathFor(d0, arrive);

    // Speed along the path: still while the doors open, then a long glide
    // that slows into the room, never stopping and starting
    const x = t;
    const u = monotone(path.keys, t);
    path.curve.getPointAt(u, cam.position);

    // Look ahead along the path (straight ahead at the start, as the logo was)
    const ahead = Math.min(1, u + 6 / path.len);
    path.curve.getPointAt(ahead, this.look);
    const over = u + 6 / path.len - 1;
    if (over > 0) this.look.z -= over * path.len;
    const straight = 1 - smooth(0.02, 0.2, t);
    this.look.lerp(cam.position.clone().add(new THREE.Vector3(0, 0, -6)), straight);
    // Arriving: settle on the gallery's own line of sight
    const settle = smooth(0.86, 1, t);
    this.look.lerp(new THREE.Vector3(arrive.x, 1.6, arrive.z - 6), settle);
    cam.up.set(0, 1, 0);
    cam.lookAt(this.look);

    // A touch wider at speed, back to the gallery's lens on arrival
    cam.fov = fov0 + (fovG - fov0) * smooth(0.1, 1, t) + Math.pow(Math.sin(Math.PI * x), 2) * 9;
    cam.updateProjectionMatrix();

    // The doors swing open, light spills out of the doorway
    const open = smooth(0.0, 0.17, t) * 1.5;
    this.leftDoor.rotation.y = open;
    this.rightDoor.rotation.y = -open;
    this.facadeGlow.value = 0.5 + smooth(0, 0.12, t) * 0.8;
    this.exitFade.value = smooth(0.7, 0.8, t) * (1 - smooth(0.9, 1, t));

    // The room's entrance wall stands only once you're through it
    const camZ = cam.position.z;
    g.showEntrance(camZ < this.F - 0.6);

    this.u.uTime.value = time;
    this.u.uWarm.value = smooth(0.6, 1, t);
    this.particleMat.uniforms.uPx.value = g.renderer.domElement.height * 0.022;

    // Post: a white flash out of the logo, selective bloom on the light,
    // a faint radial colour fringe at speed; all of it eases back to the
    // gallery's own settings on arrival
    const k = 1 - smooth(0.8, 1, t);
    g.setJourneyPost({
      flash: 0.85 * (1 - smooth(0, 0.05, t)),
      ca: this.reduced ? 0 : 0.0035 * k * smooth(0.05, 0.25, t),
      bloom: k,
      ao: smooth(0.82, 1, t),
    });
  }

  /* Leave the journey: the gallery as it was. */
  end() {
    if (!this.active) return;
    this.active = false;
    this.root.visible = false;
    const g = this.gallery;
    g.showEntrance(true);
    g.setJourneyPost(null);
    g.camera.near = 0.05;
    g.camera.far = 80;
    g.camera.fov = g.galleryFov();
    g.camera.updateProjectionMatrix();
  }

  /* Adaptive quality: if frames run long, thin the particles and drop the colour fringe. */
  private adapt() {
    const now = performance.now();
    if (this.lastFrame) {
      const dt = now - this.lastFrame;
      if (dt < 200) this.frameTimes.push(dt);
      if (this.frameTimes.length > 12) this.frameTimes.shift();
    }
    this.lastFrame = now;
    if (!this.reduced && this.frameTimes.length >= 12) {
      const avg = this.frameTimes.reduce((a, b) => a + b, 0) / this.frameTimes.length;
      if (avg > 26) {
        this.reduced = true;
        this.particles.geometry.setDrawRange(0, Math.floor(this.q.particles / 2));
        this.mirror.visible = false;
        if (this.floorMat) this.floorMat.uniforms.uMirror.value = 0;
      }
    }
  }

  /* Draw once off-screen so every shader is compiled before the journey starts. */
  warm(arrive: { x: number; z: number }) {
    this.update(0.5, 0, arrive);
    this.gallery.render(0);
    this.update(0.95, 0, arrive);
    this.gallery.render(0);
    this.update(0, 0, arrive);
    this.gallery.render(0);
    this.end();
    // and the room as you'll find it, with its entrance wall and contact shadows
    this.gallery.setPose(arrive.x, 1.6, arrive.z, 0);
    this.gallery.render(0);
    this.frameTimes = [];
    this.lastFrame = 0;
  }

  dispose() {
    this.end();
    this.root.removeFromParent();
    this.disposables.forEach((d) => d.dispose());
  }
}
