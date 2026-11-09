import { SITE } from "@/content/site";

export function SiteFooter() {
  return (
    <footer className="bg-muted">
      <div className="prism-rule" />
      <div className="mx-auto flex max-w-5xl flex-col items-center gap-6 px-4 py-14 text-center">
        <img
          src="/brand/logo-wide.webp"
          alt={`${SITE.name}, ${SITE.role}`}
          className="w-full max-w-md mix-blend-multiply"
        />
        <a href={`mailto:${SITE.email}`} className="tracked text-[11px] hover:underline">
          {SITE.email}
        </a>
        <ul className="flex gap-6">
          {SITE.socials.map((s) => (
            <li key={s.href}>
              <a
                href={s.href}
                target="_blank"
                rel="noreferrer"
                className="tracked text-[11px] text-neutral-500 hover:text-black"
              >
                {s.label}
              </a>
            </li>
          ))}
        </ul>
        <p className="text-xs text-neutral-500">
          © {new Date().getFullYear()} {SITE.name}
        </p>
      </div>
    </footer>
  );
}
