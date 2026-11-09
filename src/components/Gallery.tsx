import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { SITE } from "@/content/site";
import { PROJECTS, type Project } from "@/content/projects";
import { setStageTone } from "@/lib/stage";
import { cn } from "@/lib/utils";
import { Poster } from "@/components/Poster";

/*
  The home page: a walk-through 3D gallery.

  Outside: the door. Hover and it cracks open; click and the two halves slide
  apart, the ceiling lights come on one by one, and you walk in.

  Inside, the camera glides along one path past every piece, turning at the
  corners. Scroll or drag to move, arrow keys to step piece to piece. When you
  stop, it settles on the nearest piece and leans in. Click the piece you're
  at to open it (it zooms up into the project page); click another to go to it.
  Scroll back past the first piece to walk out and close the door.

  Coordinates are CSS pixels in one 3D world: x right, y down, z towards you.
  The door is at z = 0 and the room runs back to z = -depth.
*/

type Phase = "closed" | "opening" | "inside";
type TextState = "pre" | "in" | "out"; // headline: waiting below, shown, lifted away
type Mode = "intro" | "entering" | "free" | "leaving" | "door";
type Pose = { x: number; z: number; yaw: number }; // yaw in radians, 0 = facing into the room
type Piece = { x: number; y: number; z: number; a: number }; // a = which way the wall faces, degrees
type Stop = Pose & { s: number; piece: number }; // piece = index in PROJECTS, -1 = the door wall

/* The two doors at the end of the walk, on the wall you came in through. */
const DOORS = [
  { label: "All work", to: "/projects" },
  { label: "About us", to: "/about" },
] as const;
const DOOR_WALK_MS = 1250; // walking through a door into its page

/* ---------- motion settings ---------- */

const MOTION = {
  full: { doors: 1350, walk: 5400, bob: true },
  simple: { doors: 1200, walk: 4600, bob: false }, // phones
};
const EASE_DOORS = "cubic-bezier(0.7, 0, 0.2, 1)";
const EASE_CLOSE = "cubic-bezier(0.65, 0, 0.35, 1)";
const EASE_AJAR = "cubic-bezier(0.22, 1, 0.36, 1)";
const EASE_TEXT_IN = "cubic-bezier(0.22, 1, 0.36, 1)";
const EASE_TEXT_OUT = "cubic-bezier(0.55, 0, 0.45, 1)";
const EASE_UI_IN = "cubic-bezier(0.16, 1, 0.3, 1)";
const EASE_ZOOM = "cubic-bezier(0.65, 0, 0.35, 1)";

const NEAR = 900; // how close you stand when settled on a piece
const FAR = 1250; // how far back you are while moving between pieces
const SETTLE_AFTER = 0.45; // seconds of stillness before snapping to a piece
const FOLLOW = 5.5; // how quickly the camera catches up (higher = snappier)
const FOLLOW_TURN = 3.4; // ...a bit gentler while turning a corner
const LEAN_IN = 1.9;
const LEAN_OUT = 3.2;

const FRAME_W = 640; // artwork size in the world
const FRAME_H = Math.round((FRAME_W * 2) / 3);
const SAVE_KEY = "insight-gallery-stop"; // which stop you were at (survives resizes)
// The beam in hero-door.webp sits at 51.5% across, so shift it onto the seam.
const BEAM_X = 51.5;

const rad = (deg: number) => (deg * Math.PI) / 180;
const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
const smooth = (t: number) => {
  const c = clamp(t, 0, 1);
  return c * c * (3 - 2 * c);
};
// Frame-rate independent easing towards a goal.
const damp = (rate: number, dt: number) => 1 - Math.exp(-rate * dt);
// Turn the short way round.
const nearestAngle = (goal: number, from: number) =>
  goal + Math.round((from - goal) / (Math.PI * 2)) * Math.PI * 2;

/* Walking speed: speeds up, cruises, slows down. Returns [progress, speed 0..1]. */
function walkCurve(t: number): [number, number] {
  const up = 0.22;
  const down = 0.34;
  const top = 1 / (1 - up / 2 - down / 2);
  if (t <= 0) return [0, 0];
  if (t >= 1) return [1, 0];
  if (t < up) return [(top * t * t) / (2 * up), t / up];
  if (t < 1 - down) return [top * (up / 2 + t - up), 1];
  const r = 1 - t;
  return [1 - (top * r * r) / (2 * down), r / down];
}

export function Gallery() {
  const navigate = useNavigate();
  const [phase, setPhase] = useState<Phase>("closed");
  const [view, setView] = useState({ w: 1440, h: 900 });
  const [ajar, setAjar] = useState(false);
  const [lit, setLit] = useState(false);
  const [text, setText] = useState<TextState>("pre");
  const [hint, setHint] = useState(true);
  const [doorMs, setDoorMs] = useState(MOTION.full.doors);
  const [exiting, setExiting] = useState(false); // walking back out of the gallery
  const [signs, setSigns] = useState([false, false]); // door labels lit

  const room = useMemo(() => buildRoom(PROJECTS.length, view.w, view.h), [view]);
  // Narrow screens get a wider field of view so the room doesn't feel like a tunnel.
  const persp = Math.round(clamp(view.w * 0.62, 520, 950));
  // Phones get lower-resolution surfaces to stay inside iOS Safari's memory limit.
  const phone = view.w < 700;
  const surfaceK = phone ? 8 : 4;
  const contentK = phone ? 2 : 1;

  const stageRef = useRef<HTMLDivElement>(null);
  const worldRef = useRef<HTMLDivElement>(null);
  const roomRef = useRef(room);
  const perspRef = useRef(persp);
  const phaseRef = useRef<Phase>("closed");
  roomRef.current = room;
  perspRef.current = persp;
  phaseRef.current = phase;

  // Everything the camera loop reads lives in refs, so moving never re-renders React.
  const cam = useRef({
    mode: "intro" as Mode,
    q: 0, // where the camera is along the path
    goal: 0, // where it's heading
    lean: 0, // 0 = standing back, 1 = leaning in at a piece
    idle: 0,
    dir: 0,
    back: 0, // how hard someone is scrolling back at the first piece
    pose: { x: 0, z: 950, yaw: 0, y: 0 },
    t0: 0,
    walk: MOTION.full.walk,
    bob: true,
    dragging: false,
    dragDist: 0,
    px: 0,
    py: 0,
    pointer: "mouse",
    at: 0, // the stop you're nearest, so a resize can put you back there
    // Walking through one of the end doors.
    door: null as null | {
      i: number;
      t0: number;
      from: Pose & { y: number };
      x1: number;
      z1: number;
      y1: number;
      veil: HTMLElement;
      go: () => void;
      gone: boolean;
    },
  });
  // The end doors: how far each is open, which one the mouse is over, and the elements to move.
  const doorAnim = useRef({ ang: [0, 0], hover: -1, parked: false });
  const leafEls = useRef<(HTMLElement | null)[][]>([[], []]);
  const seamEls = useRef<(HTMLElement | null)[]>([]);
  const spillEls = useRef<(HTMLElement | null)[]>([]);
  const signTimers = useRef<number[]>([]);
  const timers = useRef<number[]>([]);
  const later = (fn: () => void, ms: number) => timers.current.push(window.setTimeout(fn, ms));

  /* ---------- setup ---------- */

  useEffect(() => {
    const fit = () => setView({ w: window.innerWidth, h: window.innerHeight });
    fit();
    window.addEventListener("resize", fit);
    const raf = requestAnimationFrame(() => setText("in")); // headline rises in

    // Coming back from a project page: put you back at the same piece.
    const saved = readSaved();
    if (saved !== null) {
      const c = cam.current;
      c.mode = "free";
      const stops = roomRef.current.stops;
      c.at = Math.min(saved, stops.length - 1);
      c.q = c.goal = stops[c.at]?.s ?? 0;
      c.lean = 1;
      phaseRef.current = "inside";
      setPhase("inside");
      setLit(true);
      setHint(false);
    }
    const t = timers.current;
    return () => {
      window.removeEventListener("resize", fit);
      cancelAnimationFrame(raf);
      t.forEach(clearTimeout);
      setStageTone(null);
    };
  }, []);

  useEffect(() => {
    setStageTone(phase === "inside" ? "light" : "dark");
  }, [phase]);

  // The room is sized from the screen, so a resize moves every stop: stay at yours.
  useEffect(() => {
    const c = cam.current;
    if (c.mode !== "free") return;
    const st = room.stops[Math.min(c.at, room.stops.length - 1)];
    if (st) c.q = c.goal = st.s;
  }, [room]);

  /* ---------- the camera loop ---------- */

  useEffect(() => {
    let raf = 0;
    let last = performance.now();
    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const c = cam.current;
      const r = roomRef.current;
      const P = perspRef.current;
      const start = { x: 0, z: P, yaw: 0 };
      let pose = { ...c.pose };

      if (c.mode === "intro") {
        pose = { ...start, y: 0 };
      } else if (c.mode === "entering") {
        const e = (now - c.t0) / 1000;
        const [p, speed] = walkCurve(e / (c.walk / 1000));
        const end = leaned(r.stops[0] ?? { ...start, z: -700 }, 1);
        const yaw = (nearestAngle(end.yaw, 0) - start.yaw) * smooth((p - 0.35) / 0.65);
        pose = {
          x: start.x + (end.x - start.x) * p,
          z: start.z + (end.z - start.z) * p,
          yaw,
          y: 0,
        };
        // Footsteps: a gentle sway and bob while walking.
        if (c.bob) {
          const f = e * Math.PI * 1.85;
          const sway = Math.sin(f / 2) * window.innerHeight * 0.0022 * speed;
          pose.x += Math.cos(yaw) * sway;
          pose.z += Math.sin(yaw) * sway;
          pose.y = -Math.abs(Math.sin(f)) * window.innerHeight * 0.006 * speed;
        }
        if (pose.z < -40 && phaseRef.current === "opening") {
          phaseRef.current = "inside";
          setPhase("inside");
        }
        if (p >= 1) {
          c.mode = "free";
          c.q = c.goal = r.stops[0]?.s ?? 0;
          c.lean = 1;
          c.idle = 0;
        }
      } else if (c.mode === "free") {
        const stops = r.stops;
        c.idle += dt;
        // Once you stop, drift to the nearest piece (a little ahead in the direction you were going).
        if (!c.dragging && c.idle > SETTLE_AFTER && stops.length) {
          const s = stops[nearestStop(stops, c.goal + c.dir * r.span * 0.35)].s;
          c.goal += (s - c.goal) * damp(4, dt);
          if (Math.abs(s - c.goal) < 0.5) c.goal = s;
        }
        const turning = isTurning(stops, c.q);
        c.q += (c.goal - c.q) * damp(turning ? FOLLOW_TURN : FOLLOW, dt);
        // Lean in when settled at a piece, step back while moving.
        c.at = nearestStop(stops, c.goal);
        const here = stops[nearestStop(stops, c.q)];
        // Lean in at pieces; at the door wall stay back so both doors fit.
        const near = !!here && here.piece >= 0 && Math.abs(c.q - here.s) < r.span * 0.35;
        const g = near ? 1 : 0;
        c.lean += (g - c.lean) * damp(g ? LEAN_IN : LEAN_OUT, dt);
        pose = { ...leaned(poseAt(stops, c.q), c.lean), y: 0 };
      } else if (c.mode === "leaving") {
        const k = damp(2.6, dt);
        pose.x += (start.x - pose.x) * k;
        pose.z += (start.z - pose.z) * k;
        pose.yaw += (nearestAngle(0, pose.yaw) - pose.yaw) * k;
        pose.y *= 1 - k;
        // Close the doors once you're back through them.
        if (pose.z > 0 && phaseRef.current !== "closed") {
          phaseRef.current = "closed";
          setPhase("closed");
          later(() => {
            setExiting(false);
            setLit(false);
            setText("pre"); // reset below, then rise in again
            requestAnimationFrame(() => requestAnimationFrame(() => setText("in")));
          }, 700);
        }
        if (Math.abs(pose.z - start.z) < 1 && phaseRef.current === "closed") {
          c.mode = "intro";
          pose = { ...start, y: 0 };
        }
      } else if (c.mode === "door" && c.door) {
        // Walk up to the door and through it, then the page takes over.
        const d = c.door;
        const t = clamp((now - d.t0) / DOOR_WALK_MS, 0, 1);
        const o = t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2;
        const yaw1 = nearestAngle(Math.PI, d.from.yaw);
        pose = {
          x: d.from.x + (d.x1 - d.from.x) * o,
          z: d.from.z + (d.z1 - d.from.z) * o,
          yaw: d.from.yaw + (yaw1 - d.from.yaw) * o,
          y: d.from.y + (d.y1 - d.from.y) * o,
        };
        d.veil.style.opacity = String(smooth((t - 0.45) / 0.55));
        if (t >= 1 && !d.gone) {
          d.gone = true;
          d.go();
        }
      }

      // End doors: ease open a little when you arrive, more under the mouse, wide when clicked.
      const da = doorAnim.current;
      const end = r.stops[r.stops.length - 1];
      const parked =
        (c.mode === "free" || c.mode === "door") &&
        end?.piece === -1 &&
        Math.abs(c.q - end.s) < r.span * 0.3;
      if (parked !== da.parked) {
        da.parked = parked;
        handlers.current.lightSigns(parked);
      }
      da.ang = da.ang.map((a, i) => {
        const goal =
          c.mode === "door" && c.door?.i === i ? 82 : parked ? (da.hover === i ? 24 : 15) : 0;
        const rate = goal > a ? (c.mode === "door" ? 5 : 3.5) : 5;
        let n = a + (goal - a) * damp(rate, dt);
        if (Math.abs(goal - n) < 0.05) n = goal;
        const [l, rr] = leafEls.current[i] ?? [];
        // Leaves swing out towards you (there's no room behind the wall to swing into).
        if (l) l.style.transform = `rotateY(${-n}deg)`;
        if (rr) rr.style.transform = `rotateY(${n}deg)`;
        const seam = seamEls.current[i];
        if (seam) seam.style.opacity = String(1 - smooth(n / 4));
        const spill = spillEls.current[i];
        if (spill) spill.style.opacity = String(smooth(n / 30) * 0.9);
        return n;
      });

      c.pose = pose;
      if (worldRef.current) {
        worldRef.current.style.transform = `translateZ(${P}px) rotateY(${pose.yaw}rad) translate3d(${-pose.x}px, ${-pose.y}px, ${-pose.z}px)`;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  /* ---------- moving along the path ---------- */

  const push = (d: number) => {
    const c = cam.current;
    const stops = roomRef.current.stops;
    if (!stops.length) return;
    c.goal = clamp(c.goal + d, stops[0].s, stops[stops.length - 1].s);
    c.idle = 0;
    if (d) c.dir = d > 0 ? 1 : -1;
    setHint(false);
  };

  const stepTo = (i: number) => {
    const c = cam.current;
    const stops = roomRef.current.stops;
    if (!stops[i]) return;
    c.goal = stops[i].s;
    c.idle = 0;
    c.dir = 0;
    setHint(false);
  };

  const leave = () => {
    const c = cam.current;
    if (c.mode !== "free") return;
    clearSaved();
    c.mode = "leaving";
    c.back = 0;
    c.dragging = false;
    setExiting(true); // open up the doorway again so you can walk out
    setHint(true);
  };

  /* ---------- opening a piece ---------- */

  const frameEls = useRef<(HTMLElement | null)[]>([]);

  const openPiece = (i: number) => {
    const project = PROJECTS[i];
    if (!project) return;
    writeSaved(nearestStop(roomRef.current.stops, cam.current.goal));
    const go = () => navigate({ to: "/projects/$slug", params: { slug: project.slug } });
    const el = frameEls.current[i];
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return go();
    zoomInto(el, go);
  };

  // Clicking the piece you're at opens it; clicking another walks you to it.
  const onPieceClick = (e: React.MouseEvent, i: number) => {
    e.preventDefault();
    const c = cam.current;
    if (c.dragDist > 6) return;
    const stops = roomRef.current.stops;
    const target = stops.findIndex((s) => s.piece === i);
    if (target < 0) return;
    const settled =
      nearestStop(stops, c.q) === target &&
      Math.abs(c.q - stops[target].s) < roomRef.current.span * 0.25;
    // A keyboard "click" (Enter on a focused piece) always opens.
    if (settled || e.detail === 0) openPiece(i);
    else stepTo(target);
  };

  /* ---------- the doors at the end ---------- */

  // Light the labels one after the other when you arrive; switch them off as you leave.
  const lightSigns = (on: boolean) => {
    signTimers.current.forEach(clearTimeout);
    signTimers.current = [];
    if (!on) return setSigns([false, false]);
    DOORS.forEach((_, i) => {
      signTimers.current.push(
        window.setTimeout(
          () => setSigns((prev) => prev.map((v, j) => (j === i ? true : v))),
          150 + i * 380,
        ),
      );
    });
  };
  useEffect(() => {
    const t = signTimers;
    return () => t.current.forEach(clearTimeout);
  }, []);

  const openDoor = (i: number) => {
    const c = cam.current;
    const r = roomRef.current;
    const door = r.doorWall.doors[i];
    if (!door || c.mode !== "free") return;
    writeSaved(r.stops.length - 1); // come back to the door wall
    const go = () => navigate({ to: door.to });
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return go();
    // The page colour fades in as you step through.
    const veil = document.createElement("div");
    Object.assign(veil.style, {
      position: "fixed",
      inset: "0",
      background: "#fcfcfc",
      zIndex: "60",
      opacity: "0",
      pointerEvents: "none",
    });
    document.body.append(veil);
    // End close enough that the door fills the screen.
    const dist = (perspRef.current * r.doorWall.dw) / (1.1 * window.innerWidth);
    c.mode = "door";
    c.door = {
      i,
      t0: performance.now(),
      from: { ...c.pose },
      x1: door.x,
      z1: -2 - dist,
      y1: r.floorY - r.doorWall.dh / 2,
      veil,
      gone: false,
      go: () => {
        go();
        veil
          .animate([{ opacity: 1 }, { opacity: 0 }], {
            duration: 420,
            delay: 150,
            fill: "forwards",
          })
          .finished.then(
            () => veil.remove(),
            () => veil.remove(),
          );
      },
    };
  };

  // Click a door: walk to the door wall first if you're not there yet.
  const onDoorClick = (e: React.MouseEvent, i: number) => {
    e.preventDefault();
    const c = cam.current;
    if (c.dragDist > 6) return;
    const stops = roomRef.current.stops;
    if (doorAnim.current.parked || e.detail === 0) openDoor(i);
    else stepTo(stops.length - 1);
  };

  // Keep the latest handlers for the window listeners and the camera loop.
  const handlers = useRef({ push, stepTo, leave, openPiece, lightSigns });
  handlers.current = { push, stepTo, leave, openPiece, lightSigns };

  // Scroll / trackpad.
  useEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const wheel = (e: WheelEvent) => {
      const c = cam.current;
      if (c.mode !== "free") return;
      e.preventDefault();
      const raw = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
      const d = raw * (e.deltaMode === 1 ? 16 : 1);
      const stops = roomRef.current.stops;
      // Scrolling back at the first piece walks you out.
      if (d < 0 && stops.length && c.goal <= stops[0].s + 0.5) {
        c.back += -d;
        if (c.back > 160) handlers.current.leave();
        return;
      }
      c.back = 0;
      handlers.current.push(d * roomRef.current.span * 0.0016);
    };
    el.addEventListener("wheel", wheel, { passive: false });
    return () => el.removeEventListener("wheel", wheel);
  }, []);

  // Arrow keys step piece to piece; Enter opens the one you're at.
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      const c = cam.current;
      if (c.mode !== "free") return;
      const t = e.target as HTMLElement | null;
      if (t?.closest?.("input, textarea, select")) return;
      const stops = roomRef.current.stops;
      const here = nearestStop(stops, c.goal);
      const h = handlers.current;
      if (e.key === "ArrowRight" || e.key === "ArrowDown") {
        e.preventDefault();
        h.stepTo(Math.min(stops.length - 1, here + 1));
      } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
        e.preventDefault();
        if (here === 0) h.leave();
        else h.stepTo(here - 1);
      } else if (e.key === "Enter" && !t?.closest?.("a, button")) {
        const piece = stops[here]?.piece ?? -1;
        if (piece >= 0) h.openPiece(piece);
      }
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, []);

  // Drag: a mouse drags sideways; a finger can swipe either way.
  const onPointerDown = (e: React.PointerEvent) => {
    const c = cam.current;
    if (c.mode !== "free" || e.button > 0) return;
    c.dragging = true;
    c.dragDist = 0;
    c.px = e.clientX;
    c.py = e.clientY;
    c.pointer = e.pointerType;
  };
  const onPointerMove = (e: React.PointerEvent) => {
    const c = cam.current;
    if (!c.dragging) return;
    const dx = e.clientX - c.px;
    const dy = e.clientY - c.py;
    c.px = e.clientX;
    c.py = e.clientY;
    c.dragDist += Math.abs(dx) + Math.abs(dy);
    const el = e.currentTarget as HTMLElement;
    if (c.dragDist > 6 && !el.hasPointerCapture(e.pointerId)) el.setPointerCapture(e.pointerId);
    const d = c.pointer === "mouse" || Math.abs(dx) > Math.abs(dy) ? -dx : -dy;
    push(d * roomRef.current.span * 0.0025);
  };
  const endDrag = () => {
    cam.current.dragging = false;
    cam.current.idle = 0;
  };

  /* ---------- door ---------- */

  const enter = () => {
    const c = cam.current;
    if (c.mode !== "intro") return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const phone = window.matchMedia("(pointer: coarse)").matches || window.innerWidth < 700;
    if (reduce) {
      c.mode = "free";
      c.q = c.goal = roomRef.current.stops[0]?.s ?? 0;
      c.lean = 1;
      setLit(true);
      setPhase("inside");
      return;
    }
    const m = phone ? MOTION.simple : MOTION.full;
    setDoorMs(m.doors);
    setAjar(false);
    setText("out"); // headline lifts away
    setPhase("opening");
    setLit(true); // lights come on one by one (see Room)
    c.mode = "entering";
    c.t0 = performance.now();
    c.walk = m.walk;
    c.bob = m.bob;
  };

  const open = phase !== "closed";

  return (
    <div
      ref={stageRef}
      aria-label="Gallery"
      className={cn(
        "fixed inset-0 select-none overflow-clip",
        phase === "inside" && "cursor-grab active:cursor-grabbing",
      )}
      style={{
        perspective: persp,
        background: "#f3f2ef",
        touchAction: phase === "inside" ? "none" : undefined,
      }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
    >
      {/* The world. The camera loop writes its transform every frame. */}
      <div
        ref={worldRef}
        className="absolute left-1/2 top-1/2 h-0 w-0"
        // No transform here on purpose: the camera loop owns it, and a React
        // re-render must not snap the camera back. Untransformed = door at 1:1.
        style={{ transformStyle: "preserve-3d" }}
      >
        <Room
          room={room}
          viewW={view.w}
          viewH={view.h}
          lit={lit}
          k={surfaceK}
          sealed={phase === "inside" && !exiting}
        />
        {/* Once you're inside, the entrance becomes a wall with two doors. */}
        {phase === "inside" &&
          !exiting &&
          room.doorWall.doors.map((d, i) => (
            <EndDoor
              key={d.to}
              door={d}
              wall={room.doorWall}
              floorY={room.floorY}
              k={contentK}
              lit={signs[i]}
              leafRef={(side, el) => {
                leafEls.current[i][side] = el;
              }}
              seamRef={(el) => {
                seamEls.current[i] = el;
              }}
              spillRef={(el) => {
                spillEls.current[i] = el;
              }}
              onHover={(on) => {
                doorAnim.current.hover = on ? i : -1;
              }}
              onFocus={() => stepTo(room.stops.length - 1)}
              onClick={(e) => onDoorClick(e, i)}
            />
          ))}

        {room.pieces.map((s, i) => (
          <Artwork
            key={PROJECTS[i].slug}
            project={PROJECTS[i]}
            slot={s}
            interactive={phase === "inside"}
            k={contentK}
            frameRef={(el) => {
              frameEls.current[i] = el;
            }}
            onFocus={() => {
              const k = room.stops.findIndex((st) => st.piece === i);
              if (k >= 0) stepTo(k);
            }}
            onClick={(e) => onPieceClick(e, i)}
          />
        ))}

        {(["left", "right"] as const).map((side) => (
          <Door
            key={side}
            side={side}
            open={open}
            ajar={ajar && !open}
            ms={doorMs}
            text={text}
            onEnter={enter}
            onAjar={setAjar}
          />
        ))}
      </div>

      {/* The room starts dim and brightens as the lights come on. One flat
          screen-sized layer: far cheaper than shading every wall. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-black"
        style={{
          opacity: 0,
          animation: phase === "opening" ? "lights-on 2.4s ease-out" : undefined,
        }}
      />

      {/* Controls once inside */}
      <div
        className={cn(
          "pointer-events-none absolute inset-x-0 bottom-6 z-10 flex items-center justify-between gap-4 px-6 transition-opacity duration-700",
          phase === "inside" ? "opacity-100" : "opacity-0",
        )}
      >
        <button
          type="button"
          onClick={leave}
          tabIndex={phase === "inside" ? 0 : -1}
          className="tracked pointer-events-auto whitespace-nowrap rounded-md border border-black/10 bg-white/70 px-4 py-2.5 text-[10px] text-black/70 backdrop-blur transition-colors hover:text-black"
        >
          ← Leave
        </button>
        <p
          className={cn(
            "tracked text-center text-[10px] text-black/45 transition-opacity duration-700",
            !hint && "opacity-0",
          )}
        >
          <span className="hidden sm:inline">Scroll or drag to move · ← → to step</span>
          <span className="sm:hidden">Swipe to move</span>
        </p>
        <span className="w-[86px]" aria-hidden />
      </div>
    </div>
  );
}

/* ---------- room layout and the camera path ---------- */

type RoomLayout = ReturnType<typeof buildRoom>;

function buildRoom(count: number, vw: number, vh: number) {
  const width = Math.max(2600, Math.round(vw * 1.8));
  const height = Math.max(1150, vh + 260);
  const floorY = vh / 2; // the door stands on the floor
  const ceilY = floorY - height;
  const midY = (floorY + ceilY) / 2;
  const corner = 720; // the angled walls in the back corners
  const cut = corner / Math.SQRT2;
  const spacing = 1150;

  // Pieces hang in one loop: down the left wall, round the back, up the right.
  const sideCount = Math.max(0, Math.ceil((count - 4) / 2));
  const depth = Math.max(3400, 1000 + sideCount * spacing + cut + 400);
  const y = -60; // a little above eye level

  const loop: Piece[] = [];
  for (let i = 0; i < sideCount; i++) {
    loop.push({ x: -width / 2, y, z: -(1000 + i * spacing), a: 90 });
  }
  loop.push({ x: -width / 2 + cut / 2, y, z: -depth + cut / 2, a: 45 });
  loop.push({ x: -(width / 2 - cut) / 2, y, z: -depth, a: 0 });
  loop.push({ x: (width / 2 - cut) / 2, y, z: -depth, a: 0 });
  loop.push({ x: width / 2 - cut / 2, y, z: -depth + cut / 2, a: -45 });
  for (let i = sideCount - 1; i >= 0; i--) {
    loop.push({ x: width / 2, y, z: -(1000 + i * spacing), a: -90 });
  }
  const pieces = loop.slice(0, count);

  // The last stop turns back to the entrance, now a wall with two doors.
  // Seen from inside (facing +z), your left is +x, so the first door goes there.
  const narrow = vw < 700;
  const dw = narrow ? 300 : 380;
  const gap = narrow ? 150 : 280;
  const doorWall = {
    dw,
    dh: dw * 2,
    doors: DOORS.map((d, i) => ({ ...d, x: ((i === 0 ? 1 : -1) * (dw + gap)) / 2 })),
  };

  // One stop in front of each piece. Distance along the path is "s".
  const stand = (p: Piece, piece: number): Stop => ({
    x: p.x + Math.sin(rad(p.a)) * FAR,
    z: p.z + Math.cos(rad(p.a)) * FAR,
    yaw: -rad(p.a),
    s: 0,
    piece,
  });
  const stops = pieces.map((p, i) => stand(p, i));
  stops.push({ x: 0, z: -FAR, yaw: Math.PI, s: 0, piece: -1 });
  for (let i = 1; i < stops.length; i++) {
    const a = stops[i - 1];
    const b = stops[i];
    b.yaw = nearestAngle(b.yaw, a.yaw); // keep turning the same way round
    // Turning counts as distance too, so corners take a moment.
    b.s = a.s + Math.max(420, Math.hypot(b.x - a.x, b.z - a.z) + Math.abs(b.yaw - a.yaw) * 520);
  }
  const span = stops.length > 1 ? stops[stops.length - 1].s / (stops.length - 1) : 1000;

  return { width, height, depth, floorY, ceilY, midY, corner, cut, pieces, doorWall, stops, span };
}

function poseAt(stops: Stop[], s: number): Pose {
  if (!stops.length) return { x: 0, z: -700, yaw: 0 };
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

// Step in from the path towards the wall by how much you're leaning in.
function leaned(p: Pose, lean: number): Pose {
  const d = (FAR - NEAR) * smooth(lean);
  return { x: p.x + Math.sin(p.yaw) * d, z: p.z - Math.cos(p.yaw) * d, yaw: p.yaw };
}

function nearestStop(stops: Stop[], s: number) {
  let best = 0;
  stops.forEach((st, i) => {
    if (Math.abs(st.s - s) < Math.abs(stops[best].s - s)) best = i;
  });
  return best;
}

function isTurning(stops: Stop[], s: number) {
  for (let i = 0; i < stops.length - 1; i++) {
    if (s >= stops[i].s && s <= stops[i + 1].s) {
      return Math.abs(stops[i + 1].yaw - stops[i].yaw) > 0.01;
    }
  }
  return false;
}

/* ---------- saving your place when you open a project ---------- */

function readSaved(): number | null {
  try {
    const raw = sessionStorage.getItem(SAVE_KEY);
    const n = raw === null ? NaN : Number(raw);
    return Number.isInteger(n) && n >= 0 ? n : null;
  } catch {
    return null;
  }
}
function writeSaved(s: number) {
  try {
    sessionStorage.setItem(SAVE_KEY, String(s));
  } catch {
    /* private mode: you'll just start at the door next time */
  }
}
function clearSaved() {
  try {
    sessionStorage.removeItem(SAVE_KEY);
  } catch {
    /* ignore */
  }
}

/* The piece grows from the wall to fill the screen, then the project page takes over. */
function zoomInto(el: HTMLElement, go: () => void) {
  const r = el.getBoundingClientRect();
  const veil = document.createElement("div");
  Object.assign(veil.style, {
    position: "fixed",
    inset: "0",
    background: "#fcfcfc",
    zIndex: "60",
    opacity: "0",
    pointerEvents: "none",
  });
  const box = el.cloneNode(true) as HTMLElement;
  Object.assign(box.style, {
    position: "fixed",
    left: "0px",
    top: "0px",
    margin: "0",
    zIndex: "61",
    overflow: "hidden",
    pointerEvents: "none",
    transform: "none",
  });
  document.body.append(veil, box);
  const cleanup = () => {
    veil.remove();
    box.remove();
  };
  veil.animate([{ opacity: 0 }, { opacity: 1 }], {
    duration: 260,
    easing: "cubic-bezier(0.3, 0, 0.2, 1)",
    fill: "forwards",
  });
  box
    .animate(
      [
        { left: `${r.left}px`, top: `${r.top}px`, width: `${r.width}px`, height: `${r.height}px` },
        {
          left: "0px",
          top: "0px",
          width: `${window.innerWidth}px`,
          height: `${window.innerHeight}px`,
        },
      ],
      { duration: 720, easing: EASE_ZOOM, fill: "forwards" },
    )
    .finished.then(() => {
      go();
      box.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 240, fill: "forwards" });
      veil
        .animate([{ opacity: 1 }, { opacity: 0 }], { duration: 420, delay: 120, fill: "forwards" })
        .finished.then(cleanup, cleanup);
    })
    .catch(() => {
      cleanup();
      go();
    });
}

/* ---------- 3D building blocks ---------- */

/*
  Memory matters here. Every 3D surface becomes its own GPU texture, sized by
  its CSS size times the screen's pixel density. A 2600 x 3400 floor on a 3x
  iPhone alone is ~320 MB, and iOS Safari kills the tab well before the whole
  room adds up. So big plain surfaces are drawn small and scaled up (`k`):
  their gradients are soft anyway, so nobody can tell.
*/

// A flat panel centred at (x, y, z), turned by `turn`, drawn at 1/k resolution.
function panel(
  w: number,
  h: number,
  x: number,
  y: number,
  z: number,
  turn: string,
  k = 1,
): CSSProperties {
  return {
    position: "absolute",
    left: -w / k / 2,
    top: -h / k / 2,
    width: w / k,
    height: h / k,
    transform: `translate3d(${x}px, ${y}px, ${z}px) ${turn} scale(${k})`,
  };
}

// Each wall gets a slightly different light level so corners read, plus a soft
// shadow where it meets the floor.
const wall = (tone: number) =>
  `linear-gradient(180deg, rgba(255,255,255,.55) 0%, transparent 35%, transparent 80%, rgba(0,0,0,.07) 96%, rgba(0,0,0,.14) 100%), hsl(40 8% ${tone}%)`;
const WALL = wall(95);
const SIDE_WALL = wall(91.5);
const CORNER_WALL = wall(93);

/*
  Content with text (pieces, the about panel) is laid out at full size, then
  painted into a box `k` times smaller and scaled back up. k = 1 on desktop,
  2 on phones: still sharp at the size it appears, at a quarter of the memory.
*/
function Lowres({
  w,
  h,
  k,
  children,
}: {
  w: number;
  h: number;
  k: number;
  children: React.ReactNode;
}) {
  if (k === 1) return <>{children}</>;
  return (
    <div style={{ width: w, height: h, transform: `scale(${1 / k})`, transformOrigin: "0 0" }}>
      {children}
    </div>
  );
}

function Room({
  room,
  viewW,
  viewH,
  lit,
  k,
  sealed,
}: {
  room: RoomLayout;
  viewW: number;
  viewH: number;
  lit: boolean;
  k: number;
  sealed: boolean;
}) {
  const { width: W, height: H, depth: D, floorY, ceilY, midY, corner, cut } = room;
  const side = (W - viewW) / 2; // entrance wall either side of the door
  const above = H - viewH; // entrance wall above the door
  const lights = Math.max(3, Math.floor((D - 300) / 520));
  const tile = 320 / k; // floor tile size at the reduced resolution

  return (
    <>
      {/* Floor: pale tiles with light pooling down the middle */}
      <div
        style={{
          ...panel(W, D, 0, floorY, -D / 2, "rotateX(90deg)", k),
          background: `radial-gradient(ellipse 45% 60% at 50% 40%, rgba(255,255,255,.75), transparent 75%), repeating-linear-gradient(90deg, rgba(0,0,0,.08) 0 1px, transparent 1px ${tile}px), repeating-linear-gradient(0deg, rgba(0,0,0,.08) 0 1px, transparent 1px ${tile}px), #d9d6d0`,
        }}
      />
      {/* Ceiling */}
      <div
        style={{
          ...panel(W, D, 0, ceilY, -D / 2, "rotateX(-90deg)", k),
          background:
            "linear-gradient(90deg, rgba(0,0,0,.06), transparent 18%, transparent 82%, rgba(0,0,0,.06)), #e9e8e5",
        }}
      />
      {/* Light panels across the ceiling, switching on one after another as you walk in.
          A soft gradient stands in for a glow (a blurred box-shadow costs far more). */}
      {Array.from({ length: lights }, (_, i) => (
        <div
          key={i}
          style={{
            ...panel(W * 0.72, 150, 0, ceilY + 2, -300 - i * 520, "rotateX(-90deg)", k),
            background:
              "linear-gradient(180deg, transparent, rgba(255,255,255,.55) 32%, #fff 44%, #fff 56%, rgba(255,255,255,.55) 68%, transparent)",
            opacity: lit ? 1 : 0.15,
            transition: lit ? `opacity .9s ease ${i * 120}ms` : "opacity .4s ease",
          }}
        />
      ))}
      {/* Side walls */}
      <div
        style={{
          ...panel(D, H, -W / 2, midY, -D / 2, "rotateY(90deg)", k),
          background: SIDE_WALL,
        }}
      />
      <div
        style={{
          ...panel(D, H, W / 2, midY, -D / 2, "rotateY(-90deg)", k),
          background: SIDE_WALL,
        }}
      />
      {/* Back wall and the two angled corners */}
      <div style={{ ...panel(W - cut * 2, H, 0, midY, -D, "", k), background: WALL }} />
      <div
        style={{
          ...panel(corner, H, -W / 2 + cut / 2, midY, -D + cut / 2, "rotateY(45deg)", k),
          background: CORNER_WALL,
        }}
      />
      <div
        style={{
          ...panel(corner, H, W / 2 - cut / 2, midY, -D + cut / 2, "rotateY(-45deg)", k),
          background: CORNER_WALL,
        }}
      />

      {/* Entrance wall, seen from inside (faces into the room) */}
      {side > 0 && (
        <>
          <div
            style={{
              ...panel(side, H, -(viewW / 2 + side / 2), midY, 0, "rotateY(180deg)", k),
              background: WALL,
            }}
          />
          <div
            style={{
              ...panel(side, H, viewW / 2 + side / 2, midY, 0, "rotateY(180deg)", k),
              background: WALL,
            }}
          />
        </>
      )}
      {/* Once you're in, the doorway you came through closes up into plain wall
          (the two end doors hang on it). It opens again when you leave. */}
      {sealed && (
        <div
          style={{
            ...panel(viewW, viewH, 0, floorY - viewH / 2, -1, "rotateY(180deg)", k),
            background: WALL,
          }}
        />
      )}
      {above > 0 && (
        <div
          style={{
            ...panel(viewW, above, 0, ceilY + above / 2, 0, "rotateY(180deg)", k),
            background: "#fbfaf8",
          }}
        />
      )}
    </>
  );
}

/* ---------- the doors at the end of the walk ---------- */

type DoorWall = RoomLayout["doorWall"];

/*
  One door on the end wall: a warm-lit doorway, two leaves hinged on their
  outer edges, and a label above. The camera loop swings the leaves (through
  leafRef) so they never re-render React.
*/
function EndDoor({
  door,
  wall,
  floorY,
  k,
  lit,
  leafRef,
  seamRef,
  spillRef,
  onHover,
  onFocus,
  onClick,
}: {
  door: DoorWall["doors"][number];
  wall: DoorWall;
  floorY: number;
  k: number;
  lit: boolean;
  leafRef: (side: 0 | 1, el: HTMLElement | null) => void;
  seamRef: (el: HTMLElement | null) => void;
  spillRef: (el: HTMLElement | null) => void;
  onHover: (on: boolean) => void;
  onFocus: () => void;
  onClick: (e: React.MouseEvent) => void;
}) {
  const { dw, dh } = wall;
  const labelW = dw * 2.2;
  const labelH = 150;
  const hover = {
    onPointerEnter: (e: React.PointerEvent) => e.pointerType === "mouse" && onHover(true),
    onPointerLeave: () => onHover(false),
  };

  return (
    <>
      {/* Warm light spilling onto the floor as the door opens */}
      <div
        ref={spillRef}
        aria-hidden
        style={{
          ...panel(dw * 1.9, 640, door.x, floorY - 1, -320, "rotateX(90deg)", 4),
          background:
            "radial-gradient(ellipse 42% 85% at 50% 100%, rgba(255,214,166,.85), rgba(255,226,190,.35) 45%, transparent 75%)",
          opacity: 0,
          pointerEvents: "none",
        }}
      />

      {/* The door. Its leaves sit in 3D, so this keeps preserve-3d. */}
      <Link
        to={door.to}
        aria-label={door.label}
        onClick={onClick}
        onFocus={onFocus}
        draggable={false}
        {...hover}
        className="block outline-none focus-visible:ring-4 focus-visible:ring-black/30"
        style={{
          // In front of the wall (z -1), with the lit doorway between them.
          ...panel(dw, dh, door.x, floorY - dh / 2, -3, "rotateY(180deg)", k),
          transformStyle: "preserve-3d",
          boxShadow: `0 0 0 ${8 / k}px #e4e2dd, 0 0 0 ${9 / k}px rgba(0,0,0,.08)`,
        }}
      >
        {/* The lit room behind the door */}
        <span
          aria-hidden
          className="absolute inset-0"
          style={{
            transform: "translateZ(-1px)",
            background:
              "radial-gradient(ellipse 70% 60% at 50% 55%, #fff8ee, #ffe6c8 45%, #d8bf9c 100%)",
          }}
        />
        {([0, 1] as const).map((side) => (
          <span
            key={side}
            ref={(el) => leafRef(side, el)}
            aria-hidden
            className="absolute top-0 h-full w-1/2"
            style={{
              [side === 0 ? "left" : "right"]: 0,
              transformOrigin: side === 0 ? "0% 50%" : "100% 50%",
              background: "linear-gradient(90deg, #fbfbfa, #ecebe8)",
              boxShadow: "inset 0 0 0 1px rgba(0,0,0,.08)",
            }}
          >
            {/* Inset panel */}
            <span
              className="absolute"
              style={{
                left: "13%",
                right: "13%",
                top: "7%",
                bottom: "9%",
                border: "1px solid rgba(0,0,0,.07)",
                boxShadow: "inset 0 1px 0 rgba(255,255,255,.6)",
              }}
            />
            {/* Bar handle near the middle */}
            <span
              className="absolute rounded-[2px]"
              style={{
                top: "36%",
                height: "26%",
                width: "3.6%",
                [side === 0 ? "right" : "left"]: "9%",
                background: "linear-gradient(90deg, #2a2a2a, #111 45%, #333)",
                boxShadow: "0 2px 4px rgba(0,0,0,.25)",
              }}
            />
          </span>
        ))}
        {/* The line where the leaves meet, gone once they part */}
        <span
          ref={seamRef}
          aria-hidden
          className="absolute bottom-0 left-1/2 top-[1%] w-[1.2%] -translate-x-1/2 bg-black/25"
        />
      </Link>

      {/* Label above: pale until you arrive, then dark with the light-beam underline */}
      <Link
        to={door.to}
        tabIndex={-1}
        aria-hidden
        onClick={onClick}
        draggable={false}
        {...hover}
        style={panel(
          labelW,
          labelH,
          door.x,
          floorY - dh - 40 - labelH / 2,
          -3,
          "rotateY(180deg)",
          k,
        )}
      >
        <Lowres w={labelW} h={labelH} k={k}>
          <span className="flex h-full items-end justify-center">
            <span className="inline-block">
              <span
                className="block whitespace-nowrap font-medium leading-none tracking-tight"
                style={{
                  fontSize: dw < 340 ? 60 : 76,
                  color: lit ? "#0a0a0a" : "rgba(10,10,10,.22)",
                  transition: "color .6s",
                }}
              >
                {door.label}
              </span>
              <span
                className="mt-3 block h-[6px] rounded-full"
                style={{
                  background: "var(--prism)",
                  transform: lit ? "none" : "scaleX(0)",
                  transformOrigin: "0 50%",
                  transition: `transform .7s ${EASE_TEXT_IN} .15s`,
                }}
              />
            </span>
          </span>
        </Lowres>
      </Link>
    </>
  );
}

function Artwork({
  project,
  slot,
  interactive,
  k,
  frameRef,
  onFocus,
  onClick,
}: {
  project: Project;
  slot: Piece;
  interactive: boolean;
  k: number;
  frameRef: (el: HTMLElement | null) => void;
  onFocus: () => void;
  onClick: (e: React.MouseEvent) => void;
}) {
  // Hang it a hair off the wall so it never flickers into it.
  const off = 3;
  const x = slot.x + Math.sin(rad(slot.a)) * off;
  const z = slot.z + Math.cos(rad(slot.a)) * off;
  const boxH = FRAME_H + 110; // frame plus caption

  return (
    <div style={panel(FRAME_W, boxH, x, slot.y + 55, z, `rotateY(${slot.a}deg)`, k)}>
      <Lowres w={FRAME_W} h={boxH} k={k}>
        <Link
          to="/projects/$slug"
          params={{ slug: project.slug }}
          draggable={false}
          tabIndex={interactive ? 0 : -1}
          onFocus={onFocus}
          onClick={onClick}
          className="group block outline-none"
          aria-label={`${project.title}, ${project.year}`}
        >
          <span
            ref={frameRef}
            className="block border-[10px] border-[#111] bg-black shadow-[0_30px_40px_-20px_rgba(0,0,0,.4)] transition-transform duration-500 group-hover:-translate-y-2 group-focus-visible:ring-4 group-focus-visible:ring-black/30"
            style={{ height: FRAME_H }}
          >
            {project.image ? (
              <img
                src={project.image}
                alt=""
                draggable={false}
                className="h-full w-full object-cover"
              />
            ) : (
              <Poster title={project.title} />
            )}
          </span>
          <span className="mt-5 block text-left text-black">
            <span className="block text-[22px] font-medium leading-tight">{project.title}</span>
            <span className="mt-1 block text-[16px] text-black/50">{project.tags.join(", ")}</span>
          </span>
        </Link>
      </Lowres>
    </div>
  );
}

/* ---------- the door ---------- */

function Door({
  side,
  open,
  ajar,
  ms,
  text,
  onEnter,
  onAjar,
}: {
  side: "left" | "right";
  open: boolean;
  ajar: boolean;
  ms: number;
  text: TextState;
  onEnter: () => void;
  onAjar: (on: boolean) => void;
}) {
  const left = side === "left";
  const dir = left ? -1 : 1;
  // Slides sideways into the wall. Hovering cracks it open a few pixels.
  const shift = open ? `${dir * 101}%` : ajar ? `${dir * 10}px` : "0px";
  const transition = open
    ? `transform ${ms}ms ${EASE_DOORS}`
    : ajar
      ? `transform .6s ${EASE_AJAR}`
      : `transform 1.3s ${EASE_CLOSE}`;
  return (
    <div
      className="absolute overflow-clip"
      style={{
        left: left ? "-50vw" : 0,
        top: "-50dvh",
        width: "50vw",
        height: "100dvh",
        // Sits a hair in front of the entrance wall, so from inside the wall hides it.
        transform: `translateZ(2px) translateX(${shift})`,
        transition,
      }}
      onPointerEnter={(e) => e.pointerType === "mouse" && onAjar(true)}
      onPointerLeave={() => onAjar(false)}
      // The right half is a visual copy; screen readers and keyboards use the left one.
      aria-hidden={left ? undefined : true}
    >
      {/* Each half shows its half of one full-width face, so the seam is invisible when shut */}
      <div className={cn("absolute top-0 h-full w-[200%]", left ? "left-0" : "right-0")}>
        <DoorFace onEnter={onEnter} onAjar={onAjar} focusable={left && !open} text={text} />
      </div>
    </div>
  );
}

function DoorFace({
  onEnter,
  onAjar,
  focusable,
  text,
}: {
  onEnter: () => void;
  onAjar: (on: boolean) => void;
  focusable: boolean;
  text: TextState;
}) {
  const words = SITE.tagline.split(" ");
  // Headline words rise in; when you enter they lift away upwards.
  const word = (i: number): CSSProperties => ({
    display: "inline-block",
    transform: { pre: "translateY(110%)", in: "translateY(0)", out: "translateY(-110%)" }[text],
    transition: {
      pre: "none",
      in: `transform .9s ${EASE_TEXT_IN} ${i * 60}ms`,
      out: `transform .5s ${EASE_TEXT_OUT} ${i * 25}ms`,
    }[text],
  });
  // Paragraph and button slide up from below, one after the other.
  const ui = (n: number): CSSProperties => ({
    transform: text === "in" ? "none" : "translateY(calc(100% + 12px))",
    opacity: text === "in" ? 1 : 0,
    transition: {
      pre: "none",
      in: `transform 1.1s ${EASE_UI_IN} ${0.2 + n * 0.12}s, opacity .7s ease ${0.2 + n * 0.12}s`,
      out: "transform .4s ease, opacity .3s ease",
    }[text],
  });

  return (
    <div className="relative h-full w-full bg-black text-white">
      <img
        src="/brand/hero-door.webp"
        alt=""
        draggable={false}
        className="absolute bottom-0 left-1/2 h-[72%] w-auto max-w-none"
        style={{ transform: `translateX(-${BEAM_X}%)` }}
      />
      {/* Fade the image into the black */}
      <div className="absolute inset-x-0 top-0 h-[45%] bg-gradient-to-b from-black via-black to-transparent" />

      <div className="relative z-10 flex flex-col items-center px-4 pt-32 text-center sm:pt-36">
        <h1 className="tracked text-3xl font-light sm:text-5xl" aria-label={SITE.tagline}>
          {words.map((w, i) => (
            <span
              key={i}
              aria-hidden
              className="inline-block overflow-hidden pb-[.06em] align-bottom"
            >
              <span style={word(i)}>{w}</span>
              {i < words.length - 1 && " "}
            </span>
          ))}
        </h1>
        <p className="mx-auto mt-6 max-w-md text-sm text-white/70" style={ui(0)}>
          {SITE.description}
        </p>
        <button
          type="button"
          onClick={onEnter}
          onFocus={() => onAjar(true)}
          onBlur={() => onAjar(false)}
          tabIndex={focusable ? 0 : -1}
          className="tracked mt-8 inline-block rounded-md bg-white px-6 py-3 text-[11px] font-medium text-black hover:opacity-90"
          style={ui(1)}
        >
          Enter the gallery
        </button>
      </div>
    </div>
  );
}
