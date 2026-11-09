import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { getProject } from "@/content/projects";
import { seo } from "@/lib/seo";

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
    <article className="mx-auto max-w-3xl px-4 pb-24 pt-36">
      <Link to="/projects" className="eyebrow hover:text-black">
        ← All work
      </Link>
      <p className="eyebrow mt-10">
        {project.year} · {project.tags.join(" · ")}
      </p>
      <h1 className="mt-3 text-4xl font-light tracking-tight sm:text-6xl">{project.title}</h1>
      <p className="mt-5 text-lg text-muted-foreground">{project.summary}</p>
      <div className="prism-rule mt-10" />
      <div className="mt-10 space-y-5 text-lg font-light leading-relaxed">
        {project.body.map((para, i) => (
          <p key={i}>{para}</p>
        ))}
      </div>
      {(project.link || project.repo) && (
        <div className="mt-10 flex gap-6">
          {project.link && (
            <a
              href={project.link}
              target="_blank"
              rel="noreferrer"
              className="tracked text-[11px] underline underline-offset-8"
            >
              Watch
            </a>
          )}
          {project.repo && (
            <a
              href={project.repo}
              target="_blank"
              rel="noreferrer"
              className="tracked text-[11px] underline underline-offset-8"
            >
              More
            </a>
          )}
        </div>
      )}
    </article>
  );
}
