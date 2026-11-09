import { createFileRoute } from "@tanstack/react-router";
import { SITE } from "@/content/site";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/contact")({
  head: () => seo("Contact"),
  component: Contact,
});

function Contact() {
  return (
    <div className="mx-auto max-w-3xl px-4 pb-24 pt-36 text-center">
      <p className="eyebrow">Get in touch</p>
      <h1 className="tracked mt-4 text-3xl font-light sm:text-5xl">Let us talk</h1>
      <div className="prism-rule mx-auto mt-10 max-w-xs" />
      <a
        href={`mailto:${SITE.email}`}
        className="mt-10 inline-block text-2xl font-light underline underline-offset-8"
      >
        {SITE.email}
      </a>
    </div>
  );
}
