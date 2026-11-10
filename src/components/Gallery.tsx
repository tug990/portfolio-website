import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useRouter, useSearch } from "@tanstack/react-router";
import { SITE } from "@/content/site";
import { PROJECTS, getProject } from "@/content/projects";
import { ProjectSheet } from "@/components/work/ProjectSheet";
import { setStageTone } from "@/lib/stage";
import { cn } from "@/lib/utils";
import { LOGO, LogoDoorCanvas, type LogoDoorHandle } from "@/components/LogoDoor";
import type { GalleryScene, Layout, Pose, Stop } from "@/components/gallery3d/GalleryScene";
import type { PrismTunnel } from "@/components/gallery3d/PrismTunnel";

/*
  The home page.

  It opens on the Insight Lab logo (LogoDoor, drawn live with WebGL). Scrolling
  flies you into the light at the top of its gap; once you're in, it carries
  you the rest of the way: the view floods with prism light and fades into the
  gallery, which starts bright and settles, like eyes adjusting. You arrive
  standing back with the whole room in view: all six films playing, two on
  each of the three walls ahead of you.

  The gallery itself is a real 3D room (gallery3d/GalleryScene, three.js): six
  films on the left, far and right walls, and two prism-lit doors on the wall
  behind you. From the overview, every scroll / swipe / arrow press moves one
  stop: the left wall, the far wall, the right wall, then you turn round to
  the doors. Click the
  film you're at to walk up to it and open its page; click a door to walk
  through it. Scrolling back from the middle takes you back out to the logo.
*/

type Mode = "intro" | "free" | "visit";

/* ---------- timing ---------- */

const INTRO_SCROLL = 1000; // px of scrolling from the logo to the room
const ZOOM_END = 0.48; // by here the light fills the screen
const FLOOD: [number, number] = [0.34, 0.82]; // prism light floods the view
const INTRO_FADE: [number, number] = [0.74, 0.9]; // ...and fades into the room
const GLIDE: [number, number] = [0.66, 1]; // the camera settles in the middle of the room
const AUTO_FROM = 0; // any forward scroll plays the way in by itself...
const AUTO_SPEED = 2.2; // ...in under half a second (when the tunnel isn't available)

/*
  The prism journey, played by one scroll in about a second (progress 0 to 1):
  the logo wakes (its panels part, light breaks out, the page darkens), you fly
  into its opening and out of the white light into the prism tunnel, travel
  down it until the gallery appears through its far end, and the tunnel
  dissolves around you into the gallery.
*/
const JOURNEY_SPEED = 0.95; // progress per second: the whole way in is ~1.05 s
const WAKE: [number, number] = [0, 0.14]; // the logo responds
const THRESHOLD: [number, number] = [0.06, 0.33]; // flying into its opening, into white light
const LOGO_OUT: [number, number] = [0.33, 0.36]; // the logo layer goes once the tunnel covers it
const TUNNEL_IN: [number, number] = [0.27, 0.34]; // the tunnel comes up out of the light
const TUNNEL: [number, number] = [0.3, 0.93]; // travelling through it
const TUNNEL_OUT: [number, number] = [0.86, 0.985]; // it dissolves into the gallery

const STEP_LOCK_MS = 300; // one scroll gesture = one stop
const FOLLOW = 6; // catching up after a resize (steps themselves are timed glides)
const LEAN_IN = 3.4; // stepping in towards a film once you arrive
const LEAN_OUT = 6;
const VISIT_MS = 720; // walking up to a film, before it lifts off the wall
const RETURN_MS = 650; // stepping back from it when its page closes
const DOOR_MS = 1400; // walking through a door
const EYE = 1.6; // camera height, metres
const SAVE_KEY = "insight-gallery-stop";

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
const smooth = (t: number) => {
  const c = clamp(t, 0, 1);
  return c * c * (3 - 2 * c);
};
const band = (t: number, [a, b]: [number, number]) => smooth((t - a) / (b - a));
const damp = (rate: number, dt: number) => 1 - Math.exp(-rate * dt);
const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);

export function Gallery() {
  const navigate = useNavigate();
  const router = useRouter();
  const { work } = useSearch({ from: "/" });
  // The case study open over the gallery, if any
  const [sheet, setSheet] = useState<null | {
    slug: string;
    flyFrom: DOMRect | null;
    closing: boolean;
  }>(null);
  const flyFrom = useRef<DOMRect | null>(null);
  const pushedSheet = useRef(false); // we added the history entry, so closing goes Back
  const covered = useRef(false); // the sheet hides the room: no need to draw it
  const [inside, setInside] = useState(false);
  const [hint, setHint] = useState(true);

  const stageRef = useRef<HTMLDivElement>(null);
  const roomCanvas = useRef<HTMLCanvasElement>(null);
  const introRef = useRef<HTMLDivElement>(null);
  const scene = useRef<Record<string, HTMLElement | null>>({});
  const logoGl = useRef<LogoDoorHandle | null>(null);
  const gs = useRef<GalleryScene | null>(null);
  const tunnelCanvas = useRef<HTMLCanvasElement>(null);
  const tunnel = useRef<PrismTunnel | null>(null);
  const failed = useRef(false);
  const viewRef = useRef({ w: 1440, h: 900 });

  // Everything the frame loop reads lives here, so moving never re-renders React.
  const cam = useRef({
    mode: "intro" as Mode,
    p: 0, // progress through the way in: 0 = the logo, 1 = in the room
    pGoal: 0,
    auto: false,
    q: 0, // where the camera is along the path in the room
    goal: 0,
    glide: null as null | { from: number; to: number; t0: number; dur: number },
    lean: 0,
    at: 0, // the stop you're at
    playing: -2,
    insideFlag: false,
    journeyFlag: false, // the header steps aside while this is true
    pose: { x: 0, z: -0.5, yaw: 0, y: EYE },
    lockUntil: 0,
    wheelAcc: 0,
    drag: { on: false, x0: 0, y0: 0, x: 0, y: 0, dist: 0, pointer: "mouse" },
    hover: -1, // door under the mouse
    parkedAt: -1,
    doorAng: [0, 0],
    doorLit: [0, 0],
    visit: null as null | {
      t0: number;
      dur: number;
      from: Pose & { y: number };
      to: Pose & { y: number };
      door: number; // -1 for a film
      veil?: HTMLElement;
      go: () => void;
      gone: boolean;
    },
  });

  /* ---------- setup ---------- */

  useEffect(() => {
    let alive = true;
    const fit = () => {
      viewRef.current = { w: window.innerWidth, h: window.innerHeight };
      tunnel.current?.setSize(window.innerWidth, window.innerHeight);
      const g = gs.current;
      if (!g) return;
      g.setSize(window.innerWidth, window.innerHeight);
      // Distances were re-fitted to the new window: stay at the same stop.
      const c = cam.current;
      if (c.mode === "free") {
        c.glide = null;
        c.q = c.goal = g.layout.stops[Math.min(c.at, g.layout.stops.length - 1)].s;
      }
    };
    fit();
    window.addEventListener("resize", fit);
    setStageTone("light");

    (async () => {
      try {
        // Labels are drawn with the site font, so wait for it.
        await Promise.all([
          document.fonts?.load("500 40px Jost"),
          document.fonts?.load("400 40px Jost"),
        ]).catch(() => {});
        const mod = await import("@/components/gallery3d/GalleryScene");
        if (!alive || !roomCanvas.current) return;
        const coarse = window.matchMedia("(pointer: coarse)").matches;
        const s = new mod.GalleryScene(roomCanvas.current, {
          projects: PROJECTS,
          aspect: window.innerWidth / window.innerHeight,
          // Phones and tablets skip the floor mirror and shadows to stay smooth.
          hq: !coarse && window.innerWidth >= 700,
        });
        s.setSize(window.innerWidth, window.innerHeight);
        gs.current = s;

        // The prism tunnel, for the way in (not with reduced motion; if it
        // can't start, the way in falls back to the light flood)
        if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
          try {
            const tm = await import("@/components/gallery3d/PrismTunnel");
            if (alive && tunnelCanvas.current) {
              const t = new tm.PrismTunnel(tunnelCanvas.current, {
                light: coarse || window.innerWidth < 700,
              });
              t.setSize(window.innerWidth, window.innerHeight);
              tunnel.current = t;
            }
          } catch (err) {
            console.warn("The prism tunnel couldn't start:", err);
          }
        }

        // Coming back from a page: put you back where you were.
        const saved = readSaved();
        if (saved !== null) {
          const c = cam.current;
          const stops = s.layout.stops;
          c.mode = "free";
          c.p = c.pGoal = 1;
          c.at = Math.min(saved, stops.length - 1);
          c.q = c.goal = stops[c.at].s;
          c.lean = stops[c.at].kind === "work" ? 1 : 0;
          c.insideFlag = true;
          drawIntro(1);
          setInside(true);
          setHint(false);
        }
      } catch (err) {
        console.warn("The 3D gallery couldn't start:", err);
        failed.current = true;
      }
    })();

    return () => {
      alive = false;
      window.removeEventListener("resize", fit);
      gs.current?.dispose();
      gs.current = null;
      tunnel.current?.dispose();
      tunnel.current = null;
      document.documentElement.classList.remove("journey");
      setStageTone(null);
    };
  }, []);

  /* ---------- the frame loop ---------- */

  useEffect(() => {
    let raf = 0;
    const t0 = performance.now();
    let last = t0;
    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const c = cam.current;
      const s = gs.current;
      const L = s?.layout;
      const T = tunnel.current;
      let pose = { ...c.pose };
      let exposure = 1;

      if (c.mode === "intro") {
        if (c.auto) {
          // Playing by itself: a steady pace, not a slow crawl
          const dir = Math.sign(c.pGoal - c.p);
          c.p += dir * (T ? JOURNEY_SPEED : AUTO_SPEED) * dt;
          if ((dir > 0 && c.p >= c.pGoal) || (dir <= 0 && c.p <= c.pGoal)) {
            c.p = c.pGoal;
            c.auto = false;
          }
        } else {
          c.p += (c.pGoal - c.p) * damp(7, dt);
          if (Math.abs(c.pGoal - c.p) < 0.0008) c.p = c.pGoal;
        }
        if (!s) {
          if (failed.current && c.p > 0.6) {
            // No 3D available: go straight to the work instead.
            c.p = c.pGoal = 0;
            navigate({ to: "/projects" });
          }
          c.p = Math.min(c.p, 0.78); // wait in the light until the room is ready
        }
        drawIntro(c.p);
        // Behind the light you're already in the room, gliding the last stretch
        // to the spot that shows the whole gallery.
        const first: Pose = L?.stops[0] ?? { x: 0, z: 4, yaw: 0 };
        const g = smooth(band(c.p, GLIDE));
        pose = { x: first.x, z: first.z + 1.5 * (1 - g), yaw: first.yaw, y: EYE };
        // bright, then settling (gentler when seen through the tunnel's far end)
        exposure = T ? 1 + 0.7 * (1 - band(c.p, [0.75, 1])) : 1 + 2.6 * (1 - band(c.p, [0.7, 1]));
        const isIn = c.p > (T ? 0.97 : 0.72); // the gallery's controls return once you've arrived
        if (isIn !== c.insideFlag) {
          c.insideFlag = isIn;
          setInside(isIn);
        }
        if (s && L && c.p >= 1 && c.pGoal >= 1) {
          c.mode = "free";
          c.at = 0;
          c.q = c.goal = L.stops[0].s;
          c.lean = 0;
          c.auto = false;
          // The scroll that brought you in may still be coasting: don't let it carry you on.
          c.lockUntil = now + 450;
          c.wheelAcc = 0;
        }
      } else if (c.mode === "free" && L) {
        if (c.glide) {
          const t = clamp((now - c.glide.t0) / c.glide.dur, 0, 1);
          c.q = c.glide.from + (c.glide.to - c.glide.from) * easeInOut(t);
          if (t >= 1) c.glide = null;
        } else {
          c.q += (c.goal - c.q) * damp(FOLLOW, dt);
          if (Math.abs(c.goal - c.q) < 0.002) c.q = c.goal;
        }
        const here = L.stops[nearestStop(L.stops, c.q)];
        const near = here.kind === "work" && Math.abs(c.q - here.s) < L.span * 0.3 && !c.glide;
        c.lean += ((near ? 1 : 0) - c.lean) * damp(near ? LEAN_IN : LEAN_OUT, dt);
        pose = { ...leaned(L, poseAt(L.stops, c.q), c.lean), y: EYE };
      } else if (c.mode === "visit" && c.visit) {
        const v = c.visit;
        const t = clamp((now - v.t0) / v.dur, 0, 1);
        const e = easeInOut(t);
        pose = {
          x: v.from.x + (v.to.x - v.from.x) * e,
          z: v.from.z + (v.to.z - v.from.z) * e,
          yaw: v.from.yaw + (v.to.yaw - v.from.yaw) * e,
          y: v.from.y + (v.to.y - v.from.y) * e,
        };
        if (v.veil) v.veil.style.opacity = String(smooth((t - 0.45) / 0.5));
        if (t >= 1 && !v.gone) {
          v.gone = true;
          v.go();
        }
      }

      if (s && L) {
        // The doors: ajar when you arrive, wider under the mouse, wide open when clicked.
        const end = L.stops[L.stops.length - 1];
        const parked = c.mode !== "intro" && Math.abs(c.q - end.s) < L.span * 0.3;
        if (parked && c.parkedAt < 0) c.parkedAt = now;
        if (!parked) c.parkedAt = -1;
        for (let i = 0; i < 2; i++) {
          const goal = c.visit?.door === i ? 82 : parked ? (c.hover === i ? 24 : 12) : 0;
          const rate = goal > c.doorAng[i] ? (c.visit ? 5 : 3.5) : 5;
          c.doorAng[i] += (goal - c.doorAng[i]) * damp(rate, dt);
          // Signs light one after the other
          const litGoal = parked ? clamp((now - c.parkedAt - (150 + i * 380)) / 650, 0, 1) : 0;
          c.doorLit[i] = parked ? litGoal : c.doorLit[i] * (1 - damp(8, dt));
          s.setDoor(i, c.doorAng[i], smooth(c.doorLit[i]));
        }
        // Only the films near you play.
        const roomFrom = T ? TUNNEL[0] : 0.6; // seen through the tunnel's far end from early on
        const playAt = c.mode === "intro" ? (c.p > roomFrom ? 0 : -1) : c.at;
        if (playAt !== c.playing) {
          c.playing = playAt;
          s.playNear(playAt);
        }
        // Draw the room whenever it can be seen.
        if ((c.mode !== "intro" || c.p > roomFrom) && !covered.current) {
          s.setPose(pose.x, pose.y, pose.z, pose.yaw);
          s.setExposure(exposure);
          s.render((now - t0) / 1000);
        }
      }
      c.pose = pose;

      // The prism tunnel, over everything while you travel through it
      const tc = tunnelCanvas.current;
      if (tc) {
        const op = T && c.mode === "intro" ? band(c.p, TUNNEL_IN) * (1 - band(c.p, TUNNEL_OUT)) : 0;
        tc.style.opacity = String(op);
        tc.style.visibility = op > 0.001 ? "visible" : "hidden";
        if (T && op > 0.001) {
          T.render(clamp((c.p - TUNNEL[0]) / (TUNNEL[1] - TUNNEL[0]), 0, 1), (now - t0) / 1000);
        }
      }
      // The header steps aside for the journey, and returns in the gallery
      const journey = c.mode === "intro" && c.p > 0.002 && c.p < 0.999;
      if (journey !== c.journeyFlag) {
        c.journeyFlag = journey;
        document.documentElement.classList.toggle("journey", journey);
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ---------- the logo, for the current progress ---------- */

  function drawIntro(p: number) {
    const { w: W, h: H } = viewRef.current;
    const s = scene.current;
    const T = !!tunnel.current;
    const e = T ? band(p, THRESHOLD) : band(p, [0, ZOOM_END]);
    const s0 = Math.min((H * 0.4) / LOGO.height, (W * 0.62) / 215);
    const zoom = Math.exp(Math.log(120) * Math.pow(e, 1.7));
    const scale = s0 * zoom;
    const markY = H * 0.4;
    const restX = W / 2 + (LOGO.focus.x - LOGO.center.x) * s0;
    const restY = markY + (LOGO.focus.y - LOGO.center.y) * s0;
    const k = smooth(e);
    const fx = restX + (W / 2 - restX) * k;
    const fy = restY + (H / 2 - restY) * k;
    const fade = 1 - band(p, T ? LOGO_OUT : INTRO_FADE);
    if (fade > 0) {
      if (logoGl.current?.ok) {
        logoGl.current.draw(scale, { x: fx, y: fy }, T ? 0 : band(p, FLOOD), T ? band(p, WAKE) : 0);
      } else if (s.fallback) {
        // No WebGL: the logo image, never enlarged more than a touch.
        const fs = s0 * Math.min(zoom, 1.5);
        s.fallback.style.width = `${1254 * fs}px`;
        s.fallback.style.left = `${fx - LOGO.focus.x * fs}px`;
        s.fallback.style.top = `${fy - LOGO.focus.y * fs}px`;
        s.fallback.style.opacity = String(1 - band(e, [0.05, 0.35]));
      }
    }
    if (s.text) {
      const bottom = markY + (686 - LOGO.center.y) * s0;
      const out = band(p, [0.01, 0.12]);
      s.text.style.top = `${bottom + 34}px`;
      s.text.style.opacity = String(1 - out);
      s.text.style.transform = `translateY(${out * 40}px)`;
    }
    if (introRef.current) {
      introRef.current.style.opacity = String(fade);
      introRef.current.style.visibility = fade <= 0 ? "hidden" : "visible";
    }
    if (s.hint) s.hint.style.opacity = String(1 - band(p, [0, 0.05]));
  }

  /* ---------- moving ---------- */

  const stepTo = (i: number) => {
    const c = cam.current;
    const L = gs.current?.layout;
    if (!L || !L.stops[i] || c.mode !== "free") return;
    c.at = i;
    c.goal = L.stops[i].s;
    const d = Math.abs(c.goal - c.q);
    // Quick and smooth: about 0.4 s to a neighbour; the longer first move from the
    // overview to the left wall gets a little more, so it never lurches.
    c.glide = { from: c.q, to: c.goal, t0: performance.now(), dur: clamp(300 + d * 40, 380, 850) };
    setHint(false);
  };

  const step = (dir: 1 | -1) => {
    const c = cam.current;
    const L = gs.current?.layout;
    if (c.mode !== "free" || !L) return;
    if (dir < 0 && c.at === 0) return goOut(false);
    stepTo(clamp(c.at + dir, 0, L.stops.length - 1));
  };

  const goIn = () => {
    const c = cam.current;
    if (c.mode !== "intro") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) c.p = 0.999;
    c.pGoal = 1;
    c.auto = true;
    setHint(false);
  };

  // Back out through the light to the logo (Leave, or scrolling back from the middle).
  const goOut = (_all: boolean) => {
    const c = cam.current;
    if (c.mode !== "free") return;
    clearSaved();
    c.mode = "intro";
    c.p = 1;
    c.pGoal = 0;
    c.auto = true;
    c.glide = null;
    c.lockUntil = performance.now() + STEP_LOCK_MS;
  };

  /* ---------- opening a film or a door ---------- */

  const makeVeil = (background: string) => {
    const veil = document.createElement("div");
    Object.assign(veil.style, {
      position: "fixed",
      inset: "0",
      zIndex: "60",
      opacity: "0",
      pointerEvents: "none",
      background,
    });
    document.body.append(veil);
    return veil;
  };
  const fadeVeil = (veil: HTMLElement) =>
    veil
      .animate([{ opacity: 1 }, { opacity: 0 }], { duration: 600, delay: 150, fill: "forwards" })
      .finished.then(
        () => veil.remove(),
        () => veil.remove(),
      );

  /* Where you stand to look at film i up close: near enough that it fills the view. */
  const closeUpPose = (i: number) => {
    const s = gs.current!;
    const w = s.workCentre(i);
    const cam3 = s.camera;
    const hfov = 2 * Math.atan(Math.tan((cam3.fov * Math.PI) / 360) * cam3.aspect);
    const d = (0.88 * w.scale) / Math.tan(hfov / 2) / 0.8;
    return { x: w.x + w.nx * d, z: w.z + w.nz * d, yaw: w.yaw, y: 1.62 };
  };

  const workSlug = (i: number) => PROJECTS[i]?.slug;
  const showWork = (slug: string, replace = false) =>
    navigate({
      to: "/",
      search: { work: slug },
      mask: { to: "/projects/$slug", params: { slug } },
      replace,
    });

  // Walk up to the film; then it lifts off the wall into its case study.
  const openWork = (i: number) => {
    const c = cam.current;
    const s = gs.current;
    const slug = workSlug(i);
    if (!s || !slug || c.mode !== "free") return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    c.mode = "visit";
    c.visit = {
      t0: performance.now(),
      dur: reduce ? 1 : VISIT_MS,
      from: { ...c.pose },
      to: closeUpPose(i),
      door: -1,
      go: () => {
        const rect = stageRef.current?.getBoundingClientRect();
        flyFrom.current = rect ? s.screenRect(i, rect) : null;
        pushedSheet.current = true;
        showWork(slug);
      },
      gone: false,
    };
  };

  // The sheet follows the address: ?work=<slug> (shown as /projects/<slug>).
  useEffect(() => {
    const c = cam.current;
    const s = gs.current;
    const i = work ? PROJECTS.findIndex((p) => p.slug === work) : -1;
    if (work && i >= 0) {
      if (sheet && !sheet.closing) {
        if (sheet.slug === work) return;
        // "Next film": swap in place, and move behind the sheet to that film
        setSheet({ slug: work, flyFrom: null, closing: false });
      } else {
        setSheet({ slug: work, flyFrom: flyFrom.current, closing: false });
        flyFrom.current = null;
      }
      if (s && c.mode !== "intro") {
        const L = s.layout;
        const k = L.stops.findIndex((st) => st.kind === "work" && st.index === i);
        const to = closeUpPose(i);
        c.mode = "visit";
        c.at = k;
        c.visit = { t0: 0, dur: 1, from: to, to, door: -1, go: () => {}, gone: true };
      }
    } else if (sheet && !sheet.closing) {
      // Closed (×, Escape or Back): fade the sheet, step back from the film
      covered.current = false;
      setSheet({ ...sheet, closing: true });
      const i2 = PROJECTS.findIndex((p) => p.slug === sheet.slug);
      if (s && c.mode === "visit" && i2 >= 0) {
        const L = s.layout;
        const k = L.stops.findIndex((st) => st.kind === "work" && st.index === i2);
        const stop = L.stops[k];
        c.visit = {
          t0: performance.now(),
          dur: RETURN_MS,
          from: { ...c.pose },
          to: { ...leaned(L, poseAt(L.stops, stop.s), 1), y: EYE },
          door: -1,
          go: () => {
            c.mode = "free";
            c.visit = null;
            c.at = k;
            c.q = c.goal = stop.s;
            c.glide = null;
            c.lean = 1;
          },
          gone: false,
        };
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [work]);

  const closeSheet = useCallback(() => {
    if (pushedSheet.current) {
      pushedSheet.current = false;
      router.history.back();
    } else navigate({ to: "/", search: {}, replace: true });
  }, [navigate, router]);

  const openDoor = (i: number) => {
    const c = cam.current;
    const s = gs.current;
    if (!s || c.mode !== "free") return;
    writeSaved(s.layout.stops.length - 1);
    const to = i === 0 ? "/projects" : "/about";
    const go = () => navigate({ to });
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return go();
    const veil = makeVeil(
      "linear-gradient(90deg, rgba(31,44,255,.18), transparent 30%, transparent 70%, rgba(255,138,31,.2)), radial-gradient(circle at 50% 50%, #fff 0 40%, #fbfbfa 100%)",
    );
    c.mode = "visit";
    c.visit = {
      t0: performance.now(),
      dur: DOOR_MS,
      from: { ...c.pose },
      to: { x: s.doorX(i), z: s.front - 0.25, yaw: c.pose.yaw, y: 1.3 },
      door: i,
      veil,
      go: () => {
        go();
        fadeVeil(veil);
      },
      gone: false,
    };
  };

  // Clicking the film you're at opens it; clicking another walks you to it.
  const clickWork = (i: number, keyboard = false) => {
    const c = cam.current;
    const L = gs.current?.layout;
    if (!L) return;
    const k = L.stops.findIndex((st) => st.kind === "work" && st.index === i);
    const settled = c.at === k && !c.glide;
    if (settled || keyboard) openWork(i);
    else stepTo(k);
  };
  const clickDoor = (i: number, keyboard = false) => {
    const c = cam.current;
    const L = gs.current?.layout;
    if (!L) return;
    const last = L.stops.length - 1;
    if ((c.at === last && !c.glide) || keyboard) openDoor(i);
    else stepTo(last);
  };

  const handlers = useRef({ step, goIn, goOut, clickWork });
  handlers.current = { step, goIn, goOut, clickWork };

  /* ---------- input ---------- */

  useEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const wheel = (e: WheelEvent) => {
      e.preventDefault();
      const c = cam.current;
      const raw = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
      const d = raw * (e.deltaMode === 1 ? 16 : 1);
      const now = performance.now();
      if (c.mode === "intro") {
        if (now < c.lockUntil) return;
        setHint(false);
        if (c.auto && Math.sign(d) !== Math.sign(c.pGoal - c.p)) c.auto = false; // changed your mind
        if (c.auto) return;
        const next = clamp(c.pGoal + d / INTRO_SCROLL, 0, 1);
        if (d > 0 && next >= AUTO_FROM) {
          c.pGoal = 1; // far enough in: the light carries you the rest of the way
          c.auto = true;
        } else c.pGoal = next;
        return;
      }
      if (c.mode !== "free") return;
      // A trackpad keeps sending events after a flick: stay locked until they stop.
      if (now < c.lockUntil) {
        c.lockUntil = Math.max(c.lockUntil, now + 140);
        return;
      }
      if (Math.sign(d) !== Math.sign(c.wheelAcc)) c.wheelAcc = 0;
      c.wheelAcc += d;
      if (Math.abs(c.wheelAcc) >= 30) {
        handlers.current.step(c.wheelAcc > 0 ? 1 : -1);
        c.wheelAcc = 0;
        c.lockUntil = now + STEP_LOCK_MS;
      }
    };
    el.addEventListener("wheel", wheel, { passive: false });
    return () => el.removeEventListener("wheel", wheel);
  }, []);

  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      const c = cam.current;
      const t = e.target as HTMLElement | null;
      if (t?.closest?.("input, textarea, select, a, button")) return;
      const h = handlers.current;
      const fwd = ["ArrowDown", "ArrowRight", "PageDown", " "].includes(e.key);
      const back = ["ArrowUp", "ArrowLeft", "PageUp"].includes(e.key);
      if (c.mode === "intro") {
        if (fwd || e.key === "Enter") {
          e.preventDefault();
          h.goIn();
        }
        return;
      }
      if (c.mode !== "free") return;
      if (fwd || back) {
        e.preventDefault();
        h.step(fwd ? 1 : -1);
      } else if (e.key === "Enter") {
        const st = gs.current?.layout.stops[c.at];
        if (st?.kind === "work") h.clickWork(st.index, true);
      }
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, []);

  const onPointerDown = (e: React.PointerEvent) => {
    if (e.button > 0) return;
    Object.assign(cam.current.drag, {
      on: true,
      x0: e.clientX,
      y0: e.clientY,
      x: e.clientX,
      y: e.clientY,
      dist: 0,
      pointer: e.pointerType,
    });
  };
  const onPointerMove = (e: React.PointerEvent) => {
    const c = cam.current;
    const d = c.drag;
    if (d.on) {
      const dy = e.clientY - d.y;
      d.dist += Math.abs(e.clientX - d.x) + Math.abs(dy);
      d.x = e.clientX;
      d.y = e.clientY;
      const el = e.currentTarget as HTMLElement;
      if (d.dist > 6 && !el.hasPointerCapture(e.pointerId)) el.setPointerCapture(e.pointerId);
      if (c.mode === "intro" && d.dist > 6) {
        c.auto = false;
        c.pGoal = clamp(c.pGoal - dy / (INTRO_SCROLL * 0.6), 0, 1);
        if (c.pGoal >= AUTO_FROM && dy < 0) {
          c.pGoal = 1;
          c.auto = true;
        }
        setHint(false);
      }
      return;
    }
    // Hover: point at a film or door to show it can be clicked; doors open a little more.
    if (c.mode !== "free" || e.pointerType !== "mouse" || !gs.current || !stageRef.current) return;
    const hit = gs.current.pick(e.clientX, e.clientY, stageRef.current.getBoundingClientRect());
    c.hover = hit?.kind === "door" ? hit.index : -1;
    stageRef.current.style.cursor = hit ? "pointer" : "";
  };
  const onPointerUp = (e: React.PointerEvent) => {
    const c = cam.current;
    const d = c.drag;
    if (!d.on) return;
    d.on = false;
    if (c.mode !== "free" || !gs.current || !stageRef.current) return;
    const dx = d.x - d.x0;
    const dy = d.y - d.y0;
    if (d.dist <= 6) {
      const hit = gs.current.pick(e.clientX, e.clientY, stageRef.current.getBoundingClientRect());
      if (hit?.kind === "work") clickWork(hit.index);
      else if (hit?.kind === "door") clickDoor(hit.index);
      return;
    }
    const move = d.pointer === "mouse" || Math.abs(dx) > Math.abs(dy) ? dx : dy;
    if (Math.abs(move) > 40) step(move < 0 ? 1 : -1); // swipe left/up = next
  };

  return (
    <>
      <div
        ref={stageRef}
        aria-label="Gallery"
        className="fixed inset-0 select-none overflow-hidden bg-[#f2f0ec]"
        style={{ touchAction: "none" }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={() => (cam.current.drag.on = false)}
      >
        <h1 className="sr-only">{SITE.tagline}</h1>

        {/* The room */}
        <canvas ref={roomCanvas} aria-hidden className="absolute inset-0 h-full w-full" />

        {/* The logo you fly into */}
        <IntroDoor
          rootRef={introRef}
          scene={scene}
          logoGl={logoGl}
          onClick={() => {
            if (cam.current.drag.dist <= 6) goIn();
          }}
        />

        {/* The prism tunnel: shown only during the way in */}
        <canvas
          ref={tunnelCanvas}
          aria-hidden
          className="pointer-events-none absolute inset-0 h-full w-full"
          style={{ opacity: 0, visibility: "hidden" }}
        />

        {/* For keyboards and screen readers: every film and both doors */}
        <nav aria-label="Works in the gallery" className="sr-only">
          <ul>
            {PROJECTS.map((p, i) => (
              <li key={p.slug}>
                <button
                  type="button"
                  tabIndex={inside ? 0 : -1}
                  onFocus={() => {
                    const L = gs.current?.layout;
                    const k =
                      L?.stops.findIndex((st) => st.kind === "work" && st.index === i) ?? -1;
                    if (k >= 0) stepTo(k);
                  }}
                  onClick={() => clickWork(i, true)}
                >
                  {p.title}, {p.year}
                </button>
              </li>
            ))}
            {["All work", "About us"].map((label, i) => (
              <li key={label}>
                <button
                  type="button"
                  tabIndex={inside ? 0 : -1}
                  onFocus={() => {
                    const L = gs.current?.layout;
                    if (L) stepTo(L.stops.length - 1);
                  }}
                  onClick={() => clickDoor(i, true)}
                >
                  {label}
                </button>
              </li>
            ))}
          </ul>
        </nav>

        {/* Controls once inside */}
        <div
          className={cn(
            "pointer-events-none absolute inset-x-0 bottom-6 z-10 flex items-center justify-between gap-4 px-6 transition-opacity duration-700",
            inside ? "opacity-100" : "opacity-0",
          )}
        >
          <button
            type="button"
            onClick={() => goOut(true)}
            tabIndex={inside ? 0 : -1}
            className="tracked pointer-events-auto whitespace-nowrap rounded-md border border-black/10 bg-white/85 px-4 py-2.5 text-[10px] text-black/75 shadow-sm transition-colors hover:text-black"
          >
            ← Leave
          </button>
          <p
            className={cn(
              "tracked rounded-full bg-white/70 px-3 py-1.5 text-center text-[10px] text-black/55 transition-opacity duration-700",
              !hint && "opacity-0",
            )}
          >
            <span className="hidden sm:inline">Scroll for the next film</span>
            <span className="sm:hidden">Swipe for the next film</span>
          </p>
          <span className="w-[86px]" aria-hidden />
        </div>
      </div>
      {/* A film's case study, over the gallery */}
      {sheet && getProject(sheet.slug) && (
        <ProjectSheet
          project={getProject(sheet.slug)!}
          flyFrom={sheet.flyFrom}
          closing={sheet.closing}
          onRequestClose={closeSheet}
          onOpened={() => (covered.current = true)}
          onClosed={() => setSheet(null)}
          onNext={(slug) => showWork(slug, true)}
        />
      )}
    </>
  );
}

/* ---------- the logo you fly into ---------- */

function IntroDoor({
  rootRef,
  scene,
  logoGl,
  onClick,
}: {
  rootRef: React.RefObject<HTMLDivElement | null>;
  scene: React.RefObject<Record<string, HTMLElement | null>>;
  logoGl: React.RefObject<LogoDoorHandle | null>;
  onClick: () => void;
}) {
  const set = (name: string) => (el: HTMLElement | null) => {
    scene.current[name] = el;
  };
  const [glOk, setGlOk] = useState(true);
  useEffect(() => {
    // Only give up on WebGL if it's still failing after a few frames.
    let tries = 0;
    let id = 0;
    const check = () => {
      if (logoGl.current?.ok) return setGlOk(true);
      if (++tries < 6) id = requestAnimationFrame(check);
      else setGlOk(logoGl.current?.ok !== false);
    };
    id = requestAnimationFrame(check);
    return () => cancelAnimationFrame(id);
  }, [logoGl]);

  return (
    <div
      ref={rootRef}
      className="absolute inset-0 cursor-pointer overflow-hidden bg-[#fbfbfa]"
      onClick={onClick}
      role="button"
      aria-label="Go through the door into the gallery"
    >
      <LogoDoorCanvas handle={logoGl} className="absolute inset-0 h-full w-full" />
      {!glOk && (
        <img
          ref={set("fallback")}
          src="/brand/logo-stacked.webp"
          alt=""
          className="absolute max-w-none"
          style={{ clipPath: "inset(0 0 44% 0)" }}
        />
      )}
      <div
        ref={set("text")}
        className="pointer-events-none absolute inset-x-0 flex flex-col items-center px-6 text-center text-black"
        style={{ top: "70%" }}
      >
        <p className="tracked text-[clamp(1.05rem,2.6vw,1.9rem)] font-light">{SITE.tagline}</p>
        <span className="mt-5 block h-px w-16 bg-black/60" />
        <p className="mt-5 max-w-md text-[13px] leading-relaxed text-black/60">
          {SITE.description}
        </p>
      </div>
      <p
        ref={set("hint")}
        className="tracked pointer-events-none absolute inset-x-0 bottom-7 flex flex-col items-center gap-3 text-[10px] text-black/50"
      >
        Scroll to enter
        <span className="h-8 w-px overflow-hidden bg-black/10">
          <span
            className="block h-1/2 w-full bg-black/60"
            style={{ animation: "hint-line 1.8s ease-in-out infinite" }}
          />
        </span>
      </p>
    </div>
  );
}

/* ---------- the path through the room ---------- */

function poseAt(stops: Stop[], s: number): Pose {
  if (s <= stops[0].s) return stops[0];
  for (let i = 0; i < stops.length - 1; i++) {
    const a = stops[i];
    const b = stops[i + 1];
    if (s <= b.s) {
      const t = (s - a.s) / (b.s - a.s);
      return {
        x: a.x + (b.x - a.x) * t,
        z: a.z + (b.z - a.z) * t,
        yaw: a.yaw + (b.yaw - a.yaw) * t,
      };
    }
  }
  return stops[stops.length - 1];
}

// Step forwards from the path by how much you're leaning in at a film.
function leaned(L: Layout, p: Pose, lean: number): Pose {
  const d = (L.far - L.near) * smooth(lean);
  return { x: p.x - Math.sin(p.yaw) * d, z: p.z - Math.cos(p.yaw) * d, yaw: p.yaw };
}

function nearestStop(stops: Stop[], s: number) {
  let best = 0;
  stops.forEach((st, i) => {
    if (Math.abs(st.s - s) < Math.abs(stops[best].s - s)) best = i;
  });
  return best;
}

/* ---------- remembering your place when you open a page ---------- */

function readSaved(): number | null {
  try {
    const raw = sessionStorage.getItem(SAVE_KEY);
    const n = raw === null ? NaN : Number(raw);
    return Number.isInteger(n) && n >= 0 ? n : null;
  } catch {
    return null;
  }
}
function writeSaved(stop: number) {
  try {
    sessionStorage.setItem(SAVE_KEY, String(stop));
  } catch {
    /* private mode: you'll just start at the logo next time */
  }
}
function clearSaved() {
  try {
    sessionStorage.removeItem(SAVE_KEY);
  } catch {
    /* ignore */
  }
}
