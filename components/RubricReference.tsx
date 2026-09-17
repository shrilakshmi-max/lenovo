"use client";

import { useState } from "react";
import { RUBRIC } from "@/lib/rubric";

export function RubricReference() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="touch-target rounded-full border border-lenovo-navy px-4 text-sm font-medium text-lenovo-navy hover:bg-lenovo-navy hover:text-white"
      >
        View rubric
      </button>

      {open ? (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-6"
          onClick={() => setOpen(false)}
        >
          <div
            className="max-h-[85vh] w-full max-w-3xl overflow-y-auto rounded-t-card bg-white p-5 shadow-card sm:rounded-card sm:p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-display text-lg font-semibold text-lenovo-ink">
                Judging rubric
              </h2>
              <button
                onClick={() => setOpen(false)}
                className="touch-target rounded-full px-3 text-sm font-medium text-lenovo-muted hover:bg-lenovo-line"
              >
                Close
              </button>
            </div>

            <div className="space-y-5">
              {RUBRIC.map((criterion) => (
                <div key={criterion.key} className="rounded-card border border-lenovo-line p-4">
                  <h3 className="font-display text-sm font-semibold text-lenovo-navy">
                    {criterion.title}
                  </h3>
                  <p className="mt-1 text-sm text-lenovo-muted">{criterion.prompt}</p>
                  <div className="mt-3 grid gap-2 sm:grid-cols-3">
                    {criterion.bands.map((band) => (
                      <div
                        key={band.range}
                        className="rounded-lg border border-lenovo-line bg-lenovo-paper p-3"
                      >
                        <p className="text-xs font-semibold uppercase tracking-wide text-lenovo-red">
                          {band.range} - {band.label}
                        </p>
                        <p className="mt-1 text-xs leading-snug text-lenovo-muted">
                          {band.description}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
