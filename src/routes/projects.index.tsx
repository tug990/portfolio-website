import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { PROJECTS, type Project } from "@/content/projects";
import { Poster } from "@/components/Poster";
import { seo } from "@/lib/seo";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/projects/")({
  head: () => seo("Work", "Documentaries, series and stories rooted in what is real."),
  component: Work,
});

// Stand-in shapes so the grid looks like a mix of stills until real images are added.
const SHAPES = ["4 / 5", "3 / 2", "1 / 1", "3 / 4", "16 / 10"];

function Work() {
  const [tag, setTag] = useState<string>("All");

  // Every tag with how many projects use it, most used first.
  const tabs = useMemo(() => {
    const counts = new Map<string, number>();
    PROJECTS.forEach((p) => p.tags.forEach((t) => counts.set(t, (counts.get(t) ?? 0) + 1)));
    return [
      { label: "All", count: PROJECTS.length },
      ...[...counts.entries()]
        .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
        .map(([label, count]) => ({ label, count })),
    ];
  }, []);

  const shown = tag === "All" ? PROJECTS : PROJECTS.filter((p) => p.tags.includes(tag));

  return (
    <div className="mx-auto max-w-6xl px-4 pb-28 pt-32 sm:px-6">
      {/* Title on the left, filter tabs on the right */}
      <div className="flex flex-col gap-5 sm:flex-row sm:items-baseline sm:justify-between">
        <h1 className="text-sm font-medium">Work</h1>
        <nav aria-label="Filter work" className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
          <ul className="flex gap-5 whitespace-nowrap text-sm">
            {tabs.map((t) => {
              const active = t.label === tag;
              return (
                <li key={t.label}>
                  <button
                    type="button"
                    onClick={() => setTag(t.label)}
                    aria-pressed={active}
                    className={cn(
                      "relative inline-flex items-center gap-1.5 transition-colors",
                      active ? "text-black" : "text-black/40 hover:text-black/70",
                    )}
                  >
                    <span
                      aria-hidden
                      className={cn(
                        "h-1.5 w-1.5 rounded-full transition-transform duration-300",
                        active ? "scale-100" : "scale-0",
                      )}
                      style={{ background: "var(--prism)" }}
                    />
                    {t.label}
                    <sup className="text-[9px] text-black/40">{t.count}</sup>
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>

      {/* Masonry grid */}
      <div className="mt-10 columns-1 gap-8 sm:columns-2 lg:columns-3">
        {shown.map((p) => (
          <WorkCard key={p.slug} project={p} shape={SHAPES[PROJECTS.indexOf(p) % SHAPES.length]} />
        ))}
      </div>
      {shown.length === 0 && (
        <p className="mt-16 text-center text-sm text-black/50">Nothing here yet.</p>
      )}
    </div>
  );
}

function WorkCard({ project, shape }: { project: Project; shape: string }) {
  return (
    <Link
      to="/projects/$slug"
      params={{ slug: project.slug }}
      className="group mb-12 block break-inside-avoid animate-in fade-in duration-500"
    >
      <span className="block overflow-hidden bg-black">
        {project.image ? (
          <img
            src={project.image}
            alt=""
            loading="lazy"
            className="block w-full transition-transform duration-700 group-hover:scale-[1.03]"
          />
        ) : (
          <span
            className="block transition-transform duration-700 group-hover:scale-[1.03]"
            style={{ aspectRatio: shape }}
          >
            <Poster title={project.title} />
          </span>
        )}
      </span>
      <span className="mt-3 block text-lg font-medium leading-tight">{project.title}</span>
      <span className="mt-1 block text-sm text-black/55">{project.summary}</span>
      <span className="mt-1 block text-sm text-black/35">{project.tags.join(", ")}</span>
    </Link>
  );
}
