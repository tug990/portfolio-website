import { createFileRoute, notFound } from "@tanstack/react-router";
import {
  Approach,
  Awards,
  Expertise,
  Faq,
  PerspectiveWorld,
  Story,
  Team,
  Testimonials,
  WorkedWith,
} from "@/components/AboutSections";
import { ABOUT_PERSPECTIVES } from "@/content/site";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/about/$perspective")({
  loader: ({ params }) => {
    const p = ABOUT_PERSPECTIVES.find((x) => x.id === params.perspective);
    if (!p) throw notFound();
    return p;
  },
  head: ({ loaderData }) =>
    seo(loaderData ? `About, for ${loaderData.label}` : "About", loaderData?.text),
  component: World,
});

/*
  A perspective's world, on the other side of the About page's door: what we
  make for them (PerspectiveWorld), then the rest of who we are, each section
  reading its content from content/site.ts.
*/
function World() {
  const p = Route.useLoaderData();
  return (
    <div>
      <PerspectiveWorld key={p.id} id={p.id} />
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
