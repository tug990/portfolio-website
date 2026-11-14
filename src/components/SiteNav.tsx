import { useEffect, useRef, useState } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { SITE } from "@/content/site";
import { cn } from "@/lib/utils";
import { useStageTone } from "@/lib/stage";
import { worldOf } from "@/lib/perspective";
import { PerspectiveSwitch } from "@/components/PerspectiveMenu";

const LINKS = [
  { to: "/projects", label: "Work" },
  { to: "/about", label: "About" },
  { to: "/contact", label: "Contact" },
] as const;

/* Line icons for the phone's bar (Home, the landing, is the mark itself) */
const ICONS: Record<(typeof LINKS)[number]["to"], string> = {
  "/projects": "M4 6.5h16v11H4zM10 9.5v5l4.2-2.5z",
  "/about": "M12 21a9 9 0 100-18 9 9 0 000 18zM12 11v5.5M12 7.5v.5",
  "/contact": "M3.5 6.5h17v11h-17zM4 7l8 6 8-6",
};

/*
  The site's header. Tablets and up: a bar along the top (the logo, to the
  landing; Work / About / Contact). Phones: a floating glass bar of icons
  along the bottom, as an app's tab bar (Home: the landing; Work; About;
  Contact); the room it takes is --dock (styles.css), so pages keep room for
  it and the mini player sits above it. In a perspective's world
  (/about/<perspective>) the top bar's About becomes "About · NGO", a menu to
  change perspective (PerspectiveSwitch; phones change it from the world's own
  sticky bar). (The gallery is reached from its card
  above every footer, "Step into the light".) Both carry `data-site-nav`, so
  the landing's way in can hide them.
*/
export function SiteNav() {
  // On the home page the bar floats over the black door, then the white gallery.
  const path = useRouterState({ select: (s) => s.location.pathname });
  // the landing and the gallery: full-screen stages (light, or dark when they say so)
  const isHome = path === "/" || path === "/gallery";
  const tone = useStageTone();
  // in a perspective's world (/about/<perspective>), About becomes the menu to change it
  const world = worldOf(path);
  const onDark = isHome && tone === "dark"; // the home page is light now unless it says otherwise
  // the phone's bar: on the landing and the gallery, as they say; elsewhere it looks at what's
  // behind it and turns to dark glass with white words over a dark picture, as iPhone's does
  const bar = useRef<HTMLElement>(null);
  const behindDark = useToneBehind(bar, !isHome, path);
  const barDark = isHome ? onDark : behindDark;

  return (
    <>
      <header
        data-site-nav
        // clear of a phone's notch when it opens as an app (viewport-fit=cover)
        className="fixed inset-x-0 top-[calc(1rem+env(safe-area-inset-top))] z-30 hidden px-4 sm:block"
      >
        <nav
          className={cn(
            "relative isolate mx-auto flex h-14 max-w-5xl items-center justify-between rounded-xl border px-4 transition-colors",
            onDark
              ? "border-white/10 bg-black/40 text-white"
              : isHome
                ? "border-black/5 bg-white/80 text-black"
                : "border-black/5 bg-white/50 text-black",
          )}
        >
          {/*
            The frosted blur, as a layer behind the bar's contents (on the bar
            itself, a menu opening from it, the perspective menu, couldn't
            frost what's behind it). No blur over the 3D gallery: on phones,
            blurring a 3D scene every frame is expensive; a more solid bar
            reads just as well there.
          */}
          {!isHome && (
            <span aria-hidden className="absolute inset-0 -z-10 rounded-xl backdrop-blur-md" />
          )}
          <Link to="/" className="flex items-center gap-3" aria-label={SITE.name}>
            {/* a small copy (1.5 KB) of brand/mark-transparent.webp, which the gallery uses large */}
            <img src="/brand/mark-nav.webp" alt="" width={45} height={84} className="h-7 w-auto" />
            <span className="tracked text-[11px] font-medium">{SITE.name}</span>
          </Link>
          <ul className="flex items-center gap-6">
            {LINKS.map((l) =>
              l.to === "/about" && world ? (
                <li key={l.to}>
                  <PerspectiveSwitch current={world} variant="nav" />
                </li>
              ) : (
                <li key={l.to}>
                  <Link
                    to={l.to}
                    className={cn(
                      "tracked text-[11px] transition-colors",
                      onDark
                        ? "text-white/55 hover:text-white"
                        : "text-neutral-500 hover:text-black",
                    )}
                    activeProps={{ className: onDark ? "!text-white" : "!text-black" }}
                  >
                    {l.label}
                  </Link>
                </li>
              ),
            )}
          </ul>
        </nav>
      </header>

      {/*
        phones: the header along the bottom, a floating capsule of glass as
        iPhone's (Liquid Glass), clear of the screen's edges and the home
        indicator. Built in layers, so what's behind stays vivid: a clear,
        lightly tinted frost (`GLASS.frost`); light across the glass, brighter
        at the top and glowing at the foot (`GLASS.sheen`); a rim catching the
        light, strongest top-left and bottom-right (`GLASS.rim`), with fine
        highlights inside its edge; a soft shadow beneath. The page you're on
        sits in a small glass lens of its own (TabLink).
      */}
      <nav
        ref={bar}
        data-site-nav
        aria-label={SITE.name}
        className={cn(
          "fixed inset-x-3 bottom-[calc(env(safe-area-inset-bottom)+10px)] z-[60] isolate flex h-[60px] rounded-full px-1.5 transition-colors duration-300 sm:hidden",
          "shadow-[0_16px_36px_-14px_rgba(0,0,0,0.34),0_3px_10px_-4px_rgba(0,0,0,0.12)]",
          barDark ? "text-white" : "text-black",
        )}
      >
        {/* the frost: what's behind, blurred and a little richer, through a faint tint (darker over dark) */}
        <span
          aria-hidden
          className={cn(
            "pointer-events-none absolute inset-0 -z-10 rounded-[inherit] backdrop-saturate-[1.9] transition-[background-color,backdrop-filter] duration-300",
            // lighter blur over the 3D gallery (cheaper on a phone)
            isHome ? "backdrop-blur-md" : "backdrop-blur-[18px]",
            barDark
              ? "bg-black/[0.38] backdrop-brightness-[0.85]"
              : "bg-white/[0.22] backdrop-brightness-[1.08]",
          )}
        />
        {/* light across the glass, the rim catching the light and fine highlights inside it:
            the light glass and the dark, one fading into the other as what's behind changes */}
        {[false, true].map((dark) => (
          <span
            key={String(dark)}
            aria-hidden
            className="pointer-events-none absolute inset-0 rounded-[inherit] transition-opacity duration-300"
            style={{ opacity: dark === barDark ? 1 : 0 }}
          >
            <span
              className="absolute inset-0 -z-10 rounded-[inherit]"
              style={{ background: dark ? GLASS.sheenDark : GLASS.sheen }}
            />
            <span
              className="absolute inset-0 rounded-[inherit] p-px"
              style={{ ...GLASS.rimMask, background: dark ? GLASS.rimDark : GLASS.rim }}
            />
            <span
              className={cn(
                "absolute inset-0 rounded-[inherit]",
                dark
                  ? "shadow-[inset_0_1px_0_rgba(255,255,255,0.28),inset_0_-1px_0_rgba(255,255,255,0.08),inset_0_8px_14px_-10px_rgba(255,255,255,0.25)]"
                  : "shadow-[inset_0_1px_0_rgba(255,255,255,0.95),inset_0_-1px_0_rgba(255,255,255,0.4),inset_0_10px_16px_-12px_rgba(255,255,255,0.7),inset_0_-10px_16px_-12px_rgba(255,255,255,0.45)]",
              )}
            />
          </span>
        ))}
        <TabLink to="/" label="Home" on={path === "/"} onDark={barDark}>
          <img
            src="/brand/mark-nav.webp"
            alt=""
            width={45}
            height={84}
            className={cn(
              "h-[22px] w-auto transition",
              // not the page you're on: grey, or white over dark
              path !== "/" && (barDark ? "opacity-80 brightness-0 invert" : "opacity-60 grayscale"),
            )}
          />
        </TabLink>
        {LINKS.map((l) => (
          <TabLink key={l.to} to={l.to} label={l.label} on={path.startsWith(l.to)} onDark={barDark}>
            <svg
              aria-hidden
              viewBox="0 0 24 24"
              className="h-[22px] w-[22px]"
              fill="none"
              stroke="currentColor"
              strokeWidth={path.startsWith(l.to) ? 2 : 1.6}
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d={ICONS[l.to]} />
            </svg>
          </TabLink>
        ))}
      </nav>
    </>
  );
}

/*
  The phone bar's glass (as iPhone's): the light across it, and its rim (a
  gradient border, drawn with a mask so only the 1 px edge shows).
*/
const GLASS = {
  sheen:
    "linear-gradient(180deg, rgba(255,255,255,0.42) 0%, rgba(255,255,255,0.12) 38%, rgba(255,255,255,0.04) 62%, rgba(255,255,255,0.2) 100%)",
  sheenDark:
    "linear-gradient(180deg, rgba(255,255,255,0.14) 0%, rgba(255,255,255,0.03) 40%, rgba(255,255,255,0) 62%, rgba(255,255,255,0.06) 100%)",
  rim: "linear-gradient(135deg, rgba(255,255,255,1) 0%, rgba(255,255,255,0.35) 28%, rgba(255,255,255,0.12) 55%, rgba(255,255,255,0.75) 100%)",
  rimDark:
    "linear-gradient(135deg, rgba(255,255,255,0.5) 0%, rgba(255,255,255,0.12) 30%, rgba(255,255,255,0.05) 55%, rgba(255,255,255,0.3) 100%)",
  rimMask: {
    WebkitMask: "linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)",
    WebkitMaskComposite: "xor",
    mask: "linear-gradient(#000 0 0) content-box exclude, linear-gradient(#000 0 0)",
  },
} as const;

function TabLink({
  to,
  label,
  on,
  onDark,
  children,
}: {
  to: "/" | (typeof LINKS)[number]["to"];
  label: string;
  on: boolean;
  onDark: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      to={to}
      aria-current={on ? "page" : undefined}
      className={cn(
        "press relative flex flex-1 flex-col items-center justify-center gap-1 transition-colors",
        on
          ? onDark
            ? "text-white"
            : "text-black"
          : onDark
            ? "text-white/75 [text-shadow:0_1px_2px_rgba(0,0,0,0.35)]"
            : "text-black/65 [text-shadow:0_1px_0_rgba(255,255,255,0.35)]",
      )}
    >
      {/* the page you're on: a small lens of glass inside the bar */}
      {on && (
        <span
          aria-hidden
          className={cn(
            "pointer-events-none absolute inset-x-1 inset-y-[5px] -z-10 rounded-full",
            onDark
              ? "bg-white/[0.12] shadow-[inset_0_1px_0_rgba(255,255,255,0.3),inset_0_0_0_0.5px_rgba(255,255,255,0.18)]"
              : "bg-white/[0.42] shadow-[inset_0_1px_0_rgba(255,255,255,1),inset_0_-1px_0_rgba(255,255,255,0.5),inset_0_0_0_0.5px_rgba(255,255,255,0.7),0_2px_8px_-3px_rgba(0,0,0,0.12)]",
          )}
        />
      )}
      {children}
      <span className="tracked text-[8.5px]">{label}</span>
      {/* a line of prism light under the page you're on */}
      <span
        aria-hidden
        className={cn(
          "h-[2px] w-5 rounded-full transition-opacity",
          on ? "opacity-100" : "opacity-0",
        )}
        style={{ background: "var(--prism)" }}
      />
    </Link>
  );
}

/*
  What's behind the phone's bar, light or dark (as iPhone's glass turns dark
  over a dark picture). Looked at where the four tabs are: the topmost thing
  under each that paints there decides: a part marked data-tone="dark" or
  "light"; a photograph (the pixel under the tab, read from a small copy of
  it, placed as object-fit and object-position place it); a film (dark); a
  solid colour; nothing, the page's white. A drawing (a canvas) is passed
  over for the photograph under it, which shows the same picture. Most of the
  four wins (a tie keeps how it was); checked as you scroll, and twice a
  second for what moves by itself. Phones only.
*/
const TONE = { dark: 0.6 }; // below this brightness (0 to 1), what's behind counts as dark

function useToneBehind(bar: React.RefObject<HTMLElement | null>, enabled: boolean, path: string) {
  const [dark, setDark] = useState(false);
  useEffect(() => {
    if (!enabled) {
      setDark(false);
      return;
    }
    const phone = window.matchMedia("(max-width: 639px)");
    let raf = 0;
    const check = () => {
      raf = 0;
      const el = bar.current;
      if (!el || !phone.matches) return setDark(false);
      const r = el.getBoundingClientRect();
      let d = 0;
      let l = 0;
      for (const f of [0.14, 0.38, 0.62, 0.86]) {
        if (toneAt(r.left + r.width * f, r.top + r.height / 2) === "dark") d++;
        else l++;
      }
      setDark((was) => (d === l ? was : d > l));
    };
    const kick = () => {
      if (!raf) raf = requestAnimationFrame(check);
    };
    kick();
    window.addEventListener("scroll", kick, { passive: true });
    window.addEventListener("resize", kick);
    const timer = window.setInterval(kick, 500);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", kick);
      window.removeEventListener("resize", kick);
      clearInterval(timer);
    };
  }, [bar, enabled, path]);
  return dark;
}

const luma = (r: number, g: number, b: number) => (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;

function toneAt(x: number, y: number): "dark" | "light" {
  for (const el of document.elementsFromPoint(x, y)) {
    if (el.closest("[data-site-nav]")) continue;
    const marked = el.closest<HTMLElement>("[data-tone]");
    if (marked) return marked.dataset.tone === "dark" ? "dark" : "light";
    if (el instanceof HTMLCanvasElement) continue;
    if (el instanceof HTMLImageElement) {
      const v = pixelLuma(el, x, y);
      if (v !== null) return v < TONE.dark ? "dark" : "light";
      continue;
    }
    if (el instanceof HTMLVideoElement || el instanceof HTMLIFrameElement) return "dark";
    const c = getComputedStyle(el).backgroundColor.match(/[\d.]+/g);
    if (c && (c[3] === undefined ? 1 : +c[3]) >= 0.5) {
      return luma(+c[0], +c[1], +c[2]) < TONE.dark ? "dark" : "light";
    }
  }
  return "light";
}

// small copies of the photographs looked at (null: another site's, which can't be read)
const copies = new Map<string, { data: Uint8ClampedArray; w: number; h: number } | null>();

function pixelLuma(img: HTMLImageElement, x: number, y: number): number | null {
  const src = img.currentSrc || img.src;
  const nw = img.naturalWidth;
  const nh = img.naturalHeight;
  if (!src || !img.complete || !nw || !nh) return null;
  let copy = copies.get(src);
  if (copy === undefined) {
    try {
      const w = 64;
      const h = Math.max(1, Math.round((w * nh) / nw));
      const cv = document.createElement("canvas");
      cv.width = w;
      cv.height = h;
      const ctx = cv.getContext("2d", { willReadFrequently: true })!;
      ctx.drawImage(img, 0, 0, w, h);
      copy = { data: ctx.getImageData(0, 0, w, h).data, w, h };
    } catch {
      copy = null;
    }
    copies.set(src, copy);
  }
  if (!copy) return null;
  // where (x, y) falls in the picture, as object-fit and object-position place it
  const r = img.getBoundingClientRect();
  const cs = getComputedStyle(img);
  let sx = r.width / nw;
  let sy = r.height / nh;
  if (cs.objectFit === "cover") sx = sy = Math.max(sx, sy);
  else if (cs.objectFit === "contain" || cs.objectFit === "scale-down") sx = sy = Math.min(sx, sy);
  const [px = "50%", py = "50%"] = cs.objectPosition.split(" ");
  const off = (v: string, room: number) =>
    v.endsWith("%") ? (parseFloat(v) / 100) * room : parseFloat(v) || 0;
  const u = (x - r.left - off(px, r.width - nw * sx)) / (nw * sx);
  const v = (y - r.top - off(py, r.height - nh * sy)) / (nh * sy);
  if (u < 0 || u > 1 || v < 0 || v > 1) return null;
  // a few pixels round the point
  let sum = 0;
  let n = 0;
  const cx = Math.round(u * (copy.w - 1));
  const cy = Math.round(v * (copy.h - 1));
  for (let j = -1; j <= 1; j++) {
    for (let i = -1; i <= 1; i++) {
      const X = Math.min(copy.w - 1, Math.max(0, cx + i));
      const Y = Math.min(copy.h - 1, Math.max(0, cy + j));
      const k = (Y * copy.w + X) * 4;
      if (copy.data[k + 3] < 128) continue;
      sum += luma(copy.data[k], copy.data[k + 1], copy.data[k + 2]);
      n++;
    }
  }
  return n ? sum / n : null;
}
