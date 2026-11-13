import * as THREE from "three";
import type { SetCtx } from "./warmset";

/*
  The gallery's surfaces, one set for the whole building (the entrance hall,
  the atrium, the stairs, the rooms, the last hall), so it reads as one
  place: oak boards underfoot everywhere, crisp white plaster walls and
  ceilings, limestone for bases, blackened steel, white plinths, the sky.

  The photographed ones are CC0 scans (Poly Haven, ambientCG), converted to
  WebP in public/gallery: oak boards (laminate_floor_02: 1.7 m a repeat),
  limestone (marble_01, laid 3.2 m a repeat), brushed steel (Metal009: its
  grain and sheen only) and the sky (kloofendal_48d_partly_cloudy_puresky:
  the half above the horizon). Large screens load the 2k set, phones the 1k.
*/

function photoSet(hq: boolean, aniso: number, manager: THREE.LoadingManager) {
  const loader = new THREE.TextureLoader(manager);
  const load = (name: string, srgb = false) => {
    const t = loader.load(`/gallery/${name}.webp`);
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.colorSpace = srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace;
    t.anisotropy = aniso;
    return t;
  };
  const r = hq ? "2k" : "1k";
  const rs = hq ? "1k" : "512";
  const sky = load(`sky-${r}`, true);
  sky.wrapT = THREE.ClampToEdgeWrapping; // (round the horizon it repeats; not over the top)
  return {
    limestone: {
      map: load(`limestone-color-${r}`, true),
      normalMap: load(`limestone-normal-${r}`),
      roughnessMap: load(`limestone-rough-${r}`),
    },
    oak: {
      map: load(`oak-color-${r}`, true),
      normalMap: load(`oak-normal-${r}`),
      roughnessMap: load(`oak-rough-${r}`),
    },
    steel: { normalMap: load(`steel-normal-${rs}`), roughnessMap: load(`steel-rough-${rs}`) },
    sky,
  };
}

/*
  Lay a material's photographed maps by where each point is in the world, not
  by the model's own UVs: every floor, step and plinth gets the same
  real-world scale (`size` metres a repeat), never stretched. Upward faces
  take x/z (z/x when `turn`: oak boards running down the building), the rest
  whichever wall plane they face.
*/
export function worldMapped<M extends THREE.MeshStandardMaterial>(
  m: M,
  size: number,
  turn = false,
) {
  const swap = (chunk: string) => chunk.replace(/v(Map|NormalMap|RoughnessMap)Uv/g, "wUv");
  m.onBeforeCompile = (sh) => {
    const decl = "#include <common>\nvarying vec3 vWPos;\nvarying vec3 vWNrm;";
    sh.vertexShader = sh.vertexShader.replace("#include <common>", decl).replace(
      "#include <begin_vertex>",
      `#include <begin_vertex>
        vWPos = (modelMatrix * vec4(transformed, 1.0)).xyz;
        vWNrm = normalize(mat3(modelMatrix) * objectNormal);`,
    );
    sh.fragmentShader = sh.fragmentShader
      .replace("#include <common>", decl)
      .replace(
        "#include <map_fragment>",
        `vec3 wN = abs(vWNrm);
        vec2 wUv = (wN.y > 0.5 ? vWPos.${turn ? "zx" : "xz"} : (wN.x > wN.z ? vWPos.zy : vWPos.xy)) / ${size.toFixed(3)};
        ${swap(THREE.ShaderChunk.map_fragment)}`,
      )
      .replace("#include <roughnessmap_fragment>", swap(THREE.ShaderChunk.roughnessmap_fragment))
      .replace("#include <normal_fragment_begin>", swap(THREE.ShaderChunk.normal_fragment_begin))
      .replace("#include <normal_fragment_maps>", swap(THREE.ShaderChunk.normal_fragment_maps));
  };
  m.customProgramCacheKey = () => `world-mapped-${size}-${turn}`;
  return m;
}

/*
  Gallery plaster, painted white: an even, matt colour (only the faintest
  clouding) with a crisp fine texture you see up close and in raking light,
  the stipple a paint roller leaves, so a wall reads as a real, sharp surface
  rather than a soft flat colour. The stipple fades out with distance, so it
  never shimmers.
*/
export function plaster(color = 0xf3f1ec) {
  const m = new THREE.MeshStandardMaterial({ color, roughness: 0.9, metalness: 0 });
  m.onBeforeCompile = (sh) => {
    sh.vertexShader = sh.vertexShader
      .replace("#include <common>", "#include <common>\nvarying vec3 vPlPos;")
      .replace(
        "#include <begin_vertex>",
        "#include <begin_vertex>\nvPlPos = (modelMatrix * vec4(transformed, 1.0)).xyz;",
      );
    sh.fragmentShader = sh.fragmentShader
      .replace(
        "#include <common>",
        /* glsl */ `#include <common>
        varying vec3 vPlPos;
        float plHash(vec3 p) { return fract(sin(dot(p, vec3(127.1, 311.7, 74.7))) * 43758.5453); }
        float plNoise(vec3 p) {
          vec3 i = floor(p), f = fract(p);
          vec3 u = f * f * (3.0 - 2.0 * f);
          return mix(
            mix(mix(plHash(i), plHash(i + vec3(1, 0, 0)), u.x), mix(plHash(i + vec3(0, 1, 0)), plHash(i + vec3(1, 1, 0)), u.x), u.y),
            mix(mix(plHash(i + vec3(0, 0, 1)), plHash(i + vec3(1, 0, 1)), u.x), mix(plHash(i + vec3(0, 1, 1)), plHash(i + vec3(1, 1, 1)), u.x), u.y),
            u.z);
        }`,
      )
      .replace(
        "#include <map_fragment>",
        /* glsl */ `#include <map_fragment>
        float plCloud = plNoise(vPlPos * 0.35) * 0.6 + plNoise(vPlPos * 1.1) * 0.4;
        diffuseColor.rgb *= 1.0 + (plCloud - 0.5) * 0.03;`,
      )
      .replace(
        "#include <normal_fragment_maps>",
        /* glsl */ `#include <normal_fragment_maps>
        {
          // the roller's stipple, as a bump: fine (~3 mm) and crisp, gone with distance
          float h = plNoise(vPlPos * 260.0) * 0.65 + plNoise(vPlPos * 610.0) * 0.35;
          float fade = 1.0 - clamp(length(fwidth(vPlPos * 260.0)) * 0.9, 0.0, 1.0);
          vec3 dpx = dFdx(-vViewPosition);
          vec3 dpy = dFdy(-vViewPosition);
          float hx = dFdx(h);
          float hy = dFdy(h);
          vec3 r1 = cross(dpy, normal);
          vec3 r2 = cross(normal, dpx);
          float det = dot(dpx, r1);
          vec3 grad = sign(det) * (hx * r1 + hy * r2);
          // (as three's bump mapping: the stipple's height is 0.3 mm at most)
          normal = normalize(abs(det) * normal - grad * 0.0003 * fade);
        }`,
      );
  };
  m.customProgramCacheKey = () => "plaster-crisp-v1";
  return m;
}

/*
  The whole set, made once and shared by the hall (GalleryScene) and the
  world (world.ts). `loaded` resolves once the photographed ones have loaded
  (the scene then catches its light again).
*/
export function makeSurfaces(ctx: SetCtx, aniso: number) {
  const { keep, hq } = ctx;
  const manager = new THREE.LoadingManager();
  const loaded = new Promise<void>((done) => (manager.onLoad = done));
  const photo = photoSet(hq, aniso, manager);

  const wall = plaster();
  const ceil = plaster(0xf5f3ef);
  ceil.side = THREE.DoubleSide;
  const plinth = plaster(0xf6f4f0); // plinths: painted white, as galleries' are
  // oiled oak boards, running down the building (the floor everywhere, and the stairs)
  const oak = worldMapped(
    new THREE.MeshStandardMaterial({
      ...photo.oak,
      color: new THREE.Color(1.08, 1.08, 1.08),
      roughness: 1.2,
      normalScale: new THREE.Vector2(0.7, 0.7),
    }),
    1.7,
    true,
  );
  // honed limestone, a little paler and cooler than the scan (for the sculptures' bases)
  const limestone = worldMapped(
    new THREE.MeshStandardMaterial({
      ...photo.limestone,
      color: new THREE.Color(1.1, 1.25, 1.7),
      roughness: 0.9,
      normalScale: new THREE.Vector2(0.6, 0.6),
    }),
    3.2, // large-format slabs, ~75 cm (the scan, laid at twice its size)
  );
  // blackened steel: a dark metal with a clear lacquer, and the fine grain of real brushed steel
  const steel = worldMapped(
    new THREE.MeshPhysicalMaterial({
      ...photo.steel,
      color: 0x0b0b0d,
      metalness: 0.65,
      roughness: 0.72,
      normalScale: new THREE.Vector2(0.35, 0.35),
      clearcoat: 0.55,
      clearcoatRoughness: 0.18,
      envMapIntensity: 1.1,
    }),
    1,
  );
  // the shadow gap at the foot of every wall: the crisp dark line where the wall stops short of the floor
  const gap = new THREE.MeshBasicMaterial({ color: 0x0c0a08 });
  keep(
    wall,
    ceil,
    plinth,
    oak,
    limestone,
    steel,
    gap,
    ...Object.values(photo.limestone),
    ...Object.values(photo.oak),
    ...Object.values(photo.steel),
    photo.sky,
  );
  return { wall, ceil, plinth, oak, limestone, steel, gap, sky: photo.sky, loaded };
}
export type Surfaces = ReturnType<typeof makeSurfaces>;
