import { createFileRoute } from "@tanstack/react-router";
import { Gallery } from "@/components/Gallery";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/")({
  head: () => seo(),
  component: Gallery,
});
