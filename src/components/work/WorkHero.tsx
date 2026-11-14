import { useEffect, useRef, useState } from "react";
import { WORK_PAGE } from "@/content/site";
import { cn } from "@/lib/utils";

/*
  The Work page's hero: the door of light standing in a field at sunset, the
  whole screen, alive. Wind crosses the grass in gusts from the left (the
  nearer grass swaying more, clumps of blades fluttering on their own, a
  band of light rolling over the field where a gust bends it), the clouds
  drift slowly right, and the sun's glow behind the door breathes, its rays
  shimmering; the door itself stands still and sharp. The words at the top,
  in the middle (WORK_PAGE).

  It lies over the films: scroll (wheel, trackpad, a swipe up on a phone),
  Space, ↓, Enter or a click lifts it away like a curtain going up (the
  scene inside rising a little slower, a shadow under its edge), and the
  films are there. Back at the top of the page, scroll up and it comes down
  again. Let go part-way and it finishes (or falls back, barely moved).

  One WebGL drawing of the photograph (public/brand/work-hero-*.webp: the
  one nearest the screen's shape), at the screen's resolution with bicubic
  sampling so it stays sharp, ~30 frames a second while it's down. Under
  reduced motion, or without WebGL, the still photograph.
*/

/* The three pictures, and where things are in each (fractions of the picture, from its top left). */
const SCENES = [
  {
    src: "/brand/work-hero-wide.webp",
    w: 1672,
    h: 941,
    door: [0.406, 0.578, 0.24, 0.694], // left, right, top, foot
    grass: 0.655, // where the field begins
    trees: 0.58, // the tops of the trees and hills: sky above
    sun: [0.497, 0.33],
    top: [0, 90, 173], // the colour along its top edge
  },
  {
    src: "/brand/work-hero-tablet.webp",
    w: 1448,
    h: 1086,
    door: [0.394, 0.592, 0.285, 0.69],
    grass: 0.662,
    trees: 0.57,
    sun: [0.497, 0.36],
    top: [2, 89, 173],
  },
  {
    src: "/brand/work-hero-phone.webp",
    w: 1056,
    h: 1490,
    door: [0.342, 0.618, 0.37, 0.7],
    grass: 0.65,
    trees: 0.6,
    sun: [0.495, 0.43],
    top: [0, 82, 158],
  },
] as const;
type Scene = (typeof SCENES)[number];
const sceneFor = (aspect: number): Scene =>
  SCENES.reduce<Scene>(
    (a, b) =>
      Math.abs(Math.log(b.w / b.h / aspect)) < Math.abs(Math.log(a.w / a.h / aspect)) ? b : a,
    SCENES[0],
  );
/* Where the picture is pinned as it's cropped to the screen (as CSS object-position): the door in
   the middle; lower if the words need the room above it (layout). */
const FOCUS = [0.49, 0.52] as const;

/* India's tricolour, as the line under the government initiatives' names (WorkUI.tsx ClientBadge). */
const TRICOLOUR = "linear-gradient(90deg, #ff7a1a, #ffb27a 28%, #f3f1ea 50%, #86c98a 72%, #1e8a3c)";

/* How it lifts. */
const LIFT = {
  travel: 1.1, // screens of scrolling to lift it fully
  parallax: 0.35, // the scene inside rises this much slower than its frame
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
uniform float uGrass;
uniform float uTrees;
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

void main() {
  vec2 s = vec2(gl_FragCoord.x, uRes.y - gl_FragCoord.y) / uRes;
  vec2 uv = uMap.xy + s * uMap.zw;
  float t = uTime;
  float aspect = uImg.x / uImg.y;
  // the door, and a little round it, never moves
  float door = (smoothstep(uDoor.x - 0.015, uDoor.x, uv.x) - smoothstep(uDoor.y, uDoor.y + 0.015, uv.x))
    * (smoothstep(uDoor.z - 0.03, uDoor.z, uv.y) - smoothstep(uDoor.w, uDoor.w + 0.02, uv.y));
  vec3 col;
  if (uv.y > uGrass - 0.003) {
    // the field: 0 at the horizon, 1 at our feet
    float d = clamp((uv.y - uGrass) / (1.0 - uGrass), 0.0, 1.0);
    // where on the ground (in perspective): waves of wind roll across it from the right, as the
    // grass in the photograph leans
    float z = 1.0 / (uv.y - uGrass + 0.025);
    float X = (uv.x - 0.5) * aspect * z;
    float gust = smoothstep(0.32, 0.72, fbm(vec2(X * 0.3 + t * 0.9, z * 0.45 + t * 0.08)));
    // a steady breeze under the gusts, so the grass is never still
    float breeze = sin(t * 1.3 + X * 0.8 + z * 0.3);
    // clumps of blades, each swaying on its own (finer far away)
    float clump = noise(vec2(uv.x * aspect * mix(120.0, 26.0, d), uv.y * mix(70.0, 16.0, d)));
    float flutter = sin(t * 3.4 + clump * 6.2832 + X * 1.2);
    // how far the grass moves: a shimmer at the horizon, a full sway at our feet
    float A = (0.0008 + 0.022 * pow(d, 1.5)) * (1.0 - door);
    vec2 off = A * vec2(1.2 * (gust - 0.4) + 0.35 * breeze + 0.45 * flutter * (0.4 + gust), 0.35 * (gust - 0.4));
    // (bent towards the left: what's under a gust moves left, and dips a little)
    col = sharp(uv + vec2(off.x / aspect, -off.y));
    // where a gust bends the blades they catch the low sun: a lighter, warmer band rolling over the field
    float w = smoothstep(0.0, 0.1, d) * (1.0 - door);
    col *= 1.0 + 0.3 * (gust - 0.4) * w;
    col += vec3(0.08, 0.07, 0.0) * max(gust - 0.4, 0.0) * w;
  } else {
    // the sky: its clouds drifting slowly left, with the wind (two copies, crossing over briefly)
    vec2 sp = vec2((uv.x - uSun.x) * aspect, uv.y - uSun.y);
    float sunD = length(sp);
    float sky = smoothstep(uTrees, uTrees - 0.05, uv.y) * (1.0 - door) * smoothstep(0.08, 0.22, sunD);
    vec2 drift = vec2(0.02 / aspect, 0.0) * sky;
    float p0 = fract(t / 20.0);
    float p1 = fract(t / 20.0 + 0.5);
    vec3 a = sharp(uv + drift * (p0 - 0.5));
    vec3 b = sharp(uv + drift * (p1 - 0.5));
    col = mix(a, b, smoothstep(0.7, 1.0, abs(p0 - 0.5) * 2.0));
    // above the picture's top edge (where the words needed the room): its sky, carried on up,
    // softened and a little deeper
    if (uv.y < 0.05) {
      vec3 near = vec3(0.0);
      for (int i = -4; i <= 4; i++) near += texture2D(uTex, vec2(uv.x + float(i) * 0.02, 0.008)).rgb;
      near /= 9.0;
      // (settling into the picture's own deep blue as it rises, so no cloud is smeared upwards)
      vec3 above = mix(near, uTop, smoothstep(0.0, 0.08, -uv.y)) * (1.0 - 0.18 * clamp(-uv.y / 0.15, 0.0, 1.0));
      col = mix(above, col, smoothstep(0.0, 0.05, uv.y));
    }
    // the sun behind the door: its glow breathing, its rays shimmering
    float open = 1.0 - door;
    vec2 dir = sp / max(sunD, 0.0001);
    float rays = noise(dir * 5.0 + vec2(t * 0.04, -t * 0.03));
    col *= 1.0 + 0.06 * (rays - 0.5) * exp(-sunD / 0.25) * smoothstep(0.03, 0.08, sunD) * open;
    col += vec3(1.0, 0.87, 0.64) * 0.035 * (0.5 + 0.5 * sin(t * 0.5)) * exp(-sunD * sunD / 0.02) * open;
  }
  gl_FragColor = vec4(min(col, vec3(1.0)), 1.0);
}`;

const VS = "attribute vec2 p; void main() { gl_Position = vec4(p, 0.0, 1.0); }";

/* The picture's part that fills the screen (object-fit: cover, pinned at `focus`). */
function coverMap(sw: number, sh: number, s: Scene, v0: number) {
  const ur = Math.min(1, sw / sh / (s.w / s.h));
  const vr = Math.min(1, s.w / s.h / (sw / sh));
  return [FOCUS[0] * (1 - ur), v0, ur, vr] as const;
}
/* How far the picture may move down for the words, showing its sky carried on above its top (of its height). */
const SKY_ABOVE = 0.14;

export function WorkHero() {
  const frame = useRef<HTMLDivElement>(null);
  const scene = useRef<HTMLDivElement>(null);
  const words = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const photo = useRef<HTMLImageElement>(null);
  const [live, setLive] = useState(false);

  useEffect(() => {
    const el = frame.current!;
    const inner = scene.current!;
    const text = words.current!;
    const cv = canvas.current!;
    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    /* ---- the words in the sky above the door, never on it ---- */
    // centred between the top (under the header on wider screens) and the door's top; the
    // picture moved down just enough to give them room (on a screen wider than the picture, less
    // of its grass; beyond its top edge, its sky carried on up: SKY_ABOVE); on a screen too short
    // even so, the words a little smaller
    const probe = document.createElement("div");
    probe.style.cssText = "position:fixed;top:0;height:env(safe-area-inset-top);visibility:hidden";
    document.body.appendChild(probe);
    const safeTop = probe.offsetHeight;
    probe.remove();
    let v0 = 0;
    const layout = () => {
      const r = el.getBoundingClientRect();
      const W = r.width;
      const H = r.height;
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
    window.addEventListener("resize", layout);

    /* ---- lifting ---- */
    // already down the page (come back to it): it starts lifted
    let goal = window.scrollY > 10 ? 1 : 0;
    let p = goal;
    let idle = 0;
    let lastScroll = 0;
    const place = () => {
      el.style.transform = p ? `translate3d(0, ${-p * 100}%, 0)` : "";
      inner.style.transform = p ? `translate3d(0, ${p * LIFT.parallax * 100}%, 0)` : "";
      text.style.opacity = String(Math.max(0, 1 - p * 1.8));
      el.style.boxShadow = p > 0.001 && p < 1 ? "0 24px 60px -10px rgba(10,20,40,0.35)" : "";
      const up = p >= 0.999;
      el.style.visibility = up ? "hidden" : "";
      el.inert = up;
    };
    place();

    /* ---- the living picture ---- */
    const gl = still ? null : cv.getContext("webgl", { antialias: false, alpha: false });
    let draw = (_now: number) => {};
    let showing: Scene | null = null;
    let tex: WebGLTexture | null = null;
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
          ["uRes", "uImg", "uMap", "uTime", "uDoor", "uSun", "uGrass", "uTrees", "uTop"].map(
            (n) => [n, gl.getUniformLocation(prog, n)],
          ),
        );
        tex = gl.createTexture();
        const t0 = performance.now();
        let loading = "";
        draw = (now: number) => {
          const r = el.getBoundingClientRect();
          const d = Math.min(window.devicePixelRatio || 1, 2);
          const w = Math.round(r.width * d);
          const h = Math.round(r.height * d);
          if (cv.width !== w || cv.height !== h) {
            cv.width = w;
            cv.height = h;
          }
          const want = sceneFor(r.width / r.height);
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
          const m = coverMap(r.width, r.height, s, v0);
          gl.uniform4f(U.uMap, m[0], m[1], m[2], m[3]);
          gl.uniform1f(U.uTime, (now - t0) / 1000);
          gl.uniform4f(U.uDoor, s.door[0], s.door[1], s.door[2], s.door[3]);
          gl.uniform2f(U.uSun, s.sun[0], s.sun[1]);
          gl.uniform1f(U.uGrass, s.grass);
          gl.uniform1f(U.uTrees, s.trees);
          gl.uniform3f(U.uTop, s.top[0] / 255, s.top[1] / 255, s.top[2] / 255);
          gl.drawArrays(gl.TRIANGLES, 0, 3);
        };
      }
    }

    /* ---- the frame loop: the picture while it's down, the lift while it moves ---- */
    let raf = 0;
    let last = performance.now();
    let lastDraw = 0;
    const kick = () => {
      if (!raf) raf = requestAnimationFrame(frame_);
    };
    const frame_ = (now: number) => {
      raf = 0;
      const dt = Math.min(0.2, (now - last) / 1000); // (real time, so a slow device still lifts it on time)
      last = now;
      // let go part-way: it finishes lifting, or falls back if barely moved
      if (idle && now - idle > 420) {
        idle = 0;
        goal = goal > 0.1 ? 1 : 0;
      }
      if (still) p = goal;
      else p += (goal - p) * (1 - Math.exp(-dt * 5));
      if (Math.abs(goal - p) < 0.0008) p = goal;
      place();
      if (p < 0.999 && now - lastDraw > 32) {
        lastDraw = now;
        draw(now);
      }
      if (p < 0.999 || p !== goal) kick();
    };
    kick();

    /* ---- hands ---- */
    const lift = () => {
      goal = 1;
      idle = 0;
      kick();
    };
    const lower = () => {
      goal = 0;
      idle = 0;
      kick();
    };
    const down = () => goal < 1 || p < 0.999;
    const onWheel = (e: WheelEvent) => {
      // over the hero: it lifts instead of the page scrolling
      e.preventDefault();
      const unit = e.deltaMode === 1 ? 32 : e.deltaMode === 2 ? window.innerHeight : 1;
      goal = Math.min(
        1,
        Math.max(0, goal + (e.deltaY * unit) / (window.innerHeight * LIFT.travel)),
      );
      idle = performance.now();
      kick();
    };
    // at the top of the page, a deliberate scroll up brings it back down
    const onPageWheel = (e: WheelEvent) => {
      if (down() || e.deltaY > -2 || window.scrollY > 0) return;
      if (performance.now() - lastScroll < 300) return; // still coasting up from below
      lower();
    };
    const onScroll = () => {
      lastScroll = performance.now();
      if (window.scrollY > 2 && goal < 1) lift(); // the page moved (its scrollbar, a jump): lift it
    };
    let touch: { y: number; goal: number; moved: boolean; atTop: boolean } | null = null;
    const onTouchStart = (e: TouchEvent) => {
      touch = { y: e.touches[0].clientY, goal, moved: false, atTop: window.scrollY <= 0 };
    };
    const onTouchMove = (e: TouchEvent) => {
      if (!touch) return;
      const dy = touch.y - e.touches[0].clientY;
      if (Math.abs(dy) > 8) touch.moved = true;
      if (down()) {
        goal = Math.min(1, Math.max(0, touch.goal + dy / (window.innerHeight * 0.85)));
        idle = 0;
        kick();
      } else if (touch.atTop && window.scrollY <= 0 && dy < -70) lower(); // pulled down at the top
    };
    const onTouchEnd = () => {
      if (!touch) return;
      const t = touch;
      touch = null;
      if (!t.moved || !down()) return;
      goal = goal > t.goal + 0.05 ? 1 : goal < t.goal - 0.05 ? 0 : goal > 0.1 ? 1 : 0;
      kick();
    };
    const onKey = (e: KeyboardEvent) => {
      const el2 = e.target as HTMLElement | null;
      if (el2?.closest("input, textarea, select, [contenteditable]")) return;
      if (
        down() &&
        [" ", "ArrowDown", "PageDown", "Enter"].includes(e.key) &&
        !el2?.closest("a, button")
      ) {
        e.preventDefault();
        lift();
      } else if (!down() && window.scrollY <= 0 && ["ArrowUp", "PageUp"].includes(e.key)) {
        e.preventDefault();
        lower();
      }
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    el.addEventListener("click", lift);
    window.addEventListener("wheel", onPageWheel, { passive: true });
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchmove", onTouchMove, { passive: true });
    window.addEventListener("touchend", onTouchEnd);
    window.addEventListener("keydown", onKey);
    return () => {
      cancelAnimationFrame(raf);
      el.removeEventListener("wheel", onWheel);
      el.removeEventListener("click", lift);
      window.removeEventListener("wheel", onPageWheel);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", onTouchEnd);
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("resize", layout);
      gl?.getExtension("WEBGL_lose_context")?.loseContext();
    };
  }, []);

  return (
    // (sized to the screen itself rather than inset-0: while the page fades in, its wrapper is
    // briefly transformed, which would measure a fixed element against the whole page)
    <div
      ref={frame}
      className="fixed left-0 top-0 z-[25] h-screen w-full touch-none supports-[height:100dvh]:h-[100dvh] select-none overflow-hidden bg-[#0058a8] will-change-transform"
      style={{ cursor: "pointer" }}
    >
      <div ref={scene} aria-hidden className="absolute inset-0">
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
        <span className="absolute inset-x-0 top-0 h-[45%] bg-gradient-to-b from-[rgba(8,30,80,0.32)] to-transparent" />
      </div>

      {/* the words, in the middle of the sky above the door (placed by layout): INDIA, large, on a
          line of the tricolour; our story, our identity, smaller; the words, smaller still */}
      <div
        ref={words}
        className="pointer-events-none absolute inset-x-0 top-[calc(env(safe-area-inset-top)+2.5rem)] flex flex-col items-center px-6 text-center text-white sm:top-[5.25rem]"
      >
        <h1 className="flex flex-col items-center [text-shadow:0_1px_2px_rgba(0,20,60,0.4),0_2px_24px_rgba(0,20,60,0.45)]">
          <span className="inline-flex flex-col items-stretch">
            {/* (the left padding balances the spacing after the last letter, so it sits centred) */}
            <span className="tracked pl-[0.32em] text-[clamp(2.5rem,5.2vw,4.5rem)] font-light leading-none">
              {WORK_PAGE.title}
            </span>
            {/* the tricolour, as on the government initiatives' badges */}
            <span
              aria-hidden
              className="mt-[0.9rem] block h-[3px] rounded-full shadow-[0_1px_6px_rgba(0,20,60,0.35)]"
              style={{ background: TRICOLOUR }}
            />
          </span>
          <span className="tracked mt-4 pl-[0.32em] text-[clamp(0.95rem,1.5vw,1.35rem)] font-light leading-snug">
            {WORK_PAGE.tagline}
          </span>
        </h1>
        <p className="mt-3 max-w-[34rem] text-[13px] leading-relaxed text-white/90 sm:text-[14px] [text-shadow:0_1px_2px_rgba(0,20,60,0.45),0_2px_18px_rgba(0,20,60,0.4)] lg:max-w-[56rem] lg:text-[15px]">
          {WORK_PAGE.text}
        </p>
      </div>

      {/* how to go on, as the landing says how to enter */}
      <p className="tracked pointer-events-none absolute inset-x-0 bottom-[calc(1.75rem+var(--dock,0px))] flex flex-col items-center gap-3 text-[10px] text-white/90 [text-shadow:0_1px_6px_rgba(0,0,0,0.45)]">
        {WORK_PAGE.hint}
        <span className="h-8 w-px overflow-hidden bg-white/30">
          <span
            className="block h-1/2 w-full bg-white/90"
            style={{ animation: "hint-line 1.8s ease-in-out infinite" }}
          />
        </span>
      </p>
    </div>
  );
}
