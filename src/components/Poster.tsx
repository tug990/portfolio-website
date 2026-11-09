/*
  Stand-in artwork until a project has its own image or trailer.
  `live` slowly drifts the light, so a gallery frame reads as a playing film.
*/
export function Poster({ title, live = false }: { title: string; live?: boolean }) {
  return (
    <span className="relative flex h-full w-full items-end overflow-hidden bg-[#050505] p-6">
      <span
        aria-hidden
        className="absolute -inset-[12%]"
        style={{
          background:
            "radial-gradient(ellipse 12% 90% at 50% 0%, #fff, transparent 65%), radial-gradient(ellipse 34% 80% at 37% 0%, #1f2cff, transparent 70%), radial-gradient(ellipse 34% 80% at 64% 0%, #ff8a1f, transparent 70%)",
          animation: live ? "poster-drift 9s ease-in-out infinite alternate" : undefined,
        }}
      />
      <span className="tracked relative text-[14px] text-white">{title}</span>
    </span>
  );
}
