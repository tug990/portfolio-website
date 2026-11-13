import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "@tanstack/react-router";
import { usePlayer, type Film } from "@/lib/player";
import { GLASS_PANEL } from "@/lib/menu";
import { YT_HOST, loadYouTubeApi, type YTPlayer } from "@/lib/youtube";
import { cn } from "@/lib/utils";

/*
  The film player (state in lib/player.tsx), drawn once for the whole site.

  Docked: over its film page's hero, the same size and place, with YouTube's
  own controls (or the browser's, for a video file).
  Mini (after leaving the page, or "Mini player"): a glass card in the
  bottom-right corner (on phones, a bar along the bottom): the film, a
  progress line, its title and client, play / pause and close. Pressing the
  film or its title opens its page again; it carries on from where it was.

  Like YouTube on a phone: the film shrinks into the bar and grows back out
  of it (on every screen size); on phones, a ⌄ on the playing film (tap it
  or swipe down on it) minimises it, going to the Work page; and the bar can
  be swiped: up opens the film, down or sideways closes it.
*/

const PHONE = "(max-width: 639px)";
const isPhone = () => window.matchMedia(PHONE).matches;

export function MiniPlayer() {
  const { film } = usePlayer();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted || !film) return null;
  // a new film gets a new player
  return createPortal(<Player key={film.slug} film={film} />, document.body);
}

/* The nearest fixed ancestor (the sheet over the gallery), if any. */
function fixedAncestor(el: HTMLElement) {
  for (let p = el.parentElement; p && p !== document.body; p = p.parentElement) {
    if (getComputedStyle(p).position === "fixed") return p;
  }
  return null;
}

function Player({ film }: { film: Film }) {
  const { slot, docked, close, minimise } = usePlayer();
  const navigate = useNavigate();
  const box = useRef<HTMLDivElement>(null);
  const screen = useRef<HTMLDivElement>(null);
  /* where the film was last drawn, for the shrink / grow animation */
  const lastRect = useRef<DOMRect | null>(null);
  const [inSheet, setInSheet] = useState(false);
  const media = useMedia(film, docked);

  // Docked: keep the player exactly over the slot, every frame (it scrolls,
  // resizes, animates). On the page it's placed in page coordinates, so it
  // scrolls with the page; in the sheet, on screen and cut to the sheet.
  useLayoutEffect(() => {
    const el = box.current;
    if (!el) return;
    if (!docked || !slot) {
      el.style.cssText = "";
      return;
    }
    const sheet = fixedAncestor(slot.el);
    setInSheet(!!sheet);
    let raf = 0;
    let lastW = -1;
    const place = () => {
      const r = slot.el.getBoundingClientRect();
      const s = el.style;
      if (sheet) {
        const c = sheet.getBoundingClientRect();
        s.position = "fixed";
        s.top = `${r.top}px`;
        s.left = `${r.left}px`;
        s.clipPath = `inset(${Math.max(0, c.top - r.top)}px ${Math.max(0, r.right - c.right)}px ${Math.max(0, r.bottom - c.bottom)}px ${Math.max(0, c.left - r.left)}px)`;
      } else {
        s.position = "absolute";
        s.top = `${r.top + window.scrollY}px`;
        s.left = `${r.left + window.scrollX}px`;
      }
      s.width = `${r.width}px`;
      s.height = `${r.height}px`;
      lastRect.current = r;
      if (r.width !== lastW) {
        lastW = r.width;
        s.borderRadius = getComputedStyle(slot.el).borderRadius;
      }
      raf = requestAnimationFrame(place);
    };
    place();
    sheet?.addEventListener("scroll", place, { passive: true });
    return () => {
      cancelAnimationFrame(raf);
      sheet?.removeEventListener("scroll", place);
      el.style.cssText = "";
    };
  }, [docked, slot]);

  // Shrinking into the mini player and growing back: the film flies from
  // where it was to where it is now (FLIP). Growing, the whole player flies
  // (it's the film); shrinking, just the film, into its place in the bar.
  const firstRun = useRef(true);
  useLayoutEffect(() => {
    const target = docked ? box.current : screen.current;
    if (!target || !screen.current) return;
    const from = lastRect.current;
    const to = target.getBoundingClientRect();
    lastRect.current = screen.current.getBoundingClientRect();
    if (firstRun.current) {
      firstRun.current = false;
      return;
    }
    if (!from || !to.width || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const fromT = `translate(${from.left - to.left}px, ${from.top - to.top}px) scale(${from.width / to.width}, ${from.height / to.height})`;
    target.animate(
      [
        { transform: fromT, transformOrigin: "0 0" },
        { transform: "none", transformOrigin: "0 0" },
      ],
      { duration: 380, easing: "cubic-bezier(0.2, 0.8, 0.2, 1)" },
    );
  }, [docked]);

  // Phones: swiping the bar. Up opens the film; down or sideways closes it.
  const drag = useRef<{ x: number; y: number; id: number; axis?: "x" | "y" } | null>(null);
  const dragged = useRef(false);
  const grab = useRef<number | null>(null);
  const swipe = {
    onPointerDown: (e: React.PointerEvent) => {
      dragged.current = false;
      if (docked || !isPhone()) return;
      drag.current = { x: e.clientX, y: e.clientY, id: e.pointerId };
    },
    onPointerMove: (e: React.PointerEvent) => {
      const d = drag.current;
      const el = box.current;
      if (docked || !d || !el) return;
      const dx = e.clientX - d.x;
      const dy = e.clientY - d.y;
      if (!d.axis) {
        if (Math.hypot(dx, dy) < 8) return;
        d.axis = Math.abs(dx) > Math.abs(dy) ? "x" : "y";
        dragged.current = true;
        try {
          el.setPointerCapture(d.id);
        } catch {
          /* the pointer is already gone */
        }
      }
      // up is held back (it opens), down and sideways follow the finger and fade
      const ty = d.axis === "y" ? (dy < 0 ? dy * 0.35 : dy) : 0;
      const tx = d.axis === "x" ? dx : 0;
      el.style.transform = `translate(${tx}px, ${ty}px)`;
      el.style.opacity = String(1 - Math.min(0.7, Math.max(Math.abs(tx), Math.max(0, ty)) / 220));
    },
    onPointerUp: (e: React.PointerEvent) => {
      const d = drag.current;
      const el = box.current;
      if (docked) return;
      drag.current = null;
      if (!d?.axis || !el) return;
      // the tap a swipe may end in is ignored (onClickCapture), then taps work again
      window.setTimeout(() => (dragged.current = false), 0);
      const dx = e.clientX - d.x;
      const dy = e.clientY - d.y;
      const reset = () => {
        el.style.transform = "";
        el.style.opacity = "";
      };
      if (d.axis === "y" && dy < -40) {
        reset();
        expand();
      } else if ((d.axis === "y" && dy > 40) || (d.axis === "x" && Math.abs(dx) > 90)) {
        const out = d.axis === "y" ? "translateY(120%)" : `translateX(${dx > 0 ? 110 : -110}%)`;
        el.animate([{ transform: out, opacity: 0 }], {
          duration: 200,
          easing: "ease-in",
          fill: "forwards",
        }).finished.then(close, close);
      } else {
        el.animate([{ transform: "none", opacity: 1 }], {
          duration: 200,
          easing: "ease-out",
        }).finished.then(reset, reset);
      }
    },
    onPointerCancel: () => {
      if (docked) return;
      drag.current = null;
      if (box.current) {
        box.current.style.transform = "";
        box.current.style.opacity = "";
      }
    },
    // a swipe isn't a tap on what it started on
    onClickCapture: (e: React.MouseEvent) => {
      if (!dragged.current) return;
      dragged.current = false;
      e.preventDefault();
      e.stopPropagation();
    },
  };

  // Phones: room under the page for the bar, so it never hides the end of it
  useEffect(() => {
    const el = box.current;
    if (docked || !el || !isPhone()) return;
    const before = document.body.style.paddingBottom;
    document.body.style.paddingBottom = `${el.offsetHeight + 16}px`;
    return () => {
      document.body.style.paddingBottom = before;
    };
  }, [docked]);

  function expand() {
    navigate({ to: "/projects/$slug", params: { slug: film.slug } });
  }

  const progress = media.duration ? Math.min(1, media.time / media.duration) : 0;
  const btn =
    "grid h-9 w-9 shrink-0 place-items-center rounded-full text-[#1b2350] transition hover:bg-black/[0.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/25";

  return (
    <div
      ref={box}
      role="region"
      aria-label={docked ? `${film.title}, playing` : `Mini player: ${film.title}`}
      {...swipe}
      className={cn(
        docked
          ? cn("overflow-hidden bg-black", inSheet ? "z-[71]" : "z-20")
          : cn(
              GLASS_PANEL,
              "fixed inset-x-2 bottom-[calc(0.5rem+env(safe-area-inset-bottom))] z-[80] flex touch-none items-center gap-2.5 rounded-2xl p-1.5 sm:touch-auto",
              "sm:inset-x-auto sm:bottom-5 sm:right-5 sm:block sm:w-[340px]",
            ),
      )}
    >
      {/* the film: one element in every mode, so it never reloads */}
      <div
        ref={screen}
        className={cn(
          "relative overflow-hidden bg-black",
          docked
            ? "h-full w-full"
            : "aspect-video w-[118px] shrink-0 rounded-[10px] sm:w-full sm:rounded-xl",
        )}
      >
        {media.element}
        {/* phones: ⌄ minimises (tap, or swipe down on it), like YouTube's */}
        {docked && (
          <button
            type="button"
            aria-label="Minimise to the mini player"
            onClick={minimise}
            onPointerDown={(e) => (grab.current = e.clientY)}
            onPointerUp={(e) => {
              if (grab.current !== null && e.clientY - grab.current > 20) minimise();
              grab.current = null;
            }}
            className="absolute left-0 top-0 z-10 h-14 w-1/2 touch-none sm:hidden"
          >
            <span className="absolute left-2 top-2 grid h-8 w-8 place-items-center rounded-full border border-white/25 bg-black/40 text-white backdrop-blur-md">
              <svg
                aria-hidden
                viewBox="0 0 24 24"
                className="h-5 w-5"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M6 9l6 6 6-6" />
              </svg>
            </span>
          </button>
        )}
        {!docked && (
          <>
            {/* the cover while it isn't playing (it hides YouTube's own buttons) */}
            {film.cover && (
              <img
                src={film.cover}
                alt=""
                className={cn(
                  "pointer-events-none absolute inset-0 h-full w-full object-cover transition-opacity duration-500",
                  media.playing && "opacity-0",
                )}
              />
            )}
            {/* the film itself opens its page (on wide screens, an icon shows on hover) */}
            <button
              type="button"
              onClick={expand}
              aria-label={`Open ${film.title}`}
              className="group absolute inset-0 grid place-items-center outline-none transition hover:bg-black/35 focus-visible:bg-black/35"
            >
              <svg
                aria-hidden
                viewBox="0 0 24 24"
                className="hidden h-7 w-7 text-white opacity-0 drop-shadow transition group-hover:opacity-100 group-focus-visible:opacity-100 sm:block"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M15 4h5v5M20 4l-7 7M9 20H4v-5M4 20l7-7" />
              </svg>
            </button>
            <span
              aria-hidden
              className="pointer-events-none absolute inset-x-0 bottom-0 h-[3px] bg-white/30"
            >
              <span className="block h-full bg-[#ff3d1f]" style={{ width: `${progress * 100}%` }} />
            </span>
          </>
        )}
      </div>

      {!docked && (
        <div className="flex min-w-0 flex-1 items-center gap-0.5 duration-300 animate-in fade-in sm:mt-1.5 sm:px-1.5 sm:pb-0.5">
          <button
            type="button"
            onClick={expand}
            className="min-w-0 flex-1 text-left text-[#1b2350] outline-none focus-visible:underline"
          >
            <span className="block truncate text-[13px] font-semibold leading-tight">
              {film.title}
            </span>
            {film.client && (
              <span className="mt-0.5 block truncate text-[11px] leading-tight text-[#1b2350]/65">
                {film.client}
              </span>
            )}
          </button>
          <button
            type="button"
            onClick={media.toggle}
            aria-label={media.playing ? "Pause" : "Play"}
            className={btn}
          >
            <svg aria-hidden viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
              {media.playing ? (
                <>
                  <rect x="6.5" y="5" width="3.6" height="14" rx="1" />
                  <rect x="13.9" y="5" width="3.6" height="14" rx="1" />
                </>
              ) : (
                <path d="M8 5v14l11-7z" />
              )}
            </svg>
          </button>
          <button type="button" onClick={close} aria-label="Close the mini player" className={btn}>
            <svg
              aria-hidden
              viewBox="0 0 24 24"
              className="h-[18px] w-[18px]"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            >
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
}

/* The film itself, a YouTube player or a video file, and what the mini controls need. */
function useMedia(film: Film, docked: boolean) {
  const [playing, setPlaying] = useState(false);
  const [time, setTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const host = useRef<HTMLDivElement>(null);
  const yt = useRef<YTPlayer | null>(null);
  const video = useRef<HTMLVideoElement>(null);

  // YouTube, through its IFrame API, with sound and its own controls
  useEffect(() => {
    const el = host.current;
    if (!film.youtube || !el) return;
    let cancelled = false;
    let poll = 0;
    // YouTube replaces the element it's given, so give it one React doesn't own
    const mount = document.createElement("div");
    el.appendChild(mount);
    loadYouTubeApi()
      .then((YT) => {
        if (cancelled) return;
        yt.current = new YT.Player(mount, {
          videoId: film.youtube!,
          host: YT_HOST,
          width: "100%",
          height: "100%",
          playerVars: { autoplay: 1, playsinline: 1, rel: 0, modestbranding: 1, iv_load_policy: 3 },
          events: {
            onReady: () => {
              if (cancelled) return;
              yt.current?.playVideo();
              poll = window.setInterval(() => {
                const p = yt.current;
                if (!p) return;
                const on = p.getPlayerState() === 1;
                setPlaying(on);
                setTime(p.getCurrentTime());
                setDuration(p.getDuration());
              }, 400);
            },
          },
        });
      })
      .catch(() => {
        /* no YouTube (offline, blocked): the cover stays */
      });
    return () => {
      cancelled = true;
      window.clearInterval(poll);
      yt.current?.destroy();
      yt.current = null;
      mount.remove();
    };
  }, [film.youtube]);

  const toggle = () => {
    const p = yt.current;
    if (p) {
      if (p.getPlayerState() === 1) p.pauseVideo();
      else p.playVideo();
      return;
    }
    const v = video.current;
    if (v) {
      if (v.paused) v.play().catch(() => {});
      else v.pause();
    }
  };

  const element = film.youtube ? (
    <div
      ref={host}
      className="absolute inset-0 [&_iframe]:h-full [&_iframe]:w-full [&_iframe]:border-0"
    />
  ) : (
    <video
      ref={video}
      src={film.file}
      poster={film.cover}
      autoPlay
      playsInline
      controls={docked}
      onPlay={() => setPlaying(true)}
      onPause={() => setPlaying(false)}
      onTimeUpdate={(e) => setTime(e.currentTarget.currentTime)}
      onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
      aria-label={film.title}
      className="absolute inset-0 h-full w-full bg-black object-contain"
    />
  );

  return { element, playing, time, duration, toggle };
}
