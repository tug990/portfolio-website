# Portfolio

Same stack as the Anugat website, trimmed to the essentials:
TanStack Start (React 19, file-based routing, SSR) · Vite 7 · Tailwind CSS 4 · TypeScript · Nitro (Vercel preset) · Sonner.

## Run

```bash
npm install
npm run dev      # http://localhost:3000
npm run build
```

## Make it yours

| What                      | Where                                  |
| ------------------------- | -------------------------------------- |
| Name, bio line, socials   | `src/content/site.ts`                  |
| Projects (add/remove)     | `src/content/projects.ts`              |
| Colors / fonts            | `src/styles.css` (`:root` and `.dark`) |
| New page                  | add a file in `src/routes/`            |
| Static files (images etc) | `public/`                              |

Each project in `projects.ts` automatically gets a page at `/projects/<slug>`.

## Deploy

`nitro.config.ts` targets Vercel — import the repo in Vercel and deploy (Node 22).
