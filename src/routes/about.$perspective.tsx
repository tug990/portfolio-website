import { createFileRoute, notFound, redirect } from "@tanstack/react-router";
import { PerspectiveWorld } from "@/components/AboutSections";
import { ABOUT_PERSPECTIVES } from "@/content/site";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/about/$perspective")({
  loader: ({ params }) => {
    // (the university's page became education's, for every place of learning: old links lead there)
    if (params.perspective === "university")
      throw redirect({
        to: "/about/$perspective",
        params: { perspective: "education" },
        statusCode: 301,
      });
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
