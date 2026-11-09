import { createFileRoute } from "@tanstack/react-router";
import {
  Approach,
  Awards,
  Expertise,
  Faq,
  HangingHeadline,
  Story,
  Team,
  Testimonials,
  WorkedWith,
} from "@/components/AboutSections";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/about")({
  head: () => seo("About"),
  component: About,
});

/* Each section reads its content from content/site.ts. */
function About() {
  return (
    <div>
      <HangingHeadline />
      <div className="mx-auto max-w-6xl">
        <Expertise />
        <Approach />
        <Testimonials />
        <WorkedWith />
        <Story />
        <Team />
        <Awards />
        <Faq />
      </div>
    </div>
  );
}
