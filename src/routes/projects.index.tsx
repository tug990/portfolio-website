import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { PROJECTS } from "@/content/projects";
import { WorkHero } from "@/components/work/WorkHero";
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
import { GLASS_PANEL, GLASS_PILL, MENU_IN, useMenu } from "@/lib/menu";
import { UI, kindOf, sortFilms, type SortKey } from "@/lib/work";
import { seo } from "@/lib/seo";
import { cn } from "@/lib/utils";

type Search = { client?: string; kind?: string; q?: string };

/* The kinds of film there are (the chips), newest films' kinds first. */
const KINDS = [...new Set(sortFilms(PROJECTS, "newest").map(kindOf).filter(Boolean))] as string[];

export const Route = createFileRoute("/projects/")({
  // ?client=<name>: only that client's films; ?kind=<kind>: one kind of film;
  // ?q=<words>: films about that (a film page's theme pills link here)
  validateSearch: (s: Record<string, unknown>): Search => {
    const out: Search = {};
    if (typeof s.client === "string" && WORK_CLIENTS.some((c) => c.name === s.client))
      out.client = s.client;
    if (typeof s.kind === "string" && KINDS.includes(s.kind)) out.kind = s.kind;
    if (typeof s.q === "string" && s.q.trim()) out.q = s.q.slice(0, 80);
    return out;
  },
  head: () => seo("Work", WORK_PAGE.intro),
  component: Work,
});

/*
  The Work page (where the landing lands):
    first the hero over the whole screen (components/work/WorkHero.tsx), lifted
      away by a scroll (not when arriving filtered); then, YouTube-like:
    one line: PROJECTS (n) | Initiatives of: [a client's badge, or All] | Sort by: [...]
      (Initiatives of opens the clients' glass badges, site.ts WORK_CLIENTS;
      picking one shows only their films)
    arriving from a film's theme (?q=): "Films about <theme>", to clear
    chips of the kinds of film (All, Documentary, Impact film…)
    the films as YouTube video cards: 1 across on phones (edge to edge), 2 on
      tablets, 3–4 on PC
  Pieces (cards, chips, badges, the sort menu): components/work/WorkUI.tsx.
*/

function Work() {
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  const query = search.q ?? "";
  // the hero, when you arrive at the Work page itself (not at a client's films or a theme)
  const [hero] = useState(() => !search.client && !search.kind && !search.q);
  const [sort, setSort] = useState<SortKey>("newest");
  const set = (next: Search) => navigate({ search: next, replace: true, resetScroll: false });

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    return sortFilms(PROJECTS, sort).filter(
      (p) =>
        (!search.client || p.client === search.client) &&
        (!search.kind || kindOf(p) === search.kind) &&
        (!q ||
          [
            p.title,
            p.client,
            kindOf(p),
            p.series,
            ...p.tags,
            ...(p.themes ?? []).map((t) => t.label),
          ].some((t) => t?.toLowerCase().includes(q))),
    );
  }, [search.client, search.kind, query, sort]);

  return (
    <WorkBackdrop>
      {hero && <WorkHero />}
      <section aria-labelledby="projects" className="mt-2 sm:mt-4">
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

        {/* from a film's theme (?q=): what's shown, and a way back to everything */}
        {search.q && (
          <p
            className="mt-4 flex flex-wrap items-center gap-2 text-[14px]"
            style={{ color: MUTED }}
          >
            Films about
            <button
              type="button"
              onClick={() => set({ ...search, q: undefined })}
              aria-label={`Clear: films about ${search.q}`}
              className="press flex h-8 items-center gap-1.5 rounded-full bg-[#0a0a0a] pl-3.5 pr-2.5 text-[13px] font-medium text-white"
            >
              {search.q}
              <svg
                aria-hidden
                viewBox="0 0 24 24"
                className="h-3.5 w-3.5"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.4"
              >
                <path d="M6 6l12 12M18 6L6 18" />
              </svg>
            </button>
          </p>
        )}

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
            className="mt-5 rounded-xl bg-[#0a0a0a]/[0.04] px-5 py-12 text-center text-[15px]"
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
