import { useEffect, useLayoutEffect, useRef } from "react";
import type { Project } from "@/content/projects";
import { CaseStudy } from "@/components/work/CaseStudy";

/*
  A film's case study, opened as a sheet over the gallery.

  Opening: the film you clicked lifts off the wall and glides into its place
  at the top of the page (it starts exactly where the screen was), while the
  sheet's warm paper fades up behind it and the text settles in.
  "Next film" swaps the story in place. Closing (×, Escape, or Back) fades
  the sheet away and you're standing in front of the film again.
*/

const EASE = "cubic-bezier(.2,.75,.15,1)";
const PAPER = "243, 241, 238";

export function ProjectSheet({
  project,
  flyFrom,
  closing,
  onRequestClose,
  onOpened,
  onClosed,
  onNext,
}: {
  project: Project;
  flyFrom: DOMRect | null; // where the film was on screen, to fly from
  closing: boolean;
  onRequestClose: () => void;
  onOpened: () => void; // the sheet now covers the gallery
  onClosed: () => void;
  onNext: (slug: string) => void;
}) {
  const panel = useRef<HTMLDivElement>(null);
  const hero = useRef<HTMLDivElement>(null);
  const closeBtn = useRef<HTMLButtonElement>(null);
  const first = useRef(true);
  const reduce =
    typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Opening, and each swap to another film
  useLayoutEffect(() => {
    const p = panel.current;
    if (!p) return;
    const fades = p.querySelectorAll<HTMLElement>("[data-sheet-fade]");
    if (first.current) {
      first.current = false;
      const paper = p.animate(
        [{ backgroundColor: `rgba(${PAPER}, 0)` }, { backgroundColor: `rgba(${PAPER}, 1)` }],
        {
          duration: reduce ? 0 : 480,
          delay: flyFrom && !reduce ? 140 : 0,
          easing: "ease-out",
          fill: "backwards",
        },
      );
      paper.finished.then(onOpened, () => {});
      fades.forEach((el, i) =>
        el.animate(
          [
            { opacity: 0, transform: "translateY(18px)" },
            { opacity: 1, transform: "none" },
          ],
          {
            duration: reduce ? 0 : 600,
            delay: reduce ? 0 : 260 + i * 120,
            easing: EASE,
            fill: "backwards",
          },
        ),
      );
      const h = hero.current;
      if (h && flyFrom && !reduce) {
        const to = h.getBoundingClientRect();
        const dx = flyFrom.left - to.left;
        const dy = flyFrom.top - to.top;
        const sx = flyFrom.width / to.width;
        const sy = flyFrom.height / to.height;
        h.animate(
          [
            { transform: `translate(${dx}px, ${dy}px) scale(${sx}, ${sy})`, boxShadow: "none" },
            { transform: "none" },
          ],
          { duration: 720, easing: EASE, fill: "backwards" },
        );
      } else if (h) {
        h.animate([{ opacity: 0 }, { opacity: 1 }], {
          duration: reduce ? 0 : 400,
          fill: "backwards",
        });
      }
      closeBtn.current?.focus({ preventScroll: true });
    } else {
      // Another film: back to the top, and the new one fades in
      p.scrollTo({ top: 0 });
      p.querySelector("article")?.animate(
        [
          { opacity: 0, transform: "translateY(14px)" },
          { opacity: 1, transform: "none" },
        ],
        { duration: reduce ? 0 : 520, easing: EASE },
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [project.slug]);

  // Closing
  useEffect(() => {
    if (!closing) return;
    const p = panel.current;
    if (!p) return onClosed();
    const a = p.animate(
      [
        { opacity: 1, transform: "none" },
        { opacity: 0, transform: "translateY(16px)" },
      ],
      { duration: reduce ? 0 : 380, easing: "ease-in", fill: "forwards" },
    );
    a.finished.then(onClosed, onClosed);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [closing]);

  // Escape closes
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if (e.key === "Escape") onRequestClose();
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, [onRequestClose]);

  return (
    <div
      ref={panel}
      role="dialog"
      aria-modal="true"
      aria-labelledby="case-title"
      className="fixed inset-2 z-[70] overflow-y-auto overscroll-contain rounded-[14px] text-black sm:inset-3"
      style={{ backgroundColor: `rgb(${PAPER})` }}
    >
      {/* Close: stays in the corner as you scroll */}
      <div className="sticky top-0 z-10 flex h-0 justify-end">
        <button
          ref={closeBtn}
          type="button"
          onClick={onRequestClose}
          aria-label="Close, back to the gallery"
          className="mr-4 mt-4 flex h-11 w-11 items-center justify-center rounded-full bg-black/[0.06] text-black outline-none backdrop-blur transition-colors hover:bg-black/[0.12] focus-visible:ring-2 focus-visible:ring-black/35 sm:mr-6 sm:mt-6"
        >
          <svg
            viewBox="0 0 24 24"
            className="h-5 w-5"
            aria-hidden
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
          >
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>
      </div>
      <CaseStudy project={project} heroRef={hero} onNext={onNext} />
    </div>
  );
}
