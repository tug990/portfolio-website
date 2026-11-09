/* Stand-in artwork until a project has its own image. */
export function Poster({ title }: { title: string }) {
  return (
    <span className="relative flex h-full w-full items-end p-6">
      <span
        aria-hidden
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 14% 90% at 50% 0%, #fff, transparent 65%), radial-gradient(ellipse 38% 80% at 36% 0%, #1f2cff, transparent 70%), radial-gradient(ellipse 38% 80% at 66% 0%, #ff8a1f, transparent 70%), #050505",
        }}
      />
      <span className="tracked relative text-[14px] text-white">{title}</span>
    </span>
  );
}
