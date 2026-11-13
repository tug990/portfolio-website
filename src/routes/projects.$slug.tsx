import { createFileRoute, notFound, useNavigate } from "@tanstack/react-router";
import { getProject } from "@/content/projects";
import { seo } from "@/lib/seo";
import { CaseStudy } from "@/components/work/CaseStudy";
import { WorkBackdrop } from "@/components/work/WorkUI";

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
  A film's page reached directly (from the Work page or a shared link): a
  normal page under the site header, on the Work page's panel. (From the
  gallery, the same page opens as a sheet over the room: ProjectSheet.)
*/
function ProjectPage() {
  const project = Route.useLoaderData();
  const navigate = useNavigate();
  return (
    <WorkBackdrop wide>
      <CaseStudy
        key={project.slug}
        project={project}
        onNext={(slug) => navigate({ to: "/projects/$slug", params: { slug } })}
      />
    </WorkBackdrop>
  );
}
