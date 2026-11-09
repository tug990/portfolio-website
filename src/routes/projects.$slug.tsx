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
    <article className="mx-auto max-w-5xl px-4 pb-24 pt-32">
      {/* Back into the gallery, where you were standing */}
      <Link
        to="/"
        aria-label="Back to the gallery"
        className="fixed right-6 top-24 z-20 flex h-11 w-11 items-center justify-center rounded-full border border-black/10 bg-white/80 text-xl backdrop-blur transition-colors hover:bg-white"
      >
        ×
      </Link>

      <h1 className="text-4xl font-medium tracking-tight sm:text-6xl">{project.title}</h1>
      <div className="mt-5 flex flex-wrap items-center gap-2 text-sm">
        <span className="rounded-md bg-muted px-2.5 py-1">{project.tags.join(", ")}</span>
        {project.client && (
          <>
            <span className="text-muted-foreground">for</span>
            <span className="rounded-md bg-muted px-2.5 py-1">{project.client}</span>
          </>
        )}
        <span className="text-muted-foreground">in</span>
        <span className="rounded-md bg-muted px-2.5 py-1">{project.year}</span>
      </div>

      <p className="mt-6 max-w-md text-[15px] leading-relaxed">{project.summary}</p>
      {project.link && (
        <a
          href={project.link}
          target="_blank"
          rel="noreferrer"
          className="mt-5 inline-flex items-center gap-2 text-sm underline underline-offset-4"
        >
          <span className="h-2 w-2 rounded-full" style={{ background: "#ff3d1f" }} />
          Watch
        </a>
      )}

      {project.video ? (
        <video
          src={project.video}
          poster={project.image}
          controls
          playsInline
          className="mt-10 aspect-video w-full rounded-sm bg-black object-cover"
        />
      ) : project.image ? (
        <img src={project.image} alt="" className="mt-10 w-full rounded-sm object-cover" />
      ) : null}

      <div className="mt-12 max-w-2xl space-y-5 text-lg font-light leading-relaxed">
        {project.body.map((para, i) => (
          <p key={i}>{para}</p>
        ))}
      </div>

      {project.repo && (
        <a
          href={project.repo}
          target="_blank"
          rel="noreferrer"
          className="tracked mt-10 inline-block text-[11px] underline underline-offset-8"
        >
          More
        </a>
      )}
    </article>
  );
}
