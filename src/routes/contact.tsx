import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { ContactHero } from "@/components/ContactHero";
import { TestimonialDrawer } from "@/components/TestimonialDrawer";
import { ABOUT_PERSPECTIVES, CONTACT_PAGE, SITE } from "@/content/site";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/contact")({
  head: () => seo("Contact"),
  component: Contact,
});

/*
  The Contact page: the hero (the door of light in the sea, "Get in touch /
  Let us talk", the email and phone: components/ContactHero.tsx), then the
  form, then what people say (the drawer of folders:
  components/TestimonialDrawer.tsx), then the footer.
*/
function Contact() {
  return (
    <>
      <ContactHero />
      <ContactForm />
      <TestimonialDrawer />
    </>
  );
}

/*
  The form: name, email, organisation, who you are (the About page's
  perspectives), and your message. Sending opens the visitor's own email app
  with it all written out to SITE.email (the site has no server to send
  from); then a line says so.
*/
const LABEL = "tracked mb-2 block text-[10px] text-black/55";
const FIELD =
  "w-full rounded-xl border border-black/10 bg-white px-4 text-[15px] text-black outline-none transition placeholder:text-black/30 focus:border-[#6d7bff]/60 focus:ring-4 focus:ring-[#6d7bff]/10";

function ContactForm() {
  const [sent, setSent] = useState(false);
  const send = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const get = (k: string) => String(f.get(k) ?? "").trim();
    const org = get("organisation");
    const who = get("who");
    const lines = [
      `Name: ${get("name")}`,
      `Email: ${get("email")}`,
      ...(org ? [`Organisation: ${org}`] : []),
      ...(who ? [`I am: ${who}`] : []),
      "",
      get("message"),
    ];
    const subject = `A film${org ? ` for ${org}` : ""}`;
    window.location.href = `mailto:${SITE.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(lines.join("\n"))}`;
    setSent(true);
  };

  return (
    <section id="write" className="mx-auto max-w-2xl scroll-mt-24 px-4 py-20 sm:px-6 sm:py-28">
      <p className="eyebrow text-center">{CONTACT_PAGE.formEyebrow}</p>
      <h2 className="tracked mt-4 text-balance text-center text-2xl font-light sm:text-[30px]">
        {CONTACT_PAGE.formTitle}
      </h2>
      <div className="prism-rule mx-auto mt-8 max-w-[10rem]" />
      <p className="mx-auto mt-6 max-w-md text-center text-[15px] leading-relaxed text-black/60">
        {CONTACT_PAGE.formIntro}
      </p>

      <form onSubmit={send} className="mt-12 grid gap-5 sm:grid-cols-2">
        <label className="block">
          <span className={LABEL}>Name</span>
          <input name="name" required autoComplete="name" className={`${FIELD} h-12`} />
        </label>
        <label className="block">
          <span className={LABEL}>Email</span>
          <input
            name="email"
            type="email"
            required
            autoComplete="email"
            className={`${FIELD} h-12`}
          />
        </label>
        <label className="block">
          <span className={LABEL}>
            Organisation{" "}
            <span className="normal-case tracking-normal text-black/35">(optional)</span>
          </span>
          <input name="organisation" autoComplete="organization" className={`${FIELD} h-12`} />
        </label>
        <label className="block">
          <span className={LABEL}>You are</span>
          <select
            name="who"
            defaultValue=""
            className={`${FIELD} h-12 appearance-none bg-[url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23666' stroke-width='1.8' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M6.5 9.5l5.5 5.5 5.5-5.5'/%3E%3C/svg%3E")] bg-[length:18px] bg-[right_14px_center] bg-no-repeat pr-10`}
          >
            <option value="">Choose one</option>
            {ABOUT_PERSPECTIVES.map((p) => (
              <option key={p.id} value={p.label}>
                {p.label}
              </option>
            ))}
            <option value="Someone else">Someone else</option>
          </select>
        </label>
        <label className="block sm:col-span-2">
          <span className={LABEL}>Your message</span>
          <textarea
            name="message"
            required
            rows={6}
            placeholder="The story you'd like to tell…"
            className={`${FIELD} min-h-[160px] resize-y py-3 leading-relaxed`}
          />
        </label>
        <div className="flex flex-col items-center gap-4 sm:col-span-2">
          <button
            type="submit"
            className="press inline-flex h-12 items-center gap-2 rounded-full bg-[#0a0a0a] px-8 text-[14px] font-medium text-white transition hover:bg-black/80 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#6d7bff]/30"
          >
            Send <span aria-hidden>→</span>
          </button>
          <p aria-live="polite" className="min-h-[1.5rem] text-center text-[14px] text-black/60">
            {sent ? CONTACT_PAGE.sent : ""}
          </p>
        </div>
      </form>
    </section>
  );
}
