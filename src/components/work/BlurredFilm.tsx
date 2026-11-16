import { useEffect, useRef, useState } from "react";
import type { FilmClock } from "@/lib/player";
import { YT_HOST, loadYouTubeApi, ytPlayerVars, type YTPlayer } from "@/lib/youtube";
import { cn } from "@/lib/utils";

/*
  The film itself, softly blurred, filling what it's put in: on a computer,
  the glow round a playing film (WorkUI.tsx Ambient), live, as YouTube's
  ambient light is.

  YouTube doesn't let another site read its film's pictures, so this is a
  second, silent copy of the film kept in step with the one playing (its
  `clock`: playing or paused with it, moved back into step when it drifts).
  It's drawn small (so YouTube sends it in low quality: it's blurred anyway)
  and scaled up to cover, the blur done at the small size, cut taller than the
  film so YouTube's title bar and logo fall outside. YouTube's picture of the
  film (`still`) shows until it's going. A video file is drawn live from the
  playing one onto a small canvas instead (no second copy needed).

  Tune here:
*/
export const BLURRED = {
  blur: 11, // px, at the small size it's drawn at (about ×3 on screen)
  zoom: 1.12, // a little larger than the screen, so the blurred edges fall outside
  saturate: 1.35,
  every: 400, // ms between checks that it's in step
  drift: 0.7, // s out of step before it's moved back into step
};
export const STAGE = 480; // the size it's drawn at (px wide, 16:9), then scaled to cover

export function BlurredFilm({
  youtube,
  video,
  clock,
  still,
  blur = BLURRED.blur,
  className,
}: {
  youtube?: string;
  video?: HTMLVideoElement;
  clock?: FilmClock;
  still?: string;
  /* px, at the small size it's drawn at */
  blur?: number;
  className?: string;
}) {
  const box = useRef<HTMLDivElement>(null);
  const host = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const [scale, setScale] = useState(3);
  const [live, setLive] = useState(false);
  const clockRef = useRef(clock);
  clockRef.current = clock;

  // cover what it's in
  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const fit = () =>
      setScale(
        Math.max(el.clientWidth / STAGE, el.clientHeight / ((STAGE * 9) / 16)) * BLURRED.zoom,
      );
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // YouTube: a silent copy, kept in step
  useEffect(() => {
    const el = host.current;
    if (!youtube || !el) return;
    let gone = false;
    let poll = 0;
    let yt: YTPlayer | null = null;
    const mount = document.createElement("div");
    el.appendChild(mount);
    loadYouTubeApi()
      .then((YT) => {
        if (gone) return;
        yt = new YT.Player(mount, {
          videoId: youtube,
          host: YT_HOST,
          width: "100%",
          height: "100%",
          playerVars: ytPlayerVars(),
          events: {
            onReady: () => {
              const p = yt;
              if (!p || gone) return;
              p.mute();
              const q = p as YTPlayer & { unloadModule?: (m: string) => void };
              const step = () => {
                const c = clockRef.current;
                if (!c) return;
                const state = p.getPlayerState();
                if (state === 1) {
                  setLive(true);
                  q.unloadModule?.("captions");
                }
                const want = c.playing();
                if (want && state !== 1 && state !== 3) p.playVideo();
                if (!want && state === 1) p.pauseVideo();
                const t = c.now();
                if (Math.abs(p.getCurrentTime() - t) > BLURRED.drift) p.seekTo(t + 0.25, true);
              };
              step();
              poll = window.setInterval(step, BLURRED.every);
            },
          },
        });
      })
      .catch(() => {
        /* no YouTube: the still stays */
      });
    return () => {
      gone = true;
      window.clearInterval(poll);
      yt?.destroy();
      mount.remove();
    };
  }, [youtube]);

  // a video file: drawn live, small, from the one playing
  useEffect(() => {
    const c = canvas.current;
    const x = c?.getContext("2d");
    if (!video || !c || !x) return;
    let raf = 0;
    const draw = () => {
      if (video.readyState >= 2) {
        x.drawImage(video, 0, 0, c.width, c.height);
        setLive(true);
      }
      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, [video]);

  const filter = `blur(${blur}px) saturate(${BLURRED.saturate})`;
  // the small stage, centred and scaled up to cover
  const stage = {
    width: STAGE,
    height: (STAGE * 9) / 16,
    left: "50%",
    top: "50%",
    transform: `translate(-50%, -50%) scale(${scale})`,
    filter,
  } as const;

  return (
    <div ref={box} aria-hidden className={cn("pointer-events-none overflow-hidden", className)}>
      {still && (
        // (letterboxed: drawn a third taller, its bars fall outside)
        <span
          className="absolute"
          style={{ ...stage, background: `url("${still}") center / 100% 133.4% no-repeat` }}
        />
      )}
      {youtube && (
        <div
          className={cn(
            "absolute overflow-hidden transition-opacity duration-1000",
            live ? "opacity-100" : "opacity-0",
          )}
          style={stage}
        >
          <div
            ref={host}
            className="absolute inset-x-0 -inset-y-[20%] [&_iframe]:h-full [&_iframe]:w-full [&_iframe]:border-0"
          />
        </div>
      )}
      {video && (
        <canvas
          ref={canvas}
          width={160}
          height={90}
          className={cn(
            "absolute transition-opacity duration-1000",
            live ? "opacity-100" : "opacity-0",
          )}
          style={stage}
        />
      )}
    </div>
  );
}
