import { useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { toast } from "sonner";
import type { Project } from "@/content/projects";
import { Poster } from "@/components/Poster";
import { SORTS, UI, coverOf, hasFilm, type SortKey } from "@/lib/work";
import { cn } from "@/lib/utils";

/*
  The YouTube-like pieces of the Work page (/projects): the lavender page and
  white panel, the video card with its ⋮ menu, the play button, the sort menu.
*/

/* The lavender page and the white panel the Work page and a film's page sit on (`wide`: the film page's wider panel). */
export function WorkBackdrop({ children, wide }: { children: React.ReactNode; wide?: boolean }) {
  return (
    <div className="relative overflow-hidden bg-[#f3f1fa]">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(55% 45% at 90% 5%, rgba(196,186,255,0.55), transparent 70%), radial-gradient(45% 40% at 0% 70%, rgba(255,210,238,0.45), transparent 70%), radial-gradient(40% 30% at 100% 95%, rgba(200,225,255,0.5), transparent 70%)",
        }}
      />
      <div
        className={cn(
          "relative mx-auto px-3 pb-12 pt-[84px] sm:px-4",
          wide ? "max-w-[1400px]" : "max-w-6xl",
        )}
      >
        <div className="relative overflow-hidden rounded-[24px] border border-white bg-white/85 px-4 pb-8 pt-6 shadow-[0_30px_80px_-40px_rgba(80,60,160,0.35)] sm:px-7">
          {children}
        </div>
      </div>
    </div>
  );
}

/* ---------- sorting ---------- */

/*
  The sort menu: a pill showing the current order ("Year (Newest First)", or
  just "Newest" on phones, where "Sort by:" hides too, to keep its line short).
  The browser's own picker opens on tap: the real <select> lies over the pill.
*/
export function SortMenu({ value, onChange }: { value: SortKey; onChange: (k: SortKey) => void }) {
  return (
    <label className="flex items-center gap-2.5" style={UI}>
      <span className="hidden text-sm font-medium text-black/80 sm:inline">Sort by:</span>
      <span className="relative flex h-9 items-center gap-1 rounded-full border border-[#dcd8ef] bg-white pl-3 pr-2 text-[13px] font-medium sm:gap-1.5 sm:pr-3 sm:text-sm hover:bg-[#f7f6fc] has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-[#6d7bff]/40 sm:pl-4">
        <span className="whitespace-nowrap sm:hidden">{SORTS[value].short}</span>
        <span className="hidden whitespace-nowrap sm:inline">{SORTS[value].label}</span>
        <svg
          aria-hidden
          viewBox="0 0 24 24"
          className="h-4 w-4 shrink-0"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
        <select
          value={value}
          onChange={(e) => onChange(e.target.value as SortKey)}
          aria-label="Sort by"
          className="absolute inset-0 cursor-pointer appearance-none rounded-full opacity-0"
        >
          {(Object.keys(SORTS) as SortKey[]).map((k) => (
            <option key={k} value={k}>
              {SORTS[k].label}
            </option>
          ))}
        </select>
      </span>
    </label>
  );
}

/* ---------- video cards ---------- */

export function VideoCard({ project }: { project: Project }) {
  const cover = coverOf(project);
  const line = project.series ?? project.client ?? project.tags[0];
  return (
    <article className="group" style={UI}>
      <Link
        to="/projects/$slug"
        params={{ slug: project.slug }}
        className="relative block aspect-video overflow-hidden rounded-xl bg-black"
        aria-label={project.title}
      >
        {cover ? (
          <img
            src={cover}
            alt=""
            loading="lazy"
            className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
          />
        ) : (
          <span className="absolute inset-0 transition-transform duration-500 group-hover:scale-[1.03]">
            <Poster title={project.title} />
          </span>
        )}
        {hasFilm(project) && (
          <PlayButton className="absolute left-1/2 top-1/2 h-11 w-11 -translate-x-1/2 -translate-y-1/2" />
        )}
        {project.duration && (
          <span className="absolute bottom-1.5 right-1.5 rounded-[5px] bg-black/75 px-1.5 py-0.5 text-[12px] font-semibold tabular-nums text-white">
            {project.duration}
          </span>
        )}
      </Link>
      <div className="mt-2 flex items-start gap-1 pl-0.5">
        <div className="min-w-0 flex-1">
          <h3 className="line-clamp-2 text-[15px] font-semibold leading-[1.3] text-[#0f0f0f]">
            <Link to="/projects/$slug" params={{ slug: project.slug }}>
              {project.title}
            </Link>
          </h3>
          <p className="mt-0.5 flex items-center gap-2 text-[13px] font-medium text-[#262f6b]">
            {line && <span className="truncate">{line}</span>}
            {line && <span aria-hidden className="h-3 w-px shrink-0 bg-[#262f6b]/60" />}
            <span className="tabular-nums">{project.year}</span>
          </p>
        </div>
        <CardMenu project={project} />
      </div>
    </article>
  );
}

/* The ⋮ menu on a card: open it, watch it on YouTube, copy its link. */
export function CardMenu({ project }: { project: Project }) {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const away = (e: PointerEvent) => {
      if (!root.current?.contains(e.target as Node)) setOpen(false);
    };
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("pointerdown", away);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("pointerdown", away);
      document.removeEventListener("keydown", esc);
    };
  }, [open]);

  const watch = project.youtube ?? project.link;
  const copy = async () => {
    setOpen(false);
    const url = `${window.location.origin}/projects/${project.slug}`;
    try {
      await navigator.clipboard.writeText(url);
      toast("Link copied");
    } catch {
      toast(url);
    }
  };

  const item = "flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm hover:bg-black/[0.05]";
  return (
    <div ref={root} className="relative -mr-2 -mt-1.5 shrink-0">
      <button
        type="button"
        aria-label={`More for ${project.title}`}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className="grid h-8 w-8 place-items-center rounded-full text-[#0f0f0f] hover:bg-black/[0.07]"
      >
        <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="currentColor" aria-hidden>
          <circle cx="12" cy="5" r="1.9" />
          <circle cx="12" cy="12" r="1.9" />
          <circle cx="12" cy="19" r="1.9" />
        </svg>
      </button>
      {open && (
        <div
          role="menu"
          className="absolute right-0 top-9 z-20 w-52 overflow-hidden rounded-xl bg-white py-2 shadow-[0_4px_32px_rgba(0,0,0,0.12),0_0_0_1px_rgba(0,0,0,0.04)]"
        >
          <Link
            role="menuitem"
            to="/projects/$slug"
            params={{ slug: project.slug }}
            className={item}
          >
            Open the case study
          </Link>
          {watch && (
            <a role="menuitem" href={watch} target="_blank" rel="noreferrer" className={item}>
              {project.youtube ? "Watch on YouTube" : "Watch the film"}
            </a>
          )}
          <button role="menuitem" type="button" onClick={copy} className={item}>
            Copy link
          </button>
        </div>
      )}
    </div>
  );
}

export function PlayButton({ className }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={cn(
        "grid place-items-center rounded-full border-2 border-white/95 bg-black/35 text-white backdrop-blur-[2px] transition-transform duration-300 group-hover:scale-110",
        className,
      )}
    >
      <svg viewBox="0 0 24 24" className="ml-[8%] h-[42%] w-[42%]" fill="currentColor">
        <path d="M7 4.5v15l13-7.5z" />
      </svg>
    </span>
  );
}
