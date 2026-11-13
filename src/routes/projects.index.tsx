import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { PROJECTS, type Project } from "@/content/projects";
import { WORK_CLIENTS, WORK_PAGE } from "@/content/site";
import { Poster } from "@/components/Poster";
import {
  Check,
  Chevron,
  ClientBadge,
  Cover,
  PlayButton,
  SortMenu,
  VideoCard,
  WorkBackdrop,
} from "@/components/work/WorkUI";
import { GLASS_PANEL, GLASS_PILL, MENU_IN, useMenu } from "@/lib/menu";
import { UI, coverOf, hasFilm, sortFilms, type SortKey } from "@/lib/work";
import { seo } from "@/lib/seo";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/projects/")({
  // ?client=<name> opens the page already showing only that client's films
  validateSearch: (s: Record<string, unknown>): { client?: string } =>
    typeof s.client === "string" && WORK_CLIENTS.some((c) => c.name === s.client)
      ? { client: s.client }
      : {},
  head: () => seo("Work", WORK_PAGE.intro),
  component: Work,
});

/*
  The Work page, a compact YouTube-like layout on one white panel:
    the header picture (brand/work-header.webp), OUR WORK / Stories that create impact. over it
    the featured film: a slim banner with a play button
    one line: PROJECTS (n) | Initiatives of: [a client's badge, or All] | Sort by: [...]
      (Initiatives of opens the client badges, site.ts WORK_CLIENTS; picking one shows only their films)
    the films as video cards, four across
  The panel, cards and sort menu are in components/work/WorkUI.tsx.
*/

function Work() {
  const [sort, setSort] = useState<SortKey>("newest");
  const search = Route.useSearch();
  const [client, setClient] = useState<string | null>(search.client ?? null);

  // The banner: the first featured film that has a film and a picture
  const featured =
    PROJECTS.find((p) => p.featured && hasFilm(p) && coverOf(p)) ??
    PROJECTS.find((p) => hasFilm(p)) ??
    PROJECTS[0];

  const shown = useMemo(
    () =>
      sortFilms(
        PROJECTS.filter((p) => !client || p.client === client),
        sort,
      ),
    [client, sort],
  );

  return (
    <WorkBackdrop>
      <Hero />
      {featured && <FeaturedFilm project={featured} />}

      <section aria-labelledby="projects" className="mt-6">
        {/* One line: PROJECTS (n) on the left; Initiatives of and Sort by on the right */}
        <div className="relative flex items-center justify-between gap-2">
          <h2
            id="projects"
            className="tracked whitespace-nowrap text-[12px] font-semibold tracking-[0.16em] sm:text-sm sm:tracking-[0.32em]"
          >
            Projects <span className="text-black/45 max-[359px]:hidden">({shown.length})</span>
          </h2>
          <div className="flex items-center gap-1.5 sm:gap-5">
            <InitiativesFilter selected={client} onSelect={setClient} />
            <SortMenu value={sort} onChange={setSort} />
          </div>
        </div>

        {shown.length > 0 ? (
          <ul className="mt-4 grid gap-x-3 gap-y-5 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {shown.map((p) => (
              <li key={p.slug}>
                <VideoCard project={p} />
              </li>
            ))}
          </ul>
        ) : (
          <p
            className="mt-4 rounded-xl bg-[#f6f5fb] px-5 py-10 text-center text-[15px] text-black/60"
            style={UI}
          >
            Films for {client} are on their way.
          </p>
        )}
      </section>
    </WorkBackdrop>
  );
}

/*
  "Initiatives of": a glass button on the Projects line showing the chosen
  client's badge (or "All"). It opens "All films" and the clients' badges
  (site.ts WORK_CLIENTS): a glass dropdown under the Projects line on tablets
  and up (anchored to the whole line, so it always fits inside the panel), a
  glass panel rising from the bottom on phones. Picking one shows only that
  client's films. Behaviour and glass: lib/menu.ts.
*/
function InitiativesFilter({
  selected,
  onSelect,
}: {
  selected: string | null;
  onSelect: (name: string | null) => void;
}) {
  const m = useMenu({ lockScroll: () => window.matchMedia("(max-width: 639px)").matches });
  const current = WORK_CLIENTS.find((c) => c.name === selected);

  const pick = (name: string | null) => {
    onSelect(name);
    m.choose();
  };

  // "All films", then a badge per client: in the dropdown and the phone panel alike
  const choices = (
    <>
      <button
        type="button"
        role="option"
        aria-selected={!selected}
        onClick={() => pick(null)}
        style={UI}
        className={cn(
          "flex h-10 w-full items-center justify-center gap-2 rounded-full text-sm font-semibold outline-none transition focus-visible:ring-2 focus-visible:ring-[#6d7bff]",
          !selected
            ? "bg-white/90 text-[#262f6b] shadow-[0_1px_6px_-2px_rgba(40,30,90,0.3)] ring-1 ring-[#6d7bff]/60"
            : "bg-white/40 text-black/70 ring-1 ring-black/[0.06] hover:bg-white/80",
        )}
      >
        <Check on={!selected} />
        All films
      </button>
      <ul className="mt-2.5 grid grid-cols-2 gap-2">
        {WORK_CLIENTS.map((c) => {
          const on = selected === c.name;
          return (
            <li key={c.name}>
              <button
                type="button"
                role="option"
                aria-selected={on}
                aria-label={`Initiatives of ${c.name}`}
                onClick={() => pick(c.name)}
                className={cn(
                  "block w-full rounded-full outline-none transition duration-200 focus-visible:ring-2 focus-visible:ring-[#6d7bff]",
                  "hover:-translate-y-0.5 hover:drop-shadow-[0_6px_10px_rgba(110,90,200,0.25)]",
                )}
              >
                <ClientBadge client={c} active={on} />
              </button>
            </li>
          );
        })}
      </ul>
    </>
  );

  return (
    // not positioned itself: the dropdown hangs from the whole Projects line
    <div ref={m.root} className="flex items-center gap-2.5" style={UI}>
      <span className="hidden text-sm font-medium text-black/80 sm:inline">Initiatives of:</span>
      <button
        ref={m.trigger}
        type="button"
        onClick={() => m.setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={m.open}
        aria-label={`Initiatives of: ${current ? current.name : "all"}`}
        className={cn(
          "flex h-9 items-center gap-1 rounded-full pl-1.5 pr-2 text-sm font-medium outline-none focus-visible:ring-2 focus-visible:ring-[#6d7bff]/50 sm:gap-1.5 sm:pl-2 sm:pr-3",
          GLASS_PILL,
        )}
      >
        {current ? (
          <ClientBadge client={current} inline />
        ) : (
          <span className="flex items-center gap-1.5 pl-1 sm:pl-1.5">
            {/* a funnel: this filters */}
            <svg
              aria-hidden
              viewBox="0 0 24 24"
              className="h-4 w-4 sm:hidden"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinejoin="round"
            >
              <path d="M4 5h16l-6 7.5V19l-4-2v-4.5z" />
            </svg>
            <span className="hidden sm:inline">All</span>
          </span>
        )}
        {/* down on wider screens (a dropdown); up on phones (the panel rises) */}
        <Chevron
          className={cn("transition-transform max-sm:rotate-180", m.open && "sm:rotate-180")}
        />
      </button>

      {m.open && (
        <>
          {/* tablets and up: a glass dropdown under the Projects line, at its right */}
          <div
            role="listbox"
            aria-label="Initiatives of"
            className={cn(
              "absolute right-0 top-full z-30 mt-2 hidden w-[min(400px,100%)] origin-top-right rounded-3xl p-3 sm:block",
              GLASS_PANEL,
              MENU_IN,
            )}
          >
            {choices}
          </div>

          {/* phones: a glass panel rising from the bottom of the screen */}
          <div className="fixed inset-0 z-50 sm:hidden">
            <button
              type="button"
              aria-label="Close"
              tabIndex={-1}
              onClick={() => m.setOpen(false)}
              className="absolute inset-0 bg-black/30 backdrop-blur-[2px] duration-200 animate-in fade-in"
            />
            <div
              role="listbox"
              aria-modal="true"
              aria-label="Initiatives of"
              className={cn(
                "absolute inset-x-0 bottom-0 max-h-[80vh] overflow-y-auto rounded-t-[28px] px-4 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-3 duration-300 animate-in slide-in-from-bottom",
                GLASS_PANEL,
                "bg-white/75",
              )}
            >
              <span aria-hidden className="mx-auto block h-1 w-10 rounded-full bg-black/20" />
              <div className="mb-3 mt-3 flex items-center justify-between">
                <h3 className="tracked text-[12px] font-semibold">Initiatives of</h3>
                <button
                  type="button"
                  onClick={() => m.setOpen(false)}
                  aria-label="Close"
                  className="grid h-9 w-9 place-items-center rounded-full bg-white/60 text-black/70 ring-1 ring-black/[0.06] hover:bg-white/90"
                >
                  <svg
                    aria-hidden
                    viewBox="0 0 24 24"
                    className="h-5 w-5"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M6 6l12 12M18 6L6 18" />
                  </svg>
                </button>
              </div>
              {choices}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

/* ---------- the header: the picture, with the words over its left side ---------- */

/*
  public/brand/work-header-{1200,2000,phone}.webp (2000 x 667 at full size): sunrise over forested hills on
  the left, a glass prism splitting the light on the right. The words sit over
  the sunrise on a soft shade; on phones the picture is cropped taller and
  shifted right, so the prism stays in view, with the words along the bottom.
*/
function Hero() {
  const [first, ...rest] = WORK_PAGE.headline.split("\n");
  return (
    // Its height is the words plus room above and below them (never less than a
    // pleasing strip of the picture), so the words always fit with space around
    <header className="relative flex min-h-[300px] items-end overflow-hidden rounded-2xl bg-[#1d1b2a] sm:min-h-[260px] sm:items-center lg:min-h-[330px]">
      {/*
        Light, and as sharp as before: phones (where it's cropped tall) get a
        full-resolution crop of the prism side (60 KB); wider screens the
        1200 or 2000 px picture as the screen needs (55 / 106 KB). Was 200 KB
        everywhere.
      */}
      <picture>
        <source media="(max-width: 639px)" srcSet="/brand/work-header-phone.webp" />
        <img
          src="/brand/work-header-1200.webp"
          srcSet="/brand/work-header-1200.webp 1200w, /brand/work-header-2000.webp 2000w"
          sizes="(min-width: 1152px) 1100px, 960px"
          width={2000}
          height={667}
          fetchPriority="high"
          decoding="async"
          alt=""
          className="absolute inset-0 h-full w-full object-cover object-[70%_50%] sm:object-[70%_50%] lg:object-center"
        />
      </picture>
      {/* shade under the words: from below on phones, from the left on wider screens */}
      <span
        aria-hidden
        className="absolute inset-0 sm:hidden"
        style={{
          background:
            "linear-gradient(0deg, rgba(8,6,18,0.88), rgba(8,6,18,0.62) 50%, rgba(8,6,18,0.15) 85%)",
        }}
      />
      <span
        aria-hidden
        className="absolute inset-0 hidden sm:block"
        style={{
          background:
            "linear-gradient(90deg, rgba(8,6,18,0.82), rgba(8,6,18,0.66) 34%, rgba(8,6,18,0.3) 56%, transparent 72%)",
        }}
      />
      <div className="relative w-full px-5 pb-6 pt-16 text-white sm:max-w-[58%] sm:px-9 sm:py-10 lg:max-w-[50%] lg:px-11 lg:py-12">
        <p className="tracked text-[11px] font-semibold text-white/95 sm:text-[13px]">
          {WORK_PAGE.eyebrow}
        </p>
        <h1 className="mt-2 text-[21px] font-normal uppercase leading-[1.3] tracking-[0.2em] [text-shadow:0_2px_14px_rgba(0,0,0,0.55)] sm:mt-3 sm:text-[28px] lg:text-[34px]">
          {first}
          {rest.length > 0 && (
            <>
              <br className="hidden sm:block" /> {rest.join(" ")}
            </>
          )}
        </h1>
        <span
          aria-hidden
          className="mt-3 block h-[4px] w-28 rounded-full sm:w-36"
          style={{ background: "linear-gradient(90deg, #8f9bff, #c9bfff 55%, #fff)" }}
        />
        <p
          className="mt-3 max-w-sm text-[14px] leading-snug text-white [text-shadow:0_1px_8px_rgba(0,0,0,0.6)] sm:text-[15px]"
          style={UI}
        >
          {WORK_PAGE.intro}
        </p>
      </div>
    </header>
  );
}

/* ---------- the featured film: a slim banner ---------- */

function FeaturedFilm({ project }: { project: Project }) {
  const cover = coverOf(project);
  const kind = project.format ?? project.tags[0];
  return (
    <Link
      to="/projects/$slug"
      params={{ slug: project.slug }}
      aria-label={`Watch ${project.title}`}
      className="group relative mt-4 block aspect-[16/9] overflow-hidden rounded-2xl bg-black sm:aspect-[4/1] lg:aspect-[5.6/1]"
    >
      {cover ? (
        <Cover
          project={project}
          sizes="(min-width: 1152px) 1100px, 100vw"
          className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.02]"
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
            "linear-gradient(90deg, rgba(0,0,0,0.75), rgba(0,0,0,0.3) 50%, rgba(0,0,0,0.12)), linear-gradient(0deg, rgba(0,0,0,0.3), transparent 50%)",
        }}
      />
      {project.client && (
        <span
          style={UI}
          className="absolute right-4 top-4 rounded-full border-[1.5px] border-white/90 px-3.5 py-1 text-[12px] font-semibold uppercase tracking-[0.12em] text-white sm:right-6"
        >
          {project.client}
        </span>
      )}
      <span className="absolute bottom-4 left-5 right-20 text-white sm:bottom-auto sm:left-9 sm:right-auto sm:top-1/2 sm:max-w-[40%] sm:-translate-y-1/2">
        {kind && <span className="tracked block text-[11px] font-medium">{kind}</span>}
        <span className="mt-1 block text-[26px] font-medium leading-[1.05] sm:text-[34px]">
          {project.title}
        </span>
        {project.client && (
          <span className="tracked mt-1.5 block text-[11px] text-white/90">{project.client}</span>
        )}
      </span>
      {/* Phones: in the corner, beside the title. Wider: clear of the title, centred when there's room */}
      <PlayButton className="absolute bottom-4 right-4 h-12 w-12 sm:bottom-auto sm:left-[62%] sm:right-auto sm:top-1/2 sm:h-14 sm:w-14 sm:-translate-x-1/2 sm:-translate-y-1/2 lg:left-1/2" />
    </Link>
  );
}
