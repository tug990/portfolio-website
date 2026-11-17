import { useEffect, useRef, useState } from "react";
import { YT_HOST, loadYouTubeApi, ytPlayerVars, type YTPlayer } from "@/lib/youtube";
import { cn } from "@/lib/utils";

/*
  A film at any moment of it, for scrubbing: point along a playing film's
  progress line (MiniPlayer.tsx Controls) or across a film's card on the Work
  page (WorkUI.tsx Thumb), and this shows the film at that point, playing on
  silently from there while the pointer rests; move it and the film jumps, so
  sweeping across runs through the whole film fast.

  YouTube's own instant preview strips need a key only YouTube's site is given,
  so this is a second, silent YouTube player that jumps to where you point (a
  moment's wait at each new place: YouTube's picture of the film near there
  shows meanwhile). It's drawn at a normal player's size and scaled down to fit
  (YouTube crowds a small player with its own buttons), and cut taller than the
  film so YouTube's title bar and logo fall outside. A video file is simply a
  second, silent video element.

  `part`: where, 0 to 1. `active`: shown (else it waits, paused, to be shown
  again without loading again). `onLength`: the film's length, once known.
*/
const STAGE = 480; // the size it's drawn at, scaled to fit
const EVERY = 120; // ms between jumps while the pointer moves

export function ScrubFrame({
  youtube,
  file,
  part,
  active = true,
  onLength,
  className,
}: {
  youtube?: string;
  file?: string;
  part: number;
  active?: boolean;
  onLength?: (s: number) => void;
  className?: string;
}) {
  const box = useRef<HTMLDivElement>(null);
  const host = useRef<HTMLDivElement>(null);
  const video = useRef<HTMLVideoElement>(null);
  const [scale, setScale] = useState(0.5);
  /* YouTube shows the film (until then, its picture near the point) */
  const [live, setLive] = useState(false);
  // the latest of what's asked, for the player's own timer
  const want = useRef({ part, active, onLength });
  want.current = { part, active, onLength };

  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const fit = () => setScale(el.clientWidth / STAGE);
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // YouTube: a silent player, jumping to where it's asked, a few times a second at most
  useEffect(() => {
    const el = host.current;
    if (!youtube || !el) return;
    let gone = false;
    let poll = 0;
    let went = -1; // where it last jumped to (s)
    let at = 0; // when
    let was = true; // shown last time round
    const mount = document.createElement("div");
    el.appendChild(mount);
    let yt: YTPlayer | null = null;
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
              let captions = true;
              poll = window.setInterval(() => {
                const { part, active, onLength } = want.current;
                const d = p.getDuration();
                if (d > 0) onLength?.(d);
                const state = p.getPlayerState();
                if (state === 1) {
                  setLive(true);
                  if (captions) {
                    // (YouTube turns its captions on for a silent film)
                    captions = false;
                    const q = p as YTPlayer & { unloadModule?: (m: string) => void };
                    q.unloadModule?.("captions");
                    q.unloadModule?.("cc");
                  }
                }
                if (!active) {
                  if (was) p.pauseVideo();
                  was = false;
                  return;
                }
                const to = part * d;
                const now = performance.now();
                if (d > 0 && (Math.abs(to - went) > 0.3 || !was) && now - at > EVERY) {
                  p.seekTo(Math.min(to, d - 0.5), true);
                  // (only when shown again: each play / pause makes YouTube flash its icon)
                  if (!was) p.playVideo();
                  went = to;
                  at = now;
                } else if (d > 0 && (state === 0 || p.getCurrentTime() > d - 0.6)) {
                  // played on to the end while resting: round again from the point, before
                  // YouTube's end screen shows
                  p.seekTo(Math.min(went, d - 1), true);
                  if (state === 0) p.playVideo();
                }
                was = true;
              }, 50);
            },
          },
        });
      })
      .catch(() => {
        /* no YouTube: the picture stays */
      });
    return () => {
      gone = true;
      window.clearInterval(poll);
      yt?.destroy();
      mount.remove();
    };
  }, [youtube]);

  // a video file: a second, silent one, set to the point
  useEffect(() => {
    const v = video.current;
    if (!file || !v || !v.duration) return;
    if (!active) return void v.pause();
    v.currentTime = Math.min(part * v.duration, v.duration - 0.5);
    v.play().catch(() => {});
  }, [file, part, active]);

  // YouTube's picture of the film at a quarter, half or three quarters, whichever's nearest
  const still = youtube
    ? `https://i.ytimg.com/vi/${youtube}/hq${part < 0.375 ? 1 : part < 0.625 ? 2 : 3}.jpg`
    : undefined;

  return (
    <div
      ref={box}
      aria-hidden
      className={cn("pointer-events-none overflow-hidden bg-black", className)}
    >
      {still && (
        // (letterboxed: drawn a third taller, its bars fall outside)
        <span
          className="absolute inset-0"
          style={{ background: `url("${still}") center / 100% 133.4% no-repeat` }}
        />
      )}
      {youtube && (
        <div
          className={cn(
            "absolute left-0 top-0 origin-top-left transition-opacity duration-200",
            live ? "opacity-100" : "opacity-0",
          )}
          style={{ width: STAGE, height: (STAGE * 9) / 16, transform: `scale(${scale})` }}
        >
          <div
            ref={host}
            className="absolute inset-x-0 -inset-y-[20%] [&_iframe]:h-full [&_iframe]:w-full [&_iframe]:border-0"
          />
        </div>
      )}
      {file && (
        <video
          ref={video}
          src={file}
          muted
          playsInline
          preload="metadata"
          onLoadedMetadata={(e) => onLength?.(e.currentTarget.duration)}
          className="absolute inset-0 h-full w-full object-cover"
        />
      )}
    </div>
  );
}
