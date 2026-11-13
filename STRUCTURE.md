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
| `manifest.webmanifest` | Makes the site an app you can add to a phone's home screen (`__root.tsx` links it): name, opens at `/projects` in its own window (no browser bars), colours, icons |
| `app/icon-192.png`, `app/icon-512.png`, `app/icon-maskable-512.png`, `app/apple-touch-icon.png` | The app's home-screen icons (the mark on the page colour; `maskable`: with room round it for Android's shapes; `apple-touch-icon`: iPhone) |
| `brand/work-header-1400.webp`, `brand/work-header-2000.webp`, `brand/work-header-phone.webp` | The Work page's banner (`projects.index.tsx` `HeaderPicture`): 1400 / 2000 px for wider screens (47 / 74 KB), and for phones a full-resolution crop of the prism side (45 KB) |
| `clients/marks/*.webp` | Each client's emblem exactly as on their badge (cut out, background removed; MLINDA and Better World: their whole logo). Used in their glass pill on the Work page (`ClientBadge`), and in a round avatar (`Avatar`) on cards and by a film's title |
| `brand/logo-stacked.webp` | The landing logo artwork (`Gallery.tsx`, `LogoDoor.tsx`) |
| `brand/mark-transparent.webp` | The logo inlaid on the prism plinth (`GalleryScene.ts`, shown large) |
| `brand/mark-nav.webp` | The header logo (`SiteNav.tsx`): a 1.5 KB copy of the mark at the size it's shown |
| `brand/mark-avatar.webp` | The studio's avatar (`WorkUI.tsx` `Avatar`, for films with no client from `WORK_CLIENTS`): a 1.7 KB copy of `mark.webp`, 240 px tall |
| `brand/banner.webp`, `brand/hero-door.webp`, `brand/logo-wide.webp`, `brand/mark.webp` | **Unused** (kept as brand assets; `mark.webp` is the source of `mark-avatar.webp`) |

### `src/`: app shell

| File | What it does |
| --- | --- |
| `router.tsx` | Creates the TanStack router (scroll restoration, not-found, errors). |
| `routeTree.gen.ts` | **Generated** by TanStack from `routes/`. Never edit by hand. |
| `styles.css` | Tailwind 4 theme tokens, fonts, global styles, `.tracked` letter-spacing, `.press` (buttons and cards give a little as they're tapped), `--dock` (phones: the bottom bar's height; the page keeps that room, the mini player and gallery controls sit above it), app feel (no grey tap flash or double-tap delay on buttons and links, no long-press menu on pictures, no bounce past the page's ends once added to the home screen), keyframes (e.g. `hint-line`, `prism-glow`: the Work header's breathing glow, still under reduced motion), and the rule that hides the header during the way in (`html.journey [data-site-nav]`). |

### `src/routes/`: pages (one file = one URL)

| File | URL | What it does |
| --- | --- | --- |
| `__root.tsx` | all | HTML shell, app meta (viewport-fit=cover, theme colour, the manifest and home-screen icon, opening as its own app on iPhone and Android), fonts (Jost, the site's one typeface), favicon, `SiteNav`, `SiteFooter`, `Toaster`, `NotFound`, and the site's film player (`PlayerProvider` round everything, `MiniPlayer` once), so a film keeps playing across pages. Each page fades in as you arrive (keyed on the path). |
| `index.tsx` | `/` | Renders `<Gallery />`; accepts `?work=<slug>` (open a case study over the gallery). |
| `projects.index.tsx` | `/projects` (`?client=<name>` shows that client's films, `?kind=<kind>` one kind, `?q=<words>` searched for that) | The Work page, YouTube-like: the banner (`HeaderPicture` with the prism's breathing glow, the headline (`WORK_PAGE`), Play showreel: starts it in the mini player), YouTube's search box (titles, clients, kinds, themes), one line with "Projects (n)", "Initiatives of:" and "Sort by:" (`InitiativesFilter`: a glass button showing the chosen client's badge or All, opening "All films" and each client's glass pill (`ClientBadge`, from `site.ts` `WORK_CLIENTS`) in a glass dropdown hung from the whole line, or on phones a glass panel rising from the bottom; picking one filters the films; `SortMenu`), chips of the kinds of film, and the films as YouTube video cards (one across, edge to edge, on phones; two on tablets; three or four on PC). On phones the labels hide and the buttons go compact so the line still fits at 320 px. |
| `projects.$slug.tsx` | `/projects/<slug>` | A film's page reached directly: a normal page under the site header (`WorkBackdrop wide`), holding `CaseStudy`. (From the gallery the same page opens as a sheet over the room: `ProjectSheet`.) |
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
| `youtube.ts` | YouTube helpers (the `YTPlayer` type includes `isMuted` for the M key) for the wall screens and the film page (and the unused `FilmPlayer`): `youtubeId` (id from a link), `youtubeCover` (the largest cover, as WebP), `youtubeCoverSet` (WebP sizes for srcset), `youtubeCoverJpeg` (the largest cover as JPEG, for the gallery's wall screens: WebGL needs CORS, which YouTube sends for JPEG covers but not WebP), `youtubeCoverFallback` (a JPEG every video has), `YT_HOST` (youtube-nocookie.com), `ytPlayerVars` (muted, no controls), `keepLooping` (restarts just before the end, so YouTube's own loop icons never show), `loadYouTubeApi` and the `YTPlayer` type. |
| `work.ts` | Values the Work page and a film's page share: `UI` (Jost, the site's type), `coverOf` (a film's image or YouTube cover), `coverSources` (the same with WebP sizes and a fallback), `hasFilm`, `filmOf` (a film as the player takes it), `clientOf`, `filmsOf` (a client's films), `kindOf` (format, else first tag), `SORTS` (each with a `label` and a phone-length `short`) / `sortFilms`. |
| `player.tsx` | The site's one film player, like YouTube's: `PlayerProvider` and `usePlayer()` hold which film is playing (`Film`: slug, title, client, YouTube id or file, cover), the box it sits over on a page (`setSlot`, from `FilmBox`), and whether it's there (`docked`) or in the corner; `play`, `close`, `minimise` (on a film's page goes to the Work page; elsewhere the film leaves its box for the corner), `setOffscreen` (its box scrolled out of sight: the film floats to the corner until you scroll back). Drawn by `components/MiniPlayer.tsx`. |
| `menu.ts` | Dropdown menus (Sort by, Initiatives of): `useMenu` (focus, arrow keys, Escape, click outside, scroll lock) and the frosted-glass styles `GLASS_PANEL` (also the card ⋮ menu and the mini player), `GLASS_PILL`, `MENU_IN`. |
| `stage.ts` | `setStageTone` / `useStageTone`: tells the nav and footer whether the page behind them is light or dark. |
| `utils.ts` | `cn()`: Tailwind class merging. |

### `src/components/`: site UI

| File | What it does |
| --- | --- |
| `Gallery.tsx` | **The home page experience and its controller.** Hangs `GALLERY_FILMS` (the first six films); Choosing another film in its sheet (More Projects) swaps it in place, or goes to that film's own page when it isn't on the walls. Holds the landing (`IntroDoor`: logo canvas, headline, hint), the way in (scroll progress `p` 0→1, timing constants at the top: `WAKE`, `AUTO_SPEED`, `ROOM_IN`, `SETTLE_S`, `DOLLY`, `GLOW`…), the frame loop (camera pose, exposure, which films play), stepping between stops (wheel, swipe, keys; one scroll gesture = one stop, trackpad momentum ignored, `MIN_STEP_GAP` between steps; each step is a Hermite glide that carries the current speed when a new step arrives mid-glide), clicking a film (walk up, open the case-study sheet) or a door, saving your place in `sessionStorage`, and the accessible list of works for keyboards and screen readers. `USE_TUNNEL` switches the parked prism corridor on or off. Its controls and "Scroll to enter" sit above the phone's bottom bar (`--dock`). |
| `LogoDoor.tsx` | The landing logo drawn live in a WebGL shader (`LOGO` geometry, `LogoDoorCanvas`, `draw(scale, focus, flood, wake)`). `uWake` is the scroll-triggered light burst (mauve page, rainbow rays). `uFlood` is an older full-screen prism flood (unused while the way in is wake-then-gallery). **The logo at rest must not change.** |
| `SiteNav.tsx` | The site's header. Tablets and up: a bar along the top (logo, Work / About / Contact). Phones: a floating bar of frosted glass with round corners along the bottom, like an app's tab bar (Home: the mark; Work, About, Contact), a prism line under the current page; the room it takes is `--dock`. Carries `data-site-nav` so CSS can hide it during the way in. Keeps clear of a phone's notch when opened as an app. |
| `SiteFooter.tsx` | Footer on every page except the gallery: call to action, studio name in huge type under lights that switch on as it scrolls in. |
| `AboutSections.tsx` | About page sections: hanging headline, pinned expertise, rolling numbers, etc. Content from `content/site.ts`. |
| `MiniPlayer.tsx` | The film player (state in `lib/player.tsx`), drawn once over every page. Docked: exactly over its film page's hero (placed every frame; in page coordinates on the page, cut to the sheet in the gallery's sheet), with YouTube's own controls or the browser's. Mini (after leaving the page, or minimising, which goes to the Work page): a glass card bottom-right, on phones a bar along the bottom (with room added under the page): the film, a red progress line, title and client (press either to open its page), play / pause, close. In the corner the film is drawn at a normal player's size and scaled down, so YouTube doesn't crowd it with its buttons. Like YouTube's on a phone: the film flies (shrinks into the corner, grows back over its page; FLIP), on phones a ⌄ on the playing film (tap or swipe down) minimises it to the Work page, and the bar swipes (up opens the film, down or sideways closes it). The video element is never moved, only placed, so it never reloads. Scrolled past on its page, it floats to the corner, and back as you scroll up (pressing it scrolls back). Keyboard, as on YouTube: Space/K, J/L ±10 s, ←/→ ±5 s, 0–9, M, F, I, and ? for `ShortcutsPanel` (a glass list; `openShortcuts()` opens it too); each shows a small sign over the film. Full screen: F (or YouTube's button) uses the browser's, turning a phone to landscape where allowed (Android); a phone turned sideways while the film plays on its page fills the screen with it (iPhone too), ⌄ or turning back ends it. Docked, it draws its own controls (`Controls`), in the site's language: a prism progress line you press or drag, play / pause, sound, the time, the keyboard list (PC), the mini player and full screen; they fade while it plays. YouTube's own controls, title bar, channel and logo are hidden (controls off, and the frame cut taller than the film so the bars fall outside); paused or ended, the film's cover covers YouTube's screens. Until it first plays, taps reach YouTube's frame (an iPhone may need its play button once). |
| `NotFound.tsx` | 404 page. |
| `Poster.tsx` | Stand-in poster artwork for projects without an image. |
| `ProjectCard.tsx` | Editorial list row (year, title, tags). **Unused.** |
| `ui/sonner.tsx` | Toast container (shadcn wrapper). |

### `src/components/work/`: case studies

| File | What it does |
| --- | --- |
| `ProjectSheet.tsx` | The sheet a film opens in over the gallery: the film flies from its wall position into place (FLIP), paper fades up, close (a white × in the corner) / Escape / Back fade it away. Lavender-white, scrolls as a whole, holds `CaseStudy`. |
| `CaseStudy.tsx` | A film's page, as YouTube's watch page. PC: the film (`FilmBox`: cover and play button, then the site's player over it; a stand-in carries its title), its kind as a small grey label and the title in light wide-spaced capitals over a line of prism light (as the site sets its titles), the client's avatar and name with "Their films" (to the Work page filtered), and Share and WhatsApp (the mini player, full screen and keyboard list are on the film: `MiniPlayer.tsx` Controls; no YouTube link); the description in a white hairline box (year · kind · length · series; the themes it addresses as pill buttons, each opening the Work page searched for it; three lines; a black "Read more" / "Show less" button for the story, quote, stills, credits, about the client); beside it Up next (chips All / From <client>, small rows). Tablets: one column, Up next two across. Phones: the film edge to edge, the pills a row you swipe, Up next as full cards. In the gallery's sheet (it passes `heroRef`): room for the sheet's close button, and other films open in place (`onNext`). |
| `FilmPlayer.tsx` | **Unused** since the film page plays YouTube with its own controls: the old case-study player (YouTube through the IFrame API behind custom controls, a video file, or a stand-in film, with an 8-frame filmstrip). |
| `WorkUI.tsx` | The pieces of the Work page and a film's page, laid out after YouTube's but in the site's own language (Jost throughout, light wide-spaced capitals for titles and labels, ink on near-white, the site's `--prism` as the one accent): `INK`, `MUTED`, `PRISM`; `WorkBackdrop` (the site's near-white page; `wide` for a film's page; on phones it starts at the top, the header being at the bottom); `Avatar` (round: a client's emblem, or the studio's mark) and `shortName`; `Chip`; `Scroller` (a row that scrolls sideways, with arrow buttons on wider screens and faded ends); `Cover` (a film's picture, WebP sizes with a JPEG fallback); `VideoCard` (picture with length and a prism line on hover, avatar, title, client, kind · year, ⋮; `bleed`: edge to edge on phones), `CompactCard` (Up next rows), `CardMenu` (⋮: Play in the mini player, Open the film, Copy link); `FilmBox` (where a film plays on a page: the player's slot; watches itself scroll out of sight); `PlayButton`; `MiniIcon`; the Work page's `SortMenu` (a glass button with the current order, a glass menu of `SORTS`), `ClientBadge` (a client in a glass pill: their exact emblem │ their words as on their badge, or their whole logo; `inline`: emblem and big word only), `Chevron`, `Check`. |

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
| Copy, socials, About text, Work page banner words | `src/content/site.ts` |
| Add / edit a project, or its film / YouTube link | `src/content/projects.ts` |
| Clients ("Initiatives of" pills, avatars, a film's client) | `WORK_CLIENTS` in `src/content/site.ts`, emblems in `public/clients/marks/` (and each film's `client` in `projects.ts`) |
| Which films hang in the gallery | the order of `PROJECTS` in `src/content/projects.ts` (the first six) |
| Speed and feel of the way in | constants at the top of `src/components/Gallery.tsx` |
| The light burst look | `uWake` block in `src/components/LogoDoor.tsx` |
| Room architecture, lights, post-processing, where the prism stands | `src/components/gallery3d/GalleryScene.ts` |
| Prism plinth and its glass, cove light, wall finish | `src/components/gallery3d/warmset.ts` |
| Floor stone | `src/components/gallery3d/marble.ts` |
| The Work page (banner, search, Initiatives of, Sort by, chips, grid) | `src/routes/projects.index.tsx`; its cards, chips, avatars, colours: `src/components/work/WorkUI.tsx` |
| A film's page (YouTube's watch page) | `src/components/work/CaseStudy.tsx` |
| Case-study open/close animation | `src/components/work/ProjectSheet.tsx` |
| The mini player (look, size, corner) | `src/components/MiniPlayer.tsx`; what's playing: `src/lib/player.tsx` |
| Header | `src/components/SiteNav.tsx` |
| Colours, fonts, global CSS, the tap feel | `src/styles.css` |
| The app's name, icons, colours on a home screen | `public/manifest.webmanifest`, `public/app/`, meta in `src/routes/__root.tsx` |
| Keyboard shortcuts, full screen, rotate to full screen | `src/components/MiniPlayer.tsx` |
| A new page | a new file in `src/routes/` (then add it to this map) |
