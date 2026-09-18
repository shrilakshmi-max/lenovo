export function Logo({ variant = "dark" }: { variant?: "dark" | "light" }) {
  return (
    <div className="flex items-center gap-2.5">
      <span
        className={`font-display text-lg font-bold tracking-tight ${
          variant === "light" ? "text-white" : "text-lenovo-red"
        }`}
      >
        Lenovo
      </span>
      <span
        className={`h-4 w-px ${variant === "light" ? "bg-white/30" : "bg-lenovo-line"}`}
      />
      <span
        className={`font-display text-sm font-semibold tracking-[0.14em] ${
          variant === "light" ? "text-white" : "text-lenovo-ink"
        }`}
      >
        LEAP HACKATHON
      </span>
    </div>
  );
}
