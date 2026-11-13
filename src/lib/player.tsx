import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { useNavigate } from "@tanstack/react-router";

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

type PlayerState = {
  film: Film | null;
  slot: Slot | null;
  /* the film is over its page's hero, not in the corner */
  docked: boolean;
  play: (film: Film) => void;
  close: () => void;
  /* to the Work page, the film carrying on in the mini player */
  minimise: () => void;
  setSlot: (slug: string, el: HTMLElement | null) => void;
};

const PlayerContext = createContext<PlayerState | null>(null);

export function PlayerProvider({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const [film, setFilm] = useState<Film | null>(null);
  const [slot, setSlotState] = useState<Slot | null>(null);

  const play = useCallback((f: Film) => {
    setFilm((cur) => (cur?.slug === f.slug ? cur : f));
  }, []);
  const close = useCallback(() => setFilm(null), []);
  const minimise = useCallback(() => {
    navigate({ to: "/projects" });
  }, [navigate]);
  const setSlot = useCallback((slug: string, el: HTMLElement | null) => {
    setSlotState((cur) => {
      if (el) return cur?.el === el ? cur : { slug, el };
      // the page is gone: forget its slot
      return cur?.slug === slug ? null : cur;
    });
  }, []);

  const docked = !!film && !!slot && slot.slug === film.slug;
  const value = useMemo(
    () => ({ film, slot, docked, play, close, minimise, setSlot }),
    [film, slot, docked, play, close, minimise, setSlot],
  );
  return <PlayerContext.Provider value={value}>{children}</PlayerContext.Provider>;
}

export function usePlayer() {
  const ctx = useContext(PlayerContext);
  if (!ctx) throw new Error("usePlayer needs PlayerProvider (in __root.tsx)");
  return ctx;
}
