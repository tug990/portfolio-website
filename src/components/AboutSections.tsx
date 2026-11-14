import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import {
  ABOUT_HEADLINE,
  ABOUT_INTRO,
  ABOUT_PERSPECTIVES,
  ABOUT_PERSPECTIVE_TITLE,
  APPROACH,
  AWARDS,
  CLIENTS,
  EXPERTISE,
  FAQ,
  HISTORY,
  TEAM,
  TEAM_INTRO,
  TESTIMONIALS,
  SITE,
  WORK_CLIENTS,
  type PerspectiveId,
} from "@/content/site";
import { PROJECTS } from "@/content/projects";
import { Poster } from "@/components/Poster";
import { ClientBadge, VideoCard } from "@/components/work/WorkUI";
import { GLASS_PANEL, GLASS_PILL, MENU_IN, useMenu } from "@/lib/menu";
import { PerspectiveIcon, PerspectiveSwitch } from "@/components/PerspectiveMenu";
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

/* ---------- the top: "Know us from the perspective of you" ---------- */

/*
  The About page: the sky, and nothing else. Clouds, and the mark as a door
  of light standing in them; over it the question in wide-spaced capitals
  and a glass picker of who you are, just above the door. Large screens: the
  wide picture (public/brand/about-sky-2000/1200.webp) standing on the
  screen's foot. Phones: a tall picture made for them (about-sky-phone.webp:
  the gate in the middle, clouds rising either side, a sea of cloud below),
  so the gate, the clouds and the picker sit in the middle of the frame as
  they do on a large screen. The sky lives: mist drifts slowly over it
  (SkyMist) and the picture breathes, very slightly. Choosing carries you
  through the door into your world (`enter`).
*/
export function PerspectiveHero() {
  const navigate = useNavigate();
  const sky = useRef<HTMLDivElement>(null);
  const img = useRef<HTMLImageElement>(null);
  const [entering, setEntering] = useState(false);

  // the sky drawing's push in and brightness as you go through (SkyFlow: drawn, never rescaled)
  const view = useRef({ k: 1, bright: 1, live: false });

  const enter = (id: PerspectiveId) => {
    const go = () => navigate({ to: "/about/$perspective", params: { perspective: id } });
    const el = img.current;
    const box = sky.current;
    if (!el || !box || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return go();
    setEntering(true);
    const d = doorOnScreen(el);
    const b = box.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    /*
      A gentle push in towards the door: never more than half again its size,
      so the photograph stays sharp (blown up further, it would blur and show
      its pixels). The going-through is the light: see below.
    */
    if (view.current.live) {
      // in the drawing itself, about the door's slot, at the screen's own resolution
      const t0 = performance.now();
      const push = (now: number) => {
        const t = Math.min(1, (now - t0) / 1500);
        const e = Math.pow(t, 2.3); // easing in, gathering pace
        view.current.k = 1 + 0.5 * e;
        view.current.bright = 1 + 0.25 * e;
        if (t < 1) requestAnimationFrame(push);
      };
      requestAnimationFrame(push);
      box
        .querySelector("canvas[data-mist]")
        ?.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 900, fill: "forwards" });
    } else {
      box.style.transformOrigin = `${d.x - b.left}px ${d.y - b.top}px`;
      box.animate(
        [
          { transform: "scale(1)", filter: "brightness(1)" },
          { transform: "scale(1.5)", filter: "brightness(1.25)" },
        ],
        { duration: 1500, easing: "cubic-bezier(0.5, 0, 0.75, 0.3)", fill: "forwards" },
      );
    }
    /*
      The light in the door's slot opens towards you until it fills the
      screen: drawn by the browser at every size (soft gradients), so however
      large it grows it stays crisp, never a stretched picture.
    */
    const gap = d.gap;
    const light = document.createElement("div");
    Object.assign(light.style, {
      position: "fixed",
      zIndex: "69",
      pointerEvents: "none",
      // an ellipse of light that feathers out at every size: white at the heart,
      // a breath of the door's blue to the left and amber to the right
      background: [
        "radial-gradient(closest-side, #ffffff 0%, #ffffff 52%, rgba(255,255,255,0.85) 66%, rgba(255,255,255,0) 100%)",
        "radial-gradient(closest-side at 30% 50%, rgba(90,120,255,0.35), rgba(90,120,255,0) 100%)",
        "radial-gradient(closest-side at 70% 50%, rgba(255,150,60,0.35), rgba(255,150,60,0) 100%)",
      ].join(", "),
    });
    document.body.append(light);
    const rect = (x: number, y: number, w: number, h: number, o: number) => ({
      left: `${x - w / 2}px`,
      top: `${y - h / 2}px`,
      width: `${w}px`,
      height: `${h}px`,
      opacity: o,
    });
    // from the slot (a little wider than it, the glow round it) to well past the screen's edges
    light.animate(
      [
        rect(gap.x, gap.y, gap.w * 2.4, gap.h * 1.25, 0),
        { ...rect(gap.x, gap.y, gap.w * 3.2, gap.h * 1.35, 1), offset: 0.18 },
        rect(vw / 2, vh / 2, vw * 2.6, vh * 2.6, 1),
      ],
      { duration: 1400, delay: 100, easing: "cubic-bezier(0.7, 0, 0.84, 0)", fill: "forwards" },
    );
    // then all white; and on the other side, the white clears into their world
    const veil = document.createElement("div");
    Object.assign(veil.style, {
      position: "fixed",
      inset: "0",
      zIndex: "70",
      pointerEvents: "none",
      opacity: "0",
      background: "#fbfaf8",
    });
    document.body.append(veil);
    const done = () => {
      veil.remove();
      light.remove();
    };
    veil
      .animate([{ opacity: 0 }, { opacity: 1 }], {
        duration: 350,
        delay: 1250,
        easing: "ease-in",
        fill: "forwards",
      })
      .finished.then(() => {
        light.remove();
        go();
        return veil
          .animate([{ opacity: 1 }, { opacity: 0 }], {
            duration: 900,
            delay: 200,
            easing: "ease-out",
            fill: "forwards",
          })
          .finished.then(done);
      })
      .catch(done);
  };

  return (
    <section
      data-full-screen
      className="relative isolate flex min-h-[100svh] flex-col items-center overflow-hidden bg-[#ecebea] px-4 pb-[calc(var(--dock,0px)+2rem)] pt-[max(calc(env(safe-area-inset-top)+1.5rem),calc(53svh-9.5rem))] sm:bg-[#e4e2e3] sm:pt-[7.1rem]"
    >
      {/*
        (on phones it runs on under the tab bar, so the page is exactly one
        screen: data-full-screen, styles.css; there the words and the picker
        sit just above the gate, in the middle of the frame)
      */}
      <div ref={sky} aria-hidden className="absolute inset-0 -z-10">
        {/* the photograph (and, drawn over it where the device can, the same photograph with its clouds flowing) */}
        <div className="absolute inset-0">
          <picture>
            <source media="(max-width: 639px)" srcSet="/brand/about-sky-phone.webp" />
            <img
              ref={img}
              src="/brand/about-sky-2000.webp"
              alt=""
              fetchPriority="high"
              className="absolute inset-0 h-full w-full object-cover object-[50%_62%] sm:object-bottom"
            />
          </picture>
          <SkyFlow img={img} view={view} />
        </div>
        <SkyMist img={img} />
      </div>
      <div
        className={cn(
          "flex w-full flex-col items-center transition-opacity duration-500",
          entering && "pointer-events-none opacity-0",
        )}
      >
        <h1 className="flex w-full max-w-5xl items-center justify-center gap-3 sm:gap-10">
          <span aria-hidden className="h-px w-6 shrink-0 bg-black/30 sm:w-14" />
          {/* (the padding on the left balances the spacing after the last letter) */}
          <span className="pl-[0.3em] text-center text-[12px] font-medium uppercase leading-[2.1] tracking-[0.3em] text-black/85 sm:pl-[0.42em] sm:text-[18px] sm:leading-normal sm:tracking-[0.42em]">
            {ABOUT_PERSPECTIVE_TITLE}
          </span>
          <span aria-hidden className="h-px w-6 shrink-0 bg-black/30 sm:w-14" />
        </h1>
        <div className="mt-5 w-full sm:mt-7">
          <PerspectivePicker onChoose={enter} />
        </div>
      </div>
    </section>
  );
}

/*
  Where the door is in each sky picture, as fractions of its width and height:
  the slot of light (`slot`, where the sky draws in towards), the gap between
  its panels (`gap`: its middle, width and height), and where the picture is
  pinned in the frame (`posY`: 1 stands it on the foot, as large screens; the
  phone's sits a little below the middle).
*/
const SKY_DOOR = {
  wide: {
    slot: { x: 838 / 1672, y: 640 / 941 },
    gap: { x: 839 / 1672, y: 690 / 941, w: 42 / 1672, h: 290 / 941 },
    posY: 1,
    // what stays still while the clouds flow: the gate, its light and the floor under it (x0, y0, x1, y1)
    still: [0.415, 0.5, 0.585, 1],
  },
  phone: {
    slot: { x: 0.5, y: 0.6201 },
    gap: { x: 0.5012, y: 0.649, w: 0.0525, h: 0.1674 },
    posY: 0.62,
    still: [0.33, 0.52, 0.67, 0.81],
  },
};

/*
  Where the door is on screen now: the picture is drawn with object-fit
  cover (at the larger of its two scales, centred across, pinned at `posY`
  down), and may be breathing (its box then a little larger: still right).
*/
function doorOnScreen(el: HTMLImageElement) {
  const at = el.currentSrc.includes("phone") ? SKY_DOOR.phone : SKY_DOOR.wide;
  const r = el.getBoundingClientRect();
  const k = Math.max(r.width / el.naturalWidth, r.height / el.naturalHeight) || 1;
  const dw = el.naturalWidth * k;
  const dh = el.naturalHeight * k;
  const left = r.left + (r.width - dw) / 2;
  const top = r.top + (r.height - dh) * at.posY;
  return {
    x: left + at.slot.x * dw,
    y: top + at.slot.y * dh,
    gap: { x: left + at.gap.x * dw, y: top + at.gap.y * dh, w: at.gap.w * dw, h: at.gap.h * dh },
  };
}

/*
  The clouds flow, in the photograph itself (as a cinemagraph): the picture
  drawn by the graphics card with a slow current running through it, a drift
  to the right that curls a little, everywhere but the gate, its light and
  the floor under it (`still`), which stay perfectly still and sharp. (Two
  copies of the picture, each carried along the current and taken back in
  turn; most of the time only one shows, and they cross-fade only briefly,
  so the clouds stay crisp and the flow never jumps.)
  Without losing pixels: drawn at the screen's own resolution, enlarged with
  bicubic (Catmull-Rom) sampling rather than plain blending, and the
  picture's slow breath and the push in as you go through the door (`view`)
  happen in the drawing, never by rescaling what's drawn. Over the
  photograph, which shows instead where the device can't draw it; none
  under reduced motion.
*/
function SkyFlow({
  img,
  view,
}: {
  img: React.RefObject<HTMLImageElement | null>;
  view: React.RefObject<{ k: number; bright: number; live: boolean }>;
}) {
  const canvas = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const cv = canvas.current;
    const pic = img.current;
    if (!cv || !pic || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const gl = cv.getContext("webgl", { alpha: false, antialias: false });
    if (!gl) return;
    const vs = "attribute vec2 p; void main() { gl_Position = vec4(p, 0.0, 1.0); }";
    const fs = /* glsl */ `
      precision highp float;
      uniform sampler2D uTex;
      uniform vec2 uRes;    // the canvas, in its pixels
      uniform vec2 uImg;    // the picture's size, in its pixels
      uniform float uPosY;  // where it's pinned, down (as object-position)
      uniform vec4 uStill;  // what doesn't flow, in the picture's fractions
      uniform vec2 uSlot;   // the door's slot, in the picture's fractions (the breath and push in centre on it)
      uniform float uZoom;  // the push in (1: none)
      uniform float uBright;
      uniform float uTime;
      float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
      float noise(vec2 p) {
        vec2 i = floor(p), f = fract(p);
        vec2 u = f * f * (3.0 - 2.0 * f);
        return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
      }
      // bicubic (Catmull-Rom) sampling in nine taps: sharper than plain blending when enlarging
      vec3 sharp(vec2 uv) {
        vec2 sp = uv * uImg;
        vec2 t1 = floor(sp - 0.5) + 0.5;
        vec2 f = sp - t1;
        vec2 w0 = f * (-0.5 + f * (1.0 - 0.5 * f));
        vec2 w1 = 1.0 + f * f * (-2.5 + 1.5 * f);
        vec2 w2 = f * (0.5 + f * (2.0 - 1.5 * f));
        vec2 w3 = f * f * (-0.5 + 0.5 * f);
        vec2 w12 = w1 + w2;
        vec2 t0 = (t1 - 1.0) / uImg;
        vec2 t3 = (t1 + 2.0) / uImg;
        vec2 t12 = (t1 + w2 / w12) / uImg;
        vec3 r = texture2D(uTex, vec2(t0.x, t0.y)).rgb * w0.x * w0.y
          + texture2D(uTex, vec2(t12.x, t0.y)).rgb * w12.x * w0.y
          + texture2D(uTex, vec2(t3.x, t0.y)).rgb * w3.x * w0.y
          + texture2D(uTex, vec2(t0.x, t12.y)).rgb * w0.x * w12.y
          + texture2D(uTex, vec2(t12.x, t12.y)).rgb * w12.x * w12.y
          + texture2D(uTex, vec2(t3.x, t12.y)).rgb * w3.x * w12.y
          + texture2D(uTex, vec2(t0.x, t3.y)).rgb * w0.x * w3.y
          + texture2D(uTex, vec2(t12.x, t3.y)).rgb * w12.x * w3.y
          + texture2D(uTex, vec2(t3.x, t3.y)).rgb * w3.x * w3.y;
        return clamp(r, 0.0, 1.0);
      }
      void main() {
        vec2 f = vec2(gl_FragCoord.x, uRes.y - gl_FragCoord.y);
        // as object-fit: cover
        float k = max(uRes.x / uImg.x, uRes.y / uImg.y);
        vec2 dsz = uImg * k;
        vec2 off = vec2((uRes.x - dsz.x) * 0.5, (uRes.y - dsz.y) * uPosY);
        vec2 uv = (f - off) / dsz;
        // the slow breath (a few percent over most of a minute) and the push in, about the slot
        float breath = 1.0 + 0.0175 * (1.0 - cos(6.2831853 * uTime / 52.0));
        uv = uSlot + (uv - uSlot) / (breath * uZoom);
        // how freely this point flows: not at all on the gate, fully a little way off it
        vec2 near = clamp(uv, uStill.xy, uStill.zw);
        float away = length((uv - near) * vec2(uImg.x / uImg.y, 1.0));
        float m = smoothstep(0.0, 0.07, away);
        // the current: a drift to the right, curling up and down a little, varying from place to place
        float n1 = noise(uv * vec2(3.0, 4.0) + vec2(uTime * 0.03, 0.0));
        float n2 = noise(uv * vec2(5.0, 6.0) - vec2(0.0, uTime * 0.02));
        vec2 dir = vec2(0.8 + 0.5 * n1, (n2 - 0.5) * 0.7) * m;
        // two copies along it, half a cycle apart; one shows, the other takes over only near the
        // end of its run (a short cross-fade), so the clouds are seldom doubled
        // (how far, as a share of the picture's height: the same pace on a tall phone picture as a wide one)
        float T = 7.0;
        float p0 = fract(uTime / T);
        float p1 = fract(uTime / T + 0.5);
        vec2 s = vec2(uImg.y / uImg.x, 1.0) * 0.045;
        float w = smoothstep(0.7, 1.0, abs(p0 - 0.5) * 2.0);
        vec3 c;
        if (w < 0.002) c = sharp(uv - dir * s * (p0 - 0.5));
        else if (w > 0.998) c = sharp(uv - dir * s * (p1 - 0.5));
        else c = mix(sharp(uv - dir * s * (p0 - 0.5)), sharp(uv - dir * s * (p1 - 0.5)), w);
        gl_FragColor = vec4(min(c * uBright, 1.0), 1.0);
      }`;
    const sh = (type: number, src: string) => {
      const x = gl.createShader(type)!;
      gl.shaderSource(x, src);
      gl.compileShader(x);
      return x;
    };
    const prog = gl.createProgram()!;
    gl.attachShader(prog, sh(gl.VERTEX_SHADER, vs));
    gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, fs));
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return;
    gl.useProgram(prog);
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(prog, "p");
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    const tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    const u = (n: string) => gl.getUniformLocation(prog, n);
    const uRes = u("uRes");
    const uImg = u("uImg");
    const uPosY = u("uPosY");
    const uStill = u("uStill");
    const uSlot = u("uSlot");
    const uZoom = u("uZoom");
    const uBright = u("uBright");
    const uTime = u("uTime");
    // the picture the page chose (wide, or the phone's): uploaded, every pixel as it is, when
    // it has loaded, and again if it changes
    let src = "";
    const upload = () => {
      if (!pic.complete || !pic.naturalWidth || pic.currentSrc === src) return;
      src = pic.currentSrc;
      gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.pixelStorei(gl.UNPACK_COLORSPACE_CONVERSION_WEBGL, gl.NONE);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, pic);
    };
    pic.addEventListener("load", upload);
    let raf = 0;
    let last = 0;
    const t0 = performance.now();
    const draw = (now: number) => {
      raf = requestAnimationFrame(draw);
      // about 30 frames a second (clouds don't hurry); every frame while going through the door
      if (now - last < 32 && view.current.k === 1) return;
      last = now;
      upload();
      if (!src) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = Math.max(1, Math.round(cv.clientWidth * dpr));
      const h = Math.max(1, Math.round(cv.clientHeight * dpr));
      if (cv.width !== w || cv.height !== h) {
        cv.width = w;
        cv.height = h;
      }
      gl.viewport(0, 0, w, h);
      const at = src.includes("phone") ? SKY_DOOR.phone : SKY_DOOR.wide;
      gl.uniform2f(uRes, w, h);
      gl.uniform2f(uImg, pic.naturalWidth, pic.naturalHeight);
      gl.uniform1f(uPosY, at.posY);
      gl.uniform4f(uStill, at.still[0], at.still[1], at.still[2], at.still[3]);
      gl.uniform2f(uSlot, at.slot.x, at.slot.y);
      gl.uniform1f(uZoom, view.current.k);
      gl.uniform1f(uBright, view.current.bright);
      gl.uniform1f(uTime, (now - t0) / 1000);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      if (!view.current.live) {
        view.current.live = true;
        cv.style.opacity = "1"; // now over the photograph
      }
    };
    raf = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(raf);
      pic.removeEventListener("load", upload);
      gl.getExtension("WEBGL_lose_context")?.loseContext();
    };
  }, [img, view]);
  return (
    <canvas
      ref={canvas}
      aria-hidden
      className="pointer-events-none absolute inset-0 h-full w-full opacity-0"
    />
  );
}

/*
  Clouds crossing the sky, as real ones do: soft masses of cloud that drift
  from the left of the screen to the right, across the door and out the
  other side, changing shape a little as they go (noise folded into itself).
  Two layers at two heights and speeds: a high, slower one in the open sky,
  and a low, quicker one that passes in front of the gate; lit from above
  (their tops whiter, their undersides greyer), and warm and glowing where
  they pass before the gate's light. A thin veil of mist lies along the
  gate's foot. The same crossing time on any screen (about 46 s high, 30 s
  low). A small WebGL drawing at about 30 frames a second (clouds have no
  hard edges, so it's drawn at a little under the screen's resolution);
  still under reduced motion; nothing if the device can't draw it.
*/
function SkyMist({ img }: { img: React.RefObject<HTMLImageElement | null> }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const cv = canvas.current;
    const gl = cv?.getContext("webgl", { premultipliedAlpha: true, alpha: true, antialias: false });
    if (!cv || !gl) return;
    const vs = "attribute vec2 p; void main() { gl_Position = vec4(p, 0.0, 1.0); }";
    const fs = /* glsl */ `
      precision highp float;
      uniform vec2 uRes;
      uniform float uTime;
      uniform vec2 uDoor;   // the gate's slot, in canvas pixels (from the bottom)
      uniform float uFoot;  // the gate's foot, as a height (0 bottom .. 1 top)
      float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
      float noise(vec2 p) {
        vec2 i = floor(p), f = fract(p);
        vec2 u = f * f * (3.0 - 2.0 * f);
        return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
      }
      float fbm5(vec2 p) {
        float v = 0.0, a = 0.5;
        for (int i = 0; i < 5; i++) { v += a * noise(p); p = p * 2.03 + vec2(1.7, 9.2); a *= 0.5; }
        return v;
      }
      float fbm3(vec2 p) {
        float v = 0.0, a = 0.5;
        for (int i = 0; i < 3; i++) { v += a * noise(p); p = p * 2.03 + vec2(1.7, 9.2); a *= 0.5; }
        return v;
      }
      // a field of cloud, wider than tall, travelling right at speed v (in its own units a second),
      // its shapes slowly changing as it goes
      float cloud(vec2 p, float t, float v) {
        vec2 q = p * vec2(1.1, 2.2);
        q.x -= t * v; // (looking further left as time goes on: what's there moves right)
        vec2 w = vec2(fbm3(q * 0.7 + vec2(0.0, t * 0.012)), fbm3(q * 0.7 + vec2(5.2, 1.3) - vec2(0.0, t * 0.009)));
        return fbm5(q + 1.2 * w);
      }
      void main() {
        vec2 f = gl_FragCoord.xy;
        // measured in screen heights, or on a tall narrow screen (a phone) in a little more
        // than its width, so the clouds are the same size to the eye and several fit across
        float u = min(uRes.y, uRes.x * 1.25);
        vec2 p = f / u;
        float span = uRes.x / u;  // the screen's width in those units
        float h = f.y / uRes.y;   // 0 at the foot of the screen, 1 at the top
        float t = uTime;
        // each layer crosses the whole screen in the same time on any screen
        float vHigh = span * 1.1 / 46.0;
        float vLow = span * 1.1 * 1.55 / 30.0;
        vec2 pl = p * 1.55 + vec2(3.7, 1.1);
        float dH = cloud(p, t, vHigh);
        float dL = cloud(pl, t, vLow);
        float dLup = cloud(pl + vec2(0.0, 0.05), t, vLow); // a little above: for the light on its top
        // where each layer lies: the high one in the open sky, the low one across the gate
        float bandH = smoothstep(0.3, 0.52, h) * (1.0 - smoothstep(0.84, 1.0, h));
        float bandL = smoothstep(0.02, 0.14, h) * (1.0 - smoothstep(0.46, 0.66, h));
        float aH = smoothstep(0.47, 0.75, dH) * bandH * 0.6;
        float aL = smoothstep(0.44, 0.7, dL) * bandL * 0.92;
        // lit from above: tops whiter, undersides greyer
        float lit = clamp(0.62 + (dL - dLup) * 6.0, 0.0, 1.0);
        vec3 cL = mix(vec3(0.79, 0.79, 0.82), vec3(1.0, 0.99, 0.975), lit);
        vec3 cH = mix(vec3(0.88, 0.89, 0.92), vec3(1.0, 0.995, 0.985), smoothstep(0.5, 0.85, dH));
        // before the gate's light: warm, glowing through, a little thinner
        vec2 door = uDoor / u;
        float g = exp(-pow(distance(p, door) / 0.22, 2.0));
        cL = mix(cL, vec3(1.0, 0.94, 0.84) * 1.04, g * 0.75);
        aL *= 1.0 - g * 0.45;
        // a thin veil of mist along the gate's foot, drifting with the low clouds
        float veil = exp(-pow((h - uFoot) / 0.06, 2.0)) * smoothstep(0.32, 0.72, dL) * 0.35;
        aL = max(aL, veil);
        float A = aL + aH * (1.0 - aL);
        vec3 C = cL * aL + cH * aH * (1.0 - aL);
        gl_FragColor = vec4(min(C, vec3(1.0)), A);
      }`;
    const sh = (type: number, src: string) => {
      const s = gl.createShader(type)!;
      gl.shaderSource(s, src);
      gl.compileShader(s);
      return s;
    };
    const prog = gl.createProgram()!;
    gl.attachShader(prog, sh(gl.VERTEX_SHADER, vs));
    gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, fs));
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return;
    gl.useProgram(prog);
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(prog, "p");
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    const uRes = gl.getUniformLocation(prog, "uRes");
    const uTime = gl.getUniformLocation(prog, "uTime");
    const uDoor = gl.getUniformLocation(prog, "uDoor");
    const uFoot = gl.getUniformLocation(prog, "uFoot");
    // a little under the screen's resolution (clouds have no hard edges; the full count would cost)
    const SCALE = Math.min(window.devicePixelRatio || 1, 2) * 0.36;
    let raf = 0;
    let last = 0;
    const t0 = performance.now();
    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const draw = (now: number) => {
      raf = still ? 0 : requestAnimationFrame(draw);
      if (now - last < 32) return; // about 30 frames a second is plenty for mist
      last = now;
      const r = cv.getBoundingClientRect();
      const w = Math.max(1, Math.round(r.width * SCALE));
      const h = Math.max(1, Math.round(r.height * SCALE));
      if (cv.width !== w || cv.height !== h) {
        cv.width = w;
        cv.height = h;
      }
      gl.viewport(0, 0, w, h);
      let dx = w / 2;
      let dy = h * 0.35;
      let foot = 0.15;
      if (img.current?.naturalWidth) {
        const d = doorOnScreen(img.current);
        dx = (d.x - r.left) * SCALE;
        dy = (r.bottom - d.y) * SCALE;
        foot = (r.bottom - (d.gap.y + d.gap.h / 2)) / r.height;
      }
      gl.uniform2f(uRes, w, h);
      gl.uniform1f(uTime, (now - t0) / 1000 + 40);
      gl.uniform2f(uDoor, dx, dy);
      gl.uniform1f(uFoot, foot);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    };
    raf = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(raf);
      gl.getExtension("WEBGL_lose_context")?.loseContext();
    };
  }, [img]);
  return (
    <canvas
      ref={canvas}
      data-mist
      aria-hidden
      className="pointer-events-none absolute inset-0 h-full w-full"
    />
  );
}

/*
  The picker: a glass pill with a soft line of prism light under it; open,
  the list of perspectives hangs from it as one piece of glass (an icon and a
  name each, hairlines between). Keys as the site's other menus (lib/menu.ts).
*/
function PerspectivePicker({
  value,
  onChoose,
}: {
  value?: PerspectiveId;
  onChoose: (id: PerspectiveId) => void;
}) {
  // (`value`: the one chosen, if any, shown on the pill)
  const m = useMenu();
  const chosen = ABOUT_PERSPECTIVES.find((p) => p.id === value);
  return (
    // a compact pill, centred: its words in the middle (the arrow kept to the right),
    // the list below in one centred column (icons lined up, names beside them)
    <div ref={m.root} className="relative mx-auto w-[min(300px,100%)]">
      {!m.open && (
        <span
          aria-hidden
          className="pointer-events-none absolute inset-x-8 -bottom-1 h-3 rounded-full opacity-60 blur-md"
          style={{ background: "var(--prism)" }}
        />
      )}
      <button
        ref={m.trigger}
        type="button"
        onClick={() => m.setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={m.open}
        className={cn(
          "relative flex h-12 w-full items-center justify-center gap-2 px-11 text-[15px] font-medium tracking-[0.02em] text-black/85 outline-none focus-visible:ring-2 focus-visible:ring-[#6d7bff]/50",
          GLASS_PILL,
          m.open ? "rounded-t-[24px] rounded-b-none" : "rounded-[24px]",
        )}
      >
        {chosen && <PerspectiveIcon id={chosen.id} className="h-[18px] w-[18px] shrink-0" />}
        <span className="truncate">{chosen ? chosen.label : "Select your perspective"}</span>
        <svg
          aria-hidden
          viewBox="0 0 24 24"
          className={cn(
            "absolute right-4 h-[18px] w-[18px] transition-transform",
            m.open && "rotate-180",
          )}
          fill="none"
          stroke="currentColor"
          strokeWidth={1.8}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M6.5 9.5l5.5 5.5 5.5-5.5" />
        </svg>
      </button>
      {m.open && (
        <ul
          role="listbox"
          aria-label="Your perspective"
          className={cn(
            "absolute inset-x-0 top-full z-20 origin-top overflow-hidden rounded-b-[24px] border-t-0 px-2 pb-2.5 pt-1",
            GLASS_PANEL,
            MENU_IN,
          )}
        >
          {ABOUT_PERSPECTIVES.map((p, i) => (
            <li key={p.id} role="none">
              <button
                type="button"
                role="option"
                aria-selected={p.id === value}
                onClick={() => {
                  m.choose();
                  onChoose(p.id);
                }}
                className="flex w-full justify-center rounded-xl py-2.5 text-[15px] tracking-[0.04em] text-black/80 outline-none transition hover:bg-white/70 focus-visible:bg-white/80 sm:py-2"
              >
                <span className="flex w-[13.5rem] items-center gap-3.5 text-left">
                  <PerspectiveIcon id={p.id} className="h-5 w-5 shrink-0 text-black/75" />
                  <span className="flex-1">{p.label}</span>
                  {p.id === value && (
                    <span
                      aria-hidden
                      className="h-1.5 w-1.5 rounded-full"
                      style={{ background: "var(--prism)" }}
                    />
                  )}
                </span>
              </button>
              {i < ABOUT_PERSPECTIVES.length - 1 && (
                <div className="mx-auto h-px w-[13.5rem] bg-black/[0.06]" />
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/*
  The light of each world, either side of the white you came through: the
  door's blue and amber, turned to suit (warm for NGOs, cool for companies,
  saffron and green for government, sand for building, deep blue for
  universities).
*/
const WORLD_LIGHT: Record<PerspectiveId, [string, string]> = {
  ngo: ["rgba(255,110,110,0.16)", "rgba(255,170,90,0.2)"],
  corporate: ["rgba(60,80,255,0.16)", "rgba(110,200,255,0.16)"],
  government: ["rgba(255,153,51,0.18)", "rgba(19,136,8,0.14)"],
  "real-estate": ["rgba(185,140,90,0.2)", "rgba(255,196,130,0.18)"],
  university: ["rgba(40,60,200,0.18)", "rgba(140,100,255,0.16)"],
};

/*
  A perspective's world, on the other side of the About page's door. You
  arrive in its light (white at the heart, the world's colours either side,
  a beam down the middle as the door's): its sign, its headline over a line
  of prism light and a few words; then what we make for them, who we've made
  films with (their emblems) and their films (or, where we haven't yet, the
  studio's own), and the way to start a conversation or choose another
  perspective. "All perspectives" leads back to the door.
*/
export function PerspectiveWorld({ id }: { id: PerspectiveId }) {
  const p = ABOUT_PERSPECTIVES.find((x) => x.id === id)!;
  const [left, right] = WORLD_LIGHT[id];
  const clients = WORK_CLIENTS.filter((c) => p.clients.includes(c.name));
  const films = (
    clients.length
      ? PROJECTS.filter((f) => f.client && p.clients.includes(f.client))
      : PROJECTS.filter((f) => !f.client)
  ).slice(0, 3);
  return (
    <>
      {/*
        phones: a sticky bar of glass along the top (the site's own bar is at
        the bottom): back to the door, and the perspective, to change it
        (large screens change it from the header: SiteNav)
      */}
      <div className="sticky top-0 z-30 -mb-[calc(env(safe-area-inset-top)+4rem)] px-3 pt-[calc(env(safe-area-inset-top)+0.5rem)] sm:hidden">
        <div className="relative isolate flex h-12 items-center gap-1 px-1">
          {/*
            the glass, as a layer behind the bar's contents (not on the bar
            itself: then the menu that opens from it couldn't frost what's
            behind it, nor span the screen)
          */}
          <span
            aria-hidden
            className="absolute inset-0 -z-10 rounded-full border border-white/70 bg-white/60 shadow-[0_14px_34px_-14px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.85)] ring-1 ring-black/[0.05] backdrop-blur-2xl backdrop-saturate-[1.8]"
          />
          <Link
            to="/about"
            aria-label="All perspectives"
            className="press grid h-10 w-10 shrink-0 place-items-center rounded-full text-black/70 transition hover:bg-white/70"
          >
            <svg
              aria-hidden
              viewBox="0 0 24 24"
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.8}
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M14.5 6l-6 6 6 6" />
            </svg>
          </Link>
          <PerspectiveSwitch current={id} variant="bar" />
          <span aria-hidden className="w-10 shrink-0" />
        </div>
      </div>
      <section className="relative isolate flex min-h-[100svh] flex-col items-center justify-center overflow-hidden bg-[#fbfaf8] px-5 pb-[calc(var(--dock,0px)+5rem)] pt-24 text-center sm:pt-28">
        <div
          aria-hidden
          className="absolute inset-0 -z-10"
          style={{
            background: `radial-gradient(60% 80% at 50% 42%, #ffffff 0%, rgba(255,255,255,0) 72%), linear-gradient(90deg, ${left}, rgba(255,255,255,0) 40%, rgba(255,255,255,0) 60%, ${right})`,
          }}
        />
        <div
          aria-hidden
          className="absolute left-1/2 top-0 -z-10 h-full w-[24rem] max-w-[70vw] -translate-x-1/2 blur-3xl"
          style={{
            background: `linear-gradient(90deg, ${left}, #ffffff 38%, #ffffff 62%, ${right})`,
          }}
        />
        <div className="duration-1000 animate-in fade-in slide-in-from-bottom-4">
          <span className="mx-auto grid h-16 w-16 place-items-center rounded-full border border-white/80 bg-white/60 shadow-[0_14px_36px_-14px_rgba(40,30,90,0.35),inset_0_1px_0_rgba(255,255,255,0.9)] backdrop-blur-xl">
            <PerspectiveIcon id={p.id} className="h-7 w-7 text-black/80" />
          </span>
          <p className="tracked mt-6 text-[10px] text-black/50">Your world · {p.label}</p>
          <h1 className="mx-auto mt-4 max-w-3xl text-[34px] font-light leading-[1.1] tracking-tight sm:text-6xl">
            {p.title}
          </h1>
          <div className="prism-rule mx-auto mt-7 w-20" />
          <p className="mx-auto mt-7 max-w-xl text-[16px] leading-relaxed text-black/60 sm:text-lg">
            {p.text}
          </p>
        </div>
        <a
          href="#world"
          className="tracked absolute bottom-[calc(var(--dock,0px)+1.5rem)] left-1/2 flex -translate-x-1/2 flex-col items-center gap-2 text-[10px] text-black/45 transition hover:text-black/70"
        >
          What we make for you
          <svg
            aria-hidden
            viewBox="0 0 24 24"
            className="h-4 w-4 motion-safe:animate-bounce"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.6}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M6.5 9.5l5.5 5.5 5.5-5.5" />
          </svg>
        </a>
      </section>

      <section id="world" className="scroll-mt-24 px-4 pb-8 pt-16 sm:px-6 sm:pt-24">
        <div className="mx-auto max-w-6xl">
          <p className="tracked text-[10px] text-black/50">What we make for you</p>
          <div className="mt-5 grid gap-3 sm:grid-cols-3 sm:gap-4">
            {p.offers.map((o) => (
              <article
                key={o.title}
                className="rounded-2xl border border-black/[0.07] bg-white p-5 sm:p-6"
              >
                <h3 className="text-[16px] font-medium leading-snug">{o.title}</h3>
                <p className="mt-2 text-[14px] leading-relaxed text-black/60">{o.text}</p>
              </article>
            ))}
          </div>

          {clients.length > 0 && (
            <div className="mt-12 sm:mt-14">
              <p className="tracked text-[10px] text-black/50">Who we've made films with</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {clients.map((c) => (
                  <Link key={c.name} to="/projects" search={{ client: c.name }} className="press">
                    <ClientBadge client={c} />
                  </Link>
                ))}
              </div>
            </div>
          )}

          {films.length > 0 && (
            <div className="mt-12 sm:mt-14">
              <p className="tracked text-[10px] text-black/50">
                {clients.length ? "Their films" : "From our films"}
              </p>
              <div className="mt-5 grid gap-x-4 gap-y-8 sm:grid-cols-2 lg:grid-cols-3">
                {films.map((f) => (
                  <VideoCard key={f.slug} project={f} bleed />
                ))}
              </div>
            </div>
          )}

          <div className="mt-12 flex flex-wrap items-center gap-3 sm:mt-14">
            <a
              href={`mailto:${SITE.email}?subject=${encodeURIComponent(p.ask)}`}
              className="press rounded-full bg-black px-6 py-3 text-[14px] text-white transition hover:bg-black/85"
            >
              Start a conversation
            </a>
            <Link
              to="/about"
              className="press rounded-full border border-black/10 bg-white px-6 py-3 text-[14px] transition hover:bg-black/[0.03]"
            >
              Choose another perspective
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
