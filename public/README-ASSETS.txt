lenovo-logo.png - the official Lenovo logo (red badge, provided by the
organizer). Used by components/FloatingLogo.tsx, which shows it as a
small vertical tab fixed to the bottom-right corner on every page.

The header itself still uses text, not this image - components/Logo.tsx
renders "Lenovo" as styled text (in the brand red) next to "LEAP
HACKATHON".

To replace the floating logo, drop a new file at this same path (any
raster or vector format works - just update the `src` in
components/FloatingLogo.tsx if the filename or extension changes).
