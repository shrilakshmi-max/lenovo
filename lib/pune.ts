export type PuneEvaluatorName =
  | "Poulamee"
  | "Amit"
  | "Yogesh"
  | "Rushikesh"
  | "Mayuresh"
  | "Tushar"
  | "Pramay"
  | "Utkarsh";

export interface PuneEvaluatorGroup {
  groupNumber: 1 | 2 | 3 | 4;
  label: string;
  evaluators: PuneEvaluatorName[];
}

export const PUNE_EVALUATOR_GROUPS: PuneEvaluatorGroup[] = [
  { groupNumber: 1, label: "Group 1", evaluators: ["Poulamee", "Amit"] },
  { groupNumber: 2, label: "Group 2", evaluators: ["Yogesh", "Rushikesh"] },
  { groupNumber: 3, label: "Group 3", evaluators: ["Mayuresh", "Tushar"] },
  { groupNumber: 4, label: "Group 4", evaluators: ["Pramay", "Utkarsh"] },
];

export const PUNE_EVALUATORS: PuneEvaluatorName[] = PUNE_EVALUATOR_GROUPS.flatMap(
  (g) => g.evaluators
);

export function puneGroupForEvaluator(name: string): PuneEvaluatorGroup | undefined {
  return PUNE_EVALUATOR_GROUPS.find((g) =>
    g.evaluators.some((e) => e.toLowerCase() === name.toLowerCase())
  );
}

export function puneGroupForGroupNumber(
  groupNumber: number
): PuneEvaluatorGroup | undefined {
  return PUNE_EVALUATOR_GROUPS.find((g) => g.groupNumber === groupNumber);
}

const STORAGE_KEY = "leap-hackathon-pune-evaluator";

export function savePuneEvaluator(name: PuneEvaluatorName) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, name);
}

export function loadPuneEvaluator(): PuneEvaluatorName | null {
  if (typeof window === "undefined") return null;
  const value = window.localStorage.getItem(STORAGE_KEY);
  return (value as PuneEvaluatorName) ?? null;
}

export function clearPuneEvaluator() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(STORAGE_KEY);
}
