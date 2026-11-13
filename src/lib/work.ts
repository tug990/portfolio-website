import { PROJECTS, type Project } from "@/content/projects";
import { WORK_CLIENTS } from "@/content/site";
import type { Film } from "@/lib/player";
import { youtubeCover, youtubeCoverFallback, youtubeCoverSet, youtubeId } from "@/lib/youtube";

/* Values the Work page and a film's page share with their components (components/work/WorkUI.tsx). */

/* The site's type, Jost, for the Work page and a film's page (as everywhere else) */
export const UI = { fontFamily: '"Jost", ui-sans-serif, system-ui, sans-serif' };

/* A film's picture: its image, else its YouTube cover. */
export function coverOf(p: Project) {
  if (p.image) return p.image;
  const id = p.youtube ? youtubeId(p.youtube) : undefined;
  return id ? youtubeCover(id) : undefined;
}
/*
  A film's picture with its sizes, for <img src srcSet>: its own image, or its
  YouTube cover in several sizes (WebP), with a JPEG to fall back on.
*/
export function coverSources(
  p: Project,
): { src: string; srcSet?: string; fallback?: string } | undefined {
  if (p.image) return { src: p.image };
  const id = p.youtube ? youtubeId(p.youtube) : undefined;
  return id
    ? { src: youtubeCover(id), srcSet: youtubeCoverSet(id), fallback: youtubeCoverFallback(id) }
    : undefined;
}

export const hasFilm = (p: Project) => !!(p.youtube || p.trailer || p.video);

/* A film as the site's player takes it (lib/player.tsx), or nothing if it has no film yet. */
export function filmOf(p: Project): Film | undefined {
  const youtube = p.youtube ? youtubeId(p.youtube) : undefined;
  const file = p.video ?? p.trailer;
  if (!youtube && !file) return undefined;
  return { slug: p.slug, title: p.title, client: p.client, youtube, file, cover: coverOf(p) };
}

/* The client a film was made for, when they're one of WORK_CLIENTS. */
export const clientOf = (p: Project) => WORK_CLIENTS.find((c) => c.name === p.client);

/* A client's films. */
export const filmsOf = (client: string) => PROJECTS.filter((p) => p.client === client);

/* What kind of film it is: its format, else its first tag. */
export const kindOf = (p: Project) => p.format ?? p.tags[0];

/* Ways to sort a list of films */
export const SORTS = {
  newest: {
    label: "Year (Newest First)",
    short: "Newest", // what the sort button says on phones
    by: (a: Project, b: Project) => b.year - a.year,
  },
  oldest: {
    label: "Year (Oldest First)",
    short: "Oldest",
    by: (a: Project, b: Project) => a.year - b.year,
  },
  title: {
    label: "Title (A to Z)",
    short: "A–Z",
    by: (a: Project, b: Project) => a.title.localeCompare(b.title),
  },
} as const;
export type SortKey = keyof typeof SORTS;
export const sortFilms = (films: Project[], key: SortKey) =>
  films.slice().sort((a, b) => SORTS[key].by(a, b) || a.title.localeCompare(b.title));
