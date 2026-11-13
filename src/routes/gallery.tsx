import { createFileRoute } from "@tanstack/react-router";
import { Gallery } from "@/components/Gallery";
import { seo } from "@/lib/seo";

/*
  The gallery: a 3D room with six films on its walls, to walk through on a
  screen or step inside in VR (a headset's browser: Meta Quest, Apple Vision
  Pro…; or a phone in a VR holder). Reached from the gallery card above every
  page's footer ("Step into the light"). ?work=<slug> opens that film's page over the
  room (the address bar shows /projects/<slug> instead).
*/
export const Route = createFileRoute("/gallery")({
  validateSearch: (search: Record<string, unknown>): { work?: string } =>
    typeof search.work === "string" ? { work: search.work } : {},
  head: () =>
    seo("Gallery", "Walk through the gallery of Insight Lab's films, on your screen or in VR."),
  component: GalleryPage,
});

function GalleryPage() {
  return <Gallery start="room" />;
}
