import { forwardRef, useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

/*
  The film at the top of a case study, playing on a loop, with its controls
  under it, after the reference:

    0:05 / 0:20                         1×   mute   full screen
    [frame][frame][FRAME][frame]...      (filmstrip; the frame you're in is in colour)
    0:00   0:02   0:05   0:07  ...       (a time under each frame)

  A red playhead runs along the strip; press or drag on it to scrub.

  The film is the project's trailer (or video). Until there is one, a stand-in
  film plays instead: the gallery's prism light drifting over the title, drawn
  live, 20 seconds long, so the strip and the scrubbing still work.
*/

const FRAMES = 8;
const STAND_IN_LENGTH = 20;
const SPEEDS = [1, 1.5, 2];

export const clock = (t: number) => {
  if (!Number.isFinite(t) || t < 0) return "0:00";
  const m = Math.floor(t / 60);
  const s = Math.floor(t % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
};

/* ---------- the stand-in film ---------- */

function drawStandIn(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  t: number,
  title: string,
) {
  ctx.fillStyle = "#050505";
  ctx.fillRect(0, 0, w, h);
  const glow = (cx: number, rx: number, ry: number, rgb: string, a: number) => {
    ctx.save();
    ctx.translate(cx * w, 0);
    ctx.scale(rx * w, ry * h);
    const g = ctx.createRadialGradient(0, 0, 0, 0, 0, 1);
    g.addColorStop(0, `rgba(${rgb},${a})`);
    g.addColorStop(0.55, `rgba(${rgb},${a * 0.35})`);
    g.addColorStop(1, `rgba(${rgb},0)`);
    ctx.fillStyle = g;
    ctx.fillRect(-1, 0, 2, 1);
    ctx.restore();
  };
  // The light drifts like a slow camera move, and breathes a little
  const x = 0.5 + 0.11 * Math.sin(t * 0.31) + 0.03 * Math.sin(t * 0.83);
  const breath = 0.92 + 0.08 * Math.sin(t * 0.9);
  ctx.globalCompositeOperation = "lighter";
  glow(x - 0.18 - 0.03 * Math.sin(t * 0.5), 0.2, 1.05, "31,44,255", 0.85 * breath);
  glow(x + 0.18 + 0.03 * Math.cos(t * 0.45), 0.2, 1.05, "255,138,31", 0.85 * breath);
  glow(x, 0.06 + 0.015 * Math.sin(t * 0.4), 1.15, "255,255,255", 0.95 * breath);
  ctx.globalCompositeOperation = "source-over";
  // Title, bottom left, spaced out
  const size = Math.max(9, h * 0.034);
  ctx.font = `500 ${size}px Jost, ui-sans-serif, system-ui`;
  ctx.fillStyle = "#fff";
  let tx = w * 0.04;
  for (const ch of title.toUpperCase()) {
    ctx.fillText(ch, tx, h - h * 0.07);
    tx += ctx.measureText(ch).width + size * 0.32;
  }
}

/* ---------- what the controls drive: a video, or the stand-in ---------- */

type Media = {
  time: number;
  duration: number;
  frames: string[];
  hasSound: boolean;
  toggle: () => void;
  seek: (t: number) => void;
  setRate: (r: number) => void;
  setMuted: (m: boolean) => void;
  fullscreen: () => void;
};

function useVideoFilm(
  el: React.RefObject<HTMLVideoElement | null>,
  src: string,
  live: boolean,
): Media {
  const [time, setTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [frames, setFrames] = useState<string[]>([]);

  useEffect(() => {
    const v = el.current;
    if (!v || !live) return;
    let cancelled = false;
    const onTime = () => setTime(v.currentTime);
    // Frames for the strip, from a hidden copy of the video
    const makeFrames = async () => {
      const copy = document.createElement("video");
      copy.crossOrigin = "anonymous";
      copy.muted = true;
      copy.preload = "auto";
      copy.src = v.currentSrc || v.src;
      await new Promise((ok, fail) => {
        copy.onloadeddata = ok;
        copy.onerror = fail;
      });
      const c = document.createElement("canvas");
      c.width = 192;
      c.height = Math.round(192 * (copy.videoHeight / copy.videoWidth || 9 / 16));
      const ctx = c.getContext("2d");
      if (!ctx) return;
      const out: string[] = [];
      for (let k = 0; k < FRAMES; k++) {
        if (cancelled) return;
        copy.currentTime = ((k + 0.5) / FRAMES) * copy.duration;
        await new Promise((ok) => (copy.onseeked = ok));
        ctx.drawImage(copy, 0, 0, c.width, c.height);
        out.push(c.toDataURL("image/jpeg", 0.75));
      }
      copy.removeAttribute("src");
      copy.load();
      if (!cancelled) setFrames(out);
    };
    const onMeta = () => {
      setDuration(v.duration);
      makeFrames().catch(() => {
        /* another site's video without permission to read frames: the strip stays plain */
      });
    };
    v.addEventListener("timeupdate", onTime);
    v.addEventListener("loadedmetadata", onMeta);
    if (v.readyState >= 1) onMeta();
    return () => {
      cancelled = true;
      v.removeEventListener("timeupdate", onTime);
      v.removeEventListener("loadedmetadata", onMeta);
    };
  }, [el, src, live]);

  return {
    time,
    duration,
    frames,
    hasSound: true,
    toggle: () => {
      const v = el.current;
      if (!v) return;
      if (v.paused) v.play().catch(() => {});
      else v.pause();
    },
    seek: (t) => {
      if (el.current) el.current.currentTime = t;
      setTime(t);
    },
    setRate: (r) => {
      if (el.current) el.current.playbackRate = r;
    },
    setMuted: (m) => {
      if (el.current) el.current.muted = m;
    },
    fullscreen: () => {
      const v = el.current as (HTMLVideoElement & { webkitEnterFullscreen?: () => void }) | null;
      if (!v) return;
      if (v.requestFullscreen) v.requestFullscreen().catch(() => {});
      else v.webkitEnterFullscreen?.();
    },
  };
}

function useStandInFilm(
  el: React.RefObject<HTMLCanvasElement | null>,
  title: string,
  live: boolean,
): Media {
  const t = useRef(live ? 0 : STAND_IN_LENGTH * 0.25);
  const rate = useRef(1);
  const [time, setTime] = useState(0);
  const [playing, setPlaying] = useState(live);
  const [frames, setFrames] = useState<string[]>([]);

  const draw = useCallback(() => {
    const c = el.current;
    const ctx = c?.getContext("2d");
    if (!c || !ctx) return;
    drawStandIn(ctx, c.width, c.height, t.current, title);
  }, [el, title]);

  // Sharp at the size it's shown
  useEffect(() => {
    const c = el.current;
    if (!c) return;
    const fit = () => {
      const r = c.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      c.width = Math.max(2, Math.round(r.width * dpr));
      c.height = Math.max(2, Math.round(r.height * dpr));
      draw();
    };
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(c);
    return () => ro.disconnect();
  }, [el, draw]);

  // Frames for the strip
  useEffect(() => {
    if (!live) return;
    const c = document.createElement("canvas");
    c.width = 192;
    c.height = 108;
    const ctx = c.getContext("2d");
    if (!ctx) return;
    const out: string[] = [];
    for (let k = 0; k < FRAMES; k++) {
      drawStandIn(ctx, c.width, c.height, ((k + 0.5) / FRAMES) * STAND_IN_LENGTH, title);
      out.push(c.toDataURL("image/jpeg", 0.8));
    }
    setFrames(out);
  }, [title, live]);

  // Playing
  useEffect(() => {
    if (!playing) return;
    let raf = 0;
    let last = performance.now();
    let shown = -1;
    const tick = (now: number) => {
      t.current = (t.current + ((now - last) / 1000) * rate.current) % STAND_IN_LENGTH;
      last = now;
      draw();
      // The clock only needs to change a few times a second
      if (Math.abs(t.current - shown) > 0.1) {
        shown = t.current;
        setTime(t.current);
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [playing, draw]);

  return {
    time,
    duration: STAND_IN_LENGTH,
    frames,
    hasSound: false,
    toggle: () => setPlaying((p) => !p),
    seek: (s) => {
      t.current = s;
      setTime(s);
      draw();
    },
    setRate: (r) => {
      rate.current = r;
    },
    setMuted: () => {},
    fullscreen: () => {
      el.current?.requestFullscreen?.().catch(() => {});
    },
  };
}

/* ---------- the player ---------- */

type Props = {
  title: string;
  src?: string;
  poster?: string;
  /* false for the copies of the film in the endless reel: a still frame, no controls */
  live?: boolean;
};

export const FilmPlayer = forwardRef<HTMLDivElement, Props>(function FilmPlayer(props, frameRef) {
  return props.src ? (
    <VideoPlayer {...props} src={props.src} frameRef={frameRef} />
  ) : (
    <StandInPlayer {...props} frameRef={frameRef} />
  );
});

type Inner = Props & { frameRef: React.ForwardedRef<HTMLDivElement> };

function VideoPlayer({ title, src, poster, live = true, frameRef }: Inner & { src: string }) {
  const el = useRef<HTMLVideoElement>(null);
  const media = useVideoFilm(el, src, live);
  return (
    <PlayerChrome media={media} live={live} frameRef={frameRef}>
      <video
        ref={el}
        src={live ? src : undefined}
        poster={poster}
        autoPlay={live}
        muted
        loop
        playsInline
        preload={live ? "auto" : "none"}
        aria-label={`${title}, the film`}
        onClick={media.toggle}
        className="block h-full w-full cursor-pointer object-cover"
      />
    </PlayerChrome>
  );
}

function StandInPlayer({ title, live = true, frameRef }: Inner) {
  const el = useRef<HTMLCanvasElement>(null);
  const media = useStandInFilm(el, title, live);
  return (
    <PlayerChrome media={media} live={live} frameRef={frameRef}>
      <canvas
        ref={el}
        role="img"
        aria-label={`${title}, the film`}
        onClick={media.toggle}
        className="block h-full w-full cursor-pointer"
      />
    </PlayerChrome>
  );
}

function PlayerChrome({
  media,
  live,
  frameRef,
  children,
}: {
  media: Media;
  live: boolean;
  frameRef: React.ForwardedRef<HTMLDivElement>;
  children: React.ReactNode;
}) {
  const strip = useRef<HTMLDivElement>(null);
  const [muted, setMuted] = useState(true);
  const [speed, setSpeed] = useState(1);
  const { time, duration } = media;
  const progress = duration ? Math.min(1, time / duration) : 0;
  const current = Math.min(FRAMES - 1, Math.floor(progress * FRAMES));

  const seekAt = (clientX: number) => {
    const el = strip.current;
    if (!el || !duration) return;
    const r = el.getBoundingClientRect();
    media.seek(Math.min(0.999, Math.max(0, (clientX - r.left) / r.width)) * duration);
  };

  return (
    <div>
      <div
        ref={frameRef}
        className="relative aspect-video overflow-hidden bg-black shadow-[0_24px_50px_-28px_rgba(0,0,0,0.45)]"
      >
        {children}
      </div>

      <div className={cn(!live && "invisible")} aria-hidden={!live}>
        {/* Time and controls */}
        <div className="mt-3 flex items-center justify-between text-[12px] leading-[15.6px]">
          <span className="tabular-nums">
            {clock(time)} <span className="text-black/40">/ {clock(duration)}</span>
          </span>
          <span className="flex items-center gap-5">
            <button
              type="button"
              tabIndex={live ? 0 : -1}
              className="tabular-nums"
              aria-label={`Playback speed ${speed} times`}
              onClick={() => {
                const next = SPEEDS[(SPEEDS.indexOf(speed) + 1) % SPEEDS.length];
                setSpeed(next);
                media.setRate(next);
              }}
            >
              {speed}×
            </button>
            {media.hasSound && (
              <button
                type="button"
                tabIndex={live ? 0 : -1}
                aria-label={muted ? "Turn the sound on" : "Turn the sound off"}
                onClick={() => {
                  setMuted(!muted);
                  media.setMuted(!muted);
                }}
              >
                <svg
                  viewBox="0 0 24 24"
                  className="h-4 w-4"
                  aria-hidden
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.7"
                >
                  <path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z" fill="currentColor" stroke="none" />
                  {muted ? (
                    <path d="M16 9.5l5 5m0-5l-5 5" />
                  ) : (
                    <path d="M15.5 9a4 4 0 010 6M18 6.5a7.5 7.5 0 010 11" />
                  )}
                </svg>
              </button>
            )}
            <button
              type="button"
              tabIndex={live ? 0 : -1}
              aria-label="Full screen"
              onClick={media.fullscreen}
            >
              <svg
                viewBox="0 0 24 24"
                className="h-4 w-4"
                aria-hidden
                fill="none"
                stroke="currentColor"
                strokeWidth="1.7"
              >
                <path d="M4 9V4h5M15 4h5v5M20 15v5h-5M9 20H4v-5" />
              </svg>
            </button>
          </span>
        </div>

        {/* The filmstrip, a time under each frame */}
        <div
          ref={strip}
          role="slider"
          tabIndex={live ? 0 : -1}
          aria-label="Scrub through the film"
          aria-valuemin={0}
          aria-valuemax={Math.round(duration)}
          aria-valuenow={Math.round(time)}
          aria-valuetext={`${clock(time)} of ${clock(duration)}`}
          onPointerDown={(e) => {
            e.currentTarget.setPointerCapture(e.pointerId);
            seekAt(e.clientX);
          }}
          onPointerMove={(e) => {
            if (e.currentTarget.hasPointerCapture(e.pointerId)) seekAt(e.clientX);
          }}
          onKeyDown={(e) => {
            if (!duration) return;
            if (e.key === "ArrowRight") media.seek(Math.min(duration - 0.01, time + 2));
            else if (e.key === "ArrowLeft") media.seek(Math.max(0, time - 2));
            else if (e.key === " ") media.toggle();
            else return;
            e.preventDefault();
          }}
          className="relative mt-3 grid cursor-ew-resize touch-none select-none gap-1 outline-none focus-visible:ring-2 focus-visible:ring-black/30"
          style={{ gridTemplateColumns: `repeat(${FRAMES}, minmax(0, 1fr))` }}
        >
          {Array.from({ length: FRAMES }, (_, k) => (
            <span
              key={k}
              className={cn(
                "aspect-[4/3] bg-black/10 bg-cover bg-center transition-[filter,opacity] duration-300",
                k !== current && "opacity-55 grayscale",
              )}
              style={{ backgroundImage: media.frames[k] ? `url(${media.frames[k]})` : undefined }}
            />
          ))}
          {/* The playhead */}
          <span
            aria-hidden
            className="pointer-events-none absolute -top-1.5 bottom-0 w-[2px] -translate-x-1/2 bg-[#ff3d1f]"
            style={{ left: `${progress * 100}%` }}
          >
            <span className="absolute left-1/2 top-0 h-[7px] w-[7px] -translate-x-1/2 rounded-full bg-[#ff3d1f]" />
          </span>
        </div>
        <div
          className="mt-2 grid gap-1 text-[12px] leading-[15.6px]"
          style={{ gridTemplateColumns: `repeat(${FRAMES}, minmax(0, 1fr))` }}
          aria-hidden
        >
          {Array.from({ length: FRAMES }, (_, k) => (
            <span
              key={k}
              className={cn("tabular-nums", k === current ? "text-black" : "text-black/40")}
            >
              {clock((k / FRAMES) * duration)}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
