import { createFileRoute } from "@tanstack/react-router";
import { APPROACH, EXPERTISE, FAQ, HISTORY, SITE } from "@/content/site";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/about")({
  head: () => seo("About"),
  component: About,
});

function About() {
  return (
    <div className="mx-auto max-w-5xl px-4 pb-24 pt-36">
      <section className="text-center">
        <h1 className="tracked text-3xl font-light sm:text-5xl">We tell what is real</h1>
        <p className="mx-auto mt-8 max-w-xl text-lg font-light text-muted-foreground">
          {SITE.name} is {SITE.role.toLowerCase()}. Replace this with a short paragraph about who
          you are and what you make.
        </p>
      </section>

      <section className="mt-28">
        <p className="eyebrow">Where we have been</p>
        <h2 className="mt-2 text-2xl font-light">Work history</h2>
        <div className="prism-rule mt-6" />
        <ol className="border-t">
          {HISTORY.map((h) => (
            <li
              key={`${h.years}-${h.title}`}
              className="grid gap-2 border-b py-6 sm:grid-cols-[10rem_1fr_1fr]"
            >
              <span className="text-sm text-muted-foreground">{h.years}</span>
              <span className="text-xl font-light">{h.title}</span>
              <span className="text-muted-foreground">{h.place}</span>
            </li>
          ))}
        </ol>
      </section>

      <section className="mt-28">
        <p className="eyebrow">What we bring to the table</p>
        <h2 className="mt-2 text-2xl font-light">Expertise</h2>
        <div className="prism-rule mt-6" />
        <ol className="border-t">
          {EXPERTISE.map((e, i) => (
            <li key={e.title} className="grid gap-2 border-b py-6 sm:grid-cols-[4rem_1fr_1.5fr]">
              <span className="text-sm text-muted-foreground">0{i + 1}</span>
              <span className="text-xl font-light">{e.title}</span>
              <span className="text-muted-foreground">{e.text}</span>
            </li>
          ))}
        </ol>
      </section>

      <section className="mt-28">
        <p className="eyebrow">How we think</p>
        <h2 className="mt-2 text-2xl font-light">Our approach</h2>
        <div className="mt-8 grid gap-6 sm:grid-cols-3">
          {APPROACH.map((a) => (
            <div key={a.to} className="rounded-xl border bg-white p-6">
              <p className="text-sm text-muted-foreground line-through">{a.from}</p>
              <p className="mt-1 text-xl font-light">{a.to}</p>
              <p className="mt-4 text-sm text-muted-foreground">{a.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-28">
        <p className="eyebrow">What people ask before they write</p>
        <h2 className="mt-2 text-2xl font-light">Frequently asked questions</h2>
        <div className="mt-6 border-t">
          {FAQ.map((f) => (
            <details key={f.q} className="group border-b py-5">
              <summary className="flex cursor-pointer list-none items-center justify-between text-lg font-light">
                {f.q}
                <span className="text-xl transition-transform group-open:rotate-45">+</span>
              </summary>
              <p className="mt-3 max-w-2xl text-muted-foreground">{f.a}</p>
            </details>
          ))}
        </div>
      </section>
    </div>
  );
}
