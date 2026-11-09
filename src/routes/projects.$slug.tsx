import { useState } from "react";
import { createFileRoute, notFound, useNavigate } from "@tanstack/react-router";
import { getProject } from "@/content/projects";
import { seo } from "@/lib/seo";
import { ProjectSheet } from "@/components/work/ProjectSheet";

export const Route = createFileRoute("/projects/$slug")({
  loader: ({ params }) => {
    const project = getProject(params.slug);
    if (!project) throw notFound();
    return project;
  },
  head: ({ loaderData }) => seo(loaderData?.title, loaderData?.summary),
  component: ProjectPage,
});

/*
  A film's case study reached directly (from the work grid or a shared link):
  the same sheet that opens over the gallery, over a plain page. Closing it
  goes into the gallery.
*/
function ProjectPage() {
  const project = Route.useLoaderData();
  const navigate = useNavigate();
  const [closing, setClosing] = useState(false);
  return (
    <div className="fixed inset-0 z-[65] bg-[#fcfcfc]">
      <ProjectSheet
        project={project}
        flyFrom={null}
        closing={closing}
        onRequestClose={() => setClosing(true)}
        onOpened={() => {}}
        onClosed={() => navigate({ to: "/" })}
        onNext={(slug) => navigate({ to: "/projects/$slug", params: { slug } })}
      />
    </div>
  );
}
