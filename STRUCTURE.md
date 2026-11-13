# STRUCTURE.md

The map of this repo: what the site is, and which file owns what.
**Read this before editing anything. Update it in the same change whenever you
add, move, rename, delete, or change what a file is responsible for.**

Last updated: 2026-11-13

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
   screens around the walls, a frosted glass prism on a plinth ahead of you, cove
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
| `brand/work-header-1400.webp`, `brand/work-header-2000.webp`, `brand/work-header-phone.webp` | The Work page's header picture (`projects.index.tsx` `HeaderPicture`): 1400 / 2000 px for wider screens (47 / 74 KB), and for phones a full-resolution crop of the prism side (45 KB); was 200 KB |
| `clients/marks/*.webp` | Each client's emblem exactly as on their badge (cut out, background removed; MLINDA and Better World: their whole logo). Used in their glass pill on the Work page (`ClientBadge`) and their card on a film's page (`CaseStudy.tsx`) |
| `brand/logo-stacked.webp` | The landing logo artwork (`Gallery.tsx`, `LogoDoor.tsx`) |
| `brand/mark-transparent.webp` | The logo inlaid on the prism plinth (`GalleryScene.ts`, shown large) |
| `brand/mark-nav.webp` | The header logo (`SiteNav.tsx`): a 1.5 KB copy of the mark at the size it's shown |
| `brand/banner.webp`, `brand/hero-door.webp`, `brand/logo-wide.webp`, `brand/mark.webp` | **Unused** (kept as brand assets) |

### `src/`: app shell

| File | What it does |
| --- | --- |
| `router.tsx` | Creates the TanStack router (scroll restoration, not-found, errors). |
| `routeTree.gen.ts` | **Generated** by TanStack from `routes/`. Never edit by hand. |
| `styles.css` | Tailwind 4 theme tokens, fonts, global styles, `.tracked` letter-spacing, keyframes (e.g. `hint-line`, `prism-glow`: the Work header's breathing glow, still under reduced motion), and the rule that hides the header during the way in (`html.journey [data-site-nav]`). |

### `src/routes/`: pages (one file = one URL)

| File | URL | What it does |
| --- | --- | --- |
| `__root.tsx` | all | HTML shell, fonts (Jost, Inter, and Libre Caslon Text for a film page's titles), favicon, `SiteNav`, `SiteFooter`, `Toaster`, `NotFound`. |
| `index.tsx` | `/` | Renders `<Gallery />`; accepts `?work=<slug>` (open a case study over the gallery). |
| `projects.index.tsx` | `/projects` (`?client=<name>` opens it filtered) | The Work page, a compact YouTube-like layout on one white panel (`WorkBackdrop`): a header picture (`HeaderPicture`: `brand/work-header-*.webp`, sunrise and a glass prism, phone crop below 640 px; a blurred copy on top in screen blend makes the prism's light glow and slowly breathe, masked to the prism side; a dark shade under the words, below them on phones, keeps them readable) with "Our work / Stories that create impact." over it (copy in `site.ts` `WORK_PAGE`; its height is the words plus padding), a slim featured-film banner, one line with "Projects (n)", "Initiatives of:" and "Sort by:" (`InitiativesFilter`: a glass button showing the chosen client's badge or All, opening "All films" and each client's glass pill (`ClientBadge`, from `site.ts` `WORK_CLIENTS`) in a glass dropdown hung from the whole line (so it fits the panel), or on phones a glass panel rising from the bottom; picking one filters the films), and the films as video cards, four across. On phones the labels hide and the buttons go compact so the line still fits at 320 px. |
| `projects.$slug.tsx` | `/projects/<slug>` | A film's page reached directly: a normal page under the site header, on the Work page's panel (`WorkBackdrop wide`), holding `CaseStudy`. (From the gallery the same page opens as a sheet over the room: `ProjectSheet`.) |
| `about.tsx` | `/about` | About page, built from `AboutSections`. |
| `contact.tsx` | `/contact` | Contact page. |

### `src/content/`: edit copy and projects here

| File | What it holds |
| --- | --- |
| `site.ts` | Site name, tagline, description, socials, contact (email: info@insightlab.media), About page copy (headline, intro, expertise, numbers…), Work page copy (`WORK_PAGE`) and the clients (`WORK_CLIENTS`: `name`, emblem `mark` (`markIsLogo` when it's the whole logo), the words on their pill `small` / `big`, `rule` (tricolour or SIDHKOFED's), `color`, optional `about`; a film's `client` must match a name). |
| `projects.ts` | The `Project` type and the `PROJECTS` list: title, slug, year, format, tags, `client` (shows a film under that client's "Initiatives of" badge), `series` (the line under a card's title), `duration` (the time badge on its card), video/poster, `youtube` (a YouTube link: plays on the film's wall screen and in its case study), story, stills, quote, credits, `themes` ("In This Film", each with a `ThemeIcon`). Ends with 14 generated placeholders (`sample-film-07`…`20`) so the Work page lists 20, spread across the `WORK_CLIENTS` so every badge filters to something: **replace them before going live**, or "Sample Film" shows under real clients' names. `GALLERY_FILMS` (the first six: what hangs in the gallery), `getProject`, `nextProject` (**unused** since the film page lists More Projects). Every film is on `/projects` and at `/projects/<slug>`. |

### `src/lib/`: small helpers

| File | What it does |
| --- | --- |
| `seo.ts` | `seo(title, description)`: page meta tags. |
| `youtube.ts` | YouTube helpers for the wall screens and the film page (and the unused `FilmPlayer`): `youtubeId` (id from a link), `youtubeCover` (the largest cover, as WebP), `youtubeCoverSet` (WebP sizes for srcset), `youtubeCoverFallback` (a JPEG every video has), `YT_HOST` (youtube-nocookie.com), `ytPlayerVars` (muted, no controls), `keepLooping` (restarts just before the end, so YouTube's own loop icons never show), `loadYouTubeApi` and the `YTPlayer` type. |
| `work.ts` | Values the Work page shares with its components: `UI` (Inter for cards), `coverOf` (a film's image or YouTube cover), `coverSources` (the same with WebP sizes and a fallback), `hasFilm`, `SORTS` (each with a `label` and a phone-length `short`) / `sortFilms`. |
| `menu.ts` | Dropdown menus (Sort by, Initiatives of): `useMenu` (focus, arrow keys, Escape, click outside, scroll lock) and the frosted-glass styles `GLASS_PANEL`, `GLASS_PILL`, `MENU_IN`. |
| `stage.ts` | `setStageTone` / `useStageTone`: tells the nav and footer whether the page behind them is light or dark. |
| `utils.ts` | `cn()`: Tailwind class merging. |

### `src/components/`: site UI

| File | What it does |
| --- | --- |
| `Gallery.tsx` | **The home page experience and its controller.** Hangs `GALLERY_FILMS` (the first six films); Choosing another film in its sheet (More Projects) swaps it in place, or goes to that film's own page when it isn't on the walls. Holds the landing (`IntroDoor`: logo canvas, headline, hint), the way in (scroll progress `p` 0→1, timing constants at the top: `WAKE`, `AUTO_SPEED`, `ROOM_IN`, `SETTLE_S`, `DOLLY`, `GLOW`…), the frame loop (camera pose, exposure, which films play), stepping between stops (wheel, swipe, keys; one scroll gesture = one stop, trackpad momentum ignored, `MIN_STEP_GAP` between steps; each step is a Hermite glide that carries the current speed when a new step arrives mid-glide), clicking a film (walk up, open the case-study sheet) or a door, saving your place in `sessionStorage`, and the accessible list of works for keyboards and screen readers. `USE_TUNNEL` switches the parked prism corridor on or off. |
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
| `ProjectSheet.tsx` | The sheet a film opens in over the gallery: the film flies from its wall position into place (FLIP), paper fades up, close (a white × in the corner) / Escape / Back fade it away. Lavender-white, scrolls as a whole, holds `CaseStudy`. |
| `CaseStudy.tsx` | A film's page, after the studio's design: breadcrumb (Back to Work › client › title); the film (wide 2.75:1 cover with format / title / "A <client> initiative", ▶ and a control bar; playing swaps in YouTube with its own controls, or a video file, in 16:9); serif title (Libre Caslon), "CLIENT \| YEAR \| DURATION", Share on WhatsApp; the description with Read More (adds story, quote, credits); In This Film (`themes`); Project Stills (`stills`, else YouTube's own frames); right column: client card (emblem │ name in the client's colour, `about`, Year / Duration / Initiative) and More Projects (the client's other films, View All → `/projects?client=`). Phones and tablets: one column, the client card after the description, themes and stills in rows you swipe. |
| `FilmPlayer.tsx` | **Unused** since the film page plays YouTube with its own controls: the old case-study player (YouTube through the IFrame API behind custom controls, a video file, or a stand-in film, with an 8-frame filmstrip). |
| `WorkUI.tsx` | The Work page's components: `WorkBackdrop` (lavender page, white panel, not clipping so menus can hang below it; `wide` for a film's page), `VideoCard` (thumbnail, play button, duration badge, title, "series \| year", ⋮ menu), `Cover` (a film's picture: WebP sizes, lazy, JPEG fallback), `PlayButton`, `CardMenu` (also in a film's More Projects), `SortMenu` (a glass button opening a glass menu with ✓), `ClientBadge` (a client in an iPhone-style glass pill: exact emblem │ their words and rule; `inline` for the Initiatives button), `Chevron`, `Check`. |

### `src/components/gallery3d/`: the 3D gallery (three.js)

| File | What it does |
| --- | --- |
| `GalleryScene.ts` | **The room.** Renderer, camera, post-processing (render → half-res GTAO → bloom → film/vignette shader with optional colour fringe and flash → output, Neutral tone mapping), the architecture (microcement walls, ceiling, dark marble floor with soft reflection, open passages with glimpse films, skylight, cove lighting, light lines at the wall feet), the screens with labels (a film with a `youtube` link and no `trailer` gets a live YouTube player laid over its screen by the CSS3D renderer: `addWallYouTube`, loaded `YT_LOAD_DELAY` after you first come near, lined up each frame in `render`, with the glass pyramid's outline cut out of that layer by `clipPrism` so the prism stays in front), the exhibition set, the two doors on the entrance wall. Exposes `layout` (stops and camera path), `setPose`, `setExposure`, `setDoor`, `playNear`, `pick`, `screenRect`, `workCentre`, `render`, plus the journey hosting API (`addJourney`, `showEntrance`, `setJourneyPost`, `galleryFov`). `ROOM` sets the room's size; `PRISM_AHEAD` (`wide` / `tall`) sets how far ahead of where you arrive the prism stands, but never so close that its tip rises over the wall title (`TITLE_BASE`, `TITLE_CLEAR`); `setPose` steers the camera round it within `PRISM_KEEP_OUT`. On phones (`hq` off) the YouTube layer gets a soft prism-shaped mask instead of a hole, mixed to `PHONE_GLASS_OPACITY`. |
| `warmset.ts` | The exhibition set pieces and finishes: `microcement` wall shader, `landscapeTexture`, `addCoveLighting`, `addPrismPlinth` (glass pyramid: refracting glass on desktop, plain see-through glass on phones at `PHONE_GLASS_OPACITY`; the logo at its true colours; rainbows; returns the pyramid's outline points), `addBench` (**unused**: the bench was taken out), `addWallTitle` (the "INSIGHT LAB / A non-fiction visual storytelling studio" lockup, centred above the far wall's two films; its size is `TITLE_PLATE`, and it's placed by its lettering's bottom edge at `GalleryScene`'s `TITLE_BASE`), `PRISM_TOP` (the pyramid tip's height), `addFramedPicture`, `addFloorReflection` / `sizeFloorReflection`. |
| `marble.ts` | `marbleFloorMaterial()`: procedural polished stone slabs. |
| `textures.ts` | Canvas-drawn textures: `skylightTexture`, `wallWashTexture`, `poolTexture`, `doorLightTexture`, `leafTextures` (door leaves), `textTexture` (labels, signs). |
| `PrismTunnel.ts` | **Parked** (`USE_TUNNEL = false`). The prism glass corridor in front of the gallery's entrance, built in the gallery's own scene: logo doors in a mauve facade, prism glass walls, slim glowing frames, a reflective floor, a light ribbon, exit glass, and one spline camera path with keyframed timing. Turn it on in `Gallery.tsx`. |

---

## Where to change common things

| To change… | Edit |
| --- | --- |
| Copy, socials, About text, Work page heading and client tiles | `src/content/site.ts` |
| Add / edit a project, or its film / YouTube link | `src/content/projects.ts` |
| Clients ("Initiatives of" pills, a film page's client card) | `WORK_CLIENTS` in `src/content/site.ts`, emblems in `public/clients/marks/` (and each film's `client` in `projects.ts`) |
| Which films hang in the gallery | the order of `PROJECTS` in `src/content/projects.ts` (the first six) |
| Speed and feel of the way in | constants at the top of `src/components/Gallery.tsx` |
| The light burst look | `uWake` block in `src/components/LogoDoor.tsx` |
| Room architecture, lights, post-processing, where the prism stands | `src/components/gallery3d/GalleryScene.ts` |
| Prism plinth and its glass, cove light, wall finish | `src/components/gallery3d/warmset.ts` |
| Floor stone | `src/components/gallery3d/marble.ts` |
| A film's page (layout) | `src/components/work/CaseStudy.tsx` |
| Case-study open/close animation | `src/components/work/ProjectSheet.tsx` |
| Header | `src/components/SiteNav.tsx` |
| Colours, fonts, global CSS | `src/styles.css` |
| A new page | a new file in `src/routes/` (then add it to this map) |
