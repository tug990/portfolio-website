import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

/*
  A perspective's page told as a film (the About page; content/service-books.ts `reel`): short
  silent loops cut from our films (`Loop`, public/about/loops/<name>-<shape>.mp4, its still
  <name>-<shape>.jpg), with film grain and a vignette over them, in colour or black and white
  (`mono`); a phone's shape and a wide screen's of one loop (`ShapedLoop`); words cut out of the
  page with a film playing inside them (`FilmWords`); and stills from our films following the
  cursor over a picture (`ShotTrail`, the perspective's opening photograph in AboutSections.tsx).
  Used by ServiceBook.tsx.
*/

/* the shapes each loop is cut in: wide 16:9, tall 4:5, reel 9:16 */
export type Shape = "wide" | "tall" | "reel";
const RATIO: Record<Shape, string> = {
  wide: "aspect-video",
  tall: "aspect-[4/5]",
  reel: "aspect-[9/16]",
};
const loopSrc = (name: string, shape: Shape) => `/about/loops/${name}-${shape}`;

/*
  Behind words, a loop holds one shot (no cuts to pull the eye off the text): the longest single
  shot in each loop, in seconds from its start, measured from the files. A shot at least
  `STEADY.min` long plays at `STEADY.rate` and goes round within itself, its end dissolving back
  into its first frame over `STEADY.round` ms (never a jump); a shorter one holds its middle frame
  and drifts in slowly.
*/
const STEADY = { rate: 0.5, min: 1.5, drift: 14000, round: 1600 };
const SHOTS: Record<string, [number, number]> = {
  "gov-patrol": [0.42, 2.08],
  "gov-march": [0.26, 2.48],
  "gov-watch": [0.08, 4.52],
  "gov-lines": [1.14, 2.16],
  "gov-light": [0.08, 2.24],
  "gov-home": [0.18, 1.12],
  "ngo-mothers": [0.42, 0.88],
  "ngo-fields": [0.34, 1.08], // the woman carrying the basket, facing us (not the next shot)
  "ngo-home": [1.62, 3.3],
  "ngo-paddy": [0.34, 1.36],
  "ngo-sowing": [0.08, 3.51],
  // the supplied footage (one shot each, start to end)
  "corp-plant": [0.08, 5.9],
  "corp-mill": [0.08, 5.9],
  "corp-sparks": [0.08, 5.9],
  "corp-suit": [0.08, 5.9],
  "edu-campus": [0.08, 5.9],
  "edu-roofs": [0.08, 5.9],
  "edu-classroom": [0.08, 5.5],
  "edu-student": [0.08, 5.9],
  "edu-school": [0.08, 5.9],
  "hc-building": [0.08, 5.9],
  "hc-complex": [0.08, 5.9],
  "hc-doctor": [0.08, 5.9],
  "hc-gurney": [0.08, 5.9],
  "re-complex": [0.08, 5.9],
  "re-housing": [0.08, 5.9],
  "re-keys": [0.08, 5.9],
  "re-architect": [0.08, 5.9],
  "re-cranes": [0.08, 5.9],
  "re-towers": [0.08, 5.9],
  "re-skyline": [0.08, 5.9],
};

/* how a loop is graded: a film's colour, or black and white with a little more bite */
const LOOK = {
  film: "contrast(1.06) saturate(0.9)",
  mono: "grayscale(1) contrast(1.18) brightness(0.95)",
};

/* film grain: a few tiles of noise, every pixel a random grey (as a film's own static), made once
   in the browser and kept */
const TILE = 128;
let tiles: HTMLCanvasElement[] | null = null;
function noiseTiles() {
  if (tiles) return tiles;
  tiles = Array.from({ length: 4 }, () => {
    const c = document.createElement("canvas");
    c.width = c.height = TILE;
    const g = c.getContext("2d")!;
    const img = g.createImageData(TILE, TILE);
    const d = img.data;
    for (let k = 0; k < d.length; k += 4) {
      const v = (Math.random() * 256) | 0;
      d[k] = d[k + 1] = d[k + 2] = v;
      d[k + 3] = 255;
    }
    g.putImageData(img, 0, 0);
    return c;
  });
  return tiles;
}
/* how often the grain changes, a second (as film's, it's never still) */
const GRAIN_FPS = 18;

const calm = () =>
  typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/*
  Film grain over whatever it's put in (its parent: relative): fine static, a random grey for every
  pixel, changing many times a second while it's on screen, as film's does; still under reduced
  motion. Light to run on any screen: drawn once, from a noise tile, onto a canvas a tile larger than
  its box each way, then only moved to a random offset each time (a move the graphics card makes on
  its own, nothing drawn again).
*/
export function Grain({
  strength = 0.16,
  blend = "overlay",
  className,
}: {
  strength?: number;
  /* where it sits in its box's stack (it lies above the picture, below anything with a z-index) */
  className?: string;
  /* how it's laid on: `overlay` works the shot's own light; `normal` lies on top as static, so it
     shows even where the picture's been darkened for words */
  blend?: "overlay" | "normal";
}) {
  const box = useRef<HTMLSpanElement>(null);
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const b = box.current;
    const c = ref.current;
    const ctx = c?.getContext("2d");
    if (!b || !c || !ctx) return;
    const pattern = ctx.createPattern(noiseTiles()[0], "repeat")!;
    // a grain to a pixel of the page, over the box and a tile more each way
    const size = () => {
      const r = b.getBoundingClientRect();
      c.width = Math.max(1, Math.ceil(r.width)) + TILE;
      c.height = Math.max(1, Math.ceil(r.height)) + TILE;
      c.style.width = `${c.width}px`;
      c.style.height = `${c.height}px`;
      ctx.fillStyle = pattern;
      ctx.fillRect(0, 0, c.width, c.height);
    };
    const move = () => {
      const x = (Math.random() * TILE) | 0;
      const y = (Math.random() * TILE) | 0;
      c.style.transform = `translate3d(${-x}px, ${-y}px, 0)`;
    };
    size();
    move();
    const ro = new ResizeObserver(size);
    ro.observe(b);
    if (calm()) return () => ro.disconnect();
    let seen = false;
    const io = new IntersectionObserver(([e]) => (seen = e.isIntersecting));
    io.observe(b);
    const timer = window.setInterval(() => {
      if (seen && !document.hidden) move();
    }, 1000 / GRAIN_FPS);
    return () => {
      window.clearInterval(timer);
      io.disconnect();
      ro.disconnect();
    };
  }, []);
  return (
    <span
      ref={box}
      aria-hidden
      className={cn(
        "pointer-events-none absolute inset-0 z-[1] overflow-hidden",
        blend === "overlay" && "mix-blend-overlay",
        className,
      )}
      style={{ opacity: strength }}
    >
      <canvas
        ref={ref}
        className="absolute left-0 top-0 will-change-transform"
        style={{ imageRendering: "pixelated" }}
      />
    </span>
  );
}

/*
  A silent loop from our films, covering its box: loaded once it's near the screen, playing only
  while it's on it; its still in its place until then, and for good under reduced motion (or
  where the phone won't play it, Low Power Mode). Grain and a soft vignette over it.
*/
export function Loop({
  name,
  shape,
  className,
  grain = true,
  vignette = true,
  ratio = false,
  fit = "cover",
  mono = false,
  look,
  position,
  steady = false,
  playing = true,
}: {
  name: string;
  shape: Shape;
  className?: string;
  /* `contain`: the whole shot, over a blurred copy of itself filling the box (nothing cut) */
  fit?: "cover" | "contain";
  /* film grain over it, and how strong (a background's heavier) */
  grain?: boolean | number;
  vignette?: boolean;
  /* give the box the loop's own shape (else it fills the box it's given) */
  ratio?: boolean;
  /* black and white */
  mono?: boolean;
  /* a grade of its own (a CSS filter), and where the shot sits in its box (object-position) */
  look?: string;
  position?: string;
  /* behind words: hold one shot, slowly (`SHOTS`, `STEADY`), never cutting */
  steady?: boolean;
  /* false: loaded and ready on its first frame, but not playing (a film waiting its turn) */
  playing?: boolean;
}) {
  const box = useRef<HTMLDivElement>(null);
  // on screen (or nearly), as last seen
  const seen = useRef(false);
  const video = useRef<HTMLVideoElement>(null);
  // the shot's first frame, kept under the film for it to dissolve back into as it goes round
  const first = useRef<HTMLCanvasElement>(null);
  const shot = steady ? SHOTS[name] : undefined;
  // a shot too short to play slowly holds its middle frame
  const held = !!shot && shot[1] - shot[0] < STEADY.min;
  const [near, setNear] = useState(false);
  const [calmed, setCalmed] = useState(false);
  useEffect(() => setCalmed(calm()), []);
  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => {
        seen.current = e.isIntersecting;
        if (e.isIntersecting) setNear(true);
        const v = video.current;
        if (!v) return;
        if (held) return;
        if (e.isIntersecting && playing) v.play().catch(() => {});
        else v.pause();
      },
      { rootMargin: "240px 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [near, held, playing]);
  // its turn comes or goes: play or wait (only one film behind the words is ever decoding)
  useEffect(() => {
    const v = video.current;
    if (!v || held) return;
    if (playing && seen.current) v.play().catch(() => {});
    else if (!playing) v.pause();
  }, [playing, near, held]);
  // one shot only: start on it, slow it, and go round within it, the end dissolving back into its
  // first frame (or hold its middle, drifting in)
  useEffect(() => {
    const v = video.current;
    if (!v || !shot) return;
    let raf = 0;
    let drift: Animation | undefined;
    let fade: Animation | undefined;
    let kept = false;
    // copied at half size (it's only seen as the film dissolves into it), and only while the film
    // is on its first frame
    const keep = () => {
      const c = first.current;
      if (kept || !c || v.readyState < 2 || Math.abs(v.currentTime - shot[0]) > 0.05) return;
      try {
        c.width = Math.round(v.videoWidth / 2);
        c.height = Math.round(v.videoHeight / 2);
        c.getContext("2d")?.drawImage(v, 0, 0, c.width, c.height);
        kept = true;
      } catch {
        // no first frame to dissolve into: it simply starts over
      }
    };
    // a film waiting its turn (paused on its first frame) is copied once the page is idle, not in the
    // middle of a scene changing; one already playing at once, before it moves on
    const idle = (fn: () => void) => {
      if (typeof window.requestIdleCallback === "function")
        window.requestIdleCallback(fn, { timeout: 1500 });
      else setTimeout(fn, 300);
    };
    const soon = () => (v.paused ? idle(keep) : keep());
    // back at the start, the film shows again over its own first frame (no change to see)
    const back = () => {
      fade?.cancel();
      fade = undefined;
    };
    const ready = () => {
      v.playbackRate = STEADY.rate;
      if (held) {
        v.pause();
        v.currentTime = (shot[0] + shot[1]) / 2;
        drift = v.animate([{ transform: "scale(1)" }, { transform: "scale(1.08)" }], {
          duration: STEADY.drift,
          direction: "alternate",
          iterations: Infinity,
          easing: "ease-in-out",
        });
        return;
      }
      v.addEventListener(
        "seeked",
        () => (v.readyState >= 2 ? soon() : v.addEventListener("loadeddata", soon, { once: true })),
        {
          once: true,
        },
      );
      v.currentTime = shot[0];
      // how far before the shot's end the dissolve begins, in the film's own seconds
      const lead = (STEADY.round / 1000) * STEADY.rate;
      const watch = () => {
        const t = v.currentTime;
        if (!fade && kept && t >= shot[1] - lead) {
          fade = v.animate([{ opacity: 1 }, { opacity: 0 }], {
            duration: STEADY.round,
            easing: "ease-in-out",
            fill: "forwards",
          });
          fade.finished
            .then(() => {
              v.addEventListener("seeked", back, { once: true });
              v.currentTime = shot[0];
            })
            .catch(() => {});
        } else if (!fade && (t >= shot[1] || t < shot[0] - 0.05)) {
          // no first frame kept yet: start over, and keep it this time
          if (!kept) v.addEventListener("seeked", keep, { once: true });
          v.currentTime = shot[0];
        }
        raf = requestAnimationFrame(watch);
      };
      raf = requestAnimationFrame(watch);
    };
    if (v.readyState >= 1) ready();
    else v.addEventListener("loadedmetadata", ready, { once: true });
    return () => {
      cancelAnimationFrame(raf);
      drift?.cancel();
      fade?.cancel();
      v.removeEventListener("loadedmetadata", ready);
      v.removeEventListener("seeked", back);
      v.removeEventListener("loadeddata", soon);
      v.removeEventListener("seeked", keep);
    };
  }, [near, shot, held]);
  const src = loopSrc(name, shape);
  const filter = look ?? (mono ? LOOK.mono : LOOK.film);
  const still = { filter: look ?? (mono ? LOOK.mono : undefined), objectPosition: position };
  return (
    <div
      ref={box}
      aria-hidden
      className={cn("relative overflow-hidden bg-[#0a0a0a]", ratio && RATIO[shape], className)}
    >
      {fit === "contain" && (
        <img
          src={`${src}.jpg`}
          alt=""
          loading="lazy"
          decoding="async"
          className="absolute inset-0 h-full w-full scale-150 object-cover opacity-90 blur-xl saturate-[1.2]"
          style={mono ? { filter: LOOK.mono } : undefined}
        />
      )}
      <img
        src={`${src}.jpg`}
        alt=""
        loading="lazy"
        decoding="async"
        className={cn(
          "absolute inset-0 h-full w-full",
          fit === "contain" ? "object-contain" : "object-cover",
        )}
        style={still}
      />
      {near && !calmed && shot && !held && (
        <canvas
          ref={first}
          className={cn(
            "absolute inset-0 h-full w-full",
            fit === "contain" ? "object-contain" : "object-cover",
          )}
          style={{ filter, objectPosition: position }}
        />
      )}
      {near && !calmed && (
        <video
          ref={video}
          src={`${src}.mp4`}
          muted
          loop={!shot}
          playsInline
          autoPlay={!held && playing}
          preload="auto"
          className={cn(
            "absolute inset-0 h-full w-full",
            fit === "contain" ? "object-contain" : "object-cover",
          )}
          // a film's look: a touch more contrast, a little less colour (or none)
          style={{ filter, objectPosition: position }}
        />
      )}
      {vignette && (
        <span
          className="pointer-events-none absolute inset-0 z-[1]"
          style={{
            background: "radial-gradient(ellipse at center, transparent 55%, rgba(0,0,0,0.42))",
          }}
        />
      )}
      {grain !== false && <Grain strength={typeof grain === "number" ? grain : undefined} />}
    </div>
  );
}

/* a phone's loop and a wide screen's, one shown (the other never loads: it's never on screen) */
export function ShapedLoop({
  name,
  phone,
  wide,
  grain,
  mono,
  look,
  vignette,
  steady,
  playing,
  className,
}: {
  name: string;
  phone: Shape;
  wide: Shape;
  grain?: boolean | number;
  mono?: boolean;
  /* its own grade (a CSS filter), over `mono` and the film's */
  look?: string;
  vignette?: boolean;
  steady?: boolean;
  playing?: boolean;
  className?: string;
}) {
  return (
    <>
      <Loop
        name={name}
        shape={phone}
        grain={grain}
        mono={mono}
        look={look}
        vignette={vignette}
        steady={steady}
        playing={playing}
        className={cn("sm:hidden", className)}
      />
      <Loop
        name={name}
        shape={wide}
        grain={grain}
        mono={mono}
        look={look}
        vignette={vignette}
        steady={steady}
        playing={playing}
        className={cn("max-sm:hidden", className)}
      />
    </>
  );
}

/*
  Stills from our films following the cursor over a picture (after finn.framer.media's header):
  every `TRAIL.step` px the cursor travels, the next still is laid where it is, and each fades a
  moment later (`TRAIL.life`); on a touch screen, a tap or a finger drawn across does the same.
  The stills are public/about/trail/<name>.jpg, loaded once the page is up. Its parent: relative;
  it sits between the picture and the words. Nothing under reduced motion.
*/
const TRAIL = { step: 110, stepTouch: 70, life: 1400, most: 14 };
export function ShotTrail({ shots, className }: { shots: string[]; className?: string }) {
  const box = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = box.current;
    const area = el?.parentElement;
    if (!el || !area || !shots.length || calm()) return;
    const srcs = shots.map((x) => `/about/trail/${x}.jpg`);
    const warm = window.setTimeout(() => srcs.forEach((x) => (new Image().src = x)), 1200);
    let n = 0;
    let last: { x: number; y: number } | null = null;
    const drop = (x: number, y: number) => {
      const r = el.getBoundingClientRect();
      const img = document.createElement("img");
      img.src = srcs[n++ % srcs.length];
      img.alt = "";
      img.decoding = "async";
      img.className =
        "absolute aspect-[4/5] w-[clamp(110px,13vw,210px)] object-cover shadow-[0_24px_50px_-24px_rgba(0,0,0,0.6)]";
      img.style.left = `${x - r.left}px`;
      img.style.top = `${y - r.top}px`;
      el.appendChild(img);
      while (el.childElementCount > TRAIL.most) el.firstElementChild?.remove();
      const at = "translate(-50%, -50%)";
      img
        .animate(
          [
            { opacity: 0, transform: `${at} scale(0.6)` },
            { opacity: 1, transform: `${at} scale(1)`, offset: 0.14 },
            { opacity: 1, transform: `${at} scale(1)`, filter: "blur(0px)", offset: 0.55 },
            { opacity: 0, transform: `${at} scale(0.85)`, filter: "blur(6px)" },
          ],
          { duration: TRAIL.life, easing: "cubic-bezier(0.2, 0.7, 0.2, 1)", fill: "forwards" },
        )
        .finished.then(() => img.remove())
        .catch(() => {});
    };
    const move = (e: PointerEvent) => {
      const p = { x: e.clientX, y: e.clientY };
      if (!last) return void (last = p);
      const step = e.pointerType === "mouse" ? TRAIL.step : TRAIL.stepTouch;
      if (Math.hypot(p.x - last.x, p.y - last.y) < step) return;
      last = p;
      drop(p.x, p.y);
    };
    const down = (e: PointerEvent) => {
      if (e.pointerType === "mouse") return;
      last = { x: e.clientX, y: e.clientY };
      drop(e.clientX, e.clientY);
    };
    const leave = () => (last = null);
    area.addEventListener("pointermove", move, { passive: true });
    area.addEventListener("pointerdown", down, { passive: true });
    area.addEventListener("pointerleave", leave);
    return () => {
      window.clearTimeout(warm);
      area.removeEventListener("pointermove", move);
      area.removeEventListener("pointerdown", down);
      area.removeEventListener("pointerleave", leave);
    };
  }, [shots]);
  return (
    <div
      ref={box}
      aria-hidden
      className={cn("pointer-events-none absolute inset-0 overflow-hidden", className)}
    />
  );
}

/*
  Words cut out of the page, a film playing inside the letters (the page's own colour all round
  them, `--paper` where the page sets one, so only the words are film): large, in heavy capitals
  (Montserrat Black, as the share card's), each line kept to one line and sized to the longest.
  The film's graded a little darker so it never shows past the letters.
*/
export function FilmWords({
  lines,
  name,
  className,
}: {
  lines: string[];
  name: string;
  className?: string;
}) {
  const longest = Math.max(...lines.map((x) => x.length));
  return (
    <div className={cn("relative isolate overflow-hidden", className)}>
      <Loop
        name={name}
        shape="wide"
        vignette={false}
        grain={0.2}
        look="brightness(0.9) contrast(1.12) saturate(1.2)"
        position="50% 72%"
        className="absolute inset-[2px]"
      />
      <h2
        className="relative -my-px whitespace-nowrap bg-[var(--paper,var(--background))] [font-family:'Montserrat',Arial,sans-serif] font-black uppercase leading-[0.9] tracking-[-0.02em] text-black mix-blend-lighten"
        style={{
          fontSize: `min(200px, calc(min(100vw - 32px, 1104px) / ${(longest * 0.7).toFixed(2)}))`,
          padding: "0.04em 0 0.02em",
        }}
      >
        {lines.map((x) => (
          <span key={x} className="block">
            {x}
          </span>
        ))}
      </h2>
    </div>
  );
}
