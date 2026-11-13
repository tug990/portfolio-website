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
            <Link to="/gallery" className="hover:underline">
              Gallery
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
  The gallery, as a way in: a door of prism light in the dark
  (brand/gallery-door.webp, 4 KB), "The gallery / Step into the light", and
  VR view, which opens /gallery (a 3D room: walk through it on a screen, or
  step inside with a headset, or a phone in a VR holder).
*/
function GalleryCard() {
  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6">
      <Link
        to="/gallery"
        aria-label="The gallery: step inside, on your screen or in VR"
        className="press group relative block overflow-hidden rounded-[28px] bg-black text-white shadow-[0_30px_70px_-30px_rgba(0,0,0,0.6)]"
      >
        <img
          src="/brand/gallery-door.webp"
          alt=""
          loading="lazy"
          width={900}
          height={558}
          className="absolute inset-y-0 right-0 h-full w-full object-cover object-[50%_60%] opacity-90 transition-transform duration-[1.4s] ease-out group-hover:scale-[1.04] sm:w-[70%]"
        />
        <span
          aria-hidden
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(90deg, #000 0%, rgba(0,0,0,0.85) 30%, rgba(0,0,0,0.2) 70%, transparent)",
          }}
        />
        <div className="relative flex min-h-[300px] max-w-[560px] flex-col justify-center px-6 py-10 sm:min-h-[340px] sm:px-12">
          <p className="tracked text-[10.5px] text-white/60">The gallery</p>
          <p className="tracked mt-3 text-[22px] font-light leading-[1.3] sm:text-[30px]">
            Step into the light
          </p>
          <span aria-hidden className="prism-rule mt-4 block w-24" />
          <p className="mt-4 max-w-[420px] text-[14px] leading-relaxed text-white/70 sm:text-[15px]">
            Six films in a room of light. Walk through it on your screen, or step inside in VR: with
            a Meta Quest, Apple Vision Pro, or your phone in a VR holder.
          </p>
          <span className="mt-6 inline-flex w-fit items-center gap-2 rounded-full border border-white/40 bg-white/15 px-5 py-2.5 text-[14px] backdrop-blur-md transition group-hover:bg-white group-hover:text-black">
            <svg
              aria-hidden
              viewBox="0 0 24 24"
              className="h-[18px] w-[18px]"
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
      </Link>
    </div>
  );
}
