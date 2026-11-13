import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { PROJECTS } from "@/content/projects";
import { WORK_CLIENTS, WORK_PAGE } from "@/content/site";
import {
  Check,
  Chevron,
  Chip,
  ClientBadge,
  MUTED,
  Scroller,
  SortMenu,
  VideoCard,
  WorkBackdrop,
} from "@/components/work/WorkUI";
import { usePlayer } from "@/lib/player";
import { GLASS_PANEL, GLASS_PILL, MENU_IN, useMenu } from "@/lib/menu";
import { UI, filmOf, hasFilm, kindOf, sortFilms, type SortKey } from "@/lib/work";
import { seo } from "@/lib/seo";
import { cn } from "@/lib/utils";

type Search = { client?: string; kind?: string };

/* The kinds of film there are (the chips), newest films' kinds first. */
const KINDS = [...new Set(sortFilms(PROJECTS, "newest").map(kindOf).filter(Boolean))] as string[];

export const Route = createFileRoute("/projects/")({
  // ?client=<name>: only that client's films; ?kind=<kind>: one kind of film
  validateSearch: (s: Record<string, unknown>): Search => {
    const out: Search = {};
    if (typeof s.client === "string" && WORK_CLIENTS.some((c) => c.name === s.client))
      out.client = s.client;
    if (typeof s.kind === "string" && KINDS.includes(s.kind)) out.kind = s.kind;
    return out;
  },
  head: () => seo("Work", WORK_PAGE.intro),
  component: Work,
});

/*
  The Work page, YouTube-like:
    the banner (the prism picture, glowing; the headline; Play showreel)
    YouTube's search box (titles, clients, kinds)
    one line: PROJECTS (n) | Initiatives of: [a client's badge, or All] | Sort by: [...]
      (Initiatives of opens the clients' glass badges, site.ts WORK_CLIENTS;
      picking one shows only their films)
    chips of the kinds of film (All, Documentary, Impact film…)
    the films as YouTube video cards: 1 across on phones (edge to edge), 2 on
      tablets, 3–4 on PC
  Pieces (cards, chips, badges, the sort menu): components/work/WorkUI.tsx.
*/

function Work() {
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<SortKey>("newest");
  const set = (next: Search) => navigate({ search: next, replace: true, resetScroll: false });

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    return sortFilms(PROJECTS, sort).filter(
      (p) =>
        (!search.client || p.client === search.client) &&
        (!search.kind || kindOf(p) === search.kind) &&
        (!q ||
          [p.title, p.client, kindOf(p), p.series, ...p.tags].some((t) =>
            t?.toLowerCase().includes(q),
          )),
    );
  }, [search.client, search.kind, query, sort]);

  return (
    <WorkBackdrop>
      <Banner />

      <div className="mt-4 sm:mt-5">
        <SearchBox value={query} onChange={setQuery} />
      </div>

      <section aria-labelledby="projects" className="mt-6">
        {/* One line: PROJECTS (n) on the left; Initiatives of and Sort by on the right */}
        <div className="relative z-20 flex items-center justify-between gap-2">
          <h2
            id="projects"
            className="tracked whitespace-nowrap text-[12px] font-semibold tracking-[0.16em] sm:text-sm sm:tracking-[0.32em]"
          >
            Projects <span className="text-black/45 max-[359px]:hidden">({shown.length})</span>
          </h2>
          <div className="flex items-center gap-1.5 sm:gap-5">
            <InitiativesFilter
              selected={search.client ?? null}
              onSelect={(c) => set({ ...search, client: c ?? undefined })}
            />
            <SortMenu value={sort} onChange={setSort} />
          </div>
        </div>

        {/* the kinds of film, as YouTube's chips */}
        <Scroller
          label="Kinds of film"
          gap="gap-2"
          step={0.6}
          className="-mx-4 mt-4 px-4 sm:mx-0 sm:px-0"
        >
          <li className="shrink-0">
            <Chip active={!search.kind} onClick={() => set({ ...search, kind: undefined })}>
              All
            </Chip>
          </li>
          {KINDS.map((k) => (
            <li key={k} className="shrink-0">
              <Chip
                active={search.kind === k}
                onClick={() => set({ ...search, kind: search.kind === k ? undefined : k })}
              >
                {k}
              </Chip>
            </li>
          ))}
        </Scroller>

        {shown.length > 0 ? (
          <ul className="mt-5 grid gap-x-4 gap-y-7 sm:grid-cols-2 sm:gap-y-10 lg:grid-cols-3 2xl:grid-cols-4">
            {shown.map((p) => (
              <li key={p.slug}>
                <VideoCard
                  project={p}
                  bleed
                  sizes="(min-width: 1536px) 300px, (min-width: 1024px) 31vw, (min-width: 640px) 48vw, 100vw"
                />
              </li>
            ))}
          </ul>
        ) : (
          <p
            className="mt-5 rounded-xl bg-[#14172e]/[0.04] px-5 py-12 text-center text-[15px]"
            style={{ color: MUTED }}
          >
            {query
              ? "No films match that yet."
              : `Films for ${search.client ?? "this"} are on their way.`}
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

/* ---------- the banner ---------- */

/*
  public/brand/work-header-{1400,2000,phone}.webp: sunrise over forested hills,
  a glass prism splitting the light, with the prism's glow (the same picture,
  blurred, its bright parts laid over in "screen", breathing: styles.css
  prism-glow). The headline over the sunrise; Play showreel starts the
  showreel in the mini player, so you can keep browsing.
*/
function Banner() {
  const { play } = usePlayer();
  const reel =
    PROJECTS.find((p) => p.tags.includes("Showreel") && hasFilm(p)) ??
    PROJECTS.find((p) => p.featured && hasFilm(p));
  const film = reel && filmOf(reel);
  const [first, ...rest] = WORK_PAGE.headline.split("\n");
  return (
    <header className="relative -mx-4 aspect-[16/8] overflow-hidden bg-[#1d1b2a] sm:mx-0 sm:aspect-[3.6/1] sm:rounded-2xl lg:aspect-[4.4/1]">
      <HeaderPicture
        eager
        className="absolute inset-0 h-full w-full object-cover object-[70%_50%] lg:object-center"
      />
      <HeaderPicture
        aria-hidden
        className="prism-glow pointer-events-none absolute inset-0 h-full w-full object-cover object-[70%_50%] [mask-image:linear-gradient(90deg,transparent_30%,#000_60%)] lg:object-center"
        style={{
          filter: "blur(16px) brightness(0.72) contrast(2.3) saturate(1.7)",
          mixBlendMode: "screen",
          animation: "prism-glow 5s ease-in-out infinite",
        }}
      />
      <span
        aria-hidden
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(55% 95% at 15% 60%, rgba(8,6,18,0.55), transparent 75%), linear-gradient(90deg, rgba(8,6,18,0.45), transparent 60%)",
        }}
      />
      <div className="absolute inset-y-0 left-0 flex max-w-[64%] flex-col justify-center px-5 text-white sm:max-w-[55%] sm:px-8 lg:px-10">
        <p className="tracked text-[10px] font-semibold text-white/90 [text-shadow:0_1px_2px_rgba(0,0,0,0.5)] sm:text-[11px]">
          {WORK_PAGE.eyebrow}
        </p>
        <p className="mt-1.5 text-[17px] font-normal uppercase leading-[1.3] tracking-[0.18em] [text-shadow:0_1px_2px_rgba(0,0,0,0.45),0_2px_18px_rgba(0,0,0,0.55)] sm:mt-2 sm:text-[22px] lg:text-[26px]">
          {first}
          {rest.length > 0 && (
            <>
              <br /> {rest.join(" ")}
            </>
          )}
        </p>
        {film && (
          <button
            type="button"
            onClick={() => play(film)}
            className="mt-3 flex h-9 w-fit items-center gap-2 rounded-full border border-white/40 bg-white/15 px-4 text-[13px] font-medium text-white backdrop-blur-md transition hover:bg-white/25 sm:mt-4"
          >
            <svg aria-hidden viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="currentColor">
              <path d="M7 4.5v15l13-7.5z" />
            </svg>
            Play showreel
          </button>
        )}
      </div>
    </header>
  );
}

/* The header picture: the phone crop on phones, else 1400 or 2000 px as the screen needs. */
function HeaderPicture({
  eager,
  className,
  style,
  ...rest
}: {
  eager?: boolean;
  className?: string;
  style?: React.CSSProperties;
  "aria-hidden"?: boolean;
}) {
  return (
    <picture {...rest}>
      <source media="(max-width: 639px)" srcSet="/brand/work-header-phone.webp" />
      <img
        src="/brand/work-header-1400.webp"
        srcSet="/brand/work-header-1400.webp 1400w, /brand/work-header-2000.webp 2000w"
        sizes="(min-width: 1320px) 1030px, 100vw"
        width={2000}
        height={667}
        fetchPriority={eager ? "high" : undefined}
        decoding="async"
        alt=""
        className={className}
        style={style}
      />
    </picture>
  );
}

/* ---------- search ---------- */

/* YouTube's search: a long pill and a round-ended button with the magnifier. */
function SearchBox({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <form
      role="search"
      onSubmit={(e) => e.preventDefault()}
      className="flex w-full max-w-[640px] lg:mx-auto"
    >
      <label className="flex h-10 min-w-0 flex-1 items-center gap-2 rounded-l-full border border-[#14172e]/15 bg-white pl-4 pr-2 shadow-[inset_0_1px_2px_rgba(20,23,46,0.06)] focus-within:border-[#7b6dff] focus-within:ring-1 focus-within:ring-[#7b6dff]/40">
        <span className="sr-only">Search films</span>
        <input
          type="search"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Search films, initiatives…"
          className="min-w-0 flex-1 bg-transparent text-[15px] outline-none placeholder:text-[#5f6382]/80 [&::-webkit-search-cancel-button]:hidden"
        />
        {value && (
          <button
            type="button"
            aria-label="Clear"
            onClick={() => onChange("")}
            className="grid h-7 w-7 place-items-center rounded-full hover:bg-[#14172e]/[0.07]"
          >
            <svg
              aria-hidden
              viewBox="0 0 24 24"
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
            >
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        )}
      </label>
      <button
        type="submit"
        aria-label="Search"
        className="grid h-10 w-16 shrink-0 place-items-center rounded-r-full border border-l-0 border-[#14172e]/15 bg-[#14172e]/[0.05] transition hover:bg-[#14172e]/[0.1]"
      >
        <svg
          aria-hidden
          viewBox="0 0 24 24"
          className="h-5 w-5"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.9"
          strokeLinecap="round"
        >
          <circle cx="11" cy="11" r="6.5" />
          <path d="M16 16l4.5 4.5" />
        </svg>
      </button>
    </form>
  );
}
