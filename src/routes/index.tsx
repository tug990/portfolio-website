import { createFileRoute } from "@tanstack/react-router";
import { Gallery } from "@/components/Gallery";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/")({
  // ?work=<slug> opens that film's case study over the gallery
  // (the address bar shows /projects/<slug> instead).
  validateSearch: (search: Record<string, unknown>): { work?: string } =>
    typeof search.work === "string" ? { work: search.work } : {},
  head: () => seo(),
  component: Gallery,
});
