"use client";

import { useRouter } from "next/navigation";
import { ROUND2_EVALUATORS, Round2EvaluatorName, saveRound2Evaluator } from "@/lib/round2";

export function Round2EvaluatorPicker() {
  const router = useRouter();

  function choose(name: Round2EvaluatorName) {
    saveRound2Evaluator(name);
    router.push("/round2/teams");
  }

  return (
    <div className="mx-auto w-full max-w-md rounded-card border border-lenovo-line bg-white p-5 shadow-card">
      <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-lenovo-muted">
        Round 2 evaluators
      </p>
      <div className="grid grid-cols-3 gap-3">
        {ROUND2_EVALUATORS.map((name) => (
          <button
            key={name}
            onClick={() => choose(name)}
            className="touch-target rounded-lg border border-lenovo-navy bg-lenovo-navy px-4 py-3 text-base font-semibold text-white transition-colors hover:bg-lenovo-navy-deep active:bg-lenovo-navy-deep"
          >
            {name}
          </button>
        ))}
      </div>
    </div>
  );
}
