import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { getProject } from "@/content/projects";
import { seo } from "@/lib/seo";
import { CaseStudy } from "@/components/work/CaseStudy";

export const Route = createFileRoute("/projects/$slug")({
  loader: ({ params }) => {
    const project = getProject(params.slug);
    if (!project) throw notFound();
    return project;
  },
  head: ({ loaderData }) => seo(loaderData?.title, loaderData?.summary),
  component: ProjectPage,
});

function ProjectPage() {
  const project = Route.useLoaderData();
  return (
    <div className="bg-[#f3f1ee] pt-20 animate-in fade-in duration-500">
      {/* Back into the gallery, where you were standing */}
      <Link
        to="/"
        aria-label="Back to the gallery"
        className="fixed right-6 top-24 z-20 flex h-11 w-11 items-center justify-center rounded-full bg-black/[0.06] backdrop-blur transition-colors hover:bg-black/[0.12]"
      >
        <svg
          viewBox="0 0 24 24"
          className="h-5 w-5"
          aria-hidden
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
        >
          <path d="M6 6l12 12M18 6L6 18" />
        </svg>
      </Link>
      <CaseStudy key={project.slug} project={project} />
    </div>
  );
}
