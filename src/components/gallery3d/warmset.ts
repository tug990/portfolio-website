import * as THREE from "three";
import { Reflector } from "three/examples/jsm/objects/Reflector.js";

/*
  The warm exhibition set, after the art direction (a gallery at night):

  - Black track rails along the ceiling, hung with spotlights; each one aimed
    at a wall throws a scallop of warm light up it.
  - The centrepiece: a crystal pyramid on a pale stone plinth with the logo
    inlaid, a warm glow under it, and two rainbows fanning across the floor
    from it.
  - A long leather bench on a brass frame in the foreground.
  - The exhibition title in vinyl lettering on the far wall.
  - Framed landscapes along the walls, each with its label.
  - A soft reflection in the dark polished floor.

  Each piece adds itself to the scene and registers what it made for disposal.
*/

export type SetCtx = {
  scene: THREE.Scene;
  keep: (...things: { dispose: () => void }[]) => void;
  hq: boolean;
};

const WARM = new THREE.Color(1, 0.72, 0.42);

/* ---------- canvases ---------- */

function canvasTexture(w: number, h: number, draw: (ctx: CanvasRenderingContext2D) => void) {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  draw(c.getContext("2d")!);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

/*
  A scallop: what a spotlight close to a wall throws on it. Bright and narrow
  just under the lamp, widening as it falls, with a soft curved lower edge.
*/
function scallopTexture() {
  return canvasTexture(128, 256, (ctx) => {
    const w = 128;
    const h = 256;
    const img = ctx.createImageData(w, h);
    for (let y = 0; y < h; y++) {
      const v = y / (h - 1);
      for (let x = 0; x < w; x++) {
        const u = (x / (w - 1)) * 2 - 1;
        const half = 0.12 + 0.88 * Math.pow(v, 0.55); // how wide the beam is at this height
        const across = Math.max(0, 1 - Math.pow(Math.abs(u) / half, 2.2));
        const bottom = 0.92 - 0.3 * u * u; // the curved lower edge
        const fade = Math.min(1, Math.max(0, (bottom - v) / 0.16));
        const top = Math.min(1, v / 0.05);
        const rim = Math.exp(-Math.pow((v - bottom + 0.06) / 0.05, 2)) * 0.35; // a little brighter at the edge
        const a = (across * (0.35 + 0.65 * Math.pow(1 - v, 0.7)) + rim * across) * fade * top;
        const i = (y * w + x) * 4;
        img.data[i] = 255;
        img.data[i + 1] = 214;
        img.data[i + 2] = 160;
        img.data[i + 3] = Math.min(255, 255 * a);
      }
    }
    ctx.putImageData(img, 0, 0);
  });
}

/* A soft pool of light: white at the centre, gone at the edge. */
function poolTexture(rgb: string) {
  return canvasTexture(128, 128, (ctx) => {
    const g = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
    g.addColorStop(0, `rgba(${rgb},1)`);
    g.addColorStop(0.4, `rgba(${rgb},0.4)`);
    g.addColorStop(1, `rgba(${rgb},0)`);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 128, 128);
  });
}

/* A rainbow beam: a fan of spectrum, narrow at the prism, spreading and fading. */
function beamTexture() {
  return canvasTexture(512, 128, (ctx) => {
    const w = 512;
    const h = 128;
    const bands = [
      [255, 40, 40],
      [255, 140, 0],
      [255, 230, 30],
      [60, 220, 90],
      [40, 170, 255],
      [90, 70, 255],
      [190, 70, 255],
    ];
    const img = ctx.createImageData(w, h);
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const u = x / w; // 0 at the prism
        const spread = 0.18 + u * 0.82;
        const v = (y / h - 0.5) / spread + 0.5;
        if (v < 0 || v > 1) continue;
        const f = v * (bands.length - 1);
        const k = Math.min(bands.length - 2, Math.floor(f));
        const t = f - k;
        const across = Math.pow(Math.sin(v * Math.PI), 0.8);
        const along = Math.min(1, u * 10) * Math.pow(1 - u, 1.1);
        const i = (y * w + x) * 4;
        for (let ch = 0; ch < 3; ch++)
          img.data[i + ch] = bands[k][ch] * (1 - t) + bands[k + 1][ch] * t;
        img.data[i + 3] = 255 * across * along;
      }
    }
    ctx.putImageData(img, 0, 0);
  });
}

/*
  A landscape photograph stand-in, painted live: sky, a low sun, misty ridges
  fading into the distance, and pines on the nearest one. Each seed and look
  gives a different picture.
*/
type Look = {
  sky: [string, string];
  sun: string;
  ridge: [number, number, number];
  mist: string;
  trees: boolean;
};
const LOOKS: Look[] = [
  {
    sky: ["#bcd3d8", "#eef0e6"],
    sun: "rgba(255,250,235,0.0)",
    ridge: [38, 62, 52],
    mist: "#dfe6e0",
    trees: true,
  }, // misty forest
  {
    sky: ["#f2a65a", "#ffe0a6"],
    sun: "rgba(255,238,190,0.95)",
    ridge: [44, 26, 16],
    mist: "#f6c27f",
    trees: true,
  }, // forest sunrise
  {
    sky: ["#6c7fa6", "#e7c6b0"],
    sun: "rgba(255,226,196,0.6)",
    ridge: [52, 58, 82],
    mist: "#c9b7bf",
    trees: false,
  }, // mountain dusk
  {
    sky: ["#e2702c", "#ffc46b"],
    sun: "rgba(255,240,180,1)",
    ridge: [30, 16, 10],
    mist: "#f2a052",
    trees: false,
  }, // desert sunset
  {
    sky: ["#9fb4c9", "#e9e5dc"],
    sun: "rgba(255,255,255,0.4)",
    ridge: [70, 82, 96],
    mist: "#d6dbe0",
    trees: false,
  }, // alpine haze
];

export function landscapeTexture(seed: number, w: number, h: number) {
  const look = LOOKS[seed % LOOKS.length];
  let s = seed * 9301 + 49297;
  const rand = () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
  const tex = canvasTexture(w, h, (ctx) => {
    const sky = ctx.createLinearGradient(0, 0, 0, h * 0.75);
    sky.addColorStop(0, look.sky[0]);
    sky.addColorStop(1, look.sky[1]);
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, w, h);
    // The sun, low, behind the ridges
    const sx = w * (0.25 + rand() * 0.5);
    const sy = h * (0.42 + rand() * 0.12);
    const sun = ctx.createRadialGradient(sx, sy, 0, sx, sy, w * 0.45);
    sun.addColorStop(0, look.sun);
    sun.addColorStop(1, "rgba(255,240,200,0)");
    ctx.fillStyle = sun;
    ctx.fillRect(0, 0, w, h);
    // Ridges, far to near: each one darker and less misty
    const layers = 5;
    for (let L = 0; L < layers; L++) {
      const k = L / (layers - 1);
      const base = h * (0.45 + k * 0.38);
      const amp = h * (0.06 + k * 0.08);
      const f1 = 1.5 + rand() * 2;
      const f2 = 5 + rand() * 6;
      const p1 = rand() * 6;
      const p2 = rand() * 6;
      const [r, g, b] = look.ridge;
      const mixAmt = 0.75 * (1 - k);
      const mist = new THREE.Color(look.mist);
      const col = `rgb(${Math.round(r + (mist.r * 255 - r) * mixAmt)},${Math.round(
        g + (mist.g * 255 - g) * mixAmt,
      )},${Math.round(b + (mist.b * 255 - b) * mixAmt)})`;
      ctx.fillStyle = col;
      ctx.beginPath();
      ctx.moveTo(0, h);
      for (let x = 0; x <= w; x += 4) {
        const t = x / w;
        const y =
          base -
          amp *
            (Math.sin(t * f1 * Math.PI + p1) * 0.6 + Math.sin(t * f2 * Math.PI + p2) * 0.25 + 0.3);
        ctx.lineTo(x, y);
      }
      ctx.lineTo(w, h);
      ctx.fill();
      // Pines along the nearer ridges
      if (look.trees && L >= layers - 2) {
        const n = 26 + Math.floor(rand() * 20);
        for (let i = 0; i < n; i++) {
          const x = rand() * w;
          const t = x / w;
          const y =
            base -
            amp *
              (Math.sin(t * f1 * Math.PI + p1) * 0.6 +
                Math.sin(t * f2 * Math.PI + p2) * 0.25 +
                0.3);
          const th = h * (0.05 + rand() * 0.1) * (L === layers - 1 ? 1.4 : 0.9);
          ctx.beginPath();
          ctx.moveTo(x, y - th);
          ctx.lineTo(x - th * 0.22, y + 2);
          ctx.lineTo(x + th * 0.22, y + 2);
          ctx.fill();
        }
      }
      // Mist settling in the valley in front of this ridge
      const fog = ctx.createLinearGradient(0, base - amp, 0, base + h * 0.05);
      fog.addColorStop(0, "rgba(255,255,255,0)");
      fog.addColorStop(1, `${look.mist}55`);
      ctx.fillStyle = fog;
      ctx.fillRect(0, base - amp, w, h * 0.12);
    }
  });
  tex.anisotropy = 4;
  return tex;
}

/* ---------- track lighting ---------- */

export type Fixture = {
  at: THREE.Vector3; // the lamp
  aim: THREE.Vector3; // where it points
  /* the wall it washes, if any: the point on the wall under the lamp, and the wall's normal */
  wash?: { at: THREE.Vector3; normal: THREE.Vector3; strength?: number };
};

export function addTrackLighting(
  ctx: SetCtx,
  H: number,
  rails: { from: THREE.Vector3; to: THREE.Vector3 }[],
  fixtures: Fixture[],
) {
  const { scene, keep } = ctx;
  const black = new THREE.MeshStandardMaterial({
    color: 0x0d0c0b,
    roughness: 0.42,
    metalness: 0.6,
  });
  keep(black);

  // Rails
  rails.forEach(({ from, to }) => {
    const len = from.distanceTo(to);
    const g = new THREE.BoxGeometry(0.04, 0.035, len);
    keep(g);
    const m = new THREE.Mesh(g, black);
    m.position.copy(from).add(to).multiplyScalar(0.5);
    m.position.y = H - 0.02;
    m.lookAt(to.x, m.position.y, to.z);
    scene.add(m);
  });

  // Lamps: a short stem down from the rail, a housing pointed at its aim, a glowing lens
  const n = fixtures.length;
  const housingGeo = new THREE.CylinderGeometry(0.048, 0.04, 0.19, 18, 1);
  housingGeo.rotateX(Math.PI / 2); // along +z, so lookAt aims it
  const lensGeo = new THREE.CircleGeometry(0.036, 20);
  lensGeo.translate(0, 0, 0.0955);
  const stemGeo = new THREE.CylinderGeometry(0.008, 0.008, 1, 8);
  const lensMat = new THREE.MeshBasicMaterial({
    color: new THREE.Color(1, 0.86, 0.62).multiplyScalar(5),
    toneMapped: false,
  });
  keep(housingGeo, lensGeo, stemGeo, lensMat);
  const housings = new THREE.InstancedMesh(housingGeo, black, n);
  const lenses = new THREE.InstancedMesh(lensGeo, lensMat, n);
  const stems = new THREE.InstancedMesh(stemGeo, black, n);
  const d = new THREE.Object3D();
  fixtures.forEach((f, i) => {
    d.position.copy(f.at);
    d.scale.set(1, 1, 1);
    d.lookAt(f.aim);
    d.updateMatrix();
    housings.setMatrixAt(i, d.matrix);
    lenses.setMatrixAt(i, d.matrix);
    const stemLen = H - 0.035 - f.at.y;
    d.rotation.set(0, 0, 0);
    d.position.set(f.at.x, f.at.y + stemLen / 2, f.at.z);
    d.scale.set(1, stemLen, 1);
    d.updateMatrix();
    stems.setMatrixAt(i, d.matrix);
  });
  scene.add(housings, lenses, stems);
  keep(housings, lenses, stems);

  // The scallops they throw on the walls
  const tex = scallopTexture();
  const mat = new THREE.MeshBasicMaterial({
    map: tex,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    color: WARM,
    opacity: 0.55,
  });
  const geo = new THREE.PlaneGeometry(1.9, 3.1);
  geo.translate(0, -1.55, 0); // hang from its top edge
  keep(tex, mat, geo);
  fixtures.forEach((f) => {
    if (!f.wash) return;
    const m = new THREE.Mesh(geo, f.wash.strength === undefined ? mat : mat.clone());
    if (f.wash.strength !== undefined) {
      (m.material as THREE.MeshBasicMaterial).opacity = 0.55 * f.wash.strength;
      keep(m.material as THREE.Material);
    }
    const p = f.wash.at.clone().addScaledVector(f.wash.normal, 0.012);
    p.y = H - 0.18;
    m.position.copy(p);
    m.lookAt(p.clone().add(f.wash.normal));
    m.renderOrder = 2;
    scene.add(m);
  });
}

/* ---------- the centrepiece ---------- */

export function addPrismPlinth(ctx: SetCtx, at: THREE.Vector3, logoUrl: string) {
  const { scene, keep, hq } = ctx;
  const g = new THREE.Group();
  g.position.copy(at);
  const PW = 1.7;
  const PH = 0.68;
  const PD = 1.0;

  // Pale stone plinth
  const stone = new THREE.MeshStandardMaterial({ color: 0xd9d0c3, roughness: 0.45, metalness: 0 });
  const plinthGeo = new THREE.BoxGeometry(PW, PH, PD);
  keep(stone, plinthGeo);
  const plinth = new THREE.Mesh(plinthGeo, stone);
  plinth.position.y = PH / 2 + 0.03;
  plinth.castShadow = hq;
  plinth.receiveShadow = hq;
  g.add(plinth);

  // The logo inlaid on its face, glowing softly
  const logoTex = new THREE.TextureLoader().load(logoUrl);
  logoTex.colorSpace = THREE.SRGBColorSpace;
  logoTex.anisotropy = 8;
  const logoMat = new THREE.MeshBasicMaterial({
    map: logoTex,
    transparent: true,
    toneMapped: false,
  });
  logoMat.color.setScalar(1.15);
  const logoGeo = new THREE.PlaneGeometry(0.24, 0.443); // the mark is 365 x 674
  keep(logoTex, logoMat, logoGeo);
  const logo = new THREE.Mesh(logoGeo, logoMat);
  logo.position.set(0, 0.03 + PH * 0.5, PD / 2 + 0.002);
  g.add(logo);

  // A warm glow strip under it, and its light on the floor
  const stripMat = new THREE.MeshBasicMaterial({
    color: new THREE.Color(1, 0.6, 0.2).multiplyScalar(6),
    toneMapped: false,
  });
  const stripGeo = new THREE.BoxGeometry(PW - 0.04, 0.02, PD - 0.04);
  keep(stripMat, stripGeo);
  const strip = new THREE.Mesh(stripGeo, stripMat);
  strip.position.y = 0.015;
  g.add(strip);
  const poolTex = poolTexture("255,170,80");
  const poolMat = new THREE.MeshBasicMaterial({
    map: poolTex,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    opacity: 0.9,
  });
  const poolGeo = new THREE.PlaneGeometry(PW + 1.8, PD + 1.6);
  keep(poolTex, poolMat, poolGeo);
  const pool = new THREE.Mesh(poolGeo, poolMat);
  pool.rotation.x = -Math.PI / 2;
  pool.position.y = 0.006;
  pool.renderOrder = 2;
  g.add(pool);

  // The crystal pyramid
  const pyrH = 0.95;
  const pyrGeo = new THREE.ConeGeometry(0.6, pyrH, 4, 1);
  pyrGeo.rotateY(Math.PI / 4);
  const glass = new THREE.MeshPhysicalMaterial({
    color: 0xffffff,
    metalness: 0,
    roughness: 0.03,
    transmission: 1,
    thickness: 0.45,
    ior: 1.52,
    dispersion: 7,
    clearcoat: 1,
    envMapIntensity: 3.2,
    emissive: new THREE.Color(0.05, 0.045, 0.04), // glass catching the spotlight
    iridescence: 0.35,
    iridescenceIOR: 1.3,
  });
  keep(pyrGeo, glass);
  const pyramid = new THREE.Mesh(pyrGeo, glass);
  pyramid.position.y = 0.03 + PH + pyrH / 2;
  g.add(pyramid);
  // Its edges catch the light
  const edgeGeo = new THREE.EdgesGeometry(pyrGeo);
  const edgeMat = new THREE.LineBasicMaterial({
    color: new THREE.Color(1, 0.95, 0.88).multiplyScalar(2),
    toneMapped: false,
  });
  keep(edgeGeo, edgeMat);
  const edges = new THREE.LineSegments(edgeGeo, edgeMat);
  edges.position.copy(pyramid.position);
  g.add(edges);
  // Light gathered inside it: a white core and a fringe of colour at its foot
  const coreTex = poolTexture("255,246,230");
  const coreMat = new THREE.SpriteMaterial({
    map: coreTex,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    opacity: 0.45,
  });
  keep(coreTex, coreMat);
  const core = new THREE.Sprite(coreMat);
  core.scale.set(0.7, 0.7, 1);
  core.position.y = 0.03 + PH + pyrH * 0.32;
  g.add(core);

  // The rainbows across the floor, left and right
  const bTex = beamTexture();
  const bMat = new THREE.MeshBasicMaterial({
    map: bTex,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    opacity: 0.95,
  });
  const bGeo = new THREE.PlaneGeometry(4.6, 2.6);
  bGeo.translate(2.3, 0, 0); // starts at its own origin
  keep(bTex, bMat, bGeo);
  for (const side of [-1, 1]) {
    const b = new THREE.Mesh(bGeo, bMat);
    b.rotation.x = -Math.PI / 2;
    // fanning out sideways and a little towards you
    b.rotation.z = side > 0 ? -0.62 : Math.PI + 0.62;
    b.position.set(side * (PW / 2 - 0.1), 0.008, 0.25);
    b.renderOrder = 3;
    g.add(b);
    // and a short flare of colour leaving the prism on that side
    const f = new THREE.Mesh(bGeo, bMat);
    f.scale.set(0.2, 0.3, 1);
    f.position.set(side * 0.18, 0.03 + PH + 0.12, 0.05);
    f.rotation.z = side > 0 ? -0.35 : Math.PI + 0.35;
    f.renderOrder = 3;
    g.add(f);
  }

  // A little white light inside the glass
  const inner = new THREE.PointLight(0xfff4e6, hq ? 1 : 0.8, 1.4, 2);
  inner.position.y = 0.03 + PH + pyrH * 0.3;
  g.add(inner);

  // Light on it from above, and a little coloured light thrown sideways
  const key = new THREE.SpotLight(0xffe2bc, hq ? 14 : 10, 0, 0.32, 0.7, 2);
  key.position.set(0, 4.05, 0.9);
  key.target.position.set(0, 0.9, 0);
  if (hq) {
    key.castShadow = true;
    key.shadow.mapSize.set(1024, 1024);
    key.shadow.bias = -0.0004;
    key.shadow.normalBias = 0.02;
    key.shadow.camera.near = 0.5;
    key.shadow.camera.far = 6;
  }
  g.add(key, key.target);
  if (hq) {
    const l = new THREE.PointLight(0x7a6cff, 1.2, 3.5, 2);
    l.position.set(-1.6, 0.3, 0.4);
    const r = new THREE.PointLight(0xff8a2a, 1.2, 3.5, 2);
    r.position.set(1.6, 0.3, 0.4);
    g.add(l, r);
  }
  scene.add(g);
  return { core: coreMat };
}

/* ---------- the bench ---------- */

export function addBench(ctx: SetCtx, at: THREE.Vector3) {
  const { scene, keep, hq } = ctx;
  const g = new THREE.Group();
  g.position.copy(at);
  const L = 2.3;
  const D = 0.5;
  const seatY = 0.44;
  const leather = new THREE.MeshPhysicalMaterial({
    color: 0x7c4325,
    roughness: 0.5,
    clearcoat: 0.35,
    clearcoatRoughness: 0.45,
    sheen: 0.4,
    sheenColor: new THREE.Color(0xffc9a0),
  });
  const brass = new THREE.MeshStandardMaterial({ color: 0xc19a5b, metalness: 1, roughness: 0.28 });
  keep(leather, brass);
  // Four cushions, slightly rounded
  const n = 4;
  const cw = (L - 0.03 * (n - 1)) / n;
  const cushGeo = new THREE.BoxGeometry(cw, 0.1, D, 6, 2, 6);
  // round the top edges a touch
  const pos = cushGeo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i) / (cw / 2);
    const z = pos.getZ(i) / (D / 2);
    if (pos.getY(i) > 0) pos.setY(i, pos.getY(i) - 0.012 * (x * x * x * x + z * z * z * z));
  }
  cushGeo.computeVertexNormals();
  keep(cushGeo);
  for (let i = 0; i < n; i++) {
    const c = new THREE.Mesh(cushGeo, leather);
    c.position.set(-L / 2 + cw / 2 + i * (cw + 0.03), seatY, 0);
    c.castShadow = hq;
    c.receiveShadow = hq;
    g.add(c);
  }
  // Brass frame: a rail under the seat and four legs
  const bar = (w: number, h: number, d: number, x: number, y: number, z: number) => {
    const geo = new THREE.BoxGeometry(w, h, d);
    keep(geo);
    const m = new THREE.Mesh(geo, brass);
    m.position.set(x, y, z);
    m.castShadow = hq;
    g.add(m);
  };
  bar(L, 0.03, 0.03, 0, seatY - 0.065, D / 2 - 0.02);
  bar(L, 0.03, 0.03, 0, seatY - 0.065, -D / 2 + 0.02);
  for (const sx of [-1, 1]) {
    for (const sz of [-1, 1])
      bar(0.03, seatY - 0.05, 0.03, sx * (L / 2 - 0.06), (seatY - 0.05) / 2, sz * (D / 2 - 0.02));
    bar(0.03, 0.03, D, sx * (L / 2 - 0.06), 0.06, 0); // foot bar
  }
  scene.add(g);
}

/* ---------- the exhibition title ---------- */

export function addWallTitle(ctx: SetCtx, at: THREE.Vector3, normal: THREE.Vector3, aniso: number) {
  const { scene, keep } = ctx;
  const W = 1024;
  const Hh = 1280;
  const tex = canvasTexture(W, Hh, (c) => {
    c.clearRect(0, 0, W, Hh);
    c.fillStyle = "#231a14";
    c.font = "600 150px Jost, ui-sans-serif, system-ui";
    const spaced = (t: string, x: number, y: number, gap: number) => {
      let cx = x;
      for (const ch of t) {
        c.fillText(ch, cx, y);
        cx += c.measureText(ch).width + gap;
      }
      return cx;
    };
    spaced("INSIGHT", 40, 260, 12);
    spaced("LAB", 40, 430, 12);
    c.fillRect(44, 520, 170, 6);
    c.font = "500 58px Jost, ui-sans-serif, system-ui";
    spaced("VISUAL", 44, 660, 10);
    spaced("STORYTELLING", 44, 750, 10);
    spaced("EXHIBITION", 44, 840, 10);
    c.fillRect(44, 930, 90, 5);
  });
  tex.anisotropy = aniso;
  const mat = new THREE.MeshStandardMaterial({ map: tex, transparent: true, roughness: 0.7 });
  const geo = new THREE.PlaneGeometry(0.88, 1.1);
  keep(tex, mat, geo);
  const m = new THREE.Mesh(geo, mat);
  m.position.copy(at).addScaledVector(normal, 0.003);
  m.lookAt(m.position.clone().add(normal));
  scene.add(m);
}

/* ---------- framed pictures ---------- */

export function addFramedPicture(
  ctx: SetCtx,
  at: THREE.Vector3,
  normal: THREE.Vector3,
  size: { w: number; h: number },
  seed: number,
  /* along the wall, to the viewer's right, for the label */
  right: THREE.Vector3,
) {
  const { scene, keep, hq } = ctx;
  const g = new THREE.Group();
  g.position.copy(at);
  g.lookAt(at.clone().add(normal));
  const frameMat = new THREE.MeshStandardMaterial({
    color: 0x0b0a09,
    roughness: 0.4,
    metalness: 0.2,
  });
  const frameGeo = new THREE.BoxGeometry(size.w + 0.06, size.h + 0.06, 0.04);
  const tex = landscapeTexture(seed, size.w > size.h ? 640 : 420, size.w > size.h ? 420 : 640);
  const picMat = new THREE.MeshStandardMaterial({
    map: tex,
    roughness: 0.55,
    emissive: 0xffffff,
    emissiveMap: tex,
    emissiveIntensity: 0.32, // lit by its spotlight
  });
  const picGeo = new THREE.PlaneGeometry(size.w, size.h);
  keep(frameMat, frameGeo, tex, picMat, picGeo);
  const frame = new THREE.Mesh(frameGeo, frameMat);
  frame.position.z = 0.02;
  frame.castShadow = hq;
  const pic = new THREE.Mesh(picGeo, picMat);
  pic.position.z = 0.0405;
  g.add(frame, pic);
  scene.add(g);

  // Its label, beside it
  const labelMat = new THREE.MeshStandardMaterial({ color: 0xf4f0e8, roughness: 0.8 });
  const labelGeo = new THREE.BoxGeometry(0.11, 0.15, 0.004);
  keep(labelMat, labelGeo);
  const label = new THREE.Mesh(labelGeo, labelMat);
  label.position
    .copy(at)
    .addScaledVector(right, size.w / 2 + 0.14)
    .addScaledVector(normal, 0.002);
  label.position.y = at.y - size.h / 2 + 0.12;
  label.lookAt(label.position.clone().add(normal));
  scene.add(label);
}

/* ---------- the floor's reflection ---------- */

const SoftReflectorShader = {
  name: "SoftReflectorShader",
  uniforms: {
    color: { value: null as THREE.Color | null },
    tDiffuse: { value: null as THREE.Texture | null },
    textureMatrix: { value: null as THREE.Matrix4 | null },
    uTexel: { value: new THREE.Vector2(1 / 512, 1 / 512) },
  },
  vertexShader: /* glsl */ `
    uniform mat4 textureMatrix;
    varying vec4 vUv;
    #include <common>
    #include <logdepthbuf_pars_vertex>
    void main() {
      vUv = textureMatrix * vec4(position, 1.0);
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      #include <logdepthbuf_vertex>
    }`,
  fragmentShader: /* glsl */ `
    uniform vec3 color;
    uniform sampler2D tDiffuse;
    uniform vec2 uTexel;
    varying vec4 vUv;
    #include <logdepthbuf_pars_fragment>
    void main() {
      #include <logdepthbuf_fragment>
      vec2 uv = vUv.xy / vUv.w;
      vec3 sum = vec3(0.0);
      float total = 0.0;
      // A light blur, stretched towards you, the way polished stone smears a reflection
      for (int x = -2; x <= 2; x++) {
        for (int y = -3; y <= 3; y++) {
          vec2 o = vec2(float(x), float(y));
          float w = exp(-dot(o, o) / 5.0);
          sum += texture2D(tDiffuse, uv + o * uTexel * vec2(1.2, 2.4)).rgb * w;
          total += w;
        }
      }
      gl_FragColor = vec4(sum / total * color, 1.0);
      #include <tonemapping_fragment>
      #include <colorspace_fragment>
    }`,
};

/* A soft mirror just under the floor, seen through its gloss. Capable devices only. */
export function addFloorReflection(ctx: SetCtx, w: number, len: number, mid: number) {
  const geo = new THREE.PlaneGeometry(w, len);
  ctx.keep(geo);
  const r = new Reflector(geo, {
    textureWidth: 1024,
    textureHeight: 1024,
    color: new THREE.Color(0.75, 0.72, 0.68),
    shader: SoftReflectorShader,
    multisample: 0,
  });
  r.rotation.x = -Math.PI / 2;
  r.position.set(0, -0.002, mid);
  ctx.scene.add(r);
  ctx.keep(r);
  return r;
}

export function sizeFloorReflection(r: Reflector, w: number, h: number) {
  r.getRenderTarget().setSize(Math.round(w * 0.5), Math.round(h * 0.5));
  (r.material as THREE.ShaderMaterial).uniforms.uTexel.value.set(2 / w, 2 / h);
}
