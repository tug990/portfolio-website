import { Link, useRouterState } from "@tanstack/react-router";
import { SITE } from "@/content/site";
import { cn } from "@/lib/utils";
import { useStageTone } from "@/lib/stage";

const LINKS = [
  { to: "/projects", label: "Work" },
  { to: "/about", label: "About" },
  { to: "/contact", label: "Contact" },
] as const;

/* Line icons for the phone's bar (Home is the mark itself) */
const ICONS: Record<(typeof LINKS)[number]["to"], string> = {
  "/projects": "M4 6.5h16v11H4zM10 9.5v5l4.2-2.5z",
  "/about": "M12 21a9 9 0 100-18 9 9 0 000 18zM12 11v5.5M12 7.5v.5",
  "/contact": "M3.5 6.5h17v11h-17zM4 7l8 6 8-6",
};

/*
  The site's header. Tablets and up: a bar along the top (logo, Work / About /
  Contact). Phones: a bar of icons along the bottom, as an app's tab bar
  (Home, Work, About, Contact); its height is --dock (styles.css), so pages
  keep room for it and the mini player sits above it. Both carry
  `data-site-nav`, so the way into the gallery can hide them.
*/
export function SiteNav() {
  // On the home page the bar floats over the black door, then the white gallery.
  const path = useRouterState({ select: (s) => s.location.pathname });
  const isHome = path === "/";
  const tone = useStageTone();
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
            "mx-auto flex h-14 max-w-5xl items-center justify-between rounded-xl border px-4 transition-colors",
            // No background blur over the 3D gallery: on phones, blurring a 3D scene
            // every frame is expensive. A more solid bar reads just as well there.
            isHome ? "" : "backdrop-blur-md",
            onDark
              ? "border-white/10 bg-black/40 text-white"
              : isHome
                ? "border-black/5 bg-white/80 text-black"
                : "border-black/5 bg-white/50 text-black",
          )}
        >
          <Link to="/" className="flex items-center gap-3" aria-label={SITE.name}>
            {/* a small copy (1.5 KB) of brand/mark-transparent.webp, which the gallery uses large */}
            <img src="/brand/mark-nav.webp" alt="" width={45} height={84} className="h-7 w-auto" />
            <span className="tracked text-[11px] font-medium">{SITE.name}</span>
          </Link>
          <ul className="flex items-center gap-6">
            {LINKS.map((l) => (
              <li key={l.to}>
                <Link
                  to={l.to}
                  className={cn(
                    "tracked text-[11px] transition-colors",
                    onDark ? "text-white/55 hover:text-white" : "text-neutral-500 hover:text-black",
                  )}
                  activeProps={{ className: onDark ? "!text-white" : "!text-black" }}
                >
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </header>

      {/*
        phones: the header along the bottom, a floating bar of frosted glass
        with round corners (the same glass as the site's menus), clear of the
        screen's edges and the home indicator
      */}
      <nav
        data-site-nav
        aria-label={SITE.name}
        className={cn(
          "fixed inset-x-3 bottom-[calc(env(safe-area-inset-bottom)+10px)] z-[60] flex h-[60px] overflow-hidden rounded-[26px] border px-1 ring-1 backdrop-saturate-[1.8] sm:hidden",
          "shadow-[0_18px_40px_-14px_rgba(0,0,0,0.35),0_2px_6px_rgba(0,0,0,0.06),inset_0_1px_0_rgba(255,255,255,0.8)]",
          // lighter blur over the 3D gallery (cheaper on a phone)
          isHome ? "backdrop-blur-md" : "backdrop-blur-2xl",
          onDark
            ? "border-white/15 bg-black/45 text-white ring-white/5"
            : "border-white/70 bg-white/60 text-black ring-black/[0.05]",
        )}
      >
        <TabLink to="/" label="Home" on={isHome} onDark={onDark}>
          <img
            src="/brand/mark-nav.webp"
            alt=""
            width={45}
            height={84}
            className={cn("h-[22px] w-auto transition", !isHome && "opacity-60 grayscale")}
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
        "press flex flex-1 flex-col items-center justify-center gap-1 transition-colors",
        on ? (onDark ? "text-white" : "text-black") : onDark ? "text-white/55" : "text-neutral-500",
      )}
    >
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
