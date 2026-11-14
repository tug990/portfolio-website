import { useEffect, useRef, useState } from "react";
import { CONTACT_PAGE, SITE } from "@/content/site";
import { cn } from "@/lib/utils";

/*
  The Contact page's hero: the door of light standing in the sea at sunset,
  the whole screen, alive. Swells roll in towards you (a few long waves from
  slightly different directions and a chop over them, all travelling in, in
  perspective, so the water moves on and on and never jumps back; they bend
  what the water shows by their slope, a hair at the horizon, a few pixels
  near you), their crests catch the light, the sun's path glitters with
  sparks riding on the water, the clouds drift slowly and the sun's glow
  behind the door breathes; the door stands still and sharp.
  Above the door, in the sky and never on it: "Get in touch", "Let us talk"
  and a line of prism light, then the email and the phone (SITE) as glass
  buttons; at its foot, "Write to us", to the form below.

  One WebGL drawing of the photograph (public/brand/contact-hero-*.webp: the
  one nearest the screen's shape), at the screen's resolution with bicubic
  sampling so it stays sharp, every frame while it's on screen.
  Under reduced motion, or without WebGL, the still photograph. Made as the
  Work page's hero (components/work/WorkHero.tsx), but a part of the page
  that scrolls away, not a curtain over it.
*/

/* The three pictures, and where things are in each (fractions of the picture, from its top left). */
const SCENES = [
  {
    src: "/brand/contact-hero-wide.webp",
    w: 1672,
    h: 941,
    door: [0.408, 0.577, 0.243, 0.688], // left, right, top, foot
    sea: 0.628, // the horizon: the sea below
    sun: [0.497, 0.33],
    top: [0, 76, 144], // the colour along its top edge
  },
  {
    src: "/brand/contact-hero-tablet.webp",
    w: 1448,
    h: 1086,
    door: [0.39, 0.591, 0.28, 0.686],
    sea: 0.627,
    sun: [0.497, 0.37],
    top: [9, 95, 163],
  },
  {
    src: "/brand/contact-hero-phone.webp",
    w: 941,
    h: 1672,
    door: [0.338, 0.652, 0.344, 0.632],
    sea: 0.59,
    sun: [0.5, 0.4],
    top: [0, 54, 112],
  },
] as const;
type Scene = (typeof SCENES)[number];
const sceneFor = (aspect: number): Scene =>
  SCENES.reduce<Scene>(
    (a, b) =>
      Math.abs(Math.log(b.w / b.h / aspect)) < Math.abs(Math.log(a.w / a.h / aspect)) ? b : a,
    SCENES[0],
  );
/* Where the picture is pinned as it's cropped to the screen: the door in the middle; lower if the
   words need the room above it (layout). */
const FOCUS = [0.49, 0.52] as const;
/* How far the picture may move down for the words, showing its sky carried on above its top (of its height). */
const SKY_ABOVE = 0.14;

/* The sea: tune here. */
const SEA = {
  swell: 0.0055, // how far the waves bend the water near you (of the picture's height; ~5 px)
  speed: 1, // how fast the waves come in (1: as now; 2: twice as fast)
  glitter: 2, // how bright the sparks on the sun's path
};

const FS = /* glsl */ `
precision highp float;
uniform vec2 uRes;      // the canvas, device pixels
uniform sampler2D uTex;
uniform vec2 uImg;      // the picture, pixels
uniform vec4 uMap;      // screen (0..1, y down) to picture: uMap.xy + screen * uMap.zw
uniform float uTime;
uniform vec4 uDoor;     // left, right, top, foot
uniform vec2 uSun;
uniform float uSea;     // the horizon
uniform vec3 uTop;      // the colour along the picture's top edge

float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float noise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
}
float fbm(vec2 p) {
  float v = 0.0, a = 0.5;
  for (int i = 0; i < 4; i++) { v += a * noise(p); p = p * 2.03 + vec2(1.7, 9.2); a *= 0.5; }
  return v;
}
// the photograph, enlarged with bicubic (Catmull-Rom) sampling: sharp, no blur
vec3 sharp(vec2 uv) {
  vec2 sp = uv * uImg;
  vec2 t1 = floor(sp - 0.5) + 0.5;
  vec2 f = sp - t1;
  vec2 w0 = f * (-0.5 + f * (1.0 - 0.5 * f));
  vec2 w1 = 1.0 + f * f * (-2.5 + 1.5 * f);
  vec2 w2 = f * (0.5 + f * (2.0 - 1.5 * f));
  vec2 w3 = f * f * (-0.5 + 0.5 * f);
  vec2 w12 = w1 + w2;
  vec2 t0 = (t1 - 1.0) / uImg;
  vec2 t3 = (t1 + 2.0) / uImg;
  vec2 t12 = (t1 + w2 / w12) / uImg;
  vec3 r = texture2D(uTex, vec2(t0.x, t0.y)).rgb * w0.x * w0.y
    + texture2D(uTex, vec2(t12.x, t0.y)).rgb * w12.x * w0.y
    + texture2D(uTex, vec2(t3.x, t0.y)).rgb * w3.x * w0.y
    + texture2D(uTex, vec2(t0.x, t12.y)).rgb * w0.x * w12.y
    + texture2D(uTex, vec2(t12.x, t12.y)).rgb * w12.x * w12.y
    + texture2D(uTex, vec2(t3.x, t12.y)).rgb * w3.x * w12.y
    + texture2D(uTex, vec2(t0.x, t3.y)).rgb * w0.x * w3.y
    + texture2D(uTex, vec2(t12.x, t3.y)).rgb * w12.x * w3.y
    + texture2D(uTex, vec2(t3.x, t3.y)).rgb * w3.x * w3.y;
  return clamp(r, 0.0, 1.0);
}

// one long wave on the water: its height, and its slope (across, out)
void wave(vec2 g, vec2 k, float w, float ph, float amp, float t, inout float h, inout vec2 slope) {
  float a = dot(k, g) + w * t + ph;
  h += amp * sin(a);
  slope += amp * k * cos(a);
}

void main() {
  vec2 s = vec2(gl_FragCoord.x, uRes.y - gl_FragCoord.y) / uRes;
  vec2 uv = uMap.xy + s * uMap.zw;
  float t = uTime;
  float aspect = uImg.x / uImg.y;
  // the door, and a little round it, never moves
  float door = (smoothstep(uDoor.x - 0.015, uDoor.x, uv.x) - smoothstep(uDoor.y, uDoor.y + 0.015, uv.x))
    * (smoothstep(uDoor.z - 0.03, uDoor.z, uv.y) - smoothstep(uDoor.w, uDoor.w + 0.02, uv.y));
  float open = 1.0 - door;
  vec3 col;
  if (uv.y > uSea - 0.002) {
    // the sea: 0 at the horizon, 1 at our feet
    float d = clamp((uv.y - uSea) / (1.0 - uSea), 0.0, 1.0);
    // where on the water, in perspective: across (X) and how far out (z)
    float hp = uv.y - uSea + 0.02;
    vec2 g = vec2((uv.x - 0.5) * aspect / hp, 1.0 / hp);
    float tw = t * ${SEA.speed.toFixed(2)};
    // swells rolling in towards us: a few long waves from slightly different directions, each
    // crest travelling in, so the water moves on and on and never jumps back
    float h = 0.0;
    vec2 slope = vec2(0.0);
    wave(g, vec2(0.15, 1.6), 1.4, 0.0, 1.0, tw, h, slope);
    wave(g, vec2(-0.35, 2.3), 1.9, 1.7, 0.6, tw, h, slope);
    wave(g, vec2(0.55, 3.1), 2.4, 4.1, 0.4, tw, h, slope);
    wave(g, vec2(-0.8, 4.6), 3.1, 2.6, 0.25, tw, h, slope);
    // and a chop of short waves over them, travelling in too
    vec2 cg = g * vec2(1.3, 2.2) + vec2(0.0, tw * 1.2);
    slope += vec2(fbm(cg + vec2(0.06, 0.0)) - fbm(cg - vec2(0.06, 0.0)), fbm(cg + vec2(0.0, 0.06)) - fbm(cg - vec2(0.0, 0.06))) * 9.0;
    // the water bends what it shows by its slope: a hair at the horizon, a few pixels at our feet
    float A = (0.0004 + ${SEA.swell.toFixed(4)} * pow(d, 1.3)) * open / 3.0;
    col = sharp(uv + vec2(slope.x * 0.25 * A / aspect, slope.y * A));
    // the crests catch the light as they come in
    col *= 1.0 + 0.05 * clamp(slope.y / 3.0, -1.0, 1.0) * smoothstep(0.0, 0.2, d) * open;
    // the sun's path glittering: sparks riding on the moving water, each twinkling smoothly (finer
    // far away, as they lie on the water; fading out near the horizon, where they'd only flicker)
    vec2 sg = g * vec2(26.0, 16.0) + vec2(0.0, tw * 2.0);
    float spark = pow(noise(sg), 12.0) * smoothstep(0.35, 0.8, noise(sg * 0.7 + vec2(t * 1.5, 3.1)));
    float lum = dot(col, vec3(0.3, 0.59, 0.11));
    col += vec3(1.0, 0.93, 0.78) * spark * smoothstep(0.45, 0.85, lum) * smoothstep(0.04, 0.1, hp) * ${SEA.glitter.toFixed(2)} * open;
  } else {
    // the sky: its clouds drifting slowly (two copies, crossing over briefly)
    vec2 sp = vec2((uv.x - uSun.x) * aspect, uv.y - uSun.y);
    float sunD = length(sp);
    float sky = smoothstep(uSea - 0.01, uSea - 0.06, uv.y) * open * smoothstep(0.08, 0.22, sunD);
    vec2 drift = vec2(0.02 / aspect, 0.0) * sky;
    float p0 = fract(t / 20.0);
    float p1 = fract(t / 20.0 + 0.5);
    vec3 a = sharp(uv + drift * (p0 - 0.5));
    vec3 b = sharp(uv + drift * (p1 - 0.5));
    col = mix(a, b, smoothstep(0.7, 1.0, abs(p0 - 0.5) * 2.0));
    // above the picture's top edge (where the words needed the room): its sky carried on up,
    // settling into its own deep blue
    if (uv.y < 0.05) {
      vec3 near = vec3(0.0);
      for (int i = -4; i <= 4; i++) near += texture2D(uTex, vec2(uv.x + float(i) * 0.02, 0.008)).rgb;
      near /= 9.0;
      vec3 above = mix(near, uTop, smoothstep(0.0, 0.08, -uv.y)) * (1.0 - 0.18 * clamp(-uv.y / 0.15, 0.0, 1.0));
      col = mix(above, col, smoothstep(0.0, 0.05, uv.y));
    }
    // the sun behind the door: its glow breathing, its rays shimmering
    vec2 dir = sp / max(sunD, 0.0001);
    float rays = noise(dir * 5.0 + vec2(t * 0.04, -t * 0.03));
    col *= 1.0 + 0.06 * (rays - 0.5) * exp(-sunD / 0.25) * smoothstep(0.03, 0.08, sunD) * open;
    col += vec3(1.0, 0.87, 0.64) * 0.035 * (0.5 + 0.5 * sin(t * 0.5)) * exp(-sunD * sunD / 0.02) * open;
  }
  gl_FragColor = vec4(min(col, vec3(1.0)), 1.0);
}`;

const VS = "attribute vec2 p; void main() { gl_Position = vec4(p, 0.0, 1.0); }";

/* The picture's part that fills the screen (object-fit: cover; v0: how far down it starts). */
function coverMap(sw: number, sh: number, s: Scene, v0: number) {
  const ur = Math.min(1, sw / sh / (s.w / s.h));
  const vr = Math.min(1, s.w / s.h / (sw / sh));
  return [FOCUS[0] * (1 - ur), v0, ur, vr] as const;
}

const PILL =
  "press pointer-events-auto flex h-11 items-center gap-2.5 rounded-full border border-white/45 bg-white/15 px-5 text-[15px] text-white backdrop-blur-md transition hover:bg-white hover:text-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70";
const SHADOW = "[text-shadow:0_1px_2px_rgba(0,20,60,0.4),0_2px_24px_rgba(0,20,60,0.45)]";

export function ContactHero() {
  const frame = useRef<HTMLElement>(null);
  const words = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const photo = useRef<HTMLImageElement>(null);
  const [live, setLive] = useState(false);

  useEffect(() => {
    const el = frame.current!;
    const text = words.current!;
    const cv = canvas.current!;
    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    /* ---- the words in the sky above the door, never on it ---- */
    // centred between the top (under the header on wider screens) and the door's top; the
    // picture moved down just enough to give them room (beyond its top edge, its sky carried on
    // up: SKY_ABOVE); on a screen too short even so, the words a little smaller
    const probe = document.createElement("div");
    probe.style.cssText = "position:fixed;top:0;height:env(safe-area-inset-top);visibility:hidden";
    document.body.appendChild(probe);
    const safeTop = probe.offsetHeight;
    probe.remove();
    let v0 = 0;
    const layout = () => {
      const W = el.clientWidth;
      const H = el.clientHeight;
      if (!W || !H) return;
      const s = sceneFor(W / H);
      const top = W < 640 ? safeTop + 16 : 84;
      const gap = W < 640 ? 32 : 28;
      const th = text.offsetHeight;
      const vr = Math.min(1, s.w / s.h / (W / H)); // how much of the picture's height shows
      const need = top + th + gap + 16; // how far down the door's top must be
      v0 = Math.max(-SKY_ABOVE, Math.min(FOCUS[1] * (1 - vr), s.door[2] - (need / H) * vr));
      const doorY = ((s.door[2] - v0) / vr) * H;
      const band = doorY - gap - top;
      const k = Math.max(0.72, Math.min(1, band / th));
      text.style.top = `${top + Math.max(0, (band - th * k) / 2)}px`;
      text.style.transformOrigin = "50% 0";
      text.style.transform = k < 1 ? `scale(${k})` : "";
      // the still photograph, cropped the same way
      const img = photo.current;
      if (img) {
        img.style.objectPosition = `49% ${v0 > 0 && vr < 1 ? (v0 / (1 - vr)) * 100 : 0}%`;
        img.style.transform = v0 < 0 ? `translateY(${(-v0 / vr) * H}px)` : "";
      }
    };
    layout();
    void document.fonts?.ready.then(layout);
    const ro = new ResizeObserver(layout);
    ro.observe(el);

    /* ---- the living picture ---- */
    const gl = still ? null : cv.getContext("webgl", { antialias: false, alpha: false });
    let draw = (_now: number) => {};
    if (gl) {
      const sh = (type: number, src: string) => {
        const o = gl.createShader(type)!;
        gl.shaderSource(o, src);
        gl.compileShader(o);
        if (!gl.getShaderParameter(o, gl.COMPILE_STATUS)) console.warn(gl.getShaderInfoLog(o));
        return o;
      };
      const prog = gl.createProgram()!;
      gl.attachShader(prog, sh(gl.VERTEX_SHADER, VS));
      gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, FS));
      gl.linkProgram(prog);
      if (gl.getProgramParameter(prog, gl.LINK_STATUS)) {
        gl.useProgram(prog);
        gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
        const loc = gl.getAttribLocation(prog, "p");
        gl.enableVertexAttribArray(loc);
        gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
        const U = Object.fromEntries(
          ["uRes", "uImg", "uMap", "uTime", "uDoor", "uSun", "uSea", "uTop"].map((n) => [
            n,
            gl.getUniformLocation(prog, n),
          ]),
        );
        const tex = gl.createTexture();
        const t0 = performance.now();
        let showing: Scene | null = null;
        let loading = "";
        draw = (now: number) => {
          const W = el.clientWidth;
          const H = el.clientHeight;
          const dpr = Math.min(window.devicePixelRatio || 1, 2);
          const w = Math.round(W * dpr);
          const h = Math.round(H * dpr);
          if (cv.width !== w || cv.height !== h) {
            cv.width = w;
            cv.height = h;
          }
          const want = sceneFor(W / H);
          if (want.src !== showing?.src && want.src !== loading) {
            // the picture for this shape of screen
            loading = want.src;
            const img = new Image();
            img.decoding = "async";
            img.onload = () => {
              if (loading !== want.src) return;
              gl.bindTexture(gl.TEXTURE_2D, tex);
              gl.pixelStorei(gl.UNPACK_COLORSPACE_CONVERSION_WEBGL, gl.NONE);
              gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, img);
              gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
              gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
              gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
              gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
              showing = want;
              loading = "";
              setLive(true);
            };
            img.src = want.src;
          }
          if (!showing) return;
          const s = showing;
          gl.viewport(0, 0, w, h);
          gl.uniform2f(U.uRes, w, h);
          gl.uniform2f(U.uImg, s.w, s.h);
          const m = coverMap(W, H, s, v0);
          gl.uniform4f(U.uMap, m[0], m[1], m[2], m[3]);
          gl.uniform1f(U.uTime, (now - t0) / 1000);
          gl.uniform4f(U.uDoor, s.door[0], s.door[1], s.door[2], s.door[3]);
          gl.uniform2f(U.uSun, s.sun[0], s.sun[1]);
          gl.uniform1f(U.uSea, s.sea);
          gl.uniform3f(U.uTop, s.top[0] / 255, s.top[1] / 255, s.top[2] / 255);
          gl.drawArrays(gl.TRIANGLES, 0, 3);
        };
      }
    }

    /* ---- drawing, every frame (the water moves smoothly), only while it's on screen ---- */
    let raf = 0;
    let seen = true;
    const frame_ = (now: number) => {
      raf = seen ? requestAnimationFrame(frame_) : 0;
      draw(now);
    };
    const io = new IntersectionObserver(([e]) => {
      seen = e.isIntersecting;
      if (seen && !raf && gl) raf = requestAnimationFrame(frame_);
    });
    io.observe(el);
    if (gl) raf = requestAnimationFrame(frame_);

    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
      ro.disconnect();
      gl?.getExtension("WEBGL_lose_context")?.loseContext();
    };
  }, []);

  const tel = SITE.phone.replace(/[^\d+]/g, "");
  return (
    <section
      ref={frame}
      aria-label={`${CONTACT_PAGE.eyebrow}: ${CONTACT_PAGE.title}`}
      className="relative h-[100svh] min-h-[560px] overflow-hidden bg-[#004c90]"
    >
      <div aria-hidden className="absolute inset-0">
        {/* the still photograph (until the living one is ready, or where it can't be) */}
        <picture>
          <source media="(max-aspect-ratio: 97/100)" srcSet={SCENES[2].src} />
          <source media="(max-aspect-ratio: 154/100)" srcSet={SCENES[1].src} />
          <img
            ref={photo}
            src={SCENES[0].src}
            alt=""
            fetchPriority="high"
            className="absolute inset-0 h-full w-full object-cover object-[49%_52%]"
          />
        </picture>
        <canvas
          ref={canvas}
          className={cn(
            "absolute inset-0 h-full w-full transition-opacity duration-700",
            live ? "opacity-100" : "opacity-0",
          )}
        />
        {/* a breath of deeper sky behind the words */}
        <span className="absolute inset-x-0 top-0 h-[45%] bg-gradient-to-b from-[rgba(8,30,80,0.3)] to-transparent" />
      </div>

      {/* the words, in the middle of the sky above the door (placed by layout) */}
      <div
        ref={words}
        className="pointer-events-none absolute inset-x-0 top-[calc(env(safe-area-inset-top)+2.5rem)] flex flex-col items-center px-6 text-center text-white sm:top-[5.25rem]"
      >
        <p className={`tracked text-[11px] text-white/85 ${SHADOW}`}>{CONTACT_PAGE.eyebrow}</p>
        <h1
          className={`tracked mt-3 pl-[0.32em] text-[clamp(2.1rem,4.4vw,3.75rem)] font-light leading-none ${SHADOW}`}
        >
          {CONTACT_PAGE.title}
        </h1>
        <span
          aria-hidden
          className="prism-rule mt-5 block w-28 shadow-[0_1px_6px_rgba(0,20,60,0.35)]"
        />
        {/* the email and the phone, as glass buttons */}
        <div className="mt-6 flex flex-col items-center gap-3 sm:flex-row">
          <a href={`mailto:${SITE.email}`} className={PILL}>
            <svg
              aria-hidden
              viewBox="0 0 24 24"
              className="h-[18px] w-[18px]"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.7"
              strokeLinejoin="round"
            >
              <path d="M3.5 6.5h17v11h-17zM4 7l8 6 8-6" />
            </svg>
            {SITE.email}
          </a>
          {SITE.phone && (
            <a href={`tel:${tel}`} className={PILL}>
              <svg
                aria-hidden
                viewBox="0 0 24 24"
                className="h-[18px] w-[18px]"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.7"
                strokeLinejoin="round"
              >
                <path d="M6.6 3.8l2.6.3 1.2 4.1-1.9 1.4a12 12 0 005.9 5.9l1.4-1.9 4.1 1.2.3 2.6c0 1-1.1 2.3-2.4 2.2A16.6 16.6 0 014.4 6.2C4.3 4.9 5.6 3.8 6.6 3.8z" />
              </svg>
              {SITE.phone}
            </a>
          )}
        </div>
      </div>

      {/* to the form, as the landing says how to enter */}
      <a
        href="#write"
        className="tracked absolute inset-x-0 bottom-[calc(1.75rem+var(--dock,0px))] mx-auto flex w-fit flex-col items-center gap-3 text-[10px] text-white/90 [text-shadow:0_1px_6px_rgba(0,0,0,0.45)]"
      >
        {CONTACT_PAGE.hint}
        <span aria-hidden className="h-8 w-px overflow-hidden bg-white/30">
          <span
            className="block h-1/2 w-full bg-white/90"
            style={{ animation: "hint-line 1.8s ease-in-out infinite" }}
          />
        </span>
      </a>
    </section>
  );
}
