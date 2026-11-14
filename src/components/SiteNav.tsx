import { Link, useRouterState } from "@tanstack/react-router";
import { SITE } from "@/content/site";
import { cn } from "@/lib/utils";
import { useStageTone } from "@/lib/stage";
import { worldOf } from "@/lib/perspective";
import { PerspectiveSwitch } from "@/components/PerspectiveMenu";

const LINKS = [
  { to: "/projects", label: "Work" },
  { to: "/about", label: "About" },
  { to: "/contact", label: "Contact" },
] as const;

/* Line icons for the phone's bar (Home, the landing, is the mark itself) */
const ICONS: Record<(typeof LINKS)[number]["to"], string> = {
  "/projects": "M4 6.5h16v11H4zM10 9.5v5l4.2-2.5z",
  "/about": "M12 21a9 9 0 100-18 9 9 0 000 18zM12 11v5.5M12 7.5v.5",
  "/contact": "M3.5 6.5h17v11h-17zM4 7l8 6 8-6",
};

/*
  The site's header. Tablets and up: a bar along the top (the logo, to the
  landing; Work / About / Contact). Phones: a floating glass bar of icons
  along the bottom, as an app's tab bar (Home: the landing; Work; About;
  Contact); the room it takes is --dock (styles.css), so pages keep room for
  it and the mini player sits above it. In a perspective's world
  (/about/<perspective>) the top bar's About becomes "About · NGO", a menu to
  change perspective (PerspectiveSwitch; phones change it from the world's own
  sticky bar). (The gallery is reached from its card
  above every footer, "Step into the light".) Both carry `data-site-nav`, so
  the landing's way in can hide them.
*/
export function SiteNav() {
  // On the home page the bar floats over the black door, then the white gallery.
  const path = useRouterState({ select: (s) => s.location.pathname });
  // the landing and the gallery: full-screen stages (light, or dark when they say so)
  const isHome = path === "/" || path === "/gallery";
  const tone = useStageTone();
  // in a perspective's world (/about/<perspective>), About becomes the menu to change it
  const world = worldOf(path);
  const onDark = isHome && tone === "dark"; // the home page is light now unless it says otherwise

  return (
    <>
      <header
        data-site-nav
        // clear of a phone's notch when it opens as an app (viewport-fit=cover)
        className="fixed inset-x-0 top-[calc(1rem+env(safe-area-inset-top))] z-30 hidden px-4 sm:block"
      >
        <nav
          className={cn(
            "relative isolate mx-auto flex h-14 max-w-5xl items-center justify-between rounded-xl border px-4 transition-colors",
            onDark
              ? "border-white/10 bg-black/40 text-white"
              : isHome
                ? "border-black/5 bg-white/80 text-black"
                : "border-black/5 bg-white/50 text-black",
          )}
        >
          {/*
            The frosted blur, as a layer behind the bar's contents (on the bar
            itself, a menu opening from it, the perspective menu, couldn't
            frost what's behind it). No blur over the 3D gallery: on phones,
            blurring a 3D scene every frame is expensive; a more solid bar
            reads just as well there.
          */}
          {!isHome && (
            <span aria-hidden className="absolute inset-0 -z-10 rounded-xl backdrop-blur-md" />
          )}
          <Link to="/" className="flex items-center gap-3" aria-label={SITE.name}>
            {/* a small copy (1.5 KB) of brand/mark-transparent.webp, which the gallery uses large */}
            <img src="/brand/mark-nav.webp" alt="" width={45} height={84} className="h-7 w-auto" />
            <span className="tracked text-[11px] font-medium">{SITE.name}</span>
          </Link>
          <ul className="flex items-center gap-6">
            {LINKS.map((l) =>
              l.to === "/about" && world ? (
                <li key={l.to}>
                  <PerspectiveSwitch current={world} variant="nav" />
                </li>
              ) : (
                <li key={l.to}>
                  <Link
                    to={l.to}
                    className={cn(
                      "tracked text-[11px] transition-colors",
                      onDark
                        ? "text-white/55 hover:text-white"
                        : "text-neutral-500 hover:text-black",
                    )}
                    activeProps={{ className: onDark ? "!text-white" : "!text-black" }}
                  >
                    {l.label}
                  </Link>
                </li>
              ),
            )}
          </ul>
        </nav>
      </header>

      {/*
        phones: the header along the bottom, a floating capsule of glass as
        iPhone's (Liquid Glass), clear of the screen's edges and the home
        indicator. Built in layers, so what's behind stays vivid: a clear,
        lightly tinted frost (`GLASS.frost`); light across the glass, brighter
        at the top and glowing at the foot (`GLASS.sheen`); a rim catching the
        light, strongest top-left and bottom-right (`GLASS.rim`), with fine
        highlights inside its edge; a soft shadow beneath. The page you're on
        sits in a small glass lens of its own (TabLink).
      */}
      <nav
        data-site-nav
        aria-label={SITE.name}
        className={cn(
          "fixed inset-x-3 bottom-[calc(env(safe-area-inset-bottom)+10px)] z-[60] isolate flex h-[60px] rounded-full px-1.5 sm:hidden",
          "shadow-[0_16px_36px_-14px_rgba(0,0,0,0.34),0_3px_10px_-4px_rgba(0,0,0,0.12)]",
          onDark ? "text-white" : "text-black",
        )}
      >
        {/* the frost: what's behind, blurred and a little richer, through a faint tint */}
        <span
          aria-hidden
          className={cn(
            "pointer-events-none absolute inset-0 -z-10 rounded-[inherit] backdrop-saturate-[1.9]",
            // lighter blur over the 3D gallery (cheaper on a phone)
            isHome ? "backdrop-blur-md" : "backdrop-blur-[18px]",
            onDark
              ? "bg-black/30 backdrop-brightness-[0.9]"
              : "bg-white/[0.22] backdrop-brightness-[1.08]",
          )}
        />
        {/* light across the glass: brighter at the top, a glow at the foot */}
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-10 rounded-[inherit]"
          style={{ background: onDark ? GLASS.sheenDark : GLASS.sheen }}
        />
        {/* the rim: light catching the edge (top-left, bottom-right), and fine highlights inside it */}
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0 rounded-[inherit] p-px"
          style={{ ...GLASS.rimMask, background: onDark ? GLASS.rimDark : GLASS.rim }}
        />
        <span
          aria-hidden
          className={cn(
            "pointer-events-none absolute inset-0 rounded-[inherit]",
            onDark
              ? "shadow-[inset_0_1px_0_rgba(255,255,255,0.28),inset_0_-1px_0_rgba(255,255,255,0.08),inset_0_8px_14px_-10px_rgba(255,255,255,0.25)]"
              : "shadow-[inset_0_1px_0_rgba(255,255,255,0.95),inset_0_-1px_0_rgba(255,255,255,0.4),inset_0_10px_16px_-12px_rgba(255,255,255,0.7),inset_0_-10px_16px_-12px_rgba(255,255,255,0.45)]",
          )}
        />
        <TabLink to="/" label="Home" on={path === "/"} onDark={onDark}>
          <img
            src="/brand/mark-nav.webp"
            alt=""
            width={45}
            height={84}
            className={cn("h-[22px] w-auto transition", path !== "/" && "opacity-60 grayscale")}
          />
        </TabLink>
        {LINKS.map((l) => (
          <TabLink key={l.to} to={l.to} label={l.label} on={path.startsWith(l.to)} onDark={onDark}>
            <svg
              aria-hidden
              viewBox="0 0 24 24"
              className="h-[22px] w-[22px]"
              fill="none"
              stroke="currentColor"
              strokeWidth={path.startsWith(l.to) ? 2 : 1.6}
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d={ICONS[l.to]} />
            </svg>
          </TabLink>
        ))}
      </nav>
    </>
  );
}

/*
  The phone bar's glass (as iPhone's): the light across it, and its rim (a
  gradient border, drawn with a mask so only the 1 px edge shows).
*/
const GLASS = {
  sheen:
    "linear-gradient(180deg, rgba(255,255,255,0.42) 0%, rgba(255,255,255,0.12) 38%, rgba(255,255,255,0.04) 62%, rgba(255,255,255,0.2) 100%)",
  sheenDark:
    "linear-gradient(180deg, rgba(255,255,255,0.14) 0%, rgba(255,255,255,0.03) 40%, rgba(255,255,255,0) 62%, rgba(255,255,255,0.06) 100%)",
  rim: "linear-gradient(135deg, rgba(255,255,255,1) 0%, rgba(255,255,255,0.35) 28%, rgba(255,255,255,0.12) 55%, rgba(255,255,255,0.75) 100%)",
  rimDark:
    "linear-gradient(135deg, rgba(255,255,255,0.5) 0%, rgba(255,255,255,0.12) 30%, rgba(255,255,255,0.05) 55%, rgba(255,255,255,0.3) 100%)",
  rimMask: {
    WebkitMask: "linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)",
    WebkitMaskComposite: "xor",
    mask: "linear-gradient(#000 0 0) content-box exclude, linear-gradient(#000 0 0)",
  },
} as const;

function TabLink({
  to,
  label,
  on,
  onDark,
  children,
}: {
  to: "/" | (typeof LINKS)[number]["to"];
  label: string;
  on: boolean;
  onDark: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      to={to}
      aria-current={on ? "page" : undefined}
      className={cn(
        "press relative flex flex-1 flex-col items-center justify-center gap-1 transition-colors",
        on
          ? onDark
            ? "text-white"
            : "text-black"
          : onDark
            ? "text-white/60"
            : "text-black/55 [text-shadow:0_1px_0_rgba(255,255,255,0.35)]",
      )}
    >
      {/* the page you're on: a small lens of glass inside the bar */}
      {on && (
        <span
          aria-hidden
          className={cn(
            "pointer-events-none absolute inset-x-1 inset-y-[5px] -z-10 rounded-full",
            onDark
              ? "bg-white/[0.12] shadow-[inset_0_1px_0_rgba(255,255,255,0.3),inset_0_0_0_0.5px_rgba(255,255,255,0.18)]"
              : "bg-white/[0.42] shadow-[inset_0_1px_0_rgba(255,255,255,1),inset_0_-1px_0_rgba(255,255,255,0.5),inset_0_0_0_0.5px_rgba(255,255,255,0.7),0_2px_8px_-3px_rgba(0,0,0,0.12)]",
          )}
        />
      )}
      {children}
      <span className="tracked text-[8.5px]">{label}</span>
      {/* a line of prism light under the page you're on */}
      <span
        aria-hidden
        className={cn(
          "h-[2px] w-5 rounded-full transition-opacity",
          on ? "opacity-100" : "opacity-0",
        )}
        style={{ background: "var(--prism)" }}
      />
    </Link>
  );
}
