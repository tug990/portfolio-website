import { createFileRoute } from "@tanstack/react-router";
import { PROJECTS } from "@/content/projects";
import { ProjectCard } from "@/components/ProjectCard";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/projects/")({
  head: () => seo("Work", "Selected documentaries, series and stories."),
  component: Projects,
});

function Projects() {
  return (
    <div className="mx-auto max-w-5xl px-4 pb-24 pt-36">
      <p className="eyebrow">All work</p>
      <h1 className="mt-4 text-4xl font-light tracking-tight sm:text-6xl">Work</h1>
      <div className="prism-rule mt-10" />
      <div className="border-t">
        {PROJECTS.map((p) => (
          <ProjectCard key={p.slug} project={p} />
        ))}
      </div>
    </div>
  );
}
