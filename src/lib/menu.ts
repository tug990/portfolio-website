import { useCallback, useEffect, useRef, useState } from "react";

/*
  Dropdown menus (Sort by, Initiatives of): the shared behaviour and the
  frosted-glass look.

  The look, like Apple's glass: translucent white over a strong blur that
  keeps colour (what's behind shows through, softened), a fine white edge with
  a light catch along the top, and a soft deep shadow.
*/
export const GLASS_PANEL =
  "border border-white/70 bg-white/60 shadow-[0_22px_60px_-14px_rgba(40,30,90,0.38),0_2px_6px_rgba(40,30,90,0.06),inset_0_1px_0_rgba(255,255,255,0.85)] ring-1 ring-black/[0.05] backdrop-blur-2xl backdrop-saturate-[1.8]";
/* the buttons that open them: the same glass, lighter */
export const GLASS_PILL =
  "border border-white/80 bg-white/60 shadow-[0_2px_10px_-4px_rgba(40,30,90,0.28),inset_0_1px_0_rgba(255,255,255,0.9)] ring-1 ring-black/[0.07] backdrop-blur-xl backdrop-saturate-150 transition hover:bg-white/85";
/* how they open: a quick fade and scale from the button */
export const MENU_IN = "duration-150 animate-in fade-in zoom-in-95";

/*
  The behaviour, for a menu whose button and options sit inside `root`:
  opening focuses the chosen option (or the first); arrow keys (and Home / End)
  move between options ([role="option"], the visible ones); Escape closes and
  returns to the button; Tab or a click outside closes. `lockScroll` keeps the
  page still while open (for a menu that covers the screen, on phones).
*/
export function useMenu({ lockScroll }: { lockScroll?: () => boolean } = {}) {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const options = () =>
      [...(root.current?.querySelectorAll<HTMLElement>('[role="option"]') ?? [])].filter(
        (el) => el.offsetParent !== null,
      );
    (options().find((o) => o.getAttribute("aria-selected") === "true") ?? options()[0])?.focus({
      preventScroll: true,
    });

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        setOpen(false);
        trigger.current?.focus();
        return;
      }
      if (e.key === "Tab") return setOpen(false);
      const list = options();
      if (!list.length) return;
      const i = list.indexOf(document.activeElement as HTMLElement);
      const go = (n: number) => {
        e.preventDefault();
        list[(n + list.length) % list.length]?.focus();
      };
      if (e.key === "ArrowDown" || e.key === "ArrowRight") go(i + 1);
      else if (e.key === "ArrowUp" || e.key === "ArrowLeft") go(i - 1);
      else if (e.key === "Home") go(0);
      else if (e.key === "End") go(list.length - 1);
    };
    const away = (e: PointerEvent) => {
      if (!root.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", away);
    const lock = lockScroll?.() ?? false;
    const before = document.body.style.overflow;
    if (lock) document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", away);
      if (lock) document.body.style.overflow = before;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  /* close after a choice, back on the button */
  const choose = useCallback(() => {
    setOpen(false);
    trigger.current?.focus({ preventScroll: true });
  }, []);

  return { open, setOpen, root, trigger, choose };
}
