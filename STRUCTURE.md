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
   through.", "Scroll to enter". One scroll (or swipe, click, arrow key)
   wakes it: its light bursts out, and you land on the Work page.
2. **The Work page** (`/projects`), the site's home: the films, a YouTube-like
   page with a mini player, and each film's page (`/projects/<slug>`).
3. **The gallery** (`/gallery`, from the "Step into the light" card above
   every page's footer): a larger-than-life 3D world (three.js) to walk like a
   game, with every film in it, one building throughout (oak floors, crisp
   white plaster walls, daylight). **The film hall** (ground floor: the studio's
   own films, the frosted glass prism, the doors "All work" / "About us");
   through a portal at its end **the Grand Atrium** (30 × 30 m, 16 m tall,
   built and lit as real museums are: daylight through a skylight of deep baffles and a sunbeam striped by their
   shadows: the Threshold, the mark as an 8 m monument in blackened steel on a
   stone plinth, a slot of light in its gap, blue and amber on its inner
   faces; the Halo, a polished steel ring with a line of prism light, hung on
   cables; the Lens, a sphere of optical glass; the Ribbon, a band of
   mirror-polished steel; iridescent glass panes on cables; two landscapes
   under picture lights; benches); **the grand staircase** (oak, 8 m
   wide, glass sides, oak rails) to **the upper floor** (oak; a glass-railed
   balcony over the atrium, and a corridor with a room for each initiative
   under a laylight ceiling: their films lit by track spots, their emblem
   large on the wall, a sculpture on a plinth, a bench, their name over the
   door; and at the end the last hall: the Spectrum, tubes of coloured light,
   between two doors, **About** and **Contact**, that take you to those
   pages). **One journey** runs from the entrance to those doors, past every
   film (the hall's films a pair at a time, the atrium's pieces, up the
   stairs, each room's films): a scroll, N / P, Next on the journey bar, a
   flick up or down on a phone, a click on a far film and the VR stick all
   walk you along it, as a person walks (round walls, through doorways, up
   the stairs), and the journey bar shows how far through you are, the next
   stop, which way and how far. Or walk anywhere: a line of light on the
   floor shows the way to the next stop. Walk with WASD / ↑ ↓ (← →
   turn, Shift run), drag to look; on phones a thumb joystick and drag.
   Facing a film: Play / Pause (with sound), Open, and near a bench Sit
   (Space, Enter, E); facing a door out, Go in (Enter). M opens a map of the
   world (press a film or a place to walk there; a long way, you fade across). Motion on phones; **VR view** steps inside: in a
   headset's browser (Meta Quest, Apple Vision Pro, Pico) a real WebXR session
   (point and select, or look and pinch, at a film, a door or any floor); on a
   phone, side by side for a VR holder; on a computer, how to open it in a
   headset.
4. **Case study over the gallery**: clicking a film flies it off the wall into
   a case-study sheet (URL masked as `/projects/<slug>`). Close returns you to
   the film.

Other pages: `/about`, `/contact`.

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
| `brand/gallery-door.webp` | The gallery card above every footer (`SiteFooter.tsx`): a 4 KB crop of `hero-door.webp` (a door of prism light in the dark) |
| `gallery/*.webp` | The gallery's photographed surfaces (`surfaces.ts` `photoSet`), CC0 scans converted to WebP: `oak-*` (Poly Haven laminate_floor_02: the floor everywhere, and the stairs), `limestone-*` (Poly Haven marble_01: the sculptures' bases), `steel-*` (ambientCG Metal009: the grain of the blackened steel), `sky-*` (Poly Haven kloofendal_48d_partly_cloudy_puresky, the half above the horizon: the sky over the skylight). Each in `color` / `normal` / `rough` maps, `2k` (large screens, ~2.1 MB in all) and `1k` (phones, ~0.35 MB); steel `1k` / `512`. CC0: no credit needed |
| `brand/banner.webp`, `brand/hero-door.webp`, `brand/logo-wide.webp`, `brand/mark.webp` | **Unused** (kept as brand assets; `mark.webp` is the source of `mark-avatar.webp`, `hero-door.webp` of `gallery-door.webp`) |

### `src/`: app shell

| File | What it does |
| --- | --- |
| `router.tsx` | Creates the TanStack router (scroll restoration, not-found, errors). |
| `routeTree.gen.ts` | **Generated** by TanStack from `routes/`. Never edit by hand. |
| `styles.css` | Tailwind 4 theme tokens, fonts, global styles, `.tracked` letter-spacing, `.press` (buttons and cards give a little as they're tapped), `--dock` (phones: the bottom bar's height; the page keeps that room, the mini player and gallery controls sit above it), app feel (no grey tap flash or double-tap delay on buttons and links, no long-press menu on pictures, no bounce past the page's ends once added to the home screen), keyframes (e.g. `hint-line`, `prism-glow`: the Work header's breathing glow, still under reduced motion), and the rule that hides the header during the way in (`html.journey [data-site-nav]`). |

### `src/routes/`: pages (one file = one URL)

| File | URL | What it does |
| --- | --- | --- |
| `__root.tsx` | all | HTML shell, app meta (viewport-fit=cover, theme colour, the manifest and home-screen icon, opening as its own app on iPhone and Android), fonts (Jost, the site's one typeface), favicon, `SiteNav`, `SiteFooter`, `Toaster`, `NotFound`, and the site's film player (`PlayerProvider` round everything, `MiniPlayer` once), so a film keeps playing across pages. Each page fades in as you arrive (keyed on the path). The footer shows on every page except the landing (`/`) and the gallery (`/gallery`). |
| `index.tsx` | `/` | The landing: `<Gallery start="landing" />` (the logo; scrolling carries you to the Work page). Old `?work=<slug>` links redirect to `/projects/<slug>`. |
| `gallery.tsx` | `/gallery` | The 3D gallery: `<Gallery start="room" />`; accepts `?work=<slug>` (a case study over the room). |
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
| `Gallery.tsx` | **The landing and the gallery, and their controller** (`start`: `"landing"` the logo only, which hands over to `/projects`, no 3D room loaded; `"room"` the gallery, starting in the room, Leave goes to the Work page). In the room you walk (mode `walk`, `walkFrame`): `FILMS` is every film, the studio's own first, then each initiative's together; WASD / ↑ ↓ walk, ← → turn, Shift runs, drag looks (touch: a joystick on the left, `joy`), kept inside the walls and round the prism and benches, with a slight step bob; the journey (`step`: a scroll, N / P, Next on `JourneyBar`, a quick flick up or down on a touch screen, all one stop on along the journey or back, from `leg`, where you are on it): `tourTo` walks you there by yourself along `GalleryScene.findPath`'s way (`route`: looking where you're going, then turning to face the stop; a gentle start and stop, `walkEase`; a long way a little quicker; a movement key or the joystick takes over; a look round while walking eases back), or fades across when it's a long way (the map) or with reduced motion; `guideFrame` lays the floor guide to the next stop while you walk about yourself and keeps the journey bar's arrow and distance current; walking keeps the floor you're on (`floor`) and climbs the stairs (`GalleryScene.move`); `Prompt` (the film you face: Play / Pause with sound, Open; Sit / Stand near a bench; Go in at a door out; Space, Enter, E); `openWorldDoor` / `clickDoor(2 | 3)` (the world's About and Contact doors: from afar the tour walks you there, near you step through into the page; in VR, pointing at one from in front of it takes the headset off into the page); `HallMap` (M: the world from above, the ground floor and the upper floor tinted, you as an arrow, every film and every place to go to); `sitDown` / `standUp` (seated eye height). Its keys are heard first (capture), so the mini player's don't also act. Also: VR view (`enterVR`: a headset's WebXR session through `GalleryScene.enterVR`; a phone: side by side via `setStereo`, full screen and sideways, looked round by moving it; a computer: `VRHelp`, how to open it in a headset), Motion on phones (looking round by moving the phone: `deviceorientation`, asking first on iPhone), the mouse and A / D looking round, W / S stepping, V for VR, and "Opening the gallery" while it loads. Hangs `GALLERY_FILMS` (the first six films); Choosing another film in its sheet (More Projects) swaps it in place, or goes to that film's own page when it isn't on the walls. Holds the landing (`IntroDoor`: logo canvas, headline, hint), the way in (scroll progress `p` 0→1, timing constants at the top: `WAKE`, `AUTO_SPEED`, `ROOM_IN`, `SETTLE_S`, `DOLLY`, `GLOW`…), the frame loop (camera pose, exposure, which films play), stepping between stops (wheel, swipe, keys; one scroll gesture = one stop, trackpad momentum ignored, `MIN_STEP_GAP` between steps; each step is a Hermite glide that carries the current speed when a new step arrives mid-glide), clicking a film (walk up, open the case-study sheet) or a door, saving your place in `sessionStorage`, and the accessible list of works for keyboards and screen readers. `USE_TUNNEL` switches the parked prism corridor on or off. Its controls and "Scroll to enter" sit above the phone's bottom bar (`--dock`). |
| `LogoDoor.tsx` | The landing logo drawn live in a WebGL shader (`LOGO` geometry, `LogoDoorCanvas`, `draw(scale, focus, flood, wake)`). `uWake` is the scroll-triggered light burst (mauve page, rainbow rays). `uFlood` is an older full-screen prism flood (unused while the way in is wake-then-gallery). **The logo at rest must not change.** |
| `SiteNav.tsx` | The site's header. Tablets and up: a bar along the top (the logo, to the landing; Work / About / Contact). Phones: a floating bar of frosted glass with round corners along the bottom, like an app's tab bar (Home: the mark, to the landing; Work; About; Contact; the gallery is reached from its card above the footer, not the header), a prism line under the current page; the room it takes is `--dock`. Carries `data-site-nav` so CSS can hide it during the way in. Keeps clear of a phone's notch when opened as an app. |
| `SiteFooter.tsx` | Footer on every page except the landing and the gallery: the gallery's card (`GalleryCard`: `brand/gallery-door.webp`, "The gallery / Step into the light", VR view → `/gallery`), call to action, studio name in huge type under lights that switch on as it scrolls in. |
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
| `GalleryScene.ts` | **The room.** Renderer, camera, post-processing (render → half-res GTAO → bloom → film/vignette shader with optional colour fringe and flash → output, Neutral tone mapping), the architecture (microcement walls, ceiling, dark marble floor with soft reflection, open passages with glimpse films, skylight, cove lighting, light lines at the wall feet), the screens with labels (a film with a `youtube` link and no `trailer` gets a live YouTube player laid over its screen by the CSS3D renderer: `addWallYouTube`, loaded `YT_LOAD_DELAY` after you first come near, lined up each frame in `render`, with the glass pyramid's outline cut out of that layer by `clipPrism` so the prism stays in front), the exhibition set, the two doors on the entrance wall. Exposes `layout` (stops and camera path), `setPose`, `setExposure`, `setDoor`, `playNear`, `pick`, `screenRect`, `workCentre`, `render`, plus the journey hosting API (`addJourney`, `showEntrance`, `setJourneyPost`, `galleryFov`). `ROOM` sets the room's size; `PRISM_AHEAD` (`wide` / `tall`) sets how far ahead of where you arrive the prism stands, but never so close that its tip rises over the wall title (`TITLE_BASE`, `TITLE_CLEAR`); `setPose` steers the camera round it within `PRISM_KEEP_OUT`. On phones (`hq` off) the YouTube layer gets a soft prism-shaped mask instead of a hole, mixed to `PHONE_GLASS_OPACITY`. VR: the camera sits in a `rig` (moved in VR, still outside it); `vrSupported()`, `enterVR(at, stop, onPick, onEnd)` (a WebXR immersive-vr session, local-floor; drawn directly, without the finishing passes or the floor mirror; every input's select, so Vision Pro's look-and-pinch works too: a film or a door walks you to its stop, the floor to that spot; thumbsticks turn 30° and step between stops; thin rays from controllers), `exitVR()`, `inVR`; `setStereo(on)` (side by side for a VR holder, `StereoEffect`); `lookFromDevice()` (a phone's angles as a yaw and pitch). The hall: `buildLayout` hangs two films at most on the far wall and the rest down the side walls (20 films: a 33 m hall); with many films (`many`) textures are drawn smaller. `addSections` (a wall text per initiative: emblem, name, prism line, before its first film), `addBenches` (benches down the middle, every other pair of films, clear of the prism, one facing the far wall; `Bench` seats, `SEATED_EYE`), `bounds`, `prism`, `facing(x, z, yaw)` (the film in front of you), `toggleWork(i)` / `workState(i)` (play / pause a film in the room, with sound the first time; others go quiet; walking away quiets it), benches are pickable (`Pick.kind` "bench"; in VR, selecting one stands you by it). The world (option `world`, the gallery page): the hall holds the studio's own films (wider openings, a portal in the side gallery's back wall) and `world.ts` the rest; `makeLayout` adds the rooms' films and the tour's places (`StopKind` "place") after the doors; a work's `y` is its floor. Walking across floors: `floorAt(x, z, from)`, `move(x, z, floor, nx, nz)` (sliding along walls; steps of at most 0.6 m, so stairs yes, drops no), `clearPath(a, b)`, `areas` (for the map); `facing` checks the floor and that no wall is in between. In VR you can point at any floor (upstairs too) and stand on it at its height. The world's light (`probe`, `catchLight`, `catchSoon`, `worldLight`): reflection probes catch the atrium and the upper floor (a cube camera, blurred by PMREM) shortly after building, and again once the world's photographed surfaces have loaded (`world.loaded`), and light the world with them (`WORLD_ENV`); walking through the portal the warm evening fill turns to daylight, the exposure opens up as an eye adapts, and only light sources glow. `worldDoors` / `worldDoorStop()` (the About and Contact doors, picked as doors 2 and 3). On the gallery page the hall is in the building's surfaces (`surfaces`, from `surfaces.ts`: oak, white plaster, a shadow gap at the foot of each wall, `addShadowGaps`; no floor mirror), the daylight is the same throughout (a probe for the hall too), and a last sharpening pass (`SharpenShader`, contrast-adaptive) keeps walls and edges crisp. The journey: `makeLayout` puts the stops in its order (the entrance; the hall's films a pair at a time across the hall; the far wall's; the atrium's pieces; the stairs, the balcony; each room's films; the doors out at `layout.end`; the hall's entrance doors after it), each with its floor `y`; the VR stick follows it. `findPath(a, b)`: the way a person would walk (A* over a half-metre grid of where you can stand, on each floor, kept clear of walls, then straightened); `surfaceAt` (the floor you see: on the stairs, the treads); `setGuide(path)`: the floor guide, dots of light with a pulse running on to the stop. |
| `world.ts` | **The world beyond the hall** (the gallery page), built and lit after real museums, in the building's one set of surfaces (option `surfaces`, from `surfaces.ts`, shared with the hall). `buildWorld` adds, through a portal (a deep reveal with a brass threshold) in the side gallery's back wall (`zA`), the Grand Atrium (`ATRIUM`: oak floor, plaster walls with a shadow gap at the foot, a skylight of deep baffles under a photographed sky (a dome turned so its sun is where the sunbeam comes from), a skylight lamp (`RectAreaLight`, large screens only) and a sunbeam that casts shadows; the Threshold (the mark in blackened steel on a limestone plinth, an LED slot, blue and amber on its inner faces); the Halo (polished steel and a prism LED line, on cables); the Lens (optical glass on a painted plinth); the Ribbon (mirror steel, `ribbonGeometry`); iridescent panes on cables; two landscapes under brass picture lights; the wall title over the balcony; benches), the grand staircase (`STAIRS`: oak treads with dark nosings and soft step lights, glass sides, oak rails; its zone's `surface` is the tread tops), and the upper floor (`UPPER`: oak boards running down the corridor, the balcony, the corridor with a light slot, a room per initiative via `roomFrame`: walls and doorway, a laylight ceiling, a track with a spot per film and its pool of light (`filmSpots`), the emblem wall, a sculpture on a plinth (glass cube, brass knot, steel rings or mirror sphere, by room), its name over the door, a bench), then the last hall (`UPPER.end` deep): the Spectrum (tubes of coloured light) between the doors to About and Contact. Returns what walking and VR need: `zones` (where floors are, and how high; the stairs `over` the floor below), `colliders` (walls and pieces, by level), `floors` (to point at in VR), `places` (for the journey and the map; each with its floor `y`), `benches`, `doors` / `pickDoors` (the doors out, pickable as doors 2 and 3), `probes` (where the scene catches the world's light), `bounds`, `update(t)` (what moves). `roomSpots` places the rooms' films for the scene to hang; `roomsEnd` / `upperEnd` where the rooms and the upper floor end. |
| `warmset.ts` | The exhibition set pieces and finishes: `microcement` wall shader, `landscapeTexture`, `addCoveLighting`, `addPrismPlinth` (glass pyramid: refracting glass on desktop, plain see-through glass on phones at `PHONE_GLASS_OPACITY`; the logo at its true colours; rainbows; returns the pyramid's outline points), `addBench` (**unused**: the bench was taken out), `addWallTitle` (the "INSIGHT LAB / A non-fiction visual storytelling studio" lockup, centred above the far wall's two films; its size is `TITLE_PLATE`, and it's placed by its lettering's bottom edge at `GalleryScene`'s `TITLE_BASE`), `PRISM_TOP` (the pyramid tip's height), `addFramedPicture`, `addFloorReflection` / `sizeFloorReflection`. `addBench(ctx, at, turn)` turns it (π/2: along the hall) and returns it. |
| `surfaces.ts` | **The building's surfaces**, one set for the whole gallery page (the hall and the world), so it reads as one place: `makeSurfaces(ctx, aniso)` returns `wall` / `ceil` (`plaster`: painted white plaster, an even matt colour with a crisp fine roller stipple seen up close, fading with distance), `oak` (the floor everywhere and the stairs, boards running down the building), `limestone` (sculptures' bases), `steel` (blackened, brushed grain), `plinth`, `gap` (the shadow gap at the foot of walls), `sky`, and `loaded` (once the photographed ones are in). The photographed ones are CC0 scans from `public/gallery` (`photoSet`: 2k on large screens, 1k on phones), laid by world position (`worldMapped`: the same real-world size on every floor, step and plinth, never stretched). |
| `marble.ts` | `marbleFloorMaterial()`: procedural polished stone slabs (the hall off the gallery page). |
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
| Speed and feel of the landing's way in | constants at the top of `src/components/Gallery.tsx` |
| The gallery's VR (headset, phone holder), Motion, keys | `src/components/Gallery.tsx` (buttons, input); `src/components/gallery3d/GalleryScene.ts` (`enterVR`, `setStereo`) |
| Walking speed, the prompt, the map, sitting | `src/components/Gallery.tsx` (`WALK`, `RUN`, `TURN`, `walkFrame`, `Prompt`, `HallMap`) |
| The journey: its order, how it walks, its bar and floor guide | order: `src/components/gallery3d/GalleryScene.ts` (`makeLayout`, `end`); the way between stops: `findPath`; walking it, the pace, scroll / flick / Next: `src/components/Gallery.tsx` (`tourTo`, `step`, `walkEase`, `JourneyBar`, `guideFrame`); the floor guide's look: `GalleryScene.ts` (`setGuide`, `glowGuide`) |
| The hall's layout, section walls, benches | `src/components/gallery3d/GalleryScene.ts` (`buildLayout`, `addSections`, `addBenches`) |
| The atrium, its art, the stairs, the rooms upstairs, the About / Contact doors, the world's materials | `src/components/gallery3d/world.ts` |
| The world's light (reflection probes, daylight exposure) | `src/components/gallery3d/GalleryScene.ts` (`worldLight`, `WORLD_ENV`) |
| The building's floors, walls, steel and sky (one set for all of it: which files, their size, tint, the walls' finish) | `public/gallery/` (the files); `src/components/gallery3d/surfaces.ts` (`makeSurfaces`, `plaster`, `photoSet`, `worldMapped`); the sky dome: `world.ts` |
| The gallery card above every footer | `src/components/SiteFooter.tsx` (`GalleryCard`) |
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
