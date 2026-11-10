import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";

/*
  The prism journey, from the logo to the gallery, after the storyboard.

  03 THE THRESHOLD   The logo's two black panels, now real doors, swing open;
                     light pours out between them onto a bright glass corridor.
  04 INTO THE TUNNEL A long corridor of optical glass: iridescent panes that
                     shimmer through the spectrum as you pass, light running
                     along their edges, a white vanishing point.
  05 THE TUNNEL      Silky ribbons of light flowing round you, crystal shards,
                     sparkling particles, beams from the far end.
  06 DESTINATION     The gallery appears in a round opening at the end, inside
                     a slowly turning vortex of light.
  07 DISSOLVE        As you arrive the glass slides away outwards, the light
                     warms and thins, and the opening fills the view.

  The opening shows the live gallery: this canvas is see-through there, over
  the gallery's own canvas, so when the opening fills the view and the tunnel
  fades, you are simply in the room.

  Everything is drawn live with custom shaders as additive light; nothing is
  downloaded. It renders only while the journey plays.
*/

const W = 7; // corridor width
const H = 4.4; // and height
const L = 60; // length to the opening
const GATE_GAP = 3.4;
const R = 3.3; // the round opening's radius
const CY = -1.44; // the corridor's centre line sits a little below the logo's top

// Logo shapes (logo pixels, y down) -> metres, with the top of the gap at the origin
const PX = 4.0 / 428;
const LEFT = [530, 258, 620, 301, 620, 640, 530, 686];
const RIGHT = [668, 324, 745, 361, 745, 686, 668, 640];
const FOCUS = { x: 644, y: 318 };

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
  uniform float uWarm;
  uniform float uOut;
  ${SPECTRUM}
  // Light as premultiplied colour: only as opaque as it is bright, so faint
  // light over the opening still lets the gallery show through
  vec4 lightOut(vec3 c) {
    c = max(c, 0.0);
    return vec4(c, clamp(max(c.r, max(c.g, c.b)), 0.0, 1.0));
  }
  vec3 warmed(vec3 c) {
    return mix(c, vec3(1.0, 0.74, 0.46) * dot(c, vec3(0.3, 0.5, 0.2)) * 1.2, uWarm);
  }
`;

type Shared = {
  uTime: { value: number };
  uWarm: { value: number };
  uOut: { value: number };
};

export class PrismTunnel {
  private renderer: THREE.WebGLRenderer;
  private scene = new THREE.Scene();
  private camera: THREE.PerspectiveCamera;
  private shared: Shared = { uTime: { value: 0 }, uWarm: { value: 0 }, uOut: { value: 0 } };
  private disposables: { dispose: () => void }[] = [];
  private aspect = 1;
  private baseFov = 60;
  private doorFraction = 0.4; // how much of the screen's height the logo filled as it handed over
  private leftDoor!: THREE.Group;
  private rightDoor!: THREE.Group;
  private doorLight!: THREE.Group;
  private vortex!: THREE.Group;
  private glow!: THREE.Sprite;
  private flash!: THREE.Mesh;
  private rim!: THREE.ShaderMaterial;
  private particles?: THREE.ShaderMaterial;

  constructor(canvas: HTMLCanvasElement, opts: { light: boolean }) {
    const renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true, // see-through in the opening: the gallery canvas beneath shows there
      antialias: !opts.light,
      powerPreference: "high-performance",
    });
    renderer.setClearColor(new THREE.Color(0.018, 0.01, 0.05), 1); // deep violet night
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer = renderer;
    this.camera = new THREE.PerspectiveCamera(60, 1, 0.05, 160);
    this.scene.add(this.camera);

    const light = opts.light;
    const world = new THREE.Group();
    world.position.y = CY;
    this.scene.add(world);
    this.addPortal(world);
    this.addVortex(world, light);
    this.addPanes(world, light);
    this.addRibbons(world, light ? 7 : 12);
    this.addShards(world, light ? 18 : 34);
    this.addSparkles(world, light ? 1500 : 3200);
    this.addBeams(world, light ? 8 : 14);
    this.addFarGlow(world);
    this.addDoors();
    this.addFlash();
  }

  private keep(...t: { dispose: () => void }[]) {
    this.disposables.push(...t);
  }

  private light(vertex: string, fragment: string, extra: Record<string, THREE.IUniform> = {}) {
    const m = new THREE.ShaderMaterial({
      uniforms: { ...this.shared, ...extra },
      vertexShader: vertex,
      fragmentShader: fragment,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      premultipliedAlpha: true,
      side: THREE.DoubleSide,
    });
    this.keep(m);
    return m;
  }

  /* ---------- the doors: the logo's two panels, swinging open ---------- */

  private addDoors() {
    const shapeOf = (pts: number[]) => {
      const s = new THREE.Shape();
      for (let i = 0; i < pts.length; i += 2) {
        const x = (pts[i] - FOCUS.x) * PX;
        const y = -(pts[i + 1] - FOCUS.y) * PX;
        if (i === 0) s.moveTo(x, y);
        else s.lineTo(x, y);
      }
      s.closePath();
      return s;
    };
    const doorFrag = /* glsl */ `
      ${COMMON}
      uniform float uSide;
      varying vec3 vP; varying vec3 vN;
      void main() {
        // black glass, catching the prism's light on its inner edge and along the top
        float inner = exp(-abs(vP.x - uSide * 0.23) / 0.32);
        float top = exp(-max(0.0, -vP.y - 0.05) / 0.9);
        float t = clamp(0.5 + vP.x * 0.35, 0.0, 1.0);
        vec3 col = vec3(0.012) + spectrum(mix(0.08, 0.62, t)) * (inner * top * 2.2 + inner * 0.25);
        if (abs(vN.z) < 0.5) col += vec3(1.0) * inner * 0.6; // the thin side faces burn white
        gl_FragColor = vec4(col, 1.0);
      }`;
    const doorVert = /* glsl */ `
      varying vec3 vP; varying vec3 vN;
      void main() { vP = position; vN = normal; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`;
    const make = (pts: number[], side: number) => {
      const geo = new THREE.ExtrudeGeometry(shapeOf(pts), { depth: 0.08, bevelEnabled: false });
      const m = new THREE.ShaderMaterial({
        uniforms: { ...this.shared, uSide: { value: side } },
        vertexShader: doorVert,
        fragmentShader: doorFrag,
        side: THREE.DoubleSide,
      });
      this.keep(geo, m);
      const mesh = new THREE.Mesh(geo, m);
      // hinged on the outer edge, so it swings away from the opening
      const hingeX = side < 0 ? (530 - FOCUS.x) * PX : (745 - FOCUS.x) * PX;
      const pivot = new THREE.Group();
      pivot.position.x = hingeX;
      mesh.position.x = -hingeX;
      pivot.add(mesh);
      this.scene.add(pivot);
      return pivot;
    };
    this.leftDoor = make(LEFT, -1);
    this.rightDoor = make(RIGHT, 1);

    // The light pouring out between them: a white core and soft rays towards you
    const g = new THREE.Group();
    const core = this.sprite("255,255,255", 1);
    core.scale.set(3.2, 5.2, 1);
    core.position.set(0, -2.1, -0.3);
    g.add(core);
    const rayGeo = new THREE.PlaneGeometry(0.5, 9);
    rayGeo.translate(0, 4.5, 0);
    this.keep(rayGeo);
    for (let i = 0; i < 12; i++) {
      const m = this.light(
        /* glsl */ `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
        /* glsl */ `
          ${COMMON}
          uniform float uSeed;
          uniform float uFade;
          varying vec2 vUv;
          void main() {
            float across = pow(sin(vUv.x * 3.14159), 3.0);
            float along = pow(1.0 - vUv.y, 1.6);
            vec3 c = mix(vec3(1.0), spectrum(uSeed), 0.6) * across * along * 0.5 * uFade;
            gl_FragColor = lightOut(c);
          }`,
        { uSeed: { value: i / 12 }, uFade: this.rayFade },
      );
      const ray = new THREE.Mesh(rayGeo, m);
      ray.position.set(0, -2.0, -0.4);
      ray.rotation.z = (i / 12) * Math.PI * 2;
      ray.rotation.x = -0.9; // fanning out towards you
      g.add(ray);
    }
    this.doorCore = core;
    this.doorLight = g;
    this.scene.add(g);
  }
  private rayFade = { value: 0 };
  private doorCore!: THREE.Sprite;

  private sprite(rgb: string, opacity: number) {
    const c = document.createElement("canvas");
    c.width = c.height = 128;
    const ctx = c.getContext("2d")!;
    const gr = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
    gr.addColorStop(0, `rgba(${rgb},1)`);
    gr.addColorStop(0.25, `rgba(${rgb},0.5)`);
    gr.addColorStop(1, `rgba(${rgb},0)`);
    ctx.fillStyle = gr;
    ctx.fillRect(0, 0, 128, 128);
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    const mat = new THREE.SpriteMaterial({
      map: tex,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      transparent: true,
      opacity,
    });
    mat.color.setScalar(2.5);
    this.keep(tex, mat);
    return new THREE.Sprite(mat);
  }

  /* ---------- the corridor ---------- */

  /*
    Iridescent glass panes lining the corridor, in two layers: almost clear
    face-on, shimmering through the spectrum at a glancing angle, bright at
    their edges, with soft caustics drifting through.
  */
  private addPanes(world: THREE.Group, light: boolean) {
    const parts: THREE.BufferGeometry[] = [];
    const layers = light ? [1] : [1, 0.82];
    layers.forEach((s, layer) => {
      for (let z = -1.6; z > -L + 2; z -= GATE_GAP) {
        const zc = z - GATE_GAP / 2;
        const flare = 1 + Math.pow(Math.max(0, (-zc - (L - 16)) / 16), 2) * 0.9; // opening out at the end
        const ws = W * s * flare;
        const hs = H * s * flare;
        const walls: [number, number, number, number, number][] = [
          [-ws / 2, 0, Math.PI / 2, 0, hs],
          [ws / 2, 0, -Math.PI / 2, 0, hs],
          [0, hs / 2, 0, Math.PI / 2, ws],
          [0, -hs / 2, 0, -Math.PI / 2, ws],
        ];
        walls.forEach(([x, y, ry, rx, across]) => {
          const g = new THREE.PlaneGeometry(GATE_GAP * 0.97, across);
          if (rx !== 0) {
            g.rotateZ(Math.PI / 2);
            g.rotateX(rx);
          } else g.rotateY(ry);
          g.translate(x, y, zc);
          const n = g.attributes.position.count;
          g.setAttribute("aLayer", new THREE.BufferAttribute(new Float32Array(n).fill(layer), 1));
          parts.push(g);
        });
      }
    });
    const geo = mergeGeometries(parts)!;
    parts.forEach((p) => p.dispose());
    const mat = this.light(
      /* glsl */ `
        uniform float uOut;
        attribute float aLayer;
        varying vec2 vUv; varying vec3 vP; varying float vLayer; varying vec3 vN; varying vec3 vV; varying float vDist;
        void main() {
          vUv = uv; vLayer = aLayer;
          vec3 p = position;
          p.xy *= 1.0 + uOut * 1.4; // on arrival the glass slides away outwards
          vP = p;
          vec4 mv = modelViewMatrix * vec4(p, 1.0);
          vN = normalize(normalMatrix * normal);
          vV = normalize(-mv.xyz);
          vDist = -mv.z;
          gl_Position = projectionMatrix * mv;
        }`,
      /* glsl */ `
        ${COMMON}
        varying vec2 vUv; varying vec3 vP; varying float vLayer; varying vec3 vN; varying vec3 vV; varying float vDist;
        void main() {
          vec2 e = min(vUv, 1.0 - vUv);
          float edge = pow(1.0 - min(e.x, e.y) * 2.0, 10.0);
          float glance = 1.0 - abs(dot(normalize(vN), normalize(vV))); // edge-on: thin-film colour
          float film = vP.z * 0.025 + glance * 1.4 + vLayer * 0.31 - uTime * 0.1;
          vec3 irid = spectrum(film);
          vec3 p = vP * 0.85;
          float c1 = sin(p.x * 2.0 + p.z * 0.6 + uTime * 1.2) * sin(p.y * 2.4 - p.z * 0.8 - uTime);
          float c2 = sin((p.x + p.y) * 3.1 - p.z * 1.1 + uTime * 1.6);
          float caust = pow(clamp(0.5 + 0.31 * (c1 + 0.6 * c2), 0.0, 1.0), 4.0);
          vec3 c = irid * (glance * glance * 0.16 + caust * 0.32 + edge * 1.3);
          float near = smoothstep(0.0, 6.0, -vP.z + 1.0); // nothing flashes right at the doors
          // glass far down the corridor fades, so the panes don't pile up into a haze
          float far = exp(-vDist * 0.085);
          gl_FragColor = lightOut(warmed(c) * near * far * (1.0 - uOut) * (vLayer > 0.5 ? 0.6 : 1.0));
        }`,
    );
    this.keep(geo);
    world.add(new THREE.Mesh(geo, mat));
  }

  /* Wide silky ribbons of light, flowing down the corridor and round into the vortex. */
  private addRibbons(world: THREE.Group, n: number) {
    const parts: THREE.BufferGeometry[] = [];
    let s = 11;
    const rand = () => {
      s = (s * 16807) % 2147483647;
      return (s - 1) / 2147483646;
    };
    for (let i = 0; i < n; i++) {
      const a0 = (i / n) * Math.PI * 2;
      const width = 0.25 + rand() * 0.7;
      const rr = 0.55 + rand() * 0.4;
      const speed = 0.08 + rand() * 0.08;
      const pts: THREE.Vector3[] = [];
      for (let z = 2; z >= -L + 0.3; z -= 0.6) {
        const d = -z / L;
        const swirl = Math.pow(Math.max(0, d - 0.72) * 3.6, 2) * 3.2; // gathering into the vortex
        const a = a0 + z * speed + swirl + Math.sin(z * 0.15 + i) * 0.5;
        const rad = rr * (1 + Math.max(0, d - 0.8) * 2.2);
        pts.push(new THREE.Vector3(Math.cos(a) * (W / 2) * rad, Math.sin(a) * (H / 2) * rad, z));
      }
      const curve = new THREE.CatmullRomCurve3(pts);
      const N = pts.length * 3;
      const pos: number[] = [];
      const uv: number[] = [];
      const idx: number[] = [];
      const frames = curve.computeFrenetFrames(N, false);
      for (let k = 0; k <= N; k++) {
        const u = k / N;
        const p = curve.getPointAt(u);
        // a flat ribbon, twisting slowly as it flows
        const tw = u * 9 + i;
        const side = frames.normals[k]
          .clone()
          .multiplyScalar(Math.cos(tw))
          .add(frames.binormals[k].clone().multiplyScalar(Math.sin(tw)));
        const a = p.clone().addScaledVector(side, -width / 2);
        const b = p.clone().addScaledVector(side, width / 2);
        pos.push(a.x, a.y, a.z, b.x, b.y, b.z);
        uv.push(u, 0, u, 1);
        if (k < N) {
          const o = k * 2;
          idx.push(o, o + 1, o + 2, o + 1, o + 3, o + 2);
        }
      }
      const g = new THREE.BufferGeometry();
      g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
      g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
      g.setAttribute(
        "aSeed",
        new THREE.Float32BufferAttribute(new Array(pos.length / 3).fill(rand()), 1),
      );
      g.setIndex(idx);
      parts.push(g);
    }
    const geo = mergeGeometries(parts)!;
    parts.forEach((p) => p.dispose());
    const mat = this.light(
      /* glsl */ `
        attribute float aSeed;
        varying vec2 vUv; varying float vSeed; varying float vDist;
        void main() {
          vUv = uv; vSeed = aSeed;
          vec4 mv = modelViewMatrix * vec4(position, 1.0);
          vDist = -mv.z;
          gl_Position = projectionMatrix * mv;
        }`,
      /* glsl */ `
        ${COMMON}
        varying vec2 vUv; varying float vSeed; varying float vDist;
        void main() {
          float across = exp(-pow((vUv.y - 0.5) * 3.4, 2.0)); // soft silk, no hard edges
          float core = exp(-pow((vUv.y - 0.5) * 22.0, 2.0));  // and a fine bright thread
          float flow = 0.55 + 0.45 * sin(vUv.x * 60.0 - uTime * 7.0 + vSeed * 9.0);
          float ends = smoothstep(0.0, 0.05, vUv.x) * smoothstep(1.0, 0.94, vUv.x);
          vec3 col = spectrum(vSeed + vUv.x * 2.2 - uTime * 0.5);
          vec3 c = col * (across * 0.3 * flow + core * 1.2) * ends * (0.25 + 0.75 * exp(-vDist * 0.05));
          gl_FragColor = lightOut(warmed(c) * (1.0 - uOut * 0.6));
        }`,
    );
    this.keep(geo);
    world.add(new THREE.Mesh(geo, mat));
  }

  /* Crystal shards along the walls: clear glass, bright and dispersed at their edges. */
  private addShards(world: THREE.Group, n: number) {
    let s = 7;
    const rand = () => {
      s = (s * 16807) % 2147483647;
      return (s - 1) / 2147483646;
    };
    const parts: THREE.BufferGeometry[] = [];
    for (let i = 0; i < n; i++) {
      const g = new THREE.CylinderGeometry(
        0.01,
        0.18 + rand() * 0.24,
        1.8 + rand() * 2.6,
        rand() > 0.5 ? 3 : 6,
        1,
      );
      const side = rand() > 0.5 ? 1 : -1;
      g.rotateZ((rand() - 0.5) * 0.8);
      g.rotateY(rand() * Math.PI);
      g.translate(
        side * (W / 2 - 0.3 - rand() * 0.5),
        -H / 2 + 0.9 + rand() * (H - 1.8),
        -4 - rand() * (L - 18),
      );
      const cnt = g.attributes.position.count;
      g.setAttribute("aSeed", new THREE.BufferAttribute(new Float32Array(cnt).fill(rand()), 1));
      g.deleteAttribute("uv");
      parts.push(g);
    }
    const geo = mergeGeometries(parts)!;
    parts.forEach((p) => p.dispose());
    const mat = this.light(
      /* glsl */ `
        uniform float uOut;
        attribute float aSeed;
        varying vec3 vN; varying vec3 vV; varying float vSeed; varying float vZ;
        void main() {
          vSeed = aSeed; vZ = position.z;
          vec3 p = position; p.xy *= 1.0 + uOut * 1.4;
          vec4 mv = modelViewMatrix * vec4(p, 1.0);
          vN = normalize(normalMatrix * normal); vV = normalize(-mv.xyz);
          vZ = -mv.z;
          gl_Position = projectionMatrix * mv;
        }`,
      /* glsl */ `
        ${COMMON}
        varying vec3 vN; varying vec3 vV; varying float vSeed; varying float vZ;
        void main() {
          float fres = pow(1.0 - abs(dot(normalize(vN), normalize(vV))), 2.5);
          vec3 c = spectrum(vSeed + fres * 0.7 - uTime * 0.2) * fres * 1.4 * exp(-vZ * 0.06);
          gl_FragColor = lightOut(warmed(c) * (1.0 - uOut));
        }`,
    );
    this.keep(geo);
    world.add(new THREE.Mesh(geo, mat));
  }

  /* Sparkles drifting in the light; a third of them circle the opening in the vortex. */
  private addSparkles(world: THREE.Group, n: number) {
    const pos = new Float32Array(n * 3);
    const seed = new Float32Array(n);
    let s = 3;
    const rand = () => {
      s = (s * 16807) % 2147483647;
      return (s - 1) / 2147483646;
    };
    for (let i = 0; i < n; i++) {
      const vortex = i < n * 0.3;
      if (vortex) {
        const a = rand() * Math.PI * 2;
        const r = R * (1.02 + Math.pow(rand(), 1.5) * 1.3);
        pos[i * 3] = Math.cos(a) * r;
        pos[i * 3 + 1] = Math.sin(a) * r;
        pos[i * 3 + 2] = -L + 0.6 + rand() * 3;
      } else {
        pos[i * 3] = (rand() - 0.5) * W;
        pos[i * 3 + 1] = (rand() - 0.5) * H;
        pos[i * 3 + 2] = 2 - rand() * (L - 2);
      }
      seed[i] = vortex ? rand() + 10 : rand();
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    geo.setAttribute("aSeed", new THREE.BufferAttribute(seed, 1));
    const mat = this.light(
      /* glsl */ `
        uniform float uTime; uniform float uPx; uniform float uOut;
        attribute float aSeed;
        varying float vSeed;
        void main() {
          vSeed = fract(aSeed);
          vec3 p = position;
          if (aSeed > 9.0) {
            float a = uTime * (0.9 + vSeed); // the vortex turns
            p.xy = mat2(cos(a), -sin(a), sin(a), cos(a)) * p.xy;
          } else {
            p.y += sin(uTime * 0.6 + aSeed * 30.0) * 0.1;
            p.x += cos(uTime * 0.5 + aSeed * 20.0) * 0.1;
            p.xy *= 1.0 + uOut * 1.2;
          }
          vec4 mv = modelViewMatrix * vec4(p, 1.0);
          gl_PointSize = uPx * (0.5 + vSeed * 1.8) / max(-mv.z, 0.2);
          gl_Position = projectionMatrix * mv;
        }`,
      /* glsl */ `
        ${COMMON}
        varying float vSeed;
        void main() {
          vec2 d = gl_PointCoord - 0.5;
          float a = exp(-dot(d, d) * 20.0);
          float tw = 0.55 + 0.45 * sin(uTime * 3.0 + vSeed * 50.0);
          vec3 c = mix(vec3(1.0), spectrum(vSeed * 3.0), 0.75) * a * tw * 1.3;
          gl_FragColor = lightOut(warmed(c) * (1.0 - uOut * 0.8));
        }`,
      { uPx: { value: 60 } },
    );
    this.keep(geo);
    this.particles = mat;
    world.add(new THREE.Points(geo, mat));
  }

  /* Soft beams reaching back from the far end. */
  private addBeams(world: THREE.Group, n: number) {
    const parts: THREE.BufferGeometry[] = [];
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2 + 0.2;
      const g = new THREE.PlaneGeometry(1.1, L * 0.8);
      g.rotateX(-Math.PI / 2);
      g.rotateZ(a + Math.PI / 2);
      g.translate(Math.cos(a) * W * 0.28, Math.sin(a) * H * 0.28, -L * 0.6);
      const cnt = g.attributes.position.count;
      g.setAttribute("aSeed", new THREE.BufferAttribute(new Float32Array(cnt).fill(i / n), 1));
      g.deleteAttribute("normal");
      parts.push(g);
    }
    const geo = mergeGeometries(parts)!;
    parts.forEach((p) => p.dispose());
    const mat = this.light(
      /* glsl */ `
        attribute float aSeed; varying vec2 vUv; varying float vSeed;
        void main() { vUv = uv; vSeed = aSeed; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
      /* glsl */ `
        ${COMMON}
        varying vec2 vUv; varying float vSeed;
        void main() {
          float across = pow(sin(vUv.x * 3.14159), 2.0);
          float along = pow(vUv.y, 2.0);
          float sh = 0.7 + 0.3 * sin(uTime * 1.4 + vSeed * 12.0 + vUv.y * 6.0);
          vec3 c = mix(vec3(1.0), spectrum(vSeed), 0.7) * across * along * sh * 0.14;
          gl_FragColor = lightOut(warmed(c) * (1.0 - uOut));
        }`,
    );
    this.keep(geo);
    world.add(new THREE.Mesh(geo, mat));
  }

  private addFarGlow(world: THREE.Group) {
    this.glow = this.sprite("255,248,255", 1);
    this.glow.scale.set(R * 3.4, R * 3.4, 1);
    this.glow.position.z = -L + 0.6;
    world.add(this.glow);
  }

  /* ---------- the destination ---------- */

  /*
    The round opening: it writes "nothing" (alpha 0), so the live gallery canvas
    beneath shows through it. A soft rim of light circles it.
  */
  private addPortal(world: THREE.Group) {
    const geo = new THREE.CircleGeometry(R, 96);
    const hole = new THREE.MeshBasicMaterial({
      color: 0x000000,
      transparent: true,
      opacity: 0,
      blending: THREE.NoBlending,
      depthWrite: true,
    });
    const m = new THREE.Mesh(geo, hole);
    m.position.z = -L;
    m.renderOrder = -10; // first: the light in front adds over it
    world.add(m);
    const rimGeo = new THREE.RingGeometry(R * 0.86, R * 1.04, 96, 1);
    this.rim = this.light(
      /* glsl */ `varying vec3 vP; void main(){ vP = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
      /* glsl */ `
        ${COMMON}
        uniform float uFeather;
        varying vec3 vP;
        void main() {
          float r = length(vP.xy) / ${R.toFixed(2)};
          float ring = exp(-pow((r - 0.98) / 0.05, 2.0));
          vec3 c = mix(vec3(1.0, 0.96, 1.0), spectrum(atan(vP.y, vP.x) / 6.28318 + uTime * 0.2), 0.4) * ring * 1.4 * uFeather;
          gl_FragColor = lightOut(c);
        }`,
      { uFeather: { value: 0 } },
    );
    const rim = new THREE.Mesh(rimGeo, this.rim);
    rim.position.z = -L + 0.02;
    this.keep(geo, hole, rimGeo);
    world.add(rim);
  }

  /* The vortex: spiral arms of light turning round the opening. */
  private addVortex(world: THREE.Group, light: boolean) {
    const g = new THREE.Group();
    g.position.z = -L + 0.4;
    const arms = light ? 5 : 8;
    const parts: THREE.BufferGeometry[] = [];
    for (let i = 0; i < arms; i++) {
      const pos: number[] = [];
      const uv: number[] = [];
      const idx: number[] = [];
      const N = 120;
      for (let k = 0; k <= N; k++) {
        const u = k / N;
        const a = (i / arms) * Math.PI * 2 + u * 3.2;
        const r = R * (1.0 + u * 1.6);
        const w = 0.25 + u * 0.9;
        const cx = Math.cos(a);
        const cy = Math.sin(a);
        pos.push(
          cx * (r - w / 2),
          cy * (r - w / 2),
          -u * 1.5,
          cx * (r + w / 2),
          cy * (r + w / 2),
          -u * 1.5,
        );
        uv.push(u, 0, u, 1);
        if (k < N) {
          const o = k * 2;
          idx.push(o, o + 1, o + 2, o + 1, o + 3, o + 2);
        }
      }
      const geo = new THREE.BufferGeometry();
      geo.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
      geo.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
      geo.setAttribute(
        "aSeed",
        new THREE.Float32BufferAttribute(new Array(pos.length / 3).fill(i / arms), 1),
      );
      geo.setIndex(idx);
      parts.push(geo);
    }
    const geo = mergeGeometries(parts)!;
    parts.forEach((p) => p.dispose());
    const mat = this.light(
      /* glsl */ `
        attribute float aSeed; varying vec2 vUv; varying float vSeed;
        void main() { vUv = uv; vSeed = aSeed; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
      /* glsl */ `
        ${COMMON}
        varying vec2 vUv; varying float vSeed;
        void main() {
          float across = exp(-pow((vUv.y - 0.5) * 3.0, 2.0));
          float inner = pow(1.0 - vUv.x, 1.5); // brightest at the opening
          vec3 c = spectrum(vSeed + vUv.x * 1.2 - uTime * 0.4) * across * inner * 0.9;
          gl_FragColor = lightOut(warmed(c) * (1.0 - uOut));
        }`,
    );
    this.keep(geo);
    g.add(new THREE.Mesh(geo, mat));
    this.vortex = g;
    world.add(g);
  }

  /* The white light from the logo's opening, which you come out of. */
  private addFlash() {
    const geo = new THREE.PlaneGeometry(6, 6);
    const mat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      depthTest: false,
      depthWrite: false,
    });
    this.keep(geo, mat);
    this.flash = new THREE.Mesh(geo, mat);
    this.flash.position.z = -0.1;
    this.flash.renderOrder = 100;
    this.camera.add(this.flash);
  }

  /* ---------- sizing ---------- */

  setSize(w: number, h: number) {
    this.aspect = w / h;
    this.baseFov = this.aspect < 0.6 ? 80 : this.aspect < 0.9 ? 70 : 58;
    const dpr = Math.min(window.devicePixelRatio || 1, this.aspect < 0.9 ? 1.5 : 1.75);
    this.renderer.setPixelRatio(dpr);
    this.renderer.setSize(w, h, false);
    this.camera.aspect = this.aspect;
    this.camera.updateProjectionMatrix();
    if (this.particles) this.particles.uniforms.uPx.value = (h * dpr) / 14;
  }

  /* How tall the logo stood on screen (fraction of the screen's height) as it handed over. */
  setDoorFraction(f: number) {
    this.doorFraction = Math.max(0.05, f);
  }

  /*
    Draw the journey at t (0 = the logo's doors, 1 = in the gallery's
    opening). time keeps the light moving.
  */
  render(t: number, time: number) {
    const smooth = (a: number, b: number, x: number) => {
      const k = Math.min(1, Math.max(0, (x - a) / (b - a)));
      return k * k * (3 - 2 * k);
    };
    const ease = (x: number) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
    const tanV = Math.tan((this.baseFov * Math.PI) / 360);
    // Start where the doors stand as tall on screen as the logo did
    const d0 = (428 * PX) / (2 * tanV * this.doorFraction);
    // End where the round opening covers the whole screen
    const dEnd = (0.9 * R) / (tanV * Math.sqrt(1 + this.aspect * this.aspect));
    const z1 = -L + dEnd;
    const k = ease(t);
    const cam = this.camera;
    const sway = smooth(0.0, 0.3, t) * (1 - t);
    cam.position.set(
      Math.sin(t * 8) * 0.1 * sway,
      CY * smooth(0.04, 0.3, t) + Math.cos(t * 6) * 0.05 * sway,
      d0 + (z1 - d0) * k,
    );
    cam.rotation.set(0, 0, Math.sin(t * Math.PI) * 0.045);
    cam.fov = this.baseFov + Math.sin(Math.min(1, t * 1.2) * Math.PI) * 9;
    cam.updateProjectionMatrix();

    // 03: the doors swing open, light pours out
    const open = smooth(0.0, 0.2, t) * 1.45;
    this.leftDoor.rotation.y = open;
    this.rightDoor.rotation.y = -open;
    this.leftDoor.visible = this.rightDoor.visible = t < 0.4;
    const pour = smooth(0, 0.08, t) * (1 - smooth(0.18, 0.32, t));
    this.doorLight.visible = pour > 0.001;
    this.rayFade.value = pour;
    (this.doorCore.material as THREE.SpriteMaterial).opacity = pour;
    (this.flash.material as THREE.MeshBasicMaterial).opacity = 1 - smooth(0, 0.07, t);

    // 06: the vortex turns round the opening
    this.vortex.rotation.z = -time * 0.6;
    (this.glow.material as THREE.SpriteMaterial).opacity = 1 - smooth(0.5, 0.72, t);
    this.rim.uniforms.uFeather.value = smooth(0.45, 0.6, t) * (1 - smooth(0.8, 0.95, t));

    this.shared.uTime.value = time;
    this.shared.uWarm.value = smooth(0.66, 1, t);
    this.shared.uOut.value = smooth(0.8, 1, t);
    this.renderer.render(this.scene, cam);
  }

  dispose() {
    this.disposables.forEach((d) => d.dispose());
    this.renderer.dispose();
  }
}
