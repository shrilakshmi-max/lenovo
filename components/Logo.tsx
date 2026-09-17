import Image from "next/image";

/**
 * Drop the official Lenovo logo files into /public:
 *   /public/lenovo-logo.svg        - for use on light backgrounds
 *   /public/lenovo-logo-light.svg  - white/reversed version, for dark backgrounds
 * Nothing else needs to change - this component renders whichever one
 * exists for the given variant. Until the files are added it falls back to
 * a plain wordmark so the app never ships a fabricated logo.
 */
export function Logo({ variant = "dark" }: { variant?: "dark" | "light" }) {
  const src = variant === "light" ? "/lenovo-logo-light.svg" : "/lenovo-logo.svg";
  return (
    <div className="flex items-center gap-2.5">
      <span className="relative block h-7 w-[92px] shrink-0">
        <Image
          src={src}
          alt="Lenovo"
          fill
          sizes="92px"
          style={{ objectFit: "contain", objectPosition: "left center" }}
          priority
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).style.display = "none";
          }}
        />
      </span>
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
