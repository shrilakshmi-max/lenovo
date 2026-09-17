export type EvaluatorName =
  | "Amit"
  | "Saurabh"
  | "Neha"
  | "Nishant"
  | "Priyanshi"
  | "Yash"
  | "Amanpreet"
  | "Ayush";

export interface EvaluatorGroup {
  groupNumber: 1 | 2 | 3 | 4;
  label: string;
  evaluators: EvaluatorName[];
}

export const EVALUATOR_GROUPS: EvaluatorGroup[] = [
  { groupNumber: 1, label: "Group 1", evaluators: ["Amit", "Saurabh"] },
  { groupNumber: 2, label: "Group 2", evaluators: ["Neha", "Nishant"] },
  { groupNumber: 3, label: "Group 3", evaluators: ["Priyanshi", "Yash"] },
  { groupNumber: 4, label: "Group 4", evaluators: ["Amanpreet", "Ayush"] },
];

export const ALL_EVALUATORS: EvaluatorName[] = EVALUATOR_GROUPS.flatMap(
  (g) => g.evaluators
);

export function groupForEvaluator(name: string): EvaluatorGroup | undefined {
  return EVALUATOR_GROUPS.find((g) =>
    g.evaluators.some((e) => e.toLowerCase() === name.toLowerCase())
  );
}

export function groupForGroupNumber(
  groupNumber: number
): EvaluatorGroup | undefined {
  return EVALUATOR_GROUPS.find((g) => g.groupNumber === groupNumber);
}

const STORAGE_KEY = "leap-hackathon-evaluator";

export function saveEvaluator(name: EvaluatorName) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, name);
}

export function loadEvaluator(): EvaluatorName | null {
  if (typeof window === "undefined") return null;
  const value = window.localStorage.getItem(STORAGE_KEY);
  return (value as EvaluatorName) ?? null;
}

export function clearEvaluator() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(STORAGE_KEY);
}
