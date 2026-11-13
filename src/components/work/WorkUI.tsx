import { useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { toast } from "sonner";
import type { Project } from "@/content/projects";
import type { WorkClient } from "@/content/site";
import { Poster } from "@/components/Poster";
import { SORTS, UI, coverOf, coverSources, hasFilm, type SortKey } from "@/lib/work";
import { GLASS_PANEL, GLASS_PILL, MENU_IN, useMenu } from "@/lib/menu";
import { cn } from "@/lib/utils";

/*
  The YouTube-like pieces of the Work page (/projects): the lavender page and
  white panel, the video card with its ⋮ menu, the play button, the sort menu.
*/

/* The lavender page and the white panel the Work page and a film's page sit on (`wide`: the film page's wider panel). */
export function WorkBackdrop({ children, wide }: { children: React.ReactNode; wide?: boolean }) {
  // clipped sideways only, and the panel not at all: menus may hang below it
  return (
    <div className="relative overflow-x-clip bg-[#f3f1fa]">
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
        <div className="relative rounded-[24px] border border-white bg-white/85 px-4 pb-8 pt-6 shadow-[0_30px_80px_-40px_rgba(80,60,160,0.35)] sm:px-7">
          {children}
        </div>
      </div>
    </div>
  );
}

/* ---------- sorting ---------- */

/*
  Sort by: a glass button showing the current order ("Year (Newest First)",
  or just "Newest" on phones, where "Sort by:" hides too), opening a glass
  menu of the orders with a check by the current one. (lib/menu.ts)
*/
export function SortMenu({ value, onChange }: { value: SortKey; onChange: (k: SortKey) => void }) {
  const m = useMenu();
  return (
    <div ref={m.root} className="relative flex items-center gap-2.5" style={UI}>
      <span className="hidden text-sm font-medium text-black/80 sm:inline">Sort by:</span>
      <button
        ref={m.trigger}
        type="button"
        onClick={() => m.setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={m.open}
        aria-label={`Sort by: ${SORTS[value].label}`}
        className={cn(
          "flex h-9 items-center gap-1 rounded-full pl-3 pr-2 text-[13px] font-medium outline-none focus-visible:ring-2 focus-visible:ring-[#6d7bff]/50 sm:gap-1.5 sm:pl-4 sm:pr-3 sm:text-sm",
          GLASS_PILL,
        )}
      >
        <span className="whitespace-nowrap sm:hidden">{SORTS[value].short}</span>
        <span className="hidden whitespace-nowrap sm:inline">{SORTS[value].label}</span>
        <Chevron className={cn("transition-transform", m.open && "rotate-180")} />
      </button>
      {m.open && (
        <div
          role="listbox"
          aria-label="Sort by"
          className={cn(
            "absolute right-0 top-full z-30 mt-2 w-56 origin-top-right rounded-2xl p-1.5",
            GLASS_PANEL,
            MENU_IN,
          )}
        >
          {(Object.keys(SORTS) as SortKey[]).map((k) => (
            <button
              key={k}
              type="button"
              role="option"
              aria-selected={k === value}
              onClick={() => {
                onChange(k);
                m.choose();
              }}
              className="flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-left text-[14px] font-medium outline-none hover:bg-white/80 focus-visible:bg-white/80"
            >
              <Check on={k === value} />
              {SORTS[k].label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* The rules under a client's words, as on their badges */
const RULES = {
  tricolour: "linear-gradient(90deg, #ff7a1a, #ffb27a 28%, #f3f1ea 50%, #86c98a 72%, #1e8a3c)",
  sidhkofed: "linear-gradient(90deg, #ef5a1c, #f7b52a 38%, #8cc34a 68%, #1d6b2c)",
} as const;

/*
  A client in a glass pill, iPhone style: frosted translucent white over a
  blur, a bright top edge and a light catch across its upper half, a soft
  shadow. Inside, their exact emblem │ their words as on their badge (a small
  line, a big one in their colour, their rule), or for clients without a
  separate emblem their whole logo. `inline`: the emblem and big word alone,
  no pill (inside a button that's already glass).
*/
export function ClientBadge({
  client,
  inline,
  active,
}: {
  client: WorkClient;
  inline?: boolean;
  active?: boolean;
}) {
  const font = { fontFamily: '"Jost", ui-sans-serif, system-ui, sans-serif' };
  if (inline)
    return (
      <span className="flex min-w-0 items-center gap-1.5" style={font}>
        <img src={client.mark} alt="" className="h-6 w-auto shrink-0" />
        {!client.markIsLogo && (
          <span
            className="hidden truncate text-[12px] font-semibold uppercase sm:block"
            style={{ color: client.color }}
          >
            {client.big}
          </span>
        )}
      </span>
    );
  return (
    <span
      className={cn(
        "relative flex h-[48px] w-full items-center justify-center gap-1.5 overflow-hidden rounded-full px-2.5 sm:h-[52px] sm:gap-2 sm:px-3.5",
        "border border-white/80 bg-white/55 ring-1 ring-black/[0.06] backdrop-blur-xl backdrop-saturate-150",
        "shadow-[inset_0_1px_0_rgba(255,255,255,0.95),inset_0_-1px_0_rgba(20,20,60,0.05),0_8px_20px_-10px_rgba(30,30,70,0.4)]",
        active && "ring-2 ring-[#6d7bff]",
      )}
      style={font}
    >
      {/* light across the top of the glass */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-4 top-[1px] h-[45%] rounded-b-[40%] bg-gradient-to-b from-white/80 to-white/0"
      />
      {client.markIsLogo ? (
        <img
          src={client.mark}
          alt=""
          className="relative h-8 w-auto max-w-[88%] object-contain sm:h-9"
        />
      ) : (
        <>
          <img src={client.mark} alt="" className="relative h-7 w-auto shrink-0 sm:h-8" />
          <span aria-hidden className="relative h-6 w-px shrink-0 bg-[#1b2350]/40 sm:h-7" />
          <span className="relative min-w-0 text-left">
            {client.small && (
              <span className="line-clamp-3 text-[7px] font-medium uppercase leading-[1.15] tracking-[0.05em] text-[#1b2350]/85 sm:text-[7.5px]">
                {client.small}
              </span>
            )}
            <span
              className="block truncate text-[11px] font-semibold uppercase leading-[1.15] tracking-[-0.01em] sm:text-[13px] sm:tracking-normal"
              style={{ color: client.color }}
            >
              {client.big}
            </span>
            {client.rule && (
              <span
                aria-hidden
                className="mt-[3px] block h-[2px] w-full rounded-full"
                style={{ background: RULES[client.rule] }}
              />
            )}
          </span>
        </>
      )}
    </span>
  );
}

/* ⌄ */
export function Chevron({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 24 24"
      className={cn("h-4 w-4 shrink-0", className)}
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
    >
      <path d="M6 9l6 6 6-6" />
    </svg>
  );
}

/* ✓ by the chosen option (an empty space by the others, so they line up) */
export function Check({ on }: { on: boolean }) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 24 24"
      className={cn("h-4 w-4 shrink-0 text-[#4b5bff]", !on && "invisible")}
      fill="none"
      stroke="currentColor"
      strokeWidth="2.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M5 12.5l4.5 4.5L19 7.5" />
    </svg>
  );
}

/*
  A film's picture, light: the browser picks the size it needs from the
  YouTube cover's WebP sizes (`sizes` says how wide it shows), loads it lazily
  unless `eager` (the first thing you see), and falls back to a JPEG every
  video has if a WebP size is missing.
*/
export function Cover({
  project,
  sizes,
  eager,
  className,
}: {
  project: Project;
  sizes: string;
  eager?: boolean;
  className?: string;
}) {
  const s = coverSources(project);
  const [failed, setFailed] = useState(false);
  if (!s) return null;
  const useFallback = failed && !!s.fallback;
  return (
    <img
      src={useFallback ? s.fallback : s.src}
      srcSet={useFallback ? undefined : s.srcSet}
      sizes={s.srcSet && !useFallback ? sizes : undefined}
      alt=""
      loading={eager ? "eager" : "lazy"}
      fetchPriority={eager ? "high" : undefined}
      decoding="async"
      onError={() => s.fallback && !failed && setFailed(true)}
      className={className}
    />
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
          <Cover
            project={project}
            sizes="(min-width: 1024px) 270px, (min-width: 768px) 33vw, (min-width: 640px) 50vw, 100vw"
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
