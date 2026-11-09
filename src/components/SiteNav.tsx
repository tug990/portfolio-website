import { Link } from "@tanstack/react-router";
import { SITE } from "@/content/site";

const LINKS = [
  { to: "/projects", label: "Work" },
  { to: "/about", label: "About" },
  { to: "/contact", label: "Contact" },
] as const;

export function SiteNav() {
  return (
    <header className="fixed inset-x-0 top-4 z-20 px-4">
      <nav className="mx-auto flex h-14 max-w-5xl items-center justify-between rounded-xl border bg-white/80 px-4 shadow-sm backdrop-blur-md">
        <Link to="/" className="flex items-center gap-3" aria-label={SITE.name}>
          <img src="/brand/mark.webp" alt="" className="h-7 w-auto" />
          <span className="tracked hidden text-[11px] font-medium sm:inline">{SITE.name}</span>
        </Link>
        <ul className="flex items-center gap-6">
          {LINKS.map((l) => (
            <li key={l.to}>
              <Link
                to={l.to}
                className="tracked text-[11px] text-neutral-500 transition-colors hover:text-black"
                activeProps={{ className: "text-black" }}
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
