import { Link } from "@tanstack/react-router";
import type { Project } from "@/content/projects";

/* Editorial list row: year, title, tags, arrow. */
export function ProjectCard({ project }: { project: Project }) {
  return (
    <Link
      to="/projects/$slug"
      params={{ slug: project.slug }}
      className="group grid grid-cols-[4rem_1fr_auto] items-baseline gap-4 border-b py-6 transition-colors hover:bg-white sm:grid-cols-[5rem_1fr_14rem_auto]"
    >
      <span className="text-sm text-muted-foreground">{project.year}</span>
      <span>
        <span className="block text-2xl font-light tracking-tight sm:text-3xl">
          {project.title}
        </span>
        <span className="mt-1 block text-sm text-muted-foreground">{project.summary}</span>
      </span>
      <span className="eyebrow hidden sm:block">{project.tags.join(" · ")}</span>
      <span className="text-xl transition-transform group-hover:translate-x-1">→</span>
    </Link>
  );
}
