import { useLayoutEffect, useRef, useState, useSyncExternalStore, type Ref } from "react";
import { nextProject, type Project } from "@/content/projects";
import { Poster } from "@/components/Poster";
import { FilmPlayer } from "@/components/work/FilmPlayer";
import { cn } from "@/lib/utils";

/*
  A film's case study, laid out after the reference
  (minimaze-light.framer.website/work/...), set in Inter Display:

  Wide screens: two zones inside the sheet.
    Left, a column that scrolls on its own:
      Title / format · for client · in year / the logline / ● Watch the film
      The story, in chapters, with a quote set off by a rule. It's shown
      cut short and fading out until "Read the whole story" opens it.
      Next film: its poster hanging from two strings, the title beneath.
    Right, an endless reel: the film playing, its controls and filmstrip,
      then the stills, round and round as you scroll. Faint guide lines
      run down either side of the film.

  Narrow screens: one column, in the same order.

  Used in the sheet over the gallery and on the page at /projects/<slug>.
*/

const INK = "#080808";

/* Wide screen or not, known on the very first render (the film flies to the right spot). */
const WIDE = "(min-width: 1024px)";
function useWide() {
  return useSyncExternalStore(
    (on) => {
      const mq = window.matchMedia(WIDE);
      mq.addEventListener("change", on);
      return () => mq.removeEventListener("change", on);
    },
    () => window.matchMedia(WIDE).matches,
    () => false,
  );
}

export function CaseStudy({
  project,
  heroRef,
  onNext,
}: {
  project: Project;
  heroRef?: Ref<HTMLDivElement>;
  onNext: (slug: string) => void;
}) {
  const wide = useWide();
  return (
    <div
      className="case-study h-full"
      style={{
        color: INK,
        fontFamily: '"Inter", ui-sans-serif, system-ui',
        fontWeight: 600,
        fontVariationSettings: '"opsz" 32', // Inter Display, at every size, like the reference
      }}
    >
      {wide ? (
        <WideLayout project={project} heroRef={heroRef} onNext={onNext} />
      ) : (
        <NarrowLayout project={project} heroRef={heroRef} onNext={onNext} />
      )}
    </div>
  );
}

type LayoutProps = {
  project: Project;
  heroRef?: Ref<HTMLDivElement>;
  onNext: (slug: string) => void;
};

/* ---------- wide: fixed column + endless reel ---------- */

function WideLayout({ project, heroRef, onNext }: LayoutProps) {
  return (
    <div className="flex h-full">
      <div className="h-full w-[440px] shrink-0 overflow-y-auto overscroll-contain px-10 pb-12 pt-10 [scrollbar-width:none]">
        <div data-sheet-fade className="w-[360px]">
          <Intro project={project} />
          <Story project={project} />
          <NextFilm project={nextProject(project.slug)} onNext={onNext} />
        </div>
      </div>
      <Reel project={project} heroRef={heroRef} />
    </div>
  );
}

/*
  The reel: the film, then each still, repeated three times; the view is kept
  inside the middle copy, so it scrolls forever. Only the middle copy's film
  plays; the copies either side show a still frame.
*/
function Reel({ project, heroRef }: { project: Project; heroRef?: Ref<HTMLDivElement> }) {
  const box = useRef<HTMLDivElement>(null);
  const copy = useRef<HTMLDivElement>(null);
  const cycle = useRef(0);

  useLayoutEffect(() => {
    const el = box.current;
    const c = copy.current;
    if (!el || !c) return;
    const fit = () => {
      const before = cycle.current;
      cycle.current = c.offsetHeight;
      el.scrollTop = before ? el.scrollTop - before + cycle.current : cycle.current;
    };
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(c);
    return () => ro.disconnect();
  }, [project.slug]);

  const onScroll = () => {
    const el = box.current;
    const n = cycle.current;
    if (!el || !n) return;
    if (el.scrollTop >= 2 * n) el.scrollTop -= n;
    else if (el.scrollTop < n) el.scrollTop += n;
  };

  return (
    <div className="relative h-full min-w-0 flex-1">
      {/* Faint guide lines either side of the film */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-y-0 left-1/2 z-0 w-[min(80%,816px)] -translate-x-1/2 border-x border-black/[0.07]"
      />
      <div
        ref={box}
        onScroll={onScroll}
        className="relative z-[1] h-full overflow-y-auto overscroll-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        aria-label="Film and stills"
      >
        <ReelCopy project={project} live={false} />
        <div ref={copy}>
          <ReelCopy project={project} live heroRef={heroRef} />
        </div>
        <ReelCopy project={project} live={false} />
      </div>
    </div>
  );
}

function ReelCopy({
  project,
  live,
  heroRef,
}: {
  project: Project;
  live: boolean;
  heroRef?: Ref<HTMLDivElement>;
}) {
  return (
    <div className="flex flex-col items-center gap-[70px] pb-[70px] pt-10" aria-hidden={!live}>
      <div className="w-[min(74%,740px)]">
        <FilmPlayer
          ref={live ? heroRef : undefined}
          title={project.title}
          src={project.trailer ?? project.video}
          poster={project.image}
          live={live}
        />
      </div>
      {stillsOf(project).map((src, i) => (
        <Still key={i} src={src} index={i} className="w-[min(88%,880px)]" />
      ))}
    </div>
  );
}

/* ---------- narrow: one column ---------- */

function NarrowLayout({ project, heroRef, onNext }: LayoutProps) {
  return (
    <div className="px-5 pb-14 pt-6 sm:px-8">
      <div data-sheet-fade>
        <Intro project={project} />
      </div>
      <div className="mt-8">
        <FilmPlayer
          ref={heroRef}
          title={project.title}
          src={project.trailer ?? project.video}
          poster={project.image}
        />
      </div>
      <div data-sheet-fade>
        <Story project={project} />
        <div className="mt-12 space-y-4">
          {stillsOf(project).map((src, i) => (
            <Still key={i} src={src} index={i} className="w-full" />
          ))}
        </div>
        <NextFilm project={nextProject(project.slug)} onNext={onNext} />
      </div>
    </div>
  );
}

/* ---------- the pieces ---------- */

function Intro({ project }: { project: Project }) {
  return (
    <header>
      <h1
        id="case-title"
        className="pr-12 text-[52px] leading-[0.92] tracking-[-0.045em] lg:text-[70px]"
      >
        {project.title}
      </h1>
      <p className="mt-5 flex flex-wrap items-center gap-x-[6px] gap-y-2 text-[14px] leading-[18.2px] tracking-[-0.01em]">
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
      <p className="mt-6 max-w-[320px] text-[14px] leading-[18.2px] tracking-[-0.01em]">
        {project.summary}
      </p>
      {project.link && (
        <a href={project.link} target="_blank" rel="noreferrer" className="mt-5 inline-block">
          <Dotted>Watch the film</Dotted>
        </a>
      )}
    </header>
  );
}

function Pill({ children }: { children: React.ReactNode }) {
  return <span className="rounded-[6px] bg-black/[0.055] px-[7px] py-[5px]">{children}</span>;
}

/* A red dot and an underlined label: the reference's links */
function Dotted({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-3 text-[14px] leading-[18.2px] tracking-[-0.01em]">
      <span className="h-2 w-2 rounded-full bg-[#ff3d1f]" aria-hidden />
      <span className="border-b-2 border-current pb-[3px]">{children}</span>
    </span>
  );
}

/* The story: chapters, with the quote after the first. Cut short until opened. */
function Story({ project }: { project: Project }) {
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  const chapters = project.story ?? [];
  const intro = chapters.length === 0 ? project.body : [];
  if (chapters.length === 0 && intro.length === 0) return null;

  const openUp = () => {
    const el = box.current;
    if (el) {
      const from = el.offsetHeight;
      setOpen(true);
      requestAnimationFrame(() => {
        el.animate([{ height: `${from}px` }, { height: `${el.scrollHeight}px` }], {
          duration: 500,
          easing: "cubic-bezier(.2,.75,.15,1)",
        });
      });
    } else setOpen(true);
  };

  return (
    <section className="mt-12" aria-label="The story">
      <div
        ref={box}
        className={cn("overflow-hidden", !open && "max-h-[300px]")}
        style={
          open
            ? undefined
            : {
                maskImage: "linear-gradient(#000 55%, transparent 100%)",
                WebkitMaskImage: "linear-gradient(#000 55%, transparent 100%)",
              }
        }
      >
        {intro.map((p, i) => (
          <p key={i} className="mb-4 text-[12px] leading-[15.6px] tracking-[-0.01em]">
            {p}
          </p>
        ))}
        {chapters.map((ch, i) => (
          <div key={i} className={i > 0 ? "mt-8" : undefined}>
            <h2 className="text-[24px] leading-[31.2px] tracking-[-0.01em]">{ch.heading}</h2>
            <div className="mt-4 space-y-4 text-[12px] leading-[15.6px] tracking-[-0.01em]">
              {ch.text.map((t, k) => (
                <p key={k}>{t}</p>
              ))}
            </div>
            {i === 0 && project.quote && (
              <figure className="mt-8 border-l-2 border-black/10 pl-5">
                <blockquote className="text-[20px] leading-[24px] tracking-[-0.02em]">
                  “{project.quote.text}”
                </blockquote>
                <figcaption className="mt-3 text-[14px] leading-[18.2px] tracking-[-0.01em] text-black/45">
                  {project.quote.name}
                  {project.quote.role && `, ${project.quote.role}`}
                </figcaption>
              </figure>
            )}
          </div>
        ))}
        {open && project.credits && project.credits.length > 0 && (
          <div className="mt-8">
            <h2 className="text-[24px] leading-[31.2px] tracking-[-0.01em]">Credits</h2>
            <dl className="mt-4 grid grid-cols-2 gap-x-6 gap-y-3 text-[12px] leading-[15.6px]">
              {project.credits.map((c, i) => (
                <div key={i}>
                  <dt className="text-black/45">{c.role}</dt>
                  <dd>{c.name}</dd>
                </div>
              ))}
            </dl>
          </div>
        )}
      </div>
      {!open && (
        <button type="button" onClick={openUp} className="mt-1">
          <Dotted>Read the whole story</Dotted>
        </button>
      )}
    </section>
  );
}

/* Next film: its poster hanging from two strings off a pin, the title beneath. */
function NextFilm({ project, onNext }: { project: Project; onNext: (slug: string) => void }) {
  return (
    <button
      type="button"
      onClick={() => onNext(project.slug)}
      className="group mx-auto mt-14 flex w-[220px] flex-col items-center"
      aria-label={`Next film: ${project.title}`}
    >
      <span className="flex origin-top flex-col items-center transition-transform duration-700 ease-out group-hover:rotate-[2.5deg]">
        <svg
          width="150"
          height="60"
          viewBox="0 0 150 60"
          aria-hidden
          className="block overflow-visible"
        >
          <circle cx="75" cy="3" r="2.5" fill="rgba(0,0,0,0.35)" />
          <path
            d="M75 3 L4 60 M75 3 L146 60"
            stroke="rgba(0,0,0,0.22)"
            strokeWidth="1"
            fill="none"
          />
        </svg>
        <span className="block h-[86px] w-[150px] overflow-hidden shadow-[0_14px_24px_-12px_rgba(0,0,0,0.5)]">
          {project.image ? (
            <img src={project.image} alt="" className="h-full w-full object-cover" />
          ) : (
            <Poster title="" />
          )}
        </span>
      </span>
      <span className="mt-4 text-[14px] leading-[18.2px] tracking-[-0.01em] text-black/45">
        Next
      </span>
      <span className="mt-1 text-[20px] leading-[24px] tracking-[-0.02em]">{project.title}</span>
    </button>
  );
}

/* Real stills when there are some; stand-in frames until then. */
function stillsOf(project: Project): (string | null)[] {
  return project.stills ?? [null, null, null, null];
}

function Still({
  src,
  index,
  className,
}: {
  src: string | null;
  index: number;
  className?: string;
}) {
  return (
    <div className={cn("aspect-video overflow-hidden bg-black", className)}>
      {src ? (
        <img src={src} alt="" loading="lazy" className="h-full w-full object-cover" />
      ) : (
        <StandInStill variant={index} />
      )}
    </div>
  );
}

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
      <span className="absolute bottom-3 left-4 text-[10px] tracking-[0.2em] text-white/40">
        STILL {String(variant + 1).padStart(2, "0")}
      </span>
    </span>
  );
}
