import { SITE } from "@/content/site";

export function seo(title?: string, description = SITE.description) {
  const full = title ? `${title} | ${SITE.name}` : `${SITE.name} | ${SITE.role}`;
  return {
    meta: [
      { title: full },
      { name: "description", content: description },
      { property: "og:title", content: full },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
    ],
  };
}
