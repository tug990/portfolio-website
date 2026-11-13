import { useEffect, useMemo, useState, type ReactNode, type Ref } from "react";
import { Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { PROJECTS, type Project, type ThemeIcon } from "@/content/projects";
import { SITE } from "@/content/site";
import {
  Avatar,
  Chip,
  CompactCard,
  FilmBox,
  MUTED,
  MiniIcon,
  SERIF,
  Scroller,
  VideoCard,
  shortName,
} from "@/components/work/WorkUI";
import { usePlayer } from "@/lib/player";
import { clientOf, coverOf, filmOf, filmsOf, kindOf, sortFilms } from "@/lib/work";
import { youtubeId } from "@/lib/youtube";
import { cn } from "@/lib/utils";

/*
  A film's page, as our YouTube watch page:

    PC                                           phone
    ┌──────── the film ────────┐ ┌ Up next ┐     the film, edge to edge
    │                          │ │ [All][From…] title
    └──────────────────────────┘ │ ▢ title  │     client · Their films
    Title (Libre Caslon)         │ ▢ title  │     [Mini player][Share]… (swipe)
    (avatar) Client  [Their films]  [Mini player][Share][WhatsApp][YouTube]
    ┌ 2026 · Impact film · 7:32  #Theme #Theme ┐   description box
    │ the description… …more                    │   Up next: full cards
    └───────────────────────────────────────────┘

  Tablets: one column, Up next two across under the film.
  The film plays in the site's one player (FilmBox, lib/player.tsx).
  "Mini player" (or the i key, as on YouTube; or on phones the ⌄ on the film)
  goes to the Work page with the film playing in the corner.
  "…more" opens the rest, as YouTube's description does: the story, a quote,
  In this film (the themes), stills, credits, and about the client.
  Used on the page at /projects/<slug> and in the sheet over the gallery
  (which passes heroRef, and opens other films in place: onNext).
*/

export function CaseStudy({
  project,
  heroRef,
  onNext,
}: {
  project: Project;
  heroRef?: Ref<HTMLDivElement>;
  onNext: (slug: string) => void;
}) {
  const client = clientOf(project);
  const player = usePlayer();
  const film = filmOf(project);
  const playingHere = player.film?.slug === project.slug && player.docked;
  const kind = kindOf(project);

  // i: the mini player, as on YouTube
  useEffect(() => {
    if (!film) return;
    const key = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (e.key !== "i" || e.metaKey || e.ctrlKey || e.altKey) return;
      if (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName)) return;
      if (player.film?.slug !== project.slug) player.play(film);
      player.minimise();
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, [film, player, project.slug]);

  return (
    // in the sheet, room above for its close button
    <div className={cn(heroRef && "pt-12 sm:pt-14")}>
      <div className="grid gap-y-7 lg:grid-cols-[minmax(0,1fr)_380px] lg:gap-x-6 xl:grid-cols-[minmax(0,1fr)_402px] xl:gap-x-8">
        <div className="min-w-0">
          <FilmBox
            project={project}
            heroRef={heroRef}
            eager
            sizes="(min-width: 1024px) 70vw, 100vw"
            className="-mx-4 sm:mx-0 sm:rounded-xl lg:rounded-2xl"
          >
            {/* a stand-in (no cover yet) carries the title, as a title card would */}
            {!coverOf(project) && (
              <span className="absolute bottom-4 left-4 right-[22%] text-white sm:bottom-6 sm:left-7">
                {kind && (
                  <span className="tracked block text-[10px] font-semibold text-white/85 sm:text-[11px]">
                    {kind}
                  </span>
                )}
                <span
                  className="mt-1 block text-[22px] leading-[1.08] [text-shadow:0_2px_18px_rgba(0,0,0,0.4)] sm:mt-2 sm:text-[36px] lg:text-[44px]"
                  style={{ fontFamily: SERIF }}
                >
                  {project.title}
                </span>
              </span>
            )}
          </FilmBox>

          <div data-sheet-fade>
            <h1
              id="case-title"
              className="mt-3.5 text-[22px] font-bold leading-[1.2] sm:text-[26px] lg:text-[28px]"
              style={{ fontFamily: SERIF }}
            >
              {project.title}
            </h1>

            <div className="mt-3 flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
              <Owner project={project} />
              <Actions
                project={project}
                onMini={
                  film
                    ? () => {
                        if (!playingHere) player.play(film);
                        player.minimise();
                      }
                    : undefined
                }
              />
            </div>

            <Description project={project} />
          </div>
        </div>

        <aside data-sheet-fade className="min-w-0" aria-label="Up next">
          <UpNext project={project} onOpen={heroRef ? onNext : undefined} />
        </aside>
      </div>
    </div>
  );
}

/* Who it was made for, as YouTube shows the channel: avatar, name, how many films, and "Their films". */
function Owner({ project }: { project: Project }) {
  const client = clientOf(project);
  const n = project.client ? filmsOf(project.client).length : PROJECTS.length;
  return (
    <div className="flex min-w-0 items-center gap-3">
      <Avatar client={client} size={40} />
      <div className="min-w-0">
        <p className="truncate text-[15px] font-semibold leading-tight">
          {project.client ?? SITE.name}
        </p>
        <p className="mt-0.5 text-[12px]" style={{ color: MUTED }}>
          {n} {n === 1 ? "film" : "films"} with {SITE.name}
        </p>
      </div>
      {client && (
        <Link
          to="/projects"
          search={{ client: client.name }}
          className="ml-1 flex h-9 shrink-0 items-center rounded-full bg-[#14172e] px-4 text-[14px] font-medium text-white transition hover:bg-[#262a4d]"
        >
          Their films
        </Link>
      )}
    </div>
  );
}

/* The row of pills under the title: Mini player, Share, WhatsApp, YouTube (a row you swipe on phones). */
function Actions({ project, onMini }: { project: Project; onMini?: () => void }) {
  const [url, setUrl] = useState(`/projects/${project.slug}`);
  useEffect(() => setUrl(`${window.location.origin}/projects/${project.slug}`), [project.slug]);
  const share = async () => {
    try {
      if (navigator.share) return await navigator.share({ title: project.title, url });
      await navigator.clipboard.writeText(url);
      toast("Link copied");
    } catch {
      /* closed the share sheet */
    }
  };
  const pill =
    "flex h-9 shrink-0 items-center gap-2 whitespace-nowrap rounded-full bg-[#14172e]/[0.06] px-4 text-[14px] font-medium transition hover:bg-[#14172e]/[0.11]";
  const icon = (d: string) => (
    <svg
      aria-hidden
      viewBox="0 0 24 24"
      className="h-[18px] w-[18px]"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d={d} />
    </svg>
  );
  return (
    <Scroller label="Actions" gap="gap-2" step={0.6} className="-mx-4 px-4 sm:mx-0 sm:px-0">
      {onMini && (
        <li>
          <button type="button" onClick={onMini} className={pill} title="Mini player (i)">
            <MiniIcon className="h-[18px] w-[18px]" />
            Mini player
            <kbd className="hidden rounded border border-[#14172e]/20 px-1 font-sans text-[11px] leading-4 opacity-60 lg:inline">
              i
            </kbd>
          </button>
        </li>
      )}
      <li>
        <button type="button" onClick={share} className={pill}>
          {icon("M14 5l6 6-6 6M20 11h-9a6 6 0 00-6 6v2")}
          Share
        </button>
      </li>
      <li>
        <a
          href={`https://wa.me/?text=${encodeURIComponent(`${project.title}: ${url}`)}`}
          target="_blank"
          rel="noreferrer"
          className={pill}
        >
          <svg aria-hidden viewBox="0 0 24 24" className="h-[18px] w-[18px]">
            <circle cx="12" cy="12" r="11.5" fill="#25D366" />
            <path
              fill="#fff"
              d="M16.8 14.2c-.3-.1-1.6-.8-1.8-.9-.3-.1-.4-.1-.6.1l-.8 1c-.1.2-.3.2-.6.1-.3-.1-1.1-.4-2.1-1.3-.8-.7-1.3-1.5-1.4-1.8-.2-.3 0-.4.1-.5l.4-.5.3-.5c.1-.2 0-.3 0-.5l-.8-1.9c-.2-.5-.4-.4-.6-.4h-.5c-.2 0-.5.1-.7.3-.3.3-.9.9-.9 2.2s1 2.6 1.1 2.8c.1.2 1.9 2.9 4.6 4 .6.3 1.1.4 1.5.5.6.2 1.2.2 1.6.1.5-.1 1.6-.6 1.8-1.3.2-.6.2-1.2.2-1.3-.1-.1-.3-.2-.5-.3z"
            />
          </svg>
          WhatsApp
        </a>
      </li>
      {project.youtube && (
        <li>
          <a href={project.youtube} target="_blank" rel="noreferrer" className={pill}>
            {icon("M14 5h5v5M19 5l-8 8M18 14v5H5V6h5")}
            YouTube
          </a>
        </li>
      )}
    </Scroller>
  );
}

/*
  The description, in a soft box as YouTube's: a first line (year, kind,
  length, the themes as #tags), three lines of the summary and opening, and
  "…more" for the rest: the story, a quote, In this film, stills, credits,
  about the client.
*/
function Description({ project }: { project: Project }) {
  const [open, setOpen] = useState(false);
  const client = clientOf(project);
  const intro = [project.summary, ...project.body].filter(Boolean);
  const tags = (project.themes ?? []).map((t) => `#${t.label.replace(/[^A-Za-z0-9]+/g, "")}`);
  const yt = project.youtube ? youtubeId(project.youtube) : undefined;
  const stills = project.stills?.length
    ? project.stills
    : yt
      ? [1, 2, 3].map((n) => `https://i.ytimg.com/vi/${yt}/hq${n}.jpg`)
      : [];
  const head = "text-[15px] font-bold";

  return (
    <div
      onClick={() => !open && setOpen(true)}
      className={cn(
        "mt-3 rounded-xl bg-[#14172e]/[0.045] p-3 text-[14px] leading-[1.6] sm:p-4",
        !open && "cursor-pointer transition hover:bg-[#14172e]/[0.075]",
      )}
    >
      <p className="font-semibold">
        {[project.year, kindOf(project), project.duration, project.series]
          .filter(Boolean)
          .join(" · ")}
        {tags.length > 0 && (
          <span className="ml-2 font-medium text-[#4a50c4]">
            {tags.slice(0, open ? undefined : 3).join(" ")}
          </span>
        )}
      </p>
      <div className={cn("mt-1 space-y-2", !open && "line-clamp-3")}>
        {(open ? intro : [intro.join(" ")]).map((t, i) => (
          <p key={i}>{t}</p>
        ))}
      </div>

      {open && (
        <div className="mt-5 space-y-6">
          {project.story?.map((ch) => (
            <div key={ch.heading}>
              <h3 className={head}>{ch.heading}</h3>
              {ch.text.map((t, i) => (
                <p key={i} className="mt-1">
                  {t}
                </p>
              ))}
            </div>
          ))}
          {project.quote && (
            <blockquote
              className="border-l-2 pl-4"
              style={{ borderImage: "linear-gradient(#7b6dff, #ffd08f) 1" }}
            >
              <p className="text-[18px] leading-snug" style={{ fontFamily: SERIF }}>
                “{project.quote.text}”
              </p>
              <footer className="mt-2 text-[13px]" style={{ color: MUTED }}>
                {project.quote.name}
                {project.quote.role && `, ${project.quote.role}`}
              </footer>
            </blockquote>
          )}
          {project.themes && project.themes.length > 0 && (
            <div>
              <h3 className={head}>In this film</h3>
              <ul className="mt-2 flex flex-wrap gap-2">
                {project.themes.map((t) => (
                  <li
                    key={t.label}
                    className="flex items-center gap-2 rounded-full bg-white px-3 py-1.5 text-[13px] font-medium ring-1 ring-[#14172e]/10"
                  >
                    <ThemeGlyph icon={t.icon} />
                    {t.label}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {stills.length > 0 && (
            <div>
              <h3 className={head}>Stills</h3>
              <ul className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
                {stills.slice(0, 4).map((src, i) => (
                  <li key={src} className="aspect-video overflow-hidden rounded-lg bg-black/5">
                    <img
                      src={src}
                      alt={`${project.title}, still ${i + 1}`}
                      loading="lazy"
                      className="h-full w-full object-cover"
                    />
                  </li>
                ))}
              </ul>
            </div>
          )}
          {project.credits && project.credits.length > 0 && (
            <div>
              <h3 className={head}>Credits</h3>
              <dl className="mt-2 grid grid-cols-2 gap-x-6 gap-y-2 sm:grid-cols-3">
                {project.credits.map((c, i) => (
                  <div key={i}>
                    <dt className="text-[12px]" style={{ color: MUTED }}>
                      {c.role}
                    </dt>
                    <dd className="font-semibold">{c.name}</dd>
                  </div>
                ))}
              </dl>
            </div>
          )}
          {client && (
            <div className="flex items-center gap-3 border-t border-[#14172e]/10 pt-4">
              <Avatar client={client} size={48} />
              <div className="min-w-0">
                <p className="font-semibold" style={{ color: client.color }}>
                  {client.name}
                </p>
                {client.about && <p style={{ color: MUTED }}>{client.about}</p>}
              </div>
            </div>
          )}
        </div>
      )}

      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setOpen((o) => !o);
        }}
        aria-expanded={open}
        className="mt-1.5 font-semibold hover:underline"
      >
        {open ? "Show less" : "…more"}
      </button>
    </div>
  );
}

/*
  Up next: chips (All, From <client>), then films: beside the player on PC as
  small rows; under it on tablets (two across) and phones (full cards).
*/
function UpNext({ project, onOpen }: { project: Project; onOpen?: (slug: string) => void }) {
  const client = clientOf(project);
  const theirs = useMemo(
    () =>
      project.client
        ? sortFilms(filmsOf(project.client), "newest").filter((p) => p.slug !== project.slug)
        : [],
    [project.client, project.slug],
  );
  const [only, setOnly] = useState(false);
  const films = useMemo(() => {
    if (only) return theirs;
    const rest = sortFilms(PROJECTS, "newest").filter(
      (p) => p.slug !== project.slug && p.client !== project.client,
    );
    return [...theirs, ...rest].slice(0, 12);
  }, [only, theirs, project.slug, project.client]);

  return (
    <div>
      {client && theirs.length > 0 && (
        <div className="mb-3 flex gap-2">
          <Chip active={!only} onClick={() => setOnly(false)}>
            All
          </Chip>
          <Chip active={only} onClick={() => setOnly(true)}>
            From {shortName(client)}
          </Chip>
        </div>
      )}
      <ul className="grid gap-y-7 sm:grid-cols-2 sm:gap-x-4 lg:grid-cols-1 lg:gap-y-3">
        {films.map((p) => (
          <li key={p.slug}>
            <div className="lg:hidden">
              <VideoCard project={p} bleed onOpen={onOpen} />
            </div>
            <div className="hidden lg:block">
              <CompactCard project={p} onOpen={onOpen} />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ---------- small line icons ---------- */

function ThemeGlyph({ icon }: { icon: ThemeIcon }) {
  const p = {
    viewBox: "0 0 32 32",
    className: "h-[18px] w-[18px] shrink-0",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2,
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
