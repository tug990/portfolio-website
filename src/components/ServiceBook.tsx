import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import { Link } from "@tanstack/react-router";
import { SITE, type PerspectiveId } from "@/content/site";
import type { OutcomeIcon, Service, ServiceBook as Book } from "@/content/service-books";
import { cn } from "@/lib/utils";
import { FilmWords, Grain, ShapedLoop } from "@/components/StoryFilm";

/*
  A perspective's Service Book (content/service-books.ts), as its world on
  the About page shows it: the printed book's design (its layout) in the
  site's own type (Jost: light headings, medium titles) and colours (ink on near-white, soft
  grey panels, black for what's chosen, the prism's light along dark bands,
  the tricolour for every line), made to be used rather than read through.
  In order: why it matters and what the services do (`Intro`, with the
  book's contents to jump from), the research (`Research`), where to start
  (`Start`: the services at a glance, and "Not sure where to start?", a
  sentence to tap that opens its service), across their year (`Year`: a
  stage to tap, its films), the services one at a time (`Services`: chosen
  from a list; each as its page in the book, with "Is this right for you?"
  to tick, and a way to ask about it), the studio's work for them
  (`Portfolio`: a project to tap opens its kind of film), how we work
  together and the packages side by side (`Together`: a package to choose,
  its column marked in the table; on phones the table shows the chosen one;
  or how a department commissions us, and what it can expect), and let's
  talk (`Talk`). A part a book doesn't have is left out. `children` sits
  between the services and how we work together (the clients and their
  films); `about` (who we are: AboutSections.tsx `AboutUs`) between how we
  work together and let's talk. Its pieces (`Part`, `Kicker`, `Title`,
  `Rise`, `PrismEdge`, `Arrow`, `HEAD`) are shared with `about`, so it
  speaks the same way.
*/
/*
  Each perspective's look, told as a film: bright, in the colours of the flag for every one of
  them (`FLAG`: white paper, navy ink, saffron and India green, the tricolour for its lines), each
  told apart by its paintings and its marks rather than its colour. `paper` the page's ground and
  the wash over the film; `ink` the words and what's chosen (where black was); `accent` saffron,
  `accent2` green; `kicker` the small capitals; `cardHead` the outcome cards' titles; `line` and
  `bar` the lines across and the short upright one beside a lead; `film` the film's grade; `mark`
  how a title's last words are marked (`marker` a pen line under them, `split` the second half in
  saffron, `highlight` a highlighter, `corners` drawing-sheet corners on the film, `plus` a cross
  by the chapter, `tricolour` the tricolour under it and wider capitals); `card` the outcome cards.
*/
type Look = {
  paper: string;
  ink: string;
  accent: string;
  accent2: string;
  kicker: string;
  cardHead: string;
  line: string;
  bar: string;
  film: string;
  mark: "marker" | "split" | "tricolour" | "corners" | "highlight" | "plus";
  card: string;
};
/* the flag's colours, every perspective's */
const FLAG = {
  paper: "#fffdf8",
  ink: "#14213d",
  accent: "#ef8a1f",
  accent2: "#138808",
  kicker: "#138808",
  cardHead: "#14213d",
  line: "var(--tricolour)",
  bar: "var(--tricolour-v)",
  film: "contrast(1.04) saturate(1.02) brightness(1.03)",
};
const LOOKS: Record<PerspectiveId, Look> = {
  // a field notebook: a pen line under the title, notebook-slip cards
  ngo: {
    ...FLAG,
    mark: "marker",
    card: "rounded-md border-[1.5px] border-dashed border-(--accent)/45 bg-white/85",
  },
  // an annual report: the title's second half in saffron, cards with a top rule
  corporate: {
    ...FLAG,
    mark: "split",
    card: "rounded-sm border border-(--ink)/10 border-t-[3px] border-t-(--accent) bg-white",
  },
  // an official file: the tricolour under the title, wider capitals, cards edged in navy
  government: {
    ...FLAG,
    mark: "tricolour",
    card: "rounded-sm border-l-4 border-l-(--ink) bg-white shadow-[0_1px_0_rgba(0,0,0,0.06)]",
  },
  // a drawing sheet: corners round the film, hairline cards
  "real-estate": {
    ...FLAG,
    mark: "corners",
    card: "border-y border-t-(--accent) border-b-(--ink)/10 bg-white/85",
  },
  // a campus: a highlighter on the title, soft rounded cards
  education: {
    ...FLAG,
    mark: "highlight",
    card: "rounded-2xl bg-white shadow-[0_10px_24px_-16px_rgba(20,33,61,0.45)]",
  },
  // clean and calm: a green cross by each chapter, soft green cards
  healthcare: {
    ...FLAG,
    cardHead: "#138808",
    mark: "plus",
    card: "rounded-xl bg-(--accent2)/10",
  },
};
const LookContext = createContext<Look | null>(null);

/* a look's colours, set on the page for everything in it to use */
function lookVars(l: Look) {
  return {
    "--paper": l.paper,
    "--ink": l.ink,
    "--accent": l.accent,
    "--accent2": l.accent2,
    "--kicker": l.kicker,
    "--card-head": l.cardHead,
    "--line": l.line,
    "--bar": l.bar,
  } as CSSProperties;
}

export function ServiceBook({
  book,
  ask,
  world,
  children,
  about,
}: {
  book: Book;
  /* the email subject for this perspective (ABOUT_PERSPECTIVES `ask`) */
  ask: string;
  /* whose world it is, for its look (`LOOKS`), told as a film */
  world?: PerspectiveId;
  children?: ReactNode;
  /* who we are, before let's talk */
  about?: ReactNode;
}) {
  // the service open in the list below; chosen from anywhere on the page
  const [open, setOpen] = useState(book.services[0].id);
  const services = useRef<HTMLElement>(null);
  // told as a film, a service's details open in a sheet over the page, from anywhere on it
  const [sheet, setSheet] = useState<string | null>(null);
  const show = (id: string) => {
    if (book.reel) return setSheet(id);
    setOpen(id);
    services.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };
  if (book.reel) {
    const n = book.services.findIndex((x) => x.id === sheet);
    const look = LOOKS[world ?? "ngo"];
    return (
      <LookContext.Provider value={look}>
        <div className="bg-(--paper) text-(--ink)" style={lookVars(look)}>
          <FilmStory book={book} show={show} />
          {book.year && <Year book={book} show={show} />}
          {/* (no portfolio: the clients' films below show the same work) */}
          {/* a few words cut out of the page, a film inside them, before the films themselves */}
          <div className="px-4 pt-16 sm:px-6 sm:pt-24">
            <Rise className="mx-auto max-w-6xl">
              <FilmWords lines={book.reel.cut.lines} name={book.reel.cut.loop} />
            </Rise>
          </div>
          {children}
          <Together book={book} />
          {about}
          <Talk book={book} ask={ask} />
          {n >= 0 && <FilmSheet book={book} n={n} ask={ask} onClose={() => setSheet(null)} />}
        </div>
      </LookContext.Provider>
    );
  }
  return (
    <div className="text-foreground">
      <Intro book={book} about={!!about} />
      <Research book={book} />
      <Start book={book} show={show} />
      {book.year && <Year book={book} show={show} />}
      <section ref={services} id="services" className="scroll-mt-20 sm:scroll-mt-24">
        <Services book={book} open={open} setOpen={setOpen} ask={ask} />
      </section>
      {book.portfolio && <Portfolio book={book} show={show} />}
      {children}
      <Together book={book} />
      {about}
      <Talk book={book} ask={ask} />
    </div>
  );
}

/* ---------- the pieces the book is made of ---------- */

/* headings and big numbers, as the site sets them: Jost, light, close */
export const HEAD = "font-light tracking-tight";

/*
  Told as a film (`book.reel`): the chapters, in order (their anchors), so a part's small capitals
  can say which it is ("Chapter 02 · What the research shows"); a book that isn't keeps its own.
*/
function chaptersOf(book: Book) {
  return ["#world", "#services", "#research", book.year && "#year", "#together"].filter(
    (x): x is string => !!x,
  );
}

/* a chapter's heading as the film sets it: its small capitals, its title, a rule under it */
function ChapterHead({
  book,
  id,
  label,
  title,
  dark,
  className,
}: {
  book: Book;
  id: string;
  label: string;
  title: string;
  dark?: boolean;
  className?: string;
}) {
  const look = useContext(LookContext);
  return (
    <div className={className}>
      <Kicker className={dark ? "text-white/80" : undefined}>
        {look?.mark === "plus" && <Cross />}
        {chapter(book, id, label)}
      </Kicker>
      <Title className="mt-4">{title}</Title>
      {book.reel &&
        (look ? (
          // the look's own line under it: the tricolour's place
          <span
            aria-hidden
            className={cn(
              "mt-5 block w-full",
              look.mark === "tricolour" ? "h-[3px] max-w-40 rounded-full" : "h-px opacity-50",
            )}
            style={{ background: "var(--line)" }}
          />
        ) : (
          <span
            aria-hidden
            className={cn("mt-5 block h-px w-full", dark ? "bg-white/20" : "bg-black/15")}
          />
        ))}
    </div>
  );
}

/* a small red cross, before a chapter's name (healthcare's look) */
function Cross() {
  return (
    <span
      aria-hidden
      className="mr-2 inline-grid h-4 w-4 place-items-center rounded-[4px] bg-(--accent2) align-[-3px] text-[13px] font-black leading-none tracking-normal text-white"
    >
      +
    </span>
  );
}
function chapter(book: Book, id: string, label: string) {
  if (!book.reel) return label;
  const n = chaptersOf(book).indexOf(id) + 1;
  return `Chapter ${String(n).padStart(2, "0")} · ${label}`;
}

/* the small spaced capitals over each part, as the site's */
export function Kicker({ children, className }: { children: ReactNode; className?: string }) {
  const look = useContext(LookContext);
  return (
    <p
      className={cn(
        "tracked font-sans text-[10px]",
        look ? "font-medium text-(--kicker)" : "text-black/50",
        className,
      )}
    >
      {children}
    </p>
  );
}

/* the opening's title in a bold condensed display face (Bebas Neue, loaded in
   routes/__root.tsx), in capitals: kept for each world's header */
export const LOUD =
  "[font-family:'Bebas_Neue',Impact,sans-serif] font-normal uppercase tracking-[0.01em]";
/* headings inside the page in heavy capitals (Montserrat ExtraBold, as the share card's) */
export const BOLD =
  "[font-family:'Montserrat',Arial,sans-serif] font-extrabold uppercase tracking-[-0.005em]";
export function Title({ children, className }: { children: ReactNode; className?: string }) {
  const look = useContext(LookContext);
  return (
    <h2
      className={cn(
        BOLD,
        "text-[30px] leading-[1.04] sm:text-[46px]",
        look?.mark === "tricolour" && "tracking-[0.02em]",
        look?.mark === "corners" && "tracking-[0.015em]",
        className,
      )}
    >
      {marked(children, look)}
    </h2>
  );
}

/* a title's last words marked in the look's way (a pen line, a highlighter, the accent) */
function marked(children: ReactNode, look: Look | null) {
  if (!look || typeof children !== "string") return children;
  const words = children.split(" ");
  if (words.length < 3) return children;
  if (look.mark === "split") {
    const h = Math.ceil(words.length / 2);
    return (
      <>
        {words.slice(0, h).join(" ")}{" "}
        <span className="text-(--accent)">{words.slice(h).join(" ")}</span>
      </>
    );
  }
  if (look.mark !== "marker" && look.mark !== "highlight") return children;
  const pen =
    look.mark === "marker"
      ? {
          backgroundImage:
            "linear-gradient(transparent 76%, color-mix(in srgb, var(--accent) 50%, transparent) 76%, color-mix(in srgb, var(--accent) 50%, transparent) 93%, transparent 93%)",
        }
      : { background: "var(--accent)", padding: "0 0.1em" };
  return (
    <>
      {words.slice(0, -2).join(" ")}{" "}
      <span
        className="[-webkit-box-decoration-break:clone] [box-decoration-break:clone]"
        style={pen}
      >
        {words.slice(-2).join(" ")}
      </span>
    </>
  );
}

/* a part of the page, the book's width */
export function Part({
  id,
  className,
  dark,
  children,
}: {
  id?: string;
  className?: string;
  /* a dark band: the prism's light along its top, and the header turns dark over it */
  dark?: boolean;
  children: ReactNode;
}) {
  return (
    <section
      id={id}
      data-tone={dark ? "dark" : undefined}
      className={cn("scroll-mt-20 px-4 py-14 sm:scroll-mt-24 sm:px-6 sm:py-20", className)}
    >
      {dark && <PrismEdge />}
      <div className="mx-auto max-w-6xl">{children}</div>
    </section>
  );
}

/* rises into place the first time it's seen */
export function Rise({
  children,
  className,
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [seen, setSeen] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setSeen(true);
          io.disconnect();
        }
      },
      { rootMargin: "0px 0px -8% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <div
      ref={ref}
      className={cn(
        "transition duration-700 ease-out motion-reduce:transition-none",
        seen
          ? "translate-y-0 opacity-100"
          : "translate-y-4 opacity-0 motion-reduce:translate-y-0 motion-reduce:opacity-100",
        className,
      )}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}

/* the prism's light, as a line along the top of something dark */
export function PrismEdge() {
  return (
    <span
      aria-hidden
      className="pointer-events-none absolute inset-x-0 top-0 h-px opacity-90"
      style={{ background: "var(--line, var(--prism))" }}
    />
  );
}

/* the tricolour, as a short upright line beside a line of words */
function Bar() {
  return (
    <span
      aria-hidden
      className="absolute bottom-1 left-0 top-1 w-[3px] rounded-full"
      style={{ background: "var(--bar, var(--tricolour-v))" }}
    />
  );
}

/* the tricolour, as a line along the top of something */
function TopLine() {
  return (
    <span
      aria-hidden
      className="absolute inset-x-0 top-0 h-[2px] rounded-full"
      style={{ background: "var(--line, var(--tricolour))" }}
    />
  );
}

function Tick({ className, check = "white" }: { className?: string; check?: string }) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 20 20"
      className={cn("h-[18px] w-[18px] shrink-0", className)}
      fill="none"
    >
      <circle cx="10" cy="10" r="10" fill="currentColor" />
      <path
        d="M6 10.3l2.6 2.6L14.2 7.5"
        stroke={check}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function Arrow({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 24 24"
      className={cn("h-4 w-4 shrink-0", className)}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  );
}

/* a list, each line ticked */
function Ticks({ items, light }: { items: string[]; light?: boolean }) {
  return (
    <ul className="mt-4 space-y-3">
      {items.map((x) => (
        <li key={x} className={cn("flex gap-3 text-[15px] leading-snug", light && "text-white/90")}>
          {light ? (
            <Tick className="mt-px text-white" check="#0a0a0a" />
          ) : (
            <Tick className="mt-px text-foreground" />
          )}
          {x}
        </li>
      ))}
    </ul>
  );
}

const OUTCOME_ICONS: Record<OutcomeIcon, ReactNode> = {
  people: (
    <>
      <circle cx="9" cy="8" r="3" />
      <path d="M3.5 19c.6-3 2.8-5 5.5-5s4.9 2 5.5 5" />
      <circle cx="17" cy="9" r="2.4" />
      <path d="M15.5 14.3c2.3-.2 4.3 1.4 5 4.2" />
    </>
  ),
  person: (
    <>
      <circle cx="12" cy="8" r="3.5" />
      <path d="M5 20c.8-3.8 3.6-6 7-6s6.2 2.2 7 6" />
    </>
  ),
  book: (
    <>
      <path d="M4 5.5C6.5 4.5 9.5 4.6 12 6.4c2.5-1.8 5.5-1.9 8-.9v13c-2.5-1-5.5-.9-8 .9-2.5-1.8-5.5-1.9-8-.9z" />
      <path d="M12 6.4v13" />
    </>
  ),
  building: (
    <>
      <path d="M3 20.5h18M5 20.5V10M9.7 20.5V10M14.3 20.5V10M19 20.5V10" />
      <path d="M2.8 9.5L12 4l9.2 5.5z" />
    </>
  ),
  globe: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M3.5 12h17M12 3.5c2.4 2.4 3.6 5.2 3.6 8.5s-1.2 6.1-3.6 8.5c-2.4-2.4-3.6-5.2-3.6-8.5s1.2-6.1 3.6-8.5z" />
    </>
  ),
  film: (
    <>
      <rect x="3.5" y="5" width="17" height="14" rx="2" />
      <path d="M10 9.5v5l4.5-2.5z" />
    </>
  ),
  chart: <path d="M4 19.5h16M7 16v-4M11.5 16V8M16 16v-6.5" />,
  heart: (
    <path d="M12 19.5s-7.5-4.3-7.5-9.6A4.1 4.1 0 0112 7.6a4.1 4.1 0 017.5 2.3c0 5.3-7.5 9.6-7.5 9.6z" />
  ),
  eye: (
    <>
      <path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z" />
      <circle cx="12" cy="12" r="3" />
    </>
  ),
  megaphone: (
    <>
      <path d="M4 10v4h3l7 4V6L7 10z" />
      <path d="M17.5 9.5a3.5 3.5 0 010 5" />
    </>
  ),
  pin: (
    <>
      <path d="M12 21s-6.5-6.2-6.5-11a6.5 6.5 0 0113 0c0 4.8-6.5 11-6.5 11z" />
      <circle cx="12" cy="10" r="2.4" />
    </>
  ),
  archive: (
    <>
      <rect x="3.5" y="4.5" width="17" height="4.5" rx="1" />
      <path d="M5 9v10.5h14V9M10 13h4" />
    </>
  ),
  star: <path d="M12 4l2.4 5 5.4.6-4 3.7 1.1 5.3L12 16l-4.9 2.6 1.1-5.3-4-3.7 5.4-.6z" />,
  check: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M8 12.3l2.7 2.7L16 9.6" />
    </>
  ),
  key: (
    <>
      <circle cx="8" cy="12" r="3.5" />
      <path d="M11.5 12H20M17 12v3M20 12v2" />
    </>
  ),
  flag: <path d="M5.5 20.5V4M5.5 4.5h11l-2.5 4 2.5 4h-11" />,
};

/* the contents of a book, as on its second page */
function contentsOf(book: Book, about: boolean): [string, string][] {
  const parts: ([string, string] | false | undefined)[] = [
    ["#research", "What the research shows"],
    ["#start", "Where to start"],
    book.year && ["#year", book.year.title],
    ["#services", book.servicesTitle],
    book.portfolio && ["#portfolio", book.portfolio.title],
    ["#together", book.together.title],
    book.compare && ["#compare", book.compare.title],
    about && ["#about", "Who we are"],
    ["#talk", book.talk.kicker],
  ];
  return parts.filter((x): x is [string, string] => !!x);
}

/* ---------- why it matters ---------- */

function Intro({ book, about }: { book: Book; about: boolean }) {
  const { intro } = book;
  return (
    <Part id="world">
      {/* the book's contents, to jump from */}
      <nav aria-label="On this page" className="-mx-4 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0">
        <ul className="flex w-max gap-2 sm:w-auto sm:flex-wrap">
          {contentsOf(book, about).map(([href, label]) => (
            <li key={href}>
              <a
                href={href}
                className="press flex items-center gap-1.5 rounded-full bg-foreground/[0.06] px-3.5 py-2 text-[13px] font-medium text-foreground/80 transition hover:bg-foreground hover:text-background"
              >
                {label}
              </a>
            </li>
          ))}
        </ul>
      </nav>

      <div className="mt-12 grid gap-10 sm:mt-16 lg:grid-cols-[1.15fr_1fr] lg:gap-x-16">
        <Rise>
          <ChapterHead book={book} id="#world" label="Introduction" title={intro.title} />
          <p className="relative mt-6 pl-5 text-[19px] font-light leading-snug sm:text-[23px]">
            <Bar />
            {intro.lead}
          </p>
        </Rise>
        <Rise delay={120} className="space-y-4 text-[16px] leading-relaxed text-black/70 lg:pt-10">
          {intro.text.map((x) => (
            <p key={x}>{x}</p>
          ))}
        </Rise>
      </div>

      <Kicker className="mt-14 sm:mt-20">{intro.outcomesTitle}</Kicker>
      <div
        className={cn(
          "mt-5",
          "grid grid-cols-2 gap-2.5 sm:gap-3",
          intro.outcomes.length % 3 === 0 ? "lg:grid-cols-3" : "lg:grid-cols-4",
        )}
      >
        {intro.outcomes.map((o, i) => (
          <Rise key={o.title} delay={i * 80}>
            <div className="h-full rounded-xl border border-black/[0.07] bg-[var(--card)] p-4 sm:p-5">
              <svg
                aria-hidden
                viewBox="0 0 24 24"
                className="h-6 w-6 text-black/75"
                fill="none"
                stroke="currentColor"
                strokeWidth={1.6}
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                {OUTCOME_ICONS[o.icon]}
              </svg>
              <h3 className="mt-4 text-[16px] font-medium leading-snug">{o.title}</h3>
              <p className="mt-1 text-[14px] leading-relaxed text-black/55">{o.text}</p>
            </div>
          </Rise>
        ))}
      </div>
    </Part>
  );
}

/* ---------- the research ---------- */

function Research({ book }: { book: Book }) {
  const { research } = book;
  return (
    <Part id="research" className="bg-muted/60">
      <Rise className="max-w-3xl">
        <Kicker>What the research shows</Kicker>
        <Title className="mt-4">{research.title}</Title>
        <p className="mt-4 text-[16px] leading-relaxed text-black/60">{research.text}</p>
      </Rise>
      <div className="mt-10 grid gap-3 sm:grid-cols-2 sm:gap-4">
        {research.stats.map((s, i) => (
          <Rise key={s.figure} delay={i * 90}>
            <div className="flex h-full flex-col rounded-xl border border-black/[0.07] bg-[var(--card)] p-6 sm:p-7">
              <p className={cn(HEAD, "text-[30px] leading-none sm:text-[36px]")}>
                <Count value={s.figure} />
              </p>
              <p className="mt-4 text-[15px] leading-relaxed text-black/65">{s.text}</p>
              {s.sources && (
                <p className="mt-auto flex flex-wrap gap-x-4 gap-y-1 pt-4 text-[12px] text-black/45">
                  {s.sources.map((x) => (
                    <a
                      key={x.label}
                      href={x.href}
                      target="_blank"
                      rel="noreferrer"
                      className="underline-offset-4 transition hover:text-foreground hover:underline"
                    >
                      {x.label} ↗
                    </a>
                  ))}
                </p>
              )}
            </div>
          </Rise>
        ))}
      </div>
      {research.note && (
        <p className="relative mt-8 max-w-4xl pl-5 text-[15px] font-medium leading-relaxed">
          <Bar />
          {research.note}
        </p>
      )}
      {research.sources && (
        <p className="mt-6 flex flex-wrap gap-x-5 gap-y-2 text-[13px] text-black/50">
          <span>Sources:</span>
          {research.sources.map((s) => (
            <a
              key={s.label}
              href={s.href}
              target="_blank"
              rel="noreferrer"
              className="font-medium text-foreground underline-offset-4 hover:underline"
            >
              {s.label} ↗
            </a>
          ))}
        </p>
      )}
    </Part>
  );
}

/*
  a figure like "62%" or "958 million" counting up as it's first seen; words,
  dates and figures with commas stay as they are
*/
function Count({ value }: { value: string }) {
  const m = /,|\d{4}/.test(value) ? null : /^(\D*)(\d+(?:\.\d+)?)(.*)$/.exec(value);
  const ref = useRef<HTMLSpanElement>(null);
  const [shown, setShown] = useState(m ? `${m[1]}0${m[3]}` : value);
  useEffect(() => {
    const el = ref.current;
    if (!m || !el) return;
    const to = parseFloat(m[2]);
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setShown(value);
      return;
    }
    let raf = 0;
    const io = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return;
      io.disconnect();
      const t0 = performance.now();
      const step = (t: number) => {
        const k = Math.min(1, (t - t0) / 1100);
        const eased = 1 - Math.pow(1 - k, 3);
        setShown(`${m[1]}${Math.round(to * eased)}${m[3]}`);
        if (k < 1) raf = requestAnimationFrame(step);
      };
      raf = requestAnimationFrame(step);
    });
    io.observe(el);
    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
    };
    // (once, for its value)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);
  return (
    <span ref={ref} aria-label={value}>
      {shown}
    </span>
  );
}

/* ---------- where to start ---------- */

function Start({ book, show }: { book: Book; show: (id: string) => void }) {
  const { start, services, glance } = book;
  const name = (id: string) => services.find((s) => s.id === id)?.name ?? id;
  const two = glance.columns.length > 1;
  // the table's columns: the number, the name, then the book's own
  const grid = two
    ? "sm:grid-cols-[2.2rem_0.9fr_0.8fr_1fr_auto]"
    : "sm:grid-cols-[2.2rem_0.9fr_1.1fr_auto]";
  return (
    <Part id="start">
      <div className="grid gap-12 lg:grid-cols-2 lg:gap-16">
        <div>
          <Kicker>{chapter(book, "#start", "At a glance")}</Kicker>
          <Title className="mt-4">{glance.title}</Title>
          <ul className="mt-8 overflow-hidden rounded-xl border border-black/[0.07] bg-[var(--card)]">
            <li
              className={cn(
                "relative grid grid-cols-[2.2rem_1fr] bg-foreground px-4 py-2.5 text-[11px] font-medium uppercase tracking-[0.2em] text-background",
                grid,
              )}
            >
              <PrismEdge />
              <span />
              <span>{book.itemWord}</span>
              {glance.columns.map((c) => (
                <span key={c.label} className="hidden sm:block">
                  {c.label}
                </span>
              ))}
            </li>
            {services.map((s, i) => (
              <li key={s.id} className={i % 2 ? "bg-muted/50" : ""}>
                <button
                  type="button"
                  onClick={() => show(s.id)}
                  className={cn(
                    "group grid w-full grid-cols-[2.2rem_1fr_auto] items-start gap-x-2 gap-y-0.5 px-4 py-3 text-left transition hover:bg-muted sm:items-center",
                    grid,
                  )}
                >
                  <span className={cn(HEAD, "text-[15px] text-black/35")}>
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="text-[15px] font-medium">{s.name}</span>
                  {glance.columns.map((c, k) => (
                    <span
                      key={c.label}
                      className={cn(
                        "col-start-2 text-[14px] text-black/55",
                        k === 0 ? "sm:col-start-3" : "sm:col-start-4",
                        // phones: the second column a little quieter, under the first
                        k > 0 && "text-[13px] text-black/45 sm:text-[14px] sm:text-black/55",
                      )}
                    >
                      {s[c.key]}
                    </span>
                  ))}
                  <Arrow
                    className={cn(
                      "col-start-3 row-start-1 mt-1 opacity-30 transition group-hover:translate-x-0.5 group-hover:opacity-100 sm:mt-0",
                      two ? "sm:col-start-5" : "sm:col-start-4",
                    )}
                  />
                </button>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <Kicker>Find yours</Kicker>
          <Title className="mt-4">{start.title}</Title>
          <p className="mt-3 text-[16px] text-black/60">{start.text}</p>
          <div className="mt-8 grid gap-3 sm:grid-cols-2">
            {start.picks.map((p, i) => (
              <Rise key={p.line} delay={(i % 4) * 60}>
                <button
                  type="button"
                  onClick={() => show(p.service)}
                  className="press group flex h-full w-full flex-col justify-between gap-3 rounded-xl border border-black/[0.07] bg-[var(--card)] p-4 text-left transition hover:border-black/20 hover:shadow-[0_12px_30px_-18px_rgba(0,0,0,0.35)]"
                >
                  <span className="text-[15px] leading-snug">{p.line}</span>
                  <span className="flex items-center gap-1.5 text-[13px] font-medium">
                    {name(p.service)}
                    <Arrow className="transition group-hover:translate-x-0.5" />
                  </span>
                </button>
              </Rise>
            ))}
          </div>
        </div>
      </div>
    </Part>
  );
}

/* ---------- across their year ---------- */

function Year({ book, show }: { book: Book; show: (id: string) => void }) {
  const year = book.year!;
  const [at, setAt] = useState(0);
  const stage = year.stages[at];
  const name = (id: string) => book.services.find((s) => s.id === id)?.name ?? id;
  return (
    <Part
      id="year"
      className="relative bg-[color-mix(in_srgb,var(--accent)_7%,var(--paper))] text-(--ink)"
    >
      <div className="max-w-3xl">
        <Kicker>{year.kicker}</Kicker>
        <Title className="mt-4">{year.title}</Title>
        <p className="mt-4 text-[16px] leading-relaxed text-(--ink)/70">{year.text}</p>
      </div>

      {/* the stages, the look's line running through them; tap one */}
      <div role="tablist" aria-label={year.title} className="relative mt-10">
        <span
          aria-hidden
          className="absolute left-0 right-0 top-[21px] hidden h-[2px] rounded-full opacity-80 sm:block"
          style={{ background: "var(--line, var(--tricolour))" }}
        />
        <div
          className="grid gap-2 sm:grid-cols-[repeat(var(--n),minmax(0,1fr))] sm:gap-0"
          style={{ "--n": year.stages.length } as CSSProperties}
        >
          {year.stages.map((s, i) => {
            const on = i === at;
            return (
              <button
                key={s.name}
                type="button"
                role="tab"
                aria-selected={on}
                onClick={() => setAt(i)}
                className={cn(
                  "relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-left transition sm:flex-col sm:items-start sm:gap-4 sm:rounded-none sm:px-0 sm:pr-4 sm:pt-0",
                  on ? "bg-white sm:bg-transparent" : "hover:bg-white/60 sm:hover:bg-transparent",
                )}
              >
                <span
                  className={cn(
                    HEAD,
                    "relative grid h-11 w-11 shrink-0 place-items-center rounded-full text-[15px] transition",
                    on
                      ? "bg-(--ink) text-white shadow-[0_0_0_6px_color-mix(in_srgb,var(--ink)_12%,transparent)]"
                      : "bg-white text-(--ink)/70 ring-1 ring-(--ink)/20",
                  )}
                >
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span
                  className={cn(
                    "text-[15px] font-medium leading-snug",
                    on ? "text-(--ink)" : "text-(--ink)/65",
                  )}
                >
                  {s.name}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div
        key={at}
        role="tabpanel"
        className="mt-6 rounded-2xl bg-white p-6 text-foreground duration-500 animate-in fade-in slide-in-from-bottom-2 sm:mt-8 sm:p-8"
      >
        <Kicker>
          {String(at + 1).padStart(2, "0")} · {stage.name}
        </Kicker>
        <p className={cn(HEAD, "mt-3 text-[22px] leading-snug sm:text-[26px]")}>{stage.text}</p>
        <div className="mt-5 flex flex-wrap gap-2">
          {stage.services.map((id) => (
            <button
              key={id}
              type="button"
              onClick={() => show(id)}
              className="press group flex items-center gap-1.5 rounded-full bg-foreground/[0.06] px-4 py-2 text-[14px] font-medium transition hover:bg-foreground hover:text-background"
            >
              {name(id)}
              <Arrow className="transition group-hover:translate-x-0.5" />
            </button>
          ))}
        </div>
      </div>
    </Part>
  );
}

/* ---------- the services, one at a time ---------- */

function Services({
  book,
  open,
  setOpen,
  ask,
}: {
  book: Book;
  open: string;
  setOpen: (id: string) => void;
  ask: string;
}) {
  const list = book.services;
  const i = Math.max(
    0,
    list.findIndex((s) => s.id === open),
  );
  const s = list[i];
  const rail = useRef<HTMLDivElement>(null);
  // phones: keep the chosen one in view in the row of numbers (the row alone scrolls, not the
  // page, which may be on its way here)
  useEffect(() => {
    const row = rail.current;
    const el = row?.querySelector<HTMLElement>(`[data-id="${s.id}"]`);
    if (!row || !el || row.scrollWidth <= row.clientWidth) return;
    row.scrollTo({
      left: el.offsetLeft - (row.clientWidth - el.offsetWidth) / 2,
      behavior: "smooth",
    });
  }, [s.id]);
  const fits = list.some((x) => x.fits?.length);
  return (
    <Part className="pb-10 sm:pb-14">
      {book.reel ? (
        <ChapterHead
          book={book}
          id="#services"
          label={`The ${book.itemWord.toLowerCase()}s`}
          title={book.servicesTitle}
        />
      ) : (
        <>
          <Kicker>{chapter(book, "#services", `The ${book.itemWord.toLowerCase()}s`)}</Kicker>
          <Title className="mt-4">{book.servicesTitle}</Title>
        </>
      )}
      <p className="mt-3 text-[16px] text-black/60">
        {fits
          ? "Choose one to see what it is, what you receive, and whether it’s right for you."
          : "Choose one to see what it is, where it’s used, what we deliver, and our work."}
      </p>

      <div
        className={cn("mt-8", book.reel ? "sm:mt-10" : "lg:grid lg:grid-cols-[17rem_1fr] lg:gap-8")}
      >
        {/* the list: a column beside it on a computer, a row of numbers on a phone (told as a
            film, the reels above are the list) */}
        <div
          ref={rail}
          hidden={!!book.reel}
          role="tablist"
          aria-label={book.servicesTitle}
          className="relative -mx-4 flex gap-2 overflow-x-auto px-4 pb-2 lg:sticky lg:top-28 lg:mx-0 lg:flex-col lg:self-start lg:overflow-visible lg:px-0"
        >
          {list.map((x, n) => {
            const on = x.id === s.id;
            return (
              <button
                key={x.id}
                data-id={x.id}
                type="button"
                role="tab"
                aria-selected={on}
                onClick={() => setOpen(x.id)}
                className={cn(
                  "press flex shrink-0 items-center gap-3 rounded-xl px-3.5 py-2.5 text-left transition lg:py-3",
                  on
                    ? "bg-foreground text-background shadow-[0_14px_30px_-18px_rgba(0,0,0,0.6)]"
                    : "bg-foreground/[0.05] hover:bg-foreground/[0.09]",
                )}
              >
                <span className={cn(HEAD, "text-[15px]", on ? "text-white" : "opacity-45")}>
                  {String(n + 1).padStart(2, "0")}
                </span>
                <span className="whitespace-nowrap text-[14px] font-medium lg:whitespace-normal">
                  {x.name}
                </span>
              </button>
            );
          })}
        </div>

        <ServicePage
          key={s.id}
          s={s}
          n={i}
          total={list.length}
          word={book.itemWord}
          ask={ask}
          prev={i > 0 ? list[i - 1] : undefined}
          next={i < list.length - 1 ? list[i + 1] : undefined}
          go={setOpen}
        />
      </div>
    </Part>
  );
}

/* one service, as its page in the book */
function ServicePage({
  s,
  n,
  total,
  word,
  ask,
  prev,
  next,
  go,
}: {
  s: Service;
  n: number;
  total: number;
  /* "Service", "Film type", "Film" */
  word: string;
  ask: string;
  prev?: Service;
  next?: Service;
  go: (id: string) => void;
}) {
  const fits = s.fits ?? [];
  // "Is this right for you?": the lines ticked
  const [ticked, setTicked] = useState<boolean[]>(() => fits.map(() => false));
  const count = ticked.filter(Boolean).length;
  const mail = `mailto:${SITE.email}?subject=${encodeURIComponent(`${ask}: ${s.name}`)}`;

  // its parts, two to a row on wider screens; one left alone in its row runs the full width
  const half: { key: string; node: ReactNode }[] = [];
  if (s.familiar?.length)
    half.push({
      key: "familiar",
      node: (
        <div className="h-full rounded-xl bg-muted p-5 sm:p-6">
          <h4 className="text-[16px] font-medium">Does this sound familiar?</h4>
          <Paras items={s.familiar} />
        </div>
      ),
    });
  half.push({
    key: "does",
    node: (
      <div
        className={cn(
          "h-full",
          s.familiar?.length ? "p-1 sm:p-2" : "rounded-xl bg-muted p-5 sm:p-6",
        )}
      >
        <h4 className="text-[16px] font-medium">{s.doesTitle ?? "What this film does"}</h4>
        <Paras items={s.does} />
      </div>
    ),
  });
  if (s.uses?.length)
    half.push({
      key: "uses",
      node: (
        <div className="h-full p-1 sm:p-2">
          <h4 className="text-[16px] font-medium">{s.usesTitle ?? "Where it is used"}</h4>
          <ul className="mt-3 space-y-2.5">
            {s.uses.map((x) => (
              <li key={x} className="relative pl-4 text-[15px] leading-snug text-black/70">
                <span
                  aria-hidden
                  className="absolute left-0 top-[0.55em] h-1.5 w-1.5 rounded-full bg-black/35"
                />
                {x}
              </li>
            ))}
          </ul>
          {s.areas && (
            <div className="mt-5 flex flex-wrap gap-1.5">
              {s.areas.map((a) => (
                <span
                  key={a}
                  className="rounded-full bg-foreground/[0.06] px-3 py-1 text-[12px] font-medium"
                >
                  {a}
                </span>
              ))}
            </div>
          )}
        </div>
      ),
    });
  half.push({
    key: "receive",
    node: (
      <div className="h-full rounded-xl border border-black/[0.07] p-5 sm:p-6">
        <h4 className="text-[16px] font-medium">{s.receiveTitle ?? "What you receive"}</h4>
        <Ticks items={s.receive} />
      </div>
    ),
  });
  if (s.gain?.length)
    half.push({
      key: "gain",
      node: (
        <div className="h-full rounded-xl border border-black/[0.07] p-5 sm:p-6">
          <h4 className="text-[16px] font-medium">What you gain</h4>
          <Ticks items={s.gain} />
        </div>
      ),
    });
  if (s.example?.length)
    half.push({
      key: "example",
      node: (
        <Dark title="A real example">
          <Paras items={s.example} light />
        </Dark>
      ),
    });
  if (s.work?.length)
    half.push({
      key: "work",
      node: (
        <Dark title="Our work">
          <ul className="mt-3 space-y-4">
            {s.work.map((w) => (
              <li key={w.title} className="relative pl-4">
                <span
                  aria-hidden
                  className="absolute bottom-0.5 left-0 top-0.5 w-[2px] rounded-full"
                  style={{ background: "var(--tricolour-v)" }}
                />
                <p className="text-[15px] font-medium leading-snug">{w.title}</p>
                <p className="mt-1 text-[14px] leading-relaxed text-white/70">{w.text}</p>
              </li>
            ))}
          </ul>
        </Dark>
      ),
    });

  return (
    <article
      role="tabpanel"
      aria-label={s.name}
      className="mt-4 overflow-hidden rounded-2xl border border-black/[0.07] bg-[var(--card)] duration-500 animate-in fade-in slide-in-from-bottom-2 lg:mt-0"
    >
      {/* its band, as in the book */}
      <header className="relative bg-[var(--ink,#0a0a0a)] px-5 pb-7 pt-6 text-white sm:px-8 sm:pb-9 sm:pt-8">
        <PrismEdge />
        <Kicker className="text-white/55">
          {word} {n + 1} of {total}
        </Kicker>
        <h3 className={cn(HEAD, "mt-3 max-w-[80%] text-[28px] leading-[1.08] sm:text-[38px]")}>
          {s.name}
        </h3>
        <p className={cn("mt-3 max-w-xl text-[16px] leading-relaxed text-white/80")}>{s.line}</p>
        {s.tags.length > 0 && (
          <div className="mt-5 flex flex-wrap gap-2">
            {s.tags.map((t) => (
              <span
                key={t}
                className="rounded-full border border-white/25 bg-white/[0.06] px-3 py-1 text-[12px] font-medium text-white/85"
              >
                {t}
              </span>
            ))}
          </div>
        )}
        <span
          aria-hidden
          className={cn(
            HEAD,
            "absolute right-5 top-5 text-[44px] leading-none text-white sm:right-8 sm:top-7 sm:text-[64px]",
          )}
        >
          {String(n + 1).padStart(2, "0")}
        </span>
      </header>

      <div className="grid gap-4 p-4 sm:gap-5 sm:p-7 md:grid-cols-2">
        {half.map((h, k) => (
          // the last one, left alone in its row, runs the full width
          <div
            key={h.key}
            className={cn(k === half.length - 1 && half.length % 2 === 1 && "md:col-span-2")}
          >
            {h.node}
          </div>
        ))}

        {s.panels?.map((p) => (
          <div key={p.title} className="md:col-span-2">
            <h4 className="text-[16px] font-medium">{p.title}</h4>
            <div
              className={cn(
                "mt-3 grid gap-3",
                p.items.length > 3
                  ? "grid-cols-2 lg:grid-cols-4"
                  : p.items.length === 2
                    ? "sm:grid-cols-2"
                    : "sm:grid-cols-3",
              )}
            >
              {p.items.map((m) => (
                <div key={m.name} className="rounded-xl border border-black/[0.07] p-4">
                  <p className="text-[14px] font-medium">{m.name}</p>
                  <p className="mt-1 text-[13px] leading-relaxed text-black/55">{m.text}</p>
                </div>
              ))}
            </div>
          </div>
        ))}

        {/* is it for you: tick what's true */}
        {fits.length > 0 && (
          <div className="rounded-xl border border-black/[0.07] p-5 sm:p-6 md:col-span-2">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h4 className="text-[16px] font-medium">Is this right for you?</h4>
              <p className="text-[13px] text-black/45">Tick what’s true for you</p>
            </div>
            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              {fits.map((x, k) => (
                <label
                  key={x}
                  className={cn(
                    "flex cursor-pointer items-start gap-3 rounded-lg px-3 py-2.5 text-[15px] leading-snug transition",
                    ticked[k] ? "bg-muted" : "hover:bg-muted/60",
                  )}
                >
                  <input
                    type="checkbox"
                    checked={ticked[k]}
                    onChange={() => setTicked((t) => t.map((v, j) => (j === k ? !v : v)))}
                    className="peer sr-only"
                  />
                  <span
                    aria-hidden
                    className={cn(
                      "mt-px grid h-[18px] w-[18px] shrink-0 place-items-center rounded-full border-[1.5px] transition peer-focus-visible:ring-2 peer-focus-visible:ring-black/30",
                      ticked[k] ? "border-foreground bg-foreground" : "border-black/30",
                    )}
                  >
                    {ticked[k] && (
                      <svg viewBox="0 0 20 20" className="h-3 w-3" fill="none">
                        <path
                          d="M5 10.5l3.2 3.2L15 7"
                          stroke="white"
                          strokeWidth="2.4"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    )}
                  </span>
                  {x}
                </label>
              ))}
            </div>
            <div
              aria-live="polite"
              className={cn(
                "flex flex-wrap items-center justify-between gap-3 overflow-hidden transition-all duration-500",
                count ? "mt-4 max-h-40 opacity-100" : "mt-0 max-h-0 opacity-0",
              )}
            >
              <p className="text-[15px] font-medium">
                {count >= 2
                  ? `${count} of ${fits.length} sound like you. ${s.name} fits.`
                  : `1 of ${fits.length} sounds like you.`}
              </p>
              <a
                href={mail}
                className="press flex items-center gap-2 rounded-full bg-black px-5 py-2.5 text-[14px] font-medium text-white transition hover:bg-black/85"
              >
                Ask about {s.name}
                <Arrow />
              </a>
            </div>
          </div>
        )}
      </div>

      <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-black/[0.07] px-4 py-4 sm:px-7">
        {s.closing ? (
          <p className={cn(HEAD, "w-full text-[17px] sm:w-auto sm:text-[19px]")}>{s.closing}</p>
        ) : fits.length === 0 ? (
          // nothing to tick: ask about it here
          <a
            href={mail}
            className="press flex items-center gap-2 rounded-full bg-black px-5 py-2.5 text-[14px] font-medium text-white transition hover:bg-black/85"
          >
            Ask about {s.name}
            <Arrow />
          </a>
        ) : (
          <span className="hidden sm:block" />
        )}
        <div className="flex w-full gap-2 sm:w-auto">
          {prev && (
            <button
              type="button"
              onClick={() => go(prev.id)}
              className="press flex-1 rounded-full border border-black/10 px-4 py-2 text-[13px] font-medium transition hover:bg-black/[0.03] sm:flex-none"
            >
              ← {String(n).padStart(2, "0")}
            </button>
          )}
          {next && (
            <button
              type="button"
              onClick={() => go(next.id)}
              className="press flex flex-1 items-center justify-center gap-2 rounded-full bg-foreground/[0.06] px-4 py-2 text-[13px] font-medium transition hover:bg-foreground hover:text-background sm:flex-none"
            >
              Next: {next.name}
              <Arrow />
            </button>
          )}
        </div>
      </footer>
    </article>
  );
}

function Paras({ items, light }: { items: string[]; light?: boolean }) {
  return (
    <div
      className={cn(
        "mt-3 space-y-3 text-[15px] leading-relaxed",
        light ? "text-white/80" : "text-black/70",
      )}
    >
      {items.map((x) => (
        <p key={x}>{x}</p>
      ))}
    </div>
  );
}

/* a dark card, the prism's light along its top */
function Dark({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="relative h-full overflow-hidden rounded-xl bg-[var(--ink,#0a0a0a)] p-5 text-white sm:p-6">
      <PrismEdge />
      <h4 className="text-[16px] font-medium">{title}</h4>
      {children}
    </div>
  );
}

/* ---------- the studio's work for them ---------- */

function Portfolio({ book, show }: { book: Book; show: (id: string) => void }) {
  const p = book.portfolio!;
  const name = (id: string) => book.services.find((s) => s.id === id)?.name ?? id;
  return (
    <Part id="portfolio" className="pt-4 sm:pt-6">
      <Kicker>Portfolio</Kicker>
      <Title className="mt-4">{p.title}</Title>
      <p className="mt-3 max-w-3xl text-[16px] text-black/60">{p.text}</p>
      <div className="mt-8 overflow-hidden rounded-xl border border-black/[0.07] bg-[var(--card)]">
        <div className="relative hidden grid-cols-[1.2fr_1fr_1fr] gap-3 bg-foreground px-4 py-2.5 text-[11px] font-medium uppercase tracking-[0.2em] text-background sm:grid">
          <PrismEdge />
          <span>Project</span>
          <span>For</span>
          <span>{book.itemWord}</span>
        </div>
        <ul>
          {p.rows.map((r, i) => (
            <li key={`${r.project}-${i}`} className={i % 2 ? "bg-muted/50" : ""}>
              <button
                type="button"
                onClick={() => show(r.service)}
                className="group grid w-full gap-1 px-4 py-3 text-left transition hover:bg-muted sm:grid-cols-[1.2fr_1fr_1fr] sm:items-center sm:gap-3"
              >
                <span className="text-[15px] font-medium leading-snug">{r.project}</span>
                <span className="text-[14px] text-black/55">{r.for}</span>
                <span className="flex items-center gap-1.5 text-[14px] font-medium">
                  <span>
                    {name(r.service)}
                    {r.note && <span className="text-black/45"> ({r.note})</span>}
                  </span>
                  <Arrow className="opacity-30 transition group-hover:translate-x-0.5 group-hover:opacity-100" />
                </span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </Part>
  );
}

/* ---------- how we work together, and the packages side by side ---------- */

function Together({ book }: { book: Book }) {
  const { together, compare } = book;
  const plans = together.plans ?? [];
  // a film on its own is an option where the table has a column for it (then the first of `ways`)
  const single = !!compare && compare.columns.length === plans.length + 1;
  // the option chosen, the same as its column in the table: on its own (if it's one), then the
  // packages; the first package to begin with
  const [pick, setPick] = useState(single ? 1 : 0);
  const options = plans.length + (single ? 1 : 0);
  return (
    <Part id="together" className="bg-muted/60">
      <div className="max-w-3xl">
        <ChapterHead book={book} id="#together" label="Working together" title={together.title} />
        <p className="mt-4 text-[16px] leading-relaxed text-black/65">{together.text}</p>
      </div>

      {/* how they can work with us (when on its own isn't one of the options below) */}
      {!single && (
        <>
          {together.waysTitle && <Kicker className="mt-10">{together.waysTitle}</Kicker>}
          <div
            className={cn(
              "grid gap-3",
              together.waysTitle ? "mt-4" : "mt-8",
              together.ways.length > 2 ? "sm:grid-cols-3" : "sm:grid-cols-2",
            )}
          >
            {together.ways.map((w, k) => {
              // a department's own way in, the last, marked as the book marks it
              const last = !plans.length && k === together.ways.length - 1;
              return (
                <div
                  key={w.title}
                  className={cn(
                    "relative overflow-hidden rounded-xl p-5",
                    last ? "bg-[var(--ink,#0a0a0a)] text-white" : "bg-[var(--card)]",
                  )}
                >
                  {last && <PrismEdge />}
                  <p className="text-[16px] font-medium">{w.title}</p>
                  <p
                    className={cn(
                      "mt-1 text-[14px] leading-relaxed",
                      last ? "text-white/70" : "text-black/55",
                    )}
                  >
                    {w.text}
                  </p>
                </div>
              );
            })}
          </div>
        </>
      )}

      {plans.length > 0 && (
        <>
          {single && together.ways[1] && (
            <p className="mt-8 max-w-3xl text-[15px] leading-relaxed text-black/60">
              <span className="font-medium text-foreground">{together.ways[1].title}.</span>{" "}
              {together.ways[1].text}
            </p>
          )}
          {/* the options: tap one; it's marked in the table below */}
          <div
            role="radiogroup"
            aria-label="Ways to work together"
            className={cn(
              "mt-6 grid gap-3 sm:grid-cols-2",
              options >= 4 ? "lg:grid-cols-4" : "lg:grid-cols-3",
            )}
          >
            {single && (
              <OptionCard
                on={pick === 0}
                onPick={() => setPick(0)}
                big={<span className="text-[24px]">Single</span>}
                name={together.ways[0].title}
                text={together.ways[0].text}
              />
            )}
            {plans.map((p, k) => {
              const o = k + (single ? 1 : 0);
              return (
                <OptionCard
                  key={p.name}
                  on={pick === o}
                  onPick={() => setPick(o)}
                  big={
                    <>
                      {p.months}
                      <span className="ml-1.5 text-[11px] font-medium uppercase tracking-[0.18em]">
                        months
                      </span>
                    </>
                  }
                  name={p.name}
                  text={p.text}
                  items={p.items}
                />
              );
            })}
          </div>
        </>
      )}

      {together.path && (
        // the way most begin
        <ol className="mt-6 grid gap-2 sm:grid-cols-3">
          {together.path.map((x, k) => {
            const last = k === together.path!.length - 1;
            return (
              <li
                key={x.title}
                className={cn(
                  "relative flex items-center gap-3 overflow-hidden rounded-xl px-4 py-3",
                  last ? "bg-[var(--ink,#0a0a0a)] text-white" : "bg-[var(--card)]",
                )}
              >
                {last && <PrismEdge />}
                <span className={cn(HEAD, "text-[15px]", last ? "text-white" : "text-black/35")}>
                  {k + 1}
                </span>
                <span>
                  <span className="block text-[13px] font-medium">{x.title}</span>
                  <span
                    className={cn("block text-[13px]", last ? "text-white/80" : "text-black/55")}
                  >
                    {x.text}
                  </span>
                </span>
              </li>
            );
          })}
        </ol>
      )}

      {together.expect && (
        <div className="mt-14">
          <Kicker>{together.expect.title}</Kicker>
          <div className="mt-6 grid gap-x-6 gap-y-8 sm:grid-cols-2 lg:grid-cols-3">
            {together.expect.items.map((x) => (
              <div key={x.title} className="relative pt-5">
                <TopLine />
                <p className="text-[16px] font-medium">{x.title}</p>
                <p className="mt-1.5 text-[14px] leading-relaxed text-black/60">{x.text}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {compare && (
        // side by side
        <div id="compare" className="mt-16 scroll-mt-24">
          <Kicker>Side by side</Kicker>
          <Title className="mt-4">{compare.title}</Title>

          {/* phones: one option at a time */}
          <div className="-mx-4 mt-6 flex gap-2 overflow-x-auto px-4 pb-1 sm:hidden">
            {compare.columns.map((c, k) => (
              <button
                key={c}
                type="button"
                onClick={() => setPick(k)}
                className={cn(
                  "press shrink-0 rounded-full px-4 py-2 text-[13px] font-medium transition",
                  pick === k ? "bg-foreground text-background" : "bg-[var(--card)]",
                )}
              >
                {c}
              </button>
            ))}
          </div>

          <div className="mt-4 overflow-hidden rounded-xl border border-black/[0.07] bg-[var(--card)] sm:mt-8">
            <table className="w-full border-collapse text-left text-[14px]">
              <thead>
                <tr className="bg-[var(--ink,#0a0a0a)] text-white">
                  <th className="px-4 py-3 text-[11px] font-medium uppercase tracking-[0.18em]">
                    {book.itemWord}
                  </th>
                  {compare.columns.map((c, k) => (
                    <th
                      key={c}
                      className={cn(
                        "relative px-4 py-3 text-[11px] font-medium uppercase tracking-[0.18em]",
                        k !== pick && "hidden text-white/60 sm:table-cell",
                      )}
                    >
                      {/* the chosen one: a tricolour line under it */}
                      {k === pick && (
                        <span
                          aria-hidden
                          className="absolute inset-x-3 bottom-0 h-[3px] rounded-full"
                          style={{ background: "var(--tricolour)" }}
                        />
                      )}
                      <button
                        type="button"
                        onClick={() => setPick(k)}
                        className="text-left uppercase"
                      >
                        {c}
                      </button>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {compare.rows.map((r, i) => (
                  <tr key={r.service} className={i % 2 ? "bg-muted/40" : ""}>
                    <th scope="row" className="px-4 py-3 font-medium">
                      {r.service}
                    </th>
                    {r.cells.map((c, k) => (
                      <td
                        key={k}
                        className={cn(
                          "px-4 py-3 align-top",
                          k !== pick && "hidden sm:table-cell",
                          k === pick && "bg-muted font-medium",
                          !c && "italic text-black/40",
                        )}
                      >
                        {c || "Not included (extra cost)"}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-4 text-[13px] leading-relaxed text-black/50">{compare.note}</p>
          <p className="relative mt-6 max-w-3xl pl-5 text-[16px] font-medium leading-snug">
            <Bar />
            {compare.advice}
          </p>
        </div>
      )}
    </Part>
  );
}

function OptionCard({
  on,
  onPick,
  big,
  name,
  text,
  items,
}: {
  on: boolean;
  onPick: () => void;
  big: ReactNode;
  name: string;
  text: string;
  items?: string[];
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={on}
      onClick={onPick}
      className={cn(
        "press flex h-full flex-col rounded-xl p-5 text-left transition",
        on
          ? "relative overflow-hidden bg-[var(--ink,#0a0a0a)] text-white shadow-[0_22px_44px_-24px_rgba(0,0,0,0.7)]"
          : "bg-[var(--card)] hover:shadow-[0_16px_36px_-24px_rgba(0,0,0,0.35)]",
      )}
    >
      {on && <PrismEdge />}
      <span className={cn(HEAD, "flex items-baseline text-[34px] leading-none")}>{big}</span>
      <span className="mt-3 text-[16px] font-medium">{name}</span>
      <span
        className={cn("mt-1 text-[14px] leading-relaxed", on ? "text-white/75" : "text-black/55")}
      >
        {text}
      </span>
      {items && (
        <ul
          className={cn(
            "mt-4 space-y-1.5 border-t pt-4 text-[13px] leading-snug",
            on ? "border-white/15 text-white/85" : "border-black/[0.07] text-black/65",
          )}
        >
          {items.map((x) => (
            <li key={x} className="flex gap-2">
              <span aria-hidden className={on ? "text-white/40" : "text-black/30"}>
                •
              </span>
              {x}
            </li>
          ))}
        </ul>
      )}
    </button>
  );
}

/* ---------- let's talk ---------- */

function Talk({ book, ask }: { book: Book; ask: string }) {
  const { talk, reel } = book;
  const phone = SITE.phone.replace(/[^\d+]/g, "");
  // told as a film, the closing is its last scene: over a shot in colour, under the look's wash
  const film = !!reel;
  const look = useContext(LookContext);
  const ghost = film
    ? "border-(--ink)/15 bg-white/70 text-(--ink) backdrop-blur-md hover:bg-white"
    : "border-black/10 bg-white hover:bg-black/[0.03]";
  return (
    <Part id="talk" className="pb-[calc(var(--dock,0px)+3.5rem)] sm:pb-24">
      <div
        className={cn(
          "relative isolate overflow-hidden rounded-2xl p-6 sm:p-12",
          film
            ? "min-h-[70svh] bg-(--paper) text-(--ink) ring-1 ring-(--ink)/10 sm:min-h-[560px]"
            : "border border-black/[0.07] bg-[var(--card)]",
        )}
      >
        {reel ? (
          <>
            <span aria-hidden className={cn("absolute inset-0 -z-10 overflow-hidden", SOFT)}>
              <ShapedLoop
                name={reel.loops.talk}
                phone="reel"
                wide="wide"
                grain={false}
                look={look?.film}
                vignette={false}
                steady
                className="absolute inset-0"
              />
            </span>
            <span
              aria-hidden
              className="absolute inset-0 -z-10 lg:hidden"
              style={{ background: WASH.even }}
            />
            <span
              aria-hidden
              className="absolute inset-0 -z-10 max-lg:hidden"
              style={{ background: WASH.close }}
            />
            <Grain strength={GRAIN} className="-z-10" />
            <PrismEdge />
          </>
        ) : (
          /* a faint light, as a world's: blue one side, amber the other */
          <span
            aria-hidden
            className="absolute inset-0 -z-10 opacity-[0.07]"
            style={{ background: "var(--prism)" }}
          />
        )}
        <Kicker>
          {look?.mark === "plus" && <Cross />}
          {film ? `Epilogue · ${talk.kicker}` : talk.kicker}
        </Kicker>
        <Title className="mt-4 max-w-3xl">{talk.title}</Title>
        <p
          className={cn(
            "mt-4 max-w-2xl text-[16px] leading-relaxed",
            film ? "text-(--ink)/80" : "text-black/65",
          )}
        >
          {talk.text}
        </p>
        <ol className="mt-10 grid gap-6 sm:grid-cols-3">
          {talk.steps.map((x, k) => (
            <li key={x.title} className="relative pt-5">
              <TopLine />
              <p className="text-[15px] font-medium">
                {k + 1}. {x.title}
              </p>
              <p
                className={cn(
                  "mt-1 text-[14px] leading-relaxed",
                  film ? "text-(--ink)/70" : "text-black/55",
                )}
              >
                {x.text}
              </p>
            </li>
          ))}
        </ol>
        <div className="mt-10 flex flex-wrap gap-3">
          <a
            href={`mailto:${SITE.email}?subject=${encodeURIComponent(ask)}`}
            className={cn(
              "press flex items-center gap-2 rounded-full px-6 py-3 text-[15px] font-medium transition",
              film
                ? "bg-(--ink) text-white hover:opacity-90"
                : "bg-black text-white hover:bg-black/85",
            )}
          >
            Write to us
            <Arrow />
          </a>
          {phone && (
            <>
              <a
                href={`tel:${phone}`}
                className={cn(
                  "press rounded-full border px-6 py-3 text-[15px] font-medium transition",
                  ghost,
                )}
              >
                Call {SITE.phone}
              </a>
              <a
                href={`https://wa.me/${phone.replace("+", "")}`}
                target="_blank"
                rel="noreferrer"
                className={cn(
                  "press rounded-full border px-6 py-3 text-[15px] font-medium transition",
                  ghost,
                )}
              >
                WhatsApp
              </a>
            </>
          )}
          <Link
            to="/about"
            className={cn(
              "press rounded-full border px-6 py-3 text-[15px] font-medium transition",
              ghost,
            )}
          >
            Choose another perspective
          </Link>
        </div>
        <p className={cn("mt-5 text-[14px]", film ? "text-(--ink)/55" : "text-black/50")}>
          {SITE.email}
        </p>
      </div>
    </Part>
  );
}

/* ---------- told as a film (book.reel) ---------- */

/* on a phone the film sits behind the words themselves, so it's softened a little (its fine detail
   gone, the picture still plain to see) under a lighter paper (`WASH.even`); on a computer it stays
   sharp beside them */
const SOFT = "max-lg:scale-105 max-lg:blur-[2px]";

/* film grain over the films behind the words (`Grain`, overlaid on the washed picture, so it shows
   where the film does and leaves the paper clean), and how strong */
const GRAIN = 0.18;

/* the film behind the words: the look's paper laid over it so ink words always read (`even` all
   over, as on a phone; `side` strongest on the left, where the words sit on a computer, the film
   clear on the right; `close` the closing's, whose words run the full width) */
const paper = (k: number) => `color-mix(in srgb, var(--paper) ${k}%, transparent)`;
const WASH = {
  even: `linear-gradient(180deg, ${paper(74)}, ${paper(66)} 50%, ${paper(80)})`,
  side: `linear-gradient(90deg, ${paper(97)}, ${paper(93)} 42%, ${paper(62)} 62%, ${paper(22)} 82%, ${paper(8)})`,
  close: `linear-gradient(90deg, ${paper(96)}, ${paper(90)} 50%, ${paper(78)})`,
};

/*
  The book as one film (after Alt Carbon's project pages): a shot fills the screen behind it all,
  in colour, graded to the look and washed in its paper so every word reads, with film grain over
  it, and the words scroll over it slide by slide: one film to a slide, never changing while that
  slide is read, and the next slide's film dissolving in over it as that slide comes in
  (`DISSOLVE`). The slides: the introduction (its lead, the rest of it and its outcomes, all on
  the introduction's film), each service on a screen of its own (its number, name,
  line and who it's for; "See what you receive" opens its details, `FilmSheet`), and the research
  (the findings pinned over the film as press cuttings). Only the shot on screen and the ones
  either side of it are loaded (on a phone, its tall cut, framed on whoever's in each shot).
*/
const DISSOLVE = 1200;
function FilmStory({ book, show }: { book: Book; show: (id: string) => void }) {
  const reel = book.reel!;
  const { intro, research } = book;
  const look = useContext(LookContext);
  // a film for each scene: the introduction's two scenes are one slide, on one film
  const shots = [
    reel.loops.intro,
    reel.loops.intro,
    ...book.services.map((x) => reel.services[x.id] ?? reel.loops.intro),
    reel.loops.research,
  ];
  const scenes = useRef<(HTMLElement | null)[]>([]);
  const [at, setAt] = useState(0);
  // the film being dissolved out of, held under the new one till it's fully in
  const shown = shots[at];
  const last = useRef(shown);
  const [was, setWas] = useState<string>();
  useEffect(() => {
    if (last.current === shown) return;
    setWas(last.current);
    last.current = shown;
    const done = window.setTimeout(() => setWas(undefined), DISSOLVE);
    return () => window.clearTimeout(done);
  }, [shown]);
  useEffect(() => {
    let raf = 0;
    // the scene across the line where the eye reads, a little above the screen's middle (or,
    // between two, the nearest), so the picture is the one for the words being read
    const pick = () => {
      raf = 0;
      const mid = window.innerHeight * 0.45;
      let best = 0;
      let near = Infinity;
      scenes.current.forEach((el, i) => {
        if (!el) return;
        const r = el.getBoundingClientRect();
        const d =
          r.top <= mid && r.bottom >= mid
            ? 0
            : Math.min(Math.abs(r.top - mid), Math.abs(r.bottom - mid));
        if (d < near) {
          near = d;
          best = i;
        }
      });
      setAt(best);
    };
    const later = () => {
      if (!raf) raf = requestAnimationFrame(pick);
    };
    pick();
    window.addEventListener("scroll", later, { passive: true });
    window.addEventListener("resize", later);
    return () => {
      window.removeEventListener("scroll", later);
      window.removeEventListener("resize", later);
      cancelAnimationFrame(raf);
    };
  }, []);
  const scene = (i: number) => (el: HTMLElement | null) => {
    scenes.current[i] = el;
  };
  // a scene's room: just what its words need, so they run on from one to the next over the film
  const room = "flex items-center px-4 py-9 sm:px-6 sm:py-12";
  const lead = "relative mt-6 pl-5 text-[19px] font-light leading-snug sm:text-[23px]";
  return (
    <section className="relative isolate bg-(--paper) text-(--ink) [overflow:clip]">
      {/* the film, held on the screen while its scenes pass over it */}
      <div aria-hidden className="absolute inset-0 -z-10">
        <div className="sticky top-0 h-[100svh] overflow-hidden">
          {/* each slide's film, held in place, the next already loaded beside it: as its slide
              comes in it dissolves in over the last one (still there under it till it's fully in),
              and two slides in a row with the same film share it, so it holds */}
          <div className="absolute inset-0 isolate">
            {[
              ...new Set([...shots.filter((_, i) => Math.abs(i - at) <= 1), ...(was ? [was] : [])]),
            ].map((name) => (
              <div
                key={name}
                className={cn(
                  "absolute inset-0",
                  name === shown
                    ? "z-[2] motion-safe:animate-in motion-safe:fade-in motion-safe:ease-in-out"
                    : name === was
                      ? "z-[1]"
                      : "invisible",
                  SOFT,
                )}
                style={name === shown ? { animationDuration: `${DISSOLVE}ms` } : undefined}
              >
                <ShapedLoop
                  name={name}
                  phone="reel"
                  wide="wide"
                  grain={false}
                  look={look?.film}
                  vignette={false}
                  steady
                  className="absolute inset-0"
                />
              </div>
            ))}
          </div>
          <span className="absolute inset-0 lg:hidden" style={{ background: WASH.even }} />
          <span className="absolute inset-0 max-lg:hidden" style={{ background: WASH.side }} />
          {/* film grain over the picture: overlay, so it shows where the film does and leaves the
              paper the words sit on clean */}
          <Grain strength={GRAIN} />
          {/* real estate's look: a drawing sheet's corners round the film */}
          {look?.mark === "corners" && (
            <span className="absolute inset-4 sm:inset-6">
              {[
                "left-0 top-0 border-l border-t",
                "right-0 top-0 border-r border-t",
                "bottom-0 left-0 border-b border-l",
                "bottom-0 right-0 border-b border-r",
              ].map((x) => (
                <span key={x} className={cn("absolute h-8 w-8 border-(--accent)", x)} />
              ))}
            </span>
          )}
        </div>
      </div>

      {/* the introduction */}
      <div
        id="world"
        ref={scene(0)}
        className={cn(room, "scroll-mt-20 pt-24 sm:scroll-mt-24 sm:pt-32")}
      >
        <Rise className="mx-auto w-full max-w-6xl">
          <div className="max-w-2xl">
            <ChapterHead book={book} id="#world" label="Introduction" title={intro.title} />
            <p className={lead}>
              <Bar />
              {intro.lead}
            </p>
          </div>
        </Rise>
      </div>
      <div ref={scene(1)} className={room}>
        <Rise className="mx-auto w-full max-w-6xl">
          <div className="max-w-2xl space-y-4 text-[16px] leading-relaxed text-(--ink)/85">
            {intro.text.map((x) => (
              <p key={x}>{x}</p>
            ))}
          </div>
          <Kicker className="mt-10">{intro.outcomesTitle}</Kicker>
          <div
            className={cn(
              "mt-4 grid max-w-3xl grid-cols-2 gap-2",
              intro.outcomes.length % 3 === 0 && "sm:grid-cols-3",
            )}
          >
            {intro.outcomes.map((o) => (
              <div key={o.title} className={cn("p-3.5 backdrop-blur-md sm:p-4", look?.card)}>
                <svg
                  aria-hidden
                  viewBox="0 0 24 24"
                  className="h-5 w-5 text-(--accent)"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={1.6}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  {OUTCOME_ICONS[o.icon]}
                </svg>
                <h3
                  className={cn(
                    "mt-3 text-[15px] font-semibold leading-snug text-(--card-head)",
                    look?.mark === "corners" && "text-[12px] uppercase tracking-[0.08em]",
                  )}
                >
                  {o.title}
                </h3>
                <p className="mt-0.5 text-[13px] leading-relaxed text-(--ink)/70">{o.text}</p>
              </div>
            ))}
          </div>
        </Rise>
      </div>

      {/* the services, a slide each: a screen of its own, so its film is the only one while it's read */}
      {book.services.map((x, k) => (
        <div
          key={x.id}
          id={k === 0 ? "services" : undefined}
          ref={scene(k + 2)}
          className={cn(room, "min-h-[100svh]", k === 0 && "scroll-mt-20 sm:scroll-mt-24")}
        >
          <Rise className="mx-auto w-full max-w-6xl">
            <div className="max-w-2xl">
              {k === 0 && (
                <ChapterHead
                  book={book}
                  id="#services"
                  label={`The ${book.itemWord.toLowerCase()}s`}
                  title={book.servicesTitle}
                  className="mb-8"
                />
              )}
              <p className={cn(HEAD, "text-[15px] text-(--accent)")}>
                {String(k + 1).padStart(2, "0")}
                <span className="text-(--ink)/45">
                  {" "}
                  / {String(book.services.length).padStart(2, "0")}
                </span>
              </p>
              <h3 className={cn(BOLD, "mt-1 text-[28px] leading-[1.05] sm:text-[40px]")}>
                {x.name}
              </h3>
              <p className="mt-3 text-[16px] leading-relaxed text-(--ink)/85">{x.line}</p>
              {x.madeFor && (
                <p className="mt-3 text-[13px] text-(--ink)/65">Made for: {x.madeFor}</p>
              )}
              <button
                type="button"
                onClick={() => show(x.id)}
                className="press mt-6 inline-flex items-center gap-2 rounded-full bg-(--ink) px-6 py-3 text-[15px] font-medium text-white transition hover:opacity-90"
              >
                See what you receive
                <Arrow />
              </button>
            </div>
          </Rise>
        </div>
      ))}

      {/* the research: the findings pinned over the film as press cuttings */}
      <div
        id="research"
        ref={scene(book.services.length + 2)}
        className="scroll-mt-20 px-4 pb-24 pt-28 sm:scroll-mt-24 sm:px-6 sm:pb-32"
      >
        <div className="mx-auto max-w-6xl">
          <Rise className="max-w-3xl">
            <ChapterHead
              book={book}
              id="#research"
              label="What the research shows"
              title={research.title}
            />
            <p className="mt-5 text-[16px] leading-relaxed text-(--ink)/85">{research.text}</p>
          </Rise>
          <Clippings book={book} />
          {research.note && (
            <Rise>
              <p className={cn(lead, "mt-12 max-w-4xl")}>
                <Bar />
                {research.note}
              </p>
            </Rise>
          )}
          {research.sources && (
            <p className="mt-6 flex flex-wrap gap-x-5 gap-y-2 text-[13px] text-(--ink)/70">
              <span>Sources:</span>
              {research.sources.map((x) => (
                <a
                  key={x.label}
                  href={x.href}
                  target="_blank"
                  rel="noreferrer"
                  className="font-medium text-(--ink) underline-offset-4 hover:underline"
                >
                  {x.label} ↗
                </a>
              ))}
            </p>
          )}
        </div>
      </div>
    </section>
  );
}

/* the research's findings as cuttings pinned to the wall: cream paper, a red pin, the figure
   counting up as it's seen, and a link to its source at the foot */
function Clippings({ book }: { book: Book }) {
  const tilt = ["-rotate-[1.2deg]", "rotate-[1deg]", "rotate-[0.8deg]", "-rotate-[1deg]"];
  return (
    <div className="mt-10 grid gap-5 sm:grid-cols-2 sm:gap-7">
      {book.research.stats.map((x, i) => (
        <Rise key={x.figure} delay={i * 90}>
          <article
            className={cn(
              "relative h-full rounded-sm bg-[#fffdf8] p-6 text-[#141414] shadow-[0_24px_48px_-28px_rgba(0,0,0,0.45)] ring-1 ring-black/[0.04] sm:p-7",
              tilt[i % tilt.length],
            )}
          >
            <span
              aria-hidden
              className="absolute -top-2 left-1/2 h-4 w-4 -translate-x-1/2 rounded-full bg-[radial-gradient(circle_at_35%_35%,#ff8a73,#c0392b_60%,#7b241c)] shadow-[0_3px_6px_rgba(0,0,0,0.5)]"
            />
            <p className={cn(HEAD, "mt-2 text-[30px] leading-none sm:text-[36px]")}>
              <Count value={x.figure} />
            </p>
            <p className="mt-4 text-[15px] leading-relaxed text-black/75">{x.text}</p>
            {x.sources && (
              <p className="mt-4 flex flex-wrap gap-x-4 gap-y-1 text-[12px] text-black/50">
                {x.sources.map((src) => (
                  <a
                    key={src.label}
                    href={src.href}
                    target="_blank"
                    rel="noreferrer"
                    className="underline-offset-4 transition hover:text-black hover:underline"
                  >
                    Read the source ↗
                  </a>
                ))}
              </p>
            )}
          </article>
        </Rise>
      ))}
    </div>
  );
}

/*
  A service's details, over the whole screen: its film fills it, held steady and slow (no cuts)
  and darkened, its number, name and line at the foot of the first screen, then what it's for,
  what it does, what you receive and an example (`FilmDetail`). Closes with its button, Esc,
  or a tap outside it; the page behind doesn't move.
*/
function FilmSheet({
  book,
  n,
  ask,
  onClose,
}: {
  book: Book;
  n: number;
  ask: string;
  onClose: () => void;
}) {
  const s = book.services[n];
  const look = useContext(LookContext);
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (!d.open) d.showModal();
    const html = document.documentElement;
    const was = html.style.overflow;
    html.style.overflow = "hidden";
    return () => {
      html.style.overflow = was;
      if (d.open) d.close();
    };
  }, []);
  return (
    <dialog
      ref={ref}
      aria-label={s.name}
      // (a close that comes once it's open again, as React's development run closes and reopens
      // it, isn't one)
      onClose={() => {
        if (!ref.current?.open) onClose();
      }}
      className="fixed inset-0 m-0 h-full max-h-none w-full max-w-none overflow-y-auto overscroll-contain border-0 bg-(--paper) p-0 text-(--ink) backdrop:bg-white duration-500 animate-in fade-in"
    >
      {/* its film over the whole screen, held steady and slow behind the words, washed in the look's
          paper towards the foot so they read */}
      <div aria-hidden className="pointer-events-none fixed inset-0">
        <ShapedLoop
          name={book.reel!.services[s.id] ?? book.reel!.loops.intro}
          phone="reel"
          wide="wide"
          grain={false}
          look={look?.film}
          vignette={false}
          steady
          className="absolute inset-0"
        />
        <span
          className="absolute inset-0 z-[2]"
          style={{
            background: `linear-gradient(180deg, ${paper(10)}, ${paper(25)} 30%, ${paper(80)} 58%, ${paper(96)})`,
          }}
        />
        <Grain strength={GRAIN} className="z-[3]" />
      </div>
      <button
        type="button"
        onClick={onClose}
        className="press fixed right-4 top-4 z-20 flex items-center gap-2 rounded-full bg-white/85 px-4 py-2 text-[14px] font-medium text-black shadow-[0_6px_20px_-8px_rgba(0,0,0,0.35)] backdrop-blur-md transition hover:bg-white"
      >
        Close
        <svg
          aria-hidden
          viewBox="0 0 24 24"
          className="h-4 w-4"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
        >
          <path d="M6 6l12 12M18 6L6 18" />
        </svg>
      </button>
      <div className="relative z-10 mx-auto max-w-3xl px-5 sm:px-8">
        {/* its name at the foot of the first screen, the film above it */}
        <div className="flex min-h-[72svh] flex-col justify-end pb-8">
          <p className={cn(HEAD, "text-[15px] text-(--accent)")}>
            {String(n + 1).padStart(2, "0")}
          </p>
          <h3 className={cn(BOLD, "mt-1 text-[32px] leading-[1.04] sm:text-[48px]")}>{s.name}</h3>
          <p className="mt-3 max-w-2xl text-[17px] leading-relaxed text-(--ink)/85">{s.line}</p>
          {s.madeFor && <p className="mt-3 text-[13px] text-(--ink)/65">Made for: {s.madeFor}</p>}
        </div>
        {/* then everything about it, on light glass over the film */}
        <div className="mb-[calc(var(--dock,0px)+2.5rem)] rounded-2xl bg-white/80 px-5 pb-6 ring-1 ring-(--ink)/10 backdrop-blur-md sm:mb-12 sm:px-8 sm:pb-8">
          <FilmDetail s={s} ask={ask} />
        </div>
      </div>
    </dialog>
  );
}

/* a service's details: what it's for, what it does, what you get, an example */
function FilmDetail({ s, ask, dark }: { s: Service; ask: string; dark?: boolean }) {
  const mail = `mailto:${SITE.email}?subject=${encodeURIComponent(`${ask}: ${s.name}`)}`;
  return (
    <div className="grid gap-8 pb-4 pt-8 lg:grid-cols-2 lg:gap-12">
      <div className="space-y-8">
        {s.familiar?.length ? (
          <div>
            <h4 className="text-[16px] font-medium">Does this sound familiar?</h4>
            <Paras items={s.familiar} light={dark} />
          </div>
        ) : null}
        <div>
          <h4 className="text-[16px] font-medium">{s.doesTitle ?? "What this film does"}</h4>
          <Paras items={s.does} light={dark} />
        </div>
        {s.uses?.length ? (
          <div>
            <h4 className="text-[16px] font-medium">{s.usesTitle ?? "Where it is used"}</h4>
            <Ticks items={s.uses} light={dark} />
          </div>
        ) : null}
      </div>
      <div className="space-y-8">
        <div>
          <h4 className="text-[16px] font-medium">{s.receiveTitle ?? "What you receive"}</h4>
          <Ticks items={s.receive} light={dark} />
        </div>
        {s.example?.length ? (
          <div
            className={cn(
              "relative overflow-hidden rounded-xl p-5 text-white sm:p-6",
              dark ? "bg-white/[0.08] ring-1 ring-white/15" : "bg-[var(--ink,#0a0a0a)]",
            )}
          >
            <PrismEdge />
            <h4 className="text-[16px] font-medium">For example</h4>
            <Paras items={s.example} light />
          </div>
        ) : null}
        <a
          href={mail}
          className={cn(
            "press inline-flex items-center gap-2 rounded-full px-6 py-3 text-[15px] font-medium transition",
            dark
              ? "bg-white text-black hover:bg-white/85"
              : "bg-[var(--ink,#0a0a0a)] text-white hover:opacity-90",
          )}
        >
          Ask about this film
          <Arrow />
        </a>
      </div>
    </div>
  );
}
