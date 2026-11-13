import { useNavigate } from "@tanstack/react-router";
import { ABOUT_PERSPECTIVES, type PerspectiveId } from "@/content/site";
import { GLASS_PANEL, MENU_IN, useMenu } from "@/lib/menu";
import { throughLight } from "@/lib/perspective";
import { cn } from "@/lib/utils";

/*
  The About page's perspectives, as the rest of the site needs them: their
  icons, and the switcher for changing perspective from inside a world (in
  the header on large screens, SiteNav; in the world's sticky bar on phones,
  AboutSections). Kept apart from the About page itself so the header can use
  it without loading the page.
*/

/* Line icons: a hand holding a heart, a briefcase, a columned building, towers, a mortarboard; and the door */
const PERSPECTIVE_ICONS: Record<PerspectiveId, string> = {
  ngo: "M12 4.6c-.9-1.4-3.4-1.3-3.4.7 0 1.5 1.9 2.8 3.4 3.9 1.5-1.1 3.4-2.4 3.4-3.9 0-2-2.5-2.1-3.4-.7z M3 14.5h2.8l2.7 1.9h3.9a1.3 1.3 0 010 2.6H9.6 M12.6 18.8l5.1-2.3a1.4 1.4 0 011.5 2.3L14 22H8.2l-2.4-1.5H3",
  corporate:
    "M4 8h16v11H4z M9 8V6.2A1.2 1.2 0 0110.2 5h3.6A1.2 1.2 0 0115 6.2V8 M4 12.5h16 M11 12.5v1.6h2v-1.6",
  government:
    "M3.5 9.5L12 5l8.5 4.5 M4.5 9.5h15 M6.5 11v5.5 M10.2 11v5.5 M13.8 11v5.5 M17.5 11v5.5 M4.5 17.5h15 M3 20h18",
  "real-estate":
    "M4.5 20V9.5l4.5-1.8V20 M9 20V5.2l6 2V20 M15 20v-8.5l4.5 1.3V20 M3 20h18 M11.4 9.5h1.2 M11.4 12.5h1.2 M11.4 15.5h1.2 M6.2 12h1.1 M6.2 15h1.1 M16.8 15h1.1",
  university:
    "M2.5 9.5L12 5l9.5 4.5L12 14z M6.5 11.6v3.9c1.6 1.5 3.6 2.2 5.5 2.2s3.9-.7 5.5-2.2v-3.9 M21.5 9.5v5",
};
const DOOR_ICON = "M7 20V5.5l4.2 2.1V20 M12.8 20V7.2l4.2-1.4V20 M4 20h16";

export function PerspectiveIcon({
  id,
  className,
}: {
  id: PerspectiveId | "door";
  className?: string;
}) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.35}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d={id === "door" ? DOOR_ICON : PERSPECTIVE_ICONS[id]} />
    </svg>
  );
}

/*
  Changing perspective from inside a world. `nav` (the header, large
  screens): "About · NGO" among the links, opening a glass menu under the
  header. `bar` (the world's sticky bar, phones): the icon and name in the
  middle of the bar, the menu across the screen below it. Each lists the
  perspectives (the current one marked with a dot of prism light) and, last,
  All perspectives (back to the door). Choosing goes through a flash of light.
*/
export function PerspectiveSwitch({
  current,
  variant,
}: {
  current: PerspectiveId;
  variant: "nav" | "bar";
}) {
  const m = useMenu();
  const navigate = useNavigate();
  const p = ABOUT_PERSPECTIVES.find((x) => x.id === current)!;
  const go = (id: PerspectiveId | null) => {
    m.choose();
    if (id === current) return;
    throughLight(() =>
      id
        ? navigate({ to: "/about/$perspective", params: { perspective: id } })
        : navigate({ to: "/about" }),
    );
  };
  const nav = variant === "nav";
  const item =
    "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-[14px] text-black/80 outline-none transition hover:bg-white/70 focus-visible:bg-white/80";
  return (
    <div ref={m.root} className={cn("relative", !nav && "flex min-w-0 flex-1 justify-center")}>
      <button
        ref={m.trigger}
        type="button"
        onClick={() => m.setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={m.open}
        aria-label={`Perspective: ${p.label}. Change perspective`}
        className={cn(
          "flex items-center outline-none focus-visible:ring-2 focus-visible:ring-[#6d7bff]/50",
          nav
            ? "tracked gap-1.5 rounded-md text-[11px] text-black"
            : "h-10 min-w-0 max-w-full gap-2 rounded-full px-3 text-[14px] font-medium text-black/85",
        )}
      >
        {nav ? (
          <>
            About <span className="text-black/30">·</span> {p.label}
          </>
        ) : (
          <>
            <PerspectiveIcon id={current} className="h-[18px] w-[18px] shrink-0" />
            <span className="truncate">{p.label}</span>
          </>
        )}
        <svg
          aria-hidden
          viewBox="0 0 24 24"
          className={cn(
            "shrink-0 transition-transform",
            nav ? "h-3 w-3" : "h-4 w-4",
            m.open && "rotate-180",
          )}
          fill="none"
          stroke="currentColor"
          strokeWidth={1.8}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M6.5 9.5l5.5 5.5 5.5-5.5" />
        </svg>
      </button>
      {m.open && (
        <div
          className={cn(
            "z-40 rounded-2xl p-1.5",
            nav
              ? "absolute right-0 top-full mt-5 w-72 origin-top-right"
              : "fixed inset-x-3 top-[calc(env(safe-area-inset-top)+4.25rem)] origin-top",
            GLASS_PANEL,
            MENU_IN,
          )}
        >
          <p className="tracked px-3 pb-1 pt-2 text-[9px] text-black/45">Change perspective</p>
          <ul role="listbox" aria-label="Change perspective">
            {ABOUT_PERSPECTIVES.map((x) => (
              <li key={x.id} role="none">
                <button
                  type="button"
                  role="option"
                  aria-selected={x.id === current}
                  onClick={() => go(x.id)}
                  className={item}
                >
                  <PerspectiveIcon id={x.id} className="h-5 w-5 shrink-0 text-black/75" />
                  <span className="flex-1">{x.label}</span>
                  {x.id === current && (
                    <span
                      aria-hidden
                      className="h-1.5 w-1.5 rounded-full"
                      style={{ background: "var(--prism)" }}
                    />
                  )}
                </button>
              </li>
            ))}
            <li role="none" className="mt-1 border-t border-black/[0.06] pt-1">
              <button
                type="button"
                role="option"
                aria-selected={false}
                onClick={() => go(null)}
                className={cn(item, "text-black/60")}
              >
                <PerspectiveIcon id="door" className="h-5 w-5 shrink-0" />
                <span className="flex-1">All perspectives</span>
              </button>
            </li>
          </ul>
        </div>
      )}
    </div>
  );
}
