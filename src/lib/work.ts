import type { Project } from "@/content/projects";
import { youtubeCover, youtubeCoverFallback, youtubeCoverSet, youtubeId } from "@/lib/youtube";

/* Values the Work page shares with its components (components/work/WorkUI.tsx). */

/* YouTube-like type for cards and their details */
export const UI = { fontFamily: '"Inter", ui-sans-serif, system-ui, sans-serif' };

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
