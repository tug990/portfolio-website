/*
  Brand light colours and the film grain used across the home page.
  (The door is drawn in LogoDoor.tsx.)
*/

export const BLUE = "31,44,255";
export const CYAN = "43,184,255";
export const ORANGE = "255,138,31";

/*
  Moving film grain for the whole home page: an oversized layer of fine dark
  specks jumps to a new position several times a second, so the grain flickers
  like film. Plain transparency (no blend mode) keeps it cheap to draw over 3D.
*/
export function FilmGrain({ opacity = 0.16 }: { opacity?: number }) {
  return (
    <span aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      <span
        className="absolute -inset-[50%]"
        style={{
          backgroundImage: GRAIN_DARK,
          backgroundSize: "200px 200px",
          opacity,
          animation: "grain-shift .6s steps(6) infinite",
        }}
      />
    </span>
  );
}

// Dark specks of varying strength, for multiplying over light scenes.
const GRAIN_DARK = `url("data:image/svg+xml,${encodeURIComponent(
  "<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  1.6 0 0 0 -.62'/></filter><rect width='100%' height='100%' filter='url(#n)'/></svg>",
)}")`;
