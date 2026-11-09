import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { SITE } from "@/content/site";
import { PROJECTS, type Project } from "@/content/projects";
import { setStageTone } from "@/lib/stage";
import { cn } from "@/lib/utils";
import { Poster } from "@/components/Poster";
import {
  BLUE,
  CYAN,
  ORANGE,
  DoorLight,
  Grain,
  PrismBurst,
  drawBurst,
  drawDoorLight,
} from "@/components/PrismLight";

/*
  The home page: a walk-through 3D gallery.

  It opens on a dark door with prism light pouring through the gap. Scrolling
  flies you at the door: the light grows until it fills the screen, bursts into
  prism light, and clears onto a white gallery whose three walls hang the films
  (playing). The camera glides straight to the first film on the left wall.

  Inside, every scroll / swipe / arrow press moves exactly one piece. At the end
  you turn to face two prism-lit doors, All work and About us. Scrolling back
  past the first film flies you back out to the door.

  Quality: everything that zooms (the door) is drawn with CSS gradients rather
  than a photo, so it stays sharp at any size. Text and artwork are full
  resolution. Only plain wall/ceiling textures are drawn small and scaled up
  (they're soft gradients, so it doesn't show) to stay inside phone memory.

  Coordinates are CSS pixels in one 3D world: x right, y down, z towards you.
  The entrance wall is at z = 0 and the room runs back to z = -depth.
*/

type Mode = "intro" | "free" | "door";
type Pose = { x: number; z: number; yaw: number }; // yaw in radians, 0 = facing into the room
type Piece = { x: number; y: number; z: number; a: number }; // a = which way the wall faces, degrees
type Stop = Pose & { s: number; piece: number }; // piece = index in PROJECTS, -1 = the door wall

/* The two doors at the end of the walk. */
const DOORS = [
  { label: "All work", to: "/projects" },
  { label: "About us", to: "/about" },
] as const;

/* ---------- motion settings ---------- */

// The way in, as fractions of the scroll that takes you through the door.
const INTRO_SCROLL = 1500; // px of scrolling from the door to the first film
const ZOOM_END = 0.62; // by here the light fills the screen
const FLASH_IN: [number, number] = [0.48, 0.64]; // prism light floods in
const FLASH_OUT: [number, number] = [0.72, 0.9]; // ...and clears onto the room
const GLIDE: [number, number] = [0.7, 1]; // camera glides to the first film

const STEP_LOCK_MS = 560; // one scroll gesture = one piece
const FOLLOW = 4.2; // how quickly the camera catches up (higher = snappier)
const FOLLOW_TURN = 3; // ...a bit gentler while turning a corner
const LEAN_IN = 1.9;
const LEAN_OUT = 3.2;
const DOOR_WALK_MS = 1400; // walking through an end door into its page

const FRAME_W = 720; // films are 16:9
const FRAME_H = 405;
const SAVE_KEY = "insight-gallery-stop"; // which stop you were at (survives resizes)

const EASE_TEXT_IN = "cubic-bezier(0.22, 1, 0.36, 1)";
const EASE_ZOOM = "cubic-bezier(0.65, 0, 0.35, 1)";

const rad = (deg: number) => (deg * Math.PI) / 180;
const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
const smooth = (t: number) => {
  const c = clamp(t, 0, 1);
  return c * c * (3 - 2 * c);
};
// 0 before a, 1 after b, eased in between.
const band = (t: number, [a, b]: [number, number]) => smooth((t - a) / (b - a));
// Frame-rate independent easing towards a goal.
const damp = (rate: number, dt: number) => 1 - Math.exp(-rate * dt);
// Turn the short way round.
const nearestAngle = (goal: number, from: number) =>
  goal + Math.round((from - goal) / (Math.PI * 2)) * Math.PI * 2;

export function Gallery() {
  const navigate = useNavigate();
  const [view, setView] = useState({ w: 1440, h: 900 });
  const [inside, setInside] = useState(false); // past the flash: the room is what you see
  const [lit, setLit] = useState(false);
  const [signs, setSigns] = useState([false, false]); // end-door labels lit
  const [hint, setHint] = useState(true);

  const room = useMemo(() => buildRoom(PROJECTS.length, view.w, view.h), [view]);
  // Narrow screens get a wider field of view so the room doesn't feel like a tunnel.
  const persp = Math.round(clamp(view.w * 0.62, 520, 950));
  const phone = view.w < 700;
  const surfaceK = phone ? 8 : 4; // plain walls, ceiling, floor wash: drawn small
  const doorK = phone ? 2 : 1; // door leaves: flat colour, edges stay sharp anyway

  const stageRef = useRef<HTMLDivElement>(null);
  const worldRef = useRef<HTMLDivElement>(null);
  const introRef = useRef<HTMLDivElement>(null);
  const flashRef = useRef<HTMLDivElement>(null);
  const scene = useRef<Record<string, HTMLElement | null>>({});
  const roomRef = useRef(room);
  const perspRef = useRef(persp);
  const viewRef = useRef(view);
  roomRef.current = room;
  perspRef.current = persp;
  viewRef.current = view;

  // Everything the camera loop reads lives in refs, so moving never re-renders React.
  const cam = useRef({
    mode: "intro" as Mode,
    p: 0, // progress through the way in, 0 = at the door, 1 = at the first film
    pGoal: 0,
    auto: false, // playing the way in/out by itself (click, keys, Leave)
    q: 0, // where the camera is along the path inside
    goal: 0,
    lean: 0, // 0 = standing back, 1 = leaning in at a piece
    at: 0, // the stop you're at
    playing: -2, // the stop whose films are playing
    insideFlag: false,
    litFlag: false,
    pose: { x: 0, z: -250, yaw: 0, y: 0 },
    lockUntil: 0, // wheel steps are locked until this time
    wheelAcc: 0,
    drag: { on: false, x0: 0, y0: 0, x: 0, y: 0, dist: 0, pointer: "mouse" },
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
  const doorAnim = useRef({ ang: [0, 0], hover: -1, parked: false });
  const leafEls = useRef<(HTMLElement | null)[][]>([[], []]);
  const glowEls = useRef<(HTMLElement | null)[][]>([[], []]);
  const videoEls = useRef<(HTMLVideoElement | null)[]>([]);
  const frameEls = useRef<(HTMLElement | null)[]>([]);
  const signTimers = useRef<number[]>([]);

  /* ---------- setup ---------- */

  useEffect(() => {
    const fit = () => setView({ w: window.innerWidth, h: window.innerHeight });
    fit();
    window.addEventListener("resize", fit);

    // Coming back from a page: put you back where you were.
    const saved = readSaved();
    if (saved !== null) {
      const c = cam.current;
      const stops = roomRef.current.stops;
      c.mode = "free";
      c.p = c.pGoal = 1;
      c.at = Math.min(saved, stops.length - 1);
      c.q = c.goal = stops[c.at]?.s ?? 0;
      c.lean = stops[c.at]?.piece === -1 ? 0 : 1; // no leaning in at the doors
      c.insideFlag = c.litFlag = true;
      drawIntro(1); // the door and its light are already behind you
      setInside(true);
      setLit(true);
      setHint(false);
    }
    const timers = signTimers;
    const videos = videoEls;
    return () => {
      window.removeEventListener("resize", fit);
      timers.current.forEach(clearTimeout);
      videos.current.forEach((v) => v?.pause());
      setStageTone(null);
    };
  }, []);

  useEffect(() => {
    setStageTone(inside ? "light" : "dark");
  }, [inside]);

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
      let pose = { ...c.pose };

      if (c.mode === "intro") {
        // Scrolling (or auto-play) moves you through the door.
        c.p += (c.pGoal - c.p) * damp(c.auto ? 1.15 : 6, dt);
        if (Math.abs(c.pGoal - c.p) < 0.0008) c.p = c.pGoal;
        drawIntro(c.p);
        // Behind the light you're already in the room, gliding to the first film.
        const start = { x: 0, z: -250, yaw: 0 };
        const first = r.stops[0] ? leaned(r, r.stops[0], 1) : start;
        const g = band(c.p, GLIDE);
        const yaw1 = nearestAngle(first.yaw, 0);
        pose = {
          x: start.x + (first.x - start.x) * g,
          z: start.z + (first.z - start.z) * g,
          yaw: start.yaw + (yaw1 - start.yaw) * smooth((g - 0.15) / 0.85),
          y: 0,
        };
        const isIn = c.p > 0.7;
        if (isIn !== c.insideFlag) {
          c.insideFlag = isIn;
          setInside(isIn);
        }
        const on = c.p > 0.6;
        if (on !== c.litFlag) {
          c.litFlag = on;
          setLit(on);
        }
        if (c.p >= 1 && c.pGoal >= 1) {
          c.mode = "free";
          c.auto = false;
          c.at = 0;
          c.q = c.goal = r.stops[0]?.s ?? 0;
          c.lean = 1;
        }
      } else if (c.mode === "free") {
        const stops = r.stops;
        const turning = isTurning(stops, c.q);
        c.q += (c.goal - c.q) * damp(turning ? FOLLOW_TURN : FOLLOW, dt);
        if (Math.abs(c.goal - c.q) < 0.3) c.q = c.goal;
        // Lean in at films; at the door wall stay back so both doors fit.
        const here = stops[nearestStop(stops, c.q)];
        const near = !!here && here.piece >= 0 && Math.abs(c.q - here.s) < r.span * 0.3;
        const g = near ? 1 : 0;
        c.lean += (g - c.lean) * damp(g ? LEAN_IN : LEAN_OUT, dt);
        pose = { ...leaned(r, poseAt(stops, c.q), c.lean), y: 0 };
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
        d.veil.style.opacity = String(smooth((t - 0.4) / 0.5));
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
          c.mode === "door" && c.door?.i === i ? 82 : parked ? (da.hover === i ? 24 : 12) : 0;
        const rate = goal > a ? (c.mode === "door" ? 5 : 3.5) : 5;
        let n = a + (goal - a) * damp(rate, dt);
        if (Math.abs(goal - n) < 0.05) n = goal;
        const [l, rr] = leafEls.current[i] ?? [];
        // Leaves swing out towards you (there's no room behind the wall to swing into).
        if (l) l.style.transform = `rotateY(${-n}deg)`;
        if (rr) rr.style.transform = `rotateY(${n}deg)`;
        const [spill, halo] = glowEls.current[i] ?? [];
        const open = smooth(n / 30);
        if (spill) spill.style.opacity = String(0.35 + 0.65 * open);
        if (halo) halo.style.opacity = String(0.55 + 0.45 * open);
        return n;
      });

      // Only the films near you play.
      const playAt = c.mode === "intro" ? (c.p > 0.55 ? 0 : -1) : c.at;
      if (playAt !== c.playing) {
        c.playing = playAt;
        syncVideos(r, playAt);
      }

      c.pose = pose;
      if (worldRef.current) {
        worldRef.current.style.transform = `translateZ(${P}px) rotateY(${pose.yaw}rad) translate3d(${-pose.x}px, ${-pose.y}px, ${-pose.z}px)`;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  /* ---------- the door, drawn for the current progress ---------- */

  // Sizes are recomputed every frame (not scaled with a transform), so the
  // gradients are always drawn at full sharpness however close you get.
  function drawIntro(p: number) {
    const { w: W, h: H } = viewRef.current;
    const s = scene.current;
    drawDoorLight(s, W, H, band(p, [0, ZOOM_END]));
    if (s.dust) s.dust.style.opacity = String(band(p, [0.03, 0.3]) * (1 - band(p, [0.5, 0.6])));
    if (introRef.current) {
      const fade = 1 - band(p, [0.64, 0.7]);
      introRef.current.style.opacity = String(fade);
      introRef.current.style.visibility = fade <= 0 ? "hidden" : "visible";
    }
    if (flashRef.current) {
      const f = band(p, FLASH_IN) * (1 - band(p, FLASH_OUT));
      flashRef.current.style.opacity = String(f);
      flashRef.current.style.visibility = f <= 0 ? "hidden" : "visible";
      if (f > 0) drawBurst(s, (p - FLASH_IN[0]) / (FLASH_OUT[1] - FLASH_IN[0]));
    }
    if (s.hint) s.hint.style.opacity = String(1 - band(p, [0, 0.05]));
  }

  /* ---------- films ---------- */

  function syncVideos(r: RoomLayout, at: number) {
    PROJECTS.forEach((_, i) => {
      const v = videoEls.current[i];
      if (!v) return;
      const k = r.stops.findIndex((st) => st.piece === i);
      const near = at >= 0 && Math.abs(k - at) <= 1;
      if (near && v.paused) v.play().catch(() => {});
      else if (!near && !v.paused) v.pause();
    });
  }

  /* ---------- moving ---------- */

  const stepTo = (i: number) => {
    const c = cam.current;
    const stops = roomRef.current.stops;
    if (!stops[i] || c.mode !== "free") return;
    c.at = i;
    c.goal = stops[i].s;
    setHint(false);
  };

  // One piece forward or back. Back from the first film flies you out to the door.
  const step = (dir: 1 | -1) => {
    const c = cam.current;
    if (c.mode !== "free") return;
    if (dir < 0 && c.at === 0) return goOut(false);
    stepTo(clamp(c.at + dir, 0, roomRef.current.stops.length - 1));
  };

  const goIn = () => {
    const c = cam.current;
    if (c.mode !== "intro") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) c.p = 0.999;
    c.pGoal = 1;
    c.auto = true;
    setHint(false);
  };

  // Back out through the light. `all` = right back to the door (Leave button);
  // otherwise just into the light, and further scrolling continues.
  const goOut = (all: boolean) => {
    const c = cam.current;
    if (c.mode !== "free") return;
    clearSaved();
    c.mode = "intro";
    c.p = 1;
    c.pGoal = all ? 0 : 0.86;
    c.auto = all;
    c.lockUntil = performance.now() + STEP_LOCK_MS;
  };

  /* ---------- opening a film ---------- */

  const openPiece = (i: number) => {
    const project = PROJECTS[i];
    if (!project) return;
    writeSaved(cam.current.at);
    const go = () => navigate({ to: "/projects/$slug", params: { slug: project.slug } });
    const el = frameEls.current[i];
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return go();
    zoomInto(el, go);
  };

  // Clicking the film you're at opens it; clicking another walks you to it.
  const onPieceClick = (e: React.MouseEvent, i: number) => {
    e.preventDefault();
    const c = cam.current;
    if (c.drag.dist > 6) return;
    const stops = roomRef.current.stops;
    const target = stops.findIndex((s) => s.piece === i);
    if (target < 0) return;
    const settled =
      c.at === target && Math.abs(c.q - stops[target].s) < roomRef.current.span * 0.25;
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

  const openDoor = (i: number) => {
    const c = cam.current;
    const r = roomRef.current;
    const door = r.doorWall.doors[i];
    if (!door || c.mode !== "free") return;
    writeSaved(r.stops.length - 1); // come back to the door wall
    const go = () => navigate({ to: door.to });
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return go();
    // Prism light floods in as you step through, then clears onto the page.
    const veil = document.createElement("div");
    Object.assign(veil.style, {
      position: "fixed",
      inset: "0",
      zIndex: "60",
      opacity: "0",
      pointerEvents: "none",
      background: `linear-gradient(90deg, rgba(${BLUE},.35), transparent 28%, transparent 72%, rgba(${ORANGE},.35)), radial-gradient(circle at 50% 50%, #fff 0 38%, #fbfbfa 100%)`,
    });
    document.body.append(veil);
    const dist = (perspRef.current * r.doorWall.dw) / (1.1 * window.innerWidth);
    c.mode = "door";
    c.door = {
      i,
      t0: performance.now(),
      from: { ...c.pose },
      x1: door.x,
      z1: -3 - dist,
      y1: r.floorY - r.doorWall.dh / 2,
      veil,
      gone: false,
      go: () => {
        go();
        veil
          .animate([{ opacity: 1 }, { opacity: 0 }], {
            duration: 600,
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
    if (c.drag.dist > 6) return;
    if (doorAnim.current.parked || e.detail === 0) openDoor(i);
    else stepTo(roomRef.current.stops.length - 1);
  };

  // Keep the latest handlers for the listeners and the camera loop.
  const handlers = useRef({ step, goIn, goOut, openPiece, lightSigns });
  handlers.current = { step, goIn, goOut, openPiece, lightSigns };

  /* ---------- input ---------- */

  // Scroll: in front of the door it moves you through it; inside, one gesture = one piece.
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
        c.auto = false;
        c.pGoal = clamp(c.pGoal + d / INTRO_SCROLL, 0, 1);
        setHint(false);
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

  // Keys: arrows, Page Up/Down and Space step; Enter opens the film you're at.
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      const c = cam.current;
      const t = e.target as HTMLElement | null;
      if (t?.closest?.("input, textarea, select")) return;
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
      } else if (e.key === "Enter" && !t?.closest?.("a, button")) {
        const piece = roomRef.current.stops[c.at]?.piece ?? -1;
        if (piece >= 0) h.openPiece(piece);
      }
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, []);

  // Drag / swipe: before the door it moves you through it; inside, one swipe = one piece.
  const onPointerDown = (e: React.PointerEvent) => {
    if (e.button > 0) return;
    const d = cam.current.drag;
    Object.assign(d, {
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
    if (!d.on) return;
    const dy = e.clientY - d.y;
    d.dist += Math.abs(e.clientX - d.x) + Math.abs(dy);
    d.x = e.clientX;
    d.y = e.clientY;
    const el = e.currentTarget as HTMLElement;
    if (d.dist > 6 && !el.hasPointerCapture(e.pointerId)) el.setPointerCapture(e.pointerId);
    if (c.mode === "intro" && d.dist > 6) {
      c.auto = false;
      c.pGoal = clamp(c.pGoal - dy / (INTRO_SCROLL * 0.6), 0, 1); // drag up = forwards
      setHint(false);
    }
  };
  const onPointerUp = () => {
    const c = cam.current;
    const d = c.drag;
    if (!d.on) return;
    d.on = false;
    if (c.mode !== "free") return;
    const dx = d.x - d.x0;
    const dy = d.y - d.y0;
    const move = d.pointer === "mouse" || Math.abs(dx) > Math.abs(dy) ? dx : dy;
    if (Math.abs(move) > 40) step(move < 0 ? 1 : -1); // swipe left/up = next
  };

  return (
    <div
      ref={stageRef}
      aria-label="Gallery"
      className={cn("fixed inset-0 select-none overflow-clip", inside && "cursor-grab")}
      style={{ perspective: persp, background: "#f3f2ef", touchAction: "none" }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
    >
      <h1 className="sr-only">{SITE.tagline}</h1>

      {/* The world. The camera loop writes its transform every frame. */}
      <div
        ref={worldRef}
        className="absolute left-1/2 top-1/2 h-0 w-0"
        // No transform here on purpose: the camera loop owns it, and a React
        // re-render must not snap the camera back.
        style={{ transformStyle: "preserve-3d" }}
      >
        <Room room={room} lit={lit} k={surfaceK} />

        {room.doorWall.doors.map((d, i) => (
          <EndDoor
            key={d.to}
            door={d}
            wall={room.doorWall}
            floorY={room.floorY}
            k={doorK}
            lit={signs[i]}
            interactive={inside}
            leafRef={(side, el) => {
              leafEls.current[i][side] = el;
            }}
            glowRef={(which, el) => {
              glowEls.current[i][which] = el;
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
            interactive={inside}
            frameRef={(el) => {
              frameEls.current[i] = el;
            }}
            videoRef={(el) => {
              videoEls.current[i] = el;
            }}
            onFocus={() => {
              const k = room.stops.findIndex((st) => st.piece === i);
              if (k >= 0) stepTo(k);
            }}
            onClick={(e) => onPieceClick(e, i)}
          />
        ))}
      </div>

      {/* The door, before you go through it */}
      <IntroDoor
        rootRef={introRef}
        scene={scene}
        onClick={() => {
          if (cam.current.drag.dist <= 6) goIn();
        }}
      />

      {/* The prism light you pass through */}
      <div
        ref={flashRef}
        aria-hidden
        className="pointer-events-none absolute inset-0 overflow-hidden"
        style={{ opacity: 0, visibility: "hidden" }}
      >
        <PrismBurst els={scene} />
        <Grain opacity={0.06} />
      </div>

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
          className="tracked pointer-events-auto whitespace-nowrap rounded-md border border-black/10 bg-white/80 px-4 py-2.5 text-[10px] text-black/70 transition-colors hover:text-black"
        >
          ← Leave
        </button>
        <p
          className={cn(
            "tracked text-center text-[10px] text-black/45 transition-opacity duration-700",
            !hint && "opacity-0",
          )}
        >
          <span className="hidden sm:inline">Scroll for the next film</span>
          <span className="sm:hidden">Swipe for the next film</span>
        </p>
        <span className="w-[86px]" aria-hidden />
      </div>
    </div>
  );
}

/* ---------- the door you fly through ---------- */

function IntroDoor({
  rootRef,
  scene,
  onClick,
}: {
  rootRef: React.RefObject<HTMLDivElement | null>;
  scene: React.RefObject<Record<string, HTMLElement | null>>;
  onClick: () => void;
}) {
  return (
    <div
      ref={rootRef}
      className="absolute inset-0 cursor-pointer overflow-hidden bg-black"
      onClick={onClick}
      role="button"
      aria-label="Go through the door into the gallery"
    >
      <DoorLight els={scene} />
      <Grain opacity={0.1} />
      <p
        ref={(el) => {
          scene.current.hint = el;
        }}
        className="tracked pointer-events-none absolute inset-x-0 top-28 flex flex-col items-center gap-3 text-[10px] text-white/70"
      >
        Scroll to enter
        <span className="h-8 w-px overflow-hidden bg-white/15">
          <span
            className="block h-1/2 w-full bg-white/80"
            style={{ animation: "hint-line 1.8s ease-in-out infinite" }}
          />
        </span>
      </p>
    </div>
  );
}

/* ---------- room layout and the camera path ---------- */

type RoomLayout = ReturnType<typeof buildRoom>;

function buildRoom(count: number, vw: number, vh: number) {
  const narrow = vw < 700;
  // How close you stand to a film, and how far back while moving / at the doors.
  const near = narrow ? 1150 : 900;
  const far = narrow ? 1450 : 1250;
  const doorDist = 1250;
  const spacing = FRAME_W + 520;

  // Films go round three walls: left (front to back), back (left to right), right (back to front).
  const nLeft = Math.ceil(count / 3);
  const nBack = Math.ceil((count - nLeft) / 2);
  const nRight = count - nLeft - nBack;
  const sideN = Math.max(nLeft, nRight, 1);

  const corner = 720; // the angled walls in the back corners
  const cut = corner / Math.SQRT2;
  const width = Math.max(
    2800,
    Math.round(vw * 1.8),
    nBack * spacing + 2 * cut + 400,
    2 * far + 300,
  );
  const depth = Math.max(3400, 1100 + sideN * spacing + cut + 200);
  const height = Math.max(1150, vh + 260);
  const floorY = vh / 2; // eye level is the middle of the screen
  const ceilY = floorY - height;
  const midY = (floorY + ceilY) / 2;
  const y = -40; // films hang a little above eye level

  const pieces: Piece[] = [];
  for (let i = 0; i < nLeft; i++) {
    pieces.push({ x: -width / 2, y, z: -(1100 + i * spacing), a: 90 });
  }
  for (let i = 0; i < nBack; i++) {
    pieces.push({ x: (i - (nBack - 1) / 2) * spacing, y, z: -depth, a: 0 });
  }
  for (let i = nRight - 1; i >= 0; i--) {
    pieces.push({ x: width / 2, y, z: -(1100 + i * spacing), a: -90 });
  }

  // The last stop turns back to the entrance wall, with its two doors.
  // Seen from inside (facing +z), your left is +x, so the first door goes there.
  const dw = narrow ? 300 : 380;
  const gap = narrow ? 150 : 280;
  const doorWall = {
    dw,
    dh: dw * 2,
    doors: DOORS.map((d, i) => ({ ...d, x: ((i === 0 ? 1 : -1) * (dw + gap)) / 2 })),
  };

  // One stop in front of each film. Distance along the path is "s".
  const stops: Stop[] = pieces.map((p, i) => ({
    x: p.x + Math.sin(rad(p.a)) * far,
    z: p.z + Math.cos(rad(p.a)) * far,
    yaw: -rad(p.a),
    s: 0,
    piece: i,
  }));
  stops.push({ x: 0, z: -doorDist, yaw: Math.PI, s: 0, piece: -1 });
  for (let i = 1; i < stops.length; i++) {
    const a = stops[i - 1];
    const b = stops[i];
    b.yaw = nearestAngle(b.yaw, a.yaw); // keep turning the same way round
    // Turning counts as distance too, so corners take a moment.
    b.s = a.s + Math.max(420, Math.hypot(b.x - a.x, b.z - a.z) + Math.abs(b.yaw - a.yaw) * 520);
  }
  const span = stops.length > 1 ? stops[stops.length - 1].s / (stops.length - 1) : 1000;

  return {
    width,
    height,
    depth,
    floorY,
    ceilY,
    midY,
    corner,
    cut,
    near,
    far,
    pieces,
    doorWall,
    stops,
    span,
  };
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
function leaned(r: RoomLayout, p: Pose, lean: number): Pose {
  const d = (r.far - r.near) * smooth(lean);
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

/* ---------- saving your place when you open a page ---------- */

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

/* The film grows from the wall to fill the screen, then the project page takes over. */
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
  its CSS size times the screen's pixel density; a full-size floor on a 3x
  iPhone alone is ~320 MB, and iOS Safari kills the tab well before the room
  adds up. So big plain surfaces are drawn small and scaled up (`k`). They are
  smooth gradients, so they look identical. Anything with detail (text,
  artwork, tile lines) is drawn at full resolution.
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

function Room({ room, lit, k }: { room: RoomLayout; lit: boolean; k: number }) {
  const { width: W, height: H, depth: D, floorY, ceilY, midY, corner, cut } = room;
  const lights = Math.max(3, Math.floor((D - 300) / 520));
  const tile = 400;
  const linesX = Math.floor(W / 2 / tile);
  const linesZ = Math.floor(D / tile);

  return (
    <>
      {/* Floor: a soft wash (drawn small) ... */}
      <div
        style={{
          ...panel(W, D, 0, floorY, -D / 2, "rotateX(90deg)", k),
          background:
            "radial-gradient(ellipse 45% 60% at 50% 40%, rgba(255,255,255,.8), transparent 75%), #dcd9d3",
        }}
      />
      {/* ... with crisp tile joints on top, each its own thin full-resolution strip */}
      {Array.from({ length: linesX * 2 + 1 }, (_, i) => (
        <div
          key={`x${i}`}
          aria-hidden
          style={{
            ...panel(2, D, (i - linesX) * tile, floorY - 0.5, -D / 2, "rotateX(90deg)"),
            background: "rgba(0,0,0,.07)",
          }}
        />
      ))}
      {Array.from({ length: linesZ }, (_, i) => (
        <div
          key={`z${i}`}
          aria-hidden
          style={{
            ...panel(W, 2, 0, floorY - 0.5, -(i + 1) * tile, "rotateX(90deg)"),
            background: "rgba(0,0,0,.07)",
          }}
        />
      ))}
      {/* Ceiling */}
      <div
        style={{
          ...panel(W, D, 0, ceilY, -D / 2, "rotateX(-90deg)", k),
          background:
            "linear-gradient(90deg, rgba(0,0,0,.06), transparent 18%, transparent 82%, rgba(0,0,0,.06)), #e9e8e5",
        }}
      />
      {/* Light panels across the ceiling, switching on one after another */}
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
      {/* Entrance wall, facing into the room: the end doors hang on it */}
      <div style={{ ...panel(W, H, 0, midY, 0, "rotateY(180deg)", k), background: WALL }} />
    </>
  );
}

/* ---------- the doors at the end of the walk ---------- */

type DoorWall = RoomLayout["doorWall"];

/*
  One door on the end wall: dark leaves with prism light leaking through the
  gap, a glow on the wall around it and on the floor in front, and a label
  above. The camera loop swings the leaves and brightens the glow (through the
  refs) so they never re-render React.
*/
function EndDoor({
  door,
  wall,
  floorY,
  k,
  lit,
  interactive,
  leafRef,
  glowRef,
  onHover,
  onFocus,
  onClick,
}: {
  door: DoorWall["doors"][number];
  wall: DoorWall;
  floorY: number;
  k: number;
  lit: boolean;
  interactive: boolean;
  leafRef: (side: 0 | 1, el: HTMLElement | null) => void;
  glowRef: (which: 0 | 1, el: HTMLElement | null) => void;
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
      {/* Prism light thrown onto the floor (the floor isn't turned to face you,
          so blue sits at 66% here to land on your left) */}
      <div
        ref={(el) => glowRef(0, el)}
        aria-hidden
        style={{
          ...panel(dw * 2.4, 760, door.x, floorY - 1, -380, "rotateX(90deg)", 4),
          background: `radial-gradient(ellipse 14% 80% at 50% 100%, rgba(255,255,255,.95), transparent 70%), radial-gradient(ellipse 34% 75% at 66% 100%, rgba(${BLUE},.55), transparent 70%), radial-gradient(ellipse 34% 75% at 34% 100%, rgba(${ORANGE},.55), transparent 70%)`,
          opacity: 0.35,
          pointerEvents: "none",
        }}
      />
      {/* ... and onto the wall around the door */}
      <div
        ref={(el) => glowRef(1, el)}
        aria-hidden
        style={{
          ...panel(dw * 2.6, dh * 1.3, door.x, floorY - dh * 0.55, -2, "rotateY(180deg)", 4),
          background: `radial-gradient(ellipse 16% 40% at 50% 55%, rgba(255,255,255,.85), transparent 72%), radial-gradient(ellipse 26% 46% at 40% 50%, rgba(${BLUE},.2), transparent 72%), radial-gradient(ellipse 26% 46% at 60% 50%, rgba(${ORANGE},.2), transparent 72%)`,
          opacity: 0.55,
          pointerEvents: "none",
        }}
      >
        {/* Soft rays leaving the top of the gap: blue up-left, orange up-right */}
        {[
          { deg: -152, rgb: BLUE, core: "205,240,255" },
          { deg: -28, rgb: ORANGE, core: "255,236,212" },
        ].map((r) => (
          <span
            key={r.deg}
            className="absolute"
            style={{
              left: "50%",
              top: "15.4%",
              width: "48%",
              height: "26%",
              transformOrigin: "0 50%",
              transform: `translateY(-50%) rotate(${r.deg}deg)`,
              background: `radial-gradient(ellipse 100% 50% at 0% 50%, rgba(${r.core},.85), rgba(${r.rgb},.45) 30%, rgba(${r.rgb},.12) 60%, transparent 80%)`,
            }}
          />
        ))}
      </div>

      {/* The door. Its leaves sit in 3D, so this keeps preserve-3d. */}
      <Link
        to={door.to}
        aria-label={door.label}
        tabIndex={interactive ? 0 : -1}
        onClick={onClick}
        onFocus={onFocus}
        draggable={false}
        {...hover}
        className="block outline-none focus-visible:ring-4 focus-visible:ring-black/30"
        style={{
          // In front of the wall (z 0), with the glow between them.
          ...panel(dw, dh, door.x, floorY - dh / 2, -3, "rotateY(180deg)", k),
          transformStyle: "preserve-3d",
          boxShadow: `0 0 0 ${8 / k}px #141414`,
        }}
      >
        {/* Pure light behind the leaves */}
        <span
          aria-hidden
          className="absolute inset-0"
          style={{
            transform: "translateZ(-1px)",
            background: `linear-gradient(90deg, rgb(${BLUE}) 0%, rgb(${CYAN}) 18%, #fff 40%, #fff 60%, #ffc48a 80%, rgb(${ORANGE}) 100%)`,
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
              background:
                side === 0
                  ? "linear-gradient(90deg, #070707, #141414)"
                  : "linear-gradient(270deg, #070707, #141414)",
              boxShadow: "inset 0 0 0 1px rgba(255,255,255,.04)",
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
                border: "1px solid rgba(255,255,255,.06)",
              }}
            />
            {/* As in the logo: light pouring over the top inner corner, blue on the left
                leaf and orange on the right, white at the gap, fading down into black */}
            <span
              className="absolute inset-0"
              style={{
                background:
                  side === 0
                    ? `radial-gradient(ellipse 130% 42% at 100% 0%, rgba(255,255,255,.95) 0%, rgba(205,240,255,.9) 8%, rgba(${CYAN},.85) 18%, rgba(${BLUE},.7) 34%, rgba(${BLUE},.22) 55%, transparent 72%)`
                    : `radial-gradient(ellipse 130% 42% at 0% 0%, rgba(255,255,255,.95) 0%, rgba(255,236,212,.9) 8%, rgba(255,170,70,.85) 18%, rgba(${ORANGE},.7) 34%, rgba(220,90,20,.22) 55%, transparent 72%)`,
              }}
            />
            {/* Light catching the inner edge: blue on the left leaf, orange on the right */}
            <span
              className="absolute top-0 h-full w-[7%]"
              style={{
                [side === 0 ? "right" : "left"]: 0,
                background: `linear-gradient(${side === 0 ? 90 : 270}deg, transparent, rgba(${side === 0 ? CYAN : ORANGE},.55))`,
              }}
            />
            {/* Bar handle */}
            <span
              className="absolute rounded-[2px]"
              style={{
                top: "36%",
                height: "26%",
                width: "3.6%",
                [side === 0 ? "right" : "left"]: "11%",
                background: "linear-gradient(90deg, #8d8d8d, #e9e9e9 45%, #9d9d9d)",
                boxShadow: "0 2px 4px rgba(0,0,0,.4)",
              }}
            />
          </span>
        ))}
        {/* Light leaking through where the leaves meet */}
        <span
          aria-hidden
          className="absolute bottom-0 left-1/2 top-0 w-[1.4%] -translate-x-1/2 bg-white"
          style={{ boxShadow: "0 0 10px 3px rgba(255,255,255,.95)" }}
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
        style={panel(labelW, labelH, door.x, floorY - dh - 40 - labelH / 2, -3, "rotateY(180deg)")}
      >
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
      </Link>
    </>
  );
}

/* ---------- a film on the wall ---------- */

function Artwork({
  project,
  slot,
  interactive,
  frameRef,
  videoRef,
  onFocus,
  onClick,
}: {
  project: Project;
  slot: Piece;
  interactive: boolean;
  frameRef: (el: HTMLElement | null) => void;
  videoRef: (el: HTMLVideoElement | null) => void;
  onFocus: () => void;
  onClick: (e: React.MouseEvent) => void;
}) {
  // Hang it a hair off the wall so it never flickers into it.
  const off = 3;
  const x = slot.x + Math.sin(rad(slot.a)) * off;
  const z = slot.z + Math.cos(rad(slot.a)) * off;
  const boxH = FRAME_H + 110; // frame plus caption

  return (
    <div style={panel(FRAME_W, boxH, x, slot.y + 55, z, `rotateY(${slot.a}deg)`)}>
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
          className="block overflow-hidden border-[10px] border-[#111] bg-black shadow-[0_30px_40px_-20px_rgba(0,0,0,.4)] transition-transform duration-500 group-hover:-translate-y-2 group-focus-visible:ring-4 group-focus-visible:ring-black/30"
          style={{ height: FRAME_H }}
        >
          {project.trailer ? (
            <video
              ref={videoRef}
              src={project.trailer}
              poster={project.image}
              muted
              loop
              playsInline
              preload="none"
              className="h-full w-full object-cover"
            />
          ) : project.image ? (
            <img
              src={project.image}
              alt=""
              draggable={false}
              className="h-full w-full object-cover"
            />
          ) : (
            <Poster title={project.title} live />
          )}
        </span>
        <span className="mt-5 block text-left text-black">
          <span className="block text-[22px] font-medium leading-tight">{project.title}</span>
          <span className="mt-1 block text-[16px] text-black/50">{project.tags.join(", ")}</span>
        </span>
      </Link>
    </div>
  );
}
