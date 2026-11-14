import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

/*
  The footer's picture (after exquisite-road-005415.framer.app's hover mask):
  the door of light in the desert at night, rising out of the page; wherever
  the cursor passes, the same door in a green field at sunset grows through,
  in a soft stroke with an uneven, living edge, and fades back to the desert
  a moment later. The door itself never changes, only the world round it.
  On phones and tablets (no hover) a drag paints it, and now and then a
  gentle stroke wanders across by itself, so the change is seen.

  The pictures: the desert (public/brand/footer-desert-*) and the Work hero's
  field (work-hero-*), each pair the same size with the door in the same
  place: the wide pair for wide footers, the tall pair for phones. One WebGL
  drawing (bicubic sampling, sharp at any size); the stroke is painted into
  a small mask that fades by the time passed and is cleared once faded. It
  draws only while the stroke is fading or being painted (on touch screens,
  while on screen); the pictures load as the footer comes near. Without
  WebGL, the desert alone.
*/

/*
  The pairs: the desert at night (`base`), and the field of grass the cursor
  reveals (`over`, the Work hero's picture), the same size and their doors in
  the same place. `door`: left, right, top (at its left corner), foot; `topR`:
  its top at the right corner (the top slopes down to the right). Drawn a
  little round both pictures' doors, so neither door ever shows through.
*/
const PAIRS = [
  {
    base: "/brand/footer-desert-wide.webp",
    over: "/brand/work-hero-wide.webp",
    w: 1672,
    h: 941,
    door: [0.399, 0.582, 0.216, 0.699],
    topR: 0.335,
  },
  {
    base: "/brand/footer-desert-portrait.webp",
    over: "/brand/work-hero-phone.webp",
    w: 1056,
    h: 1490,
    door: [0.339, 0.623, 0.365, 0.705],
    topR: 0.46,
  },
] as const;
type Pair = (typeof PAIRS)[number];
// (the wide pair for wide footers, the tall pair for squarer ones: phones)
const pairFor = (aspect: number): Pair => (aspect > 1.25 ? PAIRS[0] : PAIRS[1]);

/* The stroke: tune here. */
const BRUSH = {
  size: 0.085, // its radius, of the picture's width
  min: 60, // ...but never less than this many px (phones)
  strength: 0.55, // how much each touch of it reveals (more: quicker to grow)
  fade: 0.035, // how much of it fades every 1/60 s (more: back to the desert sooner)
};

const FS = /* glsl */ `
precision highp float;
uniform vec2 uRes;
uniform sampler2D uBase;
uniform sampler2D uOver;
uniform sampler2D uMask;
uniform vec2 uImg;
uniform vec4 uMap;   // screen (0..1, y down) to picture: uMap.xy + screen * uMap.zw
uniform vec4 uDoor;     // left, right, top at the left corner, foot
uniform float uDoorTopR; // its top at the right corner
uniform float uTime;
uniform vec3 uTopBase;   // the colour along each picture's top edge, for its sky carried on above
uniform vec3 uTopOver;

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
// a picture, enlarged with bicubic (Catmull-Rom) sampling: sharp, no blur
vec3 sharp(sampler2D tex, vec2 uv) {
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
  vec3 r = texture2D(tex, vec2(t0.x, t0.y)).rgb * w0.x * w0.y
    + texture2D(tex, vec2(t12.x, t0.y)).rgb * w12.x * w0.y
    + texture2D(tex, vec2(t3.x, t0.y)).rgb * w3.x * w0.y
    + texture2D(tex, vec2(t0.x, t12.y)).rgb * w0.x * w12.y
    + texture2D(tex, vec2(t12.x, t12.y)).rgb * w12.x * w12.y
    + texture2D(tex, vec2(t3.x, t12.y)).rgb * w3.x * w12.y
    + texture2D(tex, vec2(t0.x, t3.y)).rgb * w0.x * w3.y
    + texture2D(tex, vec2(t12.x, t3.y)).rgb * w12.x * w3.y
    + texture2D(tex, vec2(t3.x, t3.y)).rgb * w3.x * w3.y;
  return clamp(r, 0.0, 1.0);
}
void main() {
  vec2 s = vec2(gl_FragCoord.x, uRes.y - gl_FragCoord.y) / uRes;
  vec2 uv = uMap.xy + s * uMap.zw;
  // above the pictures' top edges (where the words needed the room): their skies carried on up
  float above = smoothstep(0.03, -0.05, uv.y);
  vec2 su = vec2(uv.x, max(uv.y, 0.002));
  vec3 base = mix(sharp(uBase, su), uTopBase, above);
  // the stroke, its edge uneven and slowly living, as grass growing; never over the door
  float m = texture2D(uMask, s).a;
  vec2 q = s * vec2(uRes.x / uRes.y, 1.0);
  float n = 0.65 * fbm(q * 7.0 + vec2(uTime * 0.04, -uTime * 0.03)) + 0.35 * fbm(q * 26.0 + vec2(-uTime * 0.05, uTime * 0.04));
  float top = mix(uDoor.z, uDoorTopR, clamp((uv.x - uDoor.x) / (uDoor.y - uDoor.x), 0.0, 1.0));
  float door = (smoothstep(uDoor.x - 0.008, uDoor.x, uv.x) - smoothstep(uDoor.y, uDoor.y + 0.008, uv.x))
    * (smoothstep(top - 0.012, top, uv.y) - smoothstep(uDoor.w, uDoor.w + 0.012, uv.y));
  float r = smoothstep(0.36, 0.56, m + (n - 0.5) * 0.6) * (1.0 - door);
  vec3 col = base;
  if (r > 0.002) col = mix(base, mix(sharp(uOver, su), uTopOver, above), r);
  gl_FragColor = vec4(col, 1.0);
}`;
const VS = "attribute vec2 p; void main() { gl_Position = vec4(p, 0.0, 1.0); }";

/* The picture's part that fills the frame (object-fit: cover; v0: how far down it starts). */
function coverMap(sw: number, sh: number, p: Pair, v0: number) {
  const ur = Math.min(1, sw / sh / (p.w / p.h));
  const vr = Math.min(1, p.w / p.h / (sw / sh));
  return [0.5 * (1 - ur), v0, ur, vr] as const;
}
/* How far the picture may move down for the words, its night sky carried on above (of its height). */
const SKY_ABOVE = 0.35;
/*
  The page's white fading into the picture's night at its top: long and eased (smootherstep), so
  there's no line where it starts or ends. Its length follows the frame's width (`share`), within
  `min`..`max` px; the words start where it's all but dark (`words`: how far down it, 0..1).
*/
const FADE = { share: 0.2, min: 140, max: 240, words: 0.8 };
const fadeMask = (() => {
  const stops: string[] = [];
  for (let k = 0; k <= 14; k++) {
    const t = k / 14;
    const a = t * t * t * (t * (t * 6 - 15) + 10);
    stops.push(`rgba(0,0,0,${a.toFixed(4)}) calc(var(--fade) * ${t.toFixed(4)})`);
  }
  return `linear-gradient(to bottom, ${stops.join(", ")})`;
})();

function loadImage(src: string) {
  return new Promise<HTMLImageElement | null>((done) => {
    const img = new Image();
    img.decoding = "async";
    img.onload = () => done(img);
    img.onerror = () => done(null);
    img.src = src;
  });
}

/* The colour along a picture's top edge (its top few rows, averaged). */
function topColour(img: HTMLImageElement) {
  const c = document.createElement("canvas");
  c.width = 64;
  c.height = 4;
  const x = c.getContext("2d")!;
  x.drawImage(img, 0, 0, img.naturalWidth, 8, 0, 0, 64, 4);
  const d = x.getImageData(0, 0, 64, 4).data;
  const sum = [0, 0, 0];
  for (let i = 0; i < d.length; i += 4) for (let k = 0; k < 3; k++) sum[k] += d[i + k];
  return sum.map((v) => v / (d.length / 4) / 255) as [number, number, number];
}

export function FooterReveal({
  className,
  children,
}: {
  className?: string;
  children?: React.ReactNode;
}) {
  const frame = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const words = useRef<HTMLDivElement>(null);
  const still = useRef<HTMLImageElement>(null);
  // how far down the picture starts (set by layout; below 0: its sky carried on above its top)
  const v0 = useRef(0);
  const [near, setNear] = useState(false);
  const [live, setLive] = useState(false);

  // the words over the picture, in its night sky above the door and never on it: centred
  // between the fade at the top and the door's top; the picture moved down just enough to give
  // them room (its sky carried on above its top edge); on a frame too short even so, a little smaller
  useEffect(() => {
    const el = frame.current;
    const text = words.current;
    if (!el || !text) return;
    const layout = () => {
      const W = el.clientWidth;
      const H = el.clientHeight;
      if (!W || !H) return;
      const p = pairFor(W / H);
      const fade = Math.min(FADE.max, Math.max(FADE.min, W * FADE.share));
      el.style.setProperty("--fade", `${fade}px`);
      const top = fade * FADE.words + 8;
      const gap = W < 640 ? 28 : 40;
      const th = text.offsetHeight;
      const vr = Math.min(1, p.w / p.h / (W / H));
      const need = top + th + gap;
      const v = Math.max(-SKY_ABOVE, Math.min(0.5 * (1 - vr), p.door[2] - (need / H) * vr));
      v0.current = v;
      const doorY = ((p.door[2] - v) / vr) * H;
      const band = doorY - gap - top;
      const k = Math.max(0.75, Math.min(1, band / th));
      text.style.top = `${top + Math.max(0, (band - th * k) / 2)}px`;
      text.style.transformOrigin = "50% 0";
      text.style.transform = k < 1 ? `scale(${k})` : "";
      // the still picture, placed the same way
      const img = still.current;
      if (img) {
        img.style.objectPosition = `50% ${v > 0 && vr < 1 ? (v / (1 - vr)) * 100 : 0}%`;
        img.style.transform = v < 0 ? `translateY(${(-v / vr) * H}px)` : "";
      }
    };
    layout();
    void document.fonts?.ready.then(layout);
    const ro = new ResizeObserver(layout);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // the pictures load only as the footer comes near
  useEffect(() => {
    const el = frame.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => e.isIntersecting && setNear(true), {
      rootMargin: "600px 0px",
    });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (!near) return;
    const el = frame.current!;
    const cv = canvas.current!;
    const gl = cv.getContext("webgl", { antialias: false, alpha: false });
    if (!gl) return;
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
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return;
    gl.useProgram(prog);
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(prog, "p");
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    const U = Object.fromEntries(
      [
        "uRes",
        "uBase",
        "uOver",
        "uMask",
        "uImg",
        "uMap",
        "uDoor",
        "uDoorTopR",
        "uTime",
        "uTopBase",
        "uTopOver",
      ].map((n) => [n, gl.getUniformLocation(prog, n)]),
    );
    const texture = (unit: number) => {
      const t = gl.createTexture();
      gl.activeTexture(gl.TEXTURE0 + unit);
      gl.bindTexture(gl.TEXTURE_2D, t);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      return t;
    };
    const texBase = texture(0);
    const texOver = texture(1);
    const texMask = texture(2);
    gl.uniform1i(U.uBase, 0);
    gl.uniform1i(U.uOver, 1);
    gl.uniform1i(U.uMask, 2);
    gl.pixelStorei(gl.UNPACK_COLORSPACE_CONVERSION_WEBGL, gl.NONE);

    // the stroke's mask: small (it has no edges to keep sharp), fading a little every frame
    const mask = document.createElement("canvas");
    const mctx = mask.getContext("2d")!;
    let pair: Pair | null = null;
    let loadingFor = "";
    let ready = false;
    let alive = false;
    let tops: [number, number, number][] = [
      [0, 0, 0],
      [0, 0, 0],
    ];
    const t0 = performance.now();

    const size = () => {
      const W = el.clientWidth;
      const H = el.clientHeight;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      if (cv.width !== Math.round(W * dpr) || cv.height !== Math.round(H * dpr)) {
        cv.width = Math.round(W * dpr);
        cv.height = Math.round(H * dpr);
      }
      const mw = 320;
      const mh = Math.max(1, Math.round((mw * H) / Math.max(1, W)));
      if (mask.width !== mw || mask.height !== mh) {
        mask.width = mw;
        mask.height = mh;
      }
      const want = pairFor(W / Math.max(1, H));
      if (want.base !== pair?.base && want.base !== loadingFor) {
        loadingFor = want.base;
        void Promise.all([loadImage(want.base), loadImage(want.over)]).then(([b, o]) => {
          if (loadingFor !== want.base || !b || !o) return;
          gl.activeTexture(gl.TEXTURE0);
          gl.bindTexture(gl.TEXTURE_2D, texBase);
          gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, b);
          gl.activeTexture(gl.TEXTURE1);
          gl.bindTexture(gl.TEXTURE_2D, texOver);
          gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, o);
          tops = [topColour(b), topColour(o)];
          pair = want;
          loadingFor = "";
          ready = true;
          setLive(true);
          kick();
        });
      }
      kick();
    };

    const draw = (now: number) => {
      if (!ready || !pair) return;
      gl.activeTexture(gl.TEXTURE2);
      gl.bindTexture(gl.TEXTURE_2D, texMask);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, mask);
      const W = el.clientWidth;
      const H = el.clientHeight;
      const m = coverMap(W, H, pair, v0.current);
      gl.viewport(0, 0, cv.width, cv.height);
      gl.uniform2f(U.uRes, cv.width, cv.height);
      gl.uniform2f(U.uImg, pair.w, pair.h);
      gl.uniform4f(U.uMap, m[0], m[1], m[2], m[3]);
      gl.uniform4f(U.uDoor, pair.door[0], pair.door[1], pair.door[2], pair.door[3]);
      gl.uniform1f(U.uDoorTopR, pair.topR);
      gl.uniform3f(U.uTopBase, tops[0][0], tops[0][1], tops[0][2]);
      gl.uniform3f(U.uTopOver, tops[1][0], tops[1][1], tops[1][2]);
      gl.uniform1f(U.uTime, (now - t0) / 1000);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    };

    /* ---- the stroke ---- */
    let last: { x: number; y: number } | null = null;
    let lastStroke = 0;
    const stamp = (x: number, y: number) => {
      // (x, y: fractions of the frame)
      const r = mask.width * Math.max(BRUSH.size, BRUSH.min / Math.max(1, el.clientWidth));
      const cx = x * mask.width;
      const cy = y * mask.height;
      const g = mctx.createRadialGradient(cx, cy, 0, cx, cy, r);
      g.addColorStop(0, `rgba(0,0,0,${BRUSH.strength})`);
      g.addColorStop(0.55, `rgba(0,0,0,${BRUSH.strength * 0.6})`);
      g.addColorStop(1, "rgba(0,0,0,0)");
      mctx.globalCompositeOperation = "source-over";
      mctx.fillStyle = g;
      mctx.fillRect(cx - r, cy - r, r * 2, r * 2);
      alive = true;
      lastStroke = performance.now();
      kick();
    };
    // along the way from the last point, so a quick move leaves an unbroken stroke
    const paint = (x: number, y: number) => {
      if (last) {
        const dx = (x - last.x) * mask.width;
        const dy = (y - last.y) * mask.height;
        const steps = Math.min(24, Math.ceil(Math.hypot(dx, dy) / (mask.width * BRUSH.size * 0.3)));
        for (let i = 1; i <= steps; i++)
          stamp(last.x + ((x - last.x) * i) / steps, last.y + ((y - last.y) * i) / steps);
      } else stamp(x, y);
      last = { x, y };
    };
    const at = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      return { x: (e.clientX - r.left) / r.width, y: (e.clientY - r.top) / r.height };
    };
    const onMove = (e: PointerEvent) => {
      const p = at(e);
      paint(p.x, p.y);
    };
    const onLeave = () => {
      last = null;
    };
    el.addEventListener("pointermove", onMove);
    el.addEventListener("pointerdown", onMove);
    el.addEventListener("pointerleave", onLeave);
    el.addEventListener("pointerup", onLeave);

    // phones and tablets: now and then, a gentle stroke wanders across by itself
    const noHover = window.matchMedia("(hover: none)").matches;
    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let wander: { t0: number; ax: number; ay: number; ph: number } | null = null;

    /* ---- drawing: only while the stroke is painted or fading, and on screen ---- */
    let raf = 0;
    let seen = false;
    const kick = () => {
      if (!raf && seen) raf = requestAnimationFrame(frame_);
    };
    let lastFrame = 0;
    const frame_ = (now: number) => {
      raf = 0;
      const dt = lastFrame && now - lastFrame < 100 ? now - lastFrame : 16.7;
      lastFrame = now;
      if (noHover && !still && seen) {
        if (!wander && now - lastStroke > 2600) {
          wander = {
            t0: now,
            ax: 0.2 + Math.random() * 0.12,
            ay: 0.1 + Math.random() * 0.08,
            ph: Math.random() * 6.28,
          };
          last = null;
        }
        if (wander) {
          const k = (now - wander.t0) / 3600;
          if (k >= 1) {
            wander = null;
            last = null;
          } else {
            const x = 0.5 + wander.ax * Math.sin(wander.ph + k * 5.2) + (k - 0.5) * 0.5;
            const y = 0.55 + wander.ay * Math.sin(wander.ph * 1.3 + k * 7.1);
            paint(x, y);
          }
        }
      }
      if (alive) {
        // the stroke fading a little (by the time passed, not per frame: the same on 60 and 120 Hz)
        mctx.globalCompositeOperation = "destination-out";
        mctx.fillStyle = `rgba(0,0,0,${1 - Math.pow(1 - BRUSH.fade, dt / 16.7)})`;
        mctx.fillRect(0, 0, mask.width, mask.height);
        // faded to nothing by now: cleared, so no faint haze is left behind
        if (now - lastStroke > 2200) {
          mctx.clearRect(0, 0, mask.width, mask.height);
          alive = false;
        }
      }
      draw(now);
      // (a stroke painted during this frame may already have asked for the next: only ever one)
      if ((alive || wander || (noHover && !still)) && !raf) raf = requestAnimationFrame(frame_);
    };
    const io = new IntersectionObserver(([e]) => {
      seen = e.isIntersecting;
      if (seen) kick();
    });
    io.observe(el);
    const ro = new ResizeObserver(size);
    ro.observe(el);
    size();

    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
      ro.disconnect();
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerdown", onMove);
      el.removeEventListener("pointerleave", onLeave);
      el.removeEventListener("pointerup", onLeave);
      gl.getExtension("WEBGL_lose_context")?.loseContext();
    };
  }, [near]);

  return (
    <div
      ref={frame}
      className={cn("relative overflow-hidden", className)}
      style={
        {
          "--fade": "180px",
          maskImage: fadeMask,
          WebkitMaskImage: fadeMask,
        } as React.CSSProperties
      }
    >
      {/* the desert alone, still (until the drawing is ready, or where it can't be) */}
      {near && (
        <img
          ref={still}
          src={PAIRS[0].base}
          alt=""
          aria-hidden
          loading="lazy"
          className="absolute inset-0 h-full w-full object-cover"
        />
      )}
      <canvas
        ref={canvas}
        aria-hidden
        className={cn(
          "absolute inset-0 h-full w-full transition-opacity duration-700",
          live ? "opacity-100" : "opacity-0",
        )}
      />
      {/* the words, over the picture in its night sky (placed by layout); only their links take
          the pointer, so the stroke follows the cursor right across them */}
      <div
        ref={words}
        className="pointer-events-none absolute inset-x-0 top-24 flex flex-col items-center px-4 text-center [&_a]:pointer-events-auto"
      >
        {children}
      </div>
    </div>
  );
}
