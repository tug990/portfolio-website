import * as THREE from "three";

/*
  Materials for the gallery, generated in the browser instead of downloaded:
  plaster for the walls, polished concrete for the floor, the prism light for
  the doors, and text for the wall labels. Generating them keeps the site light
  and lets every surface be drawn at whatever resolution the device can take.
*/

// Smooth value noise, a few octaves: the base of the plaster and concrete.
function makeNoise(size: number, seed: number) {
  let s = seed;
  const rand = () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
  const grid = (n: number) => {
    const g = new Float32Array((n + 1) * (n + 1));
    for (let i = 0; i < g.length; i++) g[i] = rand();
    // wrap so the texture tiles seamlessly
    for (let i = 0; i <= n; i++) {
      g[i * (n + 1) + n] = g[i * (n + 1)];
      g[n * (n + 1) + i] = g[i];
    }
    return g;
  };
  const octaves = [4, 8, 16, 32, 64].map((n) => ({ n, g: grid(n) }));
  const fade = (t: number) => t * t * (3 - 2 * t);
  return (x: number, y: number, from = 0, to = octaves.length) => {
    let v = 0;
    let amp = 1;
    let total = 0;
    for (let o = from; o < to; o++) {
      const { n, g } = octaves[o];
      const fx = (x / size) * n;
      const fy = (y / size) * n;
      const ix = Math.floor(fx);
      const iy = Math.floor(fy);
      const tx = fade(fx - ix);
      const ty = fade(fy - iy);
      const w = n + 1;
      const a = g[iy * w + ix];
      const b = g[iy * w + ix + 1];
      const c = g[(iy + 1) * w + ix];
      const d = g[(iy + 1) * w + ix + 1];
      v += (a + (b - a) * tx + (c - a) * ty + (a - b - c + d) * tx * ty) * amp;
      total += amp;
      amp *= 0.55;
    }
    return v / total;
  };
}

function canvas(size: number) {
  const c = document.createElement("canvas");
  c.width = c.height = size;
  return c;
}

function finish(c: HTMLCanvasElement, srgb: boolean, maxAniso: number) {
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.anisotropy = maxAniso;
  t.colorSpace = srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace;
  t.generateMipmaps = true;
  t.minFilter = THREE.LinearMipmapLinearFilter;
  return t;
}

/* Hand-finished plaster: a warm white with soft clouding and the faintest grain. */
export function plasterTextures(maxAniso: number) {
  const size = 512;
  const noise = makeNoise(size, 11);
  const col = canvas(size);
  const bump = canvas(size);
  const cc = col.getContext("2d")!;
  const bc = bump.getContext("2d")!;
  const ci = cc.createImageData(size, size);
  const bi = bc.createImageData(size, size);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const i = (y * size + x) * 4;
      const cloud = noise(x, y, 0, 3); // broad, soft variation
      const fine = noise(x, y, 3, 5); // trowel texture
      const grain = Math.random();
      const v = 0.955 + (cloud - 0.5) * 0.035 + (fine - 0.5) * 0.02 + (grain - 0.5) * 0.012;
      ci.data[i] = 255 * v;
      ci.data[i + 1] = 255 * (v - 0.004);
      ci.data[i + 2] = 255 * (v - 0.012);
      ci.data[i + 3] = 255;
      const h = 0.5 + (fine - 0.5) * 0.8 + (grain - 0.5) * 0.25;
      bi.data[i] = bi.data[i + 1] = bi.data[i + 2] = 255 * h;
      bi.data[i + 3] = 255;
    }
  }
  cc.putImageData(ci, 0, 0);
  bc.putImageData(bi, 0, 0);
  return { map: finish(col, true, maxAniso), bump: finish(bump, false, maxAniso) };
}

/*
  Polished concrete: grey with cloudy mottling, fine aggregate, faint trowel
  sweeps, and saw-cut joints. The roughness map makes some patches glossier.
*/
export function concreteTextures(maxAniso: number) {
  const size = 1024;
  const noise = makeNoise(size, 29);
  const col = canvas(size);
  const rough = canvas(size);
  const cc = col.getContext("2d")!;
  const rc = rough.getContext("2d")!;
  const ci = cc.createImageData(size, size);
  const ri = rc.createImageData(size, size);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const i = (y * size + x) * 4;
      const cloud = noise(x, y, 0, 3);
      const mid = noise(x, y, 2, 4);
      const fine = noise(x, y, 4, 5);
      const r = Math.random();
      // aggregate: occasional lighter and darker flecks
      const fleck = r > 0.992 ? 0.06 : r < 0.006 ? -0.07 : 0;
      // faint trowel sweeps: long soft arcs
      const sweep = Math.sin(x * 0.011 + Math.sin(y * 0.004) * 3 + cloud * 4) * 0.008;
      const v =
        0.72 +
        (cloud - 0.5) * 0.12 +
        (mid - 0.5) * 0.05 +
        (fine - 0.5) * 0.03 +
        fleck +
        sweep +
        (r - 0.5) * 0.02;
      ci.data[i] = 255 * v;
      ci.data[i + 1] = 255 * (v - 0.008);
      ci.data[i + 2] = 255 * (v - 0.02);
      ci.data[i + 3] = 255;
      const g = 0.32 + (mid - 0.5) * 0.22 + (fine - 0.5) * 0.1;
      ri.data[i] = ri.data[i + 1] = ri.data[i + 2] = 255 * Math.min(1, Math.max(0, g));
      ri.data[i + 3] = 255;
    }
  }
  cc.putImageData(ci, 0, 0);
  rc.putImageData(ri, 0, 0);
  // Saw-cut joints along the tile edges (the texture repeats once per slab)
  for (const [ctx, colr] of [
    [cc, "rgba(60,58,55,0.55)"],
    [rc, "rgba(200,200,200,1)"],
  ] as const) {
    ctx.fillStyle = colr;
    ctx.fillRect(0, 0, size, 3);
    ctx.fillRect(0, 0, 3, size);
  }
  return { map: finish(col, true, maxAniso), rough: finish(rough, false, maxAniso) };
}

/* Light falling in a soft pool, for the floor in front of the doors and screens. */
export function poolTexture(stops: [number, string][]) {
  const size = 256;
  const c = canvas(size);
  const ctx = c.getContext("2d")!;
  const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  stops.forEach(([o, col]) => g.addColorStop(o, col));
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

/*
  The light in a door's gap and on its leaves, after the logo: white at the
  centre, blue/violet spilling onto the left, yellow/orange/red onto the right.
*/
export function doorLightTexture() {
  const w = 256;
  const h = 512;
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const ctx = c.getContext("2d")!;
  const g = ctx.createLinearGradient(0, 0, w, 0);
  g.addColorStop(0, "#dff1ff");
  g.addColorStop(0.18, "#ffffff");
  g.addColorStop(0.82, "#ffffff");
  g.addColorStop(1, "#fff1df");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

/* A door leaf: matte black with the prism glow pouring over its top inner corner. */
export function leafTextures(side: "left" | "right") {
  const w = 256;
  const h = 512;
  const make = (glowOnly: boolean) => {
    const c = document.createElement("canvas");
    c.width = w;
    c.height = h;
    const ctx = c.getContext("2d")!;
    ctx.fillStyle = glowOnly ? "#000" : "#0d0d0e";
    ctx.fillRect(0, 0, w, h);
    if (!glowOnly) {
      // inset panel
      ctx.strokeStyle = "rgba(255,255,255,0.05)";
      ctx.lineWidth = 2;
      ctx.strokeRect(w * 0.14, h * 0.07, w * 0.72, h * 0.84);
    }
    const cx = side === "left" ? w : 0;
    const g = ctx.createRadialGradient(cx, 0, 0, cx, 0, w * 1.15);
    if (side === "left") {
      g.addColorStop(0, "rgba(255,255,255,0.95)");
      g.addColorStop(0.08, "rgba(190,235,255,0.9)");
      g.addColorStop(0.2, "rgba(43,184,255,0.85)");
      g.addColorStop(0.42, "rgba(31,44,255,0.6)");
      g.addColorStop(0.68, "rgba(70,20,200,0.18)");
      g.addColorStop(1, "rgba(0,0,0,0)");
    } else {
      g.addColorStop(0, "rgba(255,255,255,0.95)");
      g.addColorStop(0.08, "rgba(255,236,200,0.9)");
      g.addColorStop(0.2, "rgba(255,170,60,0.85)");
      g.addColorStop(0.42, "rgba(255,110,20,0.6)");
      g.addColorStop(0.68, "rgba(200,40,10,0.18)");
      g.addColorStop(1, "rgba(0,0,0,0)");
    }
    ctx.fillStyle = g;
    ctx.save();
    ctx.scale(1, 0.55); // the glow falls further down than it spreads across
    ctx.fillRect(0, 0, w, h / 0.55);
    ctx.restore();
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  };
  return { map: make(false), glow: make(true) };
}

/* Text drawn crisply onto a canvas, for wall labels and door signs. */
export function textTexture(
  draw: (ctx: CanvasRenderingContext2D, w: number, h: number) => void,
  w: number,
  h: number,
  maxAniso: number,
) {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  draw(c.getContext("2d")!, w, h);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = maxAniso;
  return t;
}
