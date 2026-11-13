import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useRouter, useSearch } from "@tanstack/react-router";
import { SITE } from "@/content/site";
import { GALLERY_FILMS, getProject } from "@/content/projects";
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

type Mode = "intro" | "free" | "visit";

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
  const [vrHelp, setVrHelp] = useState(false);
  const [motion, setMotion] = useState(false);
  const sceneMod = useRef<typeof import("@/components/gallery3d/GalleryScene") | null>(null);
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
    // (gy, gp: keys and the phone; mx, my: the mouse, a little on top)
    look: { yaw: 0, pitch: 0, gy: 0, gp: 0, mx: 0, my: 0 },
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
          projects: GALLERY_FILMS,
          aspect: window.innerWidth / window.innerHeight,
          // Phones and tablets skip the floor mirror and shadows to stay smooth.
          hq: !coarse && window.innerWidth >= 700,
        });
        s.setSize(window.innerWidth, window.innerHeight);
        gs.current = s;
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
              looking ? lk.pitch : 0,
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
    return { x: w.x + w.nx * d, z: w.z + w.nz * d, yaw: w.yaw, y: 1.62 };
  };

  const workSlug = (i: number) => GALLERY_FILMS[i]?.slug;
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
    const i = work ? GALLERY_FILMS.findIndex((p) => p.slug === work) : -1;
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
      const i2 = GALLERY_FILMS.findIndex((p) => p.slug === sheet.slug);
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
    } else navigate({ to: "/gallery", search: {}, replace: true });
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
    if (!s || c.mode !== "free") return;
    if (vrKind === "headset") {
      try {
        await s.enterVR(
          c.pose,
          c.at,
          (_pick, stop) => {
            // keep the screen's place in step with where you are in VR
            c.at = stop;
            c.q = c.goal = s.layout.stops[stop].s;
            c.glide = null;
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
      /*
        One scroll gesture = one stop. A trackpad keeps sending events after a
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
    // A mouse looks round a little, as if you turned your head towards it
    if (
      c.mode === "free" &&
      e.pointerType === "mouse" &&
      !motionRef.current.on &&
      stageRef.current
    ) {
      const r = stageRef.current.getBoundingClientRect();
      const nx = ((e.clientX - r.left) / r.width) * 2 - 1;
      const ny = ((e.clientY - r.top) / r.height) * 2 - 1;
      c.look.mx = -nx * 0.16;
      c.look.my = -ny * 0.08;
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
        onPointerCancel={() => (cam.current.drag.on = false)}
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
            {GALLERY_FILMS.map((p, i) => (
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
            // above the phone's bottom bar (--dock, SiteNav)
            "pointer-events-none absolute inset-x-0 bottom-[calc(1.5rem+var(--dock,0px))] z-10 flex items-center justify-between gap-4 px-6 transition-opacity duration-700",
            inside && !vrOn ? "opacity-100" : "pointer-events-none opacity-0",
          )}
        >
          <button
            type="button"
            onClick={() => navigate({ to: "/projects" })}
            tabIndex={inside ? 0 : -1}
            className="tracked press pointer-events-auto whitespace-nowrap rounded-full border border-white/70 bg-white/60 px-4 py-2.5 text-[10px] text-black/75 shadow-sm backdrop-blur-md transition-colors hover:text-black"
          >
            ← Leave
          </button>
          <p
            className={cn(
              "tracked hidden rounded-full bg-white/70 px-3 py-1.5 text-center text-[10px] text-black/55 transition-opacity duration-700 sm:block",
              !hint && "opacity-0",
            )}
          >
            Scroll or ← → to walk · A D or the mouse to look · V for VR
          </p>
          <span className="flex items-center gap-2">
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
            GALLERY_FILMS.some((p) => p.slug === slug)
              ? showWork(slug, true)
              : navigate({ to: "/projects/$slug", params: { slug } })
          }
        />
      )}
    </>
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
