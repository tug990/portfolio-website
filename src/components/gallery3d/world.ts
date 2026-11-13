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
      the balcony; the corridor with a room for each initiative (their films
      lit by track spots, their emblem, a sculpture, a bench, their name over
      the door); and at the end, the last hall: the Spectrum (tubes of
      coloured light, after Dan Flavin) between two doors, About and Contact
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
export type Place = { name: string; x: number; y: number; z: number; yaw: number }; // y: its floor
/* The doors out, at the end: to the About and Contact pages */
export type WorldDoor = { x: number; z: number; label: string; to: "/about" | "/contact" };

/* The rooms upstairs: which side, how far back, their middle */
export function roomFrame(zA: number, r: number) {
  const zU = zA - ATRIUM.D; // where the upper floor begins
  const side = r % 2 === 0 ? -1 : 1; // alternate left, right, so neighbours face each other
  const k = Math.floor(r / 2);
  const z1 = zU - UPPER.balcony - k * UPPER.roomD; // the room's near edge
  const zc = z1 - UPPER.roomD / 2;
  const x0 = side < 0 ? -ATRIUM.W / 2 : UPPER.corridor;
  const x1 = side < 0 ? -UPPER.corridor : ATRIUM.W / 2;
  return { side, k, z1, z0: z1 - UPPER.roomD, zc, x0, x1, xc: (x0 + x1) / 2 };
}
/* Where the rooms end (the last hall begins), and where the upper floor ends */
export const roomsEnd = (zA: number, rooms: number) =>
  zA - ATRIUM.D - UPPER.balcony - Math.ceil(rooms / 2) * UPPER.roomD;
export const upperEnd = (zA: number, rooms: number) => roomsEnd(zA, rooms) - UPPER.end;

/* Where the films of each room hang: on its outer wall, side by side */
export function roomSpots(zA: number, perRoom: number[]) {
  const spots: RoomSpot[] = [];
  perRoom.forEach((n, r) => {
    const f = roomFrame(zA, r);
    const wallX = f.side * (ATRIUM.W / 2);
    const nx = -f.side; // facing into the room
    for (let j = 0; j < n; j++) {
      const off = n === 1 ? 0 : (j - (n - 1) / 2) * 3.4;
      // facing +x (left wall): your right is -z; facing -x: +z (as in the hall)
      spots.push({
        scale: 1.25,
        x: wallX,
        y: UPPER.y,
        z: f.zc - off * f.side,
        yaw: nx > 0 ? Math.PI / 2 : -Math.PI / 2,
        face: nx > 0 ? Math.PI / 2 : -Math.PI / 2,
        nx,
        nz: 0,
        tx: 0,
        tz: nx > 0 ? -1 : 1,
      });
    }
  });
  return spots;
}

/* ---------- helpers ---------- */

/* A soft oval of light, for where a spotlight lands on a wall */
function lightPoolTexture() {
  const c = document.createElement("canvas");
  c.width = 256;
  c.height = 256;
  const x = c.getContext("2d")!;
  const g = x.createRadialGradient(128, 128, 0, 128, 128, 128);
  g.addColorStop(0, "rgba(255,255,255,0.95)");
  g.addColorStop(0.35, "rgba(255,255,255,0.55)");
  g.addColorStop(0.7, "rgba(255,255,255,0.14)");
  g.addColorStop(1, "rgba(255,255,255,0)");
  x.fillStyle = g;
  x.fillRect(0, 0, 256, 256);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
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
    filmSpots: RoomSpot[];
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
  const zR = roomsEnd(zA, clients.length); // the last hall begins
  const zEnd = upperEnd(zA, clients.length);
  const yU = UPPER.y;
  const zones: Zone[] = [];
  const colliders: Collider[] = [];
  const floors: THREE.Mesh[] = [];
  const places: Place[] = [];
  const doors: WorldDoor[] = [];
  const animate: ((t: number) => void)[] = [];
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
    places.push({ name: "The Threshold", x: 0, y: 0, z: zT + 11.2, yaw: 0 });
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
    places.push({ name: "The Ribbon", x: x - 4.6, y: 0, z: z + 5.2, yaw: -Math.atan2(4.6, 5.2) });
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

  /* ---------- two great landscapes on the side walls, each under its picture light ---------- */
  for (const sx of [-1, 1]) {
    const at = new THREE.Vector3(sx * (W / 2 - 0.02), 4.4, zA - 15);
    addFramedPicture(
      ctx,
      at,
      new THREE.Vector3(-sx, 0, 0),
      { w: 7.2, h: 4.4 },
      sx > 0 ? 11 : 12,
      new THREE.Vector3(0, 0, sx > 0 ? 1 : -1),
    );
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
    places.push({ name: "The staircase", x: 0, y: 0, z: z0 + 2.5, yaw: 0 });
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
  places.push({ name: "The balcony", x: 0, y: yU, z: zB - 1.6, yaw: 0 });

  /* ---------- the rooms, one per initiative ---------- */
  const doorW = 3.0;
  const laylight = new THREE.MeshBasicMaterial({
    color: new THREE.Color(1, 0.98, 0.95).multiplyScalar(1.15),
    toneMapped: false,
  });
  const prismKnotGeo = new THREE.TorusKnotGeometry(0.34, 0.055, 220, 14, 2, 3);
  keep(laylight, prismKnotGeo);

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

  clients.forEach((client, r) => {
    const f = roomFrame(zA, r);
    const cx = f.side * UPPER.corridor; // the corridor-side wall
    const yaw = f.side < 0 ? Math.PI / 2 : -Math.PI / 2;
    // the corridor wall, with a doorway in the middle of the room
    wall(cx, f.z1, cx, f.zc + doorW / 2, yU, yU + UPPER.H);
    wall(cx, f.zc - doorW / 2, cx, f.z0, yU, yU + UPPER.H);
    wall(cx, f.zc + doorW / 2, cx, f.zc - doorW / 2, yU + 3.3, yU + UPPER.H, 0.3, false);
    blockAt(cx - 0.3, cx + 0.3, f.zc + doorW / 2 - 0.15, f.z1 + 0.3, 1);
    blockAt(cx - 0.3, cx + 0.3, f.z0 - 0.3, f.zc - doorW / 2 + 0.15, 1);
    // its near and far walls (a room's near wall is its neighbour's far wall: drawn once)
    for (const zz of f.k === 0 ? [f.z1, f.z0] : [f.z0]) wall(f.x0, zz, f.x1, zz, yU, yU + UPPER.H);
    for (const zz of [f.z1, f.z0])
      blockAt(Math.min(f.x0, f.x1), Math.max(f.x0, f.x1), zz - 0.3, zz + 0.3, 1);

    // its light ceiling: a laylight of diffusing glass in a fine frame, softly lighting the room
    const lw = Math.abs(f.x1 - f.x0) - 1.2;
    const ld = UPPER.roomD - 1.2;
    const ceil = plane(Math.abs(f.x1 - f.x0), UPPER.roomD, ceilMat);
    ceil.rotation.x = Math.PI / 2;
    ceil.position.set(f.xc, yU + UPPER.H + 0.01, f.zc);
    const lay = plane(lw, ld, laylight);
    lay.rotation.x = Math.PI / 2;
    lay.position.set(f.xc, yU + UPPER.H - 0.01, f.zc);
    for (let k = 1; k < 4; k++)
      box(0.04, 0.03, ld, darkMetal, f.xc - lw / 2 + (k * lw) / 4, yU + UPPER.H - 0.03, f.zc);
    for (let k = 1; k < 3; k++)
      box(lw, 0.03, 0.04, darkMetal, f.xc, yU + UPPER.H - 0.03, f.zc - ld / 2 + (k * ld) / 3);

    // the client's emblem, large on the far wall, their name under it
    const c = document.createElement("canvas");
    c.width = 1024;
    c.height = 1280;
    const x = c.getContext("2d")!;
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = o.aniso;
    const draw = (img?: HTMLImageElement) => {
      x.fillStyle = "#fbfaf7";
      x.fillRect(0, 0, 1024, 1280);
      if (img) {
        const h = client.markIsLogo ? 300 : 640;
        const w0 = (img.width / img.height) * h;
        const w = Math.min(w0, 860);
        const hh = (w / w0) * h;
        x.drawImage(img, 512 - w / 2, 120 + (640 - hh) / 2, w, hh);
      }
      x.fillStyle = "#121212";
      x.font = "300 64px Jost, ui-sans-serif, system-ui";
      x.textAlign = "center";
      const words = client.name.toUpperCase().split(" ");
      const lines: string[] = [];
      for (const wd of words) {
        const last = lines[lines.length - 1];
        if (last && (last + " " + wd).length <= 16) lines[lines.length - 1] = last + " " + wd;
        else lines.push(wd);
      }
      lines
        .slice(0, 2)
        .forEach((ln, k) => x.fillText(ln.split("").join(" "), 512, 940 + k * 90, 940));
      const grad = x.createLinearGradient(380, 0, 644, 0);
      ["#1f2cff", "#2bb8ff", "#ffffff", "#ff8a1f", "#ff3d1f"].forEach((col, k) =>
        grad.addColorStop(k / 4, col),
      );
      x.fillStyle = grad;
      x.fillRect(380, 1150, 264, 6);
      tex.needsUpdate = true;
    };
    draw();
    const img = new Image();
    img.onload = () => draw(img);
    img.src = client.mark;
    const emMat = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.85 });
    keep(tex, emMat);
    const plateG = new THREE.BoxGeometry(2.4, 3.0, 0.03);
    keep(plateG);
    const plate = new THREE.Mesh(plateG, [wallMat, wallMat, wallMat, wallMat, emMat, wallMat]);
    plate.position.set(f.xc, yU + 2.5, f.z0 + 0.17);
    plate.castShadow = hq;
    scene.add(plate);
    pool(f.xc, yU + 2.6, f.z0 + 0.15, 0, 1, 4.6, 4.4, 0.55);

    // a track along the ceiling in front of the films, a spot for each, and its light on the wall
    const trackX = f.side * (ATRIUM.W / 2 - 1.7);
    box(0.05, 0.04, UPPER.roomD - 1.6, darkMetal, trackX, yU + UPPER.H - 0.05, f.zc);
    o.filmSpots
      .filter((s) => Math.abs(s.z - f.zc) < UPPER.roomD / 2 && Math.sign(s.x) === f.side)
      .forEach((s) => {
        spotHead(trackX, yU + UPPER.H - 0.07, s.z, s.x, yU + 1.62, s.z);
        pool(s.x, yU + 1.75, s.z, s.nx, 0, 3.6, 2.9);
      });

    // its sculpture, by the near wall; its name over the doorway, on the corridor side
    sculpture(r, f.xc - f.side * 1.4, f.z1 - 1.6);
    sign(
      client.name,
      2.6,
      cx - f.side * 0.17,
      yU + 3.75,
      f.zc,
      f.side < 0 ? Math.PI / 2 : -Math.PI / 2,
    );
    // a bench in the middle, facing the films
    const bx = f.xc + f.side * 1.2;
    const bz = f.zc;
    addBench(ctx, new THREE.Vector3(bx, yU, bz), Math.PI / 2);
    benches.push({ x: bx, z: bz, floor: yU, seats: [{ x: bx - f.side * 0.06, z: bz, yaw }] });
    blockAt(bx - 0.45, bx + 0.45, bz - 1.35, bz + 1.35, 1);
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
    floors,
    places,
    benches,
    doors,
    pickDoors,
    /* where to catch the world's light for reflections (GalleryScene's probes): the atrium, the upper floor */
    probes: [new THREE.Vector3(0, 3.2, zC), new THREE.Vector3(0, yU + 2, zB - 3)],
    bounds: { minX: -W / 2, maxX: W / 2, minZ: zEnd, maxZ: zA },
    update: (t: number) => animate.forEach((a) => a(t)),
  };
}
export type World = ReturnType<typeof buildWorld>;
