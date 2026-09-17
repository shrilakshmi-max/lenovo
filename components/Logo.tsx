import Image from "next/image";

/**
 * /public/lenovo-logo.png is the official Lenovo logo (self-contained red
 * badge artwork, so it renders the same on any background). Nothing else
 * needs to change here if the file is replaced - this component just
 * renders whichever file exists, falling back to a plain wordmark so the
 * app never ships a fabricated logo.
 */
export function Logo({ variant = "dark" }: { variant?: "dark" | "light" }) {
  return (
    <div className="flex items-center gap-2.5">
      <span className="relative block h-7 w-[84px] shrink-0">
        <Image
          src="/lenovo-logo.png"
          alt="Lenovo"
          fill
          sizes="84px"
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
