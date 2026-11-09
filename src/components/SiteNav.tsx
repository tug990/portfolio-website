import { Link, useRouterState } from "@tanstack/react-router";
import { SITE } from "@/content/site";
import { cn } from "@/lib/utils";
import { useStageTone } from "@/lib/stage";

const LINKS = [
  { to: "/projects", label: "Work" },
  { to: "/about", label: "About" },
  { to: "/contact", label: "Contact" },
] as const;

export function SiteNav() {
  // On the home page the bar floats over the black door, then the white gallery.
  const isHome = useRouterState({ select: (s) => s.location.pathname === "/" });
  const tone = useStageTone();
  const onDark = isHome && tone === "dark"; // the home page is light now unless it says otherwise

  return (
    <header className="fixed inset-x-0 top-4 z-30 px-4">
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
          <img src="/brand/mark-transparent.webp" alt="" className="h-7 w-auto" />
          <span className="tracked hidden text-[11px] font-medium sm:inline">{SITE.name}</span>
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
  );
}
