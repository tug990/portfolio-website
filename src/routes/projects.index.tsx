import { useEffect, useMemo, useRef, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { PROJECTS, type Project } from "@/content/projects";
import { WORK_CLIENTS, WORK_PAGE } from "@/content/site";
import { Poster } from "@/components/Poster";
import { PlayButton, SortMenu, VideoCard, WorkBackdrop } from "@/components/work/WorkUI";
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
        <div className="flex items-center justify-between gap-2">
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
  "Initiatives of": one button on the Projects line, showing the chosen
  client's badge (or "All"). It opens the badges (site.ts WORK_CLIENTS) and
  "All films": in a dropdown under it on tablets and up, in a menu sliding up
  from the bottom on phones. Picking one shows only that client's films.
*/
function InitiativesFilter({
  selected,
  onSelect,
}: {
  selected: string | null;
  onSelect: (name: string | null) => void;
}) {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const current = WORK_CLIENTS.find((c) => c.name === selected);

  useEffect(() => {
    if (!open) return;
    const phone = window.matchMedia("(max-width: 639px)").matches;
    // phones: the page stays put behind the menu
    const before = document.body.style.overflow;
    if (phone) document.body.style.overflow = "hidden";
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    // the dropdown closes when you click elsewhere (the phone menu has its own backdrop)
    const away = (e: PointerEvent) => {
      if (!phone && !root.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("keydown", esc);
    document.addEventListener("pointerdown", away);
    root.current
      ?.querySelector<HTMLElement>(
        `[data-menu="${phone ? "sheet" : "drop"}"] :is(button[aria-pressed=true], button)`,
      )
      ?.focus();
    const t = trigger.current;
    return () => {
      document.body.style.overflow = before;
      document.removeEventListener("keydown", esc);
      document.removeEventListener("pointerdown", away);
      t?.focus();
    };
  }, [open]);

  const pick = (name: string | null) => {
    onSelect(name);
    setOpen(false);
  };

  // "All films" and a badge per client: in the dropdown and the phone menu alike
  const choices = (cols: string) => (
    <>
      <button
        type="button"
        onClick={() => pick(null)}
        aria-pressed={!selected}
        style={UI}
        className={cn(
          "h-10 w-full rounded-full border text-sm font-semibold",
          !selected
            ? "border-[#6d7bff] bg-[#f1f0ff] text-[#262f6b]"
            : "border-[#dcd8ef] text-black/70 hover:bg-[#f7f6fc]",
        )}
      >
        All films
      </button>
      <ul className={cn("mt-2.5 grid gap-2", cols)}>
        {WORK_CLIENTS.map((c) => {
          const on = selected === c.name;
          return (
            <li key={c.name}>
              <button
                type="button"
                onClick={() => pick(c.name)}
                aria-pressed={on}
                aria-label={`Initiatives of ${c.name}`}
                className={cn(
                  "block w-full rounded-full outline-none transition duration-200 focus-visible:ring-2 focus-visible:ring-[#6d7bff]",
                  "hover:-translate-y-0.5 hover:drop-shadow-[0_6px_10px_rgba(110,90,200,0.25)]",
                  on && "ring-2 ring-[#6d7bff] ring-offset-1",
                )}
              >
                <img
                  src={c.logo}
                  alt=""
                  width={480}
                  height={160}
                  loading="lazy"
                  className="block h-auto w-full"
                />
              </button>
            </li>
          );
        })}
      </ul>
    </>
  );

  return (
    <div ref={root} className="relative flex items-center gap-2.5" style={UI}>
      <span className="hidden text-sm font-medium text-black/80 sm:inline">Initiatives of:</span>
      <button
        ref={trigger}
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label={`Initiatives of: ${current ? current.name : "all"}`}
        className="flex h-9 items-center gap-1 rounded-full border border-[#dcd8ef] bg-white pl-1.5 pr-2 text-sm font-medium sm:gap-1.5 sm:pl-2 sm:pr-3 hover:bg-[#f7f6fc] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6d7bff]/40"
      >
        {current ? (
          <img src={current.logo} alt="" className="-my-1 h-6 w-auto sm:h-8" />
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
        {/* down on wider screens (a dropdown); up on phones (the menu rises) */}
        <svg
          aria-hidden
          viewBox="0 0 24 24"
          className={cn(
            "h-4 w-4 shrink-0 transition-transform",
            open && "sm:rotate-180",
            "max-sm:rotate-180",
          )}
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>

      {open && (
        <>
          {/* tablets and up: a dropdown under the button */}
          <div
            data-menu="drop"
            role="dialog"
            aria-label="Initiatives of"
            className="absolute right-0 top-11 z-30 hidden w-[440px] rounded-2xl bg-white p-3 shadow-[0_12px_40px_-8px_rgba(40,30,90,0.28),0_0_0_1px_rgba(0,0,0,0.04)] duration-150 animate-in fade-in slide-in-from-top-1 sm:block"
          >
            {choices("grid-cols-2")}
          </div>

          {/* phones: a menu sliding up from the bottom of the screen */}
          <div className="fixed inset-0 z-50 sm:hidden">
            <button
              type="button"
              aria-label="Close"
              tabIndex={-1}
              onClick={() => setOpen(false)}
              className="absolute inset-0 bg-black/40 duration-200 animate-in fade-in"
            />
            <div
              data-menu="sheet"
              role="dialog"
              aria-modal="true"
              aria-label="Initiatives of"
              className="absolute inset-x-0 bottom-0 max-h-[80vh] overflow-y-auto rounded-t-3xl bg-white px-4 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-3 shadow-[0_-12px_40px_rgba(40,30,90,0.25)] duration-300 animate-in slide-in-from-bottom"
            >
              <span aria-hidden className="mx-auto block h-1 w-10 rounded-full bg-black/15" />
              <div className="mb-3 mt-3 flex items-center justify-between">
                <h3 className="tracked text-[12px] font-semibold">Initiatives of</h3>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  aria-label="Close"
                  className="grid h-9 w-9 place-items-center rounded-full text-black/70 hover:bg-black/5"
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
              {choices("grid-cols-2")}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

/* ---------- the header: the picture, with the words over its left side ---------- */

/*
  public/brand/work-header.webp (2000 x 667): sunrise over forested hills on
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
      <img
        src="/brand/work-header.webp"
        alt=""
        className="absolute inset-0 h-full w-full object-cover object-[78%_50%] sm:object-[70%_50%] lg:object-center"
      />
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
        <img
          src={cover}
          alt=""
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
