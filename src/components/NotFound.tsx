import { Link } from "@tanstack/react-router";

/*
  404: one of the gallery's prism doors, shut. Light flickers in the gap as if
  something is on the other side, but this one doesn't open.
*/
const BLUE = "31,44,255";
const CYAN = "43,184,255";
const ORANGE = "255,138,31";

export function NotFound() {
  return (
    <section className="mx-auto flex min-h-[86vh] max-w-6xl flex-col items-center justify-center gap-14 px-4 pb-16 pt-32 sm:px-6 lg:flex-row lg:gap-24">
      {/* The door */}
      <div className="relative" aria-hidden>
        {/* Glow on the wall around it */}
        <span
          className="absolute -inset-x-24 -inset-y-10"
          style={{
            background: `radial-gradient(ellipse 18% 42% at 50% 52%, rgba(255,255,255,.95), transparent 70%), radial-gradient(ellipse 30% 48% at 38% 50%, rgba(${BLUE},.22), transparent 72%), radial-gradient(ellipse 30% 48% at 62% 50%, rgba(${ORANGE},.22), transparent 72%)`,
            animation: "door-breathe 4s ease-in-out infinite",
          }}
        />
        <div className="relative flex h-[360px] w-[180px] shadow-[0_0_0_8px_#141414] sm:h-[440px] sm:w-[220px]">
          {[0, 1].map((side) => (
            <span
              key={side}
              className="relative h-full w-1/2"
              style={{
                background:
                  side === 0
                    ? "linear-gradient(90deg, #070707, #141414)"
                    : "linear-gradient(270deg, #070707, #141414)",
              }}
            >
              <span
                className="absolute"
                style={{
                  left: "13%",
                  right: "13%",
                  top: "7%",
                  bottom: "9%",
                  border: "1px solid rgba(255,255,255,.06)",
                }}
              />
              <span
                className="absolute top-0 h-full w-[8%]"
                style={{
                  [side === 0 ? "right" : "left"]: 0,
                  background: `linear-gradient(${side === 0 ? 90 : 270}deg, transparent, rgba(${side === 0 ? CYAN : ORANGE},.5))`,
                }}
              />
              <span
                className="absolute rounded-[2px]"
                style={{
                  top: "36%",
                  height: "26%",
                  width: "4%",
                  [side === 0 ? "right" : "left"]: "11%",
                  background: "linear-gradient(90deg, #8d8d8d, #e9e9e9 45%, #9d9d9d)",
                }}
              />
            </span>
          ))}
          {/* Light in the gap, flickering */}
          <span
            className="absolute bottom-0 left-1/2 top-0 w-[2px] -translate-x-1/2 bg-white"
            style={{
              boxShadow: "0 0 10px 3px rgba(255,255,255,.95)",
              animation: "seam-flicker 3.2s steps(1, end) infinite",
            }}
          />
        </div>
        {/* Light on the floor */}
        <span
          className="absolute -bottom-10 left-1/2 h-10 w-[140%] -translate-x-1/2"
          style={{
            background: `radial-gradient(ellipse 12% 100% at 50% 0%, rgba(255,255,255,.9), transparent 70%), radial-gradient(ellipse 30% 100% at 40% 0%, rgba(${BLUE},.25), transparent 70%), radial-gradient(ellipse 30% 100% at 60% 0%, rgba(${ORANGE},.25), transparent 70%)`,
          }}
        />
      </div>

      {/* The words */}
      <div className="max-w-sm text-center lg:text-left">
        <p className="text-[clamp(5rem,14vw,9rem)] font-light leading-none tracking-tight">404</p>
        <h1 className="mt-4 text-2xl font-medium tracking-tight">This door doesn’t open.</h1>
        <p className="mt-3 text-sm text-black/55">
          The page you were looking for isn’t here. It may have moved, or the link may be wrong.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-2 lg:justify-start">
          <Link
            to="/"
            className="rounded-md bg-black px-4 py-2.5 text-sm text-white transition-opacity hover:opacity-85"
          >
            Back to the gallery
          </Link>
          <Link
            to="/projects"
            className="rounded-md bg-black/[0.05] px-4 py-2.5 text-sm transition-colors hover:bg-black/10"
          >
            All work →
          </Link>
        </div>
      </div>
    </section>
  );
}
