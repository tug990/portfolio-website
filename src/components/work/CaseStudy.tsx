import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type CSSProperties,
  type ReactNode,
  type Ref,
} from "react";
import { Link } from "@tanstack/react-router";
import { PROJECTS, type Project, type ThemeIcon } from "@/content/projects";
import { WORK_CLIENTS, type WorkClient } from "@/content/site";
import { Poster } from "@/components/Poster";
import { CardMenu, Cover } from "@/components/work/WorkUI";
import { UI, coverOf } from "@/lib/work";
import { youtubeId } from "@/lib/youtube";
import { usePlayer } from "@/lib/player";
import { cn } from "@/lib/utils";

/*
  A film's page, after the studio's design:

    ← Back to Work  ›  NABARD  ›  Sustainable Livelihoods
    ┌──────────── the film (wide) ─────────────┐  ┌── client card ───────────┐
    │ IMPACT FILM                               │  │ (emblem) │ NABARD        │
    │ Sustainable Livelihoods        ( ▶ )      │  │          │ a line        │
    │ A NABARD INITIATIVE                       │  │ Year · Duration ·        │
    │ ─────────────────────────────────────     │  │ Initiative (pill)        │
    │ ❚❚ ▶ 0:00 / 07:32           🔊 CC ⚙ ⛶    │  └──────────────────────────┘
    └───────────────────────────────────────────┘  │ More Projects   View All →
    Sustainable Livelihoods      [Share on WhatsApp]│ ▢ title / NABARD | 2025 ⋮
    NABARD | 2026 | 07:32                           │ ▢ …
    the description … Read More ⌄                   │ ▢ …
    ─────────────────────────────
    In This Film: icon label │ icon label │ …
    Project Stills: ▢ ▢ ▢ ▢

  Pressing play starts the film in the site's one player (lib/player.tsx,
  drawn by MiniPlayer): it sits over the hero, 16:9, YouTube with sound and
  its own controls (or a video file with the browser's). "Mini player" (next
  to Share), or leaving the page, shrinks it to the corner, still playing. Phones and
  tablets: one column (the client card after the description; themes and
  stills in rows you swipe).
  Used on the page at /projects/<slug> and in the sheet over the gallery.
*/

const NAVY = "#1b2350";
const SERIF = '"Libre Caslon Text", "Iowan Old Style", Georgia, serif';
/* a hairline border shot with prism colours, round a white or tinted fill */
const prismBorder = (fill = "#fff"): CSSProperties => ({
  background: `linear-gradient(${fill}, ${fill}) padding-box, linear-gradient(100deg, #c9b9ff, #9fd6ff 35%, #ffd3ab 65%, #cdb8ff) border-box`,
  border: "1.5px solid transparent",
});

export function CaseStudy({
  project,
  heroRef,
  onNext,
}: {
  project: Project;
  heroRef?: Ref<HTMLDivElement>;
  onNext: (slug: string) => void;
}) {
  const client = WORK_CLIENTS.find((c) => c.name === project.client);

  // More Projects: the client's other films, newest first; else other recent films
  const more = useMemo(() => {
    const others = PROJECTS.filter((p) => p.slug !== project.slug);
    const theirs = project.client ? others.filter((p) => p.client === project.client) : [];
    return [...(theirs.length ? theirs : others)].sort((a, b) => b.year - a.year).slice(0, 3);
  }, [project.slug, project.client]);
  const moreAreTheirs = !!client && more.every((p) => p.client === client.name);
  const player = usePlayer();
  const playingHere = player.film?.slug === project.slug;

  return (
    <div style={{ ...UI, color: NAVY }}>
      <Breadcrumb project={project} client={client} />

      <div className="mt-4 grid gap-y-8 lg:mt-5 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)] lg:gap-x-6">
        {/* the film, and everything about it */}
        <div className="min-w-0">
          <Hero project={project} client={client} heroRef={heroRef} />

          <div data-sheet-fade>
            <div className="mt-5 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
              <div className="min-w-0">
                <h1
                  id="case-title"
                  className="text-[30px] font-bold leading-[1.08] sm:text-[38px] lg:text-[42px]"
                  style={{ fontFamily: SERIF, color: NAVY }}
                >
                  {project.title}
                </h1>
                <Meta
                  items={[project.client, project.year, project.duration]}
                  className="mt-2.5 text-[12px] tracking-[0.2em] sm:text-[14px]"
                />
              </div>
              <div className="flex shrink-0 gap-3 sm:mt-1">
                {playingHere && <MiniPlayerButton onClick={player.minimise} />}
                <ShareOnWhatsApp project={project} />
              </div>
            </div>
            <Description project={project} />
          </div>

          {/* phones and tablets: the client card comes here */}
          <div data-sheet-fade className="mt-7 lg:hidden">
            <ClientCard project={project} client={client} />
          </div>

          <Themes project={project} />
          <Stills project={project} />
        </div>

        {/* wide screens: the client card, and more of their films */}
        <aside data-sheet-fade className="min-w-0">
          <div className="hidden lg:block">
            <ClientCard project={project} client={client} />
          </div>
          {more.length > 0 && (
            <MoreProjects
              films={more}
              allLink={moreAreTheirs ? client!.name : undefined}
              onOpen={onNext}
            />
          )}
        </aside>
      </div>
    </div>
  );
}

/* "NABARD | 2026 | 07:32": spaced capitals with thin bars between */
function Meta({
  items,
  className,
}: {
  items: (string | number | undefined)[];
  className?: string;
}) {
  return (
    <p
      className={cn("flex flex-wrap items-center gap-x-3 gap-y-1 font-medium uppercase", className)}
    >
      {items.filter(Boolean).map((x, i) => (
        <span key={i} className="flex items-center gap-3">
          {i > 0 && <span aria-hidden className="h-[0.95em] w-px bg-current opacity-60" />}
          {x}
        </span>
      ))}
    </p>
  );
}

/* ← Back to Work › Client › Title */
function Breadcrumb({ project, client }: { project: Project; client?: WorkClient }) {
  const chevron = (
    <svg
      aria-hidden
      viewBox="0 0 24 24"
      className="h-4 w-4 shrink-0 opacity-70"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="M9 6l6 6-6 6" />
    </svg>
  );
  return (
    <nav
      aria-label="Breadcrumb"
      data-sheet-fade
      className="flex min-w-0 items-center gap-2 pr-12 text-[14px] sm:gap-3 sm:text-[16px] lg:pr-14"
    >
      <Link to="/projects" className="flex shrink-0 items-center gap-2 hover:underline">
        <svg
          aria-hidden
          viewBox="0 0 24 24"
          className="h-[18px] w-[18px]"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M19 12H5M11 6l-6 6 6 6" />
        </svg>
        Back to Work
      </Link>
      {project.client && (
        <>
          {chevron}
          {client ? (
            <Link
              to="/projects"
              search={{ client: client.name }}
              className="max-w-[30%] shrink-0 truncate hover:underline sm:max-w-none"
            >
              {project.client}
            </Link>
          ) : (
            <span className="max-w-[30%] shrink-0 truncate sm:max-w-none">{project.client}</span>
          )}
        </>
      )}
      {chevron}
      <span
        aria-current="page"
        className="min-w-0 truncate bg-[length:100%_2px] bg-bottom bg-no-repeat pb-1.5 font-semibold"
        style={{
          backgroundImage: "linear-gradient(90deg, #a594ff, #8fd3ff 50%, #ffc896)",
        }}
      >
        {project.title}
      </span>
    </nav>
  );
}

/*
  The film. Before it plays: its cover, the words over its left side, a play
  button, and a control bar along the bottom (as in the design). Pressing
  anywhere plays it in the site's player, which then sits over this box
  (16:9 while it does). Without a film (the stand-ins), no play button.
*/
function Hero({
  project,
  client,
  heroRef,
}: {
  project: Project;
  client?: WorkClient;
  heroRef?: Ref<HTMLDivElement>;
}) {
  const { film, play, setSlot } = usePlayer();
  const yt = project.youtube ? youtubeId(project.youtube) : undefined;
  const file = project.video ?? project.trailer;
  const playable = !!(yt || file);
  const cover = coverOf(project);
  const kind = project.format ?? project.tags[0];
  const showing = film?.slug === project.slug;

  // this box is where the player sits for this film (and the sheet's heroRef)
  const slug = project.slug;
  const slot = useCallback(
    (el: HTMLDivElement | null) => {
      setSlot(slug, el);
      if (typeof heroRef === "function") heroRef(el);
      else if (heroRef) heroRef.current = el;
    },
    [slug, heroRef, setSlot],
  );

  const start = () => {
    if (!playable) return;
    play({ slug, title: project.title, client: project.client, youtube: yt, file, cover });
  };

  return (
    <div
      ref={slot}
      className={cn(
        "relative overflow-hidden rounded-xl bg-black shadow-[0_22px_44px_-26px_rgba(20,20,60,0.55)] sm:rounded-2xl",
        showing ? "aspect-video" : "aspect-video lg:aspect-[2.75/1]",
      )}
    >
      {!showing && (
        <button
          type="button"
          onClick={start}
          disabled={!playable}
          aria-label={playable ? `Play ${project.title}` : `${project.title} (no film yet)`}
          className="group absolute inset-0 block h-full w-full text-left disabled:cursor-default"
        >
          {cover ? (
            <Cover
              project={project}
              eager
              sizes="(min-width: 1024px) 66vw, 100vw"
              className="absolute inset-0 h-full w-full object-cover"
            />
          ) : (
            <span className="absolute inset-0">
              <Poster title="" live />
            </span>
          )}
          {/* shade: under the words on the left, and under the controls */}
          <span
            aria-hidden
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(90deg, rgba(6,8,20,0.72), rgba(6,8,20,0.32) 48%, rgba(6,8,20,0.06) 75%), linear-gradient(0deg, rgba(6,8,20,0.55), transparent 32%)",
            }}
          />
          <span
            className={cn(
              "absolute left-[6%] right-[34%] text-white sm:left-[8%] sm:right-[60%]",
              playable ? "top-[44%] -translate-y-1/2" : "top-1/2 -translate-y-1/2",
            )}
          >
            {kind && (
              <span className="block text-[10px] font-medium uppercase tracking-[0.3em] sm:text-[13px] lg:text-[14px]">
                {kind}
              </span>
            )}
            <span
              className="mt-1 block text-[22px] leading-[1.06] [text-shadow:0_2px_18px_rgba(0,0,0,0.35)] sm:mt-2 sm:text-[36px] lg:text-[46px]"
              style={{ fontFamily: SERIF }}
            >
              {project.title}
            </span>
            {project.client && (
              <span className="mt-1.5 block text-[10px] font-medium uppercase tracking-[0.3em] text-white/90 sm:mt-3 sm:text-[13px] lg:text-[14px]">
                {client ? `A ${project.client} initiative` : project.client}
              </span>
            )}
          </span>
          {playable && (
            <>
              <span
                aria-hidden
                className="absolute right-[7%] top-[44%] grid h-12 w-12 -translate-y-1/2 place-items-center rounded-full border-2 border-white bg-black/25 text-white backdrop-blur-[2px] transition-transform duration-300 group-hover:scale-110 sm:left-1/2 sm:right-auto sm:top-1/2 sm:h-[76px] sm:w-[76px] sm:-translate-x-1/2 lg:h-[86px] lg:w-[86px] lg:border-[3px]"
              >
                <svg viewBox="0 0 24 24" className="ml-[8%] h-[42%] w-[42%]" fill="currentColor">
                  <path d="M7 4.5v15l13-7.5z" />
                </svg>
              </span>
              <ControlBar duration={project.duration} />
            </>
          )}
        </button>
      )}
    </div>
  );
}

/* A screen with a small one in its corner: the mini player. */
function MiniIcon({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 24 24"
      className={className}
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

/* "Mini player": to the Work page, the film carrying on in the corner. */
function MiniPlayerButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={prismBorder()}
      className="flex h-12 shrink-0 items-center justify-center gap-2 rounded-full px-5 text-[15px] font-medium shadow-[0_6px_18px_-8px_rgba(110,90,200,0.45)] transition hover:-translate-y-0.5 sm:text-[16px]"
    >
      <MiniIcon className="h-5 w-5" />
      Mini player
    </button>
  );
}

/* The control bar on the cover (as in the design): a thin progress line, then the controls. */
function ControlBar({ duration }: { duration?: string }) {
  const icon = "h-[18px] w-[18px] shrink-0 sm:h-5 sm:w-5";
  const stroke = {
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };
  return (
    <span aria-hidden className="absolute inset-x-[4%] bottom-2 text-white sm:bottom-3">
      <span className="block h-[2px] rounded-full bg-white/45" />
      <span className="mt-2 flex items-center justify-between sm:mt-2.5">
        <span className="flex items-center gap-3.5 sm:gap-5">
          <svg viewBox="0 0 24 24" className={cn(icon, "hidden sm:block")} fill="currentColor">
            <rect x="6" y="5" width="4" height="14" rx="1" />
            <rect x="14" y="5" width="4" height="14" rx="1" />
          </svg>
          <svg viewBox="0 0 24 24" className={icon} fill="currentColor">
            <path d="M7 4.5v15l13-7.5z" />
          </svg>
          <span className="text-[11px] font-medium tabular-nums sm:text-[14px]">
            0:00 / {duration ?? "0:00"}
          </span>
        </span>
        <span className="flex items-center gap-3.5 sm:gap-6">
          <svg viewBox="0 0 24 24" className={cn(icon, "hidden sm:block")} {...stroke}>
            <path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z" fill="currentColor" stroke="none" />
            <path d="M15.5 9a4 4 0 010 6M18 6.5a7.5 7.5 0 010 11" />
          </svg>
          <svg viewBox="0 0 24 24" className={cn(icon, "hidden sm:block")} {...stroke}>
            <rect x="3.5" y="5.5" width="17" height="13" rx="2" />
            <path d="M10.5 10.2a2.2 2.2 0 1 0 0 3.6M16.5 10.2a2.2 2.2 0 1 0 0 3.6" />
          </svg>
          <svg viewBox="0 0 24 24" className={cn(icon, "hidden sm:block")} {...stroke}>
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" />
          </svg>
          <svg viewBox="0 0 24 24" className={icon} {...stroke}>
            <path d="M4 9V4h5M15 4h5v5M20 15v5h-5M9 20H4v-5" />
          </svg>
        </span>
      </span>
    </span>
  );
}

/* Share on WhatsApp: opens WhatsApp with the film's title and link. */
function ShareOnWhatsApp({ project }: { project: Project }) {
  const [url, setUrl] = useState(`/projects/${project.slug}`);
  useEffect(() => setUrl(`${window.location.origin}/projects/${project.slug}`), [project.slug]);
  const href = `https://wa.me/?text=${encodeURIComponent(`${project.title}: ${url}`)}`;
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      style={prismBorder()}
      className="flex h-12 min-w-0 flex-1 items-center justify-center gap-3 rounded-full px-6 text-[15px] font-medium shadow-[0_6px_18px_-8px_rgba(110,90,200,0.45)] transition hover:-translate-y-0.5 sm:w-auto sm:flex-none sm:text-[16px]"
    >
      <svg aria-hidden viewBox="0 0 24 24" className="h-[26px] w-[26px]">
        <circle cx="12" cy="12" r="11.5" fill="#25D366" />
        <path
          fill="#fff"
          d="M16.8 14.2c-.3-.1-1.6-.8-1.8-.9-.3-.1-.4-.1-.6.1l-.8 1c-.1.2-.3.2-.6.1-.3-.1-1.1-.4-2.1-1.3-.8-.7-1.3-1.5-1.4-1.8-.2-.3 0-.4.1-.5l.4-.5.3-.5c.1-.2 0-.3 0-.5l-.8-1.9c-.2-.5-.4-.4-.6-.4h-.5c-.2 0-.5.1-.7.3-.3.3-.9.9-.9 2.2s1 2.6 1.1 2.8c.1.2 1.9 2.9 4.6 4 .6.3 1.1.4 1.5.5.6.2 1.2.2 1.6.1.5-.1 1.6-.6 1.8-1.3.2-.6.2-1.2.2-1.3-.1-.1-.3-.2-.5-.3z"
        />
      </svg>
      Share on WhatsApp
      <svg
        aria-hidden
        viewBox="0 0 24 24"
        className="h-4 w-4"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <path d="M7 17L17 7M9 7h8v8" />
      </svg>
    </a>
  );
}

/* The summary and opening paragraphs; "Read More" adds the rest: the story, the quote, the credits. */
function Description({ project }: { project: Project }) {
  const [open, setOpen] = useState(false);
  const intro = [project.summary, ...project.body].filter(Boolean);
  const hasMore =
    intro.length > 1 || !!project.story?.length || !!project.quote || !!project.credits?.length;
  const body = "text-[15px] leading-[1.5] tracking-[0.025em] text-[#262d55] sm:text-[16px]";
  return (
    <div className="mt-4">
      <div className={cn("max-w-[780px] space-y-3", body, !open && "line-clamp-5")}>
        {(open ? intro : [intro.join(" ")]).map((t, i) => (
          <p key={i}>{t}</p>
        ))}
      </div>
      {open && (
        <div className="mt-5 max-w-[780px] space-y-6">
          {project.story?.map((ch) => (
            <div key={ch.heading}>
              <h3 className="text-[17px] font-semibold">{ch.heading}</h3>
              {ch.text.map((t, i) => (
                <p key={i} className={cn("mt-1.5", body)}>
                  {t}
                </p>
              ))}
            </div>
          ))}
          {project.quote && (
            <blockquote className="border-l-2 border-[#a594ff] pl-4">
              <p className="text-[19px] leading-snug" style={{ fontFamily: SERIF }}>
                “{project.quote.text}”
              </p>
              <footer className="mt-2 text-[13px] text-[#262d55]">
                {project.quote.name}
                {project.quote.role && <span className="opacity-70">, {project.quote.role}</span>}
              </footer>
            </blockquote>
          )}
          {project.credits && project.credits.length > 0 && (
            <dl className="grid grid-cols-2 gap-x-6 gap-y-2.5 text-[14px] sm:grid-cols-3">
              {project.credits.map((c, i) => (
                <div key={i}>
                  <dt className="text-[12px] text-[#262d55]/70">{c.role}</dt>
                  <dd className="font-semibold">{c.name}</dd>
                </div>
              ))}
            </dl>
          )}
        </div>
      )}
      {hasMore && (
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          className="mt-2.5 flex items-center gap-2 text-[16px] font-semibold hover:underline sm:text-[17px]"
        >
          {open ? "Read Less" : "Read More"}
          <svg
            aria-hidden
            viewBox="0 0 24 24"
            className={cn("h-[18px] w-[18px] transition-transform", open && "rotate-180")}
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
          >
            <path d="M6 9l6 6 6-6" />
          </svg>
        </button>
      )}
    </div>
  );
}

/* In This Film: the themes in a row, a thin rule between each (a row you swipe on phones). */
function Themes({ project }: { project: Project }) {
  if (!project.themes?.length) return null;
  return (
    <section data-sheet-fade className="mt-6 border-t border-black/10 pt-5 lg:mt-5">
      <h2 className="text-[19px] font-bold sm:text-[21px]">In This Film</h2>
      <ul className="-mx-4 mt-3 flex snap-x overflow-x-auto px-4 pb-1 [scrollbar-width:none] sm:mx-0 sm:overflow-visible sm:px-0">
        {project.themes.map((t, i) => (
          <li
            key={t.label}
            className={cn(
              "flex shrink-0 snap-start items-center gap-2.5 pr-4 sm:flex-1 sm:shrink sm:pr-3",
              i > 0 && "border-l border-black/15 pl-4 sm:pl-3 lg:pl-4",
            )}
          >
            <ThemeGlyph icon={t.icon} />
            <span className="w-[86px] text-[13px] leading-[1.3] sm:w-auto sm:text-[13.5px]">
              {t.label}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}

/* Project Stills: the film's own stills, else (a YouTube film) the frames YouTube takes from it. */
function Stills({ project }: { project: Project }) {
  const yt = project.youtube ? youtubeId(project.youtube) : undefined;
  const stills =
    project.stills && project.stills.length > 0
      ? project.stills
      : yt
        ? [1, 2, 3].map((n) => `https://i.ytimg.com/vi/${yt}/hq${n}.jpg`)
        : [];
  if (stills.length === 0) return null;
  return (
    <section data-sheet-fade className="mt-6">
      <h2 className="text-[19px] font-bold sm:text-[21px]">Project Stills</h2>
      <ul
        className={cn(
          "-mx-4 mt-3 flex snap-x gap-3 overflow-x-auto px-4 pb-1 [scrollbar-width:none] sm:mx-0 sm:grid sm:overflow-visible sm:px-0",
          // as many across as there are (up to four), filling the width
          ["sm:grid-cols-1", "sm:grid-cols-2", "sm:grid-cols-3", "sm:grid-cols-4"][
            Math.min(stills.length, 4) - 1
          ],
        )}
      >
        {stills.slice(0, 4).map((src, i) => (
          <li
            key={src}
            className="aspect-[2/1] w-[72%] shrink-0 snap-start overflow-hidden rounded-xl bg-black/5 sm:w-auto"
          >
            <img
              src={src}
              alt={`${project.title}, still ${i + 1}`}
              loading="lazy"
              className="h-full w-full object-cover"
            />
          </li>
        ))}
      </ul>
    </section>
  );
}

/* The client card: emblem │ name (in their colour) and a line about them; then Year, Duration, Initiative. */
function ClientCard({ project, client }: { project: Project; client?: WorkClient }) {
  const rows: { icon: ReactNode; label: string; value: ReactNode }[] = [
    { icon: <DetailIcon kind="calendar" />, label: "Year", value: project.year },
  ];
  if (project.duration)
    rows.push({ icon: <DetailIcon kind="clock" />, label: "Duration", value: project.duration });
  if (project.series)
    rows.push({
      icon: <DetailIcon kind="tag" />,
      label: "Initiative",
      value: (
        <span
          style={prismBorder("#f5f3ff")}
          className="inline-block rounded-full px-4 py-2 text-[14px] font-medium leading-tight sm:text-[15px] lg:px-3 lg:text-[14px] 2xl:px-4 2xl:text-[15px]"
        >
          {project.series}
        </span>
      ),
    });

  return (
    <section className="relative overflow-hidden rounded-2xl border border-white bg-white p-5 shadow-[0_18px_50px_-28px_rgba(60,40,140,0.4)] sm:p-7 lg:p-6 2xl:p-7">
      {/* a shard of prism glass in the corner */}
      <span
        aria-hidden
        className="pointer-events-none absolute right-0 top-0 h-16 w-24 opacity-80"
        style={{
          background:
            "linear-gradient(135deg, transparent 38%, rgba(214,206,255,0.9) 52%, rgba(255,255,255,0.95) 58%, rgba(255,214,180,0.7) 66%, rgba(170,220,255,0.6) 74%, transparent 86%)",
          clipPath: "polygon(30% 0, 100% 0, 100% 75%)",
        }}
      />
      {client ? (
        <div
          className={cn(
            "flex items-center",
            client.markIsLogo ? "justify-start" : "gap-4 sm:gap-6 lg:gap-5",
          )}
        >
          {client.markIsLogo ? (
            <img
              src={client.mark}
              alt={client.name}
              className="h-auto max-h-[76px] w-auto max-w-full"
            />
          ) : (
            <>
              <img
                src={client.mark}
                alt=""
                className="h-[72px] w-auto shrink-0 sm:h-[88px] lg:h-[80px] 2xl:h-[88px]"
              />
              <span
                aria-hidden
                className="h-[64px] w-[1.5px] shrink-0 bg-[#1b2350]/70 sm:h-[76px]"
              />
              <div className="min-w-0">
                <p
                  className={cn(
                    "font-bold leading-[1.05]",
                    client.name.length <= 10
                      ? "text-[34px] sm:text-[40px] lg:text-[34px] 2xl:text-[40px]"
                      : "text-[22px] sm:text-[26px] lg:text-[22px] 2xl:text-[25px]",
                  )}
                  style={{ fontFamily: SERIF, color: client.color }}
                >
                  {client.name}
                </p>
                {client.about && (
                  <p className="mt-1.5 text-[14px] leading-snug text-[#262d55] sm:text-[16px] lg:text-[15px] 2xl:text-[16px]">
                    {client.about}
                  </p>
                )}
              </div>
            </>
          )}
        </div>
      ) : project.client ? (
        <p className="text-[30px] font-bold leading-tight" style={{ fontFamily: SERIF }}>
          {project.client}
        </p>
      ) : null}
      {client?.markIsLogo && client.about && (
        <p className="mt-2 text-[15px] leading-snug text-[#262d55]">{client.about}</p>
      )}

      <dl
        className={cn(
          "space-y-3.5",
          (client || project.client) && "mt-5 border-t border-black/10 pt-5",
        )}
      >
        {rows.map((r) => (
          <div
            key={r.label}
            className="grid grid-cols-[26px_96px_minmax(0,1fr)] items-center gap-x-2 lg:grid-cols-[24px_80px_minmax(0,1fr)] 2xl:grid-cols-[26px_96px_minmax(0,1fr)]"
          >
            {r.icon}
            <dt className="text-[15px] sm:text-[16px]">{r.label}</dt>
            <dd className="text-[15px] font-semibold sm:text-[16px]">{r.value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

/* More Projects: the client's other films (thumbnail and length, title, client | year, ⋮). */
function MoreProjects({
  films,
  allLink,
  onOpen,
}: {
  films: Project[];
  allLink?: string;
  onOpen: (slug: string) => void;
}) {
  return (
    <section className="mt-9 lg:mt-7 lg:border-l lg:border-black/10 lg:pl-5">
      <div className="flex items-start justify-between gap-3">
        <h2>
          <span
            className="block text-[28px] font-bold leading-none sm:text-[32px] xl:text-[34px]"
            style={{ fontFamily: SERIF }}
          >
            More Projects
          </span>
          <span
            aria-hidden
            className="mt-2.5 block h-[3px] w-40 rounded-full sm:w-48"
            style={{
              background: "linear-gradient(90deg, #8b7cff, #9fd6ff 45%, #ffc896 75%, transparent)",
            }}
          />
        </h2>
        <Link
          to="/projects"
          search={allLink ? { client: allLink } : {}}
          className="mt-1 flex shrink-0 items-center gap-1.5 text-[15px] font-medium hover:underline"
        >
          View All
          <svg
            aria-hidden
            viewBox="0 0 24 24"
            className="h-[18px] w-[18px]"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M5 12h14M13 6l6 6-6 6" />
          </svg>
        </Link>
      </div>
      <ul className="mt-5 space-y-5">
        {films.map((p) => (
          <li key={p.slug}>
            <MoreItem project={p} onOpen={() => onOpen(p.slug)} />
          </li>
        ))}
      </ul>
    </section>
  );
}

function MoreItem({ project, onOpen }: { project: Project; onOpen: () => void }) {
  const cover = coverOf(project);
  return (
    <div className="group flex items-start gap-3.5 sm:gap-5 lg:gap-4">
      <button
        type="button"
        onClick={onOpen}
        aria-label={project.title}
        className="relative aspect-[1.9/1] w-[44%] shrink-0 overflow-hidden rounded-xl bg-black sm:w-[220px] lg:w-[46%]"
      >
        {cover ? (
          <Cover
            project={project}
            sizes="220px"
            className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <span className="absolute inset-0">
            <Poster title="" />
          </span>
        )}
        {project.duration && (
          <span className="absolute bottom-2 left-2 rounded-md bg-black/75 px-1.5 py-0.5 text-[12px] font-semibold tabular-nums text-white sm:text-[13px]">
            {project.duration}
          </span>
        )}
      </button>
      <div className="min-w-0 flex-1 pt-1">
        <button
          type="button"
          onClick={onOpen}
          className="line-clamp-2 text-left text-[16px] font-bold leading-[1.3] hover:underline sm:text-[17px]"
          style={{ fontFamily: SERIF }}
        >
          {project.title}
        </button>
        <Meta
          items={[project.client, project.year]}
          className="mt-2 text-[11px] tracking-[0.08em] sm:text-[12.5px]"
        />
      </div>
      <CardMenu project={project} />
    </div>
  );
}

/* ---------- small line icons ---------- */

function DetailIcon({ kind }: { kind: "calendar" | "clock" | "tag" }) {
  const p = {
    viewBox: "0 0 24 24",
    className: "h-[22px] w-[22px]",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.6,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
  };
  if (kind === "calendar")
    return (
      <svg {...p}>
        <rect x="3.5" y="5" width="17" height="15" rx="2" />
        <path d="M3.5 9.5h17M8 3v4M16 3v4M7.5 13h1.5M11.25 13h1.5M15 13h1.5M7.5 16.5h1.5M11.25 16.5h1.5M15 16.5h1.5" />
      </svg>
    );
  if (kind === "clock")
    return (
      <svg {...p}>
        <circle cx="12" cy="12" r="8.5" />
        <path d="M12 7.5V12l3 2" />
      </svg>
    );
  return (
    <svg {...p}>
      <path d="M3.5 12.5V4.5h8l9 9-8 8z" />
      <circle cx="8" cy="9" r="1.4" />
    </svg>
  );
}

function ThemeGlyph({ icon }: { icon: ThemeIcon }) {
  const p = {
    viewBox: "0 0 32 32",
    className: "h-8 w-8 shrink-0",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.5,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
  };
  const paths: Record<ThemeIcon, ReactNode> = {
    leaf: (
      <>
        <path d="M16 27V14" />
        <path d="M16 18c-6 0-9-4-9-10 6 0 9 4 9 10Z" />
        <path d="M16 15c0-6 3-10 9-10 0 6-3 10-9 10Z" />
        <path d="M16 23c-3-2-7-2-9 0M16 23c3-2 7-2 9 0" />
      </>
    ),
    people: (
      <>
        <circle cx="10" cy="11" r="3" />
        <circle cx="22" cy="11" r="3" />
        <circle cx="16" cy="9" r="3.2" />
        <path d="M4.5 22c.5-3.5 2.8-5.5 5.5-5.5s4 1 5 2M27.5 22c-.5-3.5-2.8-5.5-5.5-5.5s-4 1-5 2" />
        <path d="M10 24c.6-4 3-6.5 6-6.5s5.4 2.5 6 6.5" />
      </>
    ),
    sprout: (
      <>
        <path d="M16 27V15" />
        <path d="M16 19c-5 0-8-3-8-8 5 0 8 3 8 8Z" />
        <path d="M16 15c0-5 3-8 8-8 0 5-3 8-8 8Z" />
        <path d="M9 27h14" />
      </>
    ),
    handshake: (
      <>
        <path d="M3 13l5-4 5 2 3-1 5 1 5-1 3 3" />
        <path d="M8 9l-4 9 6 5 3-2" />
        <path d="M24 10l4 8-6 5" />
        <path d="M12 15l4-2 7 6-2 2-5-4M14 19l3 3M12 21l2 2" />
      </>
    ),
    chart: (
      <>
        <path d="M5 27h22" />
        <rect x="7" y="18" width="4" height="9" />
        <rect x="14" y="14" width="4" height="13" />
        <rect x="21" y="10" width="4" height="17" />
        <path d="M6 13l7-5 5 3 8-6M22 5h4v4" />
      </>
    ),
    heart: <path d="M16 26s-10-6-10-13a5.5 5.5 0 0 1 10-3 5.5 5.5 0 0 1 10 3c0 7-10 13-10 13Z" />,
    drop: <path d="M16 5s8 9 8 15a8 8 0 0 1-16 0c0-6 8-15 8-15Z" />,
    home: (
      <>
        <path d="M5 15 16 6l11 9" />
        <path d="M8 13v13h16V13M13 26v-7h6v7" />
      </>
    ),
  };
  return <svg {...p}>{paths[icon]}</svg>;
}
