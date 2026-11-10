import { useEffect, useRef } from "react";

/*
  The landing door: the Insight Lab logo, rendered live with WebGL.

  The GPU computes every pixel at the screen's real resolution, every frame,
  so there is nothing to pixelate however far the camera flies in. The shader
  draws, after the logo (logo-stacked.webp):
    - two black slabs with the slanted top, and the white gap between them
    - prism light pouring over the top of the gap: violet/blue on the left
      slab, cyan, white at the centre, yellow/orange/red on the right slab,
      falling off down the slabs, with white light bleeding round the edges
    - soft grey floor shadows under the slabs, and the light spilling forwards
    - the faintest vignette; everything else is clean, smooth gradient

  Geometry uses the logo image's own pixel grid (1254 x 1254), so it can be
  checked straight against the artwork.
*/

// Shapes, in logo pixels. Corners run clockwise (y points down).
export const LOGO = {
  left: [530, 258, 620, 301, 620, 640, 530, 686],
  gap: [620, 301, 668, 324, 668, 640, 620, 640],
  right: [668, 324, 745, 361, 745, 686, 668, 640],
  top: { x: 530, y: 258, slope: (361 - 258) / (745 - 530) },
  center: { x: 637, y: 472 }, // middle of the mark
  height: 428, // top of the left slab to the bottom corners
  focus: { x: 644, y: 318 }, // the brightest point, where the camera flies in
};

const VERT = `
attribute vec2 aPos;
void main() { gl_Position = vec4(aPos, 0.0, 1.0); }
`;

const FRAG = `
precision highp float;
uniform vec2 uRes;      // canvas size, device pixels
uniform float uDpr;
uniform float uTime;
uniform vec2 uFocus;    // logo point that sits at uScreen
uniform vec2 uScreen;   // CSS px
uniform float uScale;   // CSS px per logo px
uniform float uFlood;   // 0..1: passing through the light into another dimension
uniform float uWake;    // 0..1: the logo responds: its panels part, light breaks out, the room darkens

const vec2 L0 = vec2(530.,258.); const vec2 L1 = vec2(620.,301.); const vec2 L2 = vec2(620.,640.); const vec2 L3 = vec2(530.,686.);
const vec2 G0 = vec2(620.,301.); const vec2 G1 = vec2(668.,324.); const vec2 G2 = vec2(668.,640.); const vec2 G3 = vec2(620.,640.);
const vec2 R0 = vec2(668.,324.); const vec2 R1 = vec2(745.,361.); const vec2 R2 = vec2(745.,686.); const vec2 R3 = vec2(668.,640.);

// Signed distance to a line: positive on the outside of a clockwise shape.
float side(vec2 p, vec2 a, vec2 b) {
  vec2 d = b - a;
  return dot(p - a, normalize(vec2(d.y, -d.x)));
}
float quad(vec2 p, vec2 a, vec2 b, vec2 c, vec2 d) {
  return max(max(side(p, a, b), side(p, b, c)), max(side(p, c, d), side(p, d, a)));
}
float hash(vec2 v) { return fract(sin(dot(v, vec2(12.9898, 78.233))) * 43758.5453); }

// The spectrum split by the gap, left (0) to right (1).
vec3 spectrum(float t) {
  vec3 c = mix(vec3(0.38, 0.12, 1.00), vec3(0.10, 0.30, 1.00), smoothstep(0.00, 0.18, t));
  c = mix(c, vec3(0.10, 0.80, 1.00), smoothstep(0.18, 0.36, t));
  c = mix(c, vec3(1.00, 1.00, 1.00), smoothstep(0.36, 0.50, t));
  c = mix(c, vec3(1.00, 0.92, 0.35), smoothstep(0.50, 0.60, t));
  c = mix(c, vec3(1.00, 0.55, 0.08), smoothstep(0.60, 0.74, t));
  c = mix(c, vec3(0.92, 0.16, 0.04), smoothstep(0.74, 1.00, t));
  return c;
}

void main() {
  vec2 css = vec2(gl_FragCoord.x, uRes.y - gl_FragCoord.y) / uDpr; // CSS px, y down
  vec2 p = uFocus + (css - uScreen) / uScale;                      // logo px
  float aa = 0.75 / uScale;                                        // ~1 screen px, for smooth edges
  vec2 scr = css / (uRes / uDpr);                                  // 0..1 across the screen

  // Paper-white background
  vec3 col = vec3(0.958, 0.959, 0.962); // the room, a shade under the light itself

  // Floor: soft grey shadows under each slab, light spilling forwards between them
  float belowL = side(p, L2, L3);                // > 0 under the left slab's bottom edge
  float belowR = side(p, R2, R3);
  float shL = belowL > 0.0 ? exp(-belowL / 22.0) * smoothstep(505.0, 545.0, p.x) * (1.0 - smoothstep(600.0, 628.0, p.x)) : 0.0;
  float shR = belowR > 0.0 ? exp(-belowR / 22.0) * smoothstep(660.0, 688.0, p.x) * (1.0 - smoothstep(730.0, 770.0, p.x)) : 0.0;
  float haze = exp(-pow((p.x - 640.0) / 135.0, 2.0)) * smoothstep(630.0, 690.0, p.y) * exp(-max(p.y - 690.0, 0.0) / 55.0);
  // The path of light from the gap, widening towards you
  float fanW = 24.0 + max(p.y - 640.0, 0.0) * 0.55;
  float fan = (1.0 - smoothstep(fanW - 10.0, fanW + 14.0, abs(p.x - 644.0))) * step(640.0, p.y) * exp(-max(p.y - 640.0, 0.0) / 160.0);
  float shade = (shL + shR) * 0.55 + haze * 0.09;
  col *= 1.0 - shade * (1.0 - fan);
  col = mix(col, vec3(1.0), fan * 0.85);                          // the path of light on the floor

  // The slabs and the gap
  // Waking, the two panels part from the gap and the opening widens
  float open = uWake * 16.0;
  vec2 pL = p + vec2(open, 0.0);
  vec2 pR = p - vec2(open, 0.0);
  vec2 pG = vec2(644.0 + (p.x - 644.0) * 24.0 / (24.0 + open), p.y);
  float dL = quad(pL, L0, L1, L2, L3);
  float dG = quad(pG, G0, G1, G2, G3);
  float dR = quad(pR, R0, R1, R2, R3);
  float inL = 1.0 - smoothstep(-aa, aa, dL);
  float inR = 1.0 - smoothstep(-aa, aa, dR);
  float inG = 1.0 - smoothstep(-aa, aa, dG);

  // The gap glows into the room around it (brightest towards the top)
  float glowR = exp(-max(dG, 0.0) / 34.0) * (0.55 + 0.45 * exp(-max(p.y - 330.0, 0.0) / 260.0));
  col = mix(col, vec3(1.0), glowR * 0.75);

  float under = p.y - (258.0 + (p.x - 530.0) * ${LOGO.top.slope.toFixed(5)}); // depth below the top edge
  float t = clamp((p.x - 644.0) / 230.0 + 0.5, 0.0, 1.0);
  vec3 spec = spectrum(t);

  // Black slab, a touch lighter low down (light from the floor)
  vec3 slab = vec3(0.012) + vec3(0.03) * smoothstep(420.0, 690.0, p.y);
  // Prism light pouring over the top: strongest by the gap, falling off down and out
  float hx = abs(p.x - 644.0);
  float pour = exp(-max(under, 0.0) / 85.0) * exp(-max(hx - 22.0, 0.0) / 46.0);
  float pourWide = exp(-max(under, 0.0) / 190.0) * exp(-max(hx - 22.0, 0.0) / 95.0);
  // White light bleeding round the gap's edges, brightest near the top
  float bleed = exp(-max(dG, 0.0) / 9.0) * (0.45 + 0.55 * exp(-max(under, 0.0) / 140.0));
  vec3 lit = slab + spec * (pour * 1.25 + pourWide * 0.3) + vec3(1.0) * bleed * 0.8;
  col = mix(col, lit, clamp(inL + inR, 0.0, 1.0));

  // The gap: pure light, the spectrum fringing its top edge
  vec3 gapC = mix(vec3(1.0), spec * 0.5 + 0.5, exp(-max(under, 0.0) / 26.0) * smoothstep(4.0, 24.0, hx));
  col = mix(col, gapC, inG);

  // Bloom: the brightest light softly overflows the top of the gap
  float bloom = exp(-length((p - vec2(644.0, 318.0)) / vec2(34.0, 22.0)));
  col += spec * bloom * 0.18 * (inL + inR);

  // The faintest vignette
  col *= 1.0 - 0.035 * pow(length(scr - 0.5) * 1.35, 2.2);

  // Waking: the page darkens to a deep violet night, and light breaks out of
  // the opening: a white core, the spectrum spreading either side
  if (uWake > 0.0) {
    float w = clamp(uWake, 0.0, 1.0);
    float panels = clamp(inL + inR, 0.0, 1.0);
    float around = 1.0 - clamp(panels + inG, 0.0, 1.0);
    vec2 q = (p - vec2(644.0, 470.0)) / vec2(90.0, 240.0);
    float dq = length(q);
    vec3 night = mix(vec3(0.05, 0.035, 0.08), vec3(0.012, 0.01, 0.022), smoothstep(0.0, 1.6, length(scr - 0.5)));
    float halo = exp(-dq * dq * 1.6);
    float tsp = clamp((p.x - 644.0) / 380.0 + 0.5, 0.0, 1.0);
    vec3 light = night + spectrum(tsp) * halo * 0.9 * w + vec3(1.0) * exp(-dq * dq * 9.0) * 0.8 * w;
    // rays fanning out of the opening, soft, no hard lines
    float ang = atan(q.y, q.x);
    float rays = pow(0.5 + 0.5 * sin(ang * 9.0 + uTime * 0.6), 6.0) * exp(-dq * 0.9) * 0.35 * w;
    light += spectrum(fract(ang / 6.28318 + 0.5)) * rays;
    col = mix(col, light, around * smoothstep(0.0, 1.0, w));
    // the panels pick up the coloured light on their inner edges
    col += spec * panels * exp(-abs(p.x - 644.0) / 40.0) * 0.6 * w;
    // the opening itself burns brighter
    col = mix(col, vec3(1.0), inG * w);
  }

  // Passing through: the whole view floods with soft prism light. Blooms of
  // colour swirl out from the centre over a slowly turning colour wash, around
  // a white-hot core; it then softens to white, which fades into the room.
  // Everything is smooth gradients: no rays or lines.
  if (uFlood > 0.0) {
    float mn = min(uRes.x, uRes.y) / uDpr;
    vec2 c = (css - (uRes / uDpr) * 0.5) / mn;
    float r = length(c);
    float ang = atan(c.y, c.x);
    float f = clamp(uFlood, 0.0, 1.0);
    float peak = sin(3.14159 * f);
    vec3 base = mix(col, vec3(1.0), smoothstep(0.0, 0.4, f));
    // a soft colour wash that turns slowly with angle (no hard edges)
    float turn = uTime * 0.25 + f * 1.4;
    vec3 wash = spectrum(fract(ang / 6.28318 + turn * 0.12));
    float washAmt = smoothstep(0.05, 0.75, r) * 0.55;
    // six blooms of colour swirling outwards
    vec3 blooms = vec3(0.0);
    float bsum = 0.0;
    for (int k = 0; k < 6; k++) {
      float fk = float(k);
      float a = fk * 1.0472 + turn * 1.6 + sin(uTime * 0.7 + fk) * 0.25;
      vec2 pos = vec2(cos(a), sin(a)) * (0.12 + 0.55 * f);
      float d = length(c - pos);
      float g = exp(-(d * d) / (0.035 + 0.09 * f));
      blooms += spectrum(fk / 5.0) * g;
      bsum += g;
    }
    vec3 colour = mix(wash, blooms / max(bsum, 0.001), clamp(bsum, 0.0, 1.0));
    float amount = clamp((washAmt + bsum * 0.6) * peak, 0.0, 0.85);
    vec3 flood = mix(base, colour, amount);
    flood = mix(flood, vec3(1.0), exp(-r * r * 7.0) * (0.35 + 0.65 * f)); // white-hot core
    col = clamp(flood, 0.0, 1.0);
  }

  // An invisible dither (under one shade step) so soft gradients never band
  col += (hash(floor(gl_FragCoord.xy)) - 0.5) / 255.0;

  gl_FragColor = vec4(clamp(col, 0.0, 1.0), 1.0);
}
`;

export type LogoDoorHandle = {
  /** Draw a frame. focusScreen = where LOGO.focus sits on screen (CSS px); flood and wake 0..1. */
  draw: (
    scale: number,
    focusScreen: { x: number; y: number },
    flood?: number,
    wake?: number,
  ) => void;
  ok: boolean;
};

/*
  A full-screen canvas. `ok` is false only if WebGL truly isn't available.

  The context is never deliberately thrown away: React (in development) mounts
  components twice, and a context destroyed in between can't be used again,
  which used to drop the page onto the low-resolution fallback. If the browser
  itself takes the context away (e.g. the GPU is busy elsewhere), it is set up
  again as soon as it comes back.
*/
export function LogoDoorCanvas({
  handle,
  className,
}: {
  handle: React.RefObject<LogoDoorHandle | null>;
  className?: string;
}) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const t0 = performance.now();
    const opts = { antialias: false, alpha: false, premultipliedAlpha: false };

    const setup = () => {
      const gl = (canvas.getContext("webgl2", opts) ||
        canvas.getContext("webgl", opts)) as WebGLRenderingContext | null;
      if (!gl || gl.isContextLost()) return false;
      const compile = (type: number, src: string) => {
        const sh = gl.createShader(type)!;
        gl.shaderSource(sh, src);
        gl.compileShader(sh);
        if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
          console.warn("Logo door shader:", gl.getShaderInfoLog(sh));
        }
        return sh;
      };
      const prog = gl.createProgram()!;
      gl.attachShader(prog, compile(gl.VERTEX_SHADER, VERT));
      gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, FRAG));
      gl.linkProgram(prog);
      if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return false;
      gl.useProgram(prog);
      const buf = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, buf);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
      const loc = gl.getAttribLocation(prog, "aPos");
      gl.enableVertexAttribArray(loc);
      gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
      const u = (n: string) => gl.getUniformLocation(prog, n);
      const uRes = u("uRes");
      const uDpr = u("uDpr");
      const uTime = u("uTime");
      const uFocus = u("uFocus");
      const uScreen = u("uScreen");
      const uScale = u("uScale");
      const uFlood = u("uFlood");
      const uWake = u("uWake");

      handle.current = {
        ok: true,
        draw: (scale, focusScreen, flood = 0, wake = 0) => {
          if (gl.isContextLost()) return;
          // The screen's full resolution (up to 3x), so the logo is never soft.
          const dpr = Math.min(window.devicePixelRatio || 1, 3);
          const w = Math.round(canvas.clientWidth * dpr);
          const h = Math.round(canvas.clientHeight * dpr);
          if (canvas.width !== w || canvas.height !== h) {
            canvas.width = w;
            canvas.height = h;
          }
          gl.viewport(0, 0, w, h);
          gl.uniform2f(uRes, w, h);
          gl.uniform1f(uDpr, dpr);
          gl.uniform1f(uTime, (performance.now() - t0) / 1000);
          gl.uniform2f(uFocus, LOGO.focus.x, LOGO.focus.y);
          gl.uniform2f(uScreen, focusScreen.x, focusScreen.y);
          gl.uniform1f(uScale, scale);
          gl.uniform1f(uFlood, flood);
          gl.uniform1f(uWake, wake);
          gl.drawArrays(gl.TRIANGLES, 0, 3);
        },
      };
      return true;
    };

    if (!setup()) handle.current = { ok: false, draw: () => {} };

    const lost = (e: Event) => e.preventDefault(); // allow it to be restored
    const restored = () => {
      setup();
    };
    canvas.addEventListener("webglcontextlost", lost);
    canvas.addEventListener("webglcontextrestored", restored);
    return () => {
      canvas.removeEventListener("webglcontextlost", lost);
      canvas.removeEventListener("webglcontextrestored", restored);
    };
  }, [handle]);

  return <canvas ref={ref} aria-hidden className={className} />;
}
