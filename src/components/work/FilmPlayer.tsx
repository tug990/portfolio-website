import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

/*
  The film, in a quiet player of our own: click to play or pause, and scrub
  along a filmstrip of frames from the film itself (made in the browser from
  the video once it loads). Speed, mute and full screen on the right.
*/

const FRAMES = 10;
const SPEEDS = [1, 1.5, 2];

const clock = (t: number) => {
  if (!Number.isFinite(t)) return "0:00";
  const m = Math.floor(t / 60);
  const s = Math.floor(t % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
};

export function FilmPlayer({
  src,
  poster,
  title,
}: {
  src: string;
  poster?: string;
  title: string;
}) {
  const video = useRef<HTMLVideoElement>(null);
  const strip = useRef<HTMLDivElement>(null);
  const [playing, setPlaying] = useState(false);
  const [time, setTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [muted, setMuted] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [frames, setFrames] = useState<string[]>([]);

  // The filmstrip: grab frames from a second, hidden copy of the video
  useEffect(() => {
    const v = video.current;
    if (!v) return;
    let cancelled = false;
    const make = async () => {
      const url = v.currentSrc || v.src;
      if (!url || !Number.isFinite(v.duration) || v.duration <= 0) return;
      const copy = document.createElement("video");
      copy.crossOrigin = "anonymous";
      copy.muted = true;
      copy.preload = "auto";
      copy.src = url;
      await new Promise((ok, fail) => {
        copy.onloadeddata = ok;
        copy.onerror = fail;
      });
      const c = document.createElement("canvas");
      c.width = 160;
      c.height = Math.round(160 * (copy.videoHeight / copy.videoWidth || 9 / 16));
      const ctx = c.getContext("2d");
      if (!ctx) return;
      const out: string[] = [];
      for (let k = 0; k < FRAMES; k++) {
        if (cancelled) return;
        copy.currentTime = ((k + 0.5) / FRAMES) * copy.duration;
        await new Promise((ok) => (copy.onseeked = ok));
        ctx.drawImage(copy, 0, 0, c.width, c.height);
        out.push(c.toDataURL("image/jpeg", 0.7));
      }
      copy.removeAttribute("src");
      copy.load();
      if (!cancelled) setFrames(out);
    };
    const onMeta = () => {
      setDuration(v.duration);
      make().catch(() => {
        /* frames can't be read (another site's video): the strip stays plain */
      });
    };
    v.addEventListener("loadedmetadata", onMeta);
    if (v.readyState >= 1) onMeta();
    return () => {
      cancelled = true;
      v.removeEventListener("loadedmetadata", onMeta);
    };
  }, [src]);

  const toggle = () => {
    const v = video.current;
    if (!v) return;
    if (v.paused) v.play().catch(() => {});
    else v.pause();
  };

  // Scrub by pressing and dragging along the strip
  const seekAt = (clientX: number) => {
    const v = video.current;
    const el = strip.current;
    if (!v || !el || !duration) return;
    const r = el.getBoundingClientRect();
    v.currentTime = Math.min(1, Math.max(0, (clientX - r.left) / r.width)) * duration;
    setTime(v.currentTime);
  };

  const progress = duration ? time / duration : 0;

  return (
    <div>
      <div className="relative overflow-hidden rounded-[3px] bg-black">
        <video
          ref={video}
          src={src}
          poster={poster}
          playsInline
          preload="metadata"
          aria-label={`${title}, the film`}
          onClick={toggle}
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
          onTimeUpdate={(e) => setTime(e.currentTarget.currentTime)}
          className="block aspect-video w-full cursor-pointer object-cover"
        />
        {/* Big play button while paused */}
        <button
          type="button"
          onClick={toggle}
          aria-label={playing ? "Pause" : "Play"}
          className={cn(
            "absolute inset-0 m-auto flex h-16 w-16 items-center justify-center rounded-full bg-white/90 text-black shadow-lg transition-opacity duration-300",
            playing ? "pointer-events-none opacity-0" : "opacity-100",
          )}
        >
          <svg viewBox="0 0 24 24" className="ml-1 h-6 w-6" aria-hidden>
            <path d="M7 4.5v15l12-7.5z" fill="currentColor" />
          </svg>
        </button>
      </div>

      {/* Time and controls */}
      <div className="mt-3 flex items-center justify-between text-[13px] text-black/60">
        <span className="tabular-nums">
          <span className="text-black">{clock(time)}</span> / {clock(duration)}
        </span>
        <span className="flex items-center gap-4">
          <button
            type="button"
            className="tabular-nums transition-colors hover:text-black"
            aria-label={`Playback speed ${speed} times`}
            onClick={() => {
              const next = SPEEDS[(SPEEDS.indexOf(speed) + 1) % SPEEDS.length];
              setSpeed(next);
              if (video.current) video.current.playbackRate = next;
            }}
          >
            {speed}×
          </button>
          <button
            type="button"
            className="transition-colors hover:text-black"
            aria-label={muted ? "Unmute" : "Mute"}
            onClick={() => {
              const v = video.current;
              if (!v) return;
              v.muted = !v.muted;
              setMuted(v.muted);
            }}
          >
            <svg
              viewBox="0 0 24 24"
              className="h-4 w-4"
              aria-hidden
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
            >
              <path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z" fill="currentColor" stroke="none" />
              {muted ? (
                <path d="M16 9.5l5 5m0-5l-5 5" />
              ) : (
                <path d="M15.5 9a4 4 0 010 6M18 6.5a7.5 7.5 0 010 11" />
              )}
            </svg>
          </button>
          <button
            type="button"
            className="transition-colors hover:text-black"
            aria-label="Full screen"
            onClick={() => {
              const v = video.current as
                (HTMLVideoElement & { webkitEnterFullscreen?: () => void }) | null;
              if (!v) return;
              if (v.requestFullscreen) v.requestFullscreen().catch(() => {});
              else v.webkitEnterFullscreen?.();
            }}
          >
            <svg
              viewBox="0 0 24 24"
              className="h-4 w-4"
              aria-hidden
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
            >
              <path d="M4 9V4h5M15 4h5v5M20 15v5h-5M9 20H4v-5" />
            </svg>
          </button>
        </span>
      </div>

      {/* The filmstrip: press or drag to scrub */}
      <div
        ref={strip}
        role="slider"
        tabIndex={0}
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
          const v = video.current;
          if (!v || !duration) return;
          if (e.key === "ArrowRight") v.currentTime = Math.min(duration, v.currentTime + 5);
          else if (e.key === "ArrowLeft") v.currentTime = Math.max(0, v.currentTime - 5);
          else if (e.key === " ") toggle();
          else return;
          e.preventDefault();
        }}
        className="relative mt-3 flex h-14 cursor-ew-resize touch-none select-none gap-[2px] overflow-hidden rounded-[3px] bg-black/10 outline-none focus-visible:ring-2 focus-visible:ring-black/40 sm:h-16"
      >
        {Array.from({ length: FRAMES }, (_, k) => (
          <span
            key={k}
            className={cn(
              "h-full flex-1 bg-cover bg-center transition-[filter] duration-300",
              (k + 1) / FRAMES > progress && "grayscale-[0.85] brightness-[0.9]",
            )}
            style={{ backgroundImage: frames[k] ? `url(${frames[k]})` : undefined }}
          />
        ))}
        {/* The playhead */}
        <span
          aria-hidden
          className="pointer-events-none absolute inset-y-0 w-[2px] -translate-x-1/2 bg-[#ff3d1f]"
          style={{ left: `${progress * 100}%` }}
        >
          <span className="absolute -top-0 left-1/2 h-2 w-2 -translate-x-1/2 rounded-full bg-[#ff3d1f]" />
        </span>
      </div>
    </div>
  );
}
