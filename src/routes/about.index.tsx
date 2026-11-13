import { createFileRoute } from "@tanstack/react-router";
import { PerspectiveHero } from "@/components/AboutSections";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/about/")({
  head: () => seo("About"),
  component: About,
});

/*
  The About page is the sky alone: the door of light in the clouds, "Know us
  from the perspective of you", and the picker. Choosing who you are carries
  you through the door into your world (/about/<perspective>).
*/
function About() {
  return <PerspectiveHero />;
}
