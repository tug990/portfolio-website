import { useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { CTA, SITE } from "@/content/site";
import { FooterReveal } from "@/components/FooterReveal";

/*
  Footer for every page except the landing and the gallery (after
  exquisite-road-005415.framer.app): the gallery's card (step inside, on a
  screen or in VR); then the picture rising out of the page, the door of
  light in the desert at night, where the cursor grows a green field through
  (FooterReveal), and over it, in its night sky above the door, the call to
  action large and bold, a small label and its links as little white chips
  (Book a call, the email, Work, About, Contact); then the socials and the year.
*/
// (white, to read on the picture's night sky; they lean to a cursor coming near: MagneticLinks)
const CHIP =
  "press inline-flex h-8 items-center gap-1.5 rounded-full bg-white px-3.5 text-[12.5px] text-black transition-colors will-change-transform hover:bg-white/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 focus-visible:ring-offset-2 focus-visible:ring-offset-black";
// their shadow, and a soft white glow that grows as the cursor comes near (--near: 0..1)
const CHIP_GLOW = {
  boxShadow:
    "0 2px 10px -2px rgba(0,0,0,0.35), 0 0 calc(var(--near, 0) * 30px) calc(var(--near, 0) * 2px) rgba(255,255,255,calc(var(--near, 0) * 0.5))",
} as const;

/* How the chips answer a cursor coming near: tune here. */
const MAGNET = {
  reach: 160, // how far away (px) they start to notice it
  pull: 12, // how far (px) they lean towards it, at most
  grow: 0.07, // how much they grow, closest
};

/*
  The footer's links, as chips that answer a cursor coming near: within
  `reach`, each leans towards it (more the closer it is, never more than
  `pull`), grows a little and glows; away, they ease back. Mouse and
  trackpad only (on touch screens they just give as they're tapped); under
  reduced motion they glow but don't move.
*/
function MagneticLinks({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLElement>(null);
  useEffect(() => {
    const root = ref.current;
    if (!root || window.matchMedia("(hover: none)").matches) return;
    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const chips = [...root.querySelectorAll<HTMLElement>("[data-magnetic]")];
    // (their lean is eased here, every frame: no transition on it, or it would trail behind)
    chips.forEach((el) => (el.style.transition = "background-color 0.15s, color 0.15s"));
    const at = chips.map(() => ({ x: 0, y: 0, n: 0 }));
    let pointer: { x: number; y: number } | null = null;
    let raf = 0;
    const frame = () => {
      raf = 0;
      let moving = false;
      chips.forEach((el, i) => {
        const s = at[i];
        let tx = 0;
        let ty = 0;
        let tn = 0;
        if (pointer) {
          // (its centre where it rests, without the lean it has now)
          const r = el.getBoundingClientRect();
          const dx = pointer.x - (r.left + r.width / 2 - s.x);
          const dy = pointer.y - (r.top + r.height / 2 - s.y);
          const d = Math.hypot(dx, dy);
          const k = Math.max(0, 1 - d / MAGNET.reach);
          tn = k * k * (3 - 2 * k);
          if (!still) {
            const lean = Math.min(MAGNET.pull, d * 0.3) * tn;
            tx = (dx / Math.max(d, 1)) * lean;
            ty = (dy / Math.max(d, 1)) * lean;
          }
        }
        s.x += (tx - s.x) * 0.2;
        s.y += (ty - s.y) * 0.2;
        s.n += (tn - s.n) * 0.2;
        if (Math.abs(tx - s.x) + Math.abs(ty - s.y) + Math.abs(tn - s.n) > 0.01) moving = true;
        el.style.transform =
          s.n > 0.002
            ? `translate(${s.x.toFixed(2)}px, ${s.y.toFixed(2)}px) scale(${(1 + MAGNET.grow * s.n).toFixed(4)})`
            : "";
        el.style.setProperty("--near", s.n.toFixed(3));
      });
      if (moving) raf = requestAnimationFrame(frame);
    };
    const onMove = (e: PointerEvent) => {
      const r = root.getBoundingClientRect();
      const near =
        e.clientX > r.left - MAGNET.reach &&
        e.clientX < r.right + MAGNET.reach &&
        e.clientY > r.top - MAGNET.reach &&
        e.clientY < r.bottom + MAGNET.reach;
      if (!near && !pointer) return;
      pointer = near ? { x: e.clientX, y: e.clientY } : null;
      if (!raf) raf = requestAnimationFrame(frame);
    };
    const onLeave = () => {
      pointer = null;
      if (!raf) raf = requestAnimationFrame(frame);
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    document.documentElement.addEventListener("pointerleave", onLeave);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", onMove);
      document.documentElement.removeEventListener("pointerleave", onLeave);
    };
  }, []);
  return (
    <nav
      ref={ref}
      aria-label="Get in touch"
      className="mt-4 flex max-w-xl flex-wrap justify-center gap-2"
    >
      {children}
    </nav>
  );
}

export function SiteFooter() {
  return (
    <footer className="overflow-hidden pt-16 sm:pt-20">
      <GalleryCard />

      {/* the picture, rising out of the page: the desert at night, a green field where the cursor
          passes; over it, in its night sky above the door, the call to action, its label and links */}
      <FooterReveal className="mt-20 h-[min(150vw,720px)] w-full bg-[#07090c] sm:mt-28 sm:h-[min(72vw,920px)]">
        <h2 className="max-w-[15ch] text-balance text-[clamp(2.4rem,6.4vw,5.6rem)] font-semibold leading-[0.95] tracking-[-0.045em] text-white [text-shadow:0_2px_24px_rgba(0,0,0,0.45)]">
          {CTA.title}
        </h2>
        <p className="mt-5 text-[15px] text-white/75 [text-shadow:0_1px_8px_rgba(0,0,0,0.5)]">
          {CTA.label}
        </p>
        <MagneticLinks>
          <a href={CTA.call.href} className={CHIP} style={CHIP_GLOW} data-magnetic>
            {CTA.call.label} <span aria-hidden>→</span>
          </a>
          <a href={`mailto:${SITE.email}`} className={CHIP} style={CHIP_GLOW} data-magnetic>
            {SITE.email}
          </a>
          <Link to="/projects" className={CHIP} style={CHIP_GLOW} data-magnetic>
            Work
          </Link>
          <Link to="/about" className={CHIP} style={CHIP_GLOW} data-magnetic>
            About
          </Link>
          <Link to="/contact" className={CHIP} style={CHIP_GLOW} data-magnetic>
            Contact
          </Link>
        </MagneticLinks>
      </FooterReveal>

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
