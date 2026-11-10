import * as THREE from "three";

/*
  A floor of large-format polished marble slabs, drawn by the GPU from the
  floor's own position rather than from an image, so it stays crisp from any
  distance and never visibly repeats.

  - Slabs are 1.2 m square, laid on the room's centre line.
  - Every slab is cut from a different part of the block: its veins are
    shifted and turned, the way real slabs never match.
  - Warm white stone with soft grey veins and a few fine ones, and faint
    clouding in the body of the stone.
  - Joints are 2 mm, only a little darker than the stone, and matte.
  - Polished stone is glossy (lights glint in it); the joints are not.
  - Veins and joints fade out smoothly with distance instead of shimmering.
*/

const TILE = 1.2;

/*
  dark: the evening set's floor, dark polished stone (deep warm grey with
  faint pale veins), glossier, so the lights glint in it.
*/
export function marbleFloorMaterial({ dark = false }: { dark?: boolean } = {}) {
  const P = dark
    ? {
        body: ["0.034, 0.031, 0.028", "0.062, 0.056, 0.05"],
        vein: "0.2, 0.19, 0.18",
        halo: "0.1, 0.095, 0.09",
        fine: "0.14, 0.135, 0.13",
        joint: "0.012, 0.011, 0.01",
        rough: 0.16,
      }
    : {
        body: ["0.58, 0.565, 0.54", "0.66, 0.65, 0.625"],
        vein: "0.30, 0.295, 0.29",
        halo: "0.46, 0.45, 0.44",
        fine: "0.38, 0.37, 0.36",
        joint: "0.34, 0.33, 0.31",
        rough: 0.3,
      };
  const mat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    roughness: P.rough,
    metalness: 0,
    envMapIntensity: 0.55,
  });

  mat.onBeforeCompile = (shader) => {
    shader.vertexShader = shader.vertexShader
      .replace("#include <common>", "#include <common>\nvarying vec3 vMarblePos;")
      .replace(
        "#include <begin_vertex>",
        "#include <begin_vertex>\nvMarblePos = (modelMatrix * vec4(transformed, 1.0)).xyz;",
      );

    shader.fragmentShader = shader.fragmentShader
      .replace(
        "#include <common>",
        /* glsl */ `#include <common>
        varying vec3 vMarblePos;
        float mHash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
        float mNoise(vec2 p) {
          vec2 i = floor(p), f = fract(p);
          vec2 u = f * f * (3.0 - 2.0 * f);
          return mix(mix(mHash(i), mHash(i + vec2(1, 0)), u.x),
                     mix(mHash(i + vec2(0, 1)), mHash(i + vec2(1, 1)), u.x), u.y);
        }
        float mFbm(vec2 p) {
          float v = 0.0, a = 0.5;
          for (int k = 0; k < 5; k++) { v += a * mNoise(p); p = p * 2.03 + 17.1; a *= 0.5; }
          return v;
        }
        // A vein as a soft line, widened and faded with distance so it never aliases
        float mVein(float field, float width) {
          float w = fwidth(field);
          float soft = max(width, w * 1.5);
          return (1.0 - smoothstep(0.0, soft, abs(field))) * (width / soft);
        }
        float gMarbleJoint;
        vec3 marble(vec2 p) {
          vec2 shifted = p + vec2(${(TILE / 2).toFixed(2)}, 0.0);
          vec2 cell = floor(shifted / ${TILE.toFixed(2)});
          vec2 q = shifted - cell * ${TILE.toFixed(2)};

          // Each slab cut from a different part of the block
          float h = mHash(cell);
          float h2 = mHash(cell + 7.3);
          float ang = -0.55 + h * 1.1;
          mat2 R = mat2(cos(ang), -sin(ang), sin(ang), cos(ang));
          vec2 r = R * (p * 0.55) + vec2(h * 41.0, h2 * 63.0);

          // Body: warm white with faint clouds
          float cloud = mFbm(r * 1.3);
          vec3 col = mix(vec3(${P.body[0]}), vec3(${P.body[1]}), cloud);

          // Main veins: soft grey, wandering
          float warp = mFbm(r * 0.9) * 5.0;
          float main = sin(r.x * 2.1 + warp);
          col = mix(col, vec3(${P.vein}), mVein(main, 0.04) * 0.4);
          col = mix(col, vec3(${P.halo}), mVein(main, 0.3) * 0.3); // its soft halo
          // Fine veins: hairlines branching across
          float fine = sin(r.y * 6.3 + mFbm(r * 2.4) * 7.0);
          col = mix(col, vec3(${P.fine}), mVein(fine, 0.025) * 0.35);

          // Joints: 2 mm, a little darker, fading with distance
          vec2 e = min(q, ${TILE.toFixed(2)} - q);
          float d = min(e.x, e.y);
          float fw = fwidth(d);
          float jw = 0.0012;
          float joint = (1.0 - smoothstep(jw, jw + fw * 1.5, d)) * clamp(jw * 3.0 / max(fw, 1e-5), 0.4, 1.0);
          gMarbleJoint = joint;
          col = mix(col, vec3(${P.joint}), joint * 0.8);
          return col;
        }`,
      )
      .replace(
        "#include <map_fragment>",
        "#include <map_fragment>\ndiffuseColor.rgb = marble(vMarblePos.xz);",
      )
      .replace(
        "#include <roughnessmap_fragment>",
        `#include <roughnessmap_fragment>\nroughnessFactor = mix(roughnessFactor, ${dark ? "0.4" : "0.8"}, gMarbleJoint);`,
      );
  };
  // Keep this shader's compiled program separate from plain standard materials
  mat.customProgramCacheKey = () => (dark ? "marble-floor-dark" : "marble-floor-v1");
  return mat;
}
