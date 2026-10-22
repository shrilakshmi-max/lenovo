export type RaipurEvaluatorName =
  | "Amit"
  | "Rajat"
  | "Pramay"
  | "Rajkamal"
  | "Rushikesh"
  | "Sudhi"
  | "Ankush"
  | "Tushar"
  | "Pratima"
  | "Priyanshi";

export interface RaipurEvaluatorGroup {
  groupNumber: 1 | 2 | 3 | 4 | 5;
  label: string;
  evaluators: RaipurEvaluatorName[];
}

export const RAIPUR_EVALUATOR_GROUPS: RaipurEvaluatorGroup[] = [
  { groupNumber: 1, label: "Group 1", evaluators: ["Amit", "Rajat"] },
  { groupNumber: 2, label: "Group 2", evaluators: ["Pramay", "Rajkamal"] },
  { groupNumber: 3, label: "Group 3", evaluators: ["Rushikesh", "Sudhi"] },
  { groupNumber: 4, label: "Group 4", evaluators: ["Ankush", "Tushar"] },
  { groupNumber: 5, label: "Group 5", evaluators: ["Pratima", "Priyanshi"] },
];

export const RAIPUR_EVALUATORS: RaipurEvaluatorName[] = RAIPUR_EVALUATOR_GROUPS.flatMap(
  (g) => g.evaluators
);

export function raipurGroupForEvaluator(name: string): RaipurEvaluatorGroup | undefined {
  return RAIPUR_EVALUATOR_GROUPS.find((g) =>
    g.evaluators.some((e) => e.toLowerCase() === name.toLowerCase())
  );
}

export function raipurGroupForGroupNumber(
  groupNumber: number
): RaipurEvaluatorGroup | undefined {
  return RAIPUR_EVALUATOR_GROUPS.find((g) => g.groupNumber === groupNumber);
}

const STORAGE_KEY = "leap-hackathon-raipur-evaluator";

export function saveRaipurEvaluator(name: RaipurEvaluatorName) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, name);
}

export function loadRaipurEvaluator(): RaipurEvaluatorName | null {
  if (typeof window === "undefined") return null;
  const value = window.localStorage.getItem(STORAGE_KEY);
  return (value as RaipurEvaluatorName) ?? null;
}

export function clearRaipurEvaluator() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(STORAGE_KEY);
}
