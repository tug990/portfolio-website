import { createFileRoute, notFound } from "@tanstack/react-router";
import { PerspectiveWorld } from "@/components/AboutSections";
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
  A perspective's world, on the other side of the About page's door: its
  Service Book, then who we are (both in PerspectiveWorld), each part
  reading its content from content/.
*/
function World() {
  const p = Route.useLoaderData();
  return <PerspectiveWorld key={p.id} id={p.id} />;
}
