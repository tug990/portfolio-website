import { cn } from "@/lib/utils";

/* A round glass play button, with a ring of prism light when you're over it. */
export function PlayButton({ className }: { className?: string }) {
  return (
    <span aria-hidden className={cn("relative grid place-items-center", className)}>
      <span
        className="absolute inset-[-3px] rounded-full opacity-0 blur-[2px] transition-opacity duration-500 group-hover:opacity-100"
        style={{
          background:
            "conic-gradient(from 200deg, #1f2cff, #2bb8ff, #ffffff, #ff8a1f, #ff3d1f, #1f2cff)",
        }}
      />
      <span className="absolute inset-0 rounded-full border border-white/60 bg-white/20 shadow-[0_8px_30px_rgba(0,0,0,0.35)] backdrop-blur-md transition-transform duration-300 group-hover:scale-105" />
      <svg
        viewBox="0 0 24 24"
        className="relative ml-[8%] h-[38%] w-[38%] text-white"
        fill="currentColor"
      >
        <path d="M7 4.5v15l13-7.5z" />
      </svg>
    </span>
  );
}
