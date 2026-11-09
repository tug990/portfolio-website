import { useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { CTA, SITE } from "@/content/site";

/*
  Footer for every page except the gallery: a call to action, then the studio
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
    <footer className="overflow-hidden pt-24">
      <div className="mx-auto flex max-w-6xl flex-col gap-10 px-4 sm:px-6 lg:flex-row lg:items-end lg:justify-between">
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
