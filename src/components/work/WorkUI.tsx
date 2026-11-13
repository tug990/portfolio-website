import { useCallback, useEffect, useRef, useState, type ReactNode, type Ref } from "react";
import { Link } from "@tanstack/react-router";
import { toast } from "sonner";
import type { Project } from "@/content/projects";
import type { WorkClient } from "@/content/site";
import { Poster } from "@/components/Poster";
import { SORTS, UI, clientOf, coverSources, filmOf, kindOf, type SortKey } from "@/lib/work";
import { usePlayer } from "@/lib/player";
import { GLASS_PANEL, GLASS_PILL, MENU_IN, useMenu } from "@/lib/menu";
import { cn } from "@/lib/utils";

/*
  The pieces of the Work page and a film's page: laid out after YouTube's,
  in the studio's own language (as the About and Contact pages): Jost
  throughout, light wide-spaced capitals for titles and small labels, ink on
  near-white, soft grey for what's secondary, and the prism's light (the
  site's --prism) as the one accent.
*/

export const INK = "#0a0a0a";
export const MUTED = "#6b6b6b";
/* the prism's light: the accent (a card's hover line, progress, rules) */
export const PRISM = "var(--prism)";

/*
  The page both sit on: the site's near-white. `wide`: a film's page
  (YouTube's watch page runs wider). Phones keep a 16 px edge, which films
  and cards run out over (edge to edge).
*/
export function WorkBackdrop({ children, wide }: { children: ReactNode; wide?: boolean }) {
  return (
    <div className="relative overflow-x-clip bg-[#fcfcfc]" style={{ ...UI, color: INK }}>
      <div
        className={cn(
          // phones: the header is at the bottom (SiteNav), so the page starts at the top
          "relative mx-auto px-4 pb-16 pt-[calc(env(safe-area-inset-top)+12px)] sm:px-6 sm:pt-[92px] lg:px-8",
          wide ? "max-w-[1720px]" : "max-w-[1320px]",
        )}
      >
        {children}
      </div>
    </div>
  );
}

/* ---------- avatars ---------- */

/*
  A round avatar, as YouTube puts by every channel: the studio's mark, or a
  client's exact emblem (or, for those without one, their whole logo), on
  white, inside a hairline ring.
*/
export function Avatar({
  client,
  size,
  className,
}: {
  client?: WorkClient;
  size: number;
  className?: string;
}) {
  const src = client ? client.mark : "/brand/mark-avatar.webp";
  return (
    <span
      aria-hidden
      className={cn(
        "grid shrink-0 place-items-center overflow-hidden rounded-full bg-white shadow-[0_1px_3px_rgba(20,23,46,0.12)] ring-1 ring-[#0a0a0a]/10",
        className,
      )}
      style={{ width: size, height: size }}
    >
      <img
        src={src}
        alt=""
        loading="lazy"
        className={cn(
          "object-contain",
          client?.markIsLogo ? "h-auto w-[82%]" : client ? "h-[68%] w-auto" : "h-[64%] w-auto",
        )}
      />
    </span>
  );
}

/* A client's name, short: their big word (as on their badge), else their name. */
export const shortName = (c: WorkClient) => c.big ?? c.name;

/* ---------- chips and rows that scroll ---------- */

/* A chip, as YouTube's: a small rounded label; the chosen one is ink. */
export function Chip({
  active,
  onClick,
  children,
}: {
  active?: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "press flex h-8 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-3.5 text-[13px] outline-none transition focus-visible:ring-2 focus-visible:ring-black/30",
        active
          ? "bg-[#0a0a0a] text-white"
          : "bg-[#0a0a0a]/[0.06] text-[#0a0a0a] hover:bg-[#0a0a0a]/[0.11]",
      )}
    >
      {children}
    </button>
  );
}

/*
  A row that scrolls sideways (chips, a shelf of films): by swiping, or on
  wider screens with round arrow buttons at its ends, which show only while
  there's more that way. The ends fade.
*/
export function Scroller({
  children,
  className,
  gap = "gap-3",
  step = 0.8,
  label,
}: {
  children: ReactNode;
  className?: string;
  gap?: string;
  step?: number;
  label: string;
}) {
  const el = useRef<HTMLUListElement>(null);
  const [ends, setEnds] = useState({ left: false, right: false });
  const update = useCallback(() => {
    const s = el.current;
    if (!s) return;
    setEnds({
      left: s.scrollLeft > 4,
      right: s.scrollLeft + s.clientWidth < s.scrollWidth - 4,
    });
  }, []);
  useEffect(() => {
    const s = el.current;
    if (!s) return;
    update();
    const ro = new ResizeObserver(update);
    ro.observe(s);
    return () => ro.disconnect();
  }, [update]);
  const go = (dir: 1 | -1) =>
    el.current?.scrollBy({ left: dir * el.current.clientWidth * step, behavior: "smooth" });

  const arrow = (dir: 1 | -1) => (
    <button
      type="button"
      aria-label={dir > 0 ? "More" : "Back"}
      onClick={() => go(dir)}
      className={cn(
        "absolute top-1/2 z-10 hidden h-9 w-9 -translate-y-1/2 place-items-center rounded-full bg-white text-[#0a0a0a] shadow-[0_2px_10px_rgba(20,23,46,0.18)] ring-1 ring-black/5 transition hover:bg-[#f4f3fa] sm:grid",
        dir > 0 ? "-right-2" : "-left-2",
      )}
    >
      <svg
        aria-hidden
        viewBox="0 0 24 24"
        className="h-5 w-5"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.2"
      >
        <path d={dir > 0 ? "M9 6l6 6-6 6" : "M15 6l-6 6 6 6"} />
      </svg>
    </button>
  );

  return (
    <div className={cn("relative", className)}>
      {ends.left && arrow(-1)}
      <ul
        ref={el}
        aria-label={label}
        onScroll={update}
        className={cn(
          "flex snap-x overflow-x-auto scroll-smooth [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
          gap,
        )}
        style={{
          maskImage: `linear-gradient(90deg, ${ends.left ? "transparent, #000 40px" : "#000, #000"}, #000 calc(100% - 40px), ${ends.right ? "transparent" : "#000"})`,
        }}
      >
        {children}
      </ul>
      {ends.right && arrow(1)}
    </div>
  );
}

/* ---------- a film's picture ---------- */

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

/* The picture in a card: the cover (or the stand-in poster), its length, and on hover a line of prism light. */
function Thumb({
  project,
  sizes,
  className,
}: {
  project: Project;
  sizes: string;
  className?: string;
}) {
  return (
    <span className={cn("relative block aspect-video overflow-hidden bg-[#0d0d16]", className)}>
      {coverSources(project) ? (
        <Cover
          project={project}
          sizes={sizes}
          className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]"
        />
      ) : (
        <span className="absolute inset-0 transition-transform duration-700 ease-out group-hover:scale-[1.04]">
          <Poster title={project.title} />
        </span>
      )}
      <span
        aria-hidden
        className="absolute inset-0 rounded-[inherit] ring-1 ring-inset ring-white/10"
      />
      {project.duration && (
        <span className="absolute bottom-1.5 right-1.5 rounded-[5px] bg-[#0b0b14]/75 px-1.5 py-px text-[12px] font-medium tabular-nums text-white backdrop-blur-sm">
          {project.duration}
        </span>
      )}
      <span
        aria-hidden
        className="absolute inset-x-0 bottom-0 h-[3px] origin-left scale-x-0 transition-transform duration-500 group-hover:scale-x-100"
        style={{ background: PRISM }}
      />
    </span>
  );
}

/* A link to a film's page, or (in the gallery's sheet, which opens films in place) a button. */
function ToFilm({
  project,
  onOpen,
  className,
  children,
  label,
  tabIndex,
}: {
  project: Project;
  onOpen?: (slug: string) => void;
  className?: string;
  children: ReactNode;
  label?: string;
  tabIndex?: number;
}) {
  if (onOpen)
    return (
      <button
        type="button"
        onClick={() => onOpen(project.slug)}
        aria-label={label}
        tabIndex={tabIndex}
        className={cn("text-left", className)}
      >
        {children}
      </button>
    );
  return (
    <Link
      to="/projects/$slug"
      params={{ slug: project.slug }}
      aria-label={label}
      tabIndex={tabIndex}
      className={className}
    >
      {children}
    </Link>
  );
}

/* ---------- video cards ---------- */

/*
  A film, as a YouTube video card: its picture, then the client's avatar, the
  title (two lines at most), the client, and what kind of film and its year.
  `bleed`: on phones the picture runs edge to edge (as in YouTube's app).
  `avatar={false}`: in a client's own row, where it would only repeat.
*/
export function VideoCard({
  project,
  bleed,
  avatar = true,
  onOpen,
  sizes = "(min-width: 1280px) 300px, (min-width: 1024px) 31vw, (min-width: 640px) 48vw, 100vw",
}: {
  project: Project;
  bleed?: boolean;
  avatar?: boolean;
  /* opens films in place (the gallery's sheet) instead of going to their page */
  onOpen?: (slug: string) => void;
  sizes?: string;
}) {
  const client = clientOf(project);
  return (
    <article className="group">
      <ToFilm
        project={project}
        onOpen={onOpen}
        label={project.title}
        className={cn(
          "press block w-full",
          bleed ? "-mx-4 w-[calc(100%+2rem)] sm:mx-0 sm:w-full" : "",
        )}
      >
        <Thumb project={project} sizes={sizes} className={bleed ? "sm:rounded-xl" : "rounded-xl"} />
      </ToFilm>
      <div className="mt-3 flex items-start gap-3">
        {avatar && <Avatar client={client} size={36} className="mt-0.5" />}
        <div className="min-w-0 flex-1">
          <h3 className="line-clamp-2 text-[16px] font-medium leading-[1.3] tracking-tight">
            <ToFilm project={project} onOpen={onOpen} tabIndex={-1}>
              {project.title}
            </ToFilm>
          </h3>
          <p className="tracked mt-1.5 truncate text-[10px] leading-[1.6]" style={{ color: MUTED }}>
            {project.client ?? "Insight Lab"}
          </p>
          <p className="truncate text-[13px] leading-[1.5]" style={{ color: MUTED }}>
            {[kindOf(project), project.year].filter(Boolean).join(" · ")}
          </p>
        </div>
        <CardMenu project={project} />
      </div>
    </article>
  );
}

/* A film in a list beside the player ("Up next"): a small picture, and its words to the right. */
export function CompactCard({
  project,
  onOpen,
}: {
  project: Project;
  onOpen?: (slug: string) => void;
}) {
  return (
    <article className="group flex items-start gap-2.5">
      <ToFilm
        project={project}
        onOpen={onOpen}
        label={project.title}
        className="press block w-[168px] shrink-0"
      >
        <Thumb project={project} sizes="168px" className="rounded-lg" />
      </ToFilm>
      <div className="min-w-0 flex-1 pt-0.5">
        <h3 className="line-clamp-2 text-[15px] font-medium leading-[1.3] tracking-tight">
          <ToFilm project={project} onOpen={onOpen} tabIndex={-1}>
            {project.title}
          </ToFilm>
        </h3>
        <p className="tracked mt-1.5 truncate text-[9.5px] leading-[1.6]" style={{ color: MUTED }}>
          {project.client ?? "Insight Lab"}
        </p>
        <p className="truncate text-[12px] leading-[1.5]" style={{ color: MUTED }}>
          {[kindOf(project), project.year].filter(Boolean).join(" · ")}
        </p>
      </div>
      <CardMenu project={project} />
    </article>
  );
}

/* ⋮ on a card: play it in the mini player (and keep browsing), open its page, copy its link. */
export function CardMenu({ project }: { project: Project }) {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const { play } = usePlayer();
  const film = filmOf(project);

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

  const item =
    "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-[14px] hover:bg-[#0a0a0a]/[0.06]";
  return (
    <div ref={root} className="relative -mr-2 -mt-1 shrink-0">
      <button
        type="button"
        aria-label={`More for ${project.title}`}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className="grid h-8 w-8 place-items-center rounded-full opacity-80 transition hover:bg-[#0a0a0a]/[0.07] hover:opacity-100"
      >
        <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="currentColor" aria-hidden>
          <circle cx="12" cy="5" r="1.8" />
          <circle cx="12" cy="12" r="1.8" />
          <circle cx="12" cy="19" r="1.8" />
        </svg>
      </button>
      {open && (
        <div
          role="menu"
          className={cn(
            "absolute right-0 top-9 z-30 w-60 origin-top-right rounded-xl p-1.5",
            GLASS_PANEL,
            MENU_IN,
          )}
        >
          {film && (
            <button
              role="menuitem"
              type="button"
              className={item}
              onClick={() => {
                setOpen(false);
                play(film);
              }}
            >
              <MiniIcon className="h-[18px] w-[18px]" />
              Play in the mini player
            </button>
          )}
          <Link
            role="menuitem"
            to="/projects/$slug"
            params={{ slug: project.slug }}
            className={item}
          >
            <MenuIcon d="M5 5h14v14H5zM10 9.5v5l4-2.5z" />
            Open the film
          </Link>
          <button role="menuitem" type="button" onClick={copy} className={item}>
            <MenuIcon d="M9 15l6-6M10.5 6.5l1.8-1.8a4 4 0 015.7 5.7l-1.8 1.8M13.5 17.5l-1.8 1.8a4 4 0 01-5.7-5.7l1.8-1.8" />
            Copy link
          </button>
        </div>
      )}
    </div>
  );
}

function MenuIcon({ d }: { d: string }) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 24 24"
      className="h-[18px] w-[18px] shrink-0"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d={d} />
    </svg>
  );
}

/* A screen with a small one in its corner: the mini player. */
export function MiniIcon({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 24 24"
      className={cn("shrink-0", className)}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinejoin="round"
    >
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <rect x="12" y="12" width="7" height="5" rx="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

/* ---------- the box a film plays in ---------- */

/*
  Where a film plays on a page (a film's page, the featured film on the Work
  page): its cover and a play button until it plays, then the site's player
  sits exactly over this box (lib/player.tsx). If it's in the mini player
  instead, the cover says so; playing it again brings it back here.
  `children`: words over the cover. `heroRef`: the gallery sheet's animation.
*/
export function FilmBox({
  project,
  className,
  heroRef,
  eager,
  sizes,
  children,
}: {
  project: Project;
  className?: string;
  heroRef?: Ref<HTMLDivElement>;
  eager?: boolean;
  sizes: string;
  children?: ReactNode;
}) {
  const { film, docked, play, setSlot, setOffscreen } = usePlayer();
  const playable = filmOf(project);
  const here = film?.slug === project.slug;
  const showing = here && docked;

  // Scrolled past while its film plays: it floats to the corner (and back).
  // Out once less than a quarter is left above the top; back at half.
  const [box, setBox] = useState<HTMLDivElement | null>(null);
  useEffect(() => {
    if (!box || !here) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.boundingClientRect.top < 0 && e.intersectionRatio < 0.25) setOffscreen(true);
        else if (e.intersectionRatio >= 0.5 || e.boundingClientRect.top >= 0) setOffscreen(false);
      },
      { threshold: [0, 0.25, 0.5, 1] },
    );
    io.observe(box);
    return () => {
      io.disconnect();
      setOffscreen(false);
    };
  }, [box, here, setOffscreen]);

  const slug = project.slug;
  const slot = useCallback(
    (el: HTMLDivElement | null) => {
      setSlot(slug, el);
      setBox(el);
      if (typeof heroRef === "function") heroRef(el);
      else if (heroRef) heroRef.current = el;
    },
    [slug, heroRef, setSlot],
  );

  return (
    <div
      ref={slot}
      className={cn(
        "relative aspect-video scroll-mt-3 overflow-hidden bg-[#0d0d16] sm:scroll-mt-24",
        className,
      )}
    >
      {!showing && (
        <button
          type="button"
          onClick={() => playable && play(playable)}
          disabled={!playable}
          aria-label={playable ? `Play ${project.title}` : `${project.title} (no film yet)`}
          className="group absolute inset-0 block h-full w-full text-left disabled:cursor-default"
        >
          {coverSources(project) ? (
            <Cover
              project={project}
              eager={eager}
              sizes={sizes}
              className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.015]"
            />
          ) : (
            <span className="absolute inset-0">
              <Poster title="" live />
            </span>
          )}
          <span
            aria-hidden
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(0deg, rgba(8,8,18,0.62), rgba(8,8,18,0.08) 45%, transparent 70%)",
            }}
          />
          {children}
          {here && (
            <span className="absolute left-3 top-3 flex items-center gap-2 rounded-full border border-white/30 bg-black/35 px-3 py-1.5 text-[12px] font-medium text-white backdrop-blur-md">
              <MiniIcon className="h-4 w-4" />
              Playing in the mini player
            </span>
          )}
          {playable && (
            <PlayButton className="absolute left-1/2 top-1/2 h-14 w-14 -translate-x-1/2 -translate-y-1/2 sm:h-[72px] sm:w-[72px]" />
          )}
        </button>
      )}
    </div>
  );
}

/* A round glass play button, with a ring of prism light when you're over it. */
export function PlayButton({ className }: { className?: string }) {
  return (
    <span aria-hidden className={cn("relative grid place-items-center", className)}>
      <span
        className="absolute inset-[-3px] rounded-full opacity-0 blur-[2px] transition-opacity duration-500 group-hover:opacity-100"
        style={{
          background:
            "conic-gradient(from 200deg, #1f2cff, #2bb8ff, #ffffff, #ff8a1f, #ff3d1f, #1f2cff)",
        }}
      />
      <span className="absolute inset-0 rounded-full border border-white/60 bg-white/20 shadow-[0_8px_30px_rgba(0,0,0,0.35)] backdrop-blur-md transition-transform duration-300 group-hover:scale-105" />
      <svg
        viewBox="0 0 24 24"
        className="relative ml-[8%] h-[38%] w-[38%] text-white"
        fill="currentColor"
      >
        <path d="M7 4.5v15l13-7.5z" />
      </svg>
    </span>
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
          <span aria-hidden className="relative h-6 w-px shrink-0 bg-[#0a0a0a]/40 sm:h-7" />
          <span className="relative min-w-0 text-left">
            {client.small && (
              <span className="line-clamp-3 text-[7px] font-medium uppercase leading-[1.15] tracking-[0.05em] text-[#0a0a0a]/85 sm:text-[7.5px]">
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
