import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "@tanstack/react-router";
import { usePlayer, type Film, type FilmClock } from "@/lib/player";
import { GLASS_PANEL } from "@/lib/menu";
import { YT_HOST, loadYouTubeApi, type YTPlayer } from "@/lib/youtube";
import { ScrubFrame } from "@/components/work/ScrubFrame";
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

  Keyboard, as on YouTube (when you're not typing): Space or K play / pause,
  J / L back / ahead 10 s, ← / → 5 s, 0–9 jump to that tenth, M mute,
  F full screen, I mini player, ? the list of them (ShortcutsPanel). Each
  shows a small sign over the film for a moment.

  Full screen: F (or the button) fills the screen and turns a phone to
  landscape by itself: the browser's full screen, locked to landscape where
  the browser allows (Android); where it doesn't (iPhone), the film is drawn
  turned on its side across the upright screen, filling it, ready to watch
  with the phone held sideways. Turning a phone to landscape while a film
  plays on its page fills the screen with it too, as YouTube's app does;
  turning back, or the ⌄, returns it. On a phone, dragging the playing film
  down minimises it, as on YouTube.
*/

const PHONE = "(max-width: 639px)";
const isPhone = () => window.matchMedia(PHONE).matches;
/* a phone held sideways */
const LANDSCAPE_PHONE = "(orientation: landscape) and (max-height: 520px) and (pointer: coarse)";
/* how long YouTube shows its own title, channel and logo when a film starts, resumes or
   replays on iPhone (ms): measured at 3.1 to 4.4 s, so a little longer */
const FRESH = 4500;
/* a phone held upright */
const PORTRAIT_PHONE = "(orientation: portrait) and (max-width: 520px) and (pointer: coarse)";

/* Opens the list of keyboard shortcuts (the film page's "Shortcuts" button). */
export const openShortcuts = () => window.dispatchEvent(new Event("insight:shortcuts"));

/* typing somewhere: the keys are the text's, not the player's */
const typing = (t: EventTarget | null) =>
  t instanceof HTMLElement && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName));

export function MiniPlayer() {
  const { film } = usePlayer();
  const [mounted, setMounted] = useState(false);
  const [keys, setKeys] = useState(false);
  useEffect(() => setMounted(true), []);
  // ? (or the Shortcuts button) opens the list
  useEffect(() => {
    const open = () => setKeys(true);
    const key = (e: KeyboardEvent) => {
      if (e.key === "?" && !typing(e.target)) {
        e.preventDefault();
        setKeys((k) => !k);
      }
    };
    window.addEventListener("insight:shortcuts", open);
    window.addEventListener("keydown", key);
    return () => {
      window.removeEventListener("insight:shortcuts", open);
      window.removeEventListener("keydown", key);
    };
  }, []);
  if (!mounted) return null;
  return createPortal(
    <>
      {/* a new film gets a new player */}
      {film && <Player key={film.slug} film={film} />}
      {keys && <ShortcutsPanel onClose={() => setKeys(false)} />}
    </>,
    document.body,
  );
}

const SHORTCUTS: [string[], string][] = [
  [["Space", "K"], "Play / pause"],
  [["J"], "Back 10 seconds"],
  [["L"], "Ahead 10 seconds"],
  [["←", "→"], "Back / ahead 5 seconds"],
  [["0–9"], "Jump to 0% … 90%"],
  [["M"], "Sound off / on"],
  [["F"], "Full screen"],
  [["I"], "Mini player"],
  [["?"], "These shortcuts"],
];

/* The keyboard shortcuts, in a glass panel. */
function ShortcutsPanel({ onClose }: { onClose: () => void }) {
  useEffect(() => {
    const key = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, [onClose]);
  return (
    <div className="fixed inset-0 z-[95] grid place-items-center p-4">
      <button
        type="button"
        aria-label="Close"
        tabIndex={-1}
        onClick={onClose}
        className="absolute inset-0 bg-black/25 backdrop-blur-[2px] duration-200 animate-in fade-in"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Keyboard shortcuts"
        className={cn(
          "relative w-full max-w-[380px] rounded-3xl p-5 text-[#0a0a0a] duration-200 animate-in fade-in zoom-in-95",
          GLASS_PANEL,
          "bg-white/80",
        )}
        style={{ fontFamily: '"Jost", ui-sans-serif, system-ui, sans-serif' }}
      >
        <div className="flex items-center justify-between">
          <h2 className="tracked text-[13px] font-light">Keyboard shortcuts</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            autoFocus
            className="grid h-8 w-8 place-items-center rounded-full hover:bg-black/[0.06]"
          >
            <svg
              aria-hidden
              viewBox="0 0 24 24"
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
            >
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>
        <dl className="mt-3 divide-y divide-black/[0.06]">
          {SHORTCUTS.map(([ks, what]) => (
            <div key={what} className="flex items-center justify-between py-2 text-[14px]">
              <dt>{what}</dt>
              <dd className="flex gap-1">
                {ks.map((k) => (
                  <kbd
                    key={k}
                    className="min-w-[26px] rounded-md border border-black/10 bg-white px-1.5 py-0.5 text-center text-[12px] font-medium shadow-[0_1px_0_rgba(0,0,0,0.08)]"
                  >
                    {k}
                  </kbd>
                ))}
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </div>
  );
}

/* The nearest fixed ancestor (the sheet over the gallery), if any. */
function fixedAncestor(el: HTMLElement) {
  for (let p = el.parentElement; p && p !== document.body; p = p.parentElement) {
    if (getComputedStyle(p).position === "fixed") return p;
  }
  return null;
}

function Player({ film }: { film: Film }) {
  const { slot, docked, close, minimise, play, setAmbient } = usePlayer();
  const navigate = useNavigate();
  const box = useRef<HTMLDivElement>(null);
  const screen = useRef<HTMLDivElement>(null);
  /* where the film was last drawn, for the shrink / grow animation */
  const lastRect = useRef<DOMRect | null>(null);
  const [inSheet, setInSheet] = useState(false);
  const media = useMedia(film);

  // The film's light, for the page around it (WorkUI.tsx Ambient), while its own page is open
  // and it has started (floated to the corner as you scroll down it too, so the page stays dim):
  // YouTube's picture of the film near where it's at (a quarter, half, three quarters
  // through), or a video file itself, read live.
  const part = media.duration ? media.time / media.duration : 0;
  const frame = film.youtube
    ? `https://i.ytimg.com/vi/${film.youtube}/hq${part < 0.375 ? 1 : part < 0.625 ? 2 : 3}.jpg`
    : undefined;
  const videoRef = media.videoRef;
  const onItsPage = slot?.slug === film.slug;
  // (the film's clock, one for its life, so a copy of it can keep in step)
  const mediaNow = useRef(media);
  mediaNow.current = media;
  const [clock] = useState<FilmClock>(() => ({
    now: () => mediaNow.current.now(),
    playing: () => mediaNow.current.isPlaying(),
  }));
  useEffect(() => {
    if (!onItsPage || !media.started) setAmbient(null);
    else if (frame) setAmbient({ frame, youtube: film.youtube, clock });
    else if (videoRef.current) setAmbient({ video: videoRef.current, clock });
  }, [onItsPage, media.started, frame, film.youtube, clock, videoRef, setAmbient]);
  useEffect(() => () => setAmbient(null), [setAmbient]);

  // Full screen without asking the browser: a phone turned sideways while the
  // film plays on its page (rotated), or F where the browser has no full
  // screen for it (forced, iPhone). The ⌄ there, or turning back, ends it.
  const [rotated, setRotated] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [forced, setForced] = useState(false);
  useEffect(() => {
    const q = window.matchMedia(LANDSCAPE_PHONE);
    const apply = () => {
      setRotated(q.matches);
      setDismissed(false);
      if (!q.matches) setForced(false);
    };
    apply();
    q.addEventListener("change", apply);
    return () => q.removeEventListener("change", apply);
  }, []);
  const full = docked && ((rotated && !dismissed) || forced);
  // full screen on an upright phone: the film drawn on its side, filling the screen
  const [upright, setUpright] = useState(false);
  useEffect(() => {
    const q = window.matchMedia(PORTRAIT_PHONE);
    const apply = () => setUpright(q.matches);
    apply();
    q.addEventListener("change", apply);
    return () => q.removeEventListener("change", apply);
  }, []);
  const turned = full && upright;
  /* the browser's full screen is on (for the icon) */
  const [fsOn, setFsOn] = useState(false);
  useEffect(() => {
    if (!full) return;
    const before = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = before;
    };
  }, [full]);

  // The browser's full screen (F, or YouTube's own button): turn a phone to
  // landscape while it lasts, where the browser lets a page do that.
  useEffect(() => {
    const change = () => {
      const o = window.screen.orientation as ScreenOrientation & {
        lock?: (o: string) => Promise<void>;
      };
      if (document.fullscreenElement && box.current?.contains(document.fullscreenElement)) {
        // an upright phone that can't be turned to landscape: our own full screen, on its side
        const cannot = () => {
          if (!window.matchMedia(PORTRAIT_PHONE).matches) return;
          document.exitFullscreen().catch(() => {});
          setForced(true);
        };
        if (o?.lock) o.lock("landscape").catch(cannot);
        else cannot();
      } else {
        try {
          o?.unlock?.();
        } catch {
          /* nothing was locked */
        }
      }
    };
    const track = () => setFsOn(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", change);
    document.addEventListener("fullscreenchange", track);
    return () => {
      document.removeEventListener("fullscreenchange", change);
      document.removeEventListener("fullscreenchange", track);
    };
  }, []);

  const fullscreen = () => {
    const el = screen.current as (HTMLDivElement & { webkitRequestFullscreen?: () => void }) | null;
    if (!el) return;
    if (document.fullscreenElement) return void document.exitFullscreen().catch(() => {});
    if (full) return (setForced(false), setDismissed(true));
    if (!docked) return expand();
    if (el.requestFullscreen) el.requestFullscreen().catch(() => setForced(true));
    else if (el.webkitRequestFullscreen) el.webkitRequestFullscreen();
    else setForced(true);
  };

  // A small sign over the film for a moment ("+10 s", "Sound off"…), as YouTube shows
  const [sign, setSign] = useState<{ text: string; n: number } | null>(null);
  useEffect(() => {
    if (!sign) return;
    const t = window.setTimeout(() => setSign(null), 700);
    return () => window.clearTimeout(t);
  }, [sign]);
  const flash = (text: string) => setSign((s) => ({ text, n: (s?.n ?? 0) + 1 }));

  // The keyboard (see the top). Kept in a ref so it always sees the latest state.
  const onKey = useRef<(e: KeyboardEvent) => void>(() => {});
  onKey.current = (e) => {
    if (e.metaKey || e.ctrlKey || e.altKey || typing(e.target)) return;
    const t = e.target as HTMLElement;
    const k = e.key.length === 1 ? e.key.toLowerCase() : e.key;
    const act = (fn: () => void, text?: string) => {
      e.preventDefault();
      fn();
      if (text) flash(text);
    };
    const by = (d: number) => {
      const len = media.length();
      media.seek(Math.min(Math.max(0, media.now() + d), len ? len - 0.5 : Infinity));
    };
    if (k === "k" || (k === " " && !t.closest?.("button, a, [role=slider], [role=option]")))
      return act(media.toggle, media.isPlaying() ? "Paused" : "Playing");
    if (k === "j") return act(() => by(-10), "−10 s");
    if (k === "l") return act(() => by(10), "+10 s");
    if (k === "ArrowLeft") return act(() => by(-5), "−5 s");
    if (k === "ArrowRight") return act(() => by(5), "+5 s");
    if (/^[0-9]$/.test(k))
      return act(() => media.seek((Number(k) / 10) * media.length()), `${k}0%`);
    if (k === "m") return act(() => flash(media.toggleMute() ? "Sound off" : "Sound on"));
    if (k === "f") return act(fullscreen);
    if (k === "i") return act(() => (docked ? minimise() : expand()));
  };
  useEffect(() => {
    const key = (e: KeyboardEvent) => onKey.current(e);
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, []);

  // In the corner the film is drawn at a normal player's size and scaled down
  // to fit: YouTube crowds a tiny player with its own buttons, a normal one not.
  const STAGE = 480;
  const [scale, setScale] = useState(1);
  useEffect(() => {
    const el = screen.current;
    if (!el || docked) return;
    const fit = () => setScale(el.clientWidth / STAGE);
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(el);
    return () => ro.disconnect();
  }, [docked]);

  // Docked: keep the player exactly over the slot, every frame (it scrolls,
  // resizes, animates). On the page it's placed in page coordinates, so it
  // scrolls with the page; in the sheet, on screen and cut to the sheet.
  useLayoutEffect(() => {
    const el = box.current;
    if (!el) return;
    if (!docked || !slot || full) {
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
      if (!pulling.current) lastRect.current = r;
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
  }, [docked, slot, full]);

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
  // And the playing film on its page: dragged down, it shrinks after the
  // finger and, let go far enough, minimises (as YouTube's does).
  const drag = useRef<{ x: number; y: number; id: number; axis?: "x" | "y" } | null>(null);
  const dragged = useRef(false);
  const grab = useRef<number | null>(null);
  /* the playing film is being dragged down (its last place is kept for the flight) */
  const pulling = useRef(false);
  const pull = {
    down: (e: React.PointerEvent) => {
      const on = (e.target as HTMLElement).closest?.("button, a, [role=slider]");
      if (full || !media.started || on) return;
      drag.current = { x: e.clientX, y: e.clientY, id: e.pointerId };
    },
    move: (e: React.PointerEvent, el: HTMLDivElement, d: NonNullable<typeof drag.current>) => {
      const dy = e.clientY - d.y;
      if (!d.axis) {
        if (Math.hypot(e.clientX - d.x, dy) < 10) return;
        d.axis = dy > 0 && Math.abs(dy) > Math.abs(e.clientX - d.x) ? "y" : "x";
        if (d.axis === "x") return void (drag.current = null);
        dragged.current = true;
        pulling.current = true;
        try {
          el.setPointerCapture(d.id);
        } catch {
          /* the pointer is already gone */
        }
      }
      const y = Math.max(0, dy);
      el.style.transformOrigin = "50% 0";
      el.style.transform = `translateY(${y}px) scale(${1 - Math.min(0.45, y / 700)})`;
    },
    up: (e: React.PointerEvent, el: HTMLDivElement, d: NonNullable<typeof drag.current>) => {
      if (!d.axis) return;
      window.setTimeout(() => (dragged.current = false), 0);
      const dy = e.clientY - d.y;
      if (dy > 80) {
        // fly to the corner from where it is now
        lastRect.current = el.getBoundingClientRect();
        el.style.transform = "";
        pulling.current = false;
        minimise();
        return;
      }
      el.animate([{ transform: "none" }], { duration: 220, easing: "ease-out" }).finished.then(
        () => {
          el.style.transform = "";
          pulling.current = false;
        },
        () => (pulling.current = false),
      );
    },
  };
  const swipe = {
    onPointerDown: (e: React.PointerEvent) => {
      dragged.current = false;
      if (!isPhone()) return;
      if (docked) return pull.down(e);
      drag.current = { x: e.clientX, y: e.clientY, id: e.pointerId };
    },
    onPointerMove: (e: React.PointerEvent) => {
      const d = drag.current;
      const el = box.current;
      if (!d || !el) return;
      if (docked) return pull.move(e, el, d);
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
      drag.current = null;
      if (docked) return void (d && el && pull.up(e, el, d));
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
      drag.current = null;
      pulling.current = false;
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
    document.body.style.paddingBottom = `calc(var(--dock, 0px) + ${el.offsetHeight + 16}px)`;
    return () => {
      document.body.style.paddingBottom = before;
    };
  }, [docked]);

  // Back to the film: on its own page (it floated off as you scrolled, or was
  // minimised in the gallery's sheet) scroll back to its box; else open its page
  function expand() {
    if (slot?.slug === film.slug) {
      play(film);
      slot.el.scrollIntoView({ behavior: "smooth", block: "start" });
    } else {
      navigate({ to: "/projects/$slug", params: { slug: film.slug } });
    }
  }

  const progress = media.duration ? Math.min(1, media.time / media.duration) : 0;
  const btn =
    "press grid h-9 w-9 shrink-0 place-items-center rounded-full text-[#0a0a0a] transition hover:bg-black/[0.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/25";

  return (
    <div
      ref={box}
      role="region"
      aria-label={docked ? `${film.title}, playing` : `Mini player: ${film.title}`}
      {...swipe}
      className={cn(
        full
          ? "fixed inset-0 z-[100] bg-black"
          : docked
            ? cn("overflow-hidden bg-black max-sm:touch-none", inSheet ? "z-[71]" : "z-20")
            : cn(
                GLASS_PANEL,
                "fixed inset-x-2 bottom-[calc(var(--dock,env(safe-area-inset-bottom))+0.5rem)] z-[80] flex touch-none items-center gap-2.5 rounded-2xl p-1.5 sm:touch-auto",
                "sm:inset-x-auto sm:bottom-5 sm:right-5 sm:block sm:w-[340px]",
              ),
      )}
    >
      {/* the film: one element in every mode, so it never reloads */}
      <div
        ref={screen}
        className={cn(
          "overflow-hidden bg-black",
          turned
            ? "absolute left-1/2 top-1/2"
            : docked
              ? "relative h-full w-full"
              : "relative aspect-video w-[118px] shrink-0 rounded-[10px] sm:w-full sm:rounded-xl",
        )}
        // full screen on an upright phone: on its side, filling the screen, to watch with the
        // phone tipped to the left (the film's top along the screen's left edge)
        style={
          turned
            ? {
                width: "100dvh",
                height: "100dvw",
                transform: "translate(-50%, -50%) rotate(-90deg)",
              }
            : undefined
        }
      >
        <div
          className="absolute left-0 top-0 h-full w-full origin-top-left"
          style={
            docked
              ? undefined
              : { width: STAGE, height: (STAGE * 9) / 16, transform: `scale(${scale})` }
          }
        >
          {media.element}
        </div>
        {/* until it plays (and on iPhone a moment more): the film's cover over YouTube's own
            screen, and a ring turning */}
        {docked && (!media.started || media.fresh) && !media.blocked && (
          <div className="pointer-events-none absolute inset-0 z-[4] grid place-items-center bg-black">
            {film.cover && (
              <img
                src={film.cover}
                alt=""
                className="absolute inset-0 h-full w-full object-cover"
              />
            )}
            <span className="relative h-11 w-11 animate-spin rounded-full border-2 border-white/25 border-t-white motion-reduce:animate-none" />
          </div>
        )}
        {/* what a key just did */}
        {sign && (
          <span
            key={sign.n}
            aria-live="polite"
            className="pointer-events-none absolute left-1/2 top-1/2 z-20 -translate-x-1/2 -translate-y-1/2 rounded-full bg-black/60 px-4 py-2 text-[15px] font-medium text-white backdrop-blur-md duration-150 animate-in fade-in zoom-in-90"
            style={{ fontFamily: '"Jost", ui-sans-serif, system-ui, sans-serif' }}
          >
            {sign.text}
          </span>
        )}
        {/* full screen without the browser's: ⌄ (or turning back) ends it */}
        {full && (
          <button
            type="button"
            aria-label="Leave full screen"
            onClick={fullscreen}
            className="absolute left-3 top-3 z-10 grid h-10 w-10 place-items-center rounded-full border border-white/25 bg-black/40 text-white backdrop-blur-md"
          >
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
          </button>
        )}
        {/* our controls over the film (YouTube's own are off) */}
        {docked && (
          <Controls
            media={media}
            cover={film.cover}
            title={film.title}
            full={full || fsOn}
            turned={turned}
            onFull={fullscreen}
            onMini={minimise}
            youtube={film.youtube}
            file={film.file}
          />
        )}
        {/* phones: ⌄ minimises (tap, or swipe down on it), like YouTube's */}
        {docked && !full && (
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
              <span
                className="absolute inset-0 bg-[image:var(--tricolour)]"
                style={{ clipPath: played(progress) }}
              />
            </span>
          </>
        )}
      </div>

      {!docked && (
        <div className="flex min-w-0 flex-1 items-center gap-0.5 duration-300 animate-in fade-in sm:mt-1.5 sm:px-1.5 sm:pb-0.5">
          <button
            type="button"
            onClick={expand}
            className="min-w-0 flex-1 text-left text-[#0a0a0a] outline-none focus-visible:underline"
          >
            <span className="block truncate text-[14px] font-medium leading-tight tracking-tight">
              {film.title}
            </span>
            {film.client && (
              <span className="tracked mt-1 block truncate text-[9.5px] leading-tight text-black/55">
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

/*
  How much of the progress line is lit: the whole line is the tricolour, uncovered as the film
  plays, so it's saffron at the start, white by the middle and green at the end.
*/
const played = (p: number) => `inset(0 ${((1 - p) * 100).toFixed(3)}% 0 0)`;

const clock = (t: number) => {
  if (!Number.isFinite(t) || t < 0) return "0:00";
  return `${Math.floor(t / 60)}:${String(Math.floor(t % 60)).padStart(2, "0")}`;
};

/*
  The controls over a playing film, in the site's language (Jost, white on a
  soft shade, the tricolour for progress): a progress line you can press or drag,
  play / pause, the time, sound, the keyboard list (PC), the mini player and
  full screen. They fade away while it plays and come back when you move
  over it or tap it. On a computer a click on the film plays / pauses; on a
  phone a tap shows the controls, and the round button in the middle plays /
  pauses. Paused or ended, the film's cover sits over it (YouTube's own
  screens never show). Until it has first played, taps go to YouTube's frame
  (an iPhone may need its play button once).
*/
function Controls({
  media,
  cover,
  title,
  full,
  turned,
  onFull,
  onMini,
  youtube,
  file,
}: {
  media: ReturnType<typeof useMedia>;
  /* the film itself, for the preview over the progress line (ScrubFrame) */
  youtube?: string;
  file?: string;
  cover?: string;
  title: string;
  full: boolean;
  /* drawn on its side (full screen on an upright phone): the line runs down the screen */
  turned: boolean;
  onFull: () => void;
  onMini: () => void;
}) {
  const [shown, setShown] = useState(true);
  const timer = useRef(0);
  const wake = () => {
    setShown(true);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setShown(false), 2600);
  };
  useEffect(() => () => window.clearTimeout(timer.current), []);
  const bar = useRef<HTMLDivElement>(null);
  // A mouse over the progress line: that moment of the film in a small frame above it, and the
  // time (ScrubFrame, made on the first hover and kept, hidden, for the next)
  const [peek, setPeek] = useState<{ part: number; x: number; w: number } | null>(null);
  const lastPeek = useRef({ part: 0, x: 0, w: 1 });
  if (peek) lastPeek.current = peek;
  const [armed, setArmed] = useState(false);
  const look = (e: React.PointerEvent) => {
    const r = bar.current?.getBoundingClientRect();
    if (e.pointerType !== "mouse" || turned || !r || !(youtube || file)) return;
    const x = Math.min(r.width, Math.max(0, e.clientX - r.left));
    setPeek({ part: x / r.width, x, w: r.width });
    setArmed(true);
  };
  const visible = shown || !media.playing || !!peek;
  const seekAt = (e: React.PointerEvent) => {
    const r = bar.current?.getBoundingClientRect();
    if (!r || !media.duration) return;
    // (on its side the line runs up the screen: its start at the bottom)
    const at = turned ? (r.bottom - e.clientY) / r.height : (e.clientX - r.left) / r.width;
    media.seek(Math.min(0.999, Math.max(0, at)) * media.duration);
  };
  const progress = media.duration ? Math.min(1, media.time / media.duration) : 0;
  if (!media.started) return null;
  const p = lastPeek.current;
  const peekW = Math.round(Math.min(240, Math.max(150, p.w * 0.24)));

  const icon =
    "grid h-10 w-10 shrink-0 place-items-center rounded-full transition hover:bg-white/15";
  const stroke = {
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.9,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };

  return (
    <div
      className={cn("absolute inset-0 z-[5] select-none text-white", !visible && "cursor-none")}
      style={{ fontFamily: '"Jost", ui-sans-serif, system-ui, sans-serif' }}
      onPointerMove={(e) => e.pointerType === "mouse" && wake()}
      onPointerDown={(e) => {
        if (e.pointerType !== "mouse") wake();
      }}
      onClick={(e) => {
        if (e.target !== e.currentTarget) return;
        // a click on the film plays / pauses; a tap (phone) only shows the controls
        if ((e.nativeEvent as PointerEvent).pointerType === "mouse") media.toggle();
      }}
    >
      {/* paused or ended: the cover over YouTube's own screens */}
      {cover && (
        <img
          src={cover}
          alt=""
          className={cn(
            "pointer-events-none absolute inset-0 h-full w-full object-cover transition-opacity duration-300",
            media.playing && !media.fresh ? "opacity-0" : "opacity-100",
          )}
        />
      )}
      {/* started without sound (the phone wouldn't start it with sound): a tap gives it */}
      {media.quiet && media.playing && (
        <button
          type="button"
          onClick={() => {
            media.sound();
            wake();
          }}
          className="press absolute right-3 top-3 z-10 flex items-center gap-2 rounded-full border border-white/40 bg-black/45 py-2 pl-3 pr-3.5 text-[13px] font-medium backdrop-blur-md"
        >
          <svg aria-hidden viewBox="0 0 24 24" className="h-[18px] w-[18px]" {...stroke}>
            <path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z" fill="currentColor" stroke="none" />
            <path d="M16 9.5l5 5m0-5l-5 5" />
          </svg>
          Tap for sound
        </button>
      )}
      {/* the shade the controls sit on */}
      <span
        aria-hidden
        className={cn(
          "pointer-events-none absolute inset-0 transition-opacity duration-300",
          visible ? "opacity-100" : "opacity-0",
        )}
        style={{
          background:
            "linear-gradient(0deg, rgba(0,0,0,0.6), transparent 38%), linear-gradient(180deg, rgba(0,0,0,0.25), transparent 22%)",
        }}
      />

      {/* the round play / pause in the middle (always there while paused) */}
      <button
        type="button"
        aria-label={media.playing ? `Pause ${title}` : `Play ${title}`}
        onClick={() => {
          media.toggle();
          wake();
        }}
        className={cn(
          "press absolute left-1/2 top-1/2 grid h-14 w-14 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border border-white/50 bg-white/15 backdrop-blur-md transition-opacity duration-300 sm:h-16 sm:w-16",
          visible ? "opacity-100" : "pointer-events-none opacity-0",
          media.playing && "sm:hidden",
        )}
      >
        <svg aria-hidden viewBox="0 0 24 24" className="h-6 w-6" fill="currentColor">
          {media.playing ? (
            <>
              <rect x="6.5" y="5" width="3.6" height="14" rx="1" />
              <rect x="13.9" y="5" width="3.6" height="14" rx="1" />
            </>
          ) : media.ended ? (
            <path
              d="M12 5a7 7 0 1 1-6.6 4.7M5 4v5h5"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            />
          ) : (
            <path d="M8 5v14l11-7z" />
          )}
        </svg>
      </button>

      {/* the bar along the bottom */}
      <div
        className={cn(
          "absolute inset-x-0 bottom-0 px-2 pb-1.5 transition-opacity duration-300 sm:px-4 sm:pb-3",
          visible ? "opacity-100" : "pointer-events-none opacity-0",
        )}
      >
        {/* progress: press or drag */}
        <div
          ref={bar}
          role="slider"
          tabIndex={0}
          aria-label="Where in the film"
          aria-valuemin={0}
          aria-valuemax={Math.round(media.duration)}
          aria-valuenow={Math.round(media.time)}
          aria-valuetext={`${clock(media.time)} of ${clock(media.duration)}`}
          onPointerDown={(e) => {
            e.currentTarget.setPointerCapture(e.pointerId);
            seekAt(e);
            wake();
          }}
          onPointerMove={(e) => {
            if (e.currentTarget.hasPointerCapture(e.pointerId)) seekAt(e);
            look(e);
          }}
          onPointerLeave={() => setPeek(null)}
          className="group/bar relative flex h-4 cursor-pointer touch-none items-center"
        >
          {/* that moment of the film, above the pointer */}
          {armed && (
            <span
              aria-hidden
              className={cn(
                "pointer-events-none absolute bottom-full mb-3 transition-opacity duration-150",
                peek ? "opacity-100" : "opacity-0",
              )}
              style={{ width: peekW, left: Math.min(p.w - peekW, Math.max(0, p.x - peekW / 2)) }}
            >
              <ScrubFrame
                youtube={youtube}
                file={file}
                part={p.part}
                active={!!peek}
                className="relative block aspect-video w-full rounded-lg shadow-[0_10px_28px_rgba(0,0,0,0.55)] ring-1 ring-white/30"
              />
              <span className="mt-1.5 block text-center text-[12.5px] font-medium tabular-nums [text-shadow:0_1px_4px_rgba(0,0,0,0.7)]">
                {clock(p.part * media.duration)}
              </span>
            </span>
          )}
          <span className="relative block h-[3px] w-full overflow-hidden rounded-full bg-white/30 transition-[height] group-hover/bar:h-[5px]">
            {/* up to the pointer, a lighter line (as YouTube's) */}
            {peek && (
              <span
                className="absolute inset-0 bg-white/40"
                style={{ clipPath: played(peek.part) }}
              />
            )}
            <span
              className="absolute inset-0 bg-[image:var(--tricolour)]"
              style={{ clipPath: played(progress) }}
            />
          </span>
          <span
            aria-hidden
            className="absolute top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white shadow"
            style={{ left: `${progress * 100}%` }}
          />
        </div>

        <div className="mt-0.5 flex items-center gap-0.5 sm:gap-1">
          <button
            type="button"
            aria-label={media.playing ? "Pause" : "Play"}
            onClick={media.toggle}
            className={cn(icon, "hidden sm:grid")}
          >
            <svg aria-hidden viewBox="0 0 24 24" className="h-[22px] w-[22px]" fill="currentColor">
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
          <button
            type="button"
            aria-label={media.muted ? "Sound on" : "Sound off"}
            onClick={media.toggleMute}
            className={icon}
          >
            <svg aria-hidden viewBox="0 0 24 24" className="h-[22px] w-[22px]" {...stroke}>
              <path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z" fill="currentColor" stroke="none" />
              {media.muted ? (
                <path d="M16 9.5l5 5m0-5l-5 5" />
              ) : (
                <path d="M15.5 9a4 4 0 010 6M18 6.5a7.5 7.5 0 010 11" />
              )}
            </svg>
          </button>
          <span className="ml-1 text-[13px] tabular-nums tracking-wide sm:text-[14px]">
            {clock(media.time)} <span className="text-white/60">/ {clock(media.duration)}</span>
          </span>
          <span className="flex-1" />
          <button
            type="button"
            aria-label="Keyboard shortcuts"
            title="Keyboard shortcuts (?)"
            onClick={openShortcuts}
            className={cn(icon, "hidden lg:grid")}
          >
            <svg aria-hidden viewBox="0 0 24 24" className="h-[22px] w-[22px]" {...stroke}>
              <path d="M3.5 7.5h17v10h-17zM7 11h.01M10.5 11h.01M14 11h.01M17.5 11h.01M8 14.5h8" />
            </svg>
          </button>
          {!full && (
            <button
              type="button"
              aria-label="Mini player"
              title="Mini player (i)"
              onClick={onMini}
              className={icon}
            >
              <svg aria-hidden viewBox="0 0 24 24" className="h-[22px] w-[22px]" {...stroke}>
                <rect x="3" y="5" width="18" height="14" rx="2" />
                <rect x="12" y="12" width="7" height="5" rx="1" fill="currentColor" stroke="none" />
              </svg>
            </button>
          )}
          <button
            type="button"
            aria-label={full ? "Leave full screen" : "Full screen"}
            title={full ? "Leave full screen (f)" : "Full screen (f)"}
            onClick={onFull}
            className={icon}
          >
            <svg aria-hidden viewBox="0 0 24 24" className="h-6 w-6" {...stroke} strokeWidth={2.1}>
              {full ? (
                <path d="M9 4v5H4M15 4v5h5M9 20v-5H4M15 20v-5h5" />
              ) : (
                <path d="M4 9V4h5M15 4h5v5M20 15v5h-5M9 20H4v-5" />
              )}
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}

/* The film itself, a YouTube player or a video file, and what the mini controls need. */
function useMedia(film: Film) {
  const [playing, setPlaying] = useState(false);
  /* it has played */
  const [started, setStarted] = useState(false);
  /* started without sound, as a phone wouldn't start it with sound: sound waits for a tap */
  const [quiet, setQuiet] = useState(false);
  /* it wouldn't start even silently (an iPhone in Low Power Mode): YouTube's frame is shown,
     for its own play button, the one way left */
  const [blocked, setBlocked] = useState(false);
  const [ended, setEnded] = useState(false);
  const [muted, setMuted] = useState(false);
  const [time, setTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const host = useRef<HTMLDivElement>(null);
  const yt = useRef<YTPlayer | null>(null);
  /* an iPhone or iPad (see the frame, below) */
  const [apple, setApple] = useState(false);
  const appleRef = useRef(false);
  useEffect(() => {
    const n = navigator;
    appleRef.current =
      /iP(hone|ad|od)/.test(n.userAgent) || (n.platform === "MacIntel" && n.maxTouchPoints > 1);
    setApple(appleRef.current);
  }, []);
  /* just started or resumed, on iPhone: YouTube shows its title, channel and logo over the
     film for its first seconds there, so the cover stays over it till they've gone */
  const [fresh, setFresh] = useState(false);
  const video = useRef<HTMLVideoElement>(null);

  // YouTube, through its IFrame API, with sound and none of its own controls
  // or branding: ours are drawn over it (Controls), and the frame is cut so
  // YouTube's title bar and logo fall outside it. Until it plays, the film's
  // cover hides YouTube's screen (Player). Where a browser won't start it with
  // sound (iPhone), it starts silently and a "Tap for sound" button shows.
  useEffect(() => {
    const el = host.current;
    if (!film.youtube || !el) return;
    let cancelled = false;
    let poll = 0;
    let wait = 0;
    let reveal = 0;
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
          playerVars: {
            autoplay: 1,
            controls: 0,
            disablekb: 1, // our keys instead (they work wherever you are on the page)
            fs: 0,
            playsinline: 1,
            rel: 0,
            modestbranding: 1,
            iv_load_policy: 3,
          },
          events: {
            onReady: () => {
              if (cancelled) return;
              yt.current?.playVideo();
              // not playing soon (or buffering): it was refused sound, so start it without
              const going = () => [1, 3].includes(yt.current?.getPlayerState() ?? -1);
              wait = window.setTimeout(() => {
                const p = yt.current;
                if (cancelled || !p || going()) return;
                p.mute();
                p.playVideo();
                setQuiet(true);
                wait = window.setTimeout(() => !cancelled && !going() && setBlocked(true), 2000);
              }, 1200);
              let first = true;
              let was = -1;
              poll = window.setInterval(() => {
                const p = yt.current;
                if (!p) return;
                const state = p.getPlayerState();
                setPlaying(state === 1);
                if (state === 1 && first) {
                  first = false;
                  setStarted(true);
                }
                // YouTube turns its own captions on for a film playing silently, and again on
                // its own after a replay, seconds in: kept off all the while it plays
                if (state === 1) {
                  const q = p as YTPlayer & { unloadModule?: (m: string) => void };
                  q.unloadModule?.("captions");
                  q.unloadModule?.("cc");
                }
                // (re)started on iPhone: covered while YouTube's own title and logo show
                if (state === 1 && was !== 1 && appleRef.current) {
                  setFresh(true);
                  window.clearTimeout(reveal);
                  reveal = window.setTimeout(() => !cancelled && setFresh(false), FRESH);
                }
                was = state;
                setEnded(state === 0);
                setMuted(p.isMuted());
                setTime(p.getCurrentTime());
                setDuration(p.getDuration());
              }, 250);
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
      window.clearTimeout(wait);
      window.clearTimeout(reveal);
      yt.current?.destroy();
      yt.current = null;
      mount.remove();
    };
  }, [film.youtube]);

  const toggle = () => {
    const p = yt.current;
    if (p) {
      const state = p.getPlayerState();
      if (state === 1) p.pauseVideo();
      else {
        if (state === 0) p.seekTo(0, true);
        p.playVideo();
      }
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
      // taller than the frame (the film letterboxed inside stays the frame's
      // size), so YouTube's title bar and logo sit outside it, cut off; and
      // untouchable once it plays (Controls take the taps). Not on iPhone and
      // iPad: their Safari draws a YouTube frame past its box's edges whatever
      // the box says (overflow, clip-path, masks), so the title bar would show
      // above the film; there the frame is the film's size and the cover
      // stays a moment longer, till YouTube's title bar has faded (Player).
      className={cn(
        "absolute [&_iframe]:h-full [&_iframe]:w-full [&_iframe]:border-0",
        apple ? "inset-0" : "inset-x-0 -inset-y-[20%]",
        (started || !blocked) && "pointer-events-none",
      )}
    />
  ) : (
    <video
      ref={video}
      src={film.file}
      poster={film.cover}
      autoPlay
      playsInline
      onPlay={() => {
        setPlaying(true);
        setStarted(true);
        setEnded(false);
      }}
      onPause={() => setPlaying(false)}
      onEnded={() => setEnded(true)}
      onVolumeChange={(e) => setMuted(e.currentTarget.muted)}
      onTimeUpdate={(e) => setTime(e.currentTarget.currentTime)}
      onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
      aria-label={film.title}
      className="absolute inset-0 h-full w-full bg-black object-contain"
    />
  );

  /* for the keyboard: where it is, how long, move, sound */
  const now = () => yt.current?.getCurrentTime() ?? video.current?.currentTime ?? 0;
  const length = () => yt.current?.getDuration() ?? video.current?.duration ?? 0;
  const isPlaying = () =>
    yt.current ? yt.current.getPlayerState() === 1 : !!video.current && !video.current.paused;
  const seek = (s: number) => {
    if (yt.current) yt.current.seekTo(s, true);
    else if (video.current) video.current.currentTime = s;
    setTime(s);
  };
  /* returns whether it's now silent */
  const toggleMute = () => {
    const p = yt.current;
    if (p) {
      const was = p.isMuted();
      if (was) p.unMute();
      else p.mute();
      return !was;
    }
    const v = video.current;
    if (!v) return false;
    v.muted = !v.muted;
    return v.muted;
  };

  return {
    element,
    videoRef: video,
    playing,
    started,
    fresh,
    quiet,
    blocked,
    /* the sound, for a film that started silently */
    sound: () => {
      const p = yt.current;
      if (video.current) video.current.muted = false;
      setQuiet(false);
      setMuted(false);
      if (!p) return;
      p.unMute();
      // a phone that still won't have sound pauses it instead: back to playing silently
      window.setTimeout(() => {
        if (yt.current !== p || p.getPlayerState() !== 2) return;
        p.mute();
        p.playVideo();
        setQuiet(true);
      }, 700);
    },
    ended,
    muted,
    time,
    duration,
    toggle,
    now,
    length,
    isPlaying,
    seek,
    toggleMute: () => {
      const m = toggleMute();
      setMuted(m);
      return m;
    },
  };
}
