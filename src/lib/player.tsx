import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { useNavigate, useRouter } from "@tanstack/react-router";

/*
  The site's one film player, shared by every page (like YouTube's): which
  film is playing, and where it should show.

  A film's page gives its hero box as the player's "slot". While that film is
  playing and its page is open, the player (MiniPlayer, drawn once in
  __root.tsx) sits exactly over the slot. Leave the page, or minimise it
  ("Mini player", or ⌄ on phones: that goes to the Work page), and the same
  player shrinks to the corner (on phones, a bar along the bottom) and keeps
  playing while you browse. It's never moved in the page, only resized and
  placed, because moving a video's element reloads it.

  Minimising on a film's own page goes to the Work page; anywhere else (the
  sheet over the gallery) the film just leaves its box for the corner, until
  it's played there again. Scrolling past its box floats it to the corner
  too, and back into the box when you scroll back (`setOffscreen`, FilmBox).

  `primed`: the film whose page is open, waiting to be played (`prime`, from its FilmBox). Its
  YouTube player is made at once, unseen over the box, so a tap on the play button lands in
  YouTube's own frame and starts it there and then, with sound (a phone gives a film sound only
  for a tap in its own frame, not for one on the page that starts it a moment later).

  `ambient`: the light of the film playing over its page, for the page around
  it to take on (WorkUI.tsx `Ambient`): a frame of it (YouTube's pictures of
  the film at a quarter, half and three quarters, picked by where it's at),
  or the video itself (a file, read live). Set by the player while the film
  is over its page and has started; null otherwise.
*/

export type Film = {
  slug: string;
  title: string;
  client?: string;
  /* a YouTube id, or a video file */
  youtube?: string;
  file?: string;
  cover?: string;
};

type Slot = { slug: string; el: HTMLElement };

/* where the playing film is, for a copy of it kept in step (WorkUI.tsx's blurred film behind
   the page in cinema) */
export type FilmClock = { now: () => number; playing: () => boolean };
export type Ambient = {
  frame?: string;
  video?: HTMLVideoElement;
  /* the film on YouTube, and its clock: for the blurred copy of it behind the page */
  youtube?: string;
  clock?: FilmClock;
} | null;

type PlayerState = {
  film: Film | null;
  slot: Slot | null;
  /* the film is over its page's hero, not in the corner */
  docked: boolean;
  play: (film: Film) => void;
  close: () => void;
  /* the film whose page is open, its player made and waiting for the tap (see the top) */
  primed: Film | null;
  prime: (film: Film) => void;
  unprime: (slug: string) => void;
  /* to the corner (from a film's page: to the Work page), still playing */
  minimise: () => void;
  /* its box has scrolled out of sight (the film floats to the corner meanwhile) */
  setOffscreen: (off: boolean) => void;
  setSlot: (slug: string, el: HTMLElement | null) => void;
  ambient: Ambient;
  setAmbient: (a: Ambient) => void;
};

const PlayerContext = createContext<PlayerState | null>(null);

export function PlayerProvider({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const router = useRouter();
  const [film, setFilm] = useState<Film | null>(null);
  const [slot, setSlotState] = useState<Slot | null>(null);
  /* minimised while its box is still on screen */
  const [held, setHeld] = useState(false);
  const [offscreen, setOffscreen] = useState(false);
  const [ambient, setAmbient] = useState<Ambient>(null);
  const [primed, setPrimed] = useState<Film | null>(null);

  const play = useCallback((f: Film) => {
    setFilm((cur) => (cur?.slug === f.slug ? cur : f));
    setHeld(false);
  }, []);
  const prime = useCallback((f: Film) => setPrimed(f), []);
  const unprime = useCallback(
    (slug: string) => setPrimed((cur) => (cur?.slug === slug ? null : cur)),
    [],
  );
  const close = useCallback(() => {
    setFilm(null);
    setHeld(false);
  }, []);
  const minimise = useCallback(() => {
    if (/^\/projects\/[^/]+/.test(router.state.location.pathname)) navigate({ to: "/projects" });
    else setHeld(true);
  }, [navigate, router]);
  const setSlot = useCallback((slug: string, el: HTMLElement | null) => {
    setSlotState((cur) => {
      if (el) return cur?.el === el ? cur : { slug, el };
      // the page is gone: forget its slot
      return cur?.slug === slug ? null : cur;
    });
    if (!el) {
      setHeld(false);
      setOffscreen(false);
    }
  }, []);

  const docked = !!film && !!slot && slot.slug === film.slug && !held && !offscreen;
  const value = useMemo(
    () => ({
      film,
      slot,
      docked,
      play,
      close,
      primed,
      prime,
      unprime,
      minimise,
      setOffscreen,
      setSlot,
      ambient,
      setAmbient,
    }),
    [film, slot, docked, play, close, primed, prime, unprime, minimise, setSlot, ambient],
  );
  return <PlayerContext.Provider value={value}>{children}</PlayerContext.Provider>;
}

export function usePlayer() {
  const ctx = useContext(PlayerContext);
  if (!ctx) throw new Error("usePlayer needs PlayerProvider (in __root.tsx)");
  return ctx;
}
