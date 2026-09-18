"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Round2EvaluatorName, loadRound2Evaluator } from "./round2";

/**
 * Same pattern as useEvaluator, but for the separate round 2 evaluator
 * pool/storage key. Redirects to /round2 (not the main welcome page) when
 * required and nothing is cached yet.
 */
export function useRound2Evaluator(required = true) {
  const router = useRouter();
  const [name, setName] = useState<Round2EvaluatorName | null | undefined>(
    undefined
  );

  useEffect(() => {
    const existing = loadRound2Evaluator();
    setName(existing);
    if (required && !existing) {
      router.replace("/round2");
    }
  }, [required, router]);

  return name;
}
