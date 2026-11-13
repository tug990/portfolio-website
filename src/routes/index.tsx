import { createFileRoute, redirect } from "@tanstack/react-router";
import { Gallery } from "@/components/Gallery";
import { seo } from "@/lib/seo";

/*
  The landing page: the Insight Lab logo. Scrolling (or a swipe, click or
  arrow key) wakes it, and its light carries you to the Work page, the site's
  home. (The 3D gallery is at /gallery.) Old links to a film over the gallery
  (/?work=<slug>) go to that film's page.
*/
export const Route = createFileRoute("/")({
  validateSearch: (search: Record<string, unknown>): { work?: string } =>
    typeof search.work === "string" ? { work: search.work } : {},
  beforeLoad: ({ search }) => {
    if (search.work) throw redirect({ to: "/projects/$slug", params: { slug: search.work } });
  },
  head: () => seo(),
  component: Landing,
});

function Landing() {
  return <Gallery start="landing" />;
}
