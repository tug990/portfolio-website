import { createFileRoute, Link } from "@tanstack/react-router";
import { SITE } from "@/content/site";
import { PROJECTS } from "@/content/projects";
import { ProjectCard } from "@/components/ProjectCard";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/")({
  head: () => seo(),
  component: Home,
});

function Home() {
  const featured = PROJECTS.filter((p) => p.featured);
  return (
    <>
      {/* Hero: the open door, full bleed */}
      <section className="flex min-h-screen flex-col items-center bg-black text-white">
        <div className="relative z-10 px-4 pt-36 text-center">
          <h1 className="tracked text-3xl font-light sm:text-5xl">{SITE.tagline}</h1>
          <p className="mx-auto mt-6 max-w-md text-sm text-white/70">{SITE.description}</p>
          <Link
            to="/projects"
            className="tracked mt-8 inline-block rounded-md bg-white px-6 py-3 text-[11px] font-medium text-black transition-opacity hover:opacity-90"
          >
            Enter the gallery
          </Link>
        </div>
        {/* The open door fills the rest of the hero, below the copy */}
        <div className="relative mt-10 min-h-[70vh] w-full flex-1">
          <img
            src="/brand/hero-door.webp"
            alt=""
            className="absolute inset-0 h-full w-full object-cover object-bottom"
          />
          <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-black to-transparent" />
        </div>
      </section>

      {/* Intro */}
      <section className="mx-auto max-w-3xl px-4 py-28 text-center">
        <p className="eyebrow">{SITE.role}</p>
        <p className="mt-6 text-2xl font-light leading-snug sm:text-3xl">
          We make non-fiction that lets the light in. Documentaries, series and true stories, told
          with care.
        </p>
      </section>

      {/* Selected work */}
      <section className="mx-auto max-w-5xl px-4 pb-28">
        <div className="mb-4 flex items-end justify-between">
          <h2 className="tracked text-xs">Selected work</h2>
          <Link to="/projects" className="eyebrow hover:text-black">
            All work →
          </Link>
        </div>
        <div className="prism-rule" />
        <div className="border-t">
          {featured.map((p) => (
            <ProjectCard key={p.slug} project={p} />
          ))}
        </div>
      </section>

      {/* Banner */}
      <section>
        <img src="/brand/banner.webp" alt="Insight Lab" className="w-full" />
      </section>
    </>
  );
}
