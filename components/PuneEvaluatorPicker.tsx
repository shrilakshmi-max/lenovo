"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  PUNE_EVALUATOR_GROUPS,
  PuneEvaluatorName,
  loadPuneEvaluator,
  savePuneEvaluator,
} from "@/lib/pune";

export function PuneEvaluatorPicker() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const existing = loadPuneEvaluator();
    if (existing) {
      router.replace("/pune/teams");
      return;
    }
    setChecking(false);
  }, [router]);

  function choose(name: PuneEvaluatorName) {
    savePuneEvaluator(name);
    router.push("/pune/teams");
  }

  if (checking) return null;

  return (
    <div className="mx-auto grid w-full max-w-3xl gap-4 sm:grid-cols-2">
      {PUNE_EVALUATOR_GROUPS.map((group) => (
        <div
          key={group.groupNumber}
          className="rounded-card border border-lenovo-line bg-white p-5 shadow-card"
        >
          <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-lenovo-muted">
            {group.label}
          </p>
          <div className="grid grid-cols-2 gap-3">
            {group.evaluators.map((name) => (
              <button
                key={name}
                onClick={() => choose(name)}
                className="touch-target rounded-lg border border-lenovo-red bg-lenovo-red px-4 py-3 text-base font-semibold text-white transition-colors hover:bg-lenovo-red-dark active:bg-lenovo-red-dark"
              >
                {name}
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
