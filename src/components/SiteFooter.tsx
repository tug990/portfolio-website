import { useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { CTA, SITE } from "@/content/site";

/*
  Footer for every page except the landing and the gallery: the gallery's
  card (step inside, on a screen or in VR), a call to action, then the studio
  name in huge type under a row of lights that switch on as it scrolls into view.
*/
const LIGHTS = 6;

export function SiteFooter() {
  const ref = useRef<HTMLDivElement>(null);
  const [on, setOn] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setOn(e.isIntersecting), { threshold: 0.35 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <footer className="overflow-hidden pt-16 sm:pt-20">
      <GalleryCard />
      <div className="mx-auto mt-20 flex max-w-6xl flex-col gap-10 px-4 sm:mt-24 sm:px-6 lg:flex-row lg:items-end lg:justify-between">
        <h2 className="max-w-xl text-5xl font-medium leading-[0.95] tracking-tight sm:text-7xl">
          {CTA.title}
        </h2>
        <div className="flex flex-col gap-6 lg:items-end">
          <div className="flex flex-wrap gap-2">
            <a
              href={CTA.call.href}
              className="rounded-md bg-black/[0.05] px-4 py-2.5 text-sm transition-colors hover:bg-black/10"
            >
              {CTA.call.label} →
            </a>
            <a
              href={`mailto:${SITE.email}`}
              className="rounded-md bg-black/[0.05] px-4 py-2.5 text-sm transition-colors hover:bg-black/10"
            >
              {SITE.email} →
            </a>
          </div>
          <nav className="flex gap-6 text-sm">
            <Link to="/projects" className="hover:underline">
              Work
            </Link>
            <Link to="/about" className="hover:underline">
              About
            </Link>
            <Link to="/contact" className="hover:underline">
              Contact
            </Link>
          </nav>
        </div>
      </div>

      {/* The name, lit from above */}
      <div ref={ref} className="relative mx-auto mt-20 max-w-[1600px] px-2">
        <div className="relative flex justify-around px-[6%]" aria-hidden>
          {Array.from({ length: LIGHTS }, (_, i) => (
            <span key={i} className="relative h-1.5 w-[8%] rounded-full bg-black/80">
              <span
                className="absolute left-1/2 top-full h-[38vw] max-h-[520px] w-[16vw] -translate-x-1/2"
                style={{
                  clipPath: "polygon(30% 0, 70% 0, 100% 100%, 0 100%)",
                  background:
                    "linear-gradient(180deg, rgba(255,250,240,.95), rgba(255,250,240,.25) 70%, transparent)",
                  opacity: on ? 1 : 0,
                  transition: `opacity .9s ease ${on ? i * 120 : 0}ms`,
                }}
              />
            </span>
          ))}
        </div>
        <p
          className="relative mt-[2vw] select-none whitespace-nowrap text-center font-medium leading-[0.8] tracking-[-0.04em]"
          style={{
            fontSize: "clamp(4rem, 17vw, 17rem)",
            color: on ? "#0a0a0a" : "#e7e6e2",
            transition: "color 1.2s ease .3s",
          }}
        >
          {SITE.name}
        </p>
      </div>

      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-6 text-xs text-black/55 sm:px-6">
        <ul className="flex gap-5">
          {SITE.socials.map((s) => (
            <li key={s.href}>
              <a href={s.href} target="_blank" rel="noreferrer" className="hover:text-black">
                {s.label}
              </a>
            </li>
          ))}
        </ul>
        <p>
          © {new Date().getFullYear()} {SITE.name}
        </p>
      </div>
    </footer>
  );
}

/*
  The gallery, as a way in: a VR headset (brand/vr-headset.webp), with the
  way in shown inside its visor as a headset's display glows behind its
  glass: "The gallery / Step into the light", the words, and VR view, which
  opens /gallery (a 3D room: walk through it on a screen, or step inside
  with a headset, or a phone in a VR holder). The display is kept to the
  visor's glass by its shape (brand/vr-visor.webp, a mask made from the
  photograph), lit faintly blue and amber from within, the glass's own
  reflections laid back over it. Sizes follow the headset's width (cqw),
  and on every resize the words are measured and, if they'd reach the edge
  of the glass, made a little smaller (`fit`). The whole headset shows on
  every screen (the screen's width, a small margin each side, at most 980
  px). On phones the visor holds the name, the title and VR view; the
  sentence, which a phone-sized visor can't hold at a readable size, sits
  under it.
*/
const VISOR = {
  WebkitMaskImage: "url(/brand/vr-visor.webp)",
  maskImage: "url(/brand/vr-visor.webp)",
  WebkitMaskSize: "100% 100%",
  maskSize: "100% 100%",
} as const;
const GLOW = "[text-shadow:0_0_14px_rgba(150,180,255,0.55),0_0_32px_rgba(110,140,255,0.3)]";

const SENTENCE =
  "Six films in a room of light. Walk through it on your screen, or step inside in VR: with a Meta Quest, Apple Vision Pro, or your phone in a VR holder.";

function GalleryCard() {
  const box = useRef<HTMLDivElement>(null);
  const words = useRef<HTMLDivElement>(null);
  // the words always inside the glass: measured, and made a little smaller if they'd overflow
  useEffect(() => {
    const b = box.current;
    const w = words.current;
    if (!b || !w) return;
    const fit = () => {
      w.style.transform = "";
      const k = Math.min(1, b.clientHeight / w.offsetHeight, b.clientWidth / w.scrollWidth);
      w.style.transform = k < 1 ? `scale(${k})` : "";
    };
    const ro = new ResizeObserver(fit);
    ro.observe(b);
    void document.fonts?.ready.then(fit);
    return () => ro.disconnect();
  }, []);
  return (
    <div className="mx-auto max-w-6xl px-3 sm:px-4 lg:px-6">
      <Link
        to="/gallery"
        aria-label="The gallery: step inside, on your screen or in VR"
        className="@container group relative mx-auto block w-full max-w-[980px] rounded-[3rem] outline-none focus-visible:ring-2 focus-visible:ring-[#6d7bff]/60 focus-visible:ring-offset-4"
        style={{ aspectRatio: "1774 / 887" }}
      >
        <img
          src="/brand/vr-headset.webp"
          alt=""
          loading="lazy"
          width={1774}
          height={887}
          className="absolute inset-0 h-full w-full drop-shadow-[0_28px_36px_rgba(20,30,60,0.18)]"
        />
        {/* the display, behind the glass */}
        <div className="absolute inset-0" style={VISOR}>
          {/* its light, faint, from within: the prism's blue and amber either side */}
          <span
            aria-hidden
            className="absolute inset-0 opacity-80 mix-blend-screen transition-opacity duration-700 group-hover:opacity-100"
            style={{
              background:
                "radial-gradient(42% 38% at 50% 53%, rgba(120,150,255,0.26), transparent 72%), radial-gradient(26% 40% at 28% 55%, rgba(31,44,255,0.2), transparent 70%), radial-gradient(26% 40% at 72% 55%, rgba(255,138,31,0.16), transparent 70%)",
            }}
          />
          <div
            ref={box}
            className="absolute inset-x-[20%] bottom-[21%] top-[31%] flex items-center justify-center text-center text-white mix-blend-screen sm:inset-x-[22%]"
          >
            <div ref={words} className="flex w-full shrink-0 origin-center flex-col items-center">
              <p
                className={`tracked text-[clamp(8px,1.15cqw,11px)] text-white/65 max-sm:text-[2cqw] ${GLOW}`}
              >
                The gallery
              </p>
              <p
                className={`tracked mt-[1.1cqw] whitespace-nowrap max-sm:mt-[1.6cqw] text-[clamp(16px,3.1cqw,30px)] font-light leading-[1.3] max-sm:text-[3.4cqw] ${GLOW}`}
              >
                Step into the light
              </p>
              <span
                aria-hidden
                className="prism-rule mt-[1.5cqw] block w-[8cqw] max-sm:mt-[2.4cqw]"
              />
              <p
                className={`mt-[1.5cqw] text-[clamp(11.5px,1.65cqw,15px)] leading-[1.55] text-white/75 max-sm:hidden ${GLOW}`}
              >
                {SENTENCE}
              </p>
              <span className="mt-[2.2cqw] inline-flex h-[clamp(30px,4.3cqw,42px)] items-center gap-[0.8cqw] rounded-full border border-white/45 bg-white/10 px-[clamp(12px,2cqw,20px)] text-[clamp(11.5px,1.5cqw,14px)] shadow-[0_0_18px_rgba(140,170,255,0.35)] transition group-hover:bg-white group-hover:text-black max-sm:mt-[3cqw] max-sm:h-[7.5cqw] max-sm:px-[3.5cqw] max-sm:text-[2.9cqw]">
                <svg
                  aria-hidden
                  viewBox="0 0 24 24"
                  className="h-[1.3em] w-[1.3em]"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinejoin="round"
                >
                  <path d="M3 8.5c0-1.1.9-2 2-2h14a2 2 0 012 2v6.5a2 2 0 01-2 2h-3.6l-1.7-2.4a2 2 0 00-3.4 0l-1.7 2.4H5a2 2 0 01-2-2z" />
                  <circle cx="8" cy="11.5" r="1.4" />
                  <circle cx="16" cy="11.5" r="1.4" />
                </svg>
                VR view
                <span aria-hidden>→</span>
              </span>
            </div>
          </div>
          {/* the glass's own reflections, back over the display */}
          <img
            src="/brand/vr-headset.webp"
            alt=""
            aria-hidden
            loading="lazy"
            className="pointer-events-none absolute inset-0 h-full w-full opacity-40 mix-blend-screen"
          />
        </div>
      </Link>
      <p className="mx-auto mt-3 max-w-[22rem] text-center text-[13px] leading-relaxed text-black/60 sm:hidden">
        {SENTENCE}
      </p>
    </div>
  );
}
