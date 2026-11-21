import * as THREE from "three";
import type { WorkClient } from "@/content/site";
import { addBench, addCoveLighting, addFramedPicture, addWallTitle, type SetCtx } from "./warmset";
import { poolTexture } from "./textures";
import type { Surfaces } from "./surfaces";

/*
  The world beyond the film hall, for the gallery page: a museum built as
  the great ones are (the white galleries of Fondation Beyeler and Kunsthaus
  Bregenz, the daylit atrium of a Guggenheim), larger than life.

  The language, from how real galleries are made and lit:
    white plaster walls with a shadow gap at the floor; oak boards
    underfoot throughout (one set of surfaces for the whole building, shared
    with the entrance hall: surfaces.ts); daylight from above, softened by a
    skylight of deep baffles (and one raking sunbeam that casts real
    shadows); in the rooms, a luminous laylight ceiling and track spots
    pooling warm light (~3000 K) on each film; sculpture on limestone bases
    and white plinths; installations hung on fine steel cables; glass balustrades with
    oak handrails; signage in small spaced capitals.

  Through a portal in the side gallery's back wall (z = zA, a deep reveal):

    THE GRAND ATRIUM (30 × 30 m, 16 m tall)
      the Threshold: the Insight Lab mark in blackened steel, 8 m tall, on a
        stone plinth; a slot of light in its gap, blue on one inner face and
        amber on the other, pooling on the floor
      the Halo: a ring of polished steel with a line of prism light inside,
        hung from the skylight on four cables
      the Lens: a sphere of optical glass on a plinth
      the Ribbon: a band of mirror-polished stainless steel, twisting 8 m high
      a rain of glass: iridescent panes hung on cables, turning slowly
      two great landscapes on the side walls, each under its picture light
      benches facing the Threshold; the exhibition title over the balcony
    THE GRAND STAIRCASE: oak, 8 m wide, glass sides and oak rails
    THE UPPER FLOOR (oak floor at 6 m)
      the balcony; the corridor with a room for each client behind a closed
      door lacquered in their colour, their emblem on it in a brass-ringed
      medallion, their name in gold (it swings open as you come near); each
      room painted a deep, quiet shade of their colour, as deep as its films
      need, their emblem on an ivory panel facing the door, their films lit
      by track spots round the walls, a sculpture, a bench; and at the end,
      the last hall: the Spectrum (tubes of coloured light, after Dan Flavin)
      between two doors, About and Contact
*/

export const ATRIUM = { W: 30, D: 30, H: 16 };
export const UPPER = { y: 6, H: 6, balcony: 6, roomD: 9, corridor: 3, end: 10 };
export const STAIRS = { half: 4, run: 12 };

/* A rectangle you can stand in, and the height of its floor at a point */
export type Zone = {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
  floor: (x: number, z: number) => number;
  level: 0 | 1;
  /* solid from below (the stairs): inside it, only its own floor counts */
  over?: boolean;
  /* where the surface you see is, if not the floor you walk (the stairs: the tread tops, not the slope) */
  surface?: (x: number, z: number) => number;
};
/* Something you can't walk through (a box, at a level) or round (a circle) */
export type Collider =
  | { kind: "box"; minX: number; maxX: number; minZ: number; maxZ: number; level: 0 | 1 }
  | { kind: "circle"; x: number; z: number; r: number; level: 0 | 1 };

/* Where a film in a room hangs (as the hall's WorkSpot, with its floor height) */
export type RoomSpot = {
  scale: number;
  x: number;
  y: number;
  z: number;
  yaw: number;
  face: number;
  nx: number;
  nz: number;
  tx: number;
  tz: number;
};

/* The world's key places along the way (for the tour and the map) */
// y: its floor; pitch: how far you look up there (at a tall piece, so all of it is in view)
export type Place = { name: string; x: number; y: number; z: number; yaw: number; pitch?: number };
/*
  Something standing in front of a film frame (the Threshold, the Lens, the Ribbon): its outline,
  as points round it, is cut out of the layer the films play in (that layer is drawn over the room,
  GalleryScene `clipCutouts`), so it stays in front. `band`: the points run along a band that
  winds about (the Ribbon), its outline that line drawn this many metres either side.
*/
export type Cutout = { pts: THREE.Vector3[]; band?: number };
/* The doors out, at the end: to the About and Contact pages */
export type WorldDoor = { x: number; z: number; label: string; to: "/about" | "/contact" };

/*
  The rooms upstairs, one per client, either side of the corridor (`roomPlan`).
  Each is as deep as its films need (`ROOM`): they hang on its side walls first
  (the far wall, then the near, three to a wall at most), then either side of
  the client's emblem on the outer wall, the wall you face as you come in.
  Each room goes on whichever side of the corridor has gone less far, so both
  sides keep pace; a side that ends sooner is closed by a plain wall.
*/
export const ROOM = {
  spacing: 3.4, // between films' middles (m)
  scale: 1.25, // films hang a little larger than in the hall
  perWall: 3, // films on each side wall at most
  feature: 5, // the emblem's share of the outer wall (m)
  minDepth: 9,
  door: 2.8, // the doorway's width (m); 3.3 high
};
export type RoomFrame = {
  side: -1 | 1; // which side of the corridor (-1: left)
  first: boolean; // the first room on its side (its near wall is its own)
  z1: number; // its near wall (towards the atrium)
  z0: number; // its far wall
  zc: number;
  x0: number;
  x1: number;
  xc: number;
  cx: number; // the corridor wall's middle
  depth: number;
  spots: RoomSpot[]; // where its films hang, in the order you walk round
};

/* a film on a wall: its middle on the wall's face, facing out along (nx, nz) */
function spotOn(x: number, z: number, nx: number, nz: number): RoomSpot {
  const face = Math.atan2(nx, nz);
  // (to your right as you face it)
  return { scale: ROOM.scale, x, y: UPPER.y, z, yaw: face, face, nx, nz, tx: nz, tz: -nx };
}

export function roomPlan(zA: number, perRoom: number[]) {
  const zStart = zA - ATRIUM.D - UPPER.balcony;
  const gone = { [-1]: 0, [1]: 0 } as Record<-1 | 1, number>;
  const rooms: RoomFrame[] = perRoom.map((n) => {
    const onSides = Math.min(n, ROOM.perWall * 2);
    const flank = Math.ceil((n - onSides) / 2); // films each side of the emblem
    // (the last film each side of the emblem: its middle, its half and its label, then room to
    // spare before the corner, where the side wall's last film hangs)
    const reach = ROOM.feature / 2 + ROOM.spacing / 2 + (flank - 1) * ROOM.spacing + 3.8;
    const depth = Math.max(ROOM.minDepth, flank ? 2 * reach : 0);
    const side: -1 | 1 = gone[-1] <= gone[1] ? -1 : 1;
    const first = gone[side] === 0;
    const z1 = zStart - gone[side];
    gone[side] += depth;
    const z0 = z1 - depth;
    const zc = (z1 + z0) / 2;
    const x0 = side < 0 ? -ATRIUM.W / 2 : UPPER.corridor;
    const x1 = side < 0 ? -UPPER.corridor : ATRIUM.W / 2;
    const xc = (x0 + x1) / 2;
    // round the room as you walk it: the far wall (from the corridor out), the outer wall either
    // side of the emblem (far to near), the near wall (from the outer wall back)
    const spots: RoomSpot[] = [];
    const along = (m: number) =>
      Array.from({ length: m }, (_, j) => (j - (m - 1) / 2) * ROOM.spacing);
    const far = Math.ceil(onSides / 2);
    const near = onSides - far;
    const out = (o: number) => side * o; // further from the corridor
    along(far)
      .sort((a, b) => a - b)
      .forEach((o) => spots.push(spotOn(xc + out(o), z0 + 0.15, 0, 1)));
    const outer = n - onSides;
    const flanks: number[] = [];
    for (let j = 0; j < flank; j++) {
      const o = ROOM.feature / 2 + ROOM.spacing / 2 + j * ROOM.spacing;
      flanks.push(-o);
      if (flanks.length < outer) flanks.push(o);
    }
    flanks
      .slice(0, outer)
      .sort((a, b) => a - b)
      .forEach((o) => spots.push(spotOn(side * (ATRIUM.W / 2), zc + o, -side, 0)));
    along(near)
      .sort((a, b) => b - a)
      .forEach((o) => spots.push(spotOn(xc + out(o), z1 - 0.15, 0, -1)));
    return { side, first, z1, z0, zc, x0, x1, xc, cx: side * UPPER.corridor, depth, spots };
  });
  return { rooms, end: zStart - Math.max(gone[-1], gone[1]), gone, zStart };
}

/* ---------- helpers ---------- */

/* A soft oval of light, for where a spotlight lands on a wall */
function lightPoolTexture() {
  // (light as grey on black, no transparency: Safari keeps a see-through canvas premultiplied, and
  // un-premultiplied for a texture its faintest edges turn to stray coloured specks, which the
  // pool's added light makes plain on an iPhone; grey values are read as they are, not as sRGB)
  const c = document.createElement("canvas");
  c.width = 256;
  c.height = 256;
  const x = c.getContext("2d", { alpha: false })!;
  x.fillStyle = "#000";
  x.fillRect(0, 0, 256, 256);
  const g = x.createRadialGradient(128, 128, 0, 128, 128, 128);
  g.addColorStop(0, "rgb(242,242,242)");
  g.addColorStop(0.35, "rgb(140,140,140)");
  g.addColorStop(0.7, "rgb(36,36,36)");
  g.addColorStop(1, "rgb(0,0,0)");
  x.fillStyle = g;
  x.fillRect(0, 0, 256, 256);
  return new THREE.CanvasTexture(c);
}

/* A band (a ribbon) along a curve, `width` wide, turning `twists` times round its length */
function ribbonGeometry(
  curve: THREE.Curve<THREE.Vector3>,
  segments: number,
  width: number,
  twists: number,
) {
  const frames = curve.computeFrenetFrames(segments, false);
  const pos: number[] = [];
  const idx: number[] = [];
  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    const p = curve.getPointAt(t);
    const a = t * Math.PI * 2 * twists;
    const d = frames.normals[i]
      .clone()
      .multiplyScalar(Math.cos(a))
      .add(frames.binormals[i].clone().multiplyScalar(Math.sin(a)));
    pos.push(p.x + (d.x * width) / 2, p.y + (d.y * width) / 2, p.z + (d.z * width) / 2);
    pos.push(p.x - (d.x * width) / 2, p.y - (d.y * width) / 2, p.z - (d.z * width) / 2);
    if (i < segments) {
      const k = i * 2;
      idx.push(k, k + 1, k + 2, k + 1, k + 3, k + 2);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}

const PRISM = [0x1f2cff, 0x2bb8ff, 0xffffff, 0xff8a1f, 0xff3d1f].map((c) => new THREE.Color(c));
const prismAt = (t: number, out = new THREE.Color()) => {
  const f = Math.min(0.9999, Math.max(0, t)) * (PRISM.length - 1);
  const k = Math.floor(f);
  return out.copy(PRISM[k]).lerp(PRISM[Math.min(k + 1, PRISM.length - 1)], f - k);
};

export function buildWorld(
  ctx: SetCtx,
  o: {
    zA: number;
    hallW: number;
    clients: WorkClient[];
    aniso: number;
    /* how many films each client's room holds (in the order of `clients`) */
    perRoom: number[];
    /* the building's surfaces, shared with the hall (surfaces.ts) */
    surfaces: Surfaces;
  },
) {
  const { scene, keep, hq } = ctx;
  const { zA, hallW, clients } = o;
  const W = ATRIUM.W;
  const H = ATRIUM.H;
  const zC = zA - ATRIUM.D / 2; // the atrium's middle
  const zB = zA - ATRIUM.D; // its back (where the upper floor begins)
  const plan = roomPlan(zA, o.perRoom);
  const zR = plan.end; // the last hall begins
  const zEnd = zR - UPPER.end;
  const yU = UPPER.y;
  const zones: Zone[] = [];
  const colliders: Collider[] = [];
  const cutouts: Cutout[] = [];
  // the atrium's two great frames, where films play (GalleryScene gives them their films)
  const frames: { pic: THREE.Mesh; w: number; h: number }[] = [];
  const floors: THREE.Mesh[] = [];
  const places: Place[] = [];
  const doors: WorldDoor[] = [];
  const animate: ((t: number, eye?: THREE.Vector3) => void)[] = [];
  const benches: {
    x: number;
    z: number;
    floor: number;
    seats: { x: number; z: number; yaw: number }[];
  }[] = [];
  const pickDoors: THREE.Object3D[] = [];

  /* ---------- materials ---------- */
  // the building's surfaces (one set for all of it: surfaces.ts)
  const S = o.surfaces;
  const wallMat = S.wall;
  const ceilMat = S.ceil;
  const oak = S.oak; // the floor everywhere, and the stairs
  const stone = S.limestone; // the sculptures' bases
  const plinth = S.plinth;
  const steelBlack = S.steel;
  const gap = S.gap;
  const mirror = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    metalness: 1,
    roughness: 0.045,
    envMapIntensity: 1.25,
    side: THREE.DoubleSide,
  });
  const brass = new THREE.MeshStandardMaterial({ color: 0xc9a46a, metalness: 1, roughness: 0.3 });
  const darkMetal = new THREE.MeshStandardMaterial({
    color: 0x1a1a1c,
    metalness: 0.8,
    roughness: 0.45,
  });
  const handrail = new THREE.MeshStandardMaterial({ color: 0x6e4b2c, roughness: 0.5 });
  const cable = new THREE.MeshStandardMaterial({ color: 0x9a9a9a, metalness: 1, roughness: 0.35 });
  const glass = new THREE.MeshPhysicalMaterial({
    color: 0xffffff,
    roughness: 0.04,
    metalness: 0,
    transmission: hq ? 1 : 0,
    transparent: true,
    opacity: hq ? 1 : 0.1,
    thickness: 0.02,
    envMapIntensity: hq ? 1.1 : 2.4,
    depthWrite: hq,
  });
  if (!hq) glass.color.set(0xdfe9ee); // on phones (no transmission): a faint cool sheet, not milky
  const iris = new THREE.MeshPhysicalMaterial({
    color: 0xffffff,
    roughness: 0.03,
    transmission: hq ? 0.9 : 0,
    transparent: true,
    opacity: hq ? 1 : 0.4,
    thickness: 0.02,
    iridescence: 1,
    iridescenceIOR: 1.35,
    clearcoat: 1,
    envMapIntensity: 1.8,
  });
  const poolTex = lightPoolTexture();
  const warmPool = new THREE.MeshBasicMaterial({
    map: poolTex,
    color: new THREE.Color(1, 0.9, 0.76), // ~3000 K
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    opacity: 0.32,
  });
  keep(mirror, brass, darkMetal, handrail, cable, glass, iris, poolTex, warmPool);

  /* ---------- building blocks ---------- */
  const box = (
    w: number,
    h: number,
    d: number,
    mat: THREE.Material,
    x: number,
    y: number,
    z: number,
  ) => {
    const g = new THREE.BoxGeometry(w, h, d);
    keep(g);
    const m = new THREE.Mesh(g, mat);
    m.position.set(x, y, z);
    m.receiveShadow = hq;
    scene.add(m);
    return m;
  };
  const plane = (w: number, h: number, mat: THREE.Material) => {
    const g = new THREE.PlaneGeometry(w, h);
    keep(g);
    const m = new THREE.Mesh(g, mat);
    m.receiveShadow = hq;
    scene.add(m);
    return m;
  };
  /* a wall from (x0, z0) to (x1, z1), between heights y0 and y1; at its foot a shadow gap */
  const wall = (
    x0: number,
    z0: number,
    x1: number,
    z1: number,
    y0: number,
    y1: number,
    t = 0.3,
    foot = true,
  ) => {
    const len = Math.hypot(x1 - x0, z1 - z0);
    const ry = -Math.atan2(z1 - z0, x1 - x0);
    const m = box(len, y1 - y0, t, wallMat, (x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2);
    m.rotation.y = ry;
    if (foot) {
      const g = box(len, 0.035, t + 0.012, gap, (x0 + x1) / 2, y0 + 0.017, (z0 + z1) / 2);
      g.rotation.y = ry;
      g.receiveShadow = false;
    }
    return m;
  };
  const blockAt = (minX: number, maxX: number, minZ: number, maxZ: number, level: 0 | 1) =>
    colliders.push({ kind: "box", minX, maxX, minZ, maxZ, level });
  /* a steel cable from a point up to the ceiling at `top` */
  const hang = (x: number, y: number, z: number, top: number) => {
    const len = top - y;
    const g = new THREE.CylinderGeometry(0.004, 0.004, len, 4);
    keep(g);
    const m = new THREE.Mesh(g, cable);
    m.position.set(x, y + len / 2, z);
    scene.add(m);
    return m;
  };
  /* where a spotlight lands on a wall: a warm oval, facing out of the wall */
  const pool = (
    x: number,
    y: number,
    z: number,
    nx: number,
    nz: number,
    w: number,
    h: number,
    strength = 1,
  ) => {
    const g = new THREE.PlaneGeometry(w, h);
    keep(g);
    const mat = strength === 1 ? warmPool : warmPool.clone();
    if (strength !== 1) {
      mat.opacity = warmPool.opacity * strength;
      keep(mat);
    }
    const m = new THREE.Mesh(g, mat);
    m.position.set(x + nx * 0.012, y, z + nz * 0.012);
    m.rotation.y = Math.atan2(nx, nz);
    scene.add(m);
  };
  /* a track spot: a small black can on a stem, aimed at (tx, ty, tz) */
  const spotHead = (x: number, y: number, z: number, tx: number, ty: number, tz: number) => {
    const g = new THREE.Group();
    g.position.set(x, y, z);
    scene.add(g);
    const stemG = new THREE.CylinderGeometry(0.012, 0.012, 0.16, 8);
    const canG = new THREE.CylinderGeometry(0.05, 0.045, 0.2, 16);
    const lensG = new THREE.CircleGeometry(0.04, 16);
    keep(stemG, canG, lensG);
    const stem = new THREE.Mesh(stemG, darkMetal);
    stem.position.y = -0.08;
    g.add(stem);
    const head = new THREE.Group();
    head.position.y = -0.18;
    g.add(head);
    head.lookAt(tx, ty, tz);
    const can = new THREE.Mesh(canG, darkMetal);
    can.rotation.x = Math.PI / 2;
    head.add(can);
    const lens = new THREE.Mesh(
      lensG,
      new THREE.MeshBasicMaterial({
        color: new THREE.Color(1, 0.92, 0.78).multiplyScalar(2.4),
        toneMapped: false,
      }),
    );
    keep(lens.material as THREE.Material);
    lens.position.z = 0.101;
    head.add(lens);
  };

  /* ---------- the portal: a deep reveal through the wall ---------- */
  for (const sx of [-1, 1]) box(0.3, 4.2, 0.9, wallMat, sx * 3.15, 2.1, zA - 0.3);
  box(6.6, 0.025, 0.9, brass, 0, 0.012, zA - 0.3); // a brass threshold

  /* ---------- the atrium ---------- */
  const aFloor = plane(W, ATRIUM.D, oak);
  aFloor.rotation.x = -Math.PI / 2;
  aFloor.position.set(0, 0, zC);
  floors.push(aFloor);

  // the ceiling, round a great skylight (SKY across): its well, its baffles, the daylight above
  const SKY = 17;
  const band = (W - SKY) / 2;
  for (const [w, d, x, z] of [
    [W, band, 0, zA - band / 2],
    [W, band, 0, zB + band / 2],
    [band, SKY, -W / 2 + band / 2, zC],
    [band, SKY, W / 2 - band / 2, zC],
  ] as const) {
    const c = plane(w, d, ceilMat);
    c.rotation.x = Math.PI / 2;
    c.position.set(x, H, z);
  }
  const WELL = 1.6;
  for (const [x0, z0, x1, z1] of [
    [-SKY / 2, zC + SKY / 2, SKY / 2, zC + SKY / 2],
    [-SKY / 2, zC - SKY / 2, SKY / 2, zC - SKY / 2],
    [-SKY / 2, zC + SKY / 2, -SKY / 2, zC - SKY / 2],
    [SKY / 2, zC + SKY / 2, SKY / 2, zC - SKY / 2],
  ] as const)
    wall(x0, z0, x1, z1, H, H + WELL, 0.2, false);
  {
    // deep plaster baffles across the skylight, softening the daylight (as in the reference galleries)
    const n = 22;
    const bg = new THREE.BoxGeometry(0.07, 1.15, SKY);
    keep(bg);
    const baffles = new THREE.InstancedMesh(bg, ceilMat, n);
    const m4 = new THREE.Matrix4();
    for (let i = 0; i < n; i++) {
      m4.makeTranslation(-SKY / 2 + (i + 0.5) * (SKY / n), H + WELL - 0.6, zC);
      baffles.setMatrixAt(i, m4);
    }
    baffles.receiveShadow = hq;
    baffles.castShadow = hq;
    scene.add(baffles);
  }
  // the light from it: soft daylight over the whole atrium, and one raking sunbeam with real shadows
  if (hq) {
    const sky = new THREE.RectAreaLight(0xf4f7ff, 2.4, SKY, SKY);
    sky.position.set(0, H + 0.05, zC);
    sky.lookAt(0, 0, zC);
    scene.add(sky);
  }
  // (a patch of sun, not a floodlight: striped by the baffles' shadows where shadows are drawn)
  const sun = new THREE.SpotLight(0xfff3df, hq ? 2.4 : 1.9, 0, 0.3, 0.3, 0);
  sun.position.set(5, H + WELL + 6, zC + 4);
  sun.target.position.set(-1, 0, zC - 3);
  sun.castShadow = hq;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.bias = -0.0004;
  sun.shadow.normalBias = 0.03;
  sun.shadow.camera.near = 4;
  sun.shadow.camera.far = 40;
  scene.add(sun, sun.target);
  // the sky over the skylight: a photographed midday sky, as bright as daylight, turned so
  // its sun is where the sunbeam comes from (seen only up through the skylight)
  {
    const SUN_U = 0.6; // where the sun is across the sky image
    const mat = new THREE.MeshBasicMaterial({
      map: S.sky,
      side: THREE.BackSide,
      toneMapped: false,
      color: new THREE.Color(2.4, 2.25, 2.0), // (a little warmer: a blue sky's light alone tints the white walls lilac)
    });
    const g = new THREE.SphereGeometry(26, 64, 24, 0, Math.PI * 2, 0, Math.PI / 2);
    keep(mat, g);
    const dome = new THREE.Mesh(g, mat);
    dome.position.set(0, H + WELL, zC);
    const phi = SUN_U * Math.PI * 2;
    const from = Math.atan2(Math.sin(phi), -Math.cos(phi));
    const to = Math.atan2(
      sun.position.z - sun.target.position.z,
      sun.position.x - sun.target.position.x,
    );
    dome.rotation.y = from - to;
    scene.add(dome);
  }

  // walls: either side of the hall's end, over it, the sides, the back above the upper floor
  // (the outer walls' inner faces are at ±W/2, where films and pictures hang: their middles sit 0.15 m out)
  const ox = W / 2 + 0.15;
  wall(-W / 2, zA - 0.15, -hallW / 2, zA - 0.15, 0, H);
  wall(hallW / 2, zA - 0.15, W / 2, zA - 0.15, 0, H);
  wall(-hallW / 2, zA - 0.15, hallW / 2, zA - 0.15, 4.2, H, 0.3, false);
  wall(-ox, zA, -ox, zEnd, 0, yU + UPPER.H);
  wall(ox, zA, ox, zEnd, 0, yU + UPPER.H);
  wall(-ox, zA, -ox, zB, yU + UPPER.H, H, 0.3, false);
  wall(ox, zA, ox, zB, yU + UPPER.H, H, 0.3, false);
  wall(-W / 2, zB, W / 2, zB, yU + UPPER.H, H, 0.3, false);
  // the upper floor's edge, either side of the stairs: a deep slab in plaster
  wall(-W / 2, zB, -STAIRS.half, zB, 0, yU);
  wall(STAIRS.half, zB, W / 2, zB, 0, yU);
  // soft light along the top of the walls, under the ceiling
  addCoveLighting(ctx, H, [
    { len: W, x: 0, z: zA - 0.3, ry: Math.PI },
    { len: ATRIUM.D, x: -W / 2, z: zC, ry: Math.PI / 2 },
    { len: ATRIUM.D, x: W / 2, z: zC, ry: -Math.PI / 2 },
  ]);

  zones.push({
    minX: -W / 2 + 0.45,
    maxX: W / 2 - 0.45,
    minZ: zB + 0.35,
    maxZ: zA,
    floor: () => 0,
    level: 0,
  });
  // the wall either side of the portal (you come in through the middle)
  blockAt(-W / 2, -2.85, zA - 0.75, zA + 0.35, 0);
  blockAt(2.85, W / 2, zA - 0.75, zA + 0.35, 0);

  /* ---------- the Threshold: the mark in blackened steel ---------- */
  const zT = zA - 12;
  {
    const g = new THREE.Group();
    g.position.set(0, 0, zT);
    scene.add(g);
    const base = box(7.2, 0.2, 3.2, stone, 0, 0.1, zT);
    base.castShadow = hq;
    const panel = (pts: [number, number][]) => {
      const sh = new THREE.Shape();
      sh.moveTo(pts[0][0], pts[0][1]);
      pts.slice(1).forEach(([x, y]) => sh.lineTo(x, y));
      sh.closePath();
      const geo = new THREE.ExtrudeGeometry(sh, {
        depth: 0.9,
        bevelEnabled: true,
        bevelSize: 0.012,
        bevelThickness: 0.012,
        bevelSegments: 3,
      });
      geo.translate(0, 0.2, -0.45);
      keep(geo);
      // (its outline, in front of a film frame)
      cutouts.push({
        pts: pts.flatMap(([x, y]) =>
          [-0.46, 0.46].map((dz) => new THREE.Vector3(x, y + 0.2, zT + dz)),
        ),
      });
      const m = new THREE.Mesh(geo, steelBlack);
      m.castShadow = hq;
      m.receiveShadow = hq;
      g.add(m);
    };
    // as in the mark: the tops run down to the right, across both panels
    panel([
      [-2.6, 0],
      [-0.55, 0],
      [-0.55, 7.25],
      [-2.6, 8.3],
    ]);
    panel([
      [0.55, 0],
      [2.6, 0],
      [2.6, 5.85],
      [0.55, 6.9],
    ]);
    // the slot of light in the gap: a white core, an LED line on each inner face (blue, amber)
    const core = new THREE.MeshBasicMaterial({
      color: new THREE.Color(1, 0.98, 0.95).multiplyScalar(3.2),
      toneMapped: false,
    });
    const blueLed = new THREE.MeshBasicMaterial({
      color: new THREE.Color(0.25, 0.42, 1).multiplyScalar(2.6),
      toneMapped: false,
    });
    const amberLed = new THREE.MeshBasicMaterial({
      color: new THREE.Color(1, 0.55, 0.16).multiplyScalar(2.6),
      toneMapped: false,
    });
    keep(core, blueLed, amberLed);
    const slot = (w: number, mat: THREE.Material, x: number, top: number) => {
      const gg = new THREE.BoxGeometry(w, top - 0.35, 0.5);
      keep(gg);
      const m = new THREE.Mesh(gg, mat);
      m.position.set(x, 0.2 + (top - 0.35) / 2 + 0.1, 0);
      g.add(m);
    };
    slot(0.07, core, 0, 6.8);
    slot(0.025, blueLed, -0.535, 7.1);
    slot(0.025, amberLed, 0.535, 6.75);
    // the light it throws: on the panels' inner faces, and out across the floor
    if (hq) {
      for (const [sx, col] of [
        [-1, 0x4466ff],
        [1, 0xff8a2a],
      ] as const) {
        const ra = new THREE.RectAreaLight(col, 9, 0.9, 6.6);
        ra.position.set(sx * 0.05, 3.6, 0);
        ra.lookAt(sx * 1, 3.6, 0);
        g.add(ra);
      }
    }
    const blue = new THREE.PointLight(0x4a62ff, 22, 14, 2);
    blue.position.set(-0.5, 2.8, 1.2);
    const amber = new THREE.PointLight(0xff8a2a, 22, 14, 2);
    amber.position.set(0.5, 2.6, 1.2);
    g.add(blue, amber);
    const pl = poolTexture([
      [0, "rgba(255,255,255,0.75)"],
      [0.22, "rgba(150,180,255,0.32)"],
      [0.55, "rgba(255,160,80,0.12)"],
      [1, "rgba(255,160,80,0)"],
    ]);
    const plMat = new THREE.MeshBasicMaterial({
      map: pl,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      opacity: 0.45,
    });
    keep(pl, plMat);
    const pg = new THREE.PlaneGeometry(7, 7);
    keep(pg);
    const pm = new THREE.Mesh(pg, plMat);
    pm.rotation.x = -Math.PI / 2;
    pm.position.set(0, 0.012, 3.4);
    g.add(pm);
    blockAt(-3.85, 3.85, zT - 1.85, zT + 1.85, 0);
    places.push({ name: "The Threshold", x: 0, y: 0, z: zT + 11.2, yaw: 0, pitch: 0.16 });
  }

  /* ---------- the Halo: polished steel, a line of prism light within, hung on cables ---------- */
  {
    const y = 11.4;
    const ring = new THREE.Mesh(new THREE.TorusGeometry(4.2, 0.075, 16, 220), mirror);
    keep(ring.geometry);
    ring.rotation.x = Math.PI / 2;
    ring.position.set(0, y, zT);
    scene.add(ring);
    const ledGeo = new THREE.TorusGeometry(4.12, 0.018, 8, 260);
    const pos = ledGeo.getAttribute("position");
    const cols = new Float32Array(pos.count * 3);
    const c = new THREE.Color();
    for (let i = 0; i < pos.count; i++) {
      const a = (Math.atan2(pos.getY(i), pos.getX(i)) / (Math.PI * 2) + 1) % 1;
      prismAt(a < 0.5 ? a * 2 : 2 - a * 2, c).multiplyScalar(2.2);
      cols.set([c.r, c.g, c.b], i * 3);
    }
    ledGeo.setAttribute("color", new THREE.BufferAttribute(cols, 3));
    const ledMat = new THREE.MeshBasicMaterial({ vertexColors: true, toneMapped: false });
    keep(ledGeo, ledMat);
    const led = new THREE.Mesh(ledGeo, ledMat);
    led.rotation.x = Math.PI / 2;
    led.position.set(0, y - 0.02, zT);
    scene.add(led);
    for (let k = 0; k < 4; k++) {
      const a = (k / 4) * Math.PI * 2 + Math.PI / 4;
      hang(Math.cos(a) * 4.2, y + 0.07, zT + Math.sin(a) * 4.2, H);
    }
    animate.push((t) => {
      // a slow, slight sway on its cables
      const s = Math.sin(t * 0.35) * 0.012;
      ring.rotation.y = s;
      led.rotation.y = s;
    });
  }

  /* ---------- the Lens: optical glass on a plinth ---------- */
  {
    const x = -9.5;
    const z = zA - 9;
    const pl = new THREE.Mesh(new THREE.CylinderGeometry(1.0, 1.0, 1.0, 64), plinth);
    keep(pl.geometry);
    pl.position.set(x, 0.5, z);
    pl.castShadow = hq;
    pl.receiveShadow = hq;
    scene.add(pl);
    const lensMat = new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      roughness: 0.01,
      transmission: hq ? 1 : 0,
      transparent: !hq,
      opacity: hq ? 1 : 0.14,
      depthWrite: hq,
      thickness: 2.4,
      ior: 1.52,
      dispersion: hq ? 3 : 0,
      attenuationColor: new THREE.Color(0xeef6ff),
      attenuationDistance: 6,
      envMapIntensity: 1.3,
    });
    keep(lensMat);
    const sph = new THREE.Mesh(new THREE.SphereGeometry(1.2, 96, 64), lensMat);
    keep(sph.geometry);
    sph.position.set(x, 1.0 + 1.2, z);
    sph.castShadow = hq;
    scene.add(sph);
    // (its outline: points all over it)
    cutouts.push({
      pts: Array.from({ length: 72 }, (_, k) => {
        const yy = 1 - (2 * (k + 0.5)) / 72;
        const rr = Math.sqrt(1 - yy * yy);
        const a = k * 2.39996;
        return new THREE.Vector3(Math.cos(a) * rr, yy, Math.sin(a) * rr)
          .multiplyScalar(1.22)
          .add(sph.position);
      }),
    });
    colliders.push({ kind: "circle", x, z, r: 1.4, level: 0 });
    places.push({ name: "The Lens", x: x + 4.4, y: 0, z: z + 4.2, yaw: Math.atan2(4.4, 4.2) });
  }

  /* ---------- the Ribbon: mirror-polished steel, twisting 8 m high ---------- */
  {
    const x = 9.5;
    const z = zA - 9;
    const pts: THREE.Vector3[] = [];
    for (let i = 0; i <= 40; i++) {
      const t = i / 40;
      const a = t * Math.PI * 2.4;
      const r = 1.1 + Math.sin(t * Math.PI) * 0.9;
      pts.push(new THREE.Vector3(x + Math.cos(a) * r, 0.35 + t * 7.8, z + Math.sin(a) * r));
    }
    // (its outline: the band along its curve, a little wider than its half-width)
    cutouts.push({ pts, band: 0.36 });
    const geo = ribbonGeometry(new THREE.CatmullRomCurve3(pts), 360, 0.62, 1.5);
    keep(geo);
    const rib = new THREE.Mesh(geo, mirror);
    rib.castShadow = hq;
    scene.add(rib);
    const base = new THREE.Mesh(new THREE.CylinderGeometry(2.0, 2.0, 0.12, 64), stone);
    keep(base.geometry);
    base.position.set(x, 0.06, z);
    base.receiveShadow = hq;
    scene.add(base);
    colliders.push({ kind: "circle", x, z, r: 2.3, level: 0 });
    // (9 m back, looking up a little: all 8 m of it in view, from its foot)
    places.push({
      name: "The Ribbon",
      x: x - 5.97,
      y: 0,
      z: z + 6.74,
      yaw: -Math.atan2(4.6, 5.2),
      pitch: 0.22,
    });
  }

  /* ---------- a rain of glass: iridescent panes on cables, turning slowly ---------- */
  {
    const paneG = new THREE.BoxGeometry(0.62, 1.3, 0.012);
    keep(paneG);
    const panes: { m: THREE.Mesh; s: number }[] = [];
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2 + 0.3;
      const r = 6.2 + (i % 3) * 0.9;
      const px = Math.cos(a) * r;
      const pz = zC + Math.sin(a) * r;
      const py = 7.8 + ((i * 37) % 5) * 0.7;
      const m = new THREE.Mesh(paneG, iris);
      m.position.set(px, py, pz);
      scene.add(m);
      hang(px, py + 0.65, pz, H);
      panes.push({ m, s: 0.06 + (i % 4) * 0.02 });
    }
    animate.push((t) => panes.forEach(({ m, s }, i) => (m.rotation.y = t * s + i * 0.7)));
  }

  /* ---------- two great frames on the side walls, each under its picture light, a film playing in each ---------- */
  for (const sx of [-1, 1]) {
    const at = new THREE.Vector3(sx * (W / 2 - 0.02), 4.4, zA - 15);
    const size = { w: 7.2, h: 4.05 }; // a film's shape (16:9)
    const { pic } = addFramedPicture(
      ctx,
      at,
      new THREE.Vector3(-sx, 0, 0),
      size,
      sx > 0 ? 11 : 12,
      new THREE.Vector3(0, 0, sx > 0 ? 1 : -1),
    );
    frames.push({ pic, ...size });
    // its picture light: a brass bar on an arm above the frame, and its light on the canvas
    const bar = box(0.07, 0.07, 3.4, brass, sx * (W / 2 - 0.42), 4.4 + 2.55, zA - 15);
    bar.castShadow = hq;
    box(0.36, 0.025, 0.025, brass, sx * (W / 2 - 0.2), 4.4 + 2.58, zA - 15 - 1.2);
    box(0.36, 0.025, 0.025, brass, sx * (W / 2 - 0.2), 4.4 + 2.58, zA - 15 + 1.2);
    pool(sx * (W / 2 - 0.02), 4.9, zA - 15, -sx, 0, 8.4, 4.6, 0.7);
  }

  /* ---------- the title, over the balcony ---------- */
  addWallTitle(
    ctx,
    new THREE.Vector3(0, yU + UPPER.H + 1.25, zB + 0.18),
    new THREE.Vector3(0, 0, 1),
    o.aniso,
  );

  /* ---------- benches facing the Threshold ---------- */
  for (const sx of [-1, 1]) {
    const bx = sx * 5.2;
    const bz = zA - 4.2;
    addBench(ctx, new THREE.Vector3(bx, 0, bz), 0);
    benches.push({ x: bx, z: bz, floor: 0, seats: [{ x: bx, z: bz + 0.06, yaw: 0 }] });
    blockAt(bx - 1.35, bx + 1.35, bz - 0.45, bz + 0.45, 0);
  }

  /* ---------- the grand staircase: oak treads, glass sides, oak rails ---------- */
  {
    const steps = 24;
    const rise = yU / steps;
    const run = STAIRS.run / steps;
    const z0 = zB + STAIRS.run; // its foot
    const nosing = new THREE.MeshStandardMaterial({ color: 0x2a1f16, roughness: 0.6 }); // a dark oak edge
    const stepLight = new THREE.MeshBasicMaterial({
      color: new THREE.Color(1, 0.86, 0.66).multiplyScalar(1.2),
      toneMapped: false,
    });
    keep(nosing, stepLight);
    for (let i = 0; i < steps; i++) {
      const top = (i + 1) * rise;
      const zc = z0 - (i + 0.5) * run;
      const s = box(STAIRS.half * 2, top, run, oak, 0, top / 2, zc);
      s.castShadow = hq;
      // a darker nosing on each tread's edge, and a soft light under it (every other step)
      box(STAIRS.half * 2, 0.012, 0.045, nosing, 0, top + 0.004, zc + run / 2 - 0.023);
      if (i % 2 === 0)
        box(
          STAIRS.half * 2 - 0.4,
          0.012,
          0.012,
          stepLight,
          0,
          top - rise + 0.03,
          zc + run / 2 + 0.008,
        );
    }
    const slope = Math.atan2(yU, STAIRS.run);
    const len = Math.hypot(STAIRS.run, yU);
    for (const sx of [-1, 1]) {
      const gg = new THREE.PlaneGeometry(len, 1.0);
      keep(gg);
      const pane = new THREE.Mesh(gg, glass);
      pane.rotation.set(0, Math.PI / 2, slope, "YXZ");
      pane.position.set(sx * STAIRS.half, yU / 2 + 0.55, z0 - STAIRS.run / 2);
      scene.add(pane);
      const rail = box(
        0.06,
        0.05,
        len,
        handrail,
        sx * STAIRS.half,
        yU / 2 + 1.07,
        z0 - STAIRS.run / 2,
      );
      rail.rotation.x = slope;
      // the solid side under it
      blockAt(
        sx > 0 ? STAIRS.half : -STAIRS.half - 0.3,
        sx > 0 ? STAIRS.half + 0.3 : -STAIRS.half,
        zB,
        z0,
        0,
      );
    }
    zones.push({
      minX: -STAIRS.half + 0.35,
      maxX: STAIRS.half - 0.35,
      minZ: zB - 0.01,
      maxZ: z0,
      floor: (_x, z) => Math.min(yU, Math.max(0, ((z0 - z) / STAIRS.run) * yU)),
      // the tread you'd be standing on (its top), for what lies on the stairs
      surface: (_x, z) => Math.min(yU, Math.max(0, Math.ceil((z0 - z) / run) * rise)),
      level: 0,
      over: true,
    });
    places.push({ name: "The staircase", x: 0, y: 0, z: z0 + 2.5, yaw: 0, pitch: 0.24 });
  }

  /* ---------- the upper floor: oak, the balcony, the corridor ---------- */
  const uLen = zB - zEnd;
  const uFloor = plane(W, uLen, oak);
  uFloor.rotation.x = -Math.PI / 2;
  uFloor.position.set(0, yU, zB - uLen / 2);
  floors.push(uFloor);
  // the balcony's and the corridor's ceiling (the rooms have their own light ceilings)
  {
    const c = plane(W, UPPER.balcony, ceilMat);
    c.rotation.x = Math.PI / 2;
    c.position.set(0, yU + UPPER.H, zB - UPPER.balcony / 2);
    const corrLen = zB - UPPER.balcony - zR;
    const cc = plane(UPPER.corridor * 2, corrLen, ceilMat);
    cc.rotation.x = Math.PI / 2;
    cc.position.set(0, yU + UPPER.H, zB - UPPER.balcony - corrLen / 2);
    // a recessed line of light down the middle of the corridor's ceiling
    const slot = box(
      0.14,
      0.02,
      corrLen - 1,
      new THREE.MeshBasicMaterial({
        color: new THREE.Color(1, 0.95, 0.88).multiplyScalar(1.6),
        toneMapped: false,
      }),
      0,
      yU + UPPER.H - 0.012,
      zB - UPPER.balcony - corrLen / 2,
    );
    keep(slot.material as THREE.Material);
  }
  // the balcony's glass railing over the atrium (the stairs come up through its middle)
  for (const [x0, x1] of [
    [-W / 2, -STAIRS.half],
    [STAIRS.half, W / 2],
  ]) {
    const gg = new THREE.PlaneGeometry(x1 - x0, 1.0);
    keep(gg);
    const pane = new THREE.Mesh(gg, glass);
    pane.position.set((x0 + x1) / 2, yU + 0.52, zB + 0.04);
    scene.add(pane);
    box(x1 - x0, 0.05, 0.07, handrail, (x0 + x1) / 2, yU + 1.06, zB + 0.04);
  }
  zones.push({
    minX: -W / 2 + 0.45,
    maxX: W / 2 - 0.45,
    minZ: zEnd + 0.45,
    maxZ: zB,
    floor: () => yU,
    level: 1,
  });
  const warmUp = new THREE.PointLight(0xffd6a6, 16, 22, 1.6);
  warmUp.position.set(0, yU + UPPER.H - 0.8, zB - UPPER.balcony - 4);
  scene.add(warmUp);
  // (turned back, looking down over the atrium you've come through; the rooms are the next stop)
  places.push({ name: "The balcony", x: 0, y: yU, z: zB - 1.6, yaw: Math.PI, pitch: -0.2 });

  /* ---------- the rooms, one per client ---------- */
  const doorW = ROOM.door;
  const doorH = 3.3;
  const laylight = new THREE.MeshBasicMaterial({
    color: new THREE.Color(1, 0.98, 0.95).multiplyScalar(1.15),
    toneMapped: false,
  });
  const prismKnotGeo = new THREE.TorusKnotGeometry(0.34, 0.055, 220, 14, 2, 3);
  keep(laylight, prismKnotGeo);
  // a client's colour, as a deep, quiet paint (`l`: how light; `s`: how strong at most)
  const tone = (hex: string, l: number, s: number) => {
    const hsl = { h: 0, s: 0, l: 0 };
    new THREE.Color(hex).getHSL(hsl, THREE.SRGBColorSpace);
    return new THREE.Color().setHSL(hsl.h, Math.min(hsl.s, s), l, THREE.SRGBColorSpace);
  };
  const css = (c: THREE.Color) => `#${c.getHexString(THREE.SRGBColorSpace)}`;
  // the doors, opening as you come near: each its leaf, its hinge, how open (0 to 1)
  const roomDoors: { leaf: THREE.Group; side: -1 | 1; x: number; z: number; open: number }[] = [];
  const brassEdge = new THREE.MeshStandardMaterial({
    color: 0xb8925a,
    metalness: 1,
    roughness: 0.32,
  });
  keep(brassEdge);

  /* a sculpture on a stone plinth, a different one in each room */
  const sculpture = (r: number, x: number, z: number) => {
    const pl = box(0.8, 1.0, 0.8, plinth, x, yU + 0.5, z);
    pl.castShadow = hq;
    const g = new THREE.Group();
    g.position.set(x, yU + 1.6, z);
    scene.add(g);
    const kind = r % 4;
    if (kind === 0) {
      // a cube of glass, balanced on its corner
      const gg = new THREE.BoxGeometry(0.62, 0.62, 0.62);
      keep(gg);
      const m = new THREE.Mesh(gg, iris);
      m.rotation.set(Math.atan(Math.SQRT1_2), 0, Math.PI / 4);
      m.position.y = 0.1;
      g.add(m);
    } else if (kind === 1) {
      // a knot of polished brass
      const m = new THREE.Mesh(prismKnotGeo, brass);
      m.castShadow = hq;
      g.add(m);
    } else if (kind === 2) {
      // three rings of mirror steel, nested
      [0.46, 0.35, 0.24].forEach((rad, k) => {
        const gg = new THREE.TorusGeometry(rad, 0.02, 12, 120);
        keep(gg);
        const m = new THREE.Mesh(gg, mirror);
        m.rotation.set(k * 0.9, k * 0.6, 0);
        g.add(m);
      });
    } else {
      // a sphere of mirror steel
      const gg = new THREE.SphereGeometry(0.4, 64, 40);
      keep(gg);
      const m = new THREE.Mesh(gg, mirror);
      m.castShadow = hq;
      m.position.y = -0.08;
      g.add(m);
    }
    animate.push((t) => {
      g.rotation.y = t * 0.12 + r;
      if (kind === 2) g.children.forEach((m, k) => (m.rotation.x = t * (0.1 + k * 0.05)));
    });
    colliders.push({ kind: "circle", x, z, r: 0.75, level: 1 });
  };

  /* a sign: words in spaced capitals, dark on the wall */
  const sign = (
    text: string,
    w: number,
    x: number,
    y: number,
    z: number,
    facing: number,
    size = 64,
  ) => {
    const c = document.createElement("canvas");
    c.width = 1024;
    c.height = 160;
    const x2 = c.getContext("2d")!;
    x2.fillStyle = "#16120e";
    x2.font = `300 ${size}px Jost, ui-sans-serif, system-ui`;
    x2.textAlign = "center";
    x2.fillText(text.toUpperCase().split("").join(" "), 512, 104, 990);
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = o.aniso;
    const mat = new THREE.MeshBasicMaterial({ map: tex, transparent: true });
    keep(tex, mat);
    const m = plane(w, (w * 160) / 1024, mat);
    m.position.set(x, y, z);
    m.rotation.y = facing;
  };

  /* a client's mark, drawn into a canvas (centred in a box), once it has loaded */
  const drawMark = (
    g: CanvasRenderingContext2D,
    img: HTMLImageElement,
    cx: number,
    cy: number,
    maxW: number,
    maxH: number,
  ) => {
    const k = Math.min(maxW / img.width, maxH / img.height);
    g.drawImage(
      img,
      cx - (img.width * k) / 2,
      cy - (img.height * k) / 2,
      img.width * k,
      img.height * k,
    );
  };
  const spacedLines = (name: string, per: number) => {
    const lines: string[] = [];
    for (const wd of name.toUpperCase().split(" ")) {
      const last = lines[lines.length - 1];
      if (last && (last + " " + wd).length <= per) lines[lines.length - 1] = last + " " + wd;
      else lines.push(wd);
    }
    return lines.slice(0, 3).map((ln) => ln.split("").join(" "));
  };
  /* lines of words in a box: the largest size (up to `size`) at which the widest fits `maxW` */
  const fitFont = (g: CanvasRenderingContext2D, lines: string[], size: number, maxW: number) => {
    let px = size;
    for (; px > 20; px -= 2) {
      g.font = `300 ${px}px Jost, ui-sans-serif, system-ui`;
      if (Math.max(...lines.map((l) => g.measureText(l).width)) <= maxW) break;
    }
    return px;
  };
  const prismRule = (g: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) => {
    const grad = g.createLinearGradient(x, 0, x + w, 0);
    ["#1f2cff", "#2bb8ff", "#ffffff", "#ff8a1f", "#ff3d1f"].forEach((col, k) =>
      grad.addColorStop(k / 4, col),
    );
    g.fillStyle = grad;
    g.fillRect(x, y, w, h);
  };

  plan.rooms.forEach((f, r) => {
    const client = clients[r]!;
    const { side, cx } = f;
    const inward = side; // from the corridor into the room
    const yaw = side < 0 ? Math.PI / 2 : -Math.PI / 2;
    const paintC = tone(client.color, 0.32, 0.22);
    const lacquerC = tone(client.color, 0.15, 0.45);
    // (drawn a hair in front of the wall in depth too, so a phone's coarser depth never lets the
    // plaster show through)
    const paint = new THREE.MeshStandardMaterial({
      color: paintC,
      roughness: 0.93,
      polygonOffset: true,
      polygonOffsetFactor: -1,
      polygonOffsetUnits: -2,
    });
    keep(paint);

    /* the walls: the corridor wall with a doorway in the room's middle; its near and far walls (a
       room's near wall is the far wall of the room before it on its side: drawn once) */
    wall(cx, f.z1, cx, f.zc + doorW / 2, yU, yU + UPPER.H);
    wall(cx, f.zc - doorW / 2, cx, f.z0, yU, yU + UPPER.H);
    wall(cx, f.zc + doorW / 2, cx, f.zc - doorW / 2, yU + doorH, yU + UPPER.H, 0.3, false);
    blockAt(cx - 0.3, cx + 0.3, f.zc + doorW / 2 - 0.15, f.z1 + 0.3, 1);
    blockAt(cx - 0.3, cx + 0.3, f.z0 - 0.3, f.zc - doorW / 2 + 0.15, 1);
    for (const zz of f.first ? [f.z1, f.z0] : [f.z0]) wall(f.x0, zz, f.x1, zz, yU, yU + UPPER.H);
    for (const zz of [f.z1, f.z0])
      blockAt(Math.min(f.x0, f.x1), Math.max(f.x0, f.x1), zz - 0.3, zz + 0.3, 1);

    /* painted in the client's colour, deep and quiet, as museums paint a room for its collection
       (a skin just proud of each wall's inner face, the shadow gap at the foot left showing) */
    const skin = (
      w: number,
      h: number,
      x: number,
      y: number,
      z: number,
      nx: number,
      nz: number,
    ) => {
      const m = plane(w, h, paint);
      m.position.set(x + nx * 0.002, y, z + nz * 0.002);
      m.rotation.y = Math.atan2(nx, nz);
    };
    const inner = Math.abs(f.x1 - f.x0) - 0.15; // corridor wall's face to the outer wall
    const xMid = cx + inward * (0.15 + inner / 2);
    const hy = UPPER.H - 0.04;
    const ym = yU + 0.04 + hy / 2;
    skin(inner, hy, xMid, ym, f.z0 + 0.15, 0, 1);
    skin(inner, hy, xMid, ym, f.z1 - 0.15, 0, -1);
    skin(f.depth - 0.3, hy, side * (ATRIUM.W / 2), ym, f.zc, -side, 0);
    const cf = cx + inward * 0.15; // the corridor wall's face, inside
    const nearLen = f.z1 - 0.15 - (f.zc + doorW / 2);
    const farLen = f.zc - doorW / 2 - (f.z0 + 0.15);
    skin(nearLen, hy, cf, ym, f.zc + doorW / 2 + nearLen / 2, inward, 0);
    skin(farLen, hy, cf, ym, f.z0 + 0.15 + farLen / 2, inward, 0);
    skin(doorW, UPPER.H - doorH, cf, yU + doorH + (UPPER.H - doorH) / 2, f.zc, inward, 0);

    // its light: warm and soft from the laylight above, one lamp for every ten metres or so of room
    const lamps = Math.max(1, Math.round(f.depth / 10));
    for (let k = 0; k < lamps; k++) {
      const l = new THREE.PointLight(0xffe2c4, 22, 15, 1.4);
      l.position.set(f.xc, yU + UPPER.H - 0.7, f.z1 - ((k + 0.5) * f.depth) / lamps);
      scene.add(l);
    }
    // its light ceiling: a laylight of diffusing glass in a fine frame, softly lighting the room
    const lw = Math.abs(f.x1 - f.x0) - 1.2;
    const ld = f.depth - 1.2;
    const ceil = plane(Math.abs(f.x1 - f.x0), f.depth, ceilMat);
    ceil.rotation.x = Math.PI / 2;
    ceil.position.set(f.xc, yU + UPPER.H + 0.01, f.zc);
    const lay = plane(lw, ld, laylight);
    lay.rotation.x = Math.PI / 2;
    lay.position.set(f.xc, yU + UPPER.H - 0.01, f.zc);
    for (let k = 1; k < 4; k++)
      box(0.04, 0.03, ld, darkMetal, f.xc - lw / 2 + (k * lw) / 4, yU + UPPER.H - 0.03, f.zc);
    const bays = Math.max(3, Math.round(ld / 3));
    for (let k = 1; k < bays; k++)
      box(lw, 0.03, 0.04, darkMetal, f.xc, yU + UPPER.H - 0.03, f.zc - ld / 2 + (k * ld) / bays);

    /* the emblem, facing you as you come in: on an ivory panel in a fine brass frame in the middle
       of the outer wall, its name under it and a line of prism light, washed with light */
    {
      const c = document.createElement("canvas");
      c.width = 1024;
      c.height = 1280;
      const g = c.getContext("2d")!;
      const tex = new THREE.CanvasTexture(c);
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.anisotropy = o.aniso;
      const draw = (img?: HTMLImageElement) => {
        g.fillStyle = "#f7f3ea";
        g.fillRect(0, 0, 1024, 1280);
        if (img)
          drawMark(g, img, 512, 450, client.markIsLogo ? 860 : 620, client.markIsLogo ? 300 : 620);
        g.fillStyle = "#1b1712";
        g.textAlign = "center";
        const lines = spacedLines(client.name, 14);
        const px = fitFont(g, lines, 62, 880);
        lines.forEach((ln, k) => g.fillText(ln, 512, 900 + k * px * 1.4));
        prismRule(g, 392, 1150, 240, 6);
        tex.needsUpdate = true;
      };
      draw();
      const img = new Image();
      img.onload = () => draw(img);
      img.src = client.mark;
      const emMat = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.85 });
      keep(tex, emMat);
      const pw = 2.4;
      const ph = 3.0;
      const plateG = new THREE.BoxGeometry(pw, ph, 0.04);
      keep(plateG);
      const plate = new THREE.Mesh(plateG, [paint, paint, paint, paint, emMat, paint]);
      const fx = side * (ATRIUM.W / 2) - side * 0.022;
      plate.position.set(fx, yU + 2.55, f.zc);
      plate.rotation.y = -side * (Math.PI / 2);
      plate.castShadow = hq;
      scene.add(plate);
      // its brass frame
      const t = 0.035;
      for (const [w, h, dy, dz] of [
        [pw + 2 * t, t, ph / 2 + t / 2, 0],
        [pw + 2 * t, t, -ph / 2 - t / 2, 0],
        [t, ph, 0, pw / 2 + t / 2],
        [t, ph, 0, -pw / 2 - t / 2],
      ] as const) {
        const fr = box(w, h, 0.05, brassEdge, fx, yU + 2.55 + dy, f.zc + dz);
        fr.rotation.y = -side * (Math.PI / 2);
      }
      pool(side * (ATRIUM.W / 2), yU + 2.7, f.zc, -side, 0, 5.2, 5.4, 0.7);
    }

    /* its films: a track along the ceiling in front of each wall that has them, a spot for each film,
       and its light on the wall */
    const byWall = new Map<string, RoomSpot[]>();
    for (const s of f.spots) {
      const key = `${s.nx},${s.nz}`;
      byWall.set(key, [...(byWall.get(key) ?? []), s]);
    }
    for (const list of byWall.values()) {
      const s0 = list[0]!;
      const off = 1.7;
      const ys = yU + UPPER.H;
      if (s0.nx !== 0) {
        const zs = list.map((s) => s.z);
        const z0 = Math.min(...zs) - 1;
        const z1 = Math.max(...zs) + 1;
        box(0.05, 0.04, z1 - z0, darkMetal, s0.x + s0.nx * off, ys - 0.05, (z0 + z1) / 2);
      } else {
        const xs = list.map((s) => s.x);
        const x0 = Math.min(...xs) - 1;
        const x1 = Math.max(...xs) + 1;
        box(x1 - x0, 0.04, 0.05, darkMetal, (x0 + x1) / 2, ys - 0.05, s0.z + s0.nz * off);
      }
      for (const s of list) {
        spotHead(s.x + s.nx * off, ys - 0.07, s.z + s.nz * off, s.x, yU + 1.62, s.z);
        pool(s.x, yU + 1.75, s.z, s.nx, s.nz, 3.6, 2.9);
      }
    }

    /* the door: closed, a single tall leaf lacquered in the client's colour, their emblem on it in a
       brass-ringed medallion, their name in gold beneath; it swings into the room as you come near
       (`update`), and stands open across the room's corner while you're near */
    {
      const lw2 = doorW - 0.03;
      const lh = doorH - 0.02;
      const c = document.createElement("canvas");
      c.width = 1024;
      c.height = Math.round((1024 * lh) / lw2);
      const g = c.getContext("2d")!;
      const tex = new THREE.CanvasTexture(c);
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.anisotropy = o.aniso;
      const H2 = c.height;
      const gold = "#d6b47a";
      const draw = (img?: HTMLImageElement) => {
        // lacquer, a soft sheen down it
        g.fillStyle = css(lacquerC);
        g.fillRect(0, 0, 1024, H2);
        const sheen = g.createLinearGradient(0, 0, 1024, 0);
        sheen.addColorStop(0, "rgba(255,255,255,0.05)");
        sheen.addColorStop(0.45, "rgba(255,255,255,0)");
        sheen.addColorStop(1, "rgba(0,0,0,0.12)");
        g.fillStyle = sheen;
        g.fillRect(0, 0, 1024, H2);
        // a fine double line of gold, inset
        g.strokeStyle = gold;
        g.lineWidth = 3;
        g.strokeRect(70, 70, 1024 - 140, H2 - 140);
        g.lineWidth = 1.5;
        g.strokeRect(88, 88, 1024 - 176, H2 - 176);
        // the medallion: ivory in a ring of brass, the client's mark in it
        const my = H2 * 0.4;
        const R = client.markIsLogo ? 0 : 250;
        if (R) {
          const ring = g.createLinearGradient(512 - R, my - R, 512 + R, my + R);
          ring.addColorStop(0, "#f3dcaa");
          ring.addColorStop(0.5, "#b88d4f");
          ring.addColorStop(1, "#f0d29a");
          g.fillStyle = ring;
          g.beginPath();
          g.arc(512, my, R + 18, 0, Math.PI * 2);
          g.fill();
          g.fillStyle = "#f6f1e5";
          g.beginPath();
          g.arc(512, my, R, 0, Math.PI * 2);
          g.fill();
          if (img) drawMark(g, img, 512, my, R * 1.25, R * 1.45);
        } else {
          // a wide logo: on an ivory plaque in brass
          const pw2 = 760;
          const ph2 = 300;
          g.fillStyle = gold;
          g.fillRect(512 - pw2 / 2 - 14, my - ph2 / 2 - 14, pw2 + 28, ph2 + 28);
          g.fillStyle = "#f6f1e5";
          g.fillRect(512 - pw2 / 2, my - ph2 / 2, pw2, ph2);
          if (img) drawMark(g, img, 512, my, pw2 - 90, ph2 - 80);
        }
        // the name, in spaced gold capitals, a line of prism light under it
        g.fillStyle = gold;
        g.textAlign = "center";
        const lines = spacedLines(client.name, 12);
        const px = fitFont(g, lines, 58, 700);
        const ny = H2 * 0.7;
        lines.forEach((ln, k) => g.fillText(ln, 512, ny + k * px * 1.4));
        prismRule(g, 412, ny + (lines.length - 1) * px * 1.4 + px * 0.9, 200, 4);
        tex.needsUpdate = true;
      };
      draw();
      const img = new Image();
      img.onload = () => draw(img);
      img.src = client.mark;
      const face = new THREE.MeshPhysicalMaterial({
        map: tex,
        roughness: 0.42,
        clearcoat: 0.8,
        clearcoatRoughness: 0.16,
      });
      keep(tex, face);
      const leafG = new THREE.BoxGeometry(0.08, lh, lw2);
      keep(leafG);
      // (its faces are the box's ±x sides; its edges brass)
      const leafM = new THREE.Mesh(leafG, [face, face, brassEdge, brassEdge, brassEdge, brassEdge]);
      leafM.castShadow = hq;
      leafM.position.set(0, lh / 2, lw2 / 2);
      // the hinge: at the doorway's far jamb, by the room's side of the wall
      const leaf = new THREE.Group();
      const hx = cx + inward * 0.1;
      const hz = f.zc - doorW / 2 + 0.015;
      leaf.position.set(hx, yU + 0.01, hz);
      leaf.add(leafM);
      // a long brass pull on each face, by its free edge
      const pullG = new THREE.CylinderGeometry(0.016, 0.016, 1.1, 12);
      keep(pullG);
      for (const sx of [-1, 1]) {
        const pull = new THREE.Mesh(pullG, brassEdge);
        pull.position.set(sx * 0.1, 1.15, lw2 - 0.28);
        leaf.add(pull);
      }
      scene.add(leaf);
      roomDoors.push({ leaf, side, x: cx, z: f.zc, open: 0 });
      // the doorway's reveal, lined in blackened steel
      for (const dz of [doorW / 2 - 0.01, -doorW / 2 + 0.01])
        box(0.3, doorH, 0.02, darkMetal, cx, yU + doorH / 2, f.zc + dz);
      box(0.3, 0.02, doorW, darkMetal, cx, yU + doorH - 0.01, f.zc);
      // (where it stands open, across the corner: the way round it)
      blockAt(
        Math.min(hx, hx + inward * lw2),
        Math.max(hx, hx + inward * lw2),
        hz - 0.2,
        hz + 0.2,
        1,
      );
    }

    // its sculpture: in the near corner by the corridor, clear of the films; in a long room, out on the
    // floor between the door and the near wall; none in a short room whose near wall is full
    const nearFilms = f.spots.filter((p) => p.nz < 0).length;
    if (nearFilms < ROOM.perWall) sculpture(r, cx + inward * 2.4, f.z1 - 2.3);
    else if (f.depth >= 15) sculpture(r, cx + inward * 3.4, f.zc + 3.6);
    // its name over the doorway, on the corridor side
    sign(
      client.name,
      2.6,
      cx - inward * 0.17,
      yU + 3.75,
      f.zc,
      f.side < 0 ? Math.PI / 2 : -Math.PI / 2,
    );
    // a bench in the middle, facing the emblem
    const bx = f.xc + inward * 1.2;
    const bz = f.zc;
    addBench(ctx, new THREE.Vector3(bx, yU, bz), Math.PI / 2);
    benches.push({ x: bx, z: bz, floor: yU, seats: [{ x: bx - inward * 0.06, z: bz, yaw }] });
    blockAt(bx - 0.45, bx + 0.45, bz - 1.35, bz + 1.35, 1);
  });
  // a side of the corridor whose rooms end sooner: closed by a plain wall to the last hall
  for (const sd of [-1, 1] as const) {
    const zs = plan.zStart - plan.gone[sd];
    if (zs - zR > 0.05) {
      wall(sd * UPPER.corridor, zs, sd * UPPER.corridor, zR, yU, yU + UPPER.H);
      blockAt(sd * UPPER.corridor - 0.3, sd * UPPER.corridor + 0.3, zR, zs, 1);
    }
  }
  // the doors: open as you come within reach of one (on the upper floor), closed again as you go
  let lastT = 0;
  const reach = 4.6;
  animate.push((t, eye) => {
    const dt = Math.min(0.1, Math.max(0, t - lastT));
    lastT = t;
    for (const d of roomDoors) {
      const near = !!eye && eye.y > yU && Math.hypot(eye.x - d.x, eye.z - d.z) < reach;
      d.open += ((near ? 1 : 0) - d.open) * (1 - Math.exp(-dt * 2.6));
      const e = d.open * d.open * (3 - 2 * d.open);
      d.leaf.rotation.y = d.side * (Math.PI / 2) * e;
    }
  });
  places.push({ name: "The rooms", x: 0, y: yU, z: zB - UPPER.balcony - 2, yaw: 0 });

  /* ---------- the last hall: the Spectrum, between the doors to About and Contact ---------- */
  {
    const zc = zR - UPPER.end / 2;
    // its light ceiling
    const lay = plane(W - 2, UPPER.end - 1.4, laylight);
    lay.rotation.x = Math.PI / 2;
    lay.position.set(0, yU + UPPER.H - 0.01, zc);
    const ceil = plane(W, UPPER.end, ceilMat);
    ceil.rotation.x = Math.PI / 2;
    ceil.position.set(0, yU + UPPER.H + 0.01, zc);
    wall(-W / 2, zEnd - 0.15, W / 2, zEnd - 0.15, yU, yU + UPPER.H);

    // the Spectrum: seven tubes of coloured light on the wall, after Dan Flavin, colouring the wall round them
    const tubeG = new THREE.CylinderGeometry(0.028, 0.028, 2.6, 16);
    const capG = new THREE.BoxGeometry(0.09, 2.75, 0.06);
    keep(tubeG, capG);
    const capMat = new THREE.MeshStandardMaterial({ color: 0xf2f2f2, roughness: 0.6 });
    keep(capMat);
    for (let k = 0; k < 7; k++) {
      const t = k / 6;
      const col = prismAt(t).multiplyScalar(2.4);
      const mat = new THREE.MeshBasicMaterial({ color: col, toneMapped: false });
      keep(mat);
      const tx = (k - 3) * 0.34;
      box(0.09, 2.75, 0.06, capMat, tx, yU + 2.0, zEnd + 0.03);
      const tube = new THREE.Mesh(tubeG, mat);
      tube.position.set(tx, yU + 2.0, zEnd + 0.1);
      scene.add(tube);
      // its glow on the wall
      const g = new THREE.PlaneGeometry(1.3, 4.2);
      keep(g);
      const gm = new THREE.MeshBasicMaterial({
        map: poolTex,
        color: prismAt(t),
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        opacity: 0.55,
      });
      keep(gm);
      const glow = new THREE.Mesh(g, gm);
      glow.position.set(tx, yU + 2.0, zEnd + 0.012);
      scene.add(glow);
    }
    const flood = new THREE.PointLight(0xfff0e6, 6, 8, 2);
    flood.position.set(0, yU + 2, zEnd + 1.6);
    scene.add(flood);
    sign("The Spectrum", 1.6, 0, yU + 3.75, zEnd + 0.012, 0, 52);

    // the doors: tall, in blackened steel frames, frosted glass with light beyond; their names above
    for (const [sx, label, to] of [
      [-1, "About", "/about"],
      [1, "Contact", "/contact"],
    ] as const) {
      const dx = sx * 3.9;
      const DW = 1.6;
      const DH = 3.1;
      const fr = new THREE.Group();
      fr.position.set(dx, yU, zEnd);
      scene.add(fr);
      const frame = (w: number, h: number, x: number, y: number) => {
        const gg = new THREE.BoxGeometry(w, h, 0.18);
        keep(gg);
        const m = new THREE.Mesh(gg, steelBlack);
        m.position.set(x, y, 0.06);
        m.castShadow = hq;
        fr.add(m);
        return m;
      };
      frame(0.09, DH + 0.09, -DW / 2 - 0.045, (DH + 0.09) / 2);
      frame(0.09, DH + 0.09, DW / 2 + 0.045, (DH + 0.09) / 2);
      frame(DW + 0.18, 0.09, 0, DH + 0.045);
      // the light beyond (the prism's, warm in the middle) and the frosted leaf in front of it
      const beyondG = new THREE.PlaneGeometry(DW, DH);
      const pos = beyondG.getAttribute("position");
      const cols = new Float32Array(pos.count * 3);
      const cc = new THREE.Color();
      for (let i = 0; i < pos.count; i++) {
        prismAt((pos.getX(i) + DW / 2) / DW, cc)
          .lerp(new THREE.Color(1, 0.97, 0.92), 0.55)
          .multiplyScalar(1.9);
        cols.set([cc.r, cc.g, cc.b], i * 3);
      }
      beyondG.setAttribute("color", new THREE.BufferAttribute(cols, 3));
      const beyondM = new THREE.MeshBasicMaterial({ vertexColors: true, toneMapped: false });
      keep(beyondG, beyondM);
      const beyond = new THREE.Mesh(beyondG, beyondM);
      beyond.position.set(0, DH / 2, -0.06);
      fr.add(beyond);
      const leafG = new THREE.BoxGeometry(DW - 0.02, DH - 0.02, 0.04);
      const leafM = new THREE.MeshPhysicalMaterial({
        color: 0xffffff,
        roughness: 0.45,
        transmission: hq ? 0.85 : 0,
        transparent: true,
        opacity: hq ? 1 : 0.55,
        thickness: 0.04,
      });
      keep(leafG, leafM);
      const leaf = new THREE.Mesh(leafG, leafM);
      leaf.position.set(0, DH / 2, 0.04);
      fr.add(leaf);
      // a long steel pull
      const pull = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.014, 1.1, 12), mirror);
      keep(pull.geometry);
      pull.position.set(sx > 0 ? -DW / 2 + 0.18 : DW / 2 - 0.18, 1.1, 0.12);
      fr.add(pull);
      // the light it throws into the hall
      const spill = new THREE.PointLight(sx < 0 ? 0xbfd0ff : 0xffd6b0, 4, 6, 2);
      spill.position.set(0, 1.3, 1.5); // (out in the hall, so it doesn't make a hot spot on the glass)
      fr.add(spill);
      sign(label, 1.9, dx, yU + DH + 0.48, zEnd + 0.012, 0, 70);
      fr.traverse((m) => {
        if ((m as THREE.Mesh).isMesh) {
          m.userData.pick = { kind: "door", index: 2 + doors.length };
          pickDoors.push(m);
        }
      });
      doors.push({ x: dx, z: zEnd + 0.3, label, to });
    }
    places.push({ name: "About & Contact", x: 0, y: yU, z: zEnd + 8, yaw: 0 });
  }

  return {
    zones,
    colliders,
    cutouts,
    frames,
    /* the atrium, with the balcony over it: where its frames are in view */
    atrium: { minX: -W / 2, maxX: W / 2, minZ: zB - 3, maxZ: zA },
    floors,
    places,
    benches,
    doors,
    pickDoors,
    /* where to catch the world's light for reflections (GalleryScene's probes): the atrium, the upper floor */
    probes: [new THREE.Vector3(0, 3.2, zC), new THREE.Vector3(0, yU + 2, zB - 3)],
    bounds: { minX: -W / 2, maxX: W / 2, minZ: zEnd, maxZ: zA },
    /* what moves; `eye`, where you are (the rooms' doors open as you come near) */
    update: (t: number, eye?: THREE.Vector3) => animate.forEach((a) => a(t, eye)),
  };
}
export type World = ReturnType<typeof buildWorld>;
