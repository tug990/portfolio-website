import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { CONTACT_PAGE, TESTIMONIALS } from "@/content/site";
import { cn } from "@/lib/utils";

/*
  The Contact page's testimonials, as a drawer of folders (after
  testimonialdrawer.framer.website), in the site's own language: white, ink
  and the prism of light. A box of black leather pulled open (pebble grain,
  light stitching, a suede lining) so the white folders stand out; a white folder for each person (TESTIMONIALS in content/site.ts), each
  lit by one colour of the prism, blue to amber across the drawer (`LIGHTS`),
  a line of its light glowing along its tab; the tabs (name and number)
  staggered left, middle, right. One folder is lifted out above the drawer,
  glowing faintly with the prism beneath it: its number and company in
  wide-spaced capitals, the quote in light type with its marked words
  underlined in prism light, the person. Choosing another tab (or the
  folder's strip) drops the open one back into its place and lifts that one
  out, rising between the folders in front of it as a real one would. The
  first one rises as the drawer comes into view.

  Sizes follow the drawer's width (`geometry`); every folder is as tall as
  the longest quote needs (measured). Phones: two tab positions, not three.
*/

// The folders' lights, along the prism (its white middle left out), blue to amber
const LIGHTS = ["#1f2cff", "#2b7bff", "#2bb8ff", "#ffa040", "#ff8a1f", "#ff3d1f"];
const lightFor = (i: number, n: number) =>
  n <= LIGHTS.length
    ? LIGHTS[Math.round((i * (LIGHTS.length - 1)) / Math.max(1, n - 1))]!
    : LIGHTS[i % LIGHTS.length]!;
const rgba = (hex: string, a: number) => {
  const v = parseInt(hex.slice(1), 16);
  return `rgba(${v >> 16}, ${(v >> 8) & 255}, ${v & 255}, ${a})`;
};

// How a folder moves: rising out with a little spring, dropping back plainly.
const MOTION = {
  rise: "transform 0.75s cubic-bezier(0.2, 1.18, 0.38, 1)",
  drop: "transform 0.5s cubic-bezier(0.5, 0, 0.25, 1)",
  shadow: "box-shadow 0.5s ease",
};

// The site's light (the prism line) and its shadows; the box is black leather,
// so the white folders stand out against it.
const SHADOW = "rgba(40,30,90,"; // the site's shadows are a deep violet, not grey
const PRISM = "var(--prism)";
const PRISM_SOLID = "linear-gradient(90deg, #1f2cff, #2bb8ff 40%, #ff8a1f 60%, #ff3d1f)"; // without its white middle

/*
  The leather: its pebble grain is noise lit from the top left (an SVG filter,
  tiled seamlessly), laid over the black; the suede lining, a finer, softer
  noise. `THREAD`: the stitching's colour.
*/
const svg = (body: string) => `url("data:image/svg+xml,${encodeURIComponent(body)}")`;
const LEATHER = svg(
  "<svg xmlns='http://www.w3.org/2000/svg' width='240' height='240'><filter id='f' x='0' y='0' width='100%' height='100%'><feTurbulence type='fractalNoise' baseFrequency='0.3' numOctaves='4' seed='11' stitchTiles='stitch'/><feDiffuseLighting surfaceScale='1.5' diffuseConstant='1' lighting-color='#ffffff'><feDistantLight azimuth='235' elevation='55'/></feDiffuseLighting><feColorMatrix values='0.5 0 0 0 0.1 0.5 0 0 0 0.1 0.5 0 0 0 0.1 0 0 0 0 1'/></filter><rect width='100%' height='100%' filter='url(#f)'/></svg>",
);
const SUEDE = svg(
  "<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200'><filter id='f' x='0' y='0' width='100%' height='100%'><feTurbulence type='fractalNoise' baseFrequency='1.1' numOctaves='2' seed='4' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0.55 0 0 0 -0.22'/></filter><rect width='100%' height='100%' filter='url(#f)'/></svg>",
);
const BLACK = "linear-gradient(180deg, #26262a 0%, #19191c 55%, #101012 100%)";
const THREAD = "rgba(232,228,220,0.5)";

// Silver stamped into the leather: bright, pressed in (dark above, a catch of light below), a faint glow
const STAMP = {
  color: "#f2f1f4",
  textShadow:
    "0 -1px 0 rgba(0,0,0,0.85), 0 1px 0 rgba(255,255,255,0.1), 0 0 12px rgba(255,255,255,0.18)",
} as const;

const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));

/*
  Where everything goes, from the drawer's width `W`, the number of folders
  `n` and the tallest folder's words `content` (px). y = 0 is the top of the
  lifted folder's tab.
*/
function geometry(W: number, n: number, content: number) {
  const phone = W < 560;
  const cols = Math.max(1, Math.min(n, phone ? 2 : 3));
  const edge = Math.round(clamp(W * 0.014, 6, 10)); // the front's edge to the drawer's side
  const side = Math.round(clamp(W * 0.04, 15, 30)); // the front's edge to a folder's
  const fw = W - side * 2; // a folder's width
  const tabW = Math.round(cols === 1 ? fw * 0.5 : fw * (phone ? 0.49 : 0.32));
  const tabH = phone ? 36 : 40;
  const step = Math.round(phone ? 13 : clamp(W * 0.025, 14, 19)); // folder to folder
  const pad = phone ? { x: 22, top: 20, bottom: 20 } : { x: 34, top: 26, bottom: 26 };
  const H = Math.round(Math.max(content + pad.top + pad.bottom + 34, fw * (phone ? 0.66 : 0.46)));
  const top = 10; // room above, for the spring
  const lifted = top + tabH; // the lifted folder's top
  const drawer = lifted + H + 8; // the drawer's top edge
  const slot = (i: number) => drawer + 22 + i * step + tabH; // folder i's top, in the drawer
  const front = slot(n - 1) + (phone ? 42 : 48); // the front's top edge: the last folder's first line shows
  const frontH = Math.round(clamp(W * 0.19, 104, 144));
  const tabX = (i: number) => (cols === 1 ? 0 : ((i % cols) * (fw - tabW)) / (cols - 1));
  const col = (i: number) => (cols === 1 ? 0 : i % cols);
  return {
    phone,
    cols,
    edge,
    side,
    fw,
    tabW,
    tabH,
    pad,
    H,
    lifted,
    drawer,
    slot,
    front,
    frontH,
    tabX,
    col,
    height: front + frontH,
  };
}

const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]!.toUpperCase())
    .join("");

export function TestimonialDrawer() {
  const list = TESTIMONIALS;
  const n = list.length;
  const wrap = useRef<HTMLDivElement>(null);
  const tops = useRef<(HTMLDivElement | null)[]>([]);
  const foots = useRef<(HTMLDivElement | null)[]>([]);
  const tabs = useRef<(HTMLButtonElement | null)[]>([]);
  const [size, setSize] = useState({ W: 760, content: 220 });
  const [active, setActive] = useState(0);
  const [open, setOpen] = useState(true); // a folder is lifted out
  const [still, setStill] = useState(false); // reduced motion

  // Measure the drawer's width and the tallest folder's words
  useLayoutEffect(() => {
    const el = wrap.current;
    if (!el) return;
    const measure = () => {
      const W = el.clientWidth;
      let content = 0;
      tops.current.forEach((t, i) => {
        const f = foots.current[i];
        if (t && f) content = Math.max(content, t.offsetHeight + f.offsetHeight);
      });
      setSize((s) => (s.W === W && s.content === content ? s : { W, content }));
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    tops.current.forEach((t) => t && ro.observe(t));
    foots.current.forEach((f) => f && ro.observe(f));
    document.fonts?.ready.then(measure);
    return () => ro.disconnect();
  }, []);

  // The first folder rises as the drawer comes into view (straight away if it's in view already)
  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    setStill(reduce);
    const el = wrap.current;
    if (reduce || !el || !("IntersectionObserver" in window)) return;
    let first = true;
    let timer = 0;
    const io = new IntersectionObserver(
      ([e]) => {
        if (first) {
          first = false;
          if (!e.isIntersecting) setOpen(false);
          else return io.disconnect();
        }
        if (e.isIntersecting) {
          timer = window.setTimeout(() => setOpen(true), 250);
          io.disconnect();
        }
      },
      { threshold: 0.35 },
    );
    io.observe(el);
    return () => {
      io.disconnect();
      clearTimeout(timer);
    };
  }, []);

  if (!n) return null;
  const g = geometry(size.W, n, size.content);

  const pick = (i: number) => {
    setActive(i);
    setOpen(true);
  };
  const onKey = (i: number) => (e: React.KeyboardEvent) => {
    const to =
      e.key === "ArrowRight" || e.key === "ArrowDown"
        ? (i + 1) % n
        : e.key === "ArrowLeft" || e.key === "ArrowUp"
          ? (i - 1 + n) % n
          : e.key === "Home"
            ? 0
            : e.key === "End"
              ? n - 1
              : -1;
    if (to < 0) return;
    e.preventDefault();
    pick(to);
    tabs.current[to]?.focus();
  };

  return (
    <section
      aria-labelledby="said-title"
      className="overflow-x-clip px-4 pb-20 pt-6 sm:px-6 sm:pb-28"
    >
      <p className="eyebrow text-center">{CONTACT_PAGE.saidEyebrow}</p>
      <h2
        id="said-title"
        className="tracked mt-4 text-balance text-center text-2xl font-light sm:text-[30px]"
      >
        {CONTACT_PAGE.saidTitle}
      </h2>
      <div className="prism-rule mx-auto mt-8 max-w-[10rem]" />

      <div
        ref={wrap}
        className="relative isolate mx-auto mt-10 w-full max-w-[760px] sm:mt-12"
        style={{ height: g.height + 24 }}
      >
        {/* The light it sits in: blue one side, amber the other, as a perspective's world */}
        <div
          aria-hidden
          className="pointer-events-none absolute -inset-x-[12%] -z-10 blur-3xl"
          style={{
            top: g.drawer * 0.35,
            bottom: g.frontH * 0.4,
            background:
              "linear-gradient(90deg, rgba(43,110,255,0.16), rgba(255,255,255,0) 42%, rgba(255,255,255,0) 58%, rgba(255,140,50,0.18))",
          }}
        />

        {/* The box's inside: lined with black suede, deep, a little blue and amber light within; its walls leather, their tops catching the light */}
        <div
          aria-hidden
          className="absolute overflow-hidden"
          style={{
            left: g.edge,
            right: g.edge,
            top: g.drawer,
            height: g.front - g.drawer + 30,
            borderRadius: "14px 14px 0 0",
            backgroundImage: `${SUEDE}, radial-gradient(60% 70% at 50% 0%, rgba(255,255,255,0.06), rgba(255,255,255,0) 70%), linear-gradient(90deg, rgba(43,110,255,0.14), rgba(43,110,255,0) 35%, rgba(255,140,50,0) 65%, rgba(255,140,50,0.14)), linear-gradient(180deg, #070708 0%, #121214 45%, #1a1a1d 100%)`,
            backgroundSize: "200px, auto, auto, auto",
            boxShadow: "inset 0 18px 26px -12px rgba(0,0,0,0.85), inset 0 0 0 1px rgba(0,0,0,0.6)",
          }}
        >
          {/* the back wall's top edge, leather over it */}
          <div
            className="absolute inset-x-0 top-0 h-2"
            style={{
              backgroundImage: `${LEATHER}, ${BLACK}`,
              backgroundSize: "240px, auto",
              backgroundBlendMode: "soft-light, normal",
              boxShadow: "inset 0 1px 0 rgba(255,255,255,0.16), 0 2px 3px rgba(0,0,0,0.6)",
            }}
          />
          {[0, 1].map((k) => (
            <div
              key={k}
              className="absolute bottom-0 top-2"
              style={{
                [k ? "right" : "left"]: 0,
                width: g.side - g.edge - 3,
                backgroundImage: `${LEATHER}, linear-gradient(${k ? 270 : 90}deg, #2a2a2e, #19191c 70%, #0f0f11)`,
                backgroundSize: "240px, auto",
                backgroundBlendMode: "soft-light, normal",
                boxShadow: `inset ${k ? -1 : 1}px 0 0 rgba(255,255,255,0.14), inset ${k ? 3 : -3}px 0 5px rgba(0,0,0,0.55)`,
              }}
            />
          ))}
        </div>

        {/* The folders, cut off below the drawer's front */}
        <div
          className="absolute inset-x-0 top-0"
          style={{
            height: g.front + g.frontH - 14,
            clipPath:
              "polygon(-200px -400px, calc(100% + 200px) -400px, calc(100% + 200px) 100%, -200px 100%)",
          }}
        >
          {list.map((t, i) => {
            const up = open && i === active;
            const light = lightFor(i, n);
            const col = g.col(i);
            const corner =
              col === 0 ? "0 18px 18px 18px" : col === g.cols - 1 ? "18px 0 18px 18px" : "18px";
            const edge = `${SHADOW}0.07)`;
            const num = String(i + 1).padStart(2, "0");
            const at = t.highlight ? t.quote.indexOf(t.highlight) : -1;
            return (
              <div
                key={i}
                onClick={() => !up && pick(i)}
                className={cn("absolute", !up && "cursor-pointer")}
                style={{
                  left: g.side,
                  top: 0,
                  width: g.fw,
                  height: g.H,
                  zIndex: i + 1,
                  transform: `translate3d(0, ${up ? g.lifted : g.slot(i)}px, 0)`,
                  transition: still ? "none" : up ? MOTION.rise : MOTION.drop,
                }}
              >
                <div
                  className={cn(
                    "relative h-full",
                    !up &&
                      !still &&
                      "transition-transform duration-300 ease-out hover:-translate-y-2",
                  )}
                >
                  {/* its glow: the prism beneath it, once it's lifted out */}
                  <span
                    aria-hidden
                    className="pointer-events-none absolute inset-x-[10%] -bottom-3 h-10 rounded-full blur-2xl"
                    style={{
                      background: PRISM,
                      opacity: up ? 0.5 : 0,
                      transition: still ? "none" : "opacity 0.6s ease",
                    }}
                  />

                  {/* the tab, a line of its light glowing along its top */}
                  <button
                    ref={(el) => {
                      tabs.current[i] = el;
                    }}
                    type="button"
                    id={`said-tab-${i}`}
                    aria-expanded={up}
                    aria-controls={`said-${i}`}
                    onKeyDown={onKey(i)}
                    className="absolute bottom-full flex items-center justify-between gap-3 px-4 text-left outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#6d7bff]/60"
                    style={{
                      left: g.tabX(i),
                      width: g.tabW,
                      height: g.tabH + 1,
                      marginBottom: -1,
                      background: `linear-gradient(180deg, ${rgba(light, 0.2)}, ${rgba(light, 0.14)}), #ffffff`,
                      borderRadius: "13px 13px 0 0",
                      boxShadow: `inset 1px 0 0 ${edge}, inset -1px 0 0 ${edge}, inset 0 1px 0 rgba(255,255,255,0.9)`,
                    }}
                  >
                    <span
                      aria-hidden
                      className="absolute inset-x-4 top-0 h-[2px] rounded-full"
                      style={{ background: light, boxShadow: `0 0 10px 1px ${rgba(light, 0.6)}` }}
                    />
                    <span className="truncate text-[13px] font-medium tracking-[0.01em] text-black/80">
                      {t.name}
                    </span>
                    <span className="tracked -mr-[0.32em] shrink-0 text-[9.5px] tabular-nums text-black/40">
                      {num}
                    </span>
                  </button>

                  {/* the folder: white, lit by its colour from the top */}
                  <div
                    id={`said-${i}`}
                    role="region"
                    aria-labelledby={`said-tab-${i}`}
                    aria-hidden={!up}
                    className="relative flex h-full flex-col text-[#0a0a0a]"
                    style={{
                      background: `linear-gradient(180deg, ${rgba(light, 0.14)} 0%, ${rgba(light, 0.05)} 24%, rgba(255,255,255,0) 50%), #ffffff`,
                      borderRadius: corner,
                      padding: `${g.pad.top}px ${g.pad.x}px ${g.pad.bottom}px`,
                      boxShadow: up
                        ? `0 34px 70px -22px ${SHADOW}0.38), 0 2px 6px ${SHADOW}0.06), inset 0 0 0 1px ${edge}`
                        : `0 -6px 16px -6px ${SHADOW}0.16), inset 0 0 0 1px ${edge}`,
                      transition: still ? "none" : MOTION.shadow,
                    }}
                  >
                    <div
                      ref={(el) => {
                        tops.current[i] = el;
                      }}
                    >
                      <div className="flex items-center justify-between gap-4">
                        <span className="tracked truncate text-[10px] text-black/45">
                          No. {num} · {t.company}
                        </span>
                        {t.stars ? (
                          <span
                            className="flex shrink-0 gap-[3px] text-black/75"
                            role="img"
                            aria-label={`${t.stars} out of 5`}
                          >
                            {[0, 1, 2, 3, 4].map((s) => (
                              <Star key={s} on={s < t.stars!} />
                            ))}
                          </span>
                        ) : null}
                      </div>
                      <blockquote
                        className={cn(
                          "font-light leading-[1.42] tracking-[-0.01em] text-black/80",
                          g.phone ? "mt-4 text-[18px]" : "mt-5 text-[23px]",
                        )}
                      >
                        “
                        {at < 0 ? (
                          t.quote
                        ) : (
                          <>
                            {t.quote.slice(0, at)}
                            <mark
                              className="bg-transparent pb-[2px] font-normal text-black [box-decoration-break:clone] [-webkit-box-decoration-break:clone]"
                              style={{
                                backgroundImage: `${PRISM_SOLID}, linear-gradient(90deg, rgba(43,140,255,0.13), rgba(255,138,31,0.15))`,
                                backgroundSize: "100% 1.5px, 100% 0.55em",
                                backgroundPosition: "0 100%, 0 100%",
                                backgroundRepeat: "no-repeat",
                              }}
                            >
                              {t.highlight}
                            </mark>
                            {t.quote.slice(at + t.highlight!.length)}
                          </>
                        )}
                        ”
                      </blockquote>
                    </div>
                    <div className="flex-1" />
                    <div
                      ref={(el) => {
                        foots.current[i] = el;
                      }}
                    >
                      <div className="h-px bg-black/[0.07]" />
                      <div className={cn("flex items-center gap-3.5", g.phone ? "pt-4" : "pt-5")}>
                        <span
                          className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full border border-white/80 bg-white/70 text-[13px] font-medium tracking-[0.04em] text-black/70"
                          style={{
                            boxShadow: `0 8px 20px -10px ${SHADOW}0.4), 0 0 0 1px ${rgba(light, 0.18)}, inset 0 1px 0 rgba(255,255,255,0.9)`,
                          }}
                        >
                          {t.image ? (
                            <img src={t.image} alt="" className="h-full w-full object-cover" />
                          ) : (
                            initials(t.name)
                          )}
                        </span>
                        <p className="min-w-0">
                          <span className="block truncate text-[15px] font-medium text-black/85">
                            {t.name}
                          </span>
                          <span className="tracked mt-1 block truncate text-[9.5px] text-black/45">
                            {t.role} · {t.company}
                          </span>
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <DrawerFront g={g} />
      </div>
    </section>
  );
}

function Star({ on }: { on: boolean }) {
  return (
    <svg viewBox="0 0 24 24" className="h-3 w-3" style={{ opacity: on ? 1 : 0.25 }} aria-hidden>
      <path
        fill="currentColor"
        d="M12 2.6l2.82 6.06 6.64.74-4.93 4.5 1.36 6.54L12 17.1l-5.89 3.34 1.36-6.54-4.93-4.5 6.64-.74z"
      />
    </svg>
  );
}

/*
  The box's front: black leather with its pebble grain (`LEATHER`), softly
  lit from above, its edges rolled; a line of light stitching round it; the
  prism's light along its top edge as if spilling out of the box; its label
  stamped into the leather in silver (`STAMP`), in wide-spaced capitals; its
  pull a strap of leather, stitched, held by two silver studs, "Client
  feedback" stamped on it.
*/
function DrawerFront({ g }: { g: ReturnType<typeof geometry> }) {
  return (
    <div
      aria-hidden
      className="absolute inset-x-0 isolate"
      style={{
        top: g.front,
        height: g.frontH,
        borderRadius: "14px 14px 22px 22px",
        backgroundImage: `${LEATHER}, radial-gradient(90% 120% at 30% -10%, rgba(255,255,255,0.09), rgba(255,255,255,0) 60%), ${BLACK}`,
        backgroundSize: "240px, auto, auto",
        backgroundBlendMode: "soft-light, normal, normal",
        boxShadow:
          "0 34px 60px -24px rgba(10,10,20,0.55), 0 2px 6px rgba(10,10,20,0.25), inset 0 1px 0 rgba(255,255,255,0.14), inset 0 2px 4px rgba(255,255,255,0.04), inset 0 -3px 6px rgba(0,0,0,0.55), inset 0 0 0 1px rgba(0,0,0,0.5)",
      }}
    >
      {/* the light along its top edge */}
      <span className="absolute inset-x-[8%] top-0 h-px opacity-80" style={{ background: PRISM }} />
      <span
        className="absolute inset-x-[14%] -top-1 h-3 rounded-full opacity-40 blur-md"
        style={{ background: PRISM }}
      />
      {/* the stitching, a groove beside it */}
      <Stitches inset={g.phone ? 8 : 10} radius={g.phone ? 9 : 11} />

      <div
        className="absolute inset-x-0 flex flex-col items-center"
        style={{ top: Math.round(g.frontH * (g.phone ? 0.26 : 0.27)) }}
      >
        {/* the label, stamped in silver */}
        <p
          className={cn(
            "tracked -mr-[0.32em] font-medium leading-none",
            g.phone ? "text-[13px]" : "text-[16px]",
          )}
          style={STAMP}
        >
          {CONTACT_PAGE.drawerLabel}
        </p>

        {/* the pull: a strap of leather, stitched, on two silver studs, "Client feedback" stamped on it */}
        <div
          className="relative flex items-center justify-center px-[22px]"
          style={{
            height: g.phone ? 22 : 26,
            marginTop: g.phone ? 11 : 14,
            borderRadius: 6,
            backgroundImage: `${LEATHER}, linear-gradient(180deg, #2d2d32, #18181b)`,
            backgroundSize: "240px, auto",
            backgroundBlendMode: "soft-light, normal",
            boxShadow:
              "0 4px 6px -1px rgba(0,0,0,0.65), 0 1px 1px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.18), inset 0 -1px 1px rgba(0,0,0,0.5)",
          }}
        >
          <Stitches inset={3} radius={3} thin />
          <span
            className={cn(
              "tracked -mr-[0.32em] relative leading-none",
              g.phone ? "text-[8.5px]" : "text-[9.5px]",
            )}
            style={STAMP}
          >
            {CONTACT_PAGE.drawerSub}
          </span>
          {[0, 1].map((k) => (
            <span
              key={k}
              className="absolute top-1/2 h-[7px] w-[7px] -translate-y-1/2 rounded-full"
              style={{
                [k ? "right" : "left"]: 8,
                background:
                  "radial-gradient(circle at 35% 30%, #ffffff, #b9b9c0 45%, #5d5d64 100%)",
                boxShadow: "0 1px 1px rgba(0,0,0,0.6)",
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

/* A line of stitches round a box, `inset` from its edges, a groove pressed beside it. */
function Stitches({ inset, radius, thin }: { inset: number; radius: number; thin?: boolean }) {
  return (
    <svg
      aria-hidden
      className="pointer-events-none absolute overflow-visible"
      style={{ inset, width: `calc(100% - ${inset * 2}px)`, height: `calc(100% - ${inset * 2}px)` }}
    >
      <rect
        width="100%"
        height="100%"
        rx={radius}
        fill="none"
        stroke="rgba(0,0,0,0.55)"
        strokeWidth={thin ? 1 : 1.6}
        transform="translate(0 1)"
        strokeDasharray={thin ? "3 2.2" : "5 3.2"}
        strokeLinecap="round"
      />
      <rect
        width="100%"
        height="100%"
        rx={radius}
        fill="none"
        stroke={THREAD}
        strokeWidth={thin ? 0.9 : 1.3}
        strokeDasharray={thin ? "3 2.2" : "5 3.2"}
        strokeLinecap="round"
      />
    </svg>
  );
}
