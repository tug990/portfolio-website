import { SITE } from "@/content/site";

/*
  A page's meta tags: its title and description, and what a shared link shows (Open Graph, read
  by WhatsApp, Facebook, LinkedIn and others; Twitter's card). `share`: the picture a link to it
  shows (a JPEG under public/, its path and size: WhatsApp doesn't reliably show WebP), its own
  path for its address, and its kind. Without one, the site's own picture (`SHARE_PICTURE`).
*/
/* the site's card, in the films' thumbnail style: 16:9, what we make, for whom, who we've made
   films for, and how to reach us */
// (a new name when the card changes: WhatsApp keeps a picture it has seen at the same address)
export const SHARE_PICTURE = { src: "/brand/share-card.jpg", width: 1200, height: 675 };

export function seo(
  title?: string,
  description = SITE.description,
  share: {
    picture?: { src: string; width: number; height: number };
    path?: string;
    type?: string;
  } = {},
) {
  const full = title ? `${title} | ${SITE.name}` : `${SITE.name} | ${SITE.role}`;
  const pic = share.picture ?? SHARE_PICTURE;
  const image = SITE.url + pic.src; // (a shared link's picture must be a full address)
  return {
    meta: [
      { title: full },
      { name: "description", content: description },
      { property: "og:site_name", content: SITE.name },
      { property: "og:title", content: full },
      { property: "og:description", content: description },
      { property: "og:type", content: share.type ?? "website" },
      ...(share.path ? [{ property: "og:url", content: SITE.url + share.path }] : []),
      { property: "og:image", content: image },
      { property: "og:image:secure_url", content: image },
      { property: "og:image:type", content: "image/jpeg" },
      { property: "og:image:width", content: String(pic.width) },
      { property: "og:image:height", content: String(pic.height) },
      { property: "og:image:alt", content: title ?? SITE.name },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: full },
      { name: "twitter:description", content: description },
      { name: "twitter:image", content: image },
    ],
  };
}
