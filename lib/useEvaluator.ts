"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { EvaluatorName, loadEvaluator } from "./evaluators";

/**
 * Reads the cached evaluator name on mount. When `required` is true (the
 * default) it redirects to the welcome page if no name is cached yet.
 * Returns null while the check is in flight so pages can avoid a flash of
 * the wrong content.
 */
export function useEvaluator(required = true) {
  const router = useRouter();
  const [name, setName] = useState<EvaluatorName | null | undefined>(undefined);

  useEffect(() => {
    const existing = loadEvaluator();
    setName(existing);
    if (required && !existing) {
      router.replace("/");
    }
  }, [required, router]);

  return name;
}
