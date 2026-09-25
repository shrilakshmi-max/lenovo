"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { PuneEvaluatorName, loadPuneEvaluator } from "./pune";

/**
 * Same pattern as useEvaluator, but for the separate Pune evaluator
 * pool/storage key. Redirects to /pune (not the main welcome page) when
 * required and nothing is cached yet.
 */
export function usePuneEvaluator(required = true) {
  const router = useRouter();
  const [name, setName] = useState<PuneEvaluatorName | null | undefined>(
    undefined
  );

  useEffect(() => {
    const existing = loadPuneEvaluator();
    setName(existing);
    if (required && !existing) {
      router.replace("/pune");
    }
  }, [required, router]);

  return name;
}
