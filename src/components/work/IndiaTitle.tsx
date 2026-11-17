import { useEffect, useRef } from "react";
import { WORK_PAGE } from "@/content/site";
import { INDIA_BOX, INDIA_SHAPES } from "@/components/work/india-outlines";

/*
  The Work page's title: INDIA, which shapeshifts into India's name in every language of India,
  each in its own script, one into the next, and back to INDIA (WORK_PAGE.names).

  Every word is an outline (india-outlines.ts, made by scripts/india-outlines.py): shaped as a
  browser shapes it, in Jost for INDIA and Noto Sans for each script, sized and centred as the
  title. To morph, each word's outline is traced as rings of points a few units apart; the rings of
  the two words are paired (the outer shapes left to right, the many shared among the fewer; the
  holes in letters likewise, a hole with no partner closing up or opening from a point), each pair
  is given as many points and turned to line up best, and every point travels from the one shape
  to the other. At rest each word is drawn from its own curves.

  INDIA itself stays in the page as text (transparent), for its size and for screen readers; what's
  seen is the outline over it, so it's there before any script has run.
*/

/* `rest`: how long INDIA stays (ms); `morph`: one word shapeshifting into the next; `hold`: how long
   each name then stays. `step`: how far apart the points of a traced ring are (in the outlines'
   units: 1000 to the title's font size). `soft`: how soft the outline grows at the middle of a
   morph (px), so the thin slivers between two shapes melt rather than flicker; none at rest. */
const SHIFT = { rest: 2400, morph: 420, hold: 140, step: 7, soft: 1.1 };
/* The words' soft dark halo (as the h1's text-shadow on the words under it). */
const HALO =
  "drop-shadow(0 1px 2px rgba(0,15,45,0.6)) drop-shadow(0 0 18px rgba(0,15,45,0.35)) drop-shadow(0 4px 30px rgba(0,15,45,0.4))";

type Ring = { pts: Float64Array; cx: number; cy: number };
type Shape = { outer: Ring[]; hole: Ring[] };
type Pairs = [Float64Array, Float64Array][];

/* Each closed contour of SVG path data (M L H V Q C Z, absolute) as a dense polyline. */
function polylines(d: string): number[][] {
  const tok = d.match(/[MLHVQCZ]|-?\d*\.?\d+(?:e[-+]?\d+)?/gi) ?? [];
  const out: number[][] = [];
  let cur: number[] = [];
  let x = 0;
  let y = 0;
  let cmd = "";
  let i = 0;
  const num = () => parseFloat(tok[i++]);
  const curve = (p: number[]) => {
    // p: control points after the current point, then the end point
    const pts = [x, y, ...p];
    const n = pts.length / 2 - 1;
    let len = 0;
    for (let k = 0; k < n; k++)
      len += Math.hypot(pts[2 * k + 2] - pts[2 * k], pts[2 * k + 3] - pts[2 * k + 1]);
    const segs = Math.min(32, Math.max(2, Math.ceil(len / 6)));
    for (let s = 1; s <= segs; s++) {
      const t = s / segs;
      const u = 1 - t;
      if (n === 2) {
        cur.push(
          u * u * pts[0] + 2 * u * t * pts[2] + t * t * pts[4],
          u * u * pts[1] + 2 * u * t * pts[3] + t * t * pts[5],
        );
      } else {
        const a = u * u * u;
        const b = 3 * u * u * t;
        const c = 3 * u * t * t;
        const e = t * t * t;
        cur.push(
          a * pts[0] + b * pts[2] + c * pts[4] + e * pts[6],
          a * pts[1] + b * pts[3] + c * pts[5] + e * pts[7],
        );
      }
    }
    x = p[p.length - 2];
    y = p[p.length - 1];
  };
  while (i < tok.length) {
    if (/[a-z]/i.test(tok[i])) cmd = tok[i++].toUpperCase();
    if (cmd === "Z") {
      if (cur.length >= 6) out.push(cur);
      cur = [];
      cmd = "";
      continue;
    }
    if (cmd === "M") {
      if (cur.length >= 6) out.push(cur);
      x = num();
      y = num();
      cur = [x, y];
      cmd = "L"; // further pairs after an M are lines
    } else if (cmd === "L") {
      x = num();
      y = num();
      cur.push(x, y);
    } else if (cmd === "H") {
      x = num();
      cur.push(x, y);
    } else if (cmd === "V") {
      y = num();
      cur.push(x, y);
    } else if (cmd === "Q") {
      curve([num(), num(), num(), num()]);
    } else if (cmd === "C") {
      curve([num(), num(), num(), num(), num(), num()]);
    } else i++; // anything else: skip
  }
  if (cur.length >= 6) out.push(cur);
  return out;
}

/* A closed polyline resampled to n points evenly along it. */
function resample(p: ArrayLike<number>, n: number): Float64Array {
  const m = p.length / 2;
  const acc = new Float64Array(m + 1);
  for (let k = 0; k < m; k++) {
    const j = (k + 1) % m;
    acc[k + 1] = acc[k] + Math.hypot(p[2 * j] - p[2 * k], p[2 * j + 1] - p[2 * k + 1]);
  }
  const total = acc[m] || 1;
  const out = new Float64Array(2 * n);
  let k = 0;
  for (let s = 0; s < n; s++) {
    const at = (s / n) * total;
    while (k < m - 1 && acc[k + 1] < at) k++;
    const j = (k + 1) % m;
    const f = (at - acc[k]) / (acc[k + 1] - acc[k] || 1);
    out[2 * s] = p[2 * k] + (p[2 * j] - p[2 * k]) * f;
    out[2 * s + 1] = p[2 * k + 1] + (p[2 * j + 1] - p[2 * k + 1]) * f;
  }
  return out;
}

/* A word's outline as rings: the outer shapes and the holes in them, each left to right. */
function shapeOf(d: string): Shape {
  const rings = polylines(d).map((p) => {
    let len = 0;
    let area = 0;
    let cx = 0;
    let cy = 0;
    const m = p.length / 2;
    for (let k = 0; k < m; k++) {
      const j = (k + 1) % m;
      len += Math.hypot(p[2 * j] - p[2 * k], p[2 * j + 1] - p[2 * k + 1]);
      area += p[2 * k] * p[2 * j + 1] - p[2 * j] * p[2 * k + 1];
      cx += p[2 * k];
      cy += p[2 * k + 1];
    }
    const pts = resample(p, Math.max(12, Math.round(len / SHIFT.step)));
    return { pts, area, cx: cx / m, cy: cy / m };
  });
  // the outer shapes wind as the largest does; holes the other way
  const big = rings.reduce((a, r) => (Math.abs(r.area) > Math.abs(a.area) ? r : a), rings[0]);
  const sign = Math.sign(big?.area ?? 1);
  const byX = (a: Ring, b: Ring) => a.cx - b.cx;
  return {
    outer: rings.filter((r) => Math.sign(r.area) === sign).sort(byX),
    hole: rings.filter((r) => Math.sign(r.area) !== sign).sort(byX),
  };
}

/* Two rings with as many points each, the second turned so that, each about its own centre, its
   points lie nearest the first's: like parts of the two shapes correspond, so one bends into the
   other rather than twisting through it. */
function match(a: Ring, b: Ring): [Float64Array, Float64Array] {
  const n = Math.max(a.pts.length, b.pts.length) / 2;
  const pa = a.pts.length / 2 === n ? a.pts : resample(a.pts, n);
  const pb = b.pts.length / 2 === n ? b.pts : resample(b.pts, n);
  const [ax, ay, bx, by] = [a.cx, a.cy, b.cx, b.cy];
  const cost = (o: number) => {
    let c = 0;
    for (let k = 0; k < n; k += 3) {
      const j = (k + o) % n;
      c += (pa[2 * k] - ax - pb[2 * j] + bx) ** 2 + (pa[2 * k + 1] - ay - pb[2 * j + 1] + by) ** 2;
    }
    return c;
  };
  const stride = Math.max(1, Math.floor(n / 48));
  let best = 0;
  let low = Infinity;
  for (let o = 0; o < n; o += stride) {
    const c = cost(o);
    if (c < low) [low, best] = [c, o];
  }
  for (let o = best - stride; o <= best + stride; o++) {
    const w = (o + n) % n;
    const c = cost(w);
    if (c < low) [low, best] = [c, w];
  }
  const turned = new Float64Array(2 * n);
  for (let k = 0; k < n; k++) {
    const j = (k + best) % n;
    turned[2 * k] = pb[2 * j];
    turned[2 * k + 1] = pb[2 * j + 1];
  }
  return [pa, turned];
}

/* A ring shrunk to its centre: what a hole with no partner closes up to, or opens from. */
const dot = (r: Ring) => {
  const p = new Float64Array(r.pts.length);
  for (let k = 0; k < p.length; k += 2) [p[k], p[k + 1]] = [r.cx, r.cy];
  return p;
};

/* Pair one word's rings with the next's. */
function pairUp(A: Shape, B: Shape): Pairs {
  const out: Pairs = [];
  // outer shapes: every one takes part, the fewer shared among the more (one splits into several,
  // or several merge into one)
  const m = Math.max(A.outer.length, B.outer.length);
  for (let i = 0; i < m; i++) {
    out.push(
      match(
        A.outer[Math.floor((i * A.outer.length) / m)],
        B.outer[Math.floor((i * B.outer.length) / m)],
      ),
    );
  }
  // holes: each of the fewer to one of the more (spread left to right); the rest close up or open
  const [few, more, flip] =
    A.hole.length <= B.hole.length ? [A.hole, B.hole, false] : [B.hole, A.hole, true];
  const taken = new Set<number>();
  few.forEach((r, i) => {
    const j = Math.floor(((i + 0.5) * more.length) / few.length);
    taken.add(j);
    out.push(flip ? match(more[j], r) : match(r, more[j]));
  });
  more.forEach((r, j) => {
    if (taken.has(j)) return;
    out.push(flip ? [r.pts, dot(r)] : [dot(r), r.pts]);
  });
  return out;
}

/* The outline partway (e: 0 to 1) from one word to the next. */
function between(pairs: Pairs, e: number): string {
  let d = "";
  for (const [a, b] of pairs) {
    for (let k = 0; k < a.length; k += 2) {
      d += `${k ? "L" : "M"}${Math.round(a[k] + (b[k] - a[k]) * e)} ${Math.round(a[k + 1] + (b[k + 1] - a[k + 1]) * e)}`;
    }
    d += "Z";
  }
  return d;
}

/* gentle at both ends, and never in a hurry in the middle, so the shapeshift can be seen throughout */
const ease = (t: number) => (1 - Math.cos(Math.PI * t)) / 2;

export function IndiaTitle() {
  const word = useRef<HTMLSpanElement>(null);
  const path = useRef<SVGPathElement>(null);
  const svg = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const el = path.current!;
    const pic = svg.current!;
    const soften = (v: number) =>
      (pic.style.filter = v > 0.02 ? `blur(${v.toFixed(2)}px) ${HALO}` : HALO);
    const words = INDIA_SHAPES;
    const n = words.length;
    if (
      import.meta.env.DEV &&
      words
        .slice(1)
        .map((w) => w.word)
        .join() !== WORK_PAGE.names.map((w) => w.word).join()
    )
      console.warn(
        "WORK_PAGE.names changed: run scripts/india-outlines.py to redraw the title's outlines",
      );
    const shapes: Shape[] = [];
    const pairs: Pairs[] = [];
    const shape = (i: number) => (shapes[i] ??= shapeOf(words[i].d));
    const pair = (i: number) => (pairs[i] ??= pairUp(shape(i), shape((i + 1) % n)));
    let ready = false;
    let at = 0;
    let timer = 0;
    let raf = 0;
    let seen = true;
    let gone = false;

    const settle = () => {
      window.clearTimeout(timer);
      cancelAnimationFrame(raf);
      timer = raf = 0;
      at = 0;
      el.setAttribute("d", words[0].d);
      soften(0);
    };
    const step = () => {
      timer = 0;
      if (gone || !seen || document.hidden) return settle();
      const pairs = pair(at);
      const next = (at + 1) % n;
      const t0 = performance.now();
      const frame = (now: number) => {
        const t = Math.min(1, (now - t0) / SHIFT.morph);
        if (t < 1) {
          el.setAttribute("d", between(pairs, ease(t)));
          soften(SHIFT.soft * Math.sin(Math.PI * t));
          raf = requestAnimationFrame(frame);
          return;
        }
        raf = 0;
        at = next;
        el.setAttribute("d", words[at].d);
        soften(0);
        timer = window.setTimeout(step, at === 0 ? SHIFT.rest : SHIFT.hold);
      };
      raf = requestAnimationFrame(frame);
    };
    const resume = () => {
      if (ready && seen && !document.hidden && !timer && !raf)
        timer = window.setTimeout(step, SHIFT.rest);
    };

    // trace and pair every word a little at a time, so the page never stalls, then begin
    let prep = 0;
    const prepare = () => {
      if (gone) return;
      const t = performance.now();
      while (prep < n && performance.now() - t < 6) pair(prep++);
      if (prep < n) window.setTimeout(prepare, 0);
      else {
        ready = true;
        resume();
      }
    };
    window.setTimeout(prepare, 0);

    const watch = new IntersectionObserver(([e]) => {
      seen = !!e?.isIntersecting;
      if (seen) resume();
      else settle();
    });
    watch.observe(word.current!);
    const visible = () => (document.hidden ? settle() : resume());
    document.addEventListener("visibilitychange", visible);
    return () => {
      gone = true;
      window.clearTimeout(timer);
      cancelAnimationFrame(raf);
      watch.disconnect();
      document.removeEventListener("visibilitychange", visible);
    };
  }, []);

  return (
    <span className="relative block">
      {/* (the left padding balances the spacing after the last letter, so it sits centred) */}
      <span
        ref={word}
        className="tracked block pl-[0.32em] text-[clamp(2.5rem,5.2vw,4.5rem)] font-normal leading-none text-transparent [text-shadow:none]"
      >
        {WORK_PAGE.title}
      </span>
      <svg
        ref={svg}
        aria-hidden
        viewBox={`0 0 ${INDIA_BOX} 1000`}
        className="absolute inset-0 h-full w-full overflow-visible"
        style={{ filter: HALO }}
      >
        <path ref={path} d={INDIA_SHAPES[0].d} fill="#fff" />
      </svg>
    </span>
  );
}
