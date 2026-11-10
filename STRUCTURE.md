# STRUCTURE.md

The map of this repo: what the site is, and which file owns what.
**Read this before editing anything. Update it in the same change whenever you
add, move, rename, delete, or change what a file is responsible for.**

Last updated: 2026-11-10

---

## What this is

**Insight Lab**, the portfolio site of a non-fiction studio by Famecast.
Live at **insightlab.media**. Repo: `tug990/portfolio-website`.

The visitor experience, in order:

1. **Landing** (`/`): the Insight Lab logo (two slanted black panels with
   prism light in the gap) on paper white, headline "Where the light comes
   through.", "Scroll to enter".
2. **The way in**: one scroll plays it by itself in about 0.38 s. The page dims
   to warm mauve grey while white light and rainbow rays burst from the logo's
   gap (header and headline stay), then the 3D gallery dissolves in through the
   light and the camera eases to rest.
3. **The gallery**: a warm 3D exhibition room (three.js) with the films on
   screens around the walls, a glass prism on a plinth, a leather bench, cove
   lighting, a skylight, a polished dark floor, and two doors ("All work" /
   "About us") on the wall behind you. Scroll, swipe or use the arrow keys to
   step from film to film.
4. **Case study**: clicking a film flies it off the wall into a full case-study
   sheet over the gallery (URL masked as `/projects/<slug>`). Close returns
   you to the film.

Other pages: `/projects` (all work), `/about`, `/contact`.

## Stack

TanStack Start (React 19, file routes, SSR) · Vite 7 · Tailwind CSS 4 ·
TypeScript · three.js 0.180 · Nitro (Vercel preset) · Sonner (toasts).

## Run, build, deploy

```bash
export PATH="$HOME/.local/node/bin:$PATH"   # Node lives here on this machine
npm run dev        # http://localhost:3000
npm run build      # production build (also what Vercel runs)
npm run preview    # serve the build
npm run lint       # eslint (prettier runs through it)
```

Vercel deploys `main` automatically. `.claude/launch.json` (not committed) has
`portfolio` (dev, :3000) and `portfolio-prod` (preview, :4173).

## Working rules for this repo

- **Only edit the files the task names, or the files this map says own the
  thing being changed.** Don't touch, reformat or "tidy" anything else.
- Branch from an up-to-date `main` for each piece of work; never commit to
  `main` directly. Commit, push and open PRs only when asked.
- `gh` isn't installed: PRs go through the GitHub API with the token from
  `git credential fill`, piped straight into `curl` (never printed).
- Never commit `.claude/`.
- Temporary debug hooks (`window.__journey`, etc.) must be removed before
  committing.
- After merging, delete the merged branch locally and on GitHub.

---

## File map

### Root

| File | What it does |
| --- | --- |
| `STRUCTURE.md` | This map. Keep it current. |
| `CLAUDE.md` | Standing instructions for Claude in this repo (points here). |
| `README.md` | Short human quick-start: stack, run, "make it yours" table. |
| `package.json` / `package-lock.json` | Dependencies and npm scripts (Node 22). |
| `vite.config.ts` | Vite: TanStack Start, React, Tailwind, tsconfig paths. |
| `nitro.config.ts` | Server build, Vercel preset. |
| `tsconfig.json` | TypeScript; `@/` maps to `src/`. |
| `eslint.config.js`, `.prettierrc` | Lint and formatting rules. |
| `components.json` | shadcn/ui config (only `ui/sonner.tsx` is used). |
| `.gitignore` | Ignores logs, `node_modules`, build output, etc. |

### `public/`: static files

| File | Used by |
| --- | --- |
| `favicon.png` | `routes/__root.tsx` |
| `brand/logo-stacked.webp` | The landing logo artwork (`Gallery.tsx`, `LogoDoor.tsx`) |
| `brand/mark-transparent.webp` | Nav logo (`SiteNav.tsx`), logo inlaid on the prism plinth (`GalleryScene.ts`) |
| `brand/banner.webp`, `brand/hero-door.webp`, `brand/logo-wide.webp`, `brand/mark.webp` | **Unused** (kept as brand assets) |

### `src/`: app shell

| File | What it does |
| --- | --- |
| `router.tsx` | Creates the TanStack router (scroll restoration, not-found, errors). |
| `routeTree.gen.ts` | **Generated** by TanStack from `routes/`. Never edit by hand. |
| `styles.css` | Tailwind 4 theme tokens, fonts, global styles, `.tracked` letter-spacing, keyframes (e.g. `hint-line`), and the rule that hides the header during the way in (`html.journey [data-site-nav]`). |

### `src/routes/`: pages (one file = one URL)

| File | URL | What it does |
| --- | --- | --- |
| `__root.tsx` | all | HTML shell, fonts (Jost, Inter), favicon, `SiteNav`, `SiteFooter`, `Toaster`, `NotFound`. |
| `index.tsx` | `/` | Renders `<Gallery />`; accepts `?work=<slug>` (open a case study over the gallery). |
| `projects.index.tsx` | `/projects` | All work: a grid of posters (stand-in shapes until real stills). |
| `projects.$slug.tsx` | `/projects/<slug>` | A case study on its own page (`ProjectSheet`). The gallery masks its sheet to this URL. |
| `about.tsx` | `/about` | About page, built from `AboutSections`. |
| `contact.tsx` | `/contact` | Contact page. |

### `src/content/`: edit copy and projects here

| File | What it holds |
| --- | --- |
| `site.ts` | Site name, tagline, description, socials, contact, About page copy (headline, intro, expertise, numbers…). |
| `projects.ts` | The `Project` type and the `PROJECTS` list: title, slug, year, format, tags, video/poster, `youtube` (a YouTube link: plays on the film's wall screen and in its case study), story, stills, quote, credits. `getProject`, `nextProject`. Add a project here and it appears in the gallery, on `/projects` and at `/projects/<slug>`. |

### `src/lib/`: small helpers

| File | What it does |
| --- | --- |
| `seo.ts` | `seo(title, description)`: page meta tags. |
| `youtube.ts` | YouTube helpers shared by the case-study player and the wall screens: `youtubeId` (id from a link), `youtubeCover`, `YT_HOST` (youtube-nocookie.com), `ytPlayerVars` (muted, no controls), `keepLooping` (restarts just before the end, so YouTube's own loop icons never show), `loadYouTubeApi` and the `YTPlayer` type. |
| `stage.ts` | `setStageTone` / `useStageTone`: tells the nav and footer whether the page behind them is light or dark. |
| `utils.ts` | `cn()`: Tailwind class merging. |

### `src/components/`: site UI

| File | What it does |
| --- | --- |
| `Gallery.tsx` | **The home page experience and its controller.** Holds the landing (`IntroDoor`: logo canvas, headline, hint), the way in (scroll progress `p` 0→1, timing constants at the top: `WAKE`, `AUTO_SPEED`, `ROOM_IN`, `SETTLE_S`, `DOLLY`, `GLOW`…), the frame loop (camera pose, exposure, which films play), stepping between stops (wheel, swipe, keys; one scroll gesture = one stop, trackpad momentum ignored, `MIN_STEP_GAP` between steps; each step is a Hermite glide that carries the current speed when a new step arrives mid-glide), clicking a film (walk up, open the case-study sheet) or a door, saving your place in `sessionStorage`, and the accessible list of works for keyboards and screen readers. `USE_TUNNEL` switches the parked prism corridor on or off. |
| `LogoDoor.tsx` | The landing logo drawn live in a WebGL shader (`LOGO` geometry, `LogoDoorCanvas`, `draw(scale, focus, flood, wake)`). `uWake` is the scroll-triggered light burst (mauve page, rainbow rays). `uFlood` is an older full-screen prism flood (unused while the way in is wake-then-gallery). **The logo at rest must not change.** |
| `SiteNav.tsx` | Header bar: logo, Work / About / Contact. Carries `data-site-nav` so CSS can hide it during the way in. |
| `SiteFooter.tsx` | Footer on every page except the gallery: call to action, studio name in huge type under lights that switch on as it scrolls in. |
| `AboutSections.tsx` | About page sections: hanging headline, pinned expertise, rolling numbers, etc. Content from `content/site.ts`. |
| `NotFound.tsx` | 404 page. |
| `Poster.tsx` | Stand-in poster artwork for projects without an image. |
| `ProjectCard.tsx` | Editorial list row (year, title, tags). **Unused.** |
| `ui/sonner.tsx` | Toast container (shadcn wrapper). |

### `src/components/work/`: case studies

| File | What it does |
| --- | --- |
| `ProjectSheet.tsx` | The sheet that opens over the gallery: the film flies from its wall position into place (FLIP), paper fades up, close / Escape / Back fade it away. |
| `CaseStudy.tsx` | Case-study layout (after the reference site minimaze-light): title, meta, story with "Read the whole story", stills reel, quote, credits, "Next film" poster. Wide (two columns) and narrow layouts. |
| `FilmPlayer.tsx` | The film at the top of a case study: a YouTube video (IFrame API via `lib/youtube.ts`, behind the same controls), a video file, or a stand-in animated film, with an 8-frame filmstrip and playhead. |

### `src/components/gallery3d/`: the 3D gallery (three.js)

| File | What it does |
| --- | --- |
| `GalleryScene.ts` | **The room.** Renderer, camera, post-processing (render → half-res GTAO → bloom → film/vignette shader with optional colour fringe and flash → output, Neutral tone mapping), the architecture (microcement walls, ceiling, dark marble floor with soft reflection, open passages with glimpse films, skylight, cove lighting, light lines at the wall feet), the screens with labels (a film with a `youtube` link and no `trailer` gets a live YouTube player laid over its screen by the CSS3D renderer: `addWallYouTube`, loaded in `playNear`, lined up each frame in `render`), the exhibition set, the two doors on the entrance wall. Exposes `layout` (stops and camera path), `setPose`, `setExposure`, `setDoor`, `playNear`, `pick`, `screenRect`, `workCentre`, `render`, plus the journey hosting API (`addJourney`, `showEntrance`, `setJourneyPost`, `galleryFov`). `ROOM` sets the room's size. |
| `warmset.ts` | The exhibition set pieces and finishes: `microcement` wall shader, `landscapeTexture`, `addCoveLighting`, `addPrismPlinth` (glass pyramid, logo, rainbows), `addBench`, `addWallTitle` (the "INSIGHT LAB / A non-fiction visual storytelling studio" lockup, centred above the far wall's two films; placed in `GalleryScene.addExhibition`), `addFramedPicture`, `addFloorReflection` / `sizeFloorReflection`. |
| `marble.ts` | `marbleFloorMaterial()`: procedural polished stone slabs. |
| `textures.ts` | Canvas-drawn textures: `skylightTexture`, `wallWashTexture`, `poolTexture`, `doorLightTexture`, `leafTextures` (door leaves), `textTexture` (labels, signs). |
| `PrismTunnel.ts` | **Parked** (`USE_TUNNEL = false`). The prism glass corridor in front of the gallery's entrance, built in the gallery's own scene: logo doors in a mauve facade, prism glass walls, slim glowing frames, a reflective floor, a light ribbon, exit glass, and one spline camera path with keyframed timing. Turn it on in `Gallery.tsx`. |

---

## Where to change common things

| To change… | Edit |
| --- | --- |
| Copy, socials, About text | `src/content/site.ts` |
| Add / edit a project, or its film / YouTube link | `src/content/projects.ts` |
| Speed and feel of the way in | constants at the top of `src/components/Gallery.tsx` |
| The light burst look | `uWake` block in `src/components/LogoDoor.tsx` |
| Room architecture, lights, post-processing | `src/components/gallery3d/GalleryScene.ts` |
| Prism plinth, bench, cove light, wall finish | `src/components/gallery3d/warmset.ts` |
| Floor stone | `src/components/gallery3d/marble.ts` |
| Case-study layout | `src/components/work/CaseStudy.tsx` |
| Case-study open/close animation | `src/components/work/ProjectSheet.tsx` |
| Header | `src/components/SiteNav.tsx` |
| Colours, fonts, global CSS | `src/styles.css` |
| A new page | a new file in `src/routes/` (then add it to this map) |
