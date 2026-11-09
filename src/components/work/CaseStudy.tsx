import type { Ref } from "react";
import { Link } from "@tanstack/react-router";
import { nextProject, type Project } from "@/content/projects";
import { Poster } from "@/components/Poster";
import { FilmPlayer } from "@/components/work/FilmPlayer";
import { cn } from "@/lib/utils";

/*
  A film's case study, laid out like a printed one:

    Title
    Format · for Client · in Year
    The logline, and a link to watch
    The clip (the same one playing on the gallery wall)
    The film, with a filmstrip to scrub
    Stills
    The story, in short chapters
    A quote
    Credits
    Next film

  Used twice: in the sheet that opens over the gallery, and as the page at
  /projects/<slug> (reached from the work grid or a shared link).
*/

export function CaseStudy({
  project,
  heroRef,
  onNext,
}: {
  project: Project;
  heroRef?: Ref<HTMLDivElement>;
  /* In the gallery's sheet, "Next" swaps the film in place; on the page it's a link. */
  onNext?: (slug: string) => void;
}) {
  const next = nextProject(project.slug);
  const story = project.story ?? [];
  const intro = project.body;

  return (
    <article className="mx-auto max-w-[1180px] px-5 pb-10 pt-8 sm:px-10 sm:pt-12">
      {/* Title and facts */}
      <header data-sheet-fade>
        <h1
          id="case-title"
          className="pr-14 text-[44px] font-medium leading-[0.95] tracking-[-0.035em] sm:text-[76px]"
        >
          {project.title}
        </h1>
        <p className="mt-5 flex flex-wrap items-center gap-x-2 gap-y-2 text-[14px] font-medium">
          <Pill>{project.format ?? project.tags.join(", ")}</Pill>
          {project.client && (
            <>
              <span className="text-black/40">for</span>
              <Pill>{project.client}</Pill>
            </>
          )}
          <span className="text-black/40">in</span>
          <Pill>{project.year}</Pill>
        </p>
        <p className="mt-6 max-w-[400px] text-[16px] font-medium leading-[1.45] text-black/85">
          {project.summary}
        </p>
        {project.link && (
          <a
            href={project.link}
            target="_blank"
            rel="noreferrer"
            className="mt-6 inline-flex items-center gap-3 border-b-2 border-black pb-1 text-[15px] font-medium"
          >
            <span className="h-2.5 w-2.5 rounded-full bg-[#ff3d1f]" aria-hidden />
            Watch the film
          </a>
        )}
      </header>

      {/* The clip: the film you saw on the wall, now up close */}
      <div
        ref={heroRef}
        className="relative mx-auto mt-12 aspect-video w-full max-w-[940px] origin-top-left overflow-hidden rounded-[3px] bg-black shadow-[0_40px_80px_-40px_rgba(0,0,0,0.55)] sm:mt-16"
      >
        {project.trailer ? (
          <video
            src={project.trailer}
            poster={project.image}
            autoPlay
            muted
            loop
            playsInline
            className="h-full w-full object-cover"
          />
        ) : project.image ? (
          <img src={project.image} alt="" className="h-full w-full object-cover" />
        ) : (
          <Poster title={project.title} live />
        )}
      </div>

      <div data-sheet-fade>
        {/* Opening paragraphs */}
        {intro.length > 0 && (
          <div className="mx-auto mt-16 max-w-[640px] space-y-5 text-[18px] leading-[1.6] text-black/80 sm:mt-24">
            {intro.map((para, i) => (
              <p key={i}>{para}</p>
            ))}
          </div>
        )}

        {/* The film */}
        {project.video && (
          <section className="mt-20 sm:mt-28" aria-label="The film">
            <Label>The film</Label>
            <div className="mt-4">
              <FilmPlayer src={project.video} poster={project.image} title={project.title} />
            </div>
          </section>
        )}

        {/* Stills */}
        <section className="mt-20 sm:mt-28" aria-label="Stills">
          <Label>Stills</Label>
          <Stills project={project} />
        </section>

        {/* The story */}
        {story.length > 0 && (
          <section className="mx-auto mt-20 max-w-[1000px] space-y-14 sm:mt-28 sm:space-y-20">
            {story.map((ch, i) => (
              <div key={i} className="grid gap-4 sm:grid-cols-[1fr_1.6fr] sm:gap-12">
                <h2 className="text-[24px] font-medium leading-tight tracking-[-0.02em] sm:text-[28px]">
                  {ch.heading}
                </h2>
                <div className="space-y-4 text-[17px] leading-[1.6] text-black/75">
                  {ch.text.map((t, k) => (
                    <p key={k}>{t}</p>
                  ))}
                </div>
              </div>
            ))}
          </section>
        )}

        {/* A quote */}
        {project.quote && (
          <figure className="mx-auto mt-24 max-w-[900px] sm:mt-32">
            <blockquote className="text-[28px] font-medium leading-[1.15] tracking-[-0.025em] sm:text-[44px]">
              “{project.quote.text}”
            </blockquote>
            <figcaption className="mt-6 text-[15px]">
              <span className="font-medium">{project.quote.name}</span>
              {project.quote.role && <span className="text-black/50">, {project.quote.role}</span>}
            </figcaption>
          </figure>
        )}

        {/* Credits */}
        {project.credits && project.credits.length > 0 && (
          <section className="mx-auto mt-24 max-w-[1000px] sm:mt-32" aria-label="Credits">
            <Label>Credits</Label>
            <dl className="mt-6 grid grid-cols-2 gap-x-8 gap-y-5 sm:grid-cols-3">
              {project.credits.map((c, i) => (
                <div key={i}>
                  <dt className="text-[13px] text-black/45">{c.role}</dt>
                  <dd className="mt-1 text-[16px] font-medium">{c.name}</dd>
                </div>
              ))}
            </dl>
          </section>
        )}

        {project.repo && (
          <a
            href={project.repo}
            target="_blank"
            rel="noreferrer"
            className="mx-auto mt-16 block max-w-[1000px] text-[15px] font-medium underline underline-offset-8"
          >
            Read the whole story
          </a>
        )}

        {/* Next film */}
        <NextFilm project={next} onNext={onNext} />
      </div>
    </article>
  );
}

function Pill({ children }: { children: React.ReactNode }) {
  return <span className="rounded-full bg-black/[0.06] px-3 py-1.5">{children}</span>;
}

function Label({ children }: { children: React.ReactNode }) {
  return <p className="tracked text-[10px] text-black/45">{children}</p>;
}

/* Real stills when there are some; stand-in frames until then. */
function Stills({ project }: { project: Project }) {
  const shots = project.stills;
  if (shots && shots.length === 0) return null;
  const items = shots ?? [null, null, null, null];
  return (
    <div className="mt-4 grid grid-cols-2 gap-3 sm:gap-4">
      {items.map((src, i) => {
        // Rhythm: wide, two side by side, wide...
        const wide = i % 3 === 0;
        return (
          <div
            key={i}
            className={cn(
              "overflow-hidden rounded-[3px] bg-black",
              wide ? "col-span-2 aspect-[2.39/1]" : "aspect-[4/3]",
            )}
          >
            {src ? (
              <img src={src} alt="" loading="lazy" className="h-full w-full object-cover" />
            ) : (
              <StandInStill variant={i} />
            )}
          </div>
        );
      })}
    </div>
  );
}

/* A frame-shaped stand-in: light falling into darkness, a different fall each time. */
function StandInStill({ variant }: { variant: number }) {
  const looks = [
    "radial-gradient(ellipse 30% 70% at 70% 20%, rgba(255,214,170,.85), transparent 70%), radial-gradient(ellipse 60% 40% at 20% 90%, rgba(40,60,120,.5), transparent 70%)",
    "radial-gradient(ellipse 18% 90% at 30% 0%, rgba(255,255,255,.75), transparent 70%), radial-gradient(ellipse 50% 60% at 80% 70%, rgba(255,138,31,.35), transparent 70%)",
    "linear-gradient(100deg, transparent 35%, rgba(255,236,210,.55) 50%, transparent 62%), radial-gradient(ellipse 40% 50% at 15% 30%, rgba(31,44,255,.35), transparent 70%)",
    "radial-gradient(ellipse 45% 35% at 50% 60%, rgba(255,190,120,.55), transparent 70%), radial-gradient(ellipse 25% 80% at 85% 0%, rgba(200,220,255,.4), transparent 70%)",
  ];
  return (
    <span className="relative block h-full w-full bg-[#060606]">
      <span
        aria-hidden
        className="absolute inset-0"
        style={{ background: looks[variant % looks.length] }}
      />
      <span className="tracked absolute bottom-3 left-4 text-[9px] text-white/45">
        Still {String(variant + 1).padStart(2, "0")}
      </span>
    </span>
  );
}

function NextFilm({ project, onNext }: { project: Project; onNext?: (slug: string) => void }) {
  const inner = (
    <>
      <span className="tracked block text-[10px] text-black/45">Next film</span>
      <span className="mt-3 flex items-end justify-between gap-6">
        <span className="text-[40px] font-medium leading-none tracking-[-0.035em] transition-transform duration-500 group-hover:translate-x-2 sm:text-[72px]">
          {project.title}
        </span>
        <span className="hidden aspect-video w-48 shrink-0 overflow-hidden rounded-[3px] sm:block">
          {project.image ? (
            <img src={project.image} alt="" className="h-full w-full object-cover" />
          ) : (
            <Poster title="" />
          )}
        </span>
      </span>
    </>
  );
  const cls = "group mt-28 block w-full border-t border-black/10 pt-8 text-left sm:mt-36";
  return onNext ? (
    <button type="button" className={cls} onClick={() => onNext(project.slug)}>
      {inner}
    </button>
  ) : (
    <Link to="/projects/$slug" params={{ slug: project.slug }} className={cls}>
      {inner}
    </Link>
  );
}
