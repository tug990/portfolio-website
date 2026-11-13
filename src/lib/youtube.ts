/*
  YouTube films: the video id from a link, its cover image, and a muted player
  with no controls of its own, driven through YouTube's IFrame API (used by the
  case-study player and the gallery's wall screens).
*/

/* The video id from a YouTube link (youtu.be/…, watch?v=…, /embed/…, /shorts/…) or a bare id. */
export function youtubeId(url: string) {
  if (/^[\w-]{11}$/.test(url)) return url;
  const m = url.match(/(?:youtu\.be\/|[?&]v=|\/embed\/|\/shorts\/|\/live\/)([\w-]{11})/);
  return m ? m[1] : undefined;
}

/* The video's cover image: YouTube's largest, as WebP (about half the size of its JPEG). */
export const youtubeCover = (id: string) => `https://i.ytimg.com/vi_webp/${id}/maxresdefault.webp`;

/*
  The cover in sizes for the browser to choose from (srcset), all WebP:
  320 x 180, 640 (4:3, the picture letterboxed: a 16:9 frame crops the bars
  off), and 1280 x 720. A small card loads ~20 KB instead of ~90 KB.
*/
export const youtubeCoverSet = (id: string) =>
  [
    `https://i.ytimg.com/vi_webp/${id}/mqdefault.webp 320w`,
    `https://i.ytimg.com/vi_webp/${id}/sddefault.webp 640w`,
    `https://i.ytimg.com/vi_webp/${id}/maxresdefault.webp 1280w`,
  ].join(", ");

/* A JPEG every video has, should a WebP size be missing. */
export const youtubeCoverFallback = (id: string) => `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;

/* youtube-nocookie.com is YouTube's privacy-enhanced mode. */
export const YT_HOST = "https://www.youtube-nocookie.com";

/*
  A muted player with no controls of its own. It doesn't use YouTube's own
  loop (which flashes "previous / pause" icons as it restarts): keepLooping
  jumps back to the start just before the end instead.
*/
export const ytPlayerVars = () => ({
  autoplay: 1,
  mute: 1, // browsers only autoplay muted
  controls: 0,
  playsinline: 1,
  rel: 0,
  modestbranding: 1,
  iv_load_policy: 3,
  disablekb: 1,
  fs: 0,
});

/* Call a few times a second: back to the start just before the end. */
export function keepLooping(p: YTPlayer) {
  const d = p.getDuration();
  if (d > 1 && p.getCurrentTime() > d - 0.6) p.seekTo(0, true);
}

/* The little of YouTube's IFrame API this site uses. */
export type YTPlayer = {
  playVideo: () => void;
  pauseVideo: () => void;
  getPlayerState: () => number; // 1 playing
  getCurrentTime: () => number;
  getDuration: () => number;
  seekTo: (s: number, allowSeekAhead: boolean) => void;
  setPlaybackRate: (r: number) => void;
  mute: () => void;
  unMute: () => void;
  getIframe: () => HTMLIFrameElement;
  destroy: () => void;
};
type YTNamespace = {
  Player: new (
    el: HTMLElement,
    opts: {
      videoId: string;
      host?: string;
      width?: string | number;
      height?: string | number;
      playerVars?: Record<string, string | number>;
      events?: {
        onReady?: () => void;
        onStateChange?: (e: { data: number }) => void;
      };
    },
  ) => YTPlayer;
};
type YTWindow = Window & { YT?: YTNamespace; onYouTubeIframeAPIReady?: () => void };

/* Loads the API script once; resolves when it's ready. */
let ytApi: Promise<YTNamespace> | null = null;
export function loadYouTubeApi() {
  const w = window as YTWindow;
  if (w.YT?.Player) return Promise.resolve(w.YT);
  ytApi ??= new Promise((ok, fail) => {
    const prev = w.onYouTubeIframeAPIReady;
    w.onYouTubeIframeAPIReady = () => {
      prev?.();
      if (w.YT) ok(w.YT);
    };
    const s = document.createElement("script");
    s.src = "https://www.youtube.com/iframe_api";
    s.async = true;
    s.onerror = () => {
      ytApi = null;
      fail(new Error("YouTube didn't load"));
    };
    document.head.appendChild(s);
  });
  return ytApi;
}
