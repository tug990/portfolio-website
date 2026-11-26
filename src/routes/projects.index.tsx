import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { PROJECTS, UPCOMING } from "@/content/projects";
import { WorkHero } from "@/components/work/WorkHero";
import { WORK_CLIENTS, WORK_PAGE } from "@/content/site";
import { LockedCard, MUTED, VideoCard, WorkBackdrop } from "@/components/work/WorkUI";
import { kindOf } from "@/lib/work";
import { seo } from "@/lib/seo";

type Search = { client?: string; q?: string };

export const Route = createFileRoute("/projects/")({
  // ?client=<name>: only that client's films (its badge on a film's page and on the About page
  // links here); ?q=<words>: films about that (a film page's theme pills link here)
  validateSearch: (s: Record<string, unknown>): Search => {
    const out: Search = {};
    if (typeof s.client === "string" && WORK_CLIENTS.some((c) => c.name === s.client))
      out.client = s.client;
    if (typeof s.q === "string" && s.q.trim()) out.q = s.q.slice(0, 80);
    return out;
  },
  head: () => seo("Work", WORK_PAGE.intro),
  component: Work,
});

/* the site's titles: light, wide-spaced capitals, a line of the tricolour under them */
const TITLE = "tracked text-[22px] font-light leading-[1.25] sm:text-[30px] lg:text-[36px]";
const CARDS = "grid gap-x-4 gap-y-7 sm:grid-cols-2 sm:gap-y-10 lg:grid-cols-3 2xl:grid-cols-4";
const SIZES = "(min-width: 1536px) 300px, (min-width: 1024px) 31vw, (min-width: 640px) 48vw, 100vw";

/*
  The Work page (where the landing lands):
    first the hero, the top of the page (components/work/WorkHero.tsx; not when
      arriving filtered), the films straight on under it; then:
    "Our featured projects", as the site sets its titles, and the films as
      YouTube video cards in the order of content/projects.ts `PROJECTS` (1
      across on phones, edge to edge; 2 on tablets; 3–4 on PC)
    at its foot, "Upcoming projects": films made but not yet released by the
      client (`UPCOMING`), their cards locked
  Arriving at a client's films (?client=) or a theme (?q=), the title says which,
  with a button back to all of them, and the upcoming ones aren't shown.
  Pieces (cards, the locked card): components/work/WorkUI.tsx.
*/

function Work() {
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  const query = search.q ?? "";
  // the hero, when you arrive at the Work page itself (not at a client's films or a theme)
  const [hero] = useState(() => !search.client && !search.q);
  const filtered = !!(search.client || search.q);
  const all = () => navigate({ search: {}, replace: true, resetScroll: false });

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    return PROJECTS.filter(
      (p) =>
        (!search.client || p.client === search.client) &&
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
  }, [search.client, query]);

  return (
    <>
      {hero && <WorkHero />}
      <WorkBackdrop flush={hero}>
        <section aria-labelledby="projects" className={hero ? undefined : "mt-2 sm:mt-4"}>
          <h2 id="projects" className={TITLE}>
            {search.q
              ? `Films about ${search.q}`
              : search.client
                ? `Films for ${search.client}`
                : "Our featured projects"}
          </h2>
          <span aria-hidden className="prism-rule mt-3 block w-24" />
          {filtered && (
            <button
              type="button"
              onClick={all}
              className="press mt-5 flex h-9 items-center gap-1.5 rounded-full bg-[#0a0a0a] pl-4 pr-3 text-[13px] font-medium text-white"
            >
              All projects
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
          )}

          {shown.length > 0 ? (
            <ul className={`mt-8 sm:mt-10 ${CARDS}`}>
              {shown.map((p) => (
                <li key={p.slug}>
                  <VideoCard project={p} bleed sizes={SIZES} />
                </li>
              ))}
            </ul>
          ) : (
            <p
              className="mt-8 rounded-xl bg-[#0a0a0a]/[0.04] px-5 py-12 text-center text-[15px]"
              style={{ color: MUTED }}
            >
              {query
                ? "No films match that yet."
                : `Films for ${search.client ?? "this"} are on their way.`}
            </p>
          )}
        </section>

        {!filtered && UPCOMING.length > 0 && (
          <section aria-labelledby="upcoming" className="mt-20 sm:mt-28">
            <h2 id="upcoming" className={TITLE}>
              Upcoming projects
            </h2>
            <span aria-hidden className="prism-rule mt-3 block w-24" />
            <ul className={`mt-8 sm:mt-10 ${CARDS}`}>
              {UPCOMING.map((p) => (
                <li key={p.slug}>
                  <LockedCard project={p} sizes={SIZES} />
                </li>
              ))}
            </ul>
          </section>
        )}
      </WorkBackdrop>
    </>
  );
}
