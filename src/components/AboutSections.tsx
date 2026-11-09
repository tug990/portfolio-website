import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import {
  ABOUT_HEADLINE,
  ABOUT_INTRO,
  APPROACH,
  AWARDS,
  CLIENTS,
  EXPERTISE,
  FAQ,
  HISTORY,
  TEAM,
  TEAM_INTRO,
  TESTIMONIALS,
} from "@/content/site";
import { PROJECTS } from "@/content/projects";
import { Poster } from "@/components/Poster";
import { cn } from "@/lib/utils";

/* Sections of the About page, top to bottom. Content lives in content/site.ts. */

const EASE = "cubic-bezier(0.22, 1, 0.36, 1)";

function SectionHead({ kicker, title }: { kicker: string; title: string }) {
  return (
    <div>
      <p className="text-xs text-black/45">{kicker}</p>
      <h2 className="mt-1 text-sm font-medium">{title}</h2>
    </div>
  );
}

/* Digits that roll into place, like an odometer. */
function Rolling({ value, className }: { value: string; className?: string }) {
  return (
    <span className={cn("inline-flex overflow-hidden leading-none", className)} aria-label={value}>
      {value.split("").map((ch, i) =>
        /\d/.test(ch) ? (
          <span key={i} aria-hidden className="relative inline-block h-[1em] w-[0.62em]">
            <span
              className="absolute left-0 top-0 flex flex-col"
              style={{
                transform: `translateY(${-Number(ch)}em)`,
                transition: `transform .8s ${EASE} ${i * 60}ms`,
              }}
            >
              {Array.from({ length: 10 }, (_, d) => (
                <span key={d} className="block h-[1em] text-center" style={{ lineHeight: 1 }}>
                  {d}
                </span>
              ))}
            </span>
          </span>
        ) : (
          <span key={i} aria-hidden>
            {ch}
          </span>
        ),
      )}
    </span>
  );
}

/* ---------- 1. Headline words hanging on strings ---------- */

export function HangingHeadline() {
  const words = ABOUT_HEADLINE.split(" ");
  const firstRow = Math.ceil(words.length / 2);
  const refs = useRef<(HTMLDivElement | null)[]>([]);
  const lastX = useRef(0);

  // Brushing past a card sets it swinging the way the pointer was moving.
  const nudge = (i: number, e: React.PointerEvent) => {
    const el = refs.current[i];
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const dir = e.clientX >= lastX.current ? 1 : -1;
    el.animate(
      [
        { transform: "rotate(0deg)" },
        { transform: `rotate(${-dir * 5}deg)` },
        { transform: `rotate(${dir * 3}deg)` },
        { transform: `rotate(${-dir * 1.4}deg)` },
        { transform: "rotate(0deg)" },
      ],
      { duration: 1800, easing: "ease-out" },
    );
  };

  return (
    <section
      className="relative h-[82vh] min-h-[520px] overflow-hidden"
      onPointerMove={(e) => (lastX.current = e.clientX)}
    >
      <h1 className="sr-only">{ABOUT_HEADLINE}</h1>
      {words.map((w, i) => {
        const row = i < firstRow ? 0 : 1;
        const inRow = row === 0 ? firstRow : words.length - firstRow;
        const col = row === 0 ? i : i - firstRow;
        // Spread across the width; the second row sits between the first.
        const left = ((col + (row === 1 ? 0.5 : 0.15)) / (inRow + (row === 1 ? 0 : 0.3))) * 100;
        const hang = (row === 0 ? 14 : 34) + ((i * 7) % 9); // string length, vh
        return (
          <div
            key={i}
            ref={(el) => {
              refs.current[i] = el;
            }}
            aria-hidden
            className="absolute top-0 flex flex-col items-center"
            style={
              {
                left: `${Math.min(88, Math.max(4, left))}%`,
                transformOrigin: "50% 0",
                rotate: "0deg",
                animation: `sway ${5 + (i % 3)}s ease-in-out ${-i * 0.9}s infinite alternate`,
              } as CSSProperties
            }
            onPointerEnter={(e) => nudge(i, e)}
          >
            <span className="w-px bg-black/25" style={{ height: `${hang}vh` }} />
            <span className="-mt-1 bg-[#eceae6] px-4 py-2 text-4xl font-medium tracking-tight shadow-[0_10px_20px_-12px_rgba(0,0,0,.4)] sm:px-5 sm:text-6xl">
              {w[0].toUpperCase() + w.slice(1)}
            </span>
          </div>
        );
      })}
      <p className="absolute inset-x-0 bottom-8 mx-auto max-w-sm px-4 text-center text-sm leading-relaxed">
        {ABOUT_INTRO}
      </p>
    </section>
  );
}

/* ---------- 2. Expertise: pinned while you scroll through it ---------- */

export function Expertise() {
  const ref = useRef<HTMLElement>(null);
  const [active, setActive] = useState(0);
  const n = EXPERTISE.length;

  useEffect(() => {
    const onScroll = () => {
      const el = ref.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const run = Math.max(1, r.height - window.innerHeight);
      const p = Math.min(0.999, Math.max(0, -r.top / run));
      setActive(Math.floor(p * n));
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [n]);

  const item = EXPERTISE[active];
  return (
    <section ref={ref} style={{ height: `${n * 70 + 40}vh` }}>
      <div className="sticky top-0 flex h-screen flex-col px-4 pt-28 sm:px-6">
        <SectionHead kicker="What we bring to the table" title="Expertise" />
        <div className="grid flex-1 items-center gap-10 lg:grid-cols-[1.2fr_1fr]">
          <ol className="space-y-1">
            {EXPERTISE.map((e, i) => {
              const d = Math.abs(i - active);
              return (
                <li
                  key={e.title}
                  className="font-medium tracking-tight transition-all duration-700"
                  style={{
                    fontSize:
                      d === 0 ? "clamp(1.8rem, 4vw, 3.2rem)" : "clamp(1.3rem, 2.6vw, 2.2rem)",
                    color: d === 0 ? "#0a0a0a" : `rgba(10,10,10,${Math.max(0.08, 0.3 - d * 0.1)})`,
                  }}
                >
                  {d === 0 && (
                    <span
                      aria-hidden
                      className="mr-3 inline-block h-2 w-2 -translate-y-2 rounded-full align-middle"
                      style={{ background: "var(--prism)" }}
                    />
                  )}
                  {e.title}
                </li>
              );
            })}
          </ol>
          <div>
            <Rolling
              value={String(active + 1).padStart(2, "0")}
              className="text-[clamp(4rem,10vw,8rem)] font-light text-black/25"
            />
            <p className="mt-6 max-w-md text-xl font-medium leading-snug sm:text-2xl">
              {item.text}
            </p>
            <p className="mt-4 text-sm text-black/45">{item.tags}</p>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ---------- 3. Approach: crossed-out habit → what we do instead ---------- */

export function Approach() {
  return (
    <section className="px-4 py-28 sm:px-6">
      <SectionHead kicker="How we think" title="Our approach" />
      <div className="mt-10 border-t">
        {APPROACH.map((a) => (
          <div key={a.to} className="grid gap-3 border-b py-10 sm:grid-cols-2 sm:gap-10">
            <p className="text-left text-lg text-black/35 sm:text-right">
              <span className="relative">
                {a.from}
                <span
                  aria-hidden
                  className="absolute inset-x-0 top-1/2 h-[2px] -translate-y-1/2"
                  style={{ background: "var(--prism)" }}
                />
              </span>
            </p>
            <div>
              <p className="text-lg font-medium">{a.to}</p>
              <p className="mt-1 max-w-xs text-sm text-black/55">{a.text}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ---------- 4. In their words ---------- */

function Portrait({
  name,
  image,
  className,
}: {
  name: string;
  image?: string;
  className?: string;
}) {
  const initials = name
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  return image ? (
    <img src={image} alt="" className={cn("h-full w-full object-cover grayscale", className)} />
  ) : (
    <span
      className={cn(
        "flex h-full w-full items-center justify-center bg-[#e4e2dd] text-4xl font-light text-black/30",
        className,
      )}
    >
      {initials}
    </span>
  );
}

export function Testimonials() {
  const [i, setI] = useState(0);
  if (!TESTIMONIALS.length) return null;
  const t = TESTIMONIALS[i];
  const go = (d: number) => setI((i + d + TESTIMONIALS.length) % TESTIMONIALS.length);
  return (
    <section className="px-4 py-28 sm:px-6">
      <SectionHead kicker="What people say" title="In their words" />
      <div className="mt-10 grid gap-6 bg-[#f1f0ed] p-4 sm:p-6 lg:grid-cols-[1fr_1.3fr_220px]">
        <div className="aspect-[16/10] overflow-hidden lg:aspect-[4/5]">
          <Portrait key={i} name={t.name} image={t.image} className="animate-in fade-in" />
        </div>
        <div
          key={i}
          className="flex flex-col py-2 animate-in fade-in slide-in-from-bottom-2 duration-500"
        >
          <p className="text-xs font-medium">{t.company}</p>
          <blockquote className="mt-6 text-2xl font-medium leading-snug tracking-tight sm:text-3xl">
            “{t.quote}”
          </blockquote>
          <div className="mt-auto flex items-end justify-between pt-10">
            <p className="text-sm">
              <span className="font-medium">{t.name}</span>{" "}
              <span className="text-black/50">
                {t.role}, {t.company}
              </span>
            </p>
            {TESTIMONIALS.length > 1 && (
              <div className="flex gap-2">
                <button
                  type="button"
                  aria-label="Previous"
                  onClick={() => go(-1)}
                  className="h-9 w-9 rounded-full bg-white"
                >
                  ←
                </button>
                <button
                  type="button"
                  aria-label="Next"
                  onClick={() => go(1)}
                  className="h-9 w-9 rounded-full bg-white"
                >
                  →
                </button>
              </div>
            )}
          </div>
        </div>
        <ul className="hidden flex-col gap-2 lg:flex">
          {TESTIMONIALS.map((x, j) => (
            <li key={j}>
              <button
                type="button"
                onClick={() => setI(j)}
                className={cn(
                  "w-full px-4 py-6 text-left text-xs transition-colors",
                  j === i ? "bg-white text-black" : "text-black/40 hover:text-black/70",
                )}
              >
                {x.company}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

/* ---------- 5. Worked with: a shelf of spines ---------- */

export function WorkedWith() {
  if (!CLIENTS.length) return null;
  const tones = ["#f3f2ef", "#e7e5e0", "#eeece8", "#dedcd6", "#f6f5f2"];
  return (
    <section className="px-4 py-28 sm:px-6">
      <SectionHead kicker="Who we have made things for" title="Worked with" />
      <div className="mt-10 overflow-x-auto pb-4">
        <div className="mx-auto flex h-[420px] w-max items-end gap-1 border-b border-black/15 px-4">
          {CLIENTS.map((c, i) => (
            <div
              key={`${c.name}-${i}`}
              tabIndex={0}
              className="group relative flex w-14 flex-col items-center justify-between py-4 outline-none transition-transform duration-500 hover:-translate-y-3 focus-visible:-translate-y-3 sm:w-16"
              style={{ height: `${70 + ((i * 37) % 30)}%`, background: tones[i % tones.length] }}
            >
              <span className="text-[10px] text-black/45">{c.year}</span>
              <span
                className="text-sm font-medium"
                style={{ writingMode: "vertical-rl", transform: "rotate(180deg)" }}
              >
                {c.name}
              </span>
              {/* Details on hover */}
              <span className="pointer-events-none absolute bottom-full left-1/2 mb-3 w-44 -translate-x-1/2 bg-black px-3 py-2 text-left text-xs text-white opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
                <span className="block font-medium">{c.name}</span>
                <span className="block text-white/60">
                  {c.field}, {c.work}
                </span>
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------- 6. Our story: work history on a timeline ---------- */

export function Story() {
  const [i, setI] = useState(HISTORY.length - 1);
  if (!HISTORY.length) return null;
  const h = HISTORY[i];
  const first = HISTORY[0].year;
  const last = Math.max(HISTORY[HISTORY.length - 1].year, new Date().getFullYear());
  const span = Math.max(1, last - first);
  const at = (y: number) => `${((y - first) / span) * 100}%`;
  const years = Array.from({ length: span + 1 }, (_, k) => first + k);

  return (
    <section className="px-4 py-28 sm:px-6">
      <SectionHead kicker="Where we have been" title={`Our story since ${first}`} />
      <div className="mt-12 grid items-center gap-8 lg:grid-cols-[auto_1fr]">
        <Rolling value={String(h.year)} className="text-[clamp(5rem,14vw,11rem)] font-light" />
        <div key={i} className="max-w-sm animate-in fade-in slide-in-from-bottom-2 duration-500">
          <p className="text-xl font-medium">{h.title}</p>
          <p className="mt-1 text-xs text-black/45">
            {h.years}, {h.place}
          </p>
          <p className="mt-3 text-sm text-black/65">{h.text}</p>
        </div>
      </div>

      {/* Timeline */}
      <div className="relative mt-16 h-24">
        <div className="absolute inset-x-0 bottom-6 h-px bg-black/15" />
        {years.map((y) => (
          <span
            key={y}
            className="absolute bottom-6 h-2 w-px bg-black/25"
            style={{ left: at(y) }}
          />
        ))}
        {years
          .filter((y) => y === first || y === last || (y - first) % 2 === 0)
          .map((y) => (
            <span
              key={`l${y}`}
              className="absolute bottom-0 -translate-x-1/2 text-[10px] text-black/40"
              style={{ left: at(y) }}
            >
              {y}
            </span>
          ))}
        {HISTORY.map((x, j) => (
          <button
            key={j}
            type="button"
            onClick={() => setI(j)}
            className="absolute bottom-6 flex -translate-x-px flex-col items-start"
            style={{ left: at(x.year) }}
          >
            <span
              className={cn(
                "mb-1 whitespace-nowrap text-[11px] transition-colors",
                j === i ? "font-medium text-black" : "text-black/40 hover:text-black/70",
              )}
            >
              {x.title}
            </span>
            <span
              className="w-[2px] transition-all duration-500"
              style={{ height: j === i ? 40 : 20, background: j === i ? "var(--prism)" : "#0003" }}
            />
          </button>
        ))}
      </div>
      <div className="mt-6 flex gap-2">
        <button
          type="button"
          disabled={i === 0}
          onClick={() => setI(i - 1)}
          className="rounded-md border px-3 py-1.5 text-xs disabled:opacity-30"
        >
          Earlier
        </button>
        <button
          type="button"
          disabled={i === HISTORY.length - 1}
          onClick={() => setI(i + 1)}
          className="rounded-md border px-3 py-1.5 text-xs disabled:opacity-30"
        >
          Later
        </button>
      </div>
    </section>
  );
}

/* ---------- 7. The team ---------- */

export function Team() {
  if (!TEAM.length) return null;
  return (
    <section className="grid gap-10 px-4 py-28 sm:px-6 lg:grid-cols-[220px_1fr]">
      <div>
        <h2 className="text-sm font-medium">At the bench</h2>
        <p className="mt-3 text-sm text-black/55">{TEAM_INTRO}</p>
      </div>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {TEAM.map((m, i) => (
          <div key={`${m.name}-${i}`}>
            <div className="aspect-square overflow-hidden">
              <Portrait name={m.name} image={m.image} />
            </div>
            <p className="mt-3 text-sm font-medium">{m.name}</p>
            <p className="text-xs text-black/50">{m.role}</p>
            <p className="mt-2 flex gap-3 text-xs">
              {m.links.map((l) => (
                <a
                  key={l.href}
                  href={l.href}
                  target="_blank"
                  rel="noreferrer"
                  className="underline underline-offset-4"
                >
                  {l.label}
                </a>
              ))}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ---------- 8. Awards: point at one to see the work ---------- */

export function Awards() {
  const [hover, setHover] = useState<{ i: number; x: number; y: number } | null>(null);
  if (!AWARDS.length) return null;
  const project = hover ? PROJECTS.find((p) => p.slug === AWARDS[hover.i].project) : undefined;
  const winner = (r: string) => /winner|gold|best/i.test(r);

  return (
    <section className="grid gap-10 px-4 py-28 sm:px-6 lg:grid-cols-[220px_1fr]">
      <div>
        <p className="text-xs text-black/45">Point at a prize to see the work it was for.</p>
        <h2 className="mt-1 text-sm font-medium">Awards</h2>
      </div>
      <ul className="border-t" onPointerLeave={() => setHover(null)}>
        {AWARDS.map((a, i) => (
          <li
            key={`${a.name}-${i}`}
            className="flex items-center justify-between border-b py-6 text-sm"
            onPointerMove={(e) =>
              e.pointerType === "mouse" && setHover({ i, x: e.clientX, y: e.clientY })
            }
          >
            <span className="font-medium">{a.name}</span>
            <span className="flex items-center gap-2 text-xs text-black/55">
              {a.result}
              {winner(a.result) && (
                <span className="h-1.5 w-1.5 rounded-full" style={{ background: "var(--prism)" }} />
              )}
              <span className="w-10 text-right">{a.year}</span>
            </span>
          </li>
        ))}
      </ul>
      {/* The work, following the pointer */}
      {hover && project && (
        <div
          aria-hidden
          className="pointer-events-none fixed z-40 w-56 -translate-x-1/2 -translate-y-[110%] overflow-hidden shadow-xl"
          style={{ left: hover.x, top: hover.y, aspectRatio: "3 / 2" }}
        >
          {project.image ? (
            <img src={project.image} alt="" className="h-full w-full object-cover" />
          ) : (
            <Poster title={project.title} />
          )}
        </div>
      )}
    </section>
  );
}

/* ---------- 9. FAQ ---------- */

export function Faq() {
  const [open, setOpen] = useState(0);
  return (
    <section className="grid gap-10 px-4 py-28 sm:px-6 lg:grid-cols-[220px_1fr]">
      <SectionHead kicker="What people ask before they write" title="Frequently asked questions" />
      <div className="border-t">
        {FAQ.map((f, i) => {
          const isOpen = open === i;
          return (
            <button
              key={f.q}
              type="button"
              aria-expanded={isOpen}
              onClick={() => setOpen(isOpen ? -1 : i)}
              className="grid w-full gap-2 border-b py-5 text-left sm:grid-cols-2 sm:gap-8"
            >
              <span className="text-sm font-medium">{f.q}</span>
              <span className="text-sm text-black/55">
                {isOpen ? <Reveal>{f.a}</Reveal> : <span className="text-black/25">—</span>}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}

function Reveal({ children }: { children: ReactNode }) {
  return (
    <span className="block animate-in fade-in slide-in-from-top-1 duration-300">{children}</span>
  );
}
