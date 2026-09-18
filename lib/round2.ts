export type Round2EvaluatorName = "Arvind" | "Utkarsh" | "Amit";

export const ROUND2_EVALUATORS: Round2EvaluatorName[] = [
  "Arvind",
  "Utkarsh",
  "Amit",
];

const STORAGE_KEY = "leap-hackathon-round2-evaluator";

export function saveRound2Evaluator(name: Round2EvaluatorName) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, name);
}

export function loadRound2Evaluator(): Round2EvaluatorName | null {
  if (typeof window === "undefined") return null;
  const value = window.localStorage.getItem(STORAGE_KEY);
  return (value as Round2EvaluatorName) ?? null;
}

export function clearRound2Evaluator() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(STORAGE_KEY);
}
