import * as THREE from "three";

/*
  Light and text for the gallery, drawn in the browser instead of downloaded.
  Every surface in the room is a plain smooth material; these textures are only
  for things that glow: the skylight, the wash at the foot of the walls, the
  doors, and the wall labels.
*/

function canvas(w: number, h = w) {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  return c;
}

function done(c: HTMLCanvasElement) {
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

/* The skylight panel: bright in the middle, falling off gently to its edges. */
export function skylightTexture() {
  const c = canvas(256, 64);
  const ctx = c.getContext("2d")!;
  const g = ctx.createLinearGradient(0, 0, 256, 0);
  g.addColorStop(0, "#d9d4cc");
  g.addColorStop(0.25, "#f6f3ee");
  g.addColorStop(0.5, "#ffffff");
  g.addColorStop(0.75, "#f6f3ee");
  g.addColorStop(1, "#d9d4cc");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 256, 64);
  return done(c);
}

/* Warm light washing up a wall from the floor, fading out by knee height. */
export function wallWashTexture() {
  const c = canvas(8, 256);
  const ctx = c.getContext("2d")!;
  const g = ctx.createLinearGradient(0, 256, 0, 0);
  g.addColorStop(0, "rgba(255,214,160,1)");
  g.addColorStop(0.12, "rgba(255,200,140,0.55)");
  g.addColorStop(0.45, "rgba(255,190,130,0.14)");
  g.addColorStop(1, "rgba(255,190,130,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 8, 256);
  return done(c);
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
