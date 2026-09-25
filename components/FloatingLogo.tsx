import Image from "next/image";

/**
 * A small, persistent brand mark fixed to the bottom-right corner of the
 * viewport on every page, rotated so it reads vertically like a tab. Purely
 * decorative (non-interactive) - the header still carries the real "Lenovo"
 * text/nav. Sized to the outer box's post-rotation footprint (98x32) so the
 * rotated image is centered correctly without hand-tuned transform offsets.
 */
export function FloatingLogo() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed bottom-6 right-3 z-40 h-[98px] w-[32px]"
    >
      <div className="absolute left-1/2 top-1/2 h-[32px] w-[98px] -translate-x-1/2 -translate-y-1/2 -rotate-90">
        <div className="relative h-full w-full overflow-hidden rounded-md shadow-card">
          <Image
            src="/lenovo-logo.png"
            alt=""
            fill
            sizes="98px"
            style={{ objectFit: "contain" }}
          />
        </div>
      </div>
    </div>
  );
}
