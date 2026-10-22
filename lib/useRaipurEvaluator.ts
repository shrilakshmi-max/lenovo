"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { RaipurEvaluatorName, loadRaipurEvaluator } from "./raipur";

/**
 * Same pattern as useEvaluator/usePuneEvaluator, but for the separate
 * Raipur evaluator pool/storage key. Redirects to /raipur when required
 * and nothing is cached yet.
 */
export function useRaipurEvaluator(required = true) {
  const router = useRouter();
  const [name, setName] = useState<RaipurEvaluatorName | null | undefined>(
    undefined
  );

  useEffect(() => {
    const existing = loadRaipurEvaluator();
    setName(existing);
    if (required && !existing) {
      router.replace("/raipur");
    }
  }, [required, router]);

  return name;
}
