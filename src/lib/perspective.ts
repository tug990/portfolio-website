import { ABOUT_PERSPECTIVES, type PerspectiveId } from "@/content/site";

/* Helpers for the About page's perspectives (components/PerspectiveMenu.tsx, SiteNav). */

/* Whether a path is a perspective's world (/about/<perspective>), and which */
export function worldOf(path: string): PerspectiveId | null {
  const m = /^\/about\/([^/]+)\/?$/.exec(path);
  return (ABOUT_PERSPECTIVES.find((p) => p.id === m?.[1])?.id as PerspectiveId) ?? null;
}

/*
  Through a flash of light to another page: the worlds open out of the light,
  as through the About page's door (white in, the page changes, white out).
*/
export function throughLight(go: () => void) {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return go();
  const veil = document.createElement("div");
  Object.assign(veil.style, {
    position: "fixed",
    inset: "0",
    zIndex: "70",
    pointerEvents: "none",
    opacity: "0",
    background: "#fbfaf8",
  });
  document.body.append(veil);
  veil
    .animate([{ opacity: 0 }, { opacity: 1 }], {
      duration: 260,
      easing: "ease-in",
      fill: "forwards",
    })
    .finished.then(() => {
      go();
      return veil.animate([{ opacity: 1 }, { opacity: 0 }], {
        duration: 650,
        delay: 120,
        easing: "ease-out",
        fill: "forwards",
      }).finished;
    })
    .catch(() => {})
    .finally(() => veil.remove());
}
