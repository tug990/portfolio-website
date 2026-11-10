import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";

/*
  The prism tunnel: the passage between the logo and the gallery.

  You come out of the white light of the logo's opening into a long corridor
  made of optical glass:
    - glass gates every few metres, with spectral light running along their edges
    - layered glass walls, floor and ceiling, with slow caustics moving through them
    - tall crystal shards along the walls, bright at their edges
    - ribbons of RGB light flowing down the corridor, winding into a swirl at the end
    - luminous particles drifting in the air, and beams of light from the far end
  At the far end there's an opening, and through it the real gallery: this
  canvas is transparent there, so the live gallery canvas beneath shows
  through. As the camera reaches the opening it fills the screen; the tunnel
  warms, thins out and fades, and you're in the gallery.

  Everything is drawn with additive light in custom shaders (no textures to
  download), on its own canvas, and only while the journey is playing.
*/

const W = 7; // corridor width
const H = 4.4; // and height (centred on the camera's eye line)
const L = 64; // length, to the opening
const GATE_GAP = 3.2;

const SPECTRUM_GLSL = /* glsl */ `
  vec3 spectrum(float t) {
    t = fract(t);
    vec3 c = mix(vec3(0.42, 0.10, 1.00), vec3(0.12, 0.32, 1.00), smoothstep(0.00, 0.16, t)); // violet, electric blue
    c = mix(c, vec3(0.10, 0.85, 1.00), smoothstep(0.16, 0.32, t));                           // cyan
    c = mix(c, vec3(1.00, 0.95, 0.98), smoothstep(0.32, 0.44, t));                           // white
    c = mix(c, vec3(1.00, 0.72, 0.25), smoothstep(0.44, 0.58, t));                           // amber
    c = mix(c, vec3(1.00, 0.25, 0.75), smoothstep(0.58, 0.78, t));                           // magenta
    c = mix(c, vec3(0.42, 0.10, 1.00), smoothstep(0.78, 1.00, t));                           // back to violet
    return c;
  }
`;

// Shared uniforms: time, how warm the light has turned, how much the tunnel has dissolved
type Shared = { uTime: { value: number }; uWarm: { value: number }; uOut: { value: number } };

const COMMON = /* glsl */ `
  uniform float uTime;
  uniform float uWarm;
  uniform float uOut;
  ${SPECTRUM_GLSL}
  // Light, as premultiplied colour: as opaque as it is bright, so faint light
  // over the opening still lets the gallery show through
  vec4 lightOut(vec3 c) {
    c = max(c, 0.0);
    return vec4(c, clamp(max(c.r, max(c.g, c.b)), 0.0, 1.0));
  }
  vec3 warmed(vec3 c) {
    // towards the gallery's amber, and quieter, as you arrive
    return mix(c, vec3(1.0, 0.7, 0.42) * dot(c, vec3(0.3, 0.5, 0.2)) * 1.3, uWarm);
  }
`;

export class PrismTunnel {
  private renderer: THREE.WebGLRenderer;
  private scene = new THREE.Scene();
  private camera: THREE.PerspectiveCamera;
  private shared: Shared = { uTime: { value: 0 }, uWarm: { value: 0 }, uOut: { value: 0 } };
  private disposables: { dispose: () => void }[] = [];
  private flash: THREE.Mesh; // the white light you come out of
  private glow: THREE.Sprite; // the bright far end
  private aspect = 1;
  private baseFov = 62;

  constructor(canvas: HTMLCanvasElement, opts: { light: boolean }) {
    const renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true, // see-through where the opening is: the gallery shows there
      antialias: true,
      powerPreference: "high-performance",
    });
    renderer.setClearColor(new THREE.Color(0.02, 0.012, 0.045), 1);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer = renderer;
    this.camera = new THREE.PerspectiveCamera(62, 1, 0.05, 140);

    const light = opts.light; // a lighter build for phones
    this.addOpening();
    this.addGates();
    this.addGlassWalls(light);
    this.addShards(light ? 22 : 40);
    this.addRibbons(light ? 5 : 8);
    this.addParticles(light ? 1400 : 3200);
    this.addBeams(light ? 6 : 10);
    this.glow = this.addFarGlow();
    this.flash = this.addFlash();
  }

  /* ---------- the pieces ---------- */

  private keep(...t: { dispose: () => void }[]) {
    this.disposables.push(...t);
  }

  private additive(vertex: string, fragment: string, extra: Record<string, THREE.IUniform> = {}) {
    const m = new THREE.ShaderMaterial({
      uniforms: { ...this.shared, ...extra },
      vertexShader: vertex,
      fragmentShader: fragment,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      premultipliedAlpha: true, // add light, and only as much cover as it has brightness
      side: THREE.DoubleSide,
    });
    this.keep(m);
    return m;
  }

  /* The opening at the far end: it writes "nothing" (alpha 0), so the gallery shows through. */
  private addOpening() {
    const geo = new THREE.PlaneGeometry(W * 0.985, H * 0.985);
    const mat = new THREE.MeshBasicMaterial({
      color: 0x000000,
      transparent: true,
      opacity: 0,
      blending: THREE.NoBlending,
      depthWrite: true,
    });
    this.keep(geo, mat);
    const m = new THREE.Mesh(geo, mat);
    m.position.z = -L;
    m.renderOrder = -10; // first: everything else adds its light over it
    this.scene.add(m);
  }

  /* Glass gates: rectangles of thin glass edge, light running along them. */
  private addGates() {
    const parts: THREE.BufferGeometry[] = [];
    const t = 0.035;
    for (let z = -1.5; z > -L + 1; z -= GATE_GAP) {
      // gates near the end open out, as the tunnel opens round the gallery
      const k = Math.max(0, (-z - (L - 14)) / 14);
      const sw = W * (1 + k * k * 0.9);
      const sh = H * (1 + k * k * 0.9);
      const edges: [number, number, number, number, number][] = [
        // cx, cy, w, h, start-of-edge param
        [0, sh / 2, sw, t, 0],
        [sw / 2, 0, t, sh, 0.25],
        [0, -sh / 2, sw, t, 0.5],
        [-sw / 2, 0, t, sh, 0.75],
      ];
      edges.forEach(([cx, cy, ew, eh, e0]) => {
        const g = new THREE.BoxGeometry(ew, eh, t);
        g.translate(cx, cy, z);
        const n = g.attributes.position.count;
        const aZ = new Float32Array(n).fill(z);
        const aE = new Float32Array(n);
        const pos = g.attributes.position;
        for (let i = 0; i < n; i++) {
          const along = ew > eh ? (pos.getX(i) + sw / 2) / sw : (pos.getY(i) + sh / 2) / sh;
          aE[i] = e0 + along * 0.25;
        }
        g.setAttribute("aZ", new THREE.BufferAttribute(aZ, 1));
        g.setAttribute("aE", new THREE.BufferAttribute(aE, 1));
        g.deleteAttribute("uv");
        g.deleteAttribute("normal");
        parts.push(g);
      });
    }
    const geo = mergeGeometries(parts)!;
    parts.forEach((p) => p.dispose());
    const mat = this.additive(
      /* glsl */ `
        attribute float aZ; attribute float aE;
        varying float vZ; varying float vE;
        void main() { vZ = aZ; vE = aE; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
      /* glsl */ `
        ${COMMON}
        varying float vZ; varying float vE;
        void main() {
          // spectral light travelling round each gate, and down the corridor
          float hue = vE * 1.0 + vZ * 0.02 - uTime * 0.45;
          // the glass edge is mostly quiet; light travels round it in bright pulses
          float pulse = pow(0.5 + 0.5 * sin(vE * 6.2832 * 2.0 - uTime * 7.0 + vZ * 0.35), 8.0);
          vec3 c = warmed(spectrum(hue)) * (0.12 + pulse * 1.5);
          float fade = 1.0 - uOut;
          gl_FragColor = lightOut(c * fade);
        }`,
    );
    this.keep(geo);
    this.scene.add(new THREE.Mesh(geo, mat));
  }

  /*
    Glass walls, floor and ceiling between the gates, in two layers: faint,
    with caustics drifting through them and brighter where they meet.
  */
  private addGlassWalls(light: boolean) {
    const parts: THREE.BufferGeometry[] = [];
    const layers = light ? [1] : [1, 0.86];
    layers.forEach((s, layer) => {
      for (let z = -1.5; z > -L + 1; z -= GATE_GAP) {
        const zc = z - GATE_GAP / 2;
        const walls: [number, number, number, number, number][] = [
          // x, y, rotY, rotX, size across
          [(-W / 2) * s, 0, Math.PI / 2, 0, H * s],
          [(W / 2) * s, 0, -Math.PI / 2, 0, H * s],
          [0, (H / 2) * s, 0, Math.PI / 2, W * s],
          [0, (-H / 2) * s, 0, -Math.PI / 2, W * s],
        ];
        walls.forEach(([x, y, ry, rx, across]) => {
          const g = new THREE.PlaneGeometry(GATE_GAP * 0.995, across);
          if (rx !== 0) {
            g.rotateZ(Math.PI / 2);
            g.rotateX(rx);
          } else g.rotateY(ry);
          g.translate(x, y, zc);
          const n = g.attributes.position.count;
          g.setAttribute("aLayer", new THREE.BufferAttribute(new Float32Array(n).fill(layer), 1));
          g.deleteAttribute("normal");
          parts.push(g);
        });
      }
    });
    const geo = mergeGeometries(parts)!;
    parts.forEach((p) => p.dispose());
    const mat = this.additive(
      /* glsl */ `
        attribute float aLayer;
        varying vec2 vUv; varying vec3 vPos; varying float vLayer;
        void main() {
          vUv = uv; vLayer = aLayer;
          vPos = position;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }`,
      /* glsl */ `
        ${COMMON}
        varying vec2 vUv; varying vec3 vPos; varying float vLayer;
        void main() {
          // brighter at the panel's edges (glass seen edge-on), faint in the middle
          vec2 e = min(vUv, 1.0 - vUv);
          float edge = pow(1.0 - min(e.x, e.y) * 2.0, 6.0);
          // caustics: interfering ripples of light moving through the glass
          vec3 p = vPos * 0.9;
          float c1 = sin(p.x * 2.1 + p.z * 0.7 + uTime * 1.3) * sin(p.y * 2.6 - p.z * 0.9 - uTime * 1.1);
          float c2 = sin((p.x + p.y) * 3.3 - p.z * 1.2 + uTime * 1.7);
          float caust = pow(clamp(0.5 + 0.5 * (c1 + 0.6 * c2) * 0.62, 0.0, 1.0), 5.0);
          float hue = vPos.z * 0.018 + vUv.y * 0.35 + vLayer * 0.27 - uTime * 0.12;
          vec3 tint = warmed(spectrum(hue));
          vec3 deep = vec3(0.16, 0.06, 0.42); // deep violet body of the glass
          vec3 c = deep * 0.14 + tint * (edge * 0.4 + caust * 0.4);
          // farther away, a little hazier and dimmer
          float far = exp(-max(-vPos.z, 0.0) * 0.012);
          gl_FragColor = lightOut(c * (0.6 + 0.4 * far) * (1.0 - uOut) * (vLayer > 0.5 ? 0.6 : 1.0));
        }`,
    );
    this.keep(geo);
    this.scene.add(new THREE.Mesh(geo, mat));
  }

  /* Crystal shards: tall faceted prisms leaning against the walls, bright at their edges. */
  private addShards(n: number) {
    let s = 7;
    const rand = () => {
      s = (s * 16807) % 2147483647;
      return (s - 1) / 2147483646;
    };
    const parts: THREE.BufferGeometry[] = [];
    for (let i = 0; i < n; i++) {
      const g = new THREE.CylinderGeometry(
        0.01,
        0.16 + rand() * 0.22,
        1.6 + rand() * 2.6,
        rand() > 0.5 ? 3 : 6,
        1,
      );
      const side = rand() > 0.5 ? 1 : -1;
      const onWall = rand() > 0.3;
      g.rotateZ((rand() - 0.5) * 0.9 + (onWall ? 0 : side * 1.2));
      g.rotateY(rand() * Math.PI);
      const z = -2 - rand() * (L - 14);
      const x = onWall ? side * (W / 2 - 0.25 - rand() * 0.4) : (rand() - 0.5) * W * 0.8;
      const y = onWall ? -H / 2 + 0.9 + rand() * (H - 1.8) : side * (H / 2 - 0.3);
      g.translate(x, y, z);
      const cnt = g.attributes.position.count;
      g.setAttribute("aSeed", new THREE.BufferAttribute(new Float32Array(cnt).fill(rand()), 1));
      g.deleteAttribute("uv");
      parts.push(g);
    }
    const geo = mergeGeometries(parts)!;
    parts.forEach((p) => p.dispose());
    const mat = this.additive(
      /* glsl */ `
        attribute float aSeed;
        varying vec3 vN; varying vec3 vView; varying float vSeed; varying float vZ;
        void main() {
          vSeed = aSeed; vZ = position.z;
          vec4 mv = modelViewMatrix * vec4(position, 1.0);
          vN = normalize(normalMatrix * normal);
          vView = normalize(-mv.xyz);
          gl_Position = projectionMatrix * mv;
        }`,
      /* glsl */ `
        ${COMMON}
        varying vec3 vN; varying vec3 vView; varying float vSeed; varying float vZ;
        void main() {
          // glass: almost clear face-on, bright and dispersed where you see it edge-on
          float fres = pow(1.0 - abs(dot(normalize(vN), normalize(vView))), 3.0);
          float hue = vSeed + fres * 0.6 - uTime * 0.2 + vZ * 0.01;
          vec3 c = warmed(spectrum(hue)) * (0.06 + fres * 1.1);
          gl_FragColor = lightOut(c * (1.0 - uOut));
        }`,
    );
    this.keep(geo);
    this.scene.add(new THREE.Mesh(geo, mat));
  }

  /* Ribbons of light winding down the corridor and swirling round the far end. */
  private addRibbons(n: number) {
    const geos: THREE.BufferGeometry[] = [];
    const halos: THREE.BufferGeometry[] = [];
    for (let i = 0; i < n; i++) {
      const a0 = (i / n) * Math.PI * 2;
      const pts: THREE.Vector3[] = [];
      for (let z = 4; z >= -L + 0.5; z -= 0.8) {
        const d = -z / L; // 0 at the start, 1 at the far end
        const twist = z * 0.11 + Math.pow(Math.max(0, d - 0.75) * 4, 2) * 2.6; // a swirl as it reaches the end
        const r = 1 + 0.12 * Math.sin(z * 0.3 + i);
        const a = a0 + twist + Math.sin(z * 0.17 + i * 1.7) * 0.35;
        pts.push(
          new THREE.Vector3(Math.cos(a) * (W / 2 - 0.6) * r, Math.sin(a) * (H / 2 - 0.5) * r, z),
        );
      }
      const curve = new THREE.CatmullRomCurve3(pts);
      const seg = Math.round(pts.length * 2.5);
      const core = new THREE.TubeGeometry(curve, seg, 0.022, 6, false);
      const halo = new THREE.TubeGeometry(curve, seg, 0.08, 8, false);
      for (const g of [core, halo]) {
        const cnt = g.attributes.position.count;
        g.setAttribute("aSeed", new THREE.BufferAttribute(new Float32Array(cnt).fill(i / n), 1));
        g.deleteAttribute("normal");
      }
      geos.push(core);
      halos.push(halo);
    }
    const vert = /* glsl */ `
      attribute float aSeed;
      varying float vAlong; varying float vSeed; varying float vAcross;
      void main() {
        vAlong = uv.x; vAcross = uv.y; vSeed = aSeed;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }`;
    const frag = (strength: number) => /* glsl */ `
      ${COMMON}
      varying float vAlong; varying float vSeed; varying float vAcross;
      void main() {
        // colour flowing along the ribbon, towards the far end
        float hue = vSeed + vAlong * 2.5 - uTime * 0.8;
        float flow = 0.5 + 0.5 * sin(vAlong * 70.0 - uTime * 9.0 + vSeed * 6.0);
        float ends = smoothstep(0.0, 0.04, vAlong) * smoothstep(1.0, 0.9, vAlong);
        vec3 c = warmed(spectrum(hue)) * (0.55 + 0.45 * flow) * ends * ${strength.toFixed(2)};
        gl_FragColor = lightOut(c * (1.0 - uOut * 0.7));
      }`;
    const coreGeo = mergeGeometries(geos)!;
    const haloGeo = mergeGeometries(halos)!;
    [...geos, ...halos].forEach((g) => g.dispose());
    this.keep(coreGeo, haloGeo);
    this.scene.add(new THREE.Mesh(coreGeo, this.additive(vert, frag(1.8))));
    this.scene.add(new THREE.Mesh(haloGeo, this.additive(vert, frag(0.12))));
  }

  /* Luminous particles drifting in the air. */
  private addParticles(n: number) {
    const pos = new Float32Array(n * 3);
    const seed = new Float32Array(n);
    let s = 3;
    const rand = () => {
      s = (s * 16807) % 2147483647;
      return (s - 1) / 2147483646;
    };
    for (let i = 0; i < n; i++) {
      pos[i * 3] = (rand() - 0.5) * W * 0.95;
      pos[i * 3 + 1] = (rand() - 0.5) * H * 0.95;
      pos[i * 3 + 2] = 4 - rand() * (L + 2);
      seed[i] = rand();
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    geo.setAttribute("aSeed", new THREE.BufferAttribute(seed, 1));
    const mat = this.additive(
      /* glsl */ `
        uniform float uTime;
        uniform float uPx;
        attribute float aSeed;
        varying float vSeed;
        void main() {
          vSeed = aSeed;
          vec3 p = position;
          p.y += sin(uTime * 0.6 + aSeed * 30.0) * 0.08;
          p.x += cos(uTime * 0.5 + aSeed * 20.0) * 0.08;
          vec4 mv = modelViewMatrix * vec4(p, 1.0);
          gl_PointSize = uPx * (0.6 + aSeed * 1.6) / max(-mv.z, 0.2);
          gl_Position = projectionMatrix * mv;
        }`,
      /* glsl */ `
        ${COMMON}
        varying float vSeed;
        void main() {
          vec2 d = gl_PointCoord - 0.5;
          float a = exp(-dot(d, d) * 18.0);
          float tw = 0.6 + 0.4 * sin(uTime * 3.0 + vSeed * 50.0);
          vec3 c = warmed(mix(vec3(1.0), spectrum(vSeed * 3.0), 0.55)) * a * tw * 0.9;
          gl_FragColor = lightOut(c * (1.0 - uOut));
        }`,
      { uPx: { value: 60 } },
    );
    this.keep(geo);
    this.particles = mat;
    this.scene.add(new THREE.Points(geo, mat));
  }
  private particles?: THREE.ShaderMaterial;

  /* Long beams of light reaching back from the far end. */
  private addBeams(n: number) {
    const parts: THREE.BufferGeometry[] = [];
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2 + 0.3;
      const g = new THREE.PlaneGeometry(0.9, L * 0.85);
      g.rotateX(-Math.PI / 2); // along the corridor
      g.rotateZ(a + Math.PI / 2); // facing the axis
      g.translate(Math.cos(a) * W * 0.3, Math.sin(a) * H * 0.3, -L * 0.55);
      const cnt = g.attributes.position.count;
      g.setAttribute("aSeed", new THREE.BufferAttribute(new Float32Array(cnt).fill(i / n), 1));
      g.deleteAttribute("normal");
      parts.push(g);
    }
    const geo = mergeGeometries(parts)!;
    parts.forEach((p) => p.dispose());
    const mat = this.additive(
      /* glsl */ `
        attribute float aSeed;
        varying vec2 vUv; varying float vSeed;
        void main() { vUv = uv; vSeed = aSeed; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
      /* glsl */ `
        ${COMMON}
        varying vec2 vUv; varying float vSeed;
        void main() {
          float across = pow(sin(vUv.x * 3.14159), 2.0);
          float along = pow(vUv.y, 2.2); // brightest at the far end, fading towards you
          float shimmer = 0.7 + 0.3 * sin(uTime * 1.5 + vSeed * 12.0 + vUv.y * 8.0);
          vec3 c = warmed(mix(vec3(1.0), spectrum(vSeed), 0.5)) * across * along * shimmer * 0.12;
          gl_FragColor = lightOut(c * (1.0 - uOut));
        }`,
    );
    this.keep(geo);
    this.scene.add(new THREE.Mesh(geo, mat));
  }

  /* The bright far end, before the gallery shows through it. */
  private addFarGlow() {
    const c = document.createElement("canvas");
    c.width = c.height = 128;
    const ctx = c.getContext("2d")!;
    const g = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
    g.addColorStop(0, "rgba(255,255,255,1)");
    g.addColorStop(0.3, "rgba(240,230,255,0.45)");
    g.addColorStop(1, "rgba(200,180,255,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 128, 128);
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    const mat = new THREE.SpriteMaterial({
      map: tex,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      transparent: true,
    });
    this.keep(tex, mat);
    const s = new THREE.Sprite(mat);
    s.scale.set(H * 2.6, H * 2.6, 1);
    s.position.z = -L + 0.5;
    this.scene.add(s);
    return s;
  }

  /* The white light from the logo's opening, which you come out of. */
  private addFlash() {
    const geo = new THREE.PlaneGeometry(4, 4);
    const mat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      depthTest: false,
      depthWrite: false,
    });
    this.keep(geo, mat);
    const m = new THREE.Mesh(geo, mat);
    m.position.z = -0.1;
    m.renderOrder = 100;
    this.camera.add(m);
    this.scene.add(this.camera);
    return m;
  }

  /* ---------- sizing ---------- */

  setSize(w: number, h: number) {
    this.aspect = w / h;
    // Tall screens get a wider lens, so the corridor still surrounds you
    this.baseFov = this.aspect < 0.6 ? 84 : this.aspect < 0.9 ? 74 : 62;
    const dpr = Math.min(window.devicePixelRatio || 1, this.aspect < 0.9 ? 1.5 : 1.75);
    this.renderer.setPixelRatio(dpr);
    this.renderer.setSize(w, h, false);
    this.camera.aspect = this.aspect;
    this.camera.updateProjectionMatrix();
    if (this.particles) this.particles.uniforms.uPx.value = (h * dpr) / 14;
  }

  /*
    Draw the tunnel at progress t (0 = just through the logo, 1 = at the
    gallery). `time` keeps the light moving.
  */
  render(t: number, time: number) {
    const ease = (x: number) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
    const smooth = (a: number, b: number, x: number) => {
      const k = Math.min(1, Math.max(0, (x - a) / (b - a)));
      return k * k * (3 - 2 * k);
    };
    // Stop where the opening fills the whole screen
    const tanV = Math.tan((this.baseFov * Math.PI) / 360);
    const dEnd = 0.82 * Math.min(H / (2 * tanV), W / (2 * tanV * this.aspect));
    const z0 = 3;
    const z1 = -L + dEnd;
    const k = ease(t);
    const cam = this.camera;
    cam.position.set(
      Math.sin(t * 9) * 0.12 * (1 - t),
      Math.cos(t * 7) * 0.06 * (1 - t),
      z0 + (z1 - z0) * k,
    );
    cam.rotation.set(0, 0, Math.sin(t * Math.PI) * 0.05);
    // the perspective widens a little as you pick up speed
    cam.fov = this.baseFov + Math.sin(t * Math.PI) * 8;
    cam.updateProjectionMatrix();

    this.shared.uTime.value = time;
    this.shared.uWarm.value = smooth(0.62, 1, t);
    this.shared.uOut.value = smooth(0.82, 1, t);
    (this.flash.material as THREE.MeshBasicMaterial).opacity = 1 - smooth(0, 0.14, t);
    (this.glow.material as THREE.SpriteMaterial).opacity = 1 - smooth(0.5, 0.74, t);
    this.renderer.render(this.scene, cam);
  }

  dispose() {
    this.disposables.forEach((d) => d.dispose());
    this.renderer.dispose();
  }
}
