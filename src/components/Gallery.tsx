import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useRouter, useSearch } from "@tanstack/react-router";
import { SITE, WORK_CLIENTS } from "@/content/site";
import { PROJECTS, getProject } from "@/content/projects";
import { ProjectSheet } from "@/components/work/ProjectSheet";
import { setStageTone } from "@/lib/stage";
import { cn } from "@/lib/utils";
import { LOGO, LogoDoorCanvas, type LogoDoorHandle } from "@/components/LogoDoor";
import type { GalleryScene, Layout, Pose, Stop } from "@/components/gallery3d/GalleryScene";
import type { PrismTunnel } from "@/components/gallery3d/PrismTunnel";

/*
  Two pages share this:

  The landing page (/, start="landing"): the Insight Lab logo (LogoDoor,
  drawn live with WebGL). Scrolling (or a swipe, a click, an arrow key) wakes
  it: its light breaks out and floods the view, and you land on the Work
  page, the site's home. No 3D room is loaded here.

  The gallery (/gallery, start="room"): you start standing back with the
  whole room in view: all six films playing, two on each of the three walls
  ahead of you. "VR view" steps inside: in a headset's browser (Meta Quest,
  Apple Vision Pro…) a real VR session (GalleryScene.enterVR); on a phone,
  the room side by side for a VR holder, looked round by moving the phone; on
  a computer, how to open it in a headset. Phones can also look round by
  moving (Motion); computers by moving the mouse, or A / D.

  The gallery itself is a real 3D room (gallery3d/GalleryScene, three.js): six
  films on the left, far and right walls, and two prism-lit doors on the wall
  behind you. From the overview, every scroll / swipe / arrow press moves one
  stop: the left wall, the far wall, the right wall, then you turn round to
  the doors. Click the
  film you're at to walk up to it and open its page; click a door to walk
  through it. (Leave goes back to the Work page.)
*/

type Mode = "intro" | "free" | "visit" | "walk";

/*
  Every film, in the order you walk past them: the studio's own first, then
  each initiative's together (in WORK_CLIENTS order), so each client has a
  section of the hall, titled on the wall (GalleryScene.addSections).
*/
const FILMS = [
  ...PROJECTS.filter((p) => !WORK_CLIENTS.some((c) => c.name === p.client)),
  ...WORK_CLIENTS.flatMap((c) => PROJECTS.filter((p) => p.client === c.name)),
];

/* Walking round the room (start="room"): your position, which way you face, how high your eyes are */
type Me = { x: number; z: number; yaw: number; pitch: number; y: number };
const WALK = 1.7; // m/s
const RUN = 3.3; // with Shift
const TURN = 1.9; // rad/s with ← →
const PRISM_R = 1.3; // you walk round the prism's plinth
const shortYaw = (from: number, to: number) =>
  from + Math.atan2(Math.sin(to - from), Math.cos(to - from));

/* ---------- timing ---------- */

const INTRO_SCROLL = 1000; // px of scrolling from the logo to the room
const ZOOM_END = 0.48; // by here the light fills the screen
const FLOOD: [number, number] = [0.34, 0.82]; // prism light floods the view
const INTRO_FADE: [number, number] = [0.74, 0.9]; // ...and fades into the room
const GLIDE: [number, number] = [0.66, 1]; // the camera settles in the middle of the room
const AUTO_FROM = 0; // any forward scroll plays the way in by itself...
const AUTO_SPEED = 24 / 9; // ...the logo's light bursts out, then the gallery: ~0.375 s

/*
  The prism journey, played by one scroll in under a second (progress 0 to 1),
  after the storyboard: the logo wakes (its panels part, light breaks out, the
  page darkens); its panels become the doors of a glass corridor, built in
  front of the gallery's entrance in the gallery's own 3D scene; they swing
  open, you travel down the corridor, the room appears at its far end, and
  you walk out of it into the room (see gallery3d/PrismTunnel.ts).
*/
const JOURNEY_SPEED = 24 / 9; // the storyboard's 9 frames at 24 fps: into the room in ~0.375 s
const WAKE: [number, number] = [0, 0.12]; // 02: the logo responds
const THRESHOLD: [number, number] = [0.03, 0.15]; // the logo grows towards you...
const HANDOVER = 0.135; // ...and its panels become the 3D doors here
const DOOR_ZOOM = 3.4; // how much the logo has grown by then: the doors fill the frame
const LOGO_OUT: [number, number] = [0.13, 0.16];
const USE_TUNNEL = false; // the corridor is parked: logo -> its light bursts -> gallery
const TUNNEL_FROM = 0.12; // the room's renderer draws the corridor from here (under the fading logo)
const TUNNEL: [number, number] = [0.13, 1]; // 03-07: doors, corridor, arrival

const STEP_LOCK_MS = 300; // one scroll gesture = one stop
const MIN_STEP_GAP = 280; // ms: never two steps closer than this, however the wheel behaves
const FOLLOW = 6; // catching up after a resize (steps themselves are timed glides)
const LEAN_IN = 3.4; // stepping in towards a film once you arrive
const LEAN_OUT = 6;
const VISIT_MS = 720; // walking up to a film, before it lifts off the wall
const RETURN_MS = 650; // stepping back from it when its page closes
const DOOR_MS = 1400; // walking through a door
const EYE = 1.6; // camera height, metres

/*
  Arriving out of the logo's light (without the corridor): one continuous
  camera move and one light curve, both easing out, from the moment the room
  appears until it comes to rest. Arrival happens part-way through, so the
  move carries on gently for a moment after you're in, rather than stopping dead.
*/
const ROOM_IN = 0.4; // progress where the room starts to show through the light
const SETTLE_S = 1.0; // seconds from the room appearing to the camera at rest
const DOLLY = 2.4; // metres the camera drifts forward over that time
const RISE = 0.14; // and how much it settles down to eye height
const GLOW = 0.35; // how much brighter the room starts, lit by the logo's light (much more reads as a flicker)
const settleK = (tau: number) => 1 - Math.pow(1 - clamp(tau / SETTLE_S, 0, 1), 3); // ease-out
const SAVE_KEY = "insight-gallery-stop";

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
const smooth = (t: number) => {
  const c = clamp(t, 0, 1);
  return c * c * (3 - 2 * c);
};
const band = (t: number, [a, b]: [number, number]) => smooth((t - a) / (b - a));
const damp = (rate: number, dt: number) => 1 - Math.exp(-rate * dt);
const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);
const wrapAngle = (a: number) => Math.atan2(Math.sin(a), Math.cos(a));
/* Walking a route: speed up over the first moments, a steady pace, slow to a stop (`a`: the share for each) */
const walkEase = (t: number, a: number) =>
  t < a
    ? (t * t) / (2 * a * (1 - a))
    : t > 1 - a
      ? 1 - (1 - t) ** 2 / (2 * a * (1 - a))
      : (t - a / 2) / (1 - a);
type RoutePt = { x: number; z: number; floor: number };
const pathLength = (p: RoutePt[]) =>
  p.reduce((n, q, i) => (i ? n + Math.hypot(q.x - p[i - 1].x, q.z - p[i - 1].z) : 0), 0);

/*
  A glide from `from` to `to`, starting at velocity m0 (in path units over the
  whole glide) and arriving at rest: a cubic Hermite curve. With m0 = 0 it eases
  in and out; when a new step arrives mid-glide, m0 carries the current speed
  over, so the camera never stops and restarts.
*/
type Glide = { from: number; to: number; t0: number; dur: number; m0: number };
const glideAt = (g: Glide, t: number) => {
  const t2 = t * t;
  const t3 = t2 * t;
  return (2 * t3 - 3 * t2 + 1) * g.from + (t3 - 2 * t2 + t) * g.m0 + (-2 * t3 + 3 * t2) * g.to;
};
/* Speed of a glide at t, in path units per second. */
const glideSpeed = (g: Glide, t: number) =>
  ((6 * t * t - 6 * t) * g.from + (3 * t * t - 4 * t + 1) * g.m0 + (-6 * t * t + 6 * t) * g.to) /
  (g.dur / 1000);

export function Gallery({ start }: { start: "landing" | "room" }) {
  const navigate = useNavigate();
  const router = useRouter();
  const { work } = useSearch({ strict: false }) as { work?: string };
  const room = start === "room";
  // What "VR view" can do here: a headset's own VR, a phone in a holder, or neither (explain)
  const [vrKind, setVrKind] = useState<"headset" | "phone" | "none">("none");
  const [vrOn, setVrOn] = useState<"" | "headset" | "phone">("");
  const vrRef = useRef(vrOn); // (for the frame loop)
  vrRef.current = vrOn;
  const [vrHelp, setVrHelp] = useState(false);
  const [motion, setMotion] = useState(false);
  const sceneMod = useRef<typeof import("@/components/gallery3d/GalleryScene") | null>(null);
  // What's in front of you, for the prompt: the film you face (and whether it
  // plays), a bench you can sit on, whether you're sitting
  const [hud, setHud] = useState({
    focus: -1,
    playing: false,
    sound: false,
    real: false,
    bench: -1,
    seated: false,
    door: -1, // the world's door you're at (2: About, 3: Contact)
    journey: { leg: 0, end: 0, to: 0, walking: false, name: "" },
  });
  // the journey bar's arrow (which way the next stop is) and distance, set every frame
  const journeyArrow = useRef<HTMLSpanElement>(null);
  const journeyDist = useRef<HTMLSpanElement>(null);
  const [joy, setJoy] = useState<null | { x0: number; y0: number; dx: number; dy: number }>(null);
  const [map, setMap] = useState(false);
  const mapMe = useRef<HTMLDivElement>(null);
  // the hall's plan, for the map (set once the room is built)
  const [plan, setPlan] = useState<null | {
    B: { minX: number; maxX: number; minZ: number; maxZ: number };
    works: { x: number; z: number; stop: number }[];
    benches: { x: number; z: number; along: boolean }[];
    prism: { x: number; z: number } | null;
    areas: { minX: number; maxX: number; minZ: number; maxZ: number; level: number }[];
    places: { name: string; x: number; z: number; stop: number }[];
  }>(null);
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
    glide: null as null | Glide,
    lean: 0,
    at: 0, // the stop you're at
    playing: -2,
    insideFlag: false,
    left: false, // the landing has handed over to the Work page
    // looking round (radians): where it's heading, and where it is
    // (gy, gp: the phone's motion; mx, my: unused)
    look: { yaw: 0, pitch: 0, gy: 0, gp: 0, mx: 0, my: 0 },
    // walking (the room)
    me: { x: 0, z: 0, yaw: 0, pitch: 0, y: EYE } as Me,
    floor: 0, // the height of the floor you're on (upstairs: 6)
    vel: { x: 0, z: 0 },
    bob: 0,
    tween: null as null | { from: Me; to: Me; t0: number; dur: number; then?: () => void },
    // walking the journey's way to a stop by yourself (round walls, up the stairs: GalleryScene.findPath)
    route: null as null | {
      pts: RoutePt[];
      cum: number[]; // distance along, at each point
      len: number;
      t0: number;
      dur: number;
      endYaw: number; // facing the stop, at the end
      to: number; // the stop
    },
    leg: 0, // where you are on the journey: the last of its stops you reached
    guideAt: 0, // when the floor guide was last laid
    guideFrom: { x: 0, z: 0, to: -1 },
    guideLen: 0, // how far it is along the guide
    seated: null as null | { bench: number; seat: number },
    keys: new Set<string>(),
    joy: null as null | { id: number; x0: number; y0: number; dx: number; dy: number },
    lookDrag: null as null | {
      id: number;
      x: number;
      y: number;
      dist: number;
      // where and when it began, and the view then (a quick flick up / down is a step, not a look)
      sx: number;
      sy: number;
      t0: number;
      yaw0: number;
      pitch0: number;
    },
    hudAt: 0, // when the prompt was last updated
    journeyFlag: false, // the header steps aside while this is true
    settleFrom: 0, // when the room appeared (ms), while the arrival move is still easing out
    pose: { x: 0, z: -0.5, yaw: 0, y: EYE },
    lockUntil: 0,
    wheelAcc: 0,
    // telling one scroll gesture from the next (see the wheel handler)
    wheelLast: 0, // time of the last wheel event
    wheelRecent: [] as number[], // sizes of the last few events
    wheelDir: 0, // and its direction
    wheelUsed: false, // this gesture has already moved you a stop
    lastStep: 0, // when the last step started
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
      if (!room) return; // the landing page has no room
      try {
        // Labels are drawn with the site font, so wait for it.
        await Promise.all([
          document.fonts?.load("500 40px Jost"),
          document.fonts?.load("400 40px Jost"),
        ]).catch(() => {});
        const mod = await import("@/components/gallery3d/GalleryScene");
        if (!alive || !roomCanvas.current) return;
        sceneMod.current = mod;
        mod.GalleryScene.vrSupported().then((ok) => {
          if (!alive) return;
          if (ok) setVrKind("headset");
          else if (window.matchMedia("(pointer: coarse)").matches) setVrKind("phone");
        });
        const coarse = window.matchMedia("(pointer: coarse)").matches;
        const s = new mod.GalleryScene(roomCanvas.current, {
          projects: FILMS,
          aspect: window.innerWidth / window.innerHeight,
          // Phones and tablets skip the floor mirror and shadows to stay smooth.
          hq: !coarse && window.innerWidth >= 700,
          world: room, // the gallery page: the atrium, the stairs, the rooms upstairs
        });
        s.setSize(window.innerWidth, window.innerHeight);
        gs.current = s;
        // the hall's plan, for the map
        setPlan({
          B: s.bounds,
          works: s.layout.works.map((w, i) => ({
            x: w.x,
            z: w.z,
            stop: s.layout.stops.findIndex((st) => st.kind === "work" && st.index === i),
          })),
          benches: s.benches.map((b) => ({ x: b.x, z: b.z, along: b.seats.length > 1 })),
          prism: s.prism,
          areas: s.areas,
          places: s.layout.stops
            .map((st, i) => ({ st, i }))
            .filter(({ st }) => st.kind === "place")
            .map(({ st, i }) => ({
              name: s.world?.places[st.index]?.name ?? "",
              x: st.x,
              z: st.z,
              stop: i,
            })),
        });
        // Draw the room once now, hidden under the logo, so every shader is
        // ready and the way in never stalls when the room first appears
        const st = s.layout.stops[0];
        s.setPose(st.x, EYE, st.z, st.yaw);
        s.render(0);

        // The prism corridor, for the way in (not with reduced motion; if it
        // can't start, the way in falls back to the light flood)
        if (USE_TUNNEL && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
          try {
            const tm = await import("@/components/gallery3d/PrismTunnel");
            if (alive) {
              const small = window.innerWidth < 700;
              const t = new tm.PrismTunnel(s, {
                quality: small ? "low" : coarse ? "medium" : "high",
              });
              // Compile every shader now, under the logo, so the journey never stalls
              t.warm(s.layout.stops[0]);
              tunnel.current = t;
            }
          } catch (err) {
            console.warn("The prism tunnel couldn't start:", err);
          }
        }

        // In the room from the start (back where you were, if you've just been
        // to a page from it)
        const saved = readSaved() ?? 0;
        {
          const c = cam.current;
          const stops = s.layout.stops;
          c.mode = "walk";
          c.p = c.pGoal = 1;
          c.at = Math.min(saved, stops.length - 1);
          c.leg = c.at <= s.layout.end ? c.at : 0;
          const st = stops[c.at];
          c.me = { x: st.x, z: st.z, yaw: st.yaw, pitch: 0, y: EYE };
          c.insideFlag = true;
          drawIntro(1);
          setInside(true);
          setHint(false);
        }
      } catch (err) {
        console.warn("The 3D gallery couldn't start:", err);
        failed.current = true;
        navigate({ to: "/projects" }); // no 3D here: the work instead
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
        if (!room) {
          // The landing: once its light has filled the view, on to the Work page
          if (c.p > 0.6 && !c.left) {
            c.left = true;
            navigate({ to: "/projects" });
          }
        } else if (!s) {
          c.p = Math.min(c.p, 0.78); // wait in the light until the room is ready
        }
        drawIntro(c.p);
        // Behind the light you're already in the room, gliding the last stretch
        // to the spot that shows the whole gallery.
        const first: Pose = L?.stops[0] ?? { x: 0, z: 4, yaw: 0 };
        if (T) {
          const g = smooth(band(c.p, GLIDE));
          pose = { x: first.x, z: first.z + 1.5 * (1 - g), yaw: first.yaw, y: EYE };
        } else {
          const k = settleK(Math.max(0, (c.p - ROOM_IN) / AUTO_SPEED));
          pose = {
            x: first.x + Math.sin(first.yaw) * DOLLY * (1 - k),
            z: first.z + Math.cos(first.yaw) * DOLLY * (1 - k),
            yaw: first.yaw,
            y: EYE + RISE * (1 - k),
          };
        }
        // bright in the corridor, settling to the room's own as you arrive
        exposure = T
          ? 1 + 0.15 * (1 - smooth(band(c.p, [0.8, 1])))
          : 1 + GLOW * Math.pow(1 - settleK(Math.max(0, (c.p - ROOM_IN) / AUTO_SPEED)), 2); // bright out of the light, settling
        const isIn = c.p > (T ? 0.97 : 0.85); // the gallery's controls return once you've arrived
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
          // ...and the arrival move eases out from where it is
          if (!T) c.settleFrom = now - ((1 - ROOM_IN) / AUTO_SPEED) * 1000;
          c.wheelAcc = 0;
        }
      } else if (c.mode === "free" && L) {
        if (c.glide) {
          const t = clamp((now - c.glide.t0) / c.glide.dur, 0, 1);
          c.q = glideAt(c.glide, t);
          if (t >= 1) c.glide = null;
        } else {
          c.q += (c.goal - c.q) * damp(FOLLOW, dt);
          if (Math.abs(c.goal - c.q) < 0.002) c.q = c.goal;
        }
        const here = L.stops[nearestStop(L.stops, c.q)];
        const near = here.kind === "work" && Math.abs(c.q - here.s) < L.span * 0.3 && !c.glide;
        c.lean += ((near ? 1 : 0) - c.lean) * damp(near ? LEAN_IN : LEAN_OUT, dt);
        pose = { ...leaned(L, poseAt(L.stops, c.q), c.lean), y: EYE };
        if (c.settleFrom > 0) {
          // the last of the arrival move, easing to rest
          const k = settleK((now - c.settleFrom) / 1000);
          pose.x += Math.sin(pose.yaw) * DOLLY * (1 - k);
          pose.z += Math.cos(pose.yaw) * DOLLY * (1 - k);
          pose.y += RISE * (1 - k);
          exposure = 1 + GLOW * Math.pow(1 - k, 2);
          if (k >= 1) c.settleFrom = 0;
        }
      } else if (c.mode === "walk" && L && s) {
        walkFrame(c, s, L, dt, now);
        const me = c.me;
        pose = { x: me.x, z: me.z, yaw: me.yaw, y: me.y };
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

      // Looking round: eased towards where the mouse, the keys or the phone point
      const lk = c.look;
      lk.yaw += (lk.gy + lk.mx - lk.yaw) * damp(motion ? 14 : 6, dt);
      lk.pitch += (lk.gp + lk.my - lk.pitch) * damp(motion ? 14 : 6, dt);
      const looking = c.mode !== "intro";

      if (s && L) {
        // The doors: ajar when you arrive, wider under the mouse, wide open when clicked.
        const end = L.stops.find((st) => st.kind === "doors") ?? L.stops[L.stops.length - 1];
        const parked =
          c.mode === "walk"
            ? Math.hypot(c.me.x - end.x, c.me.z - end.z) < 3.2
            : c.mode !== "intro" && Math.abs(c.q - end.s) < L.span * 0.3;
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
        const roomFrom = T ? 0.42 : ROOM_IN; // films play once they show at the corridor's far end
        const playAt = c.mode === "intro" ? (c.p > roomFrom ? 0 : -1) : c.at;
        if (playAt !== c.playing) {
          c.playing = playAt;
          s.playNear(playAt);
        }
        // Draw the room whenever it can be seen (with the corridor, from the start of the journey).
        const journeyOn = !!T && c.mode === "intro" && c.p >= TUNNEL_FROM;
        if (T && !journeyOn) T.end();
        if ((c.mode !== "intro" || c.p > (T ? TUNNEL_FROM : roomFrom)) && !covered.current) {
          if (journeyOn) {
            const t = clamp((c.p - TUNNEL[0]) / (TUNNEL[1] - TUNNEL[0]), 0, 1);
            T.update(t, (now - t0) / 1000, L.stops[0]);
          } else if (!s.inVR)
            s.setPose(
              pose.x,
              pose.y,
              pose.z,
              pose.yaw + (looking ? lk.yaw : 0),
              (looking ? lk.pitch : 0) + (c.mode === "walk" ? c.me.pitch : 0),
            );
          s.setExposure(exposure);
          s.render((now - t0) / 1000);
        }
      }
      c.pose = pose;

      // The header steps aside for the journey, and returns in the gallery
      const journey = !!T && c.mode === "intro" && c.p > 0.15 && c.p < 0.85; // header stays for frames 01-02, back for 07-09
      if (journey !== c.journeyFlag) {
        c.journeyFlag = journey;
        document.documentElement.classList.toggle("journey", journey);
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [motion]);

  /* ---------- the logo, for the current progress ---------- */

  function drawIntro(p: number) {
    const { w: W, h: H } = viewRef.current;
    const s = scene.current;
    const T = !!tunnel.current;
    const e = T ? band(p, THRESHOLD) : 0; // without the corridor the logo stays put
    const s0 = Math.min((H * 0.4) / LOGO.height, (W * 0.62) / 215);
    const zoomOf = (x: number) => Math.exp(Math.log(T ? DOOR_ZOOM : 120) * Math.pow(x, 1.7));
    const zoom = zoomOf(e);
    // The 3D doors take over at the size the logo has reached
    if (T)
      tunnel.current!.setDoorFraction((LOGO.height * s0 * zoomOf(band(HANDOVER, THRESHOLD))) / H);
    const scale = s0 * zoom;
    const markY = H * 0.4;
    const restX = W / 2 + (LOGO.focus.x - LOGO.center.x) * s0;
    const restY = markY + (LOGO.focus.y - LOGO.center.y) * s0;
    const k = smooth(e);
    const fx = restX + (W / 2 - restX) * k;
    const fy = restY + (H / 2 - restY) * k;
    const fade = 1 - band(p, T ? LOGO_OUT : [0.38, 0.92]);
    if (fade > 0) {
      if (logoGl.current?.ok) {
        logoGl.current.draw(scale, { x: fx, y: fy }, 0, band(p, T ? WAKE : [0, 0.35]));
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
      const out = band(p, T ? [0.1, 0.16] : [0.5, 0.85]);
      s.text.style.top = `${bottom + 34}px`;
      s.text.style.opacity = String(1 - out);
      s.text.style.transform = `translateY(${out * 40}px)`;
    }
    if (introRef.current) {
      introRef.current.style.opacity = String(fade);
      introRef.current.style.visibility = fade <= 0 ? "hidden" : "visible";
    }
    if (s.hint)
      s.hint.style.opacity = String(1 - band(p, tunnel.current ? [0, 0.05] : [0.45, 0.85]));
  }

  /* ---------- walking round the room ---------- */

  const SEATED = 1.18; // eye height on a bench

  // One frame of walking: a tween (to a film, a seat), or keys / the joystick,
  // kept inside the walls and round the prism and the benches.
  function walkFrame(c: typeof cam.current, s: GalleryScene, L: Layout, dt: number, now: number) {
    const me = c.me;
    // a movement key or the joystick takes over from walking by yourself (you stop where you are)
    const steering =
      ["w", "a", "s", "d", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].some((k) =>
        c.keys.has(k),
      ) ||
      (!!c.joy && Math.hypot(c.joy.dx, c.joy.dy) > 8);
    if (steering && c.route) {
      c.route = null;
      updateHud();
    }
    // a look round while walking a route eases back to straight ahead once you let go
    if (!c.lookDrag) {
      c.look.mx += (0 - c.look.mx) * damp(1.6, dt);
      c.look.my += (0 - c.look.my) * damp(1.6, dt);
    }
    if (c.route) {
      const r = c.route;
      const t = clamp((now - r.t0) / r.dur, 0, 1);
      const d = r.len * walkEase(t, Math.min(0.3, 750 / r.dur));
      const at = routePoint(r, d);
      const px = me.x;
      const pz = me.z;
      me.x = at.x;
      me.z = at.z;
      c.floor = s.floorAt(me.x, me.z, c.floor) ?? c.floor;
      // look where you're going; over the last few metres, turn to face the stop
      const ahead = routePoint(r, Math.min(r.len, d + 1.8));
      const goingYaw =
        Math.hypot(ahead.x - me.x, ahead.z - me.z) > 0.05
          ? Math.atan2(-(ahead.x - me.x), -(ahead.z - me.z))
          : r.endYaw;
      const settle = r.len < 2.5 ? t : clamp(1 - (r.len - d - 0.3) / 2.6, 0, 1);
      const goal = goingYaw + wrapAngle(r.endYaw - goingYaw) * smooth(settle);
      me.yaw += wrapAngle(goal - me.yaw) * damp(5.5, dt);
      me.pitch += (0 - me.pitch) * damp(4, dt);
      const v = Math.hypot(me.x - px, me.z - pz) / Math.max(dt, 1e-3);
      if (v > 0.15) c.bob += dt * v * 5.2;
      const bob = v > 0.15 ? Math.sin(c.bob) * 0.018 * Math.min(1, v / WALK) : 0;
      me.y += (c.floor + EYE + bob - me.y) * damp(12, dt);
      c.vel.x = c.vel.z = 0;
      if (t >= 1) {
        c.route = null;
        if (r.to <= L.end) c.leg = r.to;
        // finish facing the stop squarely
        if (Math.abs(wrapAngle(r.endYaw - me.yaw)) > 0.01)
          tweenTo({ x: me.x, z: me.z, yaw: r.endYaw, y: c.floor + EYE }, updateHud, 260);
        else updateHud();
      }
    } else if (c.tween) {
      const tw = c.tween;
      const t = clamp((now - tw.t0) / tw.dur, 0, 1);
      const e = easeInOut(t);
      me.x = tw.from.x + (tw.to.x - tw.from.x) * e;
      me.z = tw.from.z + (tw.to.z - tw.from.z) * e;
      me.y = tw.from.y + (tw.to.y - tw.from.y) * e;
      me.yaw = tw.from.yaw + (tw.to.yaw - tw.from.yaw) * e;
      me.pitch = tw.from.pitch + (tw.to.pitch - tw.from.pitch) * e;
      c.vel.x = c.vel.z = 0;
      if (t >= 1) {
        c.tween = null;
        c.floor = s.floorAt(me.x, me.z, me.y - EYE) ?? c.floor;
        tw.then?.();
      }
    } else {
      const k = c.keys;
      let fwd = 0;
      let side = 0;
      let turn = 0;
      if (k.has("w") || k.has("ArrowUp")) fwd += 1;
      if (k.has("s") || k.has("ArrowDown")) fwd -= 1;
      if (k.has("a")) side -= 1;
      if (k.has("d")) side += 1;
      if (k.has("ArrowLeft")) turn += 1;
      if (k.has("ArrowRight")) turn -= 1;
      if (c.joy) {
        fwd += clamp(-c.joy.dy / 55, -1, 1);
        side += clamp(c.joy.dx / 55, -1, 1);
      }
      const amount = Math.min(1, Math.hypot(fwd, side));
      if (amount > 0.08 && c.seated) return standUp();
      const speed = (k.has("Shift") ? RUN : WALK) * amount;
      const n = Math.hypot(fwd, side) || 1;
      const fx = -Math.sin(me.yaw);
      const fz = -Math.cos(me.yaw);
      const rx = Math.cos(me.yaw);
      const rz = -Math.sin(me.yaw);
      c.vel.x += (((fx * fwd + rx * side) / n) * speed - c.vel.x) * damp(9, dt);
      c.vel.z += (((fz * fwd + rz * side) / n) * speed - c.vel.z) * damp(9, dt);
      // walls, the prism, benches, sculptures; up and down the stairs (GalleryScene.move)
      const step = s.move(me.x, me.z, c.floor, me.x + c.vel.x * dt, me.z + c.vel.z * dt);
      const nx = step.x;
      const nz = step.z;
      c.floor = step.floor;
      me.x = nx;
      me.z = nz;
      me.yaw += turn * TURN * dt;
      const v = Math.hypot(c.vel.x, c.vel.z);
      if (v > 0.15) c.bob += dt * v * 5.2;
      const bob = v > 0.15 ? Math.sin(c.bob) * 0.02 * Math.min(1, v / WALK) : 0;
      me.y += (c.floor + (c.seated ? SEATED : EYE) + bob - me.y) * damp(12, dt);
    }
    // the nearest stop (on your floor): which films play, whether the doors open
    let best = 0;
    const d2 = (st: Stop) =>
      (st.x - me.x) ** 2 + (st.z - me.z) ** 2 + (Math.abs((st.y ?? 0) - c.floor) > 2 ? 1e6 : 0);
    L.stops.forEach((st, i) => {
      if (d2(st) < d2(L.stops[best])) best = i;
    });
    // (while walking to a stop by itself, the tour's place stays the stop you're going to)
    if (!c.tween && !c.route) c.at = best;
    // walking about freely and reaching one of the journey's stops: you're there on the journey
    if (!c.route && best <= L.end && d2(L.stops[best]) < 1.8 * 1.8) c.leg = best;
    guideFrame(c, s, L, now);
    if (now - c.hudAt > 140) {
      c.hudAt = now;
      updateHud();
    }
    // where you are on the map
    const el = mapMe.current;
    if (el) {
      const B = s.bounds;
      // the map lies on its side: the entrance at the left, the far wall at the right
      el.style.left = `${((B.maxZ + 0.6 - me.z) / (B.maxZ - B.minZ + 1.2)) * 100}%`;
      el.style.top = `${((me.x - (B.minX - 0.55)) / (B.maxX - B.minX + 1.1)) * 100}%`;
      el.style.transform = `translate(-50%, -50%) rotate(${-(me.yaw + c.look.yaw)}rad)`;
    }
  }

  /* Where a route is, `d` metres along it */
  function routePoint(r: { pts: RoutePt[]; cum: number[] }, d: number) {
    let i = 1;
    while (i < r.cum.length - 1 && r.cum[i] < d) i++;
    const a = r.pts[i - 1];
    const b = r.pts[i];
    const seg = r.cum[i] - r.cum[i - 1];
    const t = seg > 0 ? clamp((d - r.cum[i - 1]) / seg, 0, 1) : 1;
    return { x: a.x + (b.x - a.x) * t, z: a.z + (b.z - a.z) * t };
  }

  /*
    The way on, while you walk about yourself: a line of light on the floor
    to the journey's next stop (laid again as you move), and on the journey
    bar, which way it is and how far. Hidden while you walk a route, sit, or
    look through a phone in a holder.
  */
  function guideFrame(c: typeof cam.current, s: GalleryScene, L: Layout, now: number) {
    const next = Math.min(L.end, c.leg + 1);
    const st = L.stops[next];
    const me = c.me;
    const show = !c.route && !c.tween && !c.seated && !vrRef.current && next !== c.leg;
    // which way, and how far (every frame: it turns as you look round)
    const target = c.route ? L.stops[c.route.to] : st;
    if (journeyArrow.current && target) {
      const yaw = Math.atan2(-(target.x - me.x), -(target.z - me.z));
      const rel = wrapAngle(yaw - (me.yaw + c.look.yaw));
      journeyArrow.current.style.transform = `rotate(${-rel}rad)`;
    }
    if (journeyDist.current && target) {
      const left = c.route
        ? c.route.len * (1 - clamp((now - c.route.t0) / c.route.dur, 0, 1))
        : show && c.guideFrom.to === next
          ? c.guideLen
          : Math.hypot(target.x - me.x, target.z - me.z);
      journeyDist.current.textContent = left < 1.2 ? "here" : `${Math.round(left)} m`;
    }
    if (now - c.guideAt < 280) return;
    if (!show) {
      if (c.guideFrom.to !== -1) {
        s.setGuide(null);
        c.guideFrom.to = -1;
      }
      return;
    }
    const moved = Math.hypot(me.x - c.guideFrom.x, me.z - c.guideFrom.z);
    if (c.guideFrom.to === next && moved < 0.7) return;
    c.guideAt = now;
    const path = s.findPath({ x: me.x, z: me.z, floor: c.floor }, { ...st, floor: st.y ?? 0 });
    s.setGuide(path);
    c.guideFrom = { x: me.x, z: me.z, to: next };
    c.guideLen = path ? pathLength(path) : Math.hypot(st.x - me.x, st.z - me.z);
  }

  function updateHud() {
    const c = cam.current;
    const s = gs.current;
    if (!s) return;
    const me = c.me;
    const focus = c.mode === "walk" ? s.facing(me.x, me.z, me.yaw + c.look.yaw, c.floor) : -1;
    // the nearest bench within reach (from a film's viewing spot, the one in front of it)
    let bench = -1;
    let bestD = 4.2;
    if (!c.seated)
      s.benches.forEach((b, i) => {
        if (Math.abs((b.floor ?? 0) - c.floor) > 1) return; // another floor
        const d = Math.hypot(b.x - me.x, b.z - me.z);
        if (d < bestD) {
          bestD = d;
          bench = i;
        }
      });
    const st = focus >= 0 ? s.workState(focus) : { playing: false, sound: false, real: false };
    // a door out (About, Contact) you're looking at, near enough, on its floor
    let door = -1;
    let bestAhead = 0.94;
    s.worldDoors.forEach((d, j) => {
      const dx = d.x - me.x;
      const dz = d.z - me.z;
      const dist = Math.hypot(dx, dz);
      const yaw = me.yaw + c.look.yaw;
      const ahead = (-Math.sin(yaw) * dx - Math.cos(yaw) * dz) / (dist || 1);
      if (c.floor > 3 && dist < 9.5 && ahead > bestAhead) {
        bestAhead = ahead;
        door = 2 + j;
      }
    });
    // the journey: where you are on it, and the stop you're making for (walking there, or next)
    const L = s.layout;
    const leg = Math.min(c.leg, L.end);
    const to = c.route ? c.route.to : Math.min(L.end, leg + 1);
    const journey = {
      leg,
      end: L.end,
      to,
      walking: !!c.route,
      name: stopName(s, L.stops[to]),
    };
    const next = {
      focus: door >= 0 ? -1 : focus,
      ...st,
      bench,
      seated: !!c.seated,
      door,
      journey,
    };
    setHud((h) => (JSON.stringify(h) === JSON.stringify(next) ? h : next));
  }

  /* Walk (smoothly, by itself) to a pose; then `then`. */
  const tweenTo = (to: Omit<Me, "pitch"> & { pitch?: number }, then?: () => void, minMs = 450) => {
    const c = cam.current;
    const from = { ...c.me };
    const yaw = shortYaw(from.yaw, to.yaw);
    const dist = Math.hypot(to.x - from.x, to.z - from.z);
    const dur = window.matchMedia("(prefers-reduced-motion: reduce)").matches
      ? 1
      : clamp((dist / 2.4) * 1000 + Math.abs(yaw - from.yaw) * 320, minMs, 2600);
    c.tween = { from, to: { ...to, yaw, pitch: to.pitch ?? 0 }, t0: performance.now(), dur, then };
  };

  /* The guided tour: walk to stop i (a film, the overview, the doors) */
  const tourTo = (i: number) => {
    const c = cam.current;
    const L = gs.current?.layout;
    if (!L || !L.stops[i] || c.mode !== "walk") return;
    c.seated = null;
    c.at = i;
    const st = L.stops[i];
    c.look.gy = c.look.gp = 0;
    const s = gs.current!;
    const f = s.floorAt(st.x, st.z, st.y ?? c.floor) ?? 0;
    setHint(false);
    c.lastStep = performance.now();
    c.tween = null;
    // walk there, as a person would (round walls, through doorways, up the stairs)
    const path = s.findPath({ x: c.me.x, z: c.me.z, floor: c.floor }, { ...st, floor: st.y ?? 0 });
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const len = path ? pathLength(path) : Infinity;
    if (path && len < 0.4) {
      c.route = null;
      if (i <= L.end) c.leg = i;
      tweenTo({ x: st.x, z: st.z, yaw: st.yaw, y: f + EYE }, updateHud, 350);
      return;
    }
    if (path && len < 75 && !reduced) {
      const cum = [0];
      for (let k = 1; k < path.length; k++)
        cum.push(cum[k - 1] + Math.hypot(path[k].x - path[k - 1].x, path[k].z - path[k - 1].z));
      // a brisk walk; a long way a little quicker, so no walk takes much over ten seconds
      const speed = Math.max(2.3, len / 9.5);
      c.route = {
        pts: path,
        cum,
        len,
        t0: performance.now(),
        dur: (len / speed) * 1000 + 700,
        endYaw: st.yaw,
        to: i,
      };
      s.setGuide(null);
      c.guideFrom.to = -1;
      updateHud();
      return;
    }
    // no walk there (or a long way, from the map; or reduced motion): fade across, as a game's fast travel
    c.route = null;
    const veil = makeVeil("radial-gradient(circle at 50% 50%, #fff 0 45%, #f6f2ea 100%)");
    veil.style.transition = "opacity 260ms ease";
    requestAnimationFrame(() => (veil.style.opacity = "1"));
    window.setTimeout(() => {
      c.tween = null;
      c.me = { x: st.x, z: st.z, yaw: st.yaw, pitch: 0, y: f + EYE };
      c.floor = f;
      c.vel.x = c.vel.z = 0;
      if (i <= L.end) c.leg = i;
      updateHud();
      fadeVeil(veil);
    }, 300);
  };

  /* Sit on bench i, facing the wall you're nearer facing */
  const sitDown = (i: number) => {
    const c = cam.current;
    const b = gs.current?.benches[i];
    if (!b || c.mode !== "walk") return;
    const seat = b.seats.reduce((a, x) =>
      Math.abs(Math.atan2(Math.sin(x.yaw - c.me.yaw), Math.cos(x.yaw - c.me.yaw))) <
      Math.abs(Math.atan2(Math.sin(a.yaw - c.me.yaw), Math.cos(a.yaw - c.me.yaw)))
        ? x
        : a,
    );
    c.seated = null;
    tweenTo(
      { x: seat.x, z: seat.z, yaw: seat.yaw, y: (b.floor ?? 0) + SEATED, pitch: 0.02 },
      () => {
        c.seated = { bench: i, seat: b.seats.indexOf(seat) };
        updateHud();
      },
      800,
    );
  };
  function standUp() {
    const c = cam.current;
    if (!c.seated) return;
    const me = c.me;
    c.seated = null;
    tweenTo(
      {
        x: me.x - Math.sin(me.yaw) * 0.6,
        z: me.z - Math.cos(me.yaw) * 0.6,
        yaw: me.yaw,
        y: c.floor + EYE,
      },
      updateHud,
      420,
    );
  }

  /* Play / pause the film in front of you (with sound the first time) */
  const playFocus = () => {
    const s = gs.current;
    const i = hudRef.current.focus;
    if (!s || i < 0) return;
    s.toggleWork(i);
    updateHud();
  };
  const hudRef = useRef(hud);
  hudRef.current = hud;

  /* ---------- moving ---------- */

  const stepTo = (i: number) => {
    const c = cam.current;
    const L = gs.current?.layout;
    if (!L || !L.stops[i] || c.mode !== "free") return;
    c.at = i;
    c.goal = L.stops[i].s;
    const d = Math.abs(c.goal - c.q);
    const now = performance.now();
    // Quick and smooth: about 0.4 s to a neighbour; the longer first move from the
    // overview to the left wall gets a little more, so it never lurches.
    const dur = clamp(300 + d * 40, 380, 850);
    // Already gliding? Carry its speed into the new glide (no stop and restart).
    let m0 = 0;
    if (c.glide) {
      const v = glideSpeed(c.glide, clamp((now - c.glide.t0) / c.glide.dur, 0, 1));
      m0 = v * (dur / 1000);
      const span = c.goal - c.q;
      // never so fast it would overshoot the new stop
      m0 =
        Math.sign(m0) === Math.sign(span)
          ? Math.min(Math.abs(m0), Math.abs(span) * 1.5) * Math.sign(span)
          : 0;
    }
    c.glide = { from: c.q, to: c.goal, t0: now, dur, m0 };
    c.lastStep = now;
    setHint(false);
  };

  const step = (dir: 1 | -1) => {
    const c = cam.current;
    const L = gs.current?.layout;
    if (c.mode === "walk" && L) {
      // along the journey, from where you are on it (or from where you're walking to)
      const from = c.route ? c.route.to : c.leg;
      const to = clamp(from + dir, 0, L.end);
      if (to === from && !c.route) return;
      return tourTo(to);
    }
    if (c.mode !== "free" || !L) return;
    if (dir < 0 && c.at === 0) return room ? undefined : goOut(false);
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
    return { x: w.x + w.nx * d, z: w.z + w.nz * d, yaw: w.yaw, y: w.y + 1.62 };
  };

  const workSlug = (i: number) => FILMS[i]?.slug;
  const showWork = (slug: string, replace = false) =>
    navigate({
      to: "/gallery",
      search: { work: slug },
      mask: { to: "/projects/$slug", params: { slug } },
      replace,
    });

  // Walk up to the film; then it lifts off the wall into its case study.
  const openWork = (i: number) => {
    const c = cam.current;
    const s = gs.current;
    const slug = workSlug(i);
    if (!s || !slug || (c.mode !== "free" && c.mode !== "walk")) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    c.tween = null;
    c.seated = null;
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
    const i = work ? FILMS.findIndex((p) => p.slug === work) : -1;
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
      const i2 = FILMS.findIndex((p) => p.slug === sheet.slug);
      if (s && c.mode === "visit" && i2 >= 0) {
        const L = s.layout;
        const k = L.stops.findIndex((st) => st.kind === "work" && st.index === i2);
        const stop = L.stops[k];
        c.visit = {
          t0: performance.now(),
          dur: RETURN_MS,
          from: { ...c.pose },
          to: room
            ? {
                x: stop.x,
                z: stop.z,
                yaw: stop.yaw,
                y: (s.floorAt(stop.x, stop.z, c.floor) ?? 0) + EYE,
              }
            : { ...leaned(L, poseAt(L.stops, stop.s), 1), y: EYE },
          door: -1,
          go: () => {
            c.mode = room ? "walk" : "free";
            c.visit = null;
            c.at = k;
            c.q = c.goal = stop.s;
            c.glide = null;
            c.lean = 1;
            c.floor = s.floorAt(stop.x, stop.z, c.floor) ?? 0;
            c.me = { x: stop.x, z: stop.z, yaw: stop.yaw, pitch: 0, y: c.floor + EYE };
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
    } else navigate({ to: "/gallery", search: {}, replace: true });
  }, [navigate, router]);

  const openDoor = (i: number) => {
    const c = cam.current;
    const s = gs.current;
    if (!s || (c.mode !== "free" && c.mode !== "walk")) return;
    c.tween = null;
    writeSaved(
      Math.max(
        0,
        s.layout.stops.findIndex((st) => st.kind === "doors"),
      ),
    );
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
    if (c.mode === "walk") {
      // far: walk up to it; there: play / pause it
      const st = L.stops[k];
      if (keyboard) return openWork(i);
      if (Math.hypot(st.x - c.me.x, st.z - c.me.z) > 2.6) return tourTo(k);
      gs.current?.toggleWork(i);
      return updateHud();
    }
    const settled = c.at === k && !c.glide;
    if (settled || keyboard) openWork(i);
    else stepTo(k);
  };
  /*
    The world's doors, at its end (About, Contact): from afar, walk to them;
    there, step up to the door and through it, into its page.
  */
  const openWorldDoor = (i: number) => {
    const c = cam.current;
    const s = gs.current;
    const d = s?.worldDoors[i - 2];
    if (!s || !d || c.mode !== "walk") return;
    c.seated = null;
    const go = () => navigate({ to: d.to });
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return go();
    tweenTo({ x: d.x, z: d.z + 1.1, yaw: 0, y: c.floor + EYE }, undefined, 700);
    const veil = makeVeil("radial-gradient(circle at 50% 50%, #fff 0 45%, #fbfbfa 100%)");
    veil.style.transition = "opacity 650ms ease";
    window.setTimeout(() => (veil.style.opacity = "1"), 350);
    window.setTimeout(() => {
      go();
      fadeVeil(veil);
    }, 1050);
  };
  const clickDoor = (i: number, keyboard = false) => {
    const c = cam.current;
    const L = gs.current?.layout;
    if (!L) return;
    if (i >= 2) {
      const d = gs.current!.worldDoors[i - 2];
      if (!d) return;
      const near = c.floor > 3 && Math.hypot(d.x - c.me.x, d.z - c.me.z) < 9.5;
      if (keyboard || near) return openWorldDoor(i);
      const k = gs.current!.worldDoorStop();
      return k >= 0 ? tourTo(k) : undefined;
    }
    const last = Math.max(
      0,
      L.stops.findIndex((st) => st.kind === "doors"),
    );
    if (c.mode === "walk") {
      const st = L.stops[last];
      if (keyboard || Math.hypot(st.x - c.me.x, st.z - c.me.z) < 3.4) return openDoor(i);
      return tourTo(last);
    }
    if ((c.at === last && !c.glide) || keyboard) openDoor(i);
    else stepTo(last);
  };

  /* ---------- VR, and looking round ---------- */

  // Moving the phone looks round (asks first on iPhone). `full`: all the way
  // round (side by side in a holder); otherwise a gentle look either side.
  const motionRef = useRef({
    on: false,
    full: false,
    base: null as null | { yaw: number; pitch: number },
  });
  const startMotion = async (full: boolean) => {
    const DOE = window.DeviceOrientationEvent as unknown as
      { requestPermission?: () => Promise<"granted" | "denied"> } | undefined;
    if (!DOE) return false;
    if (typeof DOE.requestPermission === "function") {
      const r = await DOE.requestPermission().catch(() => "denied" as const);
      if (r !== "granted") return false;
    }
    motionRef.current = { on: true, full, base: null };
    setMotion(true);
    return true;
  };
  const stopMotion = () => {
    motionRef.current = { on: false, full: false, base: null };
    const lk = cam.current.look;
    lk.gy = lk.gp = 0;
    setMotion(false);
  };
  useEffect(() => {
    const orient = (e: DeviceOrientationEvent) => {
      const m = motionRef.current;
      const mod = sceneMod.current;
      if (!m.on || !mod || e.alpha === null || e.beta === null || e.gamma === null) return;
      const angle = window.screen.orientation?.angle ?? 0;
      const v = mod.GalleryScene.lookFromDevice(e.alpha, e.beta, e.gamma, angle);
      if (!m.base) m.base = v; // where you were pointing when it started = straight ahead
      let dy = v.yaw - m.base.yaw;
      dy = Math.atan2(Math.sin(dy), Math.cos(dy));
      const lk = cam.current.look;
      lk.gy = m.full ? dy : clamp(dy, -0.9, 0.9);
      lk.gp = clamp(v.pitch, -1.1, 1.1);
    };
    window.addEventListener("deviceorientation", orient);
    return () => window.removeEventListener("deviceorientation", orient);
  }, []);

  const enterVR = async () => {
    const s = gs.current;
    const c = cam.current;
    if (!s || (c.mode !== "free" && c.mode !== "walk")) return;
    if (vrKind === "headset") {
      try {
        await s.enterVR(
          c.pose,
          c.at,
          (pick, stop) => {
            // pointing at a door out (About, Contact) from in front of it: take
            // the headset off into its page (from afar, it walks you there)
            const there = c.at === stop;
            // keep the screen's place in step with where you are in VR
            c.at = stop;
            if (stop <= s.layout.end) c.leg = stop;
            c.q = c.goal = s.layout.stops[stop].s;
            c.glide = null;
            const st = s.layout.stops[stop];
            c.floor = s.floorAt(st.x, st.z, c.floor) ?? 0;
            c.me = { x: st.x, z: st.z, yaw: st.yaw, pitch: 0, y: c.floor + EYE };
            const d =
              pick?.kind === "door" && pick.index >= 2 ? s.worldDoors[pick.index - 2] : null;
            if (d && there) {
              s.exitVR();
              navigate({ to: d.to });
            }
          },
          () => setVrOn(""),
        );
        setVrOn("headset");
      } catch (err) {
        console.warn("VR couldn't start:", err);
      }
    } else if (vrKind === "phone") {
      // side by side, full screen, sideways, looked round by moving the phone
      await startMotion(true);
      const el = stageRef.current as
        (HTMLDivElement & { webkitRequestFullscreen?: () => void }) | null;
      try {
        if (el?.requestFullscreen) await el.requestFullscreen();
        else el?.webkitRequestFullscreen?.();
        const o = window.screen.orientation as ScreenOrientation & {
          lock?: (o: string) => Promise<void>;
        };
        await o?.lock?.("landscape");
      } catch {
        /* the browser keeps its own full screen and turning: turn the phone yourself */
      }
      s.setStereo(true);
      document.documentElement.classList.add("journey"); // the header and bottom bar step aside
      setVrOn("phone");
    } else setVrHelp(true);
  };
  const exitVR = () => {
    const s = gs.current;
    if (vrOn === "headset") s?.exitVR();
    if (vrOn === "phone") {
      s?.setStereo(false);
      document.documentElement.classList.remove("journey");
      stopMotion();
      if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
      try {
        window.screen.orientation?.unlock?.();
      } catch {
        /* nothing locked */
      }
    }
    setVrOn("");
  };

  const handlers = useRef({ step, goIn, goOut, clickWork, enterVR });
  handlers.current = { step, goIn, goOut, clickWork, enterVR };
  const walkers = useRef({ playFocus, sitDown, standUp, openWork, step, openWorldDoor });
  walkers.current = { playFocus, sitDown, standUp, openWork, step, openWorldDoor };

  /*
    Walking keys (the room): WASD or ↑ ↓ to walk, ← → to turn, Shift to run;
    Space plays / pauses the film in front of you, E sits on (or gets up
    from) a bench, Enter opens the film's page, N / P walk the tour, M the
    map, V VR. Heard before anything else on the page (so the mini player's
    keys don't also act), and only those it uses.
  */
  useEffect(() => {
    if (!room) return;
    const MOVE = ["w", "a", "s", "d", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Shift"];
    const down = (e: KeyboardEvent) => {
      const c = cam.current;
      if (c.mode !== "walk" || e.metaKey || e.ctrlKey || e.altKey) return;
      const t = e.target as HTMLElement | null;
      if (t?.closest?.("input, textarea, select, [contenteditable]")) return;
      const k = e.key.length === 1 ? e.key.toLowerCase() : e.key;
      const w = walkers.current;
      const hu = hudRef.current;
      let used = true;
      if (MOVE.includes(k)) c.keys.add(k);
      else if (k === " ") {
        if (t?.closest?.("button, a")) return;
        w.playFocus();
      } else if (k === "e") {
        if (c.seated) w.standUp();
        else if (hu.bench >= 0) w.sitDown(hu.bench);
      } else if (k === "Escape" && c.seated) w.standUp();
      else if (k === "Enter" && hu.door >= 2 && !t?.closest?.("button, a"))
        w.openWorldDoor(hu.door);
      else if (k === "Enter" && hu.focus >= 0 && !t?.closest?.("button, a")) w.openWork(hu.focus);
      else if (k === "n" || k === "PageDown") w.step(1);
      else if (k === "p" || k === "PageUp") w.step(-1);
      else if (k === "m") setMap((m) => !m);
      else if (k === "v") void handlers.current.enterVR();
      else used = false;
      if (used) {
        e.preventDefault();
        e.stopPropagation();
      }
    };
    const up = (e: KeyboardEvent) => {
      const k = e.key.length === 1 ? e.key.toLowerCase() : e.key;
      cam.current.keys.delete(k);
    };
    const clear = () => cam.current.keys.clear();
    window.addEventListener("keydown", down, true);
    window.addEventListener("keyup", up, true);
    window.addEventListener("blur", clear);
    return () => {
      window.removeEventListener("keydown", down, true);
      window.removeEventListener("keyup", up, true);
      window.removeEventListener("blur", clear);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
      if (c.mode !== "free" && c.mode !== "walk") return;
      /*
        One scroll gesture = one stop (in the gallery: on along the journey). A trackpad keeps sending events after a
        flick (momentum), fading steadily; those must not move you again, but a
        new flick or wheel notch must move you at once, even mid-momentum. A new
        gesture is: a pause in the events, a change of direction, the scroll
        getting much stronger than it has just been (a new flick, never the
        small wobbles in momentum). Steps are never closer than MIN_STEP_GAP.
      */
      const a = Math.abs(d);
      // when the event happened (not when we got to it: a busy frame mustn't look like a pause)
      const at = e.timeStamp || now;
      const gap = at - c.wheelLast;
      const sinceStep = now - c.lastStep;
      const recent = c.wheelRecent;
      const avg = recent.length ? recent.reduce((x, y) => x + y, 0) / recent.length : 0;
      const fresh =
        gap > 120 ||
        Math.sign(d) !== c.wheelDir ||
        (recent.length >= 3 && a >= 20 && a > avg * 2.2 && sinceStep > 350);
      recent.push(a);
      if (recent.length > 5) recent.shift();
      c.wheelLast = at;
      c.wheelDir = Math.sign(d);
      if (fresh) {
        c.wheelAcc = 0;
        c.wheelUsed = false;
        if (gap > 120) c.wheelRecent = [a];
      }
      // arriving, this gesture already stepped, or too soon after the last step
      if (now < c.lockUntil || c.wheelUsed || sinceStep < MIN_STEP_GAP) return;
      c.wheelAcc += d;
      if (Math.abs(c.wheelAcc) >= 24) {
        handlers.current.step(c.wheelAcc > 0 ? 1 : -1);
        c.wheelUsed = true;
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
      const k = e.key.length === 1 ? e.key.toLowerCase() : e.key;
      const fwd = ["ArrowDown", "ArrowRight", "PageDown", " ", "w"].includes(k);
      const back = ["ArrowUp", "ArrowLeft", "PageUp", "s"].includes(k);
      if (c.mode === "intro") {
        if (fwd || e.key === "Enter") {
          e.preventDefault();
          h.goIn();
        }
        return;
      }
      if (c.mode !== "free") return;
      if (k === "a" || k === "d" || k === "q" || k === "e") {
        // look round: a step to the side each press (back to the front with the next step)
        const lk = c.look;
        lk.gy = clamp(lk.gy + (k === "a" || k === "q" ? 0.32 : -0.32), -1.4, 1.4);
        return;
      }
      if (k === "v") return void h.enterVR();
      if (fwd || back) {
        e.preventDefault();
        c.look.gy = c.look.gp = 0;
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
    const c = cam.current;
    if (c.mode === "walk") {
      // touch: the left of the screen is a joystick, the right looks round; a mouse drags to look
      const left = e.pointerType !== "mouse" && e.clientX < window.innerWidth * 0.42 && !vrOn;
      if (left && !c.joy) {
        c.joy = { id: e.pointerId, x0: e.clientX, y0: e.clientY, dx: 0, dy: 0 };
        setJoy({ x0: e.clientX, y0: e.clientY, dx: 0, dy: 0 });
      } else if (!c.lookDrag)
        c.lookDrag = {
          id: e.pointerId,
          x: e.clientX,
          y: e.clientY,
          dist: 0,
          sx: e.clientX,
          sy: e.clientY,
          t0: performance.now(),
          yaw0: c.me.yaw,
          pitch0: c.me.pitch,
        };
      try {
        (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
      } catch {
        // (a synthetic pointer has nothing to capture)
      }
      return;
    }
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
    if (c.mode === "walk") {
      if (c.joy?.id === e.pointerId) {
        const dx = e.clientX - c.joy.x0;
        const dy = e.clientY - c.joy.y0;
        const r = Math.hypot(dx, dy);
        const k = r > 60 ? 60 / r : 1;
        c.joy.dx = dx * k;
        c.joy.dy = dy * k;
        setJoy({ x0: c.joy.x0, y0: c.joy.y0, dx: c.joy.dx, dy: c.joy.dy });
        return;
      }
      const L = c.lookDrag;
      if (L?.id === e.pointerId) {
        const dx = e.clientX - L.x;
        const dy = e.clientY - L.y;
        L.dist += Math.abs(dx) + Math.abs(dy);
        L.x = e.clientX;
        L.y = e.clientY;
        if (L.dist > 6 && c.route) {
          // walking a route: look round as you go
          const k = e.pointerType === "mouse" ? 0.0032 : 0.0048;
          c.look.mx = clamp(c.look.mx + dx * k, -1.6, 1.6);
          c.look.my = clamp(c.look.my + dy * k * 0.8, -0.6, 0.5);
        } else if (L.dist > 6 && !c.tween) {
          const k = e.pointerType === "mouse" ? 0.0032 : 0.0048;
          c.me.yaw += dx * k;
          c.me.pitch = clamp(c.me.pitch + dy * k * 0.8, -0.6, 0.5);
          if (stageRef.current) stageRef.current.style.cursor = "grabbing";
        }
        return;
      }
    }
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
    if (
      (c.mode !== "free" && c.mode !== "walk") ||
      e.pointerType !== "mouse" ||
      !gs.current ||
      !stageRef.current
    )
      return;
    const hit = gs.current.pick(e.clientX, e.clientY, stageRef.current.getBoundingClientRect());
    c.hover = hit?.kind === "door" ? hit.index : -1;
    stageRef.current.style.cursor = hit ? "pointer" : "";
  };
  const onPointerUp = (e: React.PointerEvent) => {
    const c = cam.current;
    if (c.mode === "walk") {
      if (c.joy?.id === e.pointerId) {
        c.joy = null;
        setJoy(null);
        return;
      }
      const L = c.lookDrag;
      if (L?.id === e.pointerId) {
        c.lookDrag = null;
        if (stageRef.current) stageRef.current.style.cursor = "";
        // a touch screen's quick flick up or down: on along the journey, or back (as scrolling a page)
        const fx = e.clientX - L.sx;
        const fy = e.clientY - L.sy;
        if (
          e.pointerType !== "mouse" &&
          performance.now() - L.t0 < 420 &&
          Math.abs(fy) > 60 &&
          Math.abs(fy) > Math.abs(fx) * 1.6
        ) {
          c.me.yaw = L.yaw0; // (a flick isn't a look)
          c.me.pitch = L.pitch0;
          return step(fy < 0 ? 1 : -1);
        }
        if (L.dist > 6 || !gs.current || !stageRef.current) return;
        if (vrOn === "phone") return step(1); // in a holder: a tap walks on
        // a click or tap: a film (walk to it, or play / pause it there), a door, a bench
        const hit = gs.current.pick(e.clientX, e.clientY, stageRef.current.getBoundingClientRect());
        if (hit?.kind === "work") clickWork(hit.index);
        else if (hit?.kind === "door") clickDoor(hit.index);
        else if (hit?.kind === "bench") sitDown(hit.index);
      }
      return;
    }
    const d = c.drag;
    if (!d.on) return;
    d.on = false;
    if (c.mode !== "free" || !gs.current || !stageRef.current) return;
    const dx = d.x - d.x0;
    const dy = d.y - d.y0;
    if (d.dist <= 6 && vrOn === "phone") return step(1); // in a holder: a tap walks on
    if (d.dist <= 6) {
      const hit = gs.current.pick(e.clientX, e.clientY, stageRef.current.getBoundingClientRect());
      if (hit?.kind === "work") clickWork(hit.index);
      else if (hit?.kind === "door") clickDoor(hit.index);
      return;
    }
    const move = d.pointer === "mouse" || Math.abs(dx) > Math.abs(dy) ? dx : dy;
    if (Math.abs(move) > 40) {
      if (!motionRef.current.on) c.look.gy = c.look.gp = 0;
      step(move < 0 ? 1 : -1); // swipe left/up = next
    }
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
        onPointerCancel={() => {
          const c = cam.current;
          c.drag.on = false;
          c.lookDrag = null;
          c.joy = null;
          setJoy(null);
        }}
      >
        <h1 className="sr-only">{SITE.tagline}</h1>

        {/* The room */}
        <canvas ref={roomCanvas} aria-hidden className="absolute inset-0 h-full w-full" />
        {/* while the room loads */}
        {room && !inside && (
          <p className="tracked pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-3 text-[10px] text-black/50">
            Opening the gallery
            <span className="h-8 w-px overflow-hidden bg-black/10">
              <span
                className="block h-1/2 w-full bg-black/60"
                style={{ animation: "hint-line 1.8s ease-in-out infinite" }}
              />
            </span>
          </p>
        )}

        {/* The logo you fly into (the landing page) */}
        {!room && (
          <IntroDoor
            rootRef={introRef}
            scene={scene}
            logoGl={logoGl}
            onClick={() => {
              if (cam.current.drag.dist <= 6) goIn();
            }}
          />
        )}

        {/* For keyboards and screen readers: every film and both doors */}
        <nav aria-label="Works in the gallery" className="sr-only">
          <ul>
            {FILMS.map((p, i) => (
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
            {[
              "All work",
              "About us",
              // the world's doors, at its end
              ...(start === "room" ? ["About", "Contact"] : []),
            ].map((label, i) => (
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
            // above the phone's bottom bar (--dock, SiteNav)
            "pointer-events-none absolute inset-x-0 bottom-[calc(1.5rem+var(--dock,0px))] z-10 flex items-center justify-between gap-2 px-3 transition-opacity duration-700 sm:gap-4 sm:px-6",
            inside && !vrOn ? "opacity-100" : "pointer-events-none opacity-0",
          )}
        >
          <button
            type="button"
            onClick={() => navigate({ to: "/projects" })}
            tabIndex={inside ? 0 : -1}
            aria-label="Leave the gallery"
            className="tracked press pointer-events-auto whitespace-nowrap rounded-full border border-white/70 bg-white/60 px-3.5 py-2.5 text-[10px] text-black/75 shadow-sm backdrop-blur-md transition-colors hover:text-black sm:px-4"
          >
            ←<span className="hidden sm:inline"> Leave</span>
          </button>
          <p
            className={cn(
              "tracked hidden rounded-full bg-white/70 px-3 py-1.5 text-center text-[10px] text-black/55 transition-opacity duration-700 sm:block",
              !hint && "opacity-0",
            )}
          >
            Scroll or N for next · WASD to walk · drag to look · Space play · E sit · M map · V VR
          </p>
          <span className="flex items-center gap-2">
            {/* the map of the hall */}
            <button
              type="button"
              tabIndex={inside ? 0 : -1}
              onClick={() => setMap((m) => !m)}
              aria-pressed={map}
              aria-label="Map"
              className={cn(
                "press pointer-events-auto grid h-[38px] w-[38px] place-items-center rounded-full border shadow-sm backdrop-blur-md transition-colors",
                map
                  ? "border-black bg-black text-white"
                  : "border-white/70 bg-white/60 text-black/75",
              )}
            >
              <svg
                aria-hidden
                viewBox="0 0 24 24"
                className="h-[18px] w-[18px]"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinejoin="round"
              >
                <path d="M3 6.5l6-2.5 6 2.5 6-2.5v13.5l-6 2.5-6-2.5-6 2.5zM9 4v13.5M15 6.5V20" />
              </svg>
            </button>
            {/* phones: look round by moving the phone */}
            {vrKind === "phone" && !vrOn && (
              <button
                type="button"
                tabIndex={inside ? 0 : -1}
                onClick={() => (motion ? stopMotion() : startMotion(false))}
                aria-pressed={motion}
                className={cn(
                  "tracked press pointer-events-auto whitespace-nowrap rounded-full border px-3.5 py-2.5 text-[10px] shadow-sm backdrop-blur-md transition-colors",
                  motion
                    ? "border-black bg-black text-white"
                    : "border-white/70 bg-white/60 text-black/75",
                )}
              >
                Motion
              </button>
            )}
            <button
              type="button"
              tabIndex={inside ? 0 : -1}
              onClick={enterVR}
              className="tracked press pointer-events-auto flex items-center gap-2 whitespace-nowrap rounded-full bg-black px-4 py-2.5 text-[10px] text-white shadow-[0_8px_24px_-8px_rgba(0,0,0,0.5)]"
            >
              <VRIcon />
              VR view
            </button>
          </span>
        </div>

        {/* side by side in a holder: a way out (top left, before it goes in) */}
        {vrOn === "phone" && (
          <button
            type="button"
            onClick={exitVR}
            aria-label="Leave VR view"
            className="pointer-events-auto absolute left-3 top-3 z-20 grid h-10 w-10 place-items-center rounded-full bg-black/50 text-white backdrop-blur-md"
          >
            <svg
              aria-hidden
              viewBox="0 0 24 24"
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
            >
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        )}
        {/* the left eye's half shows where the other eye's starts: a fine line between */}
        {vrOn === "phone" && (
          <span
            aria-hidden
            className="pointer-events-none absolute inset-y-0 left-1/2 z-10 w-px bg-black/60"
          />
        )}

        {/* walking: a thumb joystick (phones) */}
        {joy && (
          <span
            aria-hidden
            className="pointer-events-none absolute z-10 grid h-[120px] w-[120px] -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border border-white/60 bg-white/20 backdrop-blur-md"
            style={{ left: joy.x0, top: joy.y0 }}
          >
            <span
              className="h-12 w-12 rounded-full bg-white/80 shadow-[0_4px_14px_rgba(0,0,0,0.3)]"
              style={{ transform: `translate(${joy.dx}px, ${joy.dy}px)` }}
            />
          </span>
        )}

        {/* the journey: how far through you are, the stop you're making for, and the way back or on */}
        {room && inside && !vrOn && !map && hud.journey.end > 0 && (
          <JourneyBar
            journey={hud.journey}
            arrowRef={journeyArrow}
            distRef={journeyDist}
            onNext={() => step(1)}
            onBack={() => step(-1)}
          />
        )}

        {/* what's in front of you: the film (play / pause it, open its page), a bench (sit) */}
        {room &&
          inside &&
          !vrOn &&
          (hud.focus >= 0 || hud.bench >= 0 || hud.seated || hud.door >= 2) && (
            <Prompt
              film={hud.focus >= 0 ? FILMS[hud.focus] : undefined}
              door={hud.door >= 2 ? gs.current?.worldDoors[hud.door - 2]?.label : undefined}
              onDoor={() => openWorldDoor(hud.door)}
              playing={hud.playing}
              sound={hud.sound}
              real={hud.real}
              canSit={hud.bench >= 0}
              seated={hud.seated}
              onPlay={playFocus}
              onOpen={() => hud.focus >= 0 && openWork(hud.focus)}
              onSit={() => (hud.seated ? standUp() : hud.bench >= 0 && sitDown(hud.bench))}
            />
          )}

        {/* the map of the hall: where you are, every film (press one to walk there) */}
        {room && inside && !vrOn && map && plan && (
          <HallMap
            plan={plan}
            meRef={mapMe}
            onWalk={(stop) => tourTo(stop)}
            onClose={() => setMap(false)}
          />
        )}

        {/* a computer without a headset: how to step inside */}
        {vrHelp && <VRHelp onClose={() => setVrHelp(false)} />}
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
          // On the walls: swap it in. Not on the walls: go to its own page
          onNext={(slug) =>
            FILMS.some((p) => p.slug === slug)
              ? showWork(slug, true)
              : navigate({ to: "/projects/$slug", params: { slug } })
          }
        />
      )}
    </>
  );
}

/* ---------- walking: the journey, the prompt, the map ---------- */

/* What a stop is called, on the journey bar */
function stopName(s: GalleryScene, st?: Stop) {
  if (!st) return "";
  if (st.kind === "work") return FILMS[st.index]?.title ?? "A film";
  if (st.kind === "place") return s.world?.places[st.index]?.name ?? "";
  if (st.kind === "centre") return "The entrance";
  return "The way out";
}

/*
  The journey bar, as a game shows your objective: how far through the
  gallery you are (a line of prism light, and on larger screens "4 / 27"),
  the stop you're making for (its name, which way it is from where you're
  looking, how far along the way), and ‹ and Next to walk the route back or
  on. It's the same journey a scroll, N / P, a flick up or down on a phone,
  a click on a far film and the VR stick all follow, from the entrance to
  the doors to About and Contact.
*/
function JourneyBar({
  journey,
  arrowRef,
  distRef,
  onNext,
  onBack,
}: {
  journey: { leg: number; end: number; to: number; walking: boolean; name: string };
  arrowRef: React.RefObject<HTMLSpanElement | null>;
  distRef: React.RefObject<HTMLSpanElement | null>;
  onNext: () => void;
  onBack: () => void;
}) {
  const atEnd = journey.leg >= journey.end && !journey.walking;
  const progress = journey.end ? (journey.walking ? journey.to : journey.leg) / journey.end : 0;
  return (
    <div className="pointer-events-none absolute inset-x-0 top-[calc(env(safe-area-inset-top)+0.75rem)] z-10 flex justify-center px-3 sm:top-[5.6rem]">
      <div
        className="pointer-events-auto flex max-w-full items-center gap-2 rounded-[22px] border border-white/70 bg-white/70 p-1.5 text-black shadow-[0_18px_40px_-14px_rgba(0,0,0,0.35)] backdrop-blur-xl"
        onPointerDown={(e) => e.stopPropagation()}
        onPointerUp={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          aria-label="Back along the way"
          onClick={onBack}
          disabled={journey.leg === 0 && !journey.walking}
          className="press grid h-9 w-9 shrink-0 place-items-center rounded-full bg-black/[0.06] transition hover:bg-black/[0.1] disabled:opacity-30"
        >
          <svg
            aria-hidden
            viewBox="0 0 24 24"
            className="h-4 w-4"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.8}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M14.5 6l-6 6 6 6" />
          </svg>
        </button>
        <div className="min-w-0 px-1">
          <p className="tracked flex items-center gap-1.5 whitespace-nowrap text-[9px] text-black/55">
            <span>{atEnd ? "You've arrived" : journey.walking ? "On the way to" : "Next"}</span>
            {!atEnd && (
              <>
                {/* which way: straight up is straight ahead */}
                <span ref={arrowRef} aria-hidden className="inline-grid h-3 w-3 place-items-center">
                  <svg viewBox="0 0 12 12" className="h-3 w-3" fill="currentColor">
                    <path d="M6 1l3.6 6.2H7v3.8H5V7.2H2.4z" />
                  </svg>
                </span>
                <span ref={distRef} />
              </>
            )}
          </p>
          <p className="max-w-[44vw] truncate text-[13px] font-medium leading-tight sm:max-w-[260px]">
            {journey.name}
          </p>
          <div className="mt-1.5 h-[2px] w-full min-w-[120px] overflow-hidden rounded-full bg-black/10">
            <div
              className="h-full rounded-full transition-[width] duration-700"
              style={{ width: `${progress * 100}%`, background: "var(--prism)" }}
            />
          </div>
        </div>
        <span className="tracked hidden whitespace-nowrap text-[9px] text-black/45 sm:inline">
          {journey.leg + 1} / {journey.end + 1}
        </span>
        <button
          type="button"
          onClick={onNext}
          disabled={atEnd}
          className="press flex h-9 shrink-0 items-center gap-1.5 rounded-full bg-black px-3.5 text-[13px] text-white transition hover:bg-black/85 disabled:opacity-30"
        >
          Next
          <kbd className="hidden rounded border border-current/30 px-1 text-[10px] leading-4 opacity-60 sm:inline">
            N
          </kbd>
        </button>
      </div>
    </div>
  );
}

/*
  The prompt for what's in front of you, as a game shows what you can do:
  the film you face (its title, for whom, its year) with Play / Pause (sound
  the first time), Open (its page), and Sit when a bench is near. Keys on
  computers: Space, Enter, E.
*/
function Prompt({
  film,
  door,
  onDoor,
  playing,
  sound,
  real,
  canSit,
  seated,
  onPlay,
  onOpen,
  onSit,
}: {
  film?: (typeof FILMS)[number];
  door?: string;
  onDoor: () => void;
  playing: boolean;
  sound: boolean;
  real: boolean;
  canSit: boolean;
  seated: boolean;
  onPlay: () => void;
  onOpen: () => void;
  onSit: () => void;
}) {
  const btn =
    "press flex h-9 items-center gap-1.5 whitespace-nowrap rounded-full px-3.5 text-[13px] transition";
  const key = (k: string) => (
    <kbd className="hidden rounded border border-current/30 px-1 text-[10px] leading-4 opacity-60 sm:inline">
      {k}
    </kbd>
  );
  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-[calc(5rem+var(--dock,0px))] z-10 flex justify-center px-3 duration-300 animate-in fade-in slide-in-from-bottom-2">
      <div
        className="pointer-events-auto flex max-w-full items-center gap-3 rounded-[22px] border border-white/70 bg-white/70 p-2 pl-4 text-black shadow-[0_18px_40px_-14px_rgba(0,0,0,0.35)] backdrop-blur-xl"
        onPointerDown={(e) => e.stopPropagation()}
        onPointerUp={(e) => e.stopPropagation()}
      >
        {door && (
          <div className="min-w-0">
            <p className="text-[14px] font-medium leading-tight">{door}</p>
            <p className="tracked mt-1 text-[9px] text-black/55">Through this door</p>
          </div>
        )}
        {film && (
          <div className="min-w-0 max-w-[200px] sm:max-w-[260px]">
            <p className="truncate text-[14px] font-medium leading-tight">{film.title}</p>
            <p className="tracked mt-1 truncate text-[9px] text-black/55">
              {[film.client ?? SITE.name, film.year].join(" · ")}
            </p>
          </div>
        )}
        <div className="flex shrink-0 items-center gap-1.5">
          {door && (
            <button
              type="button"
              onClick={onDoor}
              className={cn(btn, "bg-black text-white hover:bg-black/85")}
            >
              Go in
              {key("↵")}
            </button>
          )}
          {film && (
            <button
              type="button"
              onClick={onPlay}
              className={cn(btn, "bg-black text-white hover:bg-black/85")}
            >
              <svg aria-hidden viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor">
                {playing && (sound || !real) ? (
                  <>
                    <rect x="6.5" y="5" width="3.6" height="14" rx="1" />
                    <rect x="13.9" y="5" width="3.6" height="14" rx="1" />
                  </>
                ) : (
                  <path d="M8 5v14l11-7z" />
                )}
              </svg>
              {playing && (sound || !real) ? "Pause" : real ? "Play" : "Play"}
              {key("Space")}
            </button>
          )}
          {film && (
            <button
              type="button"
              onClick={onOpen}
              className={cn(btn, "bg-black/[0.06] hover:bg-black/[0.1]")}
            >
              Open
              {key("↵")}
            </button>
          )}
          {(canSit || seated) && (
            <button
              type="button"
              onClick={onSit}
              className={cn(btn, "bg-black/[0.06] hover:bg-black/[0.1]")}
            >
              {seated ? "Stand" : "Sit"}
              {key("E")}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/*
  The hall from above, on its side (the entrance at the left): the walls,
  the prism, the benches, a mark for every film (in its client's colour;
  press one to walk there) and you, an arrow turning as you look round.
*/
function HallMap({
  plan,
  meRef,
  onWalk,
  onClose,
}: {
  plan: {
    B: { minX: number; maxX: number; minZ: number; maxZ: number };
    works: { x: number; z: number; stop: number }[];
    benches: { x: number; z: number; along: boolean }[];
    prism: { x: number; z: number } | null;
    areas: { minX: number; maxX: number; minZ: number; maxZ: number; level: number }[];
    places: { name: string; x: number; z: number; stop: number }[];
  };
  meRef: React.RefObject<HTMLDivElement | null>;
  onWalk: (stop: number) => void;
  onClose: () => void;
}) {
  const { B } = plan;
  const len = B.maxZ - B.minZ + 1.2;
  const wid = B.maxX - B.minX + 1.1;
  const at = (x: number, z: number) => ({
    left: `${((B.maxZ + 0.6 - z) / len) * 100}%`,
    top: `${((x - (B.minX - 0.55)) / wid) * 100}%`,
  });
  return (
    <div
      className="pointer-events-auto absolute right-3 top-[calc(env(safe-area-inset-top)+12px)] z-20 w-[min(340px,calc(100%-24px))] rounded-2xl border border-white/70 bg-white/70 p-3 shadow-[0_18px_40px_-14px_rgba(0,0,0,0.35)] backdrop-blur-xl duration-200 animate-in fade-in sm:top-[88px]"
      onPointerDown={(e) => e.stopPropagation()}
      onPointerUp={(e) => e.stopPropagation()}
    >
      <div className="mb-2 flex items-center justify-between">
        <p className="tracked text-[9.5px] text-black/60">The gallery · upstairs tinted</p>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close the map"
          className="grid h-6 w-6 place-items-center rounded-full hover:bg-black/[0.06]"
        >
          <svg
            aria-hidden
            viewBox="0 0 24 24"
            className="h-3.5 w-3.5"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.4"
          >
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>
      </div>
      <div
        className="relative w-full rounded-md border border-black/15 bg-[#f3efe8]"
        style={{ aspectRatio: `${len} / ${wid}` }}
      >
        {/* the spaces: the hall and the atrium (ground floor), the upper floor (tinted) */}
        {plan.areas.map((a, i) => {
          const tl = at(a.minX, a.maxZ);
          const br = at(a.maxX, a.minZ);
          return (
            <span
              key={i}
              aria-hidden
              className={cn(
                "absolute rounded-[3px] border",
                a.level ? "border-[#9c5a26]/35 bg-[#9c5a26]/10" : "border-black/15 bg-white/60",
              )}
              style={{
                left: tl.left,
                top: tl.top,
                width: `calc(${br.left} - ${tl.left})`,
                height: `calc(${br.top} - ${tl.top})`,
              }}
            />
          );
        })}
        {/* the entrance (the doors) */}
        <span
          aria-hidden
          className="absolute inset-y-[30%] left-0 w-[3px] -translate-x-1/2 rounded-full"
          style={{ background: "var(--prism)" }}
        />
        {plan.prism && (
          <span
            aria-hidden
            className="absolute h-2 w-2 -translate-x-1/2 -translate-y-1/2 rotate-45 bg-white ring-1 ring-black/30"
            style={at(plan.prism.x, plan.prism.z)}
          />
        )}
        {plan.benches.map((b, i) => (
          <span
            key={i}
            aria-hidden
            className={cn(
              "absolute -translate-x-1/2 -translate-y-1/2 rounded-[2px] bg-[#9c5a26]/70",
              b.along ? "h-[5px] w-[14px]" : "h-[14px] w-[5px]",
            )}
            style={at(b.x, b.z)}
          />
        ))}
        {plan.works.map((w, i) => {
          const f = FILMS[i];
          const c = WORK_CLIENTS.find((x) => x.name === f?.client);
          return (
            <button
              key={i}
              type="button"
              title={f?.title}
              aria-label={`Walk to ${f?.title}`}
              onClick={() => onWalk(w.stop)}
              className="absolute h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white transition hover:scale-125"
              style={{ ...at(w.x, w.z), background: c?.color ?? "#0a0a0a" }}
            />
          );
        })}
        {/* the world's places: the Threshold, the Lens, the stairs… (press one to go there) */}
        {plan.places.map((p) => (
          <button
            key={p.stop}
            type="button"
            title={p.name}
            aria-label={`Go to ${p.name}`}
            onClick={() => onWalk(p.stop)}
            className="absolute h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rotate-45 border-2 border-white transition hover:scale-125"
            style={{ ...at(p.x, p.z), background: "var(--prism)" }}
          />
        ))}
        {/* you */}
        <div ref={meRef} aria-label="You" className="absolute h-4 w-4">
          <svg viewBox="0 0 16 16" className="h-4 w-4 drop-shadow">
            <path
              d="M15 8L2 2.5 5 8 2 13.5z"
              fill="#ff3d1f"
              stroke="#fff"
              strokeWidth="1"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      </div>
    </div>
  );
}

/* ---------- VR ---------- */

/* A headset, seen from the front */
function VRIcon() {
  return (
    <svg
      aria-hidden
      viewBox="0 0 24 24"
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinejoin="round"
    >
      <path d="M3 8.5c0-1.1.9-2 2-2h14a2 2 0 012 2v6.5a2 2 0 01-2 2h-3.6l-1.7-2.4a2 2 0 00-3.4 0l-1.7 2.4H5a2 2 0 01-2-2z" />
      <circle cx="8" cy="11.5" r="1.4" />
      <circle cx="16" cy="11.5" r="1.4" />
    </svg>
  );
}

/* On a computer without a headset: how to step inside the gallery in VR. */
function VRHelp({ onClose }: { onClose: () => void }) {
  const [copied, setCopied] = useState(false);
  useEffect(() => {
    const key = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, [onClose]);
  return (
    <div
      className="pointer-events-auto absolute inset-0 z-30 grid place-items-center bg-black/30 p-4 backdrop-blur-[2px]"
      onPointerDown={(e) => e.stopPropagation()}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="VR view"
        className="w-full max-w-[420px] rounded-3xl border border-white/70 bg-white/80 p-6 text-black shadow-[0_22px_60px_-14px_rgba(0,0,0,0.4)] backdrop-blur-2xl"
      >
        <p className="eyebrow">VR view</p>
        <p className="tracked mt-2 text-[18px] font-light">Step inside the gallery</p>
        <span aria-hidden className="prism-rule mt-3 block w-20" />
        <ul className="mt-4 space-y-2.5 text-[14px] leading-relaxed text-black/75">
          <li>
            <b className="font-medium text-black">In a headset</b> (Meta Quest, Apple Vision Pro,
            Pico): open this page in its browser and press VR view. Point and select, or look and
            pinch, at a film to walk to it; the thumbstick turns you and walks on.
          </li>
          <li>
            <b className="font-medium text-black">On a phone</b>: open it there and press VR view;
            slip the phone into a VR holder, and look round by moving your head.
          </li>
          <li>
            <b className="font-medium text-black">Here</b>: scroll or ← → to walk, A D or the mouse
            to look round.
          </li>
        </ul>
        <div className="mt-5 flex gap-2">
          <button
            type="button"
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(window.location.href.split("?")[0]);
                setCopied(true);
              } catch {
                /* no clipboard */
              }
            }}
            className="press flex h-10 items-center rounded-md bg-black px-4 text-[14px] text-white"
          >
            {copied ? "Link copied" : "Copy the link"}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="press flex h-10 items-center rounded-md bg-black/[0.06] px-4 text-[14px]"
          >
            Close
          </button>
        </div>
      </div>
    </div>
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
        className="tracked pointer-events-none absolute inset-x-0 bottom-[calc(1.75rem+var(--dock,0px))] flex flex-col items-center gap-3 text-[10px] text-black/50"
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
