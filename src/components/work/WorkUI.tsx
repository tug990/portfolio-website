import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
  type Ref,
  type RefObject,
} from "react";
import { Link } from "@tanstack/react-router";
import { toast } from "sonner";
import type { Project } from "@/content/projects";
import type { WorkClient } from "@/content/site";
import { Poster } from "@/components/Poster";
import { SORTS, UI, clientOf, coverSources, filmOf, kindOf, type SortKey } from "@/lib/work";
import { usePlayer } from "@/lib/player";
import { ScrubFrame } from "@/components/work/ScrubFrame";
import { BLURRED, BlurredFilm, STAGE } from "@/components/work/BlurredFilm";
import { GLASS_PANEL, GLASS_PILL, MENU_IN, useMenu } from "@/lib/menu";
import { cn } from "@/lib/utils";
import { PlayButton } from "@/components/work/PlayButton";

/*
  The pieces of the Work page and a film's page: laid out after YouTube's,
  in the studio's own language (as the About and Contact pages): Jost
  throughout, light wide-spaced capitals for titles and small labels, ink on
  near-white, soft grey for what's secondary, and the prism's light (the
  site's --prism) as the one accent.
*/

// (the page's own ink, from its colour tokens in styles.css)
export const INK = "var(--foreground)";
export const MUTED = "var(--muted-foreground)";
/* the prism's light (lines are the tricolour now, --tricolour: a card's hover line, progress, rules) */
export const PRISM = "var(--prism)";

/*
  The page both sit on: the site's near-white. `wide`: a film's page
  (YouTube's watch page runs wider). `flush`: with the Work page's hero
  above it, so no room is kept at its top for the header. Phones keep a
  16 px edge, which films and cards run out over (edge to edge).
*/
export function WorkBackdrop({
  children,
  wide,
  flush,
}: {
  children: ReactNode;
  wide?: boolean;
  flush?: boolean;
}) {
  // a computer's screen: the film's glow is grander there (Ambient, CINEMA)
  const [pc, setPc] = useState(false);
  useEffect(() => {
    const q = window.matchMedia(CINEMA_SCREENS);
    const apply = () => setPc(q.matches);
    apply();
    q.addEventListener("change", apply);
    return () => q.removeEventListener("change", apply);
  }, []);
  return (
    <div className="relative isolate overflow-x-clip bg-background" style={{ ...UI, color: INK }}>
      <Ambient cinema={pc} />
      <div
        className={cn(
          // phones: the header is at the bottom (SiteNav), so the page starts at the top
          "relative mx-auto px-4 pb-16 sm:px-6 lg:px-8",
          flush ? "pt-5 sm:pt-7" : "pt-[calc(env(safe-area-inset-top)+12px)] sm:pt-[92px]",
          wide ? "max-w-[1720px]" : "max-w-[1320px]",
        )}
      >
        {children}
      </div>
    </div>
  );
}

/* ---------- the film's light on the page ---------- */

/*
  While a film plays from this page, the page takes on its light, as YouTube's
  ambient light: the film blurred so far that only its light is left, behind
  the page, strongest round the film and softening out across it to nothing
  well below. The light changes smoothly: its base is YouTube's pictures of
  the film (at a quarter, half and three quarters through: lib/player.tsx
  `ambient`), each fading in slowly over the last; on a computer the film
  itself, live and in step (BlurredFilm), is laid over that base, not fully,
  so a cut in the film shifts the light rather than flashing it. Phones have
  the same light from the pictures alone (a second, live film would cost a
  phone data and battery, and iPhone's Safari won't blur or cut a YouTube
  frame). A video file is drawn live, on phones too (no second copy needed).
  On phones the bar round the notch, above the page, takes the light too
  (`useNotchLight`). Tune here:
*/
const LIGHT = {
  glow: 0.55, // how strong, round the film (0 to 1)
  saturate: 1.8, // light, not grey: richer…
  brightness: 1.15, // …and brighter than the film
  reach: 2.4, // how far down the page it reaches, in the film's heights below it
  blur: 42, // px, at the small size the film's drawn at (BlurredFilm): about ×3 on screen
  fade: 2600, // ms for a new picture's light to fade in over the last
  live: 0.5, // on a computer, how much of the live film is laid over the pictures' light
};
/* how it fades from the film out: [how far (of the way to the light's edge), how strong] */
const FALLOFF: [number, number][] = [
  [0, 1],
  [0.4, 0.6],
  [0.92, 0],
];
/* a computer's screen: where the live film joins the light */
const CINEMA_SCREENS = "(min-width: 1024px) and (hover: hover)";

type Box = { x: number; y: number; w: number; h: number };

function Ambient({ cinema }: { cinema: boolean }) {
  const { ambient, slot, docked } = usePlayer();
  const root = useRef<HTMLDivElement>(null);
  // where the film's box is on this page (none: its box is on another page)
  const [box, setBox] = useState<Box | null>(null);
  // the pictures' light: the newest fading in over the one before (the two are all that's kept)
  const [shots, setShots] = useState<{ key: number; src: string }[]>([]);

  useEffect(() => {
    const host = root.current?.parentElement;
    const el = slot?.el;
    if (!host || !el || !host.contains(el)) {
      setBox(null);
      return;
    }
    const measure = () => {
      const a = host.getBoundingClientRect();
      const b = el.getBoundingClientRect();
      setBox({ x: b.left - a.left, y: b.top - a.top, w: b.width, h: b.height });
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(host);
    ro.observe(el);
    return () => ro.disconnect();
  }, [slot]);

  // a picture of the film: once it's loaded, it fades in over the last
  const frame = ambient?.frame;
  useEffect(() => {
    if (!frame) return;
    let gone = false;
    const img = new Image();
    img.onload = () => {
      if (!gone) setShots((was) => [...was.slice(-1), { src: frame, key: performance.now() }]);
    };
    img.src = frame;
    return () => {
      gone = true;
    };
  }, [frame]);

  const on = !!ambient && docked && !!box;
  // the live film: a computer's (YouTube), or a video file anywhere
  const live = (cinema && !!ambient?.youtube) || !!ambient?.video;
  const band = useRef<HTMLDivElement>(null);
  useNotchLight({ phone: !cinema, on, box, root, band, frame, video: ambient?.video });
  return (
    <>
      <div
        ref={root}
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 transition-opacity duration-[1200ms] motion-reduce:transition-none"
        style={{ opacity: on ? 1 : 0 }}
      >
        {box && (
          <div
            className="absolute inset-x-0 top-0"
            style={{
              height: box.y + box.h * (1 + LIGHT.reach),
              opacity: LIGHT.glow,
              filter: `saturate(${LIGHT.saturate}) brightness(${LIGHT.brightness})`,
              maskImage: `radial-gradient(120% 100% at ${box.x + box.w / 2}px ${box.y + box.h / 2}px, ${FALLOFF.map(([at, s]) => `rgba(0,0,0,${s}) ${at * 100}%`).join(", ")})`,
            }}
          >
            {/* the pictures' light, each fading in slowly over the last */}
            {shots.map((s) => (
              <div
                key={s.key}
                className="absolute inset-0 animate-in fade-in motion-reduce:animate-none"
                style={{ animationDuration: `${LIGHT.fade}ms` }}
              >
                <BlurredFilm still={s.src} blur={LIGHT.blur} className="absolute inset-0" />
              </div>
            ))}
            {/* the film itself, live, over them */}
            {live && ambient && (
              <div
                className="absolute inset-0"
                style={{ opacity: ambient.youtube ? LIGHT.live : 1 }}
              >
                <BlurredFilm
                  youtube={cinema ? ambient.youtube : undefined}
                  video={ambient.video}
                  clock={ambient.clock}
                  blur={LIGHT.blur}
                  className="absolute inset-0"
                />
              </div>
            )}
          </div>
        )}
      </div>
      {/* phones: from the page's top down to the film, over the light, the bar's own colour
          (useNotchLight), so the bar round the notch runs straight down to the film */}
      {!cinema && (
        <div
          ref={band}
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 -z-10 sm:hidden"
          style={{ height: box?.y ?? 0 }}
        />
      )}
    </>
  );
}

/*
  The light round a phone's notch: the bar above the page takes the colour the
  light has at the top of the screen, so the film's light runs on up under
  the notch. A bar can only be one colour, not a picture: it's worked out as
  the page draws the light there (`notchColour`): a small copy of the film's
  picture blurred at that point as BlurredFilm blurs it (thinning out past the
  picture's edge), made richer and brighter as the light is, and laid over the
  page as strongly as the light is there; so it fades away as you scroll down
  past the light, and as a new picture's light fades in over the last, so
  does the bar's. Safari (since 26) colours its bar from the page's own
  background (body's, unseen behind the page; pulled down past its top, the
  light shows there too: a strip fixed at the top edge would be seen, and
  Safari passes over one that's hidden), Chrome on Android and older Safari
  from the page's theme colour (meta theme-color); both are given back as
  the light goes.
*/

type RGB = [number, number, number];
/* a film's picture, small (its letterbox bars cut off): rgb, row by row */
type Picture = { px: Uint8ClampedArray; w: number; h: number };
/* the pictures' light: the newest (`cur`) fading in over the one before since `at`, over `fade` ms */
type Pictures = { prev: Picture | null; cur: Picture | null; at: number; fade: number };

function useNotchLight({
  phone,
  on,
  box,
  root,
  band,
  frame,
  video,
}: {
  phone: boolean;
  on: boolean;
  box: Box | null;
  root: RefObject<HTMLDivElement | null>;
  /* the page from its top down to the film, given the bar's colour */
  band: RefObject<HTMLDivElement | null>;
  frame?: string;
  video?: HTMLVideoElement;
}) {
  const now = useRef({ on, box });
  now.current = { on, box };
  const pics = useRef<Pictures>({ prev: null, cur: null, at: 0, fade: LIGHT.fade });
  const kick = useRef(() => {});
  const take = (p: Picture | null, fade: number) => {
    if (!p) return;
    const was = pics.current;
    pics.current = { prev: was.cur, cur: p, at: performance.now(), fade };
    kick.current();
  };

  // from YouTube's picture of the film (letterboxed: its bars are an eighth of it, top and bottom)…
  useEffect(() => {
    if (!phone || !frame) return;
    let gone = false;
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      if (!gone) take(pictureOf(img, img.naturalWidth, img.naturalHeight, 0.125), LIGHT.fade);
    };
    img.src = frame;
    return () => {
      gone = true;
    };
  }, [phone, frame]);

  // …or a video file, as it plays
  useEffect(() => {
    if (!phone || !video) return;
    const every = 1000;
    const look = () => {
      if (video.readyState >= 2)
        take(pictureOf(video, video.videoWidth, video.videoHeight, 0), every);
    };
    look();
    const t = window.setInterval(look, every);
    return () => window.clearInterval(t);
  }, [phone, video]);

  // the bar's colour, given to the page's background and theme colour as it changes
  useEffect(() => {
    if (!phone) return;
    const meta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
    const was = meta?.content;
    const strip = band.current;
    const page = hexColour(
      getComputedStyle(document.documentElement).getPropertyValue("--background"),
    );
    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let raf = 0;
    let last = 0;
    let shown = "";
    // how far on the light is (0 to 1): it fades in and out as the page's does
    let lit = 0;

    const step = (t: number) => {
      raf = 0;
      const dt = t - last;
      last = t;
      const p = pics.current;
      const k = !p.prev || still ? 1 : Math.min(1, (t - p.at) / p.fade);
      const { on, box } = now.current;
      const goal = on && box && p.cur ? 1 : 0;
      lit = still
        ? goal
        : goal > lit
          ? Math.min(goal, lit + dt / 1200)
          : Math.max(goal, lit - dt / 1200);

      const el = root.current;
      const top = el?.getBoundingClientRect().top ?? 1;
      const c =
        el && box && p.cur && lit > 0 && top <= 1
          ? notchColour(page, p, smooth(k), lit, box, el.clientWidth, -top)
          : null;
      const colour = c ? hex(c) : "";
      if (colour !== shown) {
        shown = colour;
        // ("": the page's own again)
        document.body.style.backgroundColor = colour;
        if (strip) strip.style.backgroundColor = colour;
        if (meta && was) meta.content = colour || was;
      }
      if (k < 1 || lit !== goal) raf = requestAnimationFrame(step);
    };
    const go = () => {
      if (raf) return;
      last = performance.now();
      raf = requestAnimationFrame(step);
    };
    kick.current = go;
    window.addEventListener("scroll", go, { passive: true });
    window.addEventListener("resize", go);
    go();
    return () => {
      kick.current = () => {};
      window.removeEventListener("scroll", go);
      window.removeEventListener("resize", go);
      cancelAnimationFrame(raf);
      document.body.style.backgroundColor = "";
      if (strip) strip.style.backgroundColor = "";
      if (meta && was) meta.content = was;
    };
  }, [phone, root, band]);

  // the light came on or went, or the film's box moved
  useEffect(() => kick.current(), [on, box]);
}

/*
  The light's colour at `y` px down the page's light (the screen's top, as
  it's scrolled), as Ambient draws it there: the film covering the light's
  area (BlurredFilm: its small size scaled up to cover, a little larger),
  blurred, faded towards the edge as the light is (FALLOFF), over the page.
*/
function notchColour(
  page: RGB,
  p: Pictures,
  k: number,
  lit: number,
  box: Box,
  width: number,
  y: number,
): RGB | null {
  const tall = box.y + box.h * (1 + LIGHT.reach);
  const SH = (STAGE * 9) / 16;
  const scale = Math.max(width / STAGE, tall / SH) * BLURRED.zoom;
  // where `y` is on the film, in its small size's px, and how much of the screen's width it spans
  const sy = (y - (tall - SH * scale) / 2) / scale;
  const half = width / scale / 2;
  const at = (q: Picture) => blurredAt(q, sy, half, LIGHT.blur);
  const film = p.prev && k < 1 && p.cur ? mix(at(p.prev), at(p.cur), k) : p.cur ? at(p.cur) : null;
  if (!film) return null;
  // the blurred picture thins out past its edges (towards the page)
  const s = LIGHT.blur;
  const cover = normal(sy / s) - normal((sy - SH) / s);
  // how strong the light is there, across the screen's width (the page's mask: an ellipse
  // round the film, 120% of the width across and the light's height tall)
  const down = (y - (box.y + box.h / 2)) / tall;
  let across = 0;
  for (let i = 0; i < 9; i++) {
    const side = (((i + 0.5) / 9) * width - (box.x + box.w / 2)) / (1.2 * width);
    across += falloff(Math.hypot(side, down)) / 9;
  }
  const strength = LIGHT.glow * across * lit * cover;
  return strength > 0.004 ? mix(page, lightOf(film), strength) : null;
}

/* a picture, small, its letterbox bars (`bars` of its height, top and bottom) cut off */
function pictureOf(src: CanvasImageSource, w: number, h: number, bars: number): Picture | null {
  if (!w || !h) return null;
  const c = document.createElement("canvas");
  c.width = 48;
  c.height = 27;
  const x = c.getContext("2d", { willReadFrequently: true });
  if (!x) return null;
  x.drawImage(src, 0, h * bars, w, h * (1 - 2 * bars), 0, 0, c.width, c.height);
  try {
    const d = x.getImageData(0, 0, c.width, c.height).data;
    const px = new Uint8ClampedArray(c.width * c.height * 3);
    for (let i = 0, o = 0; i < d.length; i += 4, o += 3) {
      px[o] = d[i];
      px[o + 1] = d[i + 1];
      px[o + 2] = d[i + 2];
    }
    return { px, w: c.width, h: c.height };
  } catch {
    return null; // (a picture from somewhere that doesn't allow it to be read)
  }
}

/*
  A picture's colour blurred (by `s`, in the small size's px) at `sy` px down
  it, across its middle `half` px either side (the screen's width): weighted
  as a blur weighs it, within the picture.
*/
function blurredAt(q: Picture, sy: number, half: number, s: number): RGB {
  const SH = (STAGE * 9) / 16;
  let r = 0;
  let g = 0;
  let b = 0;
  let n = 0;
  for (let j = 0; j < q.h; j++) {
    const dy = ((j + 0.5) / q.h) * SH - sy;
    const wy = Math.exp(-(dy * dy) / (2 * s * s));
    if (wy < 0.01) continue;
    for (let i = 0; i < q.w; i++) {
      const dx = Math.max(0, Math.abs(((i + 0.5) / q.w) * STAGE - STAGE / 2) - half);
      const wgt = wy * Math.exp(-(dx * dx) / (2 * s * s));
      const o = (j * q.w + i) * 3;
      r += q.px[o] * wgt;
      g += q.px[o + 1] * wgt;
      b += q.px[o + 2] * wgt;
      n += wgt;
    }
  }
  return n ? [r / n, g / n, b / n] : [0, 0, 0];
}

/* how much of a blur lies below `z` of its width (the normal distribution) */
function normal(z: number) {
  const t = 1 / (1 + 0.2316419 * Math.abs(z));
  const d = 0.3989423 * Math.exp((-z * z) / 2);
  const tail =
    d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));
  return z > 0 ? 1 - tail : tail;
}

/* the film's colour as the light on the page has it: the blurred film's, then the light's own */
function lightOf(c: RGB): RGB {
  return saturate(saturate(c, BLURRED.saturate), LIGHT.saturate).map(
    (v) => v * LIGHT.brightness,
  ) as RGB;
}

/* as CSS's saturate() */
function saturate([r, g, b]: RGB, s: number): RGB {
  return [
    (0.213 + 0.787 * s) * r + (0.715 - 0.715 * s) * g + (0.072 - 0.072 * s) * b,
    (0.213 - 0.213 * s) * r + (0.715 + 0.285 * s) * g + (0.072 - 0.072 * s) * b,
    (0.213 - 0.213 * s) * r + (0.715 - 0.715 * s) * g + (0.072 + 0.928 * s) * b,
  ].map((v) => Math.min(255, Math.max(0, v))) as RGB;
}

/* how strong the light is, `at` of the way to its edge (FALLOFF, as the page's mask) */
function falloff(at: number) {
  for (let i = 1; i < FALLOFF.length; i++) {
    const [a, sa] = FALLOFF[i - 1];
    const [b, sb] = FALLOFF[i];
    if (at <= b) return sa + ((sb - sa) * (Math.max(at, a) - a)) / (b - a);
  }
  return 0;
}

const mix = (a: RGB, b: RGB, k: number): RGB => [
  a[0] + (b[0] - a[0]) * k,
  a[1] + (b[1] - a[1]) * k,
  a[2] + (b[2] - a[2]) * k,
];
const smooth = (k: number) => k * k * (3 - 2 * k);
const hex = (c: RGB) =>
  "#" +
  c
    .map((v) =>
      Math.round(Math.min(255, Math.max(0, v)))
        .toString(16)
        .padStart(2, "0"),
    )
    .join("");
function hexColour(s: string): RGB {
  const m = /^#?([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(s.trim());
  return m ? [parseInt(m[1], 16), parseInt(m[2], 16), parseInt(m[3], 16)] : [252, 252, 252];
}

/* ---------- avatars ---------- */

/*
  A round avatar, as YouTube puts by every channel: the studio's mark, or a
  client's exact emblem (or, for those without one, their whole logo), on
  white, inside a hairline ring.
*/
export function Avatar({
  client,
  size,
  className,
}: {
  client?: WorkClient;
  size: number;
  className?: string;
}) {
  const src = client ? client.mark : "/brand/mark-avatar.webp";
  // in pixels, not percentages (a percentage height isn't kept inside the circle, so a tall
  // emblem grew past it and sat low): a whole logo 82% of the circle wide, an emblem 68% of it
  // tall, the studio's mark 64%; each centred
  const fit = client?.markIsLogo
    ? { width: Math.round(size * 0.82), height: "auto" }
    : { height: Math.round(size * (client ? 0.68 : 0.64)), width: "auto" };
  return (
    <span
      aria-hidden
      className={cn(
        "flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-white shadow-[0_1px_3px_rgba(20,23,46,0.12)] ring-1 ring-[#0a0a0a]/10",
        className,
      )}
      style={{ width: size, height: size }}
    >
      <img
        src={src}
        alt=""
        loading="lazy"
        className="max-w-[82%] shrink-0 object-contain"
        style={fit}
      />
    </span>
  );
}

/* A client's name, short: their big word (as on their badge), else their name. */
export const shortName = (c: WorkClient) => c.big ?? c.name;

/* ---------- chips and rows that scroll ---------- */

/* A chip, as YouTube's: a small rounded label; the chosen one is ink. */
export function Chip({
  active,
  onClick,
  children,
}: {
  active?: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "press flex h-8 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-3.5 text-[13px] outline-none transition focus-visible:ring-2 focus-visible:ring-black/30",
        active
          ? "bg-foreground text-background"
          : "bg-foreground/[0.06] text-foreground hover:bg-foreground/[0.11]",
      )}
    >
      {children}
    </button>
  );
}

/*
  A row that scrolls sideways (chips, a shelf of films): by swiping, or on
  wider screens with round arrow buttons at its ends, which show only while
  there's more that way. The ends fade.
*/
export function Scroller({
  children,
  className,
  gap = "gap-3",
  step = 0.8,
  label,
}: {
  children: ReactNode;
  className?: string;
  gap?: string;
  step?: number;
  label: string;
}) {
  const el = useRef<HTMLUListElement>(null);
  const [ends, setEnds] = useState({ left: false, right: false });
  const update = useCallback(() => {
    const s = el.current;
    if (!s) return;
    setEnds({
      left: s.scrollLeft > 4,
      right: s.scrollLeft + s.clientWidth < s.scrollWidth - 4,
    });
  }, []);
  useEffect(() => {
    const s = el.current;
    if (!s) return;
    update();
    const ro = new ResizeObserver(update);
    ro.observe(s);
    return () => ro.disconnect();
  }, [update]);
  const go = (dir: 1 | -1) =>
    el.current?.scrollBy({ left: dir * el.current.clientWidth * step, behavior: "smooth" });

  const arrow = (dir: 1 | -1) => (
    <button
      type="button"
      aria-label={dir > 0 ? "More" : "Back"}
      onClick={() => go(dir)}
      className={cn(
        "absolute top-1/2 z-10 hidden h-9 w-9 -translate-y-1/2 place-items-center rounded-full bg-white text-[#0a0a0a] shadow-[0_2px_10px_rgba(20,23,46,0.18)] ring-1 ring-black/5 transition hover:bg-[#f4f3fa] sm:grid",
        dir > 0 ? "-right-2" : "-left-2",
      )}
    >
      <svg
        aria-hidden
        viewBox="0 0 24 24"
        className="h-5 w-5"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.2"
      >
        <path d={dir > 0 ? "M9 6l6 6-6 6" : "M15 6l-6 6 6 6"} />
      </svg>
    </button>
  );

  return (
    <div className={cn("relative", className)}>
      {ends.left && arrow(-1)}
      <ul
        ref={el}
        aria-label={label}
        onScroll={update}
        className={cn(
          "flex snap-x overflow-x-auto scroll-smooth [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
          gap,
        )}
        style={{
          maskImage: `linear-gradient(90deg, ${ends.left ? "transparent, #000 40px" : "#000, #000"}, #000 calc(100% - 40px), ${ends.right ? "transparent" : "#000"})`,
        }}
      >
        {children}
      </ul>
      {ends.right && arrow(1)}
    </div>
  );
}

/* ---------- a film's picture ---------- */

/*
  A film's picture, light: the browser picks the size it needs from the
  YouTube cover's WebP sizes (`sizes` says how wide it shows), loads it lazily
  unless `eager` (the first thing you see), and falls back to a JPEG every
  video has if a WebP size is missing.
*/
export function Cover({
  project,
  sizes,
  eager,
  className,
}: {
  project: Project;
  sizes: string;
  eager?: boolean;
  className?: string;
}) {
  const s = coverSources(project);
  const [failed, setFailed] = useState(false);
  if (!s) return null;
  const useFallback = failed && !!s.fallback;
  return (
    <img
      src={useFallback ? s.fallback : s.src}
      srcSet={useFallback ? undefined : s.srcSet}
      sizes={s.srcSet && !useFallback ? sizes : undefined}
      alt=""
      loading={eager ? "eager" : "lazy"}
      fetchPriority={eager ? "high" : undefined}
      decoding="async"
      onError={() => s.fallback && !failed && setFailed(true)}
      className={className}
    />
  );
}

/* A time as a film's player shows it: 1:05 */
const clock = (t: number) => `${Math.floor(t / 60)}:${String(Math.floor(t % 60)).padStart(2, "0")}`;

/*
  The picture in a card: the cover (or the stand-in poster), its length, and on
  hover a line of the tricolour. A card whose film can play here, under a
  mouse: after a moment's rest on it (so passing over cards loads nothing), the
  film itself, at the point across the card the pointer is at (ScrubFrame):
  move along and it runs through the film, rest and it plays on silently from
  there; the tricolour line and the time show where in it you are.
*/
function Thumb({
  project,
  sizes,
  className,
}: {
  project: Project;
  sizes: string;
  className?: string;
}) {
  const film = filmOf(project);
  const scrubbable = !!(film?.youtube || film?.file);
  /* where across the card the pointer is (0 to 1), while scrubbing */
  const [part, setPart] = useState<number | null>(null);
  const [length, setLength] = useState(0);
  const pending = useRef(0);
  const intent = useRef(0);
  useEffect(() => () => window.clearTimeout(intent.current), []);
  const across = (e: React.PointerEvent<HTMLElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    return Math.min(1, Math.max(0, (e.clientX - r.left) / r.width));
  };
  const scrub = scrubbable
    ? {
        onPointerEnter: (e: React.PointerEvent<HTMLElement>) => {
          if (e.pointerType !== "mouse") return;
          pending.current = across(e);
          intent.current = window.setTimeout(() => setPart(pending.current), 250);
        },
        onPointerMove: (e: React.PointerEvent<HTMLElement>) => {
          if (e.pointerType !== "mouse") return;
          pending.current = across(e);
          setPart((p) => (p === null ? p : pending.current));
        },
        onPointerLeave: () => {
          window.clearTimeout(intent.current);
          setPart(null);
        },
      }
    : {};
  return (
    <span
      className={cn("relative block aspect-video overflow-hidden bg-[#0d0d16]", className)}
      {...scrub}
    >
      {coverSources(project) ? (
        <Cover
          project={project}
          sizes={sizes}
          className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]"
        />
      ) : (
        <span className="absolute inset-0 transition-transform duration-700 ease-out group-hover:scale-[1.04]">
          <Poster title={project.title} />
        </span>
      )}
      <span
        aria-hidden
        className="absolute inset-0 rounded-[inherit] ring-1 ring-inset ring-white/10"
      />
      {part !== null && film && (
        <>
          <ScrubFrame
            youtube={film.youtube}
            file={film.file}
            part={part}
            onLength={setLength}
            className="absolute inset-0 duration-200 animate-in fade-in"
          />
          {length > 0 && (
            <span className="absolute bottom-1.5 left-1.5 rounded-[5px] bg-[#0b0b14]/75 px-1.5 py-px text-[12px] font-medium tabular-nums text-white backdrop-blur-sm">
              {clock(part * length)}
            </span>
          )}
        </>
      )}
      {project.duration && (
        <span className="absolute bottom-1.5 right-1.5 rounded-[5px] bg-[#0b0b14]/75 px-1.5 py-px text-[12px] font-medium tabular-nums text-white backdrop-blur-sm">
          {project.duration}
        </span>
      )}
      {part === null ? (
        <span
          aria-hidden
          className="absolute inset-x-0 bottom-0 h-[3px] origin-left scale-x-0 transition-transform duration-500 group-hover:scale-x-100"
          style={{ background: "var(--tricolour)" }}
        />
      ) : (
        // where in the film: the tricolour up to the pointer
        <span aria-hidden className="absolute inset-x-0 bottom-0 h-[3px] bg-white/30">
          <span
            className="absolute inset-0"
            style={{
              background: "var(--tricolour)",
              clipPath: `inset(0 ${((1 - part) * 100).toFixed(2)}% 0 0)`,
            }}
          />
        </span>
      )}
    </span>
  );
}

/* A link to a film's page, or (in the gallery's sheet, which opens films in place) a button. */
function ToFilm({
  project,
  onOpen,
  className,
  children,
  label,
  tabIndex,
}: {
  project: Project;
  onOpen?: (slug: string) => void;
  className?: string;
  children: ReactNode;
  label?: string;
  tabIndex?: number;
}) {
  if (onOpen)
    return (
      <button
        type="button"
        onClick={() => onOpen(project.slug)}
        aria-label={label}
        tabIndex={tabIndex}
        className={cn("text-left", className)}
      >
        {children}
      </button>
    );
  return (
    <Link
      to="/projects/$slug"
      params={{ slug: project.slug }}
      aria-label={label}
      tabIndex={tabIndex}
      className={className}
    >
      {children}
    </Link>
  );
}

/* ---------- video cards ---------- */

/*
  A film, as a YouTube video card: its picture, then the client's avatar, the
  title (two lines at most), the client, and what kind of film and its year.
  `bleed`: on phones the picture runs edge to edge (as in YouTube's app).
  `avatar={false}`: in a client's own row, where it would only repeat.
*/
export function VideoCard({
  project,
  bleed,
  avatar = true,
  onOpen,
  sizes = "(min-width: 1280px) 300px, (min-width: 1024px) 31vw, (min-width: 640px) 48vw, 100vw",
}: {
  project: Project;
  bleed?: boolean;
  avatar?: boolean;
  /* opens films in place (the gallery's sheet) instead of going to their page */
  onOpen?: (slug: string) => void;
  sizes?: string;
}) {
  const client = clientOf(project);
  return (
    <article className="group">
      <ToFilm
        project={project}
        onOpen={onOpen}
        label={project.title}
        className={cn(
          "press block w-full",
          bleed ? "-mx-4 w-[calc(100%+2rem)] sm:mx-0 sm:w-full" : "",
        )}
      >
        <Thumb project={project} sizes={sizes} className={bleed ? "sm:rounded-xl" : "rounded-xl"} />
      </ToFilm>
      <div className="mt-3 flex items-start gap-3">
        {avatar && <Avatar client={client} size={36} className="mt-0.5" />}
        <div className="min-w-0 flex-1">
          <h3 className="line-clamp-2 text-[16px] font-medium leading-[1.3] tracking-tight">
            <ToFilm project={project} onOpen={onOpen} tabIndex={-1}>
              {project.title}
            </ToFilm>
          </h3>
          <p className="tracked mt-1.5 truncate text-[10px] leading-[1.6]" style={{ color: MUTED }}>
            {project.client ?? "Insight Lab"}
          </p>
          <p className="truncate text-[13px] leading-[1.5]" style={{ color: MUTED }}>
            {[kindOf(project), project.year].filter(Boolean).join(" · ")}
          </p>
        </div>
        <CardMenu project={project} />
      </div>
    </article>
  );
}

/* A film in a list beside the player ("Up next"): a small picture, and its words to the right. */
export function CompactCard({
  project,
  onOpen,
}: {
  project: Project;
  onOpen?: (slug: string) => void;
}) {
  return (
    <article className="group flex items-start gap-2.5">
      <ToFilm
        project={project}
        onOpen={onOpen}
        label={project.title}
        className="press block w-[168px] shrink-0"
      >
        <Thumb project={project} sizes="168px" className="rounded-lg" />
      </ToFilm>
      <div className="min-w-0 flex-1 pt-0.5">
        <h3 className="line-clamp-2 text-[15px] font-medium leading-[1.3] tracking-tight">
          <ToFilm project={project} onOpen={onOpen} tabIndex={-1}>
            {project.title}
          </ToFilm>
        </h3>
        <p className="tracked mt-1.5 truncate text-[9.5px] leading-[1.6]" style={{ color: MUTED }}>
          {project.client ?? "Insight Lab"}
        </p>
        <p className="truncate text-[12px] leading-[1.5]" style={{ color: MUTED }}>
          {[kindOf(project), project.year].filter(Boolean).join(" · ")}
        </p>
      </div>
      <CardMenu project={project} />
    </article>
  );
}

/* ⋮ on a card: play it in the mini player (and keep browsing), open its page, copy its link. */
export function CardMenu({ project }: { project: Project }) {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const { play } = usePlayer();
  const film = filmOf(project);

  useEffect(() => {
    if (!open) return;
    const away = (e: PointerEvent) => {
      if (!root.current?.contains(e.target as Node)) setOpen(false);
    };
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("pointerdown", away);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("pointerdown", away);
      document.removeEventListener("keydown", esc);
    };
  }, [open]);

  const copy = async () => {
    setOpen(false);
    const url = `${window.location.origin}/projects/${project.slug}`;
    try {
      await navigator.clipboard.writeText(url);
      toast("Link copied");
    } catch {
      toast(url);
    }
  };

  const item =
    "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-[14px] hover:bg-[#0a0a0a]/[0.06]";
  return (
    <div ref={root} className="relative -mr-2 -mt-1 shrink-0">
      <button
        type="button"
        aria-label={`More for ${project.title}`}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className="grid h-8 w-8 place-items-center rounded-full opacity-80 transition hover:bg-foreground/[0.07] hover:opacity-100"
      >
        <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="currentColor" aria-hidden>
          <circle cx="12" cy="5" r="1.8" />
          <circle cx="12" cy="12" r="1.8" />
          <circle cx="12" cy="19" r="1.8" />
        </svg>
      </button>
      {open && (
        <div
          role="menu"
          className={cn(
            "absolute right-0 top-9 z-30 w-60 origin-top-right rounded-xl p-1.5",
            GLASS_PANEL,
            MENU_IN,
          )}
        >
          {film && (
            <button
              role="menuitem"
              type="button"
              className={item}
              onClick={() => {
                setOpen(false);
                play(film);
              }}
            >
              <MiniIcon className="h-[18px] w-[18px]" />
              Play in the mini player
            </button>
          )}
          <Link
            role="menuitem"
            to="/projects/$slug"
            params={{ slug: project.slug }}
            className={item}
          >
            <MenuIcon d="M5 5h14v14H5zM10 9.5v5l4-2.5z" />
            Open the film
          </Link>
          <button role="menuitem" type="button" onClick={copy} className={item}>
            <MenuIcon d="M9 15l6-6M10.5 6.5l1.8-1.8a4 4 0 015.7 5.7l-1.8 1.8M13.5 17.5l-1.8 1.8a4 4 0 01-5.7-5.7l1.8-1.8" />
            Copy link
          </button>
        </div>
      )}
    </div>
  );
}

function MenuIcon({ d }: { d: string }) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 24 24"
      className="h-[18px] w-[18px] shrink-0"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d={d} />
    </svg>
  );
}

/* A screen with a small one in its corner: the mini player. */
export function MiniIcon({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 24 24"
      className={cn("shrink-0", className)}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinejoin="round"
    >
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <rect x="12" y="12" width="7" height="5" rx="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

/* ---------- the box a film plays in ---------- */

/*
  Where a film plays on a page (a film's page, the featured film on the Work
  page): its cover and a play button until it plays, then the site's player
  sits exactly over this box (lib/player.tsx). If it's in the mini player
  instead, the cover says so; playing it again brings it back here.
  `children`: words over the cover. `heroRef`: the gallery sheet's animation.
*/
export function FilmBox({
  project,
  className,
  heroRef,
  eager,
  sizes,
  children,
}: {
  project: Project;
  className?: string;
  heroRef?: Ref<HTMLDivElement>;
  eager?: boolean;
  sizes: string;
  children?: ReactNode;
}) {
  const { film, docked, play, setSlot, setOffscreen, prime, unprime } = usePlayer();
  const playable = filmOf(project);
  const here = film?.slug === project.slug;
  const showing = here && docked;

  // Its YouTube player made now, unseen over this box, so the tap on play starts it at once,
  // with sound (lib/player.tsx `primed`); a film file plays from this button as ever
  useEffect(() => {
    const f = filmOf(project);
    if (!f?.youtube) return;
    prime(f);
    return () => unprime(f.slug);
  }, [project, prime, unprime]);

  // Scrolled past while its film plays: it floats to the corner (and back).
  // Out once less than a quarter is left above the top; back at half.
  const [box, setBox] = useState<HTMLDivElement | null>(null);
  useEffect(() => {
    if (!box || !here) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.boundingClientRect.top < 0 && e.intersectionRatio < 0.25) setOffscreen(true);
        else if (e.intersectionRatio >= 0.5 || e.boundingClientRect.top >= 0) setOffscreen(false);
      },
      { threshold: [0, 0.25, 0.5, 1] },
    );
    io.observe(box);
    return () => {
      io.disconnect();
      setOffscreen(false);
    };
  }, [box, here, setOffscreen]);

  const slug = project.slug;
  const slot = useCallback(
    (el: HTMLDivElement | null) => {
      setSlot(slug, el);
      setBox(el);
      if (typeof heroRef === "function") heroRef(el);
      else if (heroRef) heroRef.current = el;
    },
    [slug, heroRef, setSlot],
  );

  return (
    <div
      ref={slot}
      className={cn(
        "relative aspect-video scroll-mt-3 overflow-hidden bg-[#0d0d16] sm:scroll-mt-24",
        className,
      )}
    >
      {!showing && (
        <button
          type="button"
          onClick={() => playable && play(playable)}
          disabled={!playable}
          aria-label={playable ? `Play ${project.title}` : `${project.title} (no film yet)`}
          className="group absolute inset-0 block h-full w-full text-left disabled:cursor-default"
        >
          {coverSources(project) ? (
            <Cover
              project={project}
              eager={eager}
              sizes={sizes}
              className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.015]"
            />
          ) : (
            <span className="absolute inset-0">
              <Poster title="" live />
            </span>
          )}
          <span
            aria-hidden
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(0deg, rgba(8,8,18,0.62), rgba(8,8,18,0.08) 45%, transparent 70%)",
            }}
          />
          {children}
          {here && (
            <span className="absolute left-3 top-3 flex items-center gap-2 rounded-full border border-white/30 bg-black/35 px-3 py-1.5 text-[12px] font-medium text-white backdrop-blur-md">
              <MiniIcon className="h-4 w-4" />
              Playing in the mini player
            </span>
          )}
          {playable && (
            <PlayButton className="absolute left-1/2 top-1/2 h-14 w-14 -translate-x-1/2 -translate-y-1/2 sm:h-[72px] sm:w-[72px]" />
          )}
        </button>
      )}
    </div>
  );
}

/* ---------- sorting ---------- */

/*
  Sort by: a glass button showing the current order ("Year (Newest First)",
  or just "Newest" on phones, where "Sort by:" hides too), opening a glass
  menu of the orders with a check by the current one. (lib/menu.ts)
*/
export function SortMenu({ value, onChange }: { value: SortKey; onChange: (k: SortKey) => void }) {
  const m = useMenu();
  return (
    <div ref={m.root} className="relative flex items-center gap-2.5" style={UI}>
      <span className="hidden text-sm font-medium text-black/80 sm:inline">Sort by:</span>
      <button
        ref={m.trigger}
        type="button"
        onClick={() => m.setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={m.open}
        aria-label={`Sort by: ${SORTS[value].label}`}
        className={cn(
          "flex h-9 items-center gap-1 rounded-full pl-3 pr-2 text-[13px] font-medium outline-none focus-visible:ring-2 focus-visible:ring-[#6d7bff]/50 sm:gap-1.5 sm:pl-4 sm:pr-3 sm:text-sm",
          GLASS_PILL,
        )}
      >
        <span className="whitespace-nowrap sm:hidden">{SORTS[value].short}</span>
        <span className="hidden whitespace-nowrap sm:inline">{SORTS[value].label}</span>
        <Chevron className={cn("transition-transform", m.open && "rotate-180")} />
      </button>
      {m.open && (
        <div
          role="listbox"
          aria-label="Sort by"
          className={cn(
            "absolute right-0 top-full z-30 mt-2 w-56 origin-top-right rounded-2xl p-1.5",
            GLASS_PANEL,
            MENU_IN,
          )}
        >
          {(Object.keys(SORTS) as SortKey[]).map((k) => (
            <button
              key={k}
              type="button"
              role="option"
              aria-selected={k === value}
              onClick={() => {
                onChange(k);
                m.choose();
              }}
              className="flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-left text-[14px] font-medium outline-none hover:bg-white/80 focus-visible:bg-white/80"
            >
              <Check on={k === value} />
              {SORTS[k].label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* The rules under a client's words, as on their badges */
const RULES = {
  tricolour: "linear-gradient(90deg, #ff7a1a, #ffb27a 28%, #f3f1ea 50%, #86c98a 72%, #1e8a3c)",
  sidhkofed: "linear-gradient(90deg, #ef5a1c, #f7b52a 38%, #8cc34a 68%, #1d6b2c)",
} as const;

/*
  A client in a glass pill, iPhone style: frosted translucent white over a
  blur, a bright top edge and a light catch across its upper half, a soft
  shadow. Inside, their exact emblem │ their words as on their badge (a small
  line, a big one in their colour, their rule), or for clients without a
  separate emblem their whole logo. `inline`: the emblem and big word alone,
  no pill (inside a button that's already glass).
*/
export function ClientBadge({
  client,
  inline,
  active,
}: {
  client: WorkClient;
  inline?: boolean;
  active?: boolean;
}) {
  const font = { fontFamily: '"Jost", ui-sans-serif, system-ui, sans-serif' };
  if (inline)
    return (
      <span className="flex min-w-0 items-center gap-1.5" style={font}>
        <img src={client.mark} alt="" className="h-6 w-auto shrink-0" />
        {!client.markIsLogo && (
          <span
            className="hidden truncate text-[12px] font-semibold uppercase sm:block"
            style={{ color: client.color }}
          >
            {client.big}
          </span>
        )}
      </span>
    );
  return (
    <span
      className={cn(
        "relative flex h-[48px] w-full items-center justify-center gap-1.5 overflow-hidden rounded-full px-2.5 sm:h-[52px] sm:gap-2 sm:px-3.5",
        "border border-white/80 bg-white/55 ring-1 ring-black/[0.06] backdrop-blur-xl backdrop-saturate-150",
        "shadow-[inset_0_1px_0_rgba(255,255,255,0.95),inset_0_-1px_0_rgba(20,20,60,0.05),0_8px_20px_-10px_rgba(30,30,70,0.4)]",
        active && "ring-2 ring-[#6d7bff]",
      )}
      style={font}
    >
      {/* light across the top of the glass */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-4 top-[1px] h-[45%] rounded-b-[40%] bg-gradient-to-b from-white/80 to-white/0"
      />
      {client.markIsLogo ? (
        <img
          src={client.mark}
          alt=""
          className="relative h-8 w-auto max-w-[88%] object-contain sm:h-9"
        />
      ) : (
        <>
          <img src={client.mark} alt="" className="relative h-7 w-auto shrink-0 sm:h-8" />
          <span aria-hidden className="relative h-6 w-px shrink-0 bg-[#0a0a0a]/40 sm:h-7" />
          <span className="relative min-w-0 text-left">
            {client.small && (
              <span className="line-clamp-3 text-[7px] font-medium uppercase leading-[1.15] tracking-[0.05em] text-[#0a0a0a]/85 sm:text-[7.5px]">
                {client.small}
              </span>
            )}
            <span
              className="block truncate text-[11px] font-semibold uppercase leading-[1.15] tracking-[-0.01em] sm:text-[13px] sm:tracking-normal"
              style={{ color: client.color }}
            >
              {client.big}
            </span>
            {client.rule && (
              <span
                aria-hidden
                className="mt-[3px] block h-[2px] w-full rounded-full"
                style={{ background: RULES[client.rule] }}
              />
            )}
          </span>
        </>
      )}
    </span>
  );
}

/* ⌄ */
export function Chevron({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 24 24"
      className={cn("h-4 w-4 shrink-0", className)}
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
    >
      <path d="M6 9l6 6 6-6" />
    </svg>
  );
}

/* ✓ by the chosen option (an empty space by the others, so they line up) */
export function Check({ on }: { on: boolean }) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 24 24"
      className={cn("h-4 w-4 shrink-0 text-[#4b5bff]", !on && "invisible")}
      fill="none"
      stroke="currentColor"
      strokeWidth="2.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M5 12.5l4.5 4.5L19 7.5" />
    </svg>
  );
}
